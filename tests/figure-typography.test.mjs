import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import { validateInteractiveArchitectureScene } from "../packages/publisher/src/scene/interactive/architecture.mjs";
import { parseSelectedSceneRefinement } from "../packages/publisher/src/edition/refinement.mjs";
import { adaptArchitectureScene } from "../packages/publisher/renderers/archify/architecture.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { resolveFigureTypes } from "../packages/publisher/src/scene/figure-types.mjs";
import { sceneFor } from "./fixtures/authored-routes.mjs";
import { sha } from "./fixtures/selected-native-edition.mjs";
import { ordinaryMeaning } from "./fixtures/figure-types.mjs";

test("source-authored node notes reach the native tag without standalone paint", () => {
  const meaning = ordinaryMeaning();
  const scene = sceneFor(meaning, "interactive");
  scene.nodes[0].note = "Coordination does not grant permission.";
  const parsed = parseSelectedSceneRefinement(
    Buffer.from(
      JSON.stringify({ schema: "architecture.scene-refinement/v1", ...meaning.refinement }),
    ),
    ["interactive"],
    "1".repeat(64),
  );
  assert.equal(
    parsed.media.interactive.pages[0].scene.nodes[0].note,
    "Coordination does not grant permission.",
  );
  const composed = composeAuthoredInteractiveArchitecture(meaning).pages[0].scene;
  assert.equal(
    validateInteractiveArchitectureScene(composed).nodes[0].note,
    "Coordination does not grant permission.",
  );
  const native = adaptArchitectureScene(composed);
  assert.equal(native.components[0].tag, "Coordination does not grant permission.");
  assert.equal(Object.hasOwn(native.components[2], "tag"), false);
  assert.deepEqual(composed.texts, scene.texts);
  for (const note of [0, null, ""]) {
    const invalid = structuredClone(scene);
    invalid.nodes[0].note = note;
    assert.throws(() => validateInteractiveArchitectureScene(invalid), {
      code: "interactive_scene_node_invalid",
    });
  }
});

test("measured authored geometry uses native desktop fit without inventing a projected text floor", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-fit-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "measured",
    title: "Measured architecture",
    subtitle: "Native fit retains exact authored geometry",
    viewport: { width: 1100, height: 620 },
    nodes: [
      {
        id: "source",
        label: "Source evidence",
        detail: "Exact selected bytes",
        visualRole: "external",
        position: { x: 250, y: 240 },
        size: { width: 196, height: 92 },
      },
    ],
    groups: [],
    edges: [],
  };
  const before = structuredClone(scene);
  const output = path.join(root, "architecture.html");
  const receipt = await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert.equal(receipt.nativeValidation.errors, 0);
  assert.equal(receipt.nativeValidation.warnings, 0);
  const svg = html.match(/<svg\b[^>]*data-diagram-type="architecture"[^>]*>/u)?.[0];
  assert.match(svg, /data-reader-fit="authored-height"/u);
  assert.match(svg, /data-reader-min-text="6"/u);
  assert.match(svg, /data-reader-primary-text="12"/u);
  assert.match(svg, /viewBox="0 0 1100 620"/u);
  assert.equal(html.includes('<rect x="250" y="240" width="196" height="92"'), true);
  assert.equal(/data-detail="context"[^>]*font-size="10"/u.test(html), true);
  assert.deepEqual(scene, before);
});

