import { POSTER } from "./tokens.mjs";

/**
 * Balance of a composed page, measured from what it prints. A page is still
 * geometry when it is measured: every element it draws is a rectangle of ink,
 * either mass — text, a card, a relation label, an icon — or a stroke, a thin
 * wire or rule. Each rectangle also carries its darkness per unit of area, so
 * the page's centre of gravity is the centre of what a reader sees, not of the
 * boxes the elements were set in.
 *
 * The measures were calibrated on pages a reader judged: the posters the visual
 * review rejected for blank bands and empty corners fail them, and the pages it
 * judged balanced pass.
 * @typedef {{ x: number, y: number, width: number, height: number,
 *   kind?: "mass" | "stroke", weight?: number }} Ink
 * @typedef {{ x: number, y: number, width: number, height: number }} Field
 */

/** The side of a measuring cell in px. */
const CELL = 8;
/**
 * The side of the smallest square a reader sees as a hole in the page: wider
 * than any gutter, channel or gap the grid sets on purpose, and narrower than
 * the corners a figure of few cards leaves on a full page.
 */
const HOLE = 240;

/**
 * Darkness weights, per unit of area, of each kind of ink. A line box of text
 * prints about a third of its area; a white card prints only its outline, bar
 * and shadow; a wire's rectangle is twice its stroke wide. Fitted so the
 * geometric centroid of the review pages matches their rendered raster within
 * 0.035 of the page.
 */
export const DARKNESS = Object.freeze({ text: 0.35, card: 0.05, stroke: 0.4, glyph: 0.05 });

