import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('one fail-closed quality entry point covers the repository contract', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  assert.equal(
    manifest.scripts.check,
    'npm run check:static && npm run test:coverage && npm run check:package',
  );
  assert.equal(
    manifest.scripts['check:static'],
    'npm run check:format && npm run check:lint && npm run check:types && npm run check:imports && npm run check:dead-code && npm run check:docs && npm run check:spec',
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
    "c8 --all --include='packages/publisher/src/**/*.mjs' --include='packages/publisher/renderers/**/*.mjs' --include='editions/self/src/**/*.mjs' --exclude='packages/publisher/renderers/**/supply/**' --check-coverage --statements=95 --lines=95 --branches=95 --functions=95 npm test",
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
    assert.match(
      file,
      /^(?:packages\/publisher\/(?:src|renderers)\/|editions\/self\/src\/)/u,
      `${file} escapes the owned runtime coverage scope`,
    );
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
