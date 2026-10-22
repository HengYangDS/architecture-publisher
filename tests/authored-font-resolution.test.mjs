import assert from "node:assert/strict";

import fs from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import * as fontModule from "../packages/publisher/renderers/resvg/font.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";

import { meaningFor, compose, composedScene } from "./fixtures/authored-routes.mjs";

import { sha, selectedProject, renamedFontFace } from "./fixtures/authored-fonts.mjs";

test("authored Archify page harmonizes measured default faces instead of hiding conflicts with an alias", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "architecture-font-page-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const fonts = await loadBundledFonts();
  const scene = structuredClone(
    composedScene(compose(meaningFor("interactive"), "interactive"), "interactive"),
  );
  const measurer = await createBundledTextMeasurer(fonts, scene.texts);
  scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  const output = path.join(root, "page.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert.equal(html.includes("Architecture Statement"), false);
  const css = /<style id="archify-fonts">([\s\S]*?)<\/style>/u.exec(html)?.[1];
  assert.ok(css);
  assert.equal(css.includes("data:font/woff2"), false);
  for (const { bytes } of fonts.fonts) assert.equal(css.includes(bytes.toString("base64")), true);
  assert.equal(html.includes('font-family="&quot;JetBrains Mono&quot;"'), true);
});

test("selected font resolution records consumed faces and refuses unavailable selected weights", async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  project.visualPolicy.fonts[0].faces = project.visualPolicy.fonts[0].faces.filter(
    ({ weight }) => weight === "400",
  );
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ["fonts/OFL.txt", bundled.license.bytes],
  ]);
  assert.equal(typeof fontModule.resolveAuthoredFontSupply, "function");
  const resolve = (texts, backendDefaults = false) =>
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: "reading",
      texts,
      readResource: (ref) => resources.get(ref),
      bundled,
      backendDefaults,
    });
  const label = { text: "Source", weight: "400", visible: true };
  const selected = await resolve([label]);
  assert.deepEqual(
    selected.selectedFaces.map(({ weight }) => weight),
    [400],
  );
  assert.equal(selected.defaultFamily, "JetBrains Mono");
  await assert.rejects(resolve([{ ...label, weight: "500" }], true), {
    code: "authored_canvas_font_unselected",
  });
  await assert.rejects(resolve([{ ...label, font: "unknown" }]), {
    code: "authored_canvas_font_unselected",
  });
});

test("unused catalogue faces do not become a sibling medium font receipt", async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ["fonts/OFL.txt", bundled.license.bytes],
  ]);
  assert.equal(typeof fontModule.resolveAuthoredFontSupply, "function");
  const resolve = () =>
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: "reading",
      texts: [{ text: "Source", weight: "400", visible: true }],
      readResource: (ref) => resources.get(ref),
      bundled,
      backendDefaults: false,
    });
  const first = await resolve();
  project.visualPolicy.fonts[0].faces.find(({ weight }) => weight === "700").sha256 = "b".repeat(
    64,
  );
  const second = await resolve();
  assert.equal(second.sha256, first.sha256);
  assert.deepEqual(second.selectedFaces, first.selectedFaces);
});

test("a selected normal face conflicting with page defaults is rejected even under an author-chosen id", async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const regular = bundled.fonts.find(({ weight }) => weight === 400);
  const altered = Buffer.concat([regular.bytes, Buffer.from("different exact bytes")]);
  project.visualPolicy.fonts[0].faces.find(({ weight }) => weight === "400").sha256 = sha(altered);
  const resources = new Map([
    ["fonts/400.ttf", altered],
    ["fonts/OFL.txt", bundled.license.bytes],
  ]);
  assert.equal(typeof fontModule.resolveAuthoredFontSupply, "function");
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: "reading",
      texts: [{ text: "Source", weight: "400", visible: true }],
      readResource: (ref) => resources.get(ref),
      bundled,
      backendDefaults: true,
    }),
    { code: "authored_canvas_font_identity_ambiguous" },
  );
});

test("selected font resolution rejects invalid inputs and unavailable declared evidence", async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ["fonts/OFL.txt", bundled.license.bytes],
  ]);
  const input = {
    catalogue: project.visualPolicy.fonts,
    defaultFont: "reading",
    texts: [{ text: "Source", weight: "400", visible: true }],
    readResource: (ref) => resources.get(ref),
    bundled,
  };
  for (const change of [{ texts: null }, { catalogue: null }, { bundled: { fonts: null } }])
    await assert.rejects(fontModule.resolveAuthoredFontSupply({ ...input, ...change }), {
      code: "authored_canvas_font_measurement_invalid",
    });
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      ...input,
      catalogue: [...input.catalogue, input.catalogue[0]],
    }),
    { code: "authored_canvas_font_identity_ambiguous" },
  );
  await assert.rejects(fontModule.resolveAuthoredFontSupply({ ...input, defaultFont: "unknown" }), {
    code: "authored_canvas_font_unselected",
  });
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      ...input,
      defaultFont: undefined,
      texts: [{ text: "Source", weight: "500", visible: true }],
      bundled: { ...bundled, fonts: bundled.fonts.filter(({ weight }) => weight === 400) },
    }),
    { code: "authored_canvas_font_unselected" },
  );
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({ ...input, readResource: undefined }),
    { code: "authored_canvas_font_unselected" },
  );
  for (const change of [
    { readResource: () => "not resource bytes" },
    { readResource: (ref) => (ref.endsWith(".txt") ? "not evidence bytes" : resources.get(ref)) },
    { readResource: (ref) => (ref.endsWith(".txt") ? Buffer.alloc(0) : resources.get(ref)) },
    { readResource: (ref) => (ref.endsWith(".txt") ? Buffer.from("changed") : resources.get(ref)) },
  ])
    await assert.rejects(fontModule.resolveAuthoredFontSupply({ ...input, ...change }), {
      code: "materialized_edition_resource_digest_mismatch",
    });
  const hidden = { text: "Retained hidden label", weight: "700", visible: false };
  const selected = await fontModule.resolveAuthoredFontSupply({ ...input, texts: [hidden] });
  assert.deepEqual(selected.texts, [hidden]);
  assert.equal(selected.selectedFaces.length, 1, "only framing consumes a face");
  const second = structuredClone(input.catalogue[0]);
  second.id = "second";
  second.distribution[0].sha256 = "b".repeat(64);
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      ...input,
      catalogue: [...input.catalogue, second],
      texts: [{ text: "Source", font: "second", weight: "700", visible: true }],
    }),
    { code: "authored_canvas_font_identity_ambiguous" },
  );
});

