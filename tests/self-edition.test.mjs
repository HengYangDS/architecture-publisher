import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import {
  editionCandidateDigest,
  validateEditionCandidate,
} from '../packages/publisher/src/compiler/candidate.mjs';
import { validateEdition } from '../packages/publisher/src/edition/contract.mjs';
import { validateClaimModel } from '../packages/publisher/src/semantics/document.mjs';
import { SELF_ENTITY_IDS } from '../editions/self/src/edition/model.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = path.join(root, 'editions/self');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');

const selectedSources = Object.freeze({
  'product-contract': 'docs/product-contract.md',
  'edition-contract': 'docs/edition-contract.md',
  'active-design': 'openspec/changes/architecture-publisher-0-2/design.md',
  'core-package': 'packages/publisher/package.json',
  'self-prepare-owner': 'editions/self/src/edition/prepare.mjs',
  'self-model-owner': 'editions/self/src/edition/model.mjs',
  'self-static-scene-owner': 'editions/self/src/edition/static-scene.mjs',
  'self-static-composition-owner': 'editions/self/src/edition/static/composition.mjs',
  'self-static-compiler-owner': 'editions/self/src/edition/static/scene.mjs',
  'self-static-svg-owner': 'editions/self/src/edition/static/svg.mjs',
  'self-static-flagship-owner': 'editions/self/src/edition/static-flagship.mjs',
  'self-static-metrics': 'editions/self/src/edition/static/authoring/metrics.json',
  'self-interactive-scene-owner': 'editions/self/src/edition/interactive-scenes.mjs',
  'self-interactive-composition-owner': 'editions/self/src/edition/interactive-scene.mjs',
  'self-interactive-atlas-owner': 'editions/self/src/edition/atlas.mjs',
  'source-owner': 'packages/publisher/src/source/write.mjs',
  'claim-owner': 'packages/publisher/src/semantics/document.mjs',
  'evolution-owner': 'packages/publisher/src/edition/evolution.mjs',
  'compiler-owner': 'packages/publisher/src/compiler/edition.mjs',
  'interactive-renderer-owner': 'packages/publisher/renderers/archify/index.mjs',
  'qualification-owner': 'packages/publisher/src/qualification/contract.mjs',
  'publication-owner': 'packages/publisher/src/publication/files.mjs',
  'installed-test-owner': 'tests/self-hosted-adopter.test.mjs',
});

async function request(output, sourceRoot = root) {
  const sources = {};
  for (const [id, relative] of Object.entries(selectedSources)) {
    const file = path.join(sourceRoot, relative);
    sources[id] = { path: file, sha256: sha256(await fs.readFile(file)) };
  }
  return {
    schema: 'architecture.publisher-self-input/v1',
    source: { id: 'architecture-publisher', revision: 'test-source-revision' },
    sources,
    output,
  };
}

function directedPath(relations, from, to) {
  const pending = [[from, []]],
    seen = new Set();
  while (pending.length) {
    const [current, path] = pending.shift();
    if (current === to) return path;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const [id, relation] of Object.entries(relations))
      if (relation.subject === current) pending.push([relation.object, [...path, id]]);
  }
  return null;
}

