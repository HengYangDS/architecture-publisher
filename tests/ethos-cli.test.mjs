import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeSourceBundle } from '../src/source/write.mjs';
import { fixture } from './fixtures/ethos-source.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
test('packed offline ETHOS command reads selected source without Git or Python', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const out = await fs.mkdtemp(path.join(base, 'ethos cli-'));
  t.after(() => fs.rm(out, { recursive: true, force: true }));
  const r = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', out],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  const pack = JSON.parse(r.stdout)[0];
  const consumer = path.join(out, 'consumer');
  await fs.mkdir(consumer);
  const install = spawnSync(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(out, pack.filename),
    ],
    { cwd: consumer, encoding: 'utf8' },
  );
  assert.equal(install.status, 0, install.stderr);
  const f = fixture(),
    bundle = await writeSourceBundle(
      path.join(out, 'bundle'),
      f.source,
      f.members,
    ),
    home = path.join(out, 'home');
  await fs.mkdir(home);
  const cli = path.join(
    consumer,
    'node_modules/architecture-publisher/src/cli/main.mjs',
  );
  const args = [
    'source',
    'ethos',
    'verify',
    bundle.manifestPath,
    '--sha256',
    bundle.manifestSha256,
    '--projection',
    f.input.digest,
  ];
  const run = (a) =>
    spawnSync(process.execPath, [cli, ...a], {
      cwd: consumer,
      env: { HOME: home, PATH: home },
      encoding: 'utf8',
    });
  const read = run(args);
  assert.equal(read.status, 0, read.stdout + read.stderr);
  const result = JSON.parse(read.stdout);
  assert.equal(result.projectionDigest, f.input.digest);
  assert.equal(result.officialReplay, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
  assert(!read.stdout.includes(out));
  assert.equal(result.source.revision, f.input.source.revision);
  const wrong = run([...args.slice(0, -1), '0'.repeat(64)]);
  assert.equal(wrong.status, 1);
  assert.equal(
    JSON.parse(wrong.stdout).error.code,
    'projection_digest_mismatch',
  );
  const noPlan = run(['source', 'ethos', 'import']);
  assert.equal(noPlan.status, 2);
});
