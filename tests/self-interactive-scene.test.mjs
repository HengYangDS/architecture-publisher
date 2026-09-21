import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SELF_RELATIONS,
} from '../editions/self/src/edition/model.mjs';
import {
  architecturePublisherInteractiveScenes,
} from '../editions/self/src/edition/interactive-scenes.mjs';
import {
  composeArchitecturePublisherInteractiveScene,
} from '../editions/self/src/edition/interactive-scene.mjs';

function semanticIds(view) {
  return [
    ...view.composition.groups.flatMap(({ entities }) =>
      entities.map((id) => 'entity:' + id),
    ),
    ...view.composition.relations.map(({ id }) => 'relation:' + id),
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
      [...entityIds].map((id) => [
        id,
        { type: 'semantic', label: id.replaceAll('-', ' ') },
      ]),
    ),
    relations: structuredClone(SELF_RELATIONS),
  };
}

test('self interactive scenes bind complete semantics to authored visual carriers', () => {
  const views = architecturePublisherInteractiveScenes();
  const model = semanticModel(views);
  for (const [id, view] of Object.entries(views)) {
    const scene = composeArchitecturePublisherInteractiveScene(
      model,
      {
        title: 'Architecture Publisher',
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
    assert(scene.viewport.width <= 1240, id);
    assert(scene.viewport.height <= 980, id);
  }
});

test('self overview is a complete visual system map, not an atomic box dump', () => {
  const view = architecturePublisherInteractiveScenes().overview;
  const model = semanticModel({ overview: view });
  const scene = composeArchitecturePublisherInteractiveScene(
    model,
    {
      title: 'Architecture Publisher',
      visualGrammar: {
        entityTypes: {},
        relationTypes: {},
      },
    },
    { id: 'overview', ...view.composition, label: view.label },
  );
  const atomicNodes = view.composition.groups.flatMap(
    ({ entities }) => entities,
  ).length;
  assert(scene.nodes.length <= 8);
  assert(scene.nodes.length < atomicNodes);
  assert(scene.viewport.width / scene.viewport.height >= 1.5);
});

test('mechanism pages expose their causal boundaries instead of collapsing them', () => {
  const views = architecturePublisherInteractiveScenes();
  const model = semanticModel(views);
  const expected = {
    semantics: ['sources', 'adapter', 'bundle', 'claims', 'uncertainty', 'reader'],
    edition: ['meaning', 'reader', 'build', 'compiler', 'static-scene', 'interactive-scene'],
    composition: ['authorship', 'static-scene', 'static-renderer', 'static-artifact', 'interactive-scene', 'interactive-renderer', 'interactive-artifact', 'candidate'],
    qualification: ['candidate', 'qualification', 'human-review', 'acceptance', 'authorization'],
    'publication-recovery': ['qualification', 'acceptance', 'authorization', 'publication', 'recovery', 'off-host-limit'],
    adoption: ['publication', 'self', 'ethos', 'aigw', 'feedback', 'source-owner'],
  };
  for (const [id, nodeIds] of Object.entries(expected)) {
    const view = views[id];
    const scene = composeArchitecturePublisherInteractiveScene(
      model,
      {
        title: 'Architecture Publisher',
        visualGrammar: { entityTypes: {}, relationTypes: {} },
      },
      { id, ...view.composition, label: view.label },
    );
    assert.deepEqual(scene.nodes.map(({ id: nodeId }) => nodeId), nodeIds, id);
    assert(
      scene.nodes.every(({ detail }) => !/semantic subjects$/.test(detail)),
      id,
    );
    assert(scene.edges.length >= nodeIds.length - 1, id);
    assert(scene.viewport.width / scene.viewport.height >= 1.45, id);
  }
});
