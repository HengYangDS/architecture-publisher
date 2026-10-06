import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import npmPackage from 'npm/package.json' with { type: 'json' };
import { parse } from 'yaml';
import { main as lintMarkdown } from 'markdownlint-cli2';
import { applyFixes } from 'markdownlint-cli2/markdownlint';
import { lint } from 'markdownlint-cli2/markdownlint/promise';
import { getFileInfo, resolveConfig } from 'prettier';
import { npmInvocation } from './fixtures/npm-pack-report.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('the generated gate validates Raster before its dependent implementation closure', async () => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const steps = workspace.scripts['check:generated'].split(' && ');
  const raster = steps.indexOf('node tools/supply/resvg.mjs --check');
  const implementation = steps.indexOf('node tools/supply/implementation.mjs --check');
  assert(
    raster >= 0 && implementation > raster,
    'Raster supply must participate in the early dependency gate',
  );
});

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
  assert.equal(workspace.devDependencies.npm, selected.packageManager.version);
  assert.equal(npmPackage.version, selected.packageManager.version);
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

test('native workflow selects one review pipeline without skipping protected refs or tags', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  assert.deepEqual(pipeline.workflow?.rules, [
    { if: '$CI_PIPELINE_SOURCE == "merge_request_event"' },
    { if: '$CI_COMMIT_TAG || $CI_COMMIT_REF_PROTECTED == "true"' },
    {
      if: '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS',
      when: 'never',
    },
    { if: '$CI_COMMIT_BRANCH' },
  ]);
});

test('native CI binds browser and frozen Raster journeys before the whole quality gate', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-native'];
  assert.equal(native?.stage, 'verify');
  assert.equal(native.timeout, '60m');
  assert.equal(pipeline.variables?.MISE_ENV, 'ci');
  assert.equal(pipeline.variables?.MISE_LOCKED, '1');
  assert.equal(pipeline.variables?.MISE_DATA_DIR, '$CI_PROJECT_DIR/build/runtime/tool-cache/mise');
  assert.equal(
    pipeline.variables?.MISE_CACHE_DIR,
    `${pipeline.variables.MISE_DATA_DIR}/cache`,
    'native npm hardlinks remain inside the job-owned Mise cache and permission boundary',
  );
  assert.equal(pipeline.variables?.MISE_TRUSTED_CONFIG_PATHS, '$CI_PROJECT_DIR');
  const toolchain = await fs.readFile(path.join(root, '.config/mise.ci.toml'), 'utf8');
  assert.match(
    toolchain,
    /components = \[\s*"cargo",\s*"rustc",?\s*\]/u,
    'native Rust installation reconciles both required host compilers in a retained cache',
  );
  const toolchainLock = await fs.readFile(path.join(root, '.config/mise.ci.lock'), 'utf8');
  assert.equal(
    toolchainLock.match(/\[\[tools\.rust\]\]/gu)?.length,
    1,
    'one native lock entry owns the selected Rust toolchain',
  );
  assert.match(
    toolchainLock,
    /\[tools\.rust\.options\][\s\S]*components = "cargo,rustc"/u,
    'the native lock binds the required Rust component selection',
  );
  assert.equal(native.script.at(-1), 'mise exec -- npm run check');
  assert(native.script.includes('mise install'));
  assert(native.script.includes('mise exec -- npm ci --ignore-scripts --no-audit --no-fund'));
  assert(
    native.script.includes(
      'mise exec -- node node_modules/playwright-core/cli.js install chromium',
    ),
  );
  assert(
    native.script.includes(
      'mise exec -- node tools/raster/resvg/verify.mjs --registry-url > build/runtime/tool-cache/raster/source-url.txt',
    ),
  );
  const retrieval = native.script.find((command) => command.includes('--expand-url'));
  assert.match(retrieval, /--variable %CI_JOB_TOKEN/);
  assert.match(retrieval, /--expand-header/);
  assert.match(retrieval, /--max-time 180/);
  assert.doesNotMatch(retrieval, /\$\{?CI_JOB_TOKEN|\$env:CI_JOB_TOKEN/);
  assert(
    native.script.includes(
      'mise exec -- node tools/raster/resvg/verify.mjs --archive build/runtime/tool-cache/raster/source.tar.xz',
    ),
  );
  assert(
    native.script.includes(
      'mise exec -- node --test tests/conformance/journeys/raster/rebuild.test.mjs',
    ),
  );
  assert.doesNotMatch(
    native.script.join('\n'),
    /npm install --global|--no-sandbox|continue-on-error|\|\| true/,
  );
  assert.equal(native.artifacts?.when, 'always');
  const coverage = JSON.parse(
    await fs.readFile(path.join(root, '.config/checks/coverage.json'), 'utf8'),
  );
  const outputs = new Map([
    ['json-summary', 'coverage/coverage-summary.json'],
    ['json', 'coverage/coverage-final.json'],
  ]);
  assert.deepEqual(
    native.artifacts.paths,
    coverage.reporter
      .filter((reporter) => outputs.has(reporter))
      .map((reporter) => outputs.get(reporter)),
    'hosted artifact declarations match the selected coverage reporters',
  );
});

