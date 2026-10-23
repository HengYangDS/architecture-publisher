import assert from "node:assert/strict";
import test from "node:test";
import {
  routeIntrinsicGeometry,
  routePackedIntrinsicGeometry,
} from "../packages/publisher/renderers/archify/intrinsic-routing.mjs";
import { auditIntrinsicGeometry } from "../packages/publisher/renderers/archify/routing-contract.mjs";
import { graphFor, emptyLabel } from "./fixtures/intrinsic-routing.mjs";

test("packed routing translates declared groups and their caption ink with member nodes", async () => {
  const ink = { x: 32, y: 32, width: 100, height: 12 };
  const graph = {
    bounds: { width: 800, height: 480 },
    groups: [
      {
        id: "declared",
        x: 2,
        y: 2,
        width: 770,
        height: 460,
        label: {
          ...emptyLabel(),
          x: 26,
          y: 26,
          width: 128,
          height: 24,
          lines: ["Declared group"],
          weight: "600",
          baselines: [{ text: "Declared group", x: 32, baseline: 44, box: ink }],
          paintBox: ink,
        },
      },
    ],
    nodes: [
      { id: "source", x: 64, y: 100, width: 80, height: 60 },
      { id: "target", x: 64, y: 300, width: 80, height: 60 },
      { id: "barrier", x: 10, y: 190, width: 280, height: 48 },
    ].map((node) => ({ ...node, groupId: "declared", label: emptyLabel() })),
    relations: [
      {
        id: "connection",
        source: "source",
        target: "target",
        direction: "forward",
        points: [],
        label: null,
      },
    ],
  };
  const before = structuredClone(graph);
  await routePackedIntrinsicGeometry(graph);
  const dx = graph.nodes[0].x - before.nodes[0].x;
  const dy = graph.nodes[0].y - before.nodes[0].y;
  assert(dx > 0 || dy > 0, "the obstructed route must exercise frame translation");
  const group = graph.groups[0];
  const prior = before.groups[0];
  assert.deepEqual(
    { x: group.x, y: group.y, width: group.width, height: group.height },
    { x: prior.x + dx, y: prior.y + dy, width: prior.width, height: prior.height },
  );
  assert.equal(group.label.x, prior.label.x + dx);
  assert.equal(group.label.y, prior.label.y + dy);
  assert.deepEqual(group.label.lines, prior.label.lines);
  assert.deepEqual(group.label.paintBox, { ...ink, x: ink.x + dx, y: ink.y + dy });
  assert.deepEqual(group.label.baselines, [
    {
      text: "Declared group",
      x: 32 + dx,
      baseline: 44 + dy,
      box: { ...ink, x: ink.x + dx, y: ink.y + dy },
    },
  ]);
  for (const [index, node] of graph.nodes.entries()) {
    assert.equal(node.groupId, before.nodes[index].groupId);
    assert.equal(node.x - group.x, before.nodes[index].x - prior.x);
    assert.equal(node.y - group.y, before.nodes[index].y - prior.y);
  }
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("routing reports unchanged node ink collisions before trying to repair routes", async () => {
  for (const route of [
    routeIntrinsicGeometry,
    (graph) => routeIntrinsicGeometry(graph, { automatic: true }),
    routePackedIntrinsicGeometry,
  ]) {
    const graph = graphFor(41, 44);
    const source = graph.nodes[0];
    source.label = {
      ...emptyLabel(),
      lines: ["First line", "Second line"],
      baselines: ["First line", "Second line"].map((text, index) => ({
        text,
        x: source.x + 80,
        baseline: source.y + 36 + index * 14,
        box: { x: source.x + 20, y: source.y + 24 + index * 14, width: 120, height: 12 },
      })),
    };
    const before = structuredClone(graph);
    await assert.rejects(route(graph), (error) => {
      assert.equal(error.code, "render_interactive_layout_infeasible");
      assert.match(error.message, /text-collision:source$/u);
      return true;
    });
    assert.deepEqual(graph, before);
  }
});

test("selected routing never promotes the unqualified obstacle experiment", async () => {
  const graph = graphFor(41, 44);
  const before = structuredClone(graph);
  await routeIntrinsicGeometry(graph);
  assert.equal(graph.nativeRoutingSupply, undefined);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.bounds, before.bounds);
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("the isolated obstacle experiment binds its supply without mutating selected geometry", async () => {
  const { routeNativeObstacles } = await import("../packages/publisher/renderers/avoid/index.mjs");
  const { nodeRouteClearance, clearance } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const graph = graphFor(96, 180);
  const ink = { x: 300, y: 225, width: 160, height: 14 };
  graph.relations[0].label = {
    ...emptyLabel(),
    lines: ["Exact relationship"],
    x: 292,
    y: 217,
    width: 176,
    height: 32,
    baselines: [{ text: "Exact relationship", x: 380, baseline: 237, box: ink }],
    paintBox: ink,
  };
  const before = structuredClone(graph);
  const result = await routeNativeObstacles(graph, {
    node: nodeRouteClearance + 0.25,
    text: clearance + 0.25,
    stub: 24,
  });
  assert.equal(result.supply.id, "native-obstacle-routing");
  assert.match(result.supply.sha256, /^[a-f0-9]{64}$/u);
  assert.deepEqual(graph, before);
  graph.relations[0].points = result.routes[0].points;
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.groups, before.groups);
  assert.deepEqual(graph.relations[0].label, before.relations[0].label);
  assert.deepEqual(graph.relations[0].points[0], before.relations[0].points[0]);
  assert.deepEqual(graph.relations[0].points.at(-1), before.relations[0].points.at(-1));
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});
