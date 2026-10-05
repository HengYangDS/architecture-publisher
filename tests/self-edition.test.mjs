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
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { browserLifetime } from './fixtures/browser-lifetime.mjs';
import { selectedInteractiveMember } from './fixtures/interactive-member.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { validateEditionProject } from '../packages/publisher/src/edition/authoring.mjs';
import { validateClaimModel } from '../packages/publisher/src/semantics/document.mjs';
import { SELF_ENTITY_IDS } from '../editions/self/src/edition/model.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = path.join(root, 'editions/self');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');

const selectedSources = Object.freeze({
  'product-contract': 'docs/product-contract.md',
  'core-package': 'packages/publisher/package.json',
  'self-prepare-owner': 'editions/self/src/edition/prepare.mjs',
  'self-model-owner': 'editions/self/src/edition/model.mjs',
  'self-project-owner': 'editions/self/src/edition/project.mjs',
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

test('self preparation selects one direct Project instead of a legacy Edition authority', async (t) => {
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, 'publisher-self-project-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, 'prepared');
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const prepared = await prepareArchitecturePublisherEdition(await request(output));
  assert.equal(prepared.project, path.join(output, 'build-input/edition/project.json'));
  assert.equal(prepared.projectSha256, sha256(await fs.readFile(prepared.project)));
  assert.equal(prepared.edition, undefined);
  assert.equal(prepared.plan, undefined);
  await assert.rejects(fs.stat(path.join(output, 'edition.json')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(output, 'plan.json')), { code: 'ENOENT' });
  const project = JSON.parse(await fs.readFile(prepared.project, 'utf8'));
  assert.deepEqual(project.presentation.static.views[0].questions, ['system-map']);
  assert.equal(
    project.scope.selections.filter(
      ({ reference, questions }) =>
        reference.startsWith('claim:') && questions.includes('system-map'),
    ).length,
    0,
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const model = validateClaimModel(
    JSON.parse(bundle.members.find(({ path: name }) => name === 'semantic.json').content),
  );
  assert.equal(model.entities.edition.label, 'Edition Project');
  assert.deepEqual(model.entities.edition.provenance, ['self-project-owner']);
  assert.equal(model.claims['role-edition'].condition.schema, 'architecture.edition-project/v1');
  assert.deepEqual(model.claims['role-build-request'].condition, {
    schema: 'architecture.build-request/v1',
    selection: 'direct-model-and-project',
    output: 'caller-selected',
  });
  assert.equal(Object.hasOwn(model.relations, 'bundle-selects-build'), false);
  assert.equal(model.claims['flow-claims-select-build'].condition.member, 'model.json');
  assert.equal(model.claims['flow-edition-selects-build'].condition.identity, 'project-bytes');
  assert.equal(
    model.claims['role-evolution-inputs'].condition.schema,
    'architecture.semantic-compare-input/v3',
  );
  assert.equal(Object.hasOwn(model.sources, 'edition-contract'), false);
});

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
    project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, 'utf8')));

  const installedVersion = JSON.parse(
    await fs.readFile(path.join(root, 'packages/publisher/package.json'), 'utf8'),
  ).version;
  assert.equal(prepared.selectedCoreVersion, installedVersion);
  assert.equal(project.id, 'architecture-publisher-self');
  assert.equal(project.editor, model.owner);
  assert.deepEqual(project.omissions, []);
  assert.equal(
    project.scope.selections.filter(({ reference }) => reference.startsWith('claim:')).length,
    Object.keys(model.claims).length,
  );
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
  for (const id of ['ethos-consumer', 'aigw-consumer']) {
    assert.deepEqual(
      [role(id).plane, role(id).maturity, role(id).provenance],
      ['intended', 'target', ['product-contract']],
      'historical adopter handoffs cannot prove current successor adoption',
    );
  }
  for (const id of ['publication-serves-ethos', 'publication-serves-aigw']) {
    assert.deepEqual(
      [flow(id).plane, flow(id).maturity, flow(id).provenance],
      ['intended', 'target', ['product-contract']],
      'the target service relation must not inherit an old adopter observation',
    );
  }
  assert.deepEqual(flow('publication-serves-self').condition, {
    acceptance: 'exact-candidate-required',
  });
  assert.equal(model.sources['ethos-source-owned-handoff'], undefined);
  assert.equal(model.sources['aigw-source-owned-handoff'], undefined);
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
  assert.equal(
    model.sources['installed-test-owner']?.authority,
    'Installed-use test implementation; not an execution observation',
  );
  assert.equal(model.sources['installed-evidence'], undefined);
  assert.deepEqual(
    project.presentation.interactive.views.map(({ id }) => id),
    [
      'overview',
      'semantics',
      'edition',
      'composition',
      'qualification',
      'publication-recovery',
      'adoption',
      'evolution',
    ],
  );
  assert.equal(project.presentation.static.width, 6000);
  assert.equal(project.presentation.static.views[0].id, 'system-map');
  assert.notDeepEqual(
    project.presentation.static.views[0].groups,
    project.presentation.interactive.views[0].groups,
  );
  assert.equal(project.visualPolicy.override, 'refinement.json');
  assert.equal(model.context.selfUse, true);
  assert.equal(model.context.independentAdopterEvidence, false);
  assert.equal(prepared.adoptionRole, 'self-hosted');
  assert.equal(prepared.humanAcceptance, 'not-performed');
});

