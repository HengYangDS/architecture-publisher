import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const selfEdition = path.join(root, 'editions/self');

async function json(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

test('workspace separates the generic product from concrete Editions', async () => {
  const workspace = await json(path.join(root, 'package.json'));
  const product = await json(path.join(publisher, 'package.json'));

  assert.equal(workspace.private, true);
  assert.deepEqual(workspace.workspaces, ['packages/publisher', 'editions/self']);
  assert.equal(product.name, 'architecture-publisher');
  assert.deepEqual(product.bin, { archpub: 'src/cli/main.mjs' });
  assert.equal(product.exports['.'], './src/index.mjs');
  assert.equal(product.exports['./provider'], './src/provider/index.mjs');
  const providerApi = await import(pathToFileURL(path.join(publisher, 'src/provider/index.mjs')));
  for (const name of [
    'materializeDeclarativeProvider',
    'materializeExecutableProvider',
    'withMaterializedEditionProvider',
  ])
    assert.equal(typeof providerApi[name], 'function');
  const publicApi = await import(pathToFileURL(path.join(publisher, 'src/index.mjs')));
  assert.deepEqual(Object.keys(publicApi).sort(), [
    'compiler',
    'edition',
    'provider',
    'publication',
    'qualification',
    'rendering',
    'scene',
    'semantics',
    'source',
  ]);
});

test('terminal paths make product ownership explicit', async () => {
  await fs.access(path.join(root, 'editions/self/package.json'));
  await fs.access(path.join(root, 'conformance/fixtures/ethos-source-owned-handoff.json'));
  await fs.access(path.join(root, 'conformance/fixtures/aigw-source-owned-handoff.json'));
  await fs.access(path.join(root, 'conformance/journeys/self-host/README.md'));
  await assert.rejects(fs.stat(path.join(root, 'migration/aigw')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(root, 'packages/extensions')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(root, 'examples/aigw')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(root, 'examples/self-host')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(root, 'packages/publisher/assets')), { code: 'ENOENT' });
  for (const owner of ['archify', 'fonts', 'resvg'])
    await fs.access(path.join(publisher, 'renderers', owner, 'supply'));
});

test('the first-party self Edition is an independent package below the generic core', async () => {
  const product = await json(path.join(publisher, 'package.json'));
  const edition = await json(path.join(selfEdition, 'package.json'));
  assert.equal(edition.name, '@architecture-publisher/self-edition');
  assert.deepEqual(edition.dependencies, {
    'architecture-publisher': product.version,
  });
  const files = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && entry.name.endsWith('.mjs')) files.push(file);
    }
  }
  await walk(path.join(selfEdition, 'src'));
  const source = (await Promise.all(files.map((file) => fs.readFile(file, 'utf8')))).join('\n');
  assert.match(source, /from ['"]architecture-publisher\//);
  assert.doesNotMatch(source, /packages\/publisher|(?:\.\.\/){3,}(?:src|renderers)/);
  const core = (
    await Promise.all(
      [path.join(publisher, 'src'), path.join(publisher, 'renderers')].map(
        async function collect(directory) {
          const found = [];
          async function visit(current) {
            for (const entry of await fs.readdir(current, {
              withFileTypes: true,
            })) {
              const file = path.join(current, entry.name);
              if (entry.isDirectory()) await visit(file);
              else if (entry.isFile() && entry.name.endsWith('.mjs'))
                found.push(await fs.readFile(file, 'utf8'));
            }
          }
          await visit(directory);
          return found;
        },
      ),
    )
  )
    .flat()
    .join('\n');
  assert.doesNotMatch(core, /architecture-publisher-self|self-edition/);
});

test('the packed generic product contains no concrete domain package', () => {
  const packed = spawnSync('npm', ['pack', '--json', '--dry-run', '--ignore-scripts'], {
    cwd: publisher,
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.equal(
    packed.status,
    0,
    String(packed.stdout ?? '') + String(packed.stderr ?? '') + String(packed.error ?? ''),
  );
  const files = JSON.parse(packed.stdout)[0].files.map(({ path: file }) => file);
  assert(files.includes('src/cli/main.mjs'));
  assert(files.includes('src/edition/contract.mjs'));
  assert(files.includes('src/provider/contract.mjs'));
  assert(files.every((file) => !/(^|\/)(adapters|editions)(\/|$)/.test(file)));
  assert(files.every((file) => !/(^|\/)(ethos|aigw)(\/|$)/i.test(file)));
});

test('the generic command surface has no domain or renderer identity', async () => {
  const cli = await fs.readFile(path.join(publisher, 'src/cli/main.mjs'), 'utf8');
  assert.doesNotMatch(cli, /\b(?:ethos|aigw|archify|resvg|coretext)\b/i);
  assert.doesNotMatch(cli, /packages\/editions|\.\.\/\.\.\/editions/);
});

test('shared font supply belongs to its own renderer capability', async () => {
  const product = await json(path.join(publisher, 'package.json')),
    archify = await fs.readFile(path.join(publisher, 'renderers/archify/public.mjs'), 'utf8'),
    resvgSupply = await json(path.join(publisher, 'renderers/resvg/supply/resvg/package.json')),
    rasterBuild = await fs.readFile(path.join(root, 'tools/raster/resvg/build.sh'), 'utf8'),
    rasterCargo = await fs.readFile(path.join(root, 'tools/raster/resvg/Cargo.toml'), 'utf8'),
    rasterWasm = await fs.readFile(
      path.join(publisher, 'renderers/resvg/supply/resvg/index_bg.wasm'),
    );
  assert.equal(product.exports['./renderers/fonts'], './renderers/fonts/index.mjs');
  assert.doesNotMatch(archify, /fonts\.mjs|loadBundledFonts/);
  assert.equal(resvgSupply.name, '@architecture-publisher/resvg-wasm-supply');
  assert.doesNotMatch(JSON.stringify(resvgSupply), /ethos/i);
  assert.doesNotMatch(rasterBuild, /ethos/i);
  assert.doesNotMatch(rasterCargo, /ethos/i);
  assert.equal(rasterWasm.includes(Buffer.from('ethos')), false);
});

test('the published pair-files v2 protocol retains native and atlas media keys', async () => {
  const source = (
    await Promise.all(
      ['files.mjs', 'input.mjs'].map((file) =>
        fs.readFile(path.join(publisher, 'src/publication', file), 'utf8'),
      ),
    )
  ).join('\n');
  assert.doesNotMatch(source, /\.ethos-pair-/i);
  assert.match(source, /['"]native['"]/);
  assert.match(source, /['"]atlas['"]/);
  assert.match(source, /destinations\.native\b/);
  assert.doesNotMatch(source, /destinations\.(?:static|interactive)\b/);
  assert.match(source, /\.architecture-publication-writer/);
});
