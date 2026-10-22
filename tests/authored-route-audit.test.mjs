import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertAuthoredCanvasScene } from "../packages/publisher/src/scene/static/audit.mjs";
import {
  renderArchitectureScene,
  renderNativeDiagram,
} from "../packages/publisher/renderers/archify/index.mjs";
import { adaptArchitectureScene } from "../packages/publisher/renderers/archify/architecture.mjs";
import { assembleArchitecturePage } from "../packages/publisher/renderers/archify/assembly.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";
import {
  assertArchitecturePaintLayout,
  assertArchitectureRelationLayout,
} from "../packages/publisher/renderers/archify/paint.mjs";
import {
  renderAuthoredCanvasSvg,
  authoredCanvasFramingRequest,
} from "../packages/publisher/renderers/svg/canvas.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { auditEmittedEdges } from "../packages/publisher/src/scene/emitted-path.mjs";
import { meaningFor, sceneFor, compose } from "./fixtures/authored-routes.mjs";

test("native source-arrow collisions are checked without inventing a second physical route", () => {
  const scene = {
    edges: [
      { id: "first", from: "source", to: "first-target", visualRole: "default" },
      { id: "second", from: "source", to: "second-target", visualRole: "default" },
    ],
  };
  const geometry = new Map([
    [
      "first",
      [
        { x: 420, y: 100 },
        { x: 420, y: 260 },
        { x: 248, y: 260 },
      ],
    ],
    [
      "second",
      [
        { x: 427, y: 100 },
        { x: 427, y: 260 },
        { x: 578, y: 260 },
      ],
    ],
  ]);
  const sources = [
    { edge: "first", direction: "forward" },
    { edge: "second", direction: "forward" },
  ];
  assert.throws(
    () => assertArchitectureRelationLayout(scene, new Map(), geometry, sources),
    (error) => {
      assert.equal(error.code, "render_native_rejected");
      const hit = error.diagnostics.find(({ code }) => code === "composition/arrowhead-collision");
      assert.equal(hit.evidence.distancePx, 7);
      assert.equal(hit.evidence.minimumPx, 10.5);
      return true;
    },
  );
  const separated = structuredClone(geometry);
  separated.get("second")[0].x = 441;
  separated.get("second")[1].x = 441;
  assert.doesNotThrow(() => assertArchitectureRelationLayout(scene, new Map(), separated, sources));
  assert.doesNotThrow(() => assertArchitectureRelationLayout(scene, new Map(), geometry));
});

test("source markers cannot escape the canvas or intrude into independently painted text", () => {
  const scene = {
    viewport: { width: 200, height: 200 },
    edges: [{ id: "edge", from: "source", to: "target", strokeWidth: 1.5 }],
  };
  const paths = [
    [
      { x: 20, y: 100 },
      { x: 100, y: 100 },
    ],
  ];
  const source = [{ edge: "edge", direction: "forward" }];
  assert.doesNotThrow(() => assertArchitecturePaintLayout(scene, [], [], paths, source));
  assert.throws(
    () =>
      assertArchitecturePaintLayout(
        scene,
        [],
        [{ x: 25, y: 108, width: 5, height: 2 }],
        paths,
        source,
      ),
    { code: "authored_interactive_paint_geometry_invalid" },
  );
  assert.throws(
    () =>
      assertArchitecturePaintLayout(scene, [], [], paths, source, [
        { x: 25, y: 108, width: 5, height: 2 },
      ]),
    { code: "authored_interactive_paint_geometry_invalid" },
  );
  const outside = [
    [
      { x: 1, y: 100 },
      { x: 100, y: 100 },
    ],
  ];
  assert.throws(() => assertArchitecturePaintLayout(scene, [], [], outside, source), {
    code: "authored_interactive_paint_geometry_invalid",
  });
  assert.doesNotThrow(() => assertArchitecturePaintLayout(scene, [], [], outside));
});

test("the real static painter emits each shared physical segment and its declared arrow once", async () => {
  const result = compose(meaningFor("static"), "static");
  assert.equal(assertAuthoredCanvasScene(result.scene).geometry.failures.length, 0);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...result.scene.texts,
    authoredCanvasFramingRequest("example:editor"),
  ]);
  const svg = renderAuthoredCanvasSvg(result.scene, "example:editor", measurer).toString("utf8");
  assert.equal([...svg.matchAll(/data-edge=/gu)].length, 3);
  assert.equal([...svg.matchAll(/ marker-end=/gu)].length, 1);
  assert.equal(svg.includes("M 400 200 L 432 200"), true);
  const bridge = svg.indexOf('data-edge="bridge"');
  const junction = svg.indexOf('data-graphic-id="node:junction"');
  assert.ok(bridge > junction, "the visible bridge must paint after its filled junction");
});

test("emitted audit checks every literal point, not only its source and target", async () => {
  const result = compose(meaningFor("static"), "static");
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...result.scene.texts,
    authoredCanvasFramingRequest("example:editor"),
  ]);
  const svg = renderAuthoredCanvasSvg(result.scene, "example:editor", measurer).toString("utf8");
  const changed = svg.replace("M 152 200 L 400 200", "M 152 200 L 250 220 L 400 200");
  assert.throws(
    () => auditEmittedEdges(changed, result.scene, { minimumTerminal: 14, endpointTolerance: 1 }),
    /literal|route|point/u,
  );
});

