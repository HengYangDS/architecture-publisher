import { atoms } from "../breaks.mjs";
import { presentation } from "../kinds.mjs";
import { detailText, wordsOf, writtenUnspaced } from "../locale.mjs";
import { DARKNESS, darkness } from "./balance.mjs";
import { spreadOf } from "./spread.mjs";
import {
  POSTER,
  colorsOf,
  figureMetrics,
  figureStyles,
  fixed,
  linesOf,
  measureWidth,
} from "./tokens.mjs";

/**
 * Strip marks: each part is drawn as its label, a strip made of the files
 * it owns at the pin, and a caption under the strip, so a plate shows what the
 * model claims as well as how its parts relate. A strip's length is its part's
 * bytes on one scale for the whole edition, and every strip is equally thick,
 * so size is read from length alone; each file is one segment of it, as long
 * as its share of the part's bytes and dyed by how recently it changed. A
 * relation's line carries the number of files it cites. A part's box stays a
 * rectangle, as wide as the larger of its text and its strip, so placement,
 * routing and every gate are the cards' engine. Every size, share, age band,
 * count and hub is read from the layer of measured facts the style carries;
 * this module binds a fact to a length, a dye or a word and measures none.
 *
 * @typedef {{ palette: { paper: string, ink: string, green: string, mid: string, soft: string,
 *     rule: string, ochre: string },
 *   figure: { card: string, cardStroke: string, outside: string, outsideStroke: string,
 *     outsideMark: string, boundary: string, retired: string, shadow: string },
 *   dye: { new: string, mid: string, old: string } }} Tokens
 * @typedef {{ bytes: number,
 *   files: ReadonlyArray<{ path: string, bytes: number, band: number, share: number }> }} Part
 *   A part as the layer holds it for a strip: its bytes and its files in path order, each with its bytes, its age
 *   band and its share of the part.
 * @typedef {{ hub: string | null, cited: (relation: { id: string }) => number | undefined,
 *   bands: ReadonlySet<number> }} ViewFacts
 *   A view's facts: its hub, the number of files each of its relations cites, and the age bands its parts hold.
 * @typedef {{ part: (component: { id: string, group?: boolean }) => Part | null, scale: number | null,
 *   date: string | null, spans: readonly number[], view: (view: any) => ViewFacts }} Facts
 *   The edition's measured facts as a strip plate reads them: each part, the bytes of the largest part, which is the
 *   scale of every strip, the pin's date, the two spans of the age bands, and each view's facts.
 * @typedef {{ name: "strip" | "card", tokens: Tokens, facts?: Facts, longest?: number,
 *   lines?: { rows: Record<string, any> } }} Style
 *   `lines` is a table of lines to draw with in place of the house's own.
 */

/**
 * A strip's measures in plate px, which the edition sets at one size on every
 * page, so one px of strip is one share of code on every plate. The largest
 * part is 480 px long: as long as a label at the largest type step may run
 * (16 em of 32 px is 512 px), so it widens its box little at that step, and
 * well inside the widest box (760 px) and the narrowest field a plate gives a
 * figure (65 percent of the body less the tier column, about 1186 px), so it
 * fits at every step; on the page it is 320 pt, 84 mm at A3. A part that owns
 * any code is at least 2 px, so it never vanishes. Every strip is 12 px thick,
 * 2 mm at A3, whatever its size or type step. A part that owns no files is a
 * dashed outline 40 px long, which reads as no strip, not as a short one.
 */
const STRIP = Object.freeze({ shortest: 2, thickness: 12, empty: 40 });

/**
 * The lengths, in px, an edition may draw its largest part at, longest first: a strip is never shortened to fit
 * its column, so an edition whose views cannot hold its strips draws them all shorter, on one scale still.
 */
export const STRIP_LENGTHS = Object.freeze([360, 240]);

/**
 * The paper between two files of a strip, in px. A file narrower than it would
 * be a seam, not a thread, so it merges into a neighbour of its band.
 */
const SEAM = 1;

/**
 * How long the edition draws its largest part, in px: the length the build chose, or the longest it may.
 * @param {Style} style
 */
export const longestOf = (style) => style.longest ?? STRIP_LENGTHS[0];

/**
 * Plan and compose an edition at the first strip length that lays out every view: a view that cannot be laid out
 * with the strips at one length is tried again with all of them shorter. Cards are planned once.
 * @template T
 * @param {Style} style
 * @param {(style: Style) => Promise<T>} plan
 * @param {readonly number[]} [lengths] the lengths still to try, longest first
 * @returns {Promise<T>}
 */
