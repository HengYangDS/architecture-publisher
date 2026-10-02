import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import {
  createBundledTextMeasurer,
  verifyAuthoredCanvasTextBoxes,
} from '../packages/publisher/renderers/resvg/measurement.mjs';

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
