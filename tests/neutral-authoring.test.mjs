import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from '../packages/publisher/src/compiler/index.mjs';
import { assembleEditionSelection } from '../packages/publisher/src/edition/selection.mjs';
import * as scenes from '../packages/publisher/src/scene/index.mjs';
import {
  importLikeC4Layout,
  importLikeC4Native,
} from '../packages/publisher/src/semantics/index.mjs';
import { selectedNativeEdition } from './fixtures/selected-native-edition.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { composeGroupedSelectionLayout } from '../packages/publisher/src/scene/static/grouped-selection.mjs';
import { composeStaticEditionSvg } from '../packages/publisher/renderers/svg/index.mjs';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/cytoscape/index.mjs';
import {
  importClaimModel,
  resolveClaimModelSelection,
} from '../packages/publisher/src/semantics/native-claim-model.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sources = new Map([
  [
    'example/model',
    Buffer.from(
      "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b }\n",
    ),
  ],
  ['example/views', Buffer.from('views { view overview { include * } }\n')],
]);

function editionProject() {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'native-portrait',
    editor: 'portrait-editor',
    title: 'Selected architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is connected?' }],
    scope: {
      sourceNamespaces: [...sources.keys()],
      selections: [
        {
          id: 'overview',
          namespace: 'example/views',
          kind: 'reference',
          reference: 'view:overview',
          questions: ['shape'],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: 'The selected source view.' },
    presentation: {
      static: { views: [{ id: 'portrait', questions: ['shape'] }], intent: 'One overview.' },
      interactive: {
        views: [{ id: 'portrait', questions: ['shape'] }],
        intent: 'An explorable overview.',
      },
    },
    visualPolicy: { profile: 'neutral' },
  };
}

function materialized(project = editionProject()) {
  return assembleEditionSelection({
    request: {
      sources: [...sources.keys()].map((namespace, index) => ({
        id: `source-${index}`,
        namespace,
      })),
      providers: [],
      media: ['static', 'interactive'],
      toolchain: { profile: 'portable' },
    },
    edition: { content: Buffer.from(JSON.stringify(project) + '\n'), resources: [] },
    sources: [...sources].map(([namespace, content]) => ({
      namespace,
      format: { id: 'likec4/dsl', version: 'unversioned' },
      claimant: 'fixture-maintainer',
      revisionEvidence: {
        kind: 'content',
        scope: 'selected-root',
        canonicalization: 'raw-bytes/v1',
        algorithm: 'sha256',
        value: sha(content),
        verification: 'recomputed',
      },
      content,
    })),
  });
}

async function selectedInputs(project) {
  const selected = materialized(project);
  return {
    meaning: await compileEditionMeaning(selected),
    layout: await importLikeC4Layout({
      lock: selected.lock,
      readSource: selected.readSource,
      view: { namespace: 'example/views', id: 'overview' },
    }),
  };
}

test('paired media compile without mandatory presentation notes', async (t) => {
  const selected = await selectedNativeEdition(t, { width: 1800 });
  delete selected.project.presentation.static.intent;
  delete selected.project.presentation.interactive.intent;
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const output = path.join(selected.root, 'optional-intent-candidate');
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.deepEqual(built.media, ['interactive', 'static']);
  await fs.access(path.join(output, 'static/architecture.svg'));
  await fs.access(path.join(output, 'interactive/architecture.html'));
});

