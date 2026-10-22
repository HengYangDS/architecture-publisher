import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { page, measurePages, selected } from "./fixtures/elk-layout.mjs";

test("exact geometry preserves complete parallel, cycle, and self-loop routes and source meaning", async () => {
  const { layoutInteractivePages } = await selected();
  const input = page();
  const original = structuredClone(input);
  const first = await layoutInteractivePages([input], await measurePages([input]));
  const second = await layoutInteractivePages([input], await measurePages([input]));
  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.match(first.supplySha256, /^[0-9a-f]{64}$/u);
  const graph = first.layouts[0];
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.relations.length, 5);
  assert.equal(new Set(graph.nodes.map(({ width, height }) => `${width}:${height}`)).size, 1);
  assert.deepEqual(
    graph.relations.map(({ id, source, target }) => ({ id, source, target })),
    input.relations.map(({ id, source, target }) => ({ id, source, target })),
  );
  assert.notDeepEqual(graph.relations[0].points, graph.relations[1].points);
  assert(graph.relations[4].points.length >= 4);
  for (const relation of graph.relations) {
    assert(relation.points.length >= 2);
    for (const [index, point] of relation.points.entries()) {
      assert(Number.isFinite(point.x) && Number.isFinite(point.y));
      const next = relation.points[index + 1];
      if (next) assert(point.x === next.x || point.y === next.y);
    }
    assert.equal(
      relation.label.lines.join(" "),
      input.relations.find(({ id }) => id === relation.id).graphLabel,
    );
  }
  assert(!JSON.stringify(graph).includes("$H"));
});

test("group-container offsets preserve cross-group, intra-group, and self-loop contacts", async () => {
  const { layoutInteractivePages } = await selected();
  const input = page();
  input.groups = [
    { id: "g-0", label: "Source ownership", nodeIds: ["n-0"] },
    { id: "g-1", label: "Execution", nodeIds: ["n-1", "n-2"] },
  ];
  const graph = (await layoutInteractivePages([input], await measurePages([input]))).layouts[0];
  assert.equal(graph.groups.length, 2);
  for (const group of graph.groups) {
    const members = input.groups.find(({ id }) => id === group.id).nodeIds;
    for (const id of members) {
      const node = graph.nodes.find((item) => item.id === id);
      assert(node.x >= group.x && node.y >= group.y);
      assert(node.x + node.width <= group.x + group.width);
      assert(node.y + node.height <= group.y + group.height);
    }
    assert(group.label.paintBox.x >= group.x + 8);
    assert(group.label.paintBox.y >= group.y + 8);
  }
  for (const relation of graph.relations) {
    for (const [id, point] of [
      [relation.source, relation.points[0]],
      [relation.target, relation.points.at(-1)],
    ]) {
      const node = graph.nodes.find((item) => item.id === id);
      assert(point.x >= node.x - 0.01 && point.x <= node.x + node.width + 0.01);
      assert(point.y >= node.y - 0.01 && point.y <= node.y + node.height + 0.01);
      assert(
        Math.min(
          Math.abs(point.x - node.x),
          Math.abs(point.x - node.x - node.width),
          Math.abs(point.y - node.y),
          Math.abs(point.y - node.y - node.height),
        ) < 0.01,
      );
    }
  }
});

test("measured group headings occupy a top band without lateral title reservation", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: [
      { id: "source", label: "Source" },
      { id: "execution", label: "Execution" },
    ],
    relations: [{ id: "handoff", source: "source", target: "execution" }],
    groups: [
      { id: "source-owner", label: "Source responsibility", nodeIds: ["source"] },
      { id: "runtime-owner", label: "Execution responsibility", nodeIds: ["execution"] },
    ],
  };
  const original = structuredClone(input);
  const label = (text, width) => ({
    lines: [text],
    width,
    height: 32,
    fontSize: 12,
    weight: "600",
    baselines: [{ text, x: 8, baseline: 20, box: { x: 8, y: 8, width: width - 16, height: 14 } }],
  });
  const graph = (
    await layoutInteractivePages([input], null, {
      nodeFootprints: [
        {
          source: { width: 96, height: 40, label: label("Source", 64) },
          execution: { width: 96, height: 40, label: label("Execution", 80) },
        },
      ],
      groupFootprints: [
        {
          "source-owner": label("Source responsibility", 192),
          "runtime-owner": label("Execution responsibility", 208),
        },
      ],
    })
  ).layouts[0];
  assert.deepEqual(input, original);
  for (const [id, maximumWidth] of [
    ["source-owner", 240],
    ["runtime-owner", 256],
  ]) {
    const group = graph.groups.find((item) => item.id === id);
    const node = graph.nodes.find((item) => item.groupId === id);
    assert(
      group.width <= maximumWidth,
      `A measured heading and its 24px insets must not reserve a second lateral title: ${group.width}`,
    );
    assert.equal(node.x + node.width / 2, group.x + group.width / 2);
    assert(group.label.x >= group.x + 24);
    assert(group.label.x + group.label.width <= group.x + group.width - 24);
    assert(group.label.y >= group.y + 24);
    assert(node.y >= group.label.y + group.label.height + 24);
  }
  assert.deepEqual(
    graph.relations.map(({ id, source, target }) => ({ id, source, target })),
    input.relations,
  );
  const edge = graph.relations[0];
  for (const [id, point] of [
    [edge.source, edge.points[0]],
    [edge.target, edge.points.at(-1)],
  ]) {
    const node = graph.nodes.find((item) => item.id === id);
    assert(point.x >= node.x && point.x <= node.x + node.width);
    assert(point.y >= node.y && point.y <= node.y + node.height);
    assert(
      point.x === node.x ||
        point.x === node.x + node.width ||
        point.y === node.y ||
        point.y === node.y + node.height,
    );
  }
});

