import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { composeAuthoredInteractiveArchitecture } from '../packages/publisher/src/scene/interactive/authored-architecture.mjs';
import { composeAuthoredStaticCanvas } from '../packages/publisher/src/scene/static/authored-canvas.mjs';
import {
  importClaimModel,
  resolveClaimModelSelection,
} from '../packages/publisher/src/semantics/native-claim-model.mjs';
import { parseSelectedSceneRefinement } from '../packages/publisher/src/edition/refinement.mjs';
import { renderArchitectureScene } from '../packages/publisher/renderers/archify/index.mjs';
import { composeInteractiveHtml } from '../packages/publisher/src/rendering/interactive-html.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { chromium } from 'playwright-core';
import { browserLifetime } from './fixtures/browser-lifetime.mjs';
import { assertGlyphPaintBounds, observeGlyphPaintEnvelope } from './fixtures/font-paint.mjs';
import { embedFonts } from '../packages/publisher/src/compiler/media.mjs';
import { rasterizeBytes } from '../packages/publisher/renderers/resvg/public.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const namespace = 'fixture/statements';
const editionId = 'fixture-reading';
const semantic = (kind, id) => JSON.stringify([namespace, kind, id]);
const editorial = (id) => JSON.stringify([editionId, 'editorial', id]);

function text(id, reference, value, baseline = 100) {
  return {
    id,
    text: value,
    fontSize: 14,
    weight: '400',
    anchor: 'start',
    tone: 'ink',
    x: 40,
    baseline,
    visible: true,
    semanticIds: [reference],
    box: { x: 40, y: baseline - 14, width: 360, height: 14 },
  };
}

function meaningFor(medium, { typed = false, editor = false, anchored = false } = {}) {
  const model = claimModel();
  model.claims.published.dependsOn = anchored ? [{ section: 'entities', id: 'client' }] : [];
  model.claims['second-statement'] = {
    ...structuredClone(model.claims.published),
    value: { text: 'The client preserves the selected intent.' },
  };
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
  const targets = typed
    ? [
        ['entity', 'client'],
        ['entity', 'server'],
        ['relation', 'request'],
        ['claim', 'intended'],
        ['claim', 'observed'],
      ]
    : [
        ...(anchored ? [['entity', 'client']] : []),
        ['claim', 'published'],
        ['claim', 'second-statement'],
      ];
  const selections = targets.map(([kind, id]) =>
    resolveClaimModelSelection(imported, {
      id: `${kind}-${id}`,
      namespace,
      kind: 'reference',
      reference: `${kind}:${id}`,
    }),
  );
  const assertions = selections.map(({ selectionId }) => ({
    id: selectionId,
    kind: 'source',
    selection: selectionId,
    questions: ['shape'],
  }));
  if (editor)
    assertions.push({
      id: 'editor-decision',
      kind: 'editorial',
      statement: 'This reading separates source intent from editorial judgment.',
      proponent: 'fixture-editor',
      basis: [typed ? 'claim-intended' : 'claim-published'],
      questions: ['shape'],
    });
  const meaning = {
    edition: {
      id: editionId,
      editor: 'fixture-editor',
      sha256: sha(Buffer.from('selected-edition')),
    },
    assertions,
    native: { selections },
    editorial: {
      title: 'Explicit statements',
      visualPolicy: { figureTypes: { component: 'lucide:box', aggregate: 'lucide:layers' } },
    },
    questions: [{ id: 'shape', text: 'What is asserted?' }],
    media: {
      [medium]: { views: [{ id: 'overview', assertionIds: assertions.map(({ id }) => id) }] },
    },
    refinement: { media: {} },
  };
  const required = targets.map(([kind, id]) => semantic(kind, id));
  const texts = targets.map(([kind, id], index) =>
    text(`text-${kind}-${id}`, semantic(kind, id), `Selected ${kind}: ${id}`, 80 + index * 35),
  );
  if (editor) {
    required.push(editorial('editor-decision'));
    texts.push(text('editor-text', editorial('editor-decision'), assertions.at(-1).statement, 300));
  }
  if (medium === 'static') {
    const node = (id, x) => ({
      id,
      kind: 'stage',
      tone: 'ink',
      center: { x, y: 340 },
      radius: 12,
      box: { x: x - 12, y: 328, width: 24, height: 24 },
      paintBox: { x: x - 13, y: 327, width: 26, height: 26 },
      strokeWidth: 2,
      semanticIds: [semantic('entity', id)],
    });
    meaning.refinement.media.static = {
      kind: 'authored-canvas',
      scene: {
        schema: 'architecture.authored-static-scene/v1',
        title: meaning.editorial.title,
        subtitle: 'Source and editorial statements',
        width: 900,
        height: 460,
        referenceWidth: 900,
        spine: [],
        paint: { paper: '#f3f0e8', ink: '#26362f' },
        nodes: typed
          ? [node('client', 100), node('server', 600)]
          : anchored
            ? [node('client', 100)]
            : [],
        texts,
        edges: typed
          ? [
              {
                id: 'request',
                kind: 'flow',
                source: 'client',
                target: 'server',
                points: [
                  { x: 112, y: 340 },
                  { x: 588, y: 340 },
                ],
                strokeWidth: 1.5,
                arrow: true,
                arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
                strokeTone: 'ink',
                semanticIds: [semantic('relation', 'request')],
              },
            ]
          : [],
        decorations: [],
        requiredSemanticIds: required,
      },
    };
  } else {
    const node = (id, x) => ({
      id,
      label: id,
      visualRole: 'backend',
      position: { x, y: 330 },
      size: { width: 140, height: 70 },
      semanticIds: [semantic('entity', id)],
    });
    meaning.refinement.media.interactive = {
      kind: 'authored-architecture',
      pages: [
        {
          id: 'overview',
          label: 'Source and editorial statements',
          purpose: 'overview',
          scene: {
            schema: 'architecture.interactive-scene/v1',
            id: 'overview',
            title: meaning.editorial.title,
            subtitle: 'Source and editorial statements',
            viewport: { width: 900, height: 460 },
            nodes: typed
              ? [node('client', 60), node('server', 600)]
              : anchored
                ? [node('client', 60)]
                : [],
            groups: [],
            edges: typed
              ? [
                  {
                    id: 'request',
                    from: 'client',
                    to: 'server',
                    label: 'Source-reported request',
                    visualRole: 'default',
                    fromSide: 'right',
                    toSide: 'left',
                    route: 'auto',
                    semanticIds: [semantic('relation', 'request')],
                  },
                ]
              : [],
            texts,
            requiredSemanticIds: required,
          },
        },
      ],
    };
  }
  return meaning;
}