test('a neutral static scene carries declared source assertions without authored geometry', async () => {
  assert.equal(typeof scenes.composeStaticEditionScene, 'function');
  const { meaning, layout } = await selectedInputs();
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.equal(scene.schema, 'architecture.edition-static-scene/v1');
  assert.equal(scene.completeness, 'unqualified-scene');
  assert.equal(scene.edition.id, 'native-portrait');
  assert.equal(scene.title, 'Selected architecture');
  assert.equal(scene.summary, 'The selected source view.');
  assert.equal(scene.visualPolicy.profile, 'neutral');
  assert.equal(scene.requestedWidth, null);
  assert.deepEqual(scene.questionIds, ['shape']);
  assert.deepEqual(
    scene.nodes.map(({ id, label }) => [id, label]),
    [
      ['a', 'A'],
      ['b', 'B'],
    ],
  );
  assert.equal(scene.edges.length, 1);
  assert.equal(scene.edges[0].relations.length, 1);
  assert.match(scene.edges[0].relations[0].reference, /^relation:[1-9]\d*:[1-9]\d*$/u);
  assert.deepEqual(scene.sourceAssertionCarriers, [
    {
      assertionId: 'overview',
      kind: 'view',
      selectionId: 'overview',
      nodeRefs: [
        { namespace: 'example/model', id: 'a' },
        { namespace: 'example/model', id: 'b' },
      ],
      relationRefs: [
        {
          namespace: scene.edges[0].relations[0].namespace,
          reference: scene.edges[0].relations[0].reference,
          sha256: scene.edges[0].relations[0].sha256,
        },
      ],
    },
  ]);
  assert.equal(Object.hasOwn(scene, 'svg'), false);
  assert.equal(Object.isFrozen(scene.nodes), true);
});

test('a selected grouped view builds visible static groups through the shared geometry owner', async (t) => {
  const selected = await selectedNativeEdition(t, { media: ['static'], width: 1800 });
  selected.project.presentation.static.views[0].groups = [
    {
      id: 'entry',
      label: 'Entry boundary',
      elements: [{ namespace: 'fixture/model', id: 'alpha' }],
    },
    {
      id: 'service',
      label: 'Service boundary',
      elements: [{ namespace: 'fixture/model', id: 'beta' }],
    },
  ];
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const output = path.join(selected.root, 'grouped-candidate');
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(built.status, 'built');
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert(svg.includes('Entry boundary'));
  assert(svg.includes('Service boundary'));
  assert(!svg.includes('fixture/model'));
});

test('grouped static composition retains only asserted members of a selected upstream view', async (t) => {
  const selected = await selectedNativeEdition(t, { media: ['static'], width: 1800 });
  selected.project.scope.selections.push({
    id: 'alpha',
    namespace: 'fixture/model',
    kind: 'reference',
    reference: 'element:alpha',
    questions: ['shape'],
  });
  delete selected.project.scope.selections[0].questions;
  selected.project.presentation.static.views[0].groups = [
    {
      id: 'entry',
      label: 'Selected entry',
      elements: [{ namespace: 'fixture/model', id: 'alpha' }],
    },
  ];
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const output = path.join(selected.root, 'narrow-grouped-candidate');
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(built.status, 'built');
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert(svg.includes('Selected entry'));
  assert(svg.includes('Alpha'));
  assert(!svg.includes('Beta'));
});

test('grouped geometry does not place relation labels that the successor never renders', () => {
  const source = { namespace: 'fixture/model', sha256: 'a'.repeat(64) };
  const elements = ['alpha', 'beta'].map((id) => ({
    namespace: source.namespace,
    id,
    sha256: source.sha256,
    label: id,
  }));
  const selected = {
    selectionId: 'overview',
    format: 'likec4/dsl',
    target: { kind: 'view', id: 'overview' },
    source,
    members: {
      elements,
      relations: Array.from({ length: 3 }, (_, index) => ({
        id: `relation-${index}`,
        origin: source,
        from: { namespace: source.namespace, id: 'alpha' },
        to: { namespace: source.namespace, id: 'beta' },
        label: 'a-relation-label-that-will-not-fit',
      })),
    },
  };
  const meaning = {
    native: { selections: [selected] },
    assertions: [{ id: 'shape', kind: 'source', selection: selected.selectionId }],
    media: { static: { views: [{ id: 'overview', assertionIds: ['shape'] }] } },
    editorial: {
      presentation: {
        static: {
          views: [
            {
              id: 'overview',
              groups: ['alpha', 'beta'].map((id) => ({
                id,
                label: id,
                elements: [{ namespace: source.namespace, id }],
              })),
            },
          ],
        },
      },
    },
  };
  assert.equal(composeGroupedSelectionLayout(meaning).edges.length, 3);
});

