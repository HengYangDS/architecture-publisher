import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import * as compiler from '../packages/publisher/src/compiler/index.mjs';
import { assembleEditionSelection } from '../packages/publisher/src/edition/selection.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = new Map([
  [
    'example/model',
    Buffer.from("specification { element component }\nmodel { a = component 'Selected' }\n"),
  ],
  ['example/views', Buffer.from('views { view overview { include * } }\n')],
]);

function project() {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'reader-atlas',
    editor: 'example-editor',
    title: 'Selected architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [
      { id: 'shape', audience: 'maintainer', text: 'What is selected?' },
      { id: 'risk', audience: 'maintainer', text: 'What remains unverified?' },
    ],
    scope: {
      sourceNamespaces: [...sourceBytes.keys()],
      selections: [
        {
          id: 'model',
          namespace: 'example/model',
          kind: 'reference',
          reference: 'element:a',
          questions: ['shape'],
        },
        {
          id: 'overview',
          namespace: 'example/views',
          kind: 'reference',
          reference: 'view:overview',
        },
      ],
      limits: [],
    },
    editorialAssertions: [
      {
        id: 'editorial-risk',
        statement: 'The selected model does not prove runtime behavior.',
        proponent: 'example-editor',
        basis: ['model'],
        questions: ['risk'],
      },
    ],
    omissions: [
      {
        selection: 'model',
        question: 'shape',
        medium: 'static',
        disposition: 'explicit-limit',
        view: 'overview',
        reason: 'The static overview does not show this element.',
      },
    ],
    transformations: [],
    narrative: { summary: 'A bounded overview.' },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'One overview.' },
      interactive: {
        views: [{ id: 'overview', questions: ['shape', 'risk'] }],
        intent: 'An explorable overview.',
      },
    },
    visualPolicy: { profile: 'neutral' },
  };
}

function materialized(editionProject) {
  const content = Buffer.from(JSON.stringify(editionProject) + '\n');
  return assembleEditionSelection({
    request: {
      sources: [...sourceBytes.keys()].map((namespace, index) => ({
        id: `source-${index}`,
        namespace,
      })),
      providers: [],
      media: ['static', 'interactive'],
      toolchain: { profile: 'portable' },
    },
    edition: { content, resources: [] },
    sources: [...sourceBytes].map(([namespace, bytes]) => ({
      namespace,
      format: { id: 'likec4/dsl', version: 'unversioned' },
      claimant: 'example-maintainer',
      revisionEvidence: {
        kind: 'content',
        scope: 'selected-root',
        canonicalization: 'raw-bytes/v1',
        algorithm: 'sha256',
        value: sha(bytes),
        verification: 'recomputed',
      },
      content: bytes,
    })),
  });
}

test('one Edition meaning projection binds source assertions and medium-local obligations', async () => {
  assert.equal(typeof compiler.compileEditionMeaning, 'function');
  const selected = materialized(project());
  const meaning = await compiler.compileEditionMeaning(selected);
  assert.equal(meaning.completeness, 'finite-unqualified-obligations');
  assert.equal(meaning.native.subjectLockSha256, selected.lockSha256);
  assert.equal(meaning.edition.sha256, selected.lock.edition.sha256);
  assert.deepEqual(meaning.editorial, {
    title: 'Selected architecture',
    audiences: project().audiences,
    narrative: project().narrative,
    presentation: project().presentation,
    visualPolicy: project().visualPolicy,
  });
  assert.deepEqual(
    meaning.questions.map(({ id }) => id),
    ['shape', 'risk'],
  );
  assert.deepEqual(meaning.assertions[0], {
    id: 'model',
    kind: 'source',
    selection: 'model',
    questions: ['shape'],
    semanticStatus: 'attributed-source-unproved',
  });
  assert.equal(meaning.assertions[1].semanticStatus, 'editor-attributed-unverified');
  assert.deepEqual(meaning.assertions[1].basis, ['model']);
  assert.deepEqual(meaning.media.static.views[0].assertionsByQuestion.shape, []);
  assert.deepEqual(meaning.media.static.views[0].limitsByQuestion.shape, [
    {
      kind: 'omission',
      selection: 'model',
      reason: 'The static overview does not show this element.',
    },
  ]);
  assert.deepEqual(meaning.media.interactive.views[0].assertionsByQuestion, {
    shape: ['model'],
    risk: ['editorial-risk'],
  });
  assert.equal(meaning.native.selections[0].target.id, 'a');
  assert.deepEqual(meaning.editorialAssertionIdsByMedium, {
    static: [],
    interactive: ['editorial-risk'],
  });
  assert.equal(meaning.limits.includes('editorial-proposition-unverified'), false);
  assert.equal(Object.hasOwn(meaning, 'candidate'), false);
  assert.equal(Object.isFrozen(meaning.media.static.views[0]), true);
});

