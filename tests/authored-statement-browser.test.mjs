import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/interactive-html.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { chromium } from "playwright-core";
import { browserLifetime } from "./fixtures/browser-lifetime.mjs";
import { assertGlyphPaintBounds, observeGlyphPaintEnvelope } from "./fixtures/font-paint.mjs";
import { embedFonts } from "../packages/publisher/src/compiler/media.mjs";
import { rasterizeBytes } from "../packages/publisher/renderers/resvg/public.mjs";
import {
  sha,
  namespace,
  meaningFor,
  sceneFor,
  compose,
  useReaderNotes,
} from "./fixtures/authored-statements.mjs";

test(
  "native reader note activation inspects exact attribution and restores the same reading item",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const root = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "archpub-note-browser-"),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const meaning = meaningFor("interactive", { typed: true, editor: true });
    const scene = useReaderNotes(meaning);
    const supply = await loadBundledFonts();
    const measurer = await createBundledTextMeasurer(supply, scene.texts);
    for (const label of scene.texts) label.box = measurer.box(label);
    const composed = compose(meaning, "interactive").pages[0];
    const rendered = path.join(root, "page.html");
    await renderArchitectureScene({
      scene: composed.scene,
      exploration: composed.exploration,
      output: rendered,
    });
    const content = await fs.readFile(rendered);
    const source = meaning.native.selections[0].source;
    const output = composeInteractiveHtml({
      schema: "architecture.interactive-html-composition/v2",
      title: meaning.editorial.title,
      editionId: meaning.edition.id,
      framing: "Source statements and editorial judgment remain distinct.",
      build: {
        lockSha256: "1".repeat(64),
        editionSha256: meaning.edition.sha256,
        semanticDigest: "2".repeat(64),
      },
      overview: "overview",
      sources: [
        {
          id: "source",
          kind: "native",
          namespace,
          sha256: source.sha256,
          claimant: source.claimant,
        },
      ],
      pages: [
        {
          id: "overview",
          label: composed.label,
          shortLabel: "Statements",
          purpose: "overview",
          path: "views/overview.html",
          sha256: sha(content),
          sourceIds: ["source"],
          content,
          subjectSources: Object.fromEntries(
            Object.entries(composed.subjectNamespaces).map(([id, namespaces]) => [
              id,
              namespaces.length ? ["source"] : [],
            ]),
          ),
          facts: composed.facts,
        },
      ],
      state: {
        qualification: "not-performed",
        humanAcceptance: "not-performed",
        publication: "not-performed",
      },
    });
    const file = path.join(root, "publication.html");
    await fs.writeFile(file, output);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(
      await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
      }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10_000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`file://${file}`);
    const frame = page.frameLocator("#interactive-frame");
    const context = frame.locator('[data-note-item-id="reading-context"]');
    await context.waitFor();
    assert.equal(await context.getAttribute("role"), null);
    for (const id of ["text-claim-intended", "editor-text"]) {
      const item = frame.locator(`[data-note-id="${id}"]`);
      assert.equal(
        await item.textContent(),
        scene.notes[0].items.find((entry) => entry.id === id).text,
      );
      for (const action of ["click", "Enter", " "]) {
        if (action === "click") await item.click();
        else await item.press(action);
        await page.locator("#interactive-inspector").waitFor({ state: "visible" });
        const basis = await page.locator("#interactive-inspect-basis").textContent();
        if (id === "editor-text") {
          assert(basis.includes("Edition identity"));
          assert(basis.includes(meaning.edition.sha256));
        } else {
          assert(basis.includes(source.claimant));
          assert(basis.includes(source.sha256));
          assert.equal(basis.includes("Edition identity"), false);
        }
        await page.locator("#interactive-inspect-back").click();
        await item.waitFor({ state: "visible" });
        assert.equal(
          await item.evaluate((node) => globalThis.document.activeElement === node),
          true,
        );
      }
    }
    assert.equal(errors.length, 0, errors.join("\n"));
  },
);

