import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import {
  renderAuthoredCanvasSvg,
  authoredCanvasFramingRequest,
} from "../packages/publisher/renderers/svg/canvas.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/interactive-html.mjs";
import { rasterizeBytes } from "../packages/publisher/renderers/resvg/public.mjs";
import { inspectRgbaPngCanvas } from "../packages/publisher/src/qualification/static/png.mjs";
import { chromium } from "playwright-core";
import {
  sha,
  namespace,
  editorialRef,
  meaningFor,
  sceneFor,
  compose,
  composedScene,
} from "./fixtures/authored-routes.mjs";

test("unbound literal decoration paints without acquiring an inspection record", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-route-paint-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = structuredClone(compose(meaningFor("interactive"), "interactive").pages[0].scene);
  scene.routes = [];
  const fonts = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(fonts, scene.texts);
  scene.texts = scene.texts.map((text) => ({ ...text, box: measurer.box(text) }));
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, fontSupply: fonts, output });
  const source = await fs.readFile(output, "utf8");
  const painted = [...source.matchAll(/<path\b[^>]*data-composition-points="[^"]*"[^>]*>/gu)].map(
    ([markup]) => markup,
  );
  assert.equal(painted.length, scene.edges.length);
  for (const markup of painted) {
    assert.match(markup, /aria-hidden="true"/u);
    assert.doesNotMatch(markup, /data-edge-id=|data-inspect-id=/u);
  }
});

test(
  "real raster and desktop Chrome retain bridge ink, arrow paint and all shared Inspect records",
  { skip: !process.env.ARCHPUB_BROWSER_EXECUTABLE },
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "architecture-routes-browser-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const fonts = await loadBundledFonts();
    const staticMeaning = meaningFor("static");
    const staticScene = composedScene(compose(staticMeaning, "static"), "static");
    const measurer = await createBundledTextMeasurer(fonts, [
      ...staticScene.texts,
      authoredCanvasFramingRequest("example:editor"),
    ]);
    const svg = renderAuthoredCanvasSvg(staticScene, "example:editor", measurer);
    const rasterPath = path.join(root, "architecture.png");
    await rasterizeBytes({
      svg,
      fonts: fonts.fonts.map(({ weight, bytes }) => ({ family: "JetBrains Mono", weight, bytes })),
      width: 960,
      output: rasterPath,
    });
    const raster = inspectRgbaPngCanvas(await fs.readFile(rasterPath), {
      background: [250, 249, 246, 255],
      colorDistance: 4,
    });
    assert.ok(raster.inkPixels > 300);
    const meaning = meaningFor("interactive", true);
    const authored = sceneFor(meaning, "interactive");
    authored.routes.push({
      ...structuredClone(authored.routes[0]),
      id: "editorial-route",
      reference: editorialRef,
      editionSha256: meaning.edition.sha256,
    });
    const interactiveMeasurer = await createBundledTextMeasurer(fonts, authored.texts);
    authored.texts = authored.texts.map((label) => ({
      ...label,
      box: interactiveMeasurer.box(label),
    }));
    const composed = compose(meaning, "interactive").pages[0];
    const output = path.join(root, "page.html");
    await renderArchitectureScene({
      scene: composed.scene,
      exploration: composed.exploration,
      output,
    });
    const content = await fs.readFile(output);
    const source = meaning.native.selections[0].source;
    const standalone = composeInteractiveHtml({
      schema: "architecture.interactive-html-composition/v2",
      title: meaning.editorial.title,
      framing: "Source relationships and editorial explanation remain distinct.",
      build: {
        lockSha256: "1".repeat(64),
        editionSha256: meaning.edition.sha256,
        semanticDigest: "2".repeat(64),
      },
      editionId: meaning.edition.id,
      overview: "overview",
      sources: [
        {
          id: "model",
          kind: "native",
          namespace,
          sha256: source.sha256,
          claimant: source.claimant,
        },
      ],
      pages: [
        {
          id: composed.id,
          label: composed.label,
          shortLabel: "Routes",
          purpose: composed.purpose,
          path: "views/overview.html",
          sha256: sha(content),
          sourceIds: ["model"],
          subjectSources: Object.fromEntries(
            Object.entries(composed.subjectNamespaces).map(([id, namespaces]) => [
              id,
              namespaces.length ? ["model"] : [],
            ]),
          ),
          content,
          facts: composed.facts,
        },
      ],
      state: {
        qualification: "not-performed",
        humanAcceptance: "not-performed",
        publication: "not-performed",
      },
    });
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(standalone.toString("utf8"), { waitUntil: "load" });
    const frame = page.frameLocator("#interactive-frame");
    await frame.locator('[data-edge-id="bridge"]').waitFor({ state: "attached" });
    const actual = await frame.locator('[data-edge-id="bridge"]').evaluate((element) => ({
      d: element.getAttribute("d"),
      marker: element.getAttribute("marker-end"),
      stroke: element.ownerDocument.defaultView.getComputedStyle(element).stroke,
      width: element.ownerDocument.defaultView.getComputedStyle(element).strokeWidth,
      afterJunction: Boolean(
        element.compareDocumentPosition(
          element.ownerSVGElement.querySelector('rect[x="400"][y="188"]'),
        ) & element.ownerDocument.defaultView.Node.DOCUMENT_POSITION_PRECEDING,
      ),
    }));
    assert.equal(actual.d, "M 400 200 L 432 200");
    assert.equal(actual.marker, null);
    assert.equal(actual.width, "1.5px");
    assert.notEqual(actual.stroke, "none");
    assert.equal(actual.afterJunction, true);
    const terminal = await frame.locator('[data-edge-id="terminal"]').getAttribute("marker-end");
    assert.equal(terminal, "url(#literal-arrow-terminal)");
    await page.locator("#interactive-inspect").click();
    await page.locator('#interactive-inspect-index button[data-graphic-id="bridge"]').click();
    const relationships = page.locator('[data-reference-kind="relation"] > details');
    assert.equal(await relationships.count(), 2);
    assert.deepEqual(
      await relationships.evaluateAll((items) => items.map((item) => item.open)),
      [false, false],
      "A shared bridge keeps both relationship records equally available without first-record primacy",
    );
    for (const relationship of await relationships.all())
      await relationship.locator(":scope > summary").click();
    const editorial = page.locator('[data-reference-kind="editorial"] > details').first();
    if ((await editorial.getAttribute("open")) === null)
      await editorial.locator(":scope > summary").click();
    const inspector = await page.locator("#interactive-inspect-content").innerText();
    assert.match(inspector, /Relation kind/u);
    assert.match(inspector, /Editorial: conditional/u);
    assert.match(inspector, /editor-attributed-unverified/u);
    assert.equal(await page.locator("#interactive-inspect-content > section > details").count(), 3);
    assert.deepEqual(errors, []);
  },
);
