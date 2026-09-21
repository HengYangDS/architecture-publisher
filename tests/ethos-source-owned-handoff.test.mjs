import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const handoffPath = path.join(root, 'conformance/fixtures/ethos-source-owned-handoff.json');
const thisTest = path.relative(root, import.meta.filename);

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function filesBelow(directory, prefix = '') {
  const files = [];
  for (const item of await fs.readdir(directory, {withFileTypes: true})) {
    const relative = prefix + item.name;
    if (item.isDirectory())
      files.push(...await filesBelow(path.join(directory, item.name), relative + '/'));
    else if (item.isFile()) files.push(relative);
    else assert.fail(`unexpected packed entry: ${relative}`);
  }
  return files.sort();
}

test('source-owned ETHOS handoff binds exact packages, parity and successor limits', async (t) => {
  const handoff = await readJson(handoffPath);
  assert.equal(handoff.schema, 'ethos.architecture-publisher-handoff/v2');
  assert.deepEqual(Object.keys(handoff.publisher).sort(), [
    'core',
    'retiredEthosStaging',
  ]);
  assert.deepEqual(handoff.publisher.core, {
    source: {
      repository: 'dig/research/human-agent-stewardship/architecture-publisher',
      commit: 'acf14d6d652e019da21cc774eaaae995692a2bbd',
      path: 'packages/publisher',
      objectType: 'tree',
      oid: 'a4c6e3e1e0d8b158ec7c4c83e061a8ca3e3d7177',
    },
    package: {
      name: 'architecture-publisher',
      version: '0.2.0-alpha.0',
      file: 'architecture-publisher-0.2.0-alpha.0.tgz',
      sha256: 'f853ae1fb149ef1329fd28e5230c7f76101eeab4d63d8ec81b6b3324b272f2f3',
    },
  });
  assert.deepEqual(handoff.publisher.retiredEthosStaging, {
    source: {
      repository: 'dig/research/human-agent-stewardship/architecture-publisher',
      commit: '7652d83251ebd33d44a21e935e56972d41482599',
      path: 'migration/ethos',
      objectType: 'tree',
      oid: 'de973462a508c8d213c5ac1143cd52d8bd9576bb',
    },
    package: {
      name: '@architecture-publisher/ethos',
      version: '0.2.0-alpha.0',
      file: 'architecture-publisher-ethos-0.2.0-alpha.0.tgz',
      sha256: 'a8897c64da17fd2e92d5b68b93425245ae283def3f47955c45378d4497c56134',
    },
  });
  assert.deepEqual(handoff.ethos.integration, {
    source: {
      repository: 'dig/research/human-agent-stewardship/ethos',
      commit: '7190c30a0541917388c234ccacd5ecb6078f92f6',
      path: 'integrations/architecture-publisher',
      objectType: 'tree',
      oid: 'fad20d92bb4c04fdba6038a879690a81357fb223',
    },
    package: {
      name: '@architecture-publisher/ethos',
      version: '0.2.0-alpha.0',
      file: 'architecture-publisher-ethos-0.2.0-alpha.0.tgz',
      sha256: '04628f752d677aa9d0b6d0b9ef056bcf85e987a28b9582a669e057b084ddf044',
    },
  });
  for (const value of [
    handoff.publisher.core.source.commit,
    handoff.publisher.core.source.oid,
    handoff.publisher.core.package.sha256,
    handoff.publisher.retiredEthosStaging.source.commit,
    handoff.publisher.retiredEthosStaging.source.oid,
    handoff.publisher.retiredEthosStaging.package.sha256,
    handoff.ethos.integration.source.commit,
    handoff.ethos.integration.source.oid,
    handoff.ethos.integration.package.sha256,
    ...Object.values(handoff.acceptedParity),
    ...Object.values(handoff.terminalCandidate).filter((value) => typeof value === 'string'),
  ])
    assert.match(value, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/);
  assert.equal(execFileSync('git', ['cat-file', '-t', handoff.publisher.core.source.commit], {
    cwd: root,
    encoding: 'utf8',
  }).trim(), 'commit');
  assert.equal(
    execFileSync(
      'git',
      [
        'rev-parse',
        `${handoff.publisher.core.source.commit}:${handoff.publisher.core.source.path}`,
      ],
      { cwd: root, encoding: 'utf8' },
    ).trim(),
    handoff.publisher.core.source.oid,
  );
  assert.equal(
    execFileSync('git', ['cat-file', '-t', handoff.publisher.core.source.oid], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    handoff.publisher.core.source.objectType,
  );

  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, {recursive: true});
  const work = await fs.mkdtemp(path.join(base, 'core-provenance-'));
  t.after(() => fs.rm(work, {recursive: true, force: true}));
  const pack = JSON.parse(execFileSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
    {cwd: path.join(root, handoff.publisher.core.source.path), encoding: 'utf8'},
  ))[0];
  const archive = path.join(work, pack.filename);
  assert.equal(sha(await fs.readFile(archive)), handoff.publisher.core.package.sha256);
  execFileSync('tar', ['-xzf', archive, '-C', work]);
  const packedRoot = path.join(work, 'package');
  const packedFiles = await filesBelow(packedRoot);
  assert.equal(packedFiles.length, 117);
  for (const file of packedFiles) {
    const selected = await fs.readFile(path.join(packedRoot, file));
    const committed = execFileSync(
      'git',
      ['show', `${handoff.publisher.core.source.oid}:${file}`],
      {cwd: root, maxBuffer: 16 * 1024 * 1024},
    );
    assert.deepEqual(selected, committed, file);
  }
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
