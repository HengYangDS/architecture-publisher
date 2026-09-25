import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import {
  compileEditionCandidateInput,
  selectedEditionCandidateDigest,
} from '../packages/publisher/src/compiler/index.mjs';
import * as qualification from '../packages/publisher/src/qualification/index.mjs';
import { canonical } from '../packages/publisher/src/semantics/document.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

async function selectedCandidate(t) {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const candidate = JSON.parse(
    bundle.members.find(({ path: member }) => member === 'candidate.json').content,
  );
  const replay = await qualification.verifySelectedCandidateReplay({
    requestPath: fixture.file,
    requestSha256: fixture.digest,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  return { candidate, replay };
}

function questionRecord(candidate, medium) {
  return {
    id: `question.${medium}`,
    predicate: 'visible-question',
    subject: {
      kind: 'medium',
      sha256: createHash('sha256').update(canonical(candidate.media[medium])).digest('hex'),
    },
    scope: { kind: 'question', medium, view: 'overview', question: 'shape' },
    verifier: {
      kind: 'machine',
      id: 'fixture-checker',
      implementationSha256: sha(Buffer.from('fixture-checker')),
    },
    method: 'carrier-inspection/v1',
    observations: [{ name: 'visible', value: true }],
    verdict: 'PASS',
    limitations: [],
  };
}

function selectedSet(replay, records) {
  return {
    schema: 'architecture.qualification-set/v2',
    candidateSha256: replay.candidateSha256,
    inputLockSha256: replay.inputLockSha256,
    records,
  };
}

test('a submitted PASS binds exact artifact bytes but cannot grant qualification', async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const artifact = candidate.media.static.artifacts.find(({ id }) => id === 'architecture-png');
  const set = {
    schema: 'architecture.qualification-set/v2',
    candidateSha256: replay.candidateSha256,
    inputLockSha256: replay.inputLockSha256,
    records: [
      {
        id: 'review.static.png',
        predicate: 'visual-readability',
        subject: { kind: 'artifact', sha256: artifact.sha256 },
        scope: { kind: 'artifact', medium: 'static', artifact: 'architecture-png' },
        verifier: {
          kind: 'human',
          id: 'fixture-reviewer',
          implementationSha256: sha(Buffer.from('fixture-review-method')),
        },
        method: 'visual-inspection/v1',
        observations: [{ name: 'judgment', value: 'legible' }],
        verdict: 'PASS',
        limitations: [],
      },
    ],
  };
  const result = qualification.bindSelectedQualificationSet(candidate, replay, set);
  assert.equal(result.candidateSha256, replay.candidateSha256);
  assert.equal(result.inputLockSha256, replay.inputLockSha256);
  assert.equal(result.records, 1);
  assert.equal(result.attribution, 'submitted-unverified');
  assert.equal(result.completeness, 'not-assessed-no-policy');
  assert.equal(result.admitted, false);
  assert.deepEqual(result.missingSubmittedPassQuestionScopes, [
    { kind: 'question', medium: 'interactive', view: 'overview', question: 'shape' },
    { kind: 'question', medium: 'static', view: 'overview', question: 'shape' },
  ]);
});

test('submitted question coverage remains non-authorizing and rejects invented scopes', async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const set = selectedSet(replay, [
    questionRecord(candidate, 'interactive'),
    questionRecord(candidate, 'static'),
  ]);
  const result = qualification.bindSelectedQualificationSet(candidate, replay, set);
  assert.deepEqual(result.missingSubmittedPassQuestionScopes, []);
  assert.equal(result.completeness, 'not-assessed-no-policy');
  assert.equal(result.admitted, false);

  const assertionOnly = questionRecord(candidate, 'static');
  assertionOnly.scope = {
    kind: 'assertion',
    medium: 'static',
    view: 'overview',
    question: 'shape',
    assertion: 'shape',
  };
  const assertionResult = qualification.bindSelectedQualificationSet(
    candidate,
    replay,
    selectedSet(replay, [assertionOnly]),
  );
  assert.deepEqual(assertionResult.missingSubmittedPassQuestionScopes, [
    { kind: 'question', medium: 'interactive', view: 'overview', question: 'shape' },
    { kind: 'question', medium: 'static', view: 'overview', question: 'shape' },
  ]);

  const inventedQuestion = structuredClone(set);
  inventedQuestion.records[0].scope.question = 'unselected';
  assert.throws(
    () => qualification.bindSelectedQualificationSet(candidate, replay, inventedQuestion),
    { code: 'selected_qualification_scope_invalid' },
  );
  const wrongSubject = structuredClone(set);
  wrongSubject.records[0].subject.sha256 = '0'.repeat(64);
  assert.throws(() => qualification.bindSelectedQualificationSet(candidate, replay, wrongSubject), {
    code: 'selected_qualification_subject_mismatch',
  });
  const forgedTrust = structuredClone(set);
  forgedTrust.records[0].trust = 'authenticated';
  assert.throws(() => qualification.bindSelectedQualificationSet(candidate, replay, forgedTrust), {
    code: 'selected_qualification_record_invalid',
  });
  const wrongLock = { ...set, inputLockSha256: '0'.repeat(64) };
  assert.throws(() => qualification.bindSelectedQualificationSet(candidate, replay, wrongLock), {
    code: 'selected_qualification_set_invalid',
  });

  const malformedCandidate = structuredClone(candidate);
  malformedCandidate.obligations.static.views = [null];
  const malformedReplay = {
    ...replay,
    candidateSha256: selectedEditionCandidateDigest(malformedCandidate),
    replayedEditionObligations: malformedCandidate.obligations,
  };
  const malformedSet = {
    ...set,
    candidateSha256: malformedReplay.candidateSha256,
  };
  assert.throws(
    () =>
      qualification.bindSelectedQualificationSet(malformedCandidate, malformedReplay, malformedSet),
    { code: 'selected_qualification_scope_invalid' },
  );

  const mismatchedPairCandidate = structuredClone(candidate);
  const staticObligations = mismatchedPairCandidate.obligations.static;
  staticObligations.questionIds.push('other');
  staticObligations.views.push({
    ...structuredClone(staticObligations.views[0]),
    id: 'other-view',
    questionIds: ['other'],
    assertionsByQuestion: { other: ['shape'] },
  });
  const mismatchedPairReplay = {
    ...replay,
    candidateSha256: selectedEditionCandidateDigest(mismatchedPairCandidate),
    replayedEditionObligations: mismatchedPairCandidate.obligations,
  };
  const mismatchedPairSet = structuredClone(set);
  mismatchedPairSet.candidateSha256 = mismatchedPairReplay.candidateSha256;
  mismatchedPairSet.records[1].scope.question = 'other';
  assert.throws(
    () =>
      qualification.bindSelectedQualificationSet(
        mismatchedPairCandidate,
        mismatchedPairReplay,
        mismatchedPairSet,
      ),
    { code: 'selected_qualification_scope_invalid' },
  );

  const omittedAssertionCandidate = structuredClone(candidate);
  omittedAssertionCandidate.obligations.static.views[0].assertionsByQuestion.shape = [];
  const omittedAssertionReplay = {
    ...replay,
    candidateSha256: selectedEditionCandidateDigest(omittedAssertionCandidate),
    replayedEditionObligations: omittedAssertionCandidate.obligations,
  };
  const omittedAssertionSet = structuredClone(set);
  omittedAssertionSet.candidateSha256 = omittedAssertionReplay.candidateSha256;
  omittedAssertionSet.records[1].scope = {
    kind: 'assertion',
    medium: 'static',
    view: 'overview',
    question: 'shape',
    assertion: 'shape',
  };
  assert.throws(
    () =>
      qualification.bindSelectedQualificationSet(
        omittedAssertionCandidate,
        omittedAssertionReplay,
        omittedAssertionSet,
      ),
    { code: 'selected_qualification_scope_invalid' },
  );
});

