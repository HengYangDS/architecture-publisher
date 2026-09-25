import { createHash } from 'node:crypto';
import {
  QUALIFICATION_KINDS,
  editionDigest,
  editionQualificationObligations,
  interactiveSceneDigest,
  isHumanReviewScope,
  staticSceneDigest,
  validateEdition,
} from '../edition/contract.mjs';
import {
  canonical,
  claimModelDigest,
  deepFreeze,
  exact,
  jsonValue,
  record,
  text,
  validateClaimModel,
} from '../semantics/document.mjs';
import {
  hasExactFields,
  isDigest,
  portablePath,
  validateFileMembers,
} from '../source/manifest.mjs';

const CANDIDATE_FIELDS = Object.freeze([
  'schema',
  'source',
  'claimModel',
  'edition',
  'media',
  'obligations',
]);
const MEDIA_FIELDS = Object.freeze(['sceneSha256', 'artifacts', 'supplies']);
const ARTIFACT_FIELDS = Object.freeze(['id', 'path', 'mediaType', 'bytes', 'sha256']);
const SUPPLY_FIELDS = Object.freeze(['id', 'sha256']);
const OBLIGATION_FIELDS = Object.freeze(['kind', 'predicate']);
const HUMAN_OBLIGATION_FIELDS = Object.freeze(['kind', 'predicate', 'scope']);

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function unique(values, identity, code) {
  const identities = new Set();
  for (const value of values) {
    const selected = identity(value);
    if (identities.has(selected)) fail(code);
    identities.add(selected);
  }
}

function validateArtifact(value) {
  if (
    !exact(value, ARTIFACT_FIELDS) ||
    !text(value.id) ||
    !text(value.path) ||
    !text(value.mediaType) ||
    !Number.isSafeInteger(value.bytes) ||
    value.bytes < 1 ||
    !isDigest(value.sha256)
  )
    fail('candidate_artifact_invalid');
  try {
    portablePath(value.path);
  } catch {
    fail('candidate_artifact_invalid');
  }
}

function validateSupply(value) {
  if (!exact(value, SUPPLY_FIELDS) || !text(value.id) || !isDigest(value.sha256))
    fail('candidate_supply_invalid');
}

function validateMedium(value) {
  if (
    !exact(value, MEDIA_FIELDS) ||
    !isDigest(value.sceneSha256) ||
    !Array.isArray(value.artifacts) ||
    !value.artifacts.length ||
    !Array.isArray(value.supplies) ||
    !value.supplies.length
  )
    fail('candidate_medium_invalid');
  for (const artifact of value.artifacts) validateArtifact(artifact);
  for (const supply of value.supplies) validateSupply(supply);
  unique(value.artifacts, ({ id }) => id, 'candidate_artifact_duplicate');
  unique(value.artifacts, ({ path }) => path, 'candidate_artifact_duplicate');
  unique(value.supplies, ({ id }) => id, 'candidate_supply_duplicate');
}

function normalizedMedium(value) {
  const selected = structuredClone(value);
  selected.artifacts.sort((left, right) => left.id.localeCompare(right.id));
  selected.supplies.sort((left, right) => left.id.localeCompare(right.id));
  return selected;
}

function normalizedCandidate(value) {
  const selected = structuredClone(value);
  selected.media.static = normalizedMedium(selected.media.static);
  selected.media.interactive = normalizedMedium(selected.media.interactive);
  selected.obligations.sort((left, right) => canonical(left).localeCompare(canonical(right)));
  return selected;
}

