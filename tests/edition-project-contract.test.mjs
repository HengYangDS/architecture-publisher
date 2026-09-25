import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EDITION_PROJECT_SCHEMA,
  validateEditionProject,
} from '../packages/publisher/src/edition/index.mjs';

function project() {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'system-atlas',
    editor: 'architecture-editor',
    title: 'System architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [
      { id: 'flow', audience: 'maintainer', text: 'How does a change reach publication?' },
    ],
    scope: {
      sourceNamespaces: ['ethos'],
      selections: [
        { id: 'lanes', namespace: 'ethos', kind: 'reference', reference: 'architecture.lanes' },
      ],
      limits: [],
    },
    requiredAssertions: [
      { id: 'lane-fact', kind: 'source', selection: 'lanes', questions: ['flow'] },
    ],
    omissions: [],
    transformations: [],
    narrative: {
      summary: 'Follow the change through review and publication.',
      readingOrder: ['flow'],
    },
    presentation: {
      static: {
        views: [{ id: 'overview', questions: ['flow'] }],
        intent: 'One legible overview.',
        width: 6000,
      },
      interactive: {
        views: [
          { id: 'overview', questions: ['flow'] },
          { id: 'mechanism', questions: ['flow'] },
        ],
        intent: 'Explorable mechanisms.',
      },
    },
    visualPolicy: { profile: 'neutral', override: null },
  };
}

test('Edition Project owns editorial choices without copied source facts or pixels', () => {
  const value = project();
  const before = structuredClone(value);
  const selected = validateEditionProject(value);
  assert.equal(EDITION_PROJECT_SCHEMA.$id, 'architecture.edition-project/v1');
  assert.deepEqual(selected, before);
  assert.deepEqual(value, before);
  assert.notEqual(selected, value);
  assert.equal(Object.isFrozen(selected.scope.selections[0]), true);
});

test('Edition Project admits a separately attributed cross-source editorial assertion', () => {
  const value = project();
  value.scope.sourceNamespaces.push('aigw');
  value.scope.selections.push({
    id: 'proxy',
    namespace: 'aigw',
    kind: 'query',
    language: 'likec4',
    expression: 'element proxy',
  });
  value.requiredAssertions.push({
    id: 'comparison',
    kind: 'editorial',
    statement: 'The two products expose distinct control boundaries.',
    proponent: 'architecture-editor',
    basis: ['lanes', 'proxy'],
    questions: ['flow'],
  });
  value.transformations.push({
    id: 'comparison-view',
    kind: 'compare',
    inputs: ['lanes', 'proxy'],
    output: 'comparison',
    proponent: 'architecture-editor',
    rule: 'Keep each source claimant visible.',
  });
  assert.doesNotThrow(() => validateEditionProject(value));
});

test('Edition Project rejects unknown fields, generated seals, and authored geometry', () => {
  for (const change of [
    (v) => (v.schema = 'architecture.edition-project/v2'),
    (v) => (v.candidateDigest = 'a'.repeat(64)),
    (v) => (v.scope.selections[0].x = 100),
    (v) => (v.presentation.static.nodePositions = {}),
    (v) => (v.visualPolicy.renderer = './custom.mjs'),
    (v) => (v.questions[0].approved = true),
  ]) {
    const value = project();
    change(value);
    assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
  }
});

test('Edition Project rejects unresolved editorial references and duplicate identities', () => {
  for (const change of [
    (v) => (v.questions[0].audience = 'unknown'),
    (v) => (v.requiredAssertions[0].selection = 'missing'),
    (v) => (v.requiredAssertions[0].questions = ['missing']),
    (v) => (v.scope.selections[0].namespace = 'unselected'),
    (v) => v.questions.push(structuredClone(v.questions[0])),
    (v) => (v.narrative.readingOrder = []),
    (v) => (v.presentation.static.views[0].questions = ['missing']),
  ]) {
    const value = project();
    change(value);
    assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
  }
});

test('Edition Project classifies explicit omissions and editorial propositions', () => {
  const value = project();
  value.omissions.push({
    selection: 'lanes',
    question: 'flow',
    medium: 'static',
    disposition: 'explicit-limit',
    view: 'overview',
    reason: 'The overview does not explain every Lane transition.',
  });
  value.scope.limits.push({
    question: 'flow',
    reason: 'Runtime truth requires separate observation.',
  });
  assert.doesNotThrow(() => validateEditionProject(value));

  for (const change of [
    (v) => (v.omissions[0].disposition = 'silent'),
    (v) => (v.omissions[0].reason = ''),
    (v) => (v.omissions[0].question = 'unknown'),
    (v) => (v.requiredAssertions[0].kind = 'editorial'),
  ]) {
    const invalid = structuredClone(value);
    change(invalid);
    assert.throws(() => validateEditionProject(invalid), { code: 'edition_project_invalid' });
  }

  const contradictory = structuredClone(value);
  contradictory.omissions.push({
    ...contradictory.omissions[0],
    disposition: 'outside-question',
  });
  assert.throws(() => validateEditionProject(contradictory), {
    code: 'edition_project_invalid',
  });
});

