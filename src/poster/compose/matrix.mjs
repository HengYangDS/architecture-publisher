import { atoms, joined, orphan } from "../../breaks.mjs";
import { presentation } from "../../kinds.mjs";
import { measureWordsOf, wordsOf } from "../../locale.mjs";
import { lineLook } from "../lines.mjs";
import { MARK } from "../part.mjs";
import { measuredOf, stripKey, stripOf } from "../strip.mjs";
import { POSTER, colorsOf, figureMetrics, figureStyles, linesOf } from "../tokens.mjs";
import { flowOrder } from "./flow.mjs";
import { JOINED, TINT, drawMatrix } from "./matrix-draw.mjs";

/**
 * The matrix: a view drawn as a design structure matrix, for a view whose figure in tiers would tangle. Each part of
 * the view has one row and one column, in one order on both axes, the order of its relations' flow, so a view
 * without a cycle has every mark on one side of the diagonal. A row is headed by a compact card: the part's kind
 * icon, its name and its strip on one line, the kind named once at the left of each run of rows of one kind; a
 * column by the part's name, set horizontally like every run of the edition. A cell in row i and column j stands
 * for the relations from part i to part j: it is tinted with the colour of the line it replaces and holds their
 * label and the number of files they cite. A label every mark of a row or a column repeats is said once, in that
 * row's or column's head, and its cells keep their counts. The parts inside the repository, where the view also
 * shows parts outside it, are bracketed on both axes and the bracket named as the figure in tiers names the
 * boundary. The matrix takes the largest type step whose heads, names and cells fit the field it is given, with
 * cells as large as the field allows at that step, and stands in the middle of the field. It draws no line, so it
 * has no crossing, no route and no bend.
 */

/** The prototype's own measures, which the house's tokens do not state. */
const MATRIX = Object.freeze({
  /**
   * A cell is at most this many times as wide as it is tall, or as tall as it is wide. Its words are set across it,
   * so a column may be as wide as two rows are tall: the sixteen parts of a dense view fit at the densest step.
   */
  aspect: 2,
  /** A column's head sets its part's name in at most this many lines. */
  headLines: 3,
  /** A row's head sets its part's name in at most this many lines. */
  nameLines: 2,
  /** A cell, or a head that says a label once, sets the label in at most this many lines. */
  labelLines: 2,
  /** The paper between a count's figures and the edge of the key's sample cell, on each side, in px. */
  inset: 4,
});

/** The side of the key's sample cell: a count's line and the paper around it, on the baseline grid. */
const KEY_SIDE =
  Math.ceil((figureStyles(POSTER.steps[0]).count.line + 2 * MATRIX.inset) / POSTER.grid.baseline) *
  POSTER.grid.baseline;

/** What a matrix sets between the labels of two relations of one pair that one cell holds, as an overview does. */
const BETWEEN_LABELS = " / ";

/** @typedef {import("../../breaks.mjs").Atom} Atom */
/** @typedef {import("../text.mjs").TextStyle} TextStyle */
/** @typedef {{ measure: (text: string, style: TextStyle) => number }} Measuring the typefaces, as a matrix measures */
/** @typedef {import("../../plan/views.mjs").ViewComponent} ViewComponent */
/** @typedef {import("../../plan/views.mjs").ViewRelation} ViewRelation */
/** @typedef {ReturnType<typeof figureStyles>} Styles */
/** @typedef {ReturnType<typeof figureMetrics>} Metrics */
/** @typedef {{ width: number, height: number }} Cell */
/**
 * @typedef {{ names: string[][], strips: Array<import("../strip.mjs").Strip | null>, nameWidth: number,
 *   icon: number, width: number, height: number }} Heads
 *   The heads of the rows: each part's name in its lines and its strip, the widest name, the room of the icon before
 *   it, and every head's width and height.
 * @typedef {{ relations: ViewRelation[], figures: string, lines: string[], height: number }} Mark
 *   A cell's mark: its relations, the count of the files they cite as figures or none, its label's lines and their
 *   height.
 * @typedef {{ keys: string[], lines: string[] }} Said
 *   A label said once in a head: the cells it is said for, and its lines.
 */
