import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  archivePackageSource,
  assertPackageSourceReplay,
  npmPackageIdentity,
} from './fixtures/package-identity.mjs';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const root = path.resolve(import.meta.dirname, '..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function json(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function git(...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function gitBlob(revision, file) {
  const result = spawnSync('git', ['show', `${revision}:${file}`], {
    cwd: root,
    encoding: null,
  });
  assert.equal(result.status, 0, result.stderr?.toString());
  return result.stdout;
}

test('the historical first-party matrix replays fixed source and adopter observations', async (t) => {
  const matrix = await json(
    path.join(root, 'tests/conformance/evidence/first-party-contract-matrix.json'),
  );
  assert.equal(matrix.schema, 'architecture.publisher-first-party-contract-matrix/v4');
  assert.equal(matrix.publisher.package.name, 'architecture-publisher');
  assert.equal(matrix.publisher.package.version, '0.2.0-alpha.0');
  assert.equal(
    git('rev-parse', `${matrix.publisher.observedCommit}:packages/publisher`),
    matrix.publisher.package.tree,
  );
  assert.equal(
    git('rev-parse', `${matrix.publisher.observedCommit}:editions/self`),
    matrix.consumers.self.edition.tree,
  );
  const selfProviderBytes = gitBlob(
      matrix.successor.targetTag,
      'tests/fixtures/providers/self/provider.json',
    ),
    selfProvider = JSON.parse(selfProviderBytes);
  assert.equal(matrix.consumers.self.transport, 'source-owned-declarative-provider');
  assert.deepEqual(matrix.consumers.self.provider, {
    delivery: 'declarative',
    manifestSha256: '17381f4c4fd1e48aa6d2588e61d248f486be3b7a2b39eb41ec1b7ee360b862ef',
    materializationSha256: '6ee36cac032dc74018e02d8b45f6793f95e362db0d6bcad9a9f806bfd534ee9a',
    bundleManifestSha256: '43f5f1078a3b35d174ecd33134ae847d38b67a8a5e9bb6b975b371e3844f70b9',
    parity: {
      sourceManifestSha256: 'b6a9141a13624fe381a2b454784c07ec15704ebe5d23d6c5c6b869513100809c',
      claimModelDigest: '59cac5b3afb6c8e34e0643f8d1e4917994aa75df37c8e5a4144761a2c9d3b54b',
      editionDigest: '5e50ea1e7e5a8f4b27df7ba94c8bae677c4c01fc9ab1b8ce168d3f8db10df612',
      staticSceneDigest: '1b3fc1ba6c763ac05cfa4c606a831538852c9bbf004d803032b5a58d1565b09d',
      interactiveSceneDigest: 'b55858442005c133563241414664627eb8648dd3744c21e34c0ef0be44b0cd4b',
      candidateSha256: '09112b235bfdd83cc84ef7d365f6cc5dc9bdeda46723c4351fb7a59a2ff2695d',
    },
  });
  assert.deepEqual(matrix.successor, {
    state: 'published-self-qualified',
    targetTag: 'v0.3.0-alpha.1',
    publisher: {
      source: {
        commit: '7e82da7816e461f135076a6f984490d978a3a515',
        tree: '336d0e58058ba2b04b90208582bd4b3fb1f052f0',
      },
      package: {
        name: 'architecture-publisher',
        version: '0.3.0-alpha.1',
        file: 'architecture-publisher-0.3.0-alpha.1.tgz',
        archiveSha256: 'c2707bcffc9ba0cea277cb3b6f4fb6f04f2755996781f92c035fa9cadb4dcc37',
        contentTarSha256: '6b0a925f85879ea7a576c5153849e2741d2e54fcd83bf068cfb5a473b8c7d682',
      },
    },
    self: {
      sourceTree: '68cf9ea99c1064670e98bbb08af7473b3e6846a0',
      package: {
        name: '@architecture-publisher/self-edition',
        version: '0.3.0-alpha.1',
        file: 'architecture-publisher-self-edition-0.3.0-alpha.1.tgz',
        archiveSha256: '50a6af08d3c9997d8217b0050b10ad101b3e2909bcd8b5c7e15390da0d9434da',
        contentTarSha256: '764e6b5937322edf66c68468ba3c422b96ead24caf8442391bcc1d7e6073cd63',
      },
      provider: {
        delivery: 'declarative',
        manifestSha256: sha(selfProviderBytes),
        materializationSha256: 'bbd1e02a26c02a3286b0e142dc9d5feae2195a5fe3aaf24af2ae5d02f3ee7898',
        bundleManifestSha256: '66d06f18c54d209ffc9d77ccf42a0651844f47ff963e519dd9f8d50b2c1329f9',
      },
      parity: {
        sourceManifestSha256: selfProvider.expected.sourceManifestSha256,
        claimModelDigest: selfProvider.expected.claimModelDigest,
        editionSha256: selfProvider.delivery.editionSha256,
        editionDigest: selfProvider.expected.editionDigest,
        staticSceneDigest: '1b3fc1ba6c763ac05cfa4c606a831538852c9bbf004d803032b5a58d1565b09d',
        interactiveSceneDigest: 'b55858442005c133563241414664627eb8648dd3744c21e34c0ef0be44b0cd4b',
        candidateSha256: 'af334f517daa21c07eb2bcbafe5505a85dbfef9e7f6fca8c4a66ddcce9d9b7e4',
      },
    },
    adopters: {
      ethos: {
        handoffSchema: 'ethos.architecture-publisher-handoff/v4',
        providerMode: 'executable',
        authorizationOwner: 'ETHOS',
        acceptanceState: 'not-asserted-by-publisher',
      },
      aigw: {
        handoffSchema: 'aigw.architecture-publisher-handoff/v3',
        providerMode: 'declarative',
        authorizationOwner: 'AIGW',
        acceptanceState: 'not-asserted-by-publisher',
      },
    },
    verdict: 'PUBLISHED_SELF_PASS_ADOPTER_ACCEPTANCE_EXTERNAL',
    limits: [
      'The 0.3 release and self-qualification are bound to exact signed release evidence.',
      'ETHOS and AIGW migration, acceptance, and publication are source-owned and not asserted by this matrix.',
    ],
    releaseEvidence: {
      commit: '855c7c82b95f17a9f7c1c70d173f513e79b1f617',
      tag: 'v0.3.0-alpha.1',
      tagObject: '95054560cbb0c8c829921ea7bccbe29f6a943734',
      releaseManifestSha256: 'd0146a5a8b62d351227ed535b13d2b4642e0bf448705cda7440cc464c654b7b7',
      packageIdentitiesSha256: 'a5f59a0e668fa9279d31e4e0cc11d95f3e4e7e21242a7bc4329cad790c8293ca',
      qualificationSetDigest: 'bc6356bad08e5dc8bc34e2e3bb08bbdee168e600980cd1b4665227ae0c83062f',
      humanReviewSha256: '0ca6cbb7d1247327fc78970e0ce429d9e88f7b0401bada233ce7535d3c36ce72',
    },
  });
  assert.doesNotMatch(
    JSON.stringify(matrix.successor),
    /not yet a published release|proposed-not-authorized/u,
  );
  assert.equal(
    git('rev-parse', matrix.successor.releaseEvidence.tag + '^{}'),
    matrix.successor.releaseEvidence.commit,
  );
  assert.equal(
    git('rev-parse', matrix.successor.releaseEvidence.tag),
    matrix.successor.releaseEvidence.tagObject,
  );
  assert.deepEqual(
    Object.values(matrix.successor.adopters).map(({ authorizationOwner, acceptanceState }) => ({
      authorizationOwner,
      acceptanceState,
    })),
    [
      { authorizationOwner: 'ETHOS', acceptanceState: 'not-asserted-by-publisher' },
      { authorizationOwner: 'AIGW', acceptanceState: 'not-asserted-by-publisher' },
    ],
  );

  assert.deepEqual(matrix.successor.self.parity, {
    sourceManifestSha256: selfProvider.expected.sourceManifestSha256,
    claimModelDigest: selfProvider.expected.claimModelDigest,
    editionSha256: selfProvider.delivery.editionSha256,
    editionDigest: selfProvider.expected.editionDigest,
    staticSceneDigest: '1b3fc1ba6c763ac05cfa4c606a831538852c9bbf004d803032b5a58d1565b09d',
    interactiveSceneDigest: 'b55858442005c133563241414664627eb8648dd3744c21e34c0ef0be44b0cd4b',
    candidateSha256: 'af334f517daa21c07eb2bcbafe5505a85dbfef9e7f6fca8c4a66ddcce9d9b7e4',
  });

  const providerSource = (
    await Promise.all(
      (await fs.readdir(path.join(root, 'packages/publisher/src/provider')))
        .filter((name) => name.endsWith('.mjs'))
        .map((name) =>
          fs.readFile(path.join(root, 'packages/publisher/src/provider', name), 'utf8'),
        ),
    )
  ).join('\n');
  assert.doesNotMatch(providerSource, /architecture-publisher-self-hosted|self-hosted/u);

  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-publisher-matrix-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, 'source');
  await fs.mkdir(source);
  const sourceArchive = archivePackageSource({
    repository: root,
    tree: `${matrix.publisher.observedCommit}:packages/publisher`,
  });
  const extracted = spawnSync('tar', ['-xf', '-', '-C', source], {
    input: sourceArchive,
    encoding: null,
  });
  assert.equal(extracted.status, 0, extracted.stderr?.toString());
  const packed = spawnNativeSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
    { cwd: source, encoding: 'utf8', timeout: 60_000 },
  );
  assert.equal(packed.status, 0, packed.stderr);
  const packedInfo = parseNpmPackRecord(packed.stdout);
  const archive = path.join(temporary, packedInfo.filename);
  const archiveBytes = await fs.readFile(archive);
  const packageIdentity = npmPackageIdentity(archiveBytes);
  assert.match(matrix.publisher.package.archiveSha256, /^[0-9a-f]{64}$/u);
  if (process.platform !== 'win32')
    assert.equal(packageIdentity.contentTarSha256, matrix.publisher.package.contentTarSha256);
  const packedRoot = path.join(temporary, 'core-packed');
  await fs.mkdir(packedRoot);
  const coreExtracted = spawnSync('tar', ['-xzf', archive, '-C', packedRoot], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(coreExtracted.status, 0, coreExtracted.stderr);
  await assertPackageSourceReplay({
    repository: root,
    tree: matrix.publisher.package.tree,
    root: path.join(packedRoot, 'package'),
    files: packedInfo.files.map(({ path: file }) => file),
  });

  const successorSource = path.join(temporary, 'successor-source');
  await fs.mkdir(successorSource);
  const successorArchive = archivePackageSource({
    repository: root,
    tree: `${matrix.successor.publisher.source.commit}:packages/publisher`,
  });
  const successorExtracted = spawnSync('tar', ['-xf', '-', '-C', successorSource], {
    input: successorArchive,
    encoding: null,
  });
  assert.equal(successorExtracted.status, 0, successorExtracted.stderr?.toString());
  const successorPacked = spawnNativeSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
    { cwd: successorSource, encoding: 'utf8', timeout: 60_000 },
  );
  assert.equal(successorPacked.status, 0, successorPacked.stderr);
  const successorInfo = parseNpmPackRecord(successorPacked.stdout);
  const successorBytes = await fs.readFile(path.join(temporary, successorInfo.filename));
  const successorIdentity = npmPackageIdentity(successorBytes);
  assert.equal(successorInfo.filename, matrix.successor.publisher.package.file);
  assert.match(matrix.successor.publisher.package.archiveSha256, /^[0-9a-f]{64}$/u);
  assert.match(successorIdentity.archiveSha256, /^[0-9a-f]{64}$/u);
  if (process.platform !== 'win32')
    assert.equal(
      successorIdentity.contentTarSha256,
      matrix.successor.publisher.package.contentTarSha256,
    );
  const successorPackedRoot = path.join(temporary, 'successor-packed');
  await fs.mkdir(successorPackedRoot);
  const packedExtracted = spawnSync(
    'tar',
    ['-xzf', path.join(temporary, successorInfo.filename), '-C', successorPackedRoot],
    {
      encoding: 'utf8',
      timeout: 30_000,
    },
  );
  assert.equal(packedExtracted.status, 0, packedExtracted.stderr);
  await assertPackageSourceReplay({
    repository: root,
    tree: matrix.successor.publisher.source.tree,
    root: path.join(successorPackedRoot, 'package'),
    files: successorInfo.files.map(({ path: file }) => file),
  });

  const required = [
    'source',
    'semantics',
    'scenes',
    'qualification',
    'publication',
    'replacement',
    'interruption-recovery',
    'reader-journeys',
  ];
  assert.deepEqual(
    matrix.contracts.map(({ id }) => id),
    required,
  );
  for (const contract of matrix.contracts)
    for (const consumer of ['self', 'ethos', 'aigw'])
      assert.match(
        contract.consumers[consumer],
        /^pass(?:-[a-z-]+)?$/u,
        `${contract.id}:${consumer}`,
      );

  const ethos = await json(
    path.join(root, 'tests/conformance/fixtures/ethos-source-owned-handoff.json'),
  );
  const aigw = await json(
    path.join(root, 'tests/conformance/fixtures/aigw-source-owned-handoff.json'),
  );
  assert.equal(matrix.consumers.ethos.edition.tree, ethos.ethos.integration.source.oid);
  assert.deepEqual(matrix.consumers.ethos.edition.package, {
    archiveSha256: ethos.ethos.integration.package.archiveSha256,
    contentTarSha256: ethos.ethos.integration.package.contentTarSha256,
  });
  assert.deepEqual(matrix.consumers.ethos.candidate, ethos.terminalCandidate);
  assert.equal(matrix.consumers.aigw.edition.tree, aigw.aigw.source.editionTree);
  assert.deepEqual(matrix.consumers.aigw.candidate, aigw.aigw.candidate);

  assert.equal(
    matrix.performance.packageContentTarSha256,
    matrix.publisher.package.contentTarSha256,
  );
  assert.equal(
    matrix.sharedKernel.packageContentTarSha256,
    matrix.publisher.package.contentTarSha256,
  );
  assert.equal(matrix.performance.repetitions, 3);
  for (const consumer of Object.values(matrix.performance.consumers)) {
    assert.equal(consumer.deterministic, true);
    assert(consumer.completeMedianMs > consumer.affectedViewAnalysisMedianMs);
    assert.equal(
      Math.abs(
        consumer.analysisFraction -
          consumer.affectedViewAnalysisMedianMs / consumer.completeMedianMs,
      ) < 0.00001,
      true,
    );
    assert.match(consumer.reportSha256, /^[0-9a-f]{64}$/u);
  }
  assert.deepEqual(
    Object.values(matrix.performance.decisions).map(({ decision }) => decision),
    ['defer', 'defer', 'defer'],
  );

  assert.doesNotMatch(JSON.stringify(matrix), /\/Users\/|file:\/\//u);
  assert.equal(matrix.verdict, 'PASS_CONTRACT_MATRIX');
  assert.deepEqual(matrix.limits, [
    'The matrix proves product contracts, not ETHOS or AIGW repository acceptance.',
    'Remote publication and final human review remain separate release gates.',
  ]);
});
