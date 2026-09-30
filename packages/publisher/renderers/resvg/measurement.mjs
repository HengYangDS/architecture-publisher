import { fail } from '../../src/protocol/values.mjs';
import { parse as parseFont } from './supply/opentype/opentype.mjs';
import { verifyRasterSupply } from './supply.mjs';

const weights = new Set(['400', '600']);
const tolerance = 0.5;
const maximumGlyphs = 200_000;

function parsedFont(bytes) {
  try {
    return parseFont(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  } catch {
    fail('authored_canvas_font_measurement_invalid');
  }
}

/** Measure the actual selected font glyphs, not a supplied character-count box. */
export async function createBundledTextMeasurer(supply) {
  const verifiedSupply = await verifyRasterSupply();
  if (!Array.isArray(supply?.fonts)) fail('authored_canvas_font_measurement_invalid');
  const fonts = new Map(
    supply.fonts
      .filter(({ weight }) => weights.has(String(weight)))
      .map(({ weight, bytes }) => [String(weight), parsedFont(bytes)]),
  );
  if (fonts.size !== weights.size) fail('authored_canvas_font_measurement_invalid');
  return {
    supply: { id: 'font-measurement', sha256: verifiedSupply.sha256 },
    box({ text, fontSize, weight, anchor, x, baseline }) {
      const font = fonts.get(weight);
      if (
        !font ||
        typeof text !== 'string' ||
        !text.trim() ||
        /[\r\n]/u.test(text) ||
        !Number.isFinite(fontSize) ||
        fontSize <= 0 ||
        !Number.isFinite(x) ||
        !Number.isFinite(baseline) ||
        !['start', 'middle', 'end'].includes(anchor) ||
        !Number.isFinite(font.unitsPerEm) ||
        font.unitsPerEm <= 0
      )
        fail('authored_canvas_text_metrics_invalid');
      const scale = fontSize / font.unitsPerEm;
      const glyphs = [...text].map((character) => {
        const glyph = font.charToGlyph(character);
        if (!glyph?.index || !Number.isFinite(glyph.advanceWidth))
          fail('authored_canvas_glyph_missing');
        return glyph;
      });
      const advance = glyphs.reduce((sum, glyph) => sum + glyph.advanceWidth * scale, 0);
      let pen = x - (anchor === 'middle' ? advance / 2 : anchor === 'end' ? advance : 0);
      const bounds = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
      for (const glyph of glyphs) {
        let box;
        try {
          box = glyph.getBoundingBox();
        } catch {
          fail('authored_canvas_font_measurement_invalid');
        }
        if (box.x1 !== box.x2 || box.y1 !== box.y2) {
          bounds.x1 = Math.min(bounds.x1, pen + box.x1 * scale);
          bounds.x2 = Math.max(bounds.x2, pen + box.x2 * scale);
          bounds.y1 = Math.min(bounds.y1, baseline - box.y2 * scale);
          bounds.y2 = Math.max(bounds.y2, baseline - box.y1 * scale);
        }
        pen += glyph.advanceWidth * scale;
      }
      if (![bounds.x1, bounds.y1, bounds.x2, bounds.y2].every(Number.isFinite))
        fail('authored_canvas_text_metrics_invalid');
      return {
        x: bounds.x1,
        y: bounds.y1,
        width: bounds.x2 - bounds.x1,
        height: bounds.y2 - bounds.y1,
      };
    },
  };
}

/** Refuse authored boxes that do not describe the bundled font's painted glyphs. */
export async function verifyAuthoredCanvasTextBoxes(scene, supply) {
  if (
    !Array.isArray(scene?.texts) ||
    scene.texts.some(
      (label) => !label || typeof label.text !== 'string' || typeof label.visible !== 'boolean',
    )
  )
    fail('authored_canvas_text_metrics_invalid');
  if (
    scene.texts.reduce((total, label) => total + (label.visible ? [...label.text].length : 0), 0) >
    maximumGlyphs
  )
    fail('authored_canvas_text_measurement_limit');
  const measurer = await createBundledTextMeasurer(supply);
  for (const label of scene.texts) {
    if (!label.visible) continue;
    const actual = measurer.box(label);
    const declared = label.box;
    if (
      !declared ||
      [
        actual.x - declared.x,
        actual.y - declared.y,
        actual.width - declared.width,
        actual.height - declared.height,
      ].some((difference) => !Number.isFinite(difference) || Math.abs(difference) > tolerance)
    )
      fail(
        'authored_canvas_text_metrics_invalid',
        `authored_canvas_text_metrics_invalid:${label.id}`,
      );
  }
  return measurer;
}
