import { HOUSE } from "../house.mjs";
import { CATEGORY_LOOKS } from "../kinds.mjs";
import { ROUTE } from "../layout/measure.mjs";

/**
 * The figure's design tokens: one type scale, one baseline grid and one
 * palette; every plate is a choice of wrapping and type step on these tokens.
 */
export const POSTER = Object.freeze({
  /** The smallest type in a figure, and the type scale every size must come from. */
  floor: 14,
  scale: Object.freeze([14, 16, 18, 20, 24, 28, 32, 36, 48]),
  /** Every line box is a whole number of 4 px baseline steps. */
  grid: Object.freeze({ baseline: 4 }),
  /** A text block keeps a measure a reader can follow without losing the line. */
  measure: 80,
  /**
   * A figure of compact cards may widen its column gaps up to this multiple of
   * the token gap, so it spans more of its field instead of sitting in its middle.
   */
  gapBound: 2,
  /**
   * A justified figure deepens its channels only slightly: a stretched channel
   * is blank space between rows. Cards never stretch; a figure shorter than its
   * band is centred in it, and the page fills by what it carries.
   */
  channelBound: 1.35,
  /**
   * A drawn figure's ink may sit this far from its field's centre line, as a
   * share of the field's width, before the figure is moved: within it the
   * figure's outline stays centred, and past it the figure moves only as far as
   * this tolerance, half the balance gate, leaves.
   */
  centreTolerance: 0.025,
  /**
   * A card's lines, in ems of their size: a label runs to this measure before it
   * wraps, and a detail to its own. Cards are as wide as their longest line
   * within these measures and no wider, so a card is never a panel of paper
   * around a short line; a field too narrow for that width narrows them.
   */
  cardMeasure: Object.freeze({ name: 16, detail: 24 }),
  /**
   * Figure type steps, densest first: card label, detail and relation-label
   * sizes, each on the type scale. A dense view takes the first step and a
   * sparse one a later, larger step, with its cards, padding and gaps scaled
   * with its text, so a figure of a few components fills its page instead of
   * floating in it. No size grows past 1.8 times its size at the first step,
   * and every step stays below the plate heading, so a sparse figure is set
   * larger without changing voice.
   */
  steps: Object.freeze([
    Object.freeze({ name: 18, detail: 14, edge: 14 }),
    Object.freeze({ name: 20, detail: 16, edge: 16 }),
    Object.freeze({ name: 24, detail: 18, edge: 18 }),
    Object.freeze({ name: 28, detail: 20, edge: 20 }),
    Object.freeze({ name: 32, detail: 24, edge: 24 }),
  ]),
  spacing: Object.freeze({
    column: 64,
    inset: 28,
    /** The column at the left of a labelled row that holds its tier label. */
    rowColumn: 280,
    stub: 16,
    track: 16,
    bandGap: 8,
    arrowStub: 18,
    labelGap: 16,
    labelRowGap: 8,
    portSpacing: 40,
    portMargin: 30,
    /**
     * The least distance between two parallel wires, or two ports side by
     * side: closer, a reader takes two wires for one.
     */
    separation: ROUTE.parallel,
    /**
     * The least distance between a relation's label and another relation's
     * wire: closer, the label reads as that wire's.
     */
    labelClear: ROUTE.label,
    /**
     * The least gap between two relations' marks on one line, a label row or a
     * band track: closer, a reader continues one into the other, and a row of
     * labels and jogs reads as one labelled bus.
     */
    join: ROUTE.join,
    /**
     * The least distance between a wire's turn on a label row and a card of
     * the row above or below that the wire does not connect: closer, a reader
     * takes the turn for one of that card's wires.
     */
    turnClear: ROUTE.join,
    /**
     * How far a card's one port moves off its centre when that centre lines
     * its wire up with another card's wire through that card: in line, a
     * reader follows one wire on through the card it does not enter.
     */
    axisClear: 40,
    minJog: 56,
    clear: 14,
    minChannel: 64,
    rowPad: 16,
    /**
     * The paper between the boundary and the cards it encloses, on every side;
     * above them it also clears the boundary's name tab, which reaches 14 px
     * under the edge. Narrower, the edge crowded the cards as a second outline;
     * wider, a figure that fits a page at 20 px no longer did.
     */
    boundaryPad: 20,
    boundaryBottom: 20,
    boundaryHead: 14,
    /** The gap between two plates on one page. */
    plateGap: 40,
  }),
  wire: Object.freeze({
    arrow: 9,
    radius: 7,
    labelPadX: 9,
    labelPadY: 4,
    maximumLabel: 250,
  }),
});

/**
 * The tokens a plate is drawn in when its edition names no palette: the house
 * palette, figure and dyes, the colours of the 0.12 plates.
 */
const HOUSE_TOKENS = Object.freeze({
  palette: HOUSE.palette,
  figure: HOUSE.figure,
  dye: HOUSE.dye,
});

/**
 * The style a plate is drawn in when its edition gives none: the house tokens,
 * and no measured facts, so no part has a strip.
 * @type {import("./strip.mjs").Style}
 */
export const HOUSE_STYLE = Object.freeze({ tokens: HOUSE_TOKENS });

/**
 * The colours of a figure, named by what they mark, from an edition's
 * resolved tokens. Colour marks meaning, not category: every kind is drawn in
 * the palette's green, checks in its ochre and what lies outside the system in
 * a grey; a kind is told apart by its icon and label. The dyes run from the
 * newest age band to the oldest.
 * @param {import("./strip.mjs").Tokens} tokens
 */
