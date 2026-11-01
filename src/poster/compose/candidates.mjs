import { presentation } from "../../kinds.mjs";
import { ROW_LIMIT, viewRows } from "../../layout/rows.mjs";
import { leadOf } from "../blocks.mjs";
import { settleFloating } from "../corners.mjs";
import { gutterFor, planSheet, refuseUnsetText } from "../page.mjs";
import { extentOf, naturalOf, platesOf } from "../plate.mjs";
import { POSTER } from "../tokens.mjs";
import { gateFailures, measure } from "./gates.mjs";
import { best, compareRanks, faultsOf, nearest } from "./ranking.mjs";

/**
 * The pages one grouping of views may take: each skeleton and centring rule a
 * page may follow, planned on its plates, drawn and measured.
 */

/** Plates tried on one page, fewest first. */
export const PLATES = Object.freeze([1, 2, 3]);
/**
 * The ways a masthead page sets several plates other than one band each, by
 * plate count: all side by side, or two side by side above or below the third.
 */
const BANDS = Object.freeze({
  2: [[2]],
  3: [[3], [2, 1], [1, 2]],
});
/** A floating page sets its text around at most this many of its plate's compositions. */
const FLOATING_PLATES = 24;
/** Compositions each plate offers at one type step, by the number of plates on the page. */
const PAIRED = Object.freeze({ 1: 12, 2: 4, 3: 2 });

/**
 * Every page candidate of `views`, in the order the composer weighs them: none
 * when the grouping holds more plates than a page, or two of its views share a
 * component the page would then draw twice.
 */
export function* pageCandidates(model, views, first, typefaces, icons, boundaryName) {
  if (views.length > PLATES[PLATES.length - 1]) return;
  const drawn = views.flatMap((view) => view.components.map(({ id }) => id));
  if (new Set(drawn).size < drawn.length) return;
  const lead = leadOf(model, views, first);
  refuseUnsetText(typefaces, model, views, lead, first);
  /** @type {any[]} */
  const candidates = [];
  const input = { model, views, typefaces, lead, first, boundary: boundaryName };
  // The skeletons a page may take. A column page with a narrower rail gives the
  // figure fewer columns, so its rows wrap tighter and the figure grows taller —
  // the lever a view too shallow for a full-height band needs. Each skeleton is
  // tried with a row's centre taken over all its cards and over only those
  // inside the boundary: which one balances a figure depends on where its
  // outside cards sit, so the page measures both rather than guessing.
  // A page of one view may also float its head and legend into the corners its
  // figure leaves free; a page of several views keeps them in a masthead or
  // rail, and under the masthead may set its plates side by side in a band, or
  // two in one band and one in the other.
  /** @type {Array<{ archetype: "stack" | "column" | "corner", rail?: number, flank?: number, reserve?: boolean, notes?: boolean, bands?: number[] }>} */
  const skeletons = [
    { archetype: "stack" },
    ...(BANDS[views.length] ?? []).map((bands) => ({
      archetype: /** @type {const} */ ("stack"),
      bands,
    })),
    { archetype: "column", rail: 5 },
    { archetype: "column", rail: 4 },
    { archetype: "column", rail: 3 },
    { archetype: "column", rail: 3, flank: 3 },
    ...(views.length === 1
      ? [false, true].flatMap((notes) => [
          { archetype: /** @type {const} */ ("corner"), notes },
          { archetype: /** @type {const} */ ("corner"), reserve: true, notes },
        ])
      : []),
  ];
  // Centring over the inside cards differs only where a row holds outside ones.
  const outside = views.some((view) =>
    view.components.some((component) => presentation(model, component).outside),
  );
  /** @type {Array<"all" | "inside">} */
  const centrings = outside ? ["all", "inside"] : ["all"];
  const outcome = () => {
    const passed = candidates.filter(({ fails }) => fails.length === 0);
    return {
      chosen: passed.length ? best(passed) : null,
      closest: candidates.length ? nearest(candidates) : null,
    };
  };
  /** @type {Map<string, ReturnType<typeof import("../balance.mjs").balanceOf>>} */
  const measured = new Map();
  /** @param {"column" | "edges"} tierLabels */
  const compose = function* (tierLabels) {
    const context = { model, typefaces, icons, boundaryName, tierLabels, measured };
    /** @param {Array<"all" | "inside" | null>} rules */
    const tryAll = function* (rules) {
      for (const skeleton of skeletons)
        for (const centring of rules) {
          const made = candidate(input, skeleton, centring, context);
          if (!made) continue;
          const one = { ...made, views };
          candidates.push(one);
          yield one;
        }
    };
    yield* tryAll(centrings);
    // Centring a row may move it rather than bend a wire, never rather than
    // cross one, and placement weighs it so. But placement sees only the wires
    // between neighbouring rows: a relation that skips rows turns in the last
    // channel it enters and can cross wires placement never weighed. When the
    // best page still crosses, or no page passes, its plates are laid out
    // uncentred as well, and the page is chosen again from what both measure.
    const { chosen: leading, closest } = outcome();
    if (closest && (!leading || faultsOf(leading).some(Boolean))) yield* tryAll([null]);
  };
  // Tier labels stand in one column, so their numbers read down one line. A
  // figure whose tiers start at different edges can leave paper blank between
  // that column and the tiers that start further in; when no page with one
  // column balances, each label stands before the edge its tier starts at.
  yield* compose("column");
  const tiered = views.some((view) =>
    viewRows(view, ROW_LIMIT, () => false).some(({ label }) => label),
  );
  if (tiered && !outcome().chosen) yield* compose("edges");
}

