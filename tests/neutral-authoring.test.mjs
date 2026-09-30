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
import {
  composeStaticSelectionLayout,
  composeSelectedStaticRefinementLayout,
  selectedStaticNativeViews,
} from '../packages/publisher/src/scene/static/selection.mjs';
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
  assert(svg.includes('READING GROUPS'));
  assert(svg.includes('Entry boundary'));
  assert(svg.includes('Service boundary'));
  assert(!svg.includes('fixture/model'));
});

test('a static group heading must reserve space above its member nodes', async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: 'entry', label: 'Entry boundary', elements: [{ namespace: 'example/model', id: 'a' }] },
    {
      id: 'service',
      label: 'Service boundary',
      elements: [{ namespace: 'example/model', id: 'b' }],
    },
  ];
  const { meaning } = await selectedInputs(project);
  const normal = scenes.composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning));
  const scene = structuredClone(normal);
  const group = scene.groups[0];
  const member = scene.nodes.find(({ id }) => id === 'a');
  const oldBottom = group.y + group.height;
  group.y = member.y - 30;
  group.height = oldBottom - group.y;
  const points = [
    ...scene.nodes.flatMap(({ x, y, width, height }) => [
      [x, y],
      [x + width, y + height],
    ]),
    ...scene.groups.flatMap(({ x, y, width, height }) => [
      [x, y],
      [x + width, y + height],
    ]),
    ...scene.edges.flatMap(({ points }) => points),
  ];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  scene.bounds = {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
  assert.throws(() => composeStaticEditionSvg(scene), {
    code: 'static_edition_group_heading_collision',
  });

  const crossing = structuredClone(normal);
  const heading = crossing.groups[0];
  crossing.edges[0].points = [
    [heading.x + 4, heading.y + 31],
    [heading.x + heading.width - 4, heading.y + 31],
  ];
  assert.throws(() => composeStaticEditionSvg(crossing), {
    code: 'static_edition_group_heading_collision',
  });

  const relocatable = structuredClone(normal);
  const movableHeading = relocatable.groups[0];
  relocatable.edges[0].points = [
    [movableHeading.x + 40, movableHeading.y + 4],
    [movableHeading.x + 40, movableHeading.y + 50],
  ];
  const relocated = composeStaticEditionSvg(relocatable).bytes.toString('utf8');
  const headingX = /<text x="([\d.]+)"[^>]*>Entry boundary<\/text>/u.exec(relocated)?.[1];
  assert(headingX);
  assert(Number(headingX) > movableHeading.x + 26);

  const captioned = structuredClone(normal);
  const captionedGroup = captioned.groups[0];
  const captionBox = { x: captionedGroup.x + 26, y: captionedGroup.y + 13, w: 100, h: 24 };
  captioned.edges[0].relations[0].kind = 'calls';
  captioned.edges[0].relations[0].label = null;
  captioned.edges[0].caption = {
    text: 'calls',
    point: [captionBox.x + 50, captionBox.y + 16],
    box: captionBox,
  };
  const withCaption = composeStaticEditionSvg(captioned).bytes.toString('utf8');
  const movedHeadingX = /<text x="([\d.]+)"[^>]*>Entry boundary<\/text>/u.exec(withCaption)?.[1];
  assert(movedHeadingX);
  assert(Number(movedHeadingX) > captionBox.x + captionBox.w + 6);
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

test('one static overview coexists with an independently selected interactive chapter', async (t) => {
  const selected = await selectedNativeEdition(t, { width: 1800 });
  const views = Buffer.from('views { view overview { include * }\n view detail { include * } }\n');
  await fs.writeFile(path.join(selected.root, 'sources/views.c4'), views);
  selected.request.sources.find(({ id }) => id === 'views').input.sha256 = sha(views);
  selected.project.questions.push({
    id: 'detail',
    audience: 'maintainer',
    text: 'What does the detailed chapter contain?',
  });
  selected.project.scope.selections.push({
    id: 'detail',
    namespace: 'fixture/views',
    kind: 'reference',
    reference: 'view:detail',
    questions: ['detail'],
  });
  selected.project.presentation.interactive.views.push({ id: 'detail', questions: ['detail'] });
  selected.project.presentation.static.views[0].groups = [
    {
      id: 'system',
      label: 'Selected system',
      elements: ['alpha', 'beta'].map((id) => ({ namespace: 'fixture/model', id })),
    },
  ];
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const requestBytes = Buffer.from(JSON.stringify(selected.request) + '\n');
  await fs.writeFile(selected.file, requestBytes);
  selected.digest = sha(requestBytes);

  const output = path.join(selected.root, 'multi-view-candidate');
  const built = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(built.status, 'built');
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert(svg.includes('Alpha'));
  assert(svg.includes('Beta'));
  await fs.access(path.join(output, 'interactive/architecture.html'));

  selected.project.scope.selections[1].questions.push('shape');
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const ambiguousOutput = path.join(selected.root, 'ambiguous-static-candidate');
  await assert.rejects(
    compileEditionCandidateInput(selected.file, selected.digest, ambiguousOutput),
    { code: 'grouped_selection_layout_unadmitted' },
  );
  await assert.rejects(fs.access(ambiguousOutput), { code: 'ENOENT' });

  selected.project.scope.selections[1].questions = ['detail'];
  delete selected.project.presentation.static.views[0].groups;
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project) + '\n',
  );
  const upstreamOutput = path.join(selected.root, 'upstream-static-candidate');
  const upstream = await compileEditionCandidateInput(
    selected.file,
    selected.digest,
    upstreamOutput,
  );
  assert.equal(upstream.status, 'built');
  const upstreamSvg = await fs.readFile(
    path.join(upstreamOutput, 'static/architecture.svg'),
    'utf8',
  );
  assert(upstreamSvg.includes('Alpha'));
  assert(upstreamSvg.includes('Beta'));
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
              groups: [
                {
                  id: 'pair',
                  label: 'Pair',
                  elements: ['alpha', 'beta'].map((id) => ({ namespace: source.namespace, id })),
                },
              ],
            },
          ],
        },
      },
    },
  };
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(layout.edges.length, 3);
  const alpha = layout.nodes.find(({ id }) => id === 'alpha');
  const beta = layout.nodes.find(({ id }) => id === 'beta');
  for (const edge of layout.edges) {
    assert.equal(edge.points[0][0], alpha.x + alpha.width);
    assert.equal(edge.points.at(-1)[0], beta.x);
  }

  const reverse = structuredClone(meaning);
  reverse.native.selections[0].members.relations = [
    {
      ...reverse.native.selections[0].members.relations[0],
      id: 'relation-reverse',
      from: { namespace: source.namespace, id: 'beta' },
      to: { namespace: source.namespace, id: 'alpha' },
    },
  ];
  const lateral = composeStaticSelectionLayout(reverse);
  const reverseBeta = lateral.nodes.find(({ id }) => id === 'beta');
  const reverseAlpha = lateral.nodes.find(({ id }) => id === 'alpha');
  assert.equal(lateral.edges[0].points[0][0], reverseBeta.x);
  assert.equal(lateral.edges[0].points.at(-1)[0], reverseAlpha.x + reverseAlpha.width);

  reverse.editorial.presentation.static.views[0].groups = ['alpha', 'beta'].map((id) => ({
    id,
    label: id,
    elements: [{ namespace: source.namespace, id }],
  }));
  const vertical = composeStaticSelectionLayout(reverse);
  const lower = vertical.nodes.find(({ id }) => id === 'beta');
  const upper = vertical.nodes.find(({ id }) => id === 'alpha');
  assert.equal(vertical.edges[0].points[0][1], lower.y);
  assert.equal(vertical.edges[0].points.at(-1)[1], upper.y + upper.height);

  const self = structuredClone(meaning);
  self.native.selections[0].members.relations = [
    {
      ...self.native.selections[0].members.relations[0],
      id: 'relation-self',
      to: { namespace: source.namespace, id: 'alpha' },
    },
  ];
  assert.throws(() => composeStaticSelectionLayout(self), {
    code: 'grouped_selection_self_relation_unrepresentable',
  });
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
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(layout.closure, 'grouped-layout-unqualified');
  assert.equal(layout.nodes.length, 2);
  assert.equal(layout.edges.length, 1);
  assert.equal(layout.groups.length, 2);
  assert.equal(layout.edges[0].relations[0].reference, 'request');
  assert.equal(layout.view, null);

  const claimOnly = structuredClone(meaning);
  claimOnly.media.static.views[0].assertionIds = ['intended'];
  assert.throws(() => composeStaticSelectionLayout(claimOnly), {
    code: 'grouped_geometry_input_invalid',
  });
});

