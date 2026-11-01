import { presentation } from "../kinds.mjs";
import { sentence, sentences, wordsOf } from "../locale.mjs";
import { PAGE, POSTER } from "./tokens.mjs";

/**
 * The page's text, set as blocks before it is placed. A block's runs and glyphs
 * sit relative to its own top-left corner, so one block can be set at several
 * widths and placed wherever the page has room for it: in a masthead column,
 * down a rail, or in a corner its figure leaves free. A block that cannot hold
 * its text at a width is not set at that width at all — a title or a legend
 * entry is never cut to fit.
 * @typedef {{ runs: any[], glyphs: any[], width: number, ink: number, height: number }} Block
 */

/** The gap between a block's heading lines and the lines that follow them. */
const LEAD = 12;

/**
 * The width at which a text style keeps at most 80 characters on a line, so no
 * block on the page runs a measure a reader loses the line in.
 * @param {{ measure: (text: string, style: any) => number }} typefaces
 * @param {{ size: number, weight: number, line: number }} style
 */
export function measureWidth(typefaces, style) {
  return Math.ceil(typefaces.measure("n".repeat(POSTER.measure), style));
}

/**
 * Wrap text to `width` inside the measure: the lines are wrapped at the column,
 * and the block is narrowed until its longest line fits 80 characters.
 * @param {{ wrap: (text: string, width: number, style: any) => string[],
 *   measure: (text: string, style: any) => number }} typefaces
 */
export function wrapWithin(typefaces, text, width, style) {
  const capped = Math.min(width, measureWidth(typefaces, style));
  return { lines: typefaces.wrap(text, capped, style), width: capped };
}

/** The lines of `text` at `width`, or null when they need more than `most`. */
function linesWithin(typefaces, text, width, style, most) {
  const { lines } = wrapWithin(typefaces, text, width, style);
  return lines.length > most ? null : lines;
}

/**
 * The legend's entries: the kinds present, then the boundary when a figure draws
 * one — some component outside it and some inside — and the statuses present.
 */
function legendOf(model, views, boundary) {
  const words = wordsOf(model.locale);
  const kinds = [];
  const components = views.flatMap((view) => view.components);
  const outside = components.filter((component) => presentation(model, component).outside);
  const bounded = outside.length > 0 && outside.length < components.length;
  for (const component of components) {
    const style = presentation(model, component);
    if (kinds.some((entry) => entry.kind === style.kind)) continue;
    kinds.push({
      kind: style.kind,
      label: style.label,
      icon: style.icon,
      color: POSTER.hue[style.category],
    });
  }
  /** @type {Array<{ shape: string, label: string }>} */
  const rest = [];
  if (boundary && bounded)
    rest.push(
      { shape: "boundary", label: words.inside(boundary) },
      { shape: "outside", label: words.outside },
    );
  const shown = views.flatMap((view) => [...view.components, ...view.relations]);
  for (const status of /** @type {const} */ (["planned", "retired"]))
    if (shown.some((item) => item.status === status))
      rest.push({ shape: status, label: words[status] });
  return { kinds, rest };
}

/**
 * What a page says its figures show. A page of one view says what that view
 * shows; the first page also falls back to the model's summary, and a page of
 * several views sets the model's summary only when it opens the edition, since
 * each plate's heading says what its own view shows. Null when there is nothing
 * to say.
 * @param {any} model
 * @param {any[]} views
 * @param {boolean} [first] whether the page opens the edition
 * @returns {string | null}
 */
export function summaryOf(model, views, first = true) {
  return (views.length === 1 ? views[0].summary : null) || (first ? model.summary : null) || null;
}

/**
 * The lines a page leads with. The page that opens the edition asks the model's
 * question under its title. A later page of one view asks that view's own
 * question under the view's title, with the model's title set small above them
 * as a running head, so a reader sees what this page answers before what the
 * edition as a whole does; a view with no title of its own asks its question
 * under the model's title, with no running head to repeat it. A later page of
 * several views carries the model's title alone; each plate asks its own
 * question.
 * @param {any} model
 * @param {any[]} views
 * @param {boolean} first
 * @returns {{ kicker: string | null, title: string, question: string | null }}
 */