const luminance = (color) => {
  const [r, g, b] = [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const PAPER = luminance(POSTER.color.paper);

/** How much darker than the page a color prints, from 0 for paper to 1 for black. */
export const darkness = (color) => Math.max(0, 1 - luminance(color) / PAPER);

/**
 * Cells of the page covered by ink, and by mass alone: a cell is covered when
 * a rectangle covers any part of it.
 * @param {Ink[]} rects
 * @param {{ width: number, height: number }} page
 */
function cellsOf(rects, page) {
  const columns = Math.ceil(page.width / CELL);
  const rows = Math.ceil(page.height / CELL);
  const ink = new Uint8Array(columns * rows);
  const mass = new Uint8Array(columns * rows);
  for (const rect of rects) {
    const left = Math.max(0, Math.floor(rect.x / CELL));
    const top = Math.max(0, Math.floor(rect.y / CELL));
    const right = Math.min(columns - 1, Math.floor((rect.x + rect.width - 0.001) / CELL));
    const bottom = Math.min(rows - 1, Math.floor((rect.y + rect.height - 0.001) / CELL));
    for (let row = top; row <= bottom; row += 1) {
      ink.fill(1, row * columns + left, row * columns + right + 1);
      if (rect.kind !== "stroke") mass.fill(1, row * columns + left, row * columns + right + 1);
    }
  }
  return { columns, rows, ink, mass };
}

/** The cell range of a field, clamped to the grid. */
function rangeOf(grid, field) {
  return {
    left: Math.max(0, Math.round(field.x / CELL)),
    top: Math.max(0, Math.round(field.y / CELL)),
    right: Math.min(grid.columns, Math.round((field.x + field.width) / CELL)),
    bottom: Math.min(grid.rows, Math.round((field.y + field.height) / CELL)),
  };
}

/**
 * The tallest band of the live area, across its whole width, that carries no
 * mass. A band crossed only by wires or a rule is still blank to a reader.
 */
function blankBand(grid, live) {
  const { left, top, right, bottom } = rangeOf(grid, live);
  let best = { height: 0, y: live.y };
  let run = 0;
  for (let row = top; row < bottom; row += 1) {
    const line = grid.mass.subarray(row * grid.columns + left, row * grid.columns + right);
    run = line.includes(1) ? 0 : run + 1;
    if (run * CELL > best.height) best = { height: run * CELL, y: (row - run + 1) * CELL };
  }
  return best;
}

/**
 * The share of the live area covered by holes: empty squares, with any ink
 * counting, at least `HOLE` px on a side. A wire crossing a region divides it;
 * the gaps and channels a figure is built from are narrower than a hole.
 */
function holeShare(grid, live) {
  const { left, top, right, bottom } = rangeOf(grid, live);
  const width = right - left;
  const height = bottom - top;
  const side = Math.ceil(HOLE / CELL);
  const stride = width + 1;
  // The side of the largest empty square ending at each cell, and where one of
  // at least the hole's side ends.
  const square = new Int32Array(stride * (height + 1));
  const ends = new Int32Array(stride * (height + 1));
  for (let row = 0; row < height; row += 1)
    for (let column = 0; column < width; column += 1) {
      const at = (row + 1) * stride + column + 1;
      const empty = !grid.ink[(top + row) * grid.columns + left + column];
      square[at] = empty
        ? 1 + Math.min(square[at - 1], square[at - stride], square[at - stride - 1])
        : 0;
      ends[at] =
        (square[at] >= side ? 1 : 0) + ends[at - 1] + ends[at - stride] - ends[at - stride - 1];
    }
  // A cell lies in a hole when some hole square ending within one side of it covers it.
  let covered = 0;
  for (let row = 0; row < height; row += 1)
    for (let column = 0; column < width; column += 1) {
      const lastRow = Math.min(height, row + side);
      const lastColumn = Math.min(width, column + side);
      const count =
        ends[lastRow * stride + lastColumn] -
        ends[row * stride + lastColumn] -
        ends[lastRow * stride + column] +
        ends[row * stride + column];
      if (count > 0) covered += 1;
    }
  return width * height ? covered / (width * height) : 0;
}

/**
 * The largest rectangle of the live area that no ink touches, by the
 * maximal-rectangle-in-histogram method: one blank block the eye finds at once,
 * however the rest of the page is filled.
 */
function largestBlank(grid, live) {
  const { left, top, right, bottom } = rangeOf(grid, live);
  const width = right - left;
  const heights = new Array(width).fill(0);
  let best = { area: 0, x: left, y: top, width: 0, height: 0 };
  for (let row = top; row < bottom; row += 1) {
    for (let i = 0; i < width; i += 1)
      heights[i] = grid.ink[row * grid.columns + left + i] ? 0 : heights[i] + 1;
    const stack = [];
    for (let i = 0; i <= width; i += 1) {
      const height = i < width ? heights[i] : 0;
      let start = i;
      while (stack.length && stack.at(-1).height >= height) {
        const open = /** @type {{ start: number, height: number }} */ (stack.pop());
        const area = open.height * (i - open.start);
        if (area > best.area)
          best = {
            area,
            x: left + open.start,
            y: row - open.height + 1,
            width: i - open.start,
            height: open.height,
          };
        start = open.start;
      }
      stack.push({ start, height });
    }
  }
  const total = width * (bottom - top);
  return {
    share: total ? best.area / total : 0,
    rectangle: [best.x * CELL, best.y * CELL, best.width * CELL, best.height * CELL],
  };
}

/** The darkness-weighted centre of the live area's ink, as a share of its width and height off centre. */
function centroidOf(rects, live) {
  let mass = 0;
  let mx = 0;
  let my = 0;
  for (const rect of rects) {
    const x1 = Math.max(live.x, rect.x);
    const y1 = Math.max(live.y, rect.y);
    const x2 = Math.min(live.x + live.width, rect.x + rect.width);
    const y2 = Math.min(live.y + live.height, rect.y + rect.height);
    if (x2 <= x1 || y2 <= y1) continue;
    const weight = (x2 - x1) * (y2 - y1) * (rect.weight ?? 0);
    mass += weight;
    mx += (weight * (x1 + x2)) / 2;
    my += (weight * (y1 + y2)) / 2;
  }
  if (!mass) return [0, 0];
  return [
    (mx / mass - (live.x + live.width / 2)) / live.width,
    (my / mass - (live.y + live.height / 2)) / live.height,
  ];
}

/**
 * Balance of one page: the largest blank rectangle in its live area and its
 * share, the tallest blank band across it, the share of the live area that
 * lies in holes, and its centre of gravity. The rectangle finds one blank
 * block, the band a blank stripe between a figure and its text, and the holes
 * the corners a sparse figure leaves on every side.
 * @param {Ink[]} rects every rectangle of ink the page draws
 * @param {Field} live the live area inside the page's margins
 * @param {{ width: number, height: number }} [page]
 */
export function balanceOf(rects, live, page = POSTER) {
  const grid = cellsOf(rects, page);
  const round = (value) => Math.round(value * 1000) / 1000;
  const blank = largestBlank(grid, live);
  return {
    emptyShare: round(blank.share),
    emptyRectangle: blank.rectangle,
    band: blankBand(grid, live),
    holes: round(holeShare(grid, live)),
    centroid: centroidOf(rects, live).map(round),
  };
}
