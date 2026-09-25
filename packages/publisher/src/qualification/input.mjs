import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { exact } from '../semantics/document.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { parseStrictJson } from '../source/json.mjs';
import { isDigest, portablePath } from '../source/manifest.mjs';
import { admitQualificationSet, qualificationSetDigest } from './contract.mjs';
import { runBoundedQualification } from './process-boundary.mjs';
import { replaySelectedCandidate } from './replay.mjs';
import { bindSelectedQualificationSet } from './selected.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const qualificationWorker = fileURLToPath(new URL('./worker.mjs', import.meta.url));
const QUALIFICATION_DEADLINE_MS = 120_000;

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

async function verifySelectedQualificationPlan(plan, parent, executionChoice) {
  if (
    !exact(plan, ['schema', 'request', 'candidate', 'qualification']) ||
    plan.schema !== 'architecture.qualification-input/v2'
  )
    fail('qualification_input_invalid');
  const request = selectedReference(parent, plan.request);
  const candidate = selectedReference(parent, plan.candidate);
  selectedReference(parent, plan.qualification);
  const selectedSet = await selectedJson(parent, plan.qualification, 'set', true);
  const replayed = await replaySelectedCandidate(
    {
      requestPath: request.path,
      requestSha256: request.sha256,
      candidateManifestPath: candidate.path,
      candidateManifestSha256: candidate.sha256,
    },
    executionChoice,
  );
  const bound = bindSelectedQualificationSet(
    replayed.candidate,
    replayed.replay,
    selectedSet.value,
  );
  return {
    status: 'verified',
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
  };
}

/** Execute only inside the supervised worker after the total deadline starts. */
export async function verifyQualificationInsideWorker(file, expectedSha256, executionChoice) {
  if (!isDigest(expectedSha256)) fail('qualification_digest_required');
  const planPath = path.resolve(file);
  await noSymlinkAncestors(planPath);
  const bytes = await regularBytes(planPath, 1024 * 1024);
  if (sha256(bytes) !== expectedSha256) fail('qualification_digest_mismatch');

  const plan = parseQualificationPlan(bytes);
  if (plan?.schema === 'architecture.qualification-input/v2')
    return verifySelectedQualificationPlan(plan, path.dirname(planPath), executionChoice);
  if (executionChoice.length) fail('qualification_execution_choice_unadmitted');
  return verifyLegacyQualificationPlan(plan, path.dirname(planPath));
}

/** One public route; version dispatch happens only after supervised selected reads. */
export async function verifyQualificationInput(file, expectedSha256, executionChoice = []) {
  if (!isDigest(expectedSha256)) fail('qualification_digest_required');
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-qualification-'),
  );
  let retain = false;
  try {
    for (const name of ['config', 'cache', 'data', 'tmp']) await fs.mkdir(path.join(scratch, name));
    const requestPath = path.join(scratch, 'invocation.json');
    await fs.writeFile(
      requestPath,
      JSON.stringify({
        schema: 'architecture.qualification-invocation/v1',
        file: path.resolve(file),
        sha256: expectedSha256,
        executionChoice,
      }),
      { flag: 'wx', mode: 0o600 },
    );
    return await runBoundedQualification({
      worker: qualificationWorker,
      requestPath,
      scratch,
      timeoutMs: QUALIFICATION_DEADLINE_MS,
      maximumBytes: 16 * 1024 * 1024,
      decode(raw) {
        let envelope;
        try {
          envelope = JSON.parse(raw);
        } catch {
          fail('qualification_worker_reply_invalid');
        }
        if (exact(envelope, ['status', 'code']) && envelope.status === 'error') {
          if (typeof envelope.code !== 'string' || !/^[a-z][a-z0-9_]+$/u.test(envelope.code))
            fail('qualification_worker_reply_invalid');
          fail(envelope.code);
        }
        if (!exact(envelope, ['status', 'result']) || envelope.status !== 'ok')
          fail('qualification_worker_reply_invalid');
        return envelope.result;
      },
    });
  } catch (error) {
    retain = ['qualification_cleanup_unproved', 'qualification_cleanup_failed'].includes(
      error?.code,
    );
    if (retain) error.retainedScratch = scratch;
    throw error;
  } finally {
    if (!retain) await fs.rm(scratch, { recursive: true, force: true });
  }
}
