import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";
import { expandBox, segmentHitsBox } from "../packages/publisher/src/scene/geometry.mjs";
import { auditInteractiveGeometry } from "../packages/publisher/renderers/elk/audit.mjs";
import { auditIntrinsicGeometry } from "../packages/publisher/renderers/archify/routing-contract.mjs";
import { intrinsicArchitectureFrame } from "../packages/publisher/renderers/archify/legend.mjs";
import {
  automaticPortSpread,
  collectAmbiguousCorridors,
  collectRouteRhythmIssues,
} from "../packages/publisher/renderers/archify/supply/renderers/shared/geometry.mjs";
import { emptyLabel, graphFor, routing, facingGraph } from "./fixtures/intrinsic-routing.mjs";

test("intrinsic frames reserve complete measured content without explicit-input canvas minima", () => {
  const measured = {
    entries: [{ width: 88 }],
    spacing: {
      columnGap: 24,
      rowAdvance: 32,
      contentGap: 24,
      height: 42,
      bottomInset: 16,
    },
  };
  const before = structuredClone(measured);
  const compact = intrinsicArchitectureFrame({ width: 260, height: 64 }, 8, measured);
  assert.deepEqual(compact.viewport, { width: 276, height: 162 });
  assert.equal(compact.legend.top, 104);
  assert.equal(compact.legend.footprint.rowCount, 1);
  assert.deepEqual(intrinsicArchitectureFrame({ width: 820, height: 440 }, 8, measured).viewport, {
    width: 836,
    height: 538,
  });
  assert.deepEqual(
    intrinsicArchitectureFrame({ width: 48, height: 38 }, 4, {
      entries: [],
      spacing: { height: 0, bottomInset: 0 },
    }).viewport,
    { width: 56, height: 46 },
  );
  assert.deepEqual(measured, before);
});

test("intrinsic routes reserve readable space beside unrelated node frames", async () => {
  const route = await routing();
  const graph = {
    bounds: { width: 650, height: 440 },
    groups: [],
    nodes: [
      { id: "source", x: 40, y: 180, width: 120, height: 60 },
      { id: "target", x: 430, y: 180, width: 120, height: 60 },
      { id: "nearby", x: 230, y: 100, width: 120, height: 107 },
    ].map((node) => ({ ...node, label: emptyLabel() })),
    relations: [
      {
        id: "related",
        source: "source",
        target: "target",
        direction: "forward",
        label: null,
        points: [
          { x: 160, y: 210 },
          { x: 430, y: 210 },
        ],
      },
    ],
  };
  const before = structuredClone(graph);
  assert.throws(() => auditIntrinsicGeometry(graph), {
    code: "render_interactive_layout_infeasible",
  });
  await route(graph);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.bounds, before.bounds);
  assert.deepEqual(graph.relations[0].points[0], before.relations[0].points[0]);
  assert.deepEqual(graph.relations[0].points.at(-1), before.relations[0].points.at(-1));
  const clearance =
    marks.readingGap / 2 + (marks.selectedNodeStroke + marks.selectedRouteStroke) / 2;
  const reserve = expandBox(graph.nodes[2], clearance);
  const points = graph.relations[0].points;
  assert(points.slice(1).every((point, index) => !segmentHitsBox(points[index], point, reserve)));
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});

test("automatic composition admits its route and complete movable label together", async () => {
  const route = await routing();
  const graph = facingGraph({ label: true });
  const before = structuredClone(graph);
  await assert.rejects(() => route(structuredClone(graph)), {
    code: "render_interactive_layout_infeasible",
  });
  await route(graph, { automatic: true });
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.relations[0].label.lines, before.relations[0].label.lines);
  assert.equal(graph.relations[0].label.width, before.relations[0].label.width);
  assert.equal(graph.relations[0].label.height, before.relations[0].label.height);
  assert.equal(graph.relations[0].label.fontSize, before.relations[0].label.fontSize);
  assert.notDeepEqual(graph.relations[0].label.paintBox, before.relations[0].label.paintBox);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  assert.deepEqual(
    collectRouteRhythmIssues({
      routedRelations: [{ points: graph.relations[0].points.map(({ x, y }) => [x, y]) }],
    }),
    [],
  );
});

