import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
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
  await assert.rejects(
    compileEditionMeaning(
      await materializeBuildRequestInput(missing.requestPath, missing.requestSha256),
    ),
    { code: 'native_claim_model_reference_unselected' },
  );
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
  assert.deepEqual(candidate.input.semanticSupplies, []);
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
  assert.deepEqual(candidate.input.semanticSupplies, []);
  assert.deepEqual(Object.keys(candidate.media).sort(), ['interactive', 'static']);
  assert.deepEqual(
    candidate.media.interactive.supplies.map(({ id }) => id),
    ['font-supply'],
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
  assert(painted.includes('Claim validity: affirmed'));
  assert(painted.includes('Declared dependency coverage: complete'));
  assert.match(reading, /<dt>Selected claimant<\/dt><dd>fixture-maintainer<\/dd>/u);
  assert.match(reading, /<dt>Declared model owner<\/dt><dd>example:system<\/dd>/u);
  assert.match(reading, /<dt>Claim plane<\/dt><dd>intended<\/dd>/u);
  assert.match(reading, /<dt>Claim validity<\/dt><dd>affirmed<\/dd>/u);
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

test('unsupported Claim Model entity and relation media remain fail-closed', async (t) => {
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
  assert.equal(scene.edges[0].relations[0].label, 'phase: selected · z: tail · ä: accent');
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
  assert.match(painted, /client → server/u);
  assert.match(painted, /Claim plane: intended/u);
  assert.match(painted, /authorization: granted/u);
  assert(!svg.includes('fixture/claims'), 'private source identity leaked into static SVG');
  assert.equal(selected.project.requiredAssertions, undefined);
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
  assert.equal((claims.match(/<dt>Claim validity<\/dt>/gu) ?? []).length, 1);
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
  'claim media remain visible, responsive, accessible, and offline in Chrome',
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
    await page.setViewportSize({ width: 390, height: 844 });
    assert.deepEqual(await violations(), []);
    assert.equal(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
      ),
      true,
    );
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
