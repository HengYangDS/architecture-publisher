import { createHash } from "node:crypto";
import { canonical, deepFreeze, exact, jsonValue, text } from "../semantics/document.mjs";
import { isDigest } from "../protocol/values.mjs";
import { QUALIFICATION_KINDS, isHumanReviewScope } from "../edition/contract.mjs";
import {
  editionCandidateDigest,
  mediaCandidateDigest,
  validateEditionCandidate,
  validateEditionCandidateBinding,
} from "../compiler/candidate.mjs";

const VERDICTS = Object.freeze(["PASS", "FAIL", "UNKNOWN"]);
const SET_FIELDS = Object.freeze([
  "schema",
  "candidateSha256",
  "editionDigest",
  "sourceManifestSha256",
  "claimModelDigest",
  "records",
]);
const RECORD_FIELDS = Object.freeze([
  "id",
  "kind",
  "subject",
  "editionDigest",
  "sourceManifestSha256",
  "claimModelDigest",
  "verifier",
  "predicate",
  "scope",
  "environment",
  "observations",
  "verdict",
  "limitations",
]);

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function selectedIdentity(value, code) {
  if (!exact(value, ["kind", "sha256"]) || !text(value.kind) || !isDigest(value.sha256)) fail(code);
}

function selectedScope(value, code) {
  if (!exact(value, ["kind", "value"]) || !text(value.kind) || !text(value.value)) fail(code);
}

function selectedHumanScope(value, code) {
  if (!isHumanReviewScope(value)) fail(code);
}

function obligationKey({ kind, predicate, scope = null }) {
  return canonical({
    kind,
    predicate,
    scope: kind === "human" ? scope : null,
  });
}

function humanArtifact(candidate, scope) {
  selectedHumanScope(scope, "qualification_human_scope_invalid");
  const artifact = candidate?.media[scope.medium].artifacts.find(({ id }) => id === scope.artifact);
  if (!artifact) fail("qualification_human_scope_invalid");
  return artifact;
}

/** Derive the only admissible subject for one Candidate qualification result. */
export function qualificationSubject(candidateValue, kind, scope = null) {
  const candidate = validateEditionCandidate(candidateValue);
  if (!QUALIFICATION_KINDS.includes(kind)) fail("qualification_kind_invalid");
  if (kind === "semantic")
    return deepFreeze({
      kind: "claim-model",
      sha256: candidate.claimModel.digest,
    });
  if (kind === "static")
    return deepFreeze({
      kind: "static-medium",
      sha256: mediaCandidateDigest(candidate.media.static),
    });
  if (kind === "interactive")
    return deepFreeze({
      kind: "interactive-medium",
      sha256: mediaCandidateDigest(candidate.media.interactive),
    });
  if (kind === "human")
    return deepFreeze({ kind: "artifact", sha256: humanArtifact(candidate, scope).sha256 });
  return deepFreeze({
    kind: "edition-candidate",
    sha256: editionCandidateDigest(candidate),
  });
}

function strings(values) {
  return Array.isArray(values) && values.every(text);
}

