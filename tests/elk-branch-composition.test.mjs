import assert from "node:assert/strict";

import test from "node:test";

import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";

import { measurePages, selected } from "./fixtures/elk-layout.mjs";

test("the same geometry owner wraps a long causal chain into a complete balanced reading area", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: [
      "Operator",
      "Control",
      "Projection",
      "Native client",
      "Selected endpoint",
      "Observation",
      "Recovery",
    ].map((label, index) => ({ id: `n-${index}`, label })),
    relations: Array.from({ length: 6 }, (_, index) => ({
      id: `r-${index}`,
      source: `n-${index}`,
      target: `n-${index + 1}`,
      graphLabel: "selects",
    })),
  };
  const original = structuredClone(input);
  const graph = (await layoutInteractivePages([input], await measurePages([input]))).layouts[0];
  assert(
    graph.bounds.width / graph.bounds.height > 1.1,
    "complete causal chains must not create a tall isolated side rail",
  );
  assert(graph.bounds.width < 1400 && graph.bounds.height < 760);
  assert.equal(graph.nodes.length, input.nodes.length);
  assert.equal(graph.relations.length, input.relations.length);
  assert.deepEqual(input, original);
});

test("readable desktop branching does not become a tall strip to fit an artificial slide", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: [
      "Admitted adapters",
      "AIGW",
      "Native client",
      "AIGW executable copy",
      "Native projection",
      "Guarded transaction",
    ].map((label, index) => ({ id: `n-${index}`, label })),
    relations: [
      ["n-1", "n-0", "dispatches"],
      ["n-1", "n-5", "commits-through"],
      ["n-4", "n-2", "configures"],
      ["n-0", "n-4", "applies"],
      ["n-5", "n-3", "guards"],
      ["n-5", "n-4", "guards"],
    ].map(([source, target, graphLabel], index) => ({
      id: `r-${index}`,
      source,
      target,
      graphLabel,
    })),
  };
  const original = structuredClone(input);
  const geometry = (await layoutInteractivePages([input], await measurePages([input]))).layouts[0];
  assert(
    geometry.bounds.width > geometry.bounds.height * 2,
    "a complete readable branching figure must use the available desktop width",
  );
  assert(geometry.bounds.height < 400, "qualifiers must not inherit an unnecessary tall figure");
  assert.equal(geometry.nodes.length, 6);
  assert.equal(geometry.relations.length, 6);
  assert.deepEqual(input, original);
});

test("a bidirectional topology is not silently classified as an acyclic wrapping candidate", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: Array.from({ length: 6 }, (_, index) => ({ id: `n-${index}`, label: `Node ${index}` })),
    relations: Array.from({ length: 5 }, (_, index) => ({
      id: `r-${index}`,
      source: `n-${index}`,
      target: `n-${index + 1}`,
      direction: index === 0 ? "bidirectional" : "forward",
      graphLabel: "selects",
    })),
  };
  const graph = (await layoutInteractivePages([input], await measurePages([input]))).layouts[0];
  assert.equal(graph.relations[0].direction, "bidirectional");
  assert(
    graph.bounds.height > graph.bounds.width,
    "reverse topology prevents the DAG-only wrapping policy",
  );
});

test("reading composition does not exchange a small height saving for a page-wide wrap detour", async () => {
  const { layoutInteractivePages } = await selected();
  const labels = [
    "Adapter contract",
    "Claude Code",
    "Claude Desktop",
    "CLI",
    "Codex",
    "Configuration",
    "Credential store",
    "Native discovery",
    "Hermes",
    "Client registry",
    "Synchronizer",
  ];
  const input = {
    nodes: labels.map((label, index) => ({ id: `n-${index}`, label })),
    relations: [
      ["n-3", "n-10", "delegates"],
      ["n-5", "n-10", "configures"],
      ["n-0", "n-4", "realized-by"],
      ["n-0", "n-8", "realized-by"],
      ["n-0", "n-1", "realized-by"],
      ["n-0", "n-2", "realized-by"],
      ["n-6", "n-0", "supplies-credentials"],
      ["n-7", "n-10", "reports-to"],
      ["n-9", "n-0", "dispatches"],
      ["n-10", "n-9", "delegates"],
    ].map(([source, target, graphLabel], index) => ({
      id: `r-${index}`,
      source,
      target,
      graphLabel,
    })),
  };
  const before = structuredClone(input);
  const graph = (
    await layoutInteractivePages([input], await measurePages([input]), { timeoutMs: 25_000 })
  ).layouts[0];
  const detour = graph.relations.reduce((total, relation) => {
    const length = relation.points.slice(1).reduce((sum, point, index) => {
      const previous = relation.points[index];
      return sum + Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y);
    }, 0);
    const first = relation.points[0];
    const last = relation.points.at(-1);
    return total + length - Math.abs(last.x - first.x) - Math.abs(last.y - first.y);
  }, 0);
  assert(detour < 1, "a selected complete route must not wrap across the page to save 89px height");
  assert(graph.bounds.height <= 800);
  assert.equal(graph.nodes.length, labels.length);
  assert.equal(graph.relations.length, input.relations.length);
  assert.deepEqual(input, before);
});

