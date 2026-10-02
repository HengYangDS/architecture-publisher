import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeInteractiveGeometry } from '../packages/publisher/renderers/elk/normalize.mjs';
import { measuredLabel, wrappedLabelRequests } from '../packages/publisher/renderers/elk/text.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { auditInteractiveGeometry } from '../packages/publisher/renderers/elk/audit.mjs';

async function groupFixture() {
  const measure = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...wrappedLabelRequests('Member'),
    ...wrappedLabelRequests('Owner'),
  ]);
  const nodeLabel = measuredLabel('Member', measure);
  const groupLabel = measuredLabel('Owner', measure);
  const prepared = {
    nodes: [{ id: 'n-0', groupId: 'g-0', width: 170, height: 64, label: nodeLabel }],
    groups: [{ id: 'g-0', nodeIds: ['n-0'], label: groupLabel }],
    relations: [],
  };
  const raw = {
    id: 'root',
    width: 700,
    height: 220,
    children: [
      {
        id: 'g-0',
        x: 24,
        y: 24,
        width: 240,
        height: 172,
        labels: [
          {
            id: 'g-0-label',
            text: 'Owner',
            x: 16,
            y: 5,
            width: groupLabel.width,
            height: groupLabel.height,
          },
        ],
        children: [
          {
            id: 'n-0',
            x: 24,
            y: 80,
            width: 170,
            height: 64,
            labels: [
              {
                id: 'n-0-label',
                text: 'Member',
                x: (170 - nodeLabel.width) / 2,
                y: (64 - nodeLabel.height) / 2,
                width: nodeLabel.width,
                height: nodeLabel.height,
              },
            ],
          },
        ],
      },
    ],
  };
  return { prepared, raw };
}

test('a group member cannot escape its selected owner even while remaining inside the canvas', async () => {
  const { prepared, raw } = await groupFixture();
  assert.doesNotThrow(() => normalizeInteractiveGeometry(raw, prepared));
  raw.children[0].children[0].x = 350;
  assert.throws(() => normalizeInteractiveGeometry(raw, prepared), {
    code: 'render_interactive_layout_response_invalid',
  });
});

test('missing, ambiguous, and non-finite group coordinates fail instead of being repaired', async () => {
  const fixture = await groupFixture();
  for (const mutate of [
    (raw) => {
      raw.id = 'other';
    },
    (raw) => {
      raw.width = Infinity;
    },
    (raw) => {
      raw.children[0].x = NaN;
    },
    (raw) => {
      raw.children[0].labels[0].text = 'Other';
    },
    (raw) => {
      raw.children[0].children[0].width = 169;
    },
    (raw) => {
      raw.children[0].children[0].labels = [];
    },
    (raw) => {
      raw.children[0].children = [];
    },
    (raw) => {
      raw.children.push(structuredClone(raw.children[0]));
    },
    (raw) => {
      raw.children[0].children[0].edges = [];
    },
  ]) {
    const raw = structuredClone(fixture.raw);
    mutate(raw);
    assert.throws(() => normalizeInteractiveGeometry(raw, fixture.prepared), {
      code: 'render_interactive_layout_response_invalid',
    });
  }
});

test('the complete arrow envelope must clear the canvas, not only its route stroke', async () => {
  const measure = await createBundledTextMeasurer(
    await loadBundledFonts(),
    wrappedLabelRequests('Node'),
  );
  const plan = measuredLabel('Node', measure);
  const label = (x, y) => ({
    baselines: [{ box: { x: x + 40, y: y + 25, width: 42, height: 15 } }],
    width: plan.width,
    height: plan.height,
  });
  const graph = {
    bounds: { width: 700, height: 150 },
    groups: [],
    nodes: [
      { id: 'n-0', x: 50, y: 2, width: 170, height: 64, label: label(50, 2) },
      { id: 'n-1', x: 450, y: 2, width: 170, height: 64, label: label(450, 2) },
    ],
    relations: [
      {
        id: 'r-0',
        source: 'n-0',
        target: 'n-1',
        direction: 'forward',
        points: [
          { x: 220, y: 3 },
          { x: 450, y: 3 },
        ],
        label: null,
      },
    ],
  };
  assert.throws(() => auditInteractiveGeometry(graph), {
    code: 'render_interactive_layout_infeasible',
  });
});