export function leadOf(model, views, first) {
  if (first) return { kicker: null, title: model.title, question: model.question };
  if (views.length !== 1) return { kicker: null, title: model.title, question: null };
  const [view] = views;
  const kicker = view.title === model.title ? null : model.title;
  return { kicker, title: view.title, question: view.question };
}

/**
 * The footer's note blocks: what the model covers, what it leaves out, where it
 * comes from. The source note names the repository and revision a reader can
 * open; whether each source was verified, and by which digest, is evidence the
 * manifest keeps.
 */
export function notesOf(model) {
  const words = wordsOf(model.locale);
  /** @type {Array<{ label: string, text: string }>} */
  const blocks = [];
  if (model.scope) blocks.push({ label: words.scope, text: sentence(words, model.scope) });
  const limits = [...new Set(model.limits)].filter(Boolean);
  if (limits.length) blocks.push({ label: words.limits, text: sentences(words, limits) });
  const origin = [];
  if (model.repository)
    origin.push(words.revision(model.repository.name, model.repository.revision.slice(0, 12)));
  if (model.attribution) origin.push(words.attribution(model.attribution));
  if (origin.length)
    blocks.push({ label: words.source, text: sentence(words, origin.join(words.semicolon)) });
  return blocks;
}

/**
 * Move a block onto the page with its top-left corner at (x, y).
 * @param {Block} block
 * @param {number} x
 * @param {number} y
 */
export function placed(block, x, y) {
  return {
    runs: block.runs.map((run) => ({ ...run, x: run.x + x, top: run.top + y, layer: "page" })),
    glyphs: block.glyphs.map((glyph) => ({ ...glyph, x: glyph.x + x, top: glyph.top + y })),
  };
}

/**
 * A finished block: its runs and glyphs, the width it was set in, the width its
 * ink actually reaches, and its height. A block set against the right margin is
 * placed by its ink, not by the column span it was set in.
 */
function block(typefaces, runs, glyphs, width, height) {
  const ink = Math.max(
    0,
    ...runs.map((run) => run.x + typefaces.measure(run.value, run.style)),
    ...glyphs.map((glyph) => glyph.x + glyph.size),
  );
  return { runs, glyphs, width, ink: Math.ceil(ink), height };
}

/** Set lines down a block from `top` at `x`, returning the top of the next line. */
function setLines(runs, lines, top, style, color, x = 0) {
  let y = top;
  for (const value of lines) {
    runs.push({ value, x, top: y, style, color });
    y += style.line;
  }
  return y;
}

/**
 * The page's head: its lead lines, then the summary beneath them in reading
 * order. Null when a line group needs more lines than `most` allows at this
 * width, or the summary more than its allowance.
 * @param {any} typefaces
 * @param {{ kicker: string | null, title: string, question: string | null }} lead
 * @param {number} width
 * @param {number} most lines allowed for the title and for each question
 * @param {{ summary?: string | null }} [below]
 * @returns {Block | null}
 */
export function headBlock(typefaces, lead, width, most, below = {}) {
  const kicker = lead.kicker ? linesWithin(typefaces, lead.kicker, width, PAGE.running, 1) : [];
  const title = linesWithin(typefaces, lead.title, width, PAGE.title, most);
  const question = lead.question
    ? linesWithin(typefaces, lead.question, width, PAGE.question, most)
    : [];
  if (!kicker || !title || !question) return null;
  const runs = [];
  let y = setLines(runs, kicker, 0, PAGE.running, POSTER.color.muted);
  if (kicker.length) y += LEAD / 2;
  y = setLines(runs, title, y, PAGE.title, POSTER.color.ink);
  if (question.length) y = setLines(runs, question, y + LEAD, PAGE.question, POSTER.color.accent);
  if (below.summary) {
    const lines = linesWithin(
      typefaces,
      below.summary,
      width,
      PAGE.summary,
      POSTER.summaryLines + 2,
    );
    if (!lines) return null;
    y = setLines(runs, lines, y + 2 * LEAD, PAGE.summary, POSTER.color.muted);
  }
  return block(typefaces, runs, [], width, y);
}

