import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadElkSupply } from '../packages/publisher/renderers/elk/supply.mjs';
import { workerEnvironment } from '../packages/publisher/src/runtime/process-tree.mjs';

test('the exact layout worker self-expires after a complete bounded reply', async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-layout-worker-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const supply = await loadElkSupply();
  await fs.writeFile(path.join(scratch, 'elk.cjs'), supply.script);
  const worker = fileURLToPath(
    new URL('../packages/publisher/renderers/elk/worker.mjs', import.meta.url),
  );
  const graph = {
    id: 'root',
    layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT' },
    children: [
      { id: 'n-0', width: 170, height: 64 },
      { id: 'n-1', width: 170, height: 64 },
    ],
    edges: [{ id: 'r-0', sources: ['n-0'], targets: ['n-1'] }],
  };
  const result = spawnSync(process.execPath, [worker, '2000'], {
    cwd: scratch,
    env: workerEnvironment(scratch, process.env.SystemRoot ?? null),
    input: JSON.stringify({
      schema: 'architecture.interactive-layout-request/v1',
      graphs: [graph],
    }),
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.signal, null);
  assert.equal(result.stderr, '');
  const reply = JSON.parse(result.stdout.trim());
  assert.equal(reply.status, 'ok');
  assert.equal(reply.layouts.length, 1);
  assert.equal(reply.layouts[0].edges[0].sections[0].incomingShape, 'n-0');
  assert(!result.stdout.includes('$H'));
});

test('invalid worker input, deadline, or supply cannot borrow an ambient installation', async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-layout-invalid-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const worker = fileURLToPath(
    new URL('../packages/publisher/renderers/elk/worker.mjs', import.meta.url),
  );
  for (const request of [
    '{',
    JSON.stringify({}),
    JSON.stringify({ schema: 'architecture.interactive-layout-request/v1', graphs: [] }),
    JSON.stringify({
      schema: 'architecture.interactive-layout-request/v1',
      graphs: Array(257).fill({}),
    }),
    JSON.stringify({
      schema: 'architecture.interactive-layout-request/v1',
      graphs: [{ id: 'root', children: [] }],
    }),
  ]) {
    const result = spawnSync(process.execPath, [worker, '1000'], {
      cwd: scratch,
      env: workerEnvironment(scratch, process.env.SystemRoot ?? null),
      input: request,
      encoding: 'utf8',
      timeout: 3_000,
      maxBuffer: 1024 * 1024,
    });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.stderr, '');
    assert.deepEqual(JSON.parse(result.stdout.trim()), {
      status: 'error',
      code: 'render_interactive_layout_execution_failed',
    });
  }
  for (const limit of ['0', '-1', 'NaN', '35001']) {
    const result = spawnSync(process.execPath, [worker, limit], {
      cwd: scratch,
      env: workerEnvironment(scratch, process.env.SystemRoot ?? null),
      input: '{}',
      encoding: 'utf8',
      timeout: 3_000,
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  }
});

test('the worker admits the complete four-candidate budget for every selected page', async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-layout-page-budget-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(scratch, 'elk.cjs'),
    'module.exports = class { async layout(graph) { return { id: graph.id }; } };\n',
  );
  const worker = fileURLToPath(
    new URL('../packages/publisher/renderers/elk/worker.mjs', import.meta.url),
  );
  for (const count of [256, 257]) {
    const result = spawnSync(process.execPath, [worker, '1000'], {
      cwd: scratch,
      env: workerEnvironment(scratch, process.env.SystemRoot ?? null),
      input: JSON.stringify({
        schema: 'architecture.interactive-layout-request/v1',
        graphs: Array.from({ length: count }, (_, index) => ({ id: `selected-${index}` })),
      }),
      encoding: 'utf8',
      timeout: 3_000,
      maxBuffer: 1024 * 1024,
    });
    assert.equal(result.stderr, '');
    const reply = JSON.parse(result.stdout.trim());
    if (count === 256) {
      assert.equal(result.status, 1);
      assert.equal(reply.status, 'ok');
      assert.deepEqual(
        reply.layouts.map(({ id }) => id),
        Array.from({ length: count }, (_, index) => `selected-${index}`),
      );
    } else {
      assert.equal(result.status, 1);
      assert.equal(reply.code, 'render_interactive_layout_execution_failed');
    }
  }
});
