import { presentation } from "../../kinds.mjs";
import { compareRanks, drawnRelations, tiesOf } from "./free.mjs";

/**
 * A view's main path, the line a spine (`spine.mjs`) is drawn along, and the spine's rule, which reads the path from
 * the view's parts and relations and its model's kinds alone, so that the choice is the view's and the same in every
 * language.
 */

/**
 * The spine's rule: a view is a sequence, and drawn as a spine where its author names no composition and declares no
 * tiers, when a directed path through its relations has at least `stations` stations; its stations alone are at least
 * `coverage` of the view's parts; at least `neighbours` of the view's relations join two stations that are neighbours
 * on it; no station sends relations to more than `sends` parts; and every part off the path relates to a station, so
 * that each stands beside one as a branch. The owner's delegate set the numbers on 2026-11-28
 * (docs/research/spine.md), after five rounds of a prototype and three committees of three seats, agents and not
 * people, read the views in tiers of six works. Five stations are the second committee's, all three seats agreeing;
 * 60% of the parts is the second decision's, from the seats' 60% and 70%. Half of the relations: that decision asked
 * for 60%, which the third round measured to admit no view of the census, the highest share being 6 of 11; at half the
 * rule admits the views the seats read as sequences and refuses those they rejected. Three parts sent to: a station
 * that drives four parts or more is a fan, the reading the seats gave the relay of a request path; counted by the
 * relations a station sends, three keeps the view the third committee chose as a spine and refuses that relay, which
 * no bound on the parts a station relates to either way does, and a seat had proposed the same bound before it was
 * measured. A branch for every part off the path is the first committee's ask, branches one level deep, which the
 * second round's prototype read so; the Change's holder restored it at review, so that a view whose spine would have
 * no place for a part is refused by the rule, from its model, and not by its plate.
 */
const SPINE_RULE = Object.freeze({ stations: 5, coverage: 0.6, neighbours: 0.5, sends: 3 });

/** The clauses of the spine's rule, in the order a refusal names the first a view's path misses. */
const CLAUSES = Object.freeze(
  /** @type {const} */ (["stations", "coverage", "neighbours", "sends", "attached"]),
);

/**
 * The most partial paths the walk for the main path reads, so that a dense view is read in bounded time. On the six
 * works and the tests' fixture models no view needs more than 89. A view with more, which only a dense graph has (nine
 * parts each sending to all the others have about a million), is read only so far, in the order of its parts' ids: it
 * may then be refused, or given a shorter path, where a path left unread would be taken.
 */
const VISITS = 200_000;

/**
 * The branches of a path: each part off it that relates to a station, anchored at the station it relates to most, the
 * first on the path of two alike, with the stations it relates to in the path's order; and the parts off it that
 * relate to no station.
 * @param {string[]} path
 * @param {string[]} ids
 * @param {Map<string, Map<string, number>>} ties `tiesOf` the view
 */
export function branchesOn(path, ids, ties) {
  const at = new Map(path.map((id, index) => [id, index]));
  const place = (/** @type {string} */ id) => /** @type {number} */ (at.get(id));
  /** @type {Map<string, { anchor: string, stations: string[] }>} */
  const branches = new Map();
  /** @type {string[]} */
  const orphans = [];
  for (const id of ids) {
    if (at.has(id)) continue;
    const near = /** @type {Map<string, number>} */ (ties.get(id));
    const count = (/** @type {string} */ station) => near.get(station) ?? 0;
    const stations = [...near.keys()]
      .filter((other) => at.has(other))
      .sort((a, b) => place(a) - place(b));
    if (!stations.length) {
      orphans.push(id);
      continue;
    }
    const anchor = stations.reduce((best, station) =>
      count(station) > count(best) ? station : best,
    );
    branches.set(id, { anchor, stations });
  }
  return { branches, orphans };
}

/**
 * A view's main path and what the spine's rule reads of it: of the directed paths through the view's relations whose
 * inner stations lie inside the repository (a part outside may start or end it), the one that leaves no part related
 * to no station, which a spine has a place for only in a row of its own, then meets the most of the rule's clauses,
 * then has the most stations, the most relations joining neighbouring stations, the fewest parts that relate to no
 * station, and its parts' ids in order. The walk takes its starts and each station's next in the order of their ids,
 * so that a work's languages, which share ids but not always the order of their parts, read one path. The view is
 * admitted when that path meets every clause, which it does where any path the walk reads (`VISITS`) does; else `why`
 * names the first clause it misses. Each other part related to a station is a branch (`branchesOn`). Null for a view
 * whose relations make no path of two parts.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 */
export function pathOf(model, view) {
  const ids = view.components.map(({ id }) => id);
  const relations = drawnRelations(view);
  const order = new Map([...ids].sort().map((id, index) => [id, index]));
  const component = new Map(view.components.map((one) => [one.id, one]));
  const outside = (/** @type {string} */ id) =>
    presentation(model, /** @type {any} */ (component.get(id))).outside;
  /** The parts each part sends relations to, each once. */
  const sent = new Map(ids.map((id) => [id, /** @type {string[]} */ ([])]));
  for (const { from, to } of relations) {
    const targets = /** @type {string[]} */ (sent.get(from));
    if (!targets.includes(to)) targets.push(to);
  }
  for (const targets of sent.values()) targets.sort();
  const ties = tiesOf(ids, relations);
  const read = (/** @type {string[]} */ path) => {
    const at = new Map(path.map((id, index) => [id, index]));
    const { branches, orphans } = branchesOn(path, ids, ties);
    const joined = relations.filter(
      ({ from, to }) =>
        at.has(from) && at.has(to) && Math.abs(Number(at.get(to)) - Number(at.get(from))) === 1,
    ).length;
    const meets = {
      stations: path.length >= SPINE_RULE.stations,
      coverage: path.length / ids.length >= SPINE_RULE.coverage - 1e-9,
      neighbours: joined / Math.max(1, relations.length) >= SPINE_RULE.neighbours - 1e-9,
      sends: path.every((id) => /** @type {string[]} */ (sent.get(id)).length <= SPINE_RULE.sends),
      attached: !orphans.length,
    };
    const passed = CLAUSES.filter((clause) => meets[clause]).length;
    const rank = [
      orphans.length ? 1 : 0,
      -passed,
      -path.length,
      -joined,
      orphans.length,
      ...path.map((id) => Number(order.get(id))),
    ];
    return { stations: path, branches, orphans, meets, rank };
  };
  /** The best path read so far, held where the walk's calls reach it. */
  /** @type {{ path: ReturnType<typeof read> | null }} */
  const best = { path: null };
  let visits = 0;
  const walk = (/** @type {string[]} */ path, /** @type {Set<string>} */ seen) => {
    visits += 1;
    if (visits > VISITS) return;
    if (path.length >= 2) {
      const found = read(path.slice());
      if (!best.path || compareRanks(found.rank, best.path.rank) < 0) best.path = found;
    }
    const last = path[path.length - 1];
    if (path.length > 1 && outside(last)) return;
    for (const to of /** @type {string[]} */ (sent.get(last)))
      if (!seen.has(to)) {
        seen.add(to);
        path.push(to);
        walk(path, seen);
        path.pop();
        seen.delete(to);
      }
  };
  for (const id of [...ids].sort()) walk([id], new Set([id]));
  if (!best.path) return null;
  const { stations, branches, orphans, meets } = best.path;
  const why = CLAUSES.find((clause) => !meets[clause]) ?? null;
  return { stations, branches, orphans, admitted: !why, why };
}
