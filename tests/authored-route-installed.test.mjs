import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { sha, namespace, meaningFor } from './fixtures/authored-routes.mjs';

test('offline packed public CLI builds literal-route sibling media without adjacent source state', async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-route-installed-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const home = path.join(root, 'home'),
    consumer = path.join(root, 'consumer');
  await fs.mkdir(home);
  await fs.mkdir(consumer);
  const user = path.join(root, 'user.npmrc'),
    global = path.join(root, 'global.npmrc');
  await fs.writeFile(user, '');
  await fs.writeFile(global, '');
  const npmEnvironment = {
    ...process.env,
    HOME: home,
    npm_config_userconfig: user,
    npm_config_globalconfig: global,
    npm_config_cache: path.join(root, 'cache'),
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  };
  const invoke = (command, args, cwd, env, expected = 0) => {
    const child = spawnNativeSync(command, args, {
      cwd,
      env,
      encoding: 'utf8',
      timeout: 120000,
      killSignal: 'SIGKILL',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 4 * 1024 * 1024,
    });
    assert.ifError(child.error);
    assert.equal(child.status, expected, child.stderr || child.stdout);
    return child.stdout;
  };
  const packed = parseNpmPackRecord(
    invoke(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', root],
      fileURLToPath(new URL('../packages/publisher/', import.meta.url)),
      npmEnvironment,
    ),
  );
  invoke(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(root, packed.filename),
    ],
    consumer,
    npmEnvironment,
  );
  const model = claimModel();
  model.relations.telemetry = {
    ...structuredClone(model.relations.request),
    qualifiers: { purpose: 'telemetry' },
  };
  const modelBytes = Buffer.from(JSON.stringify(model));
  const inputs = path.join(consumer, 'inputs');
  await fs.mkdir(path.join(inputs, 'sources'), { recursive: true });
  await fs.mkdir(path.join(inputs, 'edition'));
  await fs.writeFile(path.join(inputs, 'sources/model.json'), modelBytes);
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'route-reading',
    editor: 'example:editor',
    title: 'Shared routes',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [
      {
        id: 'shape',
        audience: 'maintainer',
        text: 'How are the exact selected source routes connected?',
      },
    ],
    scope: {
      sourceNamespaces: [namespace],
      selections: ['request', 'telemetry'].map((id) => ({
        id,
        namespace,
        kind: 'reference',
        reference: `relation:${id}`,
        questions: ['shape'],
      })),
      limits: [],
    },
    omissions: [],
    narrative: { summary: 'Two source relationships share one physical traversal.' },
    presentation: {
      static: {
        views: [{ id: 'overview', questions: ['shape'] }],
        intent: 'Read exact routes.',
        width: 1800,
      },
      interactive: {
        views: [{ id: 'overview', questions: ['shape'] }],
        intent: 'Inspect shared carriers.',
      },
    },
    visualPolicy: { profile: 'neutral', override: 'refinement.json' },
  };
  const refinement = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: meaningFor('static').refinement.media.static,
      interactive: meaningFor('interactive').refinement.media.interactive,
    },
  };
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...refinement.media.static.scene.texts,
    ...refinement.media.interactive.pages[0].scene.texts,
  ]);
  for (const scene of [refinement.media.static.scene, refinement.media.interactive.pages[0].scene])
    scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  await fs.writeFile(path.join(inputs, 'edition/project.json'), JSON.stringify(project));
  await fs.writeFile(path.join(inputs, 'edition/refinement.json'), JSON.stringify(refinement));
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'model',
        namespace,
        format: { id: 'architecture.claim-model', version: '2' },
        claimant: model.owner,
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'pin', path: 'sources/model.json', sha256: sha(modelBytes) },
      },
    ],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  await fs.writeFile(path.join(inputs, 'build-request.json'), JSON.stringify(request));
  const installedEnvironment = {
    HOME: home,
    PATH: '',
    NODE_PATH: '',
    NODE_OPTIONS: '',
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
  const cliEntry = JSON.parse(
    await fs.readFile(
      path.join(consumer, 'node_modules/architecture-publisher/package.json'),
      'utf8',
    ),
  ).bin.archpub;
  const command = path.join(consumer, 'node_modules/architecture-publisher', cliEntry);
  const requestPath = path.join(inputs, 'build-request.json');
  const requestDigest = sha(await fs.readFile(requestPath));
  invoke(
    process.execPath,
    [
      command,
      'edition',
      'build',
      requestPath,
      '--sha256',
      requestDigest,
      '--output',
      path.join(consumer, 'candidate'),
    ],
    consumer,
    installedEnvironment,
  );
  const candidate = JSON.parse(
    await fs.readFile(path.join(consumer, 'candidate/candidate.json'), 'utf8'),
  );
  assert.ok(candidate.media.static);
  assert.ok(candidate.media.interactive);
  const svg = await fs.readFile(path.join(consumer, 'candidate/static/architecture.svg'), 'utf8');
  const html = await fs.readFile(
    path.join(consumer, 'candidate/interactive/architecture.html'),
    'utf8',
  );
  assert.equal([...svg.matchAll(/data-literal-segment-id="bridge"/gu)].length, 1);
  const data = JSON.parse(
    html.match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    )[1],
  );
  assert.equal(
    data.pages.overview.facts.filter(({ graphicId }) => graphicId === 'bridge').length,
    2,
  );
  assert.equal(svg.includes('data-graphic-id="node:junction"'), true);
  assert.equal(html.includes('data-node-id="junction"'), false);
  await fs.appendFile(path.join(inputs, 'sources/model.json'), '\n');
  const changed = spawnNativeSync(
    process.execPath,
    [
      command,
      'edition',
      'build',
      requestPath,
      '--sha256',
      requestDigest,
      '--output',
      path.join(consumer, 'invalid'),
    ],
    {
      cwd: consumer,
      env: installedEnvironment,
      encoding: 'utf8',
      timeout: 120000,
      killSignal: 'SIGKILL',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  assert.notEqual(changed.status, 0);
  assert.match(changed.stdout + changed.stderr, /digest|pin/u);
  await assert.rejects(fs.stat(path.join(consumer, 'invalid')), { code: 'ENOENT' });
});
