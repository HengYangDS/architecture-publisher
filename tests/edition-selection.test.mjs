import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { assembleEditionSelection } from '../packages/publisher/src/edition/selection.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function project() {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'reader-atlas',
    editor: 'architecture-editor',
    title: 'Selected system',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [
      { id: 'shape', audience: 'maintainer', text: 'What is selected?' },
      { id: 'risk', audience: 'maintainer', text: 'What remains uncertain?' },
    ],
    scope: {
      sourceNamespaces: ['example/system'],
      selections: [
        { id: 'system', namespace: 'example/system', kind: 'reference', reference: 'system' },
      ],
      limits: [],
    },
    requiredAssertions: [
      { id: 'system-shape', kind: 'source', selection: 'system', questions: ['shape'] },
      {
        id: 'risk-editorial',
        kind: 'editorial',
        statement: 'The selected evidence does not establish runtime safety.',
        proponent: 'architecture-editor',
        basis: ['system'],
        questions: ['risk'],
      },
    ],
    omissions: [],
    transformations: [],
    narrative: { summary: 'A scoped system view.', readingOrder: ['shape', 'risk'] },
    presentation: {
      static: { questions: ['shape'], intent: 'One overview.' },
      interactive: { questions: ['shape', 'risk'], intent: 'An explorable view.' },
    },
    visualPolicy: { profile: 'neutral' },
  };
}

function assemble(editionProject, media = ['static', 'interactive']) {
  const content = Buffer.from(JSON.stringify(editionProject) + '\n');
  const source = Buffer.from('{"system":true}\n');
  return assembleEditionSelection({
    request: {
      sources: [{ id: 'system-handle', namespace: 'example/system' }],
      providers: [],
      media,
      toolchain: { profile: 'portable' },
    },
    edition: { content, resources: [] },
    sources: [
      {
        namespace: 'example/system',
        format: { id: 'example/native-json', version: '1' },
        claimant: 'system-maintainer',
        revisionEvidence: {
          kind: 'content',
          scope: 'selected-root',
          canonicalization: 'raw-bytes/v1',
          algorithm: 'sha256',
          value: sha(source),
          verification: 'recomputed',
        },
        content: source,
      },
    ],
  });
}

test('selected media derive distinct question and assertion obligations before layout', () => {
  const selected = assemble(project());
  assert.deepEqual(selected.questionObligations, {
    static: {
      questionIds: ['shape'],
      assertionsByQuestion: { shape: ['system-shape'] },
      assertionIds: ['system-shape'],
      limitQuestionIds: [],
    },
    interactive: {
      questionIds: ['shape', 'risk'],
      assertionsByQuestion: { shape: ['system-shape'], risk: ['risk-editorial'] },
      assertionIds: ['system-shape', 'risk-editorial'],
      limitQuestionIds: [],
    },
  });
  assert.equal(Object.isFrozen(selected.questionObligations.static.questionIds), true);
});

test('a question offered only in an unrequested medium cannot satisfy selection', () => {
  assert.throws(() => assemble(project(), ['static']), {
    code: 'materialized_selected_media_incomplete',
  });
});

test('a selected question without an assertion or explicit limit is unanswered', () => {
  const editionProject = project();
  editionProject.requiredAssertions.pop();
  assert.throws(() => assemble(editionProject), {
    code: 'materialized_question_unanswered',
  });
  editionProject.scope.limits.push({
    question: 'risk',
    reason: 'Runtime evidence has not been selected.',
  });
  const selected = assemble(editionProject);
  assert.deepEqual(selected.questionObligations.interactive.assertionsByQuestion.risk, []);
  assert.deepEqual(selected.questionObligations.interactive.limitQuestionIds, ['risk']);
});
