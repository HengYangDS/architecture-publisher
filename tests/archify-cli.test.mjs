import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { serviceTopology } from './fixtures/diagrams.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (b) => createHash('sha256').update(b).digest('hex');
test('installed render CLI works offline and rejects corrupted renderer supply', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const out = await fs.mkdtemp(path.join(base, 'packed render '));
  t.after(() => fs.rm(out, { recursive: true, force: true }));
  const run = (cmd, args, cwd = root) => {
    const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout;
  };
  const pack = JSON.parse(
    run('npm', [
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      out,
    ]),
  )[0];
  const consumer = path.join(out, 'consumer');
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
      path.join(out, pack.filename),
    ],
    consumer,
  );
  const home = path.join(out, 'home');
  await fs.mkdir(home);
  const pkg = path.join(consumer, 'node_modules/architecture-publishing'),
    cli = path.join(pkg, 'src/cli/main.mjs');
  const input = path.join(out, 'service.json'),
    output = path.join(out, 'service.html');
  const content = Buffer.from(JSON.stringify(serviceTopology()));
  await fs.writeFile(input, content);
  const args = [
    'render',
    'architecture',
    input,
    '--sha256',
    sha(content),
    '--output',
    output,
  ];
  const invoke = (a) =>
    spawnSync(process.execPath, [cli, ...a], {
      cwd: consumer,
      encoding: 'utf8',
      env: { HOME: home, PATH: home },
    });
  const rendered = invoke(args);
  assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
  assert.equal(JSON.parse(rendered.stdout).status, 'rendered');
  assert.equal(
    JSON.parse(rendered.stdout).artifact.sha256,
    sha(await fs.readFile(output)),
  );
  for (const [name, type] of [
    ['service-topology', 'architecture'],
    ['job-lifecycle', 'lifecycle'],
  ]) {
    const source = path.join(pkg, 'examples', name + '.json'),
      data = await fs.readFile(source),
      target = path.join(out, name + '.html');
    const example = invoke([
      'render',
      type,
      source,
      '--sha256',
      sha(data),
      '--output',
      target,
    ]);
    assert.equal(example.status, 0, example.stdout + example.stderr);
    assert.equal(JSON.parse(example.stdout).nativeValidation.checksPassed, 9);
  }
  const font = path.join(pkg, 'assets/fonts/JetBrainsMono-Regular.ttf'),
    originalFont = await fs.readFile(font);
  await fs.appendFile(font, 'tamper');
  const missingFont = invoke([
    ...args.slice(0, -1),
    path.join(out, 'invalid-font.html'),
  ]);
  assert.equal(missingFont.status, 1);
  assert.equal(
    JSON.parse(missingFont.stdout).error.code,
    'render_font_supply_invalid',
  );
  await fs.writeFile(font, originalFont);
  const bad = serviceTopology();
  bad.components[0].type = 'unsupported';
  const badBytes = Buffer.from(JSON.stringify(bad));
  await fs.writeFile(input, badBytes);
  const rejected = invoke([
    'render',
    'architecture',
    input,
    '--sha256',
    sha(badBytes),
    '--output',
    path.join(out, 'bad.html'),
  ]);
  assert.equal(rejected.status, 1);
  assert(JSON.parse(rejected.stdout).error.diagnostics.length > 0);
  await fs.writeFile(input, content);
  await fs.appendFile(
    path.join(pkg, 'assets/archify/renderers/shared/utils.mjs'),
    '\n// modified\n',
  );
  const tampered = invoke([
    ...args.slice(0, -1),
    path.join(out, 'tampered.html'),
  ]);
  assert.equal(tampered.status, 1);
  assert.equal(JSON.parse(tampered.stdout).error.code, 'render_supply_invalid');
  assert.equal(invoke(['render']).status, 2);
});
