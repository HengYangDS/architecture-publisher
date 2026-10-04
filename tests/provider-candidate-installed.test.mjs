import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import {
  executableModelProvider,
  selectedNativeEdition,
  sha,
} from './fixtures/selected-native-edition.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function run(command, args, cwd, env = process.env) {
  const result = spawnNativeSync(command, args, {
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

test('offline installed Core builds a full dual-media Candidate from an installed executable Provider', async (t) => {
  const selected = await selectedNativeEdition(t, { width: 1800 });
  const { executionMarker } = await executableModelProvider(selected);
  const installation = path.join(selected.root, 'installed');
  await fs.mkdir(installation);
  const providerArchive = parseNpmPackRecord(
    run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', installation],
      path.join(selected.root, 'provider/package'),
    ),
  );
  const { consumer, coreRoot, selfRoot } = await installCoreAndSelf(root, installation, [
    path.join(installation, providerArchive.filename),
  ]);
  for (const file of ['package.json', 'package-lock.json'])
    await assert.rejects(fs.access(path.join(consumer, file)), { code: 'ENOENT' });
  await fs.access(path.join(selfRoot, 'package.json'));
  const providerRoot = path.join(consumer, 'node_modules/@fixture/model-provider');
  const providerApi = await import(pathToFileURL(path.join(coreRoot, 'src/provider/index.mjs')));
  const manifestPath = path.join(selected.root, 'provider/provider.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  manifest.delivery.package.packageJsonSha256 = sha(
    await fs.readFile(path.join(providerRoot, 'package.json')),
  );
  manifest.delivery.package.contentSha256 =
    await providerApi.editionProviderPackageDigest(providerRoot);
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + '\n');
  await fs.writeFile(manifestPath, manifestBytes);
  selected.request.providers[0].sha256 = sha(manifestBytes);
  selected.request.providers[0].packageRoot =
    'installed/consumer/node_modules/@fixture/model-provider';
  const requestBytes = Buffer.from(JSON.stringify(selected.request) + '\n');
  await fs.writeFile(selected.file, requestBytes);
  selected.digest = sha(requestBytes);

  const home = path.join(selected.root, 'empty-home');
  await fs.mkdir(home);
  const output = path.join(selected.root, 'candidate');
  const isolatedEnv = {
    HOME: home,
    PATH: home,
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const omitted = spawnSync(
    process.execPath,
    [
      path.join(coreRoot, 'src/cli/main.mjs'),
      'edition',
      'build',
      selected.file,
      '--sha256',
      selected.digest,
      '--output',
      output,
    ],
    { cwd: consumer, env: isolatedEnv, input: '', encoding: 'utf8', timeout: 90_000 },
  );
  assert.equal(omitted.status, 1, omitted.stdout + omitted.stderr);
  assert.equal(
    JSON.parse(omitted.stdout).error.code,
    'materialized_provider_execution_choice_mismatch',
  );
  await assert.rejects(fs.access(executionMarker), { code: 'ENOENT' });
  const built = JSON.parse(
    run(
      process.execPath,
      [
        path.join(coreRoot, 'src/cli/main.mjs'),
        'edition',
        'build',
        selected.file,
        '--sha256',
        selected.digest,
        '--output',
        output,
        '--execute-providers',
        `model-provider@${selected.request.providers[0].sha256}`,
      ],
      consumer,
      isolatedEnv,
    ),
  );
  assert.equal(built.status, 'built');
  assert.deepEqual(new Set(built.media), new Set(['static', 'interactive']));
  const bundle = await readSourceBundle(path.join(output, 'manifest.json'), built.manifestSha256);
  const members = new Map(bundle.members.map(({ path: name, content }) => [name, content]));
  const candidate = JSON.parse(members.get('candidate.json'));
  assert.equal(candidate.input.lockSha256, built.lockSha256);
  assert.equal(sha(members.get('input-lock.json')), built.lockSha256);
  for (const name of [
    'static/architecture.svg',
    'static/architecture.png',
    'interactive/architecture.html',
  ])
    assert(members.get(name)?.length > 0, name);
  const selectedParent = Number(await fs.readFile(executionMarker, 'utf8'));
  assert(Number.isSafeInteger(selectedParent));
  assert.notEqual(selectedParent, process.pid);
});

test('native files from an external declarative Provider and a direct editorial brief rebuild offline after relocation', async (t) => {
  const work = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-editorial-journey-'),
  );
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const example = path.join(root, 'examples/selected-edition');
  const inputFiles = ['build-request.json', 'model.c4', 'views.c4', 'edition/project.json'];
  const original = new Map(
    await Promise.all(
      inputFiles.map(async (name) => [name, await fs.readFile(path.join(example, name))]),
    ),
  );
  const direct = path.join(work, 'direct');
  await fs.cp(example, direct, { recursive: true });
  const external = path.join(work, 'external');
  await fs.mkdir(path.join(external, 'source'), { recursive: true });
  await fs.mkdir(path.join(external, 'editorial'));
  for (const name of ['model.c4', 'views.c4'])
    await fs.writeFile(path.join(external, 'source', name), original.get(name));
  await fs.writeFile(
    path.join(external, 'editorial/project.json'),
    original.get('edition/project.json'),
  );
  const request = JSON.parse(original.get('build-request.json'));
  const provider = {
    schema: 'architecture.edition-provider/v2',
    provider: { id: 'example-source', revision: '1' },
    selected: {
      native: request.sources.map(({ input, ...source }) => ({
        ...source,
        bytes: original.get(input.path).length,
        sha256: input.sha256,
      })),
      derived: [],
      edition: null,
    },
    delivery: {
      kind: 'declarative',
      files: request.sources.map(({ id, input }) => ({
        kind: 'native',
        id,
        path: input.path,
      })),
    },
  };
  const providerBytes = Buffer.from(JSON.stringify(provider) + '\n');
  await fs.writeFile(path.join(external, 'source/provider.json'), providerBytes);
  const externalRequest = Buffer.from(
    JSON.stringify({
      ...request,
      edition: { ...request.edition, root: 'editorial' },
      sources: [],
      providers: [
        {
          id: provider.provider.id,
          manifest: 'source/provider.json',
          sha256: sha(providerBytes),
        },
      ],
    }) + '\n',
  );
  await fs.writeFile(path.join(external, 'build-request.json'), externalRequest);
  const selectedInputs = new Map([
    ...inputFiles.map((name) => [path.join(direct, name), original.get(name)]),
    ...['model.c4', 'views.c4'].map((name) => [
      path.join(external, 'source', name),
      original.get(name),
    ]),
    [path.join(external, 'source/provider.json'), providerBytes],
    [path.join(external, 'editorial/project.json'), original.get('edition/project.json')],
    [path.join(external, 'build-request.json'), externalRequest],
  ]);
  const beforeNames = await Promise.all(
    [direct, external].map(async (directory) =>
      (await fs.readdir(directory, { recursive: true })).sort(),
    ),
  );
  const installation = path.join(work, 'installed');
  await fs.mkdir(installation);
  const { consumer } = await installCoreAndSelf(root, installation);
  const home = path.join(work, 'empty-home');
  await fs.mkdir(home);
  const build = (installed, input, digest, output, isolatedHome) =>
    JSON.parse(
      run(
        process.execPath,
        [
          path.join(installed, 'node_modules/architecture-publisher/src/cli/main.mjs'),
          'edition',
          'build',
          path.join(input, 'build-request.json'),
          '--sha256',
          digest,
          '--output',
          output,
        ],
        installed,
        {
          HOME: isolatedHome,
          PATH: isolatedHome,
          NODE_PATH: '',
          NODE_OPTIONS: '',
          LANG: 'C.UTF-8',
          ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
        },
      ),
    );
  const read = async (built) => {
    assert.equal(built.status, 'built');
    assert.deepEqual(built.media, ['interactive', 'static']);
    const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
    const members = new Map(bundle.members.map(({ path: name, content }) => [name, content]));
    const candidate = JSON.parse(members.get('candidate.json'));
    assert.equal(candidate.qualification, 'unqualified');
    assert.equal(candidate.input.lockSha256, built.lockSha256);
    for (const name of [
      'static/architecture.svg',
      'static/architecture.png',
      'interactive/architecture.html',
    ])
      assert(members.get(name)?.length > 0, name);
    assert.equal(members.get('static/architecture.png').readUInt32BE(16), 1800);
    for (const name of ['static/architecture.svg', 'interactive/architecture.html']) {
      const content = members.get(name).toString('utf8');
      for (const text of ['Alpha', 'Beta', 'What connects the two components?'])
        assert(content.includes(text), `${name}: ${text}`);
      assert(!content.includes(root));
    }
    const html = members.get('interactive/architecture.html').toString('utf8');
    const data = html.match(
      /<script type="application\/json" id="edition-data">([\s\S]*?)<\/script>/u,
    );
    assert(data, 'The emitted native reading data is required');
    const pages = JSON.parse(data[1]);
    assert.equal(pages.length, 1);
    const labels = new Map(pages[0].nodes.map(({ id, label }) => [id, label]));
    assert.deepEqual(
      pages[0].relations.map(({ source, target, direction }) => ({
        source: labels.get(source),
        target: labels.get(target),
        direction,
      })),
      [{ source: 'Alpha', target: 'Beta', direction: 'forward' }],
    );
    return { built, candidate, members };
  };
  const directDigest = sha(original.get('build-request.json'));
  const externalDigest = sha(externalRequest);
  const first = await read(
    build(consumer, direct, directDigest, path.join(work, 'direct-candidate'), home),
  );
  const selected = await read(
    build(consumer, external, externalDigest, path.join(work, 'external-candidate'), home),
  );
  assert.equal(selected.candidate.input.semanticDigest, first.candidate.input.semanticDigest);
  assert.notEqual(selected.built.candidateSha256, first.built.candidateSha256);
  for (const [name, bytes] of selectedInputs) assert.deepEqual(await fs.readFile(name), bytes);
  for (const [index, directory] of [direct, external].entries())
    assert.deepEqual((await fs.readdir(directory, { recursive: true })).sort(), beforeNames[index]);

  const relocated = path.join(work, 'relocated');
  await fs.mkdir(relocated);
  for (const [from, to] of [
    [consumer, 'consumer'],
    [direct, 'direct'],
    [external, 'external'],
    [home, 'empty-home'],
  ]) {
    await fs.rename(from, path.join(relocated, to));
    await assert.rejects(fs.access(from), { code: 'ENOENT' });
  }
  for (const [name, digest, expected] of [
    ['direct', directDigest, first],
    ['external', externalDigest, selected],
  ]) {
    const rebuilt = await read(
      build(
        path.join(relocated, 'consumer'),
        path.join(relocated, name),
        digest,
        path.join(relocated, `${name}-candidate`),
        path.join(relocated, 'empty-home'),
      ),
    );
    assert.equal(rebuilt.built.candidateSha256, expected.built.candidateSha256);
    assert.deepEqual(rebuilt.members, expected.members);
  }
  for (const [index, name] of ['direct', 'external'].entries())
    assert.deepEqual(
      (await fs.readdir(path.join(relocated, name), { recursive: true })).sort(),
      beforeNames[index],
    );
  for (const [name, bytes] of selectedInputs) {
    const relocatedInput = path.join(relocated, path.relative(work, name));
    assert.deepEqual(await fs.readFile(relocatedInput), bytes);
  }
  for (const [name, bytes] of original)
    assert.deepEqual(await fs.readFile(path.join(example, name)), bytes);
  const changedOutput = path.join(relocated, 'changed-candidate');
  const changedModel = path.join(relocated, 'external/source/model.c4');
  await fs.writeFile(
    changedModel,
    original.get('model.c4').toString('utf8').replace('Alpha', 'Gamma'),
  );
  assert.throws(
    () =>
      build(
        path.join(relocated, 'consumer'),
        path.join(relocated, 'external'),
        externalDigest,
        changedOutput,
        path.join(relocated, 'empty-home'),
      ),
    /edition_provider_v2_member_digest_mismatch/u,
  );
  await assert.rejects(fs.access(changedOutput), { code: 'ENOENT' });
  t.diagnostic(
    JSON.stringify({
      source: 'examples/selected-edition',
      nativeFormats: ['likec4/dsl'],
      media: first.built.media,
      directCandidateSha256: first.built.candidateSha256,
      declarativeCandidateSha256: selected.built.candidateSha256,
      semanticDigest: first.candidate.input.semanticDigest,
      relocatedArtifactBytesIdentical: true,
      sourceAndEditorialInputsUnchanged: true,
      sourceAndEditorialDirectoryListingsUnchanged: true,
      directedRelation: { source: 'Alpha', target: 'Beta', direction: 'forward' },
      changedSourceRejectedBeforeOutput: true,
      scope: 'Installed offline construction and exact relocation, not visual or source approval.',
    }),
  );
});
