import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function setup(t) {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const dir = await fs.mkdtemp(path.join(parent, 'source pack '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.mkdir(path.join(dir, 'empty-home'));
  await fs.writeFile(path.join(dir, 'input.txt'), 'explicit selected bytes\n');
  const bytes = await fs.readFile(path.join(dir, 'input.txt'));
  const plan = {
    schema: 'architecture.pack-input/v1',
    source: { id: 'document:example', revision: 'draft-7' },
    files: [
      {
        input: './input.txt',
        path: 'nested/source.txt',
        bytes: bytes.length,
        sha256: sha(bytes),
      },
    ],
    output: './new-bundle',
  };
  const file = path.join(dir, 'pack.json');
  async function invoke(selected = plan, options = {}) {
    const raw = Buffer.from(JSON.stringify(selected));
    await fs.writeFile(file, raw);
    const r = spawnSync(
      process.execPath,
      [
        path.join(root, 'packages/publisher/src/cli/main.mjs'),
        'source',
        'pack',
        options.planFile ?? file,
        '--sha256',
        options.digest ?? sha(raw),
      ],
      {
        cwd: path.join(dir, 'empty-home'),
        env: { HOME: path.join(dir, 'empty-home'), PATH: '' },
        encoding: 'utf8',
        timeout: 10000,
      },
    );
    assert.equal(r.error, undefined);
    return { status: r.status, value: JSON.parse(r.stdout) };
  }
  return { dir, file, plan, invoke, output: path.join(dir, 'new-bundle') };
}

test('public source pack writes selected files with portable paths and no approval claim', async (t) => {
  const f = await setup(t);
  const r = await f.invoke();
  assert.equal(r.status, 0, JSON.stringify(r.value));
  assert.equal(r.value.status, 'packed');
  assert.equal(r.value.semanticAcceptance, 'not-performed');
  assert.equal(r.value.scope, 'selected-file-packaging');
  assert.equal(r.value.memberCount, 1);
  const raw = await fs.readFile(path.join(f.output, 'manifest.json'));
  assert.equal(r.value.manifestSha256, sha(raw));
  const manifest = JSON.parse(raw);
  assert.deepEqual(manifest.source, f.plan.source);
  assert.deepEqual(
    manifest.files,
    f.plan.files.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })),
  );
  assert(!raw.toString().includes(f.dir));
  assert.deepEqual(
    await fs.readFile(path.join(f.output, 'nested/source.txt')),
    await fs.readFile(path.join(f.dir, 'input.txt')),
  );
  const occupied = await f.invoke();
  assert.equal(occupied.status, 1);
  assert.equal(occupied.value.error.code, 'output_exists');
  assert.deepEqual(await fs.readFile(path.join(f.output, 'manifest.json')), raw);
});

const invalid = [
  ['wrong plan digest', () => {}, { digest: '0'.repeat(64) }, 'pack_plan_digest_mismatch'],
  [
    'wrong member digest',
    (p) => {
      p.files[0].sha256 = '0'.repeat(64);
    },
    {},
    'member_digest_mismatch',
  ],
  [
    'wrong member size',
    (p) => {
      p.files[0].bytes++;
    },
    {},
    'member_size_mismatch',
  ],
  [
    'escaping member path',
    (p) => {
      p.files[0].path = '../escape';
    },
    {},
    'member_path_invalid',
  ],
  [
    'duplicate member path',
    (p) => {
      p.files.push({ ...p.files[0] });
    },
    {},
    'member_path_duplicate',
  ],
  [
    'reserved output manifest',
    (p) => {
      p.files[0].path = 'manifest.json';
    },
    {},
    'manifest_self_member',
  ],
  [
    'missing input',
    (p) => {
      p.files[0].input = './absent';
    },
    {},
    'ENOENT',
  ],
  [
    'unknown plan field',
    (p) => {
      p.execute = 'code';
    },
    {},
    'pack_plan_invalid',
  ],
  [
    'unknown member field',
    (p) => {
      p.files[0].execute = true;
    },
    {},
    'pack_plan_invalid',
  ],
  [
    'invalid source',
    (p) => {
      p.source.id = '';
    },
    {},
    'source_invalid',
  ],
  [
    'oversized declared member',
    (p) => {
      p.files[0].bytes = 33 * 1024 * 1024;
    },
    {},
    'member_size_invalid',
  ],
  [
    'oversized total payload',
    (p) => {
      p.files = Array.from({ length: 5 }, (_, i) => ({
        ...p.files[0],
        path: `${i}.txt`,
        bytes: 32 * 1024 * 1024,
      }));
    },
    {},
    'bundle_size_exceeded',
  ],
  [
    'non-regular input',
    (p) => {
      p.files[0].input = './empty-home';
    },
    {},
    'bundle_type_unsupported',
  ],
  [
    'reserved manifest directory',
    (p) => {
      p.files[0].path = 'MANIFEST.json/hidden';
    },
    {},
    'manifest_self_member',
  ],
];

for (const [label, mutate, options, code] of invalid) {
  test(`public source pack rejects ${label} without final output`, async (t) => {
    const f = await setup(t);
    mutate(f.plan);
    const r = await f.invoke(f.plan, options);
    assert.equal(r.status, 1, JSON.stringify(r.value));
    assert.equal(r.value.error.code, code);
    await assert.rejects(fs.stat(f.output), { code: 'ENOENT' });
  });
}

test('public source pack bounds the plan before parsing it', async (t) => {
  const f = await setup(t);
  const plan = { ...f.plan, source: { id: 'x'.repeat(1024 * 1024) } };
  const r = await f.invoke(plan);
  assert.equal(r.status, 1);
  assert.equal(r.value.error.code, 'file_size_exceeded');
  await assert.rejects(fs.stat(f.output), { code: 'ENOENT' });
});

test('public source pack preserves an existing output file and rejects output parent links', async (t) => {
  const f = await setup(t);
  await fs.writeFile(f.output, 'owned prior content');
  assert.equal((await f.invoke()).value.error.code, 'output_exists');
  assert.equal(await fs.readFile(f.output, 'utf8'), 'owned prior content');
  await fs.symlink(f.dir, path.join(f.dir, 'linked-output-parent'));
  f.plan.output = './linked-output-parent/new-output';
  assert.equal((await f.invoke()).value.error.code, 'output_parent_invalid');
  await assert.rejects(fs.stat(path.join(f.dir, 'new-output')), {
    code: 'ENOENT',
  });
});

for (const kind of ['input', 'parent', 'plan']) {
  test(`public source pack rejects a symlinked ${kind}`, async (t) => {
    const f = await setup(t);
    const options = {};
    if (kind === 'input') {
      await fs.symlink('input.txt', path.join(f.dir, 'linked'));
      f.plan.files[0].input = './linked';
    } else if (kind === 'parent') {
      await fs.symlink(f.dir, path.join(f.dir, 'linked'));
      f.plan.files[0].input = './linked/input.txt';
    } else {
      await fs.symlink('pack.json', path.join(f.dir, 'linked'));
      options.planFile = path.join(f.dir, 'linked');
    }
    const r = await f.invoke(f.plan, options);
    assert.equal(r.status, 1, JSON.stringify(r.value));
    assert.equal(r.value.error.code, 'bundle_symlink_forbidden');
    await assert.rejects(fs.stat(f.output), { code: 'ENOENT' });
  });
}
