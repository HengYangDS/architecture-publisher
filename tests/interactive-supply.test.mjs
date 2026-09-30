import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = fileURLToPath(
  new URL('../packages/publisher/renderers/interactive/supply/', import.meta.url),
);

test('the viewport-only interaction engine is an exact offline BSD supply', async () => {
  const module = await import('../packages/publisher/renderers/interactive/supply.mjs').catch(
    () => null,
  );
  assert(module, 'the product-owned interactive supply must exist');
  const supply = await module.loadInteractiveSupply();
  assert.equal(supply.version, '3.6.2');
  assert.equal(supply.script.length, 29784);
  assert.equal(
    sha(supply.script),
    '9c8fc41b3359e699990766dd7a943595d234a80c880a90dfc14b920a273b99d8',
  );
  assert.match(
    supply.license.toString('utf8'),
    /Redistribution and use in source and binary forms/u,
  );
  assert.match(supply.license.toString('utf8'), /THIS SOFTWARE/u);
  assert.match(supply.manifestSha256, /^[0-9a-f]{64}$/u);
});

test('a caller cannot substitute a different renderer supply', async (t) => {
  const { loadInteractiveSupply, verifyInteractiveSupply } =
    await import('../packages/publisher/renderers/interactive/supply.mjs');
  assert.throws(() => loadInteractiveSupply(source), { code: 'render_interactive_supply_invalid' });
  const parent = path.resolve('build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const work = await fs.mkdtemp(path.join(parent, 'interactive-supply-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const cases = [
    [
      'script',
      async (directory) => fs.appendFile(path.join(directory, 'svg-pan-zoom.min.js'), 'changed'),
    ],
    ['license', async (directory) => fs.appendFile(path.join(directory, 'LICENSE'), 'changed')],
    ['manifest', async (directory) => fs.appendFile(path.join(directory, 'supply.json'), '\n')],
    ['extra member', async (directory) => fs.writeFile(path.join(directory, 'extra.js'), '')],
    ['missing member', async (directory) => fs.unlink(path.join(directory, 'LICENSE'))],
  ];
  for (const [name, mutate] of cases) {
    const copy = path.join(work, name.replaceAll(' ', '-'));
    await fs.cp(source, copy, { recursive: true });
    await mutate(copy);
    await assert.rejects(
      verifyInteractiveSupply(copy),
      {
        code: 'render_interactive_supply_invalid',
      },
      name,
    );
  }
});

test('the pinned supply descriptor cannot silently change engine identity', async () => {
  const module = await import('../packages/publisher/renderers/interactive/supply.mjs');
  assert.equal(typeof module.validateInteractiveManifest, 'function');
  const manifest = JSON.parse(await fs.readFile(path.join(source, 'supply.json')));
  assert.equal(module.validateInteractiveManifest(manifest), manifest);
  assert.throws(
    () =>
      module.validateInteractiveManifest({
        ...manifest,
        packages: [{ ...manifest.packages[0], version: '0.0.0' }],
      }),
    { code: 'render_interactive_supply_invalid' },
  );
});
