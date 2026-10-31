import { channelGeometry } from "../channels.mjs";
import { measureRoutes } from "../measure.mjs";
import { compatible, crossesBand, rowCrossings } from "./conflicts.mjs";
import { options } from "./options.mjs";
import { finish } from "./solution.mjs";
import { assignTracks } from "./tracks.mjs";

/**
 * Exact routing of one channel: each wire's options name where its verticals
 * turn, and the search picks the clean assignment with the fewest label rows,
 * tracks and crossings.
 */

const SEARCH_BUDGET = 60_000;
export const MAXIMUM_LABEL_ROWS = 3;

/**
 * What an assignment costs for each route defect the channel's own wires make,
 * measured on the channel drawn: as much as a borrowed end, which predicts one.
 */
const ROUTE_DEFECT = 8;

/** Far enough above and below a channel to stand for the cards beside it. */
const FAR = 1e4;

/**
 * Route defects of one assignment, measured on the channel drawn between the
 * cards beside it.
 */
function routesOf(channel, assignment, rows, spacing) {
  const solution = finish(channel, assignment, rows, spacing);
  const { paths, labels } = channelGeometry(channel, solution, 0, solution.height, 0, spacing);
  /** @returns {Array<[string, any]>} */
  const beside = (cards = [], y) => cards.map((card) => [card.id, { ...card, y, height: FAR }]);
  const cards = new Map([
    ...beside(channel.beside?.upper, -FAR),
    ...beside(channel.beside?.lower, solution.height),
  ]);
  return measureRoutes({ cards, paths, labels }).length;
}

/**
 * Solve one channel exactly within a search budget: the clean assignment with
 * the fewest label rows from `minimumRows`, then the fewest tracks and
 * crossings. Where the medium draws the channel's wires, `measured`, the
 * assignment also makes the fewest route defects. Returns null when none
 * exists.
 */
export function solveChannel(
  channel,
  spacing,
  maximumRows = MAXIMUM_LABEL_ROWS,
  minimumRows = 1,
  measured = false,
) {
  const wires = channel.wires;
  const choices = wires.map((made) => options(channel, made, spacing));
  // Many assignments differ only in label positions, so band tracks are solved once per band content.
  const solved = new Map();
  const tracksFor = (spans, crossers) => {
    const key = JSON.stringify([spans, crossers]);
    if (!solved.has(key))
      solved.set(key, assignTracks(spans, crossers, spacing.join ?? spacing.separation));
    return solved.get(key);
  };
  for (let rows = minimumRows; rows <= maximumRows; rows += 1) {
    /** @type {any} */
    let best = null;
    let visited = 0;
    const chosen = [];
    const walk = (index, preference) => {
      if (visited++ > SEARCH_BUDGET) return;
      if (best && preference >= best.score) return;
      if (index === wires.length) {
        const upper = [];
        const lower = [];
        for (const [i, option] of chosen) {
          option.upper.forEach((span) => upper.push({ ...span, wire: i }));
          option.lower.forEach((span) => lower.push({ ...span, wire: i }));
        }
        const crossers = (band) =>
          chosen.flatMap(([i, option]) =>
            option.verticals
              .filter((vertical) => crossesBand(vertical, band))
              .map((vertical) => ({ x: vertical.x, wire: i })),
          );
        const up = tracksFor(upper, crossers("upper"));
        const low = tracksFor(lower, crossers("lower"));
        if (!up || !low) return;
        const crossings = up.crossings + low.crossings + rowCrossings(chosen, rows);
        const unmeasured = preference + (up.tracks + low.tracks) * 3 + crossings * 10;
        if (best && unmeasured >= best.score) return;
        const assignment = {
          crossings,
          borrowed: chosen.reduce((sum, [, option]) => sum + option.borrowed, 0),
          chosen: chosen.map(([i, option]) => [i, option]),
          upper,
          lower,
          up,
          low,
        };
        const routes = measured ? routesOf(channel, assignment, rows, spacing) : 0;
        const score = unmeasured + routes * ROUTE_DEFECT;
        if (!best || score < best.score) best = { ...assignment, score, routes };
        return;
      }
      for (const option of choices[index]) {
        const variants = option.label === undefined && !option.jog ? 1 : rows;
        for (let row = 0; row < variants; row += 1) {
          const choice = { ...option, row };
          if (!compatible(channel, chosen, index, choice, rows, spacing)) continue;
          chosen.push([index, choice]);
          walk(index + 1, preference + choice.preference);
          chosen.pop();
        }
      }
    };
    walk(0, 0);
    if (best) return finish(channel, best, rows, spacing);
  }
  return null;
}
