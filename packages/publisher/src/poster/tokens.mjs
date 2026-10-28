import { ROUTE } from "../layout/measure.mjs";

/**
 * Poster design tokens. One fixed landscape page, one grid, one type scale and
 * one palette; every composition is a choice of archetype, wrapping and type
 * step on these tokens, never a new format.
 */
export const POSTER = Object.freeze({
  width: 2400,
  height: 1350,
  /** The smallest type on any poster, and the type scale every size must come from. */
  floor: 14,
  scale: Object.freeze([14, 16, 18, 20, 24, 28, 32, 36, 48]),
  margin: 64,
  /** Twelve columns of 160 px with 32 px gutters fill 2400 − 2 × 64 exactly. */
  grid: Object.freeze({ columns: 12, column: 160, gutter: 32, baseline: 4 }),
  /** A text block keeps a measure a reader can follow without losing the line. */
  measure: 80,
  summaryLines: 3,
  /** One tier holds at most this many cards before a candidate wraps it. */
  rowLimit: 6,
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
    minJog: 56,
    clear: 14,
    minChannel: 64,
    rowPad: 16,
    boundaryPad: 16,
    boundaryBottom: 16,
    boundaryHead: 20,
    /** The gap between two plates on one page. */
    plateGap: 40,
  }),
  color: Object.freeze({
    paper: "#FBFBF8",
    ink: "#141B26",
    muted: "#536074",
    faint: "#9AA3AF",
    line: "#4A5567",
    card: "#FFFFFF",
    cardStroke: "#D5DAE2",
    external: "#EEF0F4",
    externalStroke: "#C4CBD6",
    bandA: "#F1F2EE",
    bandB: "#FBFBF8",
    boundary: "#7B8698",
    rule: "#DADBD3",
    accent: "#2357C4",
    shadow: "#0F1B2D",
  }),
  hue: Object.freeze({
    person: "#68758A",
    external: "#68758A",
    frontend: "#2E6BD9",
    backend: "#4A55C8",
    database: "#0D8579",
    cloud: "#1C82C2",
    messagebus: "#8650CC",
    security: "#B86A1C",
  }),
  wire: Object.freeze({
    arrow: 9,
    radius: 7,
    stroke: 1.6,
    labelPadX: 9,
    labelPadY: 4,
    maximumLabel: 250,
  }),
});

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
    edge: style(step.edge, { weight: 700 }),
    edgeDetail: style(step.detail),
    tier: style(step.detail, { weight: 700 }),
    note: style(POSTER.floor, { weight: 700 }),
    boundary: style(Math.min(24, Math.max(step.name, 20)), { weight: 700 }),
  });
}

/** A figure's card and wire metrics at one type step, rounded to 8 px. */
export function figureMetrics(styles) {
  const unit = styles.name.size / 24;
  const round = (value) => Math.max(8, Math.round(value / 8) * 8);
  return Object.freeze({
    card: Object.freeze({
      pad: round(20 * unit),
      radius: round(10 * unit),
      icon: round(24 * unit),
      iconGap: round(10 * unit),
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
      separation: Math.max(POSTER.spacing.separation, round(2 * POSTER.wire.arrow * unit)),
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

/** The page's fixed text styles: the header, the plates, the notes and the legend. */
export const PAGE = Object.freeze({
  kicker: style(14, { weight: 400 }),
  /** The model's title above a later page's own title: the edition's running head. */
  running: style(20, { weight: 700 }),
  title: style(48, { weight: 700 }),
  question: style(24, { weight: 400 }),
  summary: style(16, { weight: 400 }),
  legend: style(16, { weight: 400 }),
  /**
   * A view's own heading, above its plate or under the page's head: one step
   * above the largest card label, so a sparse figure set large never outranks
   * the heading that names it.
   */
  plate: style(36, { weight: 700 }),
  plateQuestion: style(20, { weight: 400 }),
  notes: style(14, { weight: 400 }),
});
