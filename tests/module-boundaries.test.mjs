import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectModuleBoundaries } from './fixtures/module-boundaries.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtimeRoots = [
  'packages/publisher/src',
  'packages/publisher/renderers',
  'editions/self/src',
  'conformance/journeys/self-host',
];

async function declaredPackageExports() {
  const exports = new Map();
  for (const directory of ['packages/publisher', 'editions/self']) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, directory, 'package.json')));
    for (const [subpath, target] of Object.entries(manifest.exports)) {
      assert.equal(typeof target, 'string', `${manifest.name}:${subpath}`);
      const specifier = subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
      exports.set(specifier, path.posix.join(directory, target));
    }
  }
  return exports;
}

async function inventory(roots) {
  const paths = new Set(['', 'packages/publisher/', 'editions/self/']);
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
        if (
          !/packages\/publisher\/renderers\/[^/]+\/supply\//.test(file) &&
          /\.(?:mjs|cjs|js)$/.test(file)
        )
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
    'editions/self/src/edition',
  ])
    assert((await fs.stat(path.join(root, directory))).isDirectory(), directory);
  for (const directory of ['src', 'renderers', 'assets', 'adapters'])
    await assert.rejects(fs.access(path.join(root, directory)), { code: 'ENOENT' });
  for (const directory of [
    'packages/extensions',
    'packages/publisher/assets',
    'examples/self-host',
    'examples/aigw',
  ])
    await assert.rejects(fs.access(path.join(root, directory)), { code: 'ENOENT' });
});

test('core owners cannot import concrete extensions', async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const problems = inspectModuleBoundaries(
    'packages/publisher/src/source/files.mjs',
    "import '@architecture-publisher/self-edition/edition';",
    paths,
    packageExports,
  );
  assert(problems.some(({ reason }) => reason.includes('forbidden dependency')));
});

test('extensions depend inward through public package exports', async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  assert.deepEqual(
    inspectModuleBoundaries(
      'editions/self/src/edition/static-flagship.mjs',
      "import { loadBundledFonts } from 'architecture-publisher/renderers/fonts';",
      paths,
      packageExports,
    ),
    [],
  );
  const deep = inspectModuleBoundaries(
    'editions/self/src/edition/static-flagship.mjs',
    "import '../../../../packages/publisher/src/source/bundle.mjs';",
    paths,
    packageExports,
  );
  assert(
    deep.some(({ reason }) => reason.includes('cross-package dependency must use a public export')),
  );
});

test('all shipped modules satisfy the package and semantic dependency graph', async () => {
  const { paths, modules } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const externals = new Map();
  for (const directory of ['packages/publisher', 'editions/self']) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, directory, 'package.json')));
    externals.set(directory, new Set(Object.keys(manifest.dependencies ?? {})));
  }
  const problems = [];
  for (const file of modules) {
    const owner = [...externals.keys()].find((directory) => file.startsWith(`${directory}/`));
    problems.push(
      ...inspectModuleBoundaries(
        file,
        await fs.readFile(path.join(root, file), 'utf8'),
        paths,
        packageExports,
        externals.get(owner) ?? new Set(),
      ),
    );
  }
  assert.deepEqual(problems, []);
  assert(
    inspectModuleBoundaries(
      'packages/publisher/src/edition/authoring.mjs',
      "import 'unlisted-package';",
      paths,
      packageExports,
      externals.get('packages/publisher'),
    ).some(({ reason }) => reason.includes('declared external')),
  );
});

test('development tools use declared package owners and dependencies', async () => {
  const { paths, modules } = await inventory([...runtimeRoots, 'tools']);
  const packageExports = await declaredPackageExports();
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  const declared = new Set(Object.keys(workspace.devDependencies ?? {}));
  const problems = [];
  for (const file of modules.filter((name) => name.startsWith('tools/')))
    problems.push(
      ...inspectModuleBoundaries(
        file,
        await fs.readFile(path.join(root, file), 'utf8'),
        paths,
        packageExports,
        declared,
      ),
    );
  assert.deepEqual(problems, []);
});

test('syntax failures and computed dependencies fail closed', async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  assert.match(
    inspectModuleBoundaries(
      'packages/publisher/src/source/files.mjs',
      'export {',
      paths,
      packageExports,
    )[0].reason,
    /syntax/,
  );
  assert(
    inspectModuleBoundaries(
      'packages/publisher/src/source/files.mjs',
      'await import(selected);',
      paths,
      packageExports,
    ).some(({ reason }) => reason.includes('computed dependency')),
  );
});

test('Provider worker admits only its exact selected dynamic entrypoint', async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  const file = 'packages/publisher/src/provider/worker-task.mjs';
  assert.deepEqual(
    inspectModuleBoundaries(file, 'await import(selectedEntrypointUrl);', paths, packageExports),
    [],
  );
  assert(
    inspectModuleBoundaries(file, 'await import(otherEntrypoint);', paths, packageExports).some(
      ({ reason }) => reason.includes('computed dependency'),
    ),
  );
});

test('provider and generic kernels reject forbidden dependency directions and adopter names', async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  for (const specifier of [
    'architecture-publisher/renderers/archify',
    'architecture-publisher/qualification',
    'architecture-publisher/publication',
    'simple-git',
    '../../../../../ethos/src/index.mjs',
  ])
    assert(
      inspectModuleBoundaries(
        'packages/publisher/src/provider/invalid.mjs',
        `import ${JSON.stringify(specifier)};`,
        paths,
        packageExports,
      ).length,
      specifier,
    );
  for (const name of ['ETHOS', 'AIGW', '@example/architecture-edition-provider'])
    assert(
      inspectModuleBoundaries(
        'packages/publisher/src/compiler/invalid.mjs',
        `export const adopter = ${JSON.stringify(name)};`,
        paths,
        packageExports,
      ).some(({ reason }) => reason.includes('adopter identity')),
      name,
    );
});

test('selected Provider modules cannot import historical Provider implementations', async () => {
  const { paths } = await inventory(runtimeRoots);
  const packageExports = await declaredPackageExports();
  for (const target of ['./contract.mjs', './executable.mjs', './protocol.mjs']) {
    const problems = inspectModuleBoundaries(
      'packages/publisher/src/provider/executable-selection.mjs',
      `import ${JSON.stringify(target)};`,
      paths,
      packageExports,
    );
    assert(
      problems.some(({ reason }) => reason.includes('historical Provider dependency')),
      target,
    );
  }
});

test('first-party owner names stay precise outside vendored assets', async () => {
  const { modules } = await inventory([...runtimeRoots, 'conformance/journeys/self-host', 'tools']);
  const forbidden = /(?:^|\/)(?:core|common|shared|utils|legacy|compat)(?:\/|$)/;
  assert.deepEqual(
    modules.filter((file) => forbidden.test(file)),
    [],
  );
});

test('repository check composes one fail-closed static and acceptance graph', async () => {
  const workspace = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  const knip = JSON.parse(await fs.readFile(path.join(root, 'knip.json')));
  assert.equal(
    workspace.scripts.check,
    'npm run check:static && npm run test:coverage && npm run check:package',
  );
  assert.match(workspace.scripts['check:static'], /check:lint/);
  assert.match(workspace.scripts['check:static'], /check:types/);
  assert.match(workspace.scripts['check:static'], /check:imports/);
  assert.match(workspace.scripts['check:dead-code'], /^knip /);
  assert.doesNotMatch(workspace.scripts['check:dead-code'], /--fix/);
  assert.equal(knip.ignoreExportsUsedInFile, undefined);
});
