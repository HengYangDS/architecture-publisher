import { headBlock, legendBlock, notesBlock, placed, summaryOf } from "./blocks.mjs";
import { LIVE, columnX, spanWidth } from "./page.mjs";
import { POSTER } from "./tokens.mjs";

/**
 * Text set in a figure's corners. A layered figure is seldom a rectangle: a tree
 * is narrow at its root and a fan-in at its sink, and the paper beside its
 * narrow rows is the page's largest blank unless something is set there. The
 * head starts the page at its top-left corner and carries the summary beneath
 * its question, so the page reads in order; the legend, and the notes when the
 * page sets no footer, float: they are placed after the figure is drawn, into
 * the corners its rows leave free, at the widths and in the corners that leave
 * the page least empty. Every block keeps a fixed margin of paper from every
 * card, wire and label, and from the other blocks.
 */

const CELL = 8;
/** Paper kept between a floating block and anything already on the page. */
const CLEARANCE = 40;
/**
 * A boundary's frame is a thin dashed line, not a mass of ink, so text keeps a
 * narrower margin from it than from cards, wires and labels.
 */
const FRAME_CLEARANCE = 24;
const CORNERS = /** @type {const} */ (["top-left", "top-right", "bottom-left", "bottom-right"]);
/** Notes are fine print: they sit at the foot of the page, never above the figure. */
const FOOT = /** @type {const} */ (["bottom-left", "bottom-right"]);
/** The spans and columns a floating notes block is set in: stacked, or side by side. */
const NOTE_SHAPES = Object.freeze([
  [4, 1],
  [5, 1],
  [6, 1],
  [8, 3],
  [10, 3],
  [12, 3],
]);
/** Legend placements carried forward to be paired with every notes placement. */
const BEAM = 4;

/**
 * Cells of the page an obstacle covers, with a summed-area table so a block's
 * rectangle is tested in constant time.
 */
class Occupancy {
  constructor() {
    this.columns = Math.ceil(POSTER.width / CELL);
    this.rows = Math.ceil(POSTER.height / CELL);
    this.taken = new Uint8Array(this.columns * this.rows);
    this.sum = new Int32Array((this.columns + 1) * (this.rows + 1));
  }

  /** Mark a rectangle grown by `pad` on every side. */
  mark(rect, pad) {
    const left = Math.max(0, Math.floor((rect.x - pad) / CELL));
    const top = Math.max(0, Math.floor((rect.y - pad) / CELL));
    const right = Math.min(
      this.columns - 1,
      Math.floor((rect.x + rect.width + pad - 0.001) / CELL),
    );
    const bottom = Math.min(this.rows - 1, Math.floor((rect.y + rect.height + pad - 0.001) / CELL));
    for (let row = top; row <= bottom; row += 1)
      this.taken.fill(1, row * this.columns + left, row * this.columns + right + 1);
    return this;
  }

  /** Rebuild the summed-area table after marking. */
  seal() {
    const width = this.columns + 1;
    for (let row = 0; row < this.rows; row += 1) {
      let line = 0;
      for (let column = 0; column < this.columns; column += 1) {
        line += this.taken[row * this.columns + column];
        this.sum[(row + 1) * width + column + 1] = this.sum[row * width + column + 1] + line;
      }
    }
    return this;
  }

  /** Whether no marked cell lies under any of `rects`. */
  clear(rects) {
    const width = this.columns + 1;
    for (const rect of rects) {
      const left = Math.max(0, Math.floor(rect.x / CELL));
      const top = Math.max(0, Math.floor(rect.y / CELL));
      const right = Math.min(this.columns, Math.floor((rect.x + rect.width - 0.001) / CELL) + 1);
      const bottom = Math.min(this.rows, Math.floor((rect.y + rect.height - 0.001) / CELL) + 1);
      const taken =
        this.sum[bottom * width + right] -
        this.sum[top * width + right] -
        this.sum[bottom * width + left] +
        this.sum[top * width + left];
      if (taken) return false;
    }
    return true;
  }

  /** A copy with `rects` marked at the block clearance. */
  with(rects) {
    const next = new Occupancy();
    next.taken.set(this.taken);
    for (const rect of rects) next.mark(rect, CLEARANCE);
    return next.seal();
  }
}