const sceneFor = (meaning, medium) =>
  medium === 'static'
    ? meaning.refinement.media.static.scene
    : meaning.refinement.media.interactive.pages[0].scene;
const compose = (meaning, medium) =>
  medium === 'static'
    ? composeAuthoredStaticCanvas(meaning)
    : composeAuthoredInteractiveArchitecture(meaning);
const carriersFor = (result, medium) =>
  medium === 'static' ? result.carriers.assertions : result.pages[0].carriers;

for (const medium of ['static', 'interactive']) {
  test(`${medium} rejects conflicting repeated facts and malformed statement authority`, () => {
    for (const mutate of [
      (meaning) => {
        meaning.edition.sha256 = 'invalid';
      },
      (meaning) => {
        meaning.assertions.at(-1).proponent = '';
      },
      (meaning) => {
        meaning.assertions.at(-1).basis = ['unselected'];
      },
      (meaning) => {
        meaning.assertions.at(-1).questions = [];
      },
      (meaning) => {
        meaning.assertions.at(-1).kind = 'another-authority';
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(semantic('claim', 'unselected'));
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(
          JSON.stringify(['another-edition', 'editorial', 'editor-decision']),
        );
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(semantic('entity', 'unselected'));
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push(
          sceneFor(meaning, medium).requiredSemanticIds[0],
        );
      },
      (meaning) => {
        sceneFor(meaning, medium).requiredSemanticIds.push('not-json');
      },
      (meaning) => {
        const repeated = structuredClone(meaning.native.selections[0]);
        repeated.selectionId = 'contradictory-repeat';
        repeated.members.claims[0].value = { text: 'Contradictory preserved facts.' };
        meaning.native.selections.push(repeated);
        meaning.assertions.push({
          id: 'contradictory-repeat',
          kind: 'source',
          selection: repeated.selectionId,
        });
        meaning.media[medium].views[0].assertionIds.push('contradictory-repeat');
      },
    ]) {
      const meaning = meaningFor(medium, { editor: true });
      mutate(meaning);
      assert.throws(() => compose(meaning, medium));
    }
  });

  test(`${medium} preserves two original opaque statements without fabricated document anchors`, () => {
    const meaning = meaningFor(medium);
    const before = JSON.stringify(meaning.native.selections);
    const result = compose(meaning, medium);
    const carriers = carriersFor(result, medium);
    assert.equal(sceneFor(meaning, medium).nodes.length, 0);
    assert.equal(carriers.length, 2);
    assert.deepEqual(
      carriers.map(({ representation }) => representation),
      ['source-statement', 'source-statement'],
    );
    assert.deepEqual(
      carriers.map(({ graphicIds }) => graphicIds),
      [
        ['text: text-claim-published'.replace('text: ', medium === 'static' ? 'text:' : '')],
        ['text: text-claim-second-statement'.replace('text: ', medium === 'static' ? 'text:' : '')],
      ],
    );
    assert.equal(JSON.stringify(meaning.native.selections), before);
    assert(result.limits.includes('authored-statement-wording-unverified'));
    if (medium === 'interactive') {
      const facts = result.pages[0].facts;
      assert.deepEqual(
        facts.map(({ reference }) => reference),
        [semantic('claim', 'published'), semantic('claim', 'second-statement')],
      );
      assert(
        facts[0].facts.some(
          ({ label, value }) => label === 'Declared dependency coverage' && value === 'unknown',
        ),
      );
      assert(
        facts[0].facts.some(({ label, value }) => label === 'Value' && value.includes('available')),
      );
    }
  });

  test(`${medium} refuses missing, substituted, hidden and undeclared direct Claim text`, () => {
    for (const mutate of [
      (scene) => scene.texts.splice(0, 1),
      (scene) => {
        scene.texts[0].semanticIds = [semantic('claim', 'second-statement')];
      },
      (scene) => {
        scene.texts[0].visible = false;
      },
      (scene) => {
        scene.texts[0].text = ' ';
      },
      (scene) => {
        scene.requiredSemanticIds = scene.requiredSemanticIds.slice(1);
      },
      (scene) => {
        scene.texts.splice(0, 1);
        scene.requiredSemanticIds = scene.requiredSemanticIds.slice(1);
      },
    ]) {
      const meaning = meaningFor(medium);
      mutate(sceneFor(meaning, medium));
      assert.throws(() => compose(meaning, medium));
    }
  });

  test(`${medium} direct typed statements retain relation and subject structural carriers`, () => {
    const result = compose(meaningFor(medium, { typed: true }), medium);
    const carriers = new Map(carriersFor(result, medium).map((item) => [item.assertionId, item]));
    assert.deepEqual(
      carriers.get('claim-intended').graphicIds,
      medium === 'static'
        ? ['text:text-claim-intended', 'edge:request']
        : ['text-claim-intended', 'request'],
    );
    assert.deepEqual(
      carriers.get('claim-observed').graphicIds,
      medium === 'static'
        ? ['text:text-claim-observed', 'node:client']
        : ['text-claim-observed', 'client'],
    );
    const missing = meaningFor(medium, { typed: true });
    sceneFor(missing, medium).edges = [];
    assert.throws(() => compose(missing, medium));
    const noText = meaningFor(medium, { typed: true });
    sceneFor(noText, medium).texts = sceneFor(noText, medium).texts.filter(
      ({ id }) => id !== 'text-claim-intended',
    );
    assert.throws(() => compose(noText, medium), { code: 'authored_statement_unbound' });
  });

  test(`${medium} cannot put a Claim identity on an entity node or relation edge`, () => {
    for (const member of ['nodes', 'edges']) {
      const meaning = meaningFor(medium, { typed: true });
      sceneFor(meaning, medium)[member][0].semanticIds.push(semantic('claim', 'intended'));
      assert.throws(() => compose(meaning, medium));
    }
  });

  test(`${medium} each direct statement owns a witness while shared extra context remains admitted`, () => {
    const missingOwnText = meaningFor(medium);
    const scene = sceneFor(missingOwnText, medium);
    scene.texts[0].semanticIds.push(semantic('claim', 'second-statement'));
    scene.texts.splice(1, 1);
    assert.throws(() => compose(missingOwnText, medium), { code: 'authored_statement_unbound' });
    const withOwnText = meaningFor(medium);
    const complete = sceneFor(withOwnText, medium);
    const context = structuredClone(complete.texts[0]);
    context.id = 'shared-statement-context';
    context.baseline = 260;
    context.semanticIds.push(semantic('claim', 'second-statement'));
    complete.texts.push(context);
    assert.doesNotThrow(() => compose(withOwnText, medium));
  });

  test(`${medium} preserves already admitted v1 structural aggregate statement meaning`, () => {
    const meaning = meaningFor(medium, { anchored: true });
    const scene = sceneFor(meaning, medium);
    scene.texts = scene.texts.filter(
      ({ semanticIds }) => !semanticIds.some((id) => JSON.parse(id)[1] === 'claim'),
    );
    scene.requiredSemanticIds = [semantic('entity', 'client')];
    if (medium === 'interactive') {
      delete scene.texts;
      delete scene.requiredSemanticIds;
    }
    const result = compose(meaning, medium);
    const carriers = carriersFor(result, medium);
    assert.equal(carriers.length, 3);
    if (medium === 'static')
      assert(
        carriers.every(({ representation }) => representation === 'source-anchored-aggregate'),
      );
  });

  test(`${medium} binds editorial statement text to its selected Edition, not a source namespace`, () => {
    const meaning = meaningFor(medium, { editor: true });
    const result = compose(meaning, medium);
    const carrier = carriersFor(result, medium).find(
      ({ assertionId }) => assertionId === 'editor-decision',
    );
    assert.equal(carrier.representation, 'editorial-statement');
    assert.deepEqual(carrier.graphicIds, [
      medium === 'static' ? 'text:editor-text' : 'editor-text',
    ]);
    assert.equal(carrier.edition.sha256, meaning.edition.sha256);
    const missing = meaningFor(medium, { editor: true });
    sceneFor(missing, medium).texts = sceneFor(missing, medium).texts.filter(
      ({ id }) => id !== 'editor-text',
    );
    assert.throws(() => compose(missing, medium), { code: 'authored_statement_unbound' });
    const substituted = meaningFor(medium, { editor: true });
    sceneFor(substituted, medium).texts.at(-1).semanticIds = [
      JSON.stringify([namespace, 'editorial', 'editor-decision']),
    ];
    assert.throws(() => compose(substituted, medium));
    if (medium === 'interactive') {
      const fact = result.pages[0].facts.find(
        ({ reference }) => reference === editorial('editor-decision'),
      );
      assert.equal(fact.editionSha256, meaning.edition.sha256);
      assert.equal(Object.hasOwn(fact, 'sourceSha256'), false);
      assert(
        fact.facts.some(({ label, value }) => label === 'Proponent' && value === 'fixture-editor'),
      );
    }
  });
}

