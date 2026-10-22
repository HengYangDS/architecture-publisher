import assert from "node:assert/strict";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";

import { selected } from "./fixtures/elk-layout.mjs";

test("native packing reserves measured captions without spending empty route capacity", async () => {
  const { intrinsicPlacements } = await import("../packages/publisher/renderers/elk/placement.mjs");
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] };
  const page = {
    orderedFlow: false,
    nodes: [96, 152, 64, 128].map((height, index) => ({
      id: `subject-${index}`,
      width: 224,
      height,
      label,
    })),
    relations: Array.from({ length: 4 }, (_, index) => ({
      id: `relationship-${index}`,
      source: `subject-${index}`,
      target: `subject-${(index + 1) % 4}`,
    })),
  };
  const before = structuredClone(page);
  const entries = intrinsicPlacements(page, 1346);
  assert.equal(entries.length, 2);
  for (const entry of entries) {
    assert.equal(entry.graph.layoutOptions["elk.rectpacking.orderBySize"], "false");
    assert.equal(
      entry.graph.layoutOptions["elk.rectpacking.widthApproximation.strategy"],
      "TARGET_WIDTH",
    );
    assert.deepEqual(
      entry.graph.children.map(({ id }) => id),
      page.nodes.map(({ id }) => id),
    );
  }
  assert.equal(entries[1].escape, 0);
  const labelled = {
    ...page,
    relations: page.relations.map((relation) => ({
      ...relation,
      label: { ...label, lines: ["exact relationship"], width: 160, height: 16 },
    })),
  };
  const captioned = intrinsicPlacements(labelled, 1346);
  assert.equal(
    captioned[0].graph.layoutOptions["elk.rectpacking.widthApproximation.strategy"],
    "GREEDY",
  );
  assert(captioned[0].escape > 0);
  assert.equal(captioned[1].escape, 0);
  const ordered = intrinsicPlacements({ ...labelled, orderedFlow: true }, 1346, undefined, {
    width: 1240,
    height: 574,
  });
  assert.equal(
    ordered[1].graph.layoutOptions["elk.rectpacking.widthApproximation.strategy"],
    "TARGET_WIDTH",
  );
  assert(
    ordered[1].graph.children.some(
      (node) => node.layoutOptions["elk.rectpacking.inNewRow"] === "true",
    ),
    "The native packing policy preserves explicit directed row starts",
  );
  assert.deepEqual(page, before);
});

test("complete-frame wrapping follows directed stages rather than shuffled source storage", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "ordered-publication",
    title: "Publication",
    subtitle: "Directed stages",
    nodes: [4, 0, 5, 1, 3, 2].map((stage) => {
      const [label, detail] = [
        ["Verification results", "predicate-specific exact judgments"],
        ["Human acceptance", "explicit exact-artifact decision"],
        ["Execution authority", "one exact publication plan"],
        ["Publication effect", "apply · replace · withdraw"],
        ["Same-plan recovery", "re-observe · resume same plan"],
        ["Off-host recovery limit", "unproved without operator custody"],
      ][stage];
      return {
        id: `stage-${stage}`,
        label,
        detail,
        figureKind: `phase ${stage}`,
        visualRole: "external",
      };
    }),
    edges: Array.from({ length: 5 }, (_, stage) => ({
      id: `next-${stage}`,
      from: `stage-${stage}`,
      to: `stage-${stage + 1}`,
      label: "next",
      visualRole: "default",
    })),
    groups: [],
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  assert.deepEqual(
    result.scene.nodes.map(({ id }) => id),
    scene.nodes.map(({ id }) => id),
  );
  const reading = result.scene.nodes.toSorted(
    (left, right) => left.position.y - right.position.y || left.position.x - right.position.x,
  );
  assert.deepEqual(
    reading.map(({ id }) => id),
    [0, 1, 2, 3, 4, 5].map((stage) => `stage-${stage}`),
  );
  assert(new Set(reading.map(({ position }) => position.x)).size > 1);
  assert(new Set(reading.map(({ position }) => position.y)).size > 1);
  const { width, height } = result.scene.viewport;
  assert(
    width <= 1240 && height <= 574,
    "The complete directed frame fits its actual desktop aperture with both axes available",
  );
  for (const node of scene.nodes)
    assert.deepEqual(
      result.nodeText.layouts[node.id].rows
        .filter(({ field }) => field === "label")
        .map(({ text }) => text),
      [node.label],
      `${node.id}: use available desktop space before fracturing a fitting title`,
    );
  assert.deepEqual(
    result.scene.edges.map(({ id }) => id),
    scene.edges.map(({ id }) => id),
  );
});