test('static grouping refuses missing, duplicated, or contradictory source authority', async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: 'entry', label: 'Entry', elements: [{ namespace: 'example/model', id: 'a' }] },
    { id: 'service', label: 'Service', elements: [{ namespace: 'example/model', id: 'b' }] },
  ];
  const { meaning } = await selectedInputs(project);
  assert.equal(composeStaticSelectionLayout(meaning).nodes.length, 2);
  const ungrouped = structuredClone(meaning);
  delete ungrouped.editorial.presentation.static.views[0].groups;
  assert.throws(() => composeStaticSelectionLayout(ungrouped), {
    code: 'static_selection_flat_unadmitted',
  });
  for (const mutate of [
    (value) => (value.media.static.views[0].id = 'not-authored'),
    (value) => (value.media.static.views[0].assertionIds = ['not-selected']),
    (value) => value.assertions.push(structuredClone(value.assertions[0])),
    (value) => value.native.selections.push(structuredClone(value.native.selections[0])),
    (value) => (value.native.selections[0].format = 'not-admitted'),
    (value) => (value.native.selections[0].members.elements = null),
  ]) {
    const invalid = structuredClone(meaning);
    mutate(invalid);
    assert.throws(() => composeStaticSelectionLayout(invalid), {
      code: 'grouped_selection_layout_unadmitted',
    });
  }
  const conflicting = structuredClone(meaning);
  const second = structuredClone(conflicting.native.selections[0]);
  second.selectionId = 'contradictory-view';
  second.members.elements[0].label = 'Not the selected label';
  conflicting.native.selections.push(second);
  conflicting.assertions.push({
    id: 'contradiction',
    kind: 'source',
    selection: second.selectionId,
  });
  conflicting.media.static.views[0].assertionIds.push('contradiction');
  assert.throws(() => composeStaticSelectionLayout(conflicting), {
    code: 'grouped_selection_semantic_conflict',
  });
});

