import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { rasterize, validateSvg } from '../packages/publisher/renderers/resvg/public.mjs';
import * as svg from '../packages/publisher/renderers/svg/index.mjs';
import { staticEditionScene } from './fixtures/static-edition-scene.mjs';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';

test('a neutral static SVG shows the selected structure and authored limits', () => {
  assert.equal(typeof svg.composeStaticEditionSvg, 'function');
  const rendered = svg.composeStaticEditionSvg(staticEditionScene());
  const content = rendered.bytes.toString('utf8');

  assert.equal(rendered.rasterWidth, 6000);
  assert(rendered.width >= 420);
  assert(rendered.height > 80);
  assert.match(content, /<svg[^>]+role="img"/u);
  assert.match(content, /Selected architecture/u);
  assert.match(content, /Alpha &amp; one/u);
  assert.match(content, /Beta/u);
  assert.match(content, /calls/u);
  assert.match(content, /What is connected\?/u);
  assert.match(content, /Runtime was not observed\./u);
  assert.match(content, /domain-metadata-opaque/u);
  assert.match(content, /data-node-id="a"/u);
  assert.match(content, /data-relation-ref="relation:4:2"/u);
  assert.doesNotMatch(content, /backend|archify|privateNote/u);
});

test('small source structure and reading notes occupy distinct landscape regions', () => {
  const rendered = svg.composeStaticEditionSvg(staticEditionScene());
  const content = rendered.bytes.toString('utf8');
  const reading = /<text x="([\d.]+)"[^>]*>READER QUESTIONS<\/text>/u.exec(content);
  assert(reading);
  assert(Number(reading[1]) > rendered.width / 2);
  assert(rendered.height / rendered.width < 0.65);
});

test('fractional native geometry is not rejected by serialization rounding', () => {
  const input = staticEditionScene();
  input.nodes[1].x = 260.125;
  input.edges[0].points[1][0] = 260.125;
  input.bounds.width = 420.125;
  const output = svg.composeStaticEditionSvg(input);
  assert.match(output.bytes.toString('utf8'), /260\.13/u);
});

test('a bidirectional source relation retains both directions and its kind', () => {
  const input = staticEditionScene();
  input.edges[0].relations[0].direction = 'bidirectional';
  input.edges[0].relations[0].label = null;
  input.edges[0].relations[0].kind = 'peer';
  const output = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.match(output, /marker-start="url\(#source-arrow\)"/u);
  assert.match(output, /Alpha &amp; one → Beta · peer/u);
});

test('malformed editorial and relation collections fail with a named diagnostic', () => {
  const cases = [
    ['missing limit map', (input) => (input.limitsByQuestion = null)],
    ['missing relation members', (input) => (input.edges[0].relations = null)],
  ];
  for (const [name, mutate] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(
      () => svg.composeStaticEditionSvg(input),
      { code: 'static_edition_scene_invalid' },
      name,
    );
  }
});

test('the renderer refuses unsupported scene authority and dimensions', () => {
  const cases = [
    ['absent scene', () => null, 'static_edition_scene_invalid'],
    ['wrong schema', (input) => ({ ...input, schema: 'other' }), 'static_edition_scene_invalid'],
    [
      'wrong completeness',
      (input) => ({ ...input, completeness: 'qualified' }),
      'static_edition_scene_invalid',
    ],
    [
      'unselected profile',
      (input) => ({ ...input, visualPolicy: { profile: 'flagship' } }),
      'static_edition_scene_invalid',
    ],
    [
      'unselected override',
      (input) => ({ ...input, visualPolicy: { profile: 'neutral', override: 'art.css' } }),
      'static_edition_scene_invalid',
    ],
    ['missing nodes', (input) => ({ ...input, nodes: null }), 'static_edition_scene_invalid'],
    ['missing edges', (input) => ({ ...input, edges: null }), 'static_edition_scene_invalid'],
    [
      'missing questions',
      (input) => ({ ...input, questions: null }),
      'static_edition_scene_invalid',
    ],
    [
      'missing editorials',
      (input) => ({ ...input, editorialAssertions: null }),
      'static_edition_scene_invalid',
    ],
    ['missing limits', (input) => ({ ...input, limits: null }), 'static_edition_scene_invalid'],
    [
      'array limit map',
      (input) => ({ ...input, limitsByQuestion: [] }),
      'static_edition_scene_invalid',
    ],
    [
      'nonintegral width',
      (input) => ({ ...input, requestedWidth: 6000.5 }),
      'static_edition_width_invalid',
    ],
    ['too narrow', (input) => ({ ...input, requestedWidth: 319 }), 'static_edition_width_invalid'],
    ['too wide', (input) => ({ ...input, requestedWidth: 12001 }), 'static_edition_width_invalid'],
    [
      'forged bounds',
      (input) => ({ ...input, bounds: { ...input.bounds, width: 421 } }),
      'static_edition_bounds_mismatch',
    ],
  ];
  for (const [name, alter, code] of cases)
    assert.throws(() => svg.composeStaticEditionSvg(alter(staticEditionScene())), { code }, name);
});

