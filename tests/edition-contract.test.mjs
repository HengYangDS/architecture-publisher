import test from 'node:test';
import assert from 'node:assert/strict';
import {
  editionDigest,
  interactiveSceneDigest,
  staticSceneDigest,
  validateEdition,
} from '../packages/publisher/src/edition/contract.mjs';
import { semanticArchitectureProjections } from '../packages/publisher/src/scene/contract.mjs';
import { claimModelDigest } from '../packages/publisher/src/semantics/document.mjs';
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

test('Edition rejects malformed authored scenes and reader commitments at their owner', () => {
  const cases = [
    [
      'composition',
      (v) => (v.scenes.static.composition = null),
      'edition_scene_composition_invalid',
    ],
    [
      'label vertical offset',
      (v) => (v.scenes.interactive.overview.composition.relations[0].labelDy = 'far'),
      'edition_scene_relation_invalid',
    ],
    [
      'label segment',
      (v) => (v.scenes.interactive.overview.composition.relations[0].labelSegment = -1),
      'edition_scene_relation_invalid',
    ],
    [
      'authored identity',
      (v) => (v.scenes.static.authoredInputSha256 = 'bad'),
      'edition_scene_invalid',
    ],
    [
      'audience identity',
      (v) => (v.audiences['Bad ID'] = { label: 'Unknown' }),
      'edition_audience_invalid',
    ],
    [
      'question audience',
      (v) => (v.questions.system.audience = 'absent'),
      'edition_question_invalid',
    ],
    ['unknown required claim', (v) => v.requiredClaims.push('absent'), 'edition_claim_unknown'],
    [
      'scene identity',
      (v) => (v.scenes.interactive['Bad ID'] = structuredClone(v.scenes.interactive.runtime)),
      'edition_scene_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const { model, edition } = editionFixture();
    mutate(edition);
    assert.throws(() => validateEdition(model, edition), { code }, name);
  }
});

test('Edition product versions conform to Semantic Versioning 2.0.0', () => {
  for (const version of ['0.0.0', '1.2.3', '0.3.0-alpha.0', '1.0.0-rc.1+build.20260922']) {
    const { model, edition } = editionFixture();
    edition.product.version = version;
    assert.doesNotThrow(() => validateEdition(model, edition), version);
  }

  for (const version of [
    'v1.2.3',
    '01.2.3',
    '1.02.3',
    '1.2.03',
    '1.2.3-alpha.01',
    '1.2.3-alpha..1',
    '1.2.3+',
  ]) {
    const { model, edition } = editionFixture();
    edition.product.version = version;
    assert.throws(() => validateEdition(model, edition), /edition_identity_invalid/, version);
  }
});

test('every Claim Model claim is required or explicitly omitted exactly once', () => {
  const { model, edition } = editionFixture();
  edition.requiredClaims.pop();
  assert.throws(() => validateEdition(model, edition), /edition_claim_classification_incomplete/);

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
  classified.edition.questions.system.claims = classified.edition.questions.system.claims.filter(
    (id) => id !== omitted,
  );
  assert.doesNotThrow(() => validateEdition(classified.model, classified.edition));

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
  carrierGap.edition.scenes.interactive.runtime.composition.groups[0].entities = ['server'];
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
  const targets = [
    {
      kind: 'physical',
      medium: 'static',
      artifact: 'overview-png',
      width: 6000,
      height: 3375,
    },
    {
      kind: 'viewport',
      medium: 'interactive',
      artifact: 'atlas',
      width: 1440,
      height: 1000,
    },
  ];
  flagship.edition.qualification.human = ['faithful', 'intelligible', 'restrained'].flatMap(
    (predicate) => targets.map((scope) => ({ predicate, scope: { ...scope } })),
  );
  assert.doesNotThrow(() => validateEdition(flagship.model, flagship.edition));

  const oneMedium = structuredClone(flagship);
  oneMedium.edition.qualification.human = oneMedium.edition.qualification.human.filter(
    ({ scope }) => scope.medium === 'static',
  );
  assert.throws(
    () => validateEdition(oneMedium.model, oneMedium.edition),
    /edition_human_qualification_required/,
  );

  const duplicate = structuredClone(flagship);
  duplicate.edition.qualification.human.push(
    structuredClone(duplicate.edition.qualification.human[0]),
  );
  assert.throws(
    () => validateEdition(duplicate.model, duplicate.edition),
    /edition_qualification_invalid/,
  );
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
  assert.throws(() => validateEdition(aliased.model, aliased.edition), /edition_json_alias/);
});

test('complete overview media carry the same semantic identities', () => {
  const missingUnclaimedEntity = editionFixture();
  missingUnclaimedEntity.model.entities.worker = {
    type: 'component',
    label: 'worker',
    qualifiers: {},
    provenance: ['contract'],
  };
  missingUnclaimedEntity.edition.claimModel.digest = claimModelDigest(missingUnclaimedEntity.model);

  assert.throws(
    () => validateEdition(missingUnclaimedEntity.model, missingUnclaimedEntity.edition),
    /edition_overview_incomplete/,
  );

  const missingUnclaimedRelation = editionFixture();
  missingUnclaimedRelation.model.relations.observes = {
    type: 'calls',
    subject: 'server',
    object: 'other',
    qualifiers: {},
    provenance: ['contract'],
  };
  missingUnclaimedRelation.edition.claimModel.digest = claimModelDigest(
    missingUnclaimedRelation.model,
  );

  assert.throws(
    () => validateEdition(missingUnclaimedRelation.model, missingUnclaimedRelation.edition),
    /edition_overview_incomplete/,
  );

  const entityDrift = editionFixture();
  entityDrift.model.entities.worker = {
    type: 'component',
    label: 'worker',
    qualifiers: {},
    provenance: ['contract'],
  };
  entityDrift.edition.claimModel.digest = claimModelDigest(entityDrift.model);
  entityDrift.edition.scenes.static.composition.groups[0].entities.push('worker');

  assert.throws(
    () => validateEdition(entityDrift.model, entityDrift.edition),
    /edition_overview_carrier_drift/,
  );

  const relationDrift = editionFixture();
  relationDrift.model.relations.observes = {
    type: 'calls',
    subject: 'server',
    object: 'other',
    qualifiers: {},
    provenance: ['contract'],
  };
  relationDrift.edition.claimModel.digest = claimModelDigest(relationDrift.model);
  relationDrift.edition.scenes.static.composition.relations.push({
    id: 'observes',
    fromSide: 'right',
    toSide: 'left',
    route: 'orthogonal-h',
  });

  assert.throws(
    () => validateEdition(relationDrift.model, relationDrift.edition),
    /edition_overview_carrier_drift/,
  );
});

test('Edition owns medium-specific composition admission', () => {
  const staticAuto = editionFixture();
  staticAuto.edition.scenes.static.composition.relations[0].route = 'auto';
  assert.throws(
    () => validateEdition(staticAuto.model, staticAuto.edition),
    /edition_scene_relation_invalid.*static/,
  );

  const staticLabelPlacement = editionFixture();
  staticLabelPlacement.edition.scenes.static.composition.relations[0].labelAt = [420, 240];
  assert.throws(
    () => validateEdition(staticLabelPlacement.model, staticLabelPlacement.edition),
    /edition_scene_relation_invalid.*static/,
  );

  const interactiveAuto = editionFixture();
  const relation = interactiveAuto.edition.scenes.interactive.overview.composition.relations[0];
  relation.route = 'auto';
  relation.labelAt = [420, 240];
  assert.equal(
    validateEdition(interactiveAuto.model, interactiveAuto.edition),
    interactiveAuto.edition,
  );
  assert.equal(
    semanticArchitectureProjections(interactiveAuto.model, interactiveAuto.edition)
      .interactiveScenes[0].relations[0].route,
    'auto',
  );

  const overfull = editionFixture();
  for (let index = 0; index < 6; index++)
    overfull.model.entities[`extra-${index}`] = {
      type: 'component',
      label: `Extra ${index}`,
      qualifiers: {},
      provenance: ['contract'],
    };
  overfull.edition.claimModel.digest = claimModelDigest(overfull.model);
  const entityIds = Object.keys(overfull.model.entities);
  overfull.edition.scenes.static.composition.groups[0].entities = [...entityIds];
  overfull.edition.scenes.interactive.overview.composition.groups[0].entities = [...entityIds];
  assert.throws(
    () => validateEdition(overfull.model, overfull.edition),
    /edition_scene_group_invalid.*static/,
  );
});

test('rendered title participates in both medium identities', () => {
  const { model, edition } = editionFixture(),
    staticBefore = staticSceneDigest(model, edition),
    interactiveBefore = interactiveSceneDigest(model, edition);
  edition.title = 'Changed rendered title';
  assert.notEqual(staticSceneDigest(model, edition), staticBefore);
  assert.notEqual(interactiveSceneDigest(model, edition), interactiveBefore);
});

test('medium identities bind selected semantic renderer inputs and normalize scene sets', () => {
  const baseline = editionFixture(),
    label = editionFixture(),
    endpoint = editionFixture(),
    reordered = editionFixture();

  label.model.entities.server.label = 'Renamed rendered server';
  label.edition.claimModel.digest = claimModelDigest(label.model);
  assert.notEqual(
    staticSceneDigest(label.model, label.edition),
    staticSceneDigest(baseline.model, baseline.edition),
  );
  assert.notEqual(
    interactiveSceneDigest(label.model, label.edition),
    interactiveSceneDigest(baseline.model, baseline.edition),
  );

  [endpoint.model.relations.request.subject, endpoint.model.relations.request.object] = [
    'server',
    'client',
  ];
  for (const id of ['intended', 'implemented', 'governed'])
    [endpoint.model.claims[id].subject, endpoint.model.claims[id].object] = ['server', 'client'];
  endpoint.edition.claimModel.digest = claimModelDigest(endpoint.model);
  assert.notEqual(
    staticSceneDigest(endpoint.model, endpoint.edition),
    staticSceneDigest(baseline.model, baseline.edition),
  );
  assert.notEqual(
    interactiveSceneDigest(endpoint.model, endpoint.edition),
    interactiveSceneDigest(baseline.model, baseline.edition),
  );

  reordered.edition.scenes.static.claims.reverse();
  for (const scene of Object.values(reordered.edition.scenes.interactive)) {
    scene.claims.reverse();
    scene.questions.reverse();
  }
  assert.equal(
    staticSceneDigest(reordered.model, reordered.edition),
    staticSceneDigest(baseline.model, baseline.edition),
  );
  assert.equal(
    interactiveSceneDigest(reordered.model, reordered.edition),
    interactiveSceneDigest(baseline.model, baseline.edition),
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
