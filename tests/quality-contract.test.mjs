import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';
import { npmInvocation } from './fixtures/npm-pack-report.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('native package-manager admission rejects a mismatched toolchain before scripts', async (t) => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const selected = workspace.devEngines;
  assert.equal(selected?.runtime.name, 'node');
  assert.equal(
    selected.runtime.version,
    (await fs.readFile(path.join(root, '.node-version'), 'utf8')).trim(),
  );
  assert.equal(selected.runtime.onFail, 'error');
  assert.equal(selected.packageManager.name, 'npm');
  assert.equal(workspace.packageManager, `npm@${selected.packageManager.version}`);
  assert.equal(selected.packageManager.onFail, 'error');
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-dev-engine-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const marker = path.join(scratch, 'ran');
  const probe = "node -e \"require('node:fs').writeFileSync('ran','selected')\"";
  const invoke = npmInvocation(['run', 'probe']);
  const options = {
    cwd: scratch,
    encoding: 'utf8',
    timeout: 30_000,
    stdio: 'pipe',
    env: { ...process.env, npm_config_cache: path.join(scratch, 'npm-cache') },
  };
  for (const kind of ['runtime', 'packageManager']) {
    const rejected = structuredClone(selected);
    rejected[kind].version = '0.0.0';
    await fs.writeFile(
      path.join(scratch, 'package.json'),
      JSON.stringify({ private: true, devEngines: rejected, scripts: { probe } }),
    );
    assert.throws(() => execFileSync(invoke.command, invoke.args, options), /EBADDEVENGINES/u);
    await assert.rejects(fs.access(marker), { code: 'ENOENT' });
  }
  await fs.writeFile(
    path.join(scratch, 'package.json'),
    JSON.stringify({ private: true, devEngines: selected, scripts: { probe } }),
  );
  execFileSync(invoke.command, invoke.args, options);
  assert.equal(await fs.readFile(marker, 'utf8'), 'selected');
});

test('Linux verification keeps the common gate and separates trust roles', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-linux'];
  assert.equal(native?.stage, 'verify');
  assert.equal(native.resource_group, undefined);
  assert.equal(native.script.at(-1), 'npm run check');
  assert(native.script.includes('npm ci --ignore-scripts --no-audit --no-fund'));
  assert(
    native.script.includes('npm install --global npm@12.2.0 --ignore-scripts --no-audit --no-fund'),
  );
  for (const role of ['review', 'protected']) {
    const job = pipeline[`verify:linux:${role}`];
    assert.equal(job.extends, '.verify-linux');
    assert.equal(job.script, undefined);
    assert.deepEqual(job.tags, [
      `ci-linux-arm64-container${role === 'protected' ? '-protected' : ''}`,
    ]);
  }
  assert.deepEqual(pipeline['verify:linux:review'].rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_REF_PROTECTED != "true" && $CI_COMMIT_BRANCH' },
  ]);
  assert.deepEqual(pipeline['verify:linux:protected'].rules, [
    { if: '$CI_COMMIT_REF_PROTECTED == "true"' },
  ]);
});

test('native Windows verification runs the whole quality graph with separate trust roles', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-windows'];
  assert.equal(native?.stage, 'verify');
  assert.equal(native.image, null);
  assert.equal(native.resource_group, 'native-windows-verification');
  assert.equal(native.timeout, '30m');
  assert.equal(native.script.at(-1), 'npm run check');
  assert(native.script.includes('npm ci --ignore-scripts --no-audit --no-fund'));
  assert(native.script.includes('git --version'));
  for (const role of ['review', 'protected']) {
    const job = pipeline[`verify:windows:${role}`];
    assert.equal(job.extends, '.verify-windows');
    assert.equal(job.script, undefined);
    assert.equal(job.resource_group, undefined);
    assert.deepEqual(job.tags, [`ci-windows-arm64-${role === 'review' ? 'review' : 'shell'}`]);
  }
  assert.deepEqual(pipeline['verify:windows:review'].rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_REF_PROTECTED != "true" && $CI_COMMIT_BRANCH' },
  ]);
  assert.deepEqual(pipeline['verify:windows:protected'].rules, [
    { if: '$CI_COMMIT_REF_PROTECTED == "true"' },
  ]);
});

test('native macOS verification shares one project resource without merging trust roles', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-macos'];
  assert.equal(typeof native.resource_group, 'string');
  assert(native.resource_group.trim());
  assert.equal(pipeline['.verify-linux'].resource_group, undefined);
  const review = pipeline['verify:macos:review'];
  const protectedJob = pipeline['verify:macos:protected'];
  for (const job of [review, protectedJob]) {
    assert.equal(job.extends, '.verify-macos');
    assert.equal(job.resource_group, undefined);
    assert.equal(job.script, undefined);
  }
  assert.deepEqual(review.tags, ['ci-macos-arm64-review']);
  assert.deepEqual(protectedJob.tags, ['ci-macos-arm64-shell']);
  assert.deepEqual(review.rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_REF_PROTECTED != "true" && $CI_COMMIT_BRANCH' },
  ]);
  assert.deepEqual(protectedJob.rules, [{ if: '$CI_COMMIT_REF_PROTECTED == "true"' }]);
});

