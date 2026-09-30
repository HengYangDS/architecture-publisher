import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';

const page = () => ({
  nodes: ['Alpha', 'Beta', 'Gamma'].map((label, index) => ({ id: `n-${index}`, label })),
  relations: [
    ['n-0', 'n-1', 'selects'],
    ['n-0', 'n-1', 'observes'],
    ['n-1', 'n-2', 'controls'],
    ['n-2', 'n-0', 'returns'],
    ['n-2', 'n-2', 'retries'],
  ].map(([source, target, graphLabel], index) => ({
    id: `r-${index}`,
    source,
    target,
    graphLabel,
    direction: 'forward',
  })),
});

async function selected() {
  const module = await import('../packages/publisher/renderers/elk/layout.mjs').catch(() => null);
  assert.equal(
    typeof module?.layoutInteractivePages,
    'function',
    'one exact interactive geometry owner must exist',
  );
  return { ...module, measure: await createBundledTextMeasurer(await loadBundledFonts()) };
}

test('exact geometry preserves complete parallel, cycle, and self-loop routes and source meaning', async () => {
  const { layoutInteractivePages, measure } = await selected();
  const input = page();
  const original = structuredClone(input);
  const first = await layoutInteractivePages([input], measure);
  const second = await layoutInteractivePages([input], measure);
  assert.deepEqual(first, second);
  assert.deepEqual(input, original);
  assert.match(first.supplySha256, /^[0-9a-f]{64}$/u);
  const graph = first.layouts[0];
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.relations.length, 5);
  assert.equal(new Set(graph.nodes.map(({ width, height }) => `${width}:${height}`)).size, 1);
  assert.deepEqual(
    graph.relations.map(({ id, source, target }) => ({ id, source, target })),
    input.relations.map(({ id, source, target }) => ({ id, source, target })),
  );
  assert.notDeepEqual(graph.relations[0].points, graph.relations[1].points);
  assert(graph.relations[4].points.length >= 4);
  for (const relation of graph.relations) {
    assert(relation.points.length >= 2);
    for (const [index, point] of relation.points.entries()) {
      assert(Number.isFinite(point.x) && Number.isFinite(point.y));
      const next = relation.points[index + 1];
      if (next) assert(point.x === next.x || point.y === next.y);
    }
    assert.equal(
      relation.label.lines.join(' '),
      input.relations.find(({ id }) => id === relation.id).graphLabel,
    );
  }
  assert(!JSON.stringify(graph).includes('$H'));
});

test('group-container offsets preserve cross-group, intra-group, and self-loop contacts', async () => {
  const { layoutInteractivePages, measure } = await selected();
  const input = page();
  input.groups = [
    { id: 'g-0', label: 'Source ownership', nodeIds: ['n-0'] },
    { id: 'g-1', label: 'Execution', nodeIds: ['n-1', 'n-2'] },
  ];
  const graph = (await layoutInteractivePages([input], measure)).layouts[0];
  assert.equal(graph.groups.length, 2);
  for (const group of graph.groups) {
    const members = input.groups.find(({ id }) => id === group.id).nodeIds;
    for (const id of members) {
      const node = graph.nodes.find((item) => item.id === id);
      assert(node.x >= group.x && node.y >= group.y);
      assert(node.x + node.width <= group.x + group.width);
      assert(node.y + node.height <= group.y + group.height);
    }
    assert(group.label.paintBox.x >= group.x + 8);
    assert(group.label.paintBox.y >= group.y + 8);
  }
  for (const relation of graph.relations) {
    for (const [id, point] of [
      [relation.source, relation.points[0]],
      [relation.target, relation.points.at(-1)],
    ]) {
      const node = graph.nodes.find((item) => item.id === id);
      assert(point.x >= node.x - 0.01 && point.x <= node.x + node.width + 0.01);
      assert(point.y >= node.y - 0.01 && point.y <= node.y + node.height + 0.01);
      assert(
        Math.min(
          Math.abs(point.x - node.x),
          Math.abs(point.x - node.x - node.width),
          Math.abs(point.y - node.y),
          Math.abs(point.y - node.y - node.height),
        ) < 0.01,
      );
    }
  }
});