test("the same layout owner admits a wider native wrap without shortening selected words", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: [
      "Admitted adapters",
      "AIGW",
      "Native client",
      "Configuration",
      "Selected endpoint",
      "Operator",
      "Native projection",
    ].map((label, index) => ({ id: `n-${index}`, label })),
    relations: [
      ["n-1", "n-0", "dispatches"],
      ["n-1", "n-3", "maintains"],
      ["n-2", "n-4", "sends-requests-to"],
      ["n-5", "n-1", "invokes"],
      ["n-6", "n-2", "configures"],
      ["n-0", "n-6", "applies"],
    ].map(([source, target, graphLabel], index) => ({
      id: `r-${index}`,
      source,
      target,
      graphLabel,
    })),
  };
  const graph = (await layoutInteractivePages([input], await measurePages([input]))).layouts[0];
  assert(
    graph.bounds.height < 400,
    "one 3.2-aspect native wrap keeps the full short argument shallow",
  );
  const scale = Math.min(1, 1512 / (graph.bounds.width + 64));
  for (const relation of graph.relations) {
    assert.equal(
      relation.label.lines.join(" "),
      input.relations.find(({ id }) => id === relation.id).graphLabel,
    );
    assert(relation.label.fontSize * scale >= 12);
  }
});

test("grouped branching preserves every member and readable labels when centered headings obstruct a route", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: [
      "Adapter contract",
      "Claude Code",
      "Claude Desktop",
      "CLI",
      "Codex",
      "Configuration",
      "Credential store",
      "Native discovery",
      "Hermes",
      "Client registry",
      "Synchronizer",
      "Guarded transaction",
    ].map((label, index) => ({ id: `n-${index}`, label })),
    groups: [
      ["Operator intent and host state", [3, 5, 7]],
      ["Desired-state coordination", [10]],
      ["Credential and client admission", [6, 9]],
      ["Adapter contract and transaction", [0, 11]],
      ["Native client projections", [4, 1, 2, 8]],
    ].map(([label, members], index) => ({
      id: `g-${index}`,
      label,
      nodeIds: members.map((member) => `n-${member}`),
    })),
    relations: [
      [3, 10, "delegates"],
      [5, 10, "configures"],
      [0, 1, "realized-by"],
      [0, 2, "realized-by"],
      [0, 4, "realized-by"],
      [0, 8, "realized-by"],
      [0, 11, "guards"],
      [6, 0, "supplies-credentials"],
      [7, 10, "reports-to"],
      [9, 0, "dispatches"],
      [10, 9, "delegates"],
    ].map(([source, target, graphLabel], index) => ({
      id: `r-${index}`,
      source: `n-${source}`,
      target: `n-${target}`,
      graphLabel,
    })),
  };
  const before = structuredClone(input);
  const graph = (await layoutInteractivePages([input], await measurePages([input]))).layouts[0];
  const readingWidth =
    Math.min(marks.desktopReadingWidth, marks.shellMaximumWidth) - marks.shellInset * 2;
  const scale = Math.min(1, readingWidth / (graph.bounds.width + marks.graphInset * 2));
  for (const item of [...graph.nodes, ...graph.groups, ...graph.relations]) {
    assert(
      item.label.fontSize * scale >= marks.minimumLabelSize,
      `${item.id} must remain readable in the declared desktop reading width`,
    );
  }
  for (const group of input.groups) {
    assert.deepEqual(
      graph.nodes
        .filter((node) => node.groupId === group.id)
        .map((node) => node.id)
        .sort(),
      [...group.nodeIds].sort(),
    );
    assert.equal(
      graph.groups.find((item) => item.id === group.id).label.lines.join(" "),
      group.label,
    );
  }
  assert.equal(graph.relations.length, input.relations.length);
  assert.deepEqual(input, before);
});

test("complete grouped content reports the internal measured constraint without shifting layout upstream", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    id: "complete-stages",
    questions: [{ text: "Which stage owns each boundary?" }],
    nodes: [],
    relations: [],
    groups: [],
  };
  for (let stage = 0; stage < 8; stage++) {
    const nodeIds = [];
    for (let member = 0; member < 8; member++) {
      const id = `n-${stage}-${member}`;
      nodeIds.push(id);
      input.nodes.push({ id, label: `Stage ${stage} responsibility ${member}` });
      if (stage)
        input.relations.push({
          id: `r-${stage}-${member}`,
          source: `n-${stage - 1}-${member}`,
          target: id,
          graphLabel: "delegates",
        });
    }
    input.groups.push({ id: `g-${stage}`, label: `Execution stage ${stage}`, nodeIds });
  }
  const before = structuredClone(input);
  await assert.rejects(layoutInteractivePages([input], await measurePages([input])), (error) => {
    assert.equal(error.code, "render_interactive_layout_infeasible");
    assert.deepEqual(error.diagnostics, [
      {
        view: input.id,
        questions: ["Which stage owns each boundary?"],
        need: "intrinsic-layout-resolution",
        constraint: error.message,
      },
    ]);
    assert.doesNotMatch(error.hint, /regroup|caption/i);
    return true;
  });
  assert.deepEqual(input, before);
});
