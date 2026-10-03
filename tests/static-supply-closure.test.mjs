import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('raster rebuild selects the packaged source manifest', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const work = await fs.mkdtemp(path.join(base, 'resvg-manifest-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const archive = path.join(work, 'source.tar.xz');
  await fs.writeFile(archive, 'not the selected source closure');

  let shell = 'sh';
  if (process.platform === 'win32') {
    const git = spawnSync('git', ['--exec-path'], { encoding: 'utf8', timeout: 10_000 });
    assert.equal(git.status, 0, git.stderr);
    shell = path.resolve(git.stdout.trim(), '../../../usr/bin/sh.exe');
    assert.equal((await fs.stat(shell)).isFile(), true, 'Selected native Git shell is missing');
  }
  const result = spawnSync(
    shell,
    [path.join(root, 'tools/raster/resvg/build.sh'), archive, path.join(work, 'out')],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
      env:
        process.platform === 'win32'
          ? { ...process.env, PATH: path.dirname(shell) + path.delimiter + process.env.PATH }
          : process.env,
    },
  );

  assert.equal(result.status, 65, result.stdout + result.stderr);
  assert.equal(result.stderr, 'source closure digest mismatch\n');
});

test('raster renderer is bound to a reproducible source closure', async () => {
  const source = JSON.parse(
    await fs.readFile(
      path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/source.json'),
      'utf8',
    ),
  );
  assert.deepEqual(Object.keys(source), ['schema', 'source', 'toolchain', 'build', 'outputs']);
  assert.equal(source.schema, 'architecture.raster-source/v1');
  assert.equal(source.source.name, 'linebender/resvg');
  assert.equal(source.source.version, '0.48.1');
  assert.match(source.source.archiveSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(source.source.registry, {
    provider: 'gitlab',
    projectPath: 'dig/research/human-agent-stewardship/architecture-publisher',
    package: 'architecture-raster-resvg-source',
    version: `0.48.1-${source.source.archiveSha256.slice(0, 12)}`,
    file: 'source.tar.xz',
  });
  assert.equal(source.toolchain.rust, '1.98.1');
  assert.equal(source.toolchain.target, 'wasm32-unknown-unknown');
  assert.equal(source.toolchain.wasmBindgen, '0.2.128');
  assert.match(source.build.cargoLockSha256, /^[a-f0-9]{64}$/);
  assert.equal(source.build.network, 'offline');
  assert.equal(source.build.frozen, true);
  assert.equal(source.build.pathRemap, '/workspace');
  assert.deepEqual(
    source.build.inputs.map(({ path: selected }) => selected),
    [
      'tools/raster/resvg/Cargo.toml',
      'tools/raster/resvg/Cargo.lock',
      'tools/raster/resvg/rust-toolchain.toml',
      'tools/raster/resvg/.cargo/config.toml',
      'tools/raster/resvg/src/lib.rs',
      'tools/raster/resvg/build.sh',
    ],
  );
  for (const input of source.build.inputs) {
    const bytes = await fs.readFile(path.join(root, input.path));
    assert.equal(bytes.length, input.bytes);
    assert.equal(sha(bytes), input.sha256);
  }

  for (const output of source.outputs) {
    const bytes = await fs.readFile(path.join(root, output.path));
    assert.equal(bytes.length, output.bytes);
    assert.equal(sha(bytes), output.sha256);
  }
});

test('raster binding has no implicit file or network loader', async () => {
  const binding = await fs.readFile(
    path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/index.mjs'),
    'utf8',
  );
  for (const forbidden of ['fetch(', 'readFile', 'node:fs', 'require(', 'new URL('])
    assert.equal(binding.includes(forbidden), false, forbidden);
  assert.match(binding, /export class Renderer/);
  assert.match(binding, /export function __wbg_set_wasm/);

  const wasm = await fs.readFile(
    path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/index_bg.wasm'),
  );
  const imports = WebAssembly.Module.imports(new WebAssembly.Module(wasm));
  assert.deepEqual(
    imports.map(({ module, name, kind }) => ({ module, name, kind })),
    [
      {
        module: './index_bg.js',
        name: '__wbg___wbindgen_throw_5d9e815e6fdf150f',
        kind: 'function',
      },
      {
        module: './index_bg.js',
        name: '__wbg_Error_67e7344beaa85059',
        kind: 'function',
      },
      {
        module: './index_bg.js',
        name: '__wbindgen_init_externref_table',
        kind: 'function',
      },
    ],
  );
});

test('raster notices cover every locked third-party Rust package', async () => {
  const source = JSON.parse(
    await fs.readFile(
      path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/source.json'),
      'utf8',
    ),
  );
  const lock = await fs.readFile(path.join(root, 'tools/raster/resvg/Cargo.lock'), 'utf8');
  const notices = await fs.readFile(
    path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/THIRD-PARTY-NOTICES.txt'),
    'utf8',
  );
  const registry = source.source.registry;
  const location = `gitlab-generic://${registry.projectPath}/${registry.package}/${registry.version}/${registry.file}`;
  const fields = new Map(
    [
      ...notices.matchAll(/^(Source closure|Source archive SHA-256|Cargo\.lock SHA-256): (.+)$/gm),
    ].map(([, name, value]) => [name, value]),
  );
  assert.equal(fields.get('Source closure'), location);
  assert.equal(fields.get('Source archive SHA-256'), source.source.archiveSha256);
  assert.equal(fields.get('Cargo.lock SHA-256'), source.build.cargoLockSha256);
  assert.equal(source.build.cargoLockSha256, sha(lock));
  const packages = [...lock.matchAll(/\[\[package\]\]\nname = "([^"]+)"\nversion = "([^"]+)"/g)]
    .map(([, name, version]) => `${name} ${version}`)
    .filter((identity) => identity !== 'architecture-publisher-resvg-wasm 0.1.0');
  assert.equal(packages.length, 61);
  for (const identity of packages)
    assert.match(notices, new RegExp(`^- ${identity.replaceAll('.', '\\.')}:`, 'm'));
});
