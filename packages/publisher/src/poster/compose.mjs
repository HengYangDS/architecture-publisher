import { createHash } from "node:crypto";
import { presentation } from "../kinds.mjs";
import { ROW_LIMIT, viewRows } from "../layout/rows.mjs";
import { refuse } from "../refusal.mjs";
import { DARKNESS, balanceOf, darkness } from "./balance.mjs";
import { leadOf } from "./blocks.mjs";
import { settleFloating } from "./corners.mjs";
import { LIVE, gutterFor, planSheet, refuseUnsetText } from "./page.mjs";
import { extentOf, naturalOf, platesOf } from "./plate.mjs";
import { POSTER } from "./tokens.mjs";

/**
 * Compose views into 16:9 pages. A page is one, two or three plates; each plate
 * is one view's figure with its own heading, and each figure is laid out with
 * cards as large as their text, justified into its band, and drawn. A view with
 * few components fills a plate of its own badly — an architecture figure of
 * three cards is a band, not a page — so the composer packs views onto a page,
 * in bands of one or more plates, until the page itself is full. A page never
 * draws a component twice, so only views that share no component share a page.
 * Nothing is stretched to fill a frame: the page is filled by what it carries,
 * and a page that is not filled is not drawn.
 */

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

/** The largest figure type step: a figure set at it cannot grow any further. */
const LARGEST = POSTER.steps.length - 1;
/**
 * The gates of one blank area: the largest blank rectangle and a band blank
 * across the page, which a figure that cannot grow leaves beside it. Holes
 * between its ink are a fault of the composition, not of the figure's size.
 */
const BLANK = Object.freeze(["emptyShare", "blankBand"]);

/**
 * How a drawn page stands against the gates: it passes them all; it misses some
 * with every figure already at the largest type step, or misses only the gates
 * of one blank area with every figure at the largest step it fits the page at,
 * so the model has too little to fill and balance the page, which no
 * composition can change; or it is a standard-quality draft whose figures
 * could be set larger, or that holes or an off-centre figure unbalance, and
 * whose every composition misses a gate.
 * @typedef {"balanced" | "sparse" | "draft"} Admission
 */

/**
 * A grouping's pages, as `sheet` composes them.
 * @typedef {{ chosen: any, sparse: any, cleanest: any, closest: any }} Sheet
 */

/** Plates tried on one page, fewest first. */
const PLATES = Object.freeze([1, 2, 3]);
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
 * The ink of one page, measured from its drawn rectangles before it is
 * rendered. A grouping measures many pages, and different skeletons can draw the
 * same one, so each measure is kept by the exact ink it measured.
 * @param {Map<string, ReturnType<typeof balanceOf>>} measured
 */
