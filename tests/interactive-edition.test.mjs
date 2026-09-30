import assert from 'node:assert/strict';
import test from 'node:test';
import { projectInteractivePage } from '../packages/publisher/renderers/interactive/model.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

test('a neutral standalone HTML keeps every page complete without source-byte disclosure', async () => {
  const renderer = await import('../packages/publisher/renderers/interactive/index.mjs').catch(
    () => null,
  );
  assert.equal(typeof renderer?.renderInteractiveEditionHtml, 'function');
  const result = await renderer.renderInteractiveEditionHtml(interactiveEditionScene());
  const html = result.bytes.toString('utf8');

  assert.equal(result.completeness, 'unqualified-medium');
  assert.deepEqual(
    result.supplies.map(({ id }) => id),
    ['svg-pan-zoom', 'elk-layout', 'font-measurement', 'font-supply'],
  );
  assert.match(html, /<!doctype html>/iu);
  assert.match(html, /Selected architecture/u);
  assert.match(html, /What is connected\?/u);
  assert.match(html, /What remains uncertain\?/u);
  assert.match(html, /Alpha &amp; one/u);
  assert.match(html, /Beta/u);
  assert.match(html, /calls/u);
  assert.match(html, /Runtime safety is not established\./u);
  assert.match(html, /No runtime observation was selected\./u);
  assert.match(html, /--graph-height:\d+px/u);
  assert.doesNotMatch(
    html,
    /--graph-wide-height|--graph-down-height|matchMedia\('\(max-width: 559px\)'\)/u,
  );
  assert.match(html, /--graph-natural-width:\d+px/u);
  assert.match(html, /class="page-grid page-grid--graph page-grid--paired"/u);
  assert.match(html, /<aside class="reading-boundary" aria-label="Reading boundary">/u);
  assert.match(html, /<aside class="notes" aria-label="Page evidence">/u);
  assert.match(
    html,
    /<details class="source-inspection"><summary>Inspect source and method<\/summary>/u,
  );
  assert.doesNotMatch(html, /Edge numbers match/u);
  const firstPage = html.split('<section class="edition-page" id="page-1"')[0];
  assert.doesNotMatch(firstPage, /class="evidence-section evidence-questions"/u);
  assert.match(html, /Eclipse Public License/u);
  assert.match(html, /Redistribution and use in source and binary forms/u);
  assert.doesNotMatch(
    html,
    /private\/model|secret-alpha|secret-beta|relation:4:2|backend|external/u,
  );
  assert.deepEqual(
    result.carriers[0].nodes.map(({ graphicId }) => graphicId),
    ['n-0', 'n-1'],
  );
  assert.deepEqual(result.carriers[1].nodes, []);
});

test('a short path uses the same selected geometry owner rather than a special chain layout', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = null;
  const result = await renderInteractiveEditionHtml(scene);
  assert(!result.bytes.toString('utf8').includes('graph--chain'));
  assert(result.supplies.some(({ id }) => id === 'elk-layout'));
});

test('authored interactive groups become visible reading sections with bound graphic members', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].groups = [
    {
      id: 'input',
      label: 'Input <selected>',
      elements: [{ namespace: 'private/model', id: 'secret-alpha' }],
    },
    {
      id: 'effect',
      label: 'Effect',
      elements: [{ namespace: 'private/model', id: 'secret-beta' }],
    },
  ];
  const rendered = await renderInteractiveEditionHtml(scene);
  const html = rendered.bytes.toString('utf8');
  assert.match(html, /<h4>Input &lt;selected&gt;<\/h4>/u);
  assert.match(html, /<h4>Effect<\/h4>/u);
  assert.doesNotMatch(html, /<h4>Input <selected><\/h4>/u);
  assert.deepEqual(
    rendered.carriers[0].groups.map(({ graphicId, nodeIds }) => [graphicId, nodeIds]),
    [
      ['g-0', ['n-0']],
      ['g-1', ['n-1']],
    ],
  );
});