test("an authored desktop text budget fits native rows and label masks without changing geometry", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-native-type-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "readable",
    title: "A complete authored architecture",
    subtitle: "Fixed source geometry, native text presentation",
    viewport: { width: 2160, height: 1100 },
    typography: { minimumTextPx: 12 },
    nodes: [
      {
        id: "origin",
        label: "Source coordination",
        detail: "An independent source owner",
        note: "Coordination does not grant permission",
        visualRole: "external",
        figureKind: "coordination",
        icon: "lucide:workflow",
        position: { x: 100, y: 240 },
        size: { width: 560, height: 160 },
      },
      {
        id: "destination",
        label: "Independent admission",
        detail: "An exact selected generation",
        note: "A separate decision and proof",
        visualRole: "backend",
        figureKind: "admission",
        icon: "lucide:shield-check",
        position: { x: 1500, y: 240 },
        size: { width: 560, height: 160 },
      },
    ],
    groups: [],
    edges: [
      {
        id: "request",
        from: "origin",
        to: "destination",
        label: "Request admission",
        visualRole: "emphasis",
        fromSide: "right",
        toSide: "left",
        route: "orthogonal-h",
        labelPlacement: { at: [1080, 180] },
      },
    ],
  };
  const before = structuredClone(scene);
  const undeclared = structuredClone(scene);
  delete undeclared.typography;
  await assert.rejects(
    renderArchitectureScene({ scene: undeclared, output: path.join(root, "undeclared.html") }),
    (error) =>
      error.code === "render_native_rejected" &&
      error.diagnostics.some(({ code }) => code === "composition/desktop-readability"),
  );
  const authoredScene = structuredClone(scene);
  for (const node of authoredScene.nodes) delete node.icon;
  const parsed = parseSelectedSceneRefinement(
    Buffer.from(
      JSON.stringify({
        schema: "architecture.scene-refinement/v1",
        media: {
          interactive: {
            kind: "authored-architecture",
            pages: [
              {
                id: scene.id,
                label: "Readable architecture",
                purpose: "overview",
                scene: authoredScene,
              },
            ],
          },
        },
      }),
    ),
    ["interactive"],
    "1".repeat(64),
  );
  assert.deepEqual(parsed.media.interactive.pages[0].scene.typography, scene.typography);
  const output = path.join(root, "architecture.html");
  const result = await renderArchitectureScene({ scene, output });
  assert.equal(result.nativeValidation.errors, 0);
  assert.equal(result.nativeValidation.warnings, 0);
  const html = await fs.readFile(output, "utf8");
  assert.match(html, /data-reader-min-text="12"/u);
  assert.match(html, /viewBox="0 0 2160 1100"/u);
  assert.match(html, /<rect x="100" y="240" width="560" height="160"/u);
  for (const text of [
    "Source coordination",
    "An independent source owner",
    "Coordination does not grant permission",
    "Request admission",
  ]) {
    const element = [...html.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/gu)].find(
      ([, , content]) => content === text,
    );
    assert.ok(element, text);
    assert.ok((Number(/font-size="([\d.]+)"/u.exec(element[1])?.[1]) * 1346) / 2160 >= 12, text);
  }
  assert.deepEqual(scene, before);
  const incomplete = path.join(root, "occurrence.html");
  await assert.rejects(
    renderArchitectureScene({
      scene,
      output: incomplete,
      exploration: {
        nodes: scene.nodes.map(({ id, label, figureKind }) => ({ id, label, kind: figureKind })),
        relations: [],
        limits: ["nonbijective-source-membership"],
      },
    }),
    { code: "render_native_exploration_unsupported" },
  );
  await assert.rejects(fs.stat(incomplete), { code: "ENOENT" });
  assert.deepEqual(scene, before);
  const crowded = structuredClone(scene);
  crowded.nodes[0].size.width = 100;
  await assert.rejects(
    renderArchitectureScene({ scene: crowded, output: path.join(root, "crowded.html") }),
    { code: "render_native_rejected" },
  );
  await assert.rejects(fs.stat(path.join(root, "crowded.html")), { code: "ENOENT" });
  for (const minimumTextPx of [0, 5, 33, null, "12", Number.NaN]) {
    assert.throws(
      () => validateInteractiveArchitectureScene({ ...scene, typography: { minimumTextPx } }),
      { code: "interactive_scene_invalid" },
    );
  }
});