test('uniform subpixel canonicalization preserves an engine-orthogonal route despite floating-point noise', async () => {
  const { raw, prepared } = await groupFixture();
  raw.children[0].children.push({
    ...structuredClone(raw.children[0].children[0]),
    id: 'n-1',
    x: 250,
  });
  raw.children[0].width = 460;
  prepared.nodes.push({ ...prepared.nodes[0], id: 'n-1' });
  prepared.groups[0].nodeIds.push('n-1');
  prepared.relations.push({
    id: 'r-0',
    source: 'n-0',
    target: 'n-1',
    direction: 'forward',
    label: null,
  });
  raw.edges = [
    {
      id: 'r-0',
      container: 'g-0',
      sources: ['n-0'],
      targets: ['n-1'],
      sections: [
        {
          id: 'r-0-section',
          startPoint: { x: 194, y: 112 },
          endPoint: { x: 250, y: 111.99999999999997 },
          incomingShape: 'n-0',
          outgoingShape: 'n-1',
        },
      ],
    },
  ];
  const graph = normalizeInteractiveGeometry(raw, prepared);
  assert.equal(graph.relations[0].points[0].y, graph.relations[0].points[1].y);
  assert.equal(graph.relations[0].points[0].x, graph.nodes[0].x + graph.nodes[0].width);
});

test('a normalized route cannot have missing sections, foreign containers, invented endpoints, or diagonal segments', async () => {
  const fixture = await groupFixture();
  const base = structuredClone(fixture.raw);
  const prepared = structuredClone(fixture.prepared);
  base.children[0].children.push({
    ...structuredClone(base.children[0].children[0]),
    id: 'n-1',
    x: 250,
  });
  base.children[0].width = 460;
  prepared.nodes.push({ ...prepared.nodes[0], id: 'n-1' });
  prepared.groups[0].nodeIds.push('n-1');
  prepared.relations.push({
    id: 'r-0',
    source: 'n-0',
    target: 'n-1',
    direction: 'forward',
    label: null,
  });
  base.edges = [
    {
      id: 'r-0',
      container: 'g-0',
      sources: ['n-0'],
      targets: ['n-1'],
      sections: [
        {
          id: 'r-0-section',
          startPoint: { x: 194, y: 112 },
          endPoint: { x: 250, y: 112 },
          incomingShape: 'n-0',
          outgoingShape: 'n-1',
        },
      ],
    },
  ];
  assert.doesNotThrow(() => normalizeInteractiveGeometry(base, prepared));
  for (const mutate of [
    (raw) => {
      raw.edges = [null];
    },
    (raw) => {
      raw.edges[0].container = 'n-0';
    },
    (raw) => {
      raw.edges[0].container = 'missing';
    },
    (raw) => {
      raw.edges[0].sources = ['n-1'];
    },
    (raw) => {
      raw.edges[0].targets = [];
    },
    (raw) => {
      raw.edges[0].sections = [];
    },
    (raw) => {
      raw.edges[0].sections = [null];
    },
    (raw) => {
      raw.edges[0].sections[0].incomingShape = 'n-1';
    },
    (raw) => {
      raw.edges[0].sections[0].outgoingSections = [];
    },
    (raw) => {
      raw.edges[0].sections[0].bendPoints = null;
    },
    (raw) => {
      raw.edges[0].sections[0].endPoint.x = Infinity;
    },
    (raw) => {
      raw.edges[0].sections[0].endPoint.y = 113;
    },
    (raw) => {
      raw.edges[0].sections[0].bendPoints = [{ x: 194, y: 112 }];
    },
    (raw) => {
      raw.edges[0].labels = [{ text: 'unselected' }];
    },
  ]) {
    const raw = structuredClone(base);
    mutate(raw);
    assert.throws(() => normalizeInteractiveGeometry(raw, prepared), {
      code: 'render_interactive_layout_response_invalid',
    });
  }
});
