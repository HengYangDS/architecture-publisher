import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutStaticGraph } from '../packages/publisher/renderers/dagre/layout.mjs';
import { composeDagreStaticGeometry } from '../packages/publisher/renderers/dagre/static.mjs';

function chain() {
  const ids = ['intent', 'coordinate', 'admit', 'guard', 'client'];
  return {
    nodes: ids.map((id) => ({ id, label: id })),
    groups: ids.map((id) => ({ id: `${id}-group`, label: id, members: [id] })),
    relations: ids.slice(1).map((id, index) => ({
      id: `edge-${index}`,
      from: ids[index],
      to: id,
      text: '',
    })),
  };
}

test('source groups follow a compact causal reading path without losing members or relations', async () => {
  const input = chain();
  const result = await composeDagreStaticGeometry(input);

  assert(result.layout.height < result.layout.width);
  assert.deepEqual(
    result.layout.groups.map(({ id }) => id),
    input.groups.map(({ id }) => id),
  );
  assert.deepEqual(
    result.routes.map(({ id }) => id),
    input.relations.map(({ id }) => id),
  );
  assert.equal(result.layout.nodes.size, input.nodes.length);
  assert.deepEqual(await composeDagreStaticGeometry(input), result);
});

test('flat structural geometry preserves selected members without inventing a group', async () => {
  const input = { ...chain(), groups: [] };
  const result = await composeDagreStaticGeometry(input);

  assert.equal(result.layout.nodes.size, input.nodes.length);
  assert.deepEqual(result.layout.groups, []);
  assert.equal(result.layout.groupPresentation, undefined);
  assert.deepEqual(
    result.routes.map(({ id }) => id),
    input.relations.map(({ id }) => id),
  );
});

test('peer node boxes use one measured size and align on their shared rank', async () => {
  const input = {
    nodes: [
      { id: 'cli', label: 'CLI' },
      { id: 'configuration', label: 'Configuration' },
      { id: 'discovery', label: 'Native discovery' },
      { id: 'synchronizer', label: 'Synchronizer' },
    ],
    groups: [],
    relations: ['cli', 'configuration', 'discovery'].map((from) => ({
      id: `to-${from}`,
      from,
      to: 'synchronizer',
      text: '',
    })),
  };
  const result = await composeDagreStaticGeometry(input);
  const boxes = [...result.layout.nodes.values()];
  assert.equal(new Set(boxes.map(({ w }) => w)).size, 1);
  assert.equal(new Set(boxes.map(({ h }) => h)).size, 1);
  assert.equal(boxes[0].w % 32, 0);
  assert.equal(boxes[0].h % 32, 0);
  assert.equal(result.layout.nodes.get('cli').x, result.layout.nodes.get('configuration').x);
  assert.equal(result.layout.nodes.get('cli').x, result.layout.nodes.get('discovery').x);

  const longLabel = 'Native discovery across distributed hosts';
  const widened = await composeDagreStaticGeometry({
    ...input,
    nodes: input.nodes.map((node) =>
      node.id === 'discovery' ? { ...node, label: longLabel } : node,
    ),
  });
  const widenedWidths = [...widened.layout.nodes.values()].map(({ w }) => w);
  assert.equal(new Set(widenedWidths).size, 1);
  assert(widenedWidths[0] > boxes[0].w);
  assert(widenedWidths[0] >= [...longLabel].length * 9.76 + 32);
});

test('branching structural geometry follows a shared row grid instead of half rows', async () => {
  const ids = [
    'input-a',
    'input-b',
    'input-c',
    'authority',
    'coordinator',
    'registry',
    'contract',
    'guard',
    'sink-a',
    'sink-b',
    'sink-c',
    'sink-d',
  ];
  const links = [
    ['input-a', 'coordinator'],
    ['input-b', 'coordinator'],
    ['input-c', 'coordinator'],
    ['coordinator', 'registry'],
    ['registry', 'contract'],
    ['authority', 'contract'],
    ['contract', 'guard'],
    ...['sink-a', 'sink-b', 'sink-c', 'sink-d'].map((sink) => ['contract', sink]),
  ];
  const result = await composeDagreStaticGeometry({
    nodes: ids.map((id) => ({ id, label: id })),
    groups: [],
    relations: links.map(([from, to], index) => ({
      id: `edge-${index}`,
      from,
      to,
      text: 'relation',
    })),
  });
  const rows = [...result.layout.nodes.values()].map(({ y }) => y);
  const first = Math.min(...rows);
  for (const y of rows) assert.equal((y - first) % 128, 0);
  assert.equal(result.layout.nodes.get('coordinator').y, result.layout.nodes.get('registry').y);
  assert.equal(result.layout.nodes.get('registry').y, result.layout.nodes.get('contract').y);
});

test('source labels remain data and cannot create extra graphic members', async () => {
  const input = chain();
  input.nodes[0].label = 'Intent"; forged -> client; //';
  const result = await composeDagreStaticGeometry(input);

  assert.equal(result.layout.nodes.size, input.nodes.length);
  assert.equal(result.routes.length, input.relations.length);
});

