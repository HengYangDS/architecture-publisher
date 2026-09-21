import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { claimModelDigest } from '../packages/publisher/src/semantics/document.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { editionFixture } from './fixtures/edition.mjs';

const root = path.resolve(import.meta.dirname, '..');
const publisher = path.join(root, 'packages/publisher');
const sha = (v) => createHash('sha256').update(v).digest('hex');

test('bundled comparison example uses Claim Model and Edition selections', async () => {
  const directory = path.join(root, 'examples/semantic'),
    bytes = await fs.readFile(path.join(directory, 'compare.json')),
    plan = JSON.parse(bytes),
    result = spawnSync(
      process.execPath,
      [
        path.join(root, 'packages/publisher/src/cli/main.mjs'),
        'evolution',
        'plan',
        path.join(directory, 'compare.json'),
        '--sha256',
        sha(bytes),
      ],
      { cwd: root, encoding: 'utf8', timeout: 10000 },
    );
  assert.deepEqual(Object.keys(plan).sort(), ['after', 'before', 'correspondences', 'schema']);
  for (const side of ['before', 'after']) {
    assert.deepEqual(Object.keys(plan[side]).sort(), ['claimModel', 'editions']);
    assert.equal(plan[side].editions.length, 1);
    const sourceDirectory = path.join(directory, side),
      sourcePath = path.join(sourceDirectory, 'manifest.json'),
      sourceBytes = await fs.readFile(sourcePath),
      source = await readSourceBundle(sourcePath, sha(sourceBytes)),
      editionBytes = await fs.readFile(path.join(directory, plan[side].editions[0].path)),
      edition = JSON.parse(editionBytes);
    assert.equal(source.source.revision, side);
    assert.equal(edition.source.manifestSha256, sha(sourceBytes));
    assert.equal(source.members.length, 1);
    assert.equal(source.members[0].path, 'model.json');
    assert.equal(
      edition.claimModel.digest,
      claimModelDigest(
        JSON.parse(await fs.readFile(path.join(directory, plan[side].claimModel.path))),
      ),
    );
  }
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).editions.changed, ['request-service']);
});

async function setup(t) {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const dir = await fs.mkdtemp(path.join(parent, 'semantic cli '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const before = editionFixture(),
    after = editionFixture();
  after.model.entities.client.label = 'Changed client';
  after.edition.claimModel.digest = claimModelDigest(after.model);
  const plan = {
    schema: 'architecture.semantic-compare-input/v2',
    correspondences: [],
  };
  for (const [key, selected] of [
    ['before', before],
    ['after', after],
  ]) {
    const modelBytes = Buffer.from(JSON.stringify(selected.model)),
      editionBytes = Buffer.from(JSON.stringify(selected.edition));
    await fs.writeFile(path.join(dir, key + '-model.json'), modelBytes);
    await fs.writeFile(path.join(dir, key + '-edition.json'), editionBytes);
    plan[key] = {
      claimModel: {
        path: key + '-model.json',
        sha256: sha(modelBytes),
      },
      editions: [
        {
          path: key + '-edition.json',
          sha256: sha(editionBytes),
        },
      ],
    };
  }
  await fs.mkdir(path.join(dir, 'home'));
  async function run(options = {}) {
    const bytes = Buffer.from(JSON.stringify(options.plan ?? plan));
    await fs.writeFile(path.join(dir, 'plan.json'), bytes);
    const result = spawnSync(
      process.execPath,
      [
        options.cli ?? path.join(root, 'packages/publisher/src/cli/main.mjs'),
        'evolution',
        'plan',
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

test('public comparison binds Claim Model and Edition bytes without writing output', async (t) => {
  const f = await setup(t),
    result = await f.run();
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.value.schema, 'architecture.semantic-change/v2');
  assert.deepEqual(result.value.delta.changed.entities, ['client']);
  assert.deepEqual(result.value.editions.changed, ['example-system']);
  assert.equal(result.value.obligations.acceptance.length, 1);
  assert(!result.stdout.includes(f.dir));
  assert.deepEqual((await fs.readdir(f.dir)).sort(), [
    'after-edition.json',
    'after-model.json',
    'before-edition.json',
    'before-model.json',
    'home',
    'plan.json',
  ]);
  const wrongPlan = await f.run({ sha256: '0'.repeat(64) });
  assert.equal(wrongPlan.value.error.code, 'semantic_plan_digest_mismatch');
  await fs.appendFile(path.join(f.dir, 'after-model.json'), ' ');
  const wrongDoc = await f.run();
  assert.equal(wrongDoc.value.error.code, 'semantic_document_digest_mismatch');
});

test('comparison rejects symlink, directory, unknown plan fields and invalid document', async (t) => {
  const f = await setup(t);
  const unknown = await f.run({ plan: { ...f.plan, views: [] } });
  assert.equal(unknown.value.error.code, 'semantic_plan_invalid');
  await fs.symlink('before-model.json', path.join(f.dir, 'link.json'));
  const plan = structuredClone(f.plan);
  plan.before.claimModel.path = 'link.json';
  assert.equal((await f.run({ plan })).value.error.code, 'bundle_symlink_forbidden');
  plan.before.claimModel.path = 'home';
  assert.equal((await f.run({ plan })).value.error.code, 'bundle_type_unsupported');
  const invalid = Buffer.from('{"schema":"unsupported"}');
  await fs.writeFile(path.join(f.dir, 'before-model.json'), invalid);
  plan.before.claimModel = {
    path: 'before-model.json',
    sha256: sha(invalid),
  };
  assert.equal((await f.run({ plan })).value.error.code, 'semantic_document_invalid');
});

test('packed compiler relocates and runs offline without ETHOS-specific modules', async (t) => {
  const f = await setup(t),
    initial = await f.run();
  assert.equal(initial.status, 0, initial.stdout);
  const pack = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', f.dir],
    { cwd: publisher, encoding: 'utf8', timeout: 60000 },
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
  const relocated = path.join(f.dir, 'different location');
  await fs.rename(consumer, relocated);
  const cli = path.join(relocated, 'node_modules/architecture-publisher/src/cli/main.mjs');
  const actual = await f.run({ cli, cwd: relocated, file: '../plan.json' });
  assert.equal(actual.status, 0, actual.stdout);
  assert.deepEqual(actual.value, initial.value);
  await assert.rejects(fs.access(path.join(relocated, '.git')));
  await assert.rejects(fs.access(path.join(relocated, 'node_modules/acorn')));
});