test("adding native fanout preserves accepted endpoints and separates actual route strokes", async () => {
  const route = await routing();
  const node = (id, x, y, width, height) => ({
    id,
    x,
    y,
    width,
    height,
    label: emptyLabel(),
  });
  const nodes = [
    node("source", 64, 320, 176, 80),
    ...Array.from({ length: 8 }, (_, index) =>
      node(`target-${index}`, 850, 40 + 80 * index, 100, 40),
    ),
    node("added", 850, 85, 100, 20),
    node("roof", 64, 230, 176, 80),
  ];
  const components = new Map(
    nodes.map((value) => [
      value.id,
      { ...value, cx: value.x + value.width / 2, cy: value.y + value.height / 2 },
    ]),
  );
  const connections = Array.from({ length: 8 }, (_, index) => ({
    id: `edge-${index}`,
    from: "source",
    to: `target-${index}`,
    fromSide: "right",
    toSide: "left",
  }));
  const spread = automaticPortSpread(connections, components);
  const relations = connections.map((connection, index) => {
    const start = spread.get(connection).from;
    // Keep the original eight routes clear even at the selected paint width.
    const end = [850, index === 4 ? 390 : 60 + 80 * index];
    return {
      id: connection.id,
      source: connection.from,
      target: connection.to,
      direction: "forward",
      label: null,
      points: [start, [400 + 40 * index, start[1]], [400 + 40 * index, end[1]], end].map(
        ([x, y]) => ({ x, y }),
      ),
    };
  });
  assert.doesNotThrow(() =>
    auditInteractiveGeometry({
      bounds: { width: 1040, height: 760 },
      nodes,
      groups: [],
      relations,
    }),
  );
  relations.push({
    id: "added",
    source: "source",
    target: "added",
    direction: "forward",
    label: null,
    points: [
      [152, 320],
      [152, 296],
      [900, 296],
      [900, 85],
    ].map(([x, y]) => ({ x, y })),
  });
  const graph = { bounds: { width: 1040, height: 760 }, nodes, groups: [], relations };
  const before = structuredClone(graph);
  try {
    await route(graph, { automatic: true });
  } catch (error) {
    assert.equal(error.code, "render_interactive_layout_infeasible");
    assert.deepEqual(graph, before, "failed candidates must not publish partial geometry");
    return;
  }
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.relations.slice(0, 8), before.relations.slice(0, 8));
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  const segments = (relation) =>
    relation.points.slice(1).map((end, index) => [relation.points[index], end]);
  for (const [index, left] of graph.relations.entries()) {
    for (const right of graph.relations.slice(index + 1)) {
      for (const [a, b] of segments(left)) {
        for (const [c, d] of segments(right)) {
          const horizontal = a.y === b.y && c.y === d.y;
          const vertical = a.x === b.x && c.x === d.x;
          if (!horizontal && !vertical) continue;
          const along = horizontal ? "x" : "y";
          const across = horizontal ? "y" : "x";
          const overlap =
            Math.min(Math.max(a[along], b[along]), Math.max(c[along], d[along])) -
            Math.max(Math.min(a[along], b[along]), Math.min(c[along], d[along]));
          if (overlap > 0)
            assert(
              Math.abs(a[across] - c[across]) >= 3.5,
              `${left.id}/${right.id}: selected 3.5px strokes must remain distinct`,
            );
        }
      }
    }
  }
});