/**
 * @typedef {{ index: number, styles: Styles, metrics: Metrics, parts: ViewComponent[], heads: Heads,
 *   kinds: string[][], names: string[][], columnLabels: Map<number, Said>, rowLabels: Map<number, Said>,
 *   marks: Map<string, Mark>, seen: import("../strip.mjs").ViewFacts | null, cell: Cell, bounded: boolean,
 *   runs: Array<[number, number]>, bracket: number, tick: number, clear: number, name: string,
 *   named: number | null, gap: number, corner: string, side: number, above: number, labelLines: number,
 *   below: number, kindWidth: number, rowLabelWidth: number, left: number, top: number, width: number,
 *   height: number, x: number, y: number }} Planned
 *   A matrix planned at one step: what it sets in its heads and cells, and where; `named` is where the boundary's
 *   name starts, for a matrix that brackets the parts inside.
 */

/** Whether a line may end after an atom at the end of a word or a phrase: before a space, or after punctuation. */
const phraseEnd = (/** @type {Atom} */ unit, /** @type {Atom | undefined} */ next) =>
  Boolean(next?.gap) || /\p{P}$/u.test(unit.text);

/**
 * A text set on lines within a width as a part's details are set in a language written without spaces
 * (`detailParagraph`): filled line by line, broken between the atoms its writing system allows a break between and
 * never inside one, and a last line of one character, an orphan, takes the unit before it from the line above. A
 * line that would end inside a run of words ends instead after the last space or punctuation on it, where the line
 * after it still holds what it takes, so a mixed or punctuated label breaks between words; within a run of Han
 * characters the product has no word to keep whole and the orphan rule is the only guard. `tail` is the room the
 * last line keeps after its text for a count, which so never stands on a line alone. Null when an atom is wider
 * than the width, when an orphan stays, or on more than `most` lines.
 * @param {any} typefaces
 * @param {string} text
 * @param {number} width
 * @param {import("../text.mjs").TextStyle} style
 * @param {number} most
 * @param {number} [tail]
 * @returns {string[] | null}
 */
function setLines(typefaces, text, width, style, most, tail = 0) {
  const units = atoms(text);
  const wide = (/** @type {Atom[]} */ line) => typefaces.measure(joined(line), style);
  const room = (/** @type {Atom[]} */ line, /** @type {boolean} */ last) =>
    wide(line) + (last ? tail : 0) <= width;
  if (!units.length || units.some((unit) => wide([unit]) > width)) return null;
  /** @type {Atom[][]} */
  const lines = [[]];
  for (const unit of units) {
    const line = lines[lines.length - 1];
    if (line.length && wide([...line, unit]) > width) lines.push([unit]);
    else line.push(unit);
  }
  for (let last = lines[lines.length - 1]; !room(last, true); last = lines[lines.length - 1]) {
    if (last.length < 2) return null;
    lines.push([/** @type {Atom} */ (last.pop())]);
  }
  for (let at = 0; at < lines.length - 1; at += 1) {
    const [line, next] = [lines[at], lines[at + 1]];
    if (phraseEnd(/** @type {Atom} */ (line.at(-1)), next[0])) continue;
    const end = line.findLastIndex(
      (unit, place) => place < line.length - 1 && phraseEnd(unit, line[place + 1]),
    );
    const moved = [...line.slice(end + 1), ...next];
    if (end < 0 || !room(moved, at + 2 === lines.length)) continue;
    lines[at] = line.slice(0, end + 1);
    lines[at + 1] = moved;
  }
  const [above, last] = [lines.at(-2), lines[lines.length - 1]];
  if (above && orphan(joined(last))) {
    const kept = [/** @type {Atom} */ (above.at(-1)), ...last];
    if (above.length < 2 || !room(kept, true)) return null;
    above.pop();
    lines[lines.length - 1] = kept;
  }
  return lines.length <= most ? lines.map(joined) : null;
}

/**
 * The widest of some lines in a style.
 * @param {Measuring} typefaces
 * @param {string[]} lines
 * @param {TextStyle} style
 * @returns {number}
 */
