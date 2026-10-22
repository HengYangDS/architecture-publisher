import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { embedFonts } from "../packages/publisher/src/compiler/media.mjs";
import {
  assertGlyphPaintBounds,
  observeGlyphPaintEnvelope,
  observeDiagramGlyphContainment,
} from "./fixtures/font-paint.mjs";
import { collectLabelRouteClearance } from "../packages/publisher/renderers/archify/supply/renderers/shared/geometry.mjs";
import { browserOptions, runBrowser } from "./fixtures/reader-appearance.mjs";

test("automatic desktop labels clear nodes using their actual painted mask bounds", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-label-mask-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "lanes",
    title: "Bounded parallel work",
    subtitle: "Base and lease bind each lane",
    viewport: { width: 1800, height: 1150 },
    typography: { minimumTextPx: 12 },
    nodes: [
      {
        id: "base",
        label: "Base A",
        figureKind: "source",
        icon: "lucide:workflow",
        detail: "Candidate ref",
        note: "HEAD / tree",
        visualRole: "external",
        position: { x: 800, y: 360 },
        size: { width: 290, height: 265 },
      },
      {
        id: "lease",
        label: "Lease A",
        figureKind: "component",
        icon: "lucide:component",
        visualRole: "external",
        position: { x: 1140, y: 360 },
        size: { width: 360, height: 265 },
      },
      {
        id: "lane",
        label: "Lane A",
        figureKind: "component",
        icon: "lucide:component",
        detail: "Own Plan; current Lease",
        note: "Stale: refresh/prove/admit",
        visualRole: "external",
        position: { x: 1020, y: 705 },
        size: { width: 500, height: 276 },
      },
    ],
    groups: [],
    edges: [
      {
        id: "base-binds-lane",
        from: "base",
        to: "lane",
        label: "base a",
        visualRole: "default",
        fromSide: "bottom",
        toSide: "top",
        route: "auto",
      },
      {
        id: "lease-binds-lane",
        from: "lease",
        to: "lane",
        label: "lease a",
        visualRole: "dashed",
        fromSide: "bottom",
        toSide: "top",
        route: "auto",
      },
    ],
  };
  const before = structuredClone(scene);
  const output = path.join(root, "architecture.html");
  const rendered = await renderArchitectureScene({ scene, output });
  assert.equal(rendered.nativeValidation.errors, 0);
  assert.deepEqual(scene, before);
  await t.test("painted masks clear every node in the actual browser", runBrowser, async (t) => {
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(pathToFileURL(output).href);
    await page.evaluate(() => globalThis.document.fonts.ready);
    const labels = await page
      .locator('g[data-detail="context"][data-edge-id] > rect')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBBox();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        }),
      );
    assert.equal(labels.length, scene.edges.length);
    const observed = await observeDiagramGlyphContainment(page);
    const routedRelations = await page
      .locator("[data-composition-points]")
      .evaluateAll((elements) =>
        elements.map((element, relationIndex) => ({
          relation: { id: element.getAttribute("data-edge-id") },
          relationIndex,
          points: element
            .getAttribute("data-composition-points")
            .split(";")
            .map((point) => point.split(",").map(Number)),
        })),
      );
    assert.deepEqual(observed.clipped, []);
    assert.deepEqual(observed.outside, []);
    for (const [relationIndex, edge] of scene.edges.entries()) {
      const glyph = observed.glyphs.find(({ relationship }) => relationship === edge.id);
      const mask = labels[relationIndex];
      assert.equal(glyph.text, edge.label);
      assert(glyph.box.width > 0 && glyph.box.height > 0);
      assert(glyph.box.x >= mask.x - 1 && glyph.box.y >= mask.y - 1);
      assert(glyph.box.x + glyph.box.width <= mask.x + mask.width + 1);
      assert(glyph.box.y + glyph.box.height <= mask.y + mask.height + 1);
      assert.deepEqual(
        collectLabelRouteClearance({
          labels: [{ relation: { id: edge.id }, relationIndex, rect: glyph.box }],
          routedRelations,
          threshold: 4,
        }),
        [],
      );
    }
    for (const label of labels) {
      for (const node of scene.nodes) {
        const overlaps =
          label.x < node.position.x + node.size.width &&
          label.x + label.width > node.position.x &&
          label.y < node.position.y + node.size.height &&
          label.y + label.height > node.position.y;
        assert.equal(overlaps, false, `${node.id} intersects its rendered label mask`);
      }
    }
  });
});