/**
 * The page's summary at one width. Null past `most` lines.
 * @returns {Block | null}
 */
export function summaryBlock(typefaces, text, width, most) {
  const lines = linesWithin(typefaces, text, width, PAGE.summary, most);
  if (!lines) return null;
  const runs = [];
  const height = setLines(runs, lines, 0, PAGE.summary, POSTER.color.muted);
  return block(typefaces, runs, [], width, height);
}

/**
 * The legend set in `columns` sub-columns of one block. Entries keep their
 * order down each sub-column, and the split between sub-columns is the one
 * whose tallest sub-column is shortest. Null when a sub-column is too narrow
 * for an entry to keep its label on two lines.
 * @param {{ model: any, views: any[], typefaces: any, boundary?: string | null }} input
 * @param {number} width
 * @param {number} columns
 * @returns {Block | null}
 */
export function legendBlock(input, width, columns) {
  const { model, views, typefaces } = input;
  const { kinds, rest } = legendOf(model, views, input.boundary);
  /** @type {Array<{ kind: string, label: string, icon?: string, color?: string }>} */
  const entries = [
    ...kinds.map((kind) => ({
      kind: "icon",
      icon: kind.icon,
      color: kind.color,
      label: kind.label,
    })),
    ...rest.map((entry) => ({ kind: entry.shape, label: entry.label })),
  ];
  const style = PAGE.legend;
  const gutter = POSTER.grid.gutter;
  const column = Math.floor((width - (columns - 1) * gutter) / columns);
  if (columns > entries.length || column < 160) return null;
  const set = entries.map((entry) => ({
    entry,
    lines: linesWithin(typefaces, entry.label, column - 32, style, 2),
  }));
  if (set.some(({ lines }) => !lines)) return null;
  const heights = set.map(({ lines }) => /** @type {string[]} */ (lines).length * style.line + 8);
  const split = balancedSplit(heights, columns);
  const runs = [];
  const glyphs = [];
  let height = 0;
  // Each sub-column starts on the first column line its predecessor's widest
  // entry clears, so short entries are not spread across the legend's span,
  // and never later than an even division of the span, which keeps every
  // sub-column inside it.
  const pitch = POSTER.grid.column + gutter;
  let x = 0;
  split.forEach(([from, to], index) => {
    if (index) {
      const [before, after] = split[index - 1];
      const widest = Math.max(
        ...set
          .slice(before, after)
          .flatMap(({ lines }) => /** @type {string[]} */ (lines))
          .map((line) => typefaces.measure(line, style)),
      );
      x = Math.min(
        x + Math.ceil((32 + widest + gutter) / pitch) * pitch,
        index * (column + gutter),
      );
    }
    let y = 0;
    for (let at = from; at < to; at += 1) {
      const { entry, lines } = set[at];
      glyphs.push({
        shape: entry.kind,
        icon: entry.icon,
        color: entry.color,
        x,
        top: y + 2,
        size: 20,
      });
      y = setLines(runs, /** @type {string[]} */ (lines), y, style, POSTER.color.ink, x + 32) + 8;
    }
    height = Math.max(height, y - 8);
  });
  return block(typefaces, runs, glyphs, width, height);
}

/**
 * Split items of `heights` into `parts` consecutive groups whose tallest group
 * is shortest. A legend has a dozen entries at most, so every split is tried.
 * @param {number[]} heights
 * @param {number} parts
 * @returns {Array<[number, number]>}
 */
function balancedSplit(heights, parts) {
  /** @type {Array<[number, number]>} */
  let best = [[0, heights.length]];
  let tallest = Infinity;
  const walk = (start, left, groups) => {
    if (left === 1) {
      const all = [...groups, /** @type {[number, number]} */ ([start, heights.length])];
      const most = Math.max(
        ...all.map(([from, to]) => heights.slice(from, to).reduce((sum, h) => sum + h, 0)),
      );
      if (most < tallest) [best, tallest] = [all, most];
      return;
    }
    for (let end = start + 1; end <= heights.length - left + 1; end += 1)
      walk(end, left - 1, [...groups, [start, end]]);
  };
  walk(0, parts, []);
  return best;
}

