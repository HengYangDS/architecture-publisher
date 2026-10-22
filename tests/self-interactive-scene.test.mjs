import assert from "node:assert/strict";
import test from "node:test";
import { SELF_RELATIONS } from "../editions/self/src/edition/relations.mjs";
import { architecturePublisherInteractiveScenes } from "../editions/self/src/edition/interactive-scenes.mjs";
import { composeArchitecturePublisherInteractiveScene } from "../editions/self/src/edition/interactive-scene.mjs";
import { SELF_FIGURE_TYPES } from "../editions/self/src/edition/figure-types.mjs";
import { resolveFigureTypes } from "../packages/publisher/src/scene/figure-types.mjs";
import { composeIntrinsicArchitecture } from "../packages/publisher/renderers/archify/layout.mjs";
import { intrinsicReadingWidth } from "../packages/publisher/renderers/archify/routing-contract.mjs";

function semanticIds(view) {
  return [
    ...view.composition.groups.flatMap(({ entities }) => entities.map((id) => "entity:" + id)),
    ...view.composition.relations.map(({ id }) => "relation:" + id),
  ].sort();
}

function semanticModel(views) {
  const entityIds = new Set(
    Object.values(views).flatMap(({ composition }) =>
      composition.groups.flatMap(({ entities }) => entities),
    ),
  );
  return {
    entities: Object.fromEntries(
      [...entityIds].map((id) => [id, { type: "semantic", label: id.replaceAll("-", " ") }]),
    ),
    relations: structuredClone(SELF_RELATIONS),
  };
}

test("self interactive scenes bind complete semantics to internally measured visual carriers", async () => {
  const views = architecturePublisherInteractiveScenes();
  const model = semanticModel(views);
  for (const [id, view] of Object.entries(views)) {
    const scene = composeArchitecturePublisherInteractiveScene(
      model,
      {
        title: "Architecture Publisher",
        visualGrammar: {
          entityTypes: {},
          relationTypes: {},
        },
      },
      { id, ...view.composition, label: view.label },
    );
    const represented = [
      ...scene.nodes.flatMap(({ semanticIds: ids }) => ids),
      ...scene.edges.flatMap(({ semanticIds: ids }) => ids),
    ].sort();
    assert.deepEqual(represented, semanticIds(view), id);
    assert.equal(new Set(represented).size, represented.length, id);
    assert.equal(scene.groups.length, 0, id);
    const [resolved] = resolveFigureTypes([scene], SELF_FIGURE_TYPES);
    const measured = await composeIntrinsicArchitecture(scene);
    for (const node of resolved.nodes) {
      assert.equal(node.visualRole, "external", `${id}:${node.id}: neutral ordinary-node paint`);
      assert.equal(typeof node.figureKind, "string", `${id}:${node.id}: figure kind`);
      assert(node.figureKind.trim().length > 0, `${id}:${node.id}: precise figure kind`);
      assert.equal(typeof node.icon, "string", `${id}:${node.id}: deliberate icon`);
      assert.equal(
        node.icon,
        SELF_FIGURE_TYPES[node.figureKind],
        `${id}:${node.id}: global type icon`,
      );
      assert(measured.nodeText.layouts[node.id].valid, `${id}:${node.id}: complete measured text`);
      if (["overview", "edition", "publication-recovery", "adoption"].includes(id))
        assert.deepEqual(
          measured.nodeText.layouts[node.id].rows
            .filter((row) => row.field === "label")
            .map(({ text }) => text),
          [node.label],
          `${id}:${node.id}: the short title remains complete in its desktop frame`,
        );
    }
    assert.equal(Object.hasOwn(scene, "viewport"), false, `${id}: Publisher owns physical size`);
    assert(measured.scene.viewport.width <= intrinsicReadingWidth, `${id}: desktop readability`);
    assert(measured.scene.viewport.height > 0, `${id}: complete measured canvas`);
    assert(
      measured.scene.viewport.height <= 574,
      `${id}: complete frame leaves room for desktop header and reader padding`,
    );
  }
});