test('the first-party self Edition covers the complete product chain and authority boundaries', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, 'prepared');
  const prepared = await prepareArchitecturePublisherEdition(await request(output));
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256),
    members = new Map(bundle.members.map((member) => [member.path, member.content])),
    model = validateClaimModel(JSON.parse(members.get('semantic.json'))),
    edition = validateEdition(model, JSON.parse(await fs.readFile(prepared.edition, 'utf8')));

  assert.equal(edition.id, 'architecture-publisher-self');
  assert.equal(edition.class, 'flagship');
  assert.deepEqual(Object.keys(edition.omissions), []);
  assert.deepEqual([...edition.requiredClaims].sort(), Object.keys(model.claims).sort());
  for (const id of [
    'accepted-intent',
    'implementation',
    'runtime-observation',
    'evidence',
    'source-adapter',
    'source-bundle',
    'claim-model',
    'uncertainty',
    'edition',
    'build-request',
    'static-scene',
    'interactive-scenes',
    'static-artifact',
    'interactive-atlas',
    'edition-candidate',
    'qualification-set',
    'acceptance',
    'authorization',
    'publication',
    'self-consumer',
    'ethos-consumer',
    'aigw-consumer',
    'feedback',
    'evolution-inputs',
    'semantic-delta',
    'affected-views',
    'rebuild-obligations',
    'semantic-verification-obligations',
    'medium-verification-obligations',
    'human-review-obligations',
    'acceptance-obligations',
    'publication-obligations',
  ])
    assert(model.entities[id], `missing complete self-model entity: ${id}`);
  const connected = new Set(
    Object.values(model.relations).flatMap(({ subject, object }) => [subject, object]),
  );
  assert.deepEqual(
    SELF_ENTITY_IDS.filter((id) => !connected.has(id)),
    [],
    'the flagship self-model must not contain decorative or disconnected entities',
  );
  for (const id of [
    'core-compiles-static',
    'core-compiles-interactive',
    'uncertainty-broadens-edition',
    'publication-returns-feedback',
    'feedback-returns-to-adapter',
    'recovery-excludes-off-host',
    'static-scene-enters-renderer',
    'interactive-scenes-enter-renderer',
    'models-enter-evolution',
    'edition-enters-evolution',
    'evolution-produces-delta',
    'delta-identifies-affected-views',
    'affected-views-require-rebuild',
    'affected-views-require-semantic-verification',
    'affected-views-require-medium-verification',
    'affected-views-require-human-review',
    'affected-views-require-acceptance',
    'affected-views-require-publication',
    'rebuild-renews-static',
    'rebuild-renews-interactive',
    'semantic-verification-renews-claims',
    'medium-verification-renews-qualification',
    'human-review-obligation-renews-review',
    'acceptance-obligation-renews-acceptance',
    'publication-obligation-renews-publication',
  ])
    assert(model.relations[id], `missing complete self-model relation: ${id}`);
  assert.deepEqual(directedPath(model.relations, 'edition', 'static-artifact'), [
    'edition-authors-static',
    'static-scene-enters-renderer',
    'backend-renders-static',
  ]);
  assert.deepEqual(directedPath(model.relations, 'edition', 'interactive-atlas'), [
    'edition-authors-interactive',
    'interactive-scenes-enter-renderer',
    'backend-renders-interactive',
  ]);
  assert.deepEqual(directedPath(model.relations, 'evolution-inputs', 'rebuild-obligations'), [
    'evolution-produces-delta',
    'delta-identifies-affected-views',
    'affected-views-require-rebuild',
  ]);
  assert.deepEqual(
    directedPath(model.relations, 'evolution-inputs', 'medium-verification-obligations'),
    [
      'evolution-produces-delta',
      'delta-identifies-affected-views',
      'affected-views-require-medium-verification',
    ],
  );
  const role = (id) => model.claims['role-' + id],
    flow = (id) => model.claims['flow-' + id];
  assert.deepEqual(
    Object.entries(model.claims)
      .filter(([, claim]) => ['observed', 'published'].includes(claim.plane))
      .map(([id]) => id),
    [],
    'source code, tests, design, and package metadata are not execution or publication receipts',
  );
  assert.deepEqual(
    [role('static-artifact').plane, role('static-artifact').maturity],
    ['intended', 'target'],
    'the selected source model does not treat renderer implementation as an existing accepted artifact',
  );
  assert.deepEqual(
    [role('interactive-atlas').plane, role('interactive-atlas').maturity],
    ['implemented', 'implemented'],
  );
  assert.deepEqual(
    [
      flow('acceptance-precedes-authorization').plane,
      flow('acceptance-precedes-authorization').maturity,
    ],
    ['intended', 'target'],
    'the current file publisher must not be presented as qualification-gated',
  );
  assert.equal(role('runtime-observation').plane, 'intended');
  assert.equal(role('publisher-core').plane, 'implemented');
  assert.equal(role('aigw-consumer').plane, 'intended');
  assert.equal(
    model.sources['installed-test-owner']?.authority,
    'Installed-use test implementation; not an execution observation',
  );
  assert.equal(model.sources['installed-evidence'], undefined);
  assert.deepEqual(edition.narrative, [
    'overview',
    'semantics',
    'edition',
    'composition',
    'qualification',
    'publication-recovery',
    'adoption',
    'evolution',
  ]);
  assert.notDeepEqual(
    edition.scenes.static.composition,
    edition.scenes.interactive.overview.composition,
  );
  assert.deepEqual(
    edition.qualification.human.map(({ predicate, scope }) => [
      predicate,
      scope.medium,
      scope.artifact,
      scope.kind,
      scope.width,
      scope.height,
    ]),
    [
      ['faithful', 'static', 'flagship-png', 'physical', 6000, 3375],
      ['faithful', 'interactive', 'standalone-atlas', 'viewport', 1440, 1000],
      ['intelligible', 'static', 'flagship-png', 'physical', 6000, 3375],
      ['intelligible', 'interactive', 'standalone-atlas', 'viewport', 1440, 1000],
      ['restrained', 'static', 'flagship-png', 'physical', 6000, 3375],
      ['restrained', 'interactive', 'standalone-atlas', 'viewport', 1440, 1000],
    ],
  );
  assert.equal(model.context.selfUse, true);
  assert.equal(model.context.independentAdopterEvidence, false);
  assert.equal(prepared.adoptionRole, 'self-hosted');
  assert.equal(prepared.humanAcceptance, 'not-performed');
});

