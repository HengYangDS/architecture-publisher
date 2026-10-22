import assert from "node:assert/strict";
import test from "node:test";
import * as scenes from "../packages/publisher/src/scene/index.mjs";
import { importLikeC4Native } from "../packages/publisher/src/semantics/index.mjs";
import { compileEditionMeaning } from "../packages/publisher/src/compiler/index.mjs";
import {
  composeStaticSelectionLayout,
  composeSelectedStaticRefinementLayout,
  selectedStaticNativeViews,
} from "../packages/publisher/src/scene/static/selection.mjs";
import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/index.mjs";
import { composeDagreStaticGeometry } from "../packages/publisher/renderers/dagre/static.mjs";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import {
  figureIcons,
  editionProject,
  materialized,
  selectedInputs,
} from "./fixtures/neutral-authoring.mjs";

test("static grouping refuses missing, duplicated, or contradictory source authority", async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: "entry", label: "Entry", elements: [{ namespace: "example/model", id: "a" }] },
    { id: "service", label: "Service", elements: [{ namespace: "example/model", id: "b" }] },
  ];
  const { meaning } = await selectedInputs(project);
  assert.equal(composeStaticSelectionLayout(meaning).nodes.length, 2);
  const ungrouped = structuredClone(meaning);
  delete ungrouped.editorial.presentation.static.views[0].groups;
  assert.throws(() => composeStaticSelectionLayout(ungrouped), {
    code: "static_selection_flat_unadmitted",
  });
  for (const mutate of [
    (value) => (value.media.static.views[0].id = "not-authored"),
    (value) => (value.media.static.views[0].assertionIds = ["not-selected"]),
    (value) => value.assertions.push(structuredClone(value.assertions[0])),
    (value) => value.native.selections.push(structuredClone(value.native.selections[0])),
    (value) => (value.native.selections[0].format = "not-admitted"),
    (value) => (value.native.selections[0].members.elements = null),
  ]) {
    const invalid = structuredClone(meaning);
    mutate(invalid);
    assert.throws(() => composeStaticSelectionLayout(invalid), {
      code: "grouped_selection_layout_unadmitted",
    });
  }
  const conflicting = structuredClone(meaning);
  const second = structuredClone(conflicting.native.selections[0]);
  second.selectionId = "contradictory-view";
  second.members.elements[0].label = "Not the selected label";
  conflicting.native.selections.push(second);
  conflicting.assertions.push({
    id: "contradiction",
    kind: "source",
    selection: second.selectionId,
  });
  conflicting.media.static.views[0].assertionIds.push("contradiction");
  assert.throws(() => composeStaticSelectionLayout(conflicting), {
    code: "grouped_selection_semantic_conflict",
  });
});

test("native static views are selected only by this overview's exact assertion obligations", () => {
  const views = [
    { target: { kind: "view" }, selectionId: "left" },
    { target: { kind: "view" }, selectionId: "right" },
  ];
  const meaning = {
    native: { selections: views },
    assertions: [
      { id: "left-claim", kind: "source", selection: "left" },
      { id: "right-claim", kind: "source", selection: "right" },
    ],
  };
  assert.deepEqual(selectedStaticNativeViews(meaning, { assertionIds: ["left-claim"] }), [
    views[0],
  ]);
  assert.deepEqual(selectedStaticNativeViews(meaning, { assertionIds: [] }), []);
  assert.deepEqual(
    selectedStaticNativeViews(
      { ...meaning, assertions: meaning.assertions.slice(0, 1) },
      { assertionIds: ["left-claim"] },
    ),
    [views[0]],
  );
  assert.deepEqual(
    selectedStaticNativeViews(
      {
        native: { selections: [views[0], { selectionId: "raw", target: { kind: "element" } }] },
        assertions: [{ id: "raw-claim", kind: "source", selection: "raw" }],
      },
      { assertionIds: ["raw-claim"] },
    ),
    [],
  );
  assert.throws(() => selectedStaticNativeViews(meaning, { assertionIds: ["missing"] }), {
    code: "static_scene_assertion_unbound",
  });
});

