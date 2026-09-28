import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import axe from 'axe-core';
import { chromium } from 'playwright-core';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
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
  'ethos-source-owned-handoff': 'conformance/fixtures/ethos-source-owned-handoff.json',
  'aigw-source-owned-handoff': 'conformance/fixtures/aigw-source-owned-handoff.json',
  'core-package': 'packages/publisher/package.json',
  'self-prepare-owner': 'editions/self/src/edition/prepare.mjs',
  'self-model-owner': 'editions/self/src/edition/model.mjs',
  'self-static-scene-owner': 'editions/self/src/edition/static-scene.mjs',
  'self-static-composition-owner': 'editions/self/src/edition/static/composition.mjs',
  'self-static-compiler-owner': 'editions/self/src/edition/static/scene.mjs',
  'static-renderer-owner': 'packages/publisher/renderers/svg/canvas.mjs',
  'self-static-metrics': 'editions/self/src/edition/static/authoring/metrics.json',
  'self-interactive-scene-owner': 'editions/self/src/edition/interactive-scenes.mjs',
  'self-interactive-composition-owner': 'editions/self/src/edition/interactive-scene.mjs',
  'interactive-compositor-owner': 'packages/publisher/src/rendering/interactive-html.mjs',
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

  const installedVersion = JSON.parse(
    await fs.readFile(path.join(root, 'packages/publisher/package.json'), 'utf8'),
  ).version;
  assert.equal(edition.product.version, installedVersion);
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
    'interactive-artifact',
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
  assert.deepEqual(directedPath(model.relations, 'edition', 'interactive-artifact'), [
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
  const externallyObserved = Object.entries(model.claims).filter(([, claim]) =>
    ['observed', 'published'].includes(claim.plane),
  );
  assert(
    externallyObserved.every(([, claim]) =>
      claim.provenance.some((source) =>
        ['ethos-source-owned-handoff', 'aigw-source-owned-handoff'].includes(source),
      ),
    ),
    'only explicit source-owned handoff evidence may support observed adopter claims',
  );
  assert.equal(
    externallyObserved.some(([, claim]) => claim.plane === 'published'),
    false,
    'local handoff evidence is not remote publication evidence',
  );
  assert.deepEqual(
    [role('static-artifact').plane, role('static-artifact').maturity],
    ['intended', 'target'],
    'the selected source model does not treat renderer implementation as an existing accepted artifact',
  );
  assert.deepEqual(
    [role('interactive-artifact').plane, role('interactive-artifact').maturity],
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
  assert.deepEqual(
    [role('ethos-consumer').plane, role('aigw-consumer').plane],
    ['observed', 'observed'],
    'source-owned handoff records support adopter observations without claiming publication',
  );
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
      ['faithful', 'interactive', 'architecture-html', 'viewport', 1440, 1000],
      ['intelligible', 'static', 'flagship-png', 'physical', 6000, 3375],
      ['intelligible', 'interactive', 'architecture-html', 'viewport', 1440, 1000],
      ['restrained', 'static', 'flagship-png', 'physical', 6000, 3375],
      ['restrained', 'interactive', 'architecture-html', 'viewport', 1440, 1000],
    ],
  );
  assert.equal(model.context.selfUse, true);
  assert.equal(model.context.independentAdopterEvidence, false);
  assert.equal(prepared.adoptionRole, 'self-hosted');
  assert.equal(prepared.humanAcceptance, 'not-performed');
});

