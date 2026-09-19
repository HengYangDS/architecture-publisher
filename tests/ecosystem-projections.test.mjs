import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');

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
    /node:26\.9\.0-bookworm-slim@sha256:582460f614631b59b824ac6020533b9bf339c7fdf3a6d7db31abb6b4065f0212/,
  );
  assert.match(ci, /npm --version/);
  assert.match(ci, /npm ci --ignore-scripts --no-audit --no-fund/);
  assert.match(ci, /npm run check/);
  assert.match(ci, /npm test/);
  assert.doesNotMatch(ci, /git push|architecture publish files apply|ethos publish/);
});