test("standalone inspection binds statement sites to selected source and editorial identities separately", () => {
  const meaning = meaningFor("interactive", { editor: true });
  const page = composeAuthoredInteractiveArchitecture(meaning).pages[0];
  const content = Buffer.from(
    `<html><body><svg>${page.scene.texts
      .map(({ id, text }) => `<text data-text-id="${id}" data-text-label="${text}">${text}</text>`)
      .join("")}</svg></body></html>`,
  );
  const source = meaning.native.selections[0].source;
  const input = {
    schema: "architecture.interactive-html-composition/v2",
    title: meaning.editorial.title,
    framing: "Source assertions and editorial judgment remain distinct.",
    build: {
      lockSha256: "1".repeat(64),
      editionSha256: meaning.edition.sha256,
      semanticDigest: "2".repeat(64),
    },
    editionId: meaning.edition.id,
    overview: "overview",
    sources: [
      {
        id: "selected-source",
        kind: "native",
        namespace,
        sha256: source.sha256,
        claimant: source.claimant,
      },
    ],
    pages: [
      {
        id: "overview",
        label: page.label,
        shortLabel: "Statements",
        purpose: "overview",
        path: "views/overview.html",
        sha256: sha(content),
        sourceIds: ["selected-source"],
        subjectSources: Object.fromEntries(
          Object.entries(page.subjectNamespaces).map(([id, namespaces]) => [
            id,
            namespaces.length ? ["selected-source"] : [],
          ]),
        ),
        content,
        facts: page.facts,
      },
    ],
    state: {
      qualification: "not-performed",
      humanAcceptance: "not-performed",
      publication: "not-performed",
    },
  };
  const output = composeInteractiveHtml(input).toString("utf8");
  assert(output.includes("data-text-id"));
  assert(output.includes("editionSha256"));
  for (const mutate of [
    (value) => {
      value.pages[0].facts.at(-1).editionSha256 = "0".repeat(64);
    },
    (value) => {
      value.pages[0].facts.at(-1).reference = JSON.stringify([
        "another-edition",
        "editorial",
        "editor-decision",
      ]);
    },
    (value) => {
      value.pages[0].facts.at(-1).sourceSha256 = source.sha256;
    },
  ]) {
    const changed = structuredClone(input);
    changed.pages[0].content = Buffer.from(content);
    mutate(changed);
    assert.throws(() => composeInteractiveHtml(changed));
  }
});

