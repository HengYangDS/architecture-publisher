import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright-core";
import {
  renderAuthoredCanvasSvg,
  authoredCanvasFramingRequest,
} from "../packages/publisher/renderers/svg/canvas.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { rasterizeBytes } from "../packages/publisher/renderers/resvg/index.mjs";
import { inspectRgbaPngCanvas } from "../packages/publisher/src/qualification/static/png.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { rect, meaning, sceneFor, compose, resultScene } from "./fixtures/authored-primitives.mjs";

test("both renderers emit the same admitted primitive data, not the legacy circle or component", async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-primitives-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const fonts = await loadBundledFonts();
  const primitive = {
    kind: "polyline",
    closed: true,
    points: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
    fill: "paper",
    stroke: "ink",
    strokeWidth: 2,
  };
  for (const medium of ["static", "interactive"]) {
    const value = meaning(medium);
    const source = sceneFor(value, medium);
    source.nodes[0].primitives = [structuredClone(primitive)];
    const measurer = await createBundledTextMeasurer(fonts, [
      ...source.texts,
      ...(medium === "static" ? [authoredCanvasFramingRequest("fixture-editor")] : []),
    ]);
    for (const label of source.texts) label.box = measurer.box(label);
    const scene = resultScene(compose(value, medium), medium);
    if (medium === "static") {
      const svg = renderAuthoredCanvasSvg(scene, "fixture-editor", measurer).toString("utf8");
      assert.match(svg, /<polygon[^>]*points="200,200 280,200 280,260 200,260"/u);
      assert.equal(/<circle\b[^>]*data-graphic-id="node:painted-client"/u.test(svg), false);
    } else {
      const output = path.join(root, "architecture.html");
      await renderArchitectureScene({ scene, output });
      const html = await fs.readFile(output, "utf8");
      assert.match(html, /<polygon[^>]*points="200,200 280,200 280,260 200,260"/u);
      assert.equal(html.includes('data-node-id="painted-client"'), true);
      assert.equal(/<g[^>]*data-node-id="painted-client"[^>]*>[\s\S]*?<rect/u.test(html), false);
    }
  }
});

test(
  "real raster and desktop Chrome paint the selected primitive within derived ink bounds",
  {
    skip: !process.env.ARCHPUB_BROWSER_EXECUTABLE,
  },
  async (t) => {
    const root = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "archpub-primitive-pixels-"),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const fonts = await loadBundledFonts(),
      measurer = await createBundledTextMeasurer(fonts, [
        ...sceneFor(meaning("static"), "static").texts,
        ...sceneFor(meaning("interactive"), "interactive").texts,
        authoredCanvasFramingRequest("fixture-editor"),
      ]);
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const shapes = [
      {
        kind: "circle",
        center: { x: 40, y: 30 },
        radius: 20,
        fill: "paper",
        stroke: "ink",
        strokeWidth: 4,
      },
      { ...rect(), strokeWidth: 4 },
      {
        kind: "line",
        start: { x: 0, y: 0 },
        end: { x: 80, y: 60 },
        fill: null,
        stroke: "ink",
        strokeWidth: 8,
      },
      {
        kind: "polyline",
        closed: true,
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 60 },
          { x: 0, y: 60 },
        ],
        fill: "paper",
        stroke: "ink",
        strokeWidth: 4,
      },
      {
        kind: "polyline",
        closed: false,
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 60 },
        ],
        fill: null,
        stroke: "ink",
        strokeWidth: 4,
      },
    ];
    let delivery = "";
    const server = http.createServer((_request, response) =>
      response.writeHead(200, { "Content-Type": "text/html" }).end(delivery),
    );
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [index, primitive] of shapes.entries()) {
      const staticValue = meaning("static");
      sceneFor(staticValue, "static").nodes[0].primitives = [primitive];
      for (const text of sceneFor(staticValue, "static").texts) text.box = measurer.box(text);
      const staticScene = resultScene(compose(staticValue, "static"), "static");
      const svg = renderAuthoredCanvasSvg(staticScene, "fixture-editor", measurer).toString("utf8");
      const fragment = svg.match(/<g data-graphic-id="node:painted-client">([\s\S]*?)<\/g>/u)[1];
      const pixels = path.join(root, `shape-${index}.png`);
      await rasterizeBytes({
        svg: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="460">${fragment}</svg>`,
        ),
        fonts: [],
        width: 900,
        output: pixels,
      });
      const raster = inspectRgbaPngCanvas(await fs.readFile(pixels), {
        background: [0, 0, 0, 0],
        colorDistance: 0,
      });
      const bounds = {
          x: raster.envelope.left,
          y: raster.envelope.top,
          width: raster.envelope.right - raster.envelope.left + 1,
          height: raster.envelope.bottom - raster.envelope.top + 1,
        },
        envelope = staticScene.nodes[0].paintBox;
      assert(bounds.x >= envelope.x && bounds.y >= envelope.y);
      assert(
        bounds.x + bounds.width <= envelope.x + envelope.width &&
          bounds.y + bounds.height <= envelope.y + envelope.height,
      );
      assert(bounds.width > 0 && bounds.height > 0);
      const interactiveValue = meaning("interactive");
      sceneFor(interactiveValue, "interactive").nodes[0].primitives = [structuredClone(primitive)];
      for (const text of sceneFor(interactiveValue, "interactive").texts)
        text.box = measurer.box(text);
      const scene = resultScene(compose(interactiveValue, "interactive"), "interactive");
      const output = path.join(root, `shape-${index}.html`);
      await renderArchitectureScene({ scene, output });
      delivery = await fs.readFile(output, "utf8");
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "load" });
      const mark = page.locator(
        '[data-node-id="painted-client"] > circle, [data-node-id="painted-client"] > rect, [data-node-id="painted-client"] > line, [data-node-id="painted-client"] > polygon, [data-node-id="painted-client"] > polyline',
      );
      assert.equal(await mark.count(), 1);
      const painted = await mark.evaluate((node) => {
        const bounds = node.getBBox(),
          style = node.ownerDocument.defaultView.getComputedStyle(node);
        return {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          cap: style.strokeLinecap,
          join: style.strokeLinejoin,
          fillRule: style.fillRule,
        };
      });
      assert.equal(painted.cap, "round");
      assert.equal(painted.join, "round");
      assert.equal(painted.fillRule, "nonzero");
      assert(painted.x >= scene.nodes[0].paintBox.x && painted.y >= scene.nodes[0].paintBox.y);
      assert(
        painted.x + painted.width <= scene.nodes[0].paintBox.x + scene.nodes[0].paintBox.width,
      );
      assert(
        painted.y + painted.height <= scene.nodes[0].paintBox.y + scene.nodes[0].paintBox.height,
      );
    }
    assert.equal(errors.length, 0, errors.join("\n"));
  },
);
