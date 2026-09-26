import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';
import { npmInvocation, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import {
  executableModelProvider,
  selectedNativeEdition,
  sha,
} from './fixtures/selected-native-edition.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function run(command, args, cwd, env = process.env) {
  const selected = command === 'npm' ? npmInvocation(args) : { command, args };
  const result = spawnSync(selected.command, selected.args, {
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
  const { consumer, coreRoot } = await installCoreAndSelf(root, installation);
  const providerArchive = parseNpmPackRecord(
    run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', installation],
      path.join(selected.root, 'provider/package'),
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
      path.join(installation, providerArchive.filename),
    ],
    consumer,
    { ...process.env, npm_config_offline: 'true', npm_config_update_notifier: 'false' },
  );
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
      ],
      consumer,
      {
        HOME: home,
        PATH: home,
        LANG: 'C.UTF-8',
        ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
      },
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
