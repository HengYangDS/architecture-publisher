import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import axe from 'axe-core';
import { chromium } from 'playwright-core';
import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from '../packages/publisher/src/compiler/index.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/index.mjs';
import { compileNativeEditionEvolution } from '../packages/publisher/src/edition/evolution.mjs';
import { compileNativeSelectionDelta } from '../packages/publisher/src/semantics/change.mjs';
import {
  composeInteractiveEditionScene,
  composeStaticEditionScene,
} from '../packages/publisher/src/scene/index.mjs';
import { validateVisibleSelection } from '../packages/publisher/src/compiler/coverage.mjs';
import { composeStaticEditionSvg } from '../packages/publisher/renderers/svg/index.mjs';
import { projectInteractivePage } from '../packages/publisher/renderers/cytoscape/model.mjs';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/cytoscape/edition.mjs';
import { verifySelectedCandidateReplay } from '../packages/publisher/src/qualification/index.mjs';
import { canonical } from '../packages/publisher/src/source/json.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { composeGroupedSelectionLayout } from '../packages/publisher/src/scene/static/grouped-selection.mjs';
import { claimCard } from '../packages/publisher/src/scene/claim-card.mjs';
import { composeAuthoredInteractiveArchitecture } from '../packages/publisher/src/scene/interactive/authored-architecture.mjs';
import { composeAuthoredStaticCanvas } from '../packages/publisher/src/scene/static/authored-canvas.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const modelFormat = { id: 'architecture.claim-model', version: '2' };
const modelNamespace = 'fixture/claims';
const rawNamespace = 'fixture/raw';

async function fixture(
  t,
  { delivery = 'native', model = claimModel(), reference = 'claim:intended' } = {},
) {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-claim-selection-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'edition'));
  await fs.mkdir(path.join(root, 'sources'));
  const modelBytes = Buffer.from(JSON.stringify(model) + '\n');
  const raw = Buffer.from('attributed native input\n');
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'claim-atlas',
    editor: 'fixture-editor',
    title: 'Typed claims',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'condition', audience: 'maintainer', text: 'When may the client call?' }],
    scope: {
      sourceNamespaces: [delivery === 'native' ? modelNamespace : rawNamespace],
      ...(delivery === 'derived' ? { projectionNamespaces: [modelNamespace] } : {}),
      selections: [
        {
          id: 'selected-claim',
          namespace: modelNamespace,
          kind: 'reference',
          reference,
          questions: ['condition'],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: {
      summary: 'Keep the authorization condition visible.',
    },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['condition'] }], intent: 'One overview.' },
      interactive: {
        views: [{ id: 'overview', questions: ['condition'] }],
        intent: 'One explorable view.',
      },
    },
    visualPolicy: { profile: 'neutral' },
  };
  await fs.writeFile(path.join(root, 'edition/project.json'), JSON.stringify(project) + '\n');
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  if (delivery === 'native') {
    await fs.writeFile(path.join(root, 'sources/model.json'), modelBytes);
    request.sources.push({
      id: 'model',
      namespace: modelNamespace,
      format: modelFormat,
      claimant: 'fixture-maintainer',
      revision: { kind: 'content', algorithm: 'sha256' },
      input: { kind: 'pin', path: 'sources/model.json', sha256: sha(modelBytes) },
    });
  } else {
    await fs.mkdir(path.join(root, 'provider'));
    await fs.writeFile(path.join(root, 'provider/raw.src'), raw);
    await fs.writeFile(path.join(root, 'provider/model.json'), modelBytes);
    const manifest = {
      schema: 'architecture.edition-provider/v2',
      provider: { id: 'claim-provider', revision: '1' },
      selected: {
        native: [
          {
            id: 'raw',
            namespace: rawNamespace,
            claimant: 'fixture-maintainer',
            format: { id: 'example/opaque-source', version: '1' },
            revision: { kind: 'content', algorithm: 'sha256' },
            bytes: raw.length,
            sha256: sha(raw),
          },
        ],
        derived: [
          {
            id: 'model',
            namespace: modelNamespace,
            claimant: 'adapter-maintainer',
            format: modelFormat,
            derivedFrom: ['raw'],
            adapter: { id: 'claim-adapter', version: '1', contentSha256: sha('adapter') },
            method: 'project/v1',
            bytes: modelBytes.length,
            sha256: sha(modelBytes),
          },
        ],
        edition: null,
      },
      delivery: {
        kind: 'declarative',
        files: [
          { kind: 'native', id: 'raw', path: 'raw.src' },
          { kind: 'derived', id: 'model', path: 'model.json' },
        ],
      },
    };
    const manifestBytes = Buffer.from(JSON.stringify(manifest) + '\n');
    await fs.writeFile(path.join(root, 'provider/provider.json'), manifestBytes);
    request.providers.push({
      id: 'claim-selection',
      manifest: 'provider/provider.json',
      sha256: sha(manifestBytes),
    });
  }
  const requestBytes = Buffer.from(JSON.stringify(request) + '\n');
  const requestPath = path.join(root, 'build-request.json');
  await fs.writeFile(requestPath, requestBytes);
  return { root, requestPath, requestSha256: sha(requestBytes), project, model };
}

async function groupedMixedFixture(
  t,
  { model = claimModel(), media = ['static', 'interactive'] } = {},
) {
  const selected = await fixture(t, { model, reference: 'relation:request' });
  selected.project.scope.selections[0].id = 'selected-relation';
  selected.project.scope.selections.push({
    id: 'selected-claim',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'claim:intended',
    questions: ['condition'],
  });
  selected.project.presentation.static.views[0].groups = [
    {
      id: 'client-group',
      label: 'Client',
      elements: [{ namespace: modelNamespace, id: 'client' }],
    },
    {
      id: 'server-group',
      label: 'Server',
      elements: [{ namespace: modelNamespace, id: 'server' }],
    },
  ];
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const request = JSON.parse(await fs.readFile(selected.requestPath, 'utf8'));
  request.media = media;
  const requestBytes = Buffer.from(JSON.stringify(request) + '\n');
  await fs.writeFile(selected.requestPath, requestBytes);
  return { ...selected, requestSha256: sha(requestBytes) };
}

async function mixedScalarFixture(t) {
  const model = claimModel();
  model.claims['other-status'] = {
    ...structuredClone(model.claims.observed),
    subject: 'other',
    dependsOn: [{ section: 'entities', id: 'other' }],
  };
  const selected = await groupedMixedFixture(t, { model });
  selected.project.scope.selections.push({
    id: 'selected-scalar',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'claim:other-status',
    questions: ['condition'],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  return selected;
}

function twoRelationClaimModel() {
  const model = claimModel();
  model.relations.second = {
    type: 'calls',
    subject: 'server',
    object: 'other',
    qualifiers: {},
    provenance: ['contract'],
  };
  model.claims.aaa = {
    ...structuredClone(model.claims.intended),
    subject: 'server',
    object: 'other',
    dependsOn: [{ section: 'relations', id: 'second' }],
  };
  return model;
}

async function evolutionSide(selected) {
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  return { lock: input.lock, meaning: await compileEditionMeaning(input) };
}

test('native Claim Model selection retains a typed claim rather than a bare arrow', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const assertion = meaning.native.selections[0];
  assert.equal(assertion.format, 'architecture.claim-model/v2');
  assert.equal(assertion.sourceClass, 'native');
  assert.equal(assertion.target.kind, 'claim');
  assert.equal(assertion.members.claims[0].plane, 'intended');
  assert.deepEqual(assertion.members.claims[0].condition, { authorization: 'granted' });
  assert.deepEqual(assertion.members.claims[0].dependsOn, [
    { section: 'relations', id: 'request' },
  ]);
  assert.deepEqual(assertion.members.claims[0].provenance, ['contract']);
  assert.equal(assertion.predicate.valueKind, 'entity');
  assert.equal(assertion.predicate.cardinality, 'single');
  assert.deepEqual(assertion.provenanceSources.contract, selected.model.sources.contract);
  assert(meaning.limits.includes('claim-model-provenance-unverified'));
});

test('claim-only static composition admits neither mixed parsers nor unbound assertions', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  assert.equal(composeStaticEditionScene(meaning, null).claimCards.length, 1);

  const mixed = structuredClone(meaning);
  mixed.native.selections.push({
    ...structuredClone(mixed.native.selections[0]),
    selectionId: 'foreign-format',
    format: 'likec4/dsl',
  });
  assert.throws(() => composeStaticEditionScene(mixed, null), {
    code: 'edition_scene_claim_model_unadmitted',
  });
  const grouped = structuredClone(meaning);
  grouped.editorial.presentation.static.views[0].groups = [];
  assert.throws(() => composeStaticEditionScene(grouped, null), {
    code: 'static_scene_group_unadmitted',
  });
  const unknownAssertion = structuredClone(meaning);
  unknownAssertion.media.static.views[0].assertionIds = ['not-selected'];
  assert.throws(() => composeStaticEditionScene(unknownAssertion, null), {
    code: 'static_scene_assertion_unbound',
  });
  const unboundSelection = structuredClone(meaning);
  unboundSelection.assertions[0].selection = 'not-selected';
  assert.throws(() => composeStaticEditionScene(unboundSelection, null), {
    code: 'static_scene_assertion_unbound',
  });
});

test('a Claim Model structural Scene cannot borrow an upstream view identity', async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = structuredClone(composeGroupedSelectionLayout(meaning));
  assert.equal(layout.view, null);
  layout.view = { namespace: modelNamespace, id: 'invented', sha256: 'a'.repeat(64) };
  assert.throws(() => composeStaticEditionScene(meaning, layout), {
    code: 'static_scene_native_membership_mismatch',
  });
});

test('neutral Claim Model layout carries a plain relation on its visible edge, not a duplicate ledger', async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeGroupedSelectionLayout(meaning);
  assert.equal(layout.edges.length, 1);
  assert.equal(layout.edges[0].caption?.text, 'calls');
  assert.equal(layout.edges[0].caption?.point.length, 2);

  const scene = composeStaticEditionScene(meaning, layout);
  const rendered = composeStaticEditionSvg(scene, { idPrefix: 'probe-', fragment: true });
  assert.match(rendered.parts.graph, /data-graphic-id="probe-r-0"[\s\S]*?>calls<\/text>/u);
  assert.deepEqual(rendered.parts.relations, []);
  assert.deepEqual(
    rendered.carriers.relations.map(({ graphicId }) => graphicId),
    ['probe-r-0'],
  );
  assert.doesNotThrow(() => validateVisibleSelection(meaning, 'static', scene, rendered.carriers));
});

test('a long source relation type remains visible in the ledger when it cannot fit on an edge', async (t) => {
  const model = claimModel();
  const kind = 'publishes-a-resource-to-an-independent-forge';
  model.vocabulary.relations = [kind];
  model.relations.request.type = kind;
  model.vocabulary.predicates[kind] = model.vocabulary.predicates.calls;
  delete model.vocabulary.predicates.calls;
  for (const claim of Object.values(model.claims))
    if (claim.predicate === 'calls') claim.predicate = kind;
  const selected = await groupedMixedFixture(t, { model });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeGroupedSelectionLayout(meaning);
  assert.equal(layout.edges[0].caption, undefined);
  const scene = composeStaticEditionScene(meaning, layout);
  const rendered = composeStaticEditionSvg(scene, { fragment: true });
  assert.match(rendered.parts.relations[0].text, /publishes-a-resource-to-an-independent-forge/u);
});

