import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  qualificationSetDigest,
  validateQualificationSet,
  verifyQualificationInput,
} from '../packages/publisher/src/qualification/index.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const exactDigest = (value) => digest(Buffer.from(value));
const root = path.resolve(import.meta.dirname, '..');
const cli = path.join(root, 'packages/publisher/src/cli/main.mjs');

function record(overrides = {}) {
  return {
    id: 'semantic.integrity',
    subject: {
      kind: 'edition-candidate',
      sha256: exactDigest('candidate'),
    },
    editionSha256: exactDigest('edition'),
    sourceSha256: exactDigest('source'),
    semanticSha256: exactDigest('semantic'),
    verifier: {
      id: 'architecture-publisher.semantic-verifier',
      implementationSha256: exactDigest('verifier'),
    },
    predicate: 'semantic-integrity',
    scope: {
      kind: 'document',
      value: 'candidate.json',
    },
    environment: null,
    observations: [{ name: 'claim-model', value: 'valid' }],
    verdict: 'PASS',
    limitations: [],
    ...overrides,
  };
}

function set(records = [record()]) {
  return {
    schema: 'architecture.qualification-set/v1',
    candidateSha256: exactDigest('candidate'),
    editionSha256: exactDigest('edition'),
    sourceSha256: exactDigest('source'),
    semanticSha256: exactDigest('semantic'),
    records,
  };
}

test('qualification set validates exact predicate-specific evidence without manufacturing acceptance', () => {
  const source = set();
  const selected = validateQualificationSet(source);
  assert.equal(selected.records[0].verdict, 'PASS');
  assert.equal(selected.records[0].environment, null);
  assert.match(qualificationSetDigest(source), /^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(selected, 'status'), false);
  assert.equal(Object.hasOwn(selected, 'accepted'), false);
});

test('qualification records fail closed on unknown fields, duplicate identities, and ambiguous subjects', () => {
  assert.throws(
    () => validateQualificationSet(set([{ ...record(), score: 100 }])),
    { code: 'qualification_record_invalid' },
  );
  assert.throws(
    () => validateQualificationSet(set([record(), record()])),
    { code: 'qualification_record_duplicate' },
  );
  assert.throws(
    () =>
      validateQualificationSet(
        set([record({ subject: { kind: 'edition-candidate', sha256: 'bad' } })]),
      ),
    { code: 'qualification_subject_invalid' },
  );
});

test('qualification records remain non-compensating and bind common identities', () => {
  const failed = validateQualificationSet(
    set([
      record(),
      record({
        id: 'geometry.overlap',
        predicate: 'painted-geometry',
        verdict: 'FAIL',
      }),
    ]),
  );
  assert.equal(failed.verdict, 'FAIL');
  assert.deepEqual(
    failed.records.map(({ verdict }) => verdict),
    ['PASS', 'FAIL'],
  );
  assert.throws(
    () =>
      validateQualificationSet(
        set([
          record({
            editionSha256: exactDigest('other-edition'),
          }),
        ]),
      ),
    { code: 'qualification_identity_mismatch' },
  );
});

test('qualification input verifies selected bytes and exposes no authority claim', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'qualification-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'qualification.json');
  const bytes = Buffer.from(JSON.stringify(set(), null, 2) + '\n');
  await fs.writeFile(file, bytes);
  const result = await verifyQualificationInput(file, digest(bytes));
  assert.deepEqual(
    {
      status: result.status,
      verdict: result.verdict,
      authorization: result.authorization,
      publication: result.publication,
      records: result.records,
    },
    {
      status: 'verified',
      verdict: 'PASS',
      authorization: 'not-performed',
      publication: 'not-performed',
      records: 1,
    },
  );
  await assert.rejects(
    verifyQualificationInput(file, exactDigest('changed')),
    { code: 'qualification_digest_mismatch' },
  );
});

test('generic CLI exposes exact qualification verification', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'qualification-cli-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'qualification.json');
  const bytes = Buffer.from(JSON.stringify(set(), null, 2) + '\n');
  await fs.writeFile(file, bytes);
  const result = spawnSync(
    process.execPath,
    [cli, 'qualify', 'verify', file, '--sha256', digest(bytes)],
    { cwd: directory, encoding: 'utf8', timeout: 10000 },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'verified');
});
