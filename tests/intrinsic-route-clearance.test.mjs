import assert from "node:assert/strict";
import test from "node:test";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";
import { auditInteractiveGeometry } from "../packages/publisher/renderers/elk/audit.mjs";
import { normalizeInteractiveGeometry } from "../packages/publisher/renderers/elk/normalize.mjs";
import {
  collectAmbiguousCorridors,
  collectRouteRhythmIssues,
  rectsOverlap,
} from "../packages/publisher/renderers/archify/supply/renderers/shared/geometry.mjs";
import {
  emptyLabel,
  graphFor,
  groupTitleGraph,
  incomingArrowGraph,
  occupiedCorridorGraph,
  routing,
} from "./fixtures/intrinsic-routing.mjs";

test("intrinsic routing avoids complete measured label ink without moving or masking it", async () => {
  const route = await routing();
  const graph = graphFor();
  const box = { x: 323, y: 168, width: 18, height: 10 };
  graph.relations[0].label = {
    ...emptyLabel(),
    x: 300,
    y: 160,
    width: 72,
    height: 32,
    lines: ["Exact  label"],
    baselines: [{ text: "Exact  label", x: 332, baseline: 176, box }],
    paintBox: box,
  };
  const label = structuredClone(graph.relations[0].label);
  await route(graph);
  assert.deepEqual(graph.relations[0].label, label);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("routing reserves painted label masks without blocking unpainted allocation whitespace", async () => {
  const route = await routing();
  const label = {
    ...emptyLabel(),
    x: 200,
    y: 180,
    width: 80,
    height: 32,
    lines: ["Exact label"],
    baselines: [
      {
        text: "Exact label",
        x: 210,
        baseline: 202,
        box: { x: 210, y: 190, width: 52, height: 12 },
      },
    ],
    paintBox: { x: 210, y: 190, width: 52, height: 12 },
  };
  const graph = {
    bounds: { width: 500, height: 440 },
    groups: [],
    nodes: [
      { id: "source", x: 64, y: 40 },
      { id: "target", x: 64, y: 300 },
      { id: "other-source", x: 289, y: 40 },
      { id: "other-target", x: 289, y: 300 },
    ].map((node) => ({ ...node, width: 112, height: 64, label: emptyLabel() })),
    relations: [
      {
        id: "labelled",
        source: "source",
        target: "target",
        direction: "forward",
        points: [
          { x: 120, y: 104 },
          { x: 120, y: 300 },
        ],
        label,
      },
      {
        id: "passing",
        source: "other-source",
        target: "other-target",
        direction: "forward",
        label: null,
        points: [
          { x: 289, y: 72 },
          { x: 199, y: 72 },
          { x: 199, y: 332 },
          { x: 289, y: 332 },
        ],
      },
    ],
  };
  const before = structuredClone(graph);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  await route(graph);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.relations[0].label, before.relations[0].label);
  assert.deepEqual(graph.relations[1].points, before.relations[1].points);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("normalization composes routes only after slots are placed and still audits the result", () => {
  const prepared = {
    nodes: ["source", "target"].map((id) => ({ id, width: 160, height: 72, label: emptyLabel() })),
    groups: [],
    relations: [{ id: "edge", source: "source", target: "target", direction: "forward" }],
  };
  const raw = {
    id: "root",
    width: 400,
    height: 280,
    children: prepared.nodes.map((node, index) => ({
      id: node.id,
      width: node.width,
      height: node.height,
      x: 24 + index * 41,
      y: 24 + index * 116,
      labels: [{ x: 0, y: 0, width: 0, height: 0, text: "" }],
    })),
    edges: [
      {
        id: "edge",
        container: "root",
        sources: ["source"],
        targets: ["target"],
        sections: [
          {
            incomingShape: "source",
            outgoingShape: "target",
            startPoint: { x: 104, y: 96 },
            endPoint: { x: 145, y: 140 },
            bendPoints: [
              { x: 104, y: 120 },
              { x: 145, y: 120 },
              { x: 145, y: 116 },
            ],
          },
        ],
      },
    ],
  };
  let called = false;
  const result = normalizeInteractiveGeometry(raw, prepared, (graph) => {
    called = true;
    assert.equal(graph.nodes[0].x, 24);
    graph.relations[0].points = [
      { x: 104, y: 96 },
      { x: 104, y: 118 },
      { x: 145, y: 118 },
      { x: 145, y: 140 },
    ];
  });
  assert.equal(called, true);
  assert.equal(result.relations[0].points.length, 4);
  assert.throws(
    () =>
      normalizeInteractiveGeometry(raw, prepared, (graph) => {
        graph.relations[0].points[1] = { x: 104, y: 40 };
      }),
    { code: "render_interactive_layout_infeasible" },
  );
});

test("packed routing separates reciprocal measured labels from their own and neighbouring routes", async () => {
  const { routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const label = {
    lines: ["Bind exact state"],
    width: 128,
    height: 32,
    fontSize: 12,
    weight: "400",
    baselines: [
      {
        text: "Bind exact state",
        x: 64,
        baseline: 18,
        box: { x: 6, y: 6, width: 116, height: 14 },
      },
    ],
  };
  const graph = {
    bounds: { width: 744, height: 432 },
    groups: [],
    nodes: Array.from({ length: 4 }, (_, index) => ({
      id: `node-${index}`,
      x: 64 + (index % 2) * 340,
      y: 64 + Math.floor(index / 2) * 184,
      width: 224,
      height: 128,
      label: emptyLabel(),
    })),
    relations: [
      [0, 1],
      [1, 0],
    ].map(([source, target], index) => ({
      id: `edge-${index}`,
      source: `node-${source}`,
      target: `node-${target}`,
      direction: "forward",
      label: structuredClone(label),
      points: [],
    })),
  };
  const before = structuredClone(graph);
  await routePackedIntrinsicGeometry(graph);
  const dx = graph.nodes[0].x - before.nodes[0].x;
  const dy = graph.nodes[0].y - before.nodes[0].y;
  for (const [index, node] of graph.nodes.entries()) {
    const prior = before.nodes[index];
    assert.equal(node.id, prior.id);
    assert.equal(node.width, prior.width);
    assert.equal(node.height, prior.height);
    assert.equal(node.x - prior.x, dx);
    assert.equal(node.y - prior.y, dy);
    assert.deepEqual(node.label.lines, prior.label.lines);
    assert.deepEqual(node.label.baselines, prior.label.baselines);
    assert(Number.isFinite(node.label.x));
    assert(Number.isFinite(node.label.y));
    assert(Object.values(node.label.paintBox).every(Number.isFinite));
  }
  assert.deepEqual(
    graph.relations.map(({ id, source, target, direction, label }) => ({
      id,
      source,
      target,
      direction,
      lines: label.lines,
    })),
    before.relations.map(({ id, source, target, direction, label }) => ({
      id,
      source,
      target,
      direction,
      lines: label.lines,
    })),
  );
  const routedRelations = graph.relations.map((edge) => ({
    relation: { id: edge.id, from: edge.source, to: edge.target },
    points: edge.points.map(({ x, y }) => [x, y]),
  }));
  assert.deepEqual(collectRouteRhythmIssues({ routedRelations }), []);
  assert.deepEqual(
    collectAmbiguousCorridors({
      routedRelations,
      includeSharedEndpoints: () => true,
    }),
    [],
  );
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("automatic routing retains a qualified native route and complete measured label as one pair", async () => {
  const { routeIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const graph = {
    bounds: { width: 800, height: 400 },
    groups: [],
    nodes: [
      { id: "source", x: 64, y: 100 },
      { id: "target", x: 600, y: 100 },
    ].map((node) => ({ ...node, width: 112, height: 80, label: emptyLabel() })),
    relations: [
      {
        id: "qualified-pair",
        source: "source",
        target: "target",
        direction: "forward",
        points: [
          { x: 176, y: 140 },
          { x: 600, y: 140 },
        ],
        label: {
          lines: ["Exact  selected relation"],
          x: 324,
          y: 96,
          width: 128,
          height: 32,
          fontSize: 12,
          weight: "400",
          baselines: [
            {
              text: "Exact  selected relation",
              x: 388,
              baseline: 114,
              box: { x: 330, y: 102, width: 116, height: 14 },
            },
          ],
          paintBox: { x: 330, y: 102, width: 116, height: 14 },
        },
      },
    ],
  };
  const before = structuredClone(graph);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  await routeIntrinsicGeometry(graph, { automatic: true });
  assert.deepEqual(
    graph,
    before,
    "A previously qualified label/route pair must not be replanned independently",
  );
});

test("automatic labels avoid the painted group-title slot, not just its glyph rows", async () => {
  const route = await routing();
  const graph = groupTitleGraph();
  const before = structuredClone(graph);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  await route(graph, { automatic: true });
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.groups, before.groups);
  assert.deepEqual(graph.relations[0].label.lines, before.relations[0].label.lines);
  assert.equal(graph.relations[0].label.width, before.relations[0].label.width);
  assert.equal(graph.relations[0].label.height, before.relations[0].label.height);
  for (const { box } of graph.relations[0].label.baselines)
    assert.equal(rectsOverlap(graph.groups[0].label, box), false);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("fixed-label intrinsic candidates refuse ink hidden by a group-title mask", async () => {
  const route = await routing();
  const graph = groupTitleGraph();
  const before = structuredClone(graph);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  await assert.rejects(() => route(graph), { code: "render_interactive_layout_infeasible" });
  assert.deepEqual(graph, before);
});

test("intrinsic admission reserves complete group-title paint for route strokes", async () => {
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = groupTitleGraph();
  graph.relations[0].label = emptyLabel();
  const clearY =
    graph.groups[0].label.y +
    graph.groups[0].label.height +
    marks.textClearance +
    marks.selectedRouteStroke / 2;
  for (const y of [162, clearY - 1]) {
    graph.relations[0].points[1].y = y;
    graph.relations[0].points[2].y = y;
    const before = structuredClone(graph);
    assert.doesNotThrow(() => auditInteractiveGeometry(graph));
    assert.throws(() => auditIntrinsicGeometry(graph), {
      code: "render_interactive_layout_infeasible",
      message: "render_interactive_layout_infeasible:group-title-mask-collision:connection",
    });
    assert.deepEqual(graph, before);
  }
  graph.relations[0].points[1].y = clearY + 1;
  graph.relations[0].points[2].y = clearY + 1;
  const before = structuredClone(graph);
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
  assert.deepEqual(graph, before);
});

test("intrinsic composition repairs title-mask crossings before final admission", async () => {
  const route = await routing();
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  for (const options of [{}, { automatic: true }]) {
    const graph = groupTitleGraph();
    graph.relations[0].label = emptyLabel();
    graph.relations[0].points[1].y = 162;
    graph.relations[0].points[2].y = 162;
    const before = structuredClone(graph);
    await route(graph, options);
    assert.deepEqual(graph.nodes, before.nodes);
    assert.deepEqual(graph.groups, before.groups);
    assert.equal(graph.relations[0].id, before.relations[0].id);
    assert.equal(graph.relations[0].source, before.relations[0].source);
    assert.equal(graph.relations[0].target, before.relations[0].target);
    assert.deepEqual(graph.relations[0].points[0], before.relations[0].points[0]);
    assert.deepEqual(graph.relations[0].points.at(-1), before.relations[0].points.at(-1));
    assert.notDeepEqual(graph.relations[0].points, before.relations[0].points);
    assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
  }
});

test("intrinsic candidate admission reserves the actual native arrowhead widths", async () => {
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  for (const graph of [incomingArrowGraph(7), incomingArrowGraph(11, "emphasis")]) {
    const before = structuredClone(graph);
    assert.doesNotThrow(() => auditInteractiveGeometry(graph));
    assert.throws(() => auditIntrinsicGeometry(graph), {
      code: "render_interactive_layout_infeasible",
    });
    assert.deepEqual(graph, before);
  }
  assert.doesNotThrow(() => auditIntrinsicGeometry(incomingArrowGraph(10.5)));
});

test("native grid reserves finite-width occupied corridors before accepting its next path", async () => {
  const route = await routing();
  const graph = occupiedCorridorGraph();
  const before = structuredClone(graph);
  const candidate = before.relations.at(-1);
  assert.throws(() => auditInteractiveGeometry(graph), {
    code: "render_interactive_layout_infeasible",
    message: "render_interactive_layout_infeasible:route-stroke-collision:candidate",
  });
  await route(graph);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.bounds, before.bounds);
  assert.deepEqual(graph.relations.slice(0, -1), before.relations.slice(0, -1));
  assert.deepEqual(graph.relations.at(-1).points[0], candidate.points[0]);
  assert.deepEqual(graph.relations.at(-1).points.at(-1), candidate.points.at(-1));
  assert.notDeepEqual(graph.relations.at(-1).points, candidate.points);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("automatic label placement keeps complete ink near its route rather than moving allocation whitespace", async () => {
  const route = await routing();
  const graph = {
    bounds: { width: 740, height: 220 },
    groups: [],
    nodes: [
      { id: "source", x: 100, y: 100 },
      { id: "target", x: 460, y: 100 },
    ].map((node) => ({ ...node, width: 160, height: 80, label: emptyLabel() })),
    relations: [
      {
        id: "relation",
        source: "source",
        target: "target",
        direction: "forward",
        points: [
          { x: 260, y: 140 },
          { x: 460, y: 140 },
        ],
        label: {
          x: 200,
          y: 70,
          width: 280,
          height: 160,
          lines: ["Exact relation"],
          fontSize: 12,
          weight: "400",
          baselines: [
            {
              text: "Exact relation",
              x: 340,
              baseline: 150,
              box: { x: 315, y: 137, width: 50, height: 12 },
            },
          ],
          paintBox: { x: 315, y: 137, width: 50, height: 12 },
        },
      },
    ],
  };
  const before = structuredClone(graph);
  await route(graph, { automatic: true });
  const relation = graph.relations[0];
  const ink = relation.label.paintBox;
  const distance = Math.max(ink.y - 140, 140 - ink.y - ink.height, 0);
  assert(distance <= 24, `Complete label ink stays within two ink heights: ${distance}`);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(relation.points, before.relations[0].points);
  assert.deepEqual(relation.label.lines, before.relations[0].label.lines);
  assert.equal(relation.label.width, 280);
  assert.equal(relation.label.height, 160);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("packed native planning places measured ink rather than an oversized label allocation", async () => {
  const { routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const graph = {
    bounds: { width: 600, height: 260 },
    groups: [],
    nodes: [
      { id: "source", x: 64, y: 100 },
      { id: "target", x: 380, y: 100 },
    ].map((node) => ({ ...node, width: 160, height: 80, label: emptyLabel() })),
    relations: [
      {
        id: "edge",
        source: "source",
        target: "target",
        direction: "forward",
        points: [],
        label: {
          x: 0,
          y: 0,
          width: 280,
          height: 160,
          lines: ["Exact relation"],
          fontSize: 12,
          weight: "400",
          baselines: [
            {
              text: "Exact relation",
              x: 140,
              baseline: 80,
              box: { x: 115, y: 67, width: 50, height: 12 },
            },
          ],
        },
      },
    ],
  };
  const before = structuredClone(graph);
  await routePackedIntrinsicGeometry(graph);
  const { label, points } = graph.relations[0];
  const distance = Math.max(label.paintBox.y - 140, 140 - label.paintBox.y - 12, 0);
  assert(distance <= 24, `Native planning preserves nearby actual ink: ${distance}`);
  const geometry = (nodes) =>
    nodes.map(({ id, x, y, width, height }) => ({ id, x, y, width, height }));
  assert.deepEqual(geometry(graph.nodes), geometry(before.nodes));
  assert.deepEqual(points, [
    { x: 224, y: 140 },
    { x: 380, y: 140 },
  ]);
  assert.deepEqual(label.lines, before.relations[0].label.lines);
  assert.equal(label.width, 280);
  assert.equal(label.height, 160);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});
