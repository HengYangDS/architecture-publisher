import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

test('shipped authoring validators are reproducible from their exact public schemas', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'tools/generate-authoring-validators.mjs'), '--check'],
    { cwd: root, encoding: 'utf8', timeout: 30_000 },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('generated validator supply carries the generator license', async () => {
  const supplied = await fs.readFile(
    path.join(root, 'packages/publisher/src/edition/generated/LICENSE.schemasafe'),
  );
  const upstream = await fs.readFile(path.join(root, 'node_modules/@exodus/schemasafe/LICENSE'));
  assert.deepEqual(supplied, upstream);
});