test('a source claim preserves the unchanged graph reading width', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  const revision = 'a'.repeat(64);
  const claim = { namespace: 'private/model', id: 'claim-one', sha256: revision };
  const layoutClass = (html) =>
    html.match(
      /<section class="edition-page" id="page-0"[\s\S]*?<div class="(page-grid[^"]*)"/u,
    )?.[1];

  const overview = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.equal(layoutClass(overview), 'page-grid page-grid--graph page-grid--paired');

  scene.pages[0].claimCards = [
    { ...claim, facts: [{ label: 'Claim plane', value: 'implemented' }] },
  ];
  scene.pages[0].sourceAssertionCarriers.push(
    {
      assertionId: 'relation-assertion',
      kind: 'relation',
      nodeRefs: [],
      relationRefs: [{ namespace: claim.namespace, reference: 'relation:4:2', sha256: revision }],
    },
    {
      assertionId: 'claim-assertion',
      kind: 'claim',
      nodeRefs: [],
      relationRefs: [],
      claimRefs: [{ namespace: claim.namespace, reference: claim.id, sha256: revision }],
    },
  );
  scene.pages[0].claimRelationLinks = [
    { claimAssertionId: 'claim-assertion', relationAssertionId: 'relation-assertion' },
  ];
  const detail = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.equal(layoutClass(detail), 'page-grid page-grid--graph page-grid--paired');
  assert.match(detail, /class="claim-work"/u);
  assert.equal(detail.split('data-graphic-id="c-0"').length - 1, 1);
  assert.match(detail, /data-inspect-graphic="c-0"/u);
  assert(
    detail.indexOf('<section class="linked-claims"') >
      detail.indexOf('<div class="page-grid page-grid--graph"'),
  );
});

test('required editorial meaning remains in the primary graph reading state', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].editorialAssertions.push({
    id: 'editorial-reading-boundary',
    kind: 'editorial',
    statement: 'These selected claims do not establish current runtime behavior.',
    proponent: 'comparison-editor',
    basis: ['overview'],
    questions: ['shape'],
    semanticStatus: 'editor-attributed-unverified',
  });
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  const primary = html
    .split('<section class="edition-page" id="page-1"')[0]
    .split('<details class="source-inspection">')[0];
  assert(primary.includes('These selected claims do not establish current runtime behavior.'));
  assert(primary.includes('Editorial judgment · comparison-editor · unverified'));
});

test('malformed or excessive Scenes fail before loading renderer supply', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const cases = [
    ['null scene', () => null, 'render_interactive_scene_invalid'],
    [
      'wrong schema',
      (scene) => ({ ...scene, schema: 'other' }),
      'render_interactive_scene_invalid',
    ],
    [
      'wrong completeness',
      (scene) => ({ ...scene, completeness: 'accepted' }),
      'render_interactive_scene_invalid',
    ],
    ['missing title', (scene) => ({ ...scene, title: '' }), 'render_interactive_scene_invalid'],
    ['missing summary', (scene) => ({ ...scene, summary: '' }), 'render_interactive_scene_invalid'],
    [
      'unsupported profile',
      (scene) => ({ ...scene, visualPolicy: { profile: 'flagship' } }),
      'render_interactive_scene_invalid',
    ],
    [
      'unselected override',
      (scene) => ({ ...scene, visualPolicy: { profile: 'neutral', override: 'art.css' } }),
      'render_interactive_scene_invalid',
    ],
    ['missing pages', (scene) => ({ ...scene, pages: null }), 'render_interactive_scene_invalid'],
    ['empty pages', (scene) => ({ ...scene, pages: [] }), 'render_interactive_scene_invalid'],
    ['null page', (scene) => ({ ...scene, pages: [null] }), 'render_interactive_scene_invalid'],
    [
      'too many pages',
      (scene) => ({ ...scene, pages: Array.from({ length: 65 }, () => scene.pages[0]) }),
      'render_interactive_scene_invalid',
    ],
    ['missing limits', (scene) => ({ ...scene, limits: null }), 'render_interactive_scene_invalid'],
    ['invalid limit', (scene) => ({ ...scene, limits: [''] }), 'render_interactive_scene_invalid'],
    [
      'duplicate page',
      (scene) => ({ ...scene, pages: [scene.pages[0], scene.pages[0]] }),
      'render_interactive_identity_ambiguous',
    ],
    [
      'too many nodes',
      (scene) => {
        scene.pages[0].nodes.push(
          ...Array.from({ length: 511 }, (_, index) => ({
            ...scene.pages[0].nodes[0],
            id: `extra-${index}`,
          })),
        );
        return scene;
      },
      'render_interactive_complexity_exceeded',
    ],
    [
      'too many relations',
      (scene) => {
        scene.pages[0].relations.push(
          ...Array.from({ length: 2048 }, (_, index) => ({
            ...scene.pages[0].relations[0],
            id: `relation:${index}`,
          })),
        );
        return scene;
      },
      'render_interactive_complexity_exceeded',
    ],
  ];
  for (const [name, alter, code] of cases)
    await assert.rejects(
      renderInteractiveEditionHtml(alter(interactiveEditionScene())),
      { code },
      name,
    );
});