test('an invalid edge caption fails with a typed renderer error before bounds projection', async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeGroupedSelectionLayout(meaning);
  const scene = composeStaticEditionScene(meaning, layout);
  for (const mutate of [
    (edge) => (edge.caption = null),
    (edge) => (edge.caption.box = null),
    (edge) => (edge.caption.box.w = 0),
    (edge) => (edge.caption.point = null),
    (edge) => (edge.caption.point = [0]),
    (edge) => (edge.caption.point = [NaN, 0]),
    (edge) => (edge.caption.point[0] = edge.caption.box.x - 1),
    (edge) => (edge.caption.point[0] = edge.caption.box.x + edge.caption.box.w + 1),
    (edge) => (edge.caption.point[1] = edge.caption.box.y - 1),
    (edge) => (edge.caption.point[1] = edge.caption.box.y + edge.caption.box.h + 1),
    (edge) => (edge.caption.text = 'forged relation'),
  ]) {
    const invalid = structuredClone(scene);
    mutate(invalid.edges[0]);
    assert.throws(() => composeStaticEditionSvg(invalid), {
      code: 'static_edition_relation_caption_invalid',
    });
  }
  const malformedLayout = structuredClone(layout);
  malformedLayout.edges[0].caption.box = null;
  assert.throws(() => composeStaticEditionScene(meaning, malformedLayout), {
    code: 'static_scene_geometry_invalid',
  });
});

test('a condition change alters selected meaning without changing graph cardinality', async (t) => {
  const first = await fixture(t);
  const changedModel = claimModel();
  changedModel.claims.intended.condition.authorization = 'denied';
  const changed = await fixture(t, { model: changedModel });
  const changedPlaneModel = claimModel();
  changedPlaneModel.claims.intended.plane = 'observed';
  const changedPlane = await fixture(t, { model: changedPlaneModel });
  const before = await compileEditionMeaning(
    await materializeBuildRequestInput(first.requestPath, first.requestSha256),
  );
  const after = await compileEditionMeaning(
    await materializeBuildRequestInput(changed.requestPath, changed.requestSha256),
  );
  const afterPlane = await compileEditionMeaning(
    await materializeBuildRequestInput(changedPlane.requestPath, changedPlane.requestSha256),
  );
  assert.equal(
    Object.keys(first.model.entities).length,
    Object.keys(changed.model.entities).length,
  );
  assert.equal(
    Object.keys(first.model.relations).length,
    Object.keys(changed.model.relations).length,
  );
  assert.notEqual(after.native.semanticDigest, before.native.semanticDigest);
  assert.notEqual(afterPlane.native.semanticDigest, before.native.semanticDigest);
});

test('unknown coverage and missing Claim Model IDs cannot masquerade as complete scope', async (t) => {
  const unknown = await fixture(t, { reference: 'claim:published' });
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(unknown.requestPath, unknown.requestSha256),
  );
  assert(meaning.limits.includes('claim-coverage-unknown:published'));
  const missing = await fixture(t, { reference: 'claim:absent' });
  const selected = await materializeBuildRequestInput(missing.requestPath, missing.requestSha256);
  await assert.rejects(compileEditionMeaning(selected), (error) => {
    assert.equal(error.code, 'native_claim_model_reference_unselected');
    assert.deepEqual(error.diagnostics, [
      {
        code: error.code,
        severity: 'error',
        message: 'Selected Claim Model reference is absent from the bound model.',
        predicate: 'selected-reference-resolves',
        subject: {
          kind: 'edition-source-reference',
          editionId: missing.project.id,
          editionSha256: selected.lock.edition.sha256,
          selectionId: 'selected-claim',
          namespace: modelNamespace,
          reference: 'claim:absent',
          sourceSha256: selected.lock.sources[0].sha256,
        },
        responsibility: { role: 'edition-editor', declaredOwner: missing.project.editor },
        evidence: {},
        supportedFixes: [],
      },
    ]);
    return true;
  });
});

test('public Edition build returns a local, non-authorizing missing-reference diagnostic', async (t) => {
  const missing = await fixture(t, { reference: 'claim:absent' });
  const output = path.join(missing.root, 'candidate');
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url)),
      'edition',
      'build',
      missing.requestPath,
      '--sha256',
      missing.requestSha256,
      '--output',
      output,
    ],
    { cwd: missing.root, encoding: 'utf8', timeout: 30_000 },
  );
  assert.equal(result.status, 1, result.stderr);
  const response = JSON.parse(result.stdout);
  assert.equal(response.error.code, 'native_claim_model_reference_unselected');
  assert.deepEqual(
    response.error.diagnostics?.map(({ subject, responsibility, predicate }) => ({
      subject,
      responsibility,
      predicate,
    })),
    [
      {
        subject: {
          kind: 'edition-source-reference',
          editionId: missing.project.id,
          editionSha256: sha(await fs.readFile(path.join(missing.root, 'edition/project.json'))),
          selectionId: 'selected-claim',
          namespace: modelNamespace,
          reference: 'claim:absent',
          sourceSha256: sha(await fs.readFile(path.join(missing.root, 'sources/model.json'))),
        },
        responsibility: { role: 'edition-editor', declaredOwner: missing.project.editor },
        predicate: 'selected-reference-resolves',
      },
    ],
  );
  assert.equal(JSON.stringify(response).includes(missing.root), false);
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});

test('public Edition build attributes an unanswered authored view to its editor', async (t) => {
  const selected = await fixture(t);
  selected.project.presentation.static.views.push({ id: 'detail', questions: ['condition'] });
  selected.project.omissions.push({
    medium: 'static',
    view: 'overview',
    coveredIn: 'detail',
    selection: 'selected-claim',
    question: 'condition',
    disposition: 'covered-elsewhere',
    reason: 'The detail view carries the source assertion.',
  });
  const editionPath = path.join(selected.root, 'edition/project.json');
  await fs.writeFile(editionPath, JSON.stringify(selected.project) + '\n');
  const nativePath = path.join(selected.root, 'sources/model.json');
  const nativeBefore = sha(await fs.readFile(nativePath));
  const output = path.join(selected.root, 'candidate');
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url)),
      'edition',
      'build',
      selected.requestPath,
      '--sha256',
      selected.requestSha256,
      '--output',
      output,
    ],
    { cwd: selected.root, encoding: 'utf8', timeout: 30_000 },
  );
  assert.equal(result.status, 1, result.stderr);
  const response = JSON.parse(result.stdout);
  assert.equal(response.error.code, 'materialized_view_question_unanswered');
  assert.deepEqual(
    response.error.diagnostics?.map(({ subject, responsibility, predicate }) => ({
      subject,
      responsibility,
      predicate,
    })),
    [
      {
        subject: {
          kind: 'edition-view-question',
          editionId: selected.project.id,
          editionSha256: sha(await fs.readFile(editionPath)),
          medium: 'static',
          viewId: 'overview',
          questionId: 'condition',
          omissions: [
            {
              selection: 'selected-claim',
              disposition: 'covered-elsewhere',
              coveredIn: 'detail',
            },
          ],
        },
        responsibility: { role: 'edition-editor', declaredOwner: selected.project.editor },
        predicate: 'view-question-answered',
      },
    ],
  );
  assert.equal(JSON.stringify(response).includes(selected.root), false);
  assert.equal(sha(await fs.readFile(nativePath)), nativeBefore);
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});

test('invalid native and derived claim applicability retains the selected claimant boundary', async (t) => {
  for (const field of ['condition', 'scope']) {
    for (const delivery of ['native', 'derived']) {
      const model = claimModel();
      model.claims.intended[field] = null;
      const selected = await fixture(t, { delivery, model });
      const input = await materializeBuildRequestInput(
        selected.requestPath,
        selected.requestSha256,
      );
      const source = delivery === 'native' ? input.lock.sources[0] : input.lock.derived[0];
      const finding = {
        code: `semantic_claim_${field}_invalid`,
        severity: 'error',
        message: `Selected Claim Model assertion has an invalid ${field}.`,
        predicate: `claim-${field}-valid`,
        subject: {
          kind: 'claim-model-assertion',
          sourceClass: delivery,
          namespace: source.namespace,
          sourceSha256: source.sha256,
          claimId: 'intended',
          ...(delivery === 'derived' ? { adapter: source.adapter } : {}),
        },
        responsibility: {
          role: delivery === 'native' ? 'source-claimant' : 'projection-claimant',
          declaredOwner: source.claimant,
        },
        evidence: {},
        supportedFixes: [],
      };
      await assert.rejects(compileEditionMeaning(input), (error) => {
        assert.equal(error.code, finding.code);
        assert.deepEqual(error.diagnostics, [finding]);
        return true;
      });

      const output = path.join(selected.root, 'candidate');
      const result = spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url)),
          'edition',
          'build',
          selected.requestPath,
          '--sha256',
          selected.requestSha256,
          '--output',
          output,
        ],
        { cwd: selected.root, encoding: 'utf8', timeout: 30_000 },
      );
      assert.equal(result.status, 1, result.stderr);
      const response = JSON.parse(result.stdout);
      assert.deepEqual(response.error.diagnostics, [finding]);
      assert.equal(JSON.stringify(response).includes(selected.root), false);
      await assert.rejects(fs.stat(output), { code: 'ENOENT' });
    }
  }
});

test('entity and relation selections retain typed identity and exact model origin', async (t) => {
  const entity = await fixture(t, { reference: 'entity:client' });
  const relation = await fixture(t, { reference: 'relation:request' });
  const selectedEntity = (
    await compileEditionMeaning(
      await materializeBuildRequestInput(entity.requestPath, entity.requestSha256),
    )
  ).native.selections[0];
  const selectedRelation = (
    await compileEditionMeaning(
      await materializeBuildRequestInput(relation.requestPath, relation.requestSha256),
    )
  ).native.selections[0];
  assert.equal(selectedEntity.members.elements[0].kind, 'component');
  assert.deepEqual(selectedEntity.members.elements[0].provenance, ['contract']);
  assert.equal(selectedRelation.members.relations[0].kind, 'calls');
  assert.deepEqual(selectedRelation.members.relations[0].from, {
    namespace: modelNamespace,
    id: 'client',
  });
  assert.equal(selectedRelation.members.relations[0].origin.sha256, selectedRelation.source.sha256);
});

test('derived Claim Model keeps its exact native ancestry and attributed status', async (t) => {
  const selected = await fixture(t, { delivery: 'derived' });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const assertion = meaning.native.selections[0];
  assert.equal(assertion.sourceClass, 'derived');
  assert.equal(assertion.source.namespace, modelNamespace);
  assert.deepEqual(assertion.source.derivedFrom, [
    { namespace: rawNamespace, sha256: input.lock.sources[0].sha256 },
  ]);
  assert.equal(assertion.members.claims[0].validity, 'affirmed');
  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json')));
  assert.deepEqual(
    candidate.input.semanticSupplies.map(({ id }) => id),
    ['publisher-semantic-file-set'],
  );
  assert(candidate.limits.includes('claim-model-provenance-unverified'));
  assert(candidate.limits.includes('adapter-code-unverified:claim-selection/model'));
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert.match(svg, /Projection claimant: adapter-maintainer/u);
  assert.match(svg, /Declared model owner: example:system/u);
});

test('a derived claim cannot borrow unverified ancestor bytes', async (t) => {
  const selected = await fixture(t, { delivery: 'derived' });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  await assert.rejects(
    compileEditionMeaning({ ...input, readSource: () => Buffer.from('wrong ancestor\n') }),
    { code: 'native_claim_model_ancestor_digest_mismatch' },
  );
});

test('malformed derived ancestry fails as an input error before semantic import', async (t) => {
  const selected = await fixture(t, { delivery: 'derived' });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const lock = structuredClone(input.lock);
  lock.derived[0].derivedFrom = null;
  await assert.rejects(
    compileEditionMeaning({
      ...input,
      lock,
      lockSha256: sha(Buffer.from(canonical(lock))),
    }),
    { code: 'edition_native_input_invalid' },
  );
});

