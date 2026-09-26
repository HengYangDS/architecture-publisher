import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';

const source = fileURLToPath(new URL('../examples/selected-edition/', import.meta.url));
const cli = fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('the selected Edition example builds the same paired Candidate after relocation', async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-example-'));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const results = [];
  for (const name of ['first', 'relocated']) {
    const root = path.join(scratch, name);
    await fs.cp(source, root, { recursive: true });
    const request = path.join(root, 'build-request.json');
    const digest = sha(await fs.readFile(request));
    const output = path.join(root, 'candidate');
    const built = spawnSync(
      process.execPath,
      [cli, 'edition', 'build', request, '--sha256', digest, '--output', output],
      {
        cwd: root,
        env: { HOME: root, PATH: root, LANG: 'C.UTF-8' },
        encoding: 'utf8',
        timeout: 30_000,
      },
    );
    assert.equal(built.status, 0, built.stdout + built.stderr);
    const result = JSON.parse(built.stdout);
    const bundle = await readSourceBundle(result.manifestPath, result.manifestSha256);
    assert.deepEqual(
      new Set(bundle.members.map(({ path: member }) => member)),
      new Set([
        'candidate.json',
        'input-lock.json',
        'static/architecture.svg',
        'static/architecture.png',
        'interactive/architecture.html',
      ]),
    );
    const candidate = JSON.parse(
      bundle.members.find(({ path: member }) => member === 'candidate.json').content,
    );
    assert.equal(candidate.qualification, 'unqualified');
    assert.deepEqual(Object.keys(candidate.media).sort(), ['interactive', 'static']);
    results.push(result.manifestSha256);
  }
  assert.equal(results[0], results[1]);
});