test("multi-view recomposition refuses authored meaning that its structural projection cannot carry", async () => {
  const { meaning } = await selectedInputs();
  const overview = structuredClone(meaning);
  const original = overview.native.selections[0];
  overview.native.selections.push({
    ...structuredClone(original),
    selectionId: "detail",
    target: { ...original.target, id: "detail" },
  });
  overview.native.sourceReading.likec4.views.push({
    ...structuredClone(overview.native.sourceReading.likec4.views[0]),
    id: "detail",
  });
  overview.assertions.push({ ...overview.assertions[0], id: "detail", selection: "detail" });
  overview.media.static.views[0].assertionIds.push("detail");
  const shared = await composeStaticSelectionLayout(overview, composeDagreStaticGeometry);
  assert.equal(shared.nodes.length, 2);
  assert.equal(shared.edges.length, 1);
  for (const [code, mutate] of [
    [
      "native_likec4_layout_unrepresentable",
      (view) => view.nodes.push({ id: "group", parent: null, label: "Pair", element: null }),
    ],
    [
      "native_likec4_layout_unrepresentable",
      (view) => view.nodes.push({ ...view.nodes[0], id: "repeated-a" }),
    ],
    [
      "native_likec4_layout_hierarchy_unrepresentable",
      (view) => (view.nodes[1].parent = view.nodes[0].id),
    ],
    ["native_likec4_layout_label_unrepresentable", (view) => (view.nodes[0].label = "Explained A")],
    [
      "native_likec4_layout_label_unrepresentable",
      (view) => (view.edges[0].label = "Explained link"),
    ],
  ]) {
    const invalid = structuredClone(overview);
    mutate(invalid.native.sourceReading.likec4.views[1]);
    await assert.rejects(
      async () => composeStaticSelectionLayout(invalid, composeDagreStaticGeometry),
      {
        code,
      },
    );
  }
});

test("viewless element refinement uses the same flat closure as its scene", async () => {
  const project = editionProject();
  project.scope.selections = [
    {
      id: "selected-a",
      namespace: "example/model",
      kind: "reference",
      reference: "element:a",
      questions: ["shape"],
    },
  ];
  const meaning = await compileEditionMeaning(materialized(project));
  const automatic = await composeStaticSelectionLayout(meaning, composeDagreStaticGeometry);
  const refinement = {
    media: {
      static: {
        view: meaning.media.static.views[0].id,
        nodes: automatic.nodes,
        edges: [],
        groups: [],
      },
    },
  };
  const layout = composeSelectedStaticRefinementLayout(meaning, refinement);
  assert.equal(layout.closure, "flat-layout-unqualified");
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.equal(scene.nativeView, null);
  assert.equal(scene.nodes.length, 1);
});

test("authored static refinement cannot reassign selected geometry or relation provenance", async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: "entry", label: "Entry", elements: [{ namespace: "example/model", id: "a" }] },
    { id: "service", label: "Service", elements: [{ namespace: "example/model", id: "b" }] },
  ];
  const { meaning } = await selectedInputs(project);
  const selected = composeStaticSelectionLayout(meaning);
  const refinement = {
    media: {
      static: {
        view: meaning.media.static.views[0].id,
        nodes: structuredClone(selected.nodes),
        groups: structuredClone(selected.groups),
        edges: structuredClone(selected.edges),
      },
    },
  };
  assert.equal(composeSelectedStaticRefinementLayout(meaning, refinement).nodes.length, 2);
  const wrongView = structuredClone(refinement);
  wrongView.media.static.view = "unselected";
  assert.throws(() => composeSelectedStaticRefinementLayout(meaning, wrongView), {
    code: "scene_refinement_composition_unadmitted",
  });
  for (const mutate of [
    (value) => value.media.static.nodes.pop(),
    (value) => (value.media.static.nodes[1] = structuredClone(value.media.static.nodes[0])),
    (value) => value.media.static.groups.pop(),
    (value) => (value.media.static.groups[1] = structuredClone(value.media.static.groups[0])),
    (value) => (value.media.static.edges[0].relations = null),
    (value) => (value.media.static.edges[0].points = null),
    (value) => (value.media.static.edges[0].from.id = "b"),
    (value) => (value.media.static.edges[0].relations[0].reference = "unselected"),
    (value) => value.media.static.edges.push(structuredClone(value.media.static.edges[0])),
  ]) {
    const invalid = structuredClone(refinement);
    mutate(invalid);
    assert.throws(() => composeSelectedStaticRefinementLayout(meaning, invalid), {
      code: "scene_refinement_membership_mismatch",
    });
  }
});

