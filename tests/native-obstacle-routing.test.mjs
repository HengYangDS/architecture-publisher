import assert from "node:assert/strict";
import test from "node:test";
import {
  routeIntrinsicGeometry,
  routePackedIntrinsicGeometry,
} from "../packages/publisher/renderers/archify/intrinsic-routing.mjs";
import { auditIntrinsicGeometry } from "../packages/publisher/renderers/archify/routing-contract.mjs";
import { graphFor, emptyLabel } from "./fixtures/intrinsic-routing.mjs";

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
