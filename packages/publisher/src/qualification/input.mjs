import path from 'node:path';
import { createHash } from 'node:crypto';
import { exact } from '../semantics/document.mjs';
import { noSymlinkAncestors, regularBytes } from '../file-input/read.mjs';
import { parseStrictJson } from '../protocol/json.mjs';
import { isDigest } from '../protocol/values.mjs';
import { portablePath } from '../file-input/contract.mjs';
import { admitQualificationSet, qualificationSetDigest } from './contract.mjs';
import { invokeQualificationWorker } from './process-boundary.mjs';
import { replaySelectedCandidate } from './replay.mjs';
import { bindSelectedQualificationSet } from './selected.mjs';
import { assessSelectedQualificationPolicy } from './policy.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

/** Verify an exact external Qualification Set; never execute or infer a predicate. */
async function selectedJson(parent, selector, kind, strict = false) {
  if (!exact(selector, ['path', 'sha256']) || !isDigest(selector?.sha256))
    fail('qualification_input_invalid');
  try {
    portablePath(selector.path);
  } catch {
    fail('qualification_input_invalid');
  }
  const selected = path.resolve(parent, selector.path);
  await noSymlinkAncestors(selected);
  const bytes = await regularBytes(selected, 16 * 1024 * 1024);
  if (sha256(bytes) !== selector.sha256) fail(`qualification_${kind}_digest_mismatch`);
  try {
    return {
      value: strict
        ? parseStrictJson(
            bytes,
            `qualification_${kind}_json_invalid`,
            `qualification_${kind}_json_duplicate_key`,
          )
        : JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)),
      sha256: selector.sha256,
    };
  } catch (error) {
    if (strict && error?.code === `qualification_${kind}_json_duplicate_key`) throw error;
    fail(`qualification_${kind}_json_invalid`);
  }
}

function selectedReference(parent, selector) {
  if (!exact(selector, ['path', 'sha256']) || !isDigest(selector?.sha256))
    fail('qualification_input_invalid');
  try {
    portablePath(selector.path);
  } catch {
    fail('qualification_input_invalid');
  }
  return { path: path.resolve(parent, selector.path), sha256: selector.sha256 };
}

function parseQualificationPlan(bytes) {
  try {
    return parseStrictJson(bytes, 'qualification_json_invalid', 'qualification_json_duplicate_key');
  } catch (error) {
    if (error?.code !== 'qualification_json_duplicate_key') throw error;
    let historical;
    try {
      historical = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
      fail('qualification_json_invalid');
    }
    if (historical?.schema !== 'architecture.qualification-input/v1') throw error;
    return historical;
  }
}

async function verifyLegacyQualificationPlan(plan, parent) {
  if (
    !exact(plan, ['schema', 'claimModel', 'edition', 'candidate', 'qualification']) ||
    plan.schema !== 'architecture.qualification-input/v1'
  )
    fail('qualification_input_invalid');
  const [claimModel, edition, candidate, qualification] = await Promise.all([
    selectedJson(parent, plan.claimModel, 'claim_model'),
    selectedJson(parent, plan.edition, 'edition'),
    selectedJson(parent, plan.candidate, 'candidate'),
    selectedJson(parent, plan.qualification, 'set'),
  ]);
  if (
    candidate.value?.claimModel?.sha256 !== claimModel.sha256 ||
    candidate.value?.edition?.sha256 !== edition.sha256
  )
    fail('qualification_authority_identity_mismatch');
  const admission = admitQualificationSet(
    claimModel.value,
    edition.value,
    candidate.value,
    qualification.value,
  );
  return {
    status: 'verified',
    qualificationSetSha256: qualificationSetDigest(admission.qualification),
    candidateSha256: admission.qualification.candidateSha256,
    verdict: admission.verdict,
    complete: admission.complete,
    admitted: admission.admitted,
    missing: admission.missing,
    records: admission.qualification.records.length,
    authorization: 'not-performed',
    publication: 'not-performed',
  };
}