test(
  "real Chrome paints the selected statement face and returns inspection focus to that text",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const root = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "archpub-statement-browser-"),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const meaning = meaningFor("interactive", { editor: true });
    const scene = sceneFor(meaning, "interactive");
    const supply = await loadBundledFonts();
    const measurer = await createBundledTextMeasurer(supply, scene.texts);
    for (const label of scene.texts) label.box = measurer.box(label);
    const composed = composeAuthoredInteractiveArchitecture(meaning).pages[0];
    const renderedPath = path.join(root, "page.html");
    await renderArchitectureScene({ scene, output: renderedPath });
    const content = await fs.readFile(renderedPath);
    const source = meaning.native.selections[0].source;
    const output = composeInteractiveHtml({
      schema: "architecture.interactive-html-composition/v2",
      title: meaning.editorial.title,
      editionId: meaning.edition.id,
      framing: "Source statements and editorial judgment remain distinct.",
      build: {
        lockSha256: "1".repeat(64),
        editionSha256: meaning.edition.sha256,
        semanticDigest: "2".repeat(64),
      },
      overview: "overview",
      sources: [
        {
          id: "source",
          kind: "native",
          namespace,
          sha256: source.sha256,
          claimant: source.claimant,
        },
      ],
      pages: [
        {
          id: "overview",
          label: composed.label,
          shortLabel: "Statements",
          purpose: "overview",
          path: "views/overview.html",
          sha256: sha(content),
          sourceIds: ["source"],
          content,
          subjectSources: Object.fromEntries(
            Object.entries(composed.subjectNamespaces).map(([id, namespaces]) => [
              id,
              namespaces.length ? ["source"] : [],
            ]),
          ),
          facts: composed.facts,
        },
      ],
      state: {
        qualification: "not-performed",
        humanAcceptance: "not-performed",
        publication: "not-performed",
      },
    });
    const server = http.createServer((_request, response) =>
      response.writeHead(200, { "Content-Type": "text/html" }).end(output),
    );
    const lifetime = browserLifetime(t);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    lifetime.use(server);
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    lifetime.use(browser);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.setDefaultTimeout(10_000);
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "load" });
    const frame = page.frameLocator("#interactive-frame");
    const statement = frame.locator('[data-text-id="text-claim-published"]');
    await statement.waitFor();
    assert.equal(await statement.textContent(), scene.texts[0].text);
    const paint = await statement.evaluate(async (node) => {
      await globalThis.document.fonts.ready;
      const context = globalThis.document.createElement("canvas").getContext("2d");
      context.font = `${globalThis.getComputedStyle(node).fontWeight} ${globalThis.getComputedStyle(node).fontSize} ${globalThis.getComputedStyle(node).fontFamily}`;
      const painted = context.measureText(node.textContent);
      context.textRendering = "geometricPrecision";
      const precise = context.measureText(node.textContent);
      const x = Number(node.getAttribute("x"));
      const baseline = Number(node.getAttribute("y"));
      const isolated = node.cloneNode(true);
      const style = globalThis.getComputedStyle(node);
      for (const property of [
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "font-synthesis",
        "font-kerning",
        "font-feature-settings",
        "font-variant-ligatures",
        "text-rendering",
        "white-space",
      ])
        isolated.style.setProperty(property, style.getPropertyValue(property));
      isolated.style.fill = "#000000";
      return {
        isolated: isolated.outerHTML,
        family: globalThis.getComputedStyle(node).fontFamily,
        rendering: globalThis.getComputedStyle(node).textRendering,
        geometric: {
          x: x - precise.actualBoundingBoxLeft,
          y: baseline - precise.actualBoundingBoxAscent,
          width: precise.actualBoundingBoxLeft + precise.actualBoundingBoxRight,
          height: precise.actualBoundingBoxAscent + precise.actualBoundingBoxDescent,
        },
        loaded: globalThis.document.fonts.check('14px "JetBrains Mono"'),
        faces: [...globalThis.document.fonts]
          .filter((face) => face.family.replaceAll('"', "") === "JetBrains Mono")
          .map((face) => ({ weight: face.weight, status: face.status })),
        box: {
          x: x - painted.actualBoundingBoxLeft,
          y: baseline - painted.actualBoundingBoxAscent,
          width: painted.actualBoundingBoxLeft + painted.actualBoundingBoxRight,
          height: painted.actualBoundingBoxAscent + painted.actualBoundingBoxDescent,
        },
      };
    });
    assert(paint.family.includes("JetBrains Mono"));
    assert.equal(paint.loaded, true);
    assert.deepEqual(paint.faces.map(({ weight }) => weight).sort(), ["400", "500", "600", "700"]);
    assert(paint.faces.some(({ status }) => status === "loaded"));
    const declared = scene.texts[0].box;
    t.diagnostic(JSON.stringify({ text: scene.texts[0].text, declared, paint }));
    const isolatedPage = await browser.newPage({ viewport: { width: 600, height: 160 } });
    lifetime.defer(() => isolatedPage.close());
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160" xml:space="preserve">${paint.isolated}</svg>`,
    );
    const label = scene.texts[0];
    const escaped = label.text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const nativeSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160" xml:space="preserve" text-rendering="geometricPrecision" font-family="JetBrains Mono"><text x="${label.x}" y="${label.baseline}" font-size="${label.fontSize}" font-weight="${label.weight}" text-anchor="${label.anchor}">${escaped}</text></svg>`,
    );
    const samples = [];
    for (const scale of [1, 4]) {
      const scaledSvg = svg
        .toString("utf8")
        .replace(
          'width="600" height="160"',
          `width="${600 * scale}" height="${160 * scale}" viewBox="0 0 600 160"`,
        );
      await isolatedPage.setViewportSize({ width: 600 * scale, height: 160 * scale });
      await isolatedPage.setContent(
        `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${embedFonts(Buffer.from(scaledSvg), supply.fonts, supply.license).toString("utf8")}`,
      );
      await isolatedPage.evaluate(() => globalThis.document.fonts.ready);
      const chromePng = await isolatedPage.locator("svg").screenshot({ omitBackground: true });
      const nativePath = path.join(root, `statement-native-${scale}.png`);
      await rasterizeBytes({
        svg: nativeSvg,
        fonts: supply.fonts.map(({ weight, bytes }) => ({
          weight,
          bytes,
          family: "JetBrains Mono",
        })),
        width: 600 * scale,
        output: nativePath,
      });
      samples.push({
        scale,
        chrome: await observeGlyphPaintEnvelope(isolatedPage, chromePng, scale),
        native: await observeGlyphPaintEnvelope(isolatedPage, await fs.readFile(nativePath), scale),
      });
    }
    t.diagnostic(
      JSON.stringify({
        sampling: "Actual statement SVG node, computed typography and exact selected font bytes",
        text: scene.texts[0].text,
        outline: declared,
        browser: await browser.version(),
        samples,
      }),
    );
    // Canvas metrics are diagnostic; SVG ink is compared through its complete pixel footprint.
    const precisePaint = samples.find(({ scale }) => scale === 4);
    for (const observed of [precisePaint.native, precisePaint.chrome]) {
      assert.equal(observed.width, 2400);
      assert.equal(observed.height, 640);
    }
    assertGlyphPaintBounds(precisePaint.native, declared, 0.5);
    assertGlyphPaintBounds(precisePaint.chrome, declared, 0.5);
    for (const engine of ["native", "chrome"]) {
      const deliveryPaint = samples.find(({ scale }) => scale === 1)[engine];
      assert.equal(deliveryPaint.width, 600);
      assert.equal(deliveryPaint.height, 160);
      const { count, envelope } = deliveryPaint.samples.find(({ threshold }) => threshold === 0);
      assert(count > 0, `The delivery-scale ${engine} statement must remain visible`);
      assert(envelope.left > 0 && envelope.top > 0);
      assert(envelope.right < 599 && envelope.bottom < 159);
    }
    await statement.focus();
    await statement.press("Enter");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    assert((await page.locator("#interactive-inspect-content").textContent()).includes("unknown"));
    await page.locator("#interactive-inspect-back").click();
    await statement.waitFor({ state: "visible" });
    assert.equal(
      await statement.evaluate((node) => globalThis.document.activeElement === node),
      true,
    );
    await frame.locator('[data-text-id="editor-text"]').press("Enter");
    await page.locator("#interactive-inspector").waitFor({ state: "visible" });
    assert(
      (await page.locator("#interactive-inspect-basis").textContent()).includes("Edition identity"),
    );
    assert.equal(errors.length, 0, errors.join("\n"));
  },
);
