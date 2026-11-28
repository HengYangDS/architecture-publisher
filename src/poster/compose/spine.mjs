import { presentation } from "../../kinds.mjs";
import { DARKNESS, balanceOf } from "../balance.mjs";
import { POSTER } from "../tokens.mjs";
import { gateFailures } from "./gates.mjs";
import {
  FAULTS,
  cardsAt,
  compareRanks,
  drawFree,
  drawnRelations,
  measureFree,
  tiesOf,
} from "./free.mjs";
import { foldSpine } from "./spine-fold.mjs";
import { branchesOn } from "./spine-path.mjs";
import { wireSpine } from "./spine-wires.mjs";

/**
 * The spine: a view whose relations run along one main path (`pathOf`), where the spine's rule (`plates.mjs`) takes the
 * view or its author names the composition, drawn as that path folded into two or three rows so that the figure fills
 * its frame. The path's parts are stations, each row read left to right and back (the serpentine), the line turning at
 * the frame's side with an arrowhead under the turn; each relation from a station to the next is drawn as the view's
 * heavy line. Every other part is a branch beside its station, and a part an author's spine leaves related to no
 * station stands in a row of its own (`spine-fold.mjs`); every wire runs upright and across (`spine-wires.mjs`). Its
 * cards, labels and lines are sized, measured and drawn as `free.mjs` does for any figure off the grid. Of the ways a
 * view's spine can be set, the plate draws the one that wires and fills its frame best (`rankSpine`).
 */

const SPINE = Object.freeze({
  /** At most this many ways of setting the branches above and below are tried, spread over all the ways there are. */
  sides: 256,
  /** How many layouts of a step with the fewest crossings, route defects and gates missed are drawn and weighed. */
  drawn: 12,
  /** The rows a spine folds into. */
  rows: Object.freeze([2, 3]),
});

/**
 * The ways each fold of a spine is set beside its rows and branches: each band's cards near their stations or spread
 * across it; the room left over shared evenly or first by the gaps that hold a label; and an arch over or under its
 * row.
 */
const VARIANTS = Object.freeze(
  [false, true].flatMap((spread) =>
    ["even", "labelled"].flatMap((fill) => ["up", "down"].map((arch) => ({ spread, fill, arch }))),
  ),
);

/**
 * The ways a path of `count` stations folds into rows: two rows, and three where each holds two at least, the rows'
 * lengths differing by one at most and the longer rows first.
 * @param {number} count
 */
function splitsOf(count) {
  const found = [];
  for (const rows of SPINE.rows) {
    if (count < 2 * rows) continue;
    const base = Math.floor(count / rows);
    const extra = count - base * rows;
    found.push(Array.from({ length: rows }, (_, index) => base + (index < extra ? 1 : 0)));
  }
  return found;
}

/**
 * Up to `SPINE.sides` ways of choosing one of its options for each part: every way where there are no more, else ways
 * spread over all of them, read as numbers whose digits are the parts' choices and stepped by a stride that no count of
 * options divides, so that each part, the first as much as the last, is tried each way.
 * @param {string[]} parts
 * @param {string[][]} options
 */
function sidingsOf(parts, options) {
  const radices = options.map((one) => BigInt(one.length));
  const total = radices.reduce((product, radix) => product * radix, 1n);
  const count = total < BigInt(SPINE.sides) ? total : BigInt(SPINE.sides);
  let stride = total / count;
  while (radices.some((radix) => radix > 1n && stride % radix === 0n)) stride -= 1n;
  return Array.from({ length: Number(count) }, (_, k) => {
    let rest = BigInt(k) * stride;
    /** @type {string[]} */
    const chosen = [];
    for (let index = parts.length - 1; index >= 0; index -= 1) {
      chosen[index] = options[index][Number(rest % radices[index])];
      rest /= radices[index];
    }
    return new Map(parts.map((id, index) => [id, chosen[index]]));
  });
}

/**
 * The ways a spine may set its path: the path as it is; and, where an end of it lies outside the repository, that end
 * in a row of its own above the boundary (the start) or below it (the end), joined to its neighbour by the line's own
 * straight wire, so that no column beside the boundary is kept for it. That second setting needs the stations inside
 * to fold (`splitsOf`) and every other part related to one of them.
 * @param {NonNullable<ReturnType<typeof import("./spine-path.mjs").pathOf>>} plan
 * @param {string[]} ids
 * @param {any[]} relations
 * @param {(id: string) => boolean} outside
 */