test('the geometry owner measures all text and rejects unsupported or infeasible glyphs', async () => {
  const { layoutInteractivePages, measure } = await selected();
  await assert.rejects(layoutInteractivePages([page()]), {
    code: 'render_interactive_text_measurement_required',
  });
  for (const mutate of [
    (value) => {
      value.nodes[0].label = 'x'.repeat(200);
    },
    (value) => {
      value.nodes[0].label = 'missing 🦄 glyph';
    },
    (value) => {
      value.relations[0].graphLabel = 'x'.repeat(200);
    },
    (value) => {
      value.groups = [
        { id: 'g-0', label: 'x'.repeat(200), nodeIds: value.nodes.map(({ id }) => id) },
      ];
    },
  ]) {
    const input = page();
    mutate(input);
    await assert.rejects(layoutInteractivePages([input], measure), (error) =>
      ['render_interactive_text_infeasible', 'authored_canvas_glyph_missing'].includes(error.code),
    );
  }
  const input = page();
  input.nodes[0].label = 'Exact selected configuration ownership';
  const original = structuredClone(input);
  const graph = (await layoutInteractivePages([input], measure)).layouts[0];
  assert.deepEqual(input, original);
  assert.equal(graph.nodes[0].label.lines.join(' '), input.nodes[0].label);
  assert(graph.nodes[0].label.lines.length > 1);
});

test('invalid graph identities and incomplete group ownership fail before layout', async () => {
  const { layoutInteractivePages, measure } = await selected();
  for (const input of [null, [], {}, [null]])
    await assert.rejects(layoutInteractivePages(input, measure), {
      code: 'render_interactive_layout_invalid',
    });
  for (const mutate of [
    (value) => {
      value.nodes[0].label = ' ';
    },
    (value) => {
      value.nodes[1].id = value.nodes[0].id;
    },
    (value) => {
      value.relations[0].target = 'not-selected';
    },
    (value) => {
      value.relations.push({ ...value.relations[0] });
    },
  ]) {
    const input = page();
    mutate(input);
    await assert.rejects(layoutInteractivePages([input], measure), {
      code: 'render_interactive_layout_invalid',
    });
  }
  const input = page();
  input.groups = [{ id: 'g-0', label: 'Incomplete', nodeIds: ['n-0'] }];
  await assert.rejects(layoutInteractivePages([input], measure), {
    code: 'render_interactive_group_invalid',
  });
});

