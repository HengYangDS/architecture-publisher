import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fail, hasExactFields } from '../../src/protocol/values.mjs';
import { PROCESS_CLEANUP_MS, runOwnedProcess } from '../../src/runtime/process-tree.mjs';
import { readFontFace } from './font.mjs';
import { RASTER_LIMITS as limits } from './limits.mjs';
import { verifyRasterSupply } from './supply.mjs';

const weights = new Set(['400', '500', '600', '700']);
const tolerance = 0.5;
const worker = fileURLToPath(new URL('./worker.mjs', import.meta.url));
const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function decodeMeasurement(raw, state, reason, count) {
  if (reason === 'timeout') fail('authored_canvas_measurement_execution_timeout');
  if (reason === 'overflow') fail('authored_canvas_measurement_response_limit');
  if (
    !['closed', 'reply'].includes(reason) ||
    state.spawnError ||
    state.stderrBytes ||
    (reason === 'closed' && (!state.closed || state.closed.code !== 0 || state.closed.signal))
  )
    fail('authored_canvas_measurement_execution_failed');
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail('authored_canvas_measurement_response_invalid');
  }
  if (hasExactFields(value, ['status', 'code']) && value.status === 'error') {
    if (typeof value.code !== 'string' || !/^[a-z][a-z0-9_]{0,127}$/u.test(value.code))
      fail('authored_canvas_measurement_response_invalid');
    fail(value.code);
  }
  if (
    !hasExactFields(value, ['status', 'boxes']) ||
    value.status !== 'measured' ||
    !Array.isArray(value.boxes) ||
    value.boxes.length !== count * 4 ||
    value.boxes.some((number) => !Number.isFinite(number))
  )
    fail('authored_canvas_measurement_response_invalid');
  return value.boxes;
}

