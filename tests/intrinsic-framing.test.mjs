import assert from "node:assert/strict";
import test from "node:test";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";
import { parallelWorkScene } from "./fixtures/intrinsic-composition.mjs";

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

test("an overfull complete graph remains source reading rather than an accepted overview", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const { scene } = parallelWorkScene();
  const original = structuredClone(scene);
  await assert.rejects(composeIntrinsicArchitecture(scene), (error) => {
    assert.equal(error.code, "render_interactive_layout_infeasible");
    assert(error.message.length > 0, "The rejected layout retains its actual constraint");
    assert.deepEqual(error.diagnostics, [
      {
        view: scene.id,
        questions: [],
        need: "intrinsic-layout-resolution",
        constraint: error.message,
      },
    ]);
    return true;
  });
  const source = await composeIntrinsicArchitecture(scene, null, undefined, "source");
  assert(source.scene.viewport.height > marks.desktopReadingHeight);
  assert.deepEqual(
    source.scene.nodes.map((node) => {
      const meaning = { ...node };
      delete meaning.position;
      delete meaning.size;
      return meaning;
    }),
    original.nodes,
  );
  assert.deepEqual(
    source.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    original.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  assert(Object.values(source.nodeText.layouts).every(({ valid }) => valid));
  assert.deepEqual(scene, original);
});

test("infeasible formation overview preserves complete source candidate search", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const input = {
    schema: "architecture.interactive-scene/v1",
    id: "repository-formation",
    title: "Repository formation",
    subtitle: "Exact inputs and local effects",
    typography: { minimumTextPx: 12 },
    groups: [],
    nodes: [
      [
        "inputs",
        "Own subject / current policy",
        "Own Commitment / Facts / Plan / candidate",
        "Own executed local proof",
        "aggregate",
      ],
      ["expected", "Founding state", "Founding object and expected absence", "", "observation"],
      [
        "admit",
        "Evaluate declared proof claims",
        "Exact subject · predicate · scope",
        "bindings · validity · verifier",
        "verdict",
      ],
      [
        "recheck",
        "Fresh effect-time recheck",
        "Rebind authority and exact prestate",
        "",
        "observation",
      ],
      ["runner", "Single-use runner", "Bound to the admitted operation", "", "execution"],
      [
        "cas",
        "Founding local CAS",
        "Apply against exact expected state",
        "No cross-provider transaction",
        "effect_aperture",
      ],
      ["observe", "Post-observe", "", "An attempt is not proof of success", "observation"],
      [
        "attest",
        "Scoped Attestation",
        "",
        "Durable result, never future permission",
        "durable_root",
      ],
      ["refused", "No new attempt", "BLOCK or UNKNOWN before execution", "", "verdict"],
      ["unknown", "Outcome unknown", "The effect may already have happened", "", "recovery"],
      ["reobserve", "Re-observe current state", "Re-observe; never replay blindly", "", "recovery"],
      [
        "recheck-refused",
        "Freshness check refused",
        "No admitted runner for stale inputs",
        "",
        "observation",
      ],
      [
        "cas-rejected",
        "CAS precondition rejected",
        "No update by this CAS attempt",
        "Other effects are not rolled back",
        "aggregate",
      ],
      [
        "conditions",
        "Resolve the actual cause",
        "If model gap: preserve counterexample",
        "",
        "aggregate",
      ],
      [
        "inventory",
        "Inspect founding state",
        "Observe before creating anything",
        "Prove expected absence; preserve provenance",
        "aggregate",
      ],
      ["prepare", "Preview Skills scaffold", "Minimal native assets; no write", "", "aggregate"],
      [
        "preview",
        "Preview binding plan",
        "project/config.toml",
        "No write; review conflicts / rollback",
        "conformance",
      ],
      [
        "binding-conflict",
        "Binding conflict: stop",
        "Different nonempty binding stays intact",
        "No overwrite; resolve under its owner",
        "aggregate",
      ],
    ].map(([id, label, detail, note, figureKind]) => ({
      id,
      label,
      visualRole: "external",
      figureKind,
      ...(detail ? { detail } : {}),
      ...(note ? { note } : {}),
    })),
    edges: [
      ["evaluate", "inputs", "admit", "default", "evaluate all inputs"],
      ["pass", "admit", "recheck", "default", "own PASS"],
      ["bind-prestate", "expected", "recheck", "dashed", "bind exact state"],
      ["admit-runner", "recheck", "runner", "default", "fresh"],
      ["apply", "runner", "cas", "default", "apply"],
      ["postobserve", "cas", "observe", "default", "postobserve"],
      ["attest-result", "observe", "attest", "default", "observed result"],
      ["refuse", "admit", "refused", "dashed", "non-PASS"],
      ["unknown-result", "observe", "unknown", "literal"],
      ["recover", "unknown", "reobserve", "dashed", "observe again"],
      ["recompile", "reobserve", "inventory", "literal"],
      ["resolve", "conditions", "inputs", "literal"],
      ["freshness-refusal", "recheck", "recheck-refused", "literal"],
      ["cas-refusal", "cas", "cas-rejected", "literal"],
      ["rejected-reobserve", "cas-rejected", "reobserve", "literal"],
      ["resolve-cause", "refused", "conditions", "dashed", "resolve conditions"],
      ["fresh-inputs", "recheck-refused", "inputs", "literal"],
      ["inventory-prepare", "inventory", "prepare", "literal"],
      ["prepare-preview", "prepare", "preview", "literal"],
      ["preview-inputs", "preview", "inputs", "literal"],
      ["preview-conflict", "preview", "binding-conflict", "literal"],
      ["reinspect", "binding-conflict", "inventory", "literal"],
    ].map(([id, from, to, role, label]) => ({
      id,
      from,
      to,
      ...(role === "literal"
        ? { adornment: true, semanticIds: [], strokeWidth: 1.6, strokeTone: "muted", arrow: true }
        : { label, visualRole: role }),
    })),
    texts: [
      "inconclusive",
      "new attempt",
      "resolve; fresh inputs",
      "stale / invalid",
      "known mismatch",
      "observe fresh state",
      "prepare minimal scaffold",
      "review owner-native changes",
      "authorized, compatible binding",
      "differing nonempty binding",
      "resolve; inspect again",
    ].map((text, index) => ({
      id: `annotation-${index}`,
      text,
      weight: "400",
      anchor: "middle",
      tone: "muted",
      visible: true,
      semanticIds: [],
    })),
  };
  const before = structuredClone(input);
  await assert.rejects(composeIntrinsicArchitecture(input), (error) => {
    assert.equal(error.code, "render_interactive_layout_infeasible");
    assert.equal(error.diagnostics[0].view, input.id);
    assert.equal(error.diagnostics[0].need, "intrinsic-layout-resolution");
    return true;
  });
  assert.deepEqual(input, before);
  const result = await composeIntrinsicArchitecture(input, null, undefined, "source");
  assert(
    Math.max(
      result.scene.viewport.width / marks.desktopFrameWidth,
      result.scene.viewport.height / marks.desktopReadingHeight,
    ) > 1,
    "complete source exploration remains distinct from desktop overview acceptance",
  );
  assert.deepEqual(input, before);
  assert.deepEqual(
    result.scene.nodes.map((node) => {
      const meaning = { ...node };
      delete meaning.position;
      delete meaning.size;
      return meaning;
    }),
    input.nodes,
  );
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    input.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  assert.deepEqual(
    result.scene.texts.map(({ text }) => text),
    input.texts.map(({ text }) => text),
  );
  for (const node of input.nodes) {
    const rows = result.nodeText.layouts[node.id].rows;
    for (const field of ["label", "detail", "note"])
      if (node[field])
        assert.equal(
          rows
            .filter((row) => row.field === field)
            .map(({ text }) => text)
            .join(""),
          node[field],
        );
    assert(rows.every(({ fontSize }) => fontSize >= 12));
  }
  assert.equal(Object.keys(result.physical.edges).length, input.edges.length);
  assert.equal(Object.keys(result.physical.texts).length, input.texts.length);
  assert(result.compositionCost > 0);
});

