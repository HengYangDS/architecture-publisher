import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
