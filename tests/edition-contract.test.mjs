import test from 'node:test';
import assert from 'node:assert/strict';
import {
  editionDigest,
  interactiveSceneDigest,
  staticSceneDigest,
  validateEdition,
} from '../src/edition/contract.mjs';
import { editionFixture } from './fixtures/edition.mjs';

test('Edition binds audience, questions, claims, scenes and obligations', () => {
  const { model, edition } = editionFixture(),
    before = structuredClone(edition);
  assert.deepEqual(validateEdition(model, edition), edition);
  assert.deepEqual(edition, before);
  assert.equal(editionDigest(model, edition).length, 64);
});

test('Edition is closed and binds the exact product and Claim Model', () => {
  for (const mutate of [
    (e) => (e.extra = true),
    (e) => (e.schema = 'architecture.semantic-publication/v2'),
    (e) => (e.id = ''),
    (e) => (e.owner = ''),
    (e) => (e.class = 'theme'),
    (e) => (e.product.name = 'Another Product'),
    (e) => (e.product.schema = 'architecture.publisher/v2'),
    (e) => (e.claimModel.schema = 'architecture.semantic-document/v1'),
    (e) => (e.claimModel.digest = '0'.repeat(64)),
  ]) {
    const { model, edition } = editionFixture();
    mutate(edition);
    assert.throws(() => validateEdition(model, edition), /edition_/);
  }
});

test('every Claim Model claim is required or explicitly omitted exactly once', () => {
  const { model, edition } = editionFixture();
  edition.requiredClaims.pop();
  assert.throws(
    () => validateEdition(model, edition),
    /edition_claim_classification_incomplete/,
  );

  const classified = editionFixture();
  const omitted = classified.edition.requiredClaims.pop();
  classified.edition.omissions[omitted] = {
    disposition: 'out-of-scope',
    reason: 'The bounded reader question does not require this claim.',
    view: null,
  };
  for (const scene of [
    classified.edition.scenes.static,
    ...Object.values(classified.edition.scenes.interactive),
  ])
    scene.claims = scene.claims.filter((id) => id !== omitted);
  classified.edition.questions.system.claims =
    classified.edition.questions.system.claims.filter((id) => id !== omitted);
  assert.doesNotThrow(() =>
    validateEdition(classified.model, classified.edition),
  );

  classified.edition.requiredClaims.push(omitted);
  assert.throws(
    () => validateEdition(classified.model, classified.edition),
    /edition_claim_classification_overlap/,
  );
});

test('overview and mechanism scenes completely answer their questions', () => {
  const staticGap = editionFixture();
  staticGap.edition.scenes.static.claims.pop();
  assert.throws(
    () => validateEdition(staticGap.model, staticGap.edition),
    /edition_overview_incomplete/,
  );

  const interactiveGap = editionFixture();
  interactiveGap.edition.scenes.interactive.overview.claims.pop();
  assert.throws(
    () => validateEdition(interactiveGap.model, interactiveGap.edition),
    /edition_overview_incomplete/,
  );

  const mechanismGap = editionFixture();
  mechanismGap.edition.scenes.interactive.runtime.claims = [];
  assert.throws(
    () => validateEdition(mechanismGap.model, mechanismGap.edition),
    /edition_question_incomplete.*runtime/,
  );

  const carrierGap = editionFixture();
  carrierGap.edition.scenes.interactive.runtime.composition.groups[0].entities = [
    'server',
  ];
  assert.throws(
    () => validateEdition(carrierGap.model, carrierGap.edition),
    /edition_scene_claim_carrier_missing.*runtime.*observed/,
  );
});

test('narrative order names every interactive scene once and starts with overview', () => {
  for (const narrative of [
    ['runtime', 'overview'],
    ['overview'],
    ['overview', 'runtime', 'runtime'],
    ['overview', 'missing'],
  ]) {
    const { model, edition } = editionFixture();
    edition.narrative = narrative;
    assert.throws(() => validateEdition(model, edition), /edition_narrative_invalid/);
  }
});

test('visual grammar and qualification obligations are explicit', () => {
  const missingGrammar = editionFixture();
  missingGrammar.edition.visualGrammar.principles = [];
  assert.throws(
    () => validateEdition(missingGrammar.model, missingGrammar.edition),
    /edition_visual_grammar_invalid/,
  );

  const missingGate = editionFixture();
  missingGate.edition.qualification.coverage = [];
  assert.throws(
    () => validateEdition(missingGate.model, missingGate.edition),
    /edition_qualification_invalid/,
  );

  const flagship = editionFixture();
  flagship.edition.class = 'flagship';
  assert.throws(
    () => validateEdition(flagship.model, flagship.edition),
    /edition_human_qualification_required/,
  );
  flagship.edition.qualification.human = [
    'faithful',
    'intelligible',
    'restrained',
  ];
  assert.doesNotThrow(() => validateEdition(flagship.model, flagship.edition));
});

test('static and interactive scenes have independent identities', () => {
  const { model, edition } = editionFixture(),
    staticBefore = staticSceneDigest(model, edition),
    interactiveBefore = interactiveSceneDigest(model, edition);
  edition.scenes.interactive.overview.label = 'Changed interactive overview';
  assert.equal(staticSceneDigest(model, edition), staticBefore);
  assert.notEqual(interactiveSceneDigest(model, edition), interactiveBefore);
  validateEdition(model, edition);

  const aliased = editionFixture();
  aliased.edition.scenes.interactive.overview = aliased.edition.scenes.static;
  assert.throws(
    () => validateEdition(aliased.model, aliased.edition),
    /edition_json_alias/,
  );
});

test('Edition digest normalizes declared sets but preserves narrative order', () => {
  const first = editionFixture(),
    second = editionFixture();
  for (const fixture of [first, second]) {
    fixture.edition.questions.delivery = {
      audience: 'maintainer',
      prompt: 'How is implemented behavior delivered?',
      claims: ['implemented'],
      detail: 'mechanism',
      risk: 'Omission would hide the delivery boundary.',
    };
    fixture.edition.scenes.interactive.delivery = {
      label: 'Delivery boundary',
      purpose: 'mechanism',
      questions: ['delivery'],
      claims: ['implemented'],
      composition: {
        groups: [
          {
            id: 'delivery',
            label: 'Delivery',
            entities: ['client', 'server'],
          },
        ],
        relations: [
          {
            id: 'request',
            fromSide: 'right',
            toSide: 'left',
            route: 'orthogonal-h',
          },
        ],
      },
    };
    fixture.edition.narrative = ['overview', 'runtime', 'delivery'];
  }
  second.edition.requiredClaims.reverse();
  second.edition.questions.system.claims.reverse();
  second.edition.qualification.semantic.reverse();
  assert.equal(
    editionDigest(first.model, first.edition),
    editionDigest(second.model, second.edition),
  );
  second.edition.narrative = ['overview', 'delivery', 'runtime'];
  assert.notEqual(
    editionDigest(first.model, first.edition),
    editionDigest(second.model, second.edition),
  );
});