test('the first-party self Edition emits one exact candidate from independent sibling media', async (t) => {
  const { buildArchitecturePublisherCandidate, prepareArchitecturePublisherEdition } =
      await import('../editions/self/src/edition/index.mjs'),
    scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-candidate-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await prepareArchitecturePublisherEdition(
      await request(path.join(parent, 'prepared')),
    ),
    plan = JSON.parse(await fs.readFile(prepared.plan, 'utf8')),
    output = path.join(parent, 'candidate'),
    result = await buildArchitecturePublisherCandidate({ ...plan, output }),
    bundle = await readSourceBundle(result.manifestPath, result.manifestSha256),
    members = new Map(bundle.members.map((member) => [member.path, member.content])),
    candidate = validateEditionCandidate(JSON.parse(members.get('candidate.json')));

  assert.equal(result.status, 'built');
  assert.equal(result.candidateSha256, editionCandidateDigest(candidate));
  assert.equal(candidate.source.manifestSha256, prepared.sourceSha256);
  assert.equal(candidate.claimModel.digest, prepared.semanticDigest);
  assert.equal(candidate.edition.sha256, prepared.editionSha256);
  assert.equal(candidate.edition.digest, prepared.editionDigest);
  assert.equal(result.views, 8);
  assert.deepEqual([...members.keys()].sort(), [
    'candidate.json',
    'interactive/architecture-publisher.html',
    'static/architecture-publisher-6000.png',
    'static/architecture-publisher.svg',
  ]);
  assert.deepEqual(
    candidate.media.static.supplies.map(({ id }) => id),
    ['font-supply', 'raster-supply', 'self-static-runtime'],
  );
  assert.deepEqual(
    candidate.media.interactive.supplies.map(({ id }) => id),
    ['archify', 'font-supply', 'runtime', 'self-interactive-runtime'],
  );
  assert.notEqual(candidate.media.static.sceneSha256, candidate.media.interactive.sceneSha256);
  assert.equal(candidate.obligations.length, 13);
  assert.deepEqual(
    candidate.obligations
      .filter(({ kind }) => kind === 'human')
      .map(({ predicate, scope }) => [predicate, scope.medium, scope.artifact]),
    [
      ['faithful', 'static', 'flagship-png'],
      ['faithful', 'interactive', 'standalone-atlas'],
      ['intelligible', 'static', 'flagship-png'],
      ['intelligible', 'interactive', 'standalone-atlas'],
      ['restrained', 'static', 'flagship-png'],
      ['restrained', 'interactive', 'standalone-atlas'],
    ],
  );
  for (const medium of Object.values(candidate.media))
    for (const artifact of medium.artifacts) {
      const bytes = members.get(artifact.path);
      assert(bytes, `missing candidate artifact: ${artifact.path}`);
      assert.equal(artifact.bytes, bytes.length);
      assert.equal(artifact.sha256, sha256(bytes));
    }
  for (const forbidden of ['qualification', 'humanAcceptance', 'publication'])
    assert.equal(candidate[forbidden], undefined);
});

test('the evolution view carries semantic delta and distinct renewal obligations', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-evolution-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await prepareArchitecturePublisherEdition(
      await request(path.join(parent, 'prepared')),
    ),
    bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256),
    members = new Map(bundle.members.map((member) => [member.path, member.content])),
    model = validateClaimModel(JSON.parse(members.get('semantic.json'))),
    edition = validateEdition(model, JSON.parse(await fs.readFile(prepared.edition, 'utf8'))),
    evolution = edition.scenes.interactive.evolution,
    entities = new Set(evolution.composition.groups.flatMap((group) => group.entities)),
    relations = new Set(evolution.composition.relations.map((relation) => relation.id));
  for (const id of [
    'evolution-inputs',
    'semantic-delta',
    'affected-views',
    'rebuild-obligations',
    'semantic-verification-obligations',
    'medium-verification-obligations',
    'human-review-obligations',
    'acceptance-obligations',
    'publication-obligations',
  ])
    assert(entities.has(id), `evolution view missing ${id}`);
  for (const id of [
    'evolution-produces-delta',
    'delta-identifies-affected-views',
    'affected-views-require-rebuild',
    'affected-views-require-semantic-verification',
    'affected-views-require-medium-verification',
    'affected-views-require-human-review',
    'affected-views-require-acceptance',
    'affected-views-require-publication',
  ])
    assert(relations.has(id), `evolution view missing ${id}`);
});

