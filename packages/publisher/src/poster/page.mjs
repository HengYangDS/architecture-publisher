import { refuse } from "../refusal.mjs";
import {
  footerNotes,
  headBlock,
  legendBlock,
  noteBlock,
  notesOf,
  placed,
  plateHeading,
  summaryBlock,
  summaryOf,
  wrapWithin,
} from "./blocks.mjs";
import { PAGE, POSTER, figureStyles } from "./tokens.mjs";

/**
 * The page grid: twelve columns of 160 px with 32 px gutters inside a 64 px
 * margin fill 2400 px exactly. Head, plates, legend and notes all start on
 * this grid, so text and figures share one structure.
 */
const GRID = POSTER.grid;
const COLUMN = GRID.column + GRID.gutter;
export const LIVE = Object.freeze({
  x: POSTER.margin,
  y: POSTER.margin,
  width: POSTER.width - 2 * POSTER.margin,
  height: POSTER.height - 2 * POSTER.margin,
});

/** Left edge of a column. @param {number} index */
export const columnX = (index) => LIVE.x + index * COLUMN;
/** Width of a span of columns. @param {number} columns */
export const spanWidth = (columns) => columns * COLUMN - GRID.gutter;

/** The shallowest band a plate is given; below it a figure is a strip. */
const BAND = 240;
/** The lines a summary may take before a page refuses it. */
const SUMMARY_LINES = POSTER.summaryLines + 2;

/**
 * The width of the column that holds a figure's tier labels: the widest label at
 * the largest tier size plus the numbered disc before it, and never more than the
 * token's column. A column wide enough for the longest label any model might
 * have leaves a blank strip down the page beside short labels.
 * @param {any} typefaces
 * @param {string[]} labels
 */
export function gutterFor(typefaces, labels) {
  if (!labels.length) return 0;
  const tier = figureStyles(/** @type {any} */ (POSTER.steps.at(-1))).tier;
  const widest = Math.max(...labels.map((label) => typefaces.measure(label, tier)));
  return Math.min(POSTER.spacing.rowColumn, Math.ceil((widest + 64) / 8) * 8);
}

/**
 * Refuse a page whose text no plan can set: a title or question longer than two
 * lines across seven columns, or a summary longer than its allowance across the
 * widest summary column. Every plan sets these at a width no wider, so the
 * refusal names the text to shorten instead of a page that failed to compose.
 * @param {any} typefaces
 * @param {any} model
 * @param {any[]} [views] the page's views, whose summary the page may set
 */
export function refuseUnsetText(typefaces, model, views = []) {
  if (!headBlock(typefaces, model, spanWidth(7), 3))
    refuse(
      "poster_title_too_long",
      `The title or question of ${model.title} needs more than three lines across seven columns.`,
    );
  const summary = summaryOf(model, views);
  if (!summary) return;
  const { lines } = wrapWithin(typefaces, summary, spanWidth(5), PAGE.summary);
  const owner = summary === model.summary ? model.title : `view ${views[0].id}`;
  if (lines.length > SUMMARY_LINES)
    refuse(
      "poster_summary_too_long",
      `The summary of ${owner} needs ${lines.length} lines across five columns; a poster allows ${SUMMARY_LINES}.`,
    );
}

/**
 * The masthead: the head, the summary and the legend side by side across the
 * top of the page. The twelve columns are split, and the legend divided into
 * sub-columns, so that the band is as shallow as its tallest column allows and
 * its columns end as nearly level as they can. A legend left in one tall column
 * beside a two-line title is a block of paper the width of the title under it.
 */
function masthead(input) {
  const { model, typefaces } = input;
  const text = summaryOf(model, input.views);
  /** @type {{ blocks: Array<{ block: import("./blocks.mjs").Block, x: number }>, height: number, slack: number } | null} */
  let best = null;
  for (const lead of [4, 5, 6, 7])
    for (const middle of text ? [3, 4, 5] : [0]) {
      const right = 12 - lead - middle;
      if (right < 3) continue;
      const head = headBlock(typefaces, model, spanWidth(lead), 2);
      const summary = text ? summaryBlock(typefaces, text, spanWidth(middle), SUMMARY_LINES) : null;
      if (!head || (text && !summary)) continue;
      for (const columns of [1, 2, 3]) {
        const legend = legendBlock(input, spanWidth(right), columns);
        if (!legend) continue;
        const blocks = [
          { block: head, x: LIVE.x },
          ...(summary ? [{ block: summary, x: columnX(lead) }] : []),
          { block: legend, x: columnX(lead + middle) },
        ];
        const height = Math.max(...blocks.map(({ block }) => block.height));
        const slack = blocks.reduce(
          (sum, { block }) => sum + block.width * (height - block.height),
          0,
        );
        if (!best || height < best.height || (height === best.height && slack < best.slack))
          best = { blocks, height, slack };
      }
    }
  return best;
}

