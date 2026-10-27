import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import test from "node:test";
import { balanceOf, decodePng, inkGrid } from "../packages/publisher/src/poster/balance.mjs";

/** An 8-bit RGBA PNG of `width` × `height` pixels drawn by `paint(x, y)`, with mixed row filters. */
function png(width, height, paint) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    const filter = y % 5;
    raw[row] = filter;
    const pixels = Buffer.alloc(width * 4);
    for (let x = 0; x < width; x += 1) pixels.set(paint(x, y), x * 4);
    const previous = y ? decodedRows[y - 1] : Buffer.alloc(width * 4);
    for (let i = 0; i < pixels.length; i += 1) {
      const left = i >= 4 ? pixels[i - 4] : 0;
      const up = previous[i];
      const corner = i >= 4 ? previous[i - 4] : 0;
      const predictor = [0, left, up, (left + up) >> 1, paeth(left, up, corner)][filter];
      raw[row + 1 + i] = (pixels[i] - predictor) & 0xff;
    }
    decodedRows[y] = pixels;
  }
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    return Buffer.concat([length, Buffer.from(type, "latin1"), data, Buffer.alloc(4)]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const decodedRows = [];
function paeth(a, b, c) {
  const p = a + b - c;
  const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

const PAPER = [251, 251, 248, 255];
const INK = [20, 27, 38, 255];

test("a PNG decodes to its exact pixels under every row filter", () => {
  const paint = (x, y) => [x * 3, y * 7, (x + y) % 256, 255];
  const image = decodePng(png(37, 23, paint));
  assert.equal(image.width, 37);
  assert.equal(image.height, 23);
  for (const [x, y] of [
    [0, 0],
    [36, 22],
    [17, 11],
    [5, 19],
  ])
    assert.deepEqual([...image.data.subarray((y * 37 + x) * 4, (y * 37 + x) * 4 + 4)], paint(x, y));
});

test("only an 8-bit RGBA non-interlaced PNG is accepted", () => {
  const good = png(4, 4, () => PAPER);
  const bad = Buffer.from(good);
  bad[24] = 16;
  assert.throws(() => decodePng(bad), { code: "raster_unreadable" });
  assert.throws(() => decodePng(Buffer.from("not a png")), { code: "raster_unreadable" });
});

test("ink is measured per cell against the page color", () => {
  const image = decodePng(png(16, 8, (x) => (x < 8 ? INK : PAPER)));
  const grid = inkGrid(image, 8, PAPER.slice(0, 3));
  assert.equal(grid.columns, 2);
  assert.equal(grid.rows, 1);
  assert.ok(grid.ink[0] > 0.9);
  assert.equal(grid.ink[1], 0);
});

/** A grid of `columns` × `rows` cells with ink where `inked(column, row)` holds. */
function cells(columns, rows, inked) {
  return {
    cell: 10,
    columns,
    rows,
    ink: Float64Array.from({ length: columns * rows }, (_, index) =>
      inked(index % columns, Math.floor(index / columns)) ? 1 : 0,
    ),
  };
}
const field = (x, y, width, height) => ({ x, y, width, height });

test("a figure that fills its field is balanced", () => {
  const grid = cells(40, 30, (column, row) => (column + row) % 3 === 0);
  const measured = balanceOf(grid, { live: field(0, 0, 400, 300), figure: field(0, 0, 400, 300) });
  assert.ok(measured.emptyShare <= 0.05);
  assert.equal(measured.emptyNinths, 0);
  assert.ok(Math.abs(measured.centroid[0]) < 0.05 && Math.abs(measured.centroid[1]) < 0.05);
});

test("a strip in the middle of the field leaves empty space, empty ninths and no offset", () => {
  const grid = cells(40, 30, (_, row) => row >= 14 && row < 16);
  const measured = balanceOf(grid, { live: field(0, 0, 400, 300), figure: field(0, 0, 400, 300) });
  assert.ok(measured.emptyShare > 0.4);
  assert.equal(measured.emptyNinths, 6);
  assert.ok(Math.abs(measured.centroid[1]) < 0.02);
  // Ink crosses the field, but reaches only two of thirty rows down it.
  assert.deepEqual(measured.fill, [1, 0.067]);
});

test("ink on one side moves the centroid toward it", () => {
  const grid = cells(40, 30, (column) => column < 12);
  const measured = balanceOf(grid, { live: field(0, 0, 400, 300), figure: field(0, 0, 400, 300) });
  assert.ok(measured.centroid[0] < -0.3);
  assert.equal(measured.emptyNinths, 6);
  assert.ok(measured.emptyShare > 0.6);
  assert.deepEqual(measured.emptyRectangle, [120, 0, 280, 300]);
});

test("the largest empty rectangle is measured inside the live area only", () => {
  const grid = cells(40, 30, (column, row) => column === 0 || row === 0 || column === 39);
  const measured = balanceOf(grid, { live: field(100, 100, 200, 100), figure: field(100, 100, 200, 100) });
  assert.deepEqual(measured.emptyRectangle, [100, 100, 200, 100]);
  assert.equal(measured.emptyShare, 1);
});
