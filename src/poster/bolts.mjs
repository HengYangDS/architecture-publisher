import { atoms } from "../breaks.mjs";
import { presentation } from "../kinds.mjs";
import { detailText, wordsOf } from "../locale.mjs";
import { DARKNESS, darkness } from "./balance.mjs";
import { POSTER, colorsOf, fixed, measureWidth } from "./tokens.mjs";

/**
 * The bolts style: each part is drawn as its label, a strip woven of the files
 * it owns at the pin, and a caption under the strip, so a plate shows what the
 * model claims as well as how its parts relate. A strip is as long as its box
 * is wide and as thick as the root of the part's share of the edition's
 * largest part; each file is one segment of it, as wide as its share of the
 * part's bytes and dyed by how recently it changed. A part's box stays a
 * rectangle, so placement, routing and every gate are the cards' engine.
 *
 * @typedef {{ palette: { paper: string, ink: string, green: string, mid: string, soft: string,
 *     rule: string, ochre: string },
 *   figure: { card: string, cardStroke: string, outside: string, outsideStroke: string,
 *     outsideMark: string, boundary: string, retired: string, shadow: string },
 *   dye: { new: string, mid: string, old: string } }} Tokens
 * @typedef {{ bytes: number, files: ReadonlyArray<{ path: string, bytes: number, band: number }> }} Part
 * @typedef {{ name: "bolts" | "cards", tokens: Tokens, parts?: Map<string, Part>, most?: number,
 *   bands?: { spans: number[] } }} Style
 */

/** A part that owns no files. */
const EMPTY = Object.freeze({ bytes: 0, files: Object.freeze([]) });

/**
 * A line's weight in px at the unit of the 24 px label step, for a relation
 * that one, two, or three or more files evidence; one that cites none keeps
 * the thinnest line.
 */
const WEIGHTS = Object.freeze([1.2, 1.8, 2.4]);

/**
 * The paper between two files of a strip, in px. A file narrower than it would
 * be a seam, not a thread, so it merges into a neighbour of its band.
 */
const SEAM = 1;

/**
 * The spans an edition's age bands are bounded by, in days, shortest first: the
 * ladder the edition chose its bands from, whose names the key gives.
 */
const LADDER = Object.freeze([1, 3, 7, 30, 90, 365, 1095].map((days) => days * 86400));

/**
 * How many files evidence a relation: its own, or for an overview's relation,
 * those of the model's relations it stands for.
 * @param {{ relations: Array<{ id: string, files: string[] }> }} model
 * @param {{ files: string[], relations?: string[] }} relation
 */
function citing(model, relation) {
  if (!relation.relations) return relation.files.length;
  const ids = new Set(relation.relations);
  return new Set(model.relations.filter(({ id }) => ids.has(id)).flatMap(({ files }) => files))
    .size;
}

/** The weight step of a count of citing files: 1, 2 or 3, a relation without files drawn as one. */
const stepOf = (count) => Math.min(WEIGHTS.length, Math.max(1, count));

/**
 * A wire's width in px: the weight of the relation it carries that the most
 * files evidence, at the step's unit.
 * @param {{ relations: Array<{ id: string, files: string[] }> }} model
 * @param {Array<{ files: string[], relations?: string[] }>} relations
 * @param {number} unit
 */
export function wireWidth(model, relations, unit) {
  const count = Math.max(...relations.map((relation) => citing(model, relation)));
  return Math.round(WEIGHTS[stepOf(count) - 1] * unit * 100) / 100;
}

/**
 * The part of a view that most of its relations end at, when at least three
 * do and more than at any other part: the view's hub, whose relations a reader
 * follows in the oldest dye. A tie has no hub.
 * @param {{ relations: Array<{ to: string }> }} view
 * @returns {string | null}
 */
export function hubOf(view) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const { to } of view.relations) counts.set(to, (counts.get(to) ?? 0) + 1);
  const [first = ["", 0], second = ["", 0]] = [...counts].sort((a, b) => b[1] - a[1]);
  return first[1] >= 3 && first[1] > second[1] ? first[0] : null;
}