async function layoutMeasuredFlow(heights) {
  const { layoutInteractivePages } = await import("../packages/publisher/renderers/elk/layout.mjs");
  const { measuredLabel, wrappedLabelRequests } =
    await import("../packages/publisher/renderers/elk/text.mjs");
  const { auditIntrinsicGeometry, intrinsicReadingWidth } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const { routeIntrinsicGeometry, routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const fonts = await loadBundledFonts();
  const measure = await createBundledTextMeasurer(
    fonts,
    wrappedLabelRequests("item", { fontSize: 12, weight: "600" }),
  );
  const label = measuredLabel("item", measure, { fontSize: 12, weight: "600" });
  const selected = {
    nodes: heights.map((_, index) => ({ id: `n${index}`, label: "item" })),
    relations: Array.from({ length: heights.length - 1 }, (_, index) => ({
      id: `e${index}`,
      source: `n${index}`,
      target: `n${index + 1}`,
    })),
  };
  const before = structuredClone(selected);
  const paint = (graph) => {
    for (const relation of graph.relations) {
      relation.variant = "default";
      relation.nativeArrow = true;
    }
    return graph;
  };
  const {
    layouts: [layout],
  } = await layoutInteractivePages([selected], null, {
    nodeFootprints: [
      Object.fromEntries(
        selected.nodes.map(({ id }, index) => [id, { width: 240, height: heights[index], label }]),
      ),
    ],
    relationFootprints: [{}],
    readingWidth: intrinsicReadingWidth,
    minimumLabelSize: 12,
    composeCandidate: (graph) => routeIntrinsicGeometry(paint(graph), { automatic: true }),
    composePackedCandidate: (graph) => routePackedIntrinsicGeometry(paint(graph)),
    validateCandidate: (graph) => auditIntrinsicGeometry(paint(graph)),
  });
  assert(layout.bounds.width <= intrinsicReadingWidth);
  assert.deepEqual(selected, before);
  assert.deepEqual(
    layout.nodes.map(({ width, height }) => [width, height]),
    heights.map((height) => [240, height]),
  );
  assert.deepEqual(
    layout.relations.map(({ id, source, target }) => ({ id, source, target })),
    selected.relations,
  );
  auditIntrinsicGeometry(layout);
  return layout;
}

test("intrinsic flow wrapping avoids an unnecessary third row without shrinking measured nodes", async () => {
  const layout = await layoutMeasuredFlow([90, 90, 90, 90, 90, 90]);
  assert(layout.bounds.height <= 300, "Six measured steps can fit two fully routed rows");
});

test("composition scoring never rewards a larger canvas for padding identical text", async () => {
  const compact = await layoutMeasuredFlow([300, 90, 90]);
  const padded = await layoutMeasuredFlow([310, 310, 310]);
  assert(padded.bounds.width * padded.bounds.height > compact.bounds.width * compact.bounds.height);
  assert(
    padded.compositionCost > compact.compositionCost,
    "Blank space inside enlarged peer cards must not count as useful content",
  );
});

test("intrinsic packing reduces mixed-height row waste while preserving directed topology", async () => {
  const { layoutInteractivePages } = await import("../packages/publisher/renderers/elk/layout.mjs");
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const { routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const selected = {
    nodes: Array.from({ length: 24 }, (_, index) => ({
      id: `node-${index}`,
      label: `Node ${index}`,
    })),
    relations: Array.from({ length: 24 }, (_, index) => ({
      id: `edge-${index}`,
      source: `node-${index}`,
      target: `node-${(index + 1) % 24}`,
    })),
  };
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] };
  const heights = [152, 128, 96, 64];
  const {
    layouts: [layout],
  } = await layoutInteractivePages([selected], null, {
    nodeFootprints: [
      Object.fromEntries(
        selected.nodes.map(({ id }, index) => [
          id,
          { width: 224, height: heights[index % heights.length], label },
        ]),
      ),
    ],
    relationFootprints: [{}],
    readingWidth: 1346,
    composePackedCandidate: routePackedIntrinsicGeometry,
    validateCandidate: auditIntrinsicGeometry,
  });
  assert(layout.bounds.width <= 1346);
  assert(
    layout.bounds.height <= 1300,
    "Different measured heights need not waste every packed row",
  );
  assert.deepEqual(
    layout.nodes.map(({ id, width, height }) => ({ id, width, height })),
    selected.nodes.map(({ id }, index) => ({
      id,
      width: 224,
      height: heights[index % heights.length],
    })),
  );
  assert.deepEqual(
    layout.relations.map(({ id, source, target }) => ({ id, source, target })),
    selected.relations,
  );
  auditIntrinsicGeometry(layout);
});

