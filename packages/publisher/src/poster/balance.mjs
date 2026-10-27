import { inflateSync } from "node:zlib";
import { refuse } from "../refusal.mjs";

/**
 * Balance of a composed page, measured from ink. Geometry and the rendered
 * raster share this one measure: both become a grid of cells whose ink is the
 * share of their pixels darker than the page.
 * @typedef {{ cell: number, columns: number, rows: number, ink: Float64Array }} InkGrid
 * @typedef {{ x: number, y: number, width: number, height: number }} Field
 */

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
/** A pixel counts as ink when one channel differs from the page by more than this. */
const INK_DIFFERENCE = 24;

/**
 * Decode an 8-bit, non-interlaced RGBA PNG, the format the vendored resvg writes.
 * @param {Buffer} bytes
 */
export function decodePng(bytes) {
  const unreadable = (detail) =>
    refuse("raster_unreadable", `The rendered poster cannot be measured: ${detail}.`);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(SIGNATURE)) unreadable("not a PNG");
  let offset = 8;
  let width = 0;
  let height = 0;
  const data = [];
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("latin1", offset + 4, offset + 8);
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const [depth, color, , , interlace] = body.subarray(8, 13);
      if (depth !== 8 || color !== 6 || interlace !== 0) unreadable("not 8-bit RGBA");
    } else if (type === "IDAT") data.push(body);
    else if (type === "IEND") break;
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i += 1) {
      const left = i >= 4 ? pixels[y * stride + i - 4] : 0;
      const up = y ? pixels[(y - 1) * stride + i] : 0;
      const corner = i >= 4 && y ? pixels[(y - 1) * stride + i - 4] : 0;
      const predictor =
        filter === 1
          ? left
          : filter === 2
            ? up
            : filter === 3
              ? (left + up) >> 1
              : filter === 4
                ? paeth(left, up, corner)
                : 0;
      pixels[y * stride + i] = (line[i] + predictor) & 0xff;
    }
  }
  return { width, height, data: pixels };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/**
 * The share of ink in each square cell of a decoded image.
 * @param {{ width: number, height: number, data: Buffer }} image
 * @param {number} cell
 * @param {[number, number, number]} paper the page color
 * @returns {InkGrid}
 */
export function inkGrid(image, cell, paper) {
  const columns = Math.floor(image.width / cell);
  const rows = Math.floor(image.height / cell);
  const ink = new Float64Array(columns * rows);
  for (let row = 0; row < rows; row += 1)
    for (let column = 0; column < columns; column += 1) {
      let dark = 0;
      for (let y = row * cell; y < (row + 1) * cell; y += 1)
        for (let x = column * cell; x < (column + 1) * cell; x += 1) {
          const at = (y * image.width + x) * 4;
          const difference = Math.max(
            Math.abs(image.data[at] - paper[0]),
            Math.abs(image.data[at + 1] - paper[1]),
            Math.abs(image.data[at + 2] - paper[2]),
          );
          if (difference > INK_DIFFERENCE) dark += 1;
        }
      ink[row * columns + column] = dark / (cell * cell);
    }
  return { cell, columns, rows, ink };
}

/** Cell index range covered by a field, clamped to the grid. */
function cellsOf(grid, field) {  return {
    left: Math.max(0, Math.round(field.x / grid.cell)),
    top: Math.max(0, Math.round(field.y / grid.cell)),
    right: Math.min(grid.columns, Math.round((field.x + field.width) / grid.cell)),
    bottom: Math.min(grid.rows, Math.round((field.y + field.height) / grid.cell)),
  };
}

/**
 * The largest axis-aligned rectangle of cells without ink inside `live`, by
 * the maximal-rectangle-in-histogram method.
 */
function largestEmpty(grid, live) {
  const { left, top, right, bottom } = cellsOf(grid, live);
  const width = right - left;
  const heights = new Array(width).fill(0);
  let best = { area: 0, x: left, y: top, width: 0, height: 0 };
  for (let row = top; row < bottom; row += 1) {
    for (let i = 0; i < width; i += 1)
      heights[i] = grid.ink[row * grid.columns + left + i] > 0 ? 0 : heights[i] + 1;
    const stack = [];
    for (let i = 0; i <= width; i += 1) {
      const height = i < width ? heights[i] : 0;
      let start = i;
      while (stack.length && stack.at(-1).height >= height) {
        const top = /** @type {{ start: number, height: number }} */ (stack.pop());
        const area = top.height * (i - top.start);
        if (area > best.area)
          best = {
            area,
            x: left + top.start,
            y: row - top.height + 1,
            width: i - top.start,
            height: top.height,
          };
        start = top.start;
      }
      stack.push({ start, height });
    }
  }
  return { cells: best.area, total: width * (bottom - top), best };
}

/**
 * Balance of a page: the largest empty rectangle in the live area and its
 * share, the number of empty cells in a three-by-three division of the figure
 * field, the ink centroid's offset from the field center, and how much of the
 * field's width and height the ink reaches.
 * @param {InkGrid} grid
 * @param {{ live: Field, figure: Field }} regions
 */
export function balanceOf(grid, { live, figure }) {
  const empty = largestEmpty(grid, live);
  const { left, top, right, bottom } = cellsOf(grid, figure);
  const ninths = new Float64Array(9);
  let mass = 0;
  let mx = 0;
  let my = 0;
  /** @type {[number, number, number, number]} ink bounding box in cells */
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (let row = top; row < bottom; row += 1)
    for (let column = left; column < right; column += 1) {
      const ink = grid.ink[row * grid.columns + column];
      if (!ink) continue;
      const ninth =
        Math.min(2, Math.floor(((row - top) * 3) / (bottom - top))) * 3 +
        Math.min(2, Math.floor(((column - left) * 3) / (right - left)));
      ninths[ninth] += ink;
      mass += ink;
      mx += ink * (column + 0.5);
      my += ink * (row + 0.5);
      box[0] = Math.min(box[0], column);
      box[1] = Math.min(box[1], row);
      box[2] = Math.max(box[2], column + 1);
      box[3] = Math.max(box[3], row + 1);
    }
  const center = [(left + right) / 2, (top + bottom) / 2];
  const round = (value) => Math.round(value * 1000) / 1000;
  return {
    emptyShare: round(empty.total ? empty.cells / empty.total : 0),
    emptyRectangle: [
      empty.best.x * grid.cell,
      empty.best.y * grid.cell,
      empty.best.width * grid.cell,
      empty.best.height * grid.cell,
    ],
    emptyNinths: ninths.filter((value) => value === 0).length,
    centroid: mass
      ? [
          round((mx / mass - center[0]) / (right - left)),
          round((my / mass - center[1]) / (bottom - top)),
        ]
      : [0, 0],
    // The share of the field the ink reaches across and down: a figure drawn small
    // inside its field, or one that stops halfway down, measures short here.
    fill: mass
      ? [
          round((box[2] - box[0]) / (right - left)),
          round((box[3] - box[1]) / (bottom - top)),
        ]
      : [0, 0],
  };
}
