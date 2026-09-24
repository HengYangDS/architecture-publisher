import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { validateSvg } from '../packages/publisher/renderers/resvg/validation.mjs';
import { RASTER_LIMITS } from '../packages/publisher/renderers/resvg/limits.mjs';
import { validateSvgValues } from '../packages/publisher/renderers/resvg/values.mjs';

const document = (body) =>
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' + body + '</svg>',
  );

for (const [label, body] of [
  ['nonfinite width', '<rect width="NaN" height="20"/>'],
  ['infinite coordinate', '<circle cx="1e999" cy="5" r="2"/>'],
  ['negative radius', '<circle r="-2"/>'],
  ['invalid length unit', '<rect width="10bananas"/>'],
  ['invalid opacity', '<g opacity="half"/>'],
  ['negative dash', '<path stroke-dasharray="1 -2"/>'],
  ['invalid line cap', '<path stroke-linecap="triangle"/>'],
  ['invalid fill rule', '<path fill-rule="winding-ish"/>'],
  ['invalid units', '<clipPath clipPathUnits="pixelSpace"/>'],
  ['invalid gradient offset', '<stop offset="next"/>'],
  ['unknown color', '<rect fill="not-a-color"/>'],
  ['invalid color function', '<rect fill="rgb(red, 0, 0)"/>'],
  ['invalid hex color', '<rect fill="#12"/>'],
  ['incomplete path', '<path d="M0 0 L"/>'],
  ['path missing moveto', '<path d="L0 0"/>'],
  ['invalid arc flag', '<path d="M0 0 A10 10 0 2 0 20 20"/>'],
  ['negative arc radius', '<path d="M0 0 A-10 10 0 0 1 20 20"/>'],
  ['trailing path comma', '<path d="M0 0,"/>'],
  ['incomplete cubic', '<path d="M0 0 C1 2 3 4 5"/>'],
  ['invalid transform argument', '<g transform="translate(banana)"/>'],
  ['incomplete matrix', '<g transform="matrix(1 0 0 1 2)"/>'],
  ['extra rotation argument', '<g transform="rotate(20 10)"/>'],
  ['unknown transform', '<g transform="perspective(20)"/>'],
  ['odd points', '<polygon points="0 0 1"/>'],
  ['duplicate points separator', '<polyline points="0,,1"/>'],
  ['missing points separator', '<polygon points="1.2.3"/>'],
  ['missing transform separator', '<g transform="translate(1.2.3)"/>'],
  ['missing angle separator', '<path d="M0 0 A10 10 .50110 20"/>'],
  ['invalid aspect-ratio whitespace', '<symbol preserveAspectRatio="xMidYMid,meet"/>'],
  ['invalid aspect ratio', '<symbol preserveAspectRatio="center"/>'],
]) {
  test(`SVG value admission rejects ${label}`, () => {
    assert.throws(() => validateSvg(document(body), [], 100), {
      code: 'raster_svg_value_invalid',
    });
  });
}

for (const body of [
  '<path d="M.5-.5 1e1,2E+1 h3v4l-1-2z"/>',
  '<path d="M0 0L1 1Z M5 5L6 6Z"/>',
  '<path d="M0 0C1 2 3 4 5 6S7 8 9 10Q11 12 13 14T15 16A10 20 30 0110 20Z"/>',
  '<path d=""/><polyline points=""/>',
  '<g transform=""/><polygon points="1-2, 3-4"/>',
  '<g transform="translate(1,2)scale(.5) rotate(30 4 5),skewX(10) skewY(-2) matrix(1 0 0 1 0 0)"/>',
  '<rect x="-2cm" y="1e-2em" width="25%" height="20px" fill="#1234" stroke="navy"/>',
  '<g fill="rgb(100%, 0%, 50%)" stroke="rgba(10,20,30,.4)" color="hsl(120,50%,50%)"/>',
  '<path stroke-dasharray="1px,2%,3" opacity="2" stroke-linecap="round"/>',
  '<symbol viewBox="-10,-20,100,100" preserveAspectRatio="xMidYMid meet"/>',
  '<linearGradient gradientUnits="userSpaceOnUse"><stop offset="25%" stop-color="currentColor"/></linearGradient>',
  '<marker orient="auto-start-reverse" markerUnits="strokeWidth" markerWidth="5" markerHeight="5"/>',
]) {
  test(`SVG value admission preserves ${body.slice(0, 65)}`, () => {
    assert.equal(validateSvg(document(body), [], 100).width, 100);
  });
}

