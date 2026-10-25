import assert from "node:assert/strict";
import test from "node:test";
import { composeStaticGeometry } from "../packages/publisher/src/compiler/static-geometry.mjs";
import { checkedGroupHeading } from "../packages/publisher/renderers/svg/edition-geometry.mjs";

test("compound static composition wraps a long causal chain on aligned native group tracks", async () => {
  const ids = Array.from({ length: 8 }, (_, index) => `component-${index}`);
  const input = {
    nodes: ids.map((id) => ({ id, label: id, kind: "service" })),
    groups: ids.map((id, index) => ({
      id: `stage-${index}`,
      label: `Declared stage ${index}`,
      members: [id],
    })),
    relations: ids.slice(1).map((to, index) => ({
      id: `relation-${index}`,
      from: ids[index],
      to,
      text: "delegates",
    })),
  };
  const result = await composeStaticGeometry(input);
  const groups = result.layout.groups;
  assert(
    new Set(groups.map(({ y }) => y)).size > 1,
    "A long chain must not be forced into one strip",
  );
  assert(
    groups.some((group, index) => groups.slice(index + 1).some((other) => other.y === group.y)),
    "Wrapping must not replace a horizontal strip with a vertical strip",
  );
  for (const [index, group] of groups.entries()) {
    assert.equal(group.label, input.groups[index].label);
    assert.deepEqual(group.members, input.groups[index].members);
    for (const other of groups.slice(index + 1)) {
      const sharedBand = group.y < other.y + other.h && other.y < group.y + group.h;
      if (sharedBand)
        assert.equal(group.y, other.y, "Peer group headings must share a track, not stagger");
    }
  }
  assert.deepEqual([...result.layout.nodes.keys()], ids);
  assert.deepEqual(
    result.routes.map(({ id, from, to, text }) => ({ id, from, to, text })),
    input.relations,
  );
  assert(result.routes.every(({ label, labelBox }) => label && labelBox));
  const replay = await composeStaticGeometry(input);
  assert.deepEqual(replay.layout, result.layout);
  assert.deepEqual(replay.routes, result.routes);
});

test("compound static layout isolates declared groups across a fork and join", async () => {
  const ids = [
    "intent-a",
    "intent-b",
    "coordinate",
    "admit",
    "credential",
    "contract",
    "guard",
    "client-a",
    "client-b",
    "client-c",
  ];
  const input = {
    nodes: ids.map((id) => ({ id, label: id, kind: "component" })),
    groups: [
      ["intent", ids.slice(0, 2)],
      ["coordination", ["coordinate"]],
      ["admission", ["admit", "credential"]],
      ["safety", ["contract", "guard"]],
      ["clients", ids.slice(7)],
    ].map(([id, members]) => ({ id, label: id, members })),
    relations: [
      ["intent-a", "coordinate"],
      ["intent-b", "coordinate"],
      ["coordinate", "admit"],
      ["admit", "contract"],
      ["credential", "contract"],
      ["contract", "guard"],
      ...ids.slice(7).map((id) => ["contract", id]),
    ].map(([from, to], index) => ({ id: `r${index}`, from, to, text: "delegates" })),
  };
  const result = await composeStaticGeometry(input);
  assert.equal(result.layout.nodes.size, input.nodes.length);
  assert.deepEqual(
    result.routes.map(({ id }) => id),
    input.relations.map(({ id }) => id),
  );
  assert.equal(new Set([...result.layout.nodes.values()].map(({ w, h }) => `${w}:${h}`)).size, 1);
  const headings = result.layout.groups.map(({ heading }) => heading.baselines[0].baseline);
  assert(
    Math.max(...headings) - Math.min(...headings) < 0.01,
    "Serial declared group headings must share a native top track, not follow leaf centers",
  );
  for (const group of result.layout.groups) {
    assert(group.heading.baselines.length);
    for (const [id, node] of result.layout.nodes) {
      if (group.members.includes(id)) {
        assert(node.x >= group.x && node.x + node.w <= group.x + group.w);
        assert(node.y >= group.y && node.y + node.h <= group.y + group.h);
      } else {
        assert(
          node.x >= group.x + group.w ||
            node.x + node.w <= group.x ||
            node.y >= group.y + group.h ||
            node.y + node.h <= group.y,
          `${group.id} visually contains nonmember ${id}`,
        );
      }
    }
  }
  assert(result.routes.every(({ label, labelBox }) => label && labelBox));
});

test("joint layout retains opaque source identities and literal single-line whitespace", async () => {
  const ids = ['["source","one"]', "source/two:3"];
  const input = {
    nodes: ids.map((id, index) => ({
      id,
      label: ["First  component", "Second component"][index],
      kind: "service",
    })),
    groups: [{ id: ids[0], label: "Source  boundary", members: ids }],
    relations: [{ id: "source/relationship:4", from: ids[0], to: ids[1], text: "delegates  to" }],
  };
  const result = await composeStaticGeometry(input);
  assert.deepEqual([...result.layout.nodes.keys()], ids);
  assert.deepEqual(result.layout.groups[0].members, ids);
  assert.equal(result.layout.groups[0].label, input.groups[0].label);
  assert.deepEqual(result.layout.groups[0].heading.lines, [input.groups[0].label]);
  assert.deepEqual(
    result.routes.map(({ id, from, to, text }) => ({ id, from, to, text })),
    input.relations,
  );
  const replay = await composeStaticGeometry(input);
  assert.deepEqual(replay.layout, result.layout);
  assert.deepEqual(replay.routes, result.routes);
});

test("native group headings preserve complete ink and refuse content or painted collisions", async () => {
  const result = await composeStaticGeometry({
    nodes: [{ id: "core", label: "Core", kind: "service" }],
    groups: [{ id: "boundary", label: "Declared boundary", members: ["core"] }],
    relations: [],
  });
  const source = result.layout.groups[0];
  const group = { ...source, width: source.w, height: source.h };
  const measure = result.textMeasurer;
  assert.deepEqual(checkedGroupHeading(group, [], [], measure), group.heading.baselines);
  const line = group.heading.baselines[0];
  const box = line.box;
  const refuses = (value, nodes = [], edges = []) =>
    assert.throws(() => checkedGroupHeading(value, nodes, edges, measure), {
      code: "static_edition_group_heading_collision",
    });
  const changed = structuredClone(group);
  changed.heading.baselines[0].text = "Truncated boundary";
  refuses(changed);
  const escaped = structuredClone(group);
  escaped.heading.baselines[0].x = group.x - 1;
  refuses(escaped);
  refuses(group, [{ x: box.x, y: box.y, width: box.width, height: box.height }]);
  refuses(
    group,
    [],
    [
      {
        points: [
          [box.x - 1, box.y + box.height / 2],
          [box.x + box.width + 1, box.y + box.height / 2],
        ],
      },
    ],
  );
  refuses(
    group,
    [],
    [
      {
        points: [
          [group.x - 20, group.y - 20],
          [group.x - 10, group.y - 10],
        ],
        caption: { box: { x: box.x, y: box.y, w: box.width, h: box.height } },
      },
    ],
  );
});
