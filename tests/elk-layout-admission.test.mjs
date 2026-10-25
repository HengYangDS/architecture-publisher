import assert from "node:assert/strict";
import test from "node:test";
import { measurePages, selected } from "./fixtures/elk-layout.mjs";

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

test("source reading balances complete candidates across both exploration axes", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: Array.from({ length: 8 }, (_, index) => ({ id: `step-${index}`, label: "Step" })),
    relations: Array.from({ length: 7 }, (_, index) => ({
      id: `next-${index}`,
      source: `step-${index}`,
      target: `step-${index + 1}`,
    })),
  };
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, baselines: [] };
  const before = structuredClone(input);
  const footprint = (graph) => ({
    width: graph.bounds.width + 16,
    height: graph.bounds.height + 16,
  });
  for (const width of [640, 960]) {
    const admitted = [];
    const viewport = { width, height: 480 };
    const result = await layoutInteractivePages([input], null, {
      nodeFootprints: [
        Object.fromEntries(input.nodes.map(({ id }) => [id, { width: 180, height: 120, label }])),
      ],
      readingWidth: viewport.width,
      readingViewport: viewport,
      readingContext: "source",
      candidateFootprint: footprint,
      validateCandidate: (graph) => admitted.push(graph),
    });
    const disruption = Math.min(...admitted.map((graph) => graph.compositionDisruption));
    const ordered = admitted.filter((graph) => graph.compositionDisruption === disruption);
    const expansion = (graph) =>
      Math.max(1, footprint(graph).width / width, footprint(graph).height / viewport.height);
    assert.equal(expansion(result.layouts[0]), Math.min(...ordered.map(expansion)));
    assert.deepEqual(
      result.layouts[0].relations.map(({ id, source, target }) => ({ id, source, target })),
      input.relations,
    );
    assert(result.layouts[0].nodes.every(({ width, height }) => width === 180 && height === 120));
  }
  assert.deepEqual(input, before);
});

test("proven dominated source placements never consume routing or change the selected geometry", async () => {
  const { layoutInteractivePages } = await selected();
  const page = {
    nodes: Array.from({ length: 8 }, (_, index) => ({ id: `step-${index}`, label: "Step" })),
    relations: Array.from({ length: 7 }, (_, index) => ({
      id: `next-${index}`,
      source: `step-${index}`,
      target: `step-${index + 1}`,
    })),
  };
  const before = structuredClone(page);
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, baselines: [] };
  const options = {
    nodeFootprints: [
      Object.fromEntries(page.nodes.map(({ id }) => [id, { width: 180, height: 120, label }])),
    ],
    readingWidth: 640,
    readingViewport: { width: 640, height: 480 },
    readingContext: "source",
    candidateFootprint: (graph) => graph.bounds,
  };
  const lowerBound = (graph) => ({
    apertureExpansion: Math.max(
      1,
      (Math.max(...graph.nodes.map(({ x, width }) => x + width)) -
        Math.min(...graph.nodes.map(({ x }) => x))) /
        640,
      (Math.max(...graph.nodes.map(({ y, height }) => y + height)) -
        Math.min(...graph.nodes.map(({ y }) => y))) /
        480,
    ),
  });
  const exhaustive = await layoutInteractivePages([page], null, options);
  let incumbent = Infinity;
  let routed = 0;
  const result = await layoutInteractivePages([page], null, {
    ...options,
    candidateLowerBound: lowerBound,
    composeCandidate: (graph) => {
      assert(
        lowerBound(graph).apertureExpansion <= incumbent,
        "An immutable node envelope already worse than qualified geometry must not be routed",
      );
      routed++;
    },
    validateCandidate: (graph) => {
      incumbent = Math.min(
        incumbent,
        Math.max(1, graph.bounds.width / 640, graph.bounds.height / 480),
      );
    },
  });
  assert(routed > 0);
  assert.deepEqual(result, exhaustive);
  assert.deepEqual(page, before);
});