test('self Project gives the static map structural scope and interactive pages exact claims', async (t) => {
  const self = await import('../editions/self/src/edition/index.mjs');
  const parent = await fs.mkdtemp(path.join(root, 'build/test-work/self-project-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await self.prepareArchitecturePublisherEdition(
    await request(path.join(parent, 'prepared')),
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const modelBytes = bundle.members.find(({ path: name }) => name === 'semantic.json').content;
  const model = validateClaimModel(JSON.parse(modelBytes));
  const project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, 'utf8')));
  assert.deepEqual(project, self.projectFromSelfModel(model));
  assert.deepEqual(
    project.presentation.static.views.map(({ id }) => id),
    ['system-map'],
  );
  assert.deepEqual(
    project.presentation.interactive.views.map(({ id }) => id),
    [
      'overview',
      'semantics',
      'edition',
      'composition',
      'qualification',
      'publication-recovery',
      'adoption',
      'evolution',
    ],
  );
  const { deriveEditionQuestionObligations } =
    await import('../packages/publisher/src/edition/selection.mjs');
  const obligations = deriveEditionQuestionObligations(project, ['static', 'interactive']);
  const structuralCount = Object.keys(model.entities).length + Object.keys(model.relations).length;
  assert.equal(obligations.static.assertionIds.length, structuralCount);
  assert.equal(obligations.static.assertionIds.filter((id) => id.startsWith('claim-')).length, 0);
  assert.equal(
    obligations.interactive.assertionIds.filter((id) => id.startsWith('claim-')).length,
    Object.keys(model.claims).length,
  );
  const metrics = bundle.members.find(
    ({ path: name }) => name === model.sources['self-static-metrics'].locator,
  ).content;
  const refinement = self.refinementFromSelfProject(model, project, metrics);
  assert.equal(refinement.schema, 'architecture.scene-refinement/v1');
  assert.equal(refinement.media.static.kind, 'authored-canvas');
  assert.equal(refinement.media.static.scene.requiredSemanticIds.length, structuralCount);
  assert.deepEqual(
    refinement.media.interactive.pages.map(({ id }) => id),
    project.presentation.interactive.views.map(({ id }) => id),
  );
  const scene = refinement.media.static.scene;
  assert.match(scene.description, /^Target flow:/u);
  assert(scene.texts.some(({ text }) => text === 'Edition Project'));
  assert.doesNotMatch(scene.description, /selected Source Bundle/u);
  assert(
    scene.texts.some(
      ({ id, text }) => id === 'target-caveat' && text.includes('Target architecture'),
    ),
  );
  const relation = (id) => JSON.stringify(['architecture-publisher/self', 'relation', id]);
  const renewal = scene.edges.find(({ id }) => id === 'evolution-4');
  assert.equal(renewal?.source, 'affected-views');
  assert.equal(renewal.target, 'review-publication');
  assert.deepEqual(renewal.semanticIds, [
    relation('affected-views-require-human-review'),
    relation('affected-views-require-acceptance'),
    relation('affected-views-require-publication'),
  ]);
  const { auditScene, auditEmittedEdges } =
    await import('../packages/publisher/src/qualification/index.mjs');
  const { renderAuthoredCanvasSvg } = await import('../packages/publisher/renderers/svg/index.mjs');
  const { loadBundledFonts } = await import('../packages/publisher/renderers/fonts/index.mjs');
  const { createBundledTextMeasurer } =
    await import('../packages/publisher/renderers/resvg/measurement.mjs');
  const { authoredCanvasFramingRequest } =
    await import('../packages/publisher/renderers/svg/canvas.mjs');
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...scene.texts,
    authoredCanvasFramingRequest(project.editor),
    authoredCanvasFramingRequest('A'.repeat(500)),
  ]);
  assert.throws(() => renderAuthoredCanvasSvg(scene), {
    code: 'authored_canvas_editor_invalid',
  });
  assert.throws(() => renderAuthoredCanvasSvg(scene, project.editor), {
    code: 'authored_canvas_measurer_required',
  });
  assert.throws(() => renderAuthoredCanvasSvg(scene, 'A'.repeat(500), measurer), {
    code: 'authored_canvas_framing_unrepresentable',
  });
  const svg = renderAuthoredCanvasSvg(scene, project.editor, measurer).toString('utf8');
  assert.match(
    svg,
    /role="img" aria-labelledby="canvas-title" aria-describedby="canvas-description"/u,
  );
  assert(
    svg.includes(
      `<desc id="canvas-description">${scene.description} Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here</desc>`,
    ),
  );
  assert.match(
    renderAuthoredCanvasSvg(
      { ...scene, description: 'A & B <C>' },
      project.editor,
      measurer,
    ).toString('utf8'),
    /<desc id="canvas-description">A &amp; B &lt;C&gt; Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here<\/desc>/u,
  );
  assert.throws(
    () => renderAuthoredCanvasSvg({ ...scene, description: '' }, project.editor, measurer),
    {
      code: 'authored_canvas_description_invalid',
    },
  );
  const malformed = structuredClone(refinement);
  malformed.media.static.scene.description = '';
  const { sceneRefinementValid } =
    await import('../packages/publisher/src/edition/generated/validators.mjs');
  assert.equal(sceneRefinementValid(malformed), false);
  const withoutDescription = structuredClone(scene);
  delete withoutDescription.description;
  assert(
    renderAuthoredCanvasSvg(withoutDescription, project.editor, measurer)
      .toString('utf8')
      .includes(
        `<desc id="canvas-description">${scene.subtitle} Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here</desc>`,
      ),
  );
  const auditPolicy = {
    minimumFont: 10,
    ownerClearance: 8,
    textClearance: 5,
    textToTextClearance: 5,
    endpointTolerance: 1,
    minimumTerminal: 14,
    widthGrowth: 0.04,
    heightGrowth: 0.04,
  };
  assert.deepEqual(auditScene(scene, auditPolicy).failures, []);
  assert.deepEqual(auditEmittedEdges(svg, scene, auditPolicy).failures, []);
  const changedMetrics = Buffer.from(metrics);
  changedMetrics[0] ^= 1;
  assert.throws(() => self.refinementFromSelfProject(model, project, changedMetrics), {
    code: 'self_refinement_metric_mismatch',
  });
  const { materializeBuildRequestInput } =
    await import('../packages/publisher/src/compiler/build-input.mjs');
  const { compileEditionMeaning } = await import('../packages/publisher/src/compiler/meaning.mjs');
  const selected = await materializeBuildRequestInput(
    prepared.buildRequest,
    prepared.buildRequestSha256,
  );
  const meaning = await compileEditionMeaning(selected);
  assert.deepEqual(
    meaning.media.static.views.map(({ id }) => id),
    ['system-map'],
  );
  assert.equal(
    meaning.media.static.views[0].assertionIds.filter((id) => id.startsWith('claim-')).length,
    0,
  );
  const { compileEditionCandidateInput } =
    await import('../packages/publisher/src/compiler/index.mjs');
  const candidateRoot = path.join(parent, 'candidate');
  const built = await compileEditionCandidateInput(
    prepared.buildRequest,
    prepared.buildRequestSha256,
    candidateRoot,
  );
  assert.deepEqual(built.media.sort(), ['interactive', 'static']);
  const candidate = JSON.parse(
    await fs.readFile(path.join(candidateRoot, 'candidate.json'), 'utf8'),
  );
  assert.equal(
    candidate.limits.includes('authored-canvas-claim-facts-not-exhaustively-painted'),
    false,
  );
  const png = await fs.readFile(path.join(candidateRoot, 'static/architecture.png'));
  assert.equal(png.readUInt32BE(16), 6000);
  const staticSvg = await fs.readFile(path.join(candidateRoot, 'static/architecture.svg'), 'utf8');
  assert.match(
    staticSvg,
    /<text[^>]+data-role="editorial-framing"[^>]*>Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here<\/text>/u,
  );
  const html = await fs.readFile(path.join(candidateRoot, 'interactive/architecture.html'));
  assert.match(
    html.toString('utf8'),
    /<p class="editorial-framing">Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here<\/p>/u,
  );
  assert.equal(html.includes(modelBytes), false);
  const atlasMatch = html
    .toString('utf8')
    .match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    );
  assert(atlasMatch);
  const atlas = JSON.parse(atlasMatch[1]);
  assert.deepEqual(
    atlas.order,
    project.presentation.interactive.views.map(({ id }) => id),
  );
  assert(Object.values(atlas.pages).every(({ sourceIds }) => sourceIds.length > 0));
  assert(Object.values(atlas.sources).every((source) => !Object.hasOwn(source, 'base64')));
});

