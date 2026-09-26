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
