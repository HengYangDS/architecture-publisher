import assert from 'node:assert/strict';
import test from 'node:test';
import * as scenes from '../packages/publisher/src/scene/index.mjs';

const MODEL = 'a'.repeat(64);
const VIEWS = 'b'.repeat(64);
const node = (id, label) => ({
  namespace: 'example/model',
  id,
  sha256: MODEL,
  kind: 'component',
  label,
  origin: { namespace: 'example/model', sha256: MODEL },
});
const relation = {
  id: 'relation:4:2',
  from: { namespace: 'example/model', id: 'a' },
  to: { namespace: 'example/model', id: 'b' },
  kind: null,
  direction: 'forward',
  label: null,
  origin: { namespace: 'example/model', sha256: MODEL },
};

function meaning() {
  return {
    completeness: 'finite-unqualified-obligations',
    edition: { id: 'reader-atlas', editor: 'atlas-editor', sha256: 'c'.repeat(64) },
    editorial: {
      title: 'Selected architecture',
      narrative: { summary: 'Read the source, then the limit.' },
      visualPolicy: { profile: 'neutral' },
      presentation: { interactive: { intent: 'Two complete pages.' } },
    },
    questions: [
      { id: 'shape', audience: 'maintainer', text: 'What is connected?' },
      { id: 'risk', audience: 'maintainer', text: 'What remains uncertain?' },
    ],
    assertions: [
      {
        id: 'source-shape',
        kind: 'source',
        selection: 'overview',
        questions: ['shape'],
        semanticStatus: 'attributed-source-unproved',
      },
      {
        id: 'editorial-risk',
        kind: 'editorial',
        statement: 'The source does not prove runtime safety.',
        proponent: 'atlas-editor',
        basis: ['overview'],
        questions: ['risk'],
        semanticStatus: 'editor-attributed-unverified',
      },
    ],
    native: {
      selections: [
        {
          selectionId: 'overview',
          source: { namespace: 'example/views', sha256: VIEWS },
          target: { kind: 'view', id: 'overview' },
          members: {
            elements: [node('a', 'A'), node('b', 'B')],
            relations: [structuredClone(relation)],
          },
        },
      ],
    },
    media: {
      interactive: {
        views: [
          {
            id: 'source-page',
            questionIds: ['shape'],
            assertionIds: ['source-shape'],
            limitsByQuestion: { shape: [] },
          },
          {
            id: 'uncertainty-page',
            questionIds: ['risk'],
            assertionIds: ['editorial-risk'],
            limitsByQuestion: {
              risk: [{ kind: 'scope', reason: 'No runtime observation was selected.' }],
            },
          },
        ],
      },
    },
    limits: ['native-dependency-closure-unchecked'],
  };
}

test('interactive Edition pages each retain their own complete semantic obligation', () => {
  assert.equal(typeof scenes.composeInteractiveEditionScene, 'function');
  const result = scenes.composeInteractiveEditionScene(meaning());
  assert.equal(result.schema, 'architecture.edition-interactive-scene/v1');
  assert.equal(result.completeness, 'unqualified-scene');
  assert.equal(Object.hasOwn(result, 'readingOrder'), false);
  assert.deepEqual(
    result.pages.map(({ id }) => id),
    ['source-page', 'uncertainty-page'],
  );
  assert.deepEqual(
    result.pages[0].nodes.map(({ id }) => id),
    ['a', 'b'],
  );
  assert.deepEqual(
    result.pages[0].relations.map(({ id }) => id),
    ['relation:4:2'],
  );
  assert.deepEqual(result.pages[0].sourceAssertionCarriers[0], {
    assertionId: 'source-shape',
    selectionId: 'overview',
    kind: 'view',
    nodeRefs: [
      { namespace: 'example/model', id: 'a' },
      { namespace: 'example/model', id: 'b' },
    ],
    relationRefs: [{ namespace: 'example/model', reference: 'relation:4:2', sha256: MODEL }],
  });
  assert.deepEqual(result.pages[1].nodes, []);
  assert.deepEqual(result.pages[1].relations, []);
  assert.equal(
    result.pages[1].editorialAssertions[0].semanticStatus,
    'editor-attributed-unverified',
  );
  assert.deepEqual(result.pages[1].limitsByQuestion.risk, [
    { kind: 'scope', reason: 'No runtime observation was selected.' },
  ]);
  assert.equal(JSON.stringify(result).includes('"position"'), false);
  assert.equal(JSON.stringify(result).includes('"viewport"'), false);
  assert.equal(Object.isFrozen(result.pages[0]), true);
});