async function verifySelectedQualificationPlan(plan, parent, executionChoice, policyChoice) {
  if (
    !exact(plan, ['schema', 'request', 'candidate', 'qualification']) ||
    plan.schema !== 'architecture.qualification-input/v2'
  )
    fail('qualification_input_invalid');
  const request = selectedReference(parent, plan.request);
  const candidate = selectedReference(parent, plan.candidate);
  selectedReference(parent, plan.qualification);
  const selectedSet = await selectedJson(parent, plan.qualification, 'set', true);
  const selectedPolicy = policyChoice
    ? await selectedJson(
        path.dirname(policyChoice.file),
        { path: path.basename(policyChoice.file), sha256: policyChoice.sha256 },
        'policy',
        true,
      )
    : null;
  const replayed = await replaySelectedCandidate(
    {
      requestPath: request.path,
      requestSha256: request.sha256,
      candidateManifestPath: candidate.path,
      candidateManifestSha256: candidate.sha256,
    },
    executionChoice,
  );
  const bound = selectedPolicy
    ? assessSelectedQualificationPolicy(
        replayed.candidate,
        replayed.replay,
        selectedSet.value,
        selectedPolicy.value,
      )
    : bindSelectedQualificationSet(replayed.candidate, replayed.replay, selectedSet.value);
  return {
    status: 'records-bound',
    qualificationSetDigest: bound.qualificationSetDigest,
    candidateSha256: bound.candidateSha256,
    inputLockSha256: bound.inputLockSha256,
    records: bound.records,
    attribution: bound.attribution,
    missingSubmittedPassQuestionScopes: bound.missingSubmittedPassQuestionScopes,
    completeness: bound.completeness,
    admitted: bound.admitted,
    acceptance: bound.acceptance,
    publication: bound.publication,
    ...(selectedPolicy
      ? {
          policySha256: selectedPolicy.sha256,
          policy: bound.policy,
          policyAttribution: bound.policyAttribution,
          submittedVerdict: bound.submittedVerdict,
          missingRequirements: bound.missingRequirements,
          unselectedRecords: bound.unselectedRecords,
          unacceptedLimitations: bound.unacceptedLimitations,
          nonPassingRecords: bound.nonPassingRecords,
        }
      : {}),
  };
}

/** Execute only inside the supervised worker after the total deadline starts. */
export async function verifyQualificationInsideWorker(
  file,
  expectedSha256,
  executionChoice,
  policyChoice = null,
) {
  if (!isDigest(expectedSha256)) fail('qualification_digest_required');
  const planPath = path.resolve(file);
  await noSymlinkAncestors(planPath);
  const bytes = await regularBytes(planPath, 1024 * 1024);
  if (sha256(bytes) !== expectedSha256) fail('qualification_digest_mismatch');

  const plan = parseQualificationPlan(bytes);
  if (plan?.schema === 'architecture.qualification-input/v2')
    return verifySelectedQualificationPlan(
      plan,
      path.dirname(planPath),
      executionChoice,
      policyChoice,
    );
  if (policyChoice !== null) fail('qualification_policy_choice_unadmitted');
  if (executionChoice.length) fail('qualification_execution_choice_unadmitted');
  return verifyLegacyQualificationPlan(plan, path.dirname(planPath));
}

/** One public route; version dispatch happens only after supervised selected reads. */
export async function verifyQualificationInput(
  file,
  expectedSha256,
  executionChoice = [],
  policyChoice = null,
) {
  if (!isDigest(expectedSha256)) fail('qualification_digest_required');
  if (
    policyChoice !== null &&
    (!exact(policyChoice, ['file', 'sha256']) ||
      typeof policyChoice.file !== 'string' ||
      !policyChoice.file ||
      !isDigest(policyChoice.sha256))
  )
    fail('qualification_policy_choice_invalid');
  return invokeQualificationWorker(
    'input',
    { file: path.resolve(file), sha256: expectedSha256 },
    executionChoice,
    policyChoice === null
      ? null
      : { file: path.resolve(policyChoice.file), sha256: policyChoice.sha256 },
  );
}
