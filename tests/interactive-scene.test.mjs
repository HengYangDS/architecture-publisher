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