const widest = (typefaces, lines, style) =>
  Math.max(0, ...lines.map((line) => typefaces.measure(line, style)));

/**
 * The relations of each ordered pair of the view's parts, by `<from> <to>`: the cell they share.
 * @param {import("../../plan/views.mjs").View} view
 */
function pairsOf(view) {
  /** @type {Map<string, any[]>} */
  const pairs = new Map();
  for (const relation of view.relations) {
    const key = `${relation.from}\u0000${relation.to}`;
    pairs.set(key, [...(pairs.get(key) ?? []), relation]);
  }
  return pairs;
}

/** The label a cell sets for its relations: each label once, in the relations' order. */
const labelOf = (relations) =>
  [...new Set(relations.map(({ label }) => label).filter(Boolean))].join(BETWEEN_LABELS);

/**
 * The labels said once: each row or column whose marks, two at least, all set one label, where none of its marks
 * is said for already; the line with more marks first, a column before a row, then in order.
 * @param {Map<string, any[]>} pairs
 * @param {Map<string, number>} order each part's place on both axes
 */
function saidOnce(pairs, order) {
  /** @type {Array<{ axis: "rows" | "columns", at: number, keys: string[], label: string }>} */
  const lines = [];
  for (const axis of /** @type {const} */ (["columns", "rows"])) {
    /** @type {Map<number, string[]>} */
    const by = new Map();
    for (const [key, relations] of pairs) {
      const at = /** @type {number} */ (order.get(relations[0][axis === "rows" ? "from" : "to"]));
      by.set(at, [...(by.get(at) ?? []), key]);
    }
    for (const [at, keys] of by) {
      const labels = new Set(keys.map((key) => labelOf(pairs.get(key))));
      const [label] = labels;
      if (keys.length > 1 && labels.size === 1 && label) lines.push({ axis, at, keys, label });
    }
  }
  const rank = (line) => [-line.keys.length, line.axis === "columns" ? 0 : 1, line.at];
  lines.sort((a, b) => {
    const [first, second] = [rank(a), rank(b)];
    const at = first.findIndex((value, place) => value !== second[place]);
    return at < 0 ? 0 : first[at] - second[at];
  });
  /** @type {Set<string>} */
  const covered = new Set();
  const said = { rows: new Map(), columns: new Map(), covered };
  for (const line of lines) {
    if (line.keys.some((key) => covered.has(key))) continue;
    said[line.axis].set(line.at, { label: line.label, keys: line.keys });
    for (const key of line.keys) covered.add(key);
  }
  return said;
}

/**
 * The compact cards that head the rows at one step: the kind's icon, the part's name and its strip on one line, the
 * name within the card's measure and on two lines at most, every strip starting at one left. All heads have one
 * width and one height. Null when a word of a name is wider than the measure.
 * @param {{ typefaces: any, style: import("../strip.mjs").Style }} scene
 * @param {ViewComponent[]} parts
 * @param {Styles} styles
 * @param {Metrics["card"]} card
 * @returns {Heads | null}
 */
function headsOf({ typefaces, style }, parts, styles, card) {
  const measure = POSTER.cardMeasure.name * styles.name.size;
  const names = parts.map((part) =>
    setLines(typefaces, part.label, measure, styles.name, MATRIX.nameLines),
  );
  if (names.some((lines) => !lines)) return null;
  const set = /** @type {string[][]} */ (names);
  const nameWidth = Math.ceil(widest(typefaces, set.flat(), styles.name));
  const strips = parts.map((part) => stripOf(style, part));
  const longest = Math.max(0, ...strips.map((strip) => strip?.length ?? 0));
  const icon = styles.name.size + MARK.gap;
  const lines = Math.max(...set.map((name) => name.length));
  return {
    names: set,
    strips,
    nameWidth,
    icon,
    width: Math.ceil(2 * card.pad + icon + nameWidth + (longest ? card.pad + longest : 0)),
    height: 2 * card.detailGap + lines * styles.name.line,
  };
}

