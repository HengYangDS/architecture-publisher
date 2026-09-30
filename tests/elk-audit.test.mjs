import assert from 'node:assert/strict';
import test from 'node:test';
import { auditInteractiveGeometry } from '../packages/publisher/renderers/elk/audit.mjs';

const label = (x, y) => ({ baselines: [{ box: { x, y, width: 50, height: 16 } }] });
function graph() {
  return {
    bounds: { width: 800, height: 300 },
    groups: [],
    nodes: [
      { id: 'n-0', groupId: null, x: 50, y: 100, width: 170, height: 64, label: label(90, 123) },
      { id: 'n-1', groupId: null, x: 550, y: 100, width: 170, height: 64, label: label(590, 123) },
    ],
    relations: [
      {
        id: 'r-0',
        source: 'n-0',
        target: 'n-1',
        direction: 'forward',
        points: [
          { x: 220, y: 132 },
          { x: 550, y: 132 },
        ],
        label: label(320, 151),
      },
    ],
  };
}

test('each measured paint failure rejects an invalid composition before SVG output', () => {
  assert.doesNotThrow(() => auditInteractiveGeometry(graph()));
  const cases = [
    [
      'node-bounds',
      (g) => {
        g.nodes[0].x = 0;
      },
    ],
    [
      'text-containment',
      (g) => {
        g.nodes[0].label.baselines[0].box.x = 51;
      },
    ],
    [
      'node-collision',
      (g) => {
        g.nodes[1].x = 200;
        g.nodes[1].label = label(240, 123);
      },
    ],
    [
      'label-bounds',
      (g) => {
        g.relations[0].label = label(790, 151);
      },
    ],
    [
      'text-collision',
      (g) => {
        g.relations[0].label = label(90, 123);
      },
    ],
    [
      'label-node-collision',
      (g) => {
        g.relations[0].label = label(55, 147);
      },
    ],
    [
      'detached-terminal',
      (g) => {
        g.relations[0].points[1].x = 530;
      },
    ],
    [
      'short-terminal',
      (g) => {
        g.relations[0].points.splice(1, 0, { x: 545, y: 132 });
      },
    ],
    [
      'route-bounds',
      (g) => {
        g.relations[0].points = [
          { x: 220, y: 132 },
          { x: 800, y: 132 },
          { x: 800, y: 150 },
          { x: 550, y: 150 },
        ];
      },
    ],
    [
      'route-text-collision',
      (g) => {
        g.relations[0].label = label(320, 132);
      },
    ],
    [
      'route-node-collision',
      (g) => {
        g.nodes.push({
          id: 'n-2',
          groupId: null,
          x: 300,
          y: 110,
          width: 170,
          height: 64,
          label: label(340, 148),
        });
        g.relations[0].label = null;
      },
    ],
    [
      'arrow-text-collision',
      (g) => {
        g.relations[0].label = label(538, 123.5);
        g.relations[0].label.baselines[0].box.width = 2;
        g.relations[0].label.baselines[0].box.height = 1;
      },
    ],
    [
      'arrow-node-collision',
      (g) => {
        g.nodes.push({
          id: 'n-2',
          groupId: null,
          x: 582.5,
          y: 60,
          width: 170,
          height: 32,
          label: label(622.5, 68),
        });
        g.relations[0].points = [
          { x: 220, y: 132 },
          { x: 500, y: 132 },
          { x: 500, y: 24 },
          { x: 580, y: 24 },
          { x: 580, y: 100 },
        ];
      },
    ],
  ];
  for (const [reason, mutate] of cases) {
    const input = graph();
    mutate(input);
    assert.throws(
      () => auditInteractiveGeometry(input),
      (error) =>
        error.code === 'render_interactive_layout_infeasible' && error.message.includes(reason),
      reason,
    );
  }
});

test('groups cannot overlap or visually claim an unrelated leaf', () => {
  const base = graph();
  base.relations = [];
  base.nodes[0].groupId = 'g-0';
  base.nodes[1].groupId = 'g-1';
  base.groups = [
    { id: 'g-0', x: 24, y: 24, width: 250, height: 210, label: label(70, 47) },
    { id: 'g-1', x: 524, y: 24, width: 250, height: 210, label: label(570, 47) },
  ];
  assert.doesNotThrow(() => auditInteractiveGeometry(base));
  const overlap = structuredClone(base);
  overlap.groups[1].x = 240;
  overlap.groups[1].label = label(285, 47);
  assert.throws(
    () => auditInteractiveGeometry(overlap),
    (error) => error.message.includes('group-collision'),
  );
  const borrowed = structuredClone(base);
  borrowed.nodes[0].groupId = null;
  assert.throws(
    () => auditInteractiveGeometry(borrowed),
    (error) => error.message.includes('group-nonmember-collision'),
  );
});