test("native branch handoff keeps complete route-caption pairs through the receiving geometry owner", async () => {
  const { layoutInteractivePages } = await selected();
  const { routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const ids = ["entry", "a-0", "a-1", "a-2", "b-0", "b-1", "b-2", "exit"];
  const input = {
    nodes: ids.map((id) => ({ id, label: id })),
    relations: ["a", "b"].flatMap((branch) => {
      const chain = ["entry", `${branch}-0`, `${branch}-1`, `${branch}-2`, "exit"];
      return chain.slice(1).map((target, index) => ({
        id: `${branch}-${index}-handoff`,
        source: chain[index],
        target,
        graphLabel: "Exact  selected relationship",
      }));
    }),
  };
  const label = {
    lines: ["Exact  selected", "relationship"],
    width: 112,
    height: 64,
    fontSize: 12,
    weight: "400",
    baselines: [
      { text: "Exact  selected", x: 8, baseline: 24, box: { x: 8, y: 10, width: 96, height: 14 } },
      { text: "relationship", x: 8, baseline: 48, box: { x: 8, y: 34, width: 88, height: 14 } },
    ],
  };
  const empty = { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] };
  const footprints = Object.fromEntries(
    ids.map((id) => [id, { width: 96, height: 64, label: empty }]),
  );
  const before = structuredClone(input);
  let nativePairs = 0;
  const result = await layoutInteractivePages([input], null, {
    nodeFootprints: [footprints],
    relationFootprints: [Object.fromEntries(input.relations.map(({ id }) => [id, label]))],
    composePackedCandidate: async (graph) => {
      for (const relation of graph.relations.filter(({ points }) => points.length)) {
        nativePairs++;
        assert.deepEqual(relation.label.lines, ["Exact  selected", "relationship"]);
        assert.equal(relation.label.width, 112);
        assert.equal(relation.label.height, 64);
        assert(relation.label.x > 0 || relation.label.y > 0, "A native caption is positioned");
        for (const [index, line] of relation.label.baselines.entries()) {
          assert.equal(line.box.x, relation.label.x + label.baselines[index].box.x);
          assert.equal(line.box.y, relation.label.y + label.baselines[index].box.y);
        }
      }
      await routePackedIntrinsicGeometry(graph);
      assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
    },
  });
  assert(nativePairs > 0, "Native root routes and captions must reach the receiving owner");
  assert.equal(result.layouts[0].relations.length, 8);
  for (const relation of result.layouts[0].relations) {
    assert.deepEqual(relation.label.lines, ["Exact  selected", "relationship"]);
    assert.equal(relation.label.baselines.length, 2);
  }
  assert.deepEqual(input, before);
});

test("the geometry owner measures all text and rejects unsupported or infeasible glyphs", async () => {
  const { layoutInteractivePages } = await selected();
  await assert.rejects(layoutInteractivePages([page()]), {
    code: "render_interactive_text_measurement_required",
  });
  for (const mutate of [
    (value) => {
      value.nodes[0].label = "x".repeat(200);
    },
    (value) => {
      value.nodes[0].label = "missing 🦄 glyph";
    },
    (value) => {
      value.relations[0].graphLabel = "x".repeat(200);
    },
    (value) => {
      value.groups = [
        { id: "g-0", label: "x".repeat(200), nodeIds: value.nodes.map(({ id }) => id) },
      ];
    },
  ]) {
    const input = page();
    mutate(input);
    await assert.rejects(
      async () => layoutInteractivePages([input], await measurePages([input])),
      (error) =>
        ["render_interactive_text_infeasible", "authored_canvas_glyph_missing"].includes(
          error.code,
        ),
    );
  }
  const input = page();
  input.nodes[0].label = "Exact selected configuration ownership";
  const original = structuredClone(input);
  const graph = (await layoutInteractivePages([input], await measurePages([input]))).layouts[0];
  assert.deepEqual(input, original);
  assert.equal(graph.nodes[0].label.lines.join(" "), input.nodes[0].label);
  assert(graph.nodes[0].label.lines.length > 1);
});