test('a long editorial group label does not widen its member geometry', async () => {
  const result = await composeDagreStaticGeometry({
    nodes: [{ id: 'core', label: 'Core' }],
    groups: [{ id: 'coordination', label: 'Desired-state coordination', members: ['core'] }],
    relations: [],
  });
  const group = result.layout.groups[0];
  const node = result.layout.nodes.get('core');

  assert.equal(result.layout.groupPresentation, 'key');
  assert.equal(group.label, 'Desired-state coordination');
  assert.equal(group.caption, undefined);
  assert(group.w <= node.w + 40);
});

test('a fan-out stays compact when source groups cross graph ranks', async () => {
  const ids = [
    'input-a',
    'input-b',
    'coordinator',
    'registry',
    'credentials',
    'contract',
    'guard',
    'client-a',
    'client-b',
    'client-c',
  ];
  const groups = [
    ['intent', ids.slice(0, 2)],
    ['coordination', ['coordinator']],
    ['admission', ['registry', 'credentials']],
    ['safety', ['contract', 'guard']],
    ['clients', ids.slice(7)],
  ].map(([id, members]) => ({ id, label: id, members }));
  const links = [
    ['input-a', 'coordinator'],
    ['input-b', 'coordinator'],
    ['coordinator', 'registry'],
    ['registry', 'contract'],
    ['credentials', 'contract'],
    ['contract', 'guard'],
    ...ids.slice(7).map((id) => ['contract', id]),
  ];
  const result = await composeDagreStaticGeometry({
    nodes: ids.map((id) => ({ id, label: id })),
    groups,
    relations: links.map(([from, to], index) => ({ id: `r${index}`, from, to, text: '' })),
  });

  const placed = [...result.layout.nodes.values()];
  const width =
    Math.max(...placed.map(({ x, w }) => x + w)) - Math.min(...placed.map(({ x }) => x));
  const height =
    Math.max(...placed.map(({ y, h }) => y + h)) - Math.min(...placed.map(({ y }) => y));
  assert(height / width < 0.5);
  for (const group of result.layout.groups)
    for (const id of group.members) {
      const node = result.layout.nodes.get(id);
      assert(node.x >= group.x && node.x + node.w <= group.x + group.w);
      assert(node.y >= group.y && node.y + node.h <= group.y + group.h);
    }
});

test('a converging relation caption never sits on either visible route', async () => {
  const result = await composeDagreStaticGeometry({
    nodes: ['object', 'asset', 'forge'].map((id) => ({ id, label: id })),
    groups: [
      { id: 'distribution', label: 'Distribution', members: ['object', 'asset'] },
      { id: 'peer', label: 'External peer', members: ['forge'] },
    ],
    relations: [
      { id: 'object-forge', from: 'object', to: 'forge', text: 'projects object to' },
      { id: 'asset-forge', from: 'asset', to: 'forge', text: 'publishes asset to' },
    ],
  });

  const hits = (a, b, box) => {
    let lower = 0;
    let upper = 1;
    for (const [axis, minimum, maximum] of [
      [0, box.x, box.x + box.w],
      [1, box.y, box.y + box.h],
    ]) {
      const delta = b[axis] - a[axis];
      if (delta === 0) {
        if (a[axis] < minimum || a[axis] > maximum) return false;
      } else {
        const first = (minimum - a[axis]) / delta;
        const last = (maximum - a[axis]) / delta;
        lower = Math.max(lower, Math.min(first, last));
        upper = Math.min(upper, Math.max(first, last));
        if (lower > upper) return false;
      }
    }
    return true;
  };
  for (const route of result.routes)
    for (const path of result.routes)
      for (const [index, end] of path.points.slice(1).entries())
        assert(!hits(path.points[index], end, route.labelBox), `${path.id} crosses ${route.id}`);
});

test('a delivery fork keeps every caption clear of the converging asset route', async () => {
  const ids = ['signed-object', 'forge', 'release-asset', 'installed-product', 'recovery'];
  const labels = [
    'Signed local object',
    'Forge peer',
    'Release asset',
    'Installed product',
    'Rollback and recovery',
  ];
  const relations = [
    ['object-forge', 'signed-object', 'forge', 'projects object to'],
    ['asset-forge', 'release-asset', 'forge', 'publishes asset to'],
    ['asset-installation', 'release-asset', 'installed-product', 'installs as'],
    ['installation-recovery', 'installed-product', 'recovery', 'recovers via'],
  ];
  const result = await composeDagreStaticGeometry({
    nodes: ids.map((id, index) => ({ id, label: labels[index] })),
    groups: [
      { id: 'distribution', label: 'Distribution', members: ids.slice(0, 3) },
      { id: 'installation', label: 'Installation and recovery', members: ids.slice(3) },
    ],
    relations: relations.map(([id, from, to, text]) => ({ id, from, to, text })),
  });

  assert.equal(result.routes.length, relations.length);
  for (const route of result.routes) {
    assert(route.labelBox, `${route.id} has a visible caption`);
    for (const path of result.routes)
      for (const [index, end] of path.points.slice(1).entries()) {
        const start = path.points[index];
        const box = route.labelBox;
        const crosses = (() => {
          let lower = 0;
          let upper = 1;
          for (const [axis, minimum, maximum] of [
            [0, box.x, box.x + box.w],
            [1, box.y, box.y + box.h],
          ]) {
            const delta = end[axis] - start[axis];
            if (delta === 0) {
              if (start[axis] < minimum || start[axis] > maximum) return false;
              continue;
            }
            const first = (minimum - start[axis]) / delta;
            const last = (maximum - start[axis]) / delta;
            lower = Math.max(lower, Math.min(first, last));
            upper = Math.min(upper, Math.max(first, last));
            if (lower > upper) return false;
          }
          return true;
        })();
        assert(!crosses, `${path.id} crosses ${route.id}`);
      }
  }
});

