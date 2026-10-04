import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '../../../..');
const verifier = path.join(root, 'tools/raster/resvg/verify.mjs');

test('native Cargo and wasm-bindgen rebuild the exact raster closure', async (t) => {
  const archive = process.env.ARCHPUB_RESVG_SOURCE_ARCHIVE;
  const bindgen = process.env.ARCHPUB_RESVG_BINDGEN;
  assert(archive && path.isAbsolute(archive), 'select an absolute frozen source archive');
  assert(bindgen && path.isAbsolute(bindgen), 'select an absolute matching wasm-bindgen');
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/source.json'),
    ),
  );
  const work = await fs.mkdtemp(path.join(root, 'build/test-work/raster source Δ '));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const invoke = (command, args, cwd = work, env = process.env) => {
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: 'utf8',
      timeout: 300_000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    });
    assert.equal(result.error, undefined, `${command}: ${result.error}`);
    assert.equal(result.status, 0, `${command}: ${result.stdout}${result.stderr}`);
    return result.stdout.trim();
  };
  const selectedEnv = {
    ...process.env,
    RUSTUP_TOOLCHAIN: manifest.toolchain.rust,
    CARGO_NET_OFFLINE: 'true',
  };
  assert.match(invoke('cargo', ['--version'], work, selectedEnv), /^cargo 1\.98\.1\b/u);
  assert.equal(invoke(bindgen, ['--version']), `wasm-bindgen ${manifest.toolchain.wasmBindgen}`);
  invoke(process.execPath, [verifier, '--archive', archive]);
  invoke('tar', ['-xf', archive, '-C', work]);
  const source = path.join(work, `architecture-publisher-resvg-wasm-${manifest.source.version}`);
  invoke(process.execPath, [verifier, '--inputs', source]);
  invoke(
    'cargo',
    ['build', '--release', '--target', manifest.toolchain.target, '--offline', '--frozen'],
    source,
    {
      ...selectedEnv,
      CARGO_ENCODED_RUSTFLAGS: `--remap-path-prefix=${source}=${manifest.build.pathRemap}`,
    },
  );
  const output = path.join(source, 'native output Δ');
  invoke(bindgen, [
    path.join(
      source,
      'target',
      manifest.toolchain.target,
      'release/architecture_publisher_resvg_wasm.wasm',
    ),
    '--target',
    'bundler',
    '--out-dir',
    output,
    '--out-name',
    'index',
    '--no-typescript',
    '--omit-default-module-path',
  ]);
  invoke(process.execPath, [verifier, '--inputs', source]);
  const outputDigests = invoke(process.execPath, [verifier, '--outputs', output]);
  const binding = path.join(output, 'index.mjs');
  await fs.copyFile(path.join(output, 'index_bg.js'), binding);
  const resvg = await import(pathToFileURL(binding).href);
  const wasm = await fs.readFile(path.join(output, 'index_bg.wasm'));
  const instance = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
    './index_bg.js': resvg,
  });
  resvg.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  const renderer = new resvg.Renderer();
  try {
    const png = Buffer.from(
      renderer.render(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24"><rect width="32" height="24" fill="#678"/></svg>',
        ),
        32,
      ),
    );
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 32);
    assert.equal(png.readUInt32BE(20), 24);
  } finally {
    renderer.free();
  }
  t.diagnostic(
    JSON.stringify({
      platform: process.platform,
      arch: process.arch,
      sourceArchiveSha256: manifest.source.archiveSha256,
      outputDigests,
    }),
  );
});