test("static Scene composition rejects group geometry that contradicts authored membership", async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: "entry", label: "Entry", elements: [{ namespace: "example/model", id: "a" }] },
    { id: "service", label: "Service", elements: [{ namespace: "example/model", id: "b" }] },
  ];
  const { meaning } = await selectedInputs(project);
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(scenes.composeStaticEditionScene(meaning, layout).groups.length, 2);

  const wrongClosure = structuredClone(layout);
  wrongClosure.closure = "upstream-layout-unqualified";
  assert.throws(() => scenes.composeStaticEditionScene(meaning, wrongClosure), {
    code: "static_scene_input_invalid",
  });
  const relabeled = structuredClone(layout);
  relabeled.groups[0].label = "Not authored";
  assert.throws(() => scenes.composeStaticEditionScene(meaning, relabeled), {
    code: "static_scene_group_mismatch",
  });
  const displaced = structuredClone(layout);
  displaced.groups[0].x += 1_000;
  assert.throws(() => scenes.composeStaticEditionScene(meaning, displaced), {
    code: "static_scene_group_mismatch",
  });
});

test("a scene refuses geometry that drops one required source relation", async () => {
  const { meaning, layout } = await selectedInputs();
  const dropped = structuredClone(layout);
  dropped.edges = [];
  assert.throws(() => scenes.composeStaticEditionScene(meaning, dropped), {
    code: "static_scene_native_membership_mismatch",
  });
});

test("a scene refuses duplicate or falsely rewired native carriers", async () => {
  const { meaning, layout } = await selectedInputs();
  const changes = [
    (value) => value.nodes.push(structuredClone(value.nodes[0])),
    (value) => value.edges.push(structuredClone(value.edges[0])),
    (value) => (value.edges[0].from.id = "b"),
  ];
  for (const change of changes) {
    const altered = structuredClone(layout);
    change(altered);
    assert.throws(() => scenes.composeStaticEditionScene(meaning, altered), {
      code: "static_scene_native_membership_mismatch",
    });
  }
});

test("a source element assertion does not smuggle unrelated view members into the scene", async () => {
  const authored = editionProject();
  authored.scope.selections.unshift({
    id: "element",
    namespace: "example/model",
    kind: "reference",
    reference: "element:a",
    questions: ["shape"],
  });
  delete authored.scope.selections[1].questions;
  authored.presentation.static.width = 6000;
  const { meaning } = await selectedInputs(authored);
  const layout = await composeStaticSelectionLayout(meaning, composeDagreStaticGeometry);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.equal(scene.requestedWidth, 6000);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ["a"],
  );
  assert.deepEqual(scene.edges, []);
  assert.deepEqual(scene.bounds, {
    x: scene.nodes[0].x,
    y: scene.nodes[0].y,
    width: scene.nodes[0].width,
    height: scene.nodes[0].height,
  });
  assert.equal(scene.nativeView, null);
  assert.deepEqual(scene.sourceAssertionCarriers[0].nodeRefs, [
    { namespace: "example/model", id: "a" },
  ]);
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationRefs, []);
});

