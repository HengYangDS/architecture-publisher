import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { editionProviderPackageDigest } from '../packages/publisher/src/provider/index.mjs';
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
const packageRoot = fileURLToPath(new URL('../packages/publisher/', import.meta.url));

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
  assert.equal(built.requestSha256, fixture.digest);
  assert.equal(built.installedPackage?.scope, 'current-invocation-installed-content');
  assert.deepEqual(result.installedPackage, built.installedPackage);
  assert.deepEqual(result.replayedEditionObligations.static.questionIds, ['shape']);
  assert.deepEqual(result.replayedEditionObligations.static.views[0].assertionsByQuestion.shape, [
    'overview',
  ]);
  assert.equal(result.qualification, 'not-performed');
  assert.equal(result.acceptance, 'not-performed');
  assert.equal(result.publication, 'not-performed');
  assert.equal(Object.hasOwn(result, 'admitted'), false);
});

test('package-only changes alter execution evidence without changing Candidate identity', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const original = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'original-candidate'),
  );
  const relocatedRoot = path.join(fixture.root, 'relocated-package');
  await fs.cp(packageRoot, relocatedRoot, {
    recursive: true,
    filter: (source) => path.basename(source) !== 'node_modules',
  });
  await fs.appendFile(path.join(relocatedRoot, 'README.md'), '\nPackage-only note.\n');
  const relocated = await import(
    pathToFileURL(path.join(relocatedRoot, 'src/compiler/index.mjs')).href
  );
  const changedPackage = await relocated.compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'relocated-candidate'),
  );
  assert.equal(changedPackage.candidateSha256, original.candidateSha256);
  assert.equal(changedPackage.manifestSha256, original.manifestSha256);
  assert.notEqual(changedPackage.installedPackage.treeSha256, original.installedPackage.treeSha256);
});

test('a package change during Provider preparation fails before Candidate emission', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  await executableModelProvider(fixture);
  const relocatedRoot = path.join(fixture.root, 'relocated-package');
  await fs.cp(packageRoot, relocatedRoot, {
    recursive: true,
    filter: (source) => path.basename(source) !== 'node_modules',
  });
  const providerRoot = path.join(fixture.root, 'provider/package');
  await fs.writeFile(
    path.join(providerRoot, 'provider.mjs'),
    `import fs from 'node:fs/promises';
export async function materializeEditionProvider() {
  await fs.appendFile(${JSON.stringify(path.join(relocatedRoot, 'README.md'))}, '\\nChanged during build.\\n');
  return { schema: 'architecture.edition-provider-reply/v2', derived: [] };
}
`,
  );
  const manifestPath = path.join(fixture.root, 'provider/provider.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  manifest.delivery.package.contentSha256 = await editionProviderPackageDigest(providerRoot);
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + '\n');
  await fs.writeFile(manifestPath, manifestBytes);
  fixture.request.providers[0].sha256 = sha(manifestBytes);
  const requestBytes = Buffer.from(JSON.stringify(fixture.request) + '\n');
  await fs.writeFile(fixture.file, requestBytes);
  fixture.digest = sha(requestBytes);
  const relocated = await import(
    pathToFileURL(path.join(relocatedRoot, 'src/compiler/index.mjs')).href
  );
  const output = path.join(fixture.root, 'candidate');
  await assert.rejects(
    relocated.compileEditionCandidateInput(fixture.file, fixture.digest, output, [
      { id: 'model-provider', manifestSha256: fixture.request.providers[0].sha256 },
    ]),
    {
      code: 'publisher_installed_package_changed_during_build',
    },
  );
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('selected build rejects a non-directory or aliased output parent before effects', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const regularParent = path.join(fixture.root, 'regular-parent');
  await fs.writeFile(regularParent, 'not a directory');
  await assert.rejects(
    compileEditionCandidateInput(
      fixture.file,
      fixture.digest,
      path.join(regularParent, 'candidate'),
    ),
    { code: 'edition_candidate_output_parent_invalid' },
  );
  const physicalParent = path.join(fixture.root, 'physical-parent');
  await fs.mkdir(physicalParent);
  await fs.mkdir(path.join(physicalParent, 'inside'));
  const aliasedParent = path.join(fixture.root, 'aliased-parent');
  await fs.symlink(physicalParent, aliasedParent, 'dir');
  await assert.rejects(
    compileEditionCandidateInput(
      fixture.file,
      fixture.digest,
      path.join(aliasedParent, 'inside', 'candidate'),
    ),
    { code: 'edition_candidate_output_parent_invalid' },
  );
  await assert.rejects(fs.access(path.join(physicalParent, 'inside', 'candidate')), {
    code: 'ENOENT',
  });
});

