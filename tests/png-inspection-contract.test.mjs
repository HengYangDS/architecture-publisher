import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateSync } from 'node:zlib';
import {
  inspectRgbaPngCanvas,
  inspectRgbaPngElements,
} from '../packages/publisher/src/qualification/static/png.mjs';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii'),
    size = Buffer.alloc(4),
    checksum = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}

function png(filter = 0, options = {}) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(2, 0);
  header.writeUInt32BE(options.height ?? 1, 4);
  header[8] = 8;
  header[9] = options.colorType ?? 6;
  const raw = options.raw ?? Buffer.from([filter, 0, 0, 0, 255, 255, 255, 255, 255]);
  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    ...(options.extra ? [chunk(options.extra, Buffer.alloc(0))] : []),
    ...(options.noData ? [] : [chunk('IDAT', options.compressed ?? deflateSync(raw))]),
    ...(options.noEnd ? [] : [chunk('IEND', Buffer.alloc(0))]),
  ]);
}

test('RGBA inspection decodes every standard row filter from valid PNG chunks', () => {
  for (const filter of [0, 1, 2, 3, 4]) {
    const report = inspectRgbaPngCanvas(png(filter), { background: [0, 0, 0, 0] });
    assert.equal(report.width, 2);
    assert.equal(report.height, 1);
    assert(report.inkPixels > 0);
  }
  assert.equal(
    inspectRgbaPngCanvas(png(0, { extra: 'tEXt' }), { background: [0, 0, 0, 0] }).width,
    2,
  );
});

test('Paeth reconstruction chooses prior-row and upper-left samples when they are nearest', () => {
  const raw = Buffer.from([0, 50, 0, 0, 255, 100, 0, 0, 255, 4, 206, 0, 0, 0, 0, 0, 0, 0]);
  const report = inspectRgbaPngCanvas(png(4, { height: 2, raw }), {
    background: [0, 0, 0, 255],
  });
  assert.equal(report.height, 2);
  assert.equal(report.inkPixels, 3);
});

test('painted-canvas thresholds expose clearance, fill and balance independently', () => {
  const report = inspectRgbaPngCanvas(png(), {
    minimumClearance: 1,
    minimumEnvelopeFraction: 1,
    maximumCenterOffsetFraction: 0.1,
  });
  assert.deepEqual(
    report.failures.map(({ code }) => code),
    ['png-canvas-clearance', 'png-canvas-fill', 'png-canvas-balance'],
  );
  assert.equal(report.inkPixels, 1);
});

test('PNG inspection rejects truncated, unsupported and inconsistent raster bytes', () => {
  assert.throws(() => inspectRgbaPngCanvas('not PNG bytes'), { code: 'png_canvas_invalid' });
  const cases = [
    ['truncated chunk', png().subarray(0, 12), 'png_canvas_invalid'],
    ['truncated data', png().subarray(0, 30), 'png_canvas_invalid'],
    ['unsupported color', png(0, { colorType: 2 }), 'png_canvas_unsupported'],
    ['unknown critical chunk', png(0, { extra: 'ABCD' }), 'png_canvas_unsupported'],
    ['missing image data', png(0, { noData: true }), 'png_canvas_invalid'],
    ['missing terminator', png(0, { noEnd: true }), 'png_canvas_invalid'],
    ['invalid compression', png(0, { compressed: Buffer.from('not zlib') }), 'png_canvas_invalid'],
    ['wrong decoded length', png(0, { raw: Buffer.from([0, 1]) }), 'png_canvas_invalid'],
    ['unknown filter', png(5), 'png_canvas_unsupported'],
  ];
  for (const [name, bytes, code] of cases)
    assert.throws(() => inspectRgbaPngCanvas(bytes), { code }, name);
  assert.throws(() => inspectRgbaPngCanvas(Buffer.concat([png(), Buffer.from([0])])), {
    code: 'png_canvas_invalid',
  });
});

test('raster contract and scene limits reject untrusted values before painted qualification', () => {
  const bytes = png();
  for (const background of [[], [0, 0, 0, 999], 'paper'])
    assert.throws(() => inspectRgbaPngCanvas(bytes, { background }), {
      code: 'png_canvas_contract_invalid',
    });
  for (const contract of [
    { minimumEnvelopeFraction: -1 },
    { minimumEnvelopeFraction: 2 },
    { maximumCenterOffsetFraction: -1 },
    { maximumCenterOffsetFraction: 1 },
  ])
    assert.throws(() => inspectRgbaPngCanvas(bytes, contract), {
      code: 'png_canvas_contract_invalid',
    });

  const scene = {
    width: 2,
    height: 1,
    paint: { ink: '#26362f' },
    texts: [],
    nodes: [],
    edges: [],
    decorations: [],
  };
  const observed = inspectRgbaPngElements(bytes, scene, { background: [0, 0, 0, 0] });
  assert(observed.failures.some(({ code }) => code === 'png-unassigned-ink'));
  for (const contract of [{ background: [] }, { sourcePadding: -1 }, { paintTolerance: -1 }])
    assert.throws(() => inspectRgbaPngElements(bytes, scene, contract), {
      code: 'png_elements_contract_invalid',
    });
  assert.throws(() => inspectRgbaPngElements(bytes, { ...scene, width: 0 }), {
    code: 'png_elements_scene_invalid',
  });
});