function settingsOf(plan, ids, relations, outside) {
  const settings = [{ plan, fixed: new Map(), line: new Set() }];
  const { stations } = plan;
  const [first, last] = [stations[0], stations[stations.length - 1]];
  const ends = [first, last].filter((id, k) => outside(id) && (k === 0 || id !== first));
  if (!ends.length || !ids.some((id) => !outside(id))) return settings;
  const kept = stations.filter((id) => !ends.includes(id));
  if (!splitsOf(kept.length).length) return settings;
  const { branches, orphans } = branchesOn(kept, ids, tiesOf(ids, relations));
  if (orphans.length) return settings;
  const neighbour = (/** @type {string} */ id) =>
    id === first ? stations[1] : stations[stations.length - 2];
  // The line runs on from the start to its neighbour and from the end's neighbour to the end.
  const line = new Set(
    relations
      .filter(
        ({ from, to }) =>
          (from === first && to === stations[1] && ends.includes(first)) ||
          (to === last && from === neighbour(last) && ends.includes(last)),
      )
      .map(({ id }) => id),
  );
  for (const id of ends) {
    const entry = /** @type {{ anchor: string, stations: string[] }} */ (branches.get(id));
    branches.set(id, { ...entry, anchor: neighbour(id) });
  }
  const fixed = new Map(ends.map((id) => [id, id === first ? "up" : "down"]));
  settings.push({ plan: { ...plan, stations: kept, branches, orphans }, fixed, line });
  return settings;
}

/**
 * A layout's balance, read before it is drawn, from its cards, labels, lines and the boundary's name as the plate's
 * ink: enough to weigh which layouts of a step to draw; the plate's own measure (`drawFree`) decides.
 * @param {any} layout
 * @param {{ x: number, y: number, width: number, height: number } | null} tab the boundary's name, where it has one
 * @param {{ width: number, height: number }} field
 */
function balanceBefore(layout, tab, field) {
  /** @type {any[]} */
  const ink = [];
  const mass = DARKNESS.text / 2;
  for (const box of [...layout.cards.values(), ...layout.labels]) {
    const { x, y, width, height } = box;
    ink.push({ x, y, width, height, kind: "mass", weight: mass });
  }
  for (const { points } of layout.paths)
    for (let index = 1; index < points.length; index += 1) {
      const [[x0, y0], [x1, y1]] = [points[index - 1], points[index]];
      ink.push({
        x: Math.min(x0, x1) - 1,
        y: Math.min(y0, y1) - 1,
        width: Math.abs(x1 - x0) + 2,
        height: Math.abs(y1 - y0) + 2,
        kind: "stroke",
        weight: DARKNESS.stroke,
      });
    }
  if (tab) ink.push({ ...tab, kind: "mass", weight: 0 });
  const body = { x: 0, y: 0, width: field.width, height: field.height };
  const balance = balanceOf(ink, body, body);
  return { balance, misses: gateFailures(balance) };
}

/**
 * The order of a spine's candidates: the fewest crossings, then the fewest route defects, then the fewest gates
 * missed, then the largest type step, the least blank, and compact cards before detailed ones. The radial figure and
 * the grid weigh the type step before the gates (`rankFree`); a spine, folded to fill its frame, weighs the gates
 * first, among the steps `spines` weighs in full.
 */
const rankSpine = (candidate) => [
  candidate.measured.crossings,
  candidate.measured.routes,
  candidate.drawn.misses.length,
  -candidate.cards.index,
  candidate.drawn.balance.emptyShare + candidate.drawn.balance.holes,
  candidate.cards.details ? 1 : 0,
];

/**
 * The spine figures a plate may draw of a view in a field along its main path, best first by `rankSpine`, and, where
 * none is drawn, the furthest fault (`FAULTS`) any of its layouts came to. Every type step from the largest down to
 * `floor` is weighed, and below it only the first that draws one: for a spine a rule takes, the step of the view's
 * figure in tiers, so that a plate can say its spine would set smaller type; for one its author names, the smallest
 * step, so that every step the plate allows is weighed. At each step: every way of setting the path's ends
 * (`settingsOf`), of folding it into rows (`splitsOf`) and of setting its branches above or below (up to
 * `SPINE.sides`), each band's cards near their stations or spread across it, the room left over shared evenly or first
 * by the gaps that hold a label, and an arch over or under its row; of these, those with the fewest crossings, route
 * defects and gates missed before drawing are drawn and weighed, the best of the step then with its cards' details,
 * where they fit. A path too short to fold into two rows of two has no spine and is refused as `parts`; the rule
 * admits none, so only a spine its author names comes to it.
 * @param {{ model: any, typefaces: any, icons: any, style: any }} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {{ width: number, height: number }} field
 * @param {NonNullable<ReturnType<typeof import("./spine-path.mjs").pathOf>>} plan
 * @param {number} floor the smallest type step weighed in full
 */
