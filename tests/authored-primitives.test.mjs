import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { composeAuthoredStaticCanvas } from "../packages/publisher/src/scene/static/authored-canvas.mjs";
import { parseSelectedSceneRefinement } from "../packages/publisher/src/edition/refinement.mjs";
import { assertAuthoredCanvasScene } from "../packages/publisher/src/scene/static/audit.mjs";
import {
  renderAuthoredCanvasSvg,
  authoredCanvasFramingRequest,
} from "../packages/publisher/renderers/svg/canvas.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import {
  sha,
  reference,
  rect,
  meaning,
  sceneFor,
  compose,
  resultScene,
} from "./fixtures/authored-primitives.mjs";

for (const medium of ["static", "interactive"]) {
  test(`${medium} primitive-only source painting derives ink bounds without legacy role fields`, () => {
    const value = meaning(medium);
    const before = JSON.stringify(sceneFor(value, medium).nodes[0]);
    const scene = resultScene(compose(value, medium), medium);
    assert.deepEqual(scene.nodes[0].paintBox, { x: 199, y: 199, width: 82, height: 62 });
    assert.equal(Object.hasOwn(scene.nodes[0], "radius"), false);
    assert.equal(Object.hasOwn(scene.nodes[0], "visualRole"), false);
    assert.equal(JSON.stringify(sceneFor(value, medium).nodes[0]), before);
    const bytes = Buffer.from(
      JSON.stringify({ schema: "architecture.scene-refinement/v1", media: value.refinement.media }),
    );
    assert.doesNotThrow(() => parseSelectedSceneRefinement(bytes, [medium], sha(bytes)));
  });

  test(`${medium} rejects false ink envelopes, executable geometry and invisible structural marks`, () => {
    for (const change of [
      (node) => {
        node.paintBox = { x: 200, y: 200, width: 80, height: 60 };
      },
      (node) => {
        node.primitives[0].transform = "translate(10,0)";
      },
      (node) => {
        node.primitives[0].href = "https://example.invalid/mark";
      },
      (node) => {
        node.primitives[0].kind = "path";
      },
      (node) => {
        node.primitives[0].box.x = Number.POSITIVE_INFINITY;
      },
      (node) => {
        node.primitives[0].fill = null;
        node.primitives[0].stroke = null;
        node.primitives[0].strokeWidth = 0;
      },
      (node) => {
        node.primitives = [];
      },
      (node) => {
        node.radius = 12;
      },
    ]) {
      const value = meaning(medium);
      change(sceneFor(value, medium).nodes[0]);
      assert.throws(() => compose(value, medium));
    }
  });

  test(`${medium} adornments have geometry only and cannot replace source ownership`, () => {
    const value = meaning(medium);
    const scene = sceneFor(value, medium);
    const adornment = structuredClone(scene.nodes[0]);
    adornment.id = "routing-mark";
    adornment.adornment = true;
    adornment.semanticIds = [];
    if (medium === "static") adornment.box.x = 600;
    else adornment.position.x = 600;
    scene.nodes.push(adornment);
    const result = compose(value, medium);
    assert.equal(resultScene(result, medium).nodes.length, 2);
    if (medium === "interactive")
      assert.equal(Object.hasOwn(result.pages[0].subjectNamespaces, "routing-mark"), false);
    adornment.semanticIds = [reference];
    assert.throws(() => compose(value, medium));
    const replacement = meaning(medium);
    sceneFor(replacement, medium).nodes[0].adornment = true;
    sceneFor(replacement, medium).nodes[0].semanticIds = [];
    assert.throws(() => compose(replacement, medium));
  });

  test(`${medium} primitive budgets are global and exact, including closing traversal`, () => {
    const exact = meaning(medium);
    sceneFor(exact, medium).nodes[0].primitives = Array.from({ length: 32 }, rect);
    assert.doesNotThrow(() => compose(exact, medium));
    sceneFor(exact, medium).nodes[0].primitives.push(rect());
    assert.throws(() => compose(exact, medium));
    const tooManyPoints = meaning(medium);
    sceneFor(tooManyPoints, medium).nodes[0].primitives = [
      {
        kind: "polyline",
        points: Array.from({ length: 65 }, (_, x) => ({ x, y: x % 2 })),
        closed: false,
        fill: null,
        stroke: "ink",
        strokeWidth: 2,
      },
    ];
    assert.throws(() => compose(tooManyPoints, medium));
  });

  test(`${medium} admits standard circles, rectangles and stroked paths but rejects degenerate fills`, () => {
    const value = meaning(medium);
    const node = sceneFor(value, medium).nodes[0];
    node.primitives = [
      {
        kind: "circle",
        center: { x: 20, y: 20 },
        radius: 10,
        fill: "paper",
        stroke: "ink",
        strokeWidth: 2,
      },
      rect(),
      {
        kind: "line",
        start: { x: 0, y: 0 },
        end: { x: 80, y: 60 },
        fill: null,
        stroke: "ink",
        strokeWidth: 2,
      },
      {
        kind: "polyline",
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 60 },
        ],
        closed: false,
        fill: null,
        stroke: "ink",
        strokeWidth: 2,
      },
    ];
    assert.deepEqual(resultScene(compose(value, medium), medium).nodes[0].paintBox, {
      x: 199,
      y: 199,
      width: 82,
      height: 62,
    });
    for (const invalid of [
      {
        kind: "polyline",
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 20 },
          { x: 40, y: 40 },
        ],
        closed: true,
        fill: "paper",
        stroke: null,
        strokeWidth: 0,
      },
      {
        kind: "line",
        start: { x: 5, y: 5 },
        end: { x: 5, y: 5 },
        fill: null,
        stroke: "ink",
        strokeWidth: 2,
      },
      {
        kind: "polyline",
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 0, y: 60 },
          { x: 0, y: 0 },
          { x: 0, y: 60 },
          { x: 80, y: 0 },
        ],
        closed: true,
        fill: "paper",
        stroke: null,
        strokeWidth: 0,
      },
      {
        kind: "polyline",
        points: [
          { x: 0.1, y: 0.2 },
          { x: 80.3, y: 0.4 },
          { x: 0.5, y: 60.6 },
          { x: 0.1, y: 0.2 },
          { x: 0.5, y: 60.6 },
          { x: 80.3, y: 0.4 },
        ],
        closed: true,
        fill: "ink",
        stroke: null,
        strokeWidth: 0,
      },
      { ...rect(), fill: null, strokeWidth: 0 },
      { ...rect(), opacity: 0 },
      { ...rect(), stroke: null, strokeWidth: 2 },
    ]) {
      const rejected = meaning(medium);
      sceneFor(rejected, medium).nodes[0].primitives = [invalid];
      assert.throws(() => compose(rejected, medium));
    }
  });

  test(`${medium} enforces whole-canvas primitive and point budgets before painting`, () => {
    const value = meaning(medium);
    const scene = sceneFor(value, medium);
    const add = (count, primitives) => {
      scene.nodes = Array.from({ length: count }, (_, index) => ({
        ...structuredClone(scene.nodes[0]),
        id: `mark-${index}`,
        ...(index ? { adornment: true, semanticIds: [] } : {}),
        primitives: structuredClone(primitives),
      }));
    };
    add(128, Array.from({ length: 32 }, rect));
    assert.doesNotThrow(() => compose(value, medium));
    scene.nodes.push({
      ...structuredClone(scene.nodes[1]),
      id: "one-extra-mark",
      primitives: [rect()],
    });
    assert.throws(() => compose(value, medium));
    const path = {
      kind: "polyline",
      points: Array.from({ length: 64 }, (_, x) => ({ x, y: x % 2 })),
      closed: false,
      fill: null,
      stroke: "ink",
      strokeWidth: 2,
    };
    add(
      16,
      Array.from({ length: 32 }, () => path),
    );
    assert.doesNotThrow(() => compose(value, medium));
    scene.nodes.push({
      ...structuredClone(scene.nodes[1]),
      id: "two-extra-points",
      primitives: [
        {
          kind: "line",
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
          fill: null,
          stroke: "ink",
          strokeWidth: 2,
        },
      ],
    });
    assert.throws(() => compose(value, medium));
    scene.nodes.pop();
    scene.nodes[0].primitives[0].closed = true;
    assert.throws(() => compose(value, medium));
  });
}

