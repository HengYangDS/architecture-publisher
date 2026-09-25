import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { selectedNativeEdition } from './fixtures/selected-native-edition.mjs';

const publisher = fileURLToPath(new URL('../packages/publisher/', import.meta.url));

function child(command, args, cwd, env, timeoutMs = 60_000) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    input: '',
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

test('a packed offline consumer builds both media after relocation without source repositories', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-pair-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const home = path.join(work, 'home');
  const consumer = path.join(work, 'consumer');
  const userConfig = path.join(work, 'user.npmrc');
  const globalConfig = path.join(work, 'global.npmrc');
  await fs.mkdir(home);
  await fs.mkdir(consumer);
  await fs.writeFile(userConfig, '');
  await fs.writeFile(globalConfig, '');
  const npmEnvironment = {
    ...process.env,
    HOME: home,
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: path.join(work, 'cache'),
    npm_config_offline: 'true',
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  };
  const archiveName = parseNpmPackRecord(
    child(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
      publisher,
      npmEnvironment,
    ),
  ).filename;
  child(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(work, archiveName),
    ],
    consumer,
    npmEnvironment,
  );
  await fs.cp(fixture.root, path.join(consumer, 'inputs'), { recursive: true });
  await fs.rm(fixture.root, { recursive: true, force: true });
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
  const run = (root) => {
    const input = path.join(root, 'inputs/build-request.json');
    const output = path.join(root, 'candidate');
    const cli = path.join(root, 'node_modules/architecture-publisher/src/cli/main.mjs');
    return JSON.parse(
      child(
        process.execPath,
        [cli, 'edition', 'build', input, '--sha256', fixture.digest, '--output', output],
        root,
        nodeEnvironment,
      ),
    );
  };
  const first = run(consumer);
  assert.equal(first.status, 'built');
  const candidateBytes = await fs.readFile(path.join(consumer, 'candidate/candidate.json'));
  assert.equal(JSON.parse(candidateBytes).schema, 'architecture.edition-candidate/v2');
  const relocated = path.join(work, 'relocated');
  await fs.cp(consumer, relocated, { recursive: true });
  await fs.rm(consumer, { recursive: true, force: true });
  await fs.rm(path.join(relocated, 'candidate'), { recursive: true, force: true });
  const second = run(relocated);
  assert.equal(second.candidateSha256, first.candidateSha256);
  assert.deepEqual(
    await fs.readFile(path.join(relocated, 'candidate/candidate.json')),
    candidateBytes,
  );
  const verifier = path.join(relocated, 'verify.mjs');
  await fs.writeFile(
    verifier,
    `import { verifySelectedCandidateReplay } from 'architecture-publisher/qualification';
const result = await verifySelectedCandidateReplay({
  requestPath: process.argv[2], requestSha256: process.argv[3],
  candidateManifestPath: process.argv[4], candidateManifestSha256: process.argv[5],
});
console.log(JSON.stringify(result));
`,
  );
  const replay = JSON.parse(
    child(
      process.execPath,
      [
        verifier,
        path.join(relocated, 'inputs/build-request.json'),
        fixture.digest,
        second.manifestPath,
        second.manifestSha256,
      ],
      relocated,
      nodeEnvironment,
    ),
  );
  assert.equal(replay.verdict, 'match');
  assert.equal(replay.candidateSha256, second.candidateSha256);
  assert.equal(replay.qualification, 'not-performed');
});
