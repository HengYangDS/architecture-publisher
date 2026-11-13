import { atoms } from "../breaks.mjs";
import { presentation } from "../kinds.mjs";
import { detailText, wordsOf } from "../locale.mjs";
import { DARKNESS, darkness } from "./balance.mjs";
import { POSTER, colorsOf, figureMetrics, figureStyles, fixed, measureWidth } from "./tokens.mjs";

/**
 * Strip marks: each part is drawn as its label, a strip made of the files
 * it owns at the pin, and a caption under the strip, so a plate shows what the
 * model claims as well as how its parts relate. A strip's length is its part's
 * bytes on one scale for the whole edition, and every strip is equally thick,
 * so size is read from length alone; each file is one segment of it, as long
 * as its share of the part's bytes and dyed by how recently it changed. A
 * relation's line carries one tick per file it cites. A part's box stays a
 * rectangle, as wide as the larger of its text and its strip, so placement,
 * routing and every gate are the cards' engine.
 *
 * @typedef {{ palette: { paper: string, ink: string, green: string, mid: string, soft: string,
 *     rule: string, ochre: string },
 *   figure: { card: string, cardStroke: string, outside: string, outsideStroke: string,
 *     outsideMark: string, boundary: string, retired: string, shadow: string },
 *   dye: { new: string, mid: string, old: string } }} Tokens
 * @typedef {{ bytes: number, files: ReadonlyArray<{ path: string, bytes: number, band: number }> }} Part
 * @typedef {{ name: "strip" | "card", tokens: Tokens, parts?: Map<string, Part>, most?: number,
 *   bands?: { spans: readonly number[] }, reference?: string, longest?: number }} Style
 */

/** A part that owns no files. */
const EMPTY = Object.freeze({ bytes: 0, files: Object.freeze([]) });

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
 * Ticks across a relation's line, in plate px: 10 px long, 5 px apart, the
 * first 12 px from where its run starts, at most five; past five, or where the
 * run is too short to hold them, the count is written beside them.
 */
const TICK = Object.freeze({ length: 10, gap: 5, from: 12, most: 5 });

/**
 * The paper between two files of a strip, in px. A file narrower than it would
 * be a seam, not a thread, so it merges into a neighbour of its band.
 */
const SEAM = 1;

/**
 * How many files a relation cites: its own, or for an overview's relation,
 * every file the model's relations it stands for cite.
 * @param {{ relations: Array<{ id: string, files: string[] }> }} model
 * @param {{ files: string[], relations?: string[] }} relation
 */
export function citedFiles(model, relation) {
  if (!relation.relations) return relation.files.length;
  const ids = new Set(relation.relations);
  return new Set(model.relations.filter(({ id }) => ids.has(id)).flatMap(({ files }) => files))
    .size;
}

/**
 * Where each relation's ticks stand: on the part of its line no other
 * relation shares, from its source's end. A relation that shares its first
 * run with others, as a fan out of one part does, takes them on its own
 * branch, from where it leaves the others. Each run is a path of the layout,
 * keyed by its index, with whether its ticks start from its last point.
 * @param {{ relations: Array<{ id: string, files: string[] }> }} model
 * @param {{ cards: Map<string, { x: number, y: number, width: number, height: number }>,
 *   paths: Array<{ relations: any[], points: number[][] }> }} layout
 * @returns {Map<number, Array<{ count: number, reverse: boolean }>>}
 */
export function tickRuns(model, layout) {
  const near = (a, b) => Math.abs(a - b) < 0.5;
  const within = (value, low, high) => value > low - 0.5 && value < high + 0.5;
  // A line ends on a part's top or foot, or on its side for a relation along a row.
  /** @param {number[]} point */
  const cardAt = ([x, y]) =>
    [...layout.cards].find(
      ([, box]) =>
        ((near(y, box.y) || near(y, box.y + box.height)) && within(x, box.x, box.x + box.width)) ||
        ((near(x, box.x) || near(x, box.x + box.width)) && within(y, box.y, box.y + box.height)),
    )?.[0];
  /** @type {Map<any, Array<{ index: number, last: boolean, card: string | undefined }>>} */
  const own = new Map();
  layout.paths.forEach(({ relations, points }, index) => {
    for (const last of [false, true]) {
      const card = cardAt(points[last ? points.length - 1 : 0]);
      const ending = relations.filter(({ from, to }) => from === card || to === card);
      if (ending.length === 1)
        own.set(ending[0], [...(own.get(ending[0]) ?? []), { index, last, card }]);
    }
  });
  /** @type {Map<number, Array<{ count: number, reverse: boolean }>>} */
  const runs = new Map();
  for (const [relation, ends] of own) {
    const count = citedFiles(model, relation);
    if (!count) continue;
    const source = ends.find(({ card }) => card === relation.from);
    // Without a run of its own at its source, its run ends at its target: the ticks start from the other end.
    const { index, last } = source ?? { ...ends[0], last: !ends[0].last };
    runs.set(index, [...(runs.get(index) ?? []), { count, reverse: last }]);
  }
  return runs;
}