test('one fail-closed quality entry point covers the repository contract', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  assert.equal(
    manifest.scripts.test,
    'node --import=./tests/fixtures/npm-environment.mjs --test --test-concurrency=2 tests/*.test.mjs',
  );
  assert.equal(
    manifest.scripts.check,
    'npm run check:static && npm run test:coverage && npm run check:package',
  );
  assert.equal(
    manifest.scripts['check:static'],
    'npm run check:generated && npm run check:format && npm run check:lint && npm run check:types && npm run check:imports && npm run check:dead-code && npm run check:docs && npm run check:spec',
  );
  assert.equal(
    manifest.scripts['check:generated'],
    'node tools/generate-authoring-validators.mjs --check && node tools/supply/likec4.mjs --check && node tools/supply/interactive.mjs --check && node tools/supply/elk.mjs --check && node tools/supply/dagre.mjs --check && node tools/supply/implementation.mjs --check',
  );
  assert.equal(manifest.scripts['check:format'], 'prettier --check .');
  assert.equal(manifest.scripts['check:lint'], 'eslint . --max-warnings 0');
  assert.equal(manifest.scripts['check:types'], 'tsc --project jsconfig.json --noEmit');
  assert.equal(manifest.scripts['check:imports'], 'node --test tests/module-boundaries.test.mjs');
  assert.equal(
    manifest.scripts['check:docs'],
    'markdownlint-cli2 "README.md" "CHANGELOG.md" "docs/**/*.md" "openspec/**/*.md" "skills/**/*.md" "#openspec/changes/archive/**"',
  );
  assert.equal(manifest.scripts['check:spec'], 'openspec validate --all --strict --no-interactive');
  assert.equal(manifest.scripts['test:coverage'], 'c8 --config .config/coverage.json npm test');
  const coverage = JSON.parse(await fs.readFile(path.join(root, '.config/coverage.json'), 'utf8'));
  assert.equal(coverage.all, true);
  assert.equal(coverage['check-coverage'], true);
  assert.deepEqual(coverage.include, [
    'packages/publisher/src/**/*.mjs',
    'packages/publisher/renderers/**/*.mjs',
    'editions/self/src/**/*.mjs',
  ]);
  assert.deepEqual(coverage.exclude, [
    'packages/publisher/src/edition/generated/**',
    'packages/publisher/renderers/**/supply/**',
  ]);
  assert.deepEqual(coverage.reporter, ['text', 'json-summary']);
  for (const dimension of ['statements', 'lines', 'branches', 'functions'])
    assert.equal(coverage[dimension], 95);
  assert.equal(manifest.scripts['check:package'], 'publint packages/publisher');

  assert.equal(manifest.devDependencies.c8, '12.0.0');
  for (const [name, version] of Object.entries(manifest.devDependencies))
    assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u, name);

  for (const file of [
    '.markdownlint-cli2.jsonc',
    '.prettierignore',
    '.prettierrc.json',
    'eslint.config.mjs',
    'jsconfig.json',
  ])
    assert((await fs.stat(path.join(root, file))).isFile(), file);
});

test('the selected LikeC4 parser supply uses the patched lodash-es release', async () => {
  const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
  const supply = JSON.parse(
    await fs.readFile(path.join(root, 'packages/publisher/supplies/likec4/supply.json'), 'utf8'),
  );
  const selected = lock.packages['node_modules/lodash-es'];
  assert.equal(selected?.version, '4.18.1');
  assert.equal(supply.packages.find(({ name }) => name === 'lodash-es')?.version, selected.version);
});

