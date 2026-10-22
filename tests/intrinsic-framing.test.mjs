import assert from "node:assert/strict";
import test from "node:test";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";

test("corresponding branch rows and columns share one coherent reading axis", async () => {
  const { compositionDisruption } =
    await import("../packages/publisher/renderers/elk/placement.mjs");
  const page = {
    nodes: ["entry", "a-1", "a-2", "a-3", "b-1", "b-2", "b-3", "exit"].map((id) => ({ id })),
    relations: [
      ["entry", "a-1"],
      ["a-1", "a-2"],
      ["a-2", "a-3"],
      ["a-3", "exit"],
      ["entry", "b-1"],
      ["b-1", "b-2"],
      ["b-2", "b-3"],
      ["b-3", "exit"],
    ].map(([source, target], index) => ({ id: `r-${index}`, source, target })),
  };
  const rows = [
    [304, 0],
    [0, 104],
    [304, 104],
    [608, 104],
    [0, 208],
    [304, 208],
    [608, 208],
    [304, 312],
  ];
  const layout = (positions) => ({
    nodes: page.nodes.map((node, index) => ({
      ...node,
      x: positions[index][0],
      y: positions[index][1],
      width: 280,
      height: 80,
    })),
  });
  assert.equal(compositionDisruption(page, layout(rows)), 0, "Aligned rows are not disruption");
  const offAxis = structuredClone(rows);
  offAxis[0][0] = 0;
  assert(
    compositionDisruption(page, layout(offAxis)) > 0,
    "Entry and exit must introduce the complete branch axis rather than one branch",
  );
  const mixed = structuredClone(rows);
  mixed[5][0] += 24;
  assert(
    compositionDisruption(page, layout(mixed)) > 0,
    "A shifted corresponding role is detected",
  );
});

test("complete fork and join fit the desktop frame without changing source text", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const labels = [
    ["entry", "Prepare and compile", "reader questions · exact source"],
    ["a-1", "Static scene", "independent causal composition"],
    ["a-2", "Static renderer", "scene to image bytes"],
    ["a-3", "Static artwork", "independent static delivery"],
    ["b-1", "Interactive scenes", "overview · mechanisms · exploration"],
    ["b-2", "Interactive renderer", "scene to standalone HTML"],
    ["b-3", "Standalone interactive HTML", "independent interactive delivery"],
    ["exit", "Publication Candidate", "source · meaning · scenes · bytes"],
  ];
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "complete-parallel-media",
    title: "Independent media",
    subtitle: "One source and two complete compositions",
    typography: { minimumTextPx: 12 },
    groups: [],
    nodes: labels.map(([id, label, detail]) => ({
      id,
      label,
      detail,
      figureKind: "component",
      visualRole: "external",
    })),
    edges: [
      ["entry", "a-1", "authors · compiles"],
      ["entry", "b-1", "authors · compiles"],
      ["a-1", "a-2", "feeds"],
      ["b-1", "b-2", "feeds"],
      ["a-2", "a-3", "renders"],
      ["b-2", "b-3", "renders"],
      ["a-3", "exit", "bundles"],
      ["b-3", "exit", "bundles"],
    ].map(([from, to, label], index) => ({
      id: `flow-${index}`,
      from,
      to,
      label,
      visualRole: "default",
    })),
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert(result.scene.viewport.width <= marks.desktopFrameWidth);
  assert(result.scene.viewport.height <= marks.desktopReadingHeight);
  assert.equal(result.compositionDisruption, 0);
  assert.equal(new Set(result.scene.nodes.map(({ size }) => JSON.stringify(size))).size, 1);
  for (const { id, label, detail } of scene.nodes) {
    const rows = result.nodeText.layouts[id].rows;
    assert.equal(
      rows
        .filter(({ field }) => field === "label")
        .map(({ text }) => text)
        .join(""),
      label,
    );
    assert.equal(
      rows
        .filter(({ field }) => field === "detail")
        .map(({ text }) => text)
        .join(""),
      detail,
    );
    assert(rows.every(({ fontSize }) => fontSize >= 12));
  }
  assert.deepEqual(scene, before);
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
});

test("native packing reserves each axis from measured caption paint", async () => {
  const { intrinsicPlacements } = await import("../packages/publisher/renderers/elk/placement.mjs");
  const page = {
    orderedFlow: false,
    nodes: Array.from({ length: 4 }, (_, index) => ({
      id: `subject-${index}`,
      width: 280,
      height: 80,
      label: {
        lines: ["Subject"],
        width: 80,
        height: 24,
        fontSize: 12,
        weight: "400",
        baselines: [],
      },
    })),
    relations: Array.from({ length: 4 }, (_, index) => ({
      id: `relationship-${index}`,
      source: `subject-${index}`,
      target: `subject-${(index + 1) % 4}`,
      label: {
        lines: ["Connects"],
        width: 80,
        height: 24,
        fontSize: 12,
        weight: "400",
        baselines: [],
      },
    })),
  };
  const before = structuredClone(page);
  const plan = intrinsicPlacements(page, 1346)[0];
  assert(
    plan.verticalEscape < plan.escape,
    "Short caption paint does not spend horizontal escape twice",
  );
  assert(
    plan.verticalEscape >= marks.routeEndpointStub,
    "A full native endpoint exit remains reserved",
  );
  assert.equal(plan.graph.children[0].height, page.nodes[0].height + plan.verticalEscape * 2);
  assert.equal(plan.graph.children[0].width, page.nodes[0].width + plan.escape * 2);
  const multiline = {
    ...page,
    relations: page.relations.map((relation) => ({
      ...relation,
      label: { ...relation.label, height: 88 },
    })),
  };
  const expanded = intrinsicPlacements(multiline, 1346)[0];
  assert(expanded.verticalEscape > plan.verticalEscape, "Actual multiline paint increases reserve");
  assert(expanded.verticalEscape >= 44 + marks.textClearance + marks.selectedRouteStroke / 2);
  assert.deepEqual(page, before);
});
