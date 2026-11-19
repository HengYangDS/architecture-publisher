import { channelGeometry } from "../channels.mjs";
import { measureRoutes } from "../measure.mjs";
import { compatible, crossesBand, rowCrossings } from "./conflicts.mjs";
import { options } from "./options.mjs";
import { remembered } from "./remember.mjs";
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
 * Search one channel exactly within a budget: the clean assignment with
 * the fewest label rows from `minimumRows`, then the fewest tracks and
 * crossings. Where the medium draws the channel's wires, `measured`, the
 * assignment also makes the fewest route defects. Returns null when none
 * exists. Reads nothing but its arguments.
 */
function search(
  channel,
  spacing,
  maximumRows = MAXIMUM_LABEL_ROWS,
  minimumRows = 1,
  measured = false,
) {
  const wires = channel.wires;
  const choices = wires.map((made) => options(channel, made, spacing));
  // What an option puts into a band is its spans there and the x of each of its verticals that crosses the band,
  // whichever label row the option takes. Each such content is named by a number once, before the search, so that
  // an assignment names a band's content by its wires' numbers and makes neither a list nor a key of the spans.
  const names = new Map();
  const nameOf = (option, band) => {
    const content = JSON.stringify([
      option[band],
      option.verticals.filter((vertical) => crossesBand(vertical, band)).map(({ x }) => x),
    ]);
    if (!names.has(content)) names.set(content, names.size);
    return names.get(content);
  };
  const named = choices.map((list) =>
    list.map((option) => ({ upper: nameOf(option, "upper"), lower: nameOf(option, "lower") })),
  );
  // Many assignments differ only in label positions, so band tracks are solved once per band content.
  const solved = new Map();
  for (let rows = minimumRows; rows <= maximumRows; rows += 1) {
    /** @type {any} */
    let best = null;
    let visited = 0;
    const chosen = [];
    /** The names of what each chosen option puts into the bands, beside `chosen`. */
    const contents = [];
    const spansOf = (band) =>
      chosen.flatMap(([i, option]) => option[band].map((span) => ({ ...span, wire: i })));
    const crossers = (band) =>
      chosen.flatMap(([i, option]) =>
        option.verticals
          .filter((vertical) => crossesBand(vertical, band))
          .map((vertical) => ({ x: vertical.x, wire: i })),
      );
    const tracksFor = (band) => {
      let key = "";
      for (const content of contents) key += `${content[band]} `;
      if (!solved.has(key))
        solved.set(
          key,
          assignTracks(spansOf(band), crossers(band), spacing.join ?? spacing.separation),
        );
      return solved.get(key);
    };
    const walk = (index, preference) => {
      if (visited++ > SEARCH_BUDGET) return;
      if (best && preference >= best.score) return;
      if (index === wires.length) {
        const up = tracksFor("upper");
        const low = tracksFor("lower");
        if (!up || !low) return;
        const crossings = up.crossings + low.crossings + rowCrossings(chosen, rows);
        const unmeasured = preference + (up.tracks + low.tracks) * 3 + crossings * 10;
        if (best && unmeasured >= best.score) return;
        const assignment = {
          crossings,
          borrowed: chosen.reduce((sum, [, option]) => sum + option.borrowed, 0),
          chosen: chosen.map(([i, option]) => [i, option]),
          upper: spansOf("upper"),
          lower: spansOf("lower"),
          up,
          low,
        };
        const routes = measured ? routesOf(channel, assignment, rows, spacing) : 0;
        const score = unmeasured + routes * ROUTE_DEFECT;
        if (!best || score < best.score) best = { ...assignment, score, routes };
        return;
      }
      for (const [position, option] of choices[index].entries()) {
        const variants = option.label === undefined && !option.jog ? 1 : rows;
        for (let row = 0; row < variants; row += 1) {
          const choice = { ...option, row };
          if (!compatible(channel, chosen, index, choice, rows, spacing)) continue;
          chosen.push([index, choice]);
          contents.push(named[index][position]);
          walk(index + 1, preference + choice.preference);
          chosen.pop();
          contents.pop();
        }
      }
    };
    walk(0, 0);
    if (best) return finish(channel, best, rows, spacing);
  }
  return null;
}

/**
 * Solve one channel: the search's answer, remembered for an input equal in
 * everything the search is given. A plate's candidates differ in what stands
 * inside the cards, which the search does not read, so most of what it is
 * asked it has answered before. The answer is frozen.
 */
export const solveChannel = remembered(search);
