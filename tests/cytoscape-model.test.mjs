import assert from 'node:assert/strict';
import test from 'node:test';
import { projectInteractivePage } from '../packages/publisher/renderers/cytoscape/model.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

test('only asserted source members may become visible graph carriers', () => {
  const addedNode = interactiveEditionScene().pages[0];
  addedNode.nodes.push({ ...addedNode.nodes[0], id: 'secret-ghost', label: 'Ghost' });
  assert.throws(() => projectInteractivePage(addedNode, 0), {
    code: 'render_interactive_carrier_unclaimed',
  });

  const addedRelation = interactiveEditionScene().pages[0];
  addedRelation.relations.push({
    ...addedRelation.relations[0],
    id: 'relation:9:1',
    label: 'hidden',
  });
  assert.throws(() => projectInteractivePage(addedRelation, 0), {
    code: 'render_interactive_carrier_unclaimed',
  });
});

test('same-label nodes in different source namespaces retain distinct private bindings', () => {
  const page = interactiveEditionScene().pages[0];
  const peer = structuredClone(page.nodes[0]);
  peer.namespace = 'other/model';
  peer.origin.namespace = 'other/model';
  page.nodes.push(peer);
  page.sourceAssertionCarriers[0].nodeRefs.push({ namespace: 'other/model', id: peer.id });
  const projected = projectInteractivePage(page, 0);
  assert.deepEqual(
    projected.publicPage.nodes.map(({ id, label }) => [id, label]),
    [
      ['n-0', 'Alpha & one'],
      ['n-1', 'Beta'],
      ['n-2', 'Alpha & one'],
    ],
  );
  assert.deepEqual(
    projected.carriers.nodes.map(({ source }) => source.namespace),
    ['private/model', 'private/model', 'other/model'],
  );
  assert.equal(JSON.stringify(projected.publicPage).includes('private/model'), false);
  assert.equal(JSON.stringify(projected.publicPage).includes('other/model'), false);
});

test('authored view identity supplies concise navigation without replacing the reader question', () => {
  const page = interactiveEditionScene().pages[0];
  page.id = 'source-flow';
  const { publicPage } = projectInteractivePage(page, 0);
  assert.equal(publicPage.id, 'page-0');
  assert.equal(publicPage.navigationLabel, 'Source Flow');
  assert.equal(publicPage.title, 'What is connected?');
});