export function colorsOf({ palette, figure, dye }) {
  return Object.freeze({
    paper: palette.paper,
    ink: palette.ink,
    muted: palette.soft,
    faint: figure.retired,
    line: palette.mid,
    card: figure.card,
    cardStroke: figure.cardStroke,
    external: figure.outside,
    externalStroke: figure.outsideStroke,
    boundary: figure.boundary,
    rule: palette.rule,
    accent: palette.green,
    shadow: figure.shadow,
    // A category's hue: the mark of what lies outside, the palette's accent role (the house's ochre, not the token
    // `accent` above), or the dye's oldest step.
    hue: Object.freeze(
      Object.fromEntries(
        Object.entries(CATEGORY_LOOKS).map(([category, look]) => [
          category,
          look.outside ? figure.outsideMark : look.accent ? palette.ochre : palette.green,
        ]),
      ),
    ),
    dye: Object.freeze([dye.new, dye.mid, dye.old]),
  });
}

/**
 * The values a plate draws its lines with, from a table of lines: the house's
 * own, or a copy a test gives. Each value is read where a plate first draws
 * with it, and a row the table lacks is an error that names it.
 * @param {{ rows: Record<string, any> }} [table]
 */
export function linesOf(table = HOUSE.lines) {
  const row = (id) => {
    if (!table.rows[id]) throw new Error(`The table of lines has no row "${id}".`);
    return table.rows[id];
  };
  const pattern = (id) => row(id).dash.join(" ");
  return Object.freeze({
    /** The stroke of a relation's line, and of one that carries emphasis. */
    stroke: (emphasis = false) => row("relation").stroke * (emphasis ? row("emphasis").factor : 1),
    /** How many times as large the arrowhead of a line is when it carries emphasis. */
    arrow: (emphasis = false) => (emphasis ? row("emphasis").arrow : 1),
    boundary: () => ({ stroke: row("boundary").stroke, dash: pattern("boundary") }),
    /** The pattern of a planned or a retired part or relation. */
    status: (status) => pattern(status),
    /** The shape of a row's sample in the key, or null for a row the key does not hold. */
    key: (id) => row(id).key,
    /** The rows no work has tested, with the shape each is keyed by. */
    untested: () =>
      Object.entries(table.rows).flatMap(([id, { tested, key, meaning }]) =>
        tested ? [] : [{ id, key, meaning }],
      ),
  });
}

/** A coordinate as an SVG writes it, to a tenth of a pixel. */
export const fixed = (value) => Math.round(value * 10) / 10;

/**
 * The width at which a text style keeps at most 80 characters on a line, so no
 * card's text runs a measure a reader loses the line in.
 * @param {{ measure: (text: string, style: any) => number }} typefaces
 * @param {{ size: number, weight: number, line: number }} style
 */
export function measureWidth(typefaces, style) {
  return Math.ceil(typefaces.measure("n".repeat(POSTER.measure), style));
}

/** Line boxes on the 4 px baseline: a size's line is its size rounded up to a baseline multiple. */
const line = (size) => Math.ceil((size * 1.32) / POSTER.grid.baseline) * POSTER.grid.baseline;

/**
 * Style for one size of the type scale. `extra` sets the weight, so the same
 * size carries a card label and a detail without the size leaving the scale.
 * @param {number} size
 * @param {object} [extra]
 */
function style(size, extra = {}) {
  return Object.freeze({ size, weight: 400, line: line(size), ...extra });
}

/**
 * A figure's text at one type step. Every size comes from the type scale, so a
 * sparse view is set larger and a dense one smaller without ever leaving it.
 * @param {{ name: number, detail: number, edge: number }} step
 */
export function figureStyles(step) {
  return Object.freeze({
    name: style(step.name, { weight: 700 }),
    detail: style(step.detail),
    // Parts carry their names alone in bold, so a relation's name, set
    // regular, reads under the parts it joins rather than as loud as them.
    edge: style(step.edge),
    edgeDetail: style(step.detail),
    tier: style(step.detail, { weight: 700 }),
    note: style(POSTER.floor, { weight: 700 }),
    count: style(POSTER.floor),
    boundary: style(Math.min(24, Math.max(step.name, 20)), { weight: 700 }),
  });
}

/** A figure's card and wire metrics at one type step, rounded to 8 px. */
export function figureMetrics(styles) {
  const unit = styles.name.size / 24;
  const round = (value) => Math.max(8, Math.round(value / 8) * 8);
  const separation = Math.max(POSTER.spacing.separation, round(2 * POSTER.wire.arrow * unit));
  return Object.freeze({
    card: Object.freeze({
      pad: round(20 * unit),
      radius: round(10 * unit),
      detailGap: round(6 * unit),
      bar: round(4 * unit),
      minimumWidth: 200,
      maximumWidth: 760,
    }),
    wire: Object.freeze({
      ...POSTER.wire,
      labelPadX: round(POSTER.wire.labelPadX * unit),
      labelPadY: round(POSTER.wire.labelPadY * unit),
      arrow: round(POSTER.wire.arrow * unit),
      maximumLabel: Math.min(360, round(POSTER.wire.maximumLabel * unit)),
    }),
    spacing: Object.freeze({
      ...POSTER.spacing,
      column: round(64 * unit),
      columnSpread: POSTER.gapBound,
      inset: round(28 * unit),
      stub: round(16 * unit),
      track: Math.max(POSTER.spacing.separation, round(16 * unit)),
      separation,
      join: Math.max(POSTER.spacing.join, 2 * separation),
      arrowStub: round(18 * unit),
      labelGap: round(16 * unit),
      labelRowGap: round(8 * unit),
      labelClear: Math.max(POSTER.spacing.labelClear, round(POSTER.spacing.labelClear * unit)),
      clear: round(14 * unit),
      rowPad: round(16 * unit),
      minChannel: round(64 * unit),
    }),
  });
}
