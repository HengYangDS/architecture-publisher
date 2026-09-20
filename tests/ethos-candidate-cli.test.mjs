import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  sha256,
  stableStringify,
} from '../src/integrations/ethos/projection.mjs';
const root = path.resolve(import.meta.dirname, '..');
test('installed candidate command accepts explicit relative inputs without Git or ETHOS', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'candidate-cli-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const pack = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', dir],
    { cwd: root, encoding: 'utf8', timeout: 60000 },
  );
  assert.equal(pack.status, 0, pack.stderr);
  const info = JSON.parse(pack.stdout)[0],
    consumer = path.join(dir, 'consumer');
  await fs.mkdir(consumer);
  const installation = spawnSync(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(dir, info.filename),
    ],
    { encoding: 'utf8', timeout: 60000 },
  );
  assert.equal(installation.status, 0, installation.stderr);
  const pkg = path.join(consumer, 'node_modules/architecture-publisher'),
    home = path.join(dir, 'home');
  await fs.mkdir(home);
  const source = JSON.parse(
      await fs.readFile(
        path.join(root, 'tests/fixtures/ethos-source/projection-input.json'),
      ),
    ),
    copy = JSON.parse(
      await fs.readFile(path.join(pkg, 'editions/ethos/refresh.json')),
    );
  const meaningSha256 = sha256(
    stableStringify(source.semantics.nodes.candidate_base_stale),
  );
  copy.static.refresh.sha256 = meaningSha256;
  for (const page of copy.interactive.pages)
    page.meaning[0].sha256 = meaningSha256;
  await fs.writeFile(path.join(dir, 'authoring.json'), JSON.stringify(copy));
  const selector = {
    sourceManifest: path.relative(
      dir,
      path.join(root, 'tests/fixtures/ethos-source/manifest.json'),
    ),
    sourceSha256:
      '58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0',
    projectionDigest: source.digest,
  };
  const edition = path.join(pkg, 'editions/ethos/authoring/manifest.json');
  const plan = {
    previous: {
      ...selector,
      editionManifest: path.relative(dir, edition),
      editionSha256: sha256(await fs.readFile(edition)),
    },
    source: selector,
    authoring: 'authoring.json',
    authoringSha256: sha256(
      await fs.readFile(path.join(dir, 'authoring.json')),
    ),
    output: 'new-edition',
  };
  await fs.writeFile(path.join(dir, 'plan.json'), JSON.stringify(plan));
  const cli = path.join(pkg, 'src/cli/main.mjs');
  const run = () =>
    spawnSync(
      process.execPath,
      [cli, 'atlas', 'ethos', 'prepare', 'plan.json'],
      {
        cwd: dir,
        env: { HOME: home, PATH: home },
        encoding: 'utf8',
        timeout: 30000,
      },
    );
  const result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, 'prepared');
  assert.equal(parsed.pages, 13);
  assert.equal(parsed.semanticAcceptance, 'not-performed');
  assert.equal(run().status, 1, 'occupied output is not overwritten');
  await assert.rejects(
    fs.access(path.join(consumer, 'node_modules/playwright-core')),
  );
});