test('Linux verification keeps the common gate and separates trust roles', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-linux'];
  assert.equal(pipeline['.verify-native'].stage, 'verify');
  assert.equal(native.resource_group, undefined);
  assert.equal(native.extends, '.verify-native');
  assert.equal(native.variables.FF_USE_INIT_WITH_DOCKER_EXECUTOR, 'true');
  assert.equal(native.variables.FF_DISABLE_UMASK_FOR_DOCKER_EXECUTOR, 'true');
  assert(native.before_script.some((command) => command.includes('sha256sum --check')));
  assert(native.before_script.some((command) => command.includes('mise-v2026.10.2-linux-arm64')));
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

test('Linux image declares the non-root default inspected by Runner', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  assert.equal(
    pipeline.image.docker,
    undefined,
    'Runner ownership inspection must see the image default, not a late user override',
  );
  const recipe = await fs.readFile(path.join(root, '.config/ci/linux/Dockerfile'), 'utf8');
  const [base, user, ...extra] = recipe.trim().split('\n');
  assert.match(base, /^FROM mcr\.microsoft\.com\/playwright:v[0-9.]+-noble@sha256:[a-f0-9]{64}$/u);
  assert.equal(user, 'USER pwuser');
  assert.deepEqual(extra, [], 'the supply changes only the official image default user');
  assert.match(pipeline.image.name, /^\S+@sha256:[a-f0-9]{64}$/u);
  assert.notEqual(pipeline.image.name, base.slice('FROM '.length));
});