test('one existing refinement schema admits both independent bounded text collections', () => {
  const refinement = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: meaningFor('static').refinement.media.static,
      interactive: meaningFor('interactive').refinement.media.interactive,
    },
  };
  const bytes = Buffer.from(JSON.stringify(refinement));
  const parsed = parseSelectedSceneRefinement(bytes, ['static', 'interactive'], sha(bytes));
  assert.equal(parsed.media.static.scene.texts.length, 2);
  assert.equal(parsed.media.interactive.pages[0].scene.texts.length, 2);
});

test('the installed Archify adapter actually paints source statements without hidden source nodes', async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-statements-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const meaning = meaningFor('interactive');
  const scene = sceneFor(meaning, 'interactive');
  scene.texts[0].text = "A <statement> & literal $$ $& $' $`";
  const supply = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(supply, scene.texts);
  for (const label of scene.texts) label.box = measurer.box(label);
  const output = path.join(root, 'architecture.html');
  const rendered = await renderArchitectureScene({ scene, output });
  assert.equal(rendered.status, 'rendered');
  const html = await fs.readFile(output, 'utf8');
  assert.match(html, /data-text-id="text-claim-published"/u);
  assert(
    html.includes("A &lt;statement&gt; &amp; literal $$ $&amp; $' $`"),
    'Exact dollar text survives painting',
  );
  for (const { weight, bytes } of supply.fonts.filter(({ weight }) => [400, 600].includes(weight)))
    assert(
      html.includes(
        `font-weight:${weight};font-display:block;src:url(data:font/ttf;base64,${bytes.toString('base64')})`,
      ),
      `Selected ${weight} face is embedded`,
    );
  assert.equal(/<g\b[^>]*\bdata-node-id=/u.test(html), false, 'No source node was invented');
});

