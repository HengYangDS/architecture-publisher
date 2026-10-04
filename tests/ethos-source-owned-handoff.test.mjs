import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  archivePackageSource,
  assertPackageSourceReplay,
  npmPackageIdentity,
} from './fixtures/package-identity.mjs';
import { execNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const root = path.resolve(import.meta.dirname, '..');
const handoffPath = path.join(root, 'tests/conformance/fixtures/ethos-source-owned-handoff.json');
const thisTest = path.relative(root, import.meta.filename).replaceAll('\\', '/');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function filesBelow(directory, prefix = '') {
  const files = [];
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = prefix + item.name;
    if (item.isDirectory())
      files.push(...(await filesBelow(path.join(directory, item.name), relative + '/')));
    else if (item.isFile()) files.push(relative);
    else assert.fail(`unexpected packed entry: ${relative}`);
  }
  return files.sort();
}

test('source-owned ETHOS handoff binds exact packages, parity and successor limits', async (t) => {
  const handoff = await readJson(handoffPath);
  assert.equal(handoff.schema, 'ethos.architecture-publisher-handoff/v4');
  assert.deepEqual(Object.keys(handoff.publisher).sort(), [
    'core',
    'retiredEthosStaging',
    'successor',
  ]);
  assert.deepEqual(handoff.publisher.core, {
    source: {
      repository: 'dig/research/human-agent-stewardship/architecture-publisher',
      commit: '53cbc38412a6193fc535cb8605129ff8d222cfeb',
      path: 'packages/publisher',
      objectType: 'tree',
      oid: 'a4c6e3e1e0d8b158ec7c4c83e061a8ca3e3d7177',
    },
    package: {
      name: 'architecture-publisher',
      version: '0.2.0-alpha.0',
      file: 'architecture-publisher-0.2.0-alpha.0.tgz',
      archiveSha256: 'f853ae1fb149ef1329fd28e5230c7f76101eeab4d63d8ec81b6b3324b272f2f3',
      contentTarSha256: '8de116f7a569fb2d0ba3245a7aa117c458cabab5b548e059f6bffb54956cf317',
    },
  });
  assert.deepEqual(handoff.publisher.retiredEthosStaging, {
    source: {
      repository: 'dig/research/human-agent-stewardship/architecture-publisher',
      commit: 'b3ad449f38bcc568786b40ecbc9255d88652356e',
      path: 'migration/ethos',
      objectType: 'tree',
      oid: 'de973462a508c8d213c5ac1143cd52d8bd9576bb',
    },
    package: {
      name: '@architecture-publisher/ethos',
      version: '0.2.0-alpha.0',
      file: 'architecture-publisher-ethos-0.2.0-alpha.0.tgz',
      archiveSha256: 'a8897c64da17fd2e92d5b68b93425245ae283def3f47955c45378d4497c56134',
      contentTarSha256: 'f438d1c235ac5e32926d0ccec8fc7fa06f577a23409f13fd6a84360ae147e266',
    },
  });
  assert.deepEqual(handoff.publisher.successor, {
    state: 'release-candidate',
    targetTag: 'v0.3.0-alpha.1',
    source: {
      repository: 'dig/research/human-agent-stewardship/architecture-publisher',
      commit: '7e82da7816e461f135076a6f984490d978a3a515',
      path: 'packages/publisher',
      objectType: 'tree',
      oid: '336d0e58058ba2b04b90208582bd4b3fb1f052f0',
    },
    package: {
      name: 'architecture-publisher',
      version: '0.3.0-alpha.1',
      file: 'architecture-publisher-0.3.0-alpha.1.tgz',
      archiveSha256: 'c2707bcffc9ba0cea277cb3b6f4fb6f04f2755996781f92c035fa9cadb4dcc37',
      contentTarSha256: '6b0a925f85879ea7a576c5153849e2741d2e54fcd83bf068cfb5a473b8c7d682',
    },
    evidenceBoundary:
      'Exact source tree and reproducible package candidate; tag, Forge release, installation, and ETHOS migration remain separate facts.',
  });
  assert.deepEqual(handoff.ethos.integration, {
    source: {
      repository: 'dig/research/human-agent-stewardship/ethos',
      commit: '2a1e5dd1d01bc536697c9839cde0d5d177f2f0dd',
      path: 'integrations/architecture-publisher',
      objectType: 'tree',
      oid: 'fad20d92bb4c04fdba6038a879690a81357fb223',
    },
    package: {
      name: '@architecture-publisher/ethos',
      version: '0.2.0-alpha.0',
      file: 'architecture-publisher-ethos-0.2.0-alpha.0.tgz',
      archiveSha256: '04628f752d677aa9d0b6d0b9ef056bcf85e987a28b9582a669e057b084ddf044',
      contentTarSha256: '2b96ba9cfb782a752eb3d399968f3225e67968e695cf73df92615264fe8f38d1',
    },
  });
  assert.deepEqual(handoff.ethos.acceptance, {
    repositoryTree: '4211ba560b6c6291ad9290ed8aa3d2565e620eec',
    acceptedRefs: ['dev', 'main'],
    runtimeDigest: 'ab7ad09e9522ca7f8e883405f8d09633fef5d08cc2b2c761c73976f622571704',
    packageReproducibility: 2,
    proof: {
      verdict: 'pass',
      gates: 35,
      testsPassed: 4328,
      testsSkipped: 2,
      combinedCoveragePercent: 95.052,
    },
    archivedChange: '2026-09-21-architecture-publisher-adoption',
    remotePublication: 'unproved',
  });
  assert.deepEqual(handoff.ethos.providerMigration, {
    schema: 'architecture.edition-provider-migration/v1',
    status: 'proposed-not-authorized',
    mode: 'executable',
    targetRoot: 'integrations/architecture-publisher/provider',
    retainedResponsibilities: ['source-adaptation', 'claim-model-authorship', 'edition-authorship'],
    removedAfterParity: [
      'renderer',
      'browser',
      'raster',
      'qualification',
      'review',
      'publication',
      'git',
      'forge',
      'governance',
    ],
    subject: 'ETHOS',
    producer: 'Architecture Publisher',
    authorizationOwner: 'ETHOS',
    custodian: 'ETHOS release target',
    parity: 'required-before-removal',
    relocation: 'required-before-removal',
    rollback: 'required-before-removal',
    baseline: 'acceptedParity',
    conformancePredicates: [
      'manifest-closure',
      'input-identity',
      'output-schema',
      'determinism',
      'relocation',
      'empty-configuration',
      'adjacent-checkout-immunity',
      'dependency-direction',
      'resource-bounds',
      'later-stage-rejection',
    ],
    removalCriteria: [
      'provider-conformance-pass',
      'candidate-parity-or-approved-successor',
      'relocated-installed-pass',
      'rollback-rehearsed',
      'ethos-reaccepted',
    ],
    feedback: 'non-authorizing-source-proposal',
    publisherAuthority: 'none',
  });
  for (const value of [
    handoff.publisher.core.source.commit,
    handoff.publisher.core.source.oid,
    handoff.publisher.core.package.archiveSha256,
    handoff.publisher.core.package.contentTarSha256,
    handoff.publisher.retiredEthosStaging.source.commit,
    handoff.publisher.retiredEthosStaging.source.oid,
    handoff.publisher.retiredEthosStaging.package.archiveSha256,
    handoff.publisher.retiredEthosStaging.package.contentTarSha256,
    handoff.publisher.successor.source.commit,
    handoff.publisher.successor.source.oid,
    handoff.publisher.successor.package.archiveSha256,
    handoff.publisher.successor.package.contentTarSha256,
    handoff.ethos.integration.source.commit,
    handoff.ethos.integration.source.oid,
    handoff.ethos.integration.package.archiveSha256,
    handoff.ethos.integration.package.contentTarSha256,
    handoff.ethos.acceptance.repositoryTree,
    handoff.ethos.acceptance.runtimeDigest,
    ...Object.values(handoff.acceptedParity),
    ...Object.values(handoff.terminalCandidate).filter((value) => typeof value === 'string'),
  ])
    assert.match(value, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/);
  assert.equal(
    execFileSync('git', ['cat-file', '-t', handoff.publisher.core.source.commit], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    'commit',
  );
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
  await fs.mkdir(base, { recursive: true });
  const work = await fs.mkdtemp(path.join(base, 'core-provenance-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const source = path.join(work, 'source');
  await fs.mkdir(source);
  const sourceArchive = archivePackageSource({
    repository: root,
    tree: `${handoff.publisher.core.source.commit}:${handoff.publisher.core.source.path}`,
  });
  execFileSync('tar', ['-xf', '-', '-C', source], { input: sourceArchive });
  const pack = parseNpmPackRecord(
    execNativeSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', work], {
      cwd: source,
      encoding: 'utf8',
    }),
  );
  const archive = path.join(work, pack.filename);
  const packageIdentity = npmPackageIdentity(await fs.readFile(archive));
  if (process.platform !== 'win32')
    assert.equal(packageIdentity.contentTarSha256, handoff.publisher.core.package.contentTarSha256);
  execFileSync('tar', ['-xzf', archive, '-C', work]);
  const packedRoot = path.join(work, 'package');
  const packedFiles = await filesBelow(packedRoot);
  await assertPackageSourceReplay({
    repository: root,
    tree: handoff.publisher.core.source.oid,
    root: packedRoot,
    files: packedFiles,
  });
  assert.equal(packedFiles.length, 117);

  assert.equal(
    execFileSync('git', ['cat-file', '-t', handoff.publisher.successor.source.commit], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    'commit',
  );
  assert.equal(
    execFileSync(
      'git',
      [
        'rev-parse',
        `${handoff.publisher.successor.source.commit}:${handoff.publisher.successor.source.path}`,
      ],
      { cwd: root, encoding: 'utf8' },
    ).trim(),
    handoff.publisher.successor.source.oid,
  );
  const successorSource = path.join(work, 'successor-source');
  await fs.mkdir(successorSource);
  const successorArchive = archivePackageSource({
    repository: root,
    tree: `${handoff.publisher.successor.source.commit}:${handoff.publisher.successor.source.path}`,
  });
  execFileSync('tar', ['-xf', '-', '-C', successorSource], { input: successorArchive });
  const successorPack = parseNpmPackRecord(
    execNativeSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', work], {
      cwd: successorSource,
      encoding: 'utf8',
    }),
  );
  assert.equal(successorPack.filename, handoff.publisher.successor.package.file);
  const successorIdentity = npmPackageIdentity(
    await fs.readFile(path.join(work, successorPack.filename)),
  );
  assert.match(handoff.publisher.successor.package.archiveSha256, /^[0-9a-f]{64}$/u);
  assert.match(successorIdentity.archiveSha256, /^[0-9a-f]{64}$/u);
  if (process.platform !== 'win32')
    assert.equal(
      successorIdentity.contentTarSha256,
      handoff.publisher.successor.package.contentTarSha256,
    );
  const successorPackedRoot = path.join(work, 'successor-packed');
  await fs.mkdir(successorPackedRoot);
  execFileSync(
    'tar',
    ['-xzf', path.join(work, successorPack.filename), '-C', successorPackedRoot],
    {
      timeout: 30_000,
    },
  );
  await assertPackageSourceReplay({
    repository: root,
    tree: handoff.publisher.successor.source.oid,
    root: path.join(successorPackedRoot, 'package'),
    files: successorPack.files.map(({ path: file }) => file),
  });
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
  await assert.rejects(fs.stat(path.join(root, 'migration/ethos')), { code: 'ENOENT' });
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .trim()
    .split('\n');
  assert.equal(
    tracked.some((file) => file.startsWith('migration/ethos/')),
    false,
  );
  const current = (
    await Promise.all(
      tracked
        .filter(
          (file) =>
            /\.(?:json|md|mjs)$/.test(file) &&
            !file.startsWith('openspec/changes/') &&
            ![path.relative(root, handoffPath).replaceAll('\\', '/'), thisTest].includes(file),
        )
        .map(async (file) => {
          try {
            return [file, await fs.readFile(path.join(root, file), 'utf8')];
          } catch (error) {
            if (error?.code === 'ENOENT') return null;
            throw error;
          }
        }),
    )
  ).filter(Boolean);
  const references = current
    .filter(([, content]) => content.includes('migration/ethos'))
    .map(([file]) => file);
  assert.deepEqual(references, []);

  const archivedDesign = await fs.readFile(
    path.join(root, 'openspec/changes/archive/2026-09-22-architecture-publisher-0-2/design.md'),
    'utf8',
  );
  assert.match(archivedDesign, /migration\/ethos/u);
});