test('HTML escaping preserves authored text without executable or raw source disclosure', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].nodes[0].label = '</script><script>x';
  scene.pages[0].relations[0].direction = 'bidirectional';
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = 'peer';
  scene.pages[0].editorialAssertions.push(scene.pages[1].editorialAssertions[0]);
  scene.limits = [];
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(html, /&lt;\/script&gt;&lt;script&gt;x/u);
  assert.match(html, /\\u003c\/script\\u003e/u);
  assert.doesNotMatch(html, /<script>globalThis\.injection=1<\/script>/u);
  assert.match(html, /↔ Beta · peer/u);
  assert.match(html, /Editorial assertions/u);
  assert.doesNotMatch(html, /<h3>Method limits<\/h3>/u);
});

test('an unlabeled source relation stays structural without an invented kind', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].nodes[0].kind = null;
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = null;
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(html, /Alpha &amp; one → Beta<\/button>/u);
  assert.doesNotMatch(html, /Alpha &amp; one → Beta ·/u);
});

test('diagram labels retain the selected relation meaning directly', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label =
    'Source relation qualifiers (unverified): state: desired client bindings';
  scene.pages[0].relations[0].kind = 'configures';
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  const relation = publicPage.relations[0];
  assert.equal(
    relation.label,
    'Source relation qualifiers (unverified): state: desired client bindings · configures',
  );
  assert.equal(relation.graphLabel, relation.label);

  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(html, /class="graph-label graph-label--relation"/u);
  assert.match(
    html,
    /Alpha &amp; one → Beta · Source relation qualifiers \(unverified\): state: desired client bindings · configures/u,
  );
});

test('a short authored relation is readable in the diagram', () => {
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = 'calls';
  scene.pages[0].relations[0].kind = 'dependency';
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  assert.equal(publicPage.relations[0].graphLabel, 'calls · dependency');
  assert.equal(publicPage.relations[0].label, 'calls · dependency');
});

test('a long relation retains its full meaning in the graph and inspection', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = 'synchronizes all selected native client registrations';
  scene.pages[0].relations[0].kind = null;
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  assert.equal(publicPage.relations[0].graphLabel, scene.pages[0].relations[0].label);
  assert.equal(publicPage.relations[0].label, scene.pages[0].relations[0].label);
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(
    html,
    /Alpha &amp; one → Beta · synchronizes all selected native client registrations/u,
  );
});

test('source-reported qualifier fields are visible and HTML-escaped beside their relation', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/interactive/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].sourceQualifiers = [
    { name: 'scope', value: '"<script>globalThis.injection=1</script>"' },
    { name: 'enabled', value: 'false' },
  ];
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert(html.includes('Source-reported relation qualifiers · unverified'));
  assert(
    html.includes(
      '<dt>scope</dt><dd>&quot;&lt;script&gt;globalThis.injection=1&lt;/script&gt;&quot;</dd>',
    ),
  );
  assert(html.includes('<dt>enabled</dt><dd>false</dd>'));
  assert(!html.includes('<script>globalThis.injection=1</script>'));
});
