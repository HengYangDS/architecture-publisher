import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

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
  return path.join(directory, JSON.parse(result.stdout)[0].filename);
}

export async function installCoreAndEthos(root, directory) {
  const core = run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', directory],
      path.join(root, 'packages/publisher'),
    ),
    extension = run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', directory],
      path.join(root, 'packages/extensions/ethos'),
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
  const coreRoot = path.join(
      consumer,
      'node_modules/architecture-publisher',
    ),
    ethosRoot = path.join(
      consumer,
      'node_modules/@architecture-publisher/ethos',
    );
  return {
    consumer,
    coreRoot,
    ethosRoot,
    core: JSON.parse(core.stdout)[0],
    extension: JSON.parse(extension.stdout)[0],
  };
}

export async function runInstalledExport({
  consumer,
  module,
  name,
  args,
  cwd,
  env = {},
  timeout = 120000,
}) {
  const driver = path.join(consumer, `invoke-${name}.mjs`);
  const specifier = path.isAbsolute(module)
    ? pathToFileURL(module).href
    : module;
  await fs.writeFile(
    driver,
    [
      `import { ${name} } from ${JSON.stringify(specifier)};`,
      'try {',
      `  const result = await ${name}(...JSON.parse(process.argv[2]));`,
      "  process.stdout.write(JSON.stringify(result) + '\\n');",
      '} catch (error) {',
      "  process.stdout.write(JSON.stringify({status:'error',error:{code:error.code ?? 'operation_failed',message:error.message}}) + '\\n');",
      '  process.exitCode = 1;',
      '}',
      '',
    ].join('\n'),
  );
  return spawnSync(process.execPath, [driver, JSON.stringify(args)], {
    cwd,
    encoding: 'utf8',
    timeout,
    env: { HOME: cwd, PATH: cwd, LANG: 'C.UTF-8', ...env },
  });
}
