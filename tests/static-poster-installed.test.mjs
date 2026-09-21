import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  installCoreAndEthos,
  runInstalledExport,
} from './fixtures/installed-packages.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (b) => createHash('sha256').update(b).digest('hex');

test('installed ETHOS poster reconstructs all 180 labels without legacy checkout or host fonts', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'installed poster '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const { consumer, coreRoot, ethosRoot } = await installCoreAndEthos(root, dir);
  const home = path.join(dir, 'empty');
  await fs.mkdir(home);
  // Remove only this disposable installation's unrelated rendering capabilities.
  for (const selected of [
    path.join(coreRoot, 'renderers/archify'),
    path.join(coreRoot, 'renderers/resvg'),
    path.join(coreRoot, 'renderers/fonts'),
  ])
    await fs.rm(selected, { recursive: true, force: true });
  await fs.cp(
    path.join(root, 'tests/fixtures/ethos-source'),
    path.join(dir, 'source'),
    { recursive: true, errorOnExist: true },
  );
  const editionManifest = path.join(
    ethosRoot,
    'src/edition/static/authoring/manifest.json',
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
  await fs.writeFile(path.join(dir, 'plan.json'), JSON.stringify(plan));
  const invoke = () =>
    runInstalledExport({
      consumer,
      module: '@architecture-publisher/ethos/edition',
      name: 'renderEthosPosterInput',
      args: ['plan.json'],
      cwd: dir,
      env: { HOME: home, PATH: home },
    });
  const run = await invoke();
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.labels, 180);
  assert.equal(result.measurement, 'recorded');
  const svg = await fs.readFile(path.join(dir, 'new-poster/terminal.svg'));
  assert.equal(
    hash(svg),
    '87594199a5b3182860d6ed1a16b446082a2862cc52b8ed8c1731111f3e600bfa',
  );
  assert.equal(result.semanticAcceptance, 'not-performed');
  assert.equal(result.browserAcceptance, 'not-performed');
  const repeated = await invoke();
  assert.equal(repeated.status, 1);
  assert.equal(JSON.parse(repeated.stdout).error.code, 'output_exists');
  assert.deepEqual(
    await fs.readFile(path.join(dir, 'new-poster/terminal.svg')),
    svg,
  );
});