test('the semantics view connects uncertainty and claims to Edition authorship', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-semantics-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await prepareArchitecturePublisherEdition(
      await request(path.join(parent, 'prepared')),
    ),
    bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256),
    members = new Map(bundle.members.map((member) => [member.path, member.content])),
    model = validateClaimModel(JSON.parse(members.get('semantic.json'))),
    edition = validateEdition(model, JSON.parse(await fs.readFile(prepared.edition, 'utf8'))),
    semantics = edition.scenes.interactive.semantics,
    relations = new Set(semantics.composition.relations.map((relation) => relation.id));
  assert(relations.has('claims-inform-edition'));
  assert(relations.has('uncertainty-broadens-edition'));
});

test('the installed self Edition prepares portable standard inputs and leaves Core independent', async (t) => {
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-installed-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const packedCore = spawnSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', parent],
      { cwd: path.join(root, 'packages/publisher'), encoding: 'utf8' },
    ),
    packedSelf = spawnSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', parent],
      { cwd: packageRoot, encoding: 'utf8' },
    );
  assert.equal(packedCore.status, 0, packedCore.stderr);
  assert.equal(packedSelf.status, 0, packedSelf.stderr);
  const core = JSON.parse(packedCore.stdout)[0],
    self = JSON.parse(packedSelf.stdout)[0],
    consumer = path.join(parent, 'consumer');
  await fs.mkdir(consumer);
  const installed = spawnSync(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(parent, core.filename),
      path.join(parent, self.filename),
    ],
    { cwd: consumer, encoding: 'utf8' },
  );
  assert.equal(installed.status, 0, installed.stderr);

  const copied = path.join(parent, 'inputs');
  await fs.mkdir(copied);
  const sources = {};
  for (const [id, relative] of Object.entries(selectedSources)) {
    const bytes = await fs.readFile(path.join(root, relative));
    const file = path.join(copied, id + '.source');
    await fs.writeFile(file, bytes);
    sources[id] = { path: file, sha256: sha256(bytes) };
  }
  const preparedRoot = path.join(parent, 'prepared'),
    requestFile = path.join(parent, 'request.json'),
    requestValue = {
      schema: 'architecture.publisher-self-input/v1',
      source: { id: 'architecture-publisher', revision: 'installed-revision' },
      sources,
      output: preparedRoot,
    };
  await fs.writeFile(requestFile, encode(requestValue));
  const driver = path.join(consumer, 'prepare.mjs');
  await fs.writeFile(
    driver,
    [
      "import { prepareArchitecturePublisherEditionInput } from '@architecture-publisher/self-edition';",
      'const result = await prepareArchitecturePublisherEditionInput(process.argv[2]);',
      "process.stdout.write(JSON.stringify(result) + '\\n');",
      '',
    ].join('\n'),
  );
  const preparedRun = spawnSync(process.execPath, [driver, requestFile], {
    cwd: consumer,
    encoding: 'utf8',
    env: { HOME: parent, PATH: parent, LANG: 'C.UTF-8' },
    timeout: 120000,
  });
  assert.equal(preparedRun.status, 0, preparedRun.stdout + preparedRun.stderr);
  const prepared = JSON.parse(preparedRun.stdout);
  await fs.rename(
    path.join(consumer, 'node_modules/@architecture-publisher/self-edition'),
    path.join(parent, 'removed-self-edition'),
  );
  const verifyDriver = path.join(consumer, 'verify.mjs');
  await fs.writeFile(
    verifyDriver,
    [
      "import fs from 'node:fs/promises';",
      "import { readSourceBundle } from 'architecture-publisher/source';",
      "import { validateClaimModel } from 'architecture-publisher/semantics';",
      "import { validateEdition } from 'architecture-publisher/edition';",
      'const prepared = JSON.parse(process.argv[2]);',
      'const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);',
      'const members = new Map(bundle.members.map((member) => [member.path, member.content]));',
      "const model = validateClaimModel(JSON.parse(members.get('semantic.json')));",
      "const edition = validateEdition(model, JSON.parse(await fs.readFile(prepared.edition, 'utf8')));",
      "process.stdout.write(JSON.stringify({status:'verified', edition:edition.id, views:Object.keys(edition.scenes.interactive).length}) + '\\n');",
      '',
    ].join('\n'),
  );
  const verified = spawnSync(process.execPath, [verifyDriver, JSON.stringify(prepared)], {
    cwd: consumer,
    encoding: 'utf8',
    env: { HOME: parent, PATH: parent, LANG: 'C.UTF-8' },
    timeout: 120000,
  });
  assert.equal(verified.status, 0, verified.stdout + verified.stderr);
  assert.deepEqual(JSON.parse(verified.stdout), {
    status: 'verified',
    edition: 'architecture-publisher-self',
    views: 8,
  });
  const plan = JSON.parse(await fs.readFile(prepared.plan, 'utf8'));
  assert.equal(plan.sourceManifest, prepared.sourceManifest);
  assert.equal(plan.edition, prepared.edition);
  assert.equal(plan.output, path.join(preparedRoot, 'publication'));
  await assert.rejects(fs.access(plan.output), { code: 'ENOENT' });
});

