import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const preload = new URL('./fixtures/npm-environment.mjs', import.meta.url).href;

test('installed-test npm calls cannot inherit host allowlists or registry config', () => {
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith('npm_config_')),
  );
  environment.npm_config_allow_scripts = 'host-only-package';
  environment.npm_config_registry = 'https://blocked.invalid/';
  const script = `
    import { execNativeSync } from ${JSON.stringify(new URL('./fixtures/npm-pack-report.mjs', import.meta.url).href)};
    const config = (name) => execNativeSync('npm', ['config', 'get', name], {
      env: process.env, encoding: 'utf8', timeout: 3000, input: ''
    }).trim();
    process.stdout.write(JSON.stringify({
      allowScripts: config('allow-scripts'),
      registry: config('registry'),
      user: config('userconfig'),
      global: config('globalconfig')
    }));
  `;
  const child = spawnSync(
    process.execPath,
    [`--import=${preload}`, '--input-type=module', '--eval', script],
    { cwd: root, env: environment, encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024 },
  );
  assert.equal(child.status, 0, child.stderr);
  const result = JSON.parse(child.stdout);
  assert.equal(result.allowScripts, '');
  assert.notEqual(result.registry, 'https://blocked.invalid/');
  assert.equal(result.user, path.join(root, 'tests/fixtures/npm-user.npmrc'));
  assert.equal(result.global, path.join(root, 'tests/fixtures/npm-global.npmrc'));
});

test('ephemeral offline installation preserves consumer metadata without lock writes', async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-npm-'));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const supply = path.join(scratch, 'supply'),
    consumer = path.join(scratch, 'consumer');
  await fs.mkdir(supply);
  await fs.mkdir(consumer);
  await fs.writeFile(
    path.join(supply, 'package.json'),
    '{"name":"ephemeral-supply","version":"1.0.0","files":["index.mjs"]}\n',
  );
  await fs.writeFile(path.join(supply, 'index.mjs'), 'export const selected = true;\n');
  const metadata = '{"private":true,"name":"independent-consumer","version":"1.0.0"}\n';
  await fs.writeFile(path.join(consumer, 'package.json'), metadata);
  const script = `
    import { spawnNativeSync, parseNpmPackRecord } from ${JSON.stringify(new URL('./fixtures/npm-pack-report.mjs', import.meta.url).href)};
    import assert from 'node:assert/strict';
    import path from 'node:path';
    const options = { cwd: ${JSON.stringify(supply)}, env: process.env, encoding: 'utf8', timeout: 20_000 };
    const packed = spawnNativeSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', ${JSON.stringify(scratch)}], options);
    assert.equal(packed.status, 0, packed.stderr);
    const archive = path.join(${JSON.stringify(scratch)}, parseNpmPackRecord(packed.stdout).filename);
    const installed = spawnNativeSync('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', '--package-lock=false', archive], { ...options, cwd: ${JSON.stringify(consumer)} });
    assert.equal(installed.status, 0, installed.stderr);
  `;
  const child = spawnSync(
    process.execPath,
    [`--import=${preload}`, '--input-type=module', '--eval', script],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 45_000,
      env: {
        ...process.env,
        npm_config_cache: path.join(scratch, 'cache'),
        npm_config_save: 'true',
        npm_config_package_lock: 'true',
      },
    },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.equal(await fs.readFile(path.join(consumer, 'package.json'), 'utf8'), metadata);
  await assert.rejects(fs.access(path.join(consumer, 'package-lock.json')), { code: 'ENOENT' });
  assert.equal(
    await fs.readFile(path.join(consumer, 'node_modules/ephemeral-supply/index.mjs'), 'utf8'),
    'export const selected = true;\n',
  );
});
