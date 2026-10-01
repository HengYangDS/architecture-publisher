import assert from 'node:assert/strict';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

const publisher = fileURLToPath(new URL('../packages/publisher/', import.meta.url));

function child(command, args, cwd, environment, expectedStatus = 0) {
  const result = spawnNativeSync(command, args, {
    cwd,
    env: environment,
    input: '',
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, expectedStatus, result.stdout + result.stderr);
  return result.stdout;
}

test('offline installed neutral HTML survives relocation and rejects changed supplies', async (t) => {
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-interactive-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const home = path.join(work, 'home');
  const cache = path.join(work, 'cache');
  const userConfig = path.join(work, 'user.npmrc');
  const globalConfig = path.join(work, 'global.npmrc');
  await fs.mkdir(home);
  await fs.writeFile(userConfig, '');
  await fs.writeFile(globalConfig, '');
  const npmEnvironment = {
    ...process.env,
    HOME: home,
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: cache,
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  };
  const packOutput = child(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
    publisher,
    npmEnvironment,
  );
  const archive = path.join(work, parseNpmPackRecord(packOutput).filename);
  const consumer = path.join(work, 'consumer');
  await fs.mkdir(consumer);
  child(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--offline',
      '--prefix',
      consumer,
      archive,
    ],
    consumer,
    npmEnvironment,
  );
  await fs.writeFile(path.join(consumer, 'scene.json'), JSON.stringify(interactiveEditionScene()));
  await fs.writeFile(
    path.join(consumer, 'run.mjs'),
    `import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { renderInteractiveEditionHtml } from 'architecture-publisher/renderers/interactive';
try {
  const scene = JSON.parse(await fs.readFile(new URL('./scene.json', import.meta.url)));
  const selected = await renderInteractiveEditionHtml(scene);
  console.log(JSON.stringify({
    status: 'ok',
    sha256: createHash('sha256').update(selected.bytes).digest('hex'),
    bytes: selected.bytes.length,
    supplies: selected.supplies,
    pages: selected.carriers.map(({ id }) => id),
  }));
} catch (error) {
  console.log(JSON.stringify({ status: 'error', code: error.code ?? 'unattributed' }));
  process.exitCode = 1;
}
`,
  );
  const nodeEnvironment = {
    HOME: home,
    PATH: '',
    NODE_PATH: '',
    NODE_OPTIONS: '',
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
  const run = (directory, expectedStatus = 0) =>
    JSON.parse(
      child(
        process.execPath,
        [path.join(directory, 'run.mjs')],
        directory,
        nodeEnvironment,
        expectedStatus,
      ).trim(),
    );
  const first = run(consumer);
  assert.equal(first.status, 'ok');
  assert.match(first.sha256, /^[0-9a-f]{64}$/u);
  assert(first.bytes > 400_000);
  assert.deepEqual(
    first.supplies.map(({ id }) => id),
    ['svg-pan-zoom', 'elk-layout', 'font-measurement', 'font-supply'],
  );
  assert.deepEqual(first.pages, ['overview', 'limit']);
  const relocated = path.join(work, 'relocated');
  await fs.cp(consumer, relocated, { recursive: true });
  await fs.rm(consumer, { recursive: true, force: true });
  assert.deepEqual(run(relocated), first);
  const elkPath = path.join(
    relocated,
    'node_modules/architecture-publisher/renderers/elk/supply/elk.cjs',
  );
  const elkBytes = await fs.readFile(elkPath);
  await fs.appendFile(elkPath, 'changed');
  assert.deepEqual(run(relocated, 1), {
    status: 'error',
    code: 'render_elk_supply_invalid',
  });
  await fs.writeFile(elkPath, elkBytes);
  assert.deepEqual(run(relocated), first);
  await fs.appendFile(
    path.join(
      relocated,
      'node_modules/architecture-publisher/renderers/interactive/supply/svg-pan-zoom.min.js',
    ),
    'changed',
  );
  assert.deepEqual(run(relocated, 1), {
    status: 'error',
    code: 'render_interactive_supply_invalid',
  });
});