test('the self-publication entry canonicalizes an absent output below a filesystem alias', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-alias-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const physical = path.join(parent, 'physical');
  const alias = path.join(parent, 'alias');
  await fs.mkdir(physical);
  await fs.symlink(physical, alias, 'dir');
  const prepared = await prepareArchitecturePublisherEdition(
    await request(path.join(alias, 'prepared')),
  );
  assert.equal(path.dirname(prepared.edition), path.join(physical, 'prepared'));
  assert.equal(path.dirname(prepared.sourceManifest), path.join(physical, 'prepared', 'source'));
});

test('prepared output admission never replaces a concurrently created destination', async (t) => {
  const { installPreparedOutput } = await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-race-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const staged = path.join(parent, 'staged'),
    destination = path.join(parent, 'prepared'),
    marker = path.join(destination, 'foreign-marker');
  await fs.mkdir(staged);
  await fs.writeFile(path.join(staged, 'edition.json'), 'owned staged bytes');
  await fs.mkdir(destination);
  await fs.writeFile(marker, 'foreign bytes');
  await assert.rejects(installPreparedOutput(staged, destination), {
    code: 'self_output_exists',
  });
  assert.equal(await fs.readFile(marker, 'utf8'), 'foreign bytes');
  assert.equal(await fs.readFile(path.join(staged, 'edition.json'), 'utf8'), 'owned staged bytes');
});

test('prepared output installation never replaces a member arriving after reservation', async (t) => {
  const { installPreparedOutput } = await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-member-race-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const staged = path.join(parent, 'staged'),
    destination = path.join(parent, 'prepared'),
    marker = path.join(destination, 'edition.json');
  await fs.mkdir(staged);
  await fs.writeFile(path.join(staged, 'edition.json'), 'owned staged bytes');
  let injected = false;
  await assert.rejects(
    installPreparedOutput(staged, destination, async () => {
      injected = true;
      await fs.writeFile(marker, 'foreign bytes', { flag: 'wx' });
    }),
    { code: 'self_output_member_exists' },
  );
  assert.equal(injected, true);
  assert.equal(await fs.readFile(marker, 'utf8'), 'foreign bytes');
  assert.equal(await fs.readFile(path.join(staged, 'edition.json'), 'utf8'), 'owned staged bytes');
});

test('prepared output installation never replaces a nested member arriving during copy', async (t) => {
  const { installPreparedOutput } = await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-nested-race-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const staged = path.join(parent, 'staged'),
    destination = path.join(parent, 'prepared'),
    marker = path.join(destination, 'source', 'semantic.json');
  await fs.mkdir(path.join(staged, 'source'), { recursive: true });
  await fs.writeFile(path.join(staged, 'source', 'semantic.json'), 'owned staged bytes');
  await assert.rejects(
    installPreparedOutput(staged, destination, async (event) => {
      if (event?.phase !== 'directory-reserved' || event.path !== 'source') return;
      await fs.writeFile(marker, 'foreign bytes', { flag: 'wx' });
    }),
    { code: 'self_output_member_exists' },
  );
  assert.equal(await fs.readFile(marker, 'utf8'), 'foreign bytes');
  assert.equal(
    await fs.readFile(path.join(staged, 'source', 'semantic.json'), 'utf8'),
    'owned staged bytes',
  );
});