test('grouped geometry consumes selected Claim Model relations without treating claims as edges', () => {
  const bytes = Buffer.from(JSON.stringify(claimModel()) + '\n');
  const source = {
    namespace: 'fixture/claims',
    sha256: sha(bytes),
    format: { id: 'architecture.claim-model', version: '2' },
  };
  const imported = importClaimModel(source, bytes, 'native');
  const selections = [
    { id: 'request', reference: 'relation:request' },
    { id: 'intended', reference: 'claim:intended' },
  ].map(({ id, reference }) =>
    resolveClaimModelSelection(imported, {
      id,
      namespace: source.namespace,
      kind: 'reference',
      reference,
    }),
  );
  const meaning = {
    native: { selections },
    assertions: selections.map(({ selectionId }) => ({
      id: selectionId,
      kind: 'source',
      selection: selectionId,
    })),
    media: { static: { views: [{ id: 'overview', assertionIds: ['request', 'intended'] }] } },
    editorial: {
      presentation: {
        static: {
          views: [
            {
              id: 'overview',
              groups: [
                {
                  id: 'entry',
                  label: 'Entry',
                  elements: [{ namespace: source.namespace, id: 'client' }],
                },
                {
                  id: 'service',
                  label: 'Service',
                  elements: [{ namespace: source.namespace, id: 'server' }],
                },
              ],
            },
          ],
        },
      },
    },
  };
  const layout = composeGroupedSelectionLayout(meaning);
  assert.equal(layout.closure, 'grouped-layout-unqualified');
  assert.equal(layout.nodes.length, 2);
  assert.equal(layout.edges.length, 1);
  assert.equal(layout.groups.length, 2);
  assert.equal(layout.edges[0].relations[0].reference, 'request');
  assert.equal(layout.view, null);

  const claimOnly = structuredClone(meaning);
  claimOnly.media.static.views[0].assertionIds = ['intended'];
  assert.throws(() => composeGroupedSelectionLayout(claimOnly), {
    code: 'grouped_geometry_input_invalid',
  });
});

test('a scene refuses geometry that drops one required source relation', async () => {
  const { meaning, layout } = await selectedInputs();
  const dropped = structuredClone(layout);
  dropped.edges = [];
  assert.throws(() => scenes.composeStaticEditionScene(meaning, dropped), {
    code: 'static_scene_native_membership_mismatch',
  });
});

test('a scene refuses duplicate or falsely rewired native carriers', async () => {
  const { meaning, layout } = await selectedInputs();
  const changes = [
    (value) => value.nodes.push(structuredClone(value.nodes[0])),
    (value) => value.edges.push(structuredClone(value.edges[0])),
    (value) => (value.edges[0].from.id = 'b'),
  ];
  for (const change of changes) {
    const altered = structuredClone(layout);
    change(altered);
    assert.throws(() => scenes.composeStaticEditionScene(meaning, altered), {
      code: 'static_scene_native_membership_mismatch',
    });
  }
});

test('a source element assertion does not smuggle unrelated view members into the scene', async () => {
  const authored = editionProject();
  authored.scope.selections.unshift({
    id: 'element',
    namespace: 'example/model',
    kind: 'reference',
    reference: 'element:a',
    questions: ['shape'],
  });
  delete authored.scope.selections[1].questions;
  authored.presentation.static.width = 6000;
  const { meaning, layout } = await selectedInputs(authored);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.equal(scene.requestedWidth, 6000);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ['a'],
  );
  assert.deepEqual(scene.edges, []);
  assert.deepEqual(scene.bounds, {
    x: scene.nodes[0].x,
    y: scene.nodes[0].y,
    width: scene.nodes[0].width,
    height: scene.nodes[0].height,
  });
  assert(scene.bounds.height < layout.bounds.height);
  assert.deepEqual(scene.sourceAssertionCarriers[0].nodeRefs, [
    { namespace: 'example/model', id: 'a' },
  ]);
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationRefs, []);
});