for (const defect of [
  "missing-marker",
  "changed-wing",
  "changed-stroke",
  "missing-stroke",
  "reversed-marker",
]) {
  test(`emitted audit refuses actual arrow defect ${defect}`, async () => {
    const result = compose(meaningFor("static"), "static");
    const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
      ...result.scene.texts,
      authoredCanvasFramingRequest("example:editor"),
    ]);
    const svg = renderAuthoredCanvasSvg(result.scene, "example:editor", measurer).toString("utf8");
    let changed = svg;
    if (defect === "missing-marker")
      changed = svg.replace(/<defs><marker[\s\S]*?<\/marker><\/defs>/u, "");
    if (defect === "changed-wing")
      changed = svg.replace('d="M 0 0 L 8 4 L 0 8"', 'd="M 0 0 L 8 4 L 0 0"');
    if (defect === "changed-stroke")
      changed = svg.replace('stroke-width="1.2"', 'stroke-width="0"');
    if (defect === "missing-stroke")
      changed = svg.replace(
        /stroke="#303733" stroke-width="1.2"/u,
        'stroke="none" stroke-width="1.2"',
      );
    if (defect === "reversed-marker")
      changed = svg.replace('orient="auto"', 'orient="auto-start-reverse"');
    assert.throws(
      () => auditEmittedEdges(changed, result.scene, { minimumTerminal: 14, endpointTolerance: 1 }),
      /arrow|marker/u,
    );
  });
}

test("geometry-only segments are never mandatory inspection subjects", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "architecture-routes-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const meaning = meaningFor("interactive");
  const raw = sceneFor(meaning, "interactive");
  raw.edges.push({
    ...structuredClone(raw.edges[0]),
    id: "unused-decoration",
    points: [
      { x: 152, y: 200 },
      { x: 260, y: 200 },
      { x: 260, y: 310 },
      { x: 400, y: 310 },
      { x: 400, y: 200 },
    ],
  });
  const result = compose(meaning, "interactive");
  assert.equal(Object.hasOwn(result.pages[0].subjectNamespaces, "unused-decoration"), false);
});

test("the real Archify adapter retains literal contact bytes and paints a shared bridge once", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "architecture-routes-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const result = compose(meaningFor("interactive"), "interactive");
  const scene = structuredClone(result.pages[0].scene);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), scene.texts);
  scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  const output = path.join(root, "architecture.html");
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, "utf8");
  assert.equal([...html.matchAll(/data-edge-id="bridge"/gu)].length, 1);
  const bridge = html.match(/<path\b[^>]*data-edge-id="bridge"[^>]*>/u)?.[0];
  assert.ok(bridge);
  assert.equal(bridge.includes('d="M 400 200 L 432 200"'), true);
  assert.equal(bridge.includes("marker-end="), false);
  assert.equal(
    html.includes("data-intrinsic-segment-underlay="),
    false,
    "exact authored geometry must not impersonate an automatic crossover",
  );
  assert.equal(
    [...html.matchAll(/<path\b[^>]*data-edge-id="terminal"[^>]*marker-end=/gu)].length,
    1,
  );
  assert.equal(html.includes('data-node-id="junction"'), false);
});

