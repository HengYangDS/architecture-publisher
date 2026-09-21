import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateHtmlObservation,
  validateStaticObservation,
} from '../tools/qualification/semantic-browser-checks.mjs';

const box = { x: 0, y: 0, right: 100, bottom: 100 };
const view = {
  nodeIds: ['source', 'target'],
  relationIds: ['edge'],
  relations: [
    {
      id: 'edge',
      from: 'source',
      to: 'target',
      fromSide: 'right',
      toSide: 'left',
      route: 'orthogonal-h',
    },
  ],
};
const edge = {
  id: 'edge',
  from: 'source',
  to: 'target',
  path: 'M 100 50 L 200 50',
  start: { x: 100, y: 50 },
  end: { x: 200, y: 50 },
  fromBox: box,
  toBox: { x: 200, y: 0, right: 300, bottom: 100 },
  stroke: 'rgb(0, 0, 0)',
};
const html = {
  nodeIds: ['source', 'target'],
  edges: [edge],
  overlap: [],
  overflow: [],
  minimumFont: 8,
  scrollWidth: 1000,
  scrollHeight: 800,
  viewportWidth: 1000,
  viewportHeight: 800,
  surfaceBadges: ['none', 'none'],
};

test('HTML acceptance rejects runtime errors and directed endpoint drift', () => {
  assert.throws(
    () => validateHtmlObservation(html, view, ['external-request:x']),
    /Browser geometry failed/,
  );
  assert.throws(
    () =>
      validateHtmlObservation(
        { ...html, edges: [{ ...edge, from: 'target', to: 'source' }] },
        view,
        [],
      ),
    /directed endpoint mismatch/,
  );
  assert.throws(
    () =>
      validateHtmlObservation(
        { ...html, surfaceBadges: ['"ARCHIFY / PLATE 04"', 'none'] },
        view,
        [],
      ),
    /Browser geometry failed/,
  );
  assert.throws(
    () => validateHtmlObservation({ ...html, overflow: ['sidebar'] }, view, []),
    /Browser geometry failed/,
  );
  assert.throws(
    () => validateHtmlObservation({ ...html, minimumFont: 7 }, view, []),
    /Browser geometry failed/,
  );
  assert.throws(
    () => validateHtmlObservation({ ...html, nodeIds: ['source'] }, view, []),
    /node identity mismatch/,
  );
});

test('static acceptance rejects detached endpoints and missing paint', () => {
  const observed = {
    fontFaces: ['400', '600'].map((weight) => ({
      family: 'JetBrains Mono',
      weight,
      status: 'loaded',
    })),
    root: 'svg',
    width: 300,
    height: 100,
    viewBox: [0, 0, 300, 100],
    nodeIds: ['source', 'target'],
    edges: [edge],
    overlap: [],
    labelNodeOverlap: [],
    labelStrokeOverlap: [],
    edgeNodeOverlap: [],
    overflow: [],
    minimumFont: 8,
  };
  validateStaticObservation(observed, view, []);
  assert.throws(
    () =>
      validateStaticObservation(
        {
          ...observed,
          edges: [{ ...edge, end: { x: 250, y: 50 } }],
        },
        view,
        [],
      ),
    /endpoint attachment mismatch/,
  );
  assert.throws(
    () =>
      validateStaticObservation({ ...observed, edges: [{ ...edge, stroke: 'none' }] }, view, []),
    /Static SVG paint failed/,
  );
  assert.throws(
    () =>
      validateStaticObservation({ ...observed, labelNodeOverlap: [['edge', 'target']] }, view, []),
    /Static SVG paint failed/,
  );
});

test('static acceptance fails closed on missing stroke coverage', () => {
  assert.throws(
    () =>
      validateStaticObservation(
        {
          fontFaces: ['400', '600'].map((weight) => ({
            family: 'JetBrains Mono',
            weight,
            status: 'loaded',
          })),
          root: 'svg',
          width: 300,
          height: 100,
          viewBox: [0, 0, 300, 100],
          nodeIds: ['source', 'target'],
          edges: [edge],
          overlap: [],
          labelNodeOverlap: [],
          overflow: [],
          minimumFont: 13,
        },
        view,
        [],
      ),
    /Static SVG stroke coverage missing/,
  );
});

test('static acceptance rejects glyph or node obstruction by strokes', () => {
  const observed = {
    fontFaces: ['400', '600'].map((weight) => ({
      family: 'JetBrains Mono',
      weight,
      status: 'loaded',
    })),
    root: 'svg',
    width: 300,
    height: 100,
    viewBox: [0, 0, 300, 100],
    nodeIds: ['source', 'target'],
    edges: [edge],
    overlap: [],
    labelNodeOverlap: [],
    labelStrokeOverlap: [],
    edgeNodeOverlap: [],
    overflow: [],
    minimumFont: 13,
  };
  for (const field of ['labelStrokeOverlap', 'edgeNodeOverlap'])
    assert.throws(
      () =>
        validateStaticObservation(
          {
            ...observed,
            [field]: [['edge', 'obstacle']],
          },
          view,
          [],
        ),
      /Static SVG paint failed/,
    );
});