function validateRecord(value, identities) {
  if (
    !exact(value, RECORD_FIELDS) ||
    !text(value.id) ||
    !QUALIFICATION_KINDS.includes(value.kind) ||
    !text(value.predicate)
  )
    fail("qualification_record_invalid");
  selectedIdentity(value.subject, "qualification_subject_invalid");
  const commonSubject = {
    "edition-candidate": identities.candidateSha256,
    "claim-model": identities.claimModelDigest,
  };
  if (
    Object.hasOwn(commonSubject, value.subject.kind) &&
    value.subject.sha256 !== commonSubject[value.subject.kind]
  )
    fail("qualification_identity_mismatch");
  if (
    value.editionDigest !== identities.editionDigest ||
    value.sourceManifestSha256 !== identities.sourceManifestSha256 ||
    value.claimModelDigest !== identities.claimModelDigest
  )
    fail("qualification_identity_mismatch");
  if (
    !exact(value.verifier, ["kind", "id", "implementationSha256"]) ||
    !["machine", "human"].includes(value.verifier.kind) ||
    !text(value.verifier.id) ||
    !isDigest(value.verifier.implementationSha256)
  )
    fail("qualification_verifier_invalid");
  if (
    (value.kind === "human" && value.verifier.kind !== "human") ||
    (value.kind !== "human" && value.verifier.kind !== "machine")
  )
    fail(
      value.kind === "human"
        ? "qualification_human_verifier_required"
        : "qualification_machine_verifier_required",
    );
  if (value.kind === "human") selectedHumanScope(value.scope, "qualification_human_scope_invalid");
  else selectedScope(value.scope, "qualification_scope_invalid");
  if (value.environment !== null)
    selectedScope(value.environment, "qualification_environment_invalid");
  if (
    !Array.isArray(value.observations) ||
    !value.observations.length ||
    value.observations.length > 4096
  )
    fail("qualification_observations_invalid");
  const names = new Set();
  for (const observation of value.observations) {
    if (!exact(observation, ["name", "value"]) || !text(observation.name))
      fail("qualification_observation_invalid");
    if (names.has(observation.name)) fail("qualification_observation_duplicate");
    names.add(observation.name);
    try {
      jsonValue(observation.value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
    } catch {
      fail("qualification_observation_invalid");
    }
  }
  if (!VERDICTS.includes(value.verdict)) fail("qualification_verdict_invalid");
  if (!strings(value.limitations) || new Set(value.limitations).size !== value.limitations.length)
    fail("qualification_limitations_invalid");
}

/** Validate externally produced predicate judgments without executing a verifier. */
export function validateQualificationSet(value) {
  if (
    !exact(value, SET_FIELDS) ||
    value.schema !== "architecture.qualification-set/v1" ||
    !isDigest(value.candidateSha256) ||
    !isDigest(value.editionDigest) ||
    !isDigest(value.sourceManifestSha256) ||
    !isDigest(value.claimModelDigest) ||
    !Array.isArray(value.records) ||
    !value.records.length ||
    value.records.length > 4096
  )
    fail("qualification_set_invalid");
  const identities = {
    candidateSha256: value.candidateSha256,
    editionDigest: value.editionDigest,
    sourceManifestSha256: value.sourceManifestSha256,
    claimModelDigest: value.claimModelDigest,
  };
  const ids = new Set();
  for (const selected of value.records) {
    validateRecord(selected, identities);
    if (ids.has(selected.id)) fail("qualification_record_duplicate");
    ids.add(selected.id);
  }
  const normalized = structuredClone(value);
  normalized.records.sort((left, right) =>
    `${left.kind}\u0000${left.predicate}\u0000${left.id}`.localeCompare(
      `${right.kind}\u0000${right.predicate}\u0000${right.id}`,
    ),
  );
  return deepFreeze(normalized);
}

/** Bind an external predicate result to one exact Candidate identity. */
export function bindQualificationRecord(candidateValue, result) {
  const candidate = validateEditionCandidate(candidateValue);
  if (
    !exact(result, [
      "id",
      "kind",
      "verifier",
      "predicate",
      "scope",
      "environment",
      "observations",
      "verdict",
      "limitations",
    ])
  )
    fail("qualification_result_invalid");
  const identities = {
      candidateSha256: editionCandidateDigest(candidate),
      editionDigest: candidate.edition.digest,
      sourceManifestSha256: candidate.source.manifestSha256,
      claimModelDigest: candidate.claimModel.digest,
    },
    selected = {
      id: result.id,
      kind: result.kind,
      subject: qualificationSubject(candidate, result.kind, result.scope),
      editionDigest: identities.editionDigest,
      sourceManifestSha256: identities.sourceManifestSha256,
      claimModelDigest: identities.claimModelDigest,
      verifier: structuredClone(result.verifier),
      predicate: result.predicate,
      scope: structuredClone(result.scope),
      environment: structuredClone(result.environment),
      observations: structuredClone(result.observations),
      verdict: result.verdict,
      limitations: structuredClone(result.limitations),
    };
  validateRecord(selected, identities);
  return deepFreeze(selected);
}

/** Bind externally produced records into one exact Candidate qualification set. */
export function bindQualificationSet(candidateValue, records) {
  const candidate = validateEditionCandidate(candidateValue);
  if (!Array.isArray(records)) fail("qualification_records_invalid");
  for (const selected of records) {
    const expected = qualificationSubject(candidate, selected?.kind, selected?.scope);
    if (selected?.subject?.kind !== expected.kind || selected.subject.sha256 !== expected.sha256)
      fail("qualification_subject_mismatch");
  }
  return validateQualificationSet({
    schema: "architecture.qualification-set/v1",
    candidateSha256: editionCandidateDigest(candidate),
    editionDigest: candidate.edition.digest,
    sourceManifestSha256: candidate.source.manifestSha256,
    claimModelDigest: candidate.claimModel.digest,
    records,
  });
}

/** Admit records only when they close the exact obligations of one Candidate. */
export function admitQualificationSet(
  modelValue,
  editionValue,
  candidateValue,
  qualificationValue,
) {
  const candidate = validateEditionCandidateBinding(modelValue, editionValue, candidateValue),
    qualification = validateQualificationSet(qualificationValue),
    candidateSha256 = editionCandidateDigest(candidate);
  if (
    qualification.candidateSha256 !== candidateSha256 ||
    qualification.editionDigest !== candidate.edition.digest ||
    qualification.sourceManifestSha256 !== candidate.source.manifestSha256 ||
    qualification.claimModelDigest !== candidate.claimModel.digest
  )
    fail("qualification_identity_mismatch");

  const declared = new Map(candidate.obligations.map((item) => [obligationKey(item), item])),
    observed = new Set();
  for (const selected of qualification.records) {
    const key = obligationKey(selected);
    if (observed.has(key)) fail("qualification_obligation_duplicate");
    if (!declared.has(key)) fail("qualification_obligation_undeclared");
    observed.add(key);
    const expected = qualificationSubject(candidate, selected.kind, selected.scope);
    if (selected.subject.kind !== expected.kind || selected.subject.sha256 !== expected.sha256)
      fail("qualification_subject_mismatch");
  }
  const missing = candidate.obligations.filter(
      (obligation) => !observed.has(obligationKey(obligation)),
    ),
    complete = missing.length === 0,
    verdict = qualification.records.some(({ verdict }) => verdict === "FAIL")
      ? "FAIL"
      : !complete || qualification.records.some(({ verdict }) => verdict === "UNKNOWN")
        ? "UNKNOWN"
        : "PASS";
  return deepFreeze({
    qualification,
    complete,
    verdict,
    admitted: complete && verdict === "PASS",
    missing,
  });
}

export const qualificationSetDigest = (value) =>
  createHash("sha256")
    .update(canonical(validateQualificationSet(value)))
    .digest("hex");
