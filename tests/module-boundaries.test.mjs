import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectModuleBoundaries } from './fixtures/module-boundaries.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtimeRoots = [
  'packages/publisher/src',
  'packages/publisher/renderers',
  'packages/publisher/assets',
  'packages/extensions/ethos/src',
];

async function inventory(roots) {
  const paths = new Set([
    '',
    'packages/publisher/',
    'packages/extensions/ethos/',
  ]);
  const modules = [];
  async function visit(relative) {
    paths.add(`${relative.replace(/\/$/, '')}/`);
    for (const entry of await fs.readdir(path.join(root, relative), {
      withFileTypes: true,
    })) {
      const file = path.posix.join(relative, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected source link: ${file}`);
      if (entry.isDirectory()) {
        paths.add(`${file}/`);
        await visit(file);
      } else {
        paths.add(file);
        if (!file.startsWith('packages/publisher/assets/') && /\.(?:mjs|cjs|js)$/.test(file))
          modules.push(file);
      }
    }
  }
  for (const directory of roots) await visit(directory);
  return { paths, modules };
}

test('runtime owners are package-scoped and old owner roots are absent', async () => {
  for (const directory of [
    'packages/publisher/src/source',
    'packages/publisher/src/semantics',
    'packages/publisher/src/edition',
    'packages/publisher/src/scene',
    'packages/publisher/src/compiler',
    'packages/publisher/src/rendering',
    'packages/publisher/src/qualification',
    'packages/publisher/src/publication',
    'packages/publisher/renderers',
    'packages/extensions/ethos/src/adapter',
    'packages/extensions/ethos/src/edition',
  ])
    assert((await fs.stat(path.join(root, directory))).isDirectory(), directory);
  for (const directory of ['src', 'renderers', 'assets', 'adapters', 'editions'])
    await assert.rejects(fs.access(path.join(root, directory)), { code: 'ENOENT' });
});

test('core owners cannot import concrete extensions', async () => {
  const { paths } = await inventory(runtimeRoots);
  const problems = inspectModuleBoundaries(
    'packages/publisher/src/source/files.mjs',
    "import '@architecture-publisher/ethos/edition';",
    paths,
  );
  assert(problems.some(({ reason }) => reason.includes('forbidden dependency')));
});

test('extensions depend inward through public package exports', async () => {
  const { paths } = await inventory(runtimeRoots);
  assert.deepEqual(
    inspectModuleBoundaries(
      'packages/extensions/ethos/src/edition/atlas.mjs',
      "import { readSourceBundle } from 'architecture-publisher/source';",
      paths,
    ),
    [],
  );
  const deep = inspectModuleBoundaries(
    'packages/extensions/ethos/src/edition/atlas.mjs',
    "import '../../../../publisher/src/source/bundle.mjs';",
    paths,
  );
  assert(
    deep.some(({ reason }) =>
      reason.includes('cross-package dependency must use a public export'),
    ),
  );
});

test('all shipped modules satisfy the package and semantic dependency graph', async () => {
  const { paths, modules } = await inventory(runtimeRoots);
  const problems = [];
  for (const file of modules)
    problems.push(
      ...inspectModuleBoundaries(
        file,
        await fs.readFile(path.join(root, file), 'utf8'),
        paths,
      ),
    );
  assert.deepEqual(problems, []);
});

test('development tools use declared package owners and dependencies', async () => {
  const { paths, modules } = await inventory([...runtimeRoots, 'tools']);
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  const declared = new Set(Object.keys(workspace.devDependencies ?? {}));
  const problems = [];
  for (const file of modules.filter((name) => name.startsWith('tools/')))
    problems.push(
      ...inspectModuleBoundaries(
        file,
        await fs.readFile(path.join(root, file), 'utf8'),
        paths,
        declared,
      ),
    );
  assert.deepEqual(problems, []);
});

test('syntax failures and computed dependencies fail closed', async () => {
  const { paths } = await inventory(runtimeRoots);
  assert.match(
    inspectModuleBoundaries(
      'packages/publisher/src/source/files.mjs',
      'export {',
      paths,
    )[0].reason,
    /syntax/,
  );
  assert(
    inspectModuleBoundaries(
      'packages/publisher/src/source/files.mjs',
      'await import(selected);',
      paths,
    ).some(({ reason }) => reason.includes('computed dependency')),
  );
});

test('first-party owner names stay precise outside vendored assets', async () => {
  const { modules } = await inventory([...runtimeRoots, 'examples/self-host', 'tools']);
  const forbidden = /(?:^|\/)(?:core|common|shared|utils|legacy|compat)(?:\/|$)/;
  assert.deepEqual(modules.filter((file) => forbidden.test(file)), []);
});

test('repository syntax gate covers all tracked JavaScript modules', () => {
  const checked = spawnSync(process.execPath, ['tools/check-syntax.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
});

test('repository check composes syntax and dead-code gates once', async () => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  const knip = JSON.parse(await fs.readFile(path.join(root, 'knip.json')));
  assert.equal(workspace.scripts.check, 'npm run check:syntax && npm run check:dead-code');
  assert.match(workspace.scripts['check:dead-code'], /^knip /);
  assert.doesNotMatch(workspace.scripts['check:dead-code'], /--fix/);
  assert.equal(knip.ignoreExportsUsedInFile, undefined);
});
