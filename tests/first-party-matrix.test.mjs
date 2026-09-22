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
  assert.equal(matrix.schema, 'architecture.publisher-first-party-contract-matrix/v2');
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
  assert.equal(matrix.consumers.self.provider.delivery, 'declarative');
  assert.equal(matrix.consumers.self.provider.manifestSha256, sha(selfProviderBytes));
  assert.deepEqual(matrix.consumers.self.provider.parity, {
    sourceManifestSha256: selfProvider.expected.sourceManifestSha256,
    claimModelDigest: selfProvider.expected.claimModelDigest,
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
