import assert from "node:assert/strict";

import fs from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import * as fontModule from "../packages/publisher/renderers/resvg/font.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import { readFontFace } from "../packages/publisher/renderers/resvg/font.mjs";

import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";

import { embedFonts } from "../packages/publisher/src/compiler/media.mjs";

import sax from "../packages/publisher/renderers/resvg/supply/sax/sax.cjs";

import { chromium } from "playwright-core";

import { rasterizeBytes } from "../packages/publisher/renderers/resvg/public.mjs";

import { meaningFor, compose, composedScene } from "./fixtures/authored-routes.mjs";

import { sha, selectedProject, renamedFontFace } from "./fixtures/authored-fonts.mjs";

test("exact font CSS remains valid XML when an actual family contains reserved characters", async () => {
  const bundled = await loadBundledFonts();
  const font = bundled.fonts[0];
  const bytes = embedFonts(
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><text>Source</text></svg>'),
    [{ ...font, family: "Example & Evidence" }],
    bundled.license,
  );
  const parser = sax.parser(true, { xmlns: true });
  let style = false;
  let css = "";
  parser.onopentag = ({ local }) => {
    style = local === "style";
  };
  parser.onclosetag = () => {
    style = false;
  };
  parser.ontext = (text) => {
    if (style) css += text;
  };
  assert.doesNotThrow(() => parser.write(bytes.toString("utf8")).close());
  assert.equal(css.includes("Example & Evidence"), true);
});

test("default OFL and selected distribution evidence survive export-aware font stylesheet replacement", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "architecture-font-notices-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const notice = Buffer.from("Selected static font attribution and distribution evidence.");
  project.visualPolicy.fonts[0].distribution = [{ ref: "fonts/NOTICE.txt", sha256: sha(notice) }];
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ["fonts/NOTICE.txt", notice],
  ]);
  const scene = structuredClone(
    composedScene(compose(meaningFor("interactive"), "interactive"), "interactive"),
  );
  const supply = await fontModule.resolveAuthoredFontSupply({
    catalogue: project.visualPolicy.fonts,
    defaultFont: "reading",
    texts: scene.texts,
    readResource: (ref) => resources.get(ref),
    bundled,
    backendDefaults: true,
    includeFraming: false,
  });
  const measured = await createBundledTextMeasurer(supply, supply.texts);
  const painted = {
    ...scene,
    texts: supply.texts.map((label) => ({ ...label, box: measured.box(label) })),
  };
  const output = path.join(root, "page.html");
  await renderArchitectureScene({ scene: painted, output, fontSupply: supply });
  const html = await fs.readFile(output, "utf8");
  const css = /<style id="archify-fonts">([\s\S]*?)<\/style>/u.exec(html)?.[1];
  assert(css.includes("SIL OPEN FONT LICENSE"));
  assert(css.includes(notice.toString("utf8")));
});

test("font metadata selects preferred and Macintosh family records without fabricating a family", async () => {
  const original = (await loadBundledFonts()).fonts[0].bytes;
  let nameOffset;
  for (let index = 0; index < original.readUInt16BE(4); index++) {
    const entry = 12 + index * 16;
    if (original.toString("ascii", entry, entry + 4) === "name")
      nameOffset = original.readUInt32BE(entry + 8);
  }
  assert.notEqual(nameOffset, undefined);
  const select = (nameId, macintosh = false) => {
    const bytes = Buffer.from(original);
    for (let index = 0; index < bytes.readUInt16BE(nameOffset + 2); index++) {
      const record = nameOffset + 6 + index * 12;
      if (bytes.readUInt16BE(record + 6) !== 1) continue;
      bytes.writeUInt16BE(nameId, record + 6);
      if (macintosh) {
        bytes.writeUInt16BE(1, record);
        bytes.writeUInt16BE(0, record + 2);
        bytes.writeUInt16BE(0, record + 4);
        bytes.writeUInt16BE(14, record + 8);
        const storage = nameOffset + bytes.readUInt16BE(nameOffset + 4);
        Buffer.from("JetBrains Mono").copy(bytes, storage + bytes.readUInt16BE(record + 10));
      }
    }
    return bytes;
  };
  for (const bytes of [select(16), select(1, true)]) {
    const face = readFontFace(bytes, "invalid_selected_static_font");
    assert.equal(face.family, "JetBrains Mono");
    assert.equal(face.weight, 400);
    assert.equal(face.aliases.has(face.family), true);
  }
  assert.throws(() => readFontFace(select(20), "invalid_selected_static_font"), {
    code: "invalid_selected_static_font",
  });
});

