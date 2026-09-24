import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseNpmPackRecord } from './npm-pack-report.mjs';

function run(command, args, cwd, timeout = 60000) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout,
    env: {
      ...process.env,
      npm_config_offline: 'true',
      npm_config_update_notifier: 'false',
      npm_config_audit: 'false',
    },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}

function archive(directory, result) {
  return path.join(directory, parseNpmPackRecord(result.stdout).filename);
}

export async function installCoreAndSelf(root, directory) {
  const core = run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', directory],
      path.join(root, 'packages/publisher'),
    ),
    extension = run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', directory],
      path.join(root, 'editions/self'),
    ),
    consumer = path.join(directory, 'consumer');
  await fs.mkdir(consumer);
  run(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      archive(directory, core),
      archive(directory, extension),
    ],
    consumer,
  );
  return {
    consumer,
    coreRoot: path.join(consumer, 'node_modules/architecture-publisher'),
    selfRoot: path.join(consumer, 'node_modules/@architecture-publisher/self-edition'),
    core: parseNpmPackRecord(core.stdout),
    extension: parseNpmPackRecord(extension.stdout),
  };
}