export async function withStripLength(style, plan, lengths = STRIP_LENGTHS) {
  if (style.name !== "strip") return plan(style);
  const [longest, ...shorter] = lengths;
  try {
    return await plan({ ...style, longest });
  } catch (error) {
    if (/** @type {any} */ (error)?.code !== "plate_unfittable" || !shorter.length) throw error;
    return withStripLength(style, plan, shorter);
  }
}

/**
 * A strip's length in px: its part's bytes on the edition's scale, at least
 * the shortest strip; a part that owns no files is the empty outline's length.
 * @param {Part} part
 * @param {number} scale
 */
function lengthOf(part, scale, longest) {
  if (!part.files.length) return STRIP.empty;
  return Math.max(STRIP.shortest, (longest * part.bytes) / scale);
}

/**
 * A part's strip across its length: one segment per file in path order, as
 * wide as its share of the part, in its band. A file narrower than a seam
 * merges into a neighbour of its band.
 * @param {Part} part
 * @param {number} length
 */
function segmentsOf(part, length) {
  /** @type {Array<{ band: number, width: number }>} */
  const segments = [];
  for (const file of part.files) {
    const width = length * file.share;
    const last = segments.at(-1);
    if (last && last.band === file.band && (width < SEAM || last.width < SEAM)) last.width += width;
    else segments.push({ band: file.band, width });
  }
  return segments;
}

/** A part's size as its caption gives it, in kilobytes of 1000 bytes. */
const kilobytes = (bytes) =>
  bytes > 0 && bytes < 500 ? "< 1 KB" : `${Math.round(bytes / 1000)} KB`;

/**
 * The key's sample strip: the largest round size, 1, 2 or 5 times a power of
 * ten bytes, no more than half the edition's scale, so the sample is a strip
 * a reader can hold against any part's and read in round numbers.
 * @param {number} scale
 */
function sampleOf(scale) {
  let bytes = 1;
  for (let power = 1; power <= scale / 2; power *= 10)
    for (const step of [1, 2, 5]) if (step * power <= scale / 2) bytes = step * power;
  return { bytes, size: bytes < 1000 ? `${bytes} B` : `${bytes / 1000} KB` };
}

/**
 * How tall a part's strip marks are from its label's top to its foot: its label, its strip
 * between two gaps, its caption and its leading detail.
 * @param {{ name: string[], details: string[], gap: number }} text
 * @param {any} styles
 */
export function stripHeight({ name, details, gap }, styles) {
  return (
    name.length * styles.name.line +
    2 * gap +
    STRIP.thickness +
    (1 + details.length) * styles.detail.line
  );
}

/**
 * How a strip plate sizes and sets its parts at one type step: each box as
 * wide as its strip or as its label, caption and leading detail need within
 * their measures, whichever is wider, and as tall as its label, strip, caption
 * and leading detail, on the baseline grid. A box has no padding: the label is
 * its top and the caption, or the leading detail, its foot.
 * @param {{ model: any, typefaces: any, styles: any, card: any, style: Style }} input
 */
