import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

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
  assert.equal(matrix.schema, 'architecture.publisher-first-party-contract-matrix/v1');
  assert.equal(matrix.publisher.package.name, 'architecture-publisher');
  assert.equal(matrix.publisher.package.version, '0.2.0-alpha.0');
  assert.equal(
    git('rev-parse', `${matrix.publisher.observedCommit}:packages/publisher`),
    matrix.publisher.package.tree,
  );
  assert.equal(git('rev-parse', 'HEAD:packages/publisher'), matrix.publisher.package.tree);
  assert.equal(git('rev-parse', 'HEAD:editions/self'), matrix.consumers.self.edition.tree);

  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-publisher-matrix-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const packed = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
    { cwd: path.join(root, 'packages/publisher'), encoding: 'utf8', timeout: 60_000 },
  );
  assert.equal(packed.status, 0, packed.stderr);
  const archive = path.join(temporary, JSON.parse(packed.stdout)[0].filename);
  assert.equal(sha256(await fs.readFile(archive)), matrix.publisher.package.sha256);

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
  assert.equal(
    matrix.consumers.ethos.edition.packageSha256,
    ethos.ethos.integration.package.sha256,
  );
  assert.deepEqual(matrix.consumers.ethos.candidate, ethos.terminalCandidate);
  assert.equal(matrix.consumers.aigw.edition.tree, aigw.aigw.source.editionTree);
  assert.deepEqual(matrix.consumers.aigw.candidate, aigw.aigw.candidate);

  assert.equal(matrix.performance.packageSha256, matrix.publisher.package.sha256);
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
