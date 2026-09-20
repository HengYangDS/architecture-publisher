import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  semanticDocument,
  semanticViews,
} from './fixtures/semantic-document.mjs';

const root = path.resolve(import.meta.dirname, '..');
const sha = (v) => createHash('sha256').update(v).digest('hex');

async function setup(t) {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const dir = await fs.mkdtemp(path.join(parent, 'semantic cli '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const a = semanticDocument(),
    b = structuredClone(a);
  b.entities.client.label = 'Changed client';
  const plan = {
    schema: 'architecture.semantic-compare-input/v1',
    views: semanticViews(),
    correspondences: [],
  };
  for (const [key, doc] of [
    ['before', a],
    ['after', b],
  ]) {
    const bytes = Buffer.from(JSON.stringify(doc));
    await fs.writeFile(path.join(dir, key + '.json'), bytes);
    plan[key] = { path: key + '.json', sha256: sha(bytes) };
  }
  await fs.mkdir(path.join(dir, 'home'));
  async function run(options = {}) {
    const bytes = Buffer.from(JSON.stringify(options.plan ?? plan));
    await fs.writeFile(path.join(dir, 'plan.json'), bytes);
    const result = spawnSync(
      process.execPath,
      [
        options.cli ?? path.join(root, 'src/cli/main.mjs'),
        'semantic',
        'compare',
        options.file ?? path.join(dir, 'plan.json'),
        '--sha256',
        options.sha256 ?? sha(bytes),
      ],
      {
        cwd: options.cwd ?? dir,
        env: { HOME: path.join(dir, 'home'), PATH: '', LANG: 'C.UTF-8' },
        encoding: 'utf8',
        timeout: 10000,
      },
    );
    assert.equal(result.error, undefined);
    return {
      status: result.status,
      value: JSON.parse(result.stdout),
      stdout: result.stdout,
    };
  }
  return { dir, plan, run };
}

test('public comparison binds plan and document bytes without writing output', async (t) => {
  const f = await setup(t),
    result = await f.run();
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.value.schema, 'architecture.semantic-change/v1');
  assert.deepEqual(result.value.changed.entities, ['client']);
  assert.equal(result.value.acceptance, 'not-performed');
  assert(!result.stdout.includes(f.dir));
  assert.deepEqual((await fs.readdir(f.dir)).sort(), [
    'after.json',
    'before.json',
    'home',
    'plan.json',
  ]);
  const wrongPlan = await f.run({ sha256: '0'.repeat(64) });
  assert.equal(wrongPlan.value.error.code, 'semantic_plan_digest_mismatch');
  await fs.appendFile(path.join(f.dir, 'after.json'), ' ');
  const wrongDoc = await f.run();
  assert.equal(
    wrongDoc.value.error.code,
    'semantic_document_digest_mismatch',
  );
});

test('comparison rejects symlink, directory, unknown plan fields and invalid document', async (t) => {
  const f = await setup(t);
  const unknown = await f.run({ plan: { ...f.plan, approval: true } });
  assert.equal(unknown.value.error.code, 'semantic_plan_invalid');
  await fs.symlink('before.json', path.join(f.dir, 'link.json'));
  const plan = { ...f.plan, before: { ...f.plan.before, path: 'link.json' } };
  assert.equal(
    (await f.run({ plan })).value.error.code,
    'bundle_symlink_forbidden',
  );
  plan.before.path = 'home';
  assert.equal(
    (await f.run({ plan })).value.error.code,
    'bundle_type_unsupported',
  );
  const invalid = Buffer.from('{"schema":"unsupported"}');
  await fs.writeFile(path.join(f.dir, 'before.json'), invalid);
  plan.before = { path: 'before.json', sha256: sha(invalid) };
  assert.equal(
    (await f.run({ plan })).value.error.code,
    'semantic_document_invalid',
  );
});

test('packed compiler relocates and runs offline without ETHOS or edition modules', async (t) => {
  const f = await setup(t),
    initial = await f.run();
  assert.equal(initial.status, 0, initial.stdout);
  const pack = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', f.dir],
    { cwd: root, encoding: 'utf8', timeout: 60000 },
  );
  assert.equal(pack.status, 0, pack.stderr);
  const info = JSON.parse(pack.stdout)[0],
    consumer = path.join(f.dir, 'consumer');
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
      path.join(f.dir, info.filename),
    ],
    { cwd: consumer, encoding: 'utf8', timeout: 60000 },
  );
  assert.equal(install.status, 0, install.stderr);
  const pkg = path.join(consumer, 'node_modules/architecture-publisher');
  await fs.rm(path.join(pkg, 'editions'), { recursive: true });
  await fs.rm(path.join(pkg, 'src/integrations'), { recursive: true });
  const relocated = path.join(f.dir, 'different location');
  await fs.rename(consumer, relocated);
  const cli = path.join(
    relocated,
    'node_modules/architecture-publisher/src/cli/main.mjs',
  );
  const actual = await f.run({ cli, cwd: relocated, file: '../plan.json' });
  assert.equal(actual.status, 0, actual.stdout);
  assert.deepEqual(actual.value, initial.value);
  await assert.rejects(fs.access(path.join(relocated, '.git')));
  await assert.rejects(fs.access(path.join(relocated, 'node_modules/acorn')));
});