/**
 * The ticks along a line from its first point, one per file up to five, each
 * across the line and clear of its corners, of its far end, where an
 * arrowhead or the next part stands, and of the relation labels set over it,
 * whose paper would hide them; and, when the ticks alone do not give the
 * count, where it is written: beside the last tick, or at the middle of the
 * line's first run when none fits.
 * @param {number[][]} points
 * @param {number} count
 * @param {number} radius the radius of the line's corners
 * @param {Array<{ x: number, y: number, width: number, height: number }>} [labels]
 * @returns {{ ticks: number[][][], note: { x: number, y: number, vertical: boolean } | null }}
 */
export function ticksAlong(points, count, radius, labels = []) {
  const covered = (x, y) =>
    labels.some(
      (label) =>
        x > label.x - 2 &&
        x < label.x + label.width + 2 &&
        y > label.y - 2 &&
        y < label.y + label.height + 2,
    );
  const wanted = Math.min(count, TICK.most);
  const half = TICK.length / 2;
  /** @type {number[][][]} */
  const ticks = [];
  /** @type {{ x: number, y: number, vertical: boolean } | null} */
  let last = null;
  /** @type {number} */
  let at = TICK.from;
  let start = 0;
  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    at = Math.max(at, start + (index > 1 ? radius : 0));
    const end = start + length - (index < points.length - 1 ? radius : TICK.from);
    for (; at <= end && ticks.length < wanted; at += TICK.gap) {
      const share = (at - start) / length;
      const [x, y] = [x1 + (x2 - x1) * share, y1 + (y2 - y1) * share];
      if (covered(x, y)) continue;
      // Across the line: its direction turned a quarter, half a tick each way.
      const [dx, dy] = [((y2 - y1) / length) * half, (-(x2 - x1) / length) * half];
      ticks.push([
        [x - dx, y - dy],
        [x + dx, y + dy],
      ]);
      last = { x, y, vertical };
    }
    start += length;
  }
  if (ticks.length === count) return { ticks, note: null };
  const [[x1, y1], [x2, y2]] = points;
  const middle = {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
    vertical: Math.abs(x2 - x1) < Math.abs(y2 - y1),
  };
  return { ticks, note: last ?? middle };
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
 * The bytes the longest strip of an edition stands for: its largest part's,
 * or a group's that the overview draws, when the group's members together own
 * more. Every plate measures its strips on it, so one length is one size
 * across the edition.
 * @param {any} model
 * @param {Style} style
 */
function scaleOf(model, style) {
  const parts = /** @type {Map<string, Part>} */ (style.parts);
  return Math.max(
    1,
    /** @type {number} */ (style.most),
    ...model.groups.map((group) => partOf(model, parts, { id: group.id, group: true }).bytes),
  );
}

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
 * wide as its share of the part's bytes, in its band. A file narrower than a
 * seam merges into a neighbour of its band; a part of empty files shares its
 * length evenly.
 * @param {Part} part
 * @param {number} length
 */
