import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import * as qualification from '../packages/publisher/src/qualification/index.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';
import {
  executableModelProvider,
  moveModelToProvider,
  selectedNativeEdition,
  sha,
} from './fixtures/selected-native-edition.mjs';

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
  assert.deepEqual(result.replayedEditionObligations.static.questionIds, ['shape']);
  assert.deepEqual(result.replayedEditionObligations.static.views[0].assertionsByQuestion.shape, [
    'shape',
  ]);
  assert.equal(result.qualification, 'not-performed');
  assert.equal(result.acceptance, 'not-performed');
  assert.equal(result.publication, 'not-performed');
  assert.equal(Object.hasOwn(result, 'admitted'), false);
});

test('replay rejects duplicate keys in the selected Candidate container manifest', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  const forged = path.join(fixture.root, 'duplicate-manifest');
  await fs.cp(built.output, forged, { recursive: true });
  const manifest = await fs.readFile(path.join(forged, 'manifest.json'), 'utf8');
  const duplicated = Buffer.from(
    manifest.replace('"schema":', '"schema":"architecture.source-bundle/v1","schema":'),
  );
  await fs.writeFile(path.join(forged, 'manifest.json'), duplicated);
  const legacy = await readSourceBundle(path.join(forged, 'manifest.json'), sha(duplicated));
  assert.equal(legacy.manifestSha256, sha(duplicated));
  await assert.rejects(
    verifySelectedCandidateReplay({
      requestPath: fixture.file,
      requestSha256: fixture.digest,
      candidateManifestPath: path.join(forged, 'manifest.json'),
      candidateManifestSha256: sha(duplicated),
    }),
    { code: 'manifest_json_duplicate_key' },
  );
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

test('replay executes Provider code only with a separate exact invocation choice', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const { executionMarker, manifestSha256 } = await executableModelProvider(fixture);
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  await fs.rm(executionMarker);
  const selected = {
    requestPath: fixture.file,
    requestSha256: fixture.digest,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  };
  await assert.rejects(verifySelectedCandidateReplay(selected), {
    code: 'materialized_provider_execution_choice_mismatch',
  });
  await assert.rejects(fs.access(executionMarker), { code: 'ENOENT' });
  await assert.rejects(
    verifySelectedCandidateReplay(selected, [
      { id: 'model-provider', manifestSha256: '0'.repeat(64) },
    ]),
    { code: 'materialized_provider_execution_choice_mismatch' },
  );
  await assert.rejects(fs.access(executionMarker), { code: 'ENOENT' });
  await assert.rejects(
    verifySelectedCandidateReplay({ ...selected, providerExecution: 'allow-selected' }),
    { code: 'selected_candidate_replay_input_invalid' },
  );
  const result = await verifySelectedCandidateReplay(selected, [
    { id: 'model-provider', manifestSha256 },
  ]);
  assert.equal(result.candidateSha256, built.candidateSha256);
  assert.equal(await fs.readFile(executionMarker, 'utf8'), 'executed');
});

test('replay rejects an execution choice when no executable Provider is selected', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  await assert.rejects(
    verifySelectedCandidateReplay(
      {
        requestPath: fixture.file,
        requestSha256: fixture.digest,
        candidateManifestPath: built.manifestPath,
        candidateManifestSha256: built.manifestSha256,
      },
      [{ id: 'unselected', manifestSha256: '0'.repeat(64) }],
    ),
    { code: 'materialized_provider_execution_choice_mismatch' },
  );
});

test('one forged choice cannot stand in for two selected executable Providers', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  await moveModelToProvider(fixture, fixture.model, 'executable');
  const manifestBytes = await fs.readFile(path.join(fixture.root, 'provider/provider.json'));
  const manifestSha256 = sha(manifestBytes);
  await fs.mkdir(path.join(fixture.root, 'provider-beta'));
  await fs.writeFile(path.join(fixture.root, 'provider-beta/provider.json'), manifestBytes);
  fixture.request.providers.push({
    id: 'beta-provider',
    manifest: 'provider-beta/provider.json',
    sha256: manifestSha256,
    packageRoot: 'provider-beta/package',
  });
  const requestBytes = Buffer.from(JSON.stringify(fixture.request) + '\n');
  await fs.writeFile(fixture.file, requestBytes);
  fixture.digest = sha(requestBytes);
  await assert.rejects(
    verifySelectedCandidateReplay(
      {
        requestPath: fixture.file,
        requestSha256: fixture.digest,
        candidateManifestPath: built.manifestPath,
        candidateManifestSha256: built.manifestSha256,
      },
      [{ id: `beta-provider@${manifestSha256}\nmodel-provider`, manifestSha256 }],
    ),
    { code: 'materialized_provider_execution_choice_mismatch' },
  );
});