test("font metadata cannot turn one measured family into a CSS fallback list or executable value", async () => {
  const bundled = await loadBundledFonts();
  const regular = bundled.fonts[0].bytes;
  const actual = Buffer.from("JetBrains Mono", "utf16le").swap16();
  for (const family of [
    "JetBrain, Mono",
    'Jet"BrainsMono',
    "JetBrain; Mono",
    "JetBrain\u0000 Mono",
    "JetBrains Mon ",
    "JetBrain\u007f Mono",
  ]) {
    const replacement = Buffer.from(family, "utf16le").swap16();
    assert.equal(replacement.length, actual.length);
    const bytes = Buffer.from(regular);
    let changed = 0;
    for (
      let offset = bytes.indexOf(actual);
      offset !== -1;
      offset = bytes.indexOf(actual, offset + actual.length)
    ) {
      replacement.copy(bytes, offset);
      changed++;
    }
    assert(changed > 0);
    assert.throws(() => readFontFace(bytes, "authored_canvas_font_measurement_invalid"), {
      code: "authored_canvas_font_family_unsupported",
    });
  }
});

test("selected static TTF rejects compressed containers before parent decompression allocation", async () => {
  const woff = Buffer.alloc(75);
  woff.write("wOFF", 0);
  woff.writeUInt32BE(0x00010000, 4);
  woff.writeUInt32BE(75, 8);
  woff.writeUInt16BE(1, 12);
  woff.writeUInt32BE(134217728, 16);
  woff.write("cmap", 44);
  woff.writeUInt32BE(64, 48);
  woff.writeUInt32BE(11, 52);
  woff.writeUInt32BE(134217728, 56);
  const NativeArray = globalThis.Uint8Array;
  let largeAllocations = 0;
  globalThis.Uint8Array = new Proxy(NativeArray, {
    construct(target, args) {
      if (typeof args[0] === "number" && args[0] > 8 * 1024 * 1024) {
        largeAllocations++;
        throw new Error("intercepted compressed font allocation");
      }
      return Reflect.construct(target, args);
    },
  });
  try {
    assert.throws(() => readFontFace(woff, "invalid_selected_static_font"), {
      code: "invalid_selected_static_font",
    });
  } finally {
    globalThis.Uint8Array = NativeArray;
  }
  assert.equal(
    largeAllocations,
    0,
    "unsupported compressed fonts must fail before OpenType parsing",
  );
  for (const signature of ["wOF2", "OTTO", "ttcf", "true"]) {
    const bytes = Buffer.alloc(12);
    bytes.write(signature);
    assert.throws(() => readFontFace(bytes, "invalid_selected_static_font"), {
      code: "invalid_selected_static_font",
    });
  }
});

test("selected static TTF validates its complete table directory before parsing", async () => {
  const regular = (await loadBundledFonts()).fonts[0].bytes;
  const invalid = (change) => {
    const bytes = Buffer.from(regular);
    change(bytes);
    assert.throws(() => readFontFace(bytes, "invalid_selected_static_font"), {
      code: "invalid_selected_static_font",
    });
  };
  invalid((bytes) => bytes.writeUInt16BE(0, 4));
  invalid((bytes) => bytes.writeUInt16BE(65535, 4));
  invalid((bytes) => bytes.copy(bytes, 28, 12, 16));
  invalid((bytes) => bytes.writeUInt32BE(0, 20));
  invalid((bytes) => bytes.writeUInt32BE(bytes.length + 1, 20));
  invalid((bytes) => bytes.writeUInt32BE(bytes.length, 24));
  const noTables = Buffer.alloc(28);
  noTables.writeUInt32BE(0x00010000, 0);
  noTables.writeUInt16BE(1, 4);
  noTables.write("none", 12);
  noTables.writeUInt32BE(28, 20);
  assert.throws(() => readFontFace(noTables, "invalid_selected_static_font"), {
    code: "invalid_selected_static_font",
  });
});