test('Edition selection preserves an owner-qualified source namespace', () => {
  const value = project();
  value.scope.sourceNamespaces[0] = 'org.example/ethos.architecture';
  value.scope.selections[0].namespace = value.scope.sourceNamespaces[0];
  assert.doesNotThrow(() => validateEditionProject(value));
});

test('neutral authoring does not require pixel dimensions or a visual override', () => {
  const value = project();
  delete value.presentation.static.width;
  delete value.visualPolicy.override;
  assert.doesNotThrow(() => validateEditionProject(value));
});

test('editorial transformation cannot relabel its output as a source assertion', () => {
  const value = project();
  value.transformations.push({
    id: 'reframed-lane',
    kind: 'rephrase',
    inputs: ['lanes'],
    output: 'lane-fact',
    proponent: 'architecture-editor',
    rule: 'Explain the source statement to the selected audience.',
  });
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
});

test('covered-elsewhere omission names a distinct target view', () => {
  const value = project();
  value.omissions.push({
    selection: 'lanes',
    question: 'flow',
    medium: 'interactive',
    disposition: 'covered-elsewhere',
    view: 'overview',
    coveredIn: 'mechanism',
    reason: 'The mechanism view carries the complete assertion.',
  });
  assert.doesNotThrow(() => validateEditionProject(value));
  delete value.omissions[0].coveredIn;
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
});

test('transformation inputs match the editorial assertion basis and output is unique', () => {
  const value = project();
  value.scope.selections.push({
    id: 'other',
    namespace: 'ethos',
    kind: 'reference',
    reference: 'architecture.proof',
  });
  value.requiredAssertions.push({
    id: 'editorial-fact',
    kind: 'editorial',
    statement: 'The two mechanisms meet at a verified boundary.',
    proponent: 'architecture-editor',
    basis: ['lanes'],
    questions: ['flow'],
  });
  value.transformations.push({
    id: 'derived-view',
    kind: 'compare',
    inputs: ['other'],
    output: 'editorial-fact',
    proponent: 'architecture-editor',
    rule: 'Compare only attributed source statements.',
  });
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
  value.transformations[0].inputs = ['lanes'];
  assert.doesNotThrow(() => validateEditionProject(value));
  value.transformations.push({ ...value.transformations[0], id: 'second-derivation' });
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
});

test('every promised question appears in a selected medium', () => {
  const value = project();
  value.questions.push({
    id: 'orphan',
    audience: 'maintainer',
    text: 'What evidence supports the claimed transition?',
  });
  value.requiredAssertions[0].questions.push('orphan');
  value.narrative.readingOrder.push('orphan');
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
});

test('declared views are the sole question inventory for each medium', () => {
  const value = project();
  assert.doesNotThrow(() => validateEditionProject(value));
  value.presentation.static.questions = ['flow'];
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
  delete value.presentation.static.questions;
  value.presentation.interactive.views.push({ id: 'overview', questions: ['flow'] });
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
});

test('an omission resolves to declared views in one medium', () => {
  const value = project();
  value.omissions.push({
    medium: 'interactive',
    view: 'overview',
    coveredIn: 'mechanism',
    selection: 'lanes',
    question: 'flow',
    disposition: 'covered-elsewhere',
    reason: 'The mechanism view carries this source assertion.',
  });
  assert.doesNotThrow(() => validateEditionProject(value));

  const missingTarget = structuredClone(value);
  missingTarget.omissions[0].coveredIn = 'unknown';
  assert.throws(() => validateEditionProject(missingTarget), { code: 'edition_project_invalid' });

  const missingSource = structuredClone(value);
  missingSource.omissions[0].view = 'unknown';
  assert.throws(() => validateEditionProject(missingSource), { code: 'edition_project_invalid' });

  const otherMedium = structuredClone(value);
  otherMedium.presentation.interactive.views.pop();
  otherMedium.presentation.static.views.push({ id: 'mechanism', questions: ['flow'] });
  assert.throws(() => validateEditionProject(otherMedium), { code: 'edition_project_invalid' });

  const wrongQuestion = structuredClone(value);
  wrongQuestion.questions.push({
    id: 'risk',
    audience: 'maintainer',
    text: 'What remains unknown?',
  });
  wrongQuestion.narrative.readingOrder.push('risk');
  wrongQuestion.presentation.interactive.views[1].questions = ['risk'];
  assert.throws(() => validateEditionProject(wrongQuestion), { code: 'edition_project_invalid' });

  const cyclic = structuredClone(value);
  cyclic.omissions.push({ ...cyclic.omissions[0], view: 'mechanism', coveredIn: 'overview' });
  assert.throws(() => validateEditionProject(cyclic), { code: 'edition_project_invalid' });
});

test('an outside-question omission cannot contradict its view questions', () => {
  const value = project();
  value.omissions.push({
    medium: 'static',
    view: 'overview',
    selection: 'lanes',
    question: 'flow',
    disposition: 'outside-question',
    reason: 'This view excludes the flow question.',
  });
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
});
