import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import test from 'node:test';
import { readArchitecturePublisherSelfEditionRuntime } from '../editions/self/src/runtime.mjs';

test('self Edition runtime inventory binds every selected byte and the package manifest', async () => {
  const members = await readArchitecturePublisherSelfEditionRuntime();
  const paths = members.map((member) => member.path);
  assert(paths.includes('package.json'));
  assert(paths.includes('src/runtime.mjs'));
  assert(paths.includes('src/edition/prepare.mjs'));
  assert.deepEqual(
    paths,
    [...paths].sort((left, right) => left.localeCompare(right)),
  );
  assert.equal(new Set(paths).size, paths.length);
  for (const member of members) {
    const bytes = await fs.readFile(member.file);
    assert.equal(member.bytes, bytes.length, member.path);
    assert.equal(member.sha256, createHash('sha256').update(bytes).digest('hex'), member.path);
  }
});
