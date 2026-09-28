import assert from 'node:assert/strict';
import test from 'node:test';
import { projectInteractivePage } from '../packages/publisher/renderers/cytoscape/model.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

test('one pinned geometry owner produces one selected interactive layout without changing public meaning', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const source = projectInteractivePage(interactiveEditionScene().pages[0], 0).publicPage;
  const original = structuredClone(source);
  const first = await layoutInteractivePages([source]);
  const second = await layoutInteractivePages([source]);
  assert.deepEqual(first, second);
  assert.deepEqual(source, original);
  assert.match(first.supplySha256, /^[0-9a-f]{64}$/u);
  const layout = first.layouts[0];
  assert.deepEqual(Object.keys(layout), ['bounds', 'positions']);
  assert(layout.bounds.width > layout.bounds.height);
  assert.deepEqual(Object.keys(layout.positions).sort(), source.nodes.map(({ id }) => id).sort());
  assert(layout.positions['n-0'].x < layout.positions['n-1'].x);
  assert(
    layout.positions['n-1'].x - layout.positions['n-0'].x - 170 >= 48,
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
  const selected = first.layouts[0];
  assert.equal(Object.keys(selected.positions).length, 3);
  assert(
    Object.values(selected.positions).every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)),
  );
});

test('explicit reading groups enclose only their authored nodes', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const page = {
    nodes: ['Input A', 'Input B', 'Effect A', 'Effect B'].map((label, index) => ({
      id: `n-${index}`,
      label,
    })),
    relations: [
      ['n-0', 'n-1'],
      ['n-1', 'n-2'],
      ['n-2', 'n-3'],
    ].map(([source, target], index) => ({ id: `r-${index}`, source, target })),
    groups: [
      { id: 'g-0', label: 'Input', nodeIds: ['n-0', 'n-1'] },
      { id: 'g-1', label: 'Effect', nodeIds: ['n-2', 'n-3'] },
    ],
  };
  const layouts = (await layoutInteractivePages([page])).layouts[0];
  assert.deepEqual(
    layouts.groups.map(({ id }) => id),
    ['g-0', 'g-1'],
  );
  for (const group of layouts.groups) {
    const authored = page.groups.find(({ id }) => id === group.id);
    for (const id of authored.nodeIds) {
      const node = layouts.positions[id];
      assert(node.x - 85 >= group.x);
      assert(node.x + 85 <= group.x + group.width);
      assert(node.y - 32 >= group.y);
      assert(node.y + 32 <= group.y + group.height);
    }
  }
  assert(
    layouts.groups[0].x + layouts.groups[0].width <= layouts.groups[1].x ||
      layouts.groups[0].y + layouts.groups[0].height <= layouts.groups[1].y,
  );
});

test('grouped geometry rejects incomplete or conflicting authored membership', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const page = {
    nodes: [
      { id: 'n-0', label: 'A' },
      { id: 'n-1', label: 'B' },
    ],
    relations: [{ id: 'r-0', source: 'n-0', target: 'n-1' }],
    groups: [
      { id: 'g-0', label: 'Input', nodeIds: ['n-0'] },
      { id: 'g-1', label: 'Effect', nodeIds: ['n-1'] },
    ],
  };
  for (const change of [
    (value) => value.groups.pop(),
    (value) => value.groups[1].nodeIds.push('n-0'),
    (value) => (value.groups[1].id = 'n-1'),
  ]) {
    const invalid = structuredClone(page);
    change(invalid);
    await assert.rejects(layoutInteractivePages([invalid]), {
      code: 'render_interactive_group_invalid',
    });
  }
});

test('geometry rejects malformed public pages before treating them as layout input', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const page = {
    nodes: [
      { id: 'n-0', label: 'Input' },
      { id: 'n-1', label: 'Effect' },
    ],
    relations: [{ id: 'r-0', source: 'n-0', target: 'n-1' }],
  };
  for (const pages of [null, [], {}])
    await assert.rejects(layoutInteractivePages(pages), {
      code: 'render_interactive_layout_invalid',
    });
  for (const mutate of [
    (item) => (item.nodes = null),
    (item) => (item.relations = null),
    (item) => (item.nodes = Array.from({ length: 513 }, (_, index) => ({ id: `n-${index}` }))),
    (item) => (item.relations = Array.from({ length: 2049 }, (_, index) => ({ id: `r-${index}` }))),
    (item) => (item.nodes[0].id = ''),
    (item) => (item.nodes[0].label = '   '),
    (item) => (item.nodes[1].id = 'n-0'),
    (item) => (item.relations[0].id = ''),
    (item) => item.relations.push({ ...item.relations[0] }),
    (item) => (item.relations[0].source = 'not-selected'),
  ]) {
    const invalid = structuredClone(page);
    mutate(invalid);
    await assert.rejects(layoutInteractivePages([invalid]), {
      code: 'render_interactive_layout_invalid',
    });
  }
});

test('authored groups reject ambiguous and incomplete membership', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const page = {
    nodes: [
      { id: 'n-0', label: 'Input' },
      { id: 'n-1', label: 'Effect' },
    ],
    relations: [{ id: 'r-0', source: 'n-0', target: 'n-1' }],
    groups: [
      { id: 'g-0', label: 'Source', nodeIds: ['n-0'] },
      { id: 'g-1', label: 'Target', nodeIds: ['n-1'] },
    ],
  };
  for (const mutate of [
    (item) => (item.groups = []),
    (item) => (item.groups = null),
    (item) => (item.groups[0].id = ''),
    (item) => (item.groups[0].label = ''),
    (item) => (item.groups[1].id = 'g-0'),
    (item) => (item.groups[0].nodeIds = []),
    (item) => (item.groups[0].nodeIds = null),
    (item) => (item.groups[0].nodeIds = ['missing']),
    (item) => (item.groups[0].nodeIds = ['n-0', 'n-0']),
  ]) {
    const invalid = structuredClone(page);
    mutate(invalid);
    await assert.rejects(layoutInteractivePages([invalid]), {
      code: 'render_interactive_group_invalid',
    });
  }
});

test('an explicitly empty public page needs no invented geometry', async () => {
  const { layoutInteractivePages } =
    await import('../packages/publisher/renderers/dagre/layout.mjs');
  const result = await layoutInteractivePages([{ nodes: [], relations: [] }]);
  assert.deepEqual(result.layouts, [null]);
});
