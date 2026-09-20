import { createHash } from 'node:crypto';
import {
  canonical,
  exact,
  jsonValue,
  record,
  text,
} from '../semantics/document.mjs';
import { isDigest } from '../source/manifest.mjs';

const VERDICTS = Object.freeze(['PASS', 'FAIL', 'UNKNOWN']);
const SET_FIELDS = Object.freeze([
  'schema',
  'candidateSha256',
  'editionSha256',
  'sourceSha256',
  'semanticSha256',
  'records',
]);
const RECORD_FIELDS = Object.freeze([
  'id',
  'subject',
  'editionSha256',
  'sourceSha256',
  'semanticSha256',
  'verifier',
  'predicate',
  'scope',
  'environment',
  'observations',
  'verdict',
  'limitations',
]);

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function selectedIdentity(value, code) {
  if (!exact(value, ['kind', 'sha256']) || !text(value.kind) || !isDigest(value.sha256))
    fail(code);
}

function selectedScope(value, code) {
  if (!exact(value, ['kind', 'value']) || !text(value.kind) || !text(value.value))
    fail(code);
}

function strings(values) {
  return Array.isArray(values) && values.every(text);
}

function validateRecord(value, identities) {
  if (!exact(value, RECORD_FIELDS) || !text(value.id) || !text(value.predicate))
    fail('qualification_record_invalid');
  selectedIdentity(value.subject, 'qualification_subject_invalid');
  if (
    value.subject.kind === 'edition-candidate' &&
    value.subject.sha256 !== identities.candidateSha256
  )
    fail('qualification_identity_mismatch');
  if (
    value.editionSha256 !== identities.editionSha256 ||
    value.sourceSha256 !== identities.sourceSha256 ||
    value.semanticSha256 !== identities.semanticSha256
  )
    fail('qualification_identity_mismatch');
  if (
    !exact(value.verifier, ['id', 'implementationSha256']) ||
    !text(value.verifier.id) ||
    !isDigest(value.verifier.implementationSha256)
  )
    fail('qualification_verifier_invalid');
  selectedScope(value.scope, 'qualification_scope_invalid');
  if (value.environment !== null)
    selectedScope(value.environment, 'qualification_environment_invalid');
  if (
    !Array.isArray(value.observations) ||
    !value.observations.length ||
    value.observations.length > 4096
  )
    fail('qualification_observations_invalid');
  const names = new Set();
  for (const observation of value.observations) {
    if (!exact(observation, ['name', 'value']) || !text(observation.name))
      fail('qualification_observation_invalid');
    if (names.has(observation.name)) fail('qualification_observation_duplicate');
    names.add(observation.name);
    try {
      jsonValue(observation.value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
    } catch {
      fail('qualification_observation_invalid');
    }
  }
  if (!VERDICTS.includes(value.verdict)) fail('qualification_verdict_invalid');
  if (!strings(value.limitations) || new Set(value.limitations).size !== value.limitations.length)
    fail('qualification_limitations_invalid');
}

function conjunction(records) {
  if (records.some(({ verdict }) => verdict === 'FAIL')) return 'FAIL';
  if (records.some(({ verdict }) => verdict === 'UNKNOWN')) return 'UNKNOWN';
  return 'PASS';
}

/** Validate externally produced predicate judgments without executing a verifier. */
export function validateQualificationSet(value) {
  if (
    !exact(value, SET_FIELDS) ||
    value.schema !== 'architecture.qualification-set/v1' ||
    !isDigest(value.candidateSha256) ||
    !isDigest(value.editionSha256) ||
    !isDigest(value.sourceSha256) ||
    !isDigest(value.semanticSha256) ||
    !Array.isArray(value.records) ||
    !value.records.length ||
    value.records.length > 4096
  )
    fail('qualification_set_invalid');
  const identities = {
    candidateSha256: value.candidateSha256,
    editionSha256: value.editionSha256,
    sourceSha256: value.sourceSha256,
    semanticSha256: value.semanticSha256,
  };
  const ids = new Set();
  for (const selected of value.records) {
    validateRecord(selected, identities);
    if (ids.has(selected.id)) fail('qualification_record_duplicate');
    ids.add(selected.id);
  }
  const normalized = structuredClone(value);
  return Object.freeze({
    ...normalized,
    verdict: conjunction(normalized.records),
  });
}

export const qualificationSetDigest = (value) =>
  createHash('sha256')
    .update(canonical(validateQualificationSet(value)))
    .digest('hex');