test("a relation assertion keeps its exact source locator and both visible endpoints", async () => {
  const selected = materialized();
  const index = await importLikeC4Native({ lock: selected.lock, readSource: selected.readSource });
  const origin = index.relations[0].origin;
  const reference = `relation:${origin.range.start.line + 1}:${origin.range.start.character + 1}`;
  const authored = editionProject();
  authored.scope.selections.unshift({
    id: "relation",
    namespace: origin.namespace,
    kind: "reference",
    reference,
    questions: ["shape"],
  });
  delete authored.scope.selections[1].questions;
  const { meaning } = await selectedInputs(authored);
  const layout = await composeStaticSelectionLayout(meaning, composeDagreStaticGeometry);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ["a", "b"],
  );
  assert.equal(scene.edges.length, 1);
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationRefs, [
    { namespace: origin.namespace, reference, sha256: origin.sha256 },
  ]);
  assert.equal(scene.edges[0].relations[0].origin.namespace, origin.namespace);
});

test("a static source assertion distinguishes same-ID nodes across namespaces", async () => {
  const selected = await selectedInputs();
  const meaning = structuredClone(selected.meaning);
  const layout = structuredClone(selected.layout);
  const view = meaning.native.selections.find(({ target }) => target.kind === "view");
  const second = view.members.elements[1];
  second.namespace = "other/model";
  second.id = "a";
  second.origin.namespace = "other/model";
  view.members.relations[0].to = { namespace: "other/model", id: "a" };
  layout.nodes[1].namespace = "other/model";
  layout.nodes[1].id = "a";
  layout.edges[0].to = { namespace: "other/model", id: "a" };
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.sourceAssertionCarriers[0].nodeRefs, [
    { namespace: "example/model", id: "a" },
    { namespace: "other/model", id: "a" },
  ]);
  assert.deepEqual(
    scene.nodes.map(({ namespace, id }) => [namespace, id]),
    [
      ["example/model", "a"],
      ["other/model", "a"],
    ],
  );
});

test("editorial prose stays attributed and does not become a source node or edge", async () => {
  const authored = editionProject();
  delete authored.scope.selections[0].questions;
  authored.editorialAssertions = [
    {
      id: "editorial-shape",
      statement: "The overview is deliberately scoped.",
      proponent: "portrait-editor",
      basis: ["overview"],
      questions: ["shape"],
    },
  ];
  const { meaning } = await selectedInputs(authored);
  const layout = { closure: "flat-layout-unqualified", view: null, nodes: [], edges: [] };
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.nodes, []);
  assert.deepEqual(scene.edges, []);
  assert.equal(scene.bounds, null);
  assert.deepEqual(scene.sourceAssertionCarriers, []);
  assert.equal(scene.editorialAssertions[0].semanticStatus, "editor-attributed-unverified");
  const staticSvg = composeStaticEditionSvg(scene, { icons: figureIcons }).bytes.toString("utf8");
  const interactiveScene = scenes.composeInteractiveEditionScene(meaning);
  const interactiveHtml = (await renderInteractiveEditionHtml(interactiveScene)).bytes.toString(
    "utf8",
  );
  for (const medium of [staticSvg, interactiveHtml]) {
    assert.match(medium, /The overview is deliberately scoped\./u);
    assert.match(medium, /portrait-editor/u);
    assert.match(medium, /unverified/u);
  }
});

test("ambiguous views and unsupported visual policies fail rather than choosing a template", async () => {
  const extraView = editionProject();
  extraView.presentation.static.views.push({ id: "second", questions: ["shape"] });
  const selected = await selectedInputs(extraView);
  assert.throws(() => scenes.composeStaticEditionScene(selected.meaning, selected.layout), {
    code: "static_scene_composition_ambiguous",
  });
  const unknownPolicy = editionProject();
  unknownPolicy.visualPolicy.profile = "unimplemented-art-direction";
  const other = await selectedInputs(unknownPolicy);
  assert.throws(() => scenes.composeStaticEditionScene(other.meaning, other.layout), {
    code: "static_scene_visual_policy_unadmitted",
  });
});

