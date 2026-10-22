import assert from "node:assert/strict";
import test from "node:test";
import { auditCanvasEnvelope, auditScene } from "../packages/publisher/src/scene/static/audit.mjs";

const contract = Object.freeze({
  widthGrowth: 0,
  heightGrowth: 0,
  minimumFont: 10,
  ownerClearance: 2,
  textClearance: 1,
  endpointTolerance: 0.1,
  minimumTerminal: 10,
});
const quality = Object.freeze({
  schema: "source-quality/v1",
  hard_gates: {
    geometry_each_scale: {
      canvas_clearance_source_units_min: 5,
      font_width_growth_fraction: 0,
      font_height_growth_fraction: 0,
    },
  },
});

function scene() {
  return {
    width: 100,
    height: 100,
    referenceWidth: 100,
    requiredSemanticIds: ["meaning"],
    nodes: [
      {
        id: "left",
        box: { x: 10, y: 10, width: 20, height: 20 },
        paintBox: { x: 10, y: 10, width: 20, height: 20 },
      },
      {
        id: "right",
        box: { x: 70, y: 10, width: 20, height: 20 },
        paintBox: { x: 70, y: 10, width: 20, height: 20 },
      },
    ],
    texts: [
      {
        id: "label",
        text: "Meaning",
        visible: true,
        owner: "left",
        semanticIds: ["meaning"],
        fontSize: 12,
        box: { x: 14, y: 15, width: 4, height: 5 },
      },
    ],
    edges: [
      {
        id: "link",
        source: "left",
        target: "right",
        points: [
          { x: 30, y: 20 },
          { x: 70, y: 20 },
        ],
        strokeWidth: 2,
      },
    ],
    decorations: [],
  };
}

test("measured scene and source canvas admit distinct geometric predicates", () => {
  const selected = scene();
  assert.deepEqual(auditScene(selected, contract).failures, []);
  const canvas = auditCanvasEnvelope(selected, quality);
  assert.deepEqual(canvas.failures, []);
  assert.equal(canvas.sourceQualitySchema, quality.schema);
  assert.equal(canvas.envelopes.length, 4);
  assert.match(canvas.scope, /Not a browser/);
});

test("authored Scene owns one pre-render geometry policy and rejects invalid text", async () => {
  const { assertAuthoredCanvasScene } =
    await import("../packages/publisher/src/scene/static/audit.mjs");
  assert.equal(typeof assertAuthoredCanvasScene, "function");
  const selected = scene();
  selected.nodes[0].box.width = 40;
  selected.nodes[0].box.height = 40;
  selected.nodes[0].paintBox.width = 40;
  selected.nodes[0].paintBox.height = 40;
  selected.texts[0].box = { x: 20, y: 20, width: 10, height: 10 };
  selected.edges[0].points[0].x = 50;
  assert.deepEqual(assertAuthoredCanvasScene(selected).geometry.failures, []);
  selected.texts[0].fontSize = 4;
  assert.throws(() => assertAuthoredCanvasScene(selected), {
    code: "authored_canvas_geometry_invalid",
  });
});

