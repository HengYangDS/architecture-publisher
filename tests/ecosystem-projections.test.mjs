import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('current package identity and predecessor release are explicit', async () => {
  const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
  assert.equal(packageJson.version, '0.3.0-alpha.3');
  assert.equal(packageLock.version, packageJson.version);
  assert.equal(packageLock.packages[''].version, packageJson.version);

  const releaseToml = await fs.readFile(path.join(root, '.ethos/release.toml'), 'utf8');
  assert.match(releaseToml, /^tags = \["v\*"\]$/mu);
  assert.doesNotMatch(releaseToml, /tags = \[[^\]]*v[0-9]/u);
  assert.match(releaseToml, /^local_verification_command = "npm run check"$/mu);
  assert.match(releaseToml, /^capabilities = \["repository", "ci_cd", "publication"\]$/mu);
  assert.match(releaseToml, /^ci_surface = "\.gitlab-ci\.yml"$/mu);

  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  const operations = await fs.readFile(path.join(root, 'docs/reference/operations.md'), 'utf8');
  assert.match(readme, /v0\.1\.0-alpha\.7/);
  assert.match(operations, /links the immutable\s+alpha\.5 reader release/i);
  assert.match(operations, /Published reader[\s\S]*v0\.1\.0-alpha\.5/);
  assert.match(operations, /Candidate viewing copy[\s\S]*VIEWING_COPY_NOT_QUALIFIED_RELEASE/i);
  assert.match(operations, /Complete recovery[\s\S]*v0\.1\.0-alpha\.3/);
  assert.match(operations, /804971adf9be09d3389d7229441200a4116e5d336334e33fd9b328ba66282cfa/);
  assert.match(operations, /5f4ea104b95112d84635881600d2c75ae3eae65a45b4b61a4fe5936df3ee3cda/);
});

test('the packaged Skill remains a thin public CLI projection', async () => {
  const skill = await fs.readFile(
    path.join(root, 'skills/architecture-publisher/SKILL.md'),
    'utf8',
  );
  assert.match(skill, /archpub edition build/);
  assert.match(skill, /archpub publish plan/);
  assert.match(skill, /does not grant acceptance or authority/i);
  assert.doesNotMatch(skill, /\.architecture-state|\.comet|sqlite|daemon/i);

  const packed = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--dry-run'], {
    cwd: path.join(root, 'packages/publisher'),
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(packed.status, 0, packed.stderr);
  const files = parseNpmPackRecord(packed.stdout).files;
  assert.equal(
    files.some((file) => /(^|\/)skills\//.test(file.path)),
    false,
  );
  assert(files.every((file) => !file.path.startsWith('docs/research/')));
});

test('current guidance names only the public 0.3 command and package boundaries', async () => {
  const files = [
    'README.md',
    'docs/reference/operations.md',
    'examples/README.md',
    'conformance/journeys/self-host/README.md',
    'conformance/fixtures/ethos-source-owned-handoff.json',
    'packages/publisher/README.md',
    'skills/architecture-publisher/SKILL.md',
  ];
  const source = (
    await Promise.all(files.map((file) => fs.readFile(path.join(root, file), 'utf8')))
  ).join('\n');
  for (const obsolete of [
    'archpub semantic compare',
    'archpub publish semantic',
    'archpub publish files',
    'archpub source ethos',
    'archpub atlas ethos',
    'archpub poster ethos',
    'editions/ethos/',
  ])
    assert.equal(source.includes(obsolete), false, obsolete);
  for (const current of [
    'archpub source pack',
    'archpub source verify',
    'archpub edition build',
    'archpub evolution plan',
    'archpub qualify verify',
    'archpub publish plan',
    'packages/publisher',
    'ethos.architecture-publisher-handoff/v4',
  ])
    assert.equal(source.includes(current), true, current);
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
  assert.doesNotMatch(ci, /^[ ]+- npm test$/mu);
  assert.doesNotMatch(ci, /git push|archpub publish files apply|ethos publish/);
});

test('provider guidance preserves one command plane and explicit ownership boundaries', async () => {
  const files = [
    'docs/reference/edition-provider.md',
    'docs/migration/aigw-edition-provider.md',
    'docs/migration/edition-provider-ethos.md',
    'docs/reference/disaster-recovery-decision-contract.md',
  ];
  const documents = Object.fromEntries(
    await Promise.all(
      files.map(async (file) => [file, await fs.readFile(path.join(root, file), 'utf8')]),
    ),
  );
  const provider = documents['docs/reference/edition-provider.md'];
  for (const term of [
    'Edition Provider',
    'archpub edition build',
    '`subject`',
    '`producer`',
    '`authorizationOwner`',
    '`custodian`',
    'does not grant acceptance',
  ])
    assert.match(provider, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'), term);
  assert.doesNotMatch(provider, /archpub provider/u);

  const aigw = documents['docs/migration/aigw-edition-provider.md'];
  const normalizedAigw = aigw.replace(/\s+/gu, ' ');
  for (const term of [
    'declarative',
    'architecture/edition-provider',
    'AIGW Client Projection',
    'not the whole AIGW product',
    'immutable history',
    'rollback',
    'AIGW alone decides',
  ])
    assert.match(normalizedAigw, new RegExp(term, 'iu'), term);
  assert.match(normalizedAigw, /it is not a Git commit/iu);
  assert.match(
    normalizedAigw,
    /successor specification is reviewed, but its implementation and release are pending/iu,
  );
  assert.match(normalizedAigw, /no AIGW source change is authorized/iu);

  const ethos = documents['docs/migration/edition-provider-ethos.md'];
  const normalizedEthos = ethos.replace(/\s+/gu, ' ');
  for (const term of [
    'executable',
    'adapt selected native facts',
    'Edition editor',
    'renderer',
    'browser',
    'raster',
    'qualification',
    'review',
    'publication',
    'forge',
    'governance',
    'Parity or an explicitly reviewed successor delta',
    'ETHOS owns its native facts',
    'Work Lanes',
    'proof',
    'CAS effects',
    'source-product acceptance',
  ])
    assert.match(normalizedEthos, new RegExp(term, 'iu'), term);
  assert.match(
    normalizedEthos,
    /successor specification is reviewed, but implementation and release are pending/iu,
  );

  const recovery = documents['docs/reference/disaster-recovery-decision-contract.md'];
  for (const term of [
    'unproved',
    'independent destination',
    'custody owner',
    'retention',
    'encryption',
    'bounded credential',
    'restore environment',
    'restore acceptance',
    'GitLab',
    'package storage',
    'CI',
    'Documents',
    'same-disk',
  ])
    assert.match(recovery, new RegExp(term, 'iu'), term);

  const combined = Object.values(documents).join('\n');
  assert.doesNotMatch(combined, /\/Users\/|file:\/\//u);
  assert.doesNotMatch(
    combined,
    /cop(?:y|ied) (?:the )?(?:OpenSpec )?(?:tasks\.md|progress ledger)/iu,
  );
});