/**
 * The rail: head, summary, legend and notes down the left columns, spaced over
 * the full height. The gaps between blocks take the slack up to one column gap
 * each, and whatever remains centres the stack, so the rail has no empty middle
 * and no hanging bottom. Null when its text does not fit the column.
 */
function railBlocks(input, rail) {
  const { model, typefaces, views } = input;
  const width = spanWidth(rail);
  const head = headBlock(typefaces, model, width, 3);
  const text = summaryOf(model, views);
  const summary = text ? summaryBlock(typefaces, text, width, SUMMARY_LINES) : null;
  const legend = [1, 2]
    .map((columns) => legendBlock(input, width, columns))
    .filter(Boolean)
    .sort((a, b) => /** @type {any} */ (a).height - /** @type {any} */ (b).height)[0];
  if (!head || (text && !summary) || !legend) return null;
  const notes = notesOf(model, views, input.provenance).map((note) =>
    noteBlock(typefaces, note.label, note.text, width),
  );
  const blocks = [head, ...(summary ? [summary] : []), legend, ...notes];
  const total = blocks.reduce((sum, block) => sum + block.height, 0);
  const slack = LIVE.height - total;
  if (slack < 0) return null;
  const gaps = blocks.length - 1;
  const gap = gaps ? Math.min(POSTER.spacing.column, slack / gaps) : 0;
  let top = LIVE.y + (slack - gaps * gap) / 2;
  const runs = [];
  const glyphs = [];
  for (const block of blocks) {
    const set = placed(block, LIVE.x, top);
    runs.push(...set.runs);
    glyphs.push(...set.glyphs);
    top += block.height + gap;
  }
  return { runs, glyphs };
}

/**
 * Plan the page around one or more view plates.
 *
 * `stack` sets the masthead across the top and the plates in bands beneath it,
 * one or more to a band, which suits wide, shallow figures. `column` sets all the text down a rail of
 * `rail` columns and the plates over the full height of the rest, which is how a
 * figure of five or more tiers fits a 16:9 page. `corner` gives one plate the
 * full width above the notes and leaves the head, summary and legend floating:
 * they are set after the figure is drawn, into the space its narrow rows leave
 * at the corners of the field, which is where a tree's title and legend belong.
 * Returns null when this plan cannot set its text or its plates.
 *
 * @param {{ model: any, views: any[], provenance: any, typefaces: any,
 *   boundary?: string | null }} input
 * @param {{ archetype?: "stack" | "column" | "corner", gutters?: number[],
 *   weights?: number[], widths?: number[], rail?: number, reserve?: boolean,
 *   notes?: boolean, bands?: number[] }} [options]
 *   `gutters` is the width of each plate's tier-label column, zero when its rows
 *   carry no labels; `weights` and `widths` are the height and width each
 *   plate's figure needs; `reserve` sets a corner page's head in a strip above
 *   its figure; `notes` sets a corner page's notes beside its figure instead of
 *   in a footer; `bands` counts the plates each band holds side by side, one
 *   per band unless it says otherwise.
 */
