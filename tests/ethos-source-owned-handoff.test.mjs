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
  assert.deepEqual(Object.keys(handoff.publisher).sort(), [
    'core',
    'retiredEthosStaging',
  ]);
  assert.deepEqual(handoff.publisher.core, {
    tree: '41a4934a9951e80ff23ed2874012dfc7498d31d6',
    packageSha256: '3befbb6fa27c05e1295ff46bcddc52d35d52aa70f223b7228aee6285fc171503',
  });
  assert.deepEqual(handoff.publisher.retiredEthosStaging, {
    commit: '7652d83251ebd33d44a21e935e56972d41482599',
    tree: 'de973462a508c8d213c5ac1143cd52d8bd9576bb',
    packageSha256: 'a8897c64da17fd2e92d5b68b93425245ae283def3f47955c45378d4497c56134',
  });
  assert.deepEqual(handoff.ethos.integration, {
    tree: 'fad20d92bb4c04fdba6038a879690a81357fb223',
    packageSha256: '04628f752d677aa9d0b6d0b9ef056bcf85e987a28b9582a669e057b084ddf044',
  });
  for (const value of [
    handoff.publisher.core.tree,
    handoff.publisher.core.packageSha256,
    handoff.publisher.retiredEthosStaging.commit,
    handoff.publisher.retiredEthosStaging.tree,
    handoff.publisher.retiredEthosStaging.packageSha256,
    handoff.ethos.integration.tree,
    handoff.ethos.integration.packageSha256,
    ...Object.values(handoff.acceptedParity),
    ...Object.values(handoff.terminalCandidate).filter((value) => typeof value === 'string'),
  ])
    assert.match(value, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/);
  assert.equal(execFileSync('git', ['cat-file', '-t', handoff.publisher.core.tree], {
    cwd: root,
    encoding: 'utf8',
  }).trim(), 'tree');
  assert.equal(
    execFileSync(
      'git',
      [
        'rev-parse',
        `${handoff.publisher.retiredEthosStaging.commit}:migration/ethos`,
      ],
      { cwd: root, encoding: 'utf8' },
    ).trim(),
    handoff.publisher.retiredEthosStaging.tree,
  );
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