/**
 * One labelled note: a small uppercase label above wrapped body text.
 * @returns {Block}
 */
export function noteBlock(typefaces, label, text, width) {
  const runs = [
    { value: label.toUpperCase(), x: 0, top: 0, style: PAGE.kicker, color: POSTER.color.faint },
  ];
  const { lines } = wrapWithin(typefaces, text, width, PAGE.notes);
  const height = setLines(runs, lines, PAGE.kicker.line, PAGE.notes, POSTER.color.muted);
  return block(typefaces, runs, [], width, height);
}

/**
 * The heading a plate sets above its figure: the view's title, then its
 * question, and on a page of several views what the view shows. What the
 * page's head already says is not repeated: a view whose title, question or
 * summary is the model's own keeps only what tells this figure apart from the
 * others, and a view that is the whole model has no heading at all. Null when
 * the title or question needs more than two lines at this width, or the
 * summary more than three.
 * @param {any} typefaces
 * @param {any} view
 * @param {number} width
 * @param {any} model
 * @param {boolean} shows whether the heading also says what the view shows
 * @returns {Block | null}
 */
export function plateHeading(typefaces, view, width, model, shows) {
  const own =
    view.title === model.title ? [] : linesWithin(typefaces, view.title, width, PAGE.plate, 2);
  const asks =
    view.question === model.question
      ? []
      : linesWithin(typefaces, view.question, width, PAGE.plateQuestion, 2);
  const says =
    shows && view.summary && view.summary !== model.summary
      ? linesWithin(typefaces, view.summary, width, PAGE.summary, POSTER.summaryLines)
      : [];
  if (!own || !asks || !says) return null;
  const runs = [];
  let y = setLines(runs, own, 0, PAGE.plate, POSTER.color.ink);
  if (own.length && asks.length) y += 4;
  y = setLines(runs, asks, y, PAGE.plateQuestion, POSTER.color.accent);
  if (says.length && y) y += 8;
  y = setLines(runs, says, y, PAGE.summary, POSTER.color.muted);
  return block(typefaces, runs, [], width, y);
}

/**
 * The page's notes as one block a page sets beside its figure: stacked in one
 * column, or side by side in one column each. Null when the page has no notes.
 * @returns {Block | null}
 */
export function notesBlock(typefaces, model, width, columns) {
  const notes = notesOf(model);
  if (!notes.length) return null;
  const across = columns > 1 ? notes.length : 1;
  const span = across > 1 ? (width - (across - 1) * POSTER.grid.gutter) / across : width;
  const runs = [];
  let height = 0;
  let y = 0;
  notes.forEach((note, index) => {
    const set = noteBlock(typefaces, note.label, note.text, span);
    const x = across > 1 ? index * (span + POSTER.grid.gutter) : 0;
    const top = across > 1 ? 0 : y;
    for (const run of set.runs) runs.push({ ...run, x: run.x + x, top: run.top + top });
    y = top + set.height + 2 * LEAD;
    height = Math.max(height, top + set.height);
  });
  return block(typefaces, runs, [], width, height);
}

/**
 * The page's notes in a footer across `width`, one column per note, with the
 * rule above them. Returned with the top edge the notes start at; a page with
 * no notes has no footer and no rule.
 * @returns {{ runs: any[], rule: any, top: number }}
 */
export function footerNotes(model, typefaces, left, width, bottom) {
  const notes = notesOf(model);
  if (!notes.length) return { runs: [], rule: null, top: bottom + 56 };
  const columns = Math.max(1, notes.length);
  const span = width / columns;
  const blocks = notes.map((note) => noteBlock(typefaces, note.label, note.text, span - 32));
  const height = Math.max(0, ...blocks.map((block) => block.height));
  const top = bottom - height;
  const runs = blocks.flatMap((block, index) => placed(block, left + index * span, top).runs);
  return { runs, rule: { x1: left, y1: top - 24, x2: left + width, y2: top - 24 }, top };
}
