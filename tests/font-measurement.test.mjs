import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { decodeMeasurement } from '../packages/publisher/renderers/resvg/measurement-response.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import {
  createBundledTextMeasurer,
  verifyAuthoredCanvasTextBoxes,
} from '../packages/publisher/renderers/resvg/measurement.mjs';

test('measurement response admission separates execution failure from invalid selected protocol', () => {
  const state = { spawnError: null, stderrBytes: 0, closed: { code: 0, signal: null } };
  const measured = JSON.stringify({ status: 'measured', boxes: [0, 0, 1, 1] });
  assert.deepEqual(decodeMeasurement(measured, state, 'reply', 1), [0, 0, 1, 1]);
  assert.deepEqual(decodeMeasurement(measured, state, 'closed', 1), [0, 0, 1, 1]);
  for (const [reason, expected] of [
    ['timeout', 'authored_canvas_measurement_execution_timeout'],
    ['overflow', 'authored_canvas_measurement_response_limit'],
    ['spawn-error', 'authored_canvas_measurement_execution_failed'],
    ['stderr', 'authored_canvas_measurement_execution_failed'],
  ])
    assert.throws(() => decodeMeasurement(measured, state, reason, 1), { code: expected });
  for (const change of [
    { spawnError: new Error('selected worker unavailable') },
    { stderrBytes: 1 },
    { closed: null },
    { closed: { code: 1, signal: null } },
    { closed: { code: 0, signal: 'SIGTERM' } },
  ])
    assert.throws(() => decodeMeasurement(measured, { ...state, ...change }, 'closed', 1), {
      code: 'authored_canvas_measurement_execution_failed',
    });
  for (const raw of [
    '{broken',
    'null',
    JSON.stringify({ status: 'waiting', boxes: [0, 0, 1, 1] }),
    JSON.stringify({ status: 'measured', boxes: {} }),
    JSON.stringify({ status: 'measured', boxes: [0, 0, 1] }),
    JSON.stringify({ status: 'measured', boxes: [0, 0, 1, null] }),
    JSON.stringify({ status: 'measured', boxes: [0, 0, 1, 'wrong'] }),
    JSON.stringify({ status: 'measured', boxes: [0, 0, 1, 1], extra: true }),
    JSON.stringify({ status: 'error', code: {} }),
    JSON.stringify({ status: 'error', code: 'Bad-Error' }),
  ])
    assert.throws(() => decodeMeasurement(raw, state, 'reply', 1), {
      code: 'authored_canvas_measurement_response_invalid',
    });
  assert.throws(
    () =>
      decodeMeasurement(
        JSON.stringify({ status: 'error', code: 'measurement_text_missing' }),
        state,
        'reply',
        1,
      ),
    { code: 'measurement_text_missing' },
  );
});

test('bundled native shaped metrics reproduce recorded self glyph bounds', async () => {
  const source = JSON.parse(
    await fs.readFile('editions/self/src/edition/static/authoring/metrics.json', 'utf8'),
  );
  const record = new Map(source.records).get('["Source Bundle",14.5,"600"]');
  const supply = await loadBundledFonts();
  const label = {
    id: 'source-bundle',
    text: 'Source Bundle',
    fontSize: 14.5,
    weight: '600',
    anchor: 'middle',
    x: 300,
    baseline: 200,
    visible: true,
  };
  const measurer = await createBundledTextMeasurer(supply, [label]);
  const box = measurer.box(label);
  assert(Math.abs(box.x - (300 - record.width / 2 + record.glyph.x)) < 0.01);
  assert(Math.abs(box.y - (200 - record.glyph.y - record.glyph.height)) < 0.01);
  assert(Math.abs(box.width - record.glyph.width) < 0.01);
  assert(Math.abs(box.height - record.glyph.height) < 0.01);

  await verifyAuthoredCanvasTextBoxes({ texts: [{ ...label, box }] }, supply);
  await assert.rejects(
    verifyAuthoredCanvasTextBoxes({ texts: [{ ...label, text: 'A'.repeat(100), box }] }, supply),
    { code: 'authored_canvas_text_metrics_invalid' },
  );
  await assert.rejects(
    verifyAuthoredCanvasTextBoxes(
      {
        texts: Array.from({ length: 101 }, () => ({ ...label, text: 'A'.repeat(2048), box })),
      },
      supply,
    ),
    { code: 'authored_canvas_text_measurement_limit' },
  );
});

test('authored text measurement refuses missing and malformed selected font supply', async () => {
  const supply = await loadBundledFonts();
  await assert.rejects(createBundledTextMeasurer(null), {
    code: 'authored_canvas_font_measurement_invalid',
  });
  await assert.rejects(createBundledTextMeasurer({ fonts: [] }), {
    code: 'authored_canvas_font_measurement_invalid',
  });
  await assert.rejects(
    createBundledTextMeasurer({
      fonts: supply.fonts.map((font) =>
        font.weight === 400 ? { ...font, bytes: Buffer.from('invalid font') } : font,
      ),
    }),
    { code: 'authored_canvas_font_measurement_invalid' },
  );
});

test('authored text measurement refuses invalid labels without inventing a visible witness', async () => {
  const supply = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(supply);
  assert.throws(
    () =>
      measurer.box({
        text: 'A',
        fontSize: 16,
        weight: '900',
        anchor: 'middle',
        x: 20,
        baseline: 30,
      }),
    { code: 'authored_canvas_text_metrics_invalid' },
  );
  await assert.rejects(verifyAuthoredCanvasTextBoxes({ texts: null }, supply), {
    code: 'authored_canvas_text_metrics_invalid',
  });
  await verifyAuthoredCanvasTextBoxes({ texts: [{ text: 'Hidden', visible: false }] }, supply);
});