/**
 * The size of the matrix's cells in a field: as large as the field allows below and beside the room its heads
 * take, within the cell's aspect; or null when a row would be lower than what heads it.
 * @param {{ field: { width: number, height: number }, left: number, top: number, count: number, least: number }} room
 *   `left` and `top` are the room the heads take, `count` the parts and `least` the height of the tallest row head
 * @returns {Cell | null}
 */
function cellSize({ field, left, top, count, least }) {
  const tallest = Math.floor((field.height - top) / count);
  const widestCell = Math.floor((field.width - left) / count);
  const height = Math.min(tallest, Math.floor(MATRIX.aspect * widestCell));
  const width = Math.min(widestCell, Math.floor(MATRIX.aspect * height));
  return height >= least && width > 0 ? { width, height } : null;
}

/**
 * Each cell's mark within a cell of one size: its relations, the files they cite, and its label's lines, none where
 * a head says the label; or null when a label does not fit.
 * @param {{ typefaces: any, styles: Styles, metrics: Metrics, pairs: Map<string, ViewRelation[]>,
 *   said: { covered: Set<string> }, counted: (relations: ViewRelation[]) => number, cell: Cell }} matrix
 * @returns {Map<string, Mark> | null}
 */
function marksOf({ typefaces, styles, metrics, pairs, said, counted, cell }) {
  const inner = cell.width - 2 * metrics.wire.labelPadX;
  /** @type {Map<string, Mark>} */
  const marks = new Map();
  for (const [key, relations] of pairs) {
    const count = counted(relations);
    const figures = count ? String(count) : "";
    const tail = figures
      ? typefaces.measure(JOINED, styles.edge) + typefaces.measure(figures, styles.count)
      : 0;
    const text = said.covered.has(key) ? "" : labelOf(relations);
    const lines = text
      ? setLines(typefaces, text, inner, styles.edge, MATRIX.labelLines, tail)
      : [];
    if (!lines || tail > inner) return null;
    const height = lines.length ? lines.length * styles.edge.line : figures ? styles.count.line : 0;
    if (height + 2 * metrics.wire.labelPadY > cell.height) return null;
    marks.set(key, { relations, figures, lines, height });
  }
  return marks;
}

/**
 * The runs of parts inside the repository along the matrix's order, each its first and last place.
 * @param {boolean[]} outside
 */
function insideRuns(outside) {
  /** @type {Array<[number, number]>} */
  const runs = [];
  outside.forEach((out, index) => {
    if (out) return;
    const last = runs.at(-1);
    if (last && last[1] === index - 1) last[1] = index;
    else runs.push([index, index]);
  });
  return runs;
}

/**
 * Where the boundary's name starts on the bracket over the columns of the first run of parts inside: a tick from the
 * run's left; or, where it would end past the field there, a tick short of the run's right end, so that it extends
 * left; or null when it stands within the field neither way.
 * @param {{ width: number, field: { x: number, width: number }, run: [number, number], grid: number,
 *   cell: number, tick: number, clear: number }} place
 *   `width` is the name's; `grid` the left of the matrix's grid and `cell` a column's width
 */
function nameAt({ width, field, run: [first, last], grid, cell, tick, clear }) {
  const from = grid + first * cell + clear + tick;
  if (from + width <= field.x + field.width) return from;
  const start = grid + (last + 1) * cell - clear - tick - width;
  return start >= field.x ? start : null;
}

/**
 * The matrix of a view at one type step within a field, measured and set out, or null when its cells, heads, names
 * or the boundary's name do not fit there.
 * @param {{ model: any, typefaces: any, icons: any, style: import("../strip.mjs").Style }} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {{ x: number, y: number, width: number, height: number }} field
 * @param {number} index the type step
 * @returns {Planned | null}
 */