export function planSheet(input, options = {}) {
  const { model, views, typefaces } = input;
  const archetype = options.archetype ?? "stack";
  const runs = [];
  const rules = [];
  /** @type {any[]} */
  const glyphs = [];
  let region;
  /** @type {any} */
  let floating = null;

  if (archetype === "column") {
    const rail = Math.min(6, Math.max(3, options.rail ?? 4));
    const set = railBlocks(input, rail);
    if (!set) return null;
    runs.push(...set.runs);
    glyphs.push(...set.glyphs);
    region = { x: columnX(rail), y: LIVE.y, width: spanWidth(12 - rail), height: LIVE.height };
  } else {
    // A corner page may set its notes beside its figure like the rest of its
    // text, instead of in a footer across the page.
    const footed = archetype !== "corner" || !options.notes;
    const footer = footed
      ? footerNotes(
          model,
          views,
          input.provenance,
          typefaces,
          LIVE.x,
          LIVE.width,
          LIVE.y + LIVE.height,
        )
      : { runs: [], rule: null, top: LIVE.y + LIVE.height + 56 };
    runs.push(...footer.runs);
    if (footer.rule) rules.push(footer.rule);
    const floor = footer.top - 56;
    if (archetype === "corner") {
      if (views.length !== 1) return null;
      // A reserved head is set across the top before the figure, in the
      // shallowest width that holds it, so a figure whose first row fills its
      // boundary still has the page's title above it; the summary and the
      // legend float either way.
      let top = LIVE.y;
      if (options.reserve) {
        const head = [4, 5, 6, 7]
          .map((span) => headBlock(typefaces, model, spanWidth(span), 3, views[0]))
          .filter((block) => block !== null)
          .sort((a, b) => /** @type {any} */ (a).height - /** @type {any} */ (b).height)[0];
        if (!head) return null;
        runs.push(...placed(head, LIVE.x, LIVE.y).runs);
        top = LIVE.y + head.height + 32;
      }
      region = { x: LIVE.x, y: top, width: LIVE.width, height: floor - top };
      floating = { view: views[0], head: Boolean(options.reserve), notes: !footed };
    } else {
      const head = masthead(input);
      if (!head) return null;
      for (const { block, x } of head.blocks) {
        const set = placed(block, x, LIVE.y);
        runs.push(...set.runs);
        glyphs.push(...set.glyphs);
      }
      const top = LIVE.y + head.height + 32;
      region = { x: LIVE.x, y: top, width: LIVE.width, height: floor - top };
    }
  }

  const plates = arrange(input, options, region, floating !== null);
  if (!plates) return null;
  runs.push(...plates.runs);
  return { archetype, runs, glyphs, rules, plates: plates.plates, figure: region, floating };
}

/**
 * Divide a region into bands of plates. Each band holds one or more of the
 * page's views side by side, in reading order; the plates of one band divide
 * its width in proportion to the width their figures need and share one height,
 * and each band takes the height its tallest figure needs, with the surplus
 * shared in proportion to those heights. A grouping whose figures do not fit
 * is refused rather than squeezed: a figure below its natural height draws over
 * its band, and shrinking every band to the smallest is the equal-band fault
 * this plan exists to remove.
 */
function arrange(input, options, region, headless) {
  const { model, views, typefaces } = input;
  const counts = options.bands ?? views.map(() => 1);
  if (counts.reduce((sum, count) => sum + count, 0) !== views.length) return null;
  const side = POSTER.spacing.column;
  const inset = POSTER.spacing.inset;
  /** @type {Array<Array<{ order: number, x: number, width: number, heading: any }>>} */
  const groups = [];
  let next = 0;
  for (const count of counts) {
    const members = views.slice(next, next + count).map((_, index) => next + index);
    next += count;
    const need = members.map((order) => Math.max(1, options.widths?.[order] ?? 1));
    const total = need.reduce((sum, width) => sum + width, 0);
    const free = region.width - (count - 1) * side;
    let x = region.x;
    const plates = [];
    for (const [index, order] of members.entries()) {
      const width =
        index === count - 1
          ? region.x + region.width - x
          : Math.floor((free * need[index]) / total);
      // A floating page sets its one view's heading with the page's head, so
      // its plate starts at the top of the region.
      const heading = headless
        ? { runs: [], glyphs: [], width: 0, ink: 0, height: 0 }
        : plateHeading(typefaces, views[order], width - 2 * inset, model, views.length > 1);
      if (!heading) return null;
      plates.push({ order, x, width, heading });
      x += width + side;
    }
    groups.push(plates);
  }
  const offsets = groups.map((plates) =>
    Math.max(...plates.map(({ heading }) => (heading.height ? heading.height + 8 : 0))),
  );
  const needs = groups.map((plates) =>
    Math.max(...plates.map(({ order }) => Math.max(0, options.weights?.[order] ?? 1))),
  );
  const room =
    region.height -
    offsets.reduce((sum, offset) => sum + offset, 0) -
    (groups.length - 1) * POSTER.spacing.plateGap;
  const needed = needs.reduce((sum, need) => sum + need, 0);
  if (needed > room) return null;
  const heights = needs.map((need) =>
    Math.floor(need + ((room - needed) * need) / Math.max(1, needed)),
  );
  if (Math.min(...heights) < BAND) return null;
  const runs = [];
  /** @type {any[]} */
  const plates = new Array(views.length);
  let top = region.y;
  groups.forEach((group, band) => {
    for (const { order, x, width, heading } of group) {
      const column = options.gutters?.[order] ?? 0;
      runs.push(...placed(heading, x, top).runs);
      const field = {
        x: x + column,
        y: top + offsets[band],
        width: width - column,
        height: heights[band],
      };
      plates[order] = {
        view: views[order],
        field,
        labelColumn: column ? { x, y: field.y, width: column, height: field.height } : null,
      };
    }
    top += offsets[band] + heights[band] + POSTER.spacing.plateGap;
  });
  return { runs, plates };
}