/**
 * The files a part owns: its own, or for a group the overview draws, its
 * members' files in path order.
 * @param {any} model
 * @param {Map<string, Part>} parts
 * @param {{ id: string, group?: boolean }} component
 * @returns {Part}
 */
function partOf(model, parts, component) {
  const own = parts.get(component.id);
  if (own) return own;
  if (!component.group) return EMPTY;
  const files = model.groups
    .find(({ id }) => id === component.id)
    .members.flatMap((id) => parts.get(id)?.files ?? [])
    .sort((a, b) => (a.path < b.path ? -1 : 1));
  return { bytes: files.reduce((sum, { bytes }) => sum + bytes, 0), files };
}

/**
 * A strip's thickness in px: 4 + 16 √(bytes / most) units, in whole units, so
 * every plate of an edition shares one scale; a part that owns no files is the
 * thinnest strip.
 * @param {Part} part
 * @param {number} most
 * @param {number} unit
 */
function thicknessOf(part, most, unit) {
  if (!part.files.length) return 4 * unit;
  return Math.round(4 + 16 * Math.sqrt(part.bytes / Math.max(most, part.bytes, 1))) * unit;
}

/**
 * A part's strip across its length: one segment per file in path order, as
 * wide as its share of the part's bytes, in its band. A file narrower than a
 * seam merges into a neighbour of its band; a part of empty files shares its
 * length evenly.
 * @param {Part} part
 * @param {number} length
 */