test('the interactive text renderer rejects projected unreadability and measured collisions', async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-text-errors-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const supply = await loadBundledFonts();
  for (const [id, change] of [
    [
      'too-wide',
      (scene) => {
        scene.viewport.width = 3000;
        scene.texts.forEach((text) => {
          text.fontSize = 10;
        });
      },
    ],
    [
      'text-collision',
      (scene) => {
        scene.texts[1].baseline = scene.texts[0].baseline;
      },
    ],
    [
      'nonsemantic-text-collision',
      (scene) => {
        scene.texts[1].baseline = scene.texts[0].baseline;
        scene.texts[1].semanticIds = [];
      },
    ],
    [
      'unsupported-tone',
      (scene) => {
        scene.texts[0].tone = 'not-a-palette-role';
      },
    ],
  ]) {
    const scene = sceneFor(meaningFor('interactive'), 'interactive');
    change(scene);
    const measurer = await createBundledTextMeasurer(supply, scene.texts);
    for (const label of scene.texts) label.box = measurer.box(label);
    const output = path.join(root, `${id}.html`);
    await assert.rejects(renderArchitectureScene({ scene, output }));
    await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  }
});

test('standalone inspection binds statement sites to selected source and editorial identities separately', () => {
  const meaning = meaningFor('interactive', { editor: true });
  const page = composeAuthoredInteractiveArchitecture(meaning).pages[0];
  const content = Buffer.from(
    `<html><body><svg>${page.scene.texts
      .map(({ id, text }) => `<text data-text-id="${id}" data-text-label="${text}">${text}</text>`)
      .join('')}</svg></body></html>`,
  );
  const source = meaning.native.selections[0].source;
  const input = {
    schema: 'architecture.interactive-html-composition/v2',
    title: meaning.editorial.title,
    framing: 'Source assertions and editorial judgment remain distinct.',
    build: {
      lockSha256: '1'.repeat(64),
      editionSha256: meaning.edition.sha256,
      semanticDigest: '2'.repeat(64),
    },
    editionId: meaning.edition.id,
    overview: 'overview',
    sources: [
      {
        id: 'selected-source',
        kind: 'native',
        namespace,
        sha256: source.sha256,
        claimant: source.claimant,
      },
    ],
    pages: [
      {
        id: 'overview',
        label: page.label,
        shortLabel: 'Statements',
        purpose: 'overview',
        path: 'views/overview.html',
        sha256: sha(content),
        sourceIds: ['selected-source'],
        subjectSources: Object.fromEntries(
          Object.entries(page.subjectNamespaces).map(([id, namespaces]) => [
            id,
            namespaces.length ? ['selected-source'] : [],
          ]),
        ),
        content,
        facts: page.facts,
      },
    ],
    state: {
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    },
  };
  const output = composeInteractiveHtml(input).toString('utf8');
  assert(output.includes('data-text-id'));
  assert(output.includes('editionSha256'));
  for (const mutate of [
    (value) => {
      value.pages[0].facts.at(-1).editionSha256 = '0'.repeat(64);
    },
    (value) => {
      value.pages[0].facts.at(-1).reference = JSON.stringify([
        'another-edition',
        'editorial',
        'editor-decision',
      ]);
    },
    (value) => {
      value.pages[0].facts.at(-1).sourceSha256 = source.sha256;
    },
  ]) {
    const changed = structuredClone(input);
    changed.pages[0].content = Buffer.from(content);
    mutate(changed);
    assert.throws(() => composeInteractiveHtml(changed));
  }
});

