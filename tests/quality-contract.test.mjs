import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';

const root = path.resolve(import.meta.dirname, '..');

test('native macOS verification shares one project resource without merging trust roles', async () => {
  const pipeline = parse(await fs.readFile(path.join(root, '.gitlab-ci.yml'), 'utf8'));
  const native = pipeline['.verify-macos'];
  assert.equal(typeof native.resource_group, 'string');
  assert(native.resource_group.trim());
  assert.equal(pipeline.verify.resource_group, undefined);
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
  assert.equal(
    manifest.scripts['test:coverage'],
    "c8 --all --include='packages/publisher/src/**/*.mjs' --include='packages/publisher/renderers/**/*.mjs' --include='editions/self/src/**/*.mjs' --exclude='packages/publisher/src/edition/generated/**' --exclude='packages/publisher/renderers/**/supply/**' --check-coverage --statements=95 --lines=95 --branches=95 --functions=95 npm test",
  );
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