for (const [label, tag, attributes] of [
  ['paint references', 'rect', { fill: 'url(#ink)', stroke: 'none' }],
  ['inherited paint and empty dash', 'path', { fill: 'inherit', 'stroke-dasharray': 'none' }],
  [
    'text coordinate lists and normal spacing',
    'text',
    { x: '1 2', y: '3,4', dx: '-1 2', 'letter-spacing': 'normal' },
  ],
  ['explicit angle and transform absence', 'marker', { orient: '30deg', transform: 'none' }],
  [
    'color functions and numeric weight',
    'text',
    { fill: 'rgba(1,2,3,.5)', color: 'hsl(120,50%,50%)', 'font-weight': '700' },
  ],
  ['none clip and version', 'svg', { 'clip-path': 'none', version: '2.0' }],
]) {
  test(`SVG value admission preserves ${label}`, () => {
    assert.doesNotThrow(() => validateSvgValues(tag, attributes));
  });
}

for (const [label, tag, attributes] of [
  ['mixed RGB units', 'rect', { fill: 'rgb(1,20%,3%)' }],
  ['percent alpha', 'rect', { fill: 'rgba(1,2,3,50%)' }],
  ['hue length unit', 'rect', { color: 'hsl(45px,50%,50%)' }],
  ['remote clip path', 'g', { 'clip-path': 'url(https://example.invalid/clip)' }],
  ['unsupported font weight', 'text', { 'font-weight': '550' }],
  ['font family with CSS syntax', 'text', { 'font-family': 'Alpha;bad' }],
  ['unsupported SVG version', 'svg', { version: '3.0' }],
  ['zero viewBox width', 'svg', { viewBox: '0 0 0 100' }],
  ['unsupported marker orientation', 'marker', { orient: 'facing' }],
  ['negative font size', 'text', { 'font-size': '-1' }],
]) {
  test(`SVG value admission rejects ${label}`, () => {
    assert.throws(() => validateSvgValues(tag, attributes), {
      code: 'raster_svg_value_invalid',
    });
  });
}

for (const [label, source, code] of [
  ['a non-SVG root', '<g xmlns="http://www.w3.org/2000/svg"/>', 'raster_svg_unsupported'],
  [
    'a nested SVG root',
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><svg/></svg>',
    'raster_svg_unsupported',
  ],
  [
    'an unadmitted namespace',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:foreign="https://example.invalid/ns" width="100" height="100"/>',
    'raster_svg_unsupported',
  ],
  [
    'unsupported xml:space',
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g xml:space="collapse"/></svg>',
    'raster_svg_unsupported',
  ],
  [
    'a foreign-prefixed attribute even under an SVG namespace alias',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:foreign="http://www.w3.org/2000/svg" width="100" height="100"><g foreign:role="group"/></svg>',
    'raster_svg_unsupported',
  ],
  [
    'two href spellings on one element',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100"><defs><g id="target"/></defs><use href="#target" xlink:href="#target"/></svg>',
    'raster_svg_unsupported',
  ],
  [
    'CSS import syntax in an SVG value',
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="@import"/></svg>',
    'raster_svg_unsupported',
  ],
  [
    'text inside a non-text element',
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g>not a label</g></svg>',
    'raster_svg_unsupported',
  ],
  ['missing root', '', 'raster_svg_invalid'],
]) {
  test(`SVG profile rejects ${label}`, () => {
    assert.throws(() => validateSvg(Buffer.from(source), [], 100), { code });
  });
}

test('SVG profile admits declared xml:space without weakening namespace checks', () => {
  const source = document('<g xml:space="preserve"/>');
  assert.equal(validateSvg(source, [], 100).width, 100);
});

test('SVG profile binds normal font weight to the selected regular face', async () => {
  const supply = await loadBundledFonts();
  const regular = supply.fonts.find((font) => font.weight === 400);
  const source = document(
    '<text x="5" y="20" font-family="JetBrains Mono" font-weight="normal">Selected</text>',
  );
  assert.equal(
    validateSvg(source, [{ bytes: regular.bytes, family: 'JetBrains Mono', weight: 400 }], 100)
      .width,
    100,
  );
});

test('SVG profile rejects an over-deep finite local-reference chain', () => {
  const count = RASTER_LIMITS.referenceDepth + 2;
  const definitions = Array.from({ length: count }, (_, i) =>
    i + 1 === count ? `<g id="n${i}"/>` : `<g id="n${i}"><use href="#n${i + 1}"/></g>`,
  ).join('');
  const source = document(`<defs>${definitions}</defs><use href="#n0"/>`);
  assert.throws(() => validateSvg(source, [], 100), { code: 'raster_svg_limit' });
});