test('typed claim changes produce exact selected fields and scoped review obligations', async (t) => {
  const before = await fixture(t);
  const changedModel = claimModel();
  changedModel.claims.intended.plane = 'observed';
  changedModel.claims.intended.condition.authorization = 'denied';
  changedModel.claims.intended.dependsOn = [
    { section: 'relations', id: 'request' },
    { section: 'entities', id: 'client' },
  ];
  const after = await fixture(t, { model: changedModel });
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert.deepEqual(delta.sourceBytes.changed, [modelNamespace]);
  assert(
    delta.supported.some(
      ({ subject, fields }) =>
        subject.kind === 'claim' &&
        ['condition', 'dependsOn', 'plane'].every((field) => fields.includes(field)),
    ),
  );
  const impact = compileNativeEditionEvolution({ before: prior, after: next });
  assert.deepEqual(impact.editions.changed, ['claim-atlas']);
  assert.deepEqual(impact.editions.affected[0].media, {
    static: ['overview'],
    interactive: ['overview'],
  });
  for (const key of [
    'rebuild',
    'semanticVerification',
    'mediumVerification',
    'humanReview',
    'acceptance',
    'publication',
  ])
    assert(impact.obligations[key].length > 0, `missing ${key}`);
});

test('entity and relation qualifier changes retain typed subjects', async (t) => {
  for (const [reference, mutate, kind] of [
    [
      'entity:client',
      (model) => {
        model.entities.client.qualifiers.owner = 'platform';
      },
      'entity',
    ],
    [
      'relation:request',
      (model) => {
        model.relations.request.qualifiers.policy = 'review';
      },
      'relation',
    ],
  ]) {
    const before = await fixture(t, { reference });
    const changedModel = claimModel();
    mutate(changedModel);
    const after = await fixture(t, { reference, model: changedModel });
    const prior = await evolutionSide(before);
    const next = await evolutionSide(after);
    const delta = compileNativeSelectionDelta(
      { lock: prior.lock, native: prior.meaning.native },
      { lock: next.lock, native: next.meaning.native },
    );
    assert(
      delta.supported.some(
        ({ subject, fields }) => subject.kind === kind && fields.includes('qualifiers'),
      ),
    );
    assert.equal(delta.hasChanges, true);
  }
});

test('a derived Claim Model change retains attribution without pretending to be native', async (t) => {
  const before = await fixture(t, { delivery: 'derived' });
  const changedModel = claimModel();
  changedModel.claims.intended.scope.environment = 'remote';
  const after = await fixture(t, { delivery: 'derived', model: changedModel });
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert(
    delta.supported.some(
      ({ subject, fields }) => subject.kind === 'claim' && fields.includes('scope'),
    ),
  );
  assert.equal(delta.hasChanges, true);
  assert(delta.unknown.some(({ reason }) => reason === 'derived-projection-bytes-changed'));
});

test('adapter metadata changes are not mislabeled as changed projection bytes', async (t) => {
  const before = await fixture(t, { delivery: 'derived' });
  const after = await fixture(t, { delivery: 'derived' });
  const manifestPath = path.join(after.root, 'provider/provider.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath));
  manifest.selected.derived[0].adapter.version = '2';
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + '\n');
  await fs.writeFile(manifestPath, manifestBytes);
  const request = JSON.parse(await fs.readFile(after.requestPath));
  request.providers[0].sha256 = sha(manifestBytes);
  const requestBytes = Buffer.from(JSON.stringify(request) + '\n');
  await fs.writeFile(after.requestPath, requestBytes);
  after.requestSha256 = sha(requestBytes);
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert(delta.unknown.some(({ reason }) => reason === 'derived-projection-binding-changed'));
  assert(!delta.unknown.some(({ reason }) => reason === 'derived-projection-bytes-changed'));
});

test('a predicate change is attributed to its predicate ID, not the claim ID', async (t) => {
  const before = await fixture(t);
  const changedModel = claimModel();
  changedModel.vocabulary.predicates.calls.cardinality = 'multiple';
  const after = await fixture(t, { model: changedModel });
  const prior = await evolutionSide(before);
  const next = await evolutionSide(after);
  const delta = compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
  assert(
    delta.supported.some(
      ({ subject, fields }) =>
        subject.kind === 'predicate' && subject.id === 'calls' && fields.includes('cardinality'),
    ),
  );
});

test('native comparison preserves uncertain Claim Model authorship and membership drift', async (t) => {
  const selected = await fixture(t);
  const prior = await evolutionSide(selected);
  const before = { lock: prior.lock, native: prior.meaning.native };
  const compare = (mutate) => {
    const after = structuredClone(before);
    mutate(after.native.selections[0], after.lock);
    after.native.semanticDigest = sha(Buffer.from(canonical(after.native.selections)));
    after.native.subjectLockSha256 = sha(Buffer.from(canonical(after.lock)));
    return compileNativeSelectionDelta(before, after);
  };
  const owner = compare((selection) => (selection.sourceOwner = 'another-claimant'));
  assert(owner.unknown.some(({ reason }) => reason === 'claim-model-sourceOwner-changed'));
  const provenance = compare((selection) => (selection.provenanceSources = ['different-source']));
  assert(provenance.unknown.some(({ reason }) => reason === 'claim-model-provenance-changed'));
  const namespace = compare((selection, lock) => {
    lock.sources.find(({ namespace: id }) => id === modelNamespace).namespace = 'fixture/renamed';
    selection.source.namespace = 'fixture/renamed';
  });
  assert(namespace.unknown.some(({ reason }) => reason === 'claim-model-namespace-changed'));
  const membership = compare((selection) => {
    selection.members.claims.push({ ...selection.members.claims[0], id: 'new-claim' });
  });
  assert(
    membership.supported.some(
      ({ subject, fields }) => subject.kind === 'selection-membership' && fields.includes('claims'),
    ),
  );
  const unrecognized = compare((selection) => {
    selection.members.claims[0].projectionNote = 'not source meaning';
  });
  assert(
    unrecognized.unknown.some(({ reason }) => reason === 'claim-model-member-field-unrecognized'),
  );
  for (const mutate of [
    (selection) => (selection.members.claims = null),
    (selection) => selection.members.claims.push(structuredClone(selection.members.claims[0])),
  ])
    assert.throws(() => compare(mutate), { code: 'native_evolution_input_invalid' });
});

test('native evolution rejects a forged Claim Model source class', async (t) => {
  const selected = await fixture(t);
  const side = await evolutionSide(selected);
  const forged = structuredClone(side.meaning.native);
  forged.selections[0].sourceClass = 'unverified';
  forged.semanticDigest = sha(Buffer.from(canonical(forged.selections)));
  assert.throws(
    () =>
      compileNativeSelectionDelta(
        { lock: side.lock, native: side.meaning.native },
        { lock: side.lock, native: forged },
      ),
    { code: 'native_evolution_input_invalid' },
  );
});

test('a typed claim builds independent media with visible qualifiers and no fake parser', async (t) => {
  const selected = await fixture(t);
  const output = path.join(selected.root, 'candidate');
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.equal(built.status, 'built');
  const replay = await verifySelectedCandidateReplay({
    requestPath: selected.requestPath,
    requestSha256: selected.requestSha256,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  assert.equal(replay.verdict, 'match');
  assert.equal(replay.candidateSha256, built.candidateSha256);
  assert.equal(replay.qualification, 'not-performed');
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json')));
  assert.deepEqual(
    candidate.input.semanticSupplies.map(({ id }) => id),
    ['publisher-semantic-file-set'],
  );
  assert.deepEqual(Object.keys(candidate.media).sort(), ['interactive', 'static']);
  assert.deepEqual(
    candidate.media.interactive.supplies.map(({ id }) => id),
    ['font-supply', 'publisher-interactive-media-file-set'],
  );
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  const painted = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map((match) => match[1])
    .join(' ');
  const reading = html.match(/<div class="claim-stage"[^>]*>([\s\S]*?)<\/div>/u)?.[1] ?? '';
  for (const phrase of [
    'intended',
    'client',
    'calls',
    'server',
    'authorization: granted',
    'environment: local',
    'target',
    'affirmed',
    'Declared product contract',
  ]) {
    assert(painted.includes(phrase), `static claim omits ${phrase}`);
    assert(reading.includes(phrase), `interactive claim omits ${phrase}`);
  }
  assert(painted.includes('Selected claimant: fixture-maintainer'));
  assert(painted.includes('Declared model owner: example:system'));
  assert(painted.includes('Claim plane: intended'));
  assert(painted.includes('Claimant-declared validity: affirmed'));
  assert(!painted.includes('Claim validity: affirmed'));
  assert(painted.includes('Declared dependency coverage: complete'));
  assert.match(reading, /<dt>Selected claimant<\/dt><dd>fixture-maintainer<\/dd>/u);
  assert.match(reading, /<dt>Declared model owner<\/dt><dd>example:system<\/dd>/u);
  assert.match(reading, /<dt>Claim plane<\/dt><dd>intended<\/dd>/u);
  assert.match(reading, /<dt>Claimant-declared validity<\/dt><dd>affirmed<\/dd>/u);
  assert.doesNotMatch(svg, /fixture\/claims|contract\.md/u);
  assert.doesNotMatch(html, /fixture\/claims|contract\.md/u);
});

test('claim Scenes use typed cards rather than graph nodes or arrows', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const interactive = composeInteractiveEditionScene(meaning);
  const staticScene = composeStaticEditionScene(meaning, null);
  for (const scene of [interactive.pages[0], staticScene]) {
    assert.deepEqual(scene.nodes, []);
    assert.deepEqual(scene.relations ?? scene.edges, []);
    assert.equal(scene.claimCards.length, 1);
    assert.deepEqual(scene.sourceAssertionCarriers[0].claimRefs, [
      {
        namespace: modelNamespace,
        reference: 'intended',
        sha256: sha(Buffer.from(JSON.stringify(selected.model) + '\n')),
      },
    ]);
  }
  assert.throws(
    () =>
      composeStaticEditionScene(meaning, {
        closure: 'upstream-layout-unqualified',
        nodes: [],
        edges: [],
      }),
    { code: 'static_scene_composition_ambiguous' },
  );
});

test('claim condition and plane changes alter both visible media without changing graph size', async (t) => {
  const changedCondition = claimModel();
  changedCondition.claims.intended.condition.authorization = 'denied';
  const changedPlane = claimModel();
  changedPlane.claims.intended.plane = 'observed';
  const fixtures = [
    await fixture(t),
    await fixture(t, { model: changedCondition }),
    await fixture(t, { model: changedPlane }),
  ];
  const built = [];
  for (const selected of fixtures) {
    const output = path.join(selected.root, 'candidate');
    await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
    built.push({
      candidate: JSON.parse(await fs.readFile(path.join(output, 'candidate.json'))),
      svg: await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8'),
      html: await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8'),
    });
  }
  for (const changed of built.slice(1)) {
    assert.notEqual(
      changed.candidate.media.static.artifacts[0].sha256,
      built[0].candidate.media.static.artifacts[0].sha256,
    );
    assert.notEqual(
      changed.candidate.media.interactive.artifacts[0].sha256,
      built[0].candidate.media.interactive.artifacts[0].sha256,
    );
  }
  assert.match(built[1].svg, /authorization: denied/u);
  assert.match(built[1].html, /authorization: denied/u);
  assert.match(built[2].svg, /Claim plane: observed/u);
  assert.match(built[2].html, /<dd>observed<\/dd>/u);
});

test('intended and implemented disagreement remains two attributed visible claims', async (t) => {
  const model = claimModel();
  model.claims.implemented.validity = 'refuted';
  const selected = await fixture(t, { model });
  selected.project.questions[0].text = 'How do intended and implemented calls differ?';
  selected.project.scope.selections.push({
    id: 'implemented-claim',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'claim:implemented',
    questions: ['condition'],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );

  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  assert.deepEqual(
    meaning.native.selections.map(({ target }) => target.id),
    ['intended', 'implemented'],
  );
  for (const scene of [
    composeStaticEditionScene(meaning, null),
    composeInteractiveEditionScene(meaning).pages[0],
  ]) {
    assert.equal(scene.claimCards.length, 2);
    assert.deepEqual(
      scene.sourceAssertionCarriers.map(({ claimRefs }) => claimRefs[0].reference),
      ['intended', 'implemented'],
    );
  }

  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  for (const phrase of [
    'Claim plane: intended',
    'Claim plane: implemented',
    'Claimant-declared validity: affirmed',
    'Claimant-declared validity: refuted',
  ])
    assert(svg.includes(phrase), `static claim omits ${phrase}`);
  for (const value of ['intended', 'implemented', 'affirmed', 'refuted'])
    assert.match(html, new RegExp(`<dd>${value}<\\/dd>`, 'u'));
});

test('two source claimants can disagree without merging equal native claim IDs', async (t) => {
  const selected = await fixture(t);
  const otherNamespace = 'fixture/other-claims';
  const otherModel = claimModel();
  otherModel.owner = 'example:other-system';
  otherModel.claims.intended.validity = 'refuted';
  const otherBytes = Buffer.from(JSON.stringify(otherModel) + '\n');
  await fs.writeFile(path.join(selected.root, 'sources/other-model.json'), otherBytes);

  const request = JSON.parse(await fs.readFile(selected.requestPath, 'utf8'));
  request.sources.push({
    id: 'other-model',
    namespace: otherNamespace,
    format: modelFormat,
    claimant: 'other-maintainer',
    revision: { kind: 'content', algorithm: 'sha256' },
    input: { kind: 'pin', path: 'sources/other-model.json', sha256: sha(otherBytes) },
  });
  const requestBytes = Buffer.from(JSON.stringify(request) + '\n');
  await fs.writeFile(selected.requestPath, requestBytes);
  selected.project.scope.sourceNamespaces.push(otherNamespace);
  selected.project.scope.selections.push({
    id: 'other-source-claim',
    namespace: otherNamespace,
    kind: 'reference',
    reference: 'claim:intended',
    questions: ['condition'],
  });
  selected.project.questions[0].text = 'How do the two claimants differ?';
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );

  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, sha(requestBytes), output);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  for (const claimant of ['fixture-maintainer', 'other-maintainer']) {
    assert(svg.includes(`Selected claimant: ${claimant}`));
    assert.match(html, new RegExp(`<dd>${claimant}<\\/dd>`, 'u'));
  }
  for (const validity of ['affirmed', 'refuted']) {
    assert(svg.includes(`Claimant-declared validity: ${validity}`));
    assert.match(html, new RegExp(`<dd>${validity}<\\/dd>`, 'u'));
  }
});

