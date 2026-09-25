import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const publisher = fileURLToPath(new URL('../packages/publisher/', import.meta.url));

function child(command, args, cwd, environment, expectedStatus = 0) {
  const result = spawnSync(command, args, {
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

test('offline installed Edition meaning, layout, and Scene survive relocation and refuse changed pins', async (t) => {
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-meaning-'));
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

  const inputs = path.join(consumer, 'inputs');
  await fs.mkdir(path.join(inputs, 'sources'), { recursive: true });
  await fs.mkdir(path.join(inputs, 'edition'));
  const model = Buffer.from(
    "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b }\n",
  );
  const views = Buffer.from('views { view overview { include * } }\n');
  await fs.writeFile(path.join(inputs, 'sources/model.c4'), model);
  await fs.writeFile(path.join(inputs, 'sources/views.c4'), views);
  const namespaces = ['example/model', 'example/views'];
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'installed-atlas',
    editor: 'fixture-editor',
    title: 'Installed architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is selected?' }],
    scope: {
      sourceNamespaces: namespaces,
      selections: [
        { id: 'model', namespace: namespaces[0], kind: 'reference', reference: 'element:a' },
        { id: 'overview', namespace: namespaces[1], kind: 'reference', reference: 'view:overview' },
      ],
      limits: [],
    },
    requiredAssertions: [{ id: 'shape', kind: 'source', selection: 'model', questions: ['shape'] }],
    omissions: [],
    transformations: [],
    narrative: { summary: 'A selected source.', readingOrder: ['shape'] },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'One overview.' },
      interactive: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'Explore.' },
    },
    visualPolicy: { profile: 'neutral' },
  };
  await fs.writeFile(path.join(inputs, 'edition/project.json'), JSON.stringify(project) + '\n');
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      { id: 'model', namespace: namespaces[0], path: 'sources/model.c4', bytes: model },
      { id: 'views', namespace: namespaces[1], path: 'sources/views.c4', bytes: views },
    ].map(({ id, namespace, path: locator, bytes }) => ({
      id,
      namespace,
      format: { id: 'likec4/dsl', version: 'unversioned' },
      claimant: 'fixture-maintainer',
      revision: { kind: 'content', algorithm: 'sha256' },
      input: { kind: 'pin', path: locator, sha256: sha(bytes) },
    })),
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  await fs.writeFile(path.join(inputs, 'build-request.json'), JSON.stringify(request) + '\n');
  const script = `
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { materializeBuildRequestInput } from 'architecture-publisher/provider';
import { compileEditionMeaning } from 'architecture-publisher/compiler';
import { importLikeC4Layout } from 'architecture-publisher/semantics';
import { composeInteractiveEditionScene, composeStaticEditionScene } from 'architecture-publisher/scene';
const file = fileURLToPath(new URL('./inputs/build-request.json', import.meta.url));
try {
  const bytes = await fs.readFile(file);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const selected = await materializeBuildRequestInput(file, digest);
  const meaning = await compileEditionMeaning(selected);
  const layout = await importLikeC4Layout({
    lock: selected.lock,
    readSource: selected.readSource,
    view: { namespace: 'example/views', id: 'overview' },
  });
  const staticScene = composeStaticEditionScene(meaning, layout);
  const interactiveScene = composeInteractiveEditionScene(meaning);
  console.log(JSON.stringify({
    status: 'ok', lock: selected.lockSha256, semantic: meaning.native.semanticDigest,
    parser: meaning.native.parserSupply.sha256,
    static: meaning.media.static.assertionIds,
    interactive: meaning.media.interactive.assertionIds,
    completeness: meaning.completeness,
    layout: {
      nodes: layout.nodes.map(({ id }) => id),
      relations: layout.edges.flatMap((edge) => edge.relations.map(({ reference }) => reference)),
      parser: layout.parserSupply.sha256,
    },
    scene: {
      completeness: staticScene.completeness,
      nodes: staticScene.nodes.map(({ id }) => id),
      relations: staticScene.edges.flatMap((edge) =>
        edge.relations.map(({ reference }) => reference)),
      bounds: staticScene.bounds,
    },
    interactiveScene: {
      completeness: interactiveScene.completeness,
      pages: interactiveScene.pages.map(({ id, questionIds, nodes, relations }) => ({
        id,
        questions: questionIds,
        nodes: nodes.map(({ id }) => id),
        relations: relations.map(({ id }) => id),
      })),
    },
  }));
} catch (error) {
  console.log(JSON.stringify({ status: 'error', code: error.code ?? 'unattributed' }));
  process.exitCode = 1;
}
`;
  await fs.writeFile(path.join(consumer, 'run.mjs'), script);
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
  assert.equal(first.completeness, 'finite-unqualified-obligations');
  assert.deepEqual(first.static, ['shape']);
  assert.deepEqual(first.interactive, ['shape']);
  assert.deepEqual(first.layout.nodes, ['a', 'b']);
  assert.equal(first.layout.relations.length, 1);
  assert.equal(first.layout.parser, first.parser);
  assert.equal(first.scene.completeness, 'unqualified-scene');
  assert.deepEqual(first.scene.nodes, ['a']);
  assert.deepEqual(first.scene.relations, []);
  assert(first.scene.bounds.height > 0);
  assert.equal(first.interactiveScene.completeness, 'unqualified-scene');
  assert.deepEqual(first.interactiveScene.pages, [
    { id: 'overview', questions: ['shape'], nodes: ['a'], relations: [] },
  ]);
  for (const value of [first.lock, first.semantic, first.parser])
    assert.match(value, /^[0-9a-f]{64}$/u);

  const relocated = path.join(work, 'relocated');
  await fs.cp(consumer, relocated, { recursive: true });
  await fs.rm(consumer, { recursive: true, force: true });
  assert.deepEqual(run(relocated), first);
  await fs.appendFile(path.join(relocated, 'inputs/sources/model.c4'), '\n');
  assert.deepEqual(run(relocated, 1), { status: 'error', code: 'materialized_pin_mismatch' });
});
