import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('packed CLI verifies relocated non-Git input without development executables', async (t) => {
  const work = path.join(root, 'build/test-work');
  await fs.mkdir(work, { recursive: true });
  const tmp = await fs.mkdtemp(path.join(work, 'installed with spaces-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const env = {
    ...process.env,
    npm_config_update_notifier: 'false',
    npm_config_audit: 'false',
  };
  const pack = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', tmp],
    { cwd: publisher, env, encoding: 'utf8' },
  );
  assert.equal(pack.status, 0, pack.stderr);
  const info = JSON.parse(pack.stdout)[0];
  assert(info.files.some((f) => f.path === 'src/cli/main.mjs'));
  assert(
    info.files.every(
      (f) =>
        f.path === 'README.md' ||
        f.path === 'package.json' ||
        f.path.startsWith('src/') ||
        f.path.startsWith('assets/') ||
        f.path.startsWith('renderers/'),
    ),
  );
  const install = path.join(tmp, 'consumer');
  await fs.mkdir(install);
  const installed = spawnSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--offline',
      '--prefix',
      install,
      path.join(tmp, info.filename),
    ],
    { cwd: install, env, encoding: 'utf8' },
  );
  assert.equal(installed.status, 0, installed.stderr);
  const pkg = path.join(install, 'node_modules/architecture-publisher');
  const packageJson = JSON.parse(
    await fs.readFile(path.join(pkg, 'package.json'), 'utf8'),
  );
  assert.deepEqual(packageJson.dependencies ?? {}, {});
  await assert.rejects(fs.stat(path.join(install, 'node_modules/acorn')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(pkg, 'node_modules')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(install, '.git')), {
    code: 'ENOENT',
  });
  const input = path.join(tmp, 'relocated input');
  await fs.mkdir(input);
  const data = Buffer.from(
    'all services may retry only on a transient failure\n',
  );
  await fs.writeFile(path.join(input, 'source.txt'), data);
  const manifest = Buffer.from(
    JSON.stringify({
      schema: 'architecture.source-bundle/v1',
      source: { id: 'service:test', revision: 'r2' },
      files: [{ path: 'source.txt', bytes: data.length, sha256: sha(data) }],
    }),
  );
  await fs.writeFile(path.join(input, 'manifest.json'), manifest);
  const home = path.join(tmp, 'empty-home');
  await fs.mkdir(home);
  const run = (args) =>
    spawnSync(
      process.execPath,
      [path.join(pkg, 'src/cli/main.mjs'), ...args],
      {
        cwd: install,
        env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
        encoding: 'utf8',
      },
    );
  const args = [
    'source',
    'verify',
    path.relative(install, path.join(input, 'manifest.json')),
    '--sha256',
    sha(manifest),
  ];
  const ok = run(args);
  assert.equal(ok.status, 0, ok.stderr);
  const result = JSON.parse(ok.stdout);
  assert.equal(result.status, 'verified');
  assert.equal(result.source.revision, 'r2');
  assert.equal(result.members[0].sha256, sha(data));
  assert(!ok.stdout.includes(tmp));
  assert.equal(result.officialReplay, 'not-performed');

  const qualification = {
    schema: 'architecture.qualification-set/v1',
    candidateSha256: sha(Buffer.from('candidate')),
    editionSha256: sha(Buffer.from('edition')),
    sourceSha256: sha(Buffer.from('source')),
    semanticSha256: sha(Buffer.from('semantic')),
    records: [
      {
        id: 'semantic.integrity',
        subject: {
          kind: 'edition-candidate',
          sha256: sha(Buffer.from('candidate')),
        },
        editionSha256: sha(Buffer.from('edition')),
        sourceSha256: sha(Buffer.from('source')),
        semanticSha256: sha(Buffer.from('semantic')),
        verifier: {
          id: 'installed-test',
          implementationSha256: sha(Buffer.from('installed-test')),
        },
        predicate: 'semantic-integrity',
        scope: { kind: 'document', value: 'candidate.json' },
        environment: null,
        observations: [{ name: 'result', value: 'valid' }],
        verdict: 'PASS',
        limitations: [],
      },
    ],
  };
  const qualificationBytes = Buffer.from(
    JSON.stringify(qualification, null, 2) + '\n',
  );
  const qualificationPath = path.join(tmp, 'qualification.json');
  await fs.writeFile(qualificationPath, qualificationBytes);
  const qualified = run([
    'qualify',
    'verify',
    qualificationPath,
    '--sha256',
    sha(qualificationBytes),
  ]);
  assert.equal(qualified.status, 0, qualified.stdout + qualified.stderr);
  assert.deepEqual(
    {
      status: JSON.parse(qualified.stdout).status,
      verdict: JSON.parse(qualified.stdout).verdict,
      authorization: JSON.parse(qualified.stdout).authorization,
      publication: JSON.parse(qualified.stdout).publication,
    },
    {
      status: 'verified',
      verdict: 'PASS',
      authorization: 'not-performed',
      publication: 'not-performed',
    },
  );

  await fs.writeFile(path.join(input, 'extra.txt'), 'undeclared');
  const bad = run(args);
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).error.code, 'bundle_members_mismatch');
  const usage = run(['source', 'verify']);
  assert.equal(usage.status, 2);
  assert.equal(JSON.parse(usage.stdout).error.code, 'usage');
});