test('a relation assertion keeps its exact source locator and both visible endpoints', async () => {
  const selected = materialized();
  const index = await importLikeC4Native({ lock: selected.lock, readSource: selected.readSource });
  const origin = index.relations[0].origin;
  const reference = `relation:${origin.range.start.line + 1}:${origin.range.start.character + 1}`;
  const authored = editionProject();
  authored.scope.selections.unshift({
    id: 'relation',
    namespace: origin.namespace,
    kind: 'reference',
    reference,
    questions: ['shape'],
  });
  delete authored.scope.selections[1].questions;
  const { meaning, layout } = await selectedInputs(authored);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ['a', 'b'],
  );
  assert.equal(scene.edges.length, 1);
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationRefs, [
    { namespace: origin.namespace, reference, sha256: origin.sha256 },
  ]);
  assert.equal(scene.edges[0].relations[0].origin.namespace, origin.namespace);
});

test('a static source assertion distinguishes same-ID nodes across namespaces', async () => {
  const selected = await selectedInputs();
  const meaning = structuredClone(selected.meaning);
  const layout = structuredClone(selected.layout);
  const view = meaning.native.selections.find(({ target }) => target.kind === 'view');
  const second = view.members.elements[1];
  second.namespace = 'other/model';
  second.id = 'a';
  second.origin.namespace = 'other/model';
  view.members.relations[0].to = { namespace: 'other/model', id: 'a' };
  layout.nodes[1].namespace = 'other/model';
  layout.nodes[1].id = 'a';
  layout.edges[0].to = { namespace: 'other/model', id: 'a' };
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.sourceAssertionCarriers[0].nodeRefs, [
    { namespace: 'example/model', id: 'a' },
    { namespace: 'other/model', id: 'a' },
  ]);
  assert.deepEqual(
    scene.nodes.map(({ namespace, id }) => [namespace, id]),
    [
      ['example/model', 'a'],
      ['other/model', 'a'],
    ],
  );
});

test('editorial prose stays attributed and does not become a source node or edge', async () => {
  const authored = editionProject();
  delete authored.scope.selections[0].questions;
  authored.editorialAssertions = [
    {
      id: 'editorial-shape',
      statement: 'The overview is deliberately scoped.',
      proponent: 'portrait-editor',
      basis: ['overview'],
      questions: ['shape'],
    },
  ];
  const { meaning, layout } = await selectedInputs(authored);
  const scene = scenes.composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.nodes, []);
  assert.deepEqual(scene.edges, []);
  assert.equal(scene.bounds, null);
  assert.deepEqual(scene.sourceAssertionCarriers, []);
  assert.equal(scene.editorialAssertions[0].semanticStatus, 'editor-attributed-unverified');
  const staticSvg = composeStaticEditionSvg(scene).bytes.toString('utf8');
  const interactiveScene = scenes.composeInteractiveEditionScene(meaning);
  const interactiveHtml = (await renderInteractiveEditionHtml(interactiveScene)).bytes.toString(
    'utf8',
  );
  for (const medium of [staticSvg, interactiveHtml]) {
    assert.match(medium, /The overview is deliberately scoped\./u);
    assert.match(medium, /portrait-editor/u);
    assert.match(medium, /unverified/u);
  }
});

test('ambiguous views and unsupported visual policies fail rather than choosing a template', async () => {
  const extraView = editionProject();
  extraView.presentation.static.views.push({ id: 'second', questions: ['shape'] });
  const selected = await selectedInputs(extraView);
  assert.throws(() => scenes.composeStaticEditionScene(selected.meaning, selected.layout), {
    code: 'static_scene_composition_ambiguous',
  });
  const unknownPolicy = editionProject();
  unknownPolicy.visualPolicy.profile = 'unimplemented-art-direction';
  const other = await selectedInputs(unknownPolicy);
  assert.throws(() => scenes.composeStaticEditionScene(other.meaning, other.layout), {
    code: 'static_scene_visual_policy_unadmitted',
  });
});

