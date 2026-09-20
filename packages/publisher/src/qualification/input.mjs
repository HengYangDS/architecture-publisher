import path from 'node:path';
import { createHash } from 'node:crypto';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { isDigest } from '../source/manifest.mjs';
import {
  qualificationSetDigest,
  validateQualificationSet,
} from './contract.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

/** Verify an exact external Qualification Set; never execute or infer a predicate. */
export async function verifyQualificationInput(file, expectedSha256) {
  if (!isDigest(expectedSha256)) fail('qualification_digest_required');
  const selected = path.resolve(file);
  await noSymlinkAncestors(selected);
  const bytes = await regularBytes(selected, 16 * 1024 * 1024);
  if (sha256(bytes) !== expectedSha256) fail('qualification_digest_mismatch');
  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail('qualification_json_invalid');
  }
  const qualificationSetSha256 = qualificationSetDigest(value);
  const qualification = validateQualificationSet(value);
  return {
    status: 'verified',
    qualificationSetSha256,
    candidateSha256: qualification.candidateSha256,
    verdict: qualification.verdict,
    records: qualification.records.length,
    authorization: 'not-performed',
    publication: 'not-performed',
  };
}
