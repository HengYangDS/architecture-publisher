import { measureWordsOf } from "../locale.mjs";
import { darkness } from "./balance.mjs";
import { POSTER, colorsOf, figureMetrics, figureStyles, fixed, linesOf } from "./tokens.mjs";

/**
 * The strip of a part: the files it owns at the pin, drawn as one region of its card, so a plate shows what the
 * model claims as well as how its parts relate. A strip's length is its part's bytes on one scale for the whole
 * edition, and every strip is equally thick, so size is read from length alone; each file is one segment of it, as
 * long as its share of the part's bytes and dyed by how recently it changed. A part has a strip where the build
 * read a checkout at the pin and the part owns files there; a part that owns none has none, and a build without a
 * checkout draws no strip at all. Where an edition draws strips, a relation's line carries the number of files it
 * cites and the lines into a view's hub are heavier. Every size, share, age band, count and hub is read from the
 * layer of measured facts the style carries; this module binds a fact to a length, a dye or a word and measures
 * none.
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
 *   The edition's measured facts as a plate reads them: each part, the bytes of the largest part, which is the
 *   scale of every strip, the pin's date, the two spans of the age bands, and each view's facts.
 * @typedef {{ tokens: Tokens, facts?: Facts, longest?: number, lines?: { rows: Record<string, any> } }} Style
 *   The style every plate of an edition is drawn in: its tokens and the edition's measured facts. `lines` is a
 *   table of lines to draw with in place of the house's own.
 * @typedef {{ part: Part, length: number, thickness: number }} Strip
 *   A part's strip as its card draws it: the part, and the strip's length and thickness in px.
 */

/**
 * A strip's measures in plate px, which the edition sets at one size on every
 * page, so one px of strip is one share of bytes on every plate. A part that
 * owns any bytes is at least 2 px, so it never vanishes. Every strip is 12 px
 * thick, whatever its size or type step.
 */
const STRIP = Object.freeze({ shortest: 2, thickness: 12 });

/**
 * The lengths, in px, an edition may draw its largest part at, longest first: a strip is never shortened to fit
 * its column, so an edition whose views cannot hold its strips draws them all shorter, on one scale still.
 *
 * A strip stands within its card's padding, so a card is wider than its strip by twice the padding, 32 px at the
 * two densest type steps. Bare strips ran 360 px, and a row of six columns, 328 and 321 px at those steps, held
 * any strip as long as a column. 320 px is the longest length on the 8 px grid at which the same strip, on the
 * shorter scale and inside its card, still stands in that column; 208 px keeps the ratio for the shorter scale,
 * which was 240 px.
 */
export const STRIP_LENGTHS = Object.freeze([320, 208]);

/**
 * The paper between two files of a strip, in px. A file narrower than it would
 * be a seam, not a thread, so it merges into a neighbour of its band.
 */
const SEAM = 1;

/**
 * The edition's measured facts where its parts have strips: a checkout was read at the pin and a part owns a file
 * there. Otherwise none, and no plate draws a strip, a count of cited files or a heavier line.
 * @param {Style} style
 * @returns {Facts | null}
 */
export function measuredOf(style) {
  const { facts } = style;
  return facts && typeof facts.scale === "number" ? facts : null;
}

/**
 * How long the edition draws its largest part, in px: the length the build chose, or the longest it may.
 * @param {Style} style
 */
export const longestOf = (style) => style.longest ?? STRIP_LENGTHS[0];

/**
 * Plan and compose an edition at the first strip length that lays out every view: a view that cannot be laid out
 * with the strips at one length is tried again with all of them shorter. An edition that draws no strip is planned
 * once.
 * @template T
 * @param {Style} style
 * @param {(style: Style) => Promise<T>} plan
 * @param {readonly number[]} [lengths] the lengths still to try, longest first
 * @returns {Promise<T>}
 */
export async function withStripLength(style, plan, lengths = STRIP_LENGTHS) {
  if (!measuredOf(style)) return plan(style);
  const [longest, ...shorter] = lengths;
  try {
    return await plan({ ...style, longest });
  } catch (error) {
    if (/** @type {any} */ (error)?.code !== "plate_unfittable" || !shorter.length) throw error;
    return withStripLength(style, plan, shorter);
  }
}

/**
 * A part's strip in the edition's style: as long as its part's bytes on the edition's scale, at least the shortest
 * strip; or none for a part that owns no files, and for every part of an edition that draws no strip.
 * @param {Style} style
 * @param {{ id: string, group?: boolean }} component
 * @returns {Strip | null}
 */