test('the static scene rejects malformed ownership and source bindings', async () => {
  const { meaning, layout } = await selectedInputs();
  assert.throws(() => scenes.composeStaticEditionScene(null, layout), {
    code: 'static_scene_input_invalid',
  });
  const ambiguous = structuredClone(meaning);
  ambiguous.native.selections.push({
    ...ambiguous.native.selections[0],
    selectionId: 'second-view',
  });
  assert.throws(() => scenes.composeStaticEditionScene(ambiguous, layout), {
    code: 'static_scene_composition_ambiguous',
  });
  const wrongView = structuredClone(layout);
  wrongView.view.sha256 = '0'.repeat(64);
  assert.throws(() => scenes.composeStaticEditionScene(meaning, wrongView), {
    code: 'static_scene_native_membership_mismatch',
  });
  const invalidGeometry = structuredClone(layout);
  invalidGeometry.nodes[0].x = Number.NaN;
  assert.throws(() => scenes.composeStaticEditionScene(meaning, invalidGeometry), {
    code: 'static_scene_geometry_invalid',
  });
  const unknownAssertion = structuredClone(meaning);
  unknownAssertion.media.static.views[0].assertionIds = ['missing'];
  assert.throws(() => scenes.composeStaticEditionScene(unknownAssertion, layout), {
    code: 'static_scene_assertion_unbound',
  });
  const unavailableOverride = structuredClone(meaning);
  unavailableOverride.editorial.visualPolicy.override = 'visual.json';
  assert.throws(() => scenes.composeStaticEditionScene(unavailableOverride, layout), {
    code: 'static_scene_visual_policy_unadmitted',
  });
  const unboundSelection = structuredClone(meaning);
  unboundSelection.assertions[0].selection = 'missing';
  assert.throws(() => scenes.composeStaticEditionScene(unboundSelection, layout), {
    code: 'static_scene_assertion_unbound',
  });
  for (const target of ['element', 'relation']) {
    const unrepresented = structuredClone(meaning);
    const selected = structuredClone(unrepresented.native.selections[0]);
    selected.selectionId = 'unrepresented';
    selected.target.kind = target;
    selected.members =
      target === 'element'
        ? { elements: [{ namespace: 'example/model', id: 'missing' }], relations: [] }
        : {
            elements: selected.members.elements,
            relations: [{ ...selected.members.relations[0], id: 'relation:999:999' }],
          };
    unrepresented.native.selections.push(selected);
    unrepresented.assertions[0].selection = 'unrepresented';
    assert.throws(() => scenes.composeStaticEditionScene(unrepresented, layout), {
      code: 'static_scene_assertion_unbound',
    });
  }
});

test('an upstream aggregate cannot stand in for one selected relation', async () => {
  const { meaning, layout } = await selectedInputs();
  const scoped = structuredClone(meaning);
  const grouped = structuredClone(layout);
  const view = scoped.native.selections[0];
  const original = view.members.relations[0];
  const second = {
    ...original,
    id: 'relation:100:1',
    origin: {
      ...original.origin,
      range: {
        start: { line: 99, character: 0 },
        end: { line: 99, character: 0 },
      },
    },
  };
  view.members.relations.push(second);
  grouped.edges[0].relations.push({
    namespace: second.origin.namespace,
    reference: second.id,
    sha256: second.origin.sha256,
  });
  scoped.native.selections.push({
    ...view,
    selectionId: 'one-relation',
    target: { kind: 'relation', id: original.id },
    members: { elements: view.members.elements, relations: [original] },
  });
  scoped.assertions[0].selection = 'one-relation';
  assert.throws(() => scenes.composeStaticEditionScene(scoped, grouped), {
    code: 'static_scene_aggregate_unrepresentable',
  });
});