test('painted element inspection distinguishes color, shape and unassigned ink', () => {
  const bytes = png();
  const scene = {
    width: 2,
    height: 1,
    paint: {
      ink: '#ffffff',
      line: '#ffffff',
      proof: '#ffffff',
      accent: '#ffffff',
      ghost: '#ffffff',
    },
    texts: [
      {
        id: 'label',
        text: 'L',
        visible: true,
        tone: 'ink',
        box: { x: 1, y: 0, width: 1, height: 1 },
      },
    ],
    nodes: [],
    edges: [],
    decorations: [],
  };
  const options = { background: [0, 0, 0, 255], sourcePadding: 0 };
  assert.equal(inspectRgbaPngElements(bytes, scene, options).regions[0].inkPixels, 1);

  const samePaint = structuredClone(scene);
  samePaint.paint.ink = '#000000';
  assert(
    inspectRgbaPngElements(bytes, samePaint, options).failures.some(
      ({ code }) => code === 'png-element-empty',
    ),
  );

  const invalidPaint = structuredClone(scene);
  invalidPaint.paint.ink = 'white';
  assert.throws(() => inspectRgbaPngElements(bytes, invalidPaint, options), {
    code: 'png_elements_scene_invalid',
  });

  const lowAlpha = png(0, { raw: Buffer.from([0, 0, 0, 0, 255, 1, 0, 0, 255]) });
  assert(
    inspectRgbaPngElements(lowAlpha, scene, { ...options, colorDistance: 0 }).failures.some(
      ({ code }) => code === 'png-element-empty',
    ),
  );

  const offCanvas = structuredClone(scene);
  offCanvas.texts[0].box.x = 10;
  assert.throws(() => inspectRgbaPngElements(bytes, offCanvas, options), {
    code: 'png_elements_scene_invalid',
  });

  const duplicate = structuredClone(scene);
  duplicate.texts.push({ ...duplicate.texts[0] });
  assert.throws(() => inspectRgbaPngElements(bytes, duplicate, options), {
    code: 'png_elements_scene_invalid',
  });

  const twoInkPixels = png(0, {
    raw: Buffer.from([0, 255, 255, 255, 255, 255, 255, 255, 255]),
  });
  const unassigned = inspectRgbaPngElements(twoInkPixels, scene, options);
  assert.equal(unassigned.unassignedInkPixels, 1);

  assert.throws(
    () => inspectRgbaPngCanvas(bytes, { background: [0, 0, 0, 255], colorDistance: 500 }),
    {
      code: 'png_canvas_empty',
    },
  );
});

test('painted arrows and rules require source-declared geometry', () => {
  const scene = {
    width: 2,
    height: 1,
    paint: { line: '#ffffff', proof: '#ffffff', accent: '#ffffff', ghost: '#ffffff' },
    texts: [],
    nodes: [],
    edges: [
      {
        id: 'edge',
        kind: 'feedback',
        arrow: true,
        points: [
          { x: 0, y: 0.5 },
          { x: 1, y: 0.5 },
        ],
        arrowGeometry: { length: 0.2, halfWidth: 0.1, strokeWidth: 0.1 },
      },
    ],
    decorations: [
      {
        id: 'rule',
        tone: 'line',
        points: [
          { x: 0, y: 0.1 },
          { x: 1, y: 0.1 },
        ],
      },
    ],
  };
  const options = { background: [0, 0, 0, 255], sourcePadding: 0 };
  const report = inspectRgbaPngElements(png(), scene, options);
  assert(report.regions.some(({ kind }) => kind === 'arrowhead'));
  assert(report.regions.some(({ id }) => id === 'rule:rule'));

  const invalid = structuredClone(scene);
  invalid.edges[0].arrow = false;
  assert.throws(() => inspectRgbaPngElements(png(), invalid, options), {
    code: 'png_elements_scene_invalid',
  });

  const noDirection = structuredClone(scene);
  noDirection.edges[0].points.pop();
  assert.throws(() => inspectRgbaPngElements(png(), noDirection, options), {
    code: 'png_elements_scene_invalid',
  });

  for (const kind of ['renewal', 'trust', 'flow']) {
    const selected = structuredClone(scene);
    selected.edges[0].kind = kind;
    assert(
      inspectRgbaPngElements(png(), selected, options).regions.some(
        ({ id }) => id === 'edge:edge:stroke',
      ),
      kind,
    );
  }
});