test(
  'real Chrome paints the selected statement face and returns inspection focus to that text',
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? '') },
  async (t) => {
    const root = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), 'archpub-statement-browser-'),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const meaning = meaningFor('interactive', { editor: true });
    const scene = sceneFor(meaning, 'interactive');
    const supply = await loadBundledFonts();
    const measurer = await createBundledTextMeasurer(supply, scene.texts);
    for (const label of scene.texts) label.box = measurer.box(label);
    const composed = composeAuthoredInteractiveArchitecture(meaning).pages[0];
    const renderedPath = path.join(root, 'page.html');
    await renderArchitectureScene({ scene, output: renderedPath });
    const content = await fs.readFile(renderedPath);
    const source = meaning.native.selections[0].source;
    const output = composeInteractiveHtml({
      schema: 'architecture.interactive-html-composition/v2',
      title: meaning.editorial.title,
      editionId: meaning.edition.id,
      framing: 'Source statements and editorial judgment remain distinct.',
      build: {
        lockSha256: '1'.repeat(64),
        editionSha256: meaning.edition.sha256,
        semanticDigest: '2'.repeat(64),
      },
      overview: 'overview',
      sources: [
        {
          id: 'source',
          kind: 'native',
          namespace,
          sha256: source.sha256,
          claimant: source.claimant,
        },
      ],
      pages: [
        {
          id: 'overview',
          label: composed.label,
          shortLabel: 'Statements',
          purpose: 'overview',
          path: 'views/overview.html',
          sha256: sha(content),
          sourceIds: ['source'],
          content,
          subjectSources: Object.fromEntries(
            Object.entries(composed.subjectNamespaces).map(([id, namespaces]) => [
              id,
              namespaces.length ? ['source'] : [],
            ]),
          ),
          facts: composed.facts,
        },
      ],
      state: {
        qualification: 'not-performed',
        humanAcceptance: 'not-performed',
        publication: 'not-performed',
      },
    });
    const server = http.createServer((_request, response) =>
      response.writeHead(200, { 'Content-Type': 'text/html' }).end(output),
    );
    const lifetime = browserLifetime(t);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    lifetime.use(server);
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    lifetime.use(browser);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.setDefaultTimeout(10_000);
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
    const frame = page.frameLocator('#interactive-frame');
    const statement = frame.locator('[data-text-id="text-claim-published"]');
    await statement.waitFor();
    assert.equal(await statement.textContent(), scene.texts[0].text);
    const paint = await statement.evaluate(async (node) => {
      await globalThis.document.fonts.ready;
      const context = globalThis.document.createElement('canvas').getContext('2d');
      context.font = `${globalThis.getComputedStyle(node).fontWeight} ${globalThis.getComputedStyle(node).fontSize} ${globalThis.getComputedStyle(node).fontFamily}`;
      const painted = context.measureText(node.textContent);
      context.textRendering = 'geometricPrecision';
      const precise = context.measureText(node.textContent);
      const x = Number(node.getAttribute('x'));
      const baseline = Number(node.getAttribute('y'));
      const isolated = node.cloneNode(true);
      const style = globalThis.getComputedStyle(node);
      for (const property of [
        'font-family',
        'font-size',
        'font-weight',
        'font-style',
        'font-synthesis',
        'font-kerning',
        'font-feature-settings',
        'font-variant-ligatures',
        'text-rendering',
        'white-space',
      ])
        isolated.style.setProperty(property, style.getPropertyValue(property));
      isolated.style.fill = '#000000';
      return {
        isolated: isolated.outerHTML,
        family: globalThis.getComputedStyle(node).fontFamily,
        rendering: globalThis.getComputedStyle(node).textRendering,
        geometric: {
          x: x - precise.actualBoundingBoxLeft,
          y: baseline - precise.actualBoundingBoxAscent,
          width: precise.actualBoundingBoxLeft + precise.actualBoundingBoxRight,
          height: precise.actualBoundingBoxAscent + precise.actualBoundingBoxDescent,
        },
        loaded: globalThis.document.fonts.check('14px "JetBrains Mono"'),
        faces: [...globalThis.document.fonts]
          .filter((face) => face.family.replaceAll('"', '') === 'JetBrains Mono')
          .map((face) => ({ weight: face.weight, status: face.status })),
        box: {
          x: x - painted.actualBoundingBoxLeft,
          y: baseline - painted.actualBoundingBoxAscent,
          width: painted.actualBoundingBoxLeft + painted.actualBoundingBoxRight,
          height: painted.actualBoundingBoxAscent + painted.actualBoundingBoxDescent,
        },
      };
    });
    assert(paint.family.includes('JetBrains Mono'));
    assert.equal(paint.loaded, true);
    assert.deepEqual(paint.faces.map(({ weight }) => weight).sort(), ['400', '500', '600', '700']);
    assert(paint.faces.some(({ status }) => status === 'loaded'));
    const declared = scene.texts[0].box;
    t.diagnostic(JSON.stringify({ text: scene.texts[0].text, declared, paint }));
    const isolatedPage = await browser.newPage({ viewport: { width: 600, height: 160 } });
    lifetime.defer(() => isolatedPage.close());
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160" xml:space="preserve">${paint.isolated}</svg>`,
    );
    const label = scene.texts[0];
    const escaped = label.text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    const nativeSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160" xml:space="preserve" text-rendering="geometricPrecision" font-family="JetBrains Mono"><text x="${label.x}" y="${label.baseline}" font-size="${label.fontSize}" font-weight="${label.weight}" text-anchor="${label.anchor}">${escaped}</text></svg>`,
    );
    const samples = [];
    for (const scale of [1, 4]) {
      const scaledSvg = svg
        .toString('utf8')
        .replace(
          'width="600" height="160"',
          `width="${600 * scale}" height="${160 * scale}" viewBox="0 0 600 160"`,
        );
      await isolatedPage.setViewportSize({ width: 600 * scale, height: 160 * scale });
      await isolatedPage.setContent(
        `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${embedFonts(Buffer.from(scaledSvg), supply.fonts, supply.license).toString('utf8')}`,
      );
      await isolatedPage.evaluate(() => globalThis.document.fonts.ready);
      const chromePng = await isolatedPage.locator('svg').screenshot({ omitBackground: true });
      const nativePath = path.join(root, `statement-native-${scale}.png`);
      await rasterizeBytes({
        svg: nativeSvg,
        fonts: supply.fonts.map(({ weight, bytes }) => ({
          weight,
          bytes,
          family: 'JetBrains Mono',
        })),
        width: 600 * scale,
        output: nativePath,
      });
      samples.push({
        scale,
        chrome: await observeGlyphPaintEnvelope(isolatedPage, chromePng, scale),
        native: await observeGlyphPaintEnvelope(isolatedPage, await fs.readFile(nativePath), scale),
      });
    }
    t.diagnostic(
      JSON.stringify({
        sampling: 'Actual statement SVG node, computed typography and exact selected font bytes',
        text: scene.texts[0].text,
        outline: declared,
        browser: await browser.version(),
        samples,
      }),
    );
    // Canvas metrics are diagnostic; SVG ink is compared through its complete pixel footprint.
    const precisePaint = samples.find(({ scale }) => scale === 4);
    for (const observed of [precisePaint.native, precisePaint.chrome]) {
      assert.equal(observed.width, 2400);
      assert.equal(observed.height, 640);
    }
    assertGlyphPaintBounds(precisePaint.native, declared, 0.5);
    assertGlyphPaintBounds(precisePaint.chrome, declared, 0.5);
    for (const engine of ['native', 'chrome']) {
      const deliveryPaint = samples.find(({ scale }) => scale === 1)[engine];
      assert.equal(deliveryPaint.width, 600);
      assert.equal(deliveryPaint.height, 160);
      const { count, envelope } = deliveryPaint.samples.find(({ threshold }) => threshold === 0);
      assert(count > 0, `The delivery-scale ${engine} statement must remain visible`);
      assert(envelope.left > 0 && envelope.top > 0);
      assert(envelope.right < 599 && envelope.bottom < 159);
    }
    await statement.focus();
    await statement.press('Enter');
    await page.locator('#interactive-inspector').waitFor({ state: 'visible' });
    assert((await page.locator('#interactive-inspect-content').textContent()).includes('unknown'));
    await page.locator('#interactive-inspect-back').click();
    await statement.waitFor({ state: 'visible' });
    assert.equal(
      await statement.evaluate((node) => globalThis.document.activeElement === node),
      true,
    );
    await frame.locator('[data-text-id="editor-text"]').press('Enter');
    await page.locator('#interactive-inspector').waitFor({ state: 'visible' });
    assert(
      (await page.locator('#interactive-inspect-basis').textContent()).includes('Edition identity'),
    );
    assert.equal(errors.length, 0, errors.join('\n'));
  },
);