/** Validate one closed, state-free Edition Candidate value. */
export function validateEditionCandidate(value) {
  try {
    jsonValue(value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
  } catch {
    fail('candidate_json_invalid');
  }
  if (
    !exact(value, CANDIDATE_FIELDS) ||
    value.schema !== 'architecture.edition-candidate/v1' ||
    !exact(value.source, ['manifestSha256']) ||
    !isDigest(value.source.manifestSha256) ||
    !exact(value.claimModel, ['sha256', 'digest']) ||
    !isDigest(value.claimModel.sha256) ||
    !isDigest(value.claimModel.digest) ||
    !exact(value.edition, ['sha256', 'digest']) ||
    !isDigest(value.edition.sha256) ||
    !isDigest(value.edition.digest) ||
    !exact(value.media, ['static', 'interactive']) ||
    !Array.isArray(value.obligations) ||
    !value.obligations.length
  )
    fail('candidate_invalid');
  validateMedium(value.media.static);
  validateMedium(value.media.interactive);
  try {
    validateFileMembers(
      Object.values(value.media)
        .flatMap(({ artifacts }) => artifacts)
        .map(({ path: artifactPath, bytes, sha256 }) => ({
          path: artifactPath,
          bytes,
          sha256,
        })),
    );
  } catch {
    fail('candidate_artifact_duplicate');
  }
  for (const obligation of value.obligations) {
    const human = obligation?.kind === 'human';
    if (
      !exact(obligation, human ? HUMAN_OBLIGATION_FIELDS : OBLIGATION_FIELDS) ||
      !QUALIFICATION_KINDS.includes(obligation.kind) ||
      !text(obligation.predicate) ||
      (human && !isHumanReviewScope(obligation.scope))
    )
      fail('candidate_obligation_invalid');
    if (
      human &&
      !value.media[obligation.scope.medium].artifacts.some(
        ({ id }) => id === obligation.scope.artifact,
      )
    )
      fail('candidate_human_artifact_missing');
  }
  unique(
    value.obligations,
    (obligation) => canonical(obligation),
    'candidate_obligation_duplicate',
  );
  return deepFreeze(normalizedCandidate(value));
}

/** Prove that a Candidate is a projection of one exact Claim Model and Edition. */
export function validateEditionCandidateBinding(modelValue, editionValue, candidateValue) {
  const model = validateClaimModel(modelValue),
    edition = validateEdition(model, editionValue),
    candidate = validateEditionCandidate(candidateValue),
    obligations = editionQualificationObligations(model, edition);
  if (candidate.source.manifestSha256 !== edition.source.manifestSha256)
    fail('candidate_source_mismatch');
  if (candidate.claimModel.digest !== claimModelDigest(model))
    fail('candidate_claim_model_mismatch');
  if (candidate.edition.digest !== editionDigest(model, edition))
    fail('candidate_edition_mismatch');
  if (candidate.media.static.sceneSha256 !== staticSceneDigest(model, edition))
    fail('candidate_static_scene_mismatch');
  if (candidate.media.interactive.sceneSha256 !== interactiveSceneDigest(model, edition))
    fail('candidate_interactive_scene_mismatch');
  if (canonical(candidate.obligations) !== canonical(obligations))
    fail('candidate_obligation_mismatch');
  return candidate;
}

/** Assemble one Candidate from authoritative semantic values and renderer receipts. */
export function createEditionCandidate(input) {
  if (
    !exact(input, [
      'sourceManifestSha256',
      'claimModelSha256',
      'claimModel',
      'editionSha256',
      'edition',
      'media',
    ]) ||
    !isDigest(input.sourceManifestSha256) ||
    !isDigest(input.claimModelSha256) ||
    !isDigest(input.editionSha256)
  )
    fail('candidate_input_invalid');
  const model = validateClaimModel(input.claimModel),
    edition = validateEdition(model, input.edition),
    candidate = {
      schema: 'architecture.edition-candidate/v1',
      source: { manifestSha256: input.sourceManifestSha256 },
      claimModel: {
        sha256: input.claimModelSha256,
        digest: claimModelDigest(model),
      },
      edition: {
        sha256: input.editionSha256,
        digest: editionDigest(model, edition),
      },
      media: structuredClone(input.media),
      obligations: editionQualificationObligations(model, edition),
    };
  return validateEditionCandidateBinding(model, edition, candidate);
}

/** Digest one exact medium after normalizing its declared sets. */
export function mediaCandidateDigest(value) {
  validateMedium(value);
  return createHash('sha256')
    .update(canonical(normalizedMedium(value)))
    .digest('hex');
}

/** Canonical identity of the normalized Edition Candidate value. */
export function editionCandidateDigest(value) {
  return createHash('sha256')
    .update(canonical(validateEditionCandidate(value)))
    .digest('hex');
}

/** Validate the successor's unqualified, source-bound media inventory. */
export function validateSelectedEditionCandidate(value) {
  try {
    jsonValue(value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
  } catch {
    fail('selected_candidate_json_invalid');
  }
  if (
    !exact(value, ['schema', 'qualification', 'input', 'media', 'obligations', 'limits']) ||
    value.schema !== 'architecture.edition-candidate/v2' ||
    value.qualification !== 'unqualified' ||
    !exact(value.input, [
      'lockSha256',
      'editionSha256',
      'semanticDigest',
      'semanticSupplies',
      'closure',
    ]) ||
    ![value.input.lockSha256, value.input.editionSha256, value.input.semanticDigest].every(
      isDigest,
    ) ||
    !Array.isArray(value.input.semanticSupplies) ||
    !['selected-inputs-only', 'selected-roots-only'].includes(value.input.closure) ||
    !value.media ||
    typeof value.media !== 'object' ||
    Array.isArray(value.media) ||
    !value.obligations ||
    typeof value.obligations !== 'object' ||
    Array.isArray(value.obligations) ||
    !Array.isArray(value.limits) ||
    value.limits.some((limit) => !text(limit)) ||
    new Set(value.limits).size !== value.limits.length
  )
    fail('selected_candidate_invalid');
  for (const supply of value.input.semanticSupplies) validateSupply(supply);
  unique(value.input.semanticSupplies, ({ id }) => id, 'candidate_supply_duplicate');
  const media = Object.keys(value.media).sort();
  if (
    !media.length ||
    media.some((medium) => !['static', 'interactive'].includes(medium)) ||
    !hasExactFields(value.obligations, media)
  )
    fail('selected_candidate_media_invalid');
  for (const medium of media) {
    const selectedMedium = value.media[medium];
    if (
      !exact(selectedMedium, ['sceneSha256', 'carrierSha256', 'artifacts', 'supplies']) ||
      !isDigest(selectedMedium.carrierSha256)
    )
      fail('selected_candidate_media_invalid');
    validateMedium({
      sceneSha256: selectedMedium.sceneSha256,
      artifacts: selectedMedium.artifacts,
      supplies: selectedMedium.supplies,
    });
    const required =
      medium === 'static'
        ? [
            ['architecture-svg', 'static/architecture.svg', 'image/svg+xml'],
            ['architecture-png', 'static/architecture.png', 'image/png'],
          ]
        : [['architecture-html', 'interactive/architecture.html', 'text/html']];
    if (
      value.media[medium].artifacts.length !== required.length ||
      required.some(
        ([id, artifactPath, mediaType]) =>
          !value.media[medium].artifacts.some(
            (artifact) =>
              artifact.id === id &&
              artifact.path === artifactPath &&
              artifact.mediaType === mediaType,
          ),
      ) ||
      !record(value.obligations[medium]) ||
      !Array.isArray(value.obligations[medium].questionIds) ||
      !Array.isArray(value.obligations[medium].assertionIds) ||
      !Array.isArray(value.obligations[medium].views)
    )
      fail('selected_candidate_media_invalid');
  }
  const selected = structuredClone(value);
  selected.input.semanticSupplies.sort((left, right) => left.id.localeCompare(right.id));
  for (const medium of media) selected.media[medium] = normalizedMedium(selected.media[medium]);
  return deepFreeze(selected);
}

export function selectedEditionCandidateDigest(value) {
  return createHash('sha256')
    .update(canonical(validateSelectedEditionCandidate(value)))
    .digest('hex');
}

/** Derive the only admissible subject for one qualification kind. */