test("actual selected non-identifier family names measure and paint as one quoted CSS string", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-font-family-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bundled = await loadBundledFonts();
  for (const [index, family] of [
    "Example & Font",
    "Font: Exact 01",
    "Custom + Fonts",
    "12 Exact Fonts",
  ].entries()) {
    const selected = renamedFontFace(bundled.fonts[0], family);
    const label = {
      text: "AV ->",
      fontSize: 20,
      weight: "400",
      anchor: "start",
      x: 80,
      baseline: 100,
      family,
    };
    const measure = await createBundledTextMeasurer(
      { ...bundled, fonts: [selected], defaultFamily: family },
      [label],
    );
    assert(measure.box(label).width > 0);
    const attr = JSON.stringify(family).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180"><text x="80" y="100" font-size="20" font-weight="400" font-family="${attr}">AV -&gt;</text></svg>`,
    );
    const output = path.join(root, `${index}.png`);
    await rasterizeBytes({
      svg,
      fonts: [{ family, weight: 400, bytes: selected.bytes }],
      width: 600,
      output,
    });
    assert((await fs.stat(output)).size > 100);
  }
});

test(
  "actual Archify SVG export retains a selected non-identifier family and native shaped text",
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? "") },
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-authored-export-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const bundled = await loadBundledFonts();
    const family = "Example & Font";
    const chosen = renamedFontFace(bundled.fonts[0], family);
    const fonts = {
      ...bundled,
      fonts: [...bundled.fonts.map((face) => ({ ...face, family: "JetBrains Mono" })), chosen],
      defaultFamily: family,
      distributions: [{ bytes: Buffer.from("Selected test font distribution evidence.") }],
    };
    const scene = structuredClone(
      composedScene(compose(meaningFor("interactive"), "interactive"), "interactive"),
    );
    scene.texts = scene.texts.map((label, index) => ({
      ...label,
      family,
      weight: "400",
      text: index === 0 ? "AV -> == ffi" : "A  B",
    }));
    const measure = await createBundledTextMeasurer(fonts, scene.texts);
    scene.texts = scene.texts.map((label) => ({ ...label, box: measure.box(label) }));
    const output = path.join(root, "architecture.html");
    await renderArchitectureScene({ scene, output, fontSupply: fonts });
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(await fs.readFile(output, "utf8"), { waitUntil: "load" });
    await page.evaluate(() => globalThis.document.fonts.ready);
    for (const label of scene.texts) {
      const element = page.locator(`[data-text-id="${label.id}"]`);
      assert.equal(await element.textContent(), label.text);
      assert.equal(await element.getAttribute("font-family"), JSON.stringify(family));
    }
    await page.locator("#btn-export").click();
    const pending = page.waitForEvent("download");
    await page.locator('button[data-format="svg-light"]').click();
    const download = await pending;
    const exportedPath = path.join(root, "export.svg");
    await download.saveAs(exportedPath);
    const exported = await fs.readFile(exportedPath, "utf8");
    assert(exported.includes(chosen.bytes.toString("base64")));
    assert(exported.includes("Selected test font distribution evidence."));
    assert(exported.includes("white-space:pre"));
    assert(exported.includes("geometricPrecision"));
    const xml = sax.parser(true, { xmlns: true });
    assert.doesNotThrow(() => xml.write(exported).close());
    await page.setContent(`<style>svg{display:block}</style>${exported}`, { waitUntil: "load" });
    await page.evaluate(() => globalThis.document.fonts.ready);
    for (const label of scene.texts) {
      const expected = measure.box(label);
      const actual = await page.locator(`[data-text-id="${label.id}"]`).evaluate((node) => {
        const box = node.getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      });
      assert(
        actual.x <= expected.x + 0.5 &&
          actual.x + actual.width >= expected.x + expected.width - 0.5,
      );
      assert(
        actual.y <= expected.y + 0.5 &&
          actual.y + actual.height >= expected.y + expected.height - 0.5,
      );
    }
    assert.deepEqual(errors, []);
  },
);