test('ungrouped Claim Model entity and relation selections fail closed', async (t) => {
  for (const reference of ['entity:client', 'relation:request']) {
    const selected = await fixture(t, { reference });
    const output = path.join(selected.root, 'candidate');
    await assert.rejects(
      compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output),
      { code: 'edition_scene_claim_model_unadmitted' },
    );
    await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  }
});

test('a grouped static Scene retains relation and dependent claim as separate source assertions', async (t) => {
  const model = claimModel();
  model.relations.request.qualifiers = { phase: 'selected', z: 'tail', ä: 'accent' };
  const selected = await groupedMixedFixture(t, { model });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeGroupedSelectionLayout(meaning);
  const scene = composeStaticEditionScene(meaning, layout);
  assert.equal(scene.nativeView, null);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ['client', 'server'],
  );
  assert.deepEqual(
    scene.edges[0].relations.map(({ reference }) => reference),
    ['request'],
  );
  assert.equal(
    scene.edges[0].relations[0].label,
    'Source relation qualifiers (unverified): phase: selected · z: tail · ä: accent',
  );
  const fragment = composeStaticEditionSvg(scene, { fragment: true });
  assert.equal(fragment.parts.relations[0].context, 'Source relation qualifiers (unverified)');
  assert.equal(Object.hasOwn(fragment.parts.relations[0], 'compactText'), false);
  assert.equal(scene.claimCards.length, 1);
  assert.deepEqual(scene.claimRelationLinks, [
    { claimAssertionId: 'selected-claim', relationAssertionId: 'selected-relation' },
  ]);
  assert.deepEqual(
    scene.sourceAssertionCarriers.map(({ kind }) => kind),
    ['relation', 'claim'],
  );
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationRefs, [
    {
      namespace: modelNamespace,
      reference: 'request',
      sha256: meaning.native.selections[0].source.sha256,
    },
  ]);
  assert.deepEqual(scene.sourceAssertionCarriers[1].claimRefs, [
    {
      namespace: modelNamespace,
      reference: 'intended',
      sha256: meaning.native.selections[1].source.sha256,
    },
  ]);
  const forged = structuredClone(layout);
  forged.edges[0].relations[0].reference = 'missing-relation';
  assert.throws(() => composeStaticEditionScene(meaning, forged), {
    code: 'static_scene_native_membership_mismatch',
  });
  const malformed = structuredClone(meaning);
  malformed.native.selections[0].members.relations[0].qualifiers = null;
  assert.throws(() => composeStaticEditionScene(malformed, layout), {
    code: 'static_scene_relation_qualifiers_invalid',
  });
  const unlinked = structuredClone(meaning);
  unlinked.native.selections[1].members.claims[0].dependsOn = [
    { section: 'relations', id: 'unselected' },
  ];
  assert.throws(() => composeStaticEditionScene(unlinked, layout), {
    code: 'static_scene_claim_relation_unbound',
  });
  const unboundSource = structuredClone(meaning);
  delete unboundSource.native.selections[1].source;
  assert.throws(() => composeStaticEditionScene(unboundSource, layout), {
    code: 'static_scene_claim_relation_unbound',
  });
  const changedClaimant = structuredClone(meaning);
  changedClaimant.native.selections[1].source.claimant = 'another-claimant';
  assert.throws(() => composeStaticEditionScene(changedClaimant, layout), {
    code: 'static_scene_claim_relation_unbound',
  });
});

test('a grouped Claim Model refinement keeps its typed claim linked to selected source structure', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['static'] });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeGroupedSelectionLayout(meaning);
  const refinement = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: {
        view: 'overview',
        nodes: layout.nodes.map(({ namespace, id, x, y, width, height }) => ({
          namespace,
          id,
          x,
          y,
          width,
          height,
        })),
        edges: layout.edges.map(({ from, to, relations, points }) => ({
          from,
          to,
          relations: relations.map(({ namespace, reference }) => ({ namespace, reference })),
          points,
        })),
        groups: layout.groups.map(({ id, x, y, width, height }) => ({
          id,
          x,
          y,
          width,
          height,
        })),
      },
    },
  };
  selected.project.visualPolicy.override = 'refinement.json';
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  await fs.writeFile(
    path.join(selected.root, 'edition/refinement.json'),
    JSON.stringify(refinement) + '\n',
  );
  const output = path.join(selected.root, 'refined-candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert.match(svg, /authorization: granted/u);
  assert.match(svg, /ON SOURCE RELATION/u);
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json'), 'utf8'));
  assert.equal(candidate.obligations.static.views[0].assertionIds.length, 2);

  refinement.media.static.edges[0].relations[0].reference = 'invented';
  await fs.writeFile(
    path.join(selected.root, 'edition/refinement.json'),
    JSON.stringify(refinement) + '\n',
  );
  await assert.rejects(
    compileEditionCandidateInput(
      selected.requestPath,
      selected.requestSha256,
      path.join(selected.root, 'forged-candidate'),
    ),
    { code: 'scene_refinement_membership_mismatch' },
  );
});

test('an unrelated Claim Model builds source-checked interactive HTML', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['interactive'] });
  selected.project.presentation.interactive.views[0].groups = structuredClone(
    selected.project.presentation.static.views[0].groups,
  );
  selected.project.visualPolicy.override = 'refinement.json';
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const ref = (kind, id) => JSON.stringify([modelNamespace, kind, id]);
  const resource = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      interactive: {
        kind: 'authored-architecture',
        pages: [
          {
            id: 'overview',
            label: 'Source relation and claim',
            purpose: 'overview',
            scene: {
              schema: 'architecture.interactive-scene/v1',
              id: 'overview',
              title: selected.project.title,
              subtitle: 'Source relation and claim',
              viewport: { width: 960, height: 540 },
              nodes: [
                {
                  id: 'client',
                  label: 'Client',
                  visualRole: 'external',
                  position: { x: 70, y: 180 },
                  size: { width: 220, height: 100 },
                  semanticIds: [ref('entity', 'client')],
                },
                {
                  id: 'server',
                  label: 'Server',
                  visualRole: 'backend',
                  position: { x: 620, y: 180 },
                  size: { width: 220, height: 100 },
                  semanticIds: [ref('entity', 'server')],
                },
              ],
              groups: [],
              edges: [
                {
                  id: 'request',
                  from: 'client',
                  to: 'server',
                  label: 'request',
                  visualRole: 'emphasis',
                  fromSide: 'right',
                  toSide: 'left',
                  route: 'straight',
                  semanticIds: [ref('relation', 'request')],
                },
              ],
            },
          },
        ],
      },
    },
  };
  const resourcePath = path.join(selected.root, 'edition/refinement.json');
  await fs.writeFile(resourcePath, JSON.stringify(resource) + '\n');
  const output = path.join(selected.root, 'authored-interactive');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  const match = html.match(
    /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
  );
  assert(match);
  const atlas = JSON.parse(match[1]);
  assert.equal(atlas.schema, 'architecture.interactive-html/v1');
  assert.deepEqual(atlas.order, ['overview']);
  assert.deepEqual(atlas.pages.overview.subjectSources, {
    client: ['selected-1'],
    server: ['selected-1'],
    request: ['selected-1'],
  });
  assert(
    atlas.pages.overview.facts.some(({ facts }) =>
      facts.some(({ label, value }) => label === 'Claim plane' && value === 'intended'),
    ),
  );
  assert(
    atlas.pages.overview.facts.some(({ facts }) =>
      facts.some(({ label, value }) => label === 'Condition' && value.includes('authorization')),
    ),
  );
  assert(!Object.hasOwn(atlas.sources['selected-1'], 'base64'));
  assert(!html.includes(JSON.stringify(selected.model)));

  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.requestPath, selected.requestSha256),
  );
  assert.deepEqual(
    composeAuthoredInteractiveArchitecture(meaning).pages.map(({ id }) => id),
    ['overview'],
  );
  for (const [name, mutate, code] of [
    [
      'wrong refinement kind',
      (value) => (value.refinement.media.interactive.kind = 'foreign'),
      'authored_interactive_input_invalid',
    ],
    [
      'page count mismatch',
      (value) =>
        value.refinement.media.interactive.pages.push(
          structuredClone(value.refinement.media.interactive.pages[0]),
        ),
      'authored_interactive_input_invalid',
    ],
    [
      'duplicate assertion identity',
      (value) => value.assertions.push(structuredClone(value.assertions[0])),
      'authored_interactive_input_invalid',
    ],
    [
      'duplicate native selection identity',
      (value) => value.native.selections.push(structuredClone(value.native.selections[0])),
      'authored_interactive_input_invalid',
    ],
    [
      'page identity mismatch',
      (value) => (value.refinement.media.interactive.pages[0].id = 'other'),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'page subtitle mismatch',
      (value) => (value.refinement.media.interactive.pages[0].label = 'Other meaning'),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'missing source assertion',
      (value) => (value.media.interactive.views[0].assertionIds = []),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'editorial assertion substituted for source evidence',
      (value) => (value.assertions[0].kind = 'editorial'),
      'authored_interactive_editorial_unadmitted',
    ],
    [
      'unselected source assertion',
      (value) => (value.assertions[0].selection = 'missing'),
      'authored_interactive_source_unadmitted',
    ],
    [
      'malformed qualified reference',
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds[0] = 'not-json'),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'noncanonical qualified reference',
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds[0] =
          '[ "fixture/claims", "entity", "client" ]'),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'unselected entity on a visible node',
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds[0] = ref(
          'entity',
          'other',
        )),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'node without a semantic binding',
      (value) => delete value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds,
      'authored_interactive_semantic_mismatch',
    ],
    [
      'relation without an entity carrier',
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds = [
          ref('relation', 'request'),
        ]),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'duplicate entity on two visible nodes',
      (value) =>
        (value.refinement.media.interactive.pages[0].scene.nodes[1].semanticIds = [
          ...value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds,
        ]),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'relation put inside a node without both endpoints',
      (value) =>
        value.refinement.media.interactive.pages[0].scene.nodes[0].semanticIds.push(
          ref('relation', 'request'),
        ),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'edge without semantic binding',
      (value) => delete value.refinement.media.interactive.pages[0].scene.edges[0].semanticIds,
      'authored_interactive_semantic_mismatch',
    ],
    [
      'edge identity collides with a node',
      (value) => (value.refinement.media.interactive.pages[0].scene.edges[0].id = 'client'),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'edge loses one relation endpoint',
      (value) => (value.refinement.media.interactive.pages[0].scene.edges[0].to = 'client'),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'selected relation is absent from the scene',
      (value) => (value.refinement.media.interactive.pages[0].scene.edges = []),
      'authored_interactive_semantic_mismatch',
    ],
    [
      'relation rendered in reverse direction',
      (value) => {
        const edge = value.refinement.media.interactive.pages[0].scene.edges[0];
        [edge.from, edge.to] = [edge.to, edge.from];
      },
      'authored_interactive_semantic_mismatch',
    ],
    [
      'missing declared provenance authority',
      (value) => {
        for (const item of value.native.selections) item.provenanceSources = {};
      },
      'authored_interactive_semantic_mismatch',
    ],
    [
      'mechanism page substituted for the overview',
      (value) => (value.refinement.media.interactive.pages[0].purpose = 'mechanism'),
      'authored_interactive_narrative_invalid',
    ],
  ]) {
    const mutated = structuredClone(meaning);
    mutate(mutated);
    assert.throws(() => composeAuthoredInteractiveArchitecture(mutated), { code }, name);
  }

  resource.media.interactive.pages[0].scene.edges[0].semanticIds = [ref('relation', 'invented')];
  await fs.writeFile(resourcePath, JSON.stringify(resource) + '\n');
  await assert.rejects(
    compileEditionCandidateInput(
      selected.requestPath,
      selected.requestSha256,
      path.join(selected.root, 'forged-interactive'),
    ),
    { code: 'authored_interactive_semantic_mismatch' },
  );
});

