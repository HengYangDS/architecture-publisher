import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { createEditionCandidate } from '../packages/publisher/src/compiler/candidate.mjs';
import {
  interactiveSceneDigest,
  staticSceneDigest,
} from '../packages/publisher/src/edition/contract.mjs';
import {
  bindQualificationRecord,
  bindQualificationSet,
} from '../packages/publisher/src/qualification/contract.mjs';
import { editionFixture } from './fixtures/edition.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('packed CLI verifies relocated non-Git input without development executables', async (t) => {
  const work = path.join(root, 'build/test-work');
  await fs.mkdir(work, { recursive: true });
  const tmp = await fs.mkdtemp(path.join(work, 'installed with spaces-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const env = {
    ...process.env,
    npm_config_update_notifier: 'false',
    npm_config_audit: 'false',
  };
  const pack = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', tmp], {
    cwd: publisher,
    env,
    encoding: 'utf8',
  });
  assert.equal(pack.status, 0, pack.stderr);
  const info = parseNpmPackRecord(pack.stdout);
  assert(info.files.some((f) => f.path === 'src/cli/main.mjs'));
  assert(
    info.files.every(
      (f) =>
        f.path === 'README.md' ||
        f.path === 'package.json' ||
        f.path.startsWith('src/') ||
        f.path.startsWith('assets/') ||
        f.path.startsWith('renderers/'),
    ),
  );
  const install = path.join(tmp, 'consumer');
  await fs.mkdir(install);
  const installed = spawnSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--offline',
      '--prefix',
      install,
      path.join(tmp, info.filename),
    ],
    { cwd: install, env, encoding: 'utf8' },
  );
  assert.equal(installed.status, 0, installed.stderr);
  const pkg = path.join(install, 'node_modules/architecture-publisher');
  const packageJson = JSON.parse(await fs.readFile(path.join(pkg, 'package.json'), 'utf8'));
  assert.deepEqual(packageJson.dependencies ?? {}, {});
  await assert.rejects(fs.stat(path.join(install, 'node_modules/acorn')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(pkg, 'node_modules')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.stat(path.join(install, '.git')), {
    code: 'ENOENT',
  });
  const input = path.join(tmp, 'relocated input');
  await fs.mkdir(input);
  const data = Buffer.from('all services may retry only on a transient failure\n');
  await fs.writeFile(path.join(input, 'source.txt'), data);
  const manifest = Buffer.from(
    JSON.stringify({
      schema: 'architecture.source-bundle/v1',
      source: { id: 'service:test', revision: 'r2' },
      files: [{ path: 'source.txt', bytes: data.length, sha256: sha(data) }],
    }),
  );
  await fs.writeFile(path.join(input, 'manifest.json'), manifest);
  const home = path.join(tmp, 'empty-home');
  await fs.mkdir(home);
  const run = (args) =>
    spawnSync(process.execPath, [path.join(pkg, 'src/cli/main.mjs'), ...args], {
      cwd: install,
      env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
      encoding: 'utf8',
    });
  const args = [
    'source',
    'verify',
    path.relative(install, path.join(input, 'manifest.json')),
    '--sha256',
    sha(manifest),
  ];
  const ok = run(args);
  assert.equal(ok.status, 0, ok.stderr);
  const result = JSON.parse(ok.stdout);
  assert.equal(result.status, 'verified');
  assert.equal(result.source.revision, 'r2');
  assert.equal(result.members[0].sha256, sha(data));
  assert(!ok.stdout.includes(tmp));
  assert.equal(result.officialReplay, 'not-performed');

  const selected = editionFixture(),
    claimModelBytes = Buffer.from(JSON.stringify(selected.model, null, 2) + '\n'),
    editionBytes = Buffer.from(JSON.stringify(selected.edition, null, 2) + '\n'),
    candidate = createEditionCandidate({
      sourceManifestSha256: selected.edition.source.manifestSha256,
      claimModelSha256: sha(claimModelBytes),
      claimModel: selected.model,
      editionSha256: sha(editionBytes),
      edition: selected.edition,
      media: {
        static: {
          sceneSha256: staticSceneDigest(selected.model, selected.edition),
          artifacts: [
            {
              id: 'overview-png',
              mediaType: 'image/png',
              bytes: 1,
              path: 'static/architecture-publisher-6000.png',
              sha256: sha(Buffer.from('png')),
            },
          ],
          supplies: [{ id: 'raster', sha256: sha(Buffer.from('raster')) }],
        },
        interactive: {
          sceneSha256: interactiveSceneDigest(selected.model, selected.edition),
          artifacts: [
            {
              id: 'atlas',
              mediaType: 'text/html',
              bytes: 1,
              path: 'interactive/architecture-publisher.html',
              sha256: sha(Buffer.from('html')),
            },
          ],
          supplies: [{ id: 'archify', sha256: sha(Buffer.from('archify')) }],
        },
      },
    }),
    records = candidate.obligations.map(({ kind, predicate }, index) =>
      bindQualificationRecord(candidate, {
        id: `${kind}.${index}`,
        kind,
        verifier: {
          kind: 'machine',
          id: `installed-test:${kind}`,
          implementationSha256: sha(Buffer.from(`installed-test:${kind}`)),
        },
        predicate,
        scope: { kind: 'fixture', value: predicate },
        environment: null,
        observations: [{ name: 'result', value: 'valid' }],
        verdict: 'PASS',
        limitations: [],
      }),
    ),
    qualification = bindQualificationSet(candidate, records),
    candidateBytes = Buffer.from(JSON.stringify(candidate, null, 2) + '\n'),
    qualificationBytes = Buffer.from(JSON.stringify(qualification, null, 2) + '\n'),
    qualificationFiles = {
      'claim-model.json': claimModelBytes,
      'edition.json': editionBytes,
      'candidate.json': candidateBytes,
      'qualification.json': qualificationBytes,
    };
  await Promise.all(
    Object.entries(qualificationFiles).map(([name, bytes]) =>
      fs.writeFile(path.join(tmp, name), bytes),
    ),
  );
  const qualificationRequest = {
      schema: 'architecture.qualification-input/v1',
      claimModel: {
        path: 'claim-model.json',
        sha256: sha(claimModelBytes),
      },
      edition: {
        path: 'edition.json',
        sha256: sha(editionBytes),
      },
      candidate: {
        path: 'candidate.json',
        sha256: sha(candidateBytes),
      },
      qualification: {
        path: 'qualification.json',
        sha256: sha(qualificationBytes),
      },
    },
    qualificationRequestBytes = Buffer.from(JSON.stringify(qualificationRequest, null, 2) + '\n'),
    qualificationRequestPath = path.join(tmp, 'qualification-request.json');
  await fs.writeFile(qualificationRequestPath, qualificationRequestBytes);
  const qualified = run([
    'qualify',
    'verify',
    qualificationRequestPath,
    '--sha256',
    sha(qualificationRequestBytes),
  ]);
  assert.equal(qualified.status, 0, qualified.stdout + qualified.stderr);
  assert.deepEqual(
    {
      status: JSON.parse(qualified.stdout).status,
      verdict: JSON.parse(qualified.stdout).verdict,
      complete: JSON.parse(qualified.stdout).complete,
      admitted: JSON.parse(qualified.stdout).admitted,
      authorization: JSON.parse(qualified.stdout).authorization,
      publication: JSON.parse(qualified.stdout).publication,
    },
    {
      status: 'verified',
      verdict: 'PASS',
      complete: true,
      admitted: true,
      authorization: 'not-performed',
      publication: 'not-performed',
    },
  );

  await fs.writeFile(path.join(input, 'extra.txt'), 'undeclared');
  const bad = run(args);
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).error.code, 'bundle_members_mismatch');
  const usage = run(['source', 'verify']);
  assert.equal(usage.status, 2);
  assert.equal(JSON.parse(usage.stdout).error.code, 'usage');
});