export function stripBoxes({ model, typefaces, styles, card, style }) {
  const words = wordsOf(model.locale);
  const facts = /** @type {Facts} */ (style.facts);
  const scale = /** @type {number} */ (facts.scale);
  const longest = longestOf(style);
  const measure = (text, textStyle) => typefaces.measure(text, textStyle);
  const lines = {
    name: measureWidth(typefaces, styles.name),
    detail: measureWidth(typefaces, styles.detail),
  };
  /** @type {Map<any, { part: Part, caption: { kind: string, count: string }, leading: any }>} */
  const known = new Map();
  const factsOf = (component) => {
    if (!known.has(component)) {
      const part = /** @type {Part} */ (facts.part(component));
      const count = part.files.length
        ? words.files(part.files.length, kilobytes(part.bytes))
        : words.ownsNoFiles;
      const kind = presentation(model, component).label;
      known.set(component, { part, caption: { kind, count }, leading: component.details[0] });
    }
    return /** @type {{ part: Part, caption: { kind: string, count: string }, leading: any }} */ (
      known.get(component)
    );
  };
  // The kind and the counts stand two ems apart at least, so they read as two facts.
  const captionWidth = ({ kind, count }) =>
    measure(kind, styles.detail) + 2 * styles.detail.size + measure(count, styles.detail);
  const leadingText = (leading) => detailText(words, leading[0], leading[1]);
  const unspaced = writtenUnspaced(model.locale);
  // A detail to be spread is wrapped as a paragraph, by the width Typst sets its lines in.
  const detailWidth = unspaced ? typefaces.typesetWidth : typefaces.measure;
  const detailLines = unspaced ? typefaces.detailParagraph : typefaces.detailLines;
  const text = (component, width) => {
    const { part, caption, leading } = factsOf(component);
    // The leading detail wraps to one measure, which its spread lines end at.
    const measured = Math.min(width, lines.detail);
    const details = leading
      ? detailLines(words, leading[0], leading[1], measured, styles.detail)
      : [];
    return {
      name: typefaces.wrap(component.label, Math.min(width, lines.name), styles.name),
      details,
      spread: spreadOf([details], measured, styles.detail, detailWidth, unspaced),
      caption,
      // The counts end at the box's edge, as a spread line does, so they are placed by the width they are set in.
      counts: unspaced ? { set: typefaces.typesetWidth(caption.count, styles.detail) } : null,
      part,
      length: lengthOf(part, scale, longest),
      gap: card.detailGap,
    };
  };
  return {
    // A strip is never shortened to fit, so no column of the view may be narrower than its longest strip.
    least: (components) =>
      Math.max(
        0,
        ...components.map((component) => lengthOf(factsOf(component).part, scale, longest)),
      ),
    width: (component) => {
      const { part, caption, leading } = factsOf(component);
      const width = Math.max(
        card.minimumWidth,
        lengthOf(part, scale, longest),
        Math.min(measure(component.label, styles.name), POSTER.cardMeasure.name * styles.name.size),
        captionWidth(caption),
        leading
          ? Math.min(
              measure(leadingText(leading), styles.detail),
              POSTER.cardMeasure.detail * styles.detail.size,
            )
          : 0,
      );
      return Math.ceil(width / 8) * 8;
    },
    height: (component, width) =>
      Math.ceil(stripHeight(text(component, width), styles) / POSTER.grid.baseline) *
      POSTER.grid.baseline,
    text,
    /**
     * The first unit of a part's text wider than its box gives it: a word of its
     * label or leading detail, or its caption, which is set on one line.
     */
    broken: (component, width) => {
      const { caption, leading } = factsOf(component);
      const units = [
        ...atoms(component.label).map(({ text: unit }) => ({
          reason: "label_broken",
          measured: measure(unit, styles.name),
          room: Math.min(width, lines.name),
        })),
        ...(leading ? atoms(leadingText(leading)) : []).map(({ text: unit }) => ({
          reason: "detail_broken",
          measured: detailWidth(unit, styles.detail),
          room: Math.min(width, lines.detail),
        })),
        { reason: "caption_broken", measured: captionWidth(caption), room: width },
      ];
      const wide = units.find(({ measured, room }) => measured > room);
      return wide
        ? {
            reason: wide.reason,
            id: component.id,
            width: Math.ceil(wide.measured),
            room: Math.floor(wide.room),
          }
        : null;
    },
  };
}

/**
 * Draw one part's strip marks from the top of its box: its label, its strip
 * and its caption, then its leading detail. A box taller than its marks, in a row
 * with a taller one, keeps its spare height at its foot. The strip's segments
 * are mass as dark as their dye; the label, caption and detail are mass whose
 * darkness their runs carry. It hands back the rectangle the marks are set in:
 * from the label's top to the foot of the last line, as wide as the box.
 * @param {{ x: number, y: number, width: number, component: any,
 *   text: ReturnType<ReturnType<typeof stripBoxes>["text"]>, styles: any,
 *   colors: ReturnType<typeof colorsOf>, lines: ReturnType<typeof linesOf> }} marks
 * @param {{ text: Function, shapes: string[], rects: any[], typefaces: any }} draw
 */