test("only an ordered readable complete frame can dominate a source candidate", async () => {
  const { qualifiedSourceExpansion } =
    await import("../packages/publisher/renderers/elk/audit.mjs");
  const viewport = { width: 640, height: 480 };
  const frame = {
    compositionDisruption: 0,
    bounds: { width: 1280, height: 480 },
    nodes: [{ label: { fontSize: 12 } }],
    groups: [{ label: { fontSize: 12 } }],
    relations: [{ label: { fontSize: 12 } }, { label: null }],
  };
  const original = structuredClone(frame);
  const options = { readingViewport: viewport };
  assert.equal(qualifiedSourceExpansion(frame, options, 12), 2);
  assert.equal(
    qualifiedSourceExpansion(
      frame,
      { ...options, candidateFootprint: () => ({ width: 1280, height: 1440 }) },
      12,
    ),
    3,
    "The complete chrome and routing extent, not the node-only box, bounds dominance",
  );
  assert.equal(qualifiedSourceExpansion(frame, {}, 12), Infinity);
  assert.equal(
    qualifiedSourceExpansion({ ...frame, compositionDisruption: 1 }, options, 12),
    Infinity,
  );
  for (const member of ["nodes", "groups", "relations"]) {
    const unreadable = structuredClone(frame);
    unreadable[member][0].label.fontSize = 11;
    assert.equal(
      qualifiedSourceExpansion(unreadable, options, 12),
      Infinity,
      `Unreadable ${member} cannot suppress another candidate`,
    );
  }
  assert.deepEqual(frame, original);
});

test("layout execution rejects invalid reading apertures before composing a candidate", async () => {
  const { layoutInteractivePages } = await selected();
  const input = { nodes: [{ id: "subject", label: "Subject" }], relations: [] };
  const before = structuredClone(input);
  let composed = 0;
  const invalid = [
    { timeoutMs: 0 },
    { timeoutMs: 25_001 },
    { timeoutMs: 0.5 },
    { maximumBytes: 0 },
    { maximumBytes: 32 * 1024 * 1024 + 1 },
    { maximumBytes: Number.POSITIVE_INFINITY },
    { temporaryDirectory: "relative" },
    { readingWidth: 0 },
    { readingWidth: Number.NaN },
    { minimumLabelSize: 0 },
    { minimumLabelSize: Number.POSITIVE_INFINITY },
    { readingContext: "unselected" },
    { readingViewport: null },
    { readingViewport: { width: Number.NaN, height: 480 } },
    { readingViewport: { width: 0, height: 480 } },
    { readingViewport: { width: 640, height: Number.POSITIVE_INFINITY } },
    { readingViewport: { width: 640, height: 0 } },
    { placementViewport: null },
    { placementViewport: { width: Number.POSITIVE_INFINITY, height: 480 } },
    { placementViewport: { width: 0, height: 480 } },
    { placementViewport: { width: 640, height: Number.NaN } },
    { placementViewport: { width: 640, height: 0 } },
    { nodeFootprints: [] },
    { nodeFootprints: {} },
  ];
  for (const options of invalid)
    await assert.rejects(
      layoutInteractivePages([input], null, {
        ...options,
        composeCandidate: () => composed++,
      }),
      { code: "render_interactive_layout_execution_limit_invalid" },
      JSON.stringify(options),
    );
  assert.equal(composed, 0);
  assert.deepEqual(input, before);
});

test("layout rejects an absent or excessive page selection before reading its members", async () => {
  const { layoutInteractivePages } = await selected();
  for (const pages of [null, {}, [], Array(65).fill(null)])
    await assert.rejects(layoutInteractivePages(pages), {
      code: "render_interactive_layout_invalid",
    });
});

test("layout keeps caller error identity when composition fails outside geometric feasibility", async () => {
  const { layoutInteractivePages } = await selected();
  const input = { nodes: [{ id: "subject", label: "Subject" }], relations: [] };
  const before = structuredClone(input);
  const failure = Object.assign(new Error("Selected paint is unavailable"), {
    code: "selected_paint_unavailable",
  });
  await assert.rejects(
    layoutInteractivePages([input], await measurePages([input]), {
      validateCandidate: () => {
        throw failure;
      },
    }),
    (error) => error === failure,
  );
  assert.deepEqual(input, before);
});

test("an impossible node envelope preserves reader context and never reaches routing", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    id: "complete-architecture",
    questions: [{ text: "How does the complete system connect?" }],
    nodes: [{ id: "subject", label: "Complete subject" }],
    relations: [],
  };
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, baselines: [] };
  const before = structuredClone(input);
  let composed = 0;
  await assert.rejects(
    layoutInteractivePages([input], null, {
      readingWidth: 640,
      nodeFootprints: [{ subject: { width: 800, height: 80, label } }],
      composeCandidate: () => composed++,
      composePackedCandidate: () => composed++,
    }),
    (error) => {
      assert.equal(error.code, "render_interactive_layout_infeasible");
      assert.equal(error.diagnostics[0].view, input.id);
      assert.deepEqual(
        error.diagnostics[0].questions,
        input.questions.map(({ text }) => text),
      );
      assert.equal(error.diagnostics[0].need, "intrinsic-layout-resolution");
      assert.equal(error.diagnostics[0].constraint, error.message);
      return true;
    },
  );
  assert.equal(composed, 0);
  assert.deepEqual(input, before);
});

