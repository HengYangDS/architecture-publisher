import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectModuleBoundaries } from './fixtures/module-boundaries.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const paths = new Set([
  '',
  'src/cli/main.mjs',
  'src/source/files.mjs',
  'src/source/bridge.mjs',
  'src/geometry/scene.mjs',
  'src/publication/files.mjs',
  'src/interactive/archify.mjs',
  'src/static/raster.mjs',
  'src/static/worker.mjs',
  'src/static/coretext.swift',
  'src/integrations/ethos/projection.mjs',
  'editions/ethos/atlas.mjs',
  'assets/archify/',
  'assets/fonts/',
  'assets/raster/resvg/index.mjs',
]);

const rejected = [
  [
    'static import',
    'src/source/files.mjs',
    "import '../../editions/ethos/atlas.mjs';",
  ],
  [
    'named re-export',
    'src/source/files.mjs',
    "export { atlas } from '../integrations/ethos/projection.mjs';",
  ],
  [
    'namespace re-export',
    'src/geometry/scene.mjs',
    "export * from '../static/raster.mjs';",
  ],
  [
    'dynamic import',
    'src/interactive/archify.mjs',
    "await import('../static/raster.mjs');",
  ],
  [
    'literal template import',
    'src/static/raster.mjs',
    'await import(`../interactive/archify.mjs`);',
  ],
  [
    'resource URL',
    'src/source/files.mjs',
    "new URL('../../editions/ethos/atlas.mjs', import.meta.url);",
  ],
  [
    'import.meta.resolve',
    'src/source/files.mjs',
    "import.meta.resolve('../integrations/ethos/projection.mjs');",
  ],
  ['computed import', 'src/source/files.mjs', 'await import(selected);'],
  [
    'computed resource URL',
    'src/static/raster.mjs',
    'new URL(selected, import.meta.url);',
  ],
  ['undeclared runtime dependency', 'src/source/files.mjs', "import 'acorn';"],
  ['package escape', 'src/source/files.mjs', "import '../../../foreign.mjs';"],
  [
    'encoded forbidden path',
    'src/source/files.mjs',
    "import '../../%65ditions/ethos/atlas.mjs';",
  ],
  ['missing module', 'src/source/files.mjs', "import './absent.mjs';"],
  ['unknown owner', 'src/misc/bridge.mjs', "import '../source/files.mjs';"],
  [
    'CommonJS loader',
    'src/source/files.mjs',
    "require('../../editions/ethos/atlas.mjs');",
  ],
  [
    'CommonJS loader factory',
    'src/source/files.mjs',
    "import { createRequire as loader } from 'node:module';",
  ],
];

for (const [label, file, source] of rejected) {
  test(`module boundaries reject ${label}`, () => {
    const problems = inspectModuleBoundaries(file, source, paths);
    assert(problems.length > 0, `${label} must not pass dependency admission`);
    assert(
      problems.every(
        (p) => p.file === file && Number.isInteger(p.line) && p.reason,
      ),
    );
  });
}

test('module boundaries allow composition, independent backends and declared resources', () => {
  const allowed = [
    ['src/cli/main.mjs', "await import('../../editions/ethos/atlas.mjs');"],
    [
      'editions/ethos/atlas.mjs',
      "import '../../src/integrations/ethos/projection.mjs';",
    ],
    ['editions/ethos/atlas.mjs', "new URL('../../', import.meta.url);"],
    ['src/source/files.mjs', "import fs from 'node:fs/promises';"],
    [
      'src/static/raster.mjs',
      "import '../source/files.mjs'; import '../geometry/scene.mjs';",
    ],
    [
      'src/static/raster.mjs',
      "await import('./worker.mjs'); new URL('./coretext.swift', import.meta.url);",
    ],
    [
      'src/interactive/archify.mjs',
      "new URL('../../assets/archify/', import.meta.url);",
    ],
    [
      'src/interactive/archify.mjs',
      "new URL('../../assets/fonts/', import.meta.url);",
    ],
    ['src/static/raster.mjs', "import '../../assets/raster/resvg/index.mjs';"],
    [
      'src/source/files.mjs',
      "// import '../../editions/ethos/atlas.mjs'\nconst message = 'editions/ethos';",
    ],
    [
      'src/source/files.mjs',
      "const endpoint = new URL('https://example.invalid', externalBase);",
    ],
  ];
  for (const [file, source] of allowed)
    assert.deepEqual(inspectModuleBoundaries(file, source, paths), [], source);
});

test('a permitted intermediary cannot hide its reverse dependency', () => {
  assert.deepEqual(
    inspectModuleBoundaries(
      'src/static/raster.mjs',
      "import '../source/bridge.mjs';",
      paths,
    ),
    [],
  );
  assert(
    inspectModuleBoundaries(
      'src/source/bridge.mjs',
      "export * from '../../editions/ethos/atlas.mjs';",
      paths,
    ).length,
  );
});

test('syntax errors fail the boundary check instead of disappearing', () => {
  const problems = inspectModuleBoundaries(
    'src/source/files.mjs',
    'export {',
    paths,
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0].reason, /syntax/);
});

test('all first-party JavaScript modules satisfy the same dependency rules', async () => {
  const inventory = new Set(['']);
  const modules = [];
  async function visit(relative) {
    for (const entry of await fs.readdir(path.join(root, relative), {
      withFileTypes: true,
    })) {
      const file = path.posix.join(relative, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected source link: ${file}`);
      if (entry.isDirectory()) {
        inventory.add(`${file}/`);
        await visit(file);
      } else {
        inventory.add(file);
        if (!file.startsWith('assets/') && /\.(?:mjs|cjs|js)$/.test(file))
          modules.push(file);
      }
    }
  }
  for (const dir of ['src', 'editions', 'assets']) await visit(dir);
  assert(modules.length > 0);
  const problems = [];
  for (const file of modules)
    problems.push(
      ...inspectModuleBoundaries(
        file,
        await fs.readFile(path.join(root, file), 'utf8'),
        inventory,
      ),
    );
  assert.deepEqual(problems, []);
});
