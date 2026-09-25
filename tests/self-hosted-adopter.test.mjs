import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  bindQualificationRecord,
  bindQualificationSet,
} from '../packages/publisher/src/qualification/index.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { runProviderConformance } from '../conformance/journeys/provider/run.mjs';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 90000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

test('the installed product builds its structural self-portrait through the public contract', async (t) => {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, 'self-hosted-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const installation = await installCoreAndSelf(root, directory),
    { consumer, coreRoot: pkg, selfRoot } = installation,
    home = path.join(directory, 'home');
  await fs.mkdir(home);
  const physicalParent = path.join(directory, 'physical-inputs'),
    aliasedParent = path.join(directory, 'aliased-inputs');
  await fs.mkdir(physicalParent);
  await fs.symlink(physicalParent, aliasedParent, 'dir');
  const decoy = path.join(directory, 'architecture-publisher');
  await fs.mkdir(decoy);
  await fs.writeFile(path.join(decoy, 'DO-NOT-READ'), 'misleading adjacent checkout\n');
  const journey = path.join(consumer, 'self-host-build.mjs');
  await fs.copyFile(path.join(root, 'conformance/journeys/self-host/build.mjs'), journey);
  const inputs = path.join(aliasedParent, 'inputs'),
    publication = path.join(directory, 'publication'),
    installedEnvironment = {
      HOME: home,
      PATH: home,
      XDG_CONFIG_HOME: path.join(home, 'config'),
      XDG_CACHE_HOME: path.join(home, 'cache'),
      XDG_DATA_HOME: path.join(home, 'data'),
      LANG: 'C.UTF-8',
    },
    selected = JSON.parse(run(process.execPath, [journey, inputs], consumer, installedEnvironment)),
    plan = JSON.parse(await fs.readFile(selected.plan, 'utf8')),
    providerBytes = await fs.readFile(selected.providerManifest),
    provider = JSON.parse(providerBytes);
  await assert.rejects(
    fs.stat(path.join(pkg, 'conformance/journeys/self-host/browser-acceptance.json')),
    { code: 'ENOENT' },
  );
  await assert.rejects(fs.stat(path.join(pkg, 'migration/aigw/browser-acceptance.json')), {
    code: 'ENOENT',
  });
  await fs.access(path.join(selfRoot, 'package.json'));
  const runtimeDriver = path.join(consumer, 'self-runtime.mjs');
  await fs.writeFile(
    runtimeDriver,
    [
      "import { readArchitecturePublisherSelfEditionRuntime } from '@architecture-publisher/self-edition/runtime';",
      'const members = await readArchitecturePublisherSelfEditionRuntime();',
      "process.stdout.write(JSON.stringify({count:members.length,paths:members.map(({path})=>path)}) + '\\n');",
      '',
    ].join('\n'),
  );
  const selfRuntime = JSON.parse(
    run(process.execPath, [runtimeDriver], consumer, installedEnvironment),
  );
  assert(selfRuntime.count > 1);
  assert(selfRuntime.paths.includes('package.json'));
  assert.equal(path.dirname(selected.plan), path.join(physicalParent, 'inputs'));
  assert.equal(
    path.dirname(selected.sourceManifest),
    path.join(physicalParent, 'inputs', 'source'),
  );
  assert.equal(selected.providerManifestSha256, sha(providerBytes));
  assert.deepEqual(Object.keys(plan).sort(), [
    'output',
    'providerManifest',
    'providerManifestSha256',
  ]);
  assert.equal(plan.providerManifest, selected.providerManifest);
  assert.equal(plan.providerManifestSha256, selected.providerManifestSha256);
  const providerReport = await runProviderConformance({
    providerManifest: selected.providerManifest,
    providerManifestSha256: selected.providerManifestSha256,
  });
  assert.equal(providerReport.verdict, 'pass');
  assert.deepEqual(providerReport.materialized, provider.expected);
  assert.deepEqual(providerReport.authority, {
    acceptance: 'not-performed',
    publication: 'not-performed',
    independentVerification: 'not-performed',
  });
  plan.output = publication;
  const planBytes = Buffer.from(JSON.stringify(plan, null, 2) + '\n'),
    planPath = path.join(directory, 'plan.json');
  await fs.writeFile(planPath, planBytes);
  const response = JSON.parse(
      run(
        process.execPath,
        [
          path.join(pkg, 'src/cli/main.mjs'),
          'edition',
          'build',
          planPath,
          '--sha256',
          sha(planBytes),
        ],
        directory,
        { HOME: home, PATH: home, LANG: 'C.UTF-8' },
      ),
    ),
    output = await readSourceBundle(
      path.join(publication, 'manifest.json'),
      response.manifestSha256,
    ),
    members = new Map(output.members.map((item) => [item.path, item.content])),
    candidate = JSON.parse(members.get('candidate.json')),
    semantic = JSON.parse(members.get('semantic.json')),
    edition = JSON.parse(members.get('edition.json')),
    providerReceipt = JSON.parse(members.get('provider.json')),
    svg = members.get('overview.svg').toString(),
    html = members.get('views/overview.html').toString();
  assert.equal(
    edition.product.version,
    JSON.parse(await fs.readFile(path.join(pkg, 'package.json'), 'utf8')).version,
  );
  assert.equal(output.source.id, 'architecture-publisher');
  assert.equal(semantic.context.adoptionRole, 'self-hosted');
  assert.equal(semantic.context.independentAdopterEvidence, false);
  assert.equal(candidate.claimModel.digest, selected.semanticDigest);
  assert.equal(provider.delivery.edition, 'edition.json');
  assert.equal(provider.delivery.editionSha256, sha(await fs.readFile(selected.edition)));
  assert.deepEqual(edition, JSON.parse(await fs.readFile(selected.edition, 'utf8')));
  assert.equal(candidate.edition.sha256, provider.delivery.editionSha256);
  assert.equal(candidate.edition.digest, response.editionDigest);
  assert.equal(candidate.media.static.sceneSha256, response.staticSceneDigest);
  assert.equal(candidate.media.interactive.sceneSha256, response.interactiveSceneDigest);
  assert.equal(providerReceipt.delivery, 'declarative');
  assert.deepEqual(providerReceipt.materialized, provider.expected);
  assert.equal(sha(members.get('provider.json')), response.providerMaterializationSha256);
  assert.equal(response.status, 'built');
  assert.match(response.candidateSha256, /^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(response, 'qualification'), false);
  assert.equal(Object.hasOwn(response, 'publication'), false);

  const qualificationRoot = path.join(directory, 'qualification');
  await fs.mkdir(qualificationRoot);
  const records = candidate.obligations.map(({ kind, predicate }, index) =>
      bindQualificationRecord(candidate, {
        id: `${kind}.${index}`,
        kind,
        verifier: {
          kind: 'machine',
          id: `self-hosted:${kind}`,
          implementationSha256: sha(Buffer.from(`self-hosted:${kind}`)),
        },
        predicate,
        scope: { kind: 'fixture', value: predicate },
        environment: null,
        observations: [{ name: 'result', value: 'verified' }],
        verdict: 'PASS',
        limitations: [],
      }),
    ),
    qualification = bindQualificationSet(candidate, records),
    qualificationFiles = {
      'candidate.json': members.get('candidate.json'),
      'claim-model.json': members.get('semantic.json'),
      'edition.json': members.get('edition.json'),
      'qualification.json': Buffer.from(JSON.stringify(qualification, null, 2) + '\n'),
    };
  await Promise.all(
    Object.entries(qualificationFiles).map(([name, bytes]) =>
      fs.writeFile(path.join(qualificationRoot, name), bytes),
    ),
  );
  const qualificationRequest = {
      schema: 'architecture.qualification-input/v1',
      claimModel: {
        path: 'claim-model.json',
        sha256: sha(qualificationFiles['claim-model.json']),
      },
      edition: { path: 'edition.json', sha256: sha(qualificationFiles['edition.json']) },
      candidate: { path: 'candidate.json', sha256: sha(qualificationFiles['candidate.json']) },
      qualification: {
        path: 'qualification.json',
        sha256: sha(qualificationFiles['qualification.json']),
      },
    },
    qualificationRequestBytes = Buffer.from(JSON.stringify(qualificationRequest, null, 2) + '\n'),
    qualificationRequestPath = path.join(qualificationRoot, 'request.json');
  await fs.writeFile(qualificationRequestPath, qualificationRequestBytes);
  const qualified = JSON.parse(
    run(
      process.execPath,
      [
        path.join(pkg, 'src/cli/main.mjs'),
        'qualify',
        'verify',
        qualificationRequestPath,
        '--sha256',
        sha(qualificationRequestBytes),
      ],
      consumer,
      installedEnvironment,
    ),
  );
  assert.deepEqual(
    {
      status: qualified.status,
      verdict: qualified.verdict,
      complete: qualified.complete,
      admitted: qualified.admitted,
      authorization: qualified.authorization,
      publication: qualified.publication,
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

  const deliveryRoot = path.join(directory, 'delivery'),
    nativeDestination = path.join(deliveryRoot, 'native'),
    atlasDestination = path.join(deliveryRoot, 'atlas');
  await Promise.all([
    fs.mkdir(nativeDestination, { recursive: true }),
    fs.mkdir(atlasDestination, { recursive: true }),
  ]);
  const publicationInput = {
      options: {
        sourceRoots: ['.'],
        destinations: { native: nativeDestination, atlas: atlasDestination },
        recoveryRoot: path.join(directory, 'recovery'),
      },
      source: provider.subject,
      payload: [
        ['native', 'architecture-publisher.svg', 'overview.svg'],
        ['native', 'architecture-publisher-6000.png', 'overview.png'],
        ['atlas', 'architecture-publisher.html', 'views/overview.html'],
      ].map(([medium, artifactPath, source]) => {
        const bytes = members.get(source);
        return { medium, path: artifactPath, source, bytes: bytes.length, sha256: sha(bytes) };
      }),
      entries: {
        native: {
          'index.html': '<p>Architecture Publisher self-hosted static Edition</p>',
          'README.md': 'Architecture Publisher self-hosted static Edition.\n',
        },
        atlas: {
          'index.html': '<p>Architecture Publisher self-hosted interactive Edition</p>',
          'README.md': 'Architecture Publisher self-hosted interactive Edition.\n',
        },
      },
      dependencies: [],
    },
    publicationInputPath = path.join(publication, 'publication-input.json');
  await fs.writeFile(publicationInputPath, JSON.stringify(publicationInput));
  const invokePublication = (args) =>
    JSON.parse(
      run(
        process.execPath,
        [path.join(pkg, 'src/cli/main.mjs'), 'publish', ...args],
        consumer,
        installedEnvironment,
      ),
    );
  const firstPlan = invokePublication(['plan', publicationInputPath]);
  const publicationPlanPath = path.join(directory, 'publication-plan.json'),
    authorizationPath = path.join(directory, 'publication-authorization.json');
  await fs.writeFile(publicationPlanPath, JSON.stringify(firstPlan.plan));
  await fs.writeFile(
    authorizationPath,
    JSON.stringify({ decision: 'AUTHORIZED', planSha256: firstPlan.plan.sha256 }),
  );
  assert.equal(
    invokePublication(['apply', publicationPlanPath, authorizationPath]).status,
    'INSTALLED',
  );
  assert.equal(
    invokePublication(['recover', publicationPlanPath, authorizationPath]).status,
    'ALREADY_INSTALLED',
  );
  publicationInput.source.revision += ':replacement';
  publicationInput.replacement = {
    plan: firstPlan.plan,
    authorization: { decision: 'AUTHORIZED', planSha256: firstPlan.plan.sha256 },
  };
  await fs.writeFile(publicationInputPath, JSON.stringify(publicationInput));
  const replacement = invokePublication(['plan', publicationInputPath]);
  await fs.writeFile(publicationPlanPath, JSON.stringify(replacement.plan));
  await fs.writeFile(
    authorizationPath,
    JSON.stringify({ decision: 'AUTHORIZED', planSha256: replacement.plan.sha256 }),
  );
  assert.equal(
    invokePublication(['apply', publicationPlanPath, authorizationPath]).status,
    'INSTALLED',
  );
  assert.equal(
    invokePublication(['recover', publicationPlanPath, authorizationPath]).status,
    'ALREADY_INSTALLED',
  );

  for (const id of [
    'public-cli',
    'source-bundle',
    'semantic-contract',
    'publication-coordinator',
    'static-compositor',
    'interactive-renderer',
    'raster-boundary',
    'publication-writer',
  ]) {
    assert.match(svg, new RegExp(`data-node-id="${id}"`));
    assert.match(html, new RegExp(`data-node-id="${id}"`));
  }
  assert(
    members
      .get('overview.png')
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  );
  await assert.rejects(fs.access(path.join(consumer, '.git')), { code: 'ENOENT' });
});
