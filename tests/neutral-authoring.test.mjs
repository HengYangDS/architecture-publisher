import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/index.mjs';
import { assembleEditionSelection } from '../packages/publisher/src/edition/selection.mjs';
import * as scenes from '../packages/publisher/src/scene/index.mjs';
import {
  importLikeC4Layout,
  importLikeC4Native,
} from '../packages/publisher/src/semantics/index.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sources = new Map([
  [
    'example/model',
    Buffer.from(
      "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b }\n",
    ),
  ],
  ['example/views', Buffer.from('views { view overview { include * } }\n')],
]);

function editionProject() {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'native-portrait',
    editor: 'portrait-editor',
    title: 'Selected architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is connected?' }],
    scope: {
      sourceNamespaces: [...sources.keys()],
      selections: [
        {
          id: 'overview',
          namespace: 'example/views',
          kind: 'reference',
          reference: 'view:overview',
        },
      ],
      limits: [],
    },
    requiredAssertions: [
      { id: 'source-shape', kind: 'source', selection: 'overview', questions: ['shape'] },
    ],
    omissions: [],
    transformations: [],
    narrative: { summary: 'The selected source view.', readingOrder: ['shape'] },
    presentation: {
      static: { views: [{ id: 'portrait', questions: ['shape'] }], intent: 'One overview.' },
      interactive: {
        views: [{ id: 'portrait', questions: ['shape'] }],
        intent: 'An explorable overview.',
      },
    },
    visualPolicy: { profile: 'neutral' },
  };
}

function materialized(project = editionProject()) {
  return assembleEditionSelection({
    request: {
      sources: [...sources.keys()].map((namespace, index) => ({
        id: `source-${index}`,
        namespace,
      })),
      providers: [],
      media: ['static', 'interactive'],
      toolchain: { profile: 'portable' },
    },
    edition: { content: Buffer.from(JSON.stringify(project) + '\n'), resources: [] },
    sources: [...sources].map(([namespace, content]) => ({
      namespace,
      format: { id: 'likec4/dsl', version: 'unversioned' },
      claimant: 'fixture-maintainer',
      revisionEvidence: {
        kind: 'content',
        scope: 'selected-root',
        canonicalization: 'raw-bytes/v1',
        algorithm: 'sha256',
        value: sha(content),
        verification: 'recomputed',
      },
      content,
    })),
  });
}

async function selectedInputs(project) {
  const selected = materialized(project);
  return {
    meaning: await compileEditionMeaning(selected),
    layout: await importLikeC4Layout({
      lock: selected.lock,
      readSource: selected.readSource,
      view: { namespace: 'example/views', id: 'overview' },
    }),
  };
}

test('a neutral static scene carries declared source assertions without authored geometry', async () => {
  assert.equal(typeof scenes.composeStaticEditionScene, 'function');
  const { meaning, layout } = await selectedInputs();
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.equal(scene.schema, 'architecture.edition-static-scene/v1');
  assert.equal(scene.completeness, 'unqualified-scene');
  assert.equal(scene.edition.id, 'native-portrait');
  assert.equal(scene.title, 'Selected architecture');
  assert.equal(scene.summary, 'The selected source view.');
  assert.equal(scene.visualPolicy.profile, 'neutral');
  assert.equal(scene.requestedWidth, null);
  assert.deepEqual(scene.questionIds, ['shape']);
  assert.deepEqual(
    scene.nodes.map(({ id, label }) => [id, label]),
    [
      ['a', 'A'],
      ['b', 'B'],
    ],
  );
  assert.equal(scene.edges.length, 1);
  assert.equal(scene.edges[0].relations.length, 1);
  assert.match(scene.edges[0].relations[0].reference, /^relation:[1-9]\d*:[1-9]\d*$/u);
  assert.deepEqual(scene.sourceAssertionCarriers, [
    {
      assertionId: 'source-shape',
      kind: 'view',
      selectionId: 'overview',
      nodeIds: ['a', 'b'],
      relationReferences: [scene.edges[0].relations[0].reference],
    },
  ]);
  assert.equal(Object.hasOwn(scene, 'svg'), false);
  assert.equal(Object.isFrozen(scene.nodes), true);
});