export function stripOf(style, component) {
  const facts = measuredOf(style);
  const part = facts?.part(component);
  if (!facts || !part?.files.length) return null;
  const scale = /** @type {number} */ (facts.scale);
  return {
    part,
    length: Math.max(STRIP.shortest, (longestOf(style) * part.bytes) / scale),
    thickness: STRIP.thickness,
  };
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
export const kilobytes = (bytes) =>
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
 * Draw a part's strip from its left end: its segments, each mass as dark as its dye.
 * @param {{ x: number, y: number, strip: Strip, colors: ReturnType<typeof colorsOf> }} at
 * @param {{ shapes: string[], rects: any[] }} draw
 */
export function drawSegments({ x, y, strip, colors: C }, draw) {
  const segments = segmentsOf(strip.part, strip.length);
  let offset = 0;
  for (const [index, { band, width: share }] of segments.entries()) {
    // Each file leaves a seam of paper before the next; a file too narrow to
    // give one up keeps its whole width, so it is never lost in the seam.
    const drawn = index < segments.length - 1 && share >= 2 * SEAM ? share - SEAM : share;
    const color = C.dye[band];
    draw.shapes.push(
      `<rect x="${fixed(x + offset)}" y="${fixed(y)}" width="${fixed(drawn)}" height="${fixed(strip.thickness)}" fill="${color}"/>`,
    );
    draw.rects.push({
      x: x + offset,
      y,
      width: drawn,
      height: strip.thickness,
      kind: "mass",
      weight: darkness(color, C.paper),
    });
    offset += share;
  }
}

/** The arrowhead of the key's sample line: the one a plate draws at every type step but its largest. */
const KEY_ARROW = figureMetrics(figureStyles(POSTER.steps[0])).wire.arrow;

/**
 * The key's sample of the heavy line, as the figure draws one (`lineLook`): the shape the table of lines names for its
 * emphasis, in the oldest dye, at the heavier weight and with its larger arrowhead, named by `label`.
 * @param {Style} style
 * @param {string} label
 */
export function heavyLine(style, label) {
  const lines = linesOf(style.lines);
  return {
    shape: /** @type {string} */ (lines.key("emphasis")),
    color: colorsOf(style.tokens).dye[2],
    weight: lines.stroke(true),
    arrow: fixed(KEY_ARROW * lines.arrow(true)),
    label,
  };
}

/**
 * The key's entries for what an edition's strips and lines show on one plate, only for what it shows, each mark a
 * sample drawn as the plate draws it: the age bands its strips hold, each named by its days before the commit, and
 * the date of the commit they are counted back from; a strip of a round size on the edition's scale, when a part
 * owns files; a count, when the figure sets one; and a line into the hub, as heavy as the figure draws one and
 * with its arrowhead, when the figure draws one. A row of the table of lines is keyed by the shape the table names
 * for it. An edition that draws no strip has none of these.
 * @param {any} model
 * @param {{ components: any[], relations: any[] }} view
 * @param {Style} style
 * @param {readonly string[]} drawn the rows of the table of lines the figure draws
 * @returns {Array<{ shape: string, label: string, [field: string]: unknown }>}
 */
export function stripKey(model, view, style, drawn) {
  const facts = measuredOf(style);
  if (!facts) return [];
  // Each entry takes its words by the property of the fact it speaks of.
  const measures = measureWordsOf(model.locale);
  const C = colorsOf(style.tokens);
  const seen = facts.view(view);
  const shown = seen.bands;
  // A band is named by its days before the commit, never by a calendar word
  // such as "this week", which would read from the day the plate is read.
  const [newest, middle] = facts.spans.map((span) => Math.round(span / 86400));
  const bands = measures["file-age-band"];
  // The middle band is named by both its bounds, so no reader takes it to hold the newest band's files.
  const names = [bands.newest(newest), bands.middle(newest, middle), bands.oldest(middle)];
  // The pin's date leads the bands it dates, so that the bands' own words are a bound and a unit and no more.
  /** @type {Array<{ shape: string, label: string, [field: string]: unknown }>} */
  const key =
    shown.size && facts.date
      ? [
          {
            shape: "reference",
            date: facts.date,
            // On a page the foot states the commit and its date; the key there says only what the bands count from.
            label: measures["pin-date"](facts.date),
            undated: measures["pin-date"](null),
          },
        ]
      : [];
  for (const band of [0, 1, 2])
    if (shown.has(band)) key.push({ shape: "band", band, color: C.dye[band], label: names[band] });
  if (shown.size) {
    const scale = /** @type {number} */ (facts.scale);
    const { bytes, size } = sampleOf(scale);
    key.push({
      shape: "length",
      bytes,
      length: fixed((longestOf(style) * bytes) / scale),
      thickness: STRIP.thickness,
      color: C.dye[0],
      label: measures["owned-bytes"](size),
    });
  }
  const lines = linesOf(style.lines);
  const keyed = (row) => (drawn.includes(row) ? lines.key(row) : null);
  const count = keyed("citations");
  if (count)
    key.push({
      shape: count,
      count: 3,
      size: POSTER.floor,
      color: C.line,
      label: measures["cited-files"],
    });
  if (keyed("emphasis")) {
    const { label } = view.components.find(({ id }) => id === seen.hub);
    key.push(heavyLine(style, measures.hub(label)));
  }
  return key;
}