test('self successor authoring derives every selected claim and reader question from one owner', async (t) => {
  const self = await import('../editions/self/src/edition/index.mjs');
  assert.equal(typeof self.projectFromSelfEdition, 'function');
  assert.equal(typeof self.refinementFromSelfEdition, 'function');
  const { materializeBuildRequestInput } =
    await import('../packages/publisher/src/provider/build-request.mjs');
  const { compileEditionMeaning } = await import('../packages/publisher/src/compiler/meaning.mjs');
  const { composeSelectedStaticRefinementLayout } =
    await import('../packages/publisher/src/scene/static/grouped-selection.mjs');
  assert.equal(typeof composeSelectedStaticRefinementLayout, 'function');
  const { composeInteractiveEditionScene, composeStaticEditionScene } =
    await import('../packages/publisher/src/scene/index.mjs');
  const { composeStaticEditionSvg } = await import('../packages/publisher/renderers/svg/index.mjs');
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const parent = await fs.mkdtemp(path.join(root, 'build/test-work/self-successor-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await self.prepareArchitecturePublisherEdition(
    await request(path.join(parent, 'prepared')),
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const modelBytes = bundle.members.find(({ path: name }) => name === 'semantic.json').content;
  const model = validateClaimModel(JSON.parse(modelBytes));
  const edition = validateEdition(model, JSON.parse(await fs.readFile(prepared.edition, 'utf8')));
  const project = self.projectFromSelfEdition(model, edition);
  const metrics = bundle.members.find(
    ({ path: name }) => name === model.sources['self-static-metrics'].locator,
  ).content;
  const authoredRefinement = self.refinementFromSelfEdition(model, edition, metrics);
  assert.equal(authoredRefinement.schema, 'architecture.scene-refinement/v1');
  assert.equal(authoredRefinement.media.static.kind, 'authored-canvas');
  assert.equal(
    authoredRefinement.media.static.scene.schema,
    'architecture.authored-static-scene/v1',
  );
  assert.equal(authoredRefinement.media.static.scene.requiredSemanticIds.length, 89);
  assert.deepEqual(JSON.parse(authoredRefinement.media.static.scene.requiredSemanticIds[0]), [
    'architecture-publisher/self',
    'entity',
    'accepted-intent',
  ]);
  assert.equal(Object.hasOwn(authoredRefinement.media.static.scene, 'coverage'), false);
  assert.equal(
    authoredRefinement.media.static.scene.nodes[0].semanticIds.length,
    edition.scenes.static.composition.groups[0].entities.length,
  );
  const evolution = authoredRefinement.media.static.scene;
  const qualifiedRelation = (id) => JSON.stringify(['architecture-publisher/self', 'relation', id]);
  const trustBranch = evolution.edges.find(({ id }) => id === 'evolution-4');
  assert.equal(trustBranch?.source, 'affected-views');
  assert.equal(trustBranch.target, 'review-publication');
  assert.deepEqual(trustBranch.semanticIds, [
    qualifiedRelation('affected-views-require-human-review'),
    qualifiedRelation('affected-views-require-acceptance'),
    qualifiedRelation('affected-views-require-publication'),
  ]);
  assert.deepEqual(
    evolution.texts.find(({ id }) => id === 'rebuild-verification-line-1')?.semanticIds,
    [
      qualifiedRelation('rebuild-renews-static'),
      qualifiedRelation('rebuild-renews-interactive'),
      qualifiedRelation('semantic-verification-renews-claims'),
      qualifiedRelation('medium-verification-renews-qualification'),
    ],
  );
  assert.deepEqual(
    evolution.texts.find(({ id }) => id === 'review-publication-line-1')?.semanticIds,
    [
      qualifiedRelation('affected-views-require-human-review'),
      qualifiedRelation('affected-views-require-acceptance'),
      qualifiedRelation('affected-views-require-publication'),
      qualifiedRelation('human-review-obligation-renews-review'),
      qualifiedRelation('acceptance-obligation-renews-acceptance'),
      qualifiedRelation('publication-obligation-renews-publication'),
    ],
  );
  assert.equal(
    evolution.texts.some(({ id }) => id === 'evolution-4-label'),
    false,
  );
  assert.equal(
    evolution.decorations.some(({ id }) => id === 'renewal-scope'),
    false,
  );
  assert.equal(
    authoredRefinement.media.static.scene.texts.some(
      ({ id, text }) => id === 'target-caveat' && text.includes('Target architecture'),
    ),
    true,
  );
  assert.equal(authoredRefinement.media.interactive.kind, 'authored-architecture');
  assert.deepEqual(
    authoredRefinement.media.interactive.pages.map(({ id }) => id),
    edition.narrative,
  );
  assert.equal(authoredRefinement.media.interactive.pages[0].scene.nodes.length < 38, true);
  assert.deepEqual(
    JSON.parse(authoredRefinement.media.interactive.pages[0].scene.nodes[0].semanticIds[0]),
    ['architecture-publisher/self', 'entity', 'accepted-intent'],
  );
  assert.doesNotMatch(JSON.stringify(authoredRefinement), /<svg|<html/iu);
  const { auditScene, auditEmittedEdges } =
    await import('../packages/publisher/src/qualification/index.mjs');
  const { renderAuthoredCanvasSvg } = await import('../packages/publisher/renderers/svg/index.mjs');
  const authoredCanvas = authoredRefinement.media.static.scene;
  const geometry = auditScene(authoredCanvas, {
    minimumFont: 10,
    ownerClearance: 8,
    textClearance: 5,
    textToTextClearance: 5,
    endpointTolerance: 1,
    minimumTerminal: 14,
    widthGrowth: 0.04,
    heightGrowth: 0.04,
  });
  assert.deepEqual(geometry.failures, []);
  const emitted = auditEmittedEdges(
    renderAuthoredCanvasSvg(authoredCanvas).toString('utf8'),
    authoredCanvas,
    {
      endpointTolerance: 1,
      minimumTerminal: 14,
    },
  );
  assert.deepEqual(emitted.failures, []);
  const tamperedMetrics = Buffer.from(metrics);
  tamperedMetrics[0] ^= 1;
  assert.throws(() => self.refinementFromSelfEdition(model, edition, tamperedMetrics), {
    code: 'self_refinement_metric_mismatch',
  });
  assert.equal(project.schema, 'architecture.edition-project/v1');
  assert.equal(
    project.scope.selections.filter(({ reference }) => reference.startsWith('claim:')).length,
    89,
  );
  assert.deepEqual(
    project.questions.map(({ id }) => id),
    edition.narrative,
  );
  assert.deepEqual(
    project.presentation.interactive.views.map(({ id }) => id),
    edition.narrative,
  );
  assert.equal(
    project.presentation.static.views[0].groups.length,
    edition.scenes.static.composition.groups.length,
  );

  const sourceRoot = path.join(parent, 'successor');
  await fs.mkdir(path.join(sourceRoot, 'source'), { recursive: true });
  await fs.mkdir(path.join(sourceRoot, 'edition'));
  await fs.writeFile(path.join(sourceRoot, 'source/model.json'), modelBytes);
  await fs.writeFile(path.join(sourceRoot, 'edition/project.json'), encode(project));
  const buildRequest = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'self-model',
        namespace: 'architecture-publisher/self',
        format: { id: 'architecture.claim-model', version: '2' },
        claimant: model.owner,
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'pin', path: 'source/model.json', sha256: sha256(modelBytes) },
      },
    ],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  const requestBytes = encode(buildRequest);
  const requestPath = path.join(sourceRoot, 'build-request.json');
  await fs.writeFile(requestPath, requestBytes);
  const selected = await materializeBuildRequestInput(requestPath, sha256(requestBytes));
  const meaning = await compileEditionMeaning(selected);
  assert.equal(meaning.media.static.views.length, 1);
  assert.equal(meaning.media.interactive.views.length, 8);
  for (const [index, view] of meaning.media.interactive.views.entries()) {
    const original = edition.scenes.interactive[view.id];
    const expected = original.claims.map((id) => `claim-${id}`);
    assert.deepEqual(
      view.assertionIds.filter((id) => id.startsWith('claim-')).sort(),
      expected.sort(),
      `claim obligations drifted in ${edition.narrative[index]}`,
    );
  }
  const nodes = [];
  const groups = [];
  const nodePositions = new Map();
  for (const [at, group] of edition.scenes.static.composition.groups.entries()) {
    const x = (at % 4) * 650;
    const y = Math.floor(at / 4) * 900;
    groups.push({ id: group.id, x, y, width: 500, height: 800 });
    for (const [position, id] of group.entities.entries()) {
      const node = {
        namespace: 'architecture-publisher/self',
        id,
        x: x + 35,
        y: y + 50 + position * 110,
        width: 260,
        height: 96,
      };
      nodes.push(node);
      nodePositions.set(id, node);
    }
  }
  const edges = Object.entries(model.relations).map(([reference, relation]) => {
    const from = nodePositions.get(relation.subject);
    const to = nodePositions.get(relation.object);
    return {
      from: { namespace: from.namespace, id: from.id },
      to: { namespace: to.namespace, id: to.id },
      relations: [{ namespace: 'architecture-publisher/self', reference }],
      points: [
        [from.x + from.width, from.y + from.height / 2],
        [to.x, to.y + to.height / 2],
      ],
    };
  });
  const refinement = { media: { static: { view: 'overview', nodes, edges, groups } } };
  const staticScene = composeStaticEditionScene(
    meaning,
    composeSelectedStaticRefinementLayout(meaning, refinement),
  );
  assert.equal(staticScene.nodes.length, 38);
  assert.equal(staticScene.edges.flatMap(({ relations }) => relations).length, 51);
  assert.equal(staticScene.claimCards.length, 89);
  const interactiveScene = composeInteractiveEditionScene(meaning);
  assert.equal(interactiveScene.pages.length, 8);
  assert.deepEqual(
    interactiveScene.pages.map(({ claimCards }) => claimCards.length),
    edition.narrative.map((id) => edition.scenes.interactive[id].claims.length),
  );
  const staticRendered = composeStaticEditionSvg(staticScene);
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, 'static', staticScene, staticRendered.carriers),
  );
  const interactiveRendered = await renderInteractiveEditionHtml(interactiveScene);
  assert.doesNotThrow(() =>
    validateVisibleSelection(
      meaning,
      'interactive',
      interactiveScene,
      interactiveRendered.carriers,
    ),
  );
  const selectedProject = structuredClone(project);
  selectedProject.visualPolicy.override = 'refinement.json';
  await fs.writeFile(path.join(sourceRoot, 'edition/project.json'), encode(selectedProject));
  const resourceBytes = encode(authoredRefinement);
  await fs.writeFile(path.join(sourceRoot, 'edition/refinement.json'), resourceBytes);
  const selectedWithRefinement = await materializeBuildRequestInput(
    requestPath,
    sha256(requestBytes),
  );
  const refinedMeaning = await compileEditionMeaning(selectedWithRefinement);
  assert.equal(refinedMeaning.refinement.sha256, sha256(resourceBytes));
  assert.deepEqual(Object.keys(refinedMeaning.refinement.media), ['static', 'interactive']);
  const { composeAuthoredInteractiveArchitecture } =
    await import('../packages/publisher/src/scene/interactive/authored-architecture.mjs');
  const omitted = structuredClone(refinedMeaning);
  omitted.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds.pop();
  assert.throws(() => composeAuthoredInteractiveArchitecture(omitted), {
    code: 'authored_interactive_semantic_mismatch',
  });
  const forged = structuredClone(refinedMeaning);
  forged.refinement.media.interactive.pages[0].scene.edges[0].semanticIds[0] =
    '["architecture-publisher/self","relation","not-selected"]';
  assert.throws(() => composeAuthoredInteractiveArchitecture(forged), {
    code: 'authored_interactive_semantic_mismatch',
  });

  const { compileEditionCandidateInput } =
    await import('../packages/publisher/src/compiler/index.mjs');
  const pairedRoot = path.join(parent, 'public-pair');
  const paired = await compileEditionCandidateInput(requestPath, sha256(requestBytes), pairedRoot);
  assert.deepEqual(paired.media.sort(), ['interactive', 'static']);
  const interactiveBytes = await fs.readFile(
    path.join(pairedRoot, 'interactive/architecture.html'),
  );
  const atlasMatch = interactiveBytes
    .toString('utf8')
    .match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    );
  assert(atlasMatch, 'the public build emits authored interactive HTML');
  const atlas = JSON.parse(atlasMatch[1]);
  assert.equal(atlas.schema, 'architecture.interactive-html/v1');
  assert.deepEqual(atlas.order, edition.narrative);
  assert(Object.values(atlas.pages).every(({ sourceIds }) => sourceIds.length > 0));
  assert(Object.values(atlas.pages).every(({ facts }) => facts.length > 0));
  assert(
    atlas.pages.overview.facts.some(({ facts }) =>
      facts.some(({ label }) => label === 'Declared evidence authority'),
    ),
  );
  assert(Object.values(atlas.sources).every((source) => !Object.hasOwn(source, 'base64')));
  assert.equal(
    interactiveBytes.includes(modelBytes),
    false,
    'private source bytes stay outside HTML',
  );

  const staticProject = structuredClone(selectedProject);
  staticProject.id = 'architecture-publisher-self-static-probe';
  staticProject.questions = staticProject.questions.filter(({ id }) => id === 'overview');
  staticProject.scope.selections = staticProject.scope.selections.map((selection) => ({
    ...selection,
    questions: ['overview'],
  }));
  staticProject.presentation.interactive.views = [{ id: 'overview', questions: ['overview'] }];
  await fs.writeFile(path.join(sourceRoot, 'edition/project.json'), encode(staticProject));
  const staticRequestBytes = encode({ ...buildRequest, media: ['static'] });
  await fs.writeFile(requestPath, staticRequestBytes);
  await fs.writeFile(
    path.join(sourceRoot, 'edition/refinement.json'),
    encode({
      schema: authoredRefinement.schema,
      media: { static: authoredRefinement.media.static },
    }),
  );
  const candidateRoot = path.join(parent, 'public-static');
  const built = await compileEditionCandidateInput(
    requestPath,
    sha256(staticRequestBytes),
    candidateRoot,
  );
  assert.equal(built.status, 'built');
  const png = await fs.readFile(path.join(candidateRoot, 'static/architecture.png'));
  assert.equal(png.readUInt32BE(16), 6000);
});

