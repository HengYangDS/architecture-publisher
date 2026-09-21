import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const selectedSources = Object.freeze({
  'product-contract': 'docs/product-contract.md',
  'edition-contract': 'docs/edition-contract.md',
  'active-design': 'openspec/changes/architecture-publisher-0-2/design.md',
  'core-package': 'packages/publisher/package.json',
  'self-prepare-owner': 'editions/self/src/edition/prepare.mjs',
  'self-model-owner': 'editions/self/src/edition/model.mjs',
  'self-static-scene-owner': 'editions/self/src/edition/static-scene.mjs',
  'self-static-composition-owner':
    'editions/self/src/edition/static/composition.mjs',
  'self-static-compiler-owner': 'editions/self/src/edition/static/scene.mjs',
  'self-static-svg-owner': 'editions/self/src/edition/static/svg.mjs',
  'self-static-flagship-owner': 'editions/self/src/edition/static-flagship.mjs',
  'self-static-metrics':
    'editions/self/src/edition/static/authoring/metrics.json',
  'self-interactive-scene-owner':
    'editions/self/src/edition/interactive-scenes.mjs',
  'self-interactive-composition-owner':
    'editions/self/src/edition/interactive-scene.mjs',
  'self-interactive-atlas-owner': 'editions/self/src/edition/atlas.mjs',
  'source-owner': 'packages/publisher/src/source/write.mjs',
  'claim-owner': 'packages/publisher/src/semantics/document.mjs',
  'evolution-owner': 'packages/publisher/src/edition/evolution.mjs',
  'compiler-owner': 'packages/publisher/src/compiler/edition.mjs',
  'interactive-renderer-owner':
    'packages/publisher/renderers/archify/index.mjs',
  'qualification-owner': 'packages/publisher/src/qualification/contract.mjs',
  'publication-owner': 'packages/publisher/src/publication/files.mjs',
  'installed-test-owner': 'tests/installed-evolution.test.mjs',
});

async function request(output, sourceRoot = root) {
  const sources = {};
  for (const [id, relative] of Object.entries(selectedSources)) {
    const file = path.join(sourceRoot, relative),
      bytes = await fs.readFile(file);
    sources[id] = { path: file, sha256: sha256(bytes) };
  }
  return {
    schema: 'architecture.publisher-self-input/v1',
    source: { id: 'architecture-publisher', revision: 'interactive-atlas-test' },
    sources,
    output,
  };
}

async function prepare(directory) {
  const { prepareArchitecturePublisherEdition } = await import(
    '../editions/self/src/edition/prepare.mjs'
  );
  return prepareArchitecturePublisherEdition(
    await request(path.join(directory, 'prepared')),
  );
}

function atlasData(bytes) {
  const match = bytes
    .toString('utf8')
    .match(
      /<script id="architecture-atlas-data" type="application\/json">([\s\S]*?)<\/script>/,
    );
  assert(match, 'standalone Atlas data is embedded');
  return JSON.parse(match[1]);
}

test('the self Edition builds one complete source-bound interactive Atlas', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-self-atlas-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const prepared = await prepare(directory),
    output = path.join(directory, 'architecture-publisher.html'),
    { renderArchitecturePublisherAtlas } = await import(
      '../editions/self/src/edition/atlas.mjs'
    ),
    result = await renderArchitecturePublisherAtlas({
      sourceManifest: prepared.sourceManifest,
      sourceSha256: prepared.sourceSha256,
      semanticMember: 'semantic.json',
      edition: prepared.edition,
      editionSha256: prepared.editionSha256,
      output,
    }),
    bytes = await fs.readFile(output),
    data = atlasData(bytes);

  assert.equal(result.status, 'rendered');
  assert.equal(result.sha256, sha256(bytes));
  assert.equal(result.pages, 8);
  assert.deepEqual(result.supplies.map(({ id }) => id), [
    'archify',
    'font-supply',
    'runtime',
    'self-interactive-runtime',
  ]);
  assert(result.supplies.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
  assert.deepEqual(data.order, [
    'overview',
    'semantics',
    'edition',
    'composition',
    'qualification',
    'publication-recovery',
    'adoption',
    'evolution',
  ]);
  assert.equal(data.pages.overview.purpose, 'overview');
  assert.deepEqual(
    data.order.slice(1).map((id) => data.pages[id].purpose),
    Array(7).fill('mechanism'),
  );
  for (const id of data.order) {
    const page = data.pages[id],
      sourceIds = new Set(page.sourceIds);
    assert(Object.keys(page.subjectSources).length > 0, id);
    for (const values of Object.values(page.subjectSources))
      assert(values.every((sourceId) => sourceIds.has(sourceId)), id);
    const rebuilt = Buffer.from(
      page.pieces
        .map((part) => (typeof part === 'number' ? data.blocks[part] : part))
        .join(''),
    );
    assert.equal(sha256(rebuilt), page.sha256, id);
    assert.match(rebuilt.toString(), /var Archify = \{\};/);
    assert.doesNotMatch(rebuilt.toString(), /data-preset-badge-/);
  }
  assert.equal(data.state.qualification, 'not-performed');
  assert.equal(data.state.humanAcceptance, 'not-performed');
  assert.equal(data.state.publication, 'not-performed');
  assert.match(bytes.toString(), /sandbox="allow-scripts allow-downloads"/);
  assert.match(bytes.toString(), /var Archify = window\.Archify = \{\};/);
  assert.doesNotMatch(bytes.toString(), /allow-same-origin/);
});

