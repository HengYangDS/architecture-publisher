import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from '../packages/publisher/src/compiler/index.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/index.mjs';
import { compileNativeSelectionDelta } from '../packages/publisher/src/semantics/change.mjs';
import {
  composeInteractiveEditionScene,
  composeStaticEditionScene,
} from '../packages/publisher/src/scene/index.mjs';
import { canonical } from '../packages/publisher/src/source/json.mjs';
import { claimModel } from './fixtures/claim-model.mjs';

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
        { id: 'selected-claim', namespace: modelNamespace, kind: 'reference', reference },
      ],
      limits: [],
    },
    requiredAssertions: [
      { id: 'condition', kind: 'source', selection: 'selected-claim', questions: ['condition'] },
    ],
    omissions: [],
    transformations: [],
    narrative: {
      summary: 'Keep the authorization condition visible.',
      readingOrder: ['condition'],
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

test('typed claims cannot borrow the LikeC4-only evolution comparator', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const side = { lock: input.lock, native: meaning.native };
  assert.throws(() => compileNativeSelectionDelta(side, side), {
    code: 'native_claim_model_evolution_unadmitted',
  });
});

test('a typed claim never becomes a complete Candidate through graph-only media', async (t) => {
  const selected = await fixture(t);
  const output = path.join(selected.root, 'candidate');
  await assert.rejects(
    compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output),
    { code: 'edition_media_claim_model_unadmitted' },
  );
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});

test('public Scene composers refuse to erase typed claims into graph-only carriers', async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  assert.throws(() => composeInteractiveEditionScene(meaning), {
    code: 'edition_scene_claim_model_unadmitted',
  });
  assert.throws(
    () =>
      composeStaticEditionScene(meaning, {
        closure: 'upstream-layout-unqualified',
        nodes: [],
        edges: [],
      }),
    { code: 'edition_scene_claim_model_unadmitted' },
  );
});
