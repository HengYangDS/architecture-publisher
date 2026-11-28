import { wiresNoMore } from "../../layout/fill.mjs";
import { DARKNESS, balanceOf, darkness } from "../balance.mjs";
import { setWidth } from "../spread.mjs";

/**
 * The balance gates a plate is measured against; the gates it misses are
 * recorded, not refused. They were calibrated on pages a reader judged: the
 * posters rejected for blank bands and empty corners fail them and the pages
 * judged balanced pass.
 */
export const GATES = Object.freeze({
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
 * How a plate's ink stands over the body: its figure's rectangles and its text,
 * each line box weighted by how dark it prints on the style's paper.
 * @param {{ figure: { rects: any[], runs: any[] } }} one a composition of the plate
 * @param {any} typefaces
 * @param {number} width
 * @param {number} height
 * @param {string} paper
 */
export function balanceOfPlate(one, typefaces, width, height, paper) {
  const text = (run) => ({
    x: run.x,
    y: run.top,
    width: Math.min(setWidth(run, typefaces), width - run.x),
    height: run.style.line,
    kind: /** @type {const} */ ("mass"),
    weight: DARKNESS.text * darkness(run.color, paper),
  });
  const body = { x: 0, y: 0, width, height };
  return balanceOf([...one.figure.rects, ...one.figure.runs.map(text)], body, body);
}

/**
 * Which gates a measured page fails, each with its measured value and limit.
 * @param {ReturnType<typeof import("../balance.mjs").balanceOf>} balance
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

/**
 * Whether a plate takes a figure drawn beside its chosen one, as the tiers figure's justified rows are
 * (docs/research/tiers-fill.md): the other figure passes a gate the chosen figure misses, misses no gate the chosen
 * figure passes, and has no more crossings and no more route defects.
 * @param {{ misses: readonly string[], crossings: number, routes: number }} chosen the gates the chosen figure
 *   misses, by measure, and its wiring
 * @param {{ misses: readonly string[], crossings: number, routes: number }} other
 */
export function takesJustified(chosen, other) {
  return (
    wiresNoMore(other, chosen) &&
    other.misses.every((measure) => chosen.misses.includes(measure)) &&
    other.misses.length < chosen.misses.length
  );
}