function measure(page, made, typefaces, measured) {
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
 * Compose one page of `views`. Returns the best page that passes every gate, or
 * null; the closest sparse page, whose figures are all set at the largest step,
 * or at the largest step they fit the page at where it misses only the gates of
 * one blank area, and of the sparse pages the closest of those that wire the
 * fewest faults; and the closest page drawn at all, which names what a
 * grouping misses when none passes. All are null when the grouping cannot be
 * laid out, or when two of its views share a component the page would then
 * draw twice.
 */
function sheet(model, views, first, typefaces, icons, boundaryName) {
  const candidates = [...pageCandidates(model, views, first, typefaces, icons, boundaryName)];
  const passed = candidates.filter(({ fails }) => fails.length === 0);
  const stepOf = ({ composition }) => Math.min(...composition.plates.map(({ step }) => step));
  const fitted = Math.max(-1, ...candidates.map(stepOf));
  const sparse = candidates.filter(
    (candidate) =>
      candidate.composition.plates.every(({ step }) => step === LARGEST) ||
      (stepOf(candidate) === fitted &&
        candidate.fails.every(({ measure }) => BLANK.includes(measure))),
  );
  const fewest = sparse.length ? faultsOf(best(sparse)) : [];
  const cleanest = sparse.filter((page) => compareRanks(faultsOf(page), fewest) === 0);
  return {
    chosen: passed.length ? best(passed) : null,
    sparse: sparse.length ? nearest(sparse) : null,
    cleanest: cleanest.length ? nearest(cleanest) : null,
    closest: candidates.length ? nearest(candidates) : null,
  };
}

/**
 * Every page candidate of `views`, in the order the composer weighs them: none
 * when the grouping holds more plates than a page, or two of its views share a
 * component the page would then draw twice.
 */
function* pageCandidates(model, views, first, typefaces, icons, boundaryName) {
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
  /** @type {Map<string, ReturnType<typeof balanceOf>>} */
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

const compareRanks = (a, b) => {
  for (let index = 0; index < a.length; index += 1)
    if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
};

/** A page with more text set on it. */
function withText(page, extra) {
  return {
    ...page,
    runs: [...page.runs, ...extra.runs],
    glyphs: [...page.glyphs, ...extra.glyphs],
  };
}

/**
 * Compose every view of a model into pages. Pages carry one to three consecutive
 * views, and the grouping is chosen for the edition as a whole, not page by page:
 * a greedy packer that takes a passing page whenever it sees one strands the last
 * view alone, and a view of three components cannot fill a 16:9 page by itself.
 * The search takes the fewest wires that cross and then the fewest route
 * defects over all pages, which a page that squeezes two views into one draws
 * more of; then the fewest pages that do not pass every gate, then the fewest
 * pages, then the least of their area lying in holes. A page that does
 * not pass is admitted only as a sparse page, which a model too small to fill
 * it cannot avoid, or at standard quality as a draft that records what it
 * misses. An edition no grouping can print on admitted pages is refused, naming
 * the views no admitted page holds and what their closest pages miss.
 * @param {any} model
 * @param {import("../plan/views.mjs").View[]} views
 * @param {any} typefaces
 * @param {any} icons
 * @param {{ quality?: "showcase" | "standard" }} [options]
 */
export function composeEdition(model, views, typefaces, icons, options = {}) {
  const quality = options.quality ?? "showcase";
  const boundaryName = model.repository?.name ?? model.title;
  /** @type {Map<string, Sheet>} */
  const tried = new Map();
  const at = (index, count) => {
    const key = `${index}:${count}`;
    if (!tried.has(key))
      tried.set(
        key,
        sheet(
          model,
          views.slice(index, index + count),
          index === 0,
          typefaces,
          icons,
          boundaryName,
        ),
      );
    return /** @type {Sheet} */ (tried.get(key));
  };
  /**
   * The pages a grouping may be admitted on, and how: its best page that
   * passes every gate, and its sparse page where none passes or the sparse
   * page wires fewer faults, for the plan to weigh as it weighs groupings; at
   * standard quality its closest page as a draft where neither exists.
   */
  const admitted = (index, size) => {
    const { chosen, sparse, cleanest, closest } = at(index, size);
    /** @type {Array<{ made: any, admission: Admission }>} */
    const pages = [];
    if (chosen) pages.push({ made: chosen, admission: "balanced" });
    const spare = chosen ? cleanest : sparse;
    if (spare && (!chosen || compareRanks(faultsOf(spare), faultsOf(chosen)) < 0))
      pages.push({ made: spare, admission: "sparse" });
    if (!pages.length && quality === "standard" && closest)
      pages.push({ made: closest, admission: "draft" });
    return pages;
  };

  const count = views.length;
  /** @type {Array<any>} */
  const plan = new Array(count + 1).fill(null);
  plan[count] = {
    crossings: 0,
    routes: 0,
    unbalanced: 0,
    pages: 0,
    holes: 0,
    next: count,
    page: null,
  };
  for (let index = count - 1; index >= 0; index -= 1) {
    /** @type {any} */
    let chosen = null;
    for (const size of PLATES) {
      if (index + size > count) continue;
      const rest = plan[index + size];
      // A grouping no admitted page can hold is not a page.
      if (!rest) continue;
      for (const page of admitted(index, size)) {
        const [crossings, routes] = faultsOf(page.made);
        const total = {
          crossings: crossings + rest.crossings,
          routes: routes + rest.routes,
          unbalanced: (page.admission === "balanced" ? 0 : 1) + rest.unbalanced,
          pages: 1 + rest.pages,
          holes: page.made.balance.holes + rest.holes,
          next: index + size,
          page,
        };
        if (!chosen || betterPlan(total, chosen)) chosen = total;
      }
    }
    plan[index] = chosen;
  }
  if (!plan[0]) refuseEdition(views, at, admitted);

  const pages = [];
  for (let index = 0; index < count; index = plan[index].next) pages.push(plan[index].page);
  return pages.map(({ made, admission }, order) => ({
    ...made,
    admission,
    position: { index: order, count: pages.length },
  }));
}

/**
 * Refuse an edition no grouping prints on admitted pages. The views to name are
 * those no admitted page holds, alone or with a neighbour; each is reported with
 * the gates its own closest page misses, or as impossible to lay out at all.
 */
function refuseEdition(views, at, admitted) {
  const holds = (view) =>
    PLATES.some((size) =>
      Array.from({ length: size }, (_, offset) => view - offset).some(
        (index) => index >= 0 && index + size <= views.length && admitted(index, size).length,
      ),
    );
  const lost = views.flatMap((view, index) => (holds(index) ? [] : [{ view, index }]));
  const named = lost.length ? lost : views.map((view, index) => ({ view, index }));
  const problems = named.map(({ view, index }) => {
    const closest = at(index, 1).closest;
    return {
      code: closest ? "poster_unbalanced" : "poster_unfittable",
      path: `/views/${view.id}`,
      message: closest
        ? closest.fails
            .map(({ measure: name, value, limit }) => `${name} ${value} (limit ${limit})`)
            .join("; ")
        : "no type step or row wrapping lays the view out",
    };
  });
  const unfit = problems.every(({ code }) => code === "poster_unfittable");
  refuse(
    unfit ? "poster_unfittable" : "poster_unbalanced",
    unfit
      ? `View ${named.map(({ view }) => view.id).join(", ")} cannot be laid out on a ${POSTER.width} × ${POSTER.height} page ` +
          "at any type step or row wrapping. Split the view or shorten its labels."
      : `View ${named.map(({ view }) => view.id).join(", ")} cannot be printed on a balanced ` +
          `${POSTER.width} × ${POSTER.height} page, alone or with a neighbouring view. ` +
          "Give the view more of the model to show, merge it with a neighbour, or split it; " +
          "a standard-quality build delivers the closest pages as drafts that record what they miss.",
    problems,
  );
}

/**
 * Fewer wires that cross and then fewer route defects first, then fewer pages
 * that miss a gate, then fewer pages, then the least area in holes.
 */
function betterPlan(a, b) {
  if (a.crossings !== b.crossings) return a.crossings < b.crossings;
  if (a.routes !== b.routes) return a.routes < b.routes;
  if (a.unbalanced !== b.unbalanced) return a.unbalanced < b.unbalanced;
  if (a.pages !== b.pages) return a.pages < b.pages;
  return a.holes < b.holes;
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

/** Wires that cross on one page, over all its plates. */
function crossingsOf(page) {
  return page.made.reduce((sum, one) => sum + one.layout.measures.crossings, 0);
}

/**
 * Wiring faults on one page, over all its plates, worst first: its crossings,
 * then the route defects a reader misreads although no wire crosses.
 * @returns {[number, number]}
 */
function faultsOf(page) {
  return [crossingsOf(page), page.made.reduce((sum, one) => sum + one.layout.measures.routes, 0)];
}

/** Every turn the wires of a page's plates take: each is one more a reader follows. */
const bendsOf = (page) => page.made.reduce((sum, one) => sum + one.layout.measures.bends, 0);

/**
 * The best of a set: fewest wiring faults, then the fewest turns in its wires,
 * least area in holes and in the largest blank, then nearest the center, then
 * fewest plates. Every page in the set passes its gates, so a page that wires
 * its figure more simply is preferred to one that only fills it more.
 */
function best(list) {
  return [...list].sort(
    (a, b) =>
      compareRanks(faultsOf(a), faultsOf(b)) ||
      bendsOf(a) - bendsOf(b) ||
      a.balance.holes + a.balance.emptyShare - (b.balance.holes + b.balance.emptyShare) ||
      Math.hypot(...a.balance.centroid) - Math.hypot(...b.balance.centroid) ||
      a.views.length - b.views.length,
  )[0];
}

/** The page of a set that comes closest to passing: fewest gates missed, then the best. */
function nearest(list) {
  const fewest = Math.min(...list.map(({ fails }) => fails.length));
  return best(list.filter(({ fails }) => fails.length === fewest));
}

/**
 * Assemble one composed page's SVG: figure shapes, page shapes, then outlined text.
 * @param {any} model
 * @param {any} typefaces
 * @param {any} icons
 * @param {ReturnType<typeof sheet>} chosen
 */
function renderSheet(model, typefaces, icons, chosen) {
  const page = /** @type {any} */ (chosen.page);
  const made = /** @type {any[]} */ (chosen.made);
  const shapes = [...made.flatMap((one) => one.figure.shapes)];
  for (const glyph of page.glyphs) {
    if (glyph.shape === "icon")
      shapes.push(
        `<g transform="translate(${glyph.x},${glyph.top}) scale(${glyph.size / 24})" fill="none" ` +
          `stroke="${glyph.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
          `${icons.artwork(glyph.icon)}</g>`,
      );
    else if (glyph.shape === "boundary")
      shapes.push(
        `<rect x="${glyph.x}" y="${glyph.top + 4}" width="22" height="14" rx="4" fill="none" ` +
          `stroke="${C.boundary}" stroke-dasharray="4 3"/>`,
      );
    else if (glyph.shape === "outside")
      shapes.push(
        `<rect x="${glyph.x}" y="${glyph.top + 4}" width="22" height="14" rx="4" ` +
          `fill="${C.external}" stroke="${C.externalStroke}"/>`,
      );
    else
      shapes.push(
        `<line x1="${glyph.x}" y1="${glyph.top + 11}" x2="${glyph.x + 22}" y2="${glyph.top + 11}" ` +
          `stroke="${glyph.shape === "retired" ? C.faint : C.line}" stroke-width="${POSTER.wire.stroke}" ` +
          `stroke-dasharray="${glyph.shape === "retired" ? "1.5 3.5" : "6 4"}"/>`,
      );
  }
  for (const rule of page.rules)
    shapes.push(
      `<line x1="${rule.x1}" y1="${rule.y1}" x2="${rule.x2}" y2="${rule.y2}" stroke="${C.rule}"/>`,
    );
  const layers = new Map();
  for (const run of [...page.runs, ...made.flatMap((one) => one.figure.runs)]) {
    const key = `${run.layer}\u0000${run.color}`;
    const path = typefaces.outline(
      run.value,
      run.x,
      typefaces.baseline(run.top, run.style),
      run.style,
    );
    layers.set(key, (layers.get(key) ?? "") + path);
  }
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER.width}" height="${POSTER.height}" viewBox="0 0 ${POSTER.width} ${POSTER.height}">`,
    `<rect width="${POSTER.width}" height="${POSTER.height}" fill="${C.paper}"/>`,
    ...shapes,
    ...[...layers].map(
      ([key, d]) => `<path fill="${key.slice(key.indexOf("\u0000") + 1)}" d="${d}"/>`,
    ),
    "</svg>",
    "",
  ].join("\n");
  return {
    page: chosen.position.index + 1,
    views: chosen.views.map(({ id }) => id),
    title: chosen.views.length === 1 ? chosen.views[0].title : model.title,
    width: POSTER.width,
    height: POSTER.height,
    fits: true,
    position: chosen.position,
    admission: chosen.admission,
    misses: chosen.fails,
    composition: chosen.composition,
    measures: {
      crossings: crossingsOf(chosen),
      routes: made.reduce((sum, one) => sum + one.layout.measures.routes, 0),
      bends: made.reduce((sum, one) => sum + one.layout.measures.bends, 0),
      emptyShare: chosen.balance.emptyShare,
      emptyRectangle: chosen.balance.emptyRectangle,
      blankBand: chosen.balance.band.height,
      holes: chosen.balance.holes,
      centroid: chosen.balance.centroid,
    },
    svg,
  };
}

/**
 * Compose and draw every page of a model.
 * @param {{ quality?: "showcase" | "standard" }} [options]
 */
export function composePosters(model, views, typefaces, icons, options = {}) {
  return composeEdition(model, views, typefaces, icons, options).map((chosen) =>
    renderSheet(model, typefaces, icons, chosen),
  );
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