test('self preparation reports the selected core package version without a duplicate Edition', async (t) => {
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
  assert.equal(prepared.selectedCoreVersion, '0.3.0-alpha.99');
  assert.equal(prepared.edition, undefined);
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
  const project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, 'utf8')));
  const { architecturePublisherInteractiveScenes } =
    await import('../editions/self/src/edition/interactive-scenes.mjs');
  const catalog = architecturePublisherInteractiveScenes();
  const viewFor = (id) => {
    const authored = catalog[id];
    return {
      id,
      label: authored.label,
      purpose: authored.purpose,
      ...structuredClone(authored.composition),
    };
  };
  const overview = viewFor('overview');
  const composed = composeArchitecturePublisherInteractiveScene(model, project, overview);
  assert(composed.nodes.length > 0);

  assert.throws(
    () =>
      composeArchitecturePublisherInteractiveScene(model, project, { ...overview, id: 'other' }),
    { code: 'self_interactive_layout_missing' },
  );
  const missingGroup = structuredClone(overview);
  missingGroup.groups.pop();
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, missingGroup), {
    code: 'self_interactive_group_missing',
  });
  const missingRelation = structuredClone(overview);
  const selectedRelation = composed.edges[0].semanticIds[0].slice('relation:'.length);
  missingRelation.relations = missingRelation.relations.filter(({ id }) => id !== selectedRelation);
  assert.throws(
    () => composeArchitecturePublisherInteractiveScene(model, project, missingRelation),
    { code: 'self_interactive_relation_invalid' },
  );
  const extraGroup = structuredClone(overview);
  extraGroup.groups.push({ id: 'not-authored', label: 'Not selected', entities: [] });
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, extraGroup), {
    code: 'self_interactive_group_coverage_invalid',
  });
  const unrepresented = structuredClone(overview);
  unrepresented.relations.push({ id: selectedRelation });
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, unrepresented), {
    code: 'self_interactive_relation_coverage_invalid',
  });
  const semantics = viewFor('semantics');
  semantics.groups = semantics.groups.filter(({ id }) => id !== 'sources');
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, semantics), {
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

test('the evolution view carries semantic delta and distinct renewal obligations', async () => {
  const { architecturePublisherInteractiveScenes } =
    await import('../editions/self/src/edition/interactive-scenes.mjs');
  const evolution = architecturePublisherInteractiveScenes().evolution;
  const entities = new Set(evolution.composition.groups.flatMap((group) => group.entities));
  const relations = new Set(evolution.composition.relations.map((relation) => relation.id));
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

test('self renewal edges express required work rather than performed effects', async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import('../editions/self/src/edition/prepare.mjs');
  const { architecturePublisherInteractiveScenes } =
    await import('../editions/self/src/edition/interactive-scenes.mjs');
  const { composeArchitecturePublisherInteractiveScene } =
    await import('../editions/self/src/edition/interactive-scene.mjs');
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'publisher-self-obligations-'));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await prepareArchitecturePublisherEdition(
    await request(path.join(parent, 'prepared')),
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const model = validateClaimModel(
    JSON.parse(bundle.members.find(({ path: name }) => name === 'semantic.json').content),
  );
  const project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, 'utf8')));
  const requiredWork = new Map([
    ['rebuild-obligations', 'requires rebuild'],
    ['semantic-verification-obligations', 'requires recheck'],
    ['medium-verification-obligations', 'requires recheck'],
    ['human-review-obligations', 'requires renewal'],
    ['acceptance-obligations', 'requires renewal'],
    ['publication-obligations', 'requires publication'],
  ]);
  const expected = new Set(
    Object.entries(model.relations)
      .filter(([, relation]) => requiredWork.has(relation.subject))
      .map(([id]) => id),
  );
  const observed = new Set();
  const catalog = architecturePublisherInteractiveScenes();
  for (const id of ['overview', 'evolution']) {
    const view = catalog[id];
    const scene = composeArchitecturePublisherInteractiveScene(model, project, {
      id,
      label: view.label,
      purpose: view.purpose,
      ...view.composition,
    });
    for (const edge of scene.edges) {
      const labels = new Set();
      for (const carrier of edge.semanticIds) {
        const relationId = carrier.slice('relation:'.length);
        if (!expected.has(relationId)) continue;
        const subject = model.relations[relationId].subject;
        assert.equal(model.claims[`role-${subject}`].condition.effect, 'planned-not-executed');
        labels.add(requiredWork.get(subject));
        observed.add(relationId);
      }
      if (labels.size)
        assert.equal(
          edge.label,
          labels.size === 1 ? [...labels][0] : 'requires renewal',
          `${id}: ${edge.id}`,
        );
    }
    if (id === 'evolution')
      assert.equal(
        scene.nodes.find((node) => node.id === 'effect').detail,
        'planned · not executed',
      );
  }
  assert.deepEqual(observed, expected);
});

