import test from 'node:test';
import assert from 'node:assert/strict';
import { composeStaticOverview } from '../packages/publisher/renderers/svg/architecture.mjs';
import { composeStaticEditionSvg } from '../packages/publisher/renderers/svg/edition.mjs';
import * as groupedGeometry from '../packages/publisher/src/scene/static/architecture.mjs';
import { staticEditionScene } from './fixtures/static-edition-scene.mjs';

const { composeStaticArchitectureScene } = groupedGeometry;

function fixture() {
  return {
    document: {
      entities: Object.fromEntries(
        ['left', 'center', 'right', 'target'].map((id) => [id, { label: id, type: 'component' }]),
      ),
      relations: Object.fromEntries(
        ['left', 'center', 'right'].map((id) => [
          id,
          { subject: id, object: 'target', type: 'calls' },
        ]),
      ),
    },
    edition: {
      title: 'Converging calls',
      visualGrammar: {
        entityTypes: { component: 'backend' },
        relationTypes: { calls: { label: 'calls', variant: 'default' } },
      },
    },
    view: {
      label: 'Three distinct callers',
      groups: [
        { id: 'inputs', label: 'Callers', entities: ['left', 'center', 'right'] },
        { id: 'output', label: 'Target', entities: ['target'] },
      ],
      relations: ['left', 'center', 'right'].map((id) => ({
        id,
        fromSide: 'bottom',
        toSide: 'top',
        route: 'orthogonal-v',
      })),
    },
  };
}

function unlabeledGraph() {
  const { document, view } = fixture();
  return groupedGeometry.composeGroupedGeometry({
    nodes: Object.entries(document.entities).map(([id, entity]) => ({
      id,
      label: entity.label,
    })),
    groups: view.groups.map(({ id, label, entities }) => ({ id, label, members: entities })),
    relations: view.relations.map((relation) => ({
      ...relation,
      from: document.relations[relation.id].subject,
      to: document.relations[relation.id].object,
      text: '',
    })),
  });
}

test('converging relations retain distinct target ports and unmasked labels', () => {
  const { document, edition, view } = fixture();
  const svg = composeStaticOverview(document, edition, view).bytes.toString();
  const ends = [...svg.matchAll(/data-edge-to="target" d="([^"]+)"/g)].map((match) =>
    match[1].split(' L ').at(-1),
  );
  assert.equal(ends.length, 3);
  assert.equal(new Set(ends).size, 3);
  assert.doesNotMatch(svg, /data-edge-label="[^"]+"><rect/);
});

test('adjacent cross-group relations do not join at one bend', () => {
  const graph = groupedGeometry.composeGroupedGeometry({
    nodes: ['operator', 'control', 'guard', 'adapters', 'projection', 'client'].map((id) => ({
      id,
      label: id,
    })),
    groups: [
      { id: 'intent', label: 'Control intent', members: ['operator', 'control', 'guard'] },
      {
        id: 'configuration',
        label: 'Client configuration',
        members: ['adapters', 'projection', 'client'],
      },
    ],
    relations: [
      {
        id: 'dispatch',
        from: 'control',
        to: 'adapters',
        text: '',
        fromSide: 'bottom',
        toSide: 'top',
        route: 'orthogonal-v',
      },
      {
        id: 'guard',
        from: 'guard',
        to: 'projection',
        text: '',
        fromSide: 'bottom',
        toSide: 'top',
        route: 'orthogonal-v',
      },
    ],
  });
  const [intent, configuration] = graph.layout.groups;
  const dispatch = graph.routes.find(({ id }) => id === 'dispatch').points;
  const guard = graph.routes.find(({ id }) => id === 'guard').points;

  assert(dispatch[1][1] >= intent.y + intent.h + 8);
  assert(guard[1][1] <= configuration.y - 8);
  assert(guard[1][1] - dispatch[1][1] >= 20);
});

test('a single-node group does not inherit a three-node group frame', () => {
  const { layout } = unlabeledGraph();
  const groups = layout.groups;
  const target = groups.find(({ id }) => id === 'output');
  const callers = groups.find(({ id }) => id === 'inputs');
  const targetNode = layout.nodes.get('target');

  assert(target.w <= targetNode.w * 2 + 80);
  assert(target.w < callers.w);
});

test('an on-edge caption does not force a small group to inherit a wider group frame', () => {
  const { layout, routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ['first', 'second', 'third', 'target'].map((id) => ({ id, label: id })),
    groups: [
      { id: 'sources', label: 'Sources', members: ['first', 'second', 'third'] },
      { id: 'consumer', label: 'Consumer', members: ['target'] },
    ],
    relations: [
      {
        id: 'delivery',
        from: 'second',
        to: 'target',
        text: 'delivers to',
        fromSide: 'bottom',
        toSide: 'top',
        route: 'orthogonal-v',
      },
    ],
  });
  const [sources, consumer] = layout.groups;
  const target = layout.nodes.get('target');
  assert(consumer.w < sources.w);
  assert(consumer.w <= target.w + 80);
  assert(routes[0].labelBox);
});