test('self Edition product version follows the selected core package bytes', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-version-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const selected = JSON.parse(
    await fs.readFile(path.join(root, 'packages/publisher/package.json'), 'utf8'),
  );
  selected.version = '0.3.0-alpha.99';
  const bytes = encode(selected);
  const selectedPath = path.join(parent, 'selected-package.json');
  await fs.writeFile(selectedPath, bytes);
  const input = await request(path.join(parent, 'prepared'));
  input.sources['core-package'] = { path: selectedPath, sha256: sha256(bytes) };
  const prepared = await prepareArchitecturePublisherEdition(input);
  const edition = JSON.parse(await fs.readFile(prepared.edition, 'utf8'));
  assert.equal(edition.product.version, '0.3.0-alpha.99');
});

test('self-authored interactive pages refuse missing or extra semantic carriers', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const { composeArchitecturePublisherInteractiveScene } =
    await import('../editions/self/src/edition/interactive-scene.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-interactive-admission-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await prepareArchitecturePublisherEdition(
    await request(path.join(parent, 'prepared')),
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const model = validateClaimModel(
    JSON.parse(bundle.members.find(({ path: name }) => name === 'semantic.json').content),
  );
  const edition = validateEdition(model, JSON.parse(await fs.readFile(prepared.edition, 'utf8')));
  const viewFor = (id) => {
    const authored = edition.scenes.interactive[id];
    return {
      id,
      label: authored.label,
      purpose: authored.purpose,
      ...structuredClone(authored.composition),
    };
  };
  const overview = viewFor('overview');
  const composed = composeArchitecturePublisherInteractiveScene(model, edition, overview);
  assert(composed.nodes.length > 0);

  assert.throws(
    () =>
      composeArchitecturePublisherInteractiveScene(model, edition, { ...overview, id: 'other' }),
    { code: 'self_interactive_layout_missing' },
  );
  const missingGroup = structuredClone(overview);
  missingGroup.groups.pop();
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, edition, missingGroup), {
    code: 'self_interactive_group_missing',
  });
  const missingRelation = structuredClone(overview);
  const selectedRelation = composed.edges[0].semanticIds[0].slice('relation:'.length);
  missingRelation.relations = missingRelation.relations.filter(({ id }) => id !== selectedRelation);
  assert.throws(
    () => composeArchitecturePublisherInteractiveScene(model, edition, missingRelation),
    { code: 'self_interactive_relation_invalid' },
  );
  const extraGroup = structuredClone(overview);
  extraGroup.groups.push({ id: 'not-authored', label: 'Not selected', entities: [] });
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, edition, extraGroup), {
    code: 'self_interactive_group_coverage_invalid',
  });
  const unrepresented = structuredClone(overview);
  unrepresented.relations.push({ id: selectedRelation });
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, edition, unrepresented), {
    code: 'self_interactive_relation_coverage_invalid',
  });
  const semantics = viewFor('semantics');
  semantics.groups = semantics.groups.filter(({ id }) => id !== 'sources');
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, edition, semantics), {
    code: 'self_interactive_edge_endpoint_missing',
  });
});