test('a wide fan-out keeps exact editorial memberships even when geometry interleaves them', async () => {
  const ids = [
    'cli',
    'configuration',
    'discovery',
    'synchronizer',
    'credentials',
    'registry',
    'contract',
    'transaction',
    'client-a',
    'client-b',
    'client-c',
    'client-d',
  ];
  const labels = [
    'CLI',
    'Configuration',
    'Native discovery',
    'Synchronizer',
    'Credential store',
    'Client registry',
    'Adapter contract',
    'Guarded transaction',
    'Client A',
    'Client B',
    'Client C',
    'Client D',
  ];
  const links = [
    ['cli', 'synchronizer', 'delegates'],
    ['configuration', 'synchronizer', 'configures'],
    ['discovery', 'synchronizer', 'reports to'],
    ['credentials', 'contract', 'supplies credentials'],
    ['synchronizer', 'registry', 'delegates'],
    ['registry', 'contract', 'dispatches'],
    ['contract', 'transaction', 'guards'],
    ...ids.slice(8).map((id) => ['contract', id, 'realized by']),
  ];
  const result = await composeDagreStaticGeometry({
    nodes: ids.map((id, index) => ({ id, label: labels[index] })),
    groups: [
      { id: 'intent', label: 'Operator intent and host state', members: ids.slice(0, 3) },
      { id: 'coordination', label: 'Desired-state coordination', members: ['synchronizer'] },
      { id: 'admission', label: 'Credential and client admission', members: ids.slice(4, 6) },
      {
        id: 'safety',
        label: 'Adapter contract and transaction',
        members: ['contract', 'transaction'],
      },
      { id: 'clients', label: 'Client integration surfaces', members: ids.slice(8) },
    ],
    relations: links.map(([from, to, text], index) => ({ id: `r${index}`, from, to, text })),
  });
  assert.equal(result.layout.groupPresentation, 'key');
  assert.deepEqual(result.layout.groups.find(({ id }) => id === 'safety').members, [
    'contract',
    'transaction',
  ]);
  assert.deepEqual(result.layout.groups.find(({ id }) => id === 'clients').members, ids.slice(8));
  assert(result.layout.groups.every((group) => group.caption === undefined));
});

test('grouped geometry rejects malformed source membership before requesting coordinates', async () => {
  const input = chain();
  const invalid = [
    null,
    { ...input, nodes: [...input.nodes, input.nodes[0]] },
    { ...input, groups: [{ ...input.groups[0], label: '' }, ...input.groups.slice(1)] },
    {
      ...input,
      groups: [{ ...input.groups[0], members: ['missing'] }, ...input.groups.slice(1)],
    },
    { ...input, groups: input.groups.slice(0, -1) },
    { ...input, relations: [{ ...input.relations[0], to: 'missing' }] },
  ];
  for (const item of invalid)
    await assert.rejects(composeDagreStaticGeometry(item), {
      code: 'static_dagre_input_invalid',
    });
});

test('a long editorial group label remains data for a separately measured key', async () => {
  const label = 'Heading '.repeat(8).trim();
  const result = await composeDagreStaticGeometry({
    nodes: [{ id: 'core', label: 'Core' }],
    groups: [{ id: 'core-group', label, members: ['core'] }],
    relations: [],
  });

  assert.equal(result.layout.groups[0].label, label);
  assert(result.layout.groups[0].w < [...label].length * 14 * 0.61);
});

test('the selected Dagre adapter refuses invalid flat nodes and relations', async () => {
  const base = { nodes: [{ id: 'core', width: 150, height: 92 }], relations: [] };
  for (const item of [
    null,
    { ...base, nodes: [...base.nodes, base.nodes[0]] },
    {
      ...base,
      relations: [{ id: 'missing', source: 'core', target: 'other', width: 0, height: 0 }],
    },
  ])
    await assert.rejects(layoutStaticGraph(item), { code: 'render_static_layout_invalid' });
});