test("declared desktop node fields use measured multiline rows without changing native strings", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-node-lines-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "overview",
    title: "Independent source ownership",
    subtitle: "Measured node fields",
    viewport: { width: 930, height: 650 },
    typography: { minimumTextPx: 12 },
    nodes: [
      {
        id: "source",
        label: "An independent source owner preserves each selected input",
        figureKind: "source",
        detail: "Native source and editorial decisions stay independent",
        note: "Exact source wording remains intact",
        visualRole: "external",
        icon: "lucide:workflow",
        position: { x: 200, y: 200 },
        size: { width: 300, height: 190 },
      },
    ],
    groups: [],
    edges: [],
  };
  const before = structuredClone(scene);
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert.deepEqual(scene, before);
  assert.match(html, /<tspan\b/u);
  assert(html.includes(`data-node-label="${scene.nodes[0].label}"`));
  assert(html.includes(`data-node-sublabel="${scene.nodes[0].detail}"`));
  assert(html.includes(`data-node-tag="${scene.nodes[0].note}"`));
  const explored = path.join(root, "explored.html");
  await renderArchitectureScene({
    scene,
    exploration: {
      nodes: [{ id: "source", label: scene.nodes[0].label, kind: "source" }],
      relations: [],
      limits: [],
    },
    output: explored,
  });
  const exploredHtml = await fs.readFile(explored, "utf8");
  assert(exploredHtml.includes(`data-node-tag="${scene.nodes[0].note}"`));
  assert.match(exploredHtml, /<title>[^<]*Exact source wording remains intact<\/title>/u);
  const cramped = structuredClone(scene);
  cramped.nodes[0].size.height = 38;
  const rejected = path.join(root, "cramped.html");
  await assert.rejects(renderArchitectureScene({ scene: cramped, output: rejected }));
  await assert.rejects(fs.stat(rejected), { code: "ENOENT" });
  await t.test(
    "actual multiline glyphs stay within their measured fixed-node bounds",
    runBrowser,
    async (t) => {
      const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
      const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
      await page.goto(pathToFileURL(explored).href);
      const node = page.locator('g[data-node-id="source"]');
      const rows = await node.evaluate(async (node) => {
        await globalThis.document.fonts.ready;
        return [...node.querySelectorAll("text")].flatMap((text) => {
          const style = globalThis.getComputedStyle(text);
          return [
            ...(text.querySelectorAll("tspan").length ? text.querySelectorAll("tspan") : [text]),
          ].map((row) => ({
            text: row.textContent,
            fontSize: Number.parseFloat(style.fontSize),
            weight: style.fontWeight,
            family: JSON.parse(text.getAttribute("font-family")),
            anchor: text.getAttribute("text-anchor"),
            x: Number(row.getAttribute("x")) - 200,
            baseline: Number(row.getAttribute("y")) - 200,
          }));
        });
      });
      const supply = await loadBundledFonts();
      const measure = await createBundledTextMeasurer(supply, rows);
      const isolated = await browser.newPage({ viewport: { width: 1200, height: 760 } });
      for (const row of rows) {
        const box = measure.box(row);
        assert(box.x > 2 && box.y > 2);
        assert(box.x + box.width < 298 && box.y + box.height < 188);
        assert(row.fontSize >= 12);
        const escaped = row.text
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
        const svg = Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 300 190"><text x="${row.x}" y="${row.baseline}" font-family="${row.family}" font-size="${row.fontSize}" font-weight="${row.weight}" text-anchor="${row.anchor}" xml:space="preserve">${escaped}</text></svg>`,
        );
        await isolated.setContent(
          `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${embedFonts(svg, supply.fonts, supply.license).toString("utf8")}`,
        );
        await isolated.evaluate(() => globalThis.document.fonts.ready);
        const png = await isolated.locator("svg").screenshot({ omitBackground: true });
        const observation = await observeGlyphPaintEnvelope(isolated, png, 4);
        assertGlyphPaintBounds(observation, box, 0.5);
      }
      t.diagnostic(
        `Qualified ${rows.length} actual multiline glyph rows at fourfold pixel resolution.`,
      );
    },
  );
});