test("the static scene rejects malformed ownership and source bindings", async () => {
  const { meaning, layout } = await selectedInputs();
  assert.throws(() => scenes.composeStaticEditionScene(null, layout), {
    code: "static_scene_input_invalid",
  });
  const ambiguous = structuredClone(meaning);
  ambiguous.native.selections.push({
    ...ambiguous.native.selections[0],
    selectionId: "second-view",
  });
  assert.deepEqual(
    scenes.composeStaticEditionScene(ambiguous, layout),
    scenes.composeStaticEditionScene(meaning, layout),
  );
  const wrongView = structuredClone(layout);
  wrongView.view.sha256 = "0".repeat(64);
  assert.throws(() => scenes.composeStaticEditionScene(meaning, wrongView), {
    code: "static_scene_native_membership_mismatch",
  });
  const invalidGeometry = structuredClone(layout);
  invalidGeometry.nodes[0].x = Number.NaN;
  assert.throws(() => scenes.composeStaticEditionScene(meaning, invalidGeometry), {
    code: "static_scene_geometry_invalid",
  });
  const unknownAssertion = structuredClone(meaning);
  unknownAssertion.media.static.views[0].assertionIds = ["missing"];
  assert.throws(() => scenes.composeStaticEditionScene(unknownAssertion, layout), {
    code: "static_scene_assertion_unbound",
  });
  const unavailableOverride = structuredClone(meaning);
  unavailableOverride.editorial.visualPolicy.override = "visual.json";
  assert.throws(() => scenes.composeStaticEditionScene(unavailableOverride, layout), {
    code: "static_scene_visual_policy_unadmitted",
  });
  const unboundSelection = structuredClone(meaning);
  unboundSelection.assertions[0].selection = "missing";
  assert.throws(() => scenes.composeStaticEditionScene(unboundSelection, layout), {
    code: "static_scene_assertion_unbound",
  });
  for (const target of ["element", "relation"]) {
    const unrepresented = structuredClone(meaning);
    const selected = structuredClone(unrepresented.native.selections[0]);
    selected.selectionId = "unrepresented";
    selected.target.kind = target;
    selected.members =
      target === "element"
        ? { elements: [{ namespace: "example/model", id: "missing" }], relations: [] }
        : {
            elements: selected.members.elements,
            relations: [{ ...selected.members.relations[0], id: "relation:999:999" }],
          };
    unrepresented.native.selections.push(selected);
    unrepresented.assertions[0].selection = "unrepresented";
    const structural = { ...layout, closure: "flat-layout-unqualified", view: null };
    assert.throws(() => scenes.composeStaticEditionScene(unrepresented, structural), {
      code: "static_scene_native_membership_mismatch",
    });
  }
});

test("an upstream aggregate containing unselected relations cannot stand in for one selected relation", async () => {
  const { meaning, layout } = await selectedInputs();
  const scoped = structuredClone(meaning);
  const grouped = structuredClone(layout);
  const view = scoped.native.selections[0];
  const original = view.members.relations[0];
  const second = {
    ...original,
    id: "relation:100:1",
    origin: {
      ...original.origin,
      range: {
        start: { line: 99, character: 0 },
        end: { line: 99, character: 0 },
      },
    },
  };
  view.members.relations.push(second);
  grouped.edges[0].relations.push({
    namespace: second.origin.namespace,
    reference: second.id,
    sha256: second.origin.sha256,
  });
  scoped.native.selections.push({
    ...view,
    selectionId: "one-relation",
    target: { kind: "relation", id: original.id },
    members: { elements: view.members.elements, relations: [original] },
  });
  scoped.assertions[0].selection = "one-relation";
  grouped.closure = "flat-layout-unqualified";
  grouped.view = null;
  assert.throws(() => scenes.composeStaticEditionScene(scoped, grouped), {
    code: "static_scene_native_membership_mismatch",
  });
});
