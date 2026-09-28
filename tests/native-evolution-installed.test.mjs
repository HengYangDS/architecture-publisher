import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import {
  executableModelProvider,
  moveModelToProvider,
  selectedNativeEdition,
  sha,
} from './fixtures/selected-native-edition.mjs';

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

test('offline installed evolution compares relocated native inputs and rejects changed pins', async (t) => {
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-evolution-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const home = path.join(work, 'home');
  const cache = path.join(work, 'cache');
  const userConfig = path.join(work, 'user.npmrc');
  const globalConfig = path.join(work, 'global.npmrc');
  await fs.mkdir(home);
  await fs.writeFile(userConfig, '');
  await fs.writeFile(globalConfig, '');
  const npmEnvironment = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith('npm_config_')),
    ),
    HOME: home,
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: cache,
    npm_config_offline: 'true',
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

  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const changedModel = Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'"));
  await fs.writeFile(path.join(after.root, 'sources/model.c4'), changedModel);
  after.request.sources[0].input.sha256 = sha(changedModel);
  const afterRequest = Buffer.from(JSON.stringify(after.request) + '\n');
  await fs.writeFile(after.file, afterRequest);
  after.digest = sha(afterRequest);

  const inputs = path.join(consumer, 'inputs');
  await fs.cp(before.root, path.join(inputs, 'before'), { recursive: true });
  await fs.cp(after.root, path.join(inputs, 'after'), { recursive: true });
  const plan = {
    schema: 'architecture.semantic-compare-input/v3',
    before: { request: { path: 'before/build-request.json', sha256: before.digest } },
    after: { request: { path: 'after/build-request.json', sha256: after.digest } },
  };
  const planBytes = Buffer.from(JSON.stringify(plan) + '\n');
  await fs.writeFile(path.join(inputs, 'comparison.json'), planBytes);
  const digest = sha(planBytes);
  const installedManifest = JSON.parse(
    await fs.readFile(
      path.join(consumer, 'node_modules/architecture-publisher/package.json'),
      'utf8',
    ),
  );
  assert.equal(installedManifest.name, 'architecture-publisher');
  assert.equal(typeof installedManifest.bin.archpub, 'string');
  const cliRelative = installedManifest.bin.archpub;
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
  const run = (
    directory,
    expectedStatus = 0,
    relativePlan = 'inputs/comparison.json',
    selectedDigest = digest,
    extraArgs = [],
  ) =>
    JSON.parse(
      child(
        process.execPath,
        [
          path.join(directory, 'node_modules/architecture-publisher', cliRelative),
          'evolution',
          'plan',
          path.join(directory, relativePlan),
          '--sha256',
          selectedDigest,
          ...extraArgs,
        ],
        directory,
        nodeEnvironment,
        expectedStatus,
      ).trim(),
    );
  const first = run(consumer);
  assert.equal(first.schema, 'architecture.semantic-change/v3');
  assert.deepEqual(first.delta.native.sourceBytes.changed, ['fixture/model']);
  assert.deepEqual(first.editions.changed, ['selected-atlas']);
  assert.equal(first.obligations.acceptance.length, 1);
  assert.equal(first.obligations.publication.length, 1);

  const relocated = path.join(work, 'relocated');
  await fs.rename(consumer, relocated);
  assert.deepEqual(run(relocated), first);

  const executable = [];
  for (const side of ['before', 'after']) {
    const root = path.join(relocated, `inputs/executable-${side}`);
    await fs.cp(path.join(relocated, 'inputs/before'), root, { recursive: true });
    const fixture = {
      ...before,
      root,
      file: path.join(root, 'build-request.json'),
      request: structuredClone(before.request),
    };
    const selected = await executableModelProvider(fixture);
    executable.push({ fixture, selected });
  }
  const [executableBefore, executableAfter] = executable;
  const executionPlan = {
    schema: 'architecture.semantic-compare-input/v3',
    before: {
      request: {
        path: 'executable-before/build-request.json',
        sha256: executableBefore.fixture.digest,
      },
    },
    after: {
      request: {
        path: 'executable-after/build-request.json',
        sha256: executableAfter.fixture.digest,
      },
    },
  };
  const executionPlanBytes = Buffer.from(JSON.stringify(executionPlan) + '\n');
  await fs.writeFile(path.join(relocated, 'inputs/execution-comparison.json'), executionPlanBytes);
  const execution = run(relocated, 0, 'inputs/execution-comparison.json', sha(executionPlanBytes), [
    '--execute-before-providers',
    `model-provider@${executableBefore.selected.manifestSha256}`,
    '--execute-after-providers',
    `model-provider@${executableAfter.selected.manifestSha256}`,
  ]);
  assert.equal(execution.delta.native.hasChanges, false);
  assert.deepEqual(execution.delta.execution.providerPackages.added, []);
  assert.deepEqual(execution.delta.execution.providerPackages.removed, []);
  assert.deepEqual(
    execution.delta.execution.providerPackages.changed.map(({ id }) => id),
    ['model-provider'],
  );
  assert.deepEqual(execution.obligations.mediumVerification, []);
  assert.deepEqual(execution.obligations.humanReview, []);
  assert.deepEqual(execution.obligations.semanticVerification[0].questions, ['shape']);

  const providerRoot = path.join(relocated, 'inputs/after-provider');
  await fs.cp(path.join(relocated, 'inputs/after'), providerRoot, { recursive: true });
  const providerAfter = {
    ...after,
    root: providerRoot,
    file: path.join(providerRoot, 'build-request.json'),
    request: structuredClone(after.request),
  };
  await moveModelToProvider(providerAfter, changedModel);
  const providerPlan = {
    ...plan,
    after: {
      request: { path: 'after-provider/build-request.json', sha256: providerAfter.digest },
    },
  };
  const providerPlanBytes = Buffer.from(JSON.stringify(providerPlan) + '\n');
  await fs.writeFile(path.join(relocated, 'inputs/provider-comparison.json'), providerPlanBytes);
  const providerDigest = sha(providerPlanBytes);
  assert.deepEqual(run(relocated, 0, 'inputs/provider-comparison.json', providerDigest), first);
  const tamperedProviderModel = Buffer.from(changedModel);
  tamperedProviderModel[0] = 0x78;
  await fs.writeFile(path.join(providerRoot, 'provider/model.c4'), tamperedProviderModel);
  const providerRejected = run(relocated, 1, 'inputs/provider-comparison.json', providerDigest);
  assert.equal(providerRejected.status, 'error');
  assert.equal(providerRejected.error.code, 'edition_provider_v2_member_digest_mismatch');

  await fs.appendFile(path.join(relocated, 'inputs/after/sources/model.c4'), '\n');
  const rejected = run(relocated, 1);
  assert.equal(rejected.status, 'error');
  assert.equal(rejected.error.code, 'materialized_pin_mismatch');
});
