import assert from 'node:assert/strict';
import test from 'node:test';
import { projectInteractivePage } from '../packages/publisher/renderers/cytoscape/model.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

test('a neutral standalone HTML keeps every page complete without source-byte disclosure', async () => {
  const renderer = await import('../packages/publisher/renderers/cytoscape/index.mjs').catch(
    () => null,
  );
  assert.equal(typeof renderer?.renderInteractiveEditionHtml, 'function');
  const result = await renderer.renderInteractiveEditionHtml(interactiveEditionScene());
  const html = result.bytes.toString('utf8');

  assert.equal(result.completeness, 'unqualified-medium');
  assert.deepEqual(
    result.supplies.map(({ id }) => id),
    ['cytoscape', 'font-supply'],
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
  assert.match(html, /Cytoscape Consortium/u);
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

test('compact graph geometry is limited to short forward paths without in-graph edge labels', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
  const base = interactiveEditionScene();
  base.pages[0].relations[0].label = null;
  base.pages[0].relations[0].kind = null;
  const usesCompact = async (scene) =>
    (await renderInteractiveEditionHtml(scene)).bytes
      .toString('utf8')
      .includes('class="graph graph--chain"');
  const addThird = (scene, from, to) => {
    const page = scene.pages[0];
    const third = { ...page.nodes[1], id: 'secret-third', label: 'Gamma' };
    page.nodes.push(third);
    const relation = {
      ...page.relations[0],
      id: 'relation-third',
      from: { namespace: page.nodes[from].namespace, id: page.nodes[from].id },
      to: { namespace: page.nodes[to].namespace, id: page.nodes[to].id },
    };
    page.relations.push(relation);
    page.sourceAssertionCarriers[0].nodeRefs.push({ namespace: third.namespace, id: third.id });
    page.sourceAssertionCarriers[0].relationRefs.push({
      namespace: relation.origin.namespace,
      reference: relation.id,
      sha256: relation.origin.sha256,
    });
  };

  assert.equal(await usesCompact(base), true);
  const rejected = [
    ['in-graph edge label', (scene) => (scene.pages[0].relations[0].label = 'calls')],
    ['bidirectional edge', (scene) => (scene.pages[0].relations[0].direction = 'bidirectional')],
    [
      'long node label',
      (scene) => (scene.pages[0].nodes[0].label = 'A source label beyond compact width'),
    ],
    [
      'one node',
      (scene) => {
        const page = scene.pages[0];
        page.nodes.pop();
        page.relations = [];
        page.sourceAssertionCarriers[0].nodeRefs.pop();
        page.sourceAssertionCarriers[0].relationRefs = [];
      },
    ],
    ['fork', (scene) => addThird(scene, 0, 2)],
    ['convergence', (scene) => addThird(scene, 2, 1)],
    ['cycle beside an isolated node', (scene) => addThird(scene, 1, 0)],
  ];
  for (const [name, alter] of rejected) {
    const scene = structuredClone(base);
    alter(scene);
    assert.equal(await usesCompact(scene), false, name);
  }
});

test('a source claim preserves the unchanged graph reading width', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
  const scene = interactiveEditionScene();
  const revision = 'a'.repeat(64);
  const claim = { namespace: 'private/model', id: 'claim-one', sha256: revision };
  const layoutClass = (html) =>
    html.match(
      /<section class="edition-page" id="page-0"[\s\S]*?<div class="(page-grid[^"]*)"/u,
    )?.[1];

  const overview = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.equal(layoutClass(overview), 'page-grid page-grid--graph');

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
  assert.equal(layoutClass(detail), 'page-grid page-grid--graph');
  assert(
    detail.indexOf('<section class="linked-claims"') >
      detail.indexOf('<div class="page-grid page-grid--graph"'),
  );
});

test('malformed or excessive Scenes fail before loading renderer supply', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
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
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].nodes[0].label = '</script><script>globalThis.injection=1</script>';
  scene.pages[0].relations[0].direction = 'bidirectional';
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = 'peer';
  scene.pages[0].editorialAssertions.push(scene.pages[1].editorialAssertions[0]);
  scene.limits = [];
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(html, /&lt;\/script&gt;&lt;script&gt;globalThis\.injection=1/u);
  assert.match(html, /\\u003c\/script\\u003e/u);
  assert.doesNotMatch(html, /<script>globalThis\.injection=1<\/script>/u);
  assert.match(html, /↔ Beta · peer/u);
  assert.match(html, /Editorial assertions/u);
  assert.doesNotMatch(html, /<h3>Method limits<\/h3>/u);
});

test('an unlabeled source relation stays structural without an invented kind', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].nodes[0].kind = null;
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = null;
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(html, /Alpha &amp; one → Beta<\/button>/u);
  assert.doesNotMatch(html, /Alpha &amp; one → Beta ·/u);
});

test('graph edge labels stay concise while the adjacent relation retains exact qualifiers', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
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
  assert.equal(relation.graphLabel, 'configures');

  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(html, /label: 'data\(graphLabel\)'/u);
  assert.match(
    html,
    /Alpha &amp; one → Beta · Source relation qualifiers \(unverified\): state: desired client bindings · configures/u,
  );
});

test('a short authored relation label takes precedence over its generic kind', () => {
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = 'calls';
  scene.pages[0].relations[0].kind = 'dependency';
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  assert.equal(publicPage.relations[0].graphLabel, 'calls');
  assert.equal(publicPage.relations[0].label, 'calls · dependency');
});

test('a long untyped relation stays in the readable list rather than crowding the graph', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = 'synchronizes all selected native client registrations';
  scene.pages[0].relations[0].kind = null;
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  assert.equal(publicPage.relations[0].graphLabel, '');
  assert.equal(publicPage.relations[0].label, scene.pages[0].relations[0].label);
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  assert.match(
    html,
    /Alpha &amp; one → Beta · synchronizes all selected native client registrations/u,
  );
});

test('source-reported qualifier fields are visible and HTML-escaped beside their relation', async () => {
  const { renderInteractiveEditionHtml } =
    await import('../packages/publisher/renderers/cytoscape/index.mjs');
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