test('a grouped entity may carry a scalar claim without inventing a source relation', async (t) => {
  const selected = await fixture(t, { reference: 'entity:client' });
  selected.project.scope.selections[0].id = 'selected-entity';
  selected.project.scope.selections.push({
    id: 'selected-scalar',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'claim:observed',
    questions: ['condition'],
  });
  const groups = [
    {
      id: 'client-group',
      label: 'Client',
      elements: [{ namespace: modelNamespace, id: 'client' }],
    },
  ];
  selected.project.presentation.static.views[0].groups = groups;
  selected.project.presentation.interactive.views[0].groups = structuredClone(groups);
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const output = path.join(selected.root, 'entity-scalar-candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  assert.match(svg, /ON SOURCE ENTITY/u);
  assert.match(html, /observed/u);
  assert.doesNotMatch(svg, /SOURCE RELATIONS<\/text>/u);
});

test('one authored canvas binds two views and selected relation endpoints without duplicate selections', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['static'] });
  selected.project.presentation.static.width = 1200;
  selected.project.questions.push({
    id: 'shared-client',
    audience: 'maintainer',
    text: 'Which client is shared across the selected readings?',
  });
  selected.project.presentation.static.views.push({
    id: 'shared-client',
    questions: ['shared-client'],
  });
  selected.project.scope.selections[0].questions.push('shared-client');
  selected.project.visualPolicy.override = 'refinement.json';
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const semantic = (kind, id) => JSON.stringify([modelNamespace, kind, id]);
  const box = (x, y, width, height) => ({ x, y, width, height });
  const measurer = await createBundledTextMeasurer(await loadBundledFonts());
  const node = (id, x) => ({
    id,
    kind: 'stage',
    tone: 'ink',
    center: { x, y: 200 },
    radius: 12,
    box: box(x - 12, 188, 24, 24),
    paintBox: box(x - 13, 187, 26, 26),
    strokeWidth: 2,
    semanticIds: [semantic('entity', id)],
  });
  const label = (id, value, x, y, bound) => ({
    id,
    text: value,
    fontSize: 16,
    weight: '600',
    anchor: 'middle',
    tone: 'ink',
    x,
    baseline: y,
    visible: true,
    semanticIds: [bound],
    box: measurer.box({
      text: value,
      fontSize: 16,
      weight: '600',
      anchor: 'middle',
      x,
      baseline: y,
    }),
  });
  const resource = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: {
        kind: 'authored-canvas',
        scene: {
          schema: 'architecture.authored-static-scene/v1',
          title: selected.project.title,
          subtitle: selected.project.narrative.summary,
          width: 800,
          height: 400,
          referenceWidth: 800,
          spine: ['client', 'server'],
          paint: { paper: '#f3f0e8', ink: '#26362f', line: '#7d9183' },
          nodes: [node('client', 100), node('server', 600)],
          texts: [
            label('client-label', 'Client', 100, 150, semantic('entity', 'client')),
            label('server-label', 'Server', 600, 150, semantic('entity', 'server')),
            label('relation-label', 'Calls', 350, 180, semantic('relation', 'request')),
          ],
          edges: [
            {
              id: 'request',
              kind: 'flow',
              source: 'client',
              target: 'server',
              points: [
                { x: 112, y: 200 },
                { x: 588, y: 200 },
              ],
              strokeWidth: 1.5,
              arrow: true,
              arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
              semanticIds: [semantic('relation', 'request')],
              strokeTone: 'line',
            },
          ],
          decorations: [],
          requiredSemanticIds: [
            semantic('entity', 'client'),
            semantic('entity', 'server'),
            semantic('relation', 'request'),
          ],
        },
      },
    },
  };
  const resourcePath = path.join(selected.root, 'edition/refinement.json');
  await fs.writeFile(resourcePath, JSON.stringify(resource) + '\n');
  const output = path.join(selected.root, 'canvas-candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json')));
  assert(candidate.limits.includes('authored-canvas-claim-facts-not-exhaustively-painted'));
  assert.equal(
    (await fs.readFile(path.join(output, 'static/architecture.png'))).readUInt32BE(16),
    1200,
  );

  const collided = structuredClone(resource);
  collided.media.static.scene.texts[1].box = {
    ...collided.media.static.scene.texts[0].box,
  };
  await fs.writeFile(resourcePath, JSON.stringify(collided) + '\n');
  try {
    await assert.rejects(
      compileEditionCandidateInput(
        selected.requestPath,
        selected.requestSha256,
        path.join(selected.root, 'collided-candidate'),
      ),
      { code: 'authored_canvas_geometry_invalid' },
    );
  } finally {
    await fs.writeFile(resourcePath, JSON.stringify(resource) + '\n');
  }

  const cramped = structuredClone(resource);
  const clientLabel = cramped.media.static.scene.texts[0];
  const serverLabel = cramped.media.static.scene.texts[1];
  serverLabel.x = clientLabel.box.x + clientLabel.box.width + 2 + serverLabel.box.width / 2;
  serverLabel.box = measurer.box({
    text: serverLabel.text,
    fontSize: serverLabel.fontSize,
    weight: serverLabel.weight,
    anchor: serverLabel.anchor,
    x: serverLabel.x,
    baseline: serverLabel.baseline,
  });
  await fs.writeFile(resourcePath, JSON.stringify(cramped) + '\n');
  try {
    await assert.rejects(
      compileEditionCandidateInput(
        selected.requestPath,
        selected.requestSha256,
        path.join(selected.root, 'cramped-candidate'),
      ),
      {
        code: 'authored_canvas_geometry_invalid',
        message: /authored_canvas_geometry_invalid:text-clearance/u,
      },
    );
  } finally {
    await fs.writeFile(resourcePath, JSON.stringify(resource) + '\n');
  }

  const falselyMeasured = structuredClone(resource);
  falselyMeasured.media.static.scene.texts[0].text = 'A'.repeat(100);
  await fs.writeFile(resourcePath, JSON.stringify(falselyMeasured) + '\n');
  try {
    await assert.rejects(
      compileEditionCandidateInput(
        selected.requestPath,
        selected.requestSha256,
        path.join(selected.root, 'falsely-measured-candidate'),
      ),
      { code: 'authored_canvas_text_metrics_invalid' },
    );
  } finally {
    await fs.writeFile(resourcePath, JSON.stringify(resource) + '\n');
  }

  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.requestPath, selected.requestSha256),
  );
  const authored = composeAuthoredStaticCanvas(meaning);
  assert.equal(authored.scene.schema, 'architecture.authored-static-scene/v1');
  assert.deepEqual(
    authored.carriers.views.map(({ id }) => id),
    ['overview', 'shared-client'],
  );
  const canvas = (value) => value.refinement.media.static.scene;
  const firstAssertion = (value) =>
    value.assertions.find(({ id }) => value.media.static.views[0].assertionIds[0] === id);
  for (const [name, mutate, code] of [
    [
      'empty selected view',
      (value) => (value.media.static.views[1].assertionIds = []),
      'authored_canvas_input_invalid',
    ],
    [
      'claim cannot borrow a relation from another view',
      (value) => {
        const claim = value.assertions.find(
          ({ selection }) =>
            value.native.selections.find((item) => item.selectionId === selection)?.target.kind ===
            'claim',
        );
        value.media.static.views[1].assertionIds = [claim.id];
      },
      'authored_canvas_claim_unbound',
    ],
    [
      'duplicate assertion identity',
      (value) => value.assertions.push(structuredClone(value.assertions[0])),
      'authored_canvas_input_invalid',
    ],
    [
      'duplicate selection identity',
      (value) => value.native.selections.push(structuredClone(value.native.selections[0])),
      'authored_canvas_input_invalid',
    ],
    [
      'same source meaning selected under two assertion IDs',
      (value) => {
        const view = value.media.static.views[0];
        const assertion = value.assertions.find(
          (item) =>
            view.assertionIds.includes(item.id) &&
            value.native.selections.some(
              (selection) =>
                selection.selectionId === item.selection && selection.target.kind === 'relation',
            ),
        );
        const selection = structuredClone(
          value.native.selections.find((item) => item.selectionId === assertion.selection),
        );
        selection.selectionId = 'duplicate-source';
        value.native.selections.push(selection);
        value.assertions.push({
          ...assertion,
          id: 'duplicate-source-assertion',
          selection: selection.selectionId,
        });
        view.assertionIds.push('duplicate-source-assertion');
      },
      'authored_canvas_membership_mismatch',
    ],
    [
      'editorial assertion as source',
      (value) => (firstAssertion(value).kind = 'editorial'),
      'authored_canvas_editorial_unadmitted',
    ],
    [
      'unselected source assertion',
      (value) => (firstAssertion(value).selection = 'missing'),
      'authored_canvas_source_unadmitted',
    ],
    [
      'relation endpoint with contradictory source digest',
      (value) => {
        const relation = value.native.selections.find(({ target }) => target.kind === 'relation');
        relation.members.elements[0].sha256 = '0'.repeat(64);
      },
      'authored_canvas_source_unadmitted',
    ],
    [
      'non-string source reference',
      (value) => (canvas(value).requiredSemanticIds[0] = 42),
      'authored_canvas_reference_invalid',
    ],
    [
      'malformed source reference',
      (value) => (canvas(value).requiredSemanticIds[0] = 'not-json'),
      'authored_canvas_reference_invalid',
    ],
    [
      'noncanonical source reference',
      (value) =>
        (canvas(value).requiredSemanticIds[0] = '[ "fixture/claims", "entity", "client" ]'),
      'authored_canvas_reference_invalid',
    ],
    [
      'duplicate declared reference',
      (value) => canvas(value).requiredSemanticIds.push(canvas(value).requiredSemanticIds[0]),
      'authored_canvas_membership_mismatch',
    ],
    [
      'unselected declared reference',
      (value) => (canvas(value).requiredSemanticIds[0] = semantic('entity', 'other')),
      'authored_canvas_membership_mismatch',
    ],
    [
      'duplicate node graphic',
      (value) => (canvas(value).nodes[1].id = canvas(value).nodes[0].id),
      'authored_canvas_graphic_ambiguous',
    ],
    [
      'duplicate entity carrier',
      (value) => (canvas(value).nodes[1].semanticIds = [...canvas(value).nodes[0].semanticIds]),
      'authored_canvas_membership_mismatch',
    ],
    [
      'missing entity carrier',
      (value) => (canvas(value).nodes[0].semanticIds = []),
      'authored_canvas_membership_mismatch',
    ],
    [
      'duplicate text graphic',
      (value) => (canvas(value).texts[1].id = canvas(value).texts[0].id),
      'authored_canvas_graphic_ambiguous',
    ],
    [
      'hidden source text',
      (value) => (canvas(value).texts[0].visible = false),
      'authored_canvas_membership_mismatch',
    ],
    [
      'duplicate text source',
      (value) => (canvas(value).texts[1].semanticIds = [...canvas(value).texts[0].semanticIds]),
      'authored_canvas_membership_mismatch',
    ],
    [
      'missing relation text',
      (value) => (canvas(value).texts[2].semanticIds = []),
      'authored_canvas_membership_mismatch',
    ],
    [
      'duplicate edge graphic',
      (value) => canvas(value).edges.push(structuredClone(canvas(value).edges[0])),
      'authored_canvas_graphic_ambiguous',
    ],
    [
      'missing edge endpoint',
      (value) => (canvas(value).edges[0].target = 'missing'),
      'authored_canvas_edge_binding_mismatch',
    ],
    [
      'edge without relation binding',
      (value) => (canvas(value).edges[0].semanticIds = []),
      'authored_canvas_edge_binding_mismatch',
    ],
    [
      'entity miscast as edge relation',
      (value) => (canvas(value).edges[0].semanticIds = [semantic('entity', 'client')]),
      'authored_canvas_edge_binding_mismatch',
    ],
    [
      'relation with absent semantic endpoint',
      (value) => (canvas(value).edges[0].target = 'client'),
      'authored_canvas_edge_binding_mismatch',
    ],
    [
      'relation rendered in reverse',
      (value) => {
        const edge = canvas(value).edges[0];
        [edge.source, edge.target] = [edge.target, edge.source];
      },
      'authored_canvas_edge_binding_mismatch',
    ],
    [
      'relation assigned to two arrows',
      (value) => {
        const duplicate = structuredClone(canvas(value).edges[0]);
        duplicate.id = 'request-copy';
        canvas(value).edges.push(duplicate);
      },
      'authored_canvas_edge_binding_mismatch',
    ],
  ]) {
    const mutated = structuredClone(meaning);
    mutate(mutated);
    assert.throws(() => composeAuthoredStaticCanvas(mutated), { code }, name);
  }

  resource.media.static.scene.edges[0].semanticIds = [semantic('relation', 'invented')];
  await fs.writeFile(resourcePath, JSON.stringify(resource) + '\n');
  await assert.rejects(
    compileEditionCandidateInput(
      selected.requestPath,
      selected.requestSha256,
      path.join(selected.root, 'forged-canvas'),
    ),
    { code: 'authored_canvas_edge_binding_mismatch' },
  );
});