test('malformed nested references and repeated assertions fail with owned diagnostics', () => {
  const cases = [
    [
      'null relation endpoint',
      (page) => (page.relations[0].to = null),
      'render_interactive_relation_endpoint_missing',
    ],
    ['null question', (page) => (page.questions[0] = null), 'render_interactive_question_invalid'],
    [
      'null source node reference',
      (page) => (page.sourceAssertionCarriers[0].nodeRefs[0] = null),
      'render_interactive_carrier_invalid',
    ],
    [
      'repeated assertion',
      (page) => page.sourceAssertionCarriers.push(structuredClone(page.sourceAssertionCarriers[0])),
      'render_interactive_identity_ambiguous',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const page = interactiveEditionScene().pages[0];
    mutate(page);
    assert.throws(() => projectInteractivePage(page, 0), { code }, name);
  }
});

test('page structure cannot be mistaken for an admitted semantic Scene', () => {
  const cases = [
    ['null page', () => null],
    ['missing identity', (page) => ({ ...page, id: '' })],
    ['missing question IDs', (page) => ({ ...page, questionIds: null })],
    ['missing questions', (page) => ({ ...page, questions: null })],
    ['missing nodes', (page) => ({ ...page, nodes: null })],
    ['missing relations', (page) => ({ ...page, relations: null })],
    ['missing source carriers', (page) => ({ ...page, sourceAssertionCarriers: null })],
    ['missing editorial assertions', (page) => ({ ...page, editorialAssertions: null })],
    ['missing limit map', (page) => ({ ...page, limitsByQuestion: null })],
  ];
  for (const [name, alter] of cases)
    assert.throws(
      () => projectInteractivePage(alter(interactiveEditionScene().pages[0]), 0),
      {
        code: 'render_interactive_scene_invalid',
      },
      name,
    );
});

test('source nodes and relations require distinct identities and actual endpoints', () => {
  const cases = [
    ['null node', (page) => (page.nodes[0] = null), 'render_interactive_node_invalid'],
    ['missing node ID', (page) => (page.nodes[0].id = ''), 'render_interactive_node_invalid'],
    ['missing node label', (page) => (page.nodes[0].label = ''), 'render_interactive_node_invalid'],
    [
      'duplicate node',
      (page) => page.nodes.push(structuredClone(page.nodes[0])),
      'render_interactive_identity_ambiguous',
    ],
    [
      'missing relation ID',
      (page) => (page.relations[0].id = ''),
      'render_interactive_relation_invalid',
    ],
    [
      'missing relation origin',
      (page) => (page.relations[0].origin = null),
      'render_interactive_relation_invalid',
    ],
    [
      'unsupported relation direction',
      (page) => (page.relations[0].direction = 'unknown'),
      'render_interactive_relation_invalid',
    ],
    [
      'unknown relation endpoint',
      (page) => (page.relations[0].to.id = 'absent'),
      'render_interactive_relation_endpoint_missing',
    ],
    [
      'duplicate relation',
      (page) => page.relations.push(structuredClone(page.relations[0])),
      'render_interactive_identity_ambiguous',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const page = interactiveEditionScene().pages[0];
    mutate(page);
    assert.throws(() => projectInteractivePage(page, 0), { code }, name);
  }
  const qualified = interactiveEditionScene().pages[0];
  qualified.nodes[0].kind = null;
  qualified.relations[0].direction = 'bidirectional';
  qualified.relations[0].label = null;
  qualified.relations[0].kind = 'peer';
  const result = projectInteractivePage(qualified, 0).publicPage;
  assert.equal(result.nodes[0].kind, null);
  assert.equal(result.relations[0].direction, 'bidirectional');
  assert.equal(result.relations[0].label, 'peer');
});

test('source-reported relation qualifiers remain structured and fail closed when malformed', () => {
  const page = interactiveEditionScene().pages[0];
  page.relations[0].sourceQualifiers = [
    { name: 'scope', value: '"selected account"' },
    { name: 'enabled', value: 'false' },
    { name: '', value: '""' },
  ];
  const projected = projectInteractivePage(page, 0).publicPage;
  assert.deepEqual(projected.relations[0].sourceQualifiers, [
    { name: 'scope', value: '"selected account"' },
    { name: 'enabled', value: 'false' },
    { name: '', value: '""' },
  ]);
  for (const invalid of [
    null,
    {},
    [{ name: 'scope', value: undefined }],
    [{ name: 'scope', value: false }],
    [{ name: 'scope', value: 'not-json' }],
    [{ name: 'scope', value: ' "noncanonical" ' }],
    [{ name: 'scope', value: 'present', extra: true }],
    [
      { name: 'scope', value: 'first' },
      { name: 'scope', value: 'second' },
    ],
  ]) {
    const altered = interactiveEditionScene().pages[0];
    altered.relations[0].sourceQualifiers = invalid;
    assert.throws(() => projectInteractivePage(altered, 0), {
      code: 'render_interactive_relation_qualifiers_invalid',
    });
  }
});

test('reader questions, editorial claims, and source carriers remain explicit', () => {
  const cases = [
    [
      'duplicate question',
      (page) => page.questions.push(structuredClone(page.questions[0])),
      'render_interactive_identity_ambiguous',
    ],
    [
      'unknown question',
      (page) => page.questionIds.push('absent'),
      'render_interactive_question_invalid',
    ],
    [
      'missing question limit list',
      (page) => (page.limitsByQuestion.shape = null),
      'render_interactive_question_invalid',
    ],
    [
      'blank limit reason',
      (page) => (page.limitsByQuestion.shape[0].reason = ''),
      'render_interactive_limit_invalid',
    ],
    [
      'empty question set',
      (page) => (page.questionIds = []),
      'render_interactive_question_invalid',
    ],
    [
      'malformed editorial',
      (page) => page.editorialAssertions.push({ kind: 'source' }),
      'render_interactive_editorial_invalid',
    ],
    [
      'malformed carrier',
      (page) => (page.sourceAssertionCarriers[0].nodeRefs = null),
      'render_interactive_carrier_invalid',
    ],
    [
      'empty carrier',
      (page) => {
        page.sourceAssertionCarriers[0].nodeRefs = [];
        page.sourceAssertionCarriers[0].relationRefs = [];
      },
      'render_interactive_carrier_missing',
    ],
    [
      'unknown carrier node',
      (page) => (page.sourceAssertionCarriers[0].nodeRefs[0].id = 'absent'),
      'render_interactive_carrier_missing',
    ],
    [
      'unknown carrier relation',
      (page) => (page.sourceAssertionCarriers[0].relationRefs[0].reference = 'absent'),
      'render_interactive_carrier_missing',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const page = interactiveEditionScene().pages[0];
    mutate(page);
    assert.throws(() => projectInteractivePage(page, 0), { code }, name);
  }
});
