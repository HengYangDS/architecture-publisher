import assert from "node:assert/strict";
import test from "node:test";
import { intrinsicArchitectureFrame } from "../packages/publisher/renderers/archify/legend.mjs";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";
import { page } from "./fixtures/elk-layout.mjs";

test("native packing stays within its two bounded candidate slots", async () => {
  const { intrinsicPlacements } = await import("../packages/publisher/renderers/elk/placement.mjs");
  const { preparePage } = await import("../packages/publisher/renderers/elk/input.mjs");
  const empty = { lines: [""], width: 0, height: 0, baselines: [] };
  const nodes = Array.from({ length: 8 }, (_, index) => ({
    id: `component-${index}`,
    label: `Component ${index}`,
  }));
  const footprints = Object.fromEntries(
    nodes.map(({ id }) => [id, { width: 224, height: 104, label: empty }]),
  );
  const input = preparePage(
    {
      nodes,
      relations: nodes.map(({ id }, index) => ({
        id: `link-${index}`,
        source: id,
        target: nodes[(index + 1) % nodes.length].id,
      })),
    },
    null,
    footprints,
    Object.fromEntries(
      nodes.map((_, index) => [`link-${index}`, { ...empty, width: 160, height: 16 }]),
    ),
  );
  const original = structuredClone(input);
  const candidates = intrinsicPlacements(input, 1346);
  assert.equal(candidates.length, 2);
  assert.equal(
    candidates[1].graph.layoutOptions["elk.rectpacking.widthApproximation.strategy"],
    "TARGET_WIDTH",
  );
  const options = candidates[0].graph.layoutOptions;
  assert.equal(options["elk.rectpacking.widthApproximation.strategy"], "GREEDY");
  assert.equal(options["elk.aspectRatio"], String(marks.desktopReadingAspect));
  assert.equal(Object.hasOwn(options, "elk.rectpacking.widthApproximation.targetWidth"), false);
  assert(candidates[0].escape > 0);
  assert.equal(candidates[1].escape, 0);
  for (const { escape, verticalEscape, graph } of candidates) {
    assert.deepEqual(
      graph.children.map(({ width, height }) => [width, height]),
      input.nodes.map(({ width, height }) => [
        width + escape * 2,
        height + (verticalEscape ?? escape) * 2,
      ]),
    );
  }
  assert.deepEqual(input, original);
  const peers = preparePage({ nodes, relations: [] }, null, footprints);
  const peerCandidates = intrinsicPlacements(peers, 1346);
  assert.equal(peerCandidates.length, 2);
  assert(
    peerCandidates.every(
      ({ graph }) =>
        graph.layoutOptions["elk.rectpacking.widthApproximation.strategy"] === "TARGET_WIDTH",
    ),
  );
  assert.equal(peerCandidates[1].escape, 0);
});

test("semantic network packing ignores caption allocations, not isolated semantic subjects", async () => {
  const { preparePage } = await import("../packages/publisher/renderers/elk/input.mjs");
  const input = page();
  for (const relation of input.relations) delete relation.graphLabel;
  const caption = { id: "reader-caption", label: "A nonsemantic reading caption" };
  const label = { lines: [""], width: 0, height: 0, baselines: [] };
  const footprints = Object.fromEntries(
    [...input.nodes, caption].map(({ id }) => [id, { width: 224, height: 104, label }]),
  );
  const withCaption = { ...input, allocations: [caption] };
  const original = structuredClone(withCaption);
  assert.equal(preparePage(withCaption, null, footprints).orderedFlow, false);
  assert.deepEqual(withCaption, original);
  const isolated = { ...input, nodes: [...input.nodes, caption] };
  assert.equal(preparePage(isolated, null, footprints).orderedFlow, false);
  const semanticFootprints = Object.fromEntries(input.nodes.map(({ id }) => [id, footprints[id]]));
  const chain = {
    ...input,
    relations: input.relations.filter(({ id }) => ["r-0", "r-2"].includes(id)),
  };
  assert.equal(preparePage(chain, null, semanticFootprints).orderedFlow, true);
  assert.equal(
    preparePage({ ...chain, relations: [] }, null, semanticFootprints).orderedFlow,
    true,
  );
  assert.equal(
    preparePage({ ...chain, relations: input.relations.slice(0, 3) }, null, semanticFootprints)
      .orderedFlow,
    true,
    "Parallel relations do not turn a simple directed track into a network",
  );
  assert.equal(
    preparePage(
      {
        ...chain,
        relations: [
          { id: "left", source: "n-0", target: "n-1" },
          { id: "right", source: "n-0", target: "n-2" },
        ],
      },
      null,
      semanticFootprints,
    ).orderedFlow,
    false,
    "Branching dependencies receive network composition even without a cycle",
  );
  const bidirectional = {
    ...chain,
    relations: chain.relations.map((edge) => ({ ...edge, direction: "bidirectional" })),
  };
  assert.equal(preparePage(bidirectional, null, semanticFootprints).orderedFlow, false);
  const retry = [{ id: "retry", source: "n-0", target: "n-0" }];
  const singleton = { nodes: [input.nodes[0]], relations: retry };
  assert.equal(preparePage(singleton, null, { "n-0": footprints["n-0"] }).orderedFlow, true);
});