test('the semantics view connects uncertainty and claims to Edition authorship', async () => {
  const { architecturePublisherInteractiveScenes } =
    await import('../editions/self/src/edition/interactive-scenes.mjs');
  const semantics = architecturePublisherInteractiveScenes().semantics;
  const relations = new Set(semantics.composition.relations.map((relation) => relation.id));
  assert(relations.has('claims-inform-edition'));
  assert(relations.has('uncertainty-broadens-edition'));
});

test('the installed self Edition compiles both media after its author package is removed', async (t) => {
  const parent = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'publisher-self-installed-'),
  );
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const packedCore = spawnNativeSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', parent],
      { cwd: path.join(root, 'packages/publisher'), encoding: 'utf8' },
    ),
    packedSelf = spawnNativeSync(
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
  const installed = spawnNativeSync(
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
      const lifetime = browserLifetime(browserTest);
      lifetime.use(server);
      const browser = await chromium.launch({
        executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
      });
      lifetime.use(browser);
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
        const frame = await selectedInteractiveMember(page, id);
        assert.equal((await frame.locator('svg[role="group"]').count()) > 0, true, id);
      }
      await page.getByRole('button', { name: 'Overview', exact: true }).click();
      const inspect = page.getByRole('button', { name: 'Inspect', exact: true });
      await inspect.focus();
      await page.keyboard.press('Enter');
      const inspector = page.locator('#interactive-inspector');
      assert.equal(await inspector.isVisible(), true);
      assert.equal(
        await inspector.evaluate(() => {
          const basis = globalThis.document.getElementById('interactive-inspect-basis');
          const records = globalThis.document.getElementById('interactive-inspect-content');
          return Boolean(
            basis.compareDocumentPosition(records) & globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
          );
        }),
        true,
      );
      assert.equal(
        await inspector.evaluate((element) => element.scrollWidth <= element.clientWidth),
        true,
      );
      assert.equal(await page.locator('#interactive-frame').getAttribute('aria-hidden'), 'true');
      assert.equal(
        await page
          .locator('#interactive-frame')
          .evaluate((frame) => globalThis.getComputedStyle(frame).visibility),
        'hidden',
      );
      const index = page.locator('#interactive-inspect-index button');
      assert.equal(
        await index.count(),
        new Set(data.pages.overview.facts.map(({ graphicId }) => graphicId)).size,
      );
      const firstGraphicId = await index.first().getAttribute('data-graphic-id');
      assert.equal(
        await page.locator('#interactive-inspect-content details').count(),
        data.pages.overview.facts.filter((fact) => fact.graphicId === firstGraphicId).length,
      );
      assert.equal(await page.locator('[data-fact-reference]').count(), 0);
      assert.equal(await index.first().getAttribute('aria-current'), 'true');
      await page.locator('#interactive-inspect-search').fill('Claim Model');
      const visibleIndex = page.locator('#interactive-inspect-index button:visible');
      assert.equal((await visibleIndex.count()) > 0, true);
      assert.equal((await visibleIndex.count()) < (await index.count()), true);
      await page.locator('#interactive-inspect-search').fill('no matching architecture subject');
      assert.equal(await visibleIndex.count(), 0);
      assert.equal(await page.locator('#interactive-inspect-empty').isVisible(), true);
      await page.locator('#interactive-inspect-search').fill('');
      assert.equal(await page.locator('#interactive-inspect-empty').isVisible(), false);
      assert.deepEqual(await violations(page), []);
      let reachableFacts = 0;
      for (let item = 0; item < (await index.count()); item += 1) {
        const selected = index.nth(item);
        const graphicId = await selected.getAttribute('data-graphic-id');
        await selected.click();
        const found = await page.locator('#interactive-inspect-content details').count();
        assert.equal(
          found,
          data.pages.overview.facts.filter((fact) => fact.graphicId === graphicId).length,
          graphicId,
        );
        reachableFacts += found;
      }
      assert.equal(reachableFacts, data.pages.overview.facts.length);
      await page.locator('#interactive-inspect-basis summary').click();
      assert.match(
        await page.locator('#interactive-inspect-basis').innerText(),
        /architecture-publisher\/self/u,
      );
      await page.keyboard.press('Escape');
      assert.equal(await inspector.isVisible(), false);
      assert.equal(await page.locator('#interactive-frame').getAttribute('aria-hidden'), null);
      assert.equal(await inspect.getAttribute('aria-expanded'), 'false');
      assert.equal(
        await inspect.evaluate((element) => globalThis.document.activeElement === element),
        true,
      );
      await inspect.click();
      await page.getByRole('button', { name: 'Back to diagram' }).click();
      assert.equal(await inspector.isVisible(), false);
      const overviewFrame = await selectedInteractiveMember(page, 'overview');
      await overviewFrame.locator('[data-inspect-id="source"][tabindex="0"]').first().focus();
      await page.keyboard.press('i');
      await inspector.waitFor({ state: 'visible' });
      assert.equal(await inspector.isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await inspector.isVisible(), false);
      assert.equal(
        await overviewFrame.evaluate(() =>
          globalThis.document.activeElement?.getAttribute('data-inspect-id'),
        ),
        'source',
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
        const frame = await selectedInteractiveMember(readerPage, id);
        await frame.waitForFunction(() => !!globalThis.Archify?.layoutStability?.whenStable);
        await frame.evaluate(() => globalThis.Archify.layoutStability.whenStable());
        const shellFits = await readerPage.evaluate(() => {
          const frame = globalThis.document
            .querySelector('#interactive-frame')
            .getBoundingClientRect();
          return (
            frame.right <= globalThis.innerWidth + 1 &&
            frame.bottom <= globalThis.innerHeight + 1 &&
            globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth &&
            globalThis.document.documentElement.scrollHeight <= globalThis.innerHeight
          );
        });
        assert.equal(shellFits, true, `${id}: complete desktop publication`);
        const fit = await frame.evaluate(async () => {
          await globalThis.document.fonts.ready;
          const stage = globalThis.document
            .querySelector('.diagram-container')
            .getBoundingClientRect();
          const svg = globalThis.document.querySelector('svg');
          const aperture = globalThis.Archify.viewerChromeLayout.stageRect();
          const chrome = globalThis.Archify.viewerChromeLayout.receipt();
          const dock = globalThis.document.querySelector('.diagram-nav').getBoundingClientRect();
          const visible = (element) => {
            const style = globalThis.getComputedStyle(element);
            return style.visibility !== 'hidden' && style.opacity !== '0';
          };
          const inside = (box) =>
            box.left >= aperture.left - 1 &&
            box.right <= aperture.right + 1 &&
            box.top >= aperture.top - 1 &&
            box.bottom <= aperture.bottom + 1;
          const text = [...svg.querySelectorAll('text')]
            .filter(visible)
            .map((element) => element.getBoundingClientRect());
          const nodes = [...svg.querySelectorAll('g[data-inspect-id],g[data-node-id]')].map(
            (element) => element.getBoundingClientRect(),
          );
          const shellContentFits = [
            ...globalThis.document.querySelectorAll('body > *, .container > *'),
          ]
            .filter(visible)
            .every((element) => {
              const box = element.getBoundingClientRect();
              return (
                box.left >= -1 &&
                box.right <= globalThis.innerWidth + 1 &&
                box.top >= -1 &&
                box.bottom <= globalThis.innerHeight + 1
              );
            });
          const artworkClearOfControls = [...text, ...nodes].every(
            (box) =>
              Math.min(box.right, dock.right) <= Math.max(box.left, dock.left) ||
              Math.min(box.bottom, dock.bottom) <= Math.max(box.top, dock.top),
          );
          return {
            textCount: text.length,
            completeText: text.filter(inside).length,
            nodeCount: nodes.length,
            completeNodes: nodes.filter(inside).length,
            bottomGapRatio:
              (aperture.bottom - Math.max(...nodes.map(({ bottom }) => bottom))) / aperture.height,
            canvasFitsViewport: stage.bottom <= globalThis.innerHeight + 1,
            controlsFitViewport: dock.bottom <= globalThis.innerHeight + 1,
            shellContentFits,
            artworkClearOfControls,
            controlsClearCanvas: dock.top >= aperture.bottom + chrome.gap - 1,
            unreservedOverlap: chrome.stageIntersectionArea,
            camera: globalThis.Archify.view.state(),
          };
        });
        assert.equal(fit.canvasFitsViewport, true, `${id}: complete desktop canvas`);
        assert.equal(fit.controlsFitViewport, true, `${id}: complete desktop controls`);
        assert.equal(fit.shellContentFits, true, `${id}: unclipped visible member content`);
        assert.equal(fit.artworkClearOfControls, true, `${id}: independent artwork clearance`);
        assert.equal(fit.controlsClearCanvas, true, `${id}: native control clearance`);
        assert.equal(fit.unreservedOverlap, 0, `${id}: no control overlap`);
        assert.deepEqual(fit.camera, {
          scale: 1,
          x: 0,
          y: 0,
          mode: 'overview',
        });
        assert(fit.textCount > 0, `${id}: visible text`);
        assert.equal(fit.completeText, fit.textCount, `${id}: text fit`);
        assert(fit.nodeCount > 0, `${id}: visible checked carriers`);
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
        await auditPage.evaluate(() => globalThis.Archify.presentation.enter());
        await auditPage.evaluate(() => globalThis.Archify.layoutStability.whenStable());
        assert.equal(
          await auditPage.evaluate(() => {
            const note = globalThis.document.querySelector('.publication-query-limit');
            if (!note) return true;
            const box = note.getBoundingClientRect();
            return (
              note.parentElement === globalThis.document.querySelector('.container') &&
              box.top >= 0 &&
              box.bottom <= globalThis.innerHeight + 1
            );
          }),
          true,
          `${id}: native query limit remains visible in presentation`,
        );
        await auditPage.evaluate(() => globalThis.Archify.presentation.exit());
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
  assert.equal(
    prepared.project,
    path.join(physical, 'prepared', 'build-input', 'edition', 'project.json'),
  );
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