test('uninterpreted transformation rules cannot become compiled claims', async () => {
  const authored = project();
  authored.transformations.push({
    id: 'claim-group',
    kind: 'aggregate',
    inputs: ['model'],
    output: 'editorial-risk',
    proponent: 'example-editor',
    rule: 'Every member has the same runtime behavior.',
  });
  await assert.rejects(compiler.compileEditionMeaning(materialized(authored)), {
    code: 'edition_transformation_unadmitted',
  });
});

test('semantic groups must partition the selected elements of their own view', async () => {
  const authored = project();
  authored.omissions = [];
  const groups = [
    {
      id: 'selected',
      label: 'Selected component',
      elements: [{ namespace: 'example/model', id: 'a' }],
    },
  ];
  authored.presentation.static.views[0].groups = groups;
  authored.presentation.interactive.views[0].groups = structuredClone(groups);
  const meaning = await compiler.compileEditionMeaning(materialized(authored));
  assert.deepEqual(meaning.editorial.presentation.static.views[0].groups, groups);

  const missing = structuredClone(authored);
  missing.presentation.static.views[0].groups[0].elements[0].id = 'missing';
  await assert.rejects(compiler.compileEditionMeaning(materialized(missing)), {
    code: 'edition_group_membership_mismatch',
  });

  const omitted = structuredClone(authored);
  omitted.omissions = project().omissions;
  await assert.rejects(compiler.compileEditionMeaning(materialized(omitted)), {
    code: 'edition_group_membership_mismatch',
  });
});

test('the join consumes one bound Edition byte snapshot and rejects an invalid reader', async () => {
  await assert.rejects(compiler.compileEditionMeaning({ readEdition: 'not-a-reader' }), {
    code: 'edition_meaning_input_invalid',
  });
  const selected = materialized(project());
  let reads = 0;
  const changingReader = {
    ...selected,
    readEdition() {
      reads++;
      return reads === 1 ? selected.readEdition() : Buffer.from('{}\n');
    },
  };
  const meaning = await compiler.compileEditionMeaning(changingReader);
  assert.equal(reads, 1);
  assert.equal(meaning.edition.sha256, selected.lock.edition.sha256);
});

test('Edition identity and selected media fail before any unbound projection is admitted', async () => {
  const selected = materialized(project());
  for (const readEdition of [() => 'not-bytes', () => Buffer.from('{}\n')])
    await assert.rejects(compiler.compileEditionMeaning({ ...selected, readEdition }), {
      code: 'edition_meaning_input_invalid',
    });
  for (const edition of [
    { ...selected.lock.edition, id: 'wrong-id' },
    { ...selected.lock.edition, editor: 'wrong-editor' },
  ])
    await assert.rejects(
      compiler.compileEditionMeaning({
        ...selected,
        lock: { ...selected.lock, edition },
      }),
      { code: 'edition_meaning_input_invalid' },
    );
  for (const media of [null, [], ['static', 'static'], ['unsupported']])
    await assert.rejects(
      compiler.compileEditionMeaning({ ...selected, lock: { ...selected.lock, media } }),
      { code: 'edition_meaning_media_invalid' },
    );
});

test('an Edition with only source assertions does not inherit an editorial-verification limit', async () => {
  const authored = project();
  authored.editorialAssertions = [];
  authored.scope.selections[1].questions = ['risk'];
  const meaning = await compiler.compileEditionMeaning(materialized(authored));
  assert.deepEqual(meaning.media.interactive.views[0].assertionsByQuestion.risk, ['overview']);
  assert.deepEqual(meaning.editorialAssertionIdsByMedium, { static: [], interactive: [] });
  assert.equal(meaning.limits.includes('editorial-proposition-unverified'), false);
});
