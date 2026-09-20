import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectModuleBoundaries } from './fixtures/module-boundaries.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('runtime implementation uses the declared semantic owner roots', async () => {
  const required = [
    'src/scene',
    'src/qualification',
    'adapters/ethos',
    'renderers/svg',
    'renderers/archify',
    'renderers/resvg',
  ];
  for (const directory of required)
    assert(
      (await fs.stat(path.join(root, directory))).isDirectory(),
      `${directory} must be a runtime owner`,
    );

  const superseded = [
    'src/composition',
    'src/geometry',
    'src/integrations',
    'src/interactive',
    'src/static',
  ];
  for (const directory of superseded)
    await assert.rejects(fs.access(path.join(root, directory)), {
      code: 'ENOENT',
    });
});

const paths = new Set([
  '',
  'src/cli/main.mjs',
  'src/semantics/document.mjs',
  'src/source/manifest.mjs',
  'src/source/files.mjs',
  'src/source/bridge.mjs',
  'src/edition/contract.mjs',
  'src/edition/evolution.mjs',
  'src/edition/input.mjs',
  'src/scene/contract.mjs',
  'src/scene/interactive/architecture.mjs',
  'src/scene/static/architecture.mjs',
  'src/qualification/static/scene.mjs',
  'src/publication/files.mjs',
  'src/publication/contract.mjs',
  'src/publication/semantic.mjs',
  'renderers/archify/index.mjs',
  'renderers/archify/architecture.mjs',
  'renderers/svg/architecture.mjs',
  'renderers/svg/coretext.swift',
  'renderers/resvg/index.mjs',
  'renderers/resvg/worker.mjs',
  'adapters/ethos/projection.mjs',
  'editions/ethos/atlas.mjs',
  'examples/self-host/build.mjs',
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
    "export { atlas } from '../../adapters/ethos/projection.mjs';",
  ],
  [
    'namespace re-export',
    'src/qualification/static/scene.mjs',
    "export * from '../../../renderers/resvg/index.mjs';",
  ],
  [
    'dynamic import',
    'renderers/archify/index.mjs',
    "await import('../resvg/index.mjs');",
  ],
  [
    'scene importing an interactive renderer',
    'src/scene/static/architecture.mjs',
    "import '../../../renderers/archify/index.mjs';",
  ],
  [
    'shipped self-host example bypassing public contracts',
    'examples/self-host/build.mjs',
    "import '../../renderers/archify/index.mjs';",
  ],
  [
    'literal template import',
    'renderers/resvg/index.mjs',
    'await import(`../archify/index.mjs`);',
  ],
  [
    'resource URL',
    'src/source/files.mjs',
    "new URL('../../editions/ethos/atlas.mjs', import.meta.url);",
  ],
  [
    'import.meta.resolve',
    'src/source/files.mjs',
    "import.meta.resolve('../../adapters/ethos/projection.mjs');",
  ],
  ['computed import', 'src/source/files.mjs', 'await import(selected);'],
  [
    'computed resource URL',
    'renderers/resvg/index.mjs',
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
      "import '../../adapters/ethos/projection.mjs';",
    ],
    ['editions/ethos/atlas.mjs', "new URL('../../', import.meta.url);"],
    ['src/source/files.mjs', "import fs from 'node:fs/promises';"],
    [
      'src/edition/contract.mjs',
      "import '../semantics/document.mjs'; import '../source/manifest.mjs';",
    ],
    [
      'src/scene/contract.mjs',
      "import '../edition/contract.mjs';",
    ],
    [
      'renderers/svg/architecture.mjs',
      "import '../../src/scene/static/architecture.mjs';",
    ],
    [
      'renderers/resvg/index.mjs',
      "await import('./worker.mjs');",
    ],
    [
      'renderers/archify/index.mjs',
      "new URL('../../assets/archify/', import.meta.url);",
    ],
    [
      'renderers/archify/index.mjs',
      "new URL('../../assets/fonts/', import.meta.url);",
    ],
    [
      'renderers/resvg/worker.mjs',
      "import '../../assets/raster/resvg/index.mjs';",
    ],
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
      'renderers/resvg/index.mjs',
      "import '../../src/source/bridge.mjs';",
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
  for (const dir of [
    'src',
    'adapters',
    'renderers',
    'editions',
    'examples',
    'assets',
  ])
    await visit(dir);
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