test('group spacing leaves a readable heading without doubling node height', () => {
  const { layout } = unlabeledGraph();
  const callers = layout.groups.find(({ id }) => id === 'inputs');
  const node = layout.nodes.get('left');

  assert(callers.h <= node.h * 2);
  assert(node.y - callers.y >= 48);
  assert(callers.y + callers.h - node.y - node.h >= 20);
});

test('a dense corridor does not widen a later unrelated group gap', () => {
  const { layout } = groupedGeometry.composeGroupedGeometry({
    nodes: ['a', 'b', 'c', 'target', 'later'].map((id) => ({ id, label: id })),
    groups: [
      { id: 'inputs', label: 'Inputs', members: ['a', 'b', 'c'] },
      { id: 'output', label: 'Output', members: ['target'] },
      { id: 'later', label: 'Later', members: ['later'] },
    ],
    relations: ['a', 'b', 'c'].map((id) => ({
      id,
      from: id,
      to: 'target',
      text: '',
      fromSide: 'bottom',
      toSide: 'top',
      route: 'orthogonal-v',
    })),
  });
  const [inputs, output, later] = layout.groups;
  const denseGap = output.y - inputs.y - inputs.h;
  const quietGap = later.y - output.y - output.h;

  assert(denseGap > quietGap);
  assert(quietGap <= 62);
});

test('an on-graph label reserves only its own cross-group gap', () => {
  const { layout } = groupedGeometry.composeGroupedGeometry({
    nodes: ['source', 'target', 'later'].map((id) => ({ id, label: id })),
    groups: [
      { id: 'source-group', label: 'Source', members: ['source'] },
      { id: 'target-group', label: 'Target', members: ['target'] },
      { id: 'later-group', label: 'Later', members: ['later'] },
    ],
    relations: [
      {
        id: 'supplies',
        from: 'source',
        to: 'target',
        text: 'supplies',
        fromSide: 'bottom',
        toSide: 'top',
        route: 'straight',
      },
    ],
  });
  const [source, target, later] = layout.groups;
  const labeledGap = target.y - source.y - source.h;
  const quietGap = later.y - target.y - target.h;

  assert(labeledGap > quietGap);
  assert(quietGap <= 62);
});

test('an unavoidable cross-group edge crossing fails instead of merging routes', () => {
  assert.throws(
    () =>
      groupedGeometry.composeGroupedGeometry({
        nodes: ['a', 'b', 'x', 'y'].map((id) => ({ id, label: id })),
        groups: [
          { id: 'upper', label: 'Upper', members: ['a', 'b'] },
          { id: 'lower', label: 'Lower', members: ['x', 'y'] },
        ],
        relations: [
          {
            id: 'a-to-y',
            from: 'a',
            to: 'y',
            text: '',
            fromSide: 'bottom',
            toSide: 'top',
            route: 'orthogonal-v',
          },
          {
            id: 'b-to-x',
            from: 'b',
            to: 'x',
            text: '',
            fromSide: 'bottom',
            toSide: 'top',
            route: 'orthogonal-v',
          },
        ],
      }),
    { code: 'semantic_publication_static_route_crossing' },
  );
});

test('fan-out corridor order follows target ports rather than relation IDs', () => {
  const { routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ['source', 'left', 'middle', 'right'].map((id) => ({ id, label: id })),
    groups: [
      { id: 'source-group', label: 'Source', members: ['source'] },
      { id: 'targets', label: 'Targets', members: ['left', 'middle', 'right'] },
    ],
    relations: [
      { id: 'c', to: 'left' },
      { id: 'b', to: 'middle' },
      { id: 'a', to: 'right' },
    ].map(({ id, to }) => ({
      id,
      from: 'source',
      to,
      text: '',
      fromSide: 'bottom',
      toSide: 'top',
      route: 'orthogonal-v',
    })),
  });
  const bends = Object.fromEntries(routes.map(({ id, points }) => [id, points]));

  assert(bends.c[1][1] < bends.a[1][1]);
  assert.equal(bends.b.length, 2);
});

test('rightward fan-out selects a corridor order without crossing the adjacent port', () => {
  const { routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ['source', 'left-a', 'left-b', 'near', 'far'].map((id) => ({ id, label: id })),
    groups: [
      { id: 'source-group', label: 'Source', members: ['source'] },
      { id: 'targets', label: 'Targets', members: ['left-a', 'left-b', 'near', 'far'] },
    ],
    relations: ['near', 'far'].map((id) => ({
      id,
      from: 'source',
      to: id,
      text: 'realized by',
      fromSide: 'bottom',
      toSide: 'top',
      route: 'orthogonal-v',
    })),
  });

  assert.equal(routes.length, 2);
  assert(routes.every(({ points }) => points.length === 4));
  assert(routes.every(({ labelBox }) => labelBox?.w > 0));
});

