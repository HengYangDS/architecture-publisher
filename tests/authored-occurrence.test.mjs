import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { composeAuthoredInteractiveArchitecture } from '../packages/publisher/src/scene/interactive/authored-architecture.mjs';
import { composeAuthoredStaticCanvas } from '../packages/publisher/src/scene/static/authored-canvas.mjs';
import {
  importClaimModel,
  resolveClaimModelSelection,
} from '../packages/publisher/src/semantics/native-claim-model.mjs';
import { composeInteractiveHtml } from '../packages/publisher/src/rendering/index.mjs';
import { claimModel } from './fixtures/claim-model.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const namespace = 'fixture/occurrences';
const semantic = (kind, id) => JSON.stringify([namespace, kind, id]);

function selectedMeaning() {
  const model = claimModel();
  const bytes = Buffer.from(JSON.stringify(model));
  const source = {
    namespace,
    format: { id: 'architecture.claim-model', version: '2' },
    sha256: sha(bytes),
    claimant: model.owner,
  };
  const imported = importClaimModel(source, bytes, 'native');
  const selections = [
    ['entity', 'client'],
    ['entity', 'server'],
    ['relation', 'request'],
    ['claim', 'intended'],
    ['claim', 'observed'],
  ].map(([kind, id]) =>
    resolveClaimModelSelection(imported, {
      id: `${kind}-${id}`,
      namespace,
      kind: 'reference',
      reference: `${kind}:${id}`,
    }),
  );
  return {
    assertions: selections.map(({ selectionId }) => ({
      id: selectionId,
      kind: 'source',
      selection: selectionId,
    })),
    native: { selections },
    editorial: { title: 'Shared source meaning' },
    media: {},
    refinement: { media: {} },
  };
}

function interactiveMeaning() {
  const meaning = selectedMeaning();
  const node = (id, entity, x) => ({
    id,
    label: entity,
    visualRole: 'backend',
    position: { x, y: 120 },
    size: { width: 140, height: 70 },
    semanticIds: [semantic('entity', entity)],
  });
  const edge = (id, from) => ({
    id,
    from,
    to: 'server',
    label: 'Source-reported request',
    visualRole: 'default',
    fromSide: 'right',
    toSide: 'left',
    route: 'auto',
    semanticIds: [semantic('relation', 'request')],
  });
  meaning.media.interactive = {
    views: [{ id: 'overview', assertionIds: meaning.assertions.map(({ id }) => id) }],
  };
  meaning.refinement.media.interactive = {
    kind: 'authored-architecture',
    pages: [
      {
        id: 'overview',
        label: 'Repeated concepts',
        purpose: 'overview',
        scene: {
          schema: 'architecture.interactive-scene/v1',
          id: 'overview',
          title: meaning.editorial.title,
          subtitle: 'Repeated concepts',
          viewport: { width: 900, height: 420 },
          nodes: [
            node('client-a', 'client', 40),
            node('client-b', 'client', 280),
            node('server', 'server', 640),
          ],
          edges: [edge('request-a', 'client-a'), edge('request-b', 'client-b')],
          groups: [],
        },
      },
    ],
  };
  return meaning;
}

