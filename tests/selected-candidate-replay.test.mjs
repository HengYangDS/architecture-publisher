import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import * as qualification from '../packages/publisher/src/qualification/index.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';
import { selectedNativeEdition } from './fixtures/selected-native-edition.mjs';

const verifySelectedCandidateReplay = qualification.verifySelectedCandidateReplay;

test('exact selected inputs and current runtime replay all Candidate bytes without qualification', async (t) => {
  assert.equal(typeof verifySelectedCandidateReplay, 'function');
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  const result = await verifySelectedCandidateReplay({
    requestPath: fixture.file,
    requestSha256: fixture.digest,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  assert.equal(result.status, 'replayed');
  assert.equal(result.verdict, 'match');
  assert.equal(result.candidateSha256, built.candidateSha256);
  assert.equal(result.inputLockSha256, built.lockSha256);
  assert.equal(result.candidateManifestSha256, built.manifestSha256);
  assert.equal(result.qualification, 'not-performed');
  assert.equal(result.acceptance, 'not-performed');
  assert.equal(result.publication, 'not-performed');
  assert.equal(Object.hasOwn(result, 'admitted'), false);
});

test('a self-consistent forged Candidate container cannot borrow selected-input authority', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const files = bundle.members.map(({ path: memberPath, content }) => {
    if (memberPath !== 'candidate.json') return { path: memberPath, content };
    const changed = JSON.parse(content);
    changed.input.lockSha256 = '0'.repeat(64);
    return { path: memberPath, content: Buffer.from(JSON.stringify(changed, null, 2) + '\n') };
  });
  const forged = await writeSourceBundle(path.join(fixture.root, 'forged'), bundle.source, files);
  await assert.rejects(
    verifySelectedCandidateReplay({
      requestPath: fixture.file,
      requestSha256: fixture.digest,
      candidateManifestPath: forged.manifestPath,
      candidateManifestSha256: forged.manifestSha256,
    }),
    { code: 'selected_candidate_replay_mismatch' },
  );
  const changedArtifact = await writeSourceBundle(
    path.join(fixture.root, 'changed-artifact'),
    bundle.source,
    bundle.members.map(({ path: memberPath, content }) => ({
      path: memberPath,
      content:
        memberPath === 'static/architecture.svg'
          ? Buffer.concat([content, Buffer.from('\n')])
          : content,
    })),
  );
  await assert.rejects(
    verifySelectedCandidateReplay({
      requestPath: fixture.file,
      requestSha256: fixture.digest,
      candidateManifestPath: changedArtifact.manifestPath,
      candidateManifestSha256: changedArtifact.manifestSha256,
    }),
    { code: 'selected_candidate_replay_mismatch' },
  );
});

test('a Candidate copied to a different Edition or changed pinned source does not replay', async (t) => {
  const first = await selectedNativeEdition(t, { width: 1800 });
  const other = await selectedNativeEdition(t, { width: 1800, title: 'Other architecture' });
  const built = await compileEditionCandidateInput(
    first.file,
    first.digest,
    path.join(first.root, 'candidate'),
  );
  const selected = {
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  };
  await assert.rejects(
    verifySelectedCandidateReplay({
      ...selected,
      requestPath: other.file,
      requestSha256: other.digest,
    }),
    { code: 'selected_candidate_replay_mismatch' },
  );
  await fs.appendFile(path.join(first.root, 'sources/model.c4'), '\n// changed\n');
  await assert.rejects(
    verifySelectedCandidateReplay({
      ...selected,
      requestPath: first.file,
      requestSha256: first.digest,
    }),
    { code: 'materialized_pin_mismatch' },
  );
});
