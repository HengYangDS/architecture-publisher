import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeStaticEditionSvg,
  composeStaticFigureSvg,
} from '../packages/publisher/renderers/svg/index.mjs';
import { staticEditionScene } from './fixtures/static-edition-scene.mjs';

function view(id, index, options = {}) {
  const scene = staticEditionScene();
  scene.editorialViewId = id;
  scene.questions[0].text = options.question ?? `How does ${id} connect?`;
  scene.limits = options.limits ?? ['source-not-observed'];
  if (options.wide) {
    scene.nodes[1].x = 640;
    scene.edges[0].points[1][0] = 640;
    scene.bounds.width = 800;
  }
  if (options.scopeLimits) scene.limitsByQuestion.shape = options.scopeLimits;
  if (options.relationOnly) {
    scene.claimCards = [];
    scene.sourceAssertionCarriers[0].kind = 'relation';
  }
  const rendered = composeStaticEditionSvg(scene, {
    idPrefix: `static-view-${index}-`,
    fragment: true,
  });
  return { id, scene, rendered };
}

test('joint composition lays independent views side by side and factors common limits', () => {
  const first = view('first', 0);
  const second = view('second', 1);
  const result = composeStaticFigureSvg({
    title: 'Joint figure',
    summary: 'One source-bound reading.',
    rasterWidth: 1800,
    views: [first, second],
  });
  const svg = result.bytes.toString('utf8');
  assert.equal(result.placements.length, 2);
  assert.equal(result.placements[0].y, result.placements[1].y);
  assert(result.placements[0].x < result.placements[1].x);
  assert.equal((svg.match(/source-not-observed/gu) ?? []).length, 1);
  assert.equal((svg.match(/METHOD LIMITS/gu) ?? []).length, 1);
  assert.equal((svg.match(/<svg\b/gu) ?? []).length, 1);
  assert.equal((svg.match(/data-static-view=/gu) ?? []).length, 2);
});

test('relation columns preserve source order in a top-to-bottom reading path', () => {
  const first = view('first', 0, { wide: true });
  first.rendered.parts.relations = Array.from({ length: 4 }, (_, index) => ({
    graphicId: `static-view-0-r-${index}`,
    text: `Relation ${index + 1}`,
  }));
  const svg = composeStaticFigureSvg({
    title: 'Ordered relations',
    summary: 'Read down the first column, then the second.',
    rasterWidth: 1800,
    views: [first, view('second', 1, { wide: true })],
  }).bytes.toString('utf8');
  const positions = [
    ...svg.matchAll(
      /<g data-graphic-id="static-view-0-r-(\d)">\n<text x="([\d.]+)" y="([\d.]+)"/gu,
    ),
  ].map(([, ordinal, x, y]) => ({ ordinal: Number(ordinal), x: Number(x), y: Number(y) }));
  assert.equal(positions.length, 4);
  assert.deepEqual(
    positions.map(({ ordinal }) => ordinal),
    [0, 1, 2, 3],
  );
  assert.equal(positions[0].x, positions[1].x);
  assert(positions[0].y < positions[1].y);
  assert.equal(positions[2].x, positions[3].x);
  assert(positions[2].y < positions[3].y);
  assert(positions[0].x < positions[2].x);
});

test('wrapped figure relation lines reserve readable vertical clearance', () => {
  const first = view('first', 0);
  first.rendered.parts.relations = [
    {
      graphicId: 'static-view-0-r-0',
      text: 'A source relation preserves its selected qualifier and ownership boundary '.repeat(3),
    },
  ];
  const svg = composeStaticFigureSvg({
    title: 'Readable relation',
    summary: 'Selected relation detail.',
    rasterWidth: 1800,
    views: [first, view('second', 1)],
  }).bytes.toString('utf8');
  const lines = svg.match(/<g data-graphic-id="static-view-0-r-0">([\s\S]*?)<\/g>/u)?.[1] ?? '';
  const baselines = [...lines.matchAll(/<text x="[\d.]+" y="([\d.]+)"/gu)].map(([, y]) =>
    Number(y),
  );
  assert(baselines.length > 1);
  for (let index = 1; index < baselines.length; index += 1)
    assert(baselines[index] - baselines[index - 1] >= 26);
});

test('narrow requested raster and an odd view count retain every selected view', () => {
  const selected = [view('first', 0), view('second', 1), view('third', 2)];
  const narrow = composeStaticFigureSvg({
    title: 'Narrow figure',
    summary: 'Every question remains visible.',
    rasterWidth: 1000,
    views: selected.slice(0, 2),
  });
  assert(narrow.width <= 1000);
  assert.equal(narrow.placements[0].x, narrow.placements[1].x);
  assert(narrow.placements[0].y < narrow.placements[1].y);

  const grid = composeStaticFigureSvg({
    title: 'Three views',
    summary: 'The final view is not discarded.',
    rasterWidth: 1800,
    views: selected,
  });
  assert.deepEqual(
    grid.placements.map(({ id }) => id),
    ['first', 'second', 'third'],
  );
  assert(grid.placements[2].y > grid.placements[1].y);
});

test('an empty common-note inventory does not reserve a phantom footer', () => {
  const result = composeStaticFigureSvg({
    title: 'No common notes',
    summary: 'Only selected structure is shown.',
    rasterWidth: 1800,
    views: [view('first', 0, { limits: [] }), view('second', 1, { limits: [] })],
  });
  assert(!result.bytes.toString('utf8').includes('METHOD LIMITS'));
});