for (const medium of ["static", "interactive"]) {
  test(`${medium} rejects a contrasting composite erased by its final background paint`, () => {
    const value = meaning(medium),
      node = sceneFor(value, medium).nodes[0];
    node.primitives = [
      { ...rect(), fill: "ink", stroke: null, strokeWidth: 0 },
      { ...rect(), fill: "paper", stroke: null, strokeWidth: 0 },
    ];
    assert.throws(() => compose(value, medium));
    node.primitives.at(-1).stroke = "ink";
    node.primitives.at(-1).strokeWidth = 2;
    assert.doesNotThrow(() => compose(value, medium));
  });
}

test("legacy SVG keeps valid uppercase palette bytes without primitive normalization", async () => {
  const value = meaning("static"),
    scene = sceneFor(value, "static");
  scene.paint = { paper: "#F3F0E8", ink: "#26362F" };
  scene.nodes[0] = {
    id: "painted-client",
    kind: "source",
    tone: "ink",
    center: { x: 240, y: 230 },
    radius: 30,
    box: { x: 210, y: 200, width: 60, height: 60 },
    paintBox: { x: 209, y: 199, width: 62, height: 62 },
    strokeWidth: 2,
    semanticIds: [reference],
  };
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...scene.texts,
    authoredCanvasFramingRequest("fixture-editor"),
  ]);
  const svg = renderAuthoredCanvasSvg(
    compose(value, "static").scene,
    "fixture-editor",
    measurer,
  ).toString("utf8");
  assert(svg.includes('fill="#F3F0E8"'));
  assert(svg.includes('stroke="#26362F"'));
});

