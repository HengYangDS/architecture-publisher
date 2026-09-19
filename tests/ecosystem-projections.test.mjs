import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');

test('release identity is projected once for alpha.6', async () => {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(root, 'package.json'), 'utf8'),
  );
  const packageLock = JSON.parse(
    await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'),
  );
  assert.equal(packageJson.version, '0.1.0-alpha.6');
  assert.equal(packageLock.version, packageJson.version);
  assert.equal(packageLock.packages[''].version, packageJson.version);

  const releaseToml = await fs.readFile(
    path.join(root, '.ethos/release.toml'),
    'utf8',
  );
  assert.match(releaseToml, /"v0\.1\.0-alpha\.6"/);
  assert.equal((releaseToml.match(/v0\.1\.0-alpha\.6/g) ?? []).length, 1);

  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /v0\.1\.0-alpha\.6/);
  assert.match(readme, /reuses the exact alpha\.5 reader bytes/i);
});

test('the packaged Skill remains a thin public CLI projection', async () => {
  const skill = await fs.readFile(
    path.join(root, 'skills/architecture-publication/SKILL.md'),
    'utf8',
  );
  assert.match(skill, /architecture publish semantic/);
  assert.match(skill, /architecture publish files plan/);
  assert.match(skill, /does not grant acceptance or authority/i);
  assert.doesNotMatch(skill, /\.architecture-state|\.comet|sqlite|daemon/i);

  const packed = spawnSync(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--dry-run'],
    { cwd: root, encoding: 'utf8', timeout: 60000 },
  );
  assert.equal(packed.status, 0, packed.stderr);
  assert(
    JSON.parse(packed.stdout)[0].files.some(
      (file) => file.path === 'skills/architecture-publication/SKILL.md',
    ),
  );
  assert(
    JSON.parse(packed.stdout)[0].files.some(
      (file) => file.path === 'docs/research/mechanism-evaluation.md',
    ),
  );
});

test('GitLab CI only projects repository-native gates', async () => {
  const ci = await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8');
  assert.match(
    ci,
    /node:26\.9\.0-bookworm@sha256:347d9d5391493c2fc3f0d161b75a9cab64a9805064b1b01b099f8ee97f98ed47/,
  );
  assert.match(ci, /npm --version/);
  assert.match(ci, /git --version/);
  assert.match(ci, /python3 --version/);
  assert.match(ci, /npm ci --ignore-scripts --no-audit --no-fund/);
  assert.match(ci, /npm run check/);
  assert.match(ci, /npm test/);
  assert.doesNotMatch(ci, /git push|architecture publish files apply|ethos publish/);
});