test("automatic composition reconsiders sides when the first endpoint has no escape", async () => {
  const route = await routing();
  const graph = facingGraph({ blockedTop: true });
  const before = structuredClone(graph);
  await assert.rejects(() => route(structuredClone(graph)), {
    code: "render_interactive_layout_infeasible",
  });
  await route(graph, { automatic: true });
  assert.deepEqual(graph.nodes, before.nodes);
  assert.notDeepEqual(graph.relations[0].points[0], before.relations[0].points[0]);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("independent routes cannot reuse an occupied corridor, even from the same node", async () => {
  const route = await routing();
  for (const sharedNode of [false, true]) {
    const source = {
      id: "source-a",
      x: 400,
      y: 80,
      width: 160,
      height: sharedNode ? 180 : 80,
      label: emptyLabel(),
    };
    const secondSource = sharedNode
      ? source
      : {
          id: "source-b",
          x: 600,
          y: 180,
          width: 160,
          height: 80,
          label: emptyLabel(),
        };
    const targets = ["target-a", "target-b"].map((id, index) => ({
      id,
      x: 400,
      y: 540 + index * 120,
      width: 160,
      height: 80,
      label: emptyLabel(),
    }));
    const graph = {
      bounds: { width: 820, height: 800 },
      nodes: [source, ...(!sharedNode ? [secondSource] : []), ...targets],
      groups: [],
      relations: [source, secondSource].map((node, index) => ({
        id: `edge-${index}`,
        source: node.id,
        target: targets[index].id,
        direction: "forward",
        label: null,
        points: [
          { x: node.x, y: 150 + index * 50 },
          { x: 300, y: 150 + index * 50 },
          { x: 300, y: targets[index].y + 40 },
          { x: targets[index].x, y: targets[index].y + 40 },
        ],
      })),
    };
    const before = structuredClone(graph);
    await route(graph);
    assert.deepEqual(graph.nodes, before.nodes);
    assert.deepEqual(graph.relations[0], before.relations[0]);
    for (const [index, edge] of graph.relations.entries()) {
      assert.deepEqual(edge.points[0], before.relations[index].points[0]);
      assert.deepEqual(edge.points.at(-1), before.relations[index].points.at(-1));
    }
    const routedRelations = graph.relations.map((edge) => ({
      relation: { id: edge.id, from: edge.source, to: edge.target },
      points: edge.points.map(({ x, y }) => [x, y]),
    }));
    assert.deepEqual(
      collectAmbiguousCorridors({
        routedRelations,
        includeSharedEndpoints: () => true,
      }),
      [],
      "independent physical routes must remain visually separate",
    );
    assert.deepEqual(collectRouteRhythmIssues({ routedRelations }), []);
    assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  }
});

test("opposed route channels reserve the complete neighbouring stroke before placement", async () => {
  const route = await routing();
  const nodes = [
    { id: "work", x: 533.5, y: 648, width: 176, height: 112, label: emptyLabel() },
    { id: "tree", x: 533, y: 808, width: 176, height: 64, label: emptyLabel() },
    { id: "proof", x: 633.5, y: 920, width: 176, height: 96, label: emptyLabel() },
    { id: "write", x: 433.5, y: 920, width: 176, height: 112, label: emptyLabel() },
  ];
  const relation = (id, source, target, points) => ({
    id,
    source,
    target,
    direction: "forward",
    label: null,
    points: points.map(([x, y]) => ({ x, y })),
  });
  const graph = {
    bounds: { width: 1000, height: 1100 },
    nodes,
    groups: [],
    relations: [
      relation("evidence", "work", "proof", [
        [533.5, 704],
        [509.5, 704],
        [509.5, 896],
        [721.5, 896],
        [721.5, 920],
      ]),
      relation("write-check", "tree", "write", [
        [621, 872],
        [621, 895],
        [521.5, 895],
        [521.5, 920],
      ]),
    ],
  };
  const before = structuredClone(graph);
  await route(graph);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.relations[0], before.relations[0]);
  assert.notDeepEqual(graph.relations[1].points, before.relations[1].points);
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("native grid routing reserves the complete canvas stroke and chooses the inside corridor", async () => {
  const route = await routing();
  const graph = {
    bounds: { width: 410, height: 410 },
    nodes: [
      { id: "source", x: 100, y: 20, width: 80, height: 60 },
      { id: "target", x: 100, y: 320, width: 80, height: 60 },
      { id: "barrier", x: 8.213996887207, y: 130, width: 264, height: 100 },
    ].map((node) => ({ ...node, label: emptyLabel() })),
    groups: [],
    relations: [
      {
        id: "connection",
        source: "source",
        target: "target",
        direction: "forward",
        label: null,
        points: [
          { x: 140, y: 80 },
          { x: 140, y: 320 },
        ],
      },
    ],
  };
  const before = structuredClone(graph);
  await route(graph);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.bounds, before.bounds);
  assert.deepEqual(graph.relations[0].points[0], before.relations[0].points[0]);
  assert.deepEqual(graph.relations[0].points.at(-1), before.relations[0].points.at(-1));
  assert(graph.relations[0].points.some(({ x }) => x > 272.213996887207));
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("a canvas boundary is a closed routing obstacle rather than a crossable relationship", async () => {
  const route = await routing();
  const graph = {
    bounds: { width: 500, height: 440 },
    groups: [],
    nodes: [
      { id: "source", x: 30, y: 40, width: 112, height: 64 },
      { id: "target", x: 30, y: 300, width: 112, height: 64 },
      { id: "bar", x: 1.75, y: 170, width: 280, height: 48 },
    ].map((node) => ({ ...node, label: emptyLabel() })),
    relations: [
      {
        id: "inside",
        source: "source",
        target: "target",
        direction: "forward",
        label: null,
        points: [
          { x: 86, y: 104 },
          { x: 86, y: 300 },
        ],
      },
    ],
  };
  const before = structuredClone(graph);
  await route(graph);
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.bounds, before.bounds);
  assert.deepEqual(graph.relations[0].points[0], before.relations[0].points[0]);
  assert.deepEqual(graph.relations[0].points.at(-1), before.relations[0].points.at(-1));
  assert(graph.relations[0].points.some(({ x }) => x > 281.75));
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
});

test("automatic search retains exact obstacle channels while final route rhythm stays bounded", async () => {
  const route = await routing();
  const graph = JSON.parse(
    await readFile(new URL("./fixtures/intrinsic-fan-in.json", import.meta.url), "utf8"),
  );
  const before = structuredClone(graph);
  await route(graph, { automatic: true });
  assert.deepEqual(graph.nodes, before.nodes);
  assert.deepEqual(graph.bounds, before.bounds);
  assert.deepEqual(
    graph.relations.map(({ id, source, target, label }) => ({
      id,
      source,
      target,
      lines: label?.lines,
    })),
    before.relations.map(({ id, source, target, label }) => ({
      id,
      source,
      target,
      lines: label?.lines,
    })),
  );
  assert.deepEqual(graph.relations.slice(0, -1), before.relations.slice(0, -1));
  assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  assert.deepEqual(
    collectRouteRhythmIssues({
      routedRelations: graph.relations.map((relation) => ({
        points: relation.points.map(({ x, y }) => [x, y]),
      })),
      interiorSegmentPx: marks.routeInteriorSegment,
      endpointStubPx: marks.routeEndpointStub,
    }),
    [],
  );
});

test("intrinsic routing resolves opposed stub overlap and sub-floor lateral offsets", async () => {
  const route = await routing();
  for (const [offset, gap] of [
    [41, 44],
    [4, 452],
    [15.9, 44],
    [41, 18],
  ]) {
    const graph = graphFor(offset, gap);
    const before = structuredClone(graph);
    await route(graph);
    assert.deepEqual(graph.nodes, before.nodes);
    assert.deepEqual(graph.groups, before.groups);
    assert.deepEqual(graph.bounds, before.bounds);
    const points = graph.relations[0].points;
    assert.deepEqual(points[0], before.relations[0].points[0]);
    assert.deepEqual(points.at(-1), before.relations[0].points.at(-1));
    assert.deepEqual(
      collectRouteRhythmIssues({
        routedRelations: [{ points: points.map(({ x, y }) => [x, y]) }],
      }),
      [],
    );
    assert.doesNotThrow(() => auditInteractiveGeometry(graph));
  }
});

test("an unlabeled directed relationship has no painted-label reservation", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "unlabeled-directed",
    title: "Selected source relationship",
    subtitle: "No label was declared",
    nodes: [
      { id: "from", label: "Alpha", visualRole: "backend" },
      { id: "to", label: "Beta", visualRole: "backend" },
    ],
    groups: [],
    edges: [{ id: "declared", from: "from", to: "to", label: "", visualRole: "default" }],
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene, null, undefined, "source");
  assert.deepEqual(scene, before);
  assert.equal(result.scene.edges.length, 1);
  assert.equal(result.scene.edges[0].label, "");
  assert.equal(result.scene.edges[0].from, "from");
  assert.equal(result.scene.edges[0].to, "to");
  assert.equal(result.physical.edges.declared.label, null);
  assert.ok(result.physical.edges.declared.points.length >= 2);
  for (const node of scene.nodes)
    assert.equal(
      result.nodeText.layouts[node.id].rows
        .filter((row) => row.field === "label")
        .map((row) => row.text)
        .join(""),
      node.label,
    );
});
