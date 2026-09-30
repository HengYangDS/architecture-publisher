import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'packages/publisher/supplies/implementation.json');
const identity = path.join(root, 'packages/publisher/src/compiler/implementation-identity.mjs');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const baseStatic = [
  'packages/publisher/src/compiler/media.mjs',
  'packages/publisher/renderers/fonts/index.mjs',
  'packages/publisher/renderers/resvg/worker.mjs',
];
const baseSemantic = [
  'packages/publisher/src/compiler/meaning.mjs',
  'packages/publisher/src/compiler/native.mjs',
];
const profiles = {
  'semantic-claim': baseSemantic,
  'semantic-likec4': [...baseSemantic, 'packages/publisher/src/semantics/native-worker.mjs'],
  'static-claim': [
    ...baseStatic,
    'packages/publisher/src/scene/static/edition.mjs',
    'packages/publisher/renderers/svg/edition.mjs',
  ],
  'static-structural': [
    ...baseStatic,
    'packages/publisher/src/scene/static/edition.mjs',
    'packages/publisher/src/scene/static/selection.mjs',
    'packages/publisher/renderers/dagre/static.mjs',
    'packages/publisher/renderers/dagre/layout.mjs',
    'packages/publisher/renderers/dagre/supply.mjs',
    'packages/publisher/renderers/svg/edition.mjs',
  ],
  'static-refinement': [
    ...baseStatic,
    'packages/publisher/src/scene/static/edition.mjs',
    'packages/publisher/src/scene/static/selection.mjs',
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
    'packages/publisher/renderers/resvg/measurement.mjs',
    'packages/publisher/src/scene/static/authored-canvas.mjs',
    'packages/publisher/src/scene/static/audit.mjs',
    'packages/publisher/src/qualification/static/emitted-path.mjs',
    'packages/publisher/renderers/svg/canvas.mjs',
  ],
  'static-figure': [...baseStatic, 'packages/publisher/renderers/svg/figure.mjs'],
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
  if (
    !paths.length ||
    paths.some(
      (name) =>
        !/^(?:src|renderers)\//u.test(name) ||
        path.posix.normalize(name) !== name ||
        name.split('/').includes('..'),
    )
  )
    throw Error('publisher_implementation_input_path_invalid');
  return Promise.all(
    paths.map(async (name) => {
      const bytes = await fs.readFile(path.join(root, 'packages/publisher', name));
      if (!bytes.length) throw Error('publisher_implementation_input_empty');
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
const identityContent =
  '/** Generated from the selected Publisher media file sets. Do not edit. */\n' +
  'export const IMPLEMENTATION_MANIFEST_SHA256 =\n' +
  `  '${sha(Buffer.from(content))}';\n`;
if (process.argv.includes('--check')) {
  if (
    (await fs.readFile(output, 'utf8').catch(() => null)) !== content ||
    (await fs.readFile(identity, 'utf8').catch(() => null)) !== identityContent
  )
    throw Error('publisher_implementation_supply_drift');
} else if (process.argv.length === 2 || process.argv.includes('--write')) {
  await fs.writeFile(output, content);
  await fs.writeFile(identity, identityContent);
} else {
  throw Error('usage: node tools/supply/implementation.mjs [--check|--write]');
}