test('a mixed page carries a scalar claim on its own source subject without inventing an edge', async (t) => {
  const selected = await mixedScalarFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const staticScene = composeStaticEditionScene(meaning, composeGroupedSelectionLayout(meaning));
  assert.equal(staticScene.nodes.length, 2);
  assert.equal(staticScene.edges.length, 1);
  assert.equal(staticScene.claimCards.length, 2);
  assert.deepEqual(staticScene.claimSubjectLinks, [
    {
      claimAssertionId: 'selected-scalar',
      subject: {
        namespace: modelNamespace,
        id: 'other',
        sha256: meaning.native.selections[0].source.sha256,
      },
    },
  ]);
  const staticRendered = composeStaticEditionSvg(staticScene);
  assert.match(staticRendered.bytes.toString('utf8'), /ON SOURCE ENTITY/u);
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, 'static', staticScene, staticRendered.carriers),
  );

  const claimAssertionIds = new Set(
    meaning.assertions
      .filter(
        ({ selection }) =>
          meaning.native.selections.find(({ selectionId }) => selectionId === selection)?.target
            .kind === 'claim',
      )
      .map(({ id }) => id),
  );
  for (const [name, mutate] of [
    [
      'duplicate claim card',
      (value) => value.scene.claimCards.push(structuredClone(value.scene.claimCards[0])),
    ],
    [
      'unselected claim card',
      (value) => value.scene.claimCards.push({ ...value.scene.claimCards[0], id: 'invented' }),
    ],
    [
      'non-claim assertion borrows a claim',
      (value) => {
        const carrier = value.scene.sourceAssertionCarriers.find(
          ({ assertionId }) => !claimAssertionIds.has(assertionId),
        );
        carrier.claimRefs = structuredClone(
          value.scene.sourceAssertionCarriers.find(({ assertionId }) =>
            claimAssertionIds.has(assertionId),
          ).claimRefs,
        );
      },
    ],
    [
      'claim assertion hides its claim reference',
      (value) => {
        delete value.scene.sourceAssertionCarriers.find(({ assertionId }) =>
          claimAssertionIds.has(assertionId),
        ).claimRefs;
      },
    ],
    [
      'malformed selected claim',
      (value) => {
        value.meaning.native.selections.find(
          ({ target }) => target.kind === 'claim',
        ).members.claims = [];
      },
    ],
    [
      'selected relation loses every claim card',
      (value) => {
        delete value.scene.claimCards;
        delete value.carriers.claims;
      },
    ],
    ['relation claim loses its source link', (value) => (value.scene.claimRelationLinks = [])],
    ['scalar claim loses its subject link', (value) => (value.scene.claimSubjectLinks = [])],
  ]) {
    const value = {
      meaning: structuredClone(meaning),
      scene: structuredClone(staticScene),
      carriers: structuredClone(staticRendered.carriers),
    };
    mutate(value);
    assert.throws(
      () => validateVisibleSelection(value.meaning, 'static', value.scene, value.carriers),
      { code: 'edition_visible_coverage_mismatch' },
      name,
    );
  }

  const interactiveScene = composeInteractiveEditionScene(meaning);
  const page = interactiveScene.pages[0];
  assert.equal(page.nodes.length, 2);
  assert.equal(page.relations.length, 1);
  assert.deepEqual(page.claimSubjectLinks, staticScene.claimSubjectLinks);
  const projected = projectInteractivePage(page, 0);
  assert(projected.publicPage.claims.some(({ sourceAnchor }) => sourceAnchor === 'entity'));
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, 'interactive', interactiveScene, [projected.carriers]),
  );

  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  assert.match(html, /ON SOURCE ENTITY/u);
  assert.match(html, /healthy/u);
  assert.match(html, /other/u);
});

