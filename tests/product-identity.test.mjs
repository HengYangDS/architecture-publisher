import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const runGit = (...args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

test('alpha.7 migration baseline preserves exact local and remote identities', async () => {
  const baseline = JSON.parse(
    await fs.readFile(path.join(root, 'docs/migration/alpha7-baseline.json'), 'utf8'),
  );
  assert.equal(baseline.schema, 'architecture-publisher.migration-baseline/v1');
  assert.equal(baseline.observedAt, '2026-09-20');
  assert.equal(baseline.predecessor.product, 'Architecture Publishing');
  assert.equal(baseline.predecessor.repositoryPath, 'ethos-architecture');
  assert.equal(baseline.predecessor.package, 'architecture-publishing');
  assert.equal(baseline.predecessor.command, 'architecture');
  assert.equal(baseline.git.tag, 'v0.1.0-alpha.7');
  assert.equal(runGit('rev-parse', baseline.git.tag), baseline.git.tagObject);
  assert.equal(runGit('rev-parse', `${baseline.git.tag}^{}`), baseline.git.commit);
  assert.equal(runGit('rev-parse', `${baseline.git.commit}^{tree}`), baseline.git.tree);
  assert.equal(baseline.git.signature, 'PASS');
  assert.equal(baseline.gitlab.projectId, 1323);
  assert.equal(
    baseline.gitlab.pathWithNamespace,
    'dig/research/human-agent-stewardship/ethos-architecture',
  );
  assert.equal(baseline.gitlab.defaultBranch, 'main');
  assert.equal(baseline.gitlab.visibility, 'private');
  assert.equal(baseline.release.package.sha256.length, 64);
  assert.equal(baseline.release.qualification.sha256.length, 64);
  assert.equal(baseline.release.assetCount, 9);
  assert.equal(baseline.documents.staticPng.width, 6000);
  assert.equal(baseline.documents.staticPng.height, 3375);
  assert.equal(baseline.limits.independentOffHostRestore, 'UNPROVED');
});
