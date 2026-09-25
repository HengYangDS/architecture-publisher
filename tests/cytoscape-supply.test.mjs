import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = fileURLToPath(
  new URL('../packages/publisher/renderers/cytoscape/supply/', import.meta.url),
);

test('the neutral interactive engine is an exact offline MIT supply', async () => {
  const module = await import('../packages/publisher/renderers/cytoscape/supply.mjs').catch(
    () => null,
  );
  assert(module, 'the product-owned interactive supply must exist');
  const supply = await module.loadCytoscapeSupply();
  assert.equal(supply.version, '3.34.3');
  assert.equal(supply.script.length, 435503);
  assert.equal(
    sha(supply.script),
    '5f3b5b529546d5af1fc5628590af033b74511a5b6f789f5f4682845863228b91',
  );
  assert.match(
    supply.license.toString('utf8'),
    /Copyright \(c\) 2016-2026, The Cytoscape Consortium/u,
  );
  assert.match(supply.license.toString('utf8'), /Permission is hereby granted/u);
  assert.match(supply.manifestSha256, /^[0-9a-f]{64}$/u);
});

test('a caller cannot substitute a different renderer supply', async (t) => {
  const { loadCytoscapeSupply, verifyCytoscapeSupply } =
    await import('../packages/publisher/renderers/cytoscape/supply.mjs');
  assert.throws(() => loadCytoscapeSupply(source), { code: 'render_cytoscape_supply_invalid' });
  const parent = path.resolve('build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const work = await fs.mkdtemp(path.join(parent, 'cytoscape-supply-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const cases = [
    [
      'script',
      async (directory) => fs.appendFile(path.join(directory, 'cytoscape.min.js'), 'changed'),
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
      verifyCytoscapeSupply(copy),
      {
        code: 'render_cytoscape_supply_invalid',
      },
      name,
    );
  }
});

test('the pinned supply descriptor cannot silently change engine identity', async () => {
  const module = await import('../packages/publisher/renderers/cytoscape/supply.mjs');
  assert.equal(typeof module.validateCytoscapeManifest, 'function');
  const manifest = JSON.parse(await fs.readFile(path.join(source, 'supply.json')));
  assert.equal(module.validateCytoscapeManifest(manifest), manifest);
  assert.throws(
    () =>
      module.validateCytoscapeManifest({
        ...manifest,
        package: { ...manifest.package, version: '0.0.0' },
      }),
    { code: 'render_cytoscape_supply_invalid' },
  );
});