test('replay refuses a source bundle without its Candidate member', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  const selected = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const withoutCandidate = await writeSourceBundle(
    path.join(fixture.root, 'without-candidate'),
    selected.source,
    selected.members
      .filter(({ path: memberPath }) => memberPath !== 'candidate.json')
      .map(({ path: memberPath, content }) => ({ path: memberPath, content })),
  );
  await assert.rejects(
    verifySelectedCandidateReplay({
      requestPath: fixture.file,
      requestSha256: fixture.digest,
      candidateManifestPath: withoutCandidate.manifestPath,
      candidateManifestSha256: withoutCandidate.manifestSha256,
    }),
    { code: 'selected_candidate_missing' },
  );
});

test('Candidate carries its exact input lock for later role attribution without Provider replay', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const members = new Map(
    bundle.members.map(({ path: memberPath, content }) => [memberPath, content]),
  );
  const candidate = JSON.parse(members.get('candidate.json'));
  const lockBytes = members.get('input-lock.json');
  assert(lockBytes);
  assert.equal(sha(lockBytes), built.lockSha256);
  assert.equal(sha(lockBytes), candidate.input.lockSha256);
  const lock = JSON.parse(lockBytes);
  assert.equal(lock.schema, 'architecture.materialized-input-lock/v1');
  assert.equal(lock.edition.editor, fixture.project.editor);
  assert(lock.sources.length > 0);
  assert(lock.sources.every((source) => source.claimant && source.revision));
});

test('Candidate identifies checked Publisher media file sets without changing input identity', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const members = new Map(bundle.members.map(({ path: name, content }) => [name, content]));
  const candidate = JSON.parse(members.get('candidate.json'));
  const lock = JSON.parse(members.get('input-lock.json'));
  assert.equal(Object.hasOwn(lock, 'renderer'), false);
  const semantic = candidate.input.semanticSupplies.find(
    ({ id }) => id === 'publisher-semantic-file-set',
  );
  assert(semantic, 'selected semantic compiler files must be identified');
  assert.equal(semantic.method, 'checked-installed-file-set/v1');
  for (const supply of [
    ...candidate.input.semanticSupplies,
    ...Object.values(candidate.media).flatMap(({ supplies }) => supplies),
  ]) {
    assert.deepEqual(Object.keys(supply).sort(), ['basis', 'id', 'method', 'sha256']);
    assert.equal(supply.basis, 'checked-declared');
  }
  for (const medium of ['static', 'interactive']) {
    const selected = candidate.media[medium].supplies.find(
      ({ id }) => id === `publisher-${medium}-media-file-set`,
    );
    assert(selected, `${medium} must identify its checked Publisher media files`);
    assert.match(selected.sha256, /^[a-f0-9]{64}$/u);
    assert.equal(selected.method, 'checked-installed-file-set/v1');
  }
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
    [{ id: 'model-provider', manifestSha256 }],
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
  const selectedParent = Number(await fs.readFile(executionMarker, 'utf8'));
  assert(Number.isSafeInteger(selectedParent));
  assert.notEqual(selectedParent, process.pid, 'public replay bypassed its independent parent');
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