test('a mixed scalar claim cannot forge or lose its subject dependency', async (t) => {
  const selected = await mixedScalarFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const wrongDependency = structuredClone(meaning);
  wrongDependency.native.selections.find(
    ({ target }) => target.id === 'other-status',
  ).members.claims[0].dependsOn = [{ section: 'entities', id: 'server' }];
  assert.throws(() => composeInteractiveEditionScene(wrongDependency), {
    code: 'interactive_scene_claim_relation_unbound',
  });
  for (const [change, code] of [
    [
      (selection) => {
        selection.members.elements[0] = null;
      },
      'edition_claim_card_invalid',
    ],
    [
      (selection) => {
        selection.members.claims[0].dependsOn = [null];
      },
      'interactive_scene_claim_relation_unbound',
    ],
  ]) {
    const malformed = structuredClone(meaning);
    change(malformed.native.selections.find(({ target }) => target.id === 'other-status'));
    assert.throws(() => composeInteractiveEditionScene(malformed), { code });
  }
  const scene = structuredClone(
    composeStaticEditionScene(meaning, composeGroupedSelectionLayout(meaning)),
  );
  const missing = structuredClone(scene);
  delete missing.claimSubjectLinks;
  assert.throws(() => composeStaticEditionSvg(missing), {
    code: 'static_edition_claim_relation_invalid',
  });
  const interactive = composeInteractiveEditionScene(meaning);
  const projected = projectInteractivePage(interactive.pages[0], 0);
  const missingInteractive = structuredClone(interactive);
  delete missingInteractive.pages[0].claimSubjectLinks;
  assert.throws(
    () =>
      validateVisibleSelection(meaning, 'interactive', missingInteractive, [projected.carriers]),
    { code: 'edition_visible_coverage_mismatch' },
  );
  scene.claimSubjectLinks[0].subject.id = 'invented';
  const rendered = composeStaticEditionSvg(scene);
  assert.throws(() => validateVisibleSelection(meaning, 'static', scene, rendered.carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('a selected relation can publish structural media without inventing claim status', async (t) => {
  const model = claimModel();
  model.relations.request.qualifiers = { 'Claim plane': 'implemented' };
  const selected = await groupedMixedFixture(t, { model });
  selected.project.scope.selections = selected.project.scope.selections.filter(({ reference }) =>
    reference.startsWith('relation:'),
  );
  selected.project.scope.limits.push({
    question: 'condition',
    reason: 'Relation topology only; typed claim status is not selected.',
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );

  const output = path.join(selected.root, 'candidate');
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.deepEqual(built.media, ['interactive', 'static']);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  for (const [name, medium] of [
    ['svg', svg],
    ['html', html],
  ]) {
    const visible = medium.replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ');
    assert(visible.includes('Relation topology only; typed claim status is not selected.'), name);
    assert(
      visible.includes(
        'Source-reported topology; provenance unverified; typed claim status not selected.',
      ),
      name,
    );
  }
  const visibleStatic = svg.replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ');
  assert.equal(
    (visibleStatic.match(/Source relation qualifiers \(unverified\)/gu) ?? []).length,
    1,
  );
  assert(visibleStatic.includes('Claim plane: implemented'));
  assert(!visibleStatic.includes('Claim plane: implemented · calls'));
  assert(html.includes('Source-reported relation qualifiers · unverified'));
  assert(html.includes('<dt>Claim plane</dt><dd>&quot;implemented&quot;</dd>'));
  assert(!html.includes('Source relation qualifiers (unverified): Claim plane: implemented'));
  assert(svg.includes('SOURCE RELATIONS'));
  assert(!svg.includes('SOURCE CLAIMS'));
  assert(html.includes('Source relations'));
  assert(!html.includes('Source claims'));

  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(scene.pages[0].claimCards, []);
  assert.deepEqual(scene.pages[0].relations[0].sourceQualifiers, [
    { name: 'Claim plane', value: '"implemented"' },
  ]);
  const rendered = await renderInteractiveEditionHtml(scene);
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, 'interactive', scene, rendered.carriers),
  );
  const inventedClaimLink = structuredClone(scene);
  inventedClaimLink.pages[0].claimRelationLinks = [];
  assert.throws(
    () => validateVisibleSelection(meaning, 'interactive', inventedClaimLink, rendered.carriers),
    { code: 'edition_visible_coverage_mismatch' },
  );
  const forged = structuredClone(scene);
  forged.pages[0].sourceAssertionCarriers[0].relationRefs[0].reference = 'not-selected';
  assert.throws(() => validateVisibleSelection(meaning, 'interactive', forged, rendered.carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('relation-only coverage rejects endpoints without the selected relation', async (t) => {
  const selected = await groupedMixedFixture(t);
  selected.project.scope.selections = selected.project.scope.selections.filter(({ reference }) =>
    reference.startsWith('relation:'),
  );
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);

  const staticScene = composeStaticEditionScene(meaning, composeGroupedSelectionLayout(meaning));
  const staticForged = structuredClone(staticScene);
  staticForged.edges = [];
  staticForged.sourceAssertionCarriers[0].relationRefs = [];
  const staticRendered = composeStaticEditionSvg(staticForged);
  assert.throws(
    () => validateVisibleSelection(meaning, 'static', staticForged, staticRendered.carriers),
    { code: 'edition_visible_coverage_mismatch' },
  );

  const interactiveScene = composeInteractiveEditionScene(meaning);
  const interactiveForged = structuredClone(interactiveScene);
  interactiveForged.pages[0].relations = [];
  interactiveForged.pages[0].sourceAssertionCarriers[0].relationRefs = [];
  const interactiveRendered = await renderInteractiveEditionHtml(interactiveForged);
  assert.throws(
    () =>
      validateVisibleSelection(
        meaning,
        'interactive',
        interactiveForged,
        interactiveRendered.carriers,
      ),
    { code: 'edition_visible_coverage_mismatch' },
  );
});

test('a mixed page keeps unclaimed relations structural beside linked claims', async (t) => {
  const selected = await groupedMixedFixture(t, { model: twoRelationClaimModel() });
  selected.project.scope.selections.push({
    id: 'second-relation',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'relation:second',
    questions: ['condition'],
  });
  selected.project.presentation.static.views[0].groups.push({
    id: 'other-group',
    label: 'Other',
    elements: [{ namespace: modelNamespace, id: 'other' }],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );

  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  const note =
    'Unlinked relations show source topology only; typed claim status is not selected, and provenance is unverified.';
  for (const [name, medium] of [
    ['svg', svg],
    ['html', html],
  ]) {
    const visible = medium.replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ');
    assert(visible.includes(note), name);
  }
  assert.equal((svg.match(/data-graphic-id="r-[01]"/gu) ?? []).length, 2);
  assert(!svg.includes('SOURCE RELATIONS'));
  assert(svg.includes('SOURCE CLAIMS'));
  assert(html.includes('Source relations'));
  assert(html.includes('Source claims'));

  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const staticScene = composeStaticEditionScene(meaning, composeGroupedSelectionLayout(meaning));
  assert.deepEqual(
    staticScene.sourceAssertionCarriers
      .filter(({ kind }) => kind === 'relation')
      .map(({ relationRefs }) => relationRefs[0].reference)
      .sort(),
    ['request', 'second'],
  );
  assert.equal(staticScene.claimCards.length, 1);
  assert.deepEqual(staticScene.claimRelationLinks, [
    { claimAssertionId: 'selected-claim', relationAssertionId: 'selected-relation' },
  ]);
  const staticWrongLink = structuredClone(staticScene);
  staticWrongLink.claimRelationLinks[0].relationAssertionId = 'second-relation';
  const staticWrongRendered = composeStaticEditionSvg(staticWrongLink);
  assert.throws(
    () =>
      validateVisibleSelection(meaning, 'static', staticWrongLink, staticWrongRendered.carriers),
    { code: 'edition_visible_coverage_mismatch' },
  );
  const staticForged = structuredClone(staticScene);
  staticForged.edges = staticForged.edges.filter(
    (edge) => !edge.relations.some(({ reference }) => reference === 'second'),
  );
  staticForged.sourceAssertionCarriers.find(
    ({ assertionId }) => assertionId === 'second-relation',
  ).relationRefs = [];
  const staticRendered = composeStaticEditionSvg(staticForged);
  assert.throws(
    () => validateVisibleSelection(meaning, 'static', staticForged, staticRendered.carriers),
    { code: 'edition_visible_coverage_mismatch' },
  );

  const interactiveScene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(
    interactiveScene.pages[0].sourceAssertionCarriers
      .filter(({ kind }) => kind === 'relation')
      .map(({ relationRefs }) => relationRefs[0].reference)
      .sort(),
    ['request', 'second'],
  );
  assert.equal(interactiveScene.pages[0].claimCards.length, 1);
  assert.deepEqual(interactiveScene.pages[0].claimRelationLinks, [
    { claimAssertionId: 'selected-claim', relationAssertionId: 'selected-relation' },
  ]);
  const interactiveWrongLink = structuredClone(interactiveScene);
  interactiveWrongLink.pages[0].claimRelationLinks[0].relationAssertionId = 'second-relation';
  const interactiveWrongRendered = await renderInteractiveEditionHtml(interactiveWrongLink);
  assert.throws(
    () =>
      validateVisibleSelection(
        meaning,
        'interactive',
        interactiveWrongLink,
        interactiveWrongRendered.carriers,
      ),
    { code: 'edition_visible_coverage_mismatch' },
  );
  const interactiveForged = structuredClone(interactiveScene);
  interactiveForged.pages[0].relations = interactiveForged.pages[0].relations.filter(
    ({ id }) => id !== 'second',
  );
  interactiveForged.pages[0].sourceAssertionCarriers.find(
    ({ assertionId }) => assertionId === 'second-relation',
  ).relationRefs = [];
  const interactiveRendered = await renderInteractiveEditionHtml(interactiveForged);
  assert.throws(
    () =>
      validateVisibleSelection(
        meaning,
        'interactive',
        interactiveForged,
        interactiveRendered.carriers,
      ),
    { code: 'edition_visible_coverage_mismatch' },
  );
});

test('typed claim dimensions use stable code-point order instead of host collation', async (t) => {
  const model = claimModel();
  model.claims.intended.condition = { z: 'tail', ä: 'accent' };
  const selected = await fixture(t, { model });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const condition = claimCard(meaning.native.selections[0]).facts.find(
    ({ label }) => label === 'Condition',
  );
  assert.equal(condition.value, 'z: tail · ä: accent');
});

test('static claim card order is stable across host collation settings', async (t) => {
  const model = claimModel();
  model.claims.z = structuredClone(model.claims.intended);
  model.claims.z.condition.case = 'z';
  model.claims.ä = structuredClone(model.claims.intended);
  model.claims.ä.condition.case = 'accent';
  const selected = await fixture(t, { model, reference: 'claim:z' });
  selected.project.scope.selections.push({
    id: 'accented-claim',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'claim:ä',
    questions: ['condition'],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeStaticEditionScene(meaning, null);
  assert.deepEqual(
    scene.claimCards.map(({ id }) => id),
    ['z', 'ä'],
  );
});

test('a selected relation and dependent claim build a source-bound static Candidate', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['static'] });
  const output = path.join(selected.root, 'candidate');
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.deepEqual(built.media, ['static']);
  const replay = await verifySelectedCandidateReplay({
    requestPath: selected.requestPath,
    requestSha256: selected.requestSha256,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  assert.equal(replay.verdict, 'match');
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json')));
  assert.deepEqual(Object.keys(candidate.media), ['static']);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const painted = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map((match) => match[1])
    .join(' ');
  assert(painted.includes('SOURCE STRUCTURE'));
  assert(painted.includes('SOURCE CLAIMS'));
  assert.match(painted, /calls/u);
  assert.match(svg, /data-graphic-id="r-0"/u);
  assert.match(painted, /Claim plane: intended/u);
  assert.match(painted, /authorization: granted/u);
  assert(!svg.includes('fixture/claims'), 'private source identity leaked into static SVG');
  assert.equal(selected.project.requiredAssertions, undefined);
});

test('two static views become one figure without merging their source assertions', async (t) => {
  const selected = await groupedMixedFixture(t, {
    model: twoRelationClaimModel(),
    media: ['static'],
  });
  selected.project.questions.push({
    id: 'followup',
    audience: 'maintainer',
    text: 'When may the server call?',
  });
  selected.project.scope.selections.push(
    {
      id: 'second-relation',
      namespace: modelNamespace,
      kind: 'reference',
      reference: 'relation:second',
      questions: ['followup'],
    },
    {
      id: 'second-claim',
      namespace: modelNamespace,
      kind: 'reference',
      reference: 'claim:aaa',
      questions: ['followup'],
    },
  );
  selected.project.presentation.static.views.push({
    id: 'followup',
    questions: ['followup'],
    groups: [
      {
        id: 'shared-server',
        label: 'Shared server',
        elements: [{ namespace: modelNamespace, id: 'server' }],
      },
      {
        id: 'other-target',
        label: 'Other target',
        elements: [{ namespace: modelNamespace, id: 'other' }],
      },
    ],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );

  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json')));
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert.deepEqual(
    candidate.obligations.static.views.map(({ id }) => id),
    ['overview', 'followup'],
  );
  assert.equal((svg.match(/<svg\b/gu) ?? []).length, 1);
  assert.equal((svg.match(/data-static-view=/gu) ?? []).length, 2);
  assert.equal((svg.match(/METHOD LIMITS/gu) ?? []).length, 1);
  assert.equal((svg.match(/READER QUESTIONS/gu) ?? []).length, 0);
  assert.match(svg, /data-graphic-id="static-view-0-r-0"/u);
  assert.match(svg, /data-graphic-id="static-view-1-r-0"/u);
  assert.match(svg, /When may the client call\?/u);
  assert.match(svg, /When may the server call\?/u);
  assert.equal(candidate.media.static.artifacts.length, 2);
  assert(!svg.includes(modelNamespace), 'private source identity leaked into static SVG');
});

test('one mixed static claim uses the available plate in two reading columns', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['static'] });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeStaticEditionScene(meaning, composeGroupedSelectionLayout(meaning));
  const rendered = composeStaticEditionSvg(scene);
  const svg = rendered.bytes.toString('utf8');
  const claim = /<g data-graphic-id="c-0">([\s\S]*?)<\/g>/u.exec(svg)?.[1];
  assert(claim);
  const rect = /<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/u.exec(claim);
  assert(rect);
  assert(Number(rect[2]) >= rendered.width - 121);
  const subject = /<text x="([\d.]+)"[^>]*>Subject:/u.exec(claim);
  const claimant = /<text x="([\d.]+)"[^>]*>Selected claimant:/u.exec(claim);
  assert(subject && claimant);
  assert(Number(claimant[1]) > Number(subject[1]) + 150);
  assert.equal(rendered.carriers.claims.length, 1);
});

test('a selected relation and dependent claim build a readable interactive Candidate', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['interactive'] });
  const output = path.join(selected.root, 'candidate');
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.deepEqual(built.media, ['interactive']);
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  assert(html.includes('class="graph"'), 'selected structure must be visible');
  assert(html.includes('class="claim-stage"'), 'typed claim must be visible beside the graph');
  assert(html.includes('authorization: granted'));
  assert(html.includes('ON SOURCE RELATION 01'));
  assert(!html.includes(modelNamespace), 'private source namespace leaked into HTML');
  const replay = await verifySelectedCandidateReplay({
    requestPath: selected.requestPath,
    requestSha256: selected.requestSha256,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  assert.equal(replay.verdict, 'match');
});

test('interactive claim context is factored only when exact and leaves per-claim anchors', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['interactive'] });
  selected.project.scope.selections.push({
    id: 'implemented-claim',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'claim:implemented',
    questions: ['condition'],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  const claims = /<section class="linked-claims"[^>]*>([\s\S]*?)<\/section>/u.exec(html)?.[1];
  assert(claims);
  assert(claims.includes('COMMON TO ALL SELECTED CLAIMS'));
  assert.equal((claims.match(/<dt>Claimant-declared validity<\/dt>/gu) ?? []).length, 1);
  assert.equal((claims.match(/<dt>Selected claimant<\/dt>/gu) ?? []).length, 1);
  assert.equal((claims.match(/<dt>Claim plane<\/dt>/gu) ?? []).length, 2);
  assert.equal((claims.match(/<dt>Subject<\/dt>/gu) ?? []).length, 2);
  assert.equal((claims.match(/<dt>Declared evidence authority<\/dt>/gu) ?? []).length, 2);
});

test('mixed interactive media rejects a forged source dependency behind valid graphics', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['interactive'] });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeInteractiveEditionScene(meaning);
  const rendered = await renderInteractiveEditionHtml(scene);
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, 'interactive', scene, rendered.carriers),
  );

  const forged = structuredClone(scene);
  forged.pages[0].claimRelationLinks[0].relationAssertionId = 'not-selected';
  await assert.rejects(renderInteractiveEditionHtml(forged), {
    code: 'render_interactive_claim_relation_invalid',
  });

  const falseDependency = structuredClone(meaning);
  falseDependency.native.selections[1].members.claims[0].dependsOn = [];
  assert.throws(
    () => validateVisibleSelection(falseDependency, 'interactive', scene, rendered.carriers),
    { code: 'edition_visible_coverage_mismatch' },
  );
});

