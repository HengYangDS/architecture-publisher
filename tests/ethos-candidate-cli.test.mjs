import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  sha256,
  stableStringify,
} from '../packages/extensions/ethos/src/adapter/projection.mjs';
import {
  installCoreAndEthos,
  runInstalledExport,
} from './fixtures/installed-packages.mjs';
const root = path.resolve(import.meta.dirname, '..');
test('installed candidate command accepts explicit relative inputs without Git or ETHOS', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'candidate-cli-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const { consumer, ethosRoot } = await installCoreAndEthos(root, dir);
  const home = path.join(dir, 'home');
  await fs.mkdir(home);
  const source = JSON.parse(
      await fs.readFile(
        path.join(root, 'tests/fixtures/ethos-source/projection-input.json'),
      ),
    ),
    copy = JSON.parse(
      await fs.readFile(path.join(ethosRoot, 'src/edition/refresh.json')),
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
  const edition = path.join(ethosRoot, 'src/edition/authoring/manifest.json');
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
  const run = () =>
    runInstalledExport({
      consumer,
      module: '@architecture-publisher/ethos/edition',
      name: 'prepareEthosCandidateInput',
      args: ['plan.json'],
      cwd: dir,
      env: { HOME: home, PATH: home },
      timeout: 30000,
    });
  const result = await run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, 'prepared');
  assert.equal(parsed.pages, 13);
  assert.equal(parsed.semanticAcceptance, 'not-performed');
  assert.equal((await run()).status, 1, 'occupied output is not overwritten');
  await assert.rejects(
    fs.access(path.join(consumer, 'node_modules/playwright-core')),
  );
});
