import assert from "node:assert/strict";
import test from "node:test";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";
import { auditInteractiveGeometry } from "../packages/publisher/renderers/elk/audit.mjs";
import { collectArrowheadCollisions } from "../packages/publisher/renderers/archify/supply/renderers/shared/geometry.mjs";
import {
  facingGraph,
  graphFor,
  incomingArrowGraph,
  routing,
} from "./fixtures/intrinsic-routing.mjs";

test("fixed routing searches with the same endpoint-frame clearance as final admission", async () => {
  const route = await routing();
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = facingGraph();
  graph.relations[0].points = [
    { x: 240, y: 160 },
    { x: 576, y: 160 },
  ];
  const before = structuredClone(graph);
  await route(graph);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.groups, before.groups);
  assert.deepEqual(graph.bounds, before.bounds);
  assert.equal(graph.relations[0].id, "edge");
  assert.equal(graph.relations[0].source, "source");
  assert.equal(graph.relations[0].target, "target");
  assert.deepEqual(graph.relations[0].points[0], before.relations[0].points[0]);
  assert.deepEqual(graph.relations[0].points.at(-1), before.relations[0].points.at(-1));
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("automatic routes reserve their own endpoint frames except for direct port contact", async () => {
  const { routeIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = graphFor();
  graph.nodes[1].x = 520;
  graph.nodes[1].y = 24;
  graph.bounds.height = 300;
  graph.relations[0].points = [
    { x: 424, y: 88 },
    { x: 448, y: 88 },
    { x: 448, y: 160 },
    { x: 192, y: 160 },
    { x: 192, y: 240 },
    { x: 496, y: 240 },
    { x: 496, y: 72 },
    { x: 520, y: 72 },
  ];
  for (const reverse of [false, true]) {
    const selected = structuredClone(graph);
    if (reverse) {
      [selected.relations[0].source, selected.relations[0].target] = [
        selected.relations[0].target,
        selected.relations[0].source,
      ];
      selected.relations[0].points.reverse();
    }
    const before = structuredClone(selected);
    assert.doesNotThrow(() => auditInteractiveGeometry(selected));
    assert.throws(() => auditIntrinsicGeometry(selected), {
      code: "render_interactive_layout_infeasible",
    });
    await routeIntrinsicGeometry(selected, { automatic: true });
    assert.deepEqual(selected.nodes, before.nodes);
    assert.equal(selected.relations[0].source, before.relations[0].source);
    assert.equal(selected.relations[0].target, before.relations[0].target);
    assert.doesNotThrow(() => auditIntrinsicGeometry(selected));
  }
});

test("packed intrinsic routing preserves unlabeled bidirectional relations and peer geometry", async () => {
  const { routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = graphFor(80, 160);
  graph.relations[0].direction = "bidirectional";
  graph.relations[0].points = [];
  const before = structuredClone(graph);
  await routePackedIntrinsicGeometry(graph);
  const dx = graph.nodes[0].x - before.nodes[0].x;
  const dy = graph.nodes[0].y - before.nodes[0].y;
  for (const [index, node] of graph.nodes.entries()) {
    assert.equal(node.x - before.nodes[index].x, dx);
    assert.equal(node.y - before.nodes[index].y, dy);
    assert.equal(node.width, before.nodes[index].width);
    assert.equal(node.height, before.nodes[index].height);
  }
  assert.equal(graph.relations[0].direction, "bidirectional");
  assert.equal(graph.relations[0].label, null);
  assert.equal(graph.relations[0].source, before.relations[0].source);
  assert.equal(graph.relations[0].target, before.relations[0].target);
  assert(graph.relations[0].points.length >= 2);
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("intrinsic final admission rejects sub-floor route rhythm without mutating it", async () => {
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = graphFor(6, 80);
  const before = structuredClone(graph);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  assert.throws(() => auditIntrinsicGeometry(graph), {
    code: "render_interactive_layout_infeasible",
  });
  assert.deepEqual(graph, before);
});

test("intrinsic candidate admission retains the native minimum distance between endpoint ports", async () => {
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  for (const gap of [16, 23.5]) {
    const graph = graphFor(0, gap);
    graph.relations[0].points = [graph.relations[0].points[0], graph.relations[0].points.at(-1)];
    const before = structuredClone(graph);
    assert.doesNotThrow(() => auditInteractiveGeometry(graph));
    assert.throws(() => auditIntrinsicGeometry(graph), {
      code: "render_interactive_layout_infeasible",
    });
    assert.deepEqual(graph, before);
  }
  const graph = graphFor(0, marks.routeEndpointStub);
  graph.relations[0].points = [graph.relations[0].points[0], graph.relations[0].points.at(-1)];
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("automatic routing rejects a native seed that runs along its endpoint side", async () => {
  const { routeIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = graphFor(0, 100);
  const source = graph.nodes[0],
    target = graph.nodes[1];
  graph.relations[0].points = [
    { x: source.x, y: source.y + source.height / 2 },
    { x: target.x, y: target.y + target.height / 2 },
  ];
  const before = structuredClone(graph);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  assert.throws(() => auditIntrinsicGeometry(graph), {
    code: "render_interactive_layout_infeasible",
  });
  assert.deepEqual(graph, before);
  await routeIntrinsicGeometry(graph, { automatic: true });
  assert.deepEqual(graph.nodes, before.nodes);
  assert.notDeepEqual(graph.relations[0].points, before.relations[0].points);
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("automatic incoming ports avoid native arrowhead collisions without moving accepted routes", async () => {
  const route = await routing();
  const graph = incomingArrowGraph();
  const before = structuredClone(graph);
  await route(graph, { automatic: true });
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.relations[0], before.relations[0]);
  assert.deepEqual(
    collectArrowheadCollisions({
      routedRelations: graph.relations.map((relation) => ({
        relation: {
          id: relation.id,
          from: relation.source,
          to: relation.target,
          variant: relation.variant,
        },
        points: relation.points.map(({ x, y }) => [x, y]),
      })),
    }),
    [],
  );
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("geometry admission rejects diagonal segments without mutating the candidate", () => {
  const graph = graphFor(41, 80);
  graph.relations[0].points[1].x += 1;
  const before = structuredClone(graph);
  assert.throws(() => auditInteractiveGeometry(graph), {
    code: "render_interactive_layout_infeasible",
  });
  assert.deepEqual(graph, before);
});

test("intrinsic admission enforces the literal arrow terminal before scene conversion", async () => {
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = graphFor(41, 80);
  const relation = graph.relations[0];
  const start = relation.points[0];
  const end = relation.points.at(-1);
  relation.nativeArrow = false;
  relation.arrowGeometry = { length: 10, halfWidth: 3.2, strokeWidth: 1.4 };
  relation.points = [
    start,
    { x: start.x, y: end.y - 10.125 },
    { x: end.x, y: end.y - 10.125 },
    end,
  ];
  const before = structuredClone(graph);
  assert.throws(() => auditIntrinsicGeometry(graph), {
    code: "render_interactive_layout_infeasible",
  });
  assert.deepEqual(graph, before);
  relation.points[1].y = end.y - 14;
  relation.points[2].y = end.y - 14;
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("native grid search requires clear mandatory endpoint corridors before allocating its graph", async () => {
  const { gridEndpointCorridorsClear } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const input = {
    start: [100, 100],
    end: [300, 100],
    fromSide: "right",
    toSide: "left",
    endpointStubPx: 24,
    bounds: { width: 400, height: 200 },
    obstacles: [],
    segments: [],
  };
  assert.equal(typeof gridEndpointCorridorsClear, "function");
  for (const [changes, expected] of [
    [{}, true],
    [{ obstacles: [{ x: 108, y: 96, width: 8, height: 8 }] }, false],
    [{ obstacles: [{ x: 280, y: 96, width: 8, height: 8 }] }, false],
    [{ obstacles: [{ x: 150, y: 96, width: 8, height: 8 }] }, true],
    [{ segments: [{ start: [108, 101], end: [120, 101] }] }, false],
    [{ segments: [{ start: [110, 80], end: [110, 120] }] }, true],
    [{ fromSide: "left", start: [12, 100] }, false],
    [{ toSide: "right", end: [388, 100] }, false],
  ]) {
    const selected = { ...input, ...changes };
    const before = structuredClone(selected);
    assert.equal(gridEndpointCorridorsClear(selected), expected);
    assert.deepEqual(selected, before);
  }
});