test('official OpenSpec apply instructions bind each task to its exact source checkbox', async (t) => {
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-task-source-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const change = path.join(work, 'openspec/changes/task-source');
  await fs.mkdir(change, { recursive: true });
  await fs.writeFile(
    path.join(change, '.openspec.yaml'),
    'schema: spec-driven\ncreated: 2026-10-01\n',
  );
  const taskFile = path.join(change, 'tasks.md');
  await fs.writeFile(
    taskFile,
    '# Tasks\n\n- [x] 1. Preserve accepted inputs.\n  - [ ] 1.1 Verify the selected receiver.\n- [ ] 2. Close source-owned adoption.\n',
  );
  const cli = path.join(root, 'node_modules/@fission-ai/openspec/bin/openspec.js');
  const instruction = JSON.parse(
    execFileSync(
      process.execPath,
      [
        cli,
        'instructions',
        'apply',
        '--change',
        'task-source',
        '--schema',
        'spec-driven',
        '--json',
      ],
      {
        cwd: work,
        encoding: 'utf8',
        timeout: 30_000,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          HOME: work,
          XDG_CONFIG_HOME: path.join(work, 'config'),
          CI: 'true',
          OPENSPEC_TELEMETRY: '0',
        },
      },
    ),
  );
  const lines = (await fs.readFile(taskFile, 'utf8')).split('\n');
  const checkboxes = lines.flatMap((line, index) => {
    const match = /^\s*- \[([ xX])\] (.+)$/u.exec(line);
    return match ? [{ line: index + 1, done: match[1] !== ' ', description: match[2] }] : [];
  });
  assert.equal(instruction.tasks.length, checkboxes.length);
  assert.equal(instruction.progress.total, checkboxes.length);
  for (const [index, task] of instruction.tasks.entries()) {
    assert.equal(typeof task.sourcePath, 'string', 'The official task source must be explicit');
    const source = path.isAbsolute(task.sourcePath)
      ? task.sourcePath
      : path.resolve(work, task.sourcePath);
    assert.equal(source, taskFile);
    assert.equal(task.line, checkboxes[index].line);
    assert.equal(task.done, checkboxes[index].done);
    assert.equal(task.description, checkboxes[index].description);
  }
});

test('coverage roots include all tracked first-party package runtime modules', () => {
  const tracked = execFileSync('git', ['ls-files', '--', 'packages/publisher', 'editions/self'], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter((file) => file.endsWith('.mjs'));
  for (const file of tracked) {
    if (/^packages\/publisher\/renderers\/[^/]+\/supply\//u.test(file)) continue;
    if (file === 'packages/publisher/supplies/likec4/parser.mjs') continue;
    assert.match(
      file,
      /^(?:packages\/publisher\/(?:src|renderers)\/|editions\/self\/src\/)/u,
      `${file} escapes the owned runtime coverage scope`,
    );
  }
});

test('the existing type-check project includes every Provider runtime module', async () => {
  const selected = new Set(
    execFileSync(
      process.execPath,
      [
        path.join(root, 'node_modules/typescript/bin/tsc'),
        '--project',
        'jsconfig.json',
        '--listFilesOnly',
      ],
      { cwd: root, encoding: 'utf8', timeout: 30_000 },
    )
      .trim()
      .split('\n')
      .map((file) => path.resolve(file.trim())),
  );
  const providers = execFileSync('git', ['ls-files', '--', 'packages/publisher/src/provider'], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter((file) => file.endsWith('.mjs'));
  assert(providers.length > 0);
  for (const file of providers) assert(selected.has(path.join(root, file)), file);

  // TypeScript resolves this declaration; Knip resolves its config name to the runtime package.
  assert(selected.has(path.join(root, 'node_modules/@types/punycode/index.d.ts')));
  const knip = JSON.parse(await fs.readFile(path.join(root, 'knip.json')));
  assert.deepEqual(knip.ignoreDependencies, ['@types/punycode']);
});

test('first-party code filenames describe responsibilities, not protocol generations', () => {
  const versionSuffix = /(?:^|[-_.])v\d+(?=[-_.]|$)/iu;
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter((file) => /\.(?:cjs|js|jsx|mjs|ts|tsx)$/u.test(file));
  for (const file of tracked) {
    if (/^packages\/publisher\/renderers\/[^/]+\/supply\//u.test(file)) continue;
    assert.doesNotMatch(path.posix.basename(file), versionSuffix, file);
  }
});

test('public package indexes enumerate exports instead of widening by wildcard', async () => {
  const manifests = ['packages/publisher', 'editions/self'];
  const files = new Set();
  for (const directory of manifests) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, directory, 'package.json')));
    for (const target of Object.values(manifest.exports))
      if (target.endsWith('.mjs')) files.add(path.posix.join(directory, target));
  }
  for (const file of files) {
    const source = await fs.readFile(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /export\s+\*/u, file);
  }
});

test('ETHOS projects non-overlapping repository quality gates from package scripts', async () => {
  const profile = await fs.readFile(path.join(root, '.ethos/profile.toml'), 'utf8');

  assert.match(
    profile,
    /code_correctness_gates = \["node-behavior", "node-static", "node-package"\]/u,
  );
  assert.match(profile, /behavior = "node-behavior"/u);
  assert.match(profile, /static-analysis = "node-static"/u);
  assert.equal(profile.match(/^\[\[proof\.gates\]\]$/gmu)?.length, 3);
  assert.match(profile, /command = \["npm", "run", "test:coverage"\]/u);
  assert.match(profile, /command = \["npm", "run", "check:static"\]/u);
  assert.match(profile, /command = \["npm", "run", "check:package"\]/u);
  assert.doesNotMatch(profile, /node-syntax/u);
});