/** The rectangles a block's lines and glyphs fill, at a position. */
function inkOf(block, x, y, typefaces) {
  return [
    ...block.runs.map((run) => ({
      x: run.x + x,
      y: run.top + y,
      width: typefaces.measure(run.value, run.style),
      height: run.style.line,
    })),
    ...block.glyphs.map((glyph) => ({
      x: glyph.x + x,
      y: glyph.top + y,
      width: glyph.size,
      height: glyph.size,
    })),
  ];
}

/**
 * The first position at or past `start` along a page edge where a block fits:
 * the top corners slide down, the bottom corners up. Null when the block fits
 * nowhere along that stretch of the edge.
 */
function slide(occupancy, block, corner, start, bounds, typefaces) {
  // A block on the right starts on the column line nearest the margin that its
  // ink still clears, so its text ends near the margin, not a column span short.
  let column = 0;
  while (column < 11 && columnX(column + 1) + block.ink <= LIVE.x + LIVE.width) column += 1;
  const x = corner.endsWith("left") ? LIVE.x : columnX(column);
  const down = corner.startsWith("top");
  for (
    let y = start;
    y >= bounds.top && y + block.height <= bounds.bottom;
    y += down ? CELL : -CELL
  ) {
    const rects = inkOf(block, x, y, typefaces);
    if (occupancy.clear(rects)) return { x, y, rects };
  }
  return null;
}

/**
 * Every way to set one floating block: each width it can take, in each corner,
 * at the first free position from the page's edge and from the figure field's
 * edge. A page that reserved a strip for its head has two places for a block
 * at its top: beside the head, or beside the figure's first row. A block held
 * at the edge takes the corner at the page's edge or not at all.
 * @param {any[]} blocks
 * @param {Occupancy} occupancy
 * @param {{ top: number, bottom: number }} bounds
 * @param {{ x: number, y: number, width: number, height: number }} field
 * @param {any} typefaces
 * @param {ReadonlyArray<string>} [corners] the corners a block may take
 * @param {boolean} [atEdge] whether the block stays at the page's edge
 */