function weave(part, length) {
  /** @type {Array<{ band: number, width: number }>} */
  const segments = [];
  for (const file of part.files) {
    const width = length * (part.bytes > 0 ? file.bytes / part.bytes : 1 / part.files.length);
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
 * How tall a bolt is from its label's top to its foot: its label, its strip
 * between two gaps, its caption and its leading detail.
 * @param {{ name: string[], details: string[], thickness: number, gap: number }} text
 * @param {any} styles
 */
export function boltHeight({ name, details, thickness, gap }, styles) {
  return (
    name.length * styles.name.line + 2 * gap + thickness + (1 + details.length) * styles.detail.line
  );
}

/**
 * How a bolts plate sizes and sets its parts at one type step: each box as
 * wide as its label, caption and leading detail need within their measures,
 * and as tall as its label, strip, caption and leading detail, on the
 * baseline grid. A box has no padding: the label is its top and the caption,
 * or the leading detail, its foot.
 * @param {{ model: any, typefaces: any, styles: any, card: any, style: Style }} input
 */
export function boltBoxes({ model, typefaces, styles, card, style }) {
  const words = wordsOf(model.locale);
  const parts = /** @type {Map<string, Part>} */ (style.parts);
  const unit = styles.name.size / 24;
  const measure = (text, textStyle) => typefaces.measure(text, textStyle);
  const lines = {
    name: measureWidth(typefaces, styles.name),
    detail: measureWidth(typefaces, styles.detail),
  };
  /** @type {Map<any, { part: Part, caption: { kind: string, count: string }, leading: any }>} */
  const known = new Map();
  const factsOf = (component) => {
    if (!known.has(component)) {
      const part = partOf(model, parts, component);
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
  const text = (component, width) => {
    const { part, caption, leading } = factsOf(component);
    return {
      name: typefaces.wrap(component.label, Math.min(width, lines.name), styles.name),
      details: leading
        ? typefaces.detailLines(
            words,
            leading[0],
            leading[1],
            Math.min(width, lines.detail),
            styles.detail,
          )
        : [],
      caption,
      part,
      thickness: thicknessOf(part, /** @type {number} */ (style.most), unit),
      gap: card.detailGap,
    };
  };
  return {
    width: (component) => {
      const { caption, leading } = factsOf(component);
      const width = Math.max(
        card.minimumWidth,
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
      Math.ceil(boltHeight(text(component, width), styles) / POSTER.grid.baseline) *
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
          measured: measure(unit, styles.detail),
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
 * Draw one part as a bolt from the top of its box: its label, its strip and
 * its caption, then its leading detail. A box taller than its bolt, in a row
 * with a taller one, keeps its spare height at its foot. The strip's segments
 * are mass as dark as their dye; the label, caption and detail are mass whose
 * darkness their runs carry.
 * @param {{ x: number, y: number, width: number, component: any,
 *   text: ReturnType<ReturnType<typeof boltBoxes>["text"]>, styles: any,
 *   colors: ReturnType<typeof colorsOf> }} bolt
 * @param {{ text: Function, shapes: string[], rects: any[], typefaces: any }} draw
 */
export function drawBolt(bolt, draw) {
  const { x, y, width, component, text, styles, colors: C } = bolt;
  const { part, thickness, gap, caption } = text;
  const block = (lines, top, style) =>
    draw.rects.push({
      x,
      y: top,
      width: Math.max(...lines.map((line) => draw.typefaces.measure(line, style))),
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
  const segments = weave(part, width);
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
  // A part without files is the outline of the thinnest strip; a planned or
  // retired part's strip is outlined in its status's dashes.
  const status = component.status && component.status !== "implemented" ? component.status : null;
  if (!segments.length || status) {
    draw.shapes.push(
      `<rect x="${fixed(x)}" y="${fixed(top)}" width="${fixed(width)}" height="${fixed(thickness)}" fill="none" ` +
        `stroke="${C.line}" stroke-width="1" stroke-dasharray="${POSTER.dash[status ?? "empty"]}"/>`,
    );
    draw.rects.push({
      x,
      y: top,
      width,
      height: thickness,
      kind: "stroke",
      weight: DARKNESS.stroke * darkness(C.line, C.paper),
    });
  }
  top += thickness + gap;
  draw.text("cards", caption.kind, x, top, styles.detail, C.muted);
  const count = draw.typefaces.measure(caption.count, styles.detail);
  draw.text("cards", caption.count, x + width - count, top, styles.detail, C.muted);
  draw.rects.push({ x, y: top, width, height: styles.detail.line, kind: "mass", weight: 0 });
  top += styles.detail.line;
  if (!text.details.length) return;
  block(text.details, top, styles.detail);
  for (const line of text.details) top = draw.text("cards", line, x, top, styles.detail, C.muted);
}

/** The ladder span nearest a band boundary, by ratio. */
const rungOf = (span) =>
  LADDER.reduce(
    (best, step, index) =>
      Math.abs(Math.log(span / step)) < Math.abs(Math.log(span / LADDER[best])) ? index : best,
    0,
  );

/**
 * The key of a bolts plate, only for what it shows: the age bands its strips
 * hold, named by the edition's spans in the model's language; the thickness,
 * when a part owns files; the line weights, when a relation cites files; and
 * the hub the view draws on.
 * @param {any} model
 * @param {{ components: any[], relations: any[] }} view
 * @param {Style} style
 * @returns {Array<{ shape: string, label: string, band?: number, color?: string, counts?: number[] }>}
 */
export function boltKey(model, view, style) {
  const words = wordsOf(model.locale);
  const C = colorsOf(style.tokens);
  const parts = /** @type {Map<string, Part>} */ (style.parts);
  const shown = new Set(
    view.components.flatMap((component) =>
      partOf(model, parts, component).files.map(({ band }) => band),
    ),
  );
  const [shorter, longer] = /** @type {{ spans: number[] }} */ (style.bands).spans.map(
    (span) => words.spans[rungOf(span)],
  );
  const names = [words.changedWithin(shorter), words.within(longer), words.earlier];
  /** @type {Array<{ shape: string, label: string, band?: number, color?: string, counts?: number[] }>} */
  const key = [0, 1, 2]
    .filter((band) => shown.has(band))
    .map((band) => ({ shape: "band", band, color: C.dye[band], label: names[band] }));
  if (shown.size) key.push({ shape: "thickness", label: words.thickness });
  const counts = view.relations.map((relation) => citing(model, relation));
  if (counts.some((count) => count > 0))
    key.push({
      shape: "weight",
      counts: [...new Set(counts.map(stepOf))].sort((a, b) => a - b),
      label: words.weight,
    });
  const hub = hubOf(view);
  if (hub) {
    const { label } = view.components.find(({ id }) => id === hub);
    key.push({ shape: "hub", color: C.dye[2], label: words.drawsOn(label) });
  }
  return key;
}