function plan(scene, view, field, index) {
  const { model, typefaces, style } = scene;
  const styles = figureStyles(POSTER.steps[index]);
  const metrics = figureMetrics(styles);
  const { card, spacing, wire } = metrics;
  const parts = flowOrder(view);
  const heads = headsOf(scene, parts, styles, card);
  if (!heads) return null;
  // The kind is named once, at the first row of each run of rows of one kind.
  const kindOf = (part) => presentation(model, part).label;
  const kinds = parts.map((part, at) =>
    at && kindOf(parts[at - 1]) === kindOf(part)
      ? []
      : setLines(typefaces, kindOf(part), spacing.rowColumn, styles.detail, MATRIX.labelLines),
  );
  if (kinds.some((lines) => !lines)) return null;
  const order = new Map(parts.map(({ id }, at) => [id, at]));
  const pairs = pairsOf(view);
  const said = saidOnce(pairs, order);
  const rowLabels = new Map(
    [...said.rows].map(([at, { label, keys }]) => [
      at,
      {
        keys,
        lines: setLines(typefaces, label, wire.maximumLabel, styles.edge, MATRIX.labelLines),
      },
    ]),
  );
  if ([...rowLabels.values()].some(({ lines }) => !lines)) return null;
  const gap = card.pad;
  const kindWidth = Math.ceil(
    widest(typefaces, /** @type {string[][]} */ (kinds).flat(), styles.detail),
  );
  const rowLabelWidth = Math.ceil(
    widest(
      typefaces,
      [...rowLabels.values()].flatMap(({ lines }) => lines ?? []),
      styles.edge,
    ),
  );
  const outside = parts.map((part) => presentation(model, part).outside);
  const bounded = outside.includes(true) && outside.includes(false);
  const runs = bounded ? insideRuns(outside) : [];
  const bracket = bounded ? spacing.boundaryPad : 0;
  // A bracket's tick, and the paper it keeps from the rules at its ends.
  const [tick, clear] = [bracket / 2, spacing.labelRowGap / 2];
  const name = model.repository?.name ?? model.title;
  const nameWidth = bounded ? typefaces.measure(name, styles.boundary) : 0;
  const left =
    bracket + kindWidth + gap + heads.width + gap + (rowLabelWidth ? rowLabelWidth + gap : 0);
  const above = bounded ? styles.boundary.line + spacing.labelRowGap : 0;
  const below = spacing.labelRowGap;
  const most = (lines, style) =>
    Math.max(0, ...lines.map((set) => (set?.length ?? 0) * style.line));
  const least =
    Math.max(
      heads.height,
      most(kinds, styles.detail),
      most(
        [...rowLabels.values()].map(({ lines }) => lines),
        styles.edge,
      ),
    ) + below;
  const seen = measuredOf(style)?.view(view) ?? null;
  const counted = (relations) =>
    seen ? relations.reduce((sum, relation) => sum + (seen.cited(relation) ?? 0), 0) : 0;
  const corner = wordsOf(model.locale).matrix.corner;
  if (typefaces.measure(corner, styles.detail) > left - bracket - gap) return null;
  // The heads of the columns take as few lines as their names need, and the labels they say once as few as theirs:
  // the matrix is sized for the fewest lines first and takes the first size at which every name and label wraps
  // into its lines in its column, so its cells are as large as the field allows.
  for (let nameLines = 1; nameLines <= MATRIX.headLines; nameLines += 1)
    for (const labelLines of said.columns.size ? [1, MATRIX.labelLines] : [0]) {
      const top = above + nameLines * styles.name.line + labelLines * styles.edge.line + below;
      const cell = cellSize({ field, left, top, count: parts.length, least });
      if (!cell) continue;
      const inner = cell.width - 2 * wire.labelPadX;
      const names = parts.map((part) =>
        setLines(typefaces, part.label, inner, styles.name, nameLines),
      );
      const columnLabels = new Map(
        [...said.columns].map(([at, { label, keys }]) => [
          at,
          { keys, lines: setLines(typefaces, label, inner, styles.edge, labelLines) },
        ]),
      );
      if (names.some((lines) => !lines) || [...columnLabels.values()].some(({ lines }) => !lines))
        continue;
      const marks = marksOf({ typefaces, styles, metrics, pairs, said, counted, cell });
      if (!marks) continue;
      const width = left + parts.length * cell.width;
      const height = top + parts.length * cell.height;
      const x = Math.round(field.x + (field.width - width) / 2);
      const named = bounded
        ? nameAt({
            width: nameWidth,
            field,
            run: runs[0],
            grid: x + left,
            cell: cell.width,
            tick,
            clear,
          })
        : null;
      if (bounded && named === null) continue;
      // Every name, kind and label above was checked to be set in its lines.
      return {
        index,
        styles,
        metrics,
        parts,
        heads,
        kinds: /** @type {string[][]} */ (kinds),
        names: /** @type {string[][]} */ (names),
        columnLabels: /** @type {Map<number, Said>} */ (columnLabels),
        rowLabels: /** @type {Map<number, Said>} */ (rowLabels),
        marks,
        seen,
        cell,
        bounded,
        runs,
        bracket,
        tick,
        clear,
        name,
        named,
        gap,
        corner,
        side: KEY_SIDE,
        above,
        labelLines,
        below,
        kindWidth,
        rowLabelWidth,
        left,
        top,
        width,
        height,
        x,
        y: Math.round(field.y + (field.height - height) / 2),
      };
    }
  return null;
}