export function spines(scene, view, field, plan, floor) {
  if (!splitsOf(plan.stations.length).length) return { figures: [], fault: "parts" };
  const relations = drawnRelations(view);
  const ids = view.components.map(({ id }) => id);
  const name = scene.model.repository?.name ?? scene.model.title;
  const component = new Map(view.components.map((one) => [one.id, one]));
  const outside = (/** @type {string} */ id) =>
    presentation(scene.model, /** @type {any} */ (component.get(id))).outside;
  const bounded = ids.some(outside) && ids.some((id) => !outside(id));
  const figure = { relations, ids, field, name, typefaces: scene.typefaces };
  /** @type {any[]} */
  const arrangements = [];
  for (const setting of settingsOf(plan, ids, relations, outside)) {
    const branches = [...setting.plan.branches.keys()];
    // Each branch above or below its station; a branch outside the repository also beside it, beyond the boundary;
    // an end of the path in a row of its own where the setting puts it; a part related to no station above or below.
    const options = [...branches, ...setting.plan.orphans].map((id) =>
      setting.fixed.has(id)
        ? [/** @type {string} */ (setting.fixed.get(id))]
        : bounded && outside(id) && branches.includes(id)
          ? ["up", "down", "beside"]
          : ["up", "down"],
    );
    const sidings = sidingsOf([...branches, ...setting.plan.orphans], options);
    for (const split of splitsOf(setting.plan.stations.length))
      for (const siding of sidings)
        for (const variant of VARIANTS)
          arrangements.push({ split, siding, ...variant, line: setting.line, plan: setting.plan });
  }
  let furthest = 0;
  const reached = (/** @type {string} */ fault) => {
    furthest = Math.max(furthest, FAULTS.indexOf(fault));
  };
  const atStep = (/** @type {number} */ index, /** @type {boolean} */ details, only = null) => {
    const cards = cardsAt(scene, view, index, details);
    if (!cards) {
      reached("cards");
      return [];
    }
    const found = [];
    for (const arrangement of only ? [only] : arrangements) {
      const fold = foldSpine(cards, arrangement, figure);
      if ("fault" in fold) {
        reached(fold.fault);
        continue;
      }
      // A fold with no arch draws alike over or under: one of the two is enough.
      if (!fold.lanes.length && arrangement.arch === "down") continue;
      const layout = wireSpine(cards, fold, field);
      if ("fault" in layout) {
        reached(layout.fault);
        continue;
      }
      const measured = measureFree(layout);
      if (measured.fault) reached(measured.fault);
      else
        found.push({
          cards,
          layout,
          measured,
          arrangement,
          before: balanceBefore(layout, fold.tab, field),
        });
    }
    const rank = ({ measured, before }) => [
      measured.crossings,
      measured.routes,
      before.misses.length,
      before.balance.emptyShare,
    ];
    found.sort((x, y) => compareRanks(rank(x), rank(y)));
    const drawn = [];
    for (const candidate of found.slice(0, SPINE.drawn)) {
      const made = drawFree(scene, view, candidate.cards, candidate.layout, field);
      if (made.fault) reached(made.fault);
      else drawn.push({ ...candidate, drawn: made });
    }
    return drawn;
  };
  /** @type {any[]} */
  const figures = [];
  for (let index = POSTER.steps.length - 1; index >= 0; index -= 1) {
    if (index < floor && figures.length) break;
    const compact = atStep(index, false).sort((x, y) => compareRanks(rankSpine(x), rankSpine(y)));
    if (!compact.length) continue;
    const detailed = view.components.some((component) => component.details.length)
      ? atStep(index, true, compact[0].arrangement)
      : [];
    figures.push(...compact, ...detailed);
    if (index < floor) break;
  }
  return figures.length
    ? { figures: figures.sort((x, y) => compareRanks(rankSpine(x), rankSpine(y))), fault: null }
    : { figures: [], fault: FAULTS[furthest] };
}