function staticMeaning() {
  const meaning = selectedMeaning();
  const node = (id, entity, x) => ({
    id,
    kind: 'stage',
    tone: 'ink',
    center: { x, y: 200 },
    radius: 12,
    box: { x: x - 12, y: 188, width: 24, height: 24 },
    paintBox: { x: x - 13, y: 187, width: 26, height: 26 },
    strokeWidth: 2,
    semanticIds: [semantic('entity', entity)],
  });
  const label = (id, reference, x) => ({
    id,
    text: 'Source-bound carrier',
    fontSize: 12,
    weight: '400',
    anchor: 'start',
    tone: 'ink',
    x,
    baseline: 100,
    visible: true,
    semanticIds: [reference],
    box: { x, y: 88, width: 140, height: 12 },
  });
  const edge = (id, from, x) => ({
    id,
    kind: 'flow',
    source: from,
    target: 'server',
    points: [
      { x: x + 12, y: 200 },
      { x: 628, y: 200 },
    ],
    strokeWidth: 1.5,
    arrow: true,
    arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
    strokeTone: 'ink',
    semanticIds: [semantic('relation', 'request')],
  });
  meaning.media.static = {
    views: [{ id: 'overview', assertionIds: meaning.assertions.map(({ id }) => id) }],
  };
  meaning.refinement.media.static = {
    kind: 'authored-canvas',
    scene: {
      schema: 'architecture.authored-static-scene/v1',
      title: meaning.editorial.title,
      subtitle: 'Repeated concepts',
      width: 900,
      height: 420,
      referenceWidth: 900,
      spine: [],
      paint: { paper: '#f3f0e8', ink: '#26362f' },
      nodes: [
        node('client-a', 'client', 40),
        node('client-b', 'client', 280),
        node('server', 'server', 640),
      ],
      texts: [
        label('client-a-label', semantic('entity', 'client'), 40),
        label('client-b-label', semantic('entity', 'client'), 280),
        label('server-label', semantic('entity', 'server'), 640),
        label('request-a-label', semantic('relation', 'request'), 150),
        label('request-b-label', semantic('relation', 'request'), 430),
      ],
      edges: [edge('request-a', 'client-a', 40), edge('request-b', 'client-b', 280)],
      decorations: [],
      requiredSemanticIds: [
        semantic('entity', 'client'),
        semantic('entity', 'server'),
        semantic('relation', 'request'),
      ],
    },
  };
  return meaning;
}

test('authored interactive occurrences retain each structural and typed-claim carrier', () => {
  const page = composeAuthoredInteractiveArchitecture(interactiveMeaning()).pages[0];
  const carriers = new Map(
    page.carriers.map(({ assertionId, graphicIds }) => [assertionId, graphicIds]),
  );
  assert.deepEqual(carriers.get('entity-client'), ['client-a', 'client-b']);
  assert.deepEqual(carriers.get('claim-intended'), ['request-a', 'request-b']);
  assert.deepEqual(carriers.get('claim-observed'), ['client-a', 'client-b']);
  assert.equal(page.facts.length, 9);
  assert.equal(new Set(page.facts.map(({ reference }) => reference)).size, 5);
  for (const reference of [
    'entity:client',
    'relation:request',
    'claim:intended',
    'claim:observed',
  ]) {
    const [kind, id] = reference.split(':');
    const records = page.facts.filter((item) => item.reference === semantic(kind, id));
    assert.equal(records.length, 2);
    assert.equal(new Set(records.map(({ facts }) => JSON.stringify(facts))).size, 1);
  }
});

test('authored static occurrences retain all labels and source-bound claim anchors', () => {
  const { carriers } = composeAuthoredStaticCanvas(staticMeaning());
  assert.equal(carriers.schema, 'architecture.authored-canvas-carriers/v2');
  const assertions = new Map(
    carriers.assertions.map(({ assertionId, graphicIds }) => [assertionId, graphicIds]),
  );
  assert.deepEqual(assertions.get('entity-client'), ['text:client-a-label', 'text:client-b-label']);
  assert.deepEqual(assertions.get('claim-intended'), [
    'text:request-a-label',
    'text:request-b-label',
    'edge:request-a',
    'edge:request-b',
  ]);
  assert.deepEqual(assertions.get('claim-observed'), [
    'text:client-a-label',
    'text:client-b-label',
    'node:client-a',
    'node:client-b',
  ]);
  assert.deepEqual(new Map(carriers.nodeGraphics).get(semantic('entity', 'client')), [
    'node:client-a',
    'node:client-b',
  ]);
  assert.deepEqual(new Map(carriers.relationGraphics).get(semantic('relation', 'request')), [
    'edge:request-a',
    'edge:request-b',
  ]);
});