async function measureBatch(labels, fonts) {
  if (!labels.length) return [];
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" xml:space="preserve" text-rendering="geometricPrecision">${labels.map((label, index) => `<text id="architecture-measure-${index}" x="0" y="0" font-family="${escape(JSON.stringify(label.family))}" font-size="${label.fontSize}" font-weight="${label.weight}" text-anchor="${label.anchor}">${escape(label.text)}</text>`).join('')}</svg>`,
  );
  if (svg.length > limits.svgBytes) fail('authored_canvas_text_measurement_limit');
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-measure-'));
  try {
    const requestPath = path.join(scratch, 'request.json');
    await fs.writeFile(
      requestPath,
      JSON.stringify({
        schema: 'architecture.raster-measurement-request/v1',
        svg: svg.toString('base64'),
        fonts: fonts.map((face) => ({
          family: face.family,
          weight: face.weight,
          bytes: face.bytes.toString('base64'),
        })),
        count: labels.length,
      }),
      { flag: 'wx', mode: 0o600 },
    );
    return await runOwnedProcess({
      worker,
      nodeFlags: [
        `--max-old-space-size=${limits.heapMiB}`,
        `--wasm-max-mem-pages=${limits.wasmPages}`,
      ],
      args: [String(limits.executionMs + PROCESS_CLEANUP_MS + 1000)],
      requestPath,
      scratch,
      timeoutMs: limits.executionMs,
      maximumBytes: limits.measurementQueries * 160,
      failurePrefix: 'authored_canvas_measurement',
      decode: (raw, state, reason) => decodeMeasurement(raw, state, reason, labels.length),
    });
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

/** Prepare renderer-native shaped ink once; synchronous cache misses never estimate. */
export async function createBundledTextMeasurer(supply, requests = []) {
  const verifiedSupply = await verifyRasterSupply();
  if (!Array.isArray(supply?.fonts)) fail('authored_canvas_font_measurement_invalid');
  if (
    supply.fonts.length > limits.fonts ||
    supply.fonts.some(
      (face) => !face || !Buffer.isBuffer(face.bytes) || face.bytes.length > limits.fontBytes,
    ) ||
    supply.fonts.reduce((sum, { bytes }) => sum + bytes.length, 0) > limits.fontTotalBytes
  )
    fail('authored_canvas_font_measurement_invalid');
  const fonts = new Map();
  const defaultFamily = supply.defaultFamily ?? supply.manifest?.family ?? 'JetBrains Mono';
  for (const selected of supply.fonts) {
    if (!weights.has(String(selected.weight))) fail('authored_canvas_font_measurement_invalid');
    const face = readFontFace(selected.bytes, 'authored_canvas_font_measurement_invalid');
    const family = selected.family ?? defaultFamily;
    if (
      !face.aliases.has(family) ||
      face.weight !== Number(selected.weight) ||
      !face.normal ||
      !face.staticTtf
    )
      fail('authored_canvas_font_identity_mismatch');
    const key = JSON.stringify([face.family, String(selected.weight)]);
    const previous = fonts.get(key);
    if (previous && previous.sha256 !== face.sha256)
      fail('authored_canvas_font_identity_ambiguous');
    fonts.set(key, { ...face, bytes: selected.bytes });
  }
  if (!fonts.size) fail('authored_canvas_font_measurement_invalid');
  const validate = (label) => {
    if (!label || typeof label !== 'object') fail('authored_canvas_text_metrics_invalid');
    const { text, fontSize, weight, anchor, x, baseline, family = defaultFamily } = label;
    const face = fonts.get(JSON.stringify([family, weight]));
    if (!face && weights.has(weight)) fail('authored_canvas_font_unselected');
    if (
      !face ||
      typeof text !== 'string' ||
      !text.trim() ||
      text.length > 4096 ||
      !Number.isFinite(fontSize) ||
      fontSize <= 0 ||
      fontSize > 4096 ||
      !Number.isFinite(x) ||
      Math.abs(x) > 100000 ||
      !Number.isFinite(baseline) ||
      Math.abs(baseline) > 100000 ||
      !['start', 'middle', 'end'].includes(anchor)
    )
      fail('authored_canvas_text_metrics_invalid');
    if (
      /[\p{Mark}\p{Other}]/u.test(text) ||
      !/^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Common}]+$/u.test(
        text,
      ) ||
      /[\p{Separator}]/u.test(text.replaceAll(' ', ''))
    )
      fail('authored_canvas_text_profile_unsupported');
    for (const character of text)
      if (character !== ' ' && !face.font.charToGlyphIndex(character))
        fail('authored_canvas_glyph_missing');
    return { text, fontSize, weight, anchor, family, x, baseline };
  };
  const key = ({ text, fontSize, weight, anchor, family }) =>
    JSON.stringify([text, fontSize, weight, anchor, family]);
  if (!requests || typeof requests[Symbol.iterator] !== 'function')
    fail('authored_canvas_measurement_request_invalid');
  const prepared = new Map();
  let glyphs = 0;
  let count = 0;
  for (const request of requests) {
    if (++count > limits.measurementQueries) fail('authored_canvas_text_measurement_limit');
    const label = validate(request);
    if (prepared.has(key(label))) continue;
    glyphs += [...label.text].length;
    if (glyphs > limits.measurementGlyphs) fail('authored_canvas_text_measurement_limit');
    prepared.set(key(label), label);
  }
  const labels = [...prepared.values()];
  const nativeFonts = [...fonts.values()].map(({ family, weight, bytes }) => ({
    family,
    weight,
    bytes,
  }));
  const boxes = await measureBatch(labels, nativeFonts);
  const cache = new Map(
    labels.map((label, index) => {
      const [x, y, width, height] = boxes.slice(index * 4, index * 4 + 4);
      if (width <= 0 || height <= 0) fail('authored_canvas_measurement_response_invalid');
      return [key(label), { x, y, width, height }];
    }),
  );
  return {
    supply: { id: 'font-measurement', sha256: verifiedSupply.sha256 },
    defaultFamily,
    box(request) {
      const label = validate(request);
      const result = cache.get(key(label));
      if (!result) fail('authored_canvas_measurement_unprepared');
      return { ...result, x: result.x + label.x, y: result.y + label.baseline };
    },
  };
}

/** Check declared boxes against native shaped ink from the exact selected faces. */
export async function verifyAuthoredCanvasTextBoxes(scene, supply, extraRequests = []) {
  if (
    !Array.isArray(scene?.texts) ||
    scene.texts.some(
      (label) => !label || typeof label.text !== 'string' || typeof label.visible !== 'boolean',
    )
  )
    fail('authored_canvas_text_metrics_invalid');
  const labels = scene.texts.filter(({ visible }) => visible);
  if (
    [...labels, ...extraRequests].reduce((total, label) => total + [...label.text].length, 0) >
    limits.measurementGlyphs
  )
    fail('authored_canvas_text_measurement_limit');
  const measurer = await createBundledTextMeasurer(supply, [...labels, ...extraRequests]);
  for (const label of labels) {
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