test("invalid graph identities and incomplete group ownership fail before layout", async () => {
  const { layoutInteractivePages, measure } = await selected();
  for (const input of [null, [], {}, [null]])
    await assert.rejects(layoutInteractivePages(input, measure), {
      code: "render_interactive_layout_invalid",
    });
  for (const mutate of [
    (value) => {
      value.nodes[0].label = " ";
    },
    (value) => {
      value.nodes[1].id = value.nodes[0].id;
    },
    (value) => {
      value.relations[0].target = "not-selected";
    },
    (value) => {
      value.relations.push({ ...value.relations[0] });
    },
  ]) {
    const input = page();
    mutate(input);
    await assert.rejects(layoutInteractivePages([input], measure), {
      code: "render_interactive_layout_invalid",
    });
  }
  const input = page();
  input.groups = [{ id: "g-0", label: "Incomplete", nodeIds: ["n-0"] }];
  await assert.rejects(async () => layoutInteractivePages([input], await measurePages([input])), {
    code: "render_interactive_group_invalid",
  });
});

test("layout timeout and invalid worker output reclaim only the owned scratch and worker", async (t) => {
  const { layoutInteractivePages, measure } = await selected();
  const parent = path.resolve("build/test-work");
  await fs.mkdir(parent, { recursive: true });
  const work = await fs.mkdtemp(path.join(parent, "elk-lifetime-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  await assert.rejects(
    layoutInteractivePages([page()], measure, { temporaryDirectory: work, timeoutMs: 1 }),
    { code: "render_interactive_layout_execution_timeout" },
  );
  assert.deepEqual(await fs.readdir(work), []);
  await assert.rejects(
    layoutInteractivePages([page()], measure, { temporaryDirectory: work, maximumBytes: 1 }),
    { code: "render_interactive_layout_response_limit" },
  );
  assert.deepEqual(await fs.readdir(work), []);
});

test("resource, graph identity, group partition, and text bounds reject invalid requests", async () => {
  const { layoutInteractivePages, measure } = await selected();
  for (const options of [
    { timeoutMs: 0 },
    { timeoutMs: 25001 },
    { maximumBytes: 0 },
    { maximumBytes: 33 * 1024 * 1024 },
    { temporaryDirectory: "relative" },
    { readingViewport: null },
    { readingViewport: { width: 0, height: 574 } },
    { readingViewport: { width: Infinity, height: 574 } },
    { readingViewport: { width: 1240, height: Infinity } },
    { readingViewport: { width: 1240, height: 0 } },
  ])
    await assert.rejects(layoutInteractivePages([page()], measure, options), {
      code: "render_interactive_layout_execution_limit_invalid",
    });
  for (const mutate of [
    (p) => {
      p.nodes = null;
    },
    (p) => {
      p.relations = null;
    },
    (p) => {
      p.nodes = [];
    },
    (p) => {
      p.nodes[0].id = "root";
    },
    (p) => {
      p.relations[0].id = "";
    },
    (p) => {
      p.relations[0].direction = "reverse";
    },
    (p) => {
      p.nodes = Array.from({ length: 513 }, (_, i) => ({ id: String(i), label: "Node" }));
    },
    (p) => {
      p.relations = Array(2049).fill(p.relations[0]);
    },
  ]) {
    const input = page();
    mutate(input);
    await assert.rejects(layoutInteractivePages([input], measure), {
      code: "render_interactive_layout_invalid",
    });
  }
  const groupMeasure = await measurePages([
    {
      ...page(),
      groups: [{ id: "valid", label: "Owner", nodeIds: ["n-0", "n-1", "n-2"] }],
    },
  ]);
  for (const groups of [
    null,
    [],
    [{ id: "root", label: "Owner", nodeIds: ["n-0", "n-1", "n-2"] }],
    [{ id: "g-0", label: "Owner", nodeIds: ["n-0", "n-0", "n-1", "n-2"] }],
    [{ id: "g-0", label: "Owner", nodeIds: ["n-0", "n-1", "absent"] }],
  ])
    await assert.rejects(layoutInteractivePages([{ ...page(), groups }], groupMeasure), {
      code: "render_interactive_group_invalid",
    });
  for (const label of ["line\nbreak", "x".repeat(4097), Array(40).fill("selected").join(" ")]) {
    const input = page();
    input.relations[0].graphLabel = label;
    await assert.rejects(async () => layoutInteractivePages([input], await measurePages([input])), {
      code: "render_interactive_text_infeasible",
    });
  }
});