test('self Edition preparation rejects malformed selected inputs before output effects', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-admission-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, 'prepared');
  const baseline = await request(output);
  for (const [name, mutate, code] of [
    ['missing input', () => null, 'self_input_invalid'],
    [
      'foreign source owner',
      (input) => ((input.source.id = 'foreign'), input),
      'self_input_invalid',
    ],
    [
      'unselected source key',
      (input) => ((input.sources.unknown = input.sources['core-package']), input),
      'self_input_invalid',
    ],
    [
      'relative source path',
      (input) => ((input.sources['core-package'].path = 'package.json'), input),
      'self_source_invalid',
    ],
    [
      'invalid source digest',
      (input) => ((input.sources['core-package'].sha256 = 'unbound'), input),
      'self_source_invalid',
    ],
    [
      'relative output',
      (input) => ((input.output = 'prepared'), input),
      'self_output_path_invalid',
    ],
  ]) {
    const invalid = mutate(structuredClone(baseline));
    await assert.rejects(prepareArchitecturePublisherEdition(invalid), { code }, name);
    await assert.rejects(fs.access(output), { code: 'ENOENT' });
  }

  const parentFile = path.join(parent, 'not-a-directory');
  await fs.writeFile(parentFile, 'foreign bytes');
  await assert.rejects(
    prepareArchitecturePublisherEdition({ ...baseline, output: path.join(parentFile, 'prepared') }),
    { code: 'self_output_parent_invalid' },
  );
  assert.equal(await fs.readFile(parentFile, 'utf8'), 'foreign bytes');

  const alteredSource = path.join(parent, 'altered-package.json');
  await fs.writeFile(alteredSource, '{"not":"the selected package"}\n');
  const changed = structuredClone(baseline);
  changed.sources['core-package'].path = alteredSource;
  await assert.rejects(prepareArchitecturePublisherEdition(changed), {
    code: 'self_source_digest_mismatch',
  });
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('self Edition rejects a selected core package with foreign product identity', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-foreign-package-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const bytes = encode({ name: 'foreign-publisher', version: '0.3.0-alpha.2' });
  const selectedPath = path.join(parent, 'foreign-package.json');
  await fs.writeFile(selectedPath, bytes);
  const input = await request(path.join(parent, 'prepared'));
  input.sources['core-package'] = { path: selectedPath, sha256: sha256(bytes) };
  await assert.rejects(prepareArchitecturePublisherEdition(input), {
    code: 'self_core_package_invalid',
  });
});

