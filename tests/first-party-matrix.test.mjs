import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { npmPackageIdentity } from './fixtures/package-identity.mjs';

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

test('the first-party matrix binds all consumers to one exact generic package', async (t) => {
  const matrix = await json(
    path.join(root, 'conformance/fixtures/first-party-contract-matrix.json'),
  );
  assert.equal(matrix.schema, 'architecture.publisher-first-party-contract-matrix/v3');
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
  const selfProviderBytes = await fs.readFile(
      path.join(root, 'tests/fixtures/providers/self/provider.json'),
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
    state: 'self-qualified-adopters-pending',
    targetTag: 'v0.3.0-alpha.0',
    publisher: {
      source: {
        commit: '1ea033ee42f55468cabc25f81a8e5ff5bef1dd13',
        tree: '0e93199a3d7928a2f87f786ba9ab31ab0a0024f8',
      },
      package: {
        name: 'architecture-publisher',
        version: '0.3.0-alpha.0',
        file: 'architecture-publisher-0.3.0-alpha.0.tgz',
        archiveSha256: 'a1cb5e308498263350be2c01a4faa031991ea7364de9c643cdbab863d29f6a34',
        contentTarSha256: '7042089a54b1bfa7935ab413e1f903f64c84bf673613c355179f07747faa4e2e',
      },
    },
    self: {
      sourceTree: '61ec956f99e99aceccedee8ddbeddad142df4bf3',
      package: {
        name: '@architecture-publisher/self-edition',
        version: '0.3.0-alpha.0',
        file: 'architecture-publisher-self-edition-0.3.0-alpha.0.tgz',
        archiveSha256: '3219782f8e495c951a5b9a441da0729bb9fe5cd436e63b051773b703a62f1559',
        contentTarSha256: '639d52f898fd9e2e4df32d633b2d6f1d9341095f1254c866687b8cd90f78dd6a',
      },
      provider: {
        delivery: 'declarative',
        manifestSha256: sha(selfProviderBytes),
        materializationSha256: '55e7c0453ce1bad4b22c925e6c53325d2f77653e05ae6c97c82c9d99fd65f8a0',
        bundleManifestSha256: 'ec7d8acfc2e3658c1a4d873f3e9ef2a899250469495243653fef6f3e98ac8f3c',
      },
      parity: {
        sourceManifestSha256: selfProvider.expected.sourceManifestSha256,
        claimModelDigest: selfProvider.expected.claimModelDigest,
        editionSha256: selfProvider.delivery.editionSha256,
        editionDigest: selfProvider.expected.editionDigest,
        staticSceneDigest: '1b3fc1ba6c763ac05cfa4c606a831538852c9bbf004d803032b5a58d1565b09d',
        interactiveSceneDigest: 'b55858442005c133563241414664627eb8648dd3744c21e34c0ef0be44b0cd4b',
        candidateSha256: 'c46716d92d4583f98be39407eb889cba68731ad37b7eac2bfe232fcb820675f7',
      },
    },
    adopters: {
      ethos: {
        handoffSchema: 'ethos.architecture-publisher-handoff/v4',
        providerMode: 'executable',
        state: 'proposed-not-authorized',
      },
      aigw: {
        handoffSchema: 'aigw.architecture-publisher-handoff/v3',
        providerMode: 'declarative',
        state: 'proposed-not-authorized',
      },
    },
    verdict: 'SELF_PASS_ADOPTERS_PENDING',
    limits: [
      'The 0.3 package candidate is reproducible but not yet a published release.',
      'ETHOS and AIGW Provider migration, acceptance, and publication remain source-owned and unperformed.',
    ],
  });
  assert.deepEqual(matrix.successor.self.parity, {
    sourceManifestSha256: selfProvider.expected.sourceManifestSha256,
    claimModelDigest: selfProvider.expected.claimModelDigest,
    editionSha256: selfProvider.delivery.editionSha256,
    editionDigest: selfProvider.expected.editionDigest,
    staticSceneDigest: '1b3fc1ba6c763ac05cfa4c606a831538852c9bbf004d803032b5a58d1565b09d',
    interactiveSceneDigest: 'b55858442005c133563241414664627eb8648dd3744c21e34c0ef0be44b0cd4b',
    candidateSha256: 'c46716d92d4583f98be39407eb889cba68731ad37b7eac2bfe232fcb820675f7',
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
  const sourceArchive = spawnSync(
    'git',
    ['archive', '--format=tar', `${matrix.publisher.observedCommit}:packages/publisher`],
    { cwd: root, encoding: null, maxBuffer: 32 * 1024 * 1024 },
  );
  assert.equal(sourceArchive.status, 0, sourceArchive.stderr?.toString());
  const extracted = spawnSync('tar', ['-xf', '-', '-C', source], {
    input: sourceArchive.stdout,
    encoding: null,
  });
  assert.equal(extracted.status, 0, extracted.stderr?.toString());
  const packed = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
    { cwd: source, encoding: 'utf8', timeout: 60_000 },
  );
  assert.equal(packed.status, 0, packed.stderr);
  const archive = path.join(temporary, JSON.parse(packed.stdout)[0].filename);
  const archiveBytes = await fs.readFile(archive);
  const packageIdentity = npmPackageIdentity(archiveBytes);
  assert.match(matrix.publisher.package.archiveSha256, /^[0-9a-f]{64}$/u);
  assert.equal(packageIdentity.contentTarSha256, matrix.publisher.package.contentTarSha256);

  const successorSource = path.join(temporary, 'successor-source');
  await fs.mkdir(successorSource);
  const successorArchive = spawnSync(
    'git',
    ['archive', '--format=tar', `${matrix.successor.publisher.source.commit}:packages/publisher`],
    { cwd: root, encoding: null, maxBuffer: 32 * 1024 * 1024 },
  );
  assert.equal(successorArchive.status, 0, successorArchive.stderr?.toString());
  const successorExtracted = spawnSync('tar', ['-xf', '-', '-C', successorSource], {
    input: successorArchive.stdout,
    encoding: null,
  });
  assert.equal(successorExtracted.status, 0, successorExtracted.stderr?.toString());
  const successorPacked = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
    { cwd: successorSource, encoding: 'utf8', timeout: 60_000 },
  );
  assert.equal(successorPacked.status, 0, successorPacked.stderr);
  const successorInfo = JSON.parse(successorPacked.stdout)[0];
  const successorBytes = await fs.readFile(path.join(temporary, successorInfo.filename));
  assert.equal(successorInfo.filename, matrix.successor.publisher.package.file);
  assert.deepEqual(npmPackageIdentity(successorBytes), {
    archiveSha256: matrix.successor.publisher.package.archiveSha256,
    contentTarSha256: matrix.successor.publisher.package.contentTarSha256,
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

  const ethos = await json(path.join(root, 'conformance/fixtures/ethos-source-owned-handoff.json'));
  const aigw = await json(path.join(root, 'conformance/fixtures/aigw-source-owned-handoff.json'));
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