test("connected semantic dependencies use balanced desktop composition without losing relationships", async () => {
  const { layoutInteractivePages } = await import("../packages/publisher/renderers/elk/layout.mjs");
  const { routePackedIntrinsicGeometry, routeIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  for (const pairs of [
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
      [1, 7],
      [2, 7],
      [7, 3],
      [7, 1],
      [7, 5],
      [7, 4],
      [7, 6],
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 2],
      [3, 5],
      [4, 5],
    ],
  ]) {
    const nodes = Array.from({ length: Math.max(...pairs.flat()) + 1 }, (_, index) => ({
      id: `role-${index}`,
      label: `Role ${index}`,
    }));
    const input = {
      nodes,
      relations: pairs.map(([source, target], index) => ({
        id: `relation-${index}`,
        source: `role-${source}`,
        target: `role-${target}`,
        graphLabel: `Relation ${index}`,
      })),
    };
    const original = structuredClone(input);
    const label = (text) => ({
      lines: [text],
      width: 112,
      height: 28,
      fontSize: 12,
      weight: "400",
      baselines: [{ text, x: 5, baseline: 18, box: { x: 5, y: 6, width: 96, height: 14 } }],
    });
    const legend = {
      entries: nodes.map(({ id }) => ({ kind: id, label: id, width: 132 })),
      spacing: { columnGap: 24, rowAdvance: 32, height: 64, contentGap: 24, bottomInset: 16 },
    };
    const frameFor = (bounds) => intrinsicArchitectureFrame(bounds, 8, legend).viewport;
    const result = await layoutInteractivePages([input], null, {
      readingWidth: 1346,
      candidateFootprint: (graph) => frameFor(graph.bounds),
      nodeFootprints: [
        Object.fromEntries(
          nodes.map(({ id }) => [
            id,
            {
              width: 224,
              height: 104,
              label: label(id),
            },
          ]),
        ),
      ],
      relationFootprints: [
        Object.fromEntries(input.relations.map(({ id, graphLabel }) => [id, label(graphLabel)])),
      ],
      composeCandidate: (graph) => routeIntrinsicGeometry(graph, { automatic: true }),
      composePackedCandidate: routePackedIntrinsicGeometry,
    });
    const graph = result.layouts[0];
    assert.deepEqual(input, original);
    assert.deepEqual(graph.nodes.map(({ id }) => id).sort(), nodes.map(({ id }) => id).sort());
    assert.deepEqual(
      graph.nodes.map(({ width, height }) => [width, height]),
      nodes.map(() => [224, 104]),
    );
    assert.deepEqual(
      graph.relations.map(({ id, source, target }) => ({ id, source, target })),
      input.relations.map(({ id, source, target }) => ({ id, source, target })),
    );
    assert.deepEqual(
      graph.relations.map(({ label }) => label.lines.join(" ")),
      input.relations.map(({ graphLabel }) => graphLabel),
    );
    const envelope = ({ width, height }) => Math.max(height, width / marks.desktopReadingAspect);
    // The six-subject counterexample's captured strip is not a baseline for the
    // separate eight-subject cycle; both retain complete, readable two-axis maps.
    if (nodes.length === 6) {
      const rejectedStrip = frameFor({ width: 1104, height: 320 });
      assert(
        envelope(frameFor(graph.bounds)) < envelope(rejectedStrip),
        JSON.stringify(graph.bounds),
      );
    }
    assert(frameFor(graph.bounds).width <= 1346);
    assert(new Set(graph.nodes.map(({ x }) => x)).size > 1);
    assert(new Set(graph.nodes.map(({ y }) => y)).size > 1);
    assert(
      graph.relations.every(({ points, label: plan }) => points.length >= 2 && plan.lines.length),
    );
  }
});

test("packed placement reserves endpoint escape rather than page-wide label width", async () => {
  const { layoutInteractivePages } = await import("../packages/publisher/renderers/elk/layout.mjs");
  const { routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const selected = {
    nodes: ["alpha", "beta", "gamma"].map((id) => ({ id, label: id })),
    relations: [{ id: "edge", source: "alpha", target: "beta", graphLabel: "Exact relation" }],
  };
  const empty = {
    lines: [""],
    width: 0,
    height: 0,
    fontSize: 12,
    weight: "400",
    baselines: [],
  };
  const label = {
    lines: ["Exact relation"],
    width: 200,
    height: 32,
    fontSize: 12,
    weight: "400",
    baselines: [
      { text: "Exact relation", x: 8, baseline: 20, box: { x: 8, y: 8, width: 116, height: 14 } },
    ],
  };
  let packed;
  await layoutInteractivePages([selected], null, {
    readingWidth: 1346,
    nodeFootprints: [
      Object.fromEntries(
        selected.nodes.map(({ id }) => [id, { width: 280, height: 104, label: empty }]),
      ),
    ],
    relationFootprints: [{ edge: label }],
    composePackedCandidate: async (graph) => {
      packed = structuredClone(graph);
      await routePackedIntrinsicGeometry(graph);
    },
  });
  assert(packed, "the native packed candidate must be exercised");
  assert(packed.bounds.width <= 1346, "packing must honor the complete desktop width budget");
  assert.deepEqual(
    packed.nodes.map(({ width, height }) => [width, height]),
    selected.nodes.map(() => [280, 104]),
  );
  assert.deepEqual(packed.relations[0].label.lines, label.lines);
});
