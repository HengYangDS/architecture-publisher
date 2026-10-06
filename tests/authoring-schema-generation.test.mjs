import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import * as edition from '../packages/publisher/src/edition/index.mjs';
import * as generated from '../packages/publisher/src/edition/generated/validators.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('shipped authoring validators are reproducible from their exact public schemas', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'tools/generate-authoring-validators.mjs'), '--check'],
    { cwd: root, encoding: 'utf8', timeout: 30_000 },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('generated validator supply carries the generator license', async () => {
  const supplied = await fs.readFile(
    path.join(root, 'packages/publisher/src/edition/generated/LICENSE.schemasafe'),
  );
  const upstream = await fs.readFile(path.join(root, 'node_modules/@exodus/schemasafe/LICENSE'));
  assert.deepEqual(supplied, upstream);
});

test('native Git checkout preserves generated and supplier bytes under automatic CRLF', async (t) => {
  const checkout = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-checkout-bytes-'),
  );
  t.after(() => fs.rm(checkout, { recursive: true, force: true }));
  const globalConfig = path.join(checkout, 'empty-global-config');
  await fs.writeFile(globalConfig, '');
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: checkout,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20_000,
      killSignal: 'SIGKILL',
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: globalConfig },
    });
  const selected = [
    'tools/generate-authoring-validators.mjs',
    'packages/publisher/src/edition/generated/validators.mjs',
    'packages/publisher/src/edition/generated/LICENSE.schemasafe',
    'packages/publisher/supplies/likec4/THIRD-PARTY-NOTICES.txt',
    'packages/publisher/renderers/interactive/supply/LICENSE',
    'packages/publisher/renderers/fonts/supply/JetBrainsMono-Regular.ttf',
  ];
  const originals = new Map();
  for (const relative of ['.gitattributes', ...selected]) {
    const bytes = await fs.readFile(path.join(root, relative));
    originals.set(relative, bytes);
    await fs.mkdir(path.dirname(path.join(checkout, relative)), { recursive: true });
    await fs.writeFile(path.join(checkout, relative), bytes);
  }
  git('init', '--quiet');
  git('config', 'core.autocrlf', 'false');
  git('add', '--', '.gitattributes', ...selected);
  git('config', 'core.autocrlf', 'true');
  for (const relative of selected) await fs.rm(path.join(checkout, relative));
  git('checkout-index', '--all', '--force');
  for (const relative of selected)
    assert.deepEqual(
      await fs.readFile(path.join(checkout, relative)),
      originals.get(relative),
      relative,
    );
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-windows'];
  const cache = 'build/runtime/tool-cache/playwright/chrome_elf.dll';
  const disposable = ['build/evidence/prior-job.json', 'coverage/coverage-summary.json'];
  const cacheBytes = Buffer.from('pinned native browser supply');
  await fs.mkdir(path.dirname(path.join(checkout, cache)), { recursive: true });
  await fs.writeFile(path.join(checkout, cache), cacheBytes);
  for (const relative of disposable) {
    await fs.mkdir(path.dirname(path.join(checkout, relative)), { recursive: true });
    await fs.writeFile(path.join(checkout, relative), 'previous job');
  }
  const authored = selected[0];
  await fs.writeFile(path.join(checkout, authored), 'stale CRLF carrier\r\n');
  assert.equal(native.variables?.GIT_STRATEGY, 'fetch');
  git('clean', ...native.variables.GIT_CLEAN_FLAGS.split(' '));
  git(...native.before_script[0].split(' ').slice(1));
  assert.deepEqual(await fs.readFile(path.join(checkout, cache)), cacheBytes);
  for (const relative of disposable)
    await assert.rejects(fs.access(path.join(checkout, relative)), { code: 'ENOENT' });
  for (const relative of selected)
    assert.deepEqual(
      await fs.readFile(path.join(checkout, relative)),
      originals.get(relative),
      relative,
    );
});

test('scene refinement is governed by the same generated closed-schema path', () => {
  assert.equal(edition.SCENE_REFINEMENT_SCHEMA?.$id, 'architecture.scene-refinement/v1');
  assert.equal(typeof generated.sceneRefinementValid, 'function');
  const selected = {
    schema: 'architecture.scene-refinement/v1',
    media: { static: { view: 'overview', nodes: [], edges: [], groups: [] } },
  };
  assert.equal(generated.sceneRefinementValid(selected), true);
  selected.media.static.html = '<svg/>';
  assert.equal(generated.sceneRefinementValid(selected), false);
});