export function drawStrip(marks, draw) {
  const { x, y, width, component, text, styles, colors: C } = marks;
  const { part, length, gap, caption } = text;
  const thickness = STRIP.thickness;
  // A block of lines is as wide as its widest line is set: a spread line at its measure.
  const block = (lines, top, style, spread = []) =>
    draw.rects.push({
      x,
      y: top,
      width: Math.max(
        ...lines.map(
          (line, index) =>
            spread[index]?.measure ?? spread[index]?.set ?? draw.typefaces.measure(line, style),
        ),
      ),
      height: lines.length * style.line,
      kind: "mass",
      weight: 0,
    });
  let top = y;
  const ink = component.status === "retired" ? C.muted : C.ink;
  for (const line of text.name)
    top = draw.text("cards", line, x, top, styles.name, ink, component.id);
  block(text.name, y, styles.name);
  top += gap;
  let offset = 0;
  const segments = segmentsOf(part, length);
  for (const [index, { band, width: share }] of segments.entries()) {
    // Each file leaves a seam of paper before the next; a file too narrow to
    // give one up keeps its whole width, so it is never lost in the seam.
    const drawn = index < segments.length - 1 && share >= 2 * SEAM ? share - SEAM : share;
    const color = C.dye[band];
    draw.shapes.push(
      `<rect x="${fixed(x + offset)}" y="${fixed(top)}" width="${fixed(drawn)}" height="${fixed(thickness)}" fill="${color}"/>`,
    );
    draw.rects.push({
      x: x + offset,
      y: top,
      width: drawn,
      height: thickness,
      kind: "mass",
      weight: darkness(color, C.paper),
    });
    offset += share;
  }
  // A part without files is the outline of an empty strip; a planned or
  // retired part's strip is outlined in its status's dashes.
  const status = component.status && component.status !== "implemented" ? component.status : null;
  if (!segments.length || status) {
    draw.shapes.push(
      `<rect x="${fixed(x)}" y="${fixed(top)}" width="${fixed(length)}" height="${fixed(thickness)}" fill="none" ` +
        `stroke="${C.line}" stroke-width="1" stroke-dasharray="${status ? marks.lines.status(status) : POSTER.dash.empty}"/>`,
    );
    draw.rects.push({
      x,
      y: top,
      width: length,
      height: thickness,
      kind: "stroke",
      weight: DARKNESS.stroke * darkness(C.line, C.paper),
    });
  }
  top += thickness + gap;
  draw.text("cards", caption.kind, x, top, styles.detail, C.muted);
  const count = text.counts?.set ?? draw.typefaces.measure(caption.count, styles.detail);
  draw.text(
    "cards",
    caption.count,
    x + width - count,
    top,
    styles.detail,
    C.muted,
    null,
    text.counts,
  );
  draw.rects.push({ x, y: top, width, height: styles.detail.line, kind: "mass", weight: 0 });
  top += styles.detail.line;
  if (text.details.length) {
    block(text.details, top, styles.detail, text.spread);
    for (const [index, line] of text.details.entries())
      top = draw.text("cards", line, x, top, styles.detail, C.muted, null, text.spread[index]);
  }
  return { x: fixed(x), y: fixed(y), width: fixed(width), height: fixed(top - y) };
}

/** The arrowhead of the key's sample line: the one a plate draws at every type step but its largest. */
const KEY_ARROW = figureMetrics(figureStyles(POSTER.steps[0])).wire.arrow;

/**
 * The key of a strip plate, only for what it shows, each mark a sample drawn
 * as the plate draws it: the age bands its strips hold, each named by its days
 * before the commit, and the date of the commit they are counted back from; a
 * strip of a round size on the edition's scale, when a part owns files; a count,
 * when the figure sets one; and a line into the hub, as heavy as the figure draws
 * one and with its arrowhead, when the figure draws one. A row of the table of
 * lines is keyed by the shape the table names for it.
 * @param {any} model
 * @param {{ components: any[], relations: any[] }} view
 * @param {Style} style
 * @param {readonly string[]} drawn the rows of the table of lines the figure draws
 * @returns {Array<{ shape: string, label: string, [field: string]: unknown }>}
 */
export function stripKey(model, view, style, drawn) {
  const words = wordsOf(model.locale);
  const C = colorsOf(style.tokens);
  const facts = /** @type {Facts} */ (style.facts);
  const seen = facts.view(view);
  const shown = seen.bands;
  // A band is named by its days before the commit, never by a calendar word
  // such as "this week", which would read from the day the plate is read.
  const [newest, middle] = facts.spans.map((span) => Math.round(span / 86400));
  const names = [words.sinceCommit(newest), words.within(middle), words.earlier];
  /** @type {Array<{ shape: string, label: string, [field: string]: unknown }>} */
  const key = [0, 1, 2]
    .filter((band) => shown.has(band))
    .map((band) => ({ shape: "band", band, color: C.dye[band], label: names[band] }));
  if (shown.size && facts.date)
    key.push({ shape: "reference", date: facts.date, label: words.committed(facts.date) });
  if (shown.size) {
    const scale = /** @type {number} */ (facts.scale);
    const { bytes, size } = sampleOf(scale);
    key.push({
      shape: "length",
      bytes,
      length: fixed((longestOf(style) * bytes) / scale),
      thickness: STRIP.thickness,
      color: C.dye[0],
      label: words.length(size),
    });
  }
  const lines = linesOf(style.lines);
  const keyed = (row) => (drawn.includes(row) ? lines.key(row) : null);
  const count = keyed("citations");
  if (count)
    key.push({ shape: count, count: 3, size: POSTER.floor, color: C.line, label: words.cited });
  const hub = keyed("emphasis");
  if (hub) {
    const { label } = view.components.find(({ id }) => id === seen.hub);
    key.push({
      shape: hub,
      color: C.dye[2],
      weight: lines.stroke(true),
      arrow: fixed(KEY_ARROW * lines.arrow(true)),
      label: words.leadsTo(label),
    });
  }
  return key;
}