test('a scene refuses geometry that drops one required source relation', async () => {
  const { meaning, layout } = await selectedInputs();
  const dropped = structuredClone(layout);
  dropped.edges = [];
  assert.throws(() => scenes.composeStaticEditionScene(meaning, dropped), {
    code: 'static_scene_native_membership_mismatch',
  });
});

test('a scene refuses duplicate or falsely rewired native carriers', async () => {
  const { meaning, layout } = await selectedInputs();
  const changes = [
    (value) => value.nodes.push(structuredClone(value.nodes[0])),
    (value) => value.edges.push(structuredClone(value.edges[0])),
    (value) => (value.edges[0].from.id = 'b'),
  ];
  for (const change of changes) {
    const altered = structuredClone(layout);
    change(altered);
    assert.throws(() => scenes.composeStaticEditionScene(meaning, altered), {
      code: 'static_scene_native_membership_mismatch',
    });
  }
});

test('a source element assertion does not smuggle unrelated view members into the scene', async () => {
  const authored = editionProject();
  authored.scope.selections.unshift({
    id: 'element',
    namespace: 'example/model',
    kind: 'reference',
    reference: 'element:a',
  });
  authored.requiredAssertions[0].selection = 'element';
  authored.presentation.static.width = 6000;
  const { meaning, layout } = await selectedInputs(authored);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.equal(scene.requestedWidth, 6000);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ['a'],
  );
  assert.deepEqual(scene.edges, []);
  assert.deepEqual(scene.bounds, {
    x: scene.nodes[0].x,
    y: scene.nodes[0].y,
    width: scene.nodes[0].width,
    height: scene.nodes[0].height,
  });
  assert(scene.bounds.height < layout.bounds.height);
  assert.deepEqual(scene.sourceAssertionCarriers[0].nodeIds, ['a']);
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationReferences, []);
});

test('a relation assertion keeps its exact source locator and both visible endpoints', async () => {
  const selected = materialized();
  const index = await importLikeC4Native({ lock: selected.lock, readSource: selected.readSource });
  const origin = index.relations[0].origin;
  const reference = `relation:${origin.range.start.line + 1}:${origin.range.start.character + 1}`;
  const authored = editionProject();
  authored.scope.selections.unshift({
    id: 'relation',
    namespace: origin.namespace,
    kind: 'reference',
    reference,
  });
  authored.requiredAssertions[0].selection = 'relation';
  const { meaning, layout } = await selectedInputs(authored);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ['a', 'b'],
  );
  assert.equal(scene.edges.length, 1);
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationReferences, [reference]);
  assert.equal(scene.edges[0].relations[0].origin.namespace, origin.namespace);
});

test('editorial prose stays attributed and does not become a source node or edge', async () => {
  const authored = editionProject();
  authored.requiredAssertions[0] = {
    id: 'editorial-shape',
    kind: 'editorial',
    statement: 'The overview is deliberately scoped.',
    proponent: 'portrait-editor',
    basis: ['overview'],
    questions: ['shape'],
  };
  const { meaning, layout } = await selectedInputs(authored);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.nodes, []);
  assert.deepEqual(scene.edges, []);
  assert.equal(scene.bounds, null);
  assert.deepEqual(scene.sourceAssertionCarriers, []);
  assert.equal(scene.editorialAssertions[0].semanticStatus, 'editor-attributed-unverified');
});

