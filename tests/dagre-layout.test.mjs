import assert from 'node:assert/strict';
import test from 'node:test';
import { projectInteractivePage } from '../packages/publisher/renderers/cytoscape/model.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

test('one pinned geometry owner produces stable independent orientations without changing public meaning', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const source = projectInteractivePage(interactiveEditionScene().pages[0], 0).publicPage;
  const original = structuredClone(source);
  const first = await layoutInteractivePages([source]);
  const second = await layoutInteractivePages([source]);
  assert.deepEqual(first, second);
  assert.deepEqual(source, original);
  assert.match(first.supplySha256, /^[0-9a-f]{64}$/u);
  const { rightward, downward } = first.layouts[0];
  assert(rightward.bounds.width > rightward.bounds.height);
  assert(rightward.bounds.width > downward.bounds.width);
  assert(downward.bounds.height > rightward.bounds.height);
  assert.deepEqual(
    Object.keys(rightward.positions).sort(),
    source.nodes.map(({ id }) => id).sort(),
  );
  assert.deepEqual(Object.keys(downward.positions).sort(), source.nodes.map(({ id }) => id).sort());
  assert(rightward.positions['n-0'].x < rightward.positions['n-1'].x);
  assert(downward.positions['n-0'].y < downward.positions['n-1'].y);
  assert(
    rightward.positions['n-1'].x - rightward.positions['n-0'].x - 170 >= 48,
    'edge number and arrow need clearance between adjacent node bodies',
  );
});

test('a geometry request with missing relation endpoints fails closed', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const source = projectInteractivePage(interactiveEditionScene().pages[0], 0).publicPage;
  source.relations[0].target = 'not-selected';
  await assert.rejects(layoutInteractivePages([source]), {
    code: 'render_interactive_layout_invalid',
  });
});

test('cyclic and parallel source relations retain their direction through one geometry pass', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const page = {
    nodes: ['A', 'B', 'C'].map((label, index) => ({ id: `n-${index}`, label })),
    relations: [
      ['n-0', 'n-1'],
      ['n-0', 'n-1'],
      ['n-1', 'n-2'],
      ['n-2', 'n-0'],
    ].map(([source, target], index) => ({ id: `r-${index}`, source, target })),
  };
  const original = structuredClone(page);
  const first = await layoutInteractivePages([page]);
  assert.deepEqual(page, original);
  assert.deepEqual(first, await layoutInteractivePages([page]));
  for (const direction of ['rightward', 'downward']) {
    const selected = first.layouts[0][direction];
    assert.equal(Object.keys(selected.positions).length, 3);
    assert(
      Object.values(selected.positions).every(
        ({ x, y }) => Number.isFinite(x) && Number.isFinite(y),
      ),
    );
  }
});