for (const medium of ["static", "interactive"]) {
  test(`${medium} rejects background-only source marks but retains outlined paper interiors`, () => {
    const value = meaning(medium),
      scene = sceneFor(value, medium),
      node = scene.nodes[0];
    node.primitives[0].stroke = null;
    node.primitives[0].strokeWidth = 0;
    assert.throws(() => compose(value, medium));
    node.primitives[0].fill = "ink";
    if (medium === "static") {
      scene.paint.ink = scene.paint.paper.toUpperCase();
      assert.throws(() => compose(value, medium));
      scene.paint.ink = "#26362f";
    }
    assert.doesNotThrow(() => compose(value, medium));
    node.primitives = [rect()];
    assert.doesNotThrow(() => compose(value, medium));
  });
}

test("interactive adornments remain outside structural group membership", () => {
  const value = meaning("interactive"),
    scene = sceneFor(value, "interactive");
  const adornment = {
    ...structuredClone(scene.nodes[0]),
    id: "routing-mark",
    semanticIds: [],
    adornment: true,
    position: { x: 600, y: 200 },
  };
  scene.nodes.push(adornment);
  scene.groups = [
    { id: "source-group", label: "Selected source", nodeIds: ["painted-client"], padding: 20 },
  ];
  assert.doesNotThrow(() => compose(value, "interactive"));
  const rejected = structuredClone(value);
  sceneFor(rejected, "interactive").groups[0].nodeIds.push("routing-mark");
  assert.throws(() => compose(rejected, "interactive"));
});

test("static paint substitution never moves ports and collision audit uses derived ink", () => {
  const value = meaning("static");
  const node = sceneFor(value, "static").nodes[0];
  const port = structuredClone(node.box);
  node.primitives[0].box = { x: -155, y: -125, width: 200, height: 180 };
  const result = composeAuthoredStaticCanvas(value);
  assert.deepEqual(result.scene.nodes[0].box, port);
  assert.throws(() => assertAuthoredCanvasScene(result.scene), {
    code: "authored_canvas_geometry_invalid",
  });
});

test("public interactive render derives omitted ink bounds before testing authored text", async (t) => {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-primitive-text-collision-"),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const value = meaning("interactive"),
    scene = sceneFor(value, "interactive");
  scene.nodes[0].primitives[0].box = { x: -155, y: -125, width: 200, height: 180 };
  const fonts = await loadBundledFonts(),
    measurer = await createBundledTextMeasurer(fonts, scene.texts);
  for (const text of scene.texts) text.box = measurer.box(text);
  await assert.rejects(
    renderArchitectureScene({ scene, output: path.join(root, "architecture.html") }),
    (error) =>
      error.code === "authored_interactive_text_geometry_invalid" &&
      error.message.endsWith(":collision"),
  );
});

test("primitive ink cannot overlap prototype-named legacy port owners", async (t) => {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-primitive-prototype-"),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const id of ["other", "constructor", "tostring", "isprototypeof"]) {
    const value = meaning("interactive"),
      scene = sceneFor(value, "interactive");
    scene.texts = [];
    scene.nodes[0].primitives[0].box = { x: 0, y: 0, width: 200, height: 60 };
    scene.nodes.push({
      id,
      label: "Other",
      visualRole: "backend",
      position: { x: 330, y: 200 },
      size: { width: 50, height: 60 },
    });
    await assert.rejects(
      renderArchitectureScene({ scene, output: path.join(root, `${id}.html`) }),
      (error) =>
        error.code === "authored_interactive_paint_geometry_invalid" &&
        error.message.endsWith(":node"),
    );
  }
});