/**
 * One page candidate: a skeleton and a centring rule, planned on the plates'
 * natural heights, drawn and measured. Null when the grouping does not fit.
 * @param {any} input
 * @param {{ archetype: "stack" | "column" | "corner", rail?: number, flank?: number, reserve?: boolean,
 *   notes?: boolean, bands?: number[] }} skeleton
 * @param {"all" | "inside" | null} centring null lays the rows out uncentred
 * @param {any} context
 */
function candidate(input, skeleton, centring, context) {
  const { model, typefaces, icons, boundaryName, tierLabels, measured } = context;
  const gutters = input.views.map((view) =>
    gutterFor(
      typefaces,
      viewRows(view, ROW_LIMIT, () => false).flatMap(({ label }) => (label ? [label] : [])),
    ),
  );
  // Plates that share a band divide it by the width their figures need. A
  // probe plan measures how tall each figure wants to be at its width; the real
  // plan gives every plate that height and shares only the surplus. A plan that
  // cannot set its text or fit its plates is one skeleton that does not suit
  // this grouping.
  const widths = input.views.map(
    (view, index) => extentOf({ model, typefaces, boundaryName }, view) + gutters[index],
  );
  const probe = planSheet(input, { gutters, widths, ...skeleton });
  if (!probe) return null;
  const natural = probe.plates.map((plate) => naturalOf({ model, typefaces, boundaryName }, plate));
  // A plate no wrapping can draw at the densest step makes this grouping
  // impossible; the search tries a different grouping instead of shrinking the
  // figure below what its cards need.
  if (natural.some((height) => height === null)) return null;
  let page = planSheet(input, {
    gutters,
    widths,
    ...skeleton,
    weights: /** @type {number[]} */ (natural),
  });
  if (!page) return null;
  const options = page.plates.map((plate) =>
    platesOf({ model, typefaces, icons, boundaryName, centring, tierLabels }, plate),
  );
  if (options.some((list) => !list.length)) return null;
  const pairs = pairings(options);
  if (!pairs.length) return null;
  let made = pairs[0];
  if (!page.floating) {
    // A page whose text is already set measures its plates' compositions in
    // figure order and takes the first that passes every gate, or else the one
    // closest to passing: a row is split, or the type set smaller, only when
    // the figure the page prefers leaves it unbalanced.
    /** @type {{ rank: number[], picks: any[] } | null} */
    let chosen = null;
    for (const picks of pairs) {
      const balance = measure(page, picks, typefaces, measured);
      const rank = [
        gateFailures(balance).length,
        ...faultsOf({ made: picks }),
        balance.holes + balance.emptyShare,
        balance.band.height,
        Math.hypot(...balance.centroid),
      ];
      if (!chosen || compareRanks(rank, chosen.rank) < 0) chosen = { rank, picks };
      if (rank[0] === 0) break;
    }
    made = /** @type {{ picks: any[] }} */ (chosen).picks;
  } else {
    // A floating page sets its text around each of its plate's compositions,
    // best first: the best figure may leave no corner for the head. A page that
    // passes comes first, then one whose wires do not cross, then the better
    // figure, and only then the fuller page.
    const planned = page;
    /** @type {{ rank: number[], page: any, one: any } | null} */
    let chosen = null;
    for (const [order, [one]] of pairs.slice(0, FLOATING_PLATES).entries()) {
      const rankOf = (set) => {
        const balance = measure(set, [one], typefaces, measured);
        return [
          gateFailures(balance).length,
          one.layout.measures.crossings,
          one.layout.measures.routes,
          order,
          balance.holes + balance.emptyShare,
          balance.band.height,
          Math.hypot(...balance.centroid),
        ];
      };
      const extra = settleFloating(input, planned, [one], (more) => ({
        rank: rankOf(withText(planned, more)),
      }));
      if (!extra) continue;
      const set = withText(planned, extra);
      const rank = rankOf(set);
      if (!chosen || compareRanks(rank, chosen.rank) < 0) chosen = { rank, page: set, one };
      // Compositions come best first, with no fewer crossings than this one,
      // so none after a passing page can rank above it.
      if (rank[0] === 0) break;
    }
    if (!chosen) return null;
    page = chosen.page;
    made = [chosen.one];
  }
  const drawn = /** @type {any} */ (page);
  const balance = measure(drawn, made, typefaces, measured);
  const fails = gateFailures(balance);
  return {
    page: drawn,
    made,
    balance,
    fails,
    composition: {
      archetype: drawn.archetype,
      rail: skeleton.rail ?? null,
      flank: skeleton.flank ?? 0,
      reserve: skeleton.reserve ?? false,
      notes: skeleton.notes ? "floating" : drawn.archetype === "column" ? "rail" : "footer",
      bands: skeleton.bands ?? drawn.plates.map(() => 1),
      centring,
      tierLabels,
      plates: drawn.plates.map((plate, order) => ({
        view: plate.view.id,
        step: made[order].step,
        wrap: made[order].limit,
        flat: made[order].flat,
      })),
    },
  };
}

