import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const handoffPath = path.join(root, 'conformance/fixtures/ethos-source-owned-handoff.json');
const thisTest = path.relative(root, import.meta.filename);

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

test('source-owned ETHOS handoff binds exact packages, parity and successor limits', async () => {
  const handoff = await readJson(handoffPath);
  assert.equal(handoff.schema, 'ethos.architecture-publisher-handoff/v1');
  assert.equal(handoff.publisher.commit, '7652d83251ebd33d44a21e935e56972d41482599');
  assert.equal(handoff.ethos.commit, 'a798079c2a6631bb56851740b1a73fd11be26440');
  for (const value of [
    handoff.publisher.corePackageSha256,
    handoff.publisher.stagingPackageSha256,
    handoff.ethos.integrationTree,
    handoff.ethos.integrationPackageSha256,
    ...Object.values(handoff.acceptedParity),
    ...Object.values(handoff.terminalCandidate).filter((value) => typeof value === 'string'),
  ])
    assert.match(value, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/);
  assert.deepEqual(handoff.semanticSuccessor, {
    nodes: ['adoption_exit', 'candidate_base_stale', 'mcp_a2a', 'skills'],
    relations: ['candidate-state-to-independent'],
    assertions: ['projection', 'verification'],
    humanReviewPredicates: 6,
    acceptance: 'reaccept',
    publication: 'replace',
  });
  assert.deepEqual(handoff.limits, [
    'semantic acceptance not performed',
    'browser acceptance not performed',
    'human visual review not performed',
    'raster publication not performed',
  ]);
});

test('Publisher retains only immutable ETHOS conformance evidence', async () => {
  await assert.rejects(fs.stat(path.join(root, 'migration/ethos')), {code: 'ENOENT'});
  const tracked = execFileSync('git', ['ls-files'], {cwd: root, encoding: 'utf8'})
    .trim()
    .split('\n');
  assert.equal(tracked.some((file) => file.startsWith('migration/ethos/')), false);
  const current = await Promise.all(
    tracked
      .filter(
        (file) =>
          /\.(?:json|md|mjs)$/.test(file) &&
          ![path.relative(root, handoffPath), thisTest].includes(file),
      )
      .map(async (file) => [file, await fs.readFile(path.join(root, file), 'utf8')]),
  );
  const references = current
    .filter(([, content]) => content.includes('migration/ethos'))
    .map(([file]) => file);
  assert.deepEqual(references, ['openspec/changes/architecture-publisher-0-2/design.md']);
});