test('static typed Claims require structural owners even when their visible text survives', () => {
  for (const kind of ['relation', 'subject', 'context']) {
    const meaning =
      kind === 'context' ? aggregatedMeaning(staticMeaning, 'context') : staticMeaning();
    const scene = meaning.refinement.media.static.scene;
    scene.edges = [];
    if (kind === 'subject') {
      meaning.media.static.views[0].assertionIds =
        meaning.media.static.views[0].assertionIds.filter((id) => id !== 'claim-intended');
      scene.nodes = scene.nodes.filter(({ id }) => id === 'server');
    }
    assert.throws(
      () => composeAuthoredStaticCanvas(meaning),
      {
        code:
          kind === 'subject'
            ? 'authored_canvas_membership_mismatch'
            : 'authored_canvas_claim_unbound',
      },
      kind,
    );
  }
});

test('static source assertions can retain their admitted text-only representation', () => {
  const meaning = staticMeaning();
  meaning.media.static.views[0].assertionIds = meaning.media.static.views[0].assertionIds.filter(
    (id) => !id.startsWith('claim-'),
  );
  const scene = meaning.refinement.media.static.scene;
  scene.edges = [];
  const { carriers } = composeAuthoredStaticCanvas(meaning);
  assert.deepEqual(
    carriers.assertions.map(({ source }) => source.kind),
    ['entity', 'entity', 'relation'],
  );
  assert.ok(
    carriers.assertions.every(({ graphicIds }) => graphicIds.every((id) => id.startsWith('text:'))),
  );
});

test('occurrence reuse still refuses wrong direction, local duplicates and unknown members', () => {
  for (const [factory, compose, medium] of [
    [interactiveMeaning, composeAuthoredInteractiveArchitecture, 'interactive'],
    [staticMeaning, composeAuthoredStaticCanvas, 'static'],
  ]) {
    const scene = (value) =>
      medium === 'interactive'
        ? value.refinement.media.interactive.pages[0].scene
        : value.refinement.media.static.scene;
    for (const mutate of [
      (value) => scene(value).nodes[1].semanticIds.push(semantic('entity', 'unknown')),
      (value) => scene(value).nodes[1].semanticIds.push(scene(value).nodes[1].semanticIds[0]),
      (value) => (scene(value).nodes[1].id = scene(value).nodes[0].id),
      (value) => (scene(value).edges[1].id = scene(value).edges[0].id),
      (value) => scene(value).edges[1].semanticIds.push(scene(value).edges[1].semanticIds[0]),
      (value) => {
        if (medium === 'static')
          scene(value).texts[1].semanticIds.push(scene(value).texts[1].semanticIds[0]);
        else scene(value).nodes[1].semanticIds.push(scene(value).nodes[1].semanticIds[0]);
      },
      (value) => {
        const edge = scene(value).edges[1];
        const fields = medium === 'interactive' ? ['from', 'to'] : ['source', 'target'];
        [edge[fields[0]], edge[fields[1]]] = [edge[fields[1]], edge[fields[0]]];
      },
    ]) {
      const input = factory();
      mutate(input);
      assert.throws(() => compose(input));
    }
  }
});