test('Linux native prerequisites use one locked rootless Pixi environment', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-linux'];
  const setup = native.before_script.join('\n');
  const toolchain = await fs.readFile(path.join(root, '.config/mise.ci.toml'), 'utf8');
  assert.match(
    toolchain,
    /pixi\s*=\s*\{\s*version\s*=\s*"0\.81\.0",\s*os\s*=\s*\["linux\/arm64"\]/,
  );
  assert.equal(
    native.variables.PIXI_HOME,
    '$CI_PROJECT_DIR/build/runtime/work/native-linux-prerequisites/home',
  );
  assert.equal(native.variables.PIXI_CACHE_DIR, '$CI_PROJECT_DIR/build/runtime/tool-cache/pixi');
  assert.match(setup, /cp \.config\/ci\/linux\/pixi\.toml \.config\/ci\/linux\/pixi\.lock/);
  assert.match(
    setup,
    /pixi shell-hook --locked --shell bash --manifest-path build\/runtime\/work\/native-linux-prerequisites\/pixi\.toml/,
  );
  assert.match(setup, /\. build\/runtime\/work\/native-linux-prerequisites\/activation\.bash/);
  assert.doesNotMatch(setup, /sudo|apt(?:-get)?|--no-sandbox|\|\| true/);
  const lock = parse(await fs.readFile(path.join(root, '.config/ci/linux/pixi.lock'), 'utf8'));
  assert.deepEqual(
    lock.platforms.map((platform) => platform.name),
    ['linux-aarch64'],
  );
  for (const entry of lock.packages) {
    assert.match(entry.conda, /^https:\/\/conda\.anaconda\.org\/conda-forge\//);
    assert.match(entry.sha256, /^[0-9a-f]{64}$/);
  }
});

test('native Windows verification runs the whole quality graph with separate trust roles', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-windows'];
  assert.equal(pipeline['.verify-native'].stage, 'verify');
  assert.equal(native.image, null);
  assert.equal(native.resource_group, 'native-windows-verification');
  assert.equal(native.timeout, '60m');
  assert.equal(native.variables?.GIT_STRATEGY, 'fetch');
  assert.equal(native.variables?.GIT_CLEAN_FLAGS, '-ffdx -e build/runtime/tool-cache/');
  assert.equal(native.extends, '.verify-native');
  assert(native.before_script.some((command) => command.includes("process.platform !== 'win32'")));
  assert.deepEqual(native.before_script, [
    'git checkout-index --all --force',
    '$env:PATH = (Join-Path $env:ProgramFiles "mise/bin") + [IO.Path]::PathSeparator + $env:PATH',
    "node -e \"if (process.platform !== 'win32' || process.arch !== 'arm64') process.exit(1)\"",
  ]);
  const execution = pipeline['.verify-native'].script;
  assert(execution.includes('mise install'));
  const rebuild = execution.indexOf(
    'mise exec -- node --test tests/conformance/journeys/raster/rebuild.test.mjs',
  );
  const quality = execution.indexOf('mise exec -- npm run check');
  assert(rebuild >= 0 && quality > rebuild, 'native compilation must precede full quality');
  for (const role of ['review', 'protected']) {
    const job = pipeline[`verify:windows:${role}`];
    assert.equal(job.extends, '.verify-windows');
    assert.equal(job.script, undefined);
    assert.equal(job.resource_group, undefined);
    assert.equal(job.variables?.GIT_STRATEGY, undefined);
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
  assert.equal(native.extends, '.verify-native');
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
    'node tools/generate-authoring-validators.mjs --check && node tools/supply/likec4.mjs --check && node tools/supply/interactive.mjs --check && node tools/supply/elk.mjs --check && node tools/supply/dagre.mjs --check && node tools/supply/icons.mjs --check && node tools/supply/resvg.mjs --check && node tools/supply/implementation.mjs --check',
  );
  assert.equal(manifest.scripts['check:format'], 'prettier --check .');
  assert.equal(manifest.scripts['check:lint'], 'eslint . --max-warnings 0');
  assert.equal(manifest.scripts['check:types'], 'tsc --project jsconfig.json --noEmit');
  assert.equal(manifest.scripts['check:imports'], 'node --test tests/module-boundaries.test.mjs');
  assert.equal(
    manifest.scripts['check:docs'],
    'markdownlint-cli2 --config .config/checks/markdownlint-cli2.jsonc',
  );
  assert.equal(manifest.scripts['check:spec'], 'openspec validate --all --strict --no-interactive');
  assert.equal(
    manifest.scripts['test:coverage'],
    'c8 --config .config/checks/coverage.json npm test',
  );
  const coverage = JSON.parse(
    await fs.readFile(path.join(root, '.config/checks/coverage.json'), 'utf8'),
  );
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
    '.config/checks/markdownlint-cli2.jsonc',
    '.config/checks/markdown.mjs',
    '.config/checks/knip.json',
    '.config/checks/prettier.json',
    '.prettierignore',
    'eslint.config.mjs',
    'jsconfig.json',
  ])
    assert((await fs.stat(path.join(root, file))).isFile(), file);
});

test('native formatter discovery retains one rule owner and preserved input boundaries', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.prettier, './.config/checks/prettier.json');
  assert.deepEqual(
    await resolveConfig(path.join(root, 'README.md')),
    JSON.parse(await fs.readFile(path.join(root, '.config/checks/prettier.json'), 'utf8')),
  );
  const ignorePath = [path.join(root, '.gitignore'), path.join(root, '.prettierignore')];
  for (const [file, ignored] of [
    ['.config/checks/prettier.json', false],
    ['tests/quality-contract.test.mjs', false],
    ['packages/publisher/renderers/archify/supply/archify.html', true],
    ['editions/self/src/edition/static/authoring/metrics.json', true],
    ['.config/mise/locks/mise.ci/npm-npm/12.2.0/aube-lock.yaml', true],
    ['.config/mise/locks/mise.ci/npm-npm/12.2.0/package.json', true],
    ['.config/ci/linux/pixi.lock', true],
    ['.config/ci/linux/pixi.toml', false],
  ])
    assert.equal((await getFileInfo(path.join(root, file), { ignorePath })).ignored, ignored, file);
});

