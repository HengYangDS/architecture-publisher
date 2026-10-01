import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import {
  alpha3CandidateDigest,
  alpha3QualificationDigest,
  alpha3ReleaseFiles,
  declarativeV1Files,
} from './fixtures/historical-release.mjs';

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
  const result = spawnNativeSync(command, args, {
    cwd,
    env,
    input: '',
    encoding: 'utf8',
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
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
  const providerContract = await import(
    pathToFileURL(path.join(packageRoot, 'src/provider/index.mjs'))
  );
  assert.equal(
    providerContract.validateEditionProvider(manifest).schema,
    'architecture.edition-provider/v1',
  );
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

test('packed work-lane Publisher replays historical v1 contracts offline', async (t) => {
  const work = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-installed-migration-'),
  );
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const consumer = path.join(work, 'consumer');
  const selected = path.join(work, 'selected');
  const home = path.join(work, 'empty-home');
  const temporary = path.join(work, 'temporary');
  const cache = path.join(work, 'empty-cache');
  const userConfig = path.join(work, 'empty-user.npmrc');
  const globalConfig = path.join(work, 'empty-global.npmrc');
  for (const directory of [consumer, selected, home, temporary, cache]) await fs.mkdir(directory);
  await fs.writeFile(userConfig, '');
  await fs.writeFile(globalConfig, '');
  const declarative = path.join(selected, 'declarative');
  const released = path.join(selected, 'alpha3-release');
  await fs.cp(new URL('./fixtures/providers/declarative/valid/', import.meta.url), declarative, {
    recursive: true,
  });
  await fs.cp(new URL('./fixtures/migration/alpha3-release/', import.meta.url), released, {
    recursive: true,
  });
  for (const [relative, expected] of Object.entries(declarativeV1Files))
    assert.equal(sha(await fs.readFile(path.join(declarative, relative))), expected, relative);
  for (const [relative, expected] of Object.entries(alpha3ReleaseFiles))
    assert.equal(sha(await fs.readFile(path.join(released, relative))), expected, relative);

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
  const packed = run(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
    publisher,
    npmEnv,
  );
  assert.equal(packed.status, 0, packed.stderr);
  const archive = parseNpmPackRecord(packed.stdout);
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
  const installedRoot = path.join(consumer, 'node_modules/architecture-publisher');
  assert((await fs.stat(path.join(installedRoot, 'package.json'))).isFile());

  const script = String.raw`import fs from 'node:fs/promises';
import path from 'node:path';
import { readSourceBundle } from 'architecture-publisher/source';
import { validateClaimModel, claimModelDigest } from 'architecture-publisher/semantics';
import { validateEdition, editionDigest } from 'architecture-publisher/edition';
import { validateEditionProvider } from 'architecture-publisher/provider';
import {
  validateEditionCandidateBinding,
  editionCandidateDigest,
} from 'architecture-publisher/compiler';
import {
  admitQualificationSet,
  qualificationSetDigest,
} from 'architecture-publisher/qualification';

const [declarative, released] = process.argv.slice(1);
const provider = validateEditionProvider(
  JSON.parse(await fs.readFile(path.join(declarative, 'provider.json'))),
);
const source = await readSourceBundle(
  path.join(declarative, provider.delivery.sourceManifest),
  provider.delivery.sourceManifestSha256,
);
const member = source.members.find(
  ({ path: selected }) => selected === provider.delivery.semanticMember,
);
if (!member) throw new Error('selected semantic member missing');
const model = validateClaimModel(JSON.parse(member.content));
const edition = validateEdition(
  model,
  JSON.parse(await fs.readFile(path.join(declarative, provider.delivery.edition))),
);
const changed = structuredClone(edition);
changed.scenes.static.authoredInputSha256 = 'f'.repeat(64);
const authoredChangesIdentity =
  editionDigest(model, validateEdition(model, changed)) !== editionDigest(model, edition);

const releasedModel = validateClaimModel(
  JSON.parse(await fs.readFile(path.join(released, 'claim-model.json'))),
);
const releasedEdition = validateEdition(
  releasedModel,
  JSON.parse(await fs.readFile(path.join(released, 'edition.json'))),
);
const candidate = validateEditionCandidateBinding(
  releasedModel,
  releasedEdition,
  JSON.parse(await fs.readFile(path.join(released, 'candidate.json'))),
);
const qualification = JSON.parse(await fs.readFile(path.join(released, 'qualification.json')));
const admitted = admitQualificationSet(releasedModel, releasedEdition, candidate, qualification);
process.stdout.write(JSON.stringify({
  providerSchema: provider.schema,
  sourceSha256: source.manifestSha256,
  sourceScope: source.scope,
  modelDigest: claimModelDigest(model),
  editionDigest: editionDigest(model, edition),
  candidateDigest: editionCandidateDigest(candidate),
  qualificationDigest: qualificationSetDigest(qualification),
  verdict: admitted.verdict,
  admitted: admitted.admitted,
  authoredChangesIdentity,
}));`;
  const childEnv = {
    HOME: home,
    PATH: home,
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const replay = run(
    process.execPath,
    ['--input-type=module', '-e', script, declarative, released],
    consumer,
    childEnv,
  );
  assert.equal(replay.status, 0, replay.stderr);
  const result = JSON.parse(replay.stdout);
  const provider = JSON.parse(await fs.readFile(path.join(declarative, 'provider.json')));
  assert.equal(result.providerSchema, 'architecture.edition-provider/v1');
  assert.equal(result.sourceSha256, provider.expected.sourceManifestSha256);
  assert.equal(result.sourceScope, 'source-file-integrity');
  assert.equal(result.modelDigest, provider.expected.claimModelDigest);
  assert.equal(result.editionDigest, provider.expected.editionDigest);
  assert.equal(result.candidateDigest, alpha3CandidateDigest);
  assert.equal(result.qualificationDigest, alpha3QualificationDigest);
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.admitted, true);
  assert.equal(result.authoredChangesIdentity, true);

  const candidateFile = path.join(released, 'candidate.json');
  const tampered = JSON.parse(await fs.readFile(candidateFile));
  tampered.claimModel.digest = '0'.repeat(64);
  await fs.writeFile(candidateFile, JSON.stringify(tampered) + '\n');
  const rejected = run(
    process.execPath,
    ['--input-type=module', '-e', script, declarative, released],
    consumer,
    childEnv,
  );
  assert.notEqual(rejected.status, 0);
  assert.equal(rejected.stdout, '');
  assert.match(rejected.stderr, /candidate_claim_model_mismatch/u);
});