test('ambiguous views and unsupported visual policies fail rather than choosing a template', async () => {
  const extraView = editionProject();
  extraView.presentation.static.views.push({ id: 'second', questions: ['shape'] });
  const selected = await selectedInputs(extraView);
  assert.throws(() => scenes.composeStaticEditionScene(selected.meaning, selected.layout), {
    code: 'static_scene_composition_ambiguous',
  });
  const unknownPolicy = editionProject();
  unknownPolicy.visualPolicy.profile = 'unimplemented-art-direction';
  const other = await selectedInputs(unknownPolicy);
  assert.throws(() => scenes.composeStaticEditionScene(other.meaning, other.layout), {
    code: 'static_scene_visual_policy_unadmitted',
  });
});

test('the static scene rejects malformed ownership and source bindings', async () => {
  const { meaning, layout } = await selectedInputs();
  assert.throws(() => scenes.composeStaticEditionScene(null, layout), {
    code: 'static_scene_input_invalid',
  });
  const ambiguous = structuredClone(meaning);
  ambiguous.native.selections.push({
    ...ambiguous.native.selections[0],
    selectionId: 'second-view',
  });
  assert.throws(() => scenes.composeStaticEditionScene(ambiguous, layout), {
    code: 'static_scene_composition_ambiguous',
  });
  const wrongView = structuredClone(layout);
  wrongView.view.sha256 = '0'.repeat(64);
  assert.throws(() => scenes.composeStaticEditionScene(meaning, wrongView), {
    code: 'static_scene_native_membership_mismatch',
  });
  const invalidGeometry = structuredClone(layout);
  invalidGeometry.nodes[0].x = Number.NaN;
  assert.throws(() => scenes.composeStaticEditionScene(meaning, invalidGeometry), {
    code: 'static_scene_geometry_invalid',
  });
  const unknownAssertion = structuredClone(meaning);
  unknownAssertion.media.static.views[0].assertionIds = ['missing'];
  assert.throws(() => scenes.composeStaticEditionScene(unknownAssertion, layout), {
    code: 'static_scene_assertion_unbound',
  });
  const unavailableOverride = structuredClone(meaning);
  unavailableOverride.editorial.visualPolicy.override = 'visual.json';
  assert.throws(() => scenes.composeStaticEditionScene(unavailableOverride, layout), {
    code: 'static_scene_visual_policy_unadmitted',
  });
  const unboundSelection = structuredClone(meaning);
  unboundSelection.assertions[0].selection = 'missing';
  assert.throws(() => scenes.composeStaticEditionScene(unboundSelection, layout), {
    code: 'static_scene_assertion_unbound',
  });
  for (const target of ['element', 'relation']) {
    const unrepresented = structuredClone(meaning);
    const selected = structuredClone(unrepresented.native.selections[0]);
    selected.selectionId = 'unrepresented';
    selected.target.kind = target;
    selected.members =
      target === 'element'
        ? { elements: [{ namespace: 'example/model', id: 'missing' }], relations: [] }
        : {
            elements: selected.members.elements,
            relations: [{ ...selected.members.relations[0], id: 'relation:999:999' }],
          };
    unrepresented.native.selections.push(selected);
    unrepresented.assertions[0].selection = 'unrepresented';
    assert.throws(() => scenes.composeStaticEditionScene(unrepresented, layout), {
      code: 'static_scene_assertion_unbound',
    });
  }
});

test('an upstream aggregate cannot stand in for one selected relation', async () => {
  const { meaning, layout } = await selectedInputs();
  const scoped = structuredClone(meaning);
  const grouped = structuredClone(layout);
  const view = scoped.native.selections[0];
  const original = view.members.relations[0];
  const second = {
    ...original,
    id: 'relation:100:1',
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
    selectionId: 'one-relation',
    target: { kind: 'relation', id: original.id },
    members: { elements: view.members.elements, relations: [original] },
  });
  scoped.assertions[0].selection = 'one-relation';
  assert.throws(() => scenes.composeStaticEditionScene(scoped, grouped), {
    code: 'static_scene_aggregate_unrepresentable',
  });
});