test("expanded intrinsic candidates preserve the admitted multi-page capacity", async (t) => {
  const { layoutInteractivePages } = await import("../packages/publisher/renderers/elk/layout.mjs");
  const { auditIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/routing-contract.mjs");
  const { routePackedIntrinsicGeometry } =
    await import("../packages/publisher/renderers/archify/intrinsic-routing.mjs");
  const selected = {
    nodes: Array.from({ length: 6 }, (_, index) => ({ id: `n${index}`, label: "item" })),
    relations: Array.from({ length: 5 }, (_, index) => ({
      id: `e${index}`,
      source: `n${index}`,
      target: `n${index + 1}`,
    })),
  };
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] };
  const footprints = Object.fromEntries(
    selected.nodes.map(({ id }) => [id, { width: 240, height: 90, label }]),
  );
  for (const count of [22, 64])
    await t.test(`${count} complete pages`, async () => {
      const { layouts } = await layoutInteractivePages(
        Array.from({ length: count }, () => selected),
        null,
        {
          nodeFootprints: Array.from({ length: count }, () => footprints),
          relationFootprints: Array.from({ length: count }, () => ({})),
          readingWidth: 1346,
          composePackedCandidate: routePackedIntrinsicGeometry,
          validateCandidate: auditIntrinsicGeometry,
        },
      );
      assert.equal(layouts.length, count);
      for (const layout of layouts) {
        assert.equal(layout.nodes.length, 6);
        assert.equal(layout.relations.length, 5);
        auditIntrinsicGeometry(layout);
      }
    });
});

