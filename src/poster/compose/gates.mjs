import { createHash } from "node:crypto";
import { DARKNESS, balanceOf, darkness } from "../balance.mjs";
import { LIVE } from "../page.mjs";
import { POSTER } from "../tokens.mjs";

/** The gates a drawn page passes, and the ink of the page they are measured on. */

const C = POSTER.color;

/**
 * The gates every drawn page passes, each measured from the page itself. They
 * were calibrated on pages a reader judged: the posters rejected for blank bands
 * and empty corners fail them and the pages judged balanced pass.
 */
const GATES = Object.freeze({
  /** The largest blank rectangle covers at most this share of the live area. */
  emptyShare: 0.12,
  /** No band this tall or taller runs blank across the whole live area. */
  band: 96,
  /**
   * At most this share of the live area lies in holes: midway between the most
   * on a page judged balanced and the fewest on a page rejected for its holes.
   */
  holes: 0.4,
  /**
   * The page's centre of gravity sits at most this far off centre, across and
   * down. A page led by its text at the top left, as every page judged
   * balanced is, sits a little left of centre; a page whose ink lies mostly on
   * one side does not pass.
   */
  centroid: Object.freeze([0.12, 0.12]),
});

/**
 * The ink of one page, measured from its drawn rectangles before it is
 * rendered. A grouping measures many pages, and different skeletons can draw the
 * same one, so each measure is kept by the exact ink it measured.
 * @param {Map<string, ReturnType<typeof balanceOf>>} measured
 */
export function measure(page, made, typefaces, measured) {
  const text = (run) => ({
    x: run.x,
    y: run.top,
    width: Math.min(typefaces.measure(run.value, run.style), POSTER.width - run.x),
    height: run.style.line,
    kind: /** @type {const} */ ("mass"),
    weight: DARKNESS.text * darkness(run.color),
  });
  const rects = [
    ...made.flatMap((one) => [...one.figure.rects, ...one.figure.runs.map(text)]),
    ...page.runs.map(text),
    ...page.glyphs.map((glyph) => ({
      x: glyph.x,
      y: glyph.top,
      width: glyph.size,
      height: glyph.size,
      kind: /** @type {const} */ ("mass"),
      weight: DARKNESS.glyph,
    })),
    ...page.rules.map((rule) => ({
      x: Math.min(rule.x1, rule.x2),
      y: rule.y1 - 1,
      width: Math.abs(rule.x2 - rule.x1),
      height: 2,
      kind: /** @type {const} */ ("stroke"),
      weight: DARKNESS.stroke * darkness(C.rule),
    })),
  ];
  const key = createHash("sha256").update(JSON.stringify(rects)).digest("hex");
  let balance = measured.get(key);
  if (!balance) {
    balance = balanceOf(rects, LIVE);
    measured.set(key, balance);
  }
  return balance;
}

/**
 * Which gates a measured page fails, each with its measured value and limit.
 * @param {ReturnType<typeof balanceOf>} balance
 */
export function gateFailures(balance) {
  /** @type {Array<{ measure: string, value: number, limit: number }>} */
  const fails = [];
  if (balance.emptyShare > GATES.emptyShare)
    fails.push({ measure: "emptyShare", value: balance.emptyShare, limit: GATES.emptyShare });
  if (balance.band.height >= GATES.band)
    fails.push({ measure: "blankBand", value: balance.band.height, limit: GATES.band });
  if (balance.holes > GATES.holes)
    fails.push({ measure: "holes", value: balance.holes, limit: GATES.holes });
  if (Math.abs(balance.centroid[0]) > GATES.centroid[0])
    fails.push({ measure: "centroidX", value: balance.centroid[0], limit: GATES.centroid[0] });
  if (Math.abs(balance.centroid[1]) > GATES.centroid[1])
    fails.push({ measure: "centroidY", value: balance.centroid[1], limit: GATES.centroid[1] });
  return fails;
}