test('a singleton group admits its heading beside three incoming ports', () => {
  const ids = ['a', 'b', 'c', 'target'];
  const { layout, routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ids.map((id) => ({ id, label: id })),
    groups: [
      { id: 'sources', label: 'Sources', members: ids.slice(0, 3) },
      { id: 'target', label: 'Desired-state coordination', members: ['target'] },
    ],
    relations: ids.slice(0, 3).map((id) => ({
      id,
      from: id,
      to: 'target',
      text: '',
      fromSide: 'bottom',
      toSide: 'top',
      route: 'orthogonal-v',
    })),
  });
  const scene = staticEditionScene();
  const { namespace, sha256, origin } = scene.nodes[0];
  scene.nodes = [...layout.nodes].map(([id, box]) => ({
    namespace,
    id,
    sha256,
    origin,
    kind: 'component',
    label: id,
    x: box.x,
    y: box.y,
    width: box.w,
    height: box.h,
  }));
  scene.groups = layout.groups.map(({ x, y, w, h, ...group }) => ({
    ...group,
    x,
    y,
    width: w,
    height: h,
  }));
  scene.edges = routes.map(({ id, from, to, points }) => ({
    from: { namespace, id: from },
    to: { namespace, id: to },
    relations: [
      {
        namespace,
        reference: `relation:${id}`,
        sha256,
        label: 'calls',
        kind: null,
        direction: 'forward',
        origin,
      },
    ],
    points,
  }));
  scene.sourceAssertionCarriers[0].nodeRefs = ids.map((id) => ({ namespace, id }));
  scene.sourceAssertionCarriers[0].relationRefs = routes.map(({ id }) => ({
    namespace,
    reference: `relation:${id}`,
    sha256,
  }));
  scene.bounds = {
    x: layout.groups[0].x,
    y: layout.groups[0].y,
    width: layout.groups[0].w,
    height: layout.groups[1].y + layout.groups[1].h - layout.groups[0].y,
  };

  assert.doesNotThrow(() => composeStaticEditionSvg(scene, { fragment: true }));
});

test('an upward adjacent relation bends between groups rather than through a heading', () => {
  const { layout, routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ['upper', 'peer', 'lower'].map((id) => ({ id, label: id })),
    groups: [
      { id: 'first', label: 'First', members: ['upper', 'peer'] },
      { id: 'second', label: 'Second', members: ['lower'] },
    ],
    relations: [
      {
        id: 'return',
        from: 'lower',
        to: 'upper',
        text: '',
        fromSide: 'top',
        toSide: 'bottom',
        route: 'orthogonal-v',
      },
    ],
  });
  const [upper, lower] = layout.groups;
  const points = routes[0].points;

  assert(points[0][1] > points.at(-1)[1]);
  assert(points[1][1] >= upper.y + upper.h + 8);
  assert(points[1][1] <= lower.y - 8);
});

test('opposing straight relations retain separate source and target ports', () => {
  const { routes } = groupedGeometry.composeGroupedGeometry({
    nodes: ['left', 'right'].map((id) => ({ id, label: id })),
    groups: [{ id: 'peers', label: 'Peers', members: ['left', 'right'] }],
    relations: [
      {
        id: 'forward',
        from: 'left',
        to: 'right',
        text: '',
        fromSide: 'right',
        toSide: 'left',
        route: 'straight',
      },
      {
        id: 'backward',
        from: 'right',
        to: 'left',
        text: '',
        fromSide: 'left',
        toSide: 'right',
        route: 'straight',
      },
    ],
  });

  assert.notDeepEqual(routes[0].points, routes[1].points);
  assert(Math.abs(routes[0].points[0][1] - routes[1].points[0][1]) >= 20);
});

test('a relation through an unrelated node is rejected before publication', () => {
  const { document, edition } = fixture();
  document.relations = { skip: { subject: 'left', object: 'right', type: 'calls' } };
  const view = {
    label: 'Invalid skipped neighbor',
    groups: [{ id: 'row', label: 'Peers', entities: ['left', 'center', 'right'] }],
    relations: [{ id: 'skip', fromSide: 'right', toSide: 'left', route: 'straight' }],
  };
  assert.throws(() => composeStaticOverview(document, edition, view), {
    code: 'semantic_publication_static_route_infeasible',
  });
});