test("intrinsic desktop composition uses both axes for a complete operation graph", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const nodes = Array.from({ length: 24 }, (_, index) => ({
    id: `operation-${index}`,
    label: `Exact selected operation ${index}`,
    detail: "Declared obligations remain bound to this local execution.",
    note: "Same subject; fresh facts; exact outcome.",
    visualRole: "backend",
    figureKind: "actor",
  }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "complete-operation-graph",
    title: "Complete operation graph",
    subtitle: "Exact local declarations",
    typography: { minimumTextPx: 12 },
    nodes,
    edges: nodes.map((node, index) => ({
      id: `step-${index}`,
      from: node.id,
      to: nodes[(index + 1) % nodes.length].id,
      label: index === nodes.length - 1 ? "exact feedback" : "selected operation",
      visualRole: "default",
    })),
    groups: [],
    texts: [
      {
        id: "outcome-context",
        text: "Feedback preserves uncertainty",
        weight: "400",
        anchor: "middle",
        tone: "muted",
        visible: true,
        semanticIds: [],
      },
    ],
  };
  const before = structuredClone(scene);
  const composed = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  assert.deepEqual(
    composed.scene.nodes.map((node) => {
      const meaning = { ...node };
      delete meaning.position;
      delete meaning.size;
      return meaning;
    }),
    scene.nodes,
  );
  assert.deepEqual(
    composed.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  const { width, height } = composed.scene.viewport;
  assert(width / height >= 0.6, "Complete desktop composition must not become a long column");
  assert(new Set(composed.scene.nodes.map(({ position }) => position.x)).size >= 3);
  assert(new Set(composed.scene.nodes.map(({ position }) => position.y)).size >= 3);
  assert.equal(composed.scene.typography.minimumTextPx, scene.typography.minimumTextPx);
  assert.equal(Object.keys(composed.physical.edges).length, scene.edges.length);
  assert.equal(composed.scene.texts[0].text, scene.texts[0].text);
  assert.equal(Object.keys(composed.physical.texts).length, 1);
});

test("intrinsic disconnected components pack at desktop reading width without invented groups", async () => {
  const { layoutInteractivePages } = await selected();
  const input = { nodes: [], relations: [] };
  const footprints = Object.create(null);
  const relationFootprints = Object.create(null);
  for (let component = 0; component < 7; component++) {
    for (let at = 0; at < 2; at++) {
      const id = `component-${component}-node-${at}`;
      input.nodes.push({ id, label: `Peer ${component} ${at}` });
      footprints[id] = {
        width: 180,
        height: 72,
        label: {
          lines: [input.nodes.at(-1).label],
          width: 180,
          height: 72,
          fontSize: 12,
          weight: "400",
          family: "JetBrains Mono",
          baselines: [
            {
              text: input.nodes.at(-1).label,
              x: 30,
              baseline: 40,
              box: { x: 30, y: 28, width: 90, height: 12 },
            },
          ],
        },
      };
    }
    const id = `component-${component}-relation`;
    input.relations.push({
      id,
      source: `component-${component}-node-0`,
      target: `component-${component}-node-1`,
    });
    relationFootprints[id] = null;
  }
  const before = structuredClone(input);
  const result = await layoutInteractivePages([input], null, {
    nodeFootprints: [footprints],
    relationFootprints: [relationFootprints],
    readingWidth: 650,
    minimumLabelSize: 12,
  });
  const layout = result.layouts[0];
  assert.deepEqual(input, before);
  assert.deepEqual(layout.groups, []);
  assert.deepEqual(
    layout.nodes.map(({ id }) => id),
    input.nodes.map(({ id }) => id),
  );
  assert.deepEqual(
    layout.relations.map(({ id }) => id),
    input.relations.map(({ id }) => id),
  );
  assert(layout.bounds.width + marks.graphInset * 2 <= 650);
  assert(
    layout.nodes.every(
      ({ width, height, label }) =>
        width === 180 && height === 72 && label.family === "JetBrains Mono",
    ),
  );
});

test("intrinsic composition allocates actual row peers without treating type as prominence", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const input = {
    schema: "architecture.interactive-scene/v1",
    id: "row-capacity",
    title: "Source-bound reading",
    subtitle: "Exact content and selected dependencies",
    typography: { minimumTextPx: 12 },
    nodes: [
      { id: "a", label: "Investigate", figureKind: "aggregate", visualRole: "external" },
      {
        id: "b",
        label: "Accept meaning",
        detail: "Scope / exceptions / guarantees",
        note: "Same Change; delivery stays open",
        figureKind: "carrier",
        visualRole: "external",
      },
      {
        id: "c",
        label: "Skills and native tools",
        detail: "Selected by the bounded Plan",
        figureKind: "aggregate",
        visualRole: "external",
      },
      {
        id: "d",
        label: "Admission to act",
        detail: "Subject + policy + intent + Facts + Plan",
        note: "Each: own PASS; BLOCK / UNKNOWN stop",
        figureKind: "aggregate",
        visualRole: "external",
      },
    ],
    groups: [],
    edges: [],
  };
  const before = structuredClone(input);
  const result = await composeIntrinsicArchitecture(input);
  const row = result.scene.nodes;
  assert(
    row.every(({ position }) => position.y === row[0].position.y),
    "A simple complete peer row remains one row",
  );
  assert(
    row.every(({ size }) => size.width === row[0].size.width && size.height === row[0].size.height),
    "Actual row tracks, not semantic types, own allocated dimensions",
  );
  assert(
    row.every(({ size }) => size.height <= 160),
    "A row must not grow to another semantic cohort maximum",
  );
  const gaps = row
    .slice(1)
    .map((node, index) => node.position.x - row[index].position.x - row[index].size.width);
  assert(
    gaps.every((gap) => gap === gaps[0] && gap >= 24),
    "Shared column widths retain equal visible gutters",
  );
  for (const node of row) {
    const original = input.nodes.find(({ id }) => id === node.id);
    const layout = result.nodeText.layouts[node.id];
    assert(layout.valid);
    for (const field of ["label", "detail", "note"])
      assert.equal(
        layout.rows
          .filter((line) => line.field === field)
          .map(({ text }) => text)
          .join(""),
        original[field] ?? "",
      );
    for (const { box } of layout.rows)
      assert(
        box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= node.size.width &&
          box.y + box.height <= node.size.height,
      );
  }
  assert.deepEqual(input, before);
});