test('self Edition rejects duplicate core-package identity before output', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-duplicate-package-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const selected = JSON.parse(
    await fs.readFile(path.join(root, 'packages/publisher/package.json'), 'utf8'),
  );
  const bytes = Buffer.from(
    JSON.stringify(selected).replace('"name":', '"name":"foreign-publisher","name":') + '\n',
  );
  const selectedPath = path.join(parent, 'duplicate-package.json');
  await fs.writeFile(selectedPath, bytes);
  const output = path.join(parent, 'prepared');
  const input = await request(output);
  input.sources['core-package'] = { path: selectedPath, sha256: sha256(bytes) };
  await assert.rejects(prepareArchitecturePublisherEdition(input), {
    code: 'self_core_package_json_duplicate_key',
  });
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('self Edition rejects duplicate selected typography facts before output', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-duplicate-metrics-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const original = await fs.readFile(
    path.join(root, 'editions/self/src/edition/static/authoring/metrics.json'),
    'utf8',
  );
  const bytes = Buffer.from(original.replace('"schema":', '"schema":"forged-metrics","schema":'));
  assert.notEqual(bytes.toString(), original);
  const selectedPath = path.join(parent, 'duplicate-metrics.json');
  await fs.writeFile(selectedPath, bytes);
  const output = path.join(parent, 'prepared');
  const input = await request(output);
  input.sources['self-static-metrics'] = { path: selectedPath, sha256: sha256(bytes) };
  await assert.rejects(prepareArchitecturePublisherEdition(input), {
    code: 'self_refinement_metric_json_duplicate_key',
  });
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('self Edition input rejects duplicate output authority before effects', async (t) => {
  const { prepareArchitecturePublisherEditionInput } =
    await import('../editions/self/src/edition/prepare.mjs');
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-duplicate-input-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, 'prepared');
  const input = await request(output);
  const bytes = Buffer.from(
    JSON.stringify(input).replace('"output":', '"output":"elsewhere","output":') + '\n',
  );
  const inputFile = path.join(parent, 'duplicate-input.json');
  await fs.writeFile(inputFile, bytes);
  await assert.rejects(prepareArchitecturePublisherEditionInput(inputFile), {
    code: 'self_input_json_duplicate_key',
  });
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
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

test('the installed self Edition compiles both media after its author package is removed', async (t) => {
  const parent = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'publisher-self-installed-'),
  );
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
  const core = parseNpmPackRecord(packedCore.stdout),
    self = parseNpmPackRecord(packedSelf.stdout),
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
  assert.equal(prepared.buildRequest, path.join(preparedRoot, 'build-input/build-request.json'));
  assert.match(prepared.buildRequestSha256, /^[a-f0-9]{64}$/u);
  assert.equal(sha256(await fs.readFile(prepared.buildRequest)), prepared.buildRequestSha256);
  const relocated = path.join(parent, 'relocated-inputs');
  await fs.rename(path.join(preparedRoot, 'build-input'), relocated);
  await fs.rename(
    path.join(consumer, 'node_modules/@architecture-publisher/self-edition'),
    path.join(parent, 'removed-self-edition'),
  );
  const compileDriver = path.join(consumer, 'compile-successor.mjs');
  await fs.writeFile(
    compileDriver,
    [
      "import { compileEditionCandidateInput } from 'architecture-publisher/compiler';",
      'const result = await compileEditionCandidateInput(process.argv[2], process.argv[3], process.argv[4]);',
      "process.stdout.write(JSON.stringify(result) + '\\n');",
      '',
    ].join('\n'),
  );
  const candidateRoot = path.join(parent, 'candidate');
  const built = spawnSync(
    process.execPath,
    [
      compileDriver,
      path.join(relocated, 'build-request.json'),
      prepared.buildRequestSha256,
      candidateRoot,
    ],
    {
      cwd: consumer,
      encoding: 'utf8',
      env: { HOME: parent, PATH: parent, LANG: 'C.UTF-8' },
      timeout: 120000,
    },
  );
  assert.equal(built.status, 0, built.stdout + built.stderr);
  assert.deepEqual(JSON.parse(built.stdout).media.sort(), ['interactive', 'static']);
  const png = await fs.readFile(path.join(candidateRoot, 'static/architecture.png'));
  assert.equal(png.readUInt32BE(16), 6000);
  const html = await fs.readFile(path.join(candidateRoot, 'interactive/architecture.html'));
  assert.match(html.toString('utf8'), /architecture\.interactive-html\/v1/u);
  const sourceModel = await fs.readFile(path.join(relocated, 'source/model.json'));
  assert.equal(html.includes(sourceModel), false);
  const localCandidate = path.join(parent, 'local-candidate');
  const { compileEditionCandidateInput } =
    await import('../packages/publisher/src/compiler/index.mjs');
  await compileEditionCandidateInput(
    path.join(relocated, 'build-request.json'),
    prepared.buildRequestSha256,
    localCandidate,
  );
  for (const relative of [
    'candidate.json',
    'static/architecture.svg',
    'static/architecture.png',
    'interactive/architecture.html',
  ])
    assert.equal(
      sha256(await fs.readFile(path.join(candidateRoot, relative))),
      sha256(await fs.readFile(path.join(localCandidate, relative))),
      relative,
    );
  await t.test(
    'the installed interactive artifact reads all eight pages without external requests',
    {
      skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ''),
      timeout: 45_000,
    },
    async (browserTest) => {
      const data = JSON.parse(
        html
          .toString('utf8')
          .match(
            /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
          )[1],
      );
      assert.equal(data.order.length, 8);
      const pages = new Map(
        data.order.map((id) => [
          `/views/${id}.html`,
          data.pages[id].pieces
            .map((piece) => (typeof piece === 'number' ? data.blocks[piece] : piece))
            .join(''),
        ]),
      );
      const server = http.createServer((request, response) => {
        if (request.url === '/favicon.ico') {
          response.writeHead(204).end();
          return;
        }
        if (pages.has(request.url)) {
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          response.end(pages.get(request.url));
          return;
        }
        if (request.url !== '/architecture.html') {
          response.writeHead(404).end();
          return;
        }
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(html);
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      browserTest.after(() => new Promise((resolve) => server.close(resolve)));
      const browser = await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
      });
      browserTest.after(() => browser.close());
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const origin = `http://127.0.0.1:${server.address().port}`;
      await page.route('**/*', (route) => {
        if (route.request().url().startsWith(`${origin}/`)) return route.continue();
        errors.push(`external-request:${route.request().url()}`);
        return route.abort();
      });
      await page.goto(`${origin}/architecture.html`, { waitUntil: 'load' });
      await page.addScriptTag({ content: axe.source });
      const violations = async (frame) =>
        frame.evaluate(async () => {
          const result = await globalThis.axe.run(globalThis.document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          });
          return result.violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          }));
        });
      assert.deepEqual(await violations(page), []);
      for (const id of data.order) {
        const selected = data.pages[id];
        await page.getByRole('button', { name: selected.shortLabel, exact: true }).click();
        await page.waitForFunction(
          (label) =>
            globalThis.document.getElementById('interactive-page-label').textContent === label,
          selected.label,
        );
        const frame = page.frames().find((item) => item.parentFrame() === page.mainFrame());
        await frame.waitForSelector('svg', { timeout: 8_000 });
        assert.equal((await frame.locator('svg[role="group"]').count()) > 0, true, id);
      }
      await page.getByRole('button', { name: 'Selected meaning' }).click();
      assert.match(await page.locator('#interactive-facts').innerText(), /Claim plane/u);
      await page.keyboard.press('Escape');
      assert.equal(
        await page.getByRole('button', { name: 'Selected meaning' }).getAttribute('aria-expanded'),
        'false',
      );
      await page.getByRole('button', { name: 'Source references' }).click();
      assert.match(
        await page.locator('#interactive-source-code').innerText(),
        /Source bytes are not embedded/u,
      );
      assert.deepEqual(errors, []);
      assert.equal(
        await page.evaluate(
          () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
        ),
        true,
      );
      const readerPage = await browser.newPage({
        viewport: { width: 1280, height: 720 },
        reducedMotion: 'reduce',
      });
      readerPage.on('pageerror', (error) => errors.push(error.message));
      await readerPage.route('**/*', (route) => {
        if (route.request().url().startsWith(`${origin}/`)) return route.continue();
        errors.push(`external-request:${route.request().url()}`);
        return route.abort();
      });
      await readerPage.goto(`${origin}/architecture.html`, { waitUntil: 'load' });
      for (const id of data.order) {
        const selected = data.pages[id];
        await readerPage.getByRole('button', { name: selected.shortLabel, exact: true }).click();
        const frame = readerPage
          .frames()
          .find((item) => item.parentFrame() === readerPage.mainFrame());
        await frame.waitForSelector('svg', { timeout: 8_000 });
        const fit = await frame.evaluate(async () => {
          await globalThis.document.fonts.ready;
          const stage = globalThis.document
            .querySelector('.diagram-container')
            .getBoundingClientRect();
          const svg = globalThis.document.querySelector('svg');
          const visible = (element) => {
            const style = globalThis.getComputedStyle(element);
            return style.visibility !== 'hidden' && style.opacity !== '0';
          };
          const text = [...svg.querySelectorAll('text')]
            .filter(visible)
            .map((element) => element.getBoundingClientRect());
          const nodes = [...svg.querySelectorAll('[data-node-id]')].map((element) =>
            element.getBoundingClientRect(),
          );
          return {
            textCount: text.length,
            completeText: text.filter(
              (box) =>
                box.left >= stage.left - 1 &&
                box.right <= stage.right + 1 &&
                box.top >= stage.top - 1 &&
                box.bottom <= stage.bottom + 1,
            ).length,
            nodeCount: nodes.length,
            completeNodes: nodes.filter(
              (box) =>
                box.left >= stage.left - 1 &&
                box.right <= stage.right + 1 &&
                box.top >= stage.top - 1 &&
                box.bottom <= stage.bottom + 1,
            ).length,
            bottomGapRatio:
              (stage.bottom - Math.max(...nodes.map(({ bottom }) => bottom))) / stage.height,
          };
        });
        assert(fit.textCount > 0, `${id}: visible text`);
        assert.equal(fit.completeText, fit.textCount, `${id}: text fit`);
        assert.equal(fit.completeNodes, fit.nodeCount, `${id}: complete fit`);
        if (id === 'overview')
          assert(fit.bottomGapRatio <= 0.14, `overview: bottom gap ${fit.bottomGapRatio}`);
      }
      const auditPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      auditPage.on('pageerror', (error) => errors.push(error.message));
      await auditPage.route('**/*', (route) => {
        if (route.request().url().startsWith(`${origin}/`)) return route.continue();
        errors.push(`external-request:${route.request().url()}`);
        return route.abort();
      });
      for (const id of data.order) {
        await auditPage.goto(`${origin}/views/${id}.html`, { waitUntil: 'load' });
        await auditPage.addScriptTag({ content: axe.source });
        assert.deepEqual(await violations(auditPage), [], id);
      }
      assert.deepEqual(errors, []);
    },
  );
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