test('a severely unbalanced pair falls back to a single reading column', () => {
  const long = view('long', 0, {
    limits: [],
    scopeLimits: Array.from({ length: 25 }, (_, index) => ({
      kind: 'scope',
      reason: `Distinct declared limitation ${index} remains visible.`,
    })),
  });
  const short = view('short', 1, { limits: [] });
  const result = composeStaticFigureSvg({
    title: 'Balanced reading',
    summary: 'Do not leave the shorter column mostly empty.',
    rasterWidth: 1800,
    views: [long, short],
  });
  assert.equal(result.placements[0].x, result.placements[1].x);
});

test('view-specific method limits remain attributed rather than becoming global', () => {
  const first = view('first', 0, { limits: ['first-only'] });
  const second = view('second', 1, { limits: ['second-only'] });
  const svg = composeStaticFigureSvg({
    title: 'Attribution',
    summary: 'Different method limits.',
    rasterWidth: 1800,
    views: [first, second],
  }).bytes.toString('utf8');
  assert(svg.includes('first: first-only'));
  assert(svg.includes('second: second-only'));
});

test('a repeated source limit does not create false view attribution', () => {
  const first = view('first', 0, { limits: ['shared', 'shared'] });
  const second = view('second', 1, { limits: ['shared'] });
  const svg = composeStaticFigureSvg({
    title: 'Repeated source limit',
    summary: 'The shared limit has one visible carrier.',
    rasterWidth: 1800,
    views: [first, second],
  }).bytes.toString('utf8');
  assert.equal((svg.match(/>shared<\/text>/gu) ?? []).length, 1);
  assert(!svg.includes('first, first'));
});

test('one source-status explanation serves two relation-only views', () => {
  const selected = [
    view('first', 0, { relationOnly: true }),
    view('second', 1, { relationOnly: true }),
  ];
  const svg = composeStaticFigureSvg({
    title: 'Relation status',
    summary: 'Source topology is not implementation proof.',
    rasterWidth: 1800,
    views: selected,
  }).bytes.toString('utf8');
  assert.equal((svg.match(/Source-reported topology/gu) ?? []).length, 1);
  assert.equal((svg.match(/SOURCE STATUS/gu) ?? []).length, 1);
});

test('a prevalidated local claim plate stays within its view', () => {
  const first = view('first', 0);
  first.rendered.parts.claim = {
    markup: '<g data-graphic-id="static-view-0-c-0"><text x="0" y="20">Claim witness</text></g>',
    x: 0,
    y: 0,
    width: 320,
    height: 40,
  };
  const result = composeStaticFigureSvg({
    title: 'Claim placement',
    summary: 'The plate belongs to the first view.',
    rasterWidth: 1800,
    views: [first, view('second', 1)],
  });
  assert(result.bytes.toString('utf8').includes('Claim witness'));
  assert(result.bytes.toString('utf8').includes('SOURCE CLAIMS'));
  first.rendered.parts.claim.width = 20_000;
  assert.throws(
    () =>
      composeStaticFigureSvg({
        title: 'Claim placement',
        summary: 'The plate does not fit.',
        rasterWidth: 1800,
        views: [first, view('second', 1)],
      }),
    { code: 'static_figure_width_unrepresentable' },
  );
  first.rendered.parts.claim.width = 320;
  first.rendered.parts.claim.height = 0;
  assert.throws(
    () =>
      composeStaticFigureSvg({
        title: 'Claim placement',
        summary: 'An empty plate cannot be shown.',
        rasterWidth: 1800,
        views: [first, view('second', 1)],
      }),
    { code: 'static_figure_claim_unrepresentable' },
  );
});

test('the figure rejects malformed membership and an unrepresentable relation ledger', () => {
  const first = view('first', 0);
  const second = view('second', 1);
  const input = { title: 'Figure', summary: 'Selected views.', rasterWidth: 1800 };
  assert.throws(() => composeStaticFigureSvg({ ...input, views: [first] }), {
    code: 'static_figure_views_invalid',
  });
  assert.throws(() => composeStaticFigureSvg({ ...input, views: [first, first] }), {
    code: 'static_figure_views_invalid',
  });
  assert.throws(
    () => composeStaticFigureSvg({ ...input, rasterWidth: 100, views: [first, second] }),
    {
      code: 'static_figure_width_invalid',
    },
  );
  const malformed = structuredClone(second);
  malformed.rendered.parts.relations[0].text = 'unbroken'.repeat(500);
  assert.throws(() => composeStaticFigureSvg({ ...input, views: [first, malformed] }), {
    code: 'static_edition_text_unrepresentable',
  });

  for (const mutate of [
    (item) => (item.id = 'Invalid'),
    (item) => (item.scene.editorialViewId = 'other'),
    (item) => (item.scene.questions = []),
    (item) => (item.scene.questions[0].text = ''),
    (item) => (item.rendered.parts.graph = null),
    (item) => (item.rendered.parts.relations = null),
    (item) => (item.rendered.parts.claim = { markup: 'claim', x: NaN }),
    (item) => (item.rendered.rasterWidth = 1800.5),
  ]) {
    const invalid = structuredClone(second);
    mutate(invalid);
    assert.throws(() => composeStaticFigureSvg({ ...input, views: [first, invalid] }), {
      code: 'static_figure_views_invalid',
    });
  }
});

test('an otherwise valid selection fails when its complete figure exceeds the canvas', () => {
  const selected = Array.from({ length: 100 }, (_, index) => view(`view${index}`, index));
  assert.throws(
    () =>
      composeStaticFigureSvg({
        title: 'Too many views',
        summary: 'No view is silently dropped.',
        rasterWidth: 1800,
        views: selected,
      }),
    { code: 'static_figure_geometry_unrepresentable' },
  );
});
