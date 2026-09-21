import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { readPublisherRuntime } from 'architecture-publisher/runtime';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('the public runtime reader returns one sorted exact installed closure', async () => {
  const members = await readPublisherRuntime();
  const paths = members.map((member) => member.path);

  assert.deepEqual(
    paths,
    [...paths].sort((left, right) => left.localeCompare(right)),
  );
  assert(paths.includes('package.json'));
  assert(paths.includes('src/index.mjs'));
  assert(paths.some((member) => member.startsWith('renderers/')));

  for (const member of members) {
    assert.equal(path.isAbsolute(member.path), false);
    const bytes = await fs.readFile(member.file);
    assert.equal(member.bytes, bytes.length, member.path);
    assert.equal(member.sha256, sha256(bytes), member.path);
  }
});
