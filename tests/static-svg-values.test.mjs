import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSvg } from '../renderers/resvg/validation.mjs';

const document = (body) =>
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
      body +
      '</svg>',
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
  [
    'invalid aspect-ratio whitespace',
    '<symbol preserveAspectRatio="xMidYMid,meet"/>',
  ],
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
