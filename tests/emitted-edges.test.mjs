import assert from 'node:assert/strict';
import test from 'node:test';
import { auditEmittedEdges } from '../packages/publisher/src/qualification/static/emitted-path.mjs';

const limits = Object.freeze({ minimumTerminal: 2, endpointTolerance: 0.1 });
const scene = (arrow = true) => ({
  edges: [
    {
      id: 'edge',
      arrow,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
    },
  ],
});
const path = (d, marker = true) =>
  `<svg><path data-edge="edge" d="${d}"${marker ? ' marker-end="url(#arrow)"' : ''}/></svg>`;

test('emitted straight and quadratic paths bind intended endpoints without a browser claim', () => {
  const straight = auditEmittedEdges(path('M0 0 L10 0'), scene(), limits);
  assert.deepEqual(straight.failures, []);
  assert.deepEqual(straight.edges[0], {
    id: 'edge',
    arrow: true,
    endpointDelta: 0,
    terminalLength: 10,
    terminalDirection: { x: 1, y: 0 },
  });
  assert.match(straight.scope, /no browser/);

  const curved = auditEmittedEdges(path('M0 0 Q5 5 10 0', false), scene(false), limits);
  assert.deepEqual(curved.failures, []);
  assert.equal(curved.edges[0].terminalLength, 0);
});

test('emitted geometry reports endpoint and terminal failures separately', () => {
  const intended = scene();
  intended.edges[0].points[1].x = 12;
  const result = auditEmittedEdges(path('M0 0 L1 0'), intended, limits);
  assert.deepEqual(
    result.failures.map(({ code }) => code),
    ['emitted-endpoint-mismatch', 'short-emitted-terminal'],
  );
});

test('emitted paths reject unsupported syntax, identities and incomplete geometry', () => {
  assert.throws(
    () =>
      auditEmittedEdges(path('M0 0 L10 0'), scene(), {
        ...limits,
        minimumTerminal: 0,
      }),
    /invalid emitted-edge limits/,
  );
  assert.throws(
    () =>
      auditEmittedEdges(
        path('M0 0 L10 0'),
        {
          edges: [...scene().edges, ...scene().edges],
        },
        limits,
      ),
    /duplicate intended edge identity/,
  );
  assert.throws(() => auditEmittedEdges('<svg/>', scene(), limits), /identity set mismatch/);
  assert.throws(
    () =>
      auditEmittedEdges(
        path('M0 0 L10 0').replace('data-edge="edge"', 'data-edge="unknown"'),
        scene(),
        limits,
      ),
    /identity mismatch/,
  );
  assert.throws(
    () => auditEmittedEdges(path('M0 0 L10 0') + path('M0 0 L10 0'), scene(), limits),
    /identity mismatch/,
  );
  assert.throws(
    () => auditEmittedEdges('<path data-edge="edge"/>', scene(), limits),
    /geometry missing/,
  );
  assert.throws(
    () => auditEmittedEdges(path('M0 0 L10 0', false), scene(), limits),
    /arrow contract mismatch/,
  );
  assert.throws(
    () => auditEmittedEdges(path('M0 0 L10 0'), { edges: [{ id: 'edge', points: [] }] }, limits),
    /arrow contract mismatch|intended edge geometry missing/,
  );
  for (const invalid of ['M0 0 Z', 'L0 0', 'M0 0', 'M0 0 M1 1 L2 2', 'M0 0 L1', 'M0 0 L0 0'])
    assert.throws(
      () => auditEmittedEdges(path(invalid), scene(), limits),
      /path|syntax|coordinate|component|terminal/,
    );
});