function htmlFixture() {
  const content = Buffer.from(
    '<!DOCTYPE html><html><body><svg><g data-node-id="left"/><g data-node-id="right"/></svg></body></html>',
  );
  const fact = {
    reference: semantic('entity', 'client'),
    sourceSha256: 'f'.repeat(64),
    graphicId: 'left',
    title: 'Client',
    facts: [{ label: 'Type', value: 'component' }],
  };
  return {
    schema: 'architecture.interactive-html-composition/v1',
    title: 'Repeated concepts',
    overview: 'overview',
    build: {
      lockSha256: 'a'.repeat(64),
      editionSha256: 'b'.repeat(64),
      semanticDigest: 'c'.repeat(64),
    },
    state: {
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    },
    sources: [
      {
        id: 'source',
        kind: 'native',
        namespace,
        sha256: 'f'.repeat(64),
        claimant: 'fixture-owner',
      },
    ],
    pages: [
      {
        id: 'overview',
        label: 'Overview',
        shortLabel: 'Overview',
        purpose: 'overview',
        path: 'overview.html',
        sha256: sha(content),
        content,
        sourceIds: ['source'],
        subjectSources: { left: ['source'], right: ['source'] },
        facts: [fact, { ...structuredClone(fact), graphicId: 'right' }],
      },
    ],
  };
}

test('inspection repeats immutable facts at each graphic site without competing authority', () => {
  assert(Buffer.isBuffer(composeInteractiveHtml(htmlFixture())));
  for (const mutate of [
    (value) => (value.pages[0].facts[1].facts[0].value = 'contradictory type'),
    (value) => (value.pages[0].facts[1].title = 'Different meaning'),
    (value) => (value.pages[0].facts[1].graphicId = 'left'),
    (value) => (value.pages[0].facts[1].sourceSha256 = 'e'.repeat(64)),
  ]) {
    const input = htmlFixture();
    mutate(input);
    assert.throws(() => composeInteractiveHtml(input), {
      code: 'interactive_html_page_facts_invalid',
    });
  }
});

test('one standalone work cannot assign conflicting facts to a shared reference on different pages', () => {
  const input = htmlFixture();
  const second = structuredClone(input.pages[0]);
  second.id = 'detail';
  second.label = 'Detail';
  second.shortLabel = 'Detail';
  second.purpose = 'mechanism';
  second.path = 'detail.html';
  second.content = Buffer.from(second.content);
  input.pages.push(second);
  assert(Buffer.isBuffer(composeInteractiveHtml(input)));
  second.facts[0].facts[0].value = 'Conflicting source meaning';
  second.facts[1].facts[0].value = 'Conflicting source meaning';
  assert.throws(() => composeInteractiveHtml(input), {
    code: 'interactive_html_page_facts_invalid',
  });
});