test("scene audit reports visible meaning, readable text and connection defects", () => {
  const cases = [
    ["small font", (v) => (v.texts[0].fontSize = 4), "font-too-small"],
    ["empty glyph", (v) => (v.texts[0].box.width = 0), "empty-glyph-bounds"],
    ["outside canvas", (v) => (v.texts[0].box.x = -1), "out-of-bounds"],
    ["missing owner", (v) => (v.texts[0].owner = "absent"), "missing-text-owner"],
    ["tight owner", (v) => (v.texts[0].box.x = 10), "owner-clearance"],
    ["missing meaning", (v) => (v.requiredSemanticIds = ["absent"]), "missing-visible-semantic"],
    ["overlapping text", (v) => v.texts.push({ ...v.texts[0], id: "other" }), "text-overlap"],
    ["overlapping nodes", (v) => (v.nodes[1].box.x = 25), "node-overlap"],
    ["empty edge", (v) => (v.edges[0].points = []), "empty-edge"],
    ["detached edge", (v) => (v.edges[0].points[0].x = 40), "endpoint-detached"],
    ["short terminal", (v) => v.edges[0].points.push({ x: 72, y: 20 }), "short-terminal"],
    ["diagonal edge", (v) => (v.edges[0].points[1].y = 21), "nonorthogonal-edge"],
    [
      "text collision",
      (v) => (v.texts[0].box = { x: 45, y: 18, width: 5, height: 5 }),
      "edge-text-collision",
    ],
    [
      "node collision",
      (v) => v.nodes.push({ id: "middle", box: { x: 45, y: 15, width: 10, height: 10 } }),
      "edge-node-collision",
    ],
    [
      "rule collision",
      (v) =>
        v.decorations.push({
          id: "rule",
          points: [
            { x: 16, y: 0 },
            { x: 16, y: 30 },
          ],
        }),
      "decoration-text-collision",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const selected = scene();
    mutate(selected);
    assert(
      auditScene(selected, contract).failures.some((failure) => failure.code === code),
      name,
    );
  }
});

test("scene audit separates text-to-geometry clearance from text-to-text spacing", () => {
  const selected = scene();
  selected.texts.push({
    ...selected.texts[0],
    id: "near-label",
    semanticIds: [],
    box: { x: 20, y: 15, width: 4, height: 5 },
  });
  assert.deepEqual(auditScene(selected, contract).failures, []);
  assert.equal(
    auditScene(selected, { ...contract, textClearance: 12 }).failures.some(
      ({ code, id, other }) =>
        code === "text-clearance" && id === "label" && other === "near-label",
    ),
    false,
  );
  assert(
    auditScene(selected, { ...contract, textToTextClearance: 5 }).failures.some(
      ({ code, id, other }) =>
        code === "text-clearance" && id === "label" && other === "near-label",
    ),
  );
  const nearPaint = scene();
  nearPaint.texts.push({
    ...nearPaint.texts[0],
    id: "near-paint",
    owner: null,
    semanticIds: [],
    box: { x: 64, y: 15, width: 4, height: 5 },
  });
  assert(
    auditScene(nearPaint, { ...contract, textClearance: 5 }).failures.some(
      ({ code, id, other }) =>
        code === "text-nonowner-collision" && id === "near-paint" && other === "right",
    ),
  );
});

test("scene audit rejects invalid text-to-text spacing without weakening other checks", () => {
  for (const value of [-1, NaN, Infinity])
    assert.throws(
      () => auditScene(scene(), { ...contract, textToTextClearance: value }),
      /invalid text-to-text clearance/,
    );
});

test("scene audit rejects invalid extents and duplicate node identities", () => {
  const invalidExtent = scene();
  invalidExtent.referenceWidth = 0;
  assert.throws(() => auditScene(invalidExtent, contract), /invalid scene extent/);
  const duplicate = scene();
  duplicate.nodes[1].id = "left";
  assert.throws(() => auditScene(duplicate, contract), /duplicate node identity/);
});

test("scene audit distinguishes invalid geometry, crossings and arrow paint", () => {
  const invalidText = scene();
  invalidText.texts[0].fontSize = NaN;
  assert(
    auditScene(invalidText, contract).failures.some(({ code }) => code === "invalid-geometry"),
  );

  const missingEndpoint = scene();
  missingEndpoint.edges[0].source = "absent";
  assert(
    auditScene(missingEndpoint, contract).failures.some(({ code }) => code === "endpoint-detached"),
  );

  const crossing = scene();
  crossing.edges.push({
    id: "crossing",
    source: "left",
    target: "right",
    points: [
      { x: 50, y: 10 },
      { x: 50, y: 30 },
    ],
  });
  assert(auditScene(crossing, contract).failures.some(({ code }) => code === "edge-crossing"));

  const invalidArrow = scene();
  invalidArrow.edges[0].arrowGeometry = { length: 0, halfWidth: 3, strokeWidth: 1 };
  assert.throws(() => auditScene(invalidArrow, contract), /invalid arrow geometry/);

  const arrow = scene();
  arrow.edges[0].arrowGeometry = { length: 8, halfWidth: 3, strokeWidth: 1 };
  arrow.texts.push({
    id: "arrow-obstruction",
    text: "Obstruction",
    visible: true,
    owner: null,
    semanticIds: [],
    fontSize: 12,
    box: { x: 64, y: 17, width: 5, height: 5 },
  });
  assert(auditScene(arrow, contract).failures.some(({ code }) => code === "arrow-text-collision"));
});

test("source canvas audit rejects unmeasured paint and records clearance failures", () => {
  const invalidQuality = structuredClone(quality);
  invalidQuality.hard_gates.geometry_each_scale.font_width_growth_fraction = -1;
  assert.throws(
    () => auditCanvasEnvelope(scene(), invalidQuality),
    /Source canvas and growth values required/,
  );

  const withoutPaint = scene();
  delete withoutPaint.nodes[0].paintBox;
  assert.throws(
    () => auditCanvasEnvelope(withoutPaint, quality),
    /Explicit node paint footprint required/,
  );

  const invalidPath = scene();
  invalidPath.edges[0].points = [];
  assert.throws(() => auditCanvasEnvelope(invalidPath, quality), /Invalid canvas path/);

  const nearEdge = scene();
  nearEdge.texts[0].box.x = 1;
  assert(
    auditCanvasEnvelope(nearEdge, quality).failures.some(
      ({ code, id }) => code === "canvas-clearance" && id === "label",
    ),
  );

  const arrow = scene();
  arrow.edges[0].arrowGeometry = { length: 5, halfWidth: 3, strokeWidth: 1 };
  assert.equal(auditCanvasEnvelope(arrow, quality).envelopes.at(-1).kind, "arrow");
  arrow.edges[0].points[1] = { x: 30, y: 20 };
  assert.throws(() => auditCanvasEnvelope(arrow, quality), /Zero arrow terminal/);
});

test("source canvas handles measured fallback footprints and rejects malformed envelopes", () => {
  const selected = scene();
  delete selected.nodes[0].paintBox;
  selected.nodes[0].strokeWidth = 2;
  assert.deepEqual(auditCanvasEnvelope(selected, quality).failures, []);

  const invalidText = scene();
  invalidText.texts[0].box.width = NaN;
  assert.throws(() => auditCanvasEnvelope(invalidText, quality), /Invalid canvas envelope/);

  const invalidArrow = scene();
  invalidArrow.edges[0].arrowGeometry = { length: NaN, halfWidth: 3, strokeWidth: 1 };
  assert.throws(() => auditCanvasEnvelope(invalidArrow, quality), /Invalid arrow envelope/);

  const invalidRule = scene();
  invalidRule.decorations.push({ id: "rule", points: [] });
  assert.throws(() => auditCanvasEnvelope(invalidRule, quality), /Invalid canvas path/);

  const empty = scene();
  empty.texts = [];
  empty.nodes = [];
  empty.edges = [];
  assert.equal(auditCanvasEnvelope(empty, quality).minimumClearance, null);

  const grown = scene();
  grown.texts[0].anchor = "middle";
  const growth = structuredClone(quality);
  growth.hard_gates.geometry_each_scale.font_width_growth_fraction = 0.2;
  assert.deepEqual(auditCanvasEnvelope(grown, growth).failures, []);
  grown.texts[0].anchor = "end";
  assert.deepEqual(auditCanvasEnvelope(grown, growth).failures, []);
});

test("optional decorations and source labels do not manufacture measured content", () => {
  const sparse = scene();
  sparse.texts = [];
  delete sparse.decorations;
  assert.equal(auditScene(sparse, contract).minimumEffectiveFont, null);

  const canvas = scene();
  delete canvas.edges[0].strokeWidth;
  delete canvas.decorations;
  const withoutSchema = structuredClone(quality);
  delete withoutSchema.schema;
  const report = auditCanvasEnvelope(canvas, withoutSchema);
  assert.equal(report.sourceQualitySchema, null);
  assert.deepEqual(report.failures, []);
});

test("static audit admits a short unarrowed bridge without phantom arrow paint", () => {
  const selected = scene();
  selected.nodes[1].box.x = 32;
  selected.nodes[1].paintBox.x = 32;
  selected.edges[0].points[1].x = 32;
  selected.edges[0].arrow = false;
  selected.edges[0].arrowGeometry = { length: 8, halfWidth: 4, strokeWidth: 1 };
  assert.deepEqual(auditScene(selected, contract).failures, []);
  const canvas = auditCanvasEnvelope(selected, quality);
  assert.equal(canvas.envelopes.filter((value) => value.kind === "arrow").length, 0);
  assert.deepEqual(canvas.envelopes.find((value) => value.kind === "edge").box, {
    x: 29,
    y: 19,
    width: 4,
    height: 2,
  });
});

test("unarrowed inactive zero arrow parameters do not create an invalid arrow", () => {
  const selected = scene();
  selected.edges[0].arrow = false;
  selected.edges[0].arrowGeometry = { length: 0, halfWidth: 0, strokeWidth: 0 };
  assert.deepEqual(auditScene(selected, contract).failures, []);
  const canvas = auditCanvasEnvelope(selected, quality);
  assert.equal(canvas.envelopes.filter((value) => value.kind === "arrow").length, 0);
});

test("true and historical default arrows retain the directional terminal minimum", () => {
  for (const arrow of [true, undefined]) {
    const selected = scene();
    selected.nodes[1].box.x = 32;
    selected.nodes[1].paintBox.x = 32;
    selected.edges[0].points[1].x = 32;
    if (arrow !== undefined) selected.edges[0].arrow = arrow;
    selected.edges[0].arrowGeometry = { length: 8, halfWidth: 4, strokeWidth: 1 };
    assert(
      auditScene(selected, contract).failures.some((value) => value.code === "short-terminal"),
    );
    assert.equal(
      auditCanvasEnvelope(selected, quality).envelopes.filter((value) => value.kind === "arrow")
        .length,
      1,
    );
  }
});

test("unarrowed shafts retain measured text collision and attachment checks", () => {
  const selected = scene();
  selected.edges[0].arrow = false;
  selected.edges[0].arrowGeometry = { length: 0, halfWidth: 0, strokeWidth: 0 };
  selected.texts.push({
    id: "shaft-obstruction",
    text: "Block",
    visible: true,
    semanticIds: [],
    fontSize: 12,
    box: { x: 45, y: 18, width: 8, height: 4 },
  });
  assert(
    auditScene(selected, contract).failures.some((value) => value.code === "edge-text-collision"),
  );
  selected.edges[0].points[1].x = 68;
  assert(
    auditScene(selected, contract).failures.some((value) => value.code === "endpoint-detached"),
  );
});