function segmentsOf(part, length) {
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
  const parts = /** @type {Map<string, Part>} */ (style.parts);
  const scale = scaleOf(model, style);
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
 * Draw one part's strip marks from the top of its box: its label, its strip
 * and its caption, then its leading detail. A box taller than its marks, in a row
 * with a taller one, keeps its spare height at its foot. The strip's segments
 * are mass as dark as their dye; the label, caption and detail are mass whose
 * darkness their runs carry.
 * @param {{ x: number, y: number, width: number, component: any,
 *   text: ReturnType<ReturnType<typeof stripBoxes>["text"]>, styles: any,
 *   colors: ReturnType<typeof colorsOf> }} marks
 * @param {{ text: Function, shapes: string[], rects: any[], typefaces: any }} draw
 */
export function drawStrip(marks, draw) {
  const { x, y, width, component, text, styles, colors: C } = marks;
  const { part, length, gap, caption } = text;
  const thickness = STRIP.thickness;
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
        `stroke="${C.line}" stroke-width="1" stroke-dasharray="${POSTER.dash[status ?? "empty"]}"/>`,
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
  const count = draw.typefaces.measure(caption.count, styles.detail);
  draw.text("cards", caption.count, x + width - count, top, styles.detail, C.muted);
  draw.rects.push({ x, y: top, width, height: styles.detail.line, kind: "mass", weight: 0 });
  top += styles.detail.line;
  if (!text.details.length) return;
  block(text.details, top, styles.detail);
  for (const line of text.details) top = draw.text("cards", line, x, top, styles.detail, C.muted);
}

/**
 * Tick a relation's run, from its first point, in its line's colour and
 * weight; past five ticks, or where the run is too short for them all, the
 * count is set beside them in the smallest type, right of a run that falls and
 * above one that crosses. Ticks are strokes and the count is text to the
 * balance measure.
 * @param {{ points: number[][], count: number, color: string, radius: number, weight: number,
 *   style: any, paper: string, labels: Array<{ x: number, y: number, width: number, height: number }> }} run
 * @param {{ text: Function, shapes: string[], rects: any[], typefaces: any }} draw
 */
export function drawTicks(run, draw) {
  const { ticks, note } = ticksAlong(run.points, run.count, run.radius, run.labels);
  const ink = { kind: "stroke", weight: DARKNESS.stroke * darkness(run.color, run.paper) };
  if (ticks.length)
    draw.shapes.push(
      `<path d="${ticks.map(([[x1, y1], [x2, y2]]) => `M${fixed(x1)},${fixed(y1)} L${fixed(x2)},${fixed(y2)}`).join(" ")}" ` +
        `stroke="${run.color}" stroke-width="${run.weight}" fill="none"/>`,
    );
  for (const [[x1, y1], [x2, y2]] of ticks)
    draw.rects.push({
      x: Math.min(x1, x2) - run.weight / 2,
      y: Math.min(y1, y2) - run.weight / 2,
      width: Math.abs(x2 - x1) + run.weight,
      height: Math.abs(y2 - y1) + run.weight,
      ...ink,
    });
  if (!note) return;
  const value = String(run.count);
  const width = draw.typefaces.measure(value, run.style);
  const clear = TICK.length / 2 + 4;
  const [x, top] = note.vertical
    ? [note.x + clear, note.y - run.style.line / 2]
    : [note.x - width / 2, note.y - clear - run.style.line];
  draw.text("labels", value, x, top, run.style, run.color);
  draw.rects.push({ x, y: top, width, height: run.style.line, kind: "mass", weight: 0 });
}

/** The arrowhead of the key's sample line: the one a plate draws at every type step but its largest. */
const KEY_ARROW = figureMetrics(figureStyles(POSTER.steps[0])).wire.arrow;

/**
 * The key of a strip plate, only for what it shows, each mark a sample drawn
 * as the plate draws it: the age bands its strips hold, each named by its days
 * before the commit, and the date of the commit they are counted back from; a
 * strip of a round size on the edition's scale, when a part owns files; ticks,
 * when a relation cites files; and a line into the hub the view's relations lead to, with its arrowhead.
 * @param {any} model
 * @param {{ components: any[], relations: any[] }} view
 * @param {Style} style
 * @returns {Array<{ shape: string, label: string, [field: string]: unknown }>}
 */
export function stripKey(model, view, style) {
  const words = wordsOf(model.locale);
  const C = colorsOf(style.tokens);
  const parts = /** @type {Map<string, Part>} */ (style.parts);
  const shown = new Set(
    view.components.flatMap((component) =>
      partOf(model, parts, component).files.map(({ band }) => band),
    ),
  );
  // A band is named by its days before the commit, never by a calendar word
  // such as "this week", which would read from the day the plate is read.
  const [newest, middle] = /** @type {{ spans: readonly number[] }} */ (style.bands).spans.map(
    (span) => Math.round(span / 86400),
  );
  const names = [words.sinceCommit(newest), words.within(middle), words.earlier];
  /** @type {Array<{ shape: string, label: string, [field: string]: unknown }>} */
  const key = [0, 1, 2]
    .filter((band) => shown.has(band))
    .map((band) => ({ shape: "band", band, color: C.dye[band], label: names[band] }));
  if (shown.size && style.reference)
    key.push({
      shape: "reference",
      date: style.reference,
      label: words.committed(style.reference),
    });
  if (shown.size) {
    const scale = scaleOf(model, style);
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
  if (view.relations.some((relation) => citedFiles(model, relation) > 0))
    key.push({
      shape: "ticks",
      count: 3,
      length: TICK.length,
      gap: TICK.gap,
      weight: POSTER.wire.stroke,
      color: C.line,
      label: words.ticks,
    });
  const hub = hubOf(view);
  if (hub) {
    const { label } = view.components.find(({ id }) => id === hub);
    key.push({
      shape: "hub",
      color: C.dye[2],
      weight: POSTER.wire.stroke,
      arrow: KEY_ARROW,
      label: words.leadsTo(label),
    });
  }
  return key;
}