test("authored arrows bind only relations within their visible endpoint aggregates", () => {
  const views = architecturePublisherInteractiveScenes();
  const model = semanticModel(views);
  for (const [id, view] of Object.entries(views)) {
    const scene = composeArchitecturePublisherInteractiveScene(
      model,
      { title: "Architecture Publisher", visualGrammar: { entityTypes: {}, relationTypes: {} } },
      { id, ...view.composition, label: view.label },
    );
    const nodes = new Map(
      scene.nodes.map((node) => [
        node.id,
        new Set(
          node.semanticIds
            .filter((item) => item.startsWith("entity:"))
            .map((item) => item.slice(7)),
        ),
      ]),
    );
    for (const edge of scene.edges) {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      assert(from && to, `${id}:${edge.id}: endpoints`);
      let crosses = false;
      for (const semantic of edge.semanticIds) {
        assert(semantic.startsWith("relation:"), `${id}:${edge.id}: relation binding`);
        const relation = model.relations[semantic.slice(9)];
        assert(relation, `${id}:${edge.id}: selected relation`);
        assert(
          (from.has(relation.subject) || to.has(relation.subject)) &&
            (from.has(relation.object) || to.has(relation.object)),
          `${id}:${edge.id}:${semantic}: foreign endpoint`,
        );
        if (from.has(relation.subject) && to.has(relation.object)) crosses = true;
      }
      assert(crosses, `${id}:${edge.id}: no directed crossing`);
    }
  }
});

test("self overview is a complete internally composed system map, not an atomic box dump", async () => {
  const view = architecturePublisherInteractiveScenes().overview;
  const model = semanticModel({ overview: view });
  const scene = composeArchitecturePublisherInteractiveScene(
    model,
    {
      title: "Architecture Publisher",
      visualGrammar: {
        entityTypes: {},
        relationTypes: {},
      },
    },
    { id: "overview", ...view.composition, label: view.label },
  );
  const atomicNodes = view.composition.groups.flatMap(({ entities }) => entities).length;
  assert(scene.nodes.length <= 8);
  assert(scene.nodes.length < atomicNodes);
  const measured = await composeIntrinsicArchitecture(scene);
  assert(measured.scene.viewport.width <= intrinsicReadingWidth);
  assert(measured.scene.nodes.every(({ id }) => measured.nodeText.layouts[id].valid));
  const byId = new Map(scene.nodes.map((node) => [node.id, node]));
  assert.equal(byId.get("authorship").detail, "reader questions · Build Request");
  assert.deepEqual(
    measured.scene.edges.map(({ id, from, to, label, semanticIds }) => ({
      id,
      from,
      to,
      label,
      semanticIds,
    })),
    scene.edges.map(({ id, from, to, label, semanticIds }) => ({
      id,
      from,
      to,
      label,
      semanticIds,
    })),
    "Internal placement retains every source-bound directed relationship",
  );
});

test("mechanism pages expose their causal boundaries instead of collapsing them", async () => {
  const views = architecturePublisherInteractiveScenes();
  const model = semanticModel(views);
  const expected = {
    semantics: ["sources", "adapter", "bundle", "claims", "uncertainty", "reader"],
    edition: ["meaning", "reader", "build", "compiler", "static-scene", "interactive-scene"],
    composition: [
      "authorship",
      "static-scene",
      "static-renderer",
      "static-artifact",
      "interactive-scene",
      "interactive-renderer",
      "interactive-artifact",
      "candidate",
    ],
    qualification: ["candidate", "qualification", "human-review", "acceptance", "authorization"],
    "publication-recovery": [
      "qualification",
      "acceptance",
      "authorization",
      "publication",
      "recovery",
      "off-host-limit",
    ],
    adoption: ["publication", "self", "ethos", "aigw", "feedback", "source-owner"],
  };
  for (const [id, nodeIds] of Object.entries(expected)) {
    const view = views[id];
    const scene = composeArchitecturePublisherInteractiveScene(
      model,
      {
        title: "Architecture Publisher",
        visualGrammar: { entityTypes: {}, relationTypes: {} },
      },
      { id, ...view.composition, label: view.label },
    );
    if (id === "edition")
      assert.equal(
        scene.nodes.find(({ id: nodeId }) => nodeId === "build").detail,
        "model · Project · media",
      );
    assert.deepEqual(
      scene.nodes.map(({ id: nodeId }) => nodeId),
      nodeIds,
      id,
    );
    assert(
      scene.nodes.every(({ detail }) => !/semantic subjects$/.test(detail)),
      id,
    );
    assert(scene.edges.length >= nodeIds.length - 1, id);
    const measured = await composeIntrinsicArchitecture(scene);
    assert(measured.scene.viewport.width <= intrinsicReadingWidth, `${id}: desktop readability`);
    assert(
      measured.scene.nodes.every(({ id }) => measured.nodeText.layouts[id].valid),
      id,
    );
  }
});
