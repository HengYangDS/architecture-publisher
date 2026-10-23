import assert from "node:assert/strict";
import test from "node:test";
import { selected } from "./fixtures/elk-layout.mjs";

test("candidate footprint receives the complete graph rather than a detached bounds value", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: ["first", "second"].map((id) => ({ id, label: id })),
    relations: [{ id: "connects", source: "first", target: "second" }],
  };
  const empty = { lines: [""], width: 0, height: 0, fontSize: 12, baselines: [] };
  const result = await layoutInteractivePages([input], null, {
    nodeFootprints: [
      Object.fromEntries(
        input.nodes.map(({ id }) => [id, { width: 180, height: 80, label: empty }]),
      ),
    ],
    readingWidth: 640,
    candidateFootprint: (graph) => {
      assert.deepEqual(
        graph.nodes.map(({ id }) => id),
        ["first", "second"],
      );
      assert.equal(graph.relations[0].id, "connects");
      return { width: graph.bounds.width + 16, height: graph.bounds.height + 16 };
    },
  });
  assert.equal(result.layouts.length, 1);
  assert(result.layouts[0].bounds.width + 16 <= 640);
});

test("grouped placement does not call the complete footprint with a detached bounds value", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: ["first", "second"].map((id) => ({ id, label: id })),
    groups: [{ id: "declared", label: "Declared group", nodeIds: ["first", "second"] }],
    relations: [],
  };
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, baselines: [] };
  let footprints = 0;
  const result = await layoutInteractivePages([input], null, {
    nodeFootprints: [
      Object.fromEntries(input.nodes.map(({ id }) => [id, { width: 180, height: 80, label }])),
    ],
    groupFootprints: [{ declared: label }],
    readingWidth: 640,
    readingViewport: { width: 640, height: 480 },
    composePackedCandidate: () => {},
    candidateFootprint: (graph) => {
      assert.deepEqual(
        graph.nodes.map(({ id }) => id),
        ["first", "second"],
      );
      assert.equal(graph.groups[0].id, "declared");
      assert.deepEqual(graph.relations, []);
      footprints++;
      return { width: graph.bounds.width + 16, height: graph.bounds.height + 16 };
    },
  });
  assert(footprints > 0);
  assert.equal(result.layouts[0].groups[0].id, "declared");
});

test("unreadable node envelopes never consume the routing callback", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: ["first", "second", "third", "last"].map((id) => ({ id, label: id })),
    relations: [
      { id: "one", source: "first", target: "second" },
      { id: "two", source: "second", target: "third" },
      { id: "three", source: "third", target: "last" },
    ],
  };
  const empty = { lines: [""], width: 0, height: 0, fontSize: 12, baselines: [] };
  let routed = 0;
  const result = await layoutInteractivePages([input], null, {
    nodeFootprints: [
      Object.fromEntries(
        input.nodes.map(({ id }) => [id, { width: 224, height: 80, label: empty }]),
      ),
    ],
    readingWidth: 640,
    composeCandidate: (graph) => {
      const left = Math.min(...graph.nodes.map(({ x }) => x));
      const right = Math.max(...graph.nodes.map(({ x, width }) => x + width));
      assert(right - left <= 640, "an impossible node envelope reached routing");
      routed++;
    },
  });
  assert(routed > 0, "the feasible native candidate must still be routed");
  assert.equal(result.layouts[0].relations.length, 3);
});
