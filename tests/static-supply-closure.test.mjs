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

  const result = spawnSync(
    process.execPath,
    [path.join(root, 'tools/raster/resvg/verify.mjs'), '--archive', archive],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
    },
  );

  assert.equal(result.error, undefined);
  assert.equal(result.status, 65, result.stdout + result.stderr);
  assert.equal(result.stderr, 'source closure digest mismatch\n');
});

test('raster registry retrieval derives its URL from the canonical source manifest', async () => {
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/source.json'),
      'utf8',
    ),
  );
  const invoke = (...args) =>
    spawnSync(
      process.execPath,
      [path.join(root, 'tools/raster/resvg/verify.mjs'), '--registry-url', ...args],
      {
        encoding: 'utf8',
        env: { ...process.env, CI_API_V4_URL: 'http://forge.invalid:18086/api/v4' },
      },
    );
  const registry = manifest.source.registry;
  const expected = `http://forge.invalid:18086/api/v4/projects/${encodeURIComponent(registry.projectPath)}/packages/generic/${encodeURIComponent(registry.package)}/${encodeURIComponent(registry.version)}/${encodeURIComponent(registry.file)}`;
  assert.equal(invoke().status, 0);
  assert.equal(invoke().stdout.trim(), expected);
  assert.equal(
    invoke('https://forge.invalid/api/v4/').stdout.trim(),
    expected.replace('http://forge.invalid:18086', 'https://forge.invalid'),
  );
  for (const invalid of [
    'file:///api/v4',
    'https://user:password@forge.invalid/api/v4',
    'https://forge.invalid/wrong',
    'https://forge.invalid/api/v4?token=invalid',
  ]) {
    const result = invoke(invalid);
    assert.equal(result.status, 65);
    assert.equal(result.stdout, '');
  }
});

test('raster verification checks selected native inputs and outputs without compiling', async (t) => {
  const work = await fs.mkdtemp(path.join(root, 'build/test-work/resvg-native-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const sourceRoot = path.join(work, 'source space Δ');
  const outputRoot = path.join(work, 'output space Δ');
  const source = JSON.parse(
    await fs.readFile(
      path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/source.json'),
      'utf8',
    ),
  );
  for (const input of source.build.inputs) {
    const relative = input.path.slice('tools/raster/resvg/'.length);
    const destination = path.join(sourceRoot, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(root, input.path), destination);
  }
  await fs.mkdir(outputRoot, { recursive: true });
  for (const output of source.outputs) {
    await fs.copyFile(path.join(root, output.path), path.join(outputRoot, output.nativeFile));
  }
  const invoke = (mode, directory, identity) => {
    const result = spawnSync(
      process.execPath,
      [
        path.join(root, 'tools/raster/resvg/verify.mjs'),
        mode,
        directory,
        ...(identity ? [identity] : []),
      ],
      {
        cwd: work,
        encoding: 'utf8',
        timeout: 30_000,
        env: { ...process.env, PATH: '' },
      },
    );
    assert.equal(result.error, undefined);
    return result;
  };
  assert.equal(invoke('--inputs', sourceRoot).status, 0);
  assert.equal(invoke('--outputs', outputRoot).status, 0);
  const tools = {
    rustc: {
      release: '1.98.1',
      commit: '48a229ceaefd4985c50990b14116b6d856af0985',
      host: 'aarch64-apple-darwin',
    },
    cargo: {
      release: '1.98.1',
      commit: '797e8a9bca276c1c9f9f738d2a20f484fa4eea9d',
      host: 'aarch64-apple-darwin',
    },
    wasmBindgen: '0.2.128',
  };
  const identity = path.join(work, 'tool identity.json');
  await fs.writeFile(identity, JSON.stringify(tools));
  const admitted = invoke('--outputs', outputRoot, identity);
  assert.equal(admitted.status, 0, admitted.stdout + admitted.stderr);
  for (const change of [
    (value) => (value.rustc.host = 'unknown-host'),
    (value) => (value.rustc.commit = '0'.repeat(40)),
    (value) => (value.cargo.commit = '0'.repeat(40)),
    (value) => (value.cargo.release = '0.0.0'),
    (value) => (value.wasmBindgen = '0.0.0'),
    (value) => (value.fallback = true),
  ]) {
    const unknown = structuredClone(tools);
    change(unknown);
    await fs.writeFile(identity, JSON.stringify(unknown));
    const result = invoke('--outputs', outputRoot, identity);
    assert.equal(result.status, 65, result.stdout + result.stderr);
    assert.equal(result.stderr, 'native tool identity not admitted\n');
  }
  assert.equal(invoke('--inputs', sourceRoot, identity).status, 64);
  assert.equal(invoke('--outputs', outputRoot).status, 0);
  await fs.appendFile(path.join(sourceRoot, 'Cargo.toml'), '\n# drift\n');
  assert.equal(invoke('--inputs', sourceRoot).status, 65);
  await fs.appendFile(path.join(outputRoot, 'index_bg.wasm'), 'drift');
  assert.equal(invoke('--outputs', outputRoot).status, 65);
  assert.equal(invoke('--invalid', sourceRoot).status, 64);
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
    ],
  );
  for (const input of source.build.inputs) {
    const bytes = await fs.readFile(path.join(root, input.path));
    assert.equal(bytes.length, input.bytes);
    assert.equal(sha(bytes), input.sha256);
  }

  for (const output of source.outputs) {
    assert.equal(path.basename(output.nativeFile), output.nativeFile);
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