test('the native documentation gate enforces one blank line across maintained Markdown', async (t) => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-markdown-spacing-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  await fs.mkdir(path.join(scratch, '.config/checks'), { recursive: true });
  for (const file of [
    '.config/checks/markdownlint-cli2.jsonc',
    '.config/checks/markdown.mjs',
    '.gitignore',
  ])
    await fs.copyFile(path.join(root, file), path.join(scratch, file));
  await fs.writeFile(
    path.join(scratch, 'package.json'),
    JSON.stringify({
      name: 'documentation-spacing-fixture',
      version: '1.0.0',
      scripts: { 'check:docs': workspace.scripts['check:docs'] },
    }),
  );
  const files = [
    'README.md',
    '.config/README.md',
    'packages/publisher/README.md',
    'editions/self/README.md',
    'tests/conformance/journeys/self-host/README.md',
    'examples/README.md',
    'docs/reference/guide.md',
    'openspec/changes/current/tasks.md',
    'openspec/changes/current/design.md',
    'openspec/changes/current/specs/owner/spec.md',
  ];
  const valid = '# Scope\n\nRead the selected contract.\n';
  for (const file of files) {
    await fs.mkdir(path.dirname(path.join(scratch, file)), { recursive: true });
    await fs.writeFile(path.join(scratch, file), valid);
  }
  const invoke = npmInvocation(['run', 'check:docs']);
  const options = {
    cwd: scratch,
    encoding: 'utf8',
    timeout: 30_000,
    stdio: 'pipe',
    env: {
      ...process.env,
      PATH: [path.join(root, 'node_modules/.bin'), process.env.PATH].join(path.delimiter),
      npm_config_cache: path.join(scratch, 'npm-cache'),
    },
  };
  const check = async () => {
    const diagnostics = [];
    const code = await lintMarkdown({
      directory: scratch,
      argv: ['--config', '.config/checks/markdownlint-cli2.jsonc'],
      logError: (message) => diagnostics.push(message),
    });
    return { code, diagnostics: diagnostics.join('\n') };
  };
  assert.equal((await check()).code, 0);
  for (const file of files) {
    await fs.writeFile(path.join(scratch, file), '# Scope\n\n\nRead the selected contract.\n');
    const result = await check();
    assert.equal(result.code, 1, file);
    assert.match(result.diagnostics, /MD012/u, file);
    await fs.writeFile(path.join(scratch, file), valid);
  }
  for (const source of [
    '# Scope\n\n- [ ] First task\n\n- [x] Second task\n',
    '# Scope\n\n- First item\n  with a wrapped paragraph.\n\n- Second item\n',
    '# Scope\n\n1. First item\n\n2. Second item\n',
    '# Scope\n\n- Group\n  - First item\n\n  - Second item\n',
    '# Scope\n\n> - First item\n>\n> - Second item\n',
    '<!-- markdownlint-disable compact-simple-lists -->\n\n# Scope\n\n- First item\n\n- Second item\n',
  ]) {
    await fs.writeFile(path.join(scratch, 'README.md'), source);
    const result = await check();
    assert.equal(result.code, 1);
    assert.match(result.diagnostics, /compact-simple-lists/u);
  }
  await fs.writeFile(
    path.join(scratch, 'README.md'),
    '<!-- markdownlint-disable MD012 -->\n\n# Scope\n\n\nRead the selected contract.\n',
  );
  const disabledRule = await check();
  assert.equal(disabledRule.code, 1);
  assert.match(disabledRule.diagnostics, /MD012/u);
  await fs.writeFile(
    path.join(scratch, 'README.md'),
    '# Scope\n\n```python\nclass First:\n    pass\n\n\nclass Second:\n    pass\n```\n',
  );
  for (const file of [
    '.git/ethos/runtime/dependency/README.md',
    'openspec/changes/archive/retained/spec.md',
    'tests/fixtures/source.md',
    'tests/conformance/fixtures/source.md',
    'packages/publisher/renderers/example/supply/README.md',
    'build/output.md',
    'node_modules/supplier/README.md',
  ]) {
    await fs.mkdir(path.dirname(path.join(scratch, file)), { recursive: true });
    await fs.writeFile(path.join(scratch, file), '# Retained bytes\n\n\nDo not format.\n');
  }
  assert.equal((await check()).code, 0, 'Language-significant spacing and retained inputs');
  for (const source of [
    '# Scope\n\n-\n\n- First paragraph\n\n  Second paragraph\n',
    '# Scope\n\n- First item\n\n  A separate paragraph.\n\n- Second item\n',
    '# Scope\n\n- Group\n\n  - First item\n  - Second item\n\n- Another group\n\n  ```python\n  def first():\n      pass\n\n\n  def second():\n      pass\n  ```\n',
  ]) {
    await fs.writeFile(path.join(scratch, 'README.md'), source);
    assert.equal((await check()).code, 0, 'Multi-block items retain their structural spacing');
  }
  execFileSync(invoke.command, invoke.args, options);
  const { default: spacingRule } = await import('../.config/checks/markdown.mjs');
  for (const [source, expected] of [
    [
      '-\n  First paragraph.\n\n- Second paragraph.\n',
      '-\n  First paragraph.\n- Second paragraph.\n',
    ],
    [
      '<pre>\n\n- First literal line\n\n- Second literal line\n\n</pre>\n',
      '<pre>\n\n- First literal line\n\n- Second literal line\n\n</pre>\n',
    ],
  ]) {
    const findings = await lint({
      strings: { fixture: source },
      config: { default: false, 'compact-simple-lists': true },
      customRules: [spacingRule],
      noInlineConfig: true,
    });
    assert.equal(applyFixes(source, findings.fixture), expected);
  }
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

test('native Git carrier roles preserve authored coverage and frozen supply obligations', async () => {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
  const attributes = execFileSync('git', ['check-attr', '-z', '--stdin', 'ethos-role'], {
    cwd: root,
    encoding: 'utf8',
    input: `${tracked.join('\0')}\0`,
  }).split('\0');
  const roles = new Map();
  for (let index = 0; index + 2 < attributes.length; index += 3) {
    assert.equal(attributes[index + 1], 'ethos-role');
    roles.set(attributes[index], attributes[index + 2]);
  }
  assert.equal(roles.size, tracked.length);
  const coverage = JSON.parse(
    await fs.readFile(path.join(root, '.config/checks/coverage.json'), 'utf8'),
  );
  const covered = new Set();
  for await (const file of fs.glob(coverage.include, { cwd: root, exclude: coverage.exclude }))
    covered.add(file.split(path.sep).join('/'));
  const runtime = new Set();
  for (const file of tracked) {
    const role = roles.get(file);
    if (file.endsWith('.sh')) {
      assert.equal(role, 'tooling', `${file} has no native script responsibility`);
      assert.match(file, /^tools\//u);
      continue;
    }
    if (!/\.(?:mjs|cjs|js)$/u.test(file)) {
      assert(!['code', 'test', 'tooling'].includes(role), `${file} is not a JavaScript carrier`);
      continue;
    }
    assert.notEqual(role, 'unspecified', `${file} has no native responsibility`);
    if (role === 'code') runtime.add(file);
    else if (role === 'test') assert.match(file, /^tests\//u);
    else if (role === 'tooling') assert.match(file, /^tools\//u);
    else if (role === 'config') assert.match(file, /^(?:\.config\/|eslint\.config\.mjs$)/u);
    else if (role === 'generated') {
      assert.match(file, /^packages\/publisher\/src\/edition\/generated\//u);
      assert.match(await fs.readFile(path.join(root, file), 'utf8'), /^\/\/ Generated from /u);
    } else if (role === 'snapshot') {
      assert.match(file, /^packages\/publisher\/(?:renderers\/[^/]+\/supply\/|supplies\/)/u);
      const owner = file.match(
        /^(packages\/publisher\/(?:renderers\/[^/]+\/supply|supplies\/[^/]+))\//u,
      )?.[1];
      assert(owner);
      await fs.access(path.join(root, owner, 'supply.json'));
    } else assert.fail(`${file} has an unsupported carrier role: ${role}`);
  }
  assert.deepEqual([...runtime].sort(), [...covered].sort());
  assert(coverage.all);
  for (const dimension of ['statements', 'lines', 'branches', 'functions'])
    assert(coverage[dimension] >= 95);
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  assert.match(workspace.scripts['check:static'], /npm run check:generated/u);
  assert.match(workspace.scripts['check:generated'], /generate-authoring-validators\.mjs --check/u);
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
  const knip = JSON.parse(await fs.readFile(path.join(root, '.config/checks/knip.json')));
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
  assert.match(profile, /providers = \["ethos.adapters.gates.code_quality:behavior_report"\]/u);
  assert.match(
    profile,
    /verification_providers = \["ethos.adapters.gates.code_quality:static_report"\]/u,
  );
  assert.match(profile, /execution_mode = "provider"/u);
  assert.doesNotMatch(profile, /command = \["npm", "run", "test:coverage"\]/u);
  assert.match(profile, /command = \["npm", "run", "check:static"\]/u);
  assert.match(profile, /command = \["npm", "run", "check:package"\]/u);
  assert.doesNotMatch(profile, /node-syntax/u);
});