test("complete-frame admission refuses oversized chrome even when node geometry fits", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    id: "complete-frame",
    nodes: [{ id: "subject", label: "Subject" }],
    relations: [],
  };
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, baselines: [] };
  await assert.rejects(
    layoutInteractivePages([input], null, {
      readingWidth: 640,
      readingViewport: { width: 640, height: 480 },
      nodeFootprints: [{ subject: { width: 180, height: 80, label } }],
      candidateFootprint: () => ({ width: 800, height: 480 }),
    }),
    (error) => {
      assert.equal(error.code, "render_interactive_layout_infeasible");
      assert.equal(error.diagnostics[0].view, input.id);
      assert.deepEqual(error.diagnostics[0].questions, []);
      assert.match(error.message, /complete-desktop-frame-below-text-floor/u);
      return true;
    },
  );
});

test("source exploration admits measured capacity without borrowing overview acceptance", async () => {
  const { layoutInteractivePages } = await import("../packages/publisher/renderers/elk/layout.mjs");
  const page = {
    nodes: ["source", "target"].map((id) => ({ id, label: id })),
    relations: [{ id: "declares", source: "source", target: "target" }],
  };
  const original = structuredClone(page);
  const footprint = {
    width: 700,
    height: 80,
    label: { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] },
  };
  const options = {
    nodeFootprints: [{ source: footprint, target: footprint }],
    relationFootprints: [{}],
    readingWidth: 640,
    readingViewport: { width: 640, height: 480 },
    minimumLabelSize: 12,
    composeCandidate: () => {},
    candidateFootprint: ({ bounds }) => bounds,
  };
  await assert.rejects(layoutInteractivePages([page], null, options), {
    code: "render_interactive_layout_infeasible",
  });
  const result = await layoutInteractivePages([page], null, {
    ...options,
    readingContext: "source",
  });
  const graph = result.layouts[0];
  assert.deepEqual(page, original);
  assert(graph.bounds.width > 640);
  assert.deepEqual(
    graph.nodes.map(({ id }) => id),
    ["source", "target"],
  );
  assert(
    graph.nodes.every(
      ({ width, height, label }) => width === 700 && height === 80 && label.fontSize === 12,
    ),
  );
  assert.deepEqual(
    graph.relations.map(({ id, source, target }) => ({ id, source, target })),
    page.relations,
  );
});

test("a relation caption may sit inside a group but cannot cross its painted frame", async () => {
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const label = { x: 40, y: 30, lines: [], width: 0, height: 0, fontSize: 12, baselines: [] };
  const graph = {
    bounds: { width: 600, height: 200 },
    groups: [
      { id: "first", x: 20, y: 20, width: 180, height: 140, label },
      { id: "second", x: 260, y: 20, width: 200, height: 140, label },
    ],
    nodes: [
      { id: "a", groupId: "first", x: 60, y: 80, width: 100, height: 40, label },
      { id: "b", groupId: "second", x: 320, y: 80, width: 100, height: 40, label },
    ],
    relations: [
      {
        id: "handoff",
        source: "a",
        target: "b",
        points: [
          { x: 160, y: 100 },
          { x: 220, y: 100 },
          { x: 220, y: 140 },
          { x: 280, y: 140 },
          { x: 280, y: 100 },
          { x: 320, y: 100 },
        ],
        label: {
          ...label,
          lines: ["Caption"],
          baselines: [{ text: "Caption", box: { x: 190, y: 45, width: 40, height: 12 } }],
        },
      },
    ],
  };
  const original = structuredClone(graph);
  assert.throws(() => auditIntrinsicGeometry(graph), {
    code: "render_interactive_layout_infeasible",
    message: /text-group-frame-collision/u,
  });
  assert.deepEqual(graph, original);
  graph.relations[0].label.baselines[0].box.x = 80;
  assert.doesNotThrow(() => auditIntrinsicGeometry(graph));
});
