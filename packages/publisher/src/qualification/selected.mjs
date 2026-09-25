import { createHash } from 'node:crypto';
import {
  selectedEditionCandidateDigest,
  validateSelectedEditionCandidate,
} from '../compiler/candidate.mjs';
import { canonical, deepFreeze, exact, jsonValue, text } from '../semantics/document.mjs';
import { fail, isDigest } from '../source/manifest.mjs';

const VERDICTS = new Set(['PASS', 'FAIL', 'UNKNOWN']);
const sha = (value) =>
  createHash('sha256')
    .update(Buffer.from(canonical(value)))
    .digest('hex');

function requiredText(value) {
  return text(value) && value === value.trim() && Buffer.byteLength(value) <= 2048;
}

function selectedScope(scope, candidate, obligations, candidateSha256) {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope))
    fail('selected_qualification_scope_invalid');
  if (scope.kind === 'candidate') {
    if (!exact(scope, ['kind'])) fail('selected_qualification_scope_invalid');
    return { kind: 'candidate', sha256: candidateSha256 };
  }
  const medium = scope.medium;
  if (!requiredText(medium) || !Object.hasOwn(candidate.media, medium))
    fail('selected_qualification_scope_invalid');
  if (scope.kind === 'medium') {
    if (!exact(scope, ['kind', 'medium'])) fail('selected_qualification_scope_invalid');
    return { kind: 'medium', sha256: sha(candidate.media[medium]) };
  }
  if (scope.kind === 'artifact') {
    if (!exact(scope, ['kind', 'medium', 'artifact']) || !requiredText(scope.artifact))
      fail('selected_qualification_scope_invalid');
    const artifact = candidate.media[medium].artifacts.find(({ id }) => id === scope.artifact);
    if (!artifact) fail('selected_qualification_scope_invalid');
    return { kind: 'artifact', sha256: artifact.sha256 };
  }
  if (!['question', 'assertion'].includes(scope.kind)) fail('selected_qualification_scope_invalid');
  if (
    !exact(
      scope,
      scope.kind === 'question'
        ? ['kind', 'medium', 'view', 'question']
        : ['kind', 'medium', 'view', 'question', 'assertion'],
    ) ||
    !requiredText(scope.view) ||
    !requiredText(scope.question)
  )
    fail('selected_qualification_scope_invalid');
  const views = obligations[medium]?.views;
  if (!Array.isArray(views)) fail('selected_qualification_scope_invalid');
  const view = views.find((item) => item?.id === scope.view);
  if (!Array.isArray(view?.questionIds) || !view.questionIds.includes(scope.question))
    fail('selected_qualification_scope_invalid');
  if (
    scope.kind === 'assertion' &&
    (!requiredText(scope.assertion) ||
      !view.assertionsByQuestion?.[scope.question]?.includes(scope.assertion))
  )
    fail('selected_qualification_scope_invalid');
  return { kind: 'medium', sha256: sha(candidate.media[medium]) };
}

function selectedRecord(record, candidate, obligations, candidateSha256) {
  if (
    !exact(record, [
      'id',
      'predicate',
      'subject',
      'scope',
      'verifier',
      'method',
      'observations',
      'verdict',
      'limitations',
    ]) ||
    !requiredText(record.id) ||
    !requiredText(record.predicate) ||
    !requiredText(record.method) ||
    !VERDICTS.has(record.verdict)
  )
    fail('selected_qualification_record_invalid');
  const subject = selectedScope(record.scope, candidate, obligations, candidateSha256);
  if (
    !exact(record.subject, ['kind', 'sha256']) ||
    record.subject.kind !== subject.kind ||
    record.subject.sha256 !== subject.sha256
  )
    fail('selected_qualification_subject_mismatch');
  if (
    !exact(record.verifier, ['kind', 'id', 'implementationSha256']) ||
    !['human', 'machine'].includes(record.verifier.kind) ||
    !requiredText(record.verifier.id) ||
    !isDigest(record.verifier.implementationSha256)
  )
    fail('selected_qualification_verifier_invalid');
  if (
    !Array.isArray(record.observations) ||
    !record.observations.length ||
    record.observations.length > 4096
  )
    fail('selected_qualification_observations_invalid');
  const names = new Set();
  for (const observation of record.observations) {
    if (!exact(observation, ['name', 'value']) || !requiredText(observation.name))
      fail('selected_qualification_observation_invalid');
    if (names.has(observation.name)) fail('selected_qualification_observation_duplicate');
    names.add(observation.name);
    try {
      jsonValue(observation.value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
    } catch {
      fail('selected_qualification_observation_invalid');
    }
  }
  if (
    !Array.isArray(record.limitations) ||
    record.limitations.some((limit) => !requiredText(limit)) ||
    new Set(record.limitations).size !== record.limitations.length
  )
    fail('selected_qualification_limitations_invalid');
}

/** Bind submitted v2 records to one replayed Candidate without granting trust or acceptance. */
export function bindSelectedQualificationSet(candidateValue, replay, setValue) {
  const candidate = validateSelectedEditionCandidate(candidateValue);
  const candidateSha256 = selectedEditionCandidateDigest(candidate);
  if (
    replay?.status !== 'replayed' ||
    replay.verdict !== 'match' ||
    replay.candidateSha256 !== candidateSha256 ||
    replay.inputLockSha256 !== candidate.input.lockSha256 ||
    canonical(replay.replayedEditionObligations) !== canonical(candidate.obligations)
  )
    fail('selected_qualification_replay_mismatch');
  if (
    !exact(setValue, ['schema', 'candidateSha256', 'inputLockSha256', 'records']) ||
    setValue.schema !== 'architecture.qualification-set/v2' ||
    setValue.candidateSha256 !== candidateSha256 ||
    setValue.inputLockSha256 !== replay.inputLockSha256 ||
    !Array.isArray(setValue.records) ||
    setValue.records.length > 4096
  )
    fail('selected_qualification_set_invalid');
  const ids = new Set();
  for (const record of setValue.records) {
    selectedRecord(record, candidate, replay.replayedEditionObligations, candidateSha256);
    if (ids.has(record.id)) fail('selected_qualification_record_duplicate');
    ids.add(record.id);
  }
  const qualificationSet = structuredClone(setValue);
  qualificationSet.records.sort((left, right) => left.id.localeCompare(right.id));
  const missingSubmittedPassQuestionScopes = [];
  for (const medium of Object.keys(candidate.media).sort()) {
    for (const view of replay.replayedEditionObligations[medium].views) {
      if (!requiredText(view?.id) || !Array.isArray(view.questionIds))
        fail('selected_qualification_scope_invalid');
      for (const question of view.questionIds) {
        if (!requiredText(question)) fail('selected_qualification_scope_invalid');
        const present = qualificationSet.records.some(
          (record) =>
            record.verdict === 'PASS' &&
            record.scope.kind === 'question' &&
            record.scope.medium === medium &&
            record.scope.view === view.id &&
            record.scope.question === question,
        );
        if (!present)
          missingSubmittedPassQuestionScopes.push({
            kind: 'question',
            medium,
            view: view.id,
            question,
          });
      }
    }
  }
  return deepFreeze({
    qualificationSet,
    qualificationSetDigest: sha(qualificationSet),
    candidateSha256,
    inputLockSha256: replay.inputLockSha256,
    records: qualificationSet.records.length,
    attribution: 'submitted-unverified',
    missingSubmittedPassQuestionScopes,
    completeness: 'not-assessed-no-policy',
    admitted: false,
    acceptance: 'not-performed',
    publication: 'not-performed',
  });
}
