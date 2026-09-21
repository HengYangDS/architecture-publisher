import path from 'node:path';
import { createHash } from 'node:crypto';
import { exact } from '../semantics/document.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { isDigest, portablePath } from '../source/manifest.mjs';
import { admitQualificationSet, qualificationSetDigest } from './contract.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

/** Verify an exact external Qualification Set; never execute or infer a predicate. */
async function selectedJson(parent, selector, kind) {
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
      value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)),
      sha256: selector.sha256,
    };
  } catch {
    fail(`qualification_${kind}_json_invalid`);
  }
}

export async function verifyQualificationInput(file, expectedSha256) {
  if (!isDigest(expectedSha256)) fail('qualification_digest_required');
  const planPath = path.resolve(file);
  await noSymlinkAncestors(planPath);
  const bytes = await regularBytes(planPath, 1024 * 1024);
  if (sha256(bytes) !== expectedSha256) fail('qualification_digest_mismatch');

  let plan;
  try {
    plan = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail('qualification_json_invalid');
  }
  if (
    !exact(plan, ['schema', 'claimModel', 'edition', 'candidate', 'qualification']) ||
    plan.schema !== 'architecture.qualification-input/v1'
  )
    fail('qualification_input_invalid');

  const parent = path.dirname(planPath),
    [claimModel, edition, candidate, qualification] = await Promise.all([
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