test('SVG renderer owns its supported visual-role vocabulary', () => {
  const { document, edition, view } = fixture();
  edition.visualGrammar.entityTypes.component = 'brand-primary';
  assert.throws(() => composeStaticOverview(document, edition, view), {
    code: 'render_scene_visual_role_unsupported',
  });

  edition.visualGrammar.entityTypes.component = 'backend';
  edition.visualGrammar.relationTypes.calls.variant = 'ambient';
  assert.throws(() => composeStaticOverview(document, edition, view), {
    code: 'render_scene_edge_role_unsupported',
  });
});

test('one neutral grouped geometry owner preserves the legacy route result', () => {
  assert.equal(typeof groupedGeometry.composeGroupedGeometry, 'function');
  const { document, edition, view } = fixture();
  const selected = groupedGeometry.composeGroupedGeometry({
    nodes: Object.entries(document.entities).map(([id, entity]) => ({
      id,
      label: entity.label,
    })),
    groups: view.groups.map(({ id, label, entities }) => ({ id, label, members: entities })),
    relations: view.relations.map((authored) => {
      const relation = document.relations[authored.id];
      return {
        ...authored,
        from: relation.subject,
        to: relation.object,
        text: edition.visualGrammar.relationTypes[relation.type].label,
      };
    }),
  });
  const incumbent = composeStaticArchitectureScene(document, edition, view);
  assert.equal(selected.layout.width, incumbent.layout.width);
  assert.equal(selected.layout.height, incumbent.layout.height);
  assert.deepEqual([...selected.layout.nodes], [...incumbent.layout.nodes]);
  assert.deepEqual(
    selected.routes.map(({ id, points, label }) => ({ id, points, label })),
    incumbent.routes.map(({ authored, points, label }) => ({
      id: authored.id,
      points,
      label,
    })),
  );
});

test('the legacy scene still rejects an empty relation label', () => {
  const { document, edition, view } = fixture();
  edition.visualGrammar.relationTypes.calls.label = '';
  assert.throws(() => composeStaticArchitectureScene(document, edition, view), {
    code: 'grouped_geometry_input_invalid',
  });
});

test('neutral groups bind source-qualified node identities exactly once', () => {
  const left = JSON.stringify(['source-a', 'shared']);
  const right = JSON.stringify(['source-b', 'shared']);
  const graph = {
    nodes: [
      { id: left, label: 'First' },
      { id: right, label: 'Second' },
    ],
    groups: [
      { id: 'first', label: 'First source', members: [left] },
      { id: 'second', label: 'Second source', members: [right] },
    ],
    relations: [
      {
        id: 'edge',
        from: left,
        to: right,
        text: 'calls',
        fromSide: 'bottom',
        toSide: 'top',
        route: 'orthogonal-v',
      },
    ],
  };
  const selected = groupedGeometry.composeGroupedGeometry(graph);
  assert.equal(selected.layout.nodes.size, 2);
  assert.equal(selected.routes.length, 1);
  assert.throws(
    () =>
      groupedGeometry.composeGroupedGeometry({
        ...graph,
        groups: [{ ...graph.groups[0], members: [left, right] }, graph.groups[1]],
      }),
    { code: 'grouped_geometry_input_invalid' },
  );
  assert.throws(
    () => groupedGeometry.composeGroupedGeometry({ ...graph, groups: [graph.groups[0]] }),
    { code: 'grouped_geometry_input_invalid' },
  );
});

test('the neutral owner does not narrow admitted v1 group counts', () => {
  const groups = Array.from({ length: 17 }, (_, index) => ({
    id: `group-${index}`,
    label: `Group ${index}`,
    members: Array.from({ length: 8 }, (_, member) => `node-${index}-${member}`),
  }));
  const selected = groupedGeometry.composeGroupedGeometry({
    nodes: groups.flatMap(({ members }) => members.map((id) => ({ id, label: id }))),
    groups,
    relations: [],
  });
  assert.equal(selected.layout.nodes.size, 136);
  assert.equal(selected.layout.groups.length, 17);
});

test('measured node and edge captions fit a three-member group without excess horizontal padding', () => {
  const selected = groupedGeometry.composeGroupedGeometry({
    nodes: [
      { id: 'artifact', label: 'Signed local artifact' },
      { id: 'peer', label: 'External forge peer' },
      { id: 'installed', label: 'Installed product copy' },
    ],
    groups: [
      {
        id: 'distribution',
        label: 'Distribution',
        members: ['artifact', 'peer', 'installed'],
      },
    ],
    relations: [
      {
        id: 'published',
        from: 'artifact',
        to: 'peer',
        text: 'publishes asset to',
        fromSide: 'right',
        toSide: 'left',
        route: 'straight',
      },
      {
        id: 'installed',
        from: 'peer',
        to: 'installed',
        text: 'installs as',
        fromSide: 'right',
        toSide: 'left',
        route: 'straight',
      },
    ],
  });
  assert(selected.layout.width <= 1300);
  assert(selected.routes.every(({ label, labelBox }) => label && labelBox));
});
