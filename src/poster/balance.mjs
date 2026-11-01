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
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Span
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
 * a rectangle covers any part of it. Each rectangle's cells are also kept as a
 * span, so a measure can work on the blocks the spans' edges cut the page
 * into: every cell of one block is covered alike.
 * @param {Ink[]} rects
 * @param {{ width: number, height: number }} page
 */
function cellsOf(rects, page) {
  const columns = Math.ceil(page.width / CELL);
  const rows = Math.ceil(page.height / CELL);
  const ink = new Uint8Array(columns * rows);
  const mass = new Uint8Array(columns * rows);
  /** @type {Span[]} */
  const spans = [];
  for (const rect of rects) {
    const left = Math.max(0, Math.floor(rect.x / CELL));
    const top = Math.max(0, Math.floor(rect.y / CELL));
    const right = Math.min(columns - 1, Math.floor((rect.x + rect.width - 0.001) / CELL));
    const bottom = Math.min(rows - 1, Math.floor((rect.y + rect.height - 0.001) / CELL));
    // Ink wholly off the page, or without width or height, covers no cell.
    if (!(left <= right && top <= bottom)) continue;
    spans.push({ left, top, right: right + 1, bottom: bottom + 1 });
    for (let row = top; row <= bottom; row += 1) {
      ink.fill(1, row * columns + left, row * columns + right + 1);
      if (rect.kind !== "stroke") mass.fill(1, row * columns + left, row * columns + right + 1);
    }
  }
  return { columns, rows, ink, mass, spans };
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
 * The spans that cover some cell of a range.
 * @param {{ spans: Span[] }} grid
 * @param {{ left: number, top: number, right: number, bottom: number }} range
 */
function spansIn(grid, range) {
  return grid.spans.filter(
    (span) =>
      span.left < range.right &&
      span.right > range.left &&
      span.top < range.bottom &&
      span.bottom > range.top,
  );
}

/**
 * The edges spans set along one axis of a range, with the range's own ends, in
 * order: between two neighbouring edges every line of cells is covered alike.
 * @param {Span[]} spans
 * @param {"left" | "top"} start
 * @param {"right" | "bottom"} end
 * @param {number} from
 * @param {number} to
 */
function edgesOf(spans, start, end, from, to) {
  const edges = new Set([from, to]);
  for (const span of spans)
    for (const edge of [span[start], span[end]]) if (edge > from && edge < to) edges.add(edge);
  return [...edges].sort((a, b) => a - b);
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
 * The shifts that grow a run of one cell to `side` cells, each at most as long
 * as the run already is, so no cell between is skipped: 1, 2, 4, 8 and the rest.
 * A shift stays within one 32-bit word.
 * @param {number} side
 */
function doubling(side) {
  const steps = [];
  for (let reach = 1; reach < side;) {
    const step = Math.min(reach, side - reach, 31);
    steps.push(step);
    reach += step;
  }
  return steps;
}

/**
 * Each row of bits combined with itself `step` columns on: by AND with the
 * columns after it (`shrink`), so a bit stays set only where the set bits run
 * `step` further, or by OR with the columns before it, so every set bit
 * spreads `step` columns further.
 * @param {Uint32Array} bits
 * @param {number} words
 * @param {number} step
 * @param {boolean} shrink
 */
function shiftColumns(bits, words, step, shrink) {
  for (let base = 0; base < bits.length; base += words)
    if (shrink)
      for (let word = 0; word < words; word += 1) {
        const next = word + 1 < words ? bits[base + word + 1] : 0;
        bits[base + word] &= (bits[base + word] >>> step) | (next << (32 - step));
      }
    else
      for (let word = words - 1; word >= 0; word -= 1) {
        const previous = word > 0 ? bits[base + word - 1] : 0;
        bits[base + word] |= (bits[base + word] << step) | (previous >>> (32 - step));
      }
}

/**
 * Each row of bits combined with the row `step` lines on: by AND with the row
 * below it (`shrink`), a row past the last counting as all ink, or by OR with
 * the row above it.
 * @param {Uint32Array} bits
 * @param {number} words
 * @param {number} step
 * @param {boolean} shrink
 */
function shiftRows(bits, words, step, shrink) {
  const offset = step * words;
  if (shrink) {
    for (let at = 0; at + offset < bits.length; at += 1) bits[at] &= bits[at + offset];
    bits.fill(0, Math.max(0, bits.length - offset));
  } else for (let at = bits.length - 1; at >= offset; at -= 1) bits[at] |= bits[at - offset];
}

/**
 * The share of the live area covered by holes: empty squares, with any ink
 * counting, at least `HOLE` px on a side. A wire crossing a region divides it;
 * the gaps and channels a figure is built from are narrower than a hole.
 *
 * Each row of cells is a row of bits, set where no ink is. Shrinking the set
 * bits by the hole's side across the row and then down leaves the corner of
 * every empty square of that side; growing them back covers its squares.
 */
function holeShare(grid, live) {
  const range = rangeOf(grid, live);
  const { left, top, right, bottom } = range;
  const width = right - left;
  const height = bottom - top;
  const words = Math.ceil(width / 32);
  const bits = new Uint32Array(words * height).fill(0xffffffff);
  // The last word of a row holds only the bits of the columns it has.
  const last = 2 ** (width - 32 * (words - 1)) - 1;
  for (let row = 1; row <= height; row += 1) bits[row * words - 1] = last;
  for (const span of spansIn(grid, range)) {
    const from = Math.max(span.left, left) - left;
    const to = Math.min(span.right, right) - left;
    for (
      let row = Math.max(span.top, top) - top;
      row < Math.min(span.bottom, bottom) - top;
      row += 1
    )
      for (let column = from; column < to;) {
        const count = Math.min(32 - (column % 32), to - column);
        bits[row * words + Math.floor(column / 32)] &= ~((2 ** count - 1) * 2 ** (column % 32));
        column += count;
      }
  }
  const steps = doubling(Math.ceil(HOLE / CELL));
  for (const step of steps) shiftColumns(bits, words, step, true);
  for (const step of steps) shiftRows(bits, words, step, true);
  for (const step of steps) shiftRows(bits, words, step, false);
  for (const step of steps) shiftColumns(bits, words, step, false);
  let covered = 0;
  for (let value of bits) {
    value -= (value >>> 1) & 0x55555555;
    value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
    covered += Math.imul((value + (value >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
  }
  return covered / Math.max(1, width * height);
}

/**
 * The largest rectangle of the live area that no ink touches, by the
 * maximal-rectangle-in-histogram method: one blank block the eye finds at once,
 * however the rest of the page is filled. The histogram stands on the blocks
 * the spans cut the area into, one bar per block of columns, taken at the last
 * row of each band of rows: a blank rectangle that ends inside a block can
 * still grow, so the largest never does.
 */
function largestBlank(grid, live) {
  const range = rangeOf(grid, live);
  const { left, top, right, bottom } = range;
  const spans = spansIn(grid, range);
  const columns = edgesOf(spans, "left", "right", left, right);
  const rows = edgesOf(spans, "top", "bottom", top, bottom);
  const heights = new Array(columns.length - 1).fill(0);
  let best = { area: 0, x: left, y: top, width: 0, height: 0 };
  for (let band = 1; band < rows.length; band += 1) {
    const row = rows[band] - 1;
    for (let i = 0; i < heights.length; i += 1)
      heights[i] = grid.ink[row * grid.columns + columns[i]]
        ? 0
        : heights[i] + rows[band] - rows[band - 1];
    const stack = [];
    for (let i = 0; i < columns.length; i += 1) {
      const height = i < heights.length ? heights[i] : 0;
      const at = columns[i] - left;
      let start = at;
      while (stack.length && stack.at(-1).height >= height) {
        const open = /** @type {{ start: number, height: number }} */ (stack.pop());
        const area = open.height * (at - open.start);
        if (area > best.area)
          best = {
            area,
            x: left + open.start,
            y: row - open.height + 1,
            width: at - open.start,
            height: open.height,
          };
        start = open.start;
      }
      stack.push({ start, height });
    }
  }
  const total = (right - left) * (bottom - top);
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