test("overfull operation graph refuses overview while packing complete source on both axes", async () => {
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
  await assert.rejects(composeIntrinsicArchitecture(scene), (error) => {
    assert.equal(error.code, "render_interactive_layout_infeasible");
    assert.equal(error.diagnostics[0].view, scene.id);
    assert.equal(error.diagnostics[0].need, "intrinsic-layout-resolution");
    return true;
  });
  assert.deepEqual(scene, before);
  const composed = await composeIntrinsicArchitecture(scene, null, undefined, "source");
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
  assert(height > marks.desktopReadingHeight);
  assert(width <= 1346);
  assert(width / height >= 0.6, "Complete source composition must not become a long column");
  assert(new Set(composed.scene.nodes.map(({ position }) => position.x)).size >= 3);
  assert(new Set(composed.scene.nodes.map(({ position }) => position.y)).size >= 3);
  assert.equal(composed.scene.typography.minimumTextPx, scene.typography.minimumTextPx);
  assert.equal(Object.keys(composed.physical.edges).length, scene.edges.length);
  assert.equal(composed.scene.texts[0].text, scene.texts[0].text);
  assert.equal(Object.keys(composed.physical.texts).length, 1);
  for (const node of scene.nodes) {
    const rows = composed.nodeText.layouts[node.id].rows;
    for (const field of ["label", "detail", "note"])
      assert.equal(
        rows
          .filter((row) => row.field === field)
          .map(({ text }) => text)
          .join(""),
        node[field],
      );
    assert(rows.every(({ fontSize }) => fontSize >= 12));
  }
});