test("intrinsic native validation checks every painted label row, not allocation whitespace", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-label-masks-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "mask-contract",
    title: "Measured label masks",
    subtitle: "Allocation space is not painted space",
    viewport: { width: 500, height: 440 },
    nodes: [
      { id: "source", label: "Source", x: 64, y: 40 },
      { id: "target", label: "Target", x: 64, y: 300 },
      { id: "other-source", label: "Other", x: 289, y: 40 },
      { id: "other-target", label: "Other", x: 289, y: 300 },
    ].map(({ x, y, ...node }) => ({
      ...node,
      visualRole: "backend",
      position: { x, y },
      size: { width: 112, height: 64 },
    })),
    groups: [],
    edges: [
      {
        id: "labelled",
        from: "source",
        to: "target",
        label: "Exact second row",
        visualRole: "default",
        fromSide: "bottom",
        toSide: "top",
        route: "auto",
      },
      {
        id: "passing",
        from: "other-source",
        to: "other-target",
        label: "Passing",
        visualRole: "default",
        fromSide: "left",
        toSide: "left",
        route: "auto",
      },
    ],
  };
  const physical = {
    groups: [],
    edges: {
      labelled: {
        points: [
          { x: 120, y: 104 },
          { x: 120, y: 300 },
        ],
        label: {
          x: 200,
          y: 180,
          width: 88,
          height: 64,
          fontSize: 12,
          weight: "400",
          family: "JetBrains Mono",
          lines: ["Exact", "second row"],
          baselines: [
            {
              text: "Exact",
              x: 228,
              baseline: 202,
              box: { x: 210, y: 190, width: 36, height: 12 },
            },
            {
              text: "second row",
              x: 242,
              baseline: 232,
              box: { x: 210, y: 220, width: 64, height: 12 },
            },
          ],
          paintBox: { x: 210, y: 190, width: 64, height: 42 },
        },
      },
      passing: { label: null },
    },
  };
  const diagram = adaptArchitectureScene(scene);
  delete scene.edges[1].label;
  const fonts = await loadBundledFonts();
  const icons = await loadFigureIconSupply();
  for (const [name, x, rejected] of [
    ["clear-allocation", 199, false],
    ["later-row-collision", 263, true],
  ]) {
    physical.edges.passing.points = [
      { x: 289, y: 72 },
      { x, y: 72 },
      { x, y: 332 },
      { x: 289, y: 332 },
    ];
    const output = path.join(root, `${name}.html`);
    const execution = renderNativeDiagram(
      { type: "architecture", inputBytes: Buffer.from(JSON.stringify(diagram)), output },
      async () => {
        const assembled = await assembleArchitecturePage(scene, { fonts, icons, physical });
        return { artifactBytes: assembled.bytes, supplies: assembled.supplies };
      },
    );
    if (rejected) {
      await assert.rejects(execution, (error) => {
        assert.equal(error.code, "render_native_rejected");
        const hit = error.diagnostics.find(
          ({ code }) => code === "composition/label-route-clearance",
        );
        assert.ok(hit, "a later label row must retain native collision diagnostics");
        assert.equal(hit.evidence.labelRect.y, 220);
        return true;
      });
      await assert.rejects(fs.stat(output), { code: "ENOENT" });
    } else {
      const receipt = await execution;
      assert.equal(receipt.status, "rendered");
      const html = await fs.readFile(output, "utf8");
      for (const row of physical.edges.labelled.label.baselines) {
        assert(html.includes(`data-intrinsic-label-ink="" x="${row.box.x}" y="${row.box.y}"`));
        assert(html.includes(`>${row.text}</tspan>`));
      }
    }
  }
});

test("intrinsic native-arrow validation excludes literal paint but still refuses native marker collisions", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-arrow-masks-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const base = {
    schema: "architecture.interactive-scene/v1",
    id: "arrow-contract",
    title: "Exact arrow ownership",
    subtitle: "Literal lines do not carry native markers",
    viewport: { width: 760, height: 460 },
    nodes: [
      { id: "left", label: "Left", x: 150, y: 60 },
      { id: "right", label: "Right", x: 490, y: 60 },
      { id: "target", label: "Target", x: 350, y: 320 },
    ].map(({ x, y, ...node }) => ({
      ...node,
      visualRole: "backend",
      position: { x, y },
      size: { width: 176, height: 80 },
    })),
    groups: [],
  };
  const physical = {
    groups: [],
    edges: {
      "left-edge": {
        points: [
          { x: 326, y: 100 },
          { x: 420, y: 100 },
          { x: 420, y: 320 },
        ],
        label: null,
      },
      "right-edge": {
        points: [
          { x: 490, y: 100 },
          { x: 427, y: 100 },
          { x: 427, y: 320 },
        ],
        label: null,
      },
    },
  };
  for (const literal of [true, false]) {
    const scene = {
      ...base,
      edges: ["left", "right"].map((from) => ({
        id: `${from}-edge`,
        from,
        to: "target",
        ...(literal
          ? {
              adornment: true,
              semanticIds: [],
              points: physical.edges[`${from}-edge`].points,
              strokeWidth: 1.5,
              strokeTone: "ink",
              arrow: false,
              arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
            }
          : {
              label: "Connect",
              visualRole: "default",
              fromSide: from === "left" ? "right" : "left",
              toSide: "top",
              route: "auto",
            }),
      })),
    };
    const diagram = adaptArchitectureScene(scene);
    for (const edge of scene.edges) delete edge.label;
    const fonts = await loadBundledFonts();
    const icons = await loadFigureIconSupply();
    const output = path.join(root, literal ? "literal.html" : "native.html");
    const execution = renderNativeDiagram(
      { type: "architecture", inputBytes: Buffer.from(JSON.stringify(diagram)), output },
      async () => {
        const assembled = await assembleArchitecturePage(scene, { fonts, icons, physical });
        return { artifactBytes: assembled.bytes, supplies: assembled.supplies };
      },
    );
    if (literal) {
      const receipt = await execution;
      assert.equal(receipt.status, "rendered");
      const html = await fs.readFile(output, "utf8");
      assert(html.includes("M 326 100 L 420 100 L 420 320"));
      assert(html.includes("M 490 100 L 427 100 L 427 320"));
    } else {
      await assert.rejects(execution, (error) => {
        assert.equal(error.code, "render_native_rejected");
        const hit = error.diagnostics.find(
          ({ code }) => code === "composition/arrowhead-collision",
        );
        assert.ok(hit, "ordinary arrows must retain the native marker collision diagnostic");
        assert.equal(hit.evidence.distancePx, 7);
        assert.equal(hit.evidence.minimumPx, 10.5);
        return true;
      });
      await assert.rejects(fs.stat(output), { code: "ENOENT" });
    }
  }
});