function aggregatedMeaning(factory, mode) {
  const meaning = factory();
  const model = claimModel();
  const relation = (subject, object) => ({
    type: 'calls',
    subject,
    object,
    qualifiers: {},
    provenance: ['contract'],
  });
  model.relations['client-context'] = relation('client', 'other');
  model.relations['server-context'] = relation('server', 'server');
  model.relations.response = relation('server', 'client');
  model.claims['context-claim'] = {
    ...structuredClone(model.claims.intended),
    subject: 'other',
    object: 'other',
    condition: { role: 'aggregate-context' },
    dependsOn: [{ section: 'relations', id: 'client-context' }],
  };
  model.relations['client-context'].subject = 'other';
  const bytes = Buffer.from(JSON.stringify(model));
  const imported = importClaimModel(
    {
      namespace,
      format: { id: 'architecture.claim-model', version: '2' },
      sha256: sha(bytes),
      claimant: model.owner,
    },
    bytes,
    'native',
  );
  const selected = meaning.native.selections.map(({ target, selectionId }) => ({
    kind: target.kind,
    id: target.id,
    selectionId,
  }));
  selected.push(
    { kind: 'relation', id: 'client-context', selectionId: 'client-context' },
    { kind: 'relation', id: 'server-context', selectionId: 'server-context' },
    { kind: 'claim', id: 'context-claim', selectionId: 'context-claim' },
  );
  if (mode === 'reverse')
    selected.push({ kind: 'relation', id: 'response', selectionId: 'response' });
  meaning.native.selections = selected.map(({ kind, id, selectionId }) =>
    resolveClaimModelSelection(imported, {
      id: selectionId,
      namespace,
      kind: 'reference',
      reference: `${kind}:${id}`,
    }),
  );
  meaning.assertions = meaning.native.selections.map(({ selectionId }) => ({
    id: selectionId,
    kind: 'source',
    selection: selectionId,
  }));
  const medium = factory === interactiveMeaning ? 'interactive' : 'static';
  meaning.media[medium].views[0].assertionIds = meaning.assertions.map(({ id }) => id);
  const scene =
    medium === 'interactive'
      ? meaning.refinement.media.interactive.pages[0].scene
      : meaning.refinement.media.static.scene;
  for (const node of scene.nodes.filter(({ id }) => id.startsWith('client-')))
    node.semanticIds.push(semantic('entity', 'other'));
  for (const edge of scene.edges) {
    edge.semanticIds.push(
      semantic('relation', 'client-context'),
      semantic('relation', 'server-context'),
    );
    if (mode === 'reverse') edge.semanticIds.push(semantic('relation', 'response'));
    if (mode === 'internal-only') edge.semanticIds = [semantic('relation', 'client-context')];
  }
  if (mode === 'ambiguous')
    scene.nodes.find(({ id }) => id === 'server').semanticIds.push(semantic('entity', 'client'));
  if (medium === 'static') {
    const copyText = (id, reference) => ({
      ...structuredClone(scene.texts[0]),
      id,
      semanticIds: [reference],
    });
    scene.texts.push(
      copyText('other-label', semantic('entity', 'other')),
      copyText('client-context-label', semantic('relation', 'client-context')),
      copyText('server-context-label', semantic('relation', 'server-context')),
    );
    scene.requiredSemanticIds.push(
      semantic('entity', 'other'),
      semantic('relation', 'client-context'),
      semantic('relation', 'server-context'),
    );
    if (mode === 'reverse') {
      scene.texts.push(copyText('response-label', semantic('relation', 'response')));
      scene.requiredSemanticIds.push(semantic('relation', 'response'));
    }
  }
  return meaning;
}

test('a forward relation cannot excuse a reverse, internal-only or ambiguous aggregate', () => {
  for (const [factory, compose, code] of [
    [
      interactiveMeaning,
      composeAuthoredInteractiveArchitecture,
      'authored_interactive_semantic_mismatch',
    ],
    [staticMeaning, composeAuthoredStaticCanvas, 'authored_canvas_edge_binding_mismatch'],
  ]) {
    for (const mode of ['reverse', 'internal-only', 'ambiguous'])
      assert.throws(() => compose(aggregatedMeaning(factory, mode)), { code }, mode);
  }
});

test('legal aggregate context remains on its owning node rather than borrowing arrow direction', () => {
  const page = composeAuthoredInteractiveArchitecture(
    aggregatedMeaning(interactiveMeaning, 'context'),
  ).pages[0];
  assert.deepEqual(
    page.facts
      .filter(({ reference }) => reference === semantic('relation', 'client-context'))
      .map(({ graphicId }) => graphicId),
    ['client-a', 'client-b'],
  );
  assert.deepEqual(
    page.facts
      .filter(({ reference }) => reference === semantic('relation', 'server-context'))
      .map(({ graphicId }) => graphicId),
    ['server'],
  );
  assert.deepEqual(
    page.carriers.find(({ assertionId }) => assertionId === 'context-claim').graphicIds,
    ['client-a', 'client-b'],
  );
  const { carriers } = composeAuthoredStaticCanvas(aggregatedMeaning(staticMeaning, 'context'));
  const graphics = new Map(carriers.relationGraphics);
  assert.deepEqual(graphics.get(semantic('relation', 'client-context')), [
    'node:client-a',
    'node:client-b',
  ]);
  assert.deepEqual(graphics.get(semantic('relation', 'server-context')), ['node:server']);
  assert.deepEqual(
    carriers.assertions.find(({ assertionId }) => assertionId === 'context-claim').graphicIds,
    ['text:client-context-label', 'node:client-a', 'node:client-b'],
  );
});