function options(blocks, occupancy, bounds, field, typefaces, corners = CORNERS, atEdge = false) {
  const out = [];
  const seen = new Set();
  for (const block of blocks)
    for (const corner of corners) {
      const down = corner.startsWith("top");
      const edge = down ? bounds.top : bounds.bottom - block.height;
      // Beside a figure whose rows leave a strip down one side, a block may also
      // start from the middle of that side, so the strip is not left blank below
      // a block set at its top.
      const middle = Math.round((field.y + (field.height - block.height) / 2) / CELL) * CELL;
      const starts = atEdge
        ? [edge]
        : [edge, down ? field.y : field.y + field.height - block.height, middle];
      for (const start of starts) {
        const at = slide(
          occupancy,
          block,
          corner,
          start,
          atEdge ? { top: start, bottom: start + block.height } : bounds,
          typefaces,
        );
        if (!at) continue;
        const key = `${block.ink}:${block.height}:${at.x}:${at.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ block, ...at });
      }
    }
  return out;
}

/** Text runs and glyphs of placed blocks. */
function textOf(chosen) {
  /** @type {{ runs: any[], glyphs: any[] }} */
  const extra = { runs: [], glyphs: [] };
  for (const one of chosen) {
    const set = placed(one.block, one.x, one.y);
    extra.runs.push(...set.runs);
    extra.glyphs.push(...set.glyphs);
  }
  return extra;
}

const compare = (a, b) => {
  for (let index = 0; index < a.length; index += 1)
    if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
};

/**
 * Place a floating page's head and legend beside its drawn figure, and its
 * notes too when the page set no footer. The head, with its summary beneath its
 * question, starts the page at its top-left corner, unless the page already set
 * it in a reserved strip; the legend takes whichever corner, and width, gives
 * the page the best measure `score` returns, and the notes take one of the
 * page's bottom corners or its foot. The legends that measure best alone are
 * each paired with every notes placement. Null when the figure leaves no
 * top-left corner for the head, or no room for the legend or the notes.
 * @param {{ model: any, views: any[], typefaces: any, lead: any, first: boolean,
 *   boundary?: string | null }} input
 * @param {any} page the planned page, with its footer set
 * @param {any[]} made the plate drawn in the page's field
 * @param {(extra: { runs: any[], glyphs: any[] }) => { rank: number[] }} score
 */
export function settleFloating(input, page, made, score) {
  const { model, typefaces } = input;
  const { head: reserved } = page.floating;
  const base = new Occupancy();
  for (const one of made) {
    for (const rect of one.figure.rects) base.mark(rect, CLEARANCE);
    if (one.figure.frame) base.mark(one.figure.frame, FRAME_CLEARANCE);
  }
  // A figure's numbered tier labels read as one list down their column, so no
  // block is set between its first label and its last.
  for (const plate of page.plates) {
    const column = plate.labelColumn;
    if (!column) continue;
    const labels = made
      .flatMap((one) => one.figure.rects)
      .filter((rect) => rect.x + rect.width <= plate.field.x && rect.x >= column.x - 1);
    if (!labels.length) continue;
    const top = Math.min(...labels.map((rect) => rect.y));
    const bottom = Math.max(...labels.map((rect) => rect.y + rect.height));
    base.mark({ x: column.x, y: top, width: column.width, height: bottom - top }, CLEARANCE);
  }
  for (const run of page.runs)
    base.mark(
      {
        x: run.x,
        y: run.top,
        width: typefaces.measure(run.value, run.style),
        height: run.style.line,
      },
      CLEARANCE,
    );
  for (const rule of page.rules)
    base.mark({ x: rule.x1, y: rule.y1 - 1, width: rule.x2 - rule.x1, height: 2 }, CLEARANCE);
  base.seal();
  const bounds = {
    top: LIVE.y,
    bottom: page.rules.length ? page.rules[0].y1 : LIVE.y + LIVE.height,
  };
  const field = page.plates[0].field;
  const below = { summary: summaryOf(model, input.views, input.first) };
  const heads = reserved
    ? [null]
    : [4, 5, 6, 7].flatMap((span) => {
        const block = headBlock(typefaces, input.lead, spanWidth(span), 3, below);
        if (!block) return [];
        const rects = inkOf(block, LIVE.x, LIVE.y, typefaces);
        return base.clear(rects) ? [{ block, x: LIVE.x, y: LIVE.y, rects }] : [];
      });
  // A block may be as narrow as two columns, so the strip a compact figure
  // leaves beside it can hold the legend.
  const legends = [2, 3, 4, 5].flatMap((span) =>
    [1, 2].flatMap((columns) => {
      const block = legendBlock(input, spanWidth(span), columns);
      return block ? [block] : [];
    }),
  );
  const notes = page.floating.notes
    ? NOTE_SHAPES.flatMap(([span, columns]) => {
        const block = notesBlock(typefaces, model, spanWidth(span), columns);
        return block ? [block] : [];
      })
    : null;
  /** @type {{ rank: number[], extra: { runs: any[], glyphs: any[] } } | null} */
  let best = null;
  for (const head of heads) {
    const lead = head ? [head] : [];
    const afterHead = head ? base.with(head.rects) : base;
    const ranked = options(legends, afterHead, bounds, field, typefaces)
      .map((legend) => ({ legend, rank: score(textOf([...lead, legend])).rank }))
      .sort((a, b) => compare(a.rank, b.rank))
      .slice(0, BEAM);
    for (const { legend, rank } of notes ? ranked : ranked.slice(0, 1)) {
      const set = [...lead, legend];
      if (!notes) {
        if (!best || compare(rank, best.rank) < 0) best = { rank, extra: textOf(set) };
        continue;
      }
      const afterLegend = afterHead.with(legend.rects);
      // Notes are fine print: they sit at the foot of the page, in one of its
      // bottom corners, and never rise beside the figure.
      for (const note of options(notes, afterLegend, bounds, field, typefaces, FOOT, true)) {
        const extra = textOf([...set, note]);
        const measured = score(extra).rank;
        if (!best || compare(measured, best.rank) < 0) best = { rank: measured, extra };
      }
    }
  }
  return best ? best.extra : null;
}