test('v2 scope and record validation fails closed on malformed submitted evidence', async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const base = questionRecord(candidate, 'static');
  const selected = () => selectedSet(replay, [structuredClone(base)]);
  const reject = (change, code) => {
    const set = selected();
    change(set.records[0], set);
    assert.throws(() => qualification.bindSelectedQualificationSet(candidate, replay, set), {
      code,
    });
  };
  const candidateRecord = structuredClone(base);
  candidateRecord.scope = { kind: 'candidate' };
  candidateRecord.subject = { kind: 'candidate', sha256: replay.candidateSha256 };
  assert.equal(
    qualification.bindSelectedQualificationSet(
      candidate,
      replay,
      selectedSet(replay, [candidateRecord]),
    ).admitted,
    false,
  );
  const mediumRecord = structuredClone(base);
  mediumRecord.scope = { kind: 'medium', medium: 'static' };
  assert.equal(
    qualification.bindSelectedQualificationSet(
      candidate,
      replay,
      selectedSet(replay, [mediumRecord]),
    ).admitted,
    false,
  );
  const artifactRecord = structuredClone(base);
  artifactRecord.scope = { kind: 'artifact', medium: 'static', artifact: 'architecture-png' };
  artifactRecord.subject = {
    kind: 'artifact',
    sha256: candidate.media.static.artifacts.find(({ id }) => id === 'architecture-png').sha256,
  };
  assert.equal(
    qualification.bindSelectedQualificationSet(
      candidate,
      replay,
      selectedSet(replay, [artifactRecord]),
    ).admitted,
    false,
  );

  const invalidScope = 'selected_qualification_scope_invalid';
  reject((record) => (record.scope = null), invalidScope);
  reject((record) => (record.scope = { kind: 'candidate', extra: true }), invalidScope);
  reject((record) => (record.scope.medium = 'absent'), invalidScope);
  reject(
    (record) => (record.scope = { kind: 'medium', medium: 'static', extra: true }),
    invalidScope,
  );
  reject((record) => (record.scope = { kind: 'artifact', medium: 'static' }), invalidScope);
  reject(
    (record) => (record.scope = { kind: 'artifact', medium: 'static', artifact: 'not-selected' }),
    invalidScope,
  );
  reject((record) => (record.scope.kind = 'imaginary'), invalidScope);
  reject((record) => (record.scope.extra = true), invalidScope);
  reject(
    (record) => (record.verifier.kind = 'unverified-agent'),
    'selected_qualification_verifier_invalid',
  );
  reject((record) => (record.observations = []), 'selected_qualification_observations_invalid');
  reject(
    (record) => (record.observations[0].name = ''),
    'selected_qualification_observation_invalid',
  );
  reject(
    (record) => record.observations.push(structuredClone(record.observations[0])),
    'selected_qualification_observation_duplicate',
  );
  reject((record) => {
    record.observations[0].value = {};
    record.observations[0].value.self = record.observations[0].value;
  }, 'selected_qualification_observation_invalid');
  reject(
    (record) => (record.limitations = ['unverified', 'unverified']),
    'selected_qualification_limitations_invalid',
  );
  reject(
    (_, set) => set.records.push(structuredClone(set.records[0])),
    'selected_qualification_record_duplicate',
  );
  assert.throws(
    () =>
      qualification.bindSelectedQualificationSet(
        candidate,
        { ...replay, verdict: 'invented' },
        selected(),
      ),
    { code: 'selected_qualification_replay_mismatch' },
  );
});