test('two claims on one selected relation keep distinct visible carriers', async (t) => {
  const selected = await groupedMixedFixture(t, { media: ['static'] });
  selected.project.scope.selections.push({
    id: 'implemented-claim',
    namespace: modelNamespace,
    kind: 'reference',
    reference: 'claim:implemented',
    questions: ['condition'],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert.equal((svg.match(/data-graphic-id="r-0"/gu) ?? []).length, 1);
  assert.equal((svg.match(/data-graphic-id="c-[01]"/gu) ?? []).length, 2);
  assert.equal((svg.match(/ON SOURCE RELATION 01/gu) ?? []).length, 2);
  assert(svg.includes('Claim plane: intended'));
  assert(svg.includes('Claim plane: implemented'));
  const vertical = /<line x1="([^"]+)" y1="[^"]+" x2="\1" y2="([^"]+)"/u.exec(svg);
  const second = /<g data-graphic-id="c-1">\s*<rect x="([^"]+)" y="([^"]+)" width="([^"]+)"/u.exec(
    svg,
  );
  assert(vertical && second);
  assert(Number(second[1]) + Number(second[3]) > Number(vertical[1]) + 40);
  assert(Number(second[2]) > Number(vertical[2]) + 20);
});

test('mixed static claims follow source-relation reading order rather than claim IDs', async (t) => {
  const selected = await groupedMixedFixture(t, { model: twoRelationClaimModel() });
  selected.project.scope.selections.push(
    {
      id: 'second-relation',
      namespace: modelNamespace,
      kind: 'reference',
      reference: 'relation:second',
      questions: ['condition'],
    },
    {
      id: 'first-claim',
      namespace: modelNamespace,
      kind: 'reference',
      reference: 'claim:aaa',
      questions: ['condition'],
    },
  );
  selected.project.presentation.static.views[0].groups.push({
    id: 'other-group',
    label: 'Other',
    elements: [{ namespace: modelNamespace, id: 'other' }],
  });
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeStaticEditionScene(meaning, composeGroupedSelectionLayout(meaning));
  const rendered = composeStaticEditionSvg(scene);
  assert.doesNotThrow(() => validateVisibleSelection(meaning, 'static', scene, rendered.carriers));
  const svg = rendered.bytes.toString('utf8');
  const first = svg.indexOf('ON SOURCE RELATION 01');
  const second = svg.indexOf('ON SOURCE RELATION 02');
  assert(first >= 0 && second >= 0);
  assert(first < second, 'claims must follow visible relation numbering');
});

test('mixed interactive pages keep separate question-local graphs and claims', async (t) => {
  const selected = await groupedMixedFixture(t, {
    model: twoRelationClaimModel(),
    media: ['interactive'],
  });
  selected.project.questions.push({
    id: 'followup',
    audience: 'maintainer',
    text: 'What happens after the server?',
  });
  selected.project.scope.selections.push(
    {
      id: 'second-relation',
      namespace: modelNamespace,
      kind: 'reference',
      reference: 'relation:second',
      questions: ['followup'],
    },
    {
      id: 'first-claim',
      namespace: modelNamespace,
      kind: 'reference',
      reference: 'claim:aaa',
      questions: ['followup'],
    },
  );
  selected.project.presentation.static.views[0].groups.push({
    id: 'other-group',
    label: 'Other',
    elements: [{ namespace: modelNamespace, id: 'other' }],
  });
  selected.project.presentation.interactive.views = [
    { id: 'condition', questions: ['condition'] },
    { id: 'followup', questions: ['followup'] },
  ];
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(
    scene.pages.map(({ id }) => id),
    ['condition', 'followup'],
  );
  assert.deepEqual(
    scene.pages.map(({ relations }) => relations.length),
    [1, 1],
  );
  assert.deepEqual(
    scene.pages.map(({ claimCards }) => claimCards.length),
    [1, 1],
  );
  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  assert.equal((html.match(/class="linked-claims"/gu) ?? []).length, 2);
  assert(html.includes('What happens after the server?'));
});

test('mixed static media rejects a forged graphic link or source dependency', async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeGroupedSelectionLayout(meaning);
  const scene = composeStaticEditionScene(meaning, layout);
  const rendered = composeStaticEditionSvg(scene);
  assert.doesNotThrow(() => validateVisibleSelection(meaning, 'static', scene, rendered.carriers));

  const forged = structuredClone(scene);
  forged.claimRelationLinks[0].relationAssertionId = 'not-selected';
  assert.throws(() => composeStaticEditionSvg(forged), {
    code: 'static_edition_claim_relation_invalid',
  });
  const malformed = structuredClone(scene);
  malformed.claimRelationLinks[0] = null;
  assert.throws(() => composeStaticEditionSvg(malformed), {
    code: 'static_edition_claim_relation_invalid',
  });

  const retargeted = structuredClone(scene);
  retargeted.edges[0].relations[0].reference = 'invented';
  retargeted.sourceAssertionCarriers[0].relationRefs[0].reference = 'invented';
  const retargetedCarriers = composeStaticEditionSvg(retargeted).carriers;
  assert.throws(() => validateVisibleSelection(meaning, 'static', retargeted, retargetedCarriers), {
    code: 'edition_visible_coverage_mismatch',
  });

  const falseDependency = structuredClone(meaning);
  falseDependency.native.selections[1].members.claims[0].dependsOn = [];
  assert.throws(
    () => validateVisibleSelection(falseDependency, 'static', scene, rendered.carriers),
    { code: 'edition_visible_coverage_mismatch' },
  );

  const svg = rendered.bytes.toString('utf8');
  const cardY = Number(/<g data-graphic-id="c-0">\s*<rect[^>]* y="([^"]+)"/u.exec(svg)?.[1]);
  const translatedY = Number(/<g transform="translate\([^ ]+ ([^)]+)\)"/u.exec(svg)?.[1]);
  assert(Number.isFinite(cardY) && Number.isFinite(translatedY));
  assert(cardY > translatedY + scene.bounds.y + scene.bounds.height + 60);
});

test('a forged Scene cannot hide a selected claim condition behind a valid carrier ID', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = structuredClone(composeStaticEditionScene(meaning, null));
  scene.claimCards[0].facts.find(({ label }) => label === 'Condition').value = 'hidden';
  const rendered = composeStaticEditionSvg(scene);
  assert.throws(() => validateVisibleSelection(meaning, 'static', scene, rendered.carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
  const interactive = structuredClone(composeInteractiveEditionScene(meaning));
  interactive.pages[0].claimCards[0].facts.find(({ label }) => label === 'Condition').value =
    'hidden';
  const projected = projectInteractivePage(interactive.pages[0], 0);
  assert.throws(
    () => validateVisibleSelection(meaning, 'interactive', interactive, [projected.carriers]),
    { code: 'edition_visible_coverage_mismatch' },
  );
});

test('malformed claimant and applicability fail before a claim Scene exists', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  for (const mutate of [
    (selection) => (selection.sourceOwner = ''),
    (selection) => (selection.members.claims[0].condition = null),
  ]) {
    const forged = structuredClone(meaning);
    mutate(forged.native.selections[0]);
    assert.throws(() => composeStaticEditionScene(forged, null), {
      code: 'edition_claim_card_invalid',
    });
  }
});

test('malformed claim carriers fail by name before either renderer emits media', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const staticScene = structuredClone(composeStaticEditionScene(meaning, null));
  staticScene.claimCards[0] = null;
  assert.throws(() => composeStaticEditionSvg(staticScene), {
    code: 'static_edition_claim_invalid',
  });
  const interactive = structuredClone(composeInteractiveEditionScene(meaning));
  interactive.pages[0].claimCards[0].facts[0] = null;
  assert.throws(() => projectInteractivePage(interactive.pages[0], 0), {
    code: 'render_interactive_claim_invalid',
  });
});

test('source-controlled claim values cannot inject HTML or SVG markup', async (t) => {
  const model = claimModel();
  model.claims.tagged.value = '</script><img src=x onerror=globalThis.__injected=true>';
  const selected = await fixture(t, { model, reference: 'claim:tagged' });
  const output = path.join(selected.root, 'candidate');
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert.doesNotMatch(html, /<img src=x|<\/script><img/u);
  assert.doesNotMatch(svg, /<img src=x/u);
  assert.match(html, /&lt;img src=x/u);
  assert.match(svg, /&lt;img src=x/u);
});

test(
  'claim media remain visible, accessible, and offline in Chrome',
  {
    skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ''),
    timeout: 35_000,
  },
  async (t) => {
    const selected = await fixture(t);
    const output = path.join(selected.root, 'candidate');
    await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
    const html = await fs.readFile(path.join(output, 'interactive/architecture.html'));
    const svg = await fs.readFile(path.join(output, 'static/architecture.svg'));
    const server = http.createServer((request, response) => {
      const isSvg = request.url === '/architecture.svg';
      if (!isSvg && request.url !== '/architecture.html') {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        'Content-Type': isSvg ? 'image/svg+xml; charset=utf-8' : 'text/html; charset=utf-8',
      });
      response.end(isSvg ? svg : html);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/*', (route) => {
      if (route.request().url().startsWith(`${origin}/`)) return route.continue();
      errors.push(`external-request:${route.request().url()}`);
      return route.abort();
    });
    await page.goto(`${origin}/architecture.html`, { waitUntil: 'load' });
    await page.evaluate(() => globalThis.document.fonts.ready);
    const claim = page.locator('.claim-stage .claim-card');
    assert.equal(await claim.count(), 1);
    assert.match(await claim.innerText(), /authorization: granted/u);
    assert.match(await claim.innerText(), /Declared product contract/u);
    assert.equal(await page.locator('canvas').count(), 0);
    await page.addScriptTag({ content: axe.source });
    const violations = () =>
      page.evaluate(async () => {
        const result = await globalThis.axe.run(globalThis.document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
        return result.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target }) => target),
        }));
      });
    assert.deepEqual(await violations(), []);
    await page.goto(`${origin}/architecture.svg`, { waitUntil: 'load' });
    assert.equal((await page.locator('[data-graphic-id="c-0"] text').count()) > 0, true);
    const collisions = await page.evaluate(() => {
      const canvas = globalThis.document.querySelector('svg').getBoundingClientRect();
      const text = [...globalThis.document.querySelectorAll('svg text')].map((element) => ({
        value: element.textContent,
        box: element.getBoundingClientRect(),
      }));
      const gaps = [];
      for (const [index, left] of text.entries()) {
        if (
          left.box.left < canvas.left - 1 ||
          left.box.right > canvas.right + 1 ||
          left.box.top < canvas.top - 1 ||
          left.box.bottom > canvas.bottom + 1
        )
          gaps.push(`outside:${left.value}`);
        for (const right of text.slice(index + 1)) {
          const width =
            Math.min(left.box.right, right.box.right) - Math.max(left.box.left, right.box.left);
          const height =
            Math.min(left.box.bottom, right.box.bottom) - Math.max(left.box.top, right.box.top);
          if (width > 1 && height > 1) gaps.push(`overlap:${left.value}:${right.value}`);
        }
      }
      return gaps;
    });
    assert.deepEqual(collisions, []);
    assert.deepEqual(errors, []);
  },
);
