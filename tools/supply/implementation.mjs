import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'packages/publisher/supplies/implementation.json');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const baseStatic = [
  'packages/publisher/src/compiler/media.mjs',
  'packages/publisher/renderers/fonts/index.mjs',
  'packages/publisher/renderers/resvg/worker.mjs',
];
const profiles = {
  'static-claim': [
    ...baseStatic,
    'packages/publisher/src/scene/static/edition.mjs',
    'packages/publisher/renderers/svg/edition.mjs',
  ],
  'static-grouped': [
    ...baseStatic,
    'packages/publisher/src/scene/static/edition.mjs',
    'packages/publisher/src/scene/static/grouped-selection.mjs',
    'packages/publisher/renderers/svg/edition.mjs',
  ],
  'static-likec4': [
    ...baseStatic,
    'packages/publisher/src/scene/static/edition.mjs',
    'packages/publisher/src/semantics/native-likec4.mjs',
    'packages/publisher/src/semantics/native-worker.mjs',
    'packages/publisher/renderers/svg/edition.mjs',
  ],
  'static-authored': [
    ...baseStatic,
    'packages/publisher/src/scene/static/authored-canvas.mjs',
    'packages/publisher/renderers/svg/canvas.mjs',
  ],
  'interactive-neutral': [
    'packages/publisher/src/scene/interactive/edition.mjs',
    'packages/publisher/renderers/cytoscape/edition.mjs',
  ],
  'interactive-authored': [
    'packages/publisher/src/scene/interactive/authored-architecture.mjs',
    'packages/publisher/src/rendering/interactive-html.mjs',
    'packages/publisher/renderers/archify/index.mjs',
  ],
};

async function selectedFiles(entries) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: entries,
    bundle: true,
    write: false,
    outdir: path.join(root, 'build/implementation-metafile'),
    metafile: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    logLevel: 'silent',
  });
  const paths = Object.keys(result.metafile.inputs)
    .filter(
      (name) =>
        name.startsWith('packages/publisher/') &&
        !/^packages\/publisher\/renderers\/[^/]+\/supply\//u.test(name) &&
        !name.startsWith('packages/publisher/supplies/'),
    )
    .map((name) => name.slice('packages/publisher/'.length))
    .sort();
  return Promise.all(
    paths.map(async (name) => {
      const bytes = await fs.readFile(path.join(root, 'packages/publisher', name));
      return { path: name, bytes: bytes.length, sha256: sha(bytes) };
    }),
  );
}

const manifest = {
  schema: 'architecture.publisher-implementation-supply/v1',
  profiles: Object.fromEntries(
    await Promise.all(
      Object.entries(profiles).map(async ([name, entries]) => [name, await selectedFiles(entries)]),
    ),
  ),
};
const content = JSON.stringify(manifest, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if ((await fs.readFile(output, 'utf8').catch(() => null)) !== content)
    throw Error('publisher_implementation_supply_drift');
} else if (process.argv.length === 2 || process.argv.includes('--write')) {
  await fs.writeFile(output, content);
} else {
  throw Error('usage: node tools/supply/implementation.mjs [--check|--write]');
}