test("native type labels reach the Legend and reader data without reclassifying source objects", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-reader-label-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "components",
    title: "Source components",
    subtitle: "Reader wording retains selected identities",
    viewport: { width: 960, height: 480 },
    typography: { minimumTextPx: 12 },
    nodes: [
      {
        id: "client",
        label: "Client",
        position: { x: 100, y: 100 },
        size: { width: 220, height: 120 },
        visualRole: "external",
        figureKind: "component",
      },
      {
        id: "store",
        label: "Store",
        position: { x: 600, y: 100 },
        size: { width: 220, height: 120 },
        visualRole: "external",
        figureKind: "component",
      },
    ],
    groups: [],
    edges: [],
  };
  scene.nodes = resolveFigureTypes([scene], {
    component: { icon: "lucide:box", label: "Source components" },
  })[0].nodes;
  const exploration = {
    nodes: scene.nodes.map(({ id, label }) => ({ id, label, kind: "component" })),
    relations: [],
    limits: [],
  };
  const output = path.join(root, "diagram.html");
  const receipt = await renderArchitectureScene({
    scene,
    exploration,
    output,
  });
  const content = await fs.readFile(output);
  assert.equal(receipt.artifact.sha256, sha(content));
  const html = content.toString("utf8");
  assert.match(html, /data-legend-kind="component"[\s\S]*?Source components/);
  const payload = JSON.parse(
    html.match(/<script[^>]*id="archify-i18n-data"[^>]*>([\s\S]*?)<\/script>/u)[1],
  );
  assert.equal(payload.messages["viewer.kind.component"], "Source components");
  assert(exploration.nodes.every(({ kind }) => kind === "component"));
  assert(scene.nodes.every(({ figureLabel }) => figureLabel === "Source components"));
});

test("a declared desktop glyph floor rejects a short native node without changing geometry", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-glyph-floor-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "glyph-floor",
    title: "Readable source figures",
    subtitle: "The declared glyph budget cannot disappear",
    viewport: { width: 2160, height: 1290 },
    typography: { minimumTextPx: 12 },
    nodes: [
      {
        id: "origin",
        label: "ABCDEFGHIJ",
        visualRole: "external",
        position: { x: 100, y: 240 },
        size: { width: 180, height: 40 },
      },
      {
        id: "destination",
        label: "Independent admission",
        visualRole: "backend",
        position: { x: 1500, y: 240 },
        size: { width: 560, height: 160 },
      },
    ],
    groups: [],
    edges: [
      {
        id: "request",
        from: "origin",
        to: "destination",
        label: "Request admission",
        visualRole: "emphasis",
        fromSide: "right",
        toSide: "left",
        route: "orthogonal-h",
        labelPlacement: { at: [1080, 180] },
      },
    ],
  };
  const before = structuredClone(scene);
  const output = path.join(root, "architecture.html");
  await assert.rejects(
    renderArchitectureScene({ scene, output }),
    (error) =>
      error.code === "render_native_rejected" &&
      error.diagnostics.some(({ message }) => /declared desktop glyph budget/u.test(message)),
  );
  assert.deepEqual(scene, before);
  await assert.rejects(fs.access(output), { code: "ENOENT" });
  assert.deepEqual(await fs.readdir(root), []);
  const feasible = structuredClone(scene);
  feasible.viewport.height = 1100;
  feasible.nodes[0].size.width = 260;
  feasible.nodes[0].size.height = 120;
  const accepted = await renderArchitectureScene({ scene: feasible, output });
  assert.equal(accepted.nativeValidation.errors, 0);
  assert.equal(accepted.nativeValidation.warnings, 0);
  const html = await fs.readFile(output, "utf8");
  const sigils = [
    ...html.matchAll(/data-semantic-sigil="[^"]+"[^>]*transform="[^"]*scale\(([\d.]+)\)"/gu),
  ];
  assert.equal(sigils.length, 4, "Node and Legend occurrences share the same type glyphs");
  for (const [, scale] of sigils) assert.ok((Number(scale) * 16 * 1346) / 2160 >= 12);
  const withoutGlyph = structuredClone(feasible);
  withoutGlyph.nodes[0].icon = "none";
  const preserved = await renderArchitectureScene({
    scene: withoutGlyph,
    output: path.join(root, "without-glyph.html"),
  });
  assert.equal(preserved.nativeValidation.errors, 0);
  assert.equal(preserved.nativeValidation.warnings, 0);
});
