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

test('current product surfaces expose one Architecture Publisher identity', async () => {
  const workspace = JSON.parse(
    await fs.readFile(path.join(root, 'package.json'), 'utf8'),
  );
  const packageJson = JSON.parse(
    await fs.readFile(path.join(root, 'packages/publisher/package.json'), 'utf8'),
  );
  const packageLock = JSON.parse(
    await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'),
  );
  const profile = await fs.readFile(path.join(root, '.ethos/profile.toml'), 'utf8');
  const openspec = await fs.readFile(path.join(root, 'openspec/config.yaml'), 'utf8');
  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  const skill = await fs.readFile(
    path.join(root, 'skills/architecture-publisher/SKILL.md'),
    'utf8',
  );
  const cli = await fs.readFile(path.join(root, 'packages/publisher/src/cli/main.mjs'), 'utf8');
  const commonDirectory = runGit('rev-parse', '--path-format=absolute', '--git-common-dir');
  const repositoryName = path.basename(path.dirname(commonDirectory));

  assert.equal(packageJson.name, 'architecture-publisher');
  assert.equal(packageJson.version, '0.2.0-alpha.0');
  assert.deepEqual(packageJson.bin, { archpub: 'src/cli/main.mjs' });
  assert.equal(workspace.name, 'architecture-publisher-workspace');
  assert.equal(workspace.private, true);
  assert.equal(packageLock.name, workspace.name);
  assert.equal(packageLock.version, workspace.version);
  assert.deepEqual(packageLock.packages['packages/publisher'].bin, packageJson.bin);
  assert.match(profile, new RegExp(`^profile_id = "${repositoryName}"$`, 'm'));
  assert.match(openspec, /Govern Architecture Publisher changes through ETHOS\./);
  assert.match(readme, /^# Architecture Publisher$/m);
  assert.match(readme, /\barchpub source verify\b/);
  assert.doesNotMatch(readme, /^architecture (?:source|publish|render|atlas|poster|measure|semantic|raster)\b/m);
  assert.match(skill, /^name: architecture-publisher$/m);
  assert.match(skill, /\barchpub edition build\b/);
  assert.doesNotMatch(skill, /\barchitecture publish\b/);
  assert.match(cli, /runCli/);
  assert.doesNotMatch(cli, /\b(?:ethos|aigw|archify|resvg|coretext)\b/i);
});

test('installed package exposes archpub and no architecture compatibility command', async (t) => {
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const out = await fs.mkdtemp(path.join(scratch, 'identity-'));
  t.after(() => fs.rm(out, { recursive: true, force: true }));
  const packed = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', out],
    { cwd: path.join(root, 'packages/publisher'), encoding: 'utf8' },
  );
  assert.equal(packed.status, 0, packed.stderr);
  const info = JSON.parse(packed.stdout)[0];
  const consumer = path.join(out, 'consumer');
  await fs.mkdir(consumer);
  const installed = spawnSync(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(out, info.filename),
    ],
    { cwd: consumer, encoding: 'utf8' },
  );
  assert.equal(installed.status, 0, installed.stderr);
  const bin = path.join(consumer, 'node_modules/.bin');
  assert.equal((await fs.lstat(path.join(bin, 'archpub'))).isSymbolicLink(), true);
  await assert.rejects(fs.lstat(path.join(bin, 'architecture')), { code: 'ENOENT' });
  const usage = spawnSync(path.join(bin, 'archpub'), [], {
    cwd: consumer,
    encoding: 'utf8',
  });
  assert.equal(usage.status, 0);
  assert.match(usage.stdout, /^Architecture Publisher$/m);
});

test('product documentation has one semantic owner and a concise entry point', async () => {
  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  const product = await fs.readFile(path.join(root, 'docs/product-contract.md'), 'utf8');
  const edition = await fs.readFile(path.join(root, 'docs/edition-contract.md'), 'utf8');
  const operations = await fs.readFile(path.join(root, 'docs/reference/operations.md'), 'utf8');
  const skill = await fs.readFile(
    path.join(root, 'skills/architecture-publisher/SKILL.md'),
    'utf8',
  );
  const packageJson = JSON.parse(
    await fs.readFile(path.join(root, 'packages/publisher/package.json'), 'utf8'),
  );

  assert(readme.split('\n').length <= 260, 'README is an entry point, not an operations archive');
  assert.match(readme, /\[Product contract\]\(docs\/product-contract\.md\)/);
  assert.match(readme, /\[Edition contract\]\(docs\/edition-contract\.md\)/);
  assert.match(readme, /\[Operational reference\]\(docs\/reference\/operations\.md\)/);
  assert.match(product, /^subject: architecture-publisher:product-contract$/m);
  assert.match(product, /^state: canonical$/m);
  assert.match(product, /Source Bundle[\s\S]*Claim Model[\s\S]*Edition[\s\S]*Scene[\s\S]*Artifact[\s\S]*Qualification[\s\S]*Publication/);
  assert.match(edition, /audience[\s\S]*questions[\s\S]*required claims[\s\S]*omission policy[\s\S]*static scene[\s\S]*interactive scenes/i);
  assert.match(operations, /architecture\.edition\/v1/);
  assert.match(operations, /editionSha256/);
  assert.doesNotMatch(operations, /architecture\.semantic-publication\/v2/);
  assert.match(skill, /Edition file/);
  assert.doesNotMatch(skill, /semantic member, authoring file/);
  assert.match(operations, /Historical alpha\.7 identity/i);
  assert(packageJson.files.includes('README.md'));
  assert(!packageJson.files.includes('docs/product-design.md'));
  await assert.rejects(fs.stat(path.join(root, 'docs/product-design.md')), { code: 'ENOENT' });
});

test('terminal topology keeps live Editions with their source products', async () => {
  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  const product = await fs.readFile(
    path.join(root, 'docs/product-contract.md'),
    'utf8',
  );
  const edition = await fs.readFile(
    path.join(root, 'docs/edition-contract.md'),
    'utf8',
  );
  const proposal = await fs.readFile(
    path.join(
      root,
      'openspec/changes/architecture-publisher-0-2/proposal.md',
    ),
    'utf8',
  );
  const design = await fs.readFile(
    path.join(root, 'openspec/changes/architecture-publisher-0-2/design.md'),
    'utf8',
  );
  const tasks = await fs.readFile(
    path.join(root, 'openspec/changes/architecture-publisher-0-2/tasks.md'),
    'utf8',
  );
  const contract = [readme, product, edition, proposal, design].join('\n');

  assert.match(contract, /source-owned live Edition/i);
  assert.match(
    contract,
    /portable standard values or an independently\s+installed package/i,
  );
  assert.match(contract, /no adjacent checkout/i);
  assert.match(contract, /migration staging/i);
  assert.match(tasks, /remove the migrated central ETHOS package/i);
  assert.match(tasks, /remove the migrated central AIGW package or example/i);
  assert.match(tasks, /same immutable candidate digests/i);
});
