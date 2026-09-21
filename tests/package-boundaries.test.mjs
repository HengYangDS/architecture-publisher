import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const ethos = path.join(root, 'migration/ethos');
const selfEdition = path.join(root, 'editions/self');

async function json(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

test('workspace separates the generic product from concrete Editions', async () => {
  const workspace = await json(path.join(root, 'package.json'));
  const product = await json(path.join(publisher, 'package.json'));
  const edition = await json(path.join(ethos, 'package.json'));

  assert.equal(workspace.private, true);
  assert.deepEqual(workspace.workspaces, [
    'packages/publisher',
    'editions/self',
    'migration/ethos',
  ]);
  assert.equal(product.name, 'architecture-publisher');
  assert.deepEqual(product.bin, { archpub: 'src/cli/main.mjs' });
  assert.equal(edition.name, '@architecture-publisher/ethos');
  assert.equal(
    edition.dependencies['architecture-publisher'],
    product.version,
  );
});

test('terminal paths make product ownership explicit', async () => {
  await fs.access(path.join(root, 'editions/self/package.json'));
  await fs.access(path.join(root, 'migration/ethos/package.json'));
  await fs.access(path.join(root, 'migration/aigw/README.md'));
  await fs.access(path.join(root, 'conformance/journeys/self-host/README.md'));
  await assert.rejects(fs.stat(path.join(root, 'packages/extensions')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(root, 'examples/aigw')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(root, 'examples/self-host')), {
    code: 'ENOENT',
  });
  await assert.rejects(
    fs.stat(path.join(root, 'packages/publisher/assets')),
    { code: 'ENOENT' },
  );
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
  const source = (
    await Promise.all(files.map((file) => fs.readFile(file, 'utf8')))
  ).join('\n');
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
  ).flat().join('\n');
  assert.doesNotMatch(core, /architecture-publisher-self|self-edition/);
});

test('the packed generic product contains no concrete domain package', () => {
  const packed = spawnSync(
    'npm',
    ['pack', '--json', '--dry-run', '--ignore-scripts'],
    { cwd: publisher, encoding: 'utf8', timeout: 30000 },
  );
  assert.equal(
    packed.status,
    0,
    String(packed.stdout ?? '') + String(packed.stderr ?? '') + String(packed.error ?? ''),
  );
  const files = JSON.parse(packed.stdout)[0].files.map(({ path: file }) => file);
  assert(files.includes('src/cli/main.mjs'));
  assert(files.includes('src/edition/contract.mjs'));
  assert(files.every((file) => !/(^|\/)(adapters|editions)(\/|$)/.test(file)));
  assert(files.every((file) => !/(^|\/)(ethos|aigw)(\/|$)/i.test(file)));
});

test('the generic command surface has no domain or renderer identity', async () => {
  const cli = await fs.readFile(
    path.join(publisher, 'src/cli/main.mjs'),
    'utf8',
  );
  assert.doesNotMatch(cli, /\b(?:ethos|aigw|archify|resvg|coretext)\b/i);
  assert.doesNotMatch(cli, /packages\/editions|\.\.\/\.\.\/editions/);
});

test('shared font supply belongs to its own renderer capability', async () => {
  const product = await json(path.join(publisher, 'package.json')),
    archify = await fs.readFile(
      path.join(publisher, 'renderers/archify/public.mjs'),
      'utf8',
    );
  assert.equal(
    product.exports['./renderers/fonts'],
    './renderers/fonts/index.mjs',
  );
  assert.doesNotMatch(archify, /fonts\.mjs|loadBundledFonts/);
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

test('the ETHOS extension depends inward through package exports', async () => {
  const files = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && entry.name.endsWith('.mjs')) files.push(file);
    }
  }
  await walk(path.join(ethos, 'src'));
  const source = (
    await Promise.all(files.map((file) => fs.readFile(file, 'utf8')))
  ).join('\n');
  assert.match(source, /from ['"]architecture-publisher\//);
  assert.doesNotMatch(source, /packages\/publisher|(?:\.\.\/){3,}(?:src|renderers)/);
});

test('extension public inputs do not eagerly load unrelated Edition capabilities', async () => {
  const index = await fs.readFile(
    path.join(ethos, 'src/edition/index.mjs'),
    'utf8',
  );
  assert.match(index, /from ['"]\.\/input\.mjs['"]/);
  assert.doesNotMatch(index, /export \*|from ['"]\.\/(?:atlas|poster|publication|review|standalone)\.mjs['"]/);
});
