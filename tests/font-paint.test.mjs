import assert from 'node:assert/strict';
import test from 'node:test';
import * as paint from './fixtures/font-paint.mjs';

const observation = (envelope, scale = 4) => ({
  scale,
  samples: [{ threshold: 0, count: 1, envelope }],
});

test('paint bounds retain the complete inclusive single-pixel footprint', () => {
  const actual = paint.assertGlyphPaintBounds(
    observation({ left: 8, top: 12, right: 8, bottom: 12 }),
    { x: 2, y: 3, width: 0.25, height: 0.25 },
    0,
  );
  assert.deepEqual(actual, { left: 2, top: 3, right: 2.25, bottom: 3.25 });
});

test('paint bounds normalize each scale and retain nonzero logical origins', () => {
  const actual = paint.assertGlyphPaintBounds(
    observation({ left: 6, top: 8, right: 9, bottom: 11 }),
    { x: 13, y: -6, width: 2, height: 1 },
    0,
    { originX: 10, originY: -8, scaleX: 2, scaleY: 4 },
  );
  assert.deepEqual(actual, { left: 13, top: -6, right: 15, bottom: -5 });
});

test('paint bounds compare independent edges rather than accumulated width error', () => {
  const actual = paint.assertGlyphPaintBounds(
    observation({ left: 3, top: 4, right: 8, bottom: 7 }),
    { x: 1, y: 1, width: 1, height: 1 },
    0.3,
  );
  assert.equal(actual.right - actual.left, 1.5);
});

test('paint bounds reject displacement and clipping beyond the declared allowance', () => {
  const expected = { x: 1, y: 1, width: 1, height: 1 };
  assert.throws(
    () =>
      paint.assertGlyphPaintBounds(
        observation({ left: 7, top: 4, right: 10, bottom: 7 }),
        expected,
        0.5,
      ),
    /left/u,
  );
  assert.throws(
    () =>
      paint.assertGlyphPaintBounds(
        observation({ left: 4, top: 4, right: 5, bottom: 7 }),
        expected,
        0.25,
      ),
    /right/u,
  );
});

test('paint bounds use every nonzero alpha pixel rather than a selected opacity threshold', () => {
  const input = observation({ left: 4, top: 4, right: 10, bottom: 7 });
  input.samples.unshift({
    threshold: 127,
    count: 1,
    envelope: { left: 4, top: 4, right: 7, bottom: 7 },
  });
  assert.throws(
    () => paint.assertGlyphPaintBounds(input, { x: 1, y: 1, width: 1, height: 1 }, 0.5),
    /right/u,
  );
});

test('paint bounds reject absent paint instead of treating an empty footprint as agreement', () => {
  const input = observation({ left: 4, top: 4, right: 7, bottom: 7 });
  input.samples[0].count = 0;
  assert.throws(
    () => paint.assertGlyphPaintBounds(input, { x: 1, y: 1, width: 1, height: 1 }, 0.5),
    /nonzero-alpha/u,
  );
});