test("font resources are resolved once per consumed face rather than once per graphic occurrence", async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ["fonts/OFL.txt", bundled.license.bytes],
  ]);
  const read = new Map();
  const supply = await fontModule.resolveAuthoredFontSupply({
    catalogue: project.visualPolicy.fonts,
    defaultFont: "reading",
    texts: Array.from({ length: 64 }, () => ({ text: "Source", weight: "400", visible: true })),
    readResource(ref) {
      read.set(ref, (read.get(ref) ?? 0) + 1);
      return resources.get(ref);
    },
    bundled,
  });
  assert.equal(supply.texts.length, 64);
  assert.deepEqual(
    [...read],
    [
      ["fonts/400.ttf", 1],
      ["fonts/OFL.txt", 1],
    ],
  );
});

test("interactive text-only 700 default does not consume phantom custom 400 framing", async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  project.visualPolicy.fonts[0].faces = project.visualPolicy.fonts[0].faces.filter(
    ({ weight }) => weight === "700",
  );
  const resources = new Map([
    ["fonts/700.ttf", bundled.fonts.find(({ weight }) => weight === 700).bytes],
    ["fonts/OFL.txt", bundled.license.bytes],
  ]);
  const supply = await fontModule.resolveAuthoredFontSupply({
    catalogue: project.visualPolicy.fonts,
    defaultFont: "reading",
    texts: [{ text: "Source", weight: "700", visible: true }],
    readResource: (ref) => resources.get(ref),
    bundled,
    backendDefaults: true,
    includeFraming: false,
  });
  assert.deepEqual(
    supply.selectedFaces.map(({ weight }) => weight),
    [700],
  );
});

test("authored native fields consume the selected default rather than falling back to bundled faces", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-node-font-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bundled = await loadBundledFonts();
  const family = "Custom + Fonts";
  const selected = bundled.fonts.map((face) => renamedFontFace(face, family));
  const project = selectedProject(bundled);
  project.visualPolicy.fonts[0].family = family;
  project.visualPolicy.fonts[0].faces = selected.map(({ weight, sha256 }) => ({
    weight: String(weight),
    ref: `fonts/${weight}.ttf`,
    sha256,
  }));
  const resources = new Map([
    ...selected.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ["fonts/OFL.txt", bundled.license.bytes],
  ]);
  const request = {
    catalogue: project.visualPolicy.fonts,
    defaultFont: "reading",
    texts: [],
    nativeTextWeights: ["400", "600"],
    readResource: (ref) => resources.get(ref),
    bundled,
    backendDefaults: true,
    includeFraming: false,
  };
  const supply = await fontModule.resolveAuthoredFontSupply(request);
  assert.equal(supply.defaultFamily, family);
  assert.deepEqual(
    supply.selectedFaces.map(({ weight }) => weight),
    [400, 600],
  );
  const output = path.join(root, "page.html");
  await renderArchitectureScene({
    scene: {
      schema: "architecture.interactive-scene/v1",
      id: "overview",
      title: "Source ownership",
      subtitle: "Exact selected native typography",
      viewport: { width: 930, height: 600 },
      typography: { minimumTextPx: 12 },
      nodes: [
        {
          id: "source",
          label: "Selected source ownership",
          figureKind: "source",
          detail: "Exact chosen normal font faces",
          note: "No silent replacement",
          visualRole: "external",
          icon: "lucide:workflow",
          position: { x: 200, y: 200 },
          size: { width: 300, height: 160 },
        },
      ],
      groups: [],
      edges: [],
    },
    fontSupply: supply,
    output,
  });
  const html = await fs.readFile(output, "utf8");
  assert.match(html, /<text[^>]*font-family="&quot;Custom \+ Fonts&quot;"/u);
  const missing = structuredClone(project.visualPolicy.fonts);
  missing[0].faces = missing[0].faces.filter(({ weight }) => weight !== "600");
  await assert.rejects(fontModule.resolveAuthoredFontSupply({ ...request, catalogue: missing }), {
    code: "authored_canvas_font_unselected",
  });
});

test("unused authored selector is rejected rather than presented as installed page typography", async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: "reading",
      texts: [],
      readResource: () => bundled.fonts[0].bytes,
      bundled,
      backendDefaults: true,
      includeFraming: false,
    }),
    { code: "authored_canvas_font_selection_unused" },
  );
});