test('the self Atlas preserves an occupied destination and rejects source drift', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-self-atlas-guard-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const prepared = await prepare(directory),
    output = path.join(directory, 'architecture-publisher.html'),
    { renderArchitecturePublisherAtlas } = await import(
      '../editions/self/src/edition/atlas.mjs'
    ),
    plan = {
      sourceManifest: prepared.sourceManifest,
      sourceSha256: prepared.sourceSha256,
      semanticMember: 'semantic.json',
      edition: prepared.edition,
      editionSha256: prepared.editionSha256,
      output,
    };
  await fs.writeFile(output, 'foreign');
  await assert.rejects(renderArchitecturePublisherAtlas(plan), {
    code: 'output_exists',
  });
  assert.equal(await fs.readFile(output, 'utf8'), 'foreign');

  await fs.unlink(output);
  plan.sourceSha256 = '0'.repeat(64);
  await assert.rejects(renderArchitecturePublisherAtlas(plan), {
    code: 'manifest_digest_mismatch',
  });
  await assert.rejects(fs.access(output));
});

test('the installed self package renders the standalone Atlas offline', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-self-atlas-installed-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const { consumer } = await installCoreAndSelf(root, directory),
    inputRoot = path.join(directory, 'relocated-inputs'),
    sources = {};
  await fs.mkdir(inputRoot);
  for (const [id, relative] of Object.entries(selectedSources)) {
    const bytes = await fs.readFile(path.join(root, relative)),
      file = path.join(inputRoot, id + '.source');
    await fs.writeFile(file, bytes);
    sources[id] = { path: file, sha256: sha256(bytes) };
  }
  const requestFile = path.join(directory, 'request.json'),
    requestValue = {
      schema: 'architecture.publisher-self-input/v1',
      source: { id: 'architecture-publisher', revision: 'installed-atlas' },
      sources,
      output: path.join(directory, 'prepared'),
    };
  await fs.writeFile(requestFile, encode(requestValue));
  const driver = path.join(consumer, 'render-self-atlas.mjs'),
    output = path.join(directory, 'architecture-publisher.html');
  await fs.writeFile(
    driver,
    [
      "import fs from 'node:fs/promises';",
      "import { prepareArchitecturePublisherEditionInput, renderArchitecturePublisherAtlasInput } from '@architecture-publisher/self-edition';",
      'const prepared = await prepareArchitecturePublisherEditionInput(process.argv[2]);',
      "const plan = JSON.parse(await fs.readFile(prepared.plan, 'utf8'));",
      "await fs.writeFile(prepared.plan, JSON.stringify({...plan, output:process.argv[3]}));",
      'const result = await renderArchitecturePublisherAtlasInput(prepared.plan);',
      "process.stdout.write(JSON.stringify(result) + '\\n');",
      '',
    ].join('\n'),
  );
  const run = spawnSync(process.execPath, [driver, requestFile, output], {
    cwd: consumer,
    encoding: 'utf8',
    env: { HOME: directory, PATH: directory, LANG: 'C.UTF-8' },
    timeout: 120000,
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const result = JSON.parse(run.stdout),
    bytes = await fs.readFile(output),
    data = atlasData(bytes);
  assert.equal(result.pages, 8);
  assert.equal(result.sha256, sha256(bytes));
  assert.deepEqual(data.order, [
    'overview',
    'semantics',
    'edition',
    'composition',
    'qualification',
    'publication-recovery',
    'adoption',
    'evolution',
  ]);
  assert.equal(data.state.qualification, 'not-performed');
});