/**
 * Every matrix of a view within a field, one for each type step it fits at, densest first: the compositions a
 * plate weighs as matrices, each as the grid's `platesOf` hands one back, with no crossing, route or bend.
 * @param {{ model: any, typefaces: any, icons: any, style: import("../strip.mjs").Style }} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {{ x: number, y: number, width: number, height: number }} field
 */
export function* matrices(scene, view, field) {
  for (const index of POSTER.steps.keys()) {
    const planned = plan(scene, view, field, index);
    if (!planned) continue;
    yield {
      step: index,
      limit: null,
      flat: false,
      details: false,
      layout: { measures: { crossings: 0, routes: 0, bends: 0 } },
      figure: drawMatrix(planned, scene),
    };
  }
}

/**
 * The key of a plate drawn as a matrix: what the strips show, as on any plate, and the marks of its cells, each a
 * sample tinted as the matrix tints a cell and ruled round in the colour of its rules: where the cells hold counts, a
 * cell holding one, named as the count a grid's line carries; and where the cells into the view's hub take the
 * oldest dye, one of those, named as the grid names a line into the hub. A matrix draws no line, so the strips' key
 * gives it no sample of one.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {import("../strip.mjs").Style} style
 * @param {readonly string[]} drawn the rows of the table of lines the matrix's cells draw
 * @param {{ side: number }} matrix
 */
export function matrixKey(model, view, style, drawn, { side }) {
  const cellRows = ["citations", "emphasis"];
  const key = stripKey(
    model,
    view,
    style,
    drawn.filter((row) => !cellRows.includes(row)),
  );
  const C = colorsOf(style.tokens);
  const measures = measureWordsOf(model.locale);
  const clear = 1 - TINT;
  if (drawn.includes("citations"))
    key.push({
      shape: "cell",
      side,
      tint: C.line,
      clear,
      rule: C.rule,
      color: C.line,
      count: 3,
      size: POSTER.floor,
      label: measures["cited-files"],
    });
  const hub = measuredOf(style)?.view(view).hub;
  if (drawn.includes("emphasis") && hub) {
    // The hub is a part of the view: its facts measure it from the view's own relations.
    const { label } = /** @type {{ label: string }} */ (
      view.components.find(({ id }) => id === hub)
    );
    key.push({
      shape: "cell",
      side,
      tint: C.dye[2],
      clear,
      rule: C.rule,
      label: measures.hub(label),
    });
  }
  return key;
}

/**
 * The key's sample of a row of the table of lines as a matrix draws it: the boundary as the bracket over the columns
 * of the parts inside, and a planned or retired relation as a cell tinted and edged in its status's colour and
 * pattern, ruled round as every cell.
 * @param {import("../strip.mjs").Style} style
 * @param {{ side: number }} matrix
 * @param {string} row
 */
export function matrixSample(style, { side }, row) {
  if (row === "boundary") return { shape: "bracket" };
  const C = colorsOf(style.tokens);
  const { color } = lineLook([{ to: "", status: row }], null, linesOf(style.lines), C);
  return { shape: "cell", side, tint: color, clear: 1 - TINT, rule: C.rule, color, status: row };
}
