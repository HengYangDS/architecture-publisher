import test from 'node:test';
import assert from 'node:assert/strict';
import { editionFixture } from './fixtures/edition.mjs';
import { semanticArchitectureProjections } from '../packages/publisher/src/scene/contract.mjs';
import {
  interactiveArchitectureScene,
  validateInteractiveArchitectureScene,
} from '../packages/publisher/src/scene/interactive/architecture.mjs';
import { adaptArchitectureScene } from '../packages/publisher/renderers/archify/architecture.mjs';

test('interactive scene is renderer-neutral and Archify adaptation is renderer-owned', () => {
  const { model, edition } = editionFixture(),
    view = semanticArchitectureProjections(model, edition).interactiveScenes[0],
    scene = interactiveArchitectureScene(model, edition, view);

  assert.equal(validateInteractiveArchitectureScene(scene), scene);
  assert.deepEqual(Object.keys(scene), [
    'schema',
    'id',
    'title',
    'subtitle',
    'viewport',
    'nodes',
    'groups',
    'edges',
  ]);
  assert.equal(scene.schema, 'architecture.interactive-scene/v1');
  assert.equal(scene.nodes[0].visualRole, 'backend');
  assert.deepEqual(scene.nodes[0].position, { x: 135, y: 110 });
  assert.deepEqual(scene.nodes[0].size, { width: 170, height: 82 });
  assert(!JSON.stringify(scene).includes('diagram_type'));
  assert(!JSON.stringify(scene).includes('quality_profile'));
  assert(!JSON.stringify(scene).includes('visual_preset'));
  assert(!Object.hasOwn(scene, 'components'));
  assert(!Object.hasOwn(scene, 'boundaries'));
  assert(!Object.hasOwn(scene, 'connections'));

  const native = adaptArchitectureScene(scene);
  assert.equal(native.diagram_type, 'architecture');
  assert.equal(native.meta.quality_profile, 'showcase');
  assert.equal(native.meta.visual_preset, 'editorial');
  assert.deepEqual(native.meta.viewBox, [scene.viewport.width, scene.viewport.height]);
  assert.equal(native.components[0].type, 'backend');
  assert.deepEqual(native.components[0].pos, [135, 110]);
});

test('renderer support does not constrain the renderer-neutral scene vocabulary', () => {
  const { model, edition } = editionFixture();
  edition.visualGrammar.entityTypes.component = 'brand-primary';
  const view = semanticArchitectureProjections(model, edition).interactiveScenes[0],
    scene = interactiveArchitectureScene(model, edition, view);

  assert.equal(scene.nodes[0].visualRole, 'brand-primary');
  assert.throws(() => adaptArchitectureScene(scene), {
    code: 'render_scene_visual_role_unsupported',
  });
});

test('interactive scene optional semantic carriers remain renderer-neutral and exact', () => {
  const { model, edition } = editionFixture();
  const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
  const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
  scene.nodes[0].detail = 'A source-bound explanation';
  scene.nodes[0].semanticIds = ['claim-one'];
  scene.edges[0].semanticIds = ['claim-two'];
  scene.edges[0].waypoints = [{ x: 100, y: 120 }];
  scene.edges[0].labelPlacement = { at: [150, 120], dx: 1, dy: -1, segment: 0 };
  assert.equal(validateInteractiveArchitectureScene(scene), scene);
  assert.equal(scene.nodes[0].semanticIds[0], 'claim-one');
});

test('interactive scene compilation preserves explicitly authored route and label placement', () => {
  const { model, edition } = editionFixture();
  const view = structuredClone(
    semanticArchitectureProjections(model, edition).interactiveScenes[0],
  );
  view.relations[0].waypoints = [{ x: 240, y: 150 }];
  view.relations[0].labelAt = [200, 130];
  view.relations[0].labelDx = 2;
  view.relations[0].labelDy = -3;
  view.relations[0].labelSegment = 0;
  const scene = interactiveArchitectureScene(model, edition, view);
  assert.deepEqual(scene.edges[0].waypoints, [{ x: 240, y: 150 }]);
  assert.deepEqual(scene.edges[0].labelPlacement, {
    at: [200, 130],
    dx: 2,
    dy: -3,
    segment: 0,
  });
});

test('interactive scene rejects malformed nodes, groups, edges and optional placements', () => {
  const { model, edition } = editionFixture();
  const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
  const baseline = interactiveArchitectureScene(model, edition, view);
  const cases = [
    ['viewport', (s) => (s.viewport.width = 0), 'interactive_scene_invalid'],
    ['scene id', (s) => (s.id = 'Not Portable'), 'interactive_scene_invalid'],
    ['node identity', (s) => (s.nodes[0].id = 'Bad ID'), 'interactive_scene_node_invalid'],
    ['node size', (s) => (s.nodes[0].size.width = 0), 'interactive_scene_node_invalid'],
    ['node detail', (s) => (s.nodes[0].detail = ''), 'interactive_scene_node_invalid'],
    [
      'node semantics',
      (s) => (s.nodes[0].semanticIds = ['same', 'same']),
      'interactive_scene_node_invalid',
    ],
    ['group padding', (s) => (s.groups[0].padding = -1), 'interactive_scene_group_invalid'],
    [
      'unknown member',
      (s) => (s.groups[0].nodeIds[0] = 'absent'),
      'interactive_scene_group_membership_invalid',
    ],
    [
      'ungrouped member',
      (s) => (s.groups[0].nodeIds = s.groups[0].nodeIds.slice(1)),
      'interactive_scene_group_membership_invalid',
    ],
    ['edge source', (s) => (s.edges[0].from = 'absent'), 'interactive_scene_edge_invalid'],
    ['edge route', (s) => (s.edges[0].route = 'diagonal'), 'interactive_scene_edge_invalid'],
    ['edge side', (s) => (s.edges[0].fromSide = 'center'), 'interactive_scene_edge_invalid'],
    ['edge semantics', (s) => (s.edges[0].semanticIds = []), 'interactive_scene_edge_invalid'],
    [
      'edge waypoints',
      (s) => (s.edges[0].waypoints = [{ x: NaN, y: 0 }]),
      'interactive_scene_edge_invalid',
    ],
    [
      'placement coordinates',
      (s) => (s.edges[0].labelPlacement = { at: [1] }),
      'interactive_scene_edge_invalid',
    ],
    [
      'placement offset',
      (s) => (s.edges[0].labelPlacement = { dx: NaN }),
      'interactive_scene_edge_invalid',
    ],
    [
      'placement vertical offset',
      (s) => (s.edges[0].labelPlacement = { dy: 'far' }),
      'interactive_scene_edge_invalid',
    ],
    [
      'placement extra field',
      (s) => (s.edges[0].labelPlacement = { unknown: true }),
      'interactive_scene_edge_invalid',
    ],
    [
      'placement segment',
      (s) => (s.edges[0].labelPlacement = { segment: -1 }),
      'interactive_scene_edge_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const selected = structuredClone(baseline);
    mutate(selected);
    assert.throws(() => validateInteractiveArchitectureScene(selected), { code }, name);
  }
});