/**
 * The ways to compose a page's plates, in figure order. The plates of one page
 * set their cards in one size, so a page never pairs a large figure with a
 * small one: each way takes one composition per plate, all at one type step,
 * from the best few each plate offers at that step. Ways with fewer wiring
 * faults come first, then larger steps, then each plate's better compositions.
 * Empty when no step suits every plate.
 * @param {any[][]} options each plate's compositions, best first
 * @returns {any[][]}
 */
function pairings(options) {
  const limit = PAIRED[options.length] ?? 1;
  const ranked = options.map((list) => list.map((one, order) => ({ one, order })));
  const steps = new Set(options.flat().map((one) => one.step));
  /** @type {Array<{ picks: any[], key: number[] }>} */
  const out = [];
  for (const step of steps) {
    const lists = ranked.map((list) => list.filter(({ one }) => one.step === step).slice(0, limit));
    if (lists.some((list) => !list.length)) continue;
    /** @type {Array<Array<{ one: any, order: number }>>} */
    let ways = [[]];
    for (const list of lists) ways = ways.flatMap((picks) => list.map((pick) => [...picks, pick]));
    for (const picks of ways)
      out.push({
        picks: picks.map(({ one }) => one),
        key: [
          ...faultsOf({ made: picks.map(({ one }) => one) }),
          -step,
          picks.reduce((sum, { order }) => sum + order, 0),
        ],
      });
  }
  return out.sort((a, b) => compareRanks(a.key, b.key)).map(({ picks }) => picks);
}

/** A page with more text set on it. */
function withText(page, extra) {
  return {
    ...page,
    runs: [...page.runs, ...extra.runs],
    glyphs: [...page.glyphs, ...extra.glyphs],
  };
}

/**
 * Admit one view for the reading plan: the view is admitted when a page can lay
 * it out at all. Whether its page is balanced is decided for the edition, where
 * a sparse view may share a page with the next one, so a view that cannot fill
 * a page alone is still a view the plan may keep.
 * @returns {{ fits: boolean, width: number, height: number }}
 */
export function admitsView(model, view, typefaces, icons) {
  const boundaryName = model.repository?.name ?? model.title;
  const pages = pageCandidates(model, [view], true, typefaces, icons, boundaryName);
  return { fits: !pages.next().done, width: POSTER.width, height: POSTER.height };
}
