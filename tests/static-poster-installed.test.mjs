import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (b) => createHash('sha256').update(b).digest('hex');

test('installed poster CLI reconstructs all 180 labels without legacy checkout or host fonts', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'installed poster '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const run = (cmd, args, cwd = root) => {
    const r = spawnSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      timeout: 60000,
      env: {
        ...process.env,
        npm_config_offline: 'true',
        npm_config_update_notifier: 'false',
      },
    });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout;
  };
  const packed = JSON.parse(
    run('npm', [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      dir,
    ]),
  )[0];
  const consumer = path.join(dir, 'consumer'),
    home = path.join(dir, 'empty');
  await fs.mkdir(consumer);
  await fs.mkdir(home);
  run(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(dir, packed.filename),
    ],
    consumer,
  );
  const pkg = path.join(consumer, 'node_modules/architecture-publisher');
  // Remove only this disposable installation's unrelated rendering capabilities.
  for (const name of [
    'src/interactive',
    'assets/archify',
    'assets/raster',
    'assets/fonts',
  ])
    await fs.rm(path.join(pkg, name), { recursive: true });
  await fs.cp(
    path.join(root, 'tests/fixtures/ethos-source'),
    path.join(dir, 'source'),
    { recursive: true, errorOnExist: true },
  );
  const editionManifest = path.join(
    pkg,
    'editions/ethos/static/authoring/manifest.json',
  );
  const plan = {
    sourceManifest: './source/manifest.json',
    sourceSha256: hash(
      await fs.readFile(path.join(dir, 'source/manifest.json')),
    ),
    projectionDigest:
      '4ea40f421434106948f1e1d2d9ae5ee6c8b9868edc5538ff755876fd01d37ef8',
    editionManifest: path.relative(dir, editionManifest),
    editionSha256: hash(await fs.readFile(editionManifest)),
    output: './new-poster',
  };
  const planPath = path.join(dir, 'plan.json');
  await fs.writeFile(planPath, JSON.stringify(plan));
  const invoke = () =>
    spawnSync(
      process.execPath,
      [path.join(pkg, 'src/cli/main.mjs'), 'poster', 'ethos', planPath],
      {
        cwd: home,
        env: { HOME: home, PATH: home },
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
  const r = invoke();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const result = JSON.parse(r.stdout);
  assert.equal(result.labels, 180);
  assert.equal(result.measurement, 'recorded');
  const svg = await fs.readFile(path.join(dir, 'new-poster/terminal.svg'));
  assert.equal(
    hash(svg),
    '87594199a5b3182860d6ed1a16b446082a2862cc52b8ed8c1731111f3e600bfa',
  );
  assert.equal(result.semanticAcceptance, 'not-performed');
  assert.equal(result.browserAcceptance, 'not-performed');
  const repeated = invoke();
  assert.equal(repeated.status, 1);
  assert.equal(JSON.parse(repeated.stdout).error.code, 'output_exists');
  assert.deepEqual(
    await fs.readFile(path.join(dir, 'new-poster/terminal.svg')),
    svg,
  );
});