test('layout timeout and invalid worker output reclaim only the owned scratch and worker', async (t) => {
  const { layoutInteractivePages, measure } = await selected();
  const parent = path.resolve('build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const work = await fs.mkdtemp(path.join(parent, 'elk-lifetime-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  await assert.rejects(
    layoutInteractivePages([page()], measure, { temporaryDirectory: work, timeoutMs: 1 }),
    { code: 'render_interactive_layout_execution_timeout' },
  );
  assert.deepEqual(await fs.readdir(work), []);
  await assert.rejects(
    layoutInteractivePages([page()], measure, { temporaryDirectory: work, maximumBytes: 1 }),
    { code: 'render_interactive_layout_response_limit' },
  );
  assert.deepEqual(await fs.readdir(work), []);
});

test('the same geometry owner wraps a long causal chain into a complete balanced reading area', async () => {
  const { layoutInteractivePages, measure } = await selected();
  const input = {
    nodes: [
      'Operator',
      'Control',
      'Projection',
      'Native client',
      'Selected endpoint',
      'Observation',
      'Recovery',
    ].map((label, index) => ({ id: `n-${index}`, label })),
    relations: Array.from({ length: 6 }, (_, index) => ({
      id: `r-${index}`,
      source: `n-${index}`,
      target: `n-${index + 1}`,
      graphLabel: 'selects',
    })),
  };
  const original = structuredClone(input);
  const graph = (await layoutInteractivePages([input], measure)).layouts[0];
  assert(
    graph.bounds.width / graph.bounds.height > 1.1,
    'complete causal chains must not create a tall isolated side rail',
  );
  assert(graph.bounds.width < 1400 && graph.bounds.height < 760);
  assert.equal(graph.nodes.length, input.nodes.length);
  assert.equal(graph.relations.length, input.relations.length);
  assert.deepEqual(input, original);
});

test('readable desktop branching does not become a tall strip to fit an artificial slide', async () => {
  const { layoutInteractivePages, measure } = await selected();
  const input = {
    nodes: [
      'Admitted adapters',
      'AIGW',
      'Native client',
      'AIGW executable copy',
      'Native projection',
      'Guarded transaction',
    ].map((label, index) => ({ id: `n-${index}`, label })),
    relations: [
      ['n-1', 'n-0', 'dispatches'],
      ['n-1', 'n-5', 'commits-through'],
      ['n-4', 'n-2', 'configures'],
      ['n-0', 'n-4', 'applies'],
      ['n-5', 'n-3', 'guards'],
      ['n-5', 'n-4', 'guards'],
    ].map(([source, target, graphLabel], index) => ({
      id: `r-${index}`,
      source,
      target,
      graphLabel,
    })),
  };
  const original = structuredClone(input);
  const geometry = (await layoutInteractivePages([input], measure)).layouts[0];
  assert(
    geometry.bounds.width > geometry.bounds.height * 2,
    'a complete readable branching figure must use the available desktop width',
  );
  assert(geometry.bounds.height < 400, 'qualifiers must not inherit an unnecessary tall figure');
  assert.equal(geometry.nodes.length, 6);
  assert.equal(geometry.relations.length, 6);
  assert.deepEqual(input, original);
});

test('a bidirectional topology is not silently classified as an acyclic wrapping candidate', async () => {
  const { layoutInteractivePages, measure } = await selected();
  const input = {
    nodes: Array.from({ length: 6 }, (_, index) => ({ id: `n-${index}`, label: `Node ${index}` })),
    relations: Array.from({ length: 5 }, (_, index) => ({
      id: `r-${index}`,
      source: `n-${index}`,
      target: `n-${index + 1}`,
      direction: index === 0 ? 'bidirectional' : 'forward',
      graphLabel: 'selects',
    })),
  };
  const graph = (await layoutInteractivePages([input], measure)).layouts[0];
  assert.equal(graph.relations[0].direction, 'bidirectional');
  assert(
    graph.bounds.height > graph.bounds.width,
    'reverse topology prevents the DAG-only wrapping policy',
  );
});

test('resource, graph identity, group partition, and text bounds reject invalid requests', async () => {
  const { layoutInteractivePages, measure } = await selected();
  for (const options of [
    { timeoutMs: 0 },
    { timeoutMs: 25001 },
    { maximumBytes: 0 },
    { maximumBytes: 33 * 1024 * 1024 },
    { temporaryDirectory: 'relative' },
  ])
    await assert.rejects(layoutInteractivePages([page()], measure, options), {
      code: 'render_interactive_layout_execution_limit_invalid',
    });
  for (const mutate of [
    (p) => {
      p.nodes = null;
    },
    (p) => {
      p.relations = null;
    },
    (p) => {
      p.nodes = [];
    },
    (p) => {
      p.nodes[0].id = 'root';
    },
    (p) => {
      p.relations[0].id = '';
    },
    (p) => {
      p.relations[0].direction = 'reverse';
    },
    (p) => {
      p.nodes = Array.from({ length: 513 }, (_, i) => ({ id: String(i), label: 'Node' }));
    },
    (p) => {
      p.relations = Array(2049).fill(p.relations[0]);
    },
  ]) {
    const input = page();
    mutate(input);
    await assert.rejects(layoutInteractivePages([input], measure), {
      code: 'render_interactive_layout_invalid',
    });
  }
  for (const groups of [
    null,
    [],
    [{ id: 'root', label: 'Owner', nodeIds: ['n-0', 'n-1', 'n-2'] }],
    [{ id: 'g-0', label: 'Owner', nodeIds: ['n-0', 'n-0', 'n-1', 'n-2'] }],
    [{ id: 'g-0', label: 'Owner', nodeIds: ['n-0', 'n-1', 'absent'] }],
  ])
    await assert.rejects(layoutInteractivePages([{ ...page(), groups }], measure), {
      code: 'render_interactive_group_invalid',
    });
  for (const label of ['line\nbreak', 'x'.repeat(4097), Array(40).fill('selected').join(' ')]) {
    const input = page();
    input.relations[0].graphLabel = label;
    await assert.rejects(layoutInteractivePages([input], measure), {
      code: 'render_interactive_text_infeasible',
    });
  }
});