test('source-attributed sibling views resolve only a uniquely selected static view', () => {
  const views = [
    { target: { kind: 'view' }, selectionId: 'left' },
    { target: { kind: 'view' }, selectionId: 'right' },
  ];
  const meaning = {
    native: { selections: views },
    assertions: [
      { id: 'left-claim', kind: 'source', selection: 'left' },
      { id: 'right-claim', kind: 'source', selection: 'right' },
    ],
  };
  assert.deepEqual(selectedStaticNativeViews(meaning, { assertionIds: ['left-claim'] }), [
    views[0],
  ]);
  assert.deepEqual(selectedStaticNativeViews(meaning, { assertionIds: [] }), views);
  assert.deepEqual(
    selectedStaticNativeViews(
      { ...meaning, assertions: meaning.assertions.slice(0, 1) },
      { assertionIds: ['left-claim'] },
    ),
    views,
  );
});

test('authored static refinement cannot reassign selected geometry or relation provenance', async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: 'entry', label: 'Entry', elements: [{ namespace: 'example/model', id: 'a' }] },
    { id: 'service', label: 'Service', elements: [{ namespace: 'example/model', id: 'b' }] },
  ];
  const { meaning } = await selectedInputs(project);
  const selected = composeStaticSelectionLayout(meaning);
  const refinement = {
    media: {
      static: {
        view: meaning.media.static.views[0].id,
        nodes: structuredClone(selected.nodes),
        groups: structuredClone(selected.groups),
        edges: structuredClone(selected.edges),
      },
    },
  };
  assert.equal(composeSelectedStaticRefinementLayout(meaning, refinement).nodes.length, 2);
  const wrongView = structuredClone(refinement);
  wrongView.media.static.view = 'unselected';
  assert.throws(() => composeSelectedStaticRefinementLayout(meaning, wrongView), {
    code: 'scene_refinement_composition_unadmitted',
  });
  for (const mutate of [
    (value) => value.media.static.nodes.pop(),
    (value) => (value.media.static.nodes[1] = structuredClone(value.media.static.nodes[0])),
    (value) => value.media.static.groups.pop(),
    (value) => (value.media.static.groups[1] = structuredClone(value.media.static.groups[0])),
    (value) => (value.media.static.edges[0].relations = null),
    (value) => (value.media.static.edges[0].points = null),
    (value) => (value.media.static.edges[0].from.id = 'b'),
    (value) => (value.media.static.edges[0].relations[0].reference = 'unselected'),
    (value) => value.media.static.edges.push(structuredClone(value.media.static.edges[0])),
  ]) {
    const invalid = structuredClone(refinement);
    mutate(invalid);
    assert.throws(() => composeSelectedStaticRefinementLayout(meaning, invalid), {
      code: 'scene_refinement_membership_mismatch',
    });
  }
});

test('static Scene composition rejects group geometry that contradicts authored membership', async () => {
  const project = editionProject();
  project.presentation.static.views[0].groups = [
    { id: 'entry', label: 'Entry', elements: [{ namespace: 'example/model', id: 'a' }] },
    { id: 'service', label: 'Service', elements: [{ namespace: 'example/model', id: 'b' }] },
  ];
  const { meaning } = await selectedInputs(project);
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(scenes.composeStaticEditionScene(meaning, layout).groups.length, 2);

  const wrongClosure = structuredClone(layout);
  wrongClosure.closure = 'upstream-layout-unqualified';
  assert.throws(() => scenes.composeStaticEditionScene(meaning, wrongClosure), {
    code: 'static_scene_input_invalid',
  });
  const relabeled = structuredClone(layout);
  relabeled.groups[0].label = 'Not authored';
  assert.throws(() => scenes.composeStaticEditionScene(meaning, relabeled), {
    code: 'static_scene_group_mismatch',
  });
  const displaced = structuredClone(layout);
  displaced.groups[0].x += 1_000;
  assert.throws(() => scenes.composeStaticEditionScene(meaning, displaced), {
    code: 'static_scene_group_mismatch',
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
