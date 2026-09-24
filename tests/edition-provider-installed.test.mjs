import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const fixture = new URL('./fixtures/providers/executable/', import.meta.url);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

async function waitForExit(pid) {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    if (!alive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return !alive(pid);
}

function run(command, args, cwd, env, timeout = 60_000) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout });
  assert.equal(result.error, undefined, result.error?.message);
  return result;
}

async function writePlan(root, name, value) {
  const file = path.join(root, `${name}.json`);
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  await fs.writeFile(file, bytes);
  return { file, digest: sha(bytes) };
}

test('packed Publisher executes a relocated Provider and reclaims a rejected descendant', async (t) => {
  const temporaryRoot = await fs.realpath(os.tmpdir());
  const work = await fs.mkdtemp(path.join(temporaryRoot, 'archpub-provider-installed-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const config = path.join(work, 'empty-user.npmrc');
  const globalConfig = path.join(work, 'empty-global.npmrc');
  const home = path.join(work, 'empty-home');
  const temporary = path.join(work, 'temporary');
  const cache = path.join(work, 'empty-cache');
  const consumer = path.join(work, 'consumer');
  const selected = path.join(work, 'selected');
  await Promise.all([
    fs.writeFile(config, ''),
    fs.writeFile(globalConfig, ''),
    fs.mkdir(home),
    fs.mkdir(temporary),
    fs.mkdir(cache),
    fs.mkdir(consumer),
    fs.cp(fixture, selected, { recursive: true }),
  ]);
  const npmEnv = {
    ...process.env,
    npm_config_userconfig: config,
    npm_config_globalconfig: globalConfig,
    npm_config_offline: 'true',
    npm_config_update_notifier: 'false',
    npm_config_audit: 'false',
    npm_config_cache: cache,
  };
  const packed = run(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
    publisher,
    npmEnv,
  );
  assert.equal(packed.status, 0, packed.stderr);
  const archive = parseNpmPackRecord(packed.stdout);
  assert.equal(archive.name, 'architecture-publisher');
  assert(archive.files.some(({ path: name }) => name === 'src/provider/worker-task.mjs'));
  const installed = run(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(work, archive.filename),
    ],
    consumer,
    npmEnv,
  );
  assert.equal(installed.status, 0, installed.stderr);
  const packageRoot = path.join(consumer, 'node_modules/architecture-publisher');
  const packageJson = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json')));
  const declared = JSON.parse(await fs.readFile(path.join(publisher, 'package.json')));
  assert.equal(packageJson.version, archive.version);
  assert.deepEqual(packageJson.dependencies ?? {}, declared.dependencies ?? {});
  const authoring = await import(pathToFileURL(path.join(packageRoot, 'src/edition/index.mjs')));
  assert.equal(typeof authoring.validateBuildRequest, 'function');
  assert.throws(() => authoring.validateBuildRequest({}), { code: 'build_request_invalid' });
  const cli = path.join(packageRoot, 'src/cli/main.mjs');
  const cliEnv = {
    HOME: home,
    PATH: home,
    TMPDIR: temporary,
    TEMP: temporary,
    TMP: temporary,
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const manifestFile = path.join(selected, 'provider.json');
  const manifestBytes = await fs.readFile(manifestFile);
  const manifest = JSON.parse(manifestBytes);
  const commonPlan = {
    providerManifest: 'selected/provider.json',
    providerPackageRoot: 'selected/package',
  };
  const successPlan = await writePlan(work, 'success-plan', {
    ...commonPlan,
    providerManifestSha256: sha(manifestBytes),
    output: 'success-output',
  });
  const success = run(
    process.execPath,
    [cli, 'edition', 'build', successPlan.file, '--sha256', successPlan.digest],
    consumer,
    cliEnv,
  );
  assert.equal(success.status, 0, success.stdout + success.stderr);
  const built = JSON.parse(success.stdout);
  assert.equal(built.status, 'built');
  assert.equal(built.semanticDigest, manifest.expected.claimModelDigest);
  assert.equal(built.editionDigest, manifest.expected.editionDigest);
  assert.match(built.candidateSha256, /^[a-f0-9]{64}$/u);
  const receiptBytes = await fs.readFile(path.join(work, 'success-output/provider.json'));
  assert.equal(sha(receiptBytes), built.providerMaterializationSha256);
  const receipt = JSON.parse(receiptBytes);
  assert.equal(receipt.delivery, 'executable');
  assert.equal(
    receipt.inputs.find(({ id }) => id === 'provider-package').sha256,
    manifest.delivery.package.contentSha256,
  );

  const inputFile = path.join(selected, 'inputs/source.json');
  const source = JSON.parse(await fs.readFile(inputFile));
  const marker = path.join(work, 'descendant.pid');
  source.scenario = 'descendant-timeout';
  source.markerPath = marker;
  const inputBytes = Buffer.from(JSON.stringify(source, null, 2) + '\n');
  await fs.writeFile(inputFile, inputBytes);
  manifest.delivery.inputs[0].bytes = inputBytes.length;
  manifest.delivery.inputs[0].sha256 = sha(inputBytes);
  const rejectedManifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  await fs.writeFile(manifestFile, rejectedManifestBytes);
  const rejectedPlan = await writePlan(work, 'rejected-plan', {
    ...commonPlan,
    providerManifestSha256: sha(rejectedManifestBytes),
    output: 'rejected-output',
  });
  const before = await fs.readdir(temporary);
  const sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
    windowsHide: true,
  });
  let descendantPid;
  try {
    const rejected = run(
      process.execPath,
      [cli, 'edition', 'build', rejectedPlan.file, '--sha256', rejectedPlan.digest],
      consumer,
      cliEnv,
    );
    assert.equal(rejected.status, 1, rejected.stdout + rejected.stderr);
    assert.equal(JSON.parse(rejected.stdout).error.code, 'edition_provider_timeout');
    descendantPid = Number(await fs.readFile(marker, 'utf8'));
    assert.equal(await waitForExit(descendantPid), true, 'installed Provider leaked a descendant');
    assert.equal(alive(sentinel.pid), true, 'unrelated sentinel was killed');
    await assert.rejects(fs.access(path.join(work, 'rejected-output')), { code: 'ENOENT' });
    assert.deepEqual(await fs.readdir(temporary), before);
  } finally {
    if (descendantPid && alive(descendantPid)) process.kill(descendantPid, 'SIGKILL');
    if (alive(sentinel.pid)) sentinel.kill('SIGKILL');
  }
});
