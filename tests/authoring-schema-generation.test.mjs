import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as edition from '../packages/publisher/src/edition/index.mjs';
import * as generated from '../packages/publisher/src/edition/generated/validators.mjs';

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

test('scene refinement is governed by the same generated closed-schema path', () => {
  assert.equal(edition.SCENE_REFINEMENT_SCHEMA?.$id, 'architecture.scene-refinement/v1');
  assert.equal(typeof generated.sceneRefinementValid, 'function');
  const selected = {
    schema: 'architecture.scene-refinement/v1',
    media: { static: { view: 'overview', nodes: [], edges: [], groups: [] } },
  };
  assert.equal(generated.sceneRefinementValid(selected), true);
  selected.media.static.html = '<svg/>';
  assert.equal(generated.sceneRefinementValid(selected), false);
});