test('the renderer rejects infeasible geometry without cropping selected meaning', () => {
  const cases = [
    [
      'nonfinite node',
      (input) => (input.nodes[0].x = Number.NaN),
      'static_edition_geometry_invalid',
    ],
    [
      'unbounded node',
      (input) => (input.nodes[0].x = 11_000_000),
      'static_edition_geometry_invalid',
    ],
    ['negative width', (input) => (input.nodes[0].width = -1), 'static_edition_geometry_invalid'],
    ['negative height', (input) => (input.nodes[0].height = -1), 'static_edition_geometry_invalid'],
    ['missing route', (input) => (input.edges[0].points = null), 'static_edition_geometry_invalid'],
    [
      'one route point',
      (input) => (input.edges[0].points = [[160, 40]]),
      'static_edition_geometry_invalid',
    ],
    [
      'malformed point',
      (input) => (input.edges[0].points[0] = [160]),
      'static_edition_geometry_invalid',
    ],
    [
      'absent endpoint',
      (input) => (input.edges[0].to.id = 'absent'),
      'static_edition_relation_endpoint_missing',
    ],
    [
      'unsupported direction',
      (input) => (input.edges[0].relations[0].direction = 'inverse'),
      'static_edition_direction_unrepresentable',
    ],
    [
      'mixed directions',
      (input) =>
        input.edges[0].relations.push({
          ...input.edges[0].relations[0],
          direction: 'bidirectional',
        }),
      'static_edition_direction_unrepresentable',
    ],
    ['narrow node', (input) => (input.nodes[0].width = 95), 'static_edition_node_unrepresentable'],
    ['short node', (input) => (input.nodes[0].height = 63), 'static_edition_node_unrepresentable'],
    [
      'huge canvas',
      (input) => {
        input.nodes[1].x = 11_500;
        input.edges[0].points[1][0] = 11_500;
        input.bounds.width = 11_660;
      },
      'static_edition_geometry_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input), { code }, name);
  }
});

test('long text wraps without truncating source language or hiding editorial scope', () => {
  const input = staticEditionScene();
  input.title = `${'x'.repeat(52)} Y`;
  input.nodes[0].label = 'Alpha service one';
  input.nodes[0].kind = null;
  input.editorialAssertions.push({ statement: 'Editorial judgment remains attributed.' });
  input.limits.push('view-membership-upstream-computed-unqualified');
  const result = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.match(result, /Alpha service/u);
  assert.match(result, /one/u);
  assert.match(result, /Editorial judgment remains attributed/u);
  assert.match(result, /view-membership-/u);
  assert.match(result, /upstream-computed-/u);
  assert.match(result, /<text[^>]*>Y<\/text>/u);
});

test('two label lines cannot collide with a kind label inside a short node', () => {
  const input = staticEditionScene();
  input.nodes[0].height = 64;
  input.nodes[0].label = 'Alpha service one';
  assert.throws(() => svg.composeStaticEditionSvg(input), {
    code: 'static_edition_node_unrepresentable',
  });
});

test('unspaced source labels wrap without changing characters or inventing relation qualifiers', () => {
  const input = staticEditionScene();
  input.limits.push('x'.repeat(100));
  input.edges[0].relations[0].label = null;
  input.edges[0].relations[0].kind = null;
  const result = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  const pieces = [...result.matchAll(/<text[^>]*>(x+)<\/text>/gu)].map((match) => match[1]);
  assert.equal(pieces.join(''), 'x'.repeat(100));
  assert.match(result, /Alpha &amp; one → Beta<\/text>/u);
  assert.doesNotMatch(result, /Alpha &amp; one → Beta ·/u);
});

test('absence of a width selects a generic default, not a named adopter preset', () => {
  const input = staticEditionScene();
  input.requestedWidth = null;
  assert.equal(svg.composeStaticEditionSvg(input).rasterWidth, 1800);
});

test('missing or excessive text and an overlong poster fail rather than truncate', () => {
  const cases = [
    ['missing title', (input) => (input.title = ''), 'static_edition_text_unrepresentable'],
    [
      'missing node label',
      (input) => (input.nodes[0].label = null),
      'static_edition_text_unrepresentable',
    ],
    [
      'too many title lines',
      (input) => (input.title = 'word '.repeat(500)),
      'static_edition_text_unrepresentable',
    ],
    [
      'too many method notes',
      (input) => (input.limits = Array.from({ length: 600 }, (_, index) => `limit ${index}`)),
      'static_edition_geometry_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input), { code }, name);
  }
});

test('an editorial-only scene remains truthful and does not manufacture structure', () => {
  const input = staticEditionScene();
  input.nodes = [];
  input.edges = [];
  input.bounds = null;
  input.sourceAssertionCarriers = [];
  input.editorialAssertions = [{ statement: 'No source graph was selected.' }];
  const result = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.match(result, /No source graph was selected/u);
  assert.doesNotMatch(result, /data-node-id|data-relation-ref/u);
});

test('the static Edition SVG is admitted by the pinned raster profile', async () => {
  const output = svg.composeStaticEditionSvg(staticEditionScene());
  const supply = await loadBundledFonts();
  const selected = supply.fonts
    .filter(({ weight }) => [400, 600].includes(weight))
    .map(({ bytes, weight }) => ({ bytes, weight, family: 'JetBrains Mono' }));
  const validated = validateSvg(output.bytes, selected, output.rasterWidth);
  assert.equal(validated.width, 6000);
  assert(validated.height > 0);
  assert.equal(validated.fontCount, 2);
});

test('the selected-width PNG is rendered from the static SVG, not from HTML', async (t) => {
  const root = path.resolve('build/test-work');
  await fs.mkdir(root, { recursive: true });
  const work = await fs.mkdtemp(path.join(root, 'static-edition-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const output = svg.composeStaticEditionSvg(staticEditionScene());
  const supply = await loadBundledFonts();
  const selected = supply.fonts.filter(({ weight }) => [400, 600].includes(weight));
  const members = [
    { path: 'edition.svg', content: output.bytes },
    ...selected.map(({ weight, bytes }) => ({ path: `fonts/${weight}.ttf`, content: bytes })),
  ];
  const bundle = await writeSourceBundle(
    path.join(work, 'input'),
    { id: 'static:edition', revision: 'selected' },
    members,
  );
  const png = path.join(work, 'edition.png');
  const result = await rasterize({
    manifest: bundle.manifestPath,
    manifestSha256: bundle.manifestSha256,
    svg: 'edition.svg',
    fonts: selected.map(({ weight }) => ({
      path: `fonts/${weight}.ttf`,
      family: 'JetBrains Mono',
      weight,
    })),
    width: output.rasterWidth,
    output: png,
  });
  assert.equal(result.status, 'rendered');
  assert.equal(result.width, 6000);
  assert.deepEqual(
    (await fs.readFile(png)).subarray(0, 8),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
});
