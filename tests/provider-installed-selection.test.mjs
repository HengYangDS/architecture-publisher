import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function run(command, args, cwd, env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    input: '',
    encoding: 'utf8',
    timeout: 90_000,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

function editionProject() {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'installed-portrait',
    editor: 'fixture-editor',
    title: 'Installed source portrait',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What source is selected?' }],
    scope: {
      sourceNamespaces: ['org.example/service'],
      selections: [
        { id: 'service', namespace: 'org.example/service', kind: 'reference', reference: 'model' },
      ],
      limits: [],
    },
    requiredAssertions: [
      { id: 'shape-assertion', kind: 'source', selection: 'service', questions: ['shape'] },
    ],
    omissions: [],
    transformations: [],
    narrative: { summary: 'The selected source.', readingOrder: ['shape'] },
    presentation: {
      static: { questions: ['shape'], intent: 'A clear overview.' },
      interactive: { questions: ['shape'], intent: 'An explorable overview.' },
    },
    visualPolicy: { profile: 'neutral' },
  };
}

test('packed Publisher and Provider materialize one selected input offline', async (t) => {
  const work = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-installed-selection-'),
  );
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const consumer = path.join(work, 'consumer');
  const providerSource = path.join(work, 'provider-source');
  const selectedRoot = path.join(work, 'selected');
  const editionRoot = path.join(work, 'edition');
  const home = path.join(work, 'empty-home');
  const cache = path.join(work, 'empty-cache');
  const temporary = path.join(work, 'temporary');
  const userConfig = path.join(work, 'empty-user.npmrc');
  const globalConfig = path.join(work, 'empty-global.npmrc');
  for (const directory of [
    consumer,
    providerSource,
    selectedRoot,
    editionRoot,
    home,
    cache,
    temporary,
  ])
    await fs.mkdir(directory);
  await fs.writeFile(userConfig, '');
  await fs.writeFile(globalConfig, '');
  const npmEnv = {
    PATH: process.env.PATH,
    HOME: home,
    TMPDIR: temporary,
    LANG: 'C.UTF-8',
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: cache,
    npm_config_offline: 'true',
    npm_config_update_notifier: 'false',
    npm_config_audit: 'false',
    ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const publisherArchive = parseNpmPackRecord(
    run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
      publisher,
      npmEnv,
    ),
  );
  const publisherVersion = JSON.parse(
    await fs.readFile(path.join(publisher, 'package.json')),
  ).version;
  const providerPackage = {
    name: '@fixture/selected-provider',
    version: '1.0.0',
    type: 'module',
    exports: { './provider': './provider.mjs' },
    dependencies: { 'architecture-publisher': publisherVersion },
  };
  await fs.writeFile(
    path.join(providerSource, 'package.json'),
    JSON.stringify(providerPackage) + '\n',
  );
  await fs.writeFile(
    path.join(providerSource, 'provider.mjs'),
    `import { canonical } from 'architecture-publisher/semantics';

export function materializeEditionProvider(request) {
  const input = request.inputs.find(({ id }) => id === 'source');
  const native = JSON.parse(Buffer.from(input.contentBase64, 'base64').toString('utf8'));
  const index = Object.keys(native)[0];
  return {
    schema: 'architecture.edition-provider-reply/v2',
    derived: [{ id: 'index', contentBase64: Buffer.from(canonical({ index }) + '\\n').toString('base64') }],
  };
}
`,
  );
  const providerArchive = parseNpmPackRecord(
    run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
      providerSource,
      npmEnv,
    ),
  );
  run(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--prefix',
      consumer,
      path.join(work, publisherArchive.filename),
      path.join(work, providerArchive.filename),
    ],
    consumer,
    npmEnv,
  );
  const installedPublisher = path.join(consumer, 'node_modules/architecture-publisher');
  const installedProvider = path.join(consumer, 'node_modules/@fixture/selected-provider');
  const providerApi = await import(
    pathToFileURL(path.join(installedPublisher, 'src/provider/index.mjs'))
  );
  const packageBytes = await fs.readFile(path.join(installedProvider, 'package.json'));
  const native = Buffer.from('{"service":true}\n');
  const derived = Buffer.from('{"index":"service"}\n');
  await fs.writeFile(path.join(selectedRoot, 'native.json'), native);
  const manifest = {
    schema: 'architecture.edition-provider/v2',
    provider: { id: 'installed-provider', revision: '1' },
    selected: {
      native: [
        {
          id: 'model',
          namespace: 'org.example/service',
          claimant: 'service-maintainer',
          format: { id: 'example/native-json', version: '1' },
          revision: { kind: 'content', algorithm: 'sha256' },
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      derived: [
        {
          id: 'index',
          claimant: 'adapter-maintainer',
          format: { id: 'example/index-json', version: '1' },
          derivedFrom: ['model'],
          adapter: { id: 'native-reader', version: '1', contentSha256: sha('adapter') },
          method: 'extract/v1',
          bytes: derived.length,
          sha256: sha(derived),
        },
      ],
      edition: null,
    },
    delivery: {
      kind: 'executable',
      package: {
        name: providerPackage.name,
        version: providerPackage.version,
        packageJsonSha256: sha(packageBytes),
        contentSha256: await providerApi.editionProviderPackageDigest(installedProvider),
        entrypoint: './provider',
      },
      inputs: [
        {
          id: 'source',
          path: 'native.json',
          mediaType: 'application/json',
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      nativeInputs: [{ item: 'model', input: 'source' }],
      editionInput: null,
      editionResourceInputs: [],
    },
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + '\n');
  await fs.writeFile(path.join(selectedRoot, 'provider.json'), manifestBytes);
  await fs.writeFile(
    path.join(editionRoot, 'project.json'),
    JSON.stringify(editionProject()) + '\n',
  );
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [],
    providers: [
      {
        id: 'selected-provider',
        manifest: 'selected/provider.json',
        sha256: sha(manifestBytes),
        packageRoot: 'consumer/node_modules/@fixture/selected-provider',
      },
    ],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  const requestBytes = Buffer.from(JSON.stringify(request) + '\n');
  const requestPath = path.join(work, 'build-request.json');
  await fs.writeFile(requestPath, requestBytes);
  const script = `import { materializeBuildRequestInput } from 'architecture-publisher/provider';
const result = await materializeBuildRequestInput(process.argv[1], process.argv[2]);
process.stdout.write(JSON.stringify({
  lockSha256: result.lockSha256,
  source: result.readSource('org.example/service').toString('utf8'),
  derived: result.readDerived(result.lock.derived[0]).toString('utf8'),
  delivery: result.invocations[0].delivery,
  limits: result.limits,
}) + '\\n');`;
  const childEnv = {
    HOME: home,
    PATH: home,
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const selectedDigest = sha(requestBytes);
  const first = JSON.parse(
    run(
      process.execPath,
      ['--input-type=module', '-e', script, requestPath, selectedDigest],
      consumer,
      childEnv,
    ),
  );
  assert.match(first.lockSha256, /^[a-f0-9]{64}$/u);
  assert.equal(first.source, native.toString('utf8'));
  assert.equal(first.derived, derived.toString('utf8'));
  assert.equal(first.delivery, 'executable');
  assert(first.limits.includes('provider-dependencies-unobserved'));
  for (const name of ['ethos', 'aigw']) await fs.mkdir(path.join(work, name));
  const adjacent = JSON.parse(
    run(
      process.execPath,
      ['--input-type=module', '-e', script, requestPath, selectedDigest],
      consumer,
      childEnv,
    ),
  );
  assert.deepEqual(adjacent, first);

  const copiedBase = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-installed-relocation-'),
  );
  t.after(() => fs.rm(copiedBase, { recursive: true, force: true }));
  const relocatedRoot = path.join(copiedBase, 'selected-product');
  await fs.cp(work, relocatedRoot, { recursive: true });
  await fs.rm(work, { recursive: true, force: true });
  const relocatedHome = path.join(relocatedRoot, 'empty-home');
  const relocatedTemp = path.join(relocatedRoot, 'temporary');
  const relocated = JSON.parse(
    run(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        script,
        path.join(relocatedRoot, 'build-request.json'),
        selectedDigest,
      ],
      path.join(relocatedRoot, 'consumer'),
      {
        ...childEnv,
        HOME: relocatedHome,
        PATH: relocatedHome,
        TMPDIR: relocatedTemp,
        TMP: relocatedTemp,
        TEMP: relocatedTemp,
      },
    ),
  );
  assert.deepEqual(relocated, first);
});