test('same-label identities from separate source namespaces never collapse', () => {
  const input = meaning();
  input.native.selections.push({
    selectionId: 'peer',
    source: { namespace: 'other/model', sha256: 'd'.repeat(64) },
    target: { kind: 'element', id: 'a' },
    members: {
      elements: [
        {
          ...node('a', 'A'),
          namespace: 'other/model',
          sha256: 'd'.repeat(64),
          origin: { namespace: 'other/model', sha256: 'd'.repeat(64) },
        },
      ],
      relations: [],
    },
  });
  input.assertions.push({
    id: 'peer-shape',
    kind: 'source',
    selection: 'peer',
    questions: ['shape'],
    semanticStatus: 'attributed-source-unproved',
  });
  input.media.interactive.views[0].assertionIds.push('peer-shape');
  const result = scenes.composeInteractiveEditionScene(input);
  assert.deepEqual(
    result.pages[0].nodes.map(({ namespace, id }) => [namespace, id]),
    [
      ['example/model', 'a'],
      ['example/model', 'b'],
      ['other/model', 'a'],
    ],
  );
});

test('an interactive page rejects absent endpoints and unbound assertions', () => {
  const missingEndpoint = meaning();
  missingEndpoint.native.selections[0].members.elements.pop();
  assert.throws(() => scenes.composeInteractiveEditionScene(missingEndpoint), {
    code: 'interactive_scene_relation_endpoint_missing',
  });
  const missingAssertion = meaning();
  missingAssertion.media.interactive.views[0].assertionIds.push('missing');
  assert.throws(() => scenes.composeInteractiveEditionScene(missingAssertion), {
    code: 'interactive_scene_assertion_unbound',
  });
});

test('uninterpreted source metadata does not become public scene content', () => {
  const input = meaning();
  input.native.selections[0].members.elements[0].opaqueMetadata = { privateNote: 'not selected' };
  input.native.selections[0].members.relations[0].opaqueMetadata = { privateNote: 'not selected' };

  const result = scenes.composeInteractiveEditionScene(input);
  assert.equal(Object.hasOwn(result.pages[0].nodes[0], 'opaqueMetadata'), false);
  assert.equal(Object.hasOwn(result.pages[0].relations[0], 'opaqueMetadata'), false);
});

test('interactive Scene rejects missing source and question bindings', () => {
  const cases = [
    [
      'selection',
      (input) => (input.assertions[0].selection = 'missing'),
      'interactive_scene_assertion_unbound',
    ],
    [
      'question',
      (input) => input.media.interactive.views[0].questionIds.push('missing'),
      'interactive_scene_question_unbound',
    ],
    [
      'element origin',
      (input) => (input.native.selections[0].members.elements[0].origin.sha256 = VIEWS),
      'interactive_scene_source_binding_invalid',
    ],
    [
      'relation origin',
      (input) => (input.native.selections[0].members.relations[0].origin.sha256 = 'invalid'),
      'interactive_scene_source_binding_invalid',
    ],
    [
      'relation endpoint',
      (input) => (input.native.selections[0].members.relations[0].to = null),
      'interactive_scene_source_binding_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = meaning();
    mutate(input);
    assert.throws(() => scenes.composeInteractiveEditionScene(input), { code }, name);
  }
});

test('interactive Scene rejects ambiguous or contradictory identities', () => {
  const cases = [
    ['selection ID', (input) => input.native.selections.push(input.native.selections[0])],
    ['assertion ID', (input) => input.assertions.push(input.assertions[0])],
    ['question ID', (input) => input.questions.push(input.questions[0])],
    ['page ID', (input) => input.media.interactive.views.push(input.media.interactive.views[0])],
  ];
  for (const [name, mutate] of cases) {
    const input = meaning();
    mutate(input);
    assert.throws(
      () => scenes.composeInteractiveEditionScene(input),
      {
        code: 'interactive_scene_identity_ambiguous',
      },
      name,
    );
  }

  const conflict = meaning();
  const contradictory = structuredClone(conflict.native.selections[0]);
  contradictory.selectionId = 'contradiction';
  contradictory.members.elements[0].label = 'Conflicting A';
  conflict.native.selections.push(contradictory);
  conflict.assertions.push({
    ...conflict.assertions[0],
    id: 'contradictory-shape',
    selection: 'contradiction',
  });
  conflict.media.interactive.views[0].assertionIds.push('contradictory-shape');
  assert.throws(() => scenes.composeInteractiveEditionScene(conflict), {
    code: 'interactive_scene_semantic_conflict',
  });
});

test('interactive Scene rejects absent selected medium and malformed obligations', () => {
  const cases = [
    ['missing meaning', () => null],
    ['missing native', (input) => ({ ...input, native: null })],
    ['missing assertions', (input) => ({ ...input, assertions: null })],
    ['missing questions', (input) => ({ ...input, questions: null })],
    ['missing interactive medium', (input) => ({ ...input, media: { static: {} } })],
    ['empty interactive medium', (input) => ({ ...input, media: { interactive: { views: [] } } })],
    ['missing editorial', (input) => ({ ...input, editorial: null })],
  ];
  for (const [name, alter] of cases)
    assert.throws(
      () => scenes.composeInteractiveEditionScene(alter(meaning())),
      {
        code: 'interactive_scene_input_invalid',
      },
      name,
    );
});
