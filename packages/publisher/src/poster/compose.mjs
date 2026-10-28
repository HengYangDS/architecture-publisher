import { presentation } from "../kinds.mjs";
import { ROW_LIMIT, viewRows } from "../layout/rows.mjs";
import { refuse } from "../refusal.mjs";
import { balanceOf, inkFromRects } from "./balance.mjs";
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
 * in bands of one or more plates, until the page itself is full. Nothing is
 * stretched to fill a frame: the page is filled by what it carries.
 */

const C = POSTER.color;

/** The gates a composed page must pass, each measured from the page itself. */
export const GATES = Object.freeze({
  /** The largest empty rectangle covers at most this share of the live area. */
  emptyShare: 0.12,
  /** Ink reaches at least this share of the plates' region across and down. */
  fill: 0.9,
  /** The ink centroid sits at most this far from the region's center. */
  centroid: 0.06,
});

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
const FLOATING_PLATES = 12;

/** The ink of one page, measured from its drawn rectangles before it is rendered. */
function measure(page, made, typefaces) {
  const rects = [
    ...made.flatMap((one) => one.figure.rects),
    ...page.runs.map((run) => ({
      x: run.x,
      y: run.top,
      width: Math.min(typefaces.measure(run.value, run.style), POSTER.width - run.x),
      height: run.style.line,
    })),
    ...page.glyphs.map((glyph) => ({
      x: glyph.x,
      y: glyph.top,
      width: glyph.size,
      height: glyph.size,
    })),
    ...page.rules.map((rule) => ({
      x: Math.min(rule.x1, rule.x2),
      y: rule.y1 - 1,
      width: Math.abs(rule.x2 - rule.x1),
      height: 2,
    })),
  ];
  // The figure's frame is the rectangle its plates' fields cover, not the region
  // they sit in: a labelled plate reserves a gutter at the left of the region for
  // its tier labels, and measuring the centroid against the region would call
  // every labelled figure right-heavy for drawing exactly where it was told to.
  const fields = page.plates.map((plate) => plate.field);
  const left = Math.min(...fields.map((field) => field.x));
  const right = Math.max(...fields.map((field) => field.x + field.width));
  const top = Math.min(...fields.map((field) => field.y));
  const bottom = Math.max(...fields.map((field) => field.y + field.height));
  const grid = inkFromRects(rects, 8, POSTER.width, POSTER.height);
  return balanceOf(grid, {
    live: LIVE,
    figure: { x: left, y: top, width: right - left, height: bottom - top },
  });
}

/**
 * Compose one page of `views`. Returns the drawn page, or null when this
 * grouping cannot fill the format in either skeleton.
 */
function sheet(model, views, position, typefaces, icons, provenance, boundaryName) {
  if (views.length > PLATES[PLATES.length - 1]) return null;
  refuseUnsetText(typefaces, model, views);
  /** @type {any[]} */
  const candidates = [];
  const input = { model, views, provenance, typefaces, boundary: boundaryName };
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
  /** @type {Array<{ archetype: "stack" | "column" | "corner", rail?: number, reserve?: boolean, notes?: boolean, bands?: number[] }>} */
  const skeletons = [
    { archetype: "stack" },
    ...(BANDS[views.length] ?? []).map((bands) => ({
      archetype: /** @type {const} */ ("stack"),
      bands,
    })),
    { archetype: "column", rail: 4 },
    { archetype: "column", rail: 3 },
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
  const context = { model, typefaces, icons, boundaryName };
  const chosen = () => {
    const passing = candidates.filter(({ fails }) => fails.length === 0);
    return candidates.length ? best(passing.length ? passing : candidates) : null;
  };
  for (const skeleton of skeletons)
    for (const centring of centrings) {
      const made = candidate(input, skeleton, centring, context);
      if (made) candidates.push({ ...made, views, position });
    }
  // Centring a row may move it rather than bend a wire, never rather than
  // cross one, and placement weighs it so. But placement sees only the wires
  // between neighbouring rows: a relation that skips rows turns in the last
  // channel it enters and can cross wires placement never weighed. When the
  // best page still crosses, its plates are laid out uncentred as well, and the
  // page is chosen again from what both measure.
  const first = chosen();
  if (first && crossingsOf(first) > 0)
    for (const skeleton of skeletons) {
      const made = candidate(input, skeleton, null, context);
      if (made) candidates.push({ ...made, views, position });
    }
  return chosen();
}

/**
 * One page candidate: a skeleton and a centring rule, planned on the plates'
 * natural heights, drawn and measured. Null when the grouping does not fit.
 * @param {any} input
 * @param {{ archetype: "stack" | "column" | "corner", rail?: number, reserve?: boolean,
 *   notes?: boolean, bands?: number[] }} skeleton
 * @param {"all" | "inside" | null} centring null lays the rows out uncentred
 * @param {any} context
 */
function candidate(input, skeleton, centring, context) {
  const { model, typefaces, icons, boundaryName } = context;
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
    platesOf({ model, typefaces, icons, boundaryName, centring }, plate),
  );
  if (options.some((list) => !list.length)) return null;
  let made = sharedStep(options);
  if (!made) return null;
  if (page.floating) {
    // A floating page sets its text around each of its plate's compositions,
    // best first: the best figure may leave no corner for the head. A page that
    // passes comes first, then one whose wires do not cross, then the better
    // figure, and only then the fuller page.
    const planned = page;
    /** @type {{ rank: number[], page: any, one: any } | null} */
    let chosen = null;
    for (const [order, one] of options[0].slice(0, FLOATING_PLATES).entries()) {
      const rankOf = (set) => {
        const balance = measure(set, [one], typefaces);
        return [
          gateFailures(balance).length,
          one.layout.measures.crossings,
          order,
          balance.emptyShare,
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
  const balance = measure(drawn, made, typefaces);
  const fails = gateFailures(balance);
  return {
    page: drawn,
    made,
    balance,
    fails,
    composition: {
      archetype: drawn.archetype,
      rail: skeleton.rail ?? null,
      reserve: skeleton.reserve ?? false,
      notes: skeleton.notes ? "floating" : drawn.archetype === "column" ? "rail" : "footer",
      bands: skeleton.bands ?? drawn.plates.map(() => 1),
      centring,
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
 * One composition per plate, all at one type step: the plates of one page set
 * their cards in one size, so a page never pairs a large figure with a small
 * one. The step is the largest every plate can draw at among those with the
 * fewest crossings across the page; each plate takes its best composition at
 * that step. Null when no step suits every plate.
 * @param {any[][]} options each plate's compositions, best first
 */
function sharedStep(options) {
  const steps = [...new Set(options.flat().map((one) => one.step))].sort((a, b) => b - a);
  /** @type {{ picks: any[], crossings: number } | null} */
  let best = null;
  for (const step of steps) {
    const picks = options.map((list) => list.find((one) => one.step === step));
    if (picks.some((one) => !one)) continue;
    const crossings = picks.reduce((sum, one) => sum + one.layout.measures.crossings, 0);
    if (!best || crossings < best.crossings) best = { picks, crossings };
  }
  return best ? best.picks : null;
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
 * The search minimises the pages that fail a gate, then the page count, then the
 * empty share the edition leaves.
 * @param {any} model
 * @param {import("../plan/views.mjs").View[]} views
 * @param {any} typefaces
 * @param {any} icons
 * @param {{ state: string, records: any[] }} provenance
 */
export function composeEdition(model, views, typefaces, icons, provenance) {
  const boundaryName = model.repository?.name ?? model.title;
  /** @type {Map<string, any>} */
  const tried = new Map();
  const at = (index, count) => {
    const key = `${index}:${count}`;
    if (!tried.has(key))
      tried.set(
        key,
        sheet(
          model,
          views.slice(index, index + count),
          { index: 0, count: 0 },
          typefaces,
          icons,
          provenance,
          boundaryName,
        ),
      );
    return tried.get(key);
  };

  const count = views.length;
  /** @type {Array<any>} */
  const plan = new Array(count + 1).fill(null);
  plan[count] = { pages: 0, fails: 0, empty: 0, next: count, made: null };
  for (let index = count - 1; index >= 0; index -= 1) {
    /** @type {any} */
    let chosen = null;
    for (const size of PLATES) {
      if (index + size > count) continue;
      const rest = plan[index + size];
      const made = at(index, size);
      // A grouping that cannot be drawn is not a page.
      if (!rest || !made) continue;
      const total = {
        pages: 1 + rest.pages,
        fails: (made.fails.length ? 1 : 0) + rest.fails,
        empty: made.balance.emptyShare + rest.empty,
        next: index + size,
        made,
      };
      if (!chosen || betterPlan(total, chosen)) chosen = total;
    }
    plan[index] = chosen;
  }
  // Admission draws every planned view on a page of its own, so a plan always
  // exists for an admitted edition; a view no page can draw is refused by name.
  if (!plan[0]) {
    const lost = views.filter((_, index) => !at(index, 1)).map(({ id }) => id);
    refuse(
      "poster_unfittable",
      `View ${lost.join(", ")} cannot be laid out on a ${POSTER.width} × ${POSTER.height} page ` +
        "at any type step or row wrapping. Split the view or shorten its labels.",
      lost.map((id) => ({ code: "poster_unfittable", path: `/views/${id}`, message: id })),
    );
  }

  const pages = [];
  for (let index = 0; index < count; index = plan[index].next) pages.push(plan[index].made);
  pages.forEach((made, order) => (made.position = { index: order, count: pages.length }));
  return pages;
}

/**
 * Fewer failing pages first, then fewer pages, then the least empty share. A
 * count of passing pages would prefer splitting a passing page in two.
 */
function betterPlan(a, b) {
  if (a.fails !== b.fails) return a.fails < b.fails;
  if (a.pages !== b.pages) return a.pages < b.pages;
  return a.empty < b.empty;
}

/** Which gates a measured page fails. */
function gateFailures(balance) {
  /** @type {Array<{ measure: string, value: number, limit: number }>} */
  const fails = [];
  if (balance.emptyShare > GATES.emptyShare)
    fails.push({ measure: "emptyShare", value: balance.emptyShare, limit: GATES.emptyShare });
  if (balance.fill[0] < GATES.fill)
    fails.push({ measure: "fillAcross", value: balance.fill[0], limit: GATES.fill });
  if (balance.fill[1] < GATES.fill)
    fails.push({ measure: "fillDown", value: balance.fill[1], limit: GATES.fill });
  if (Math.abs(balance.centroid[0]) > GATES.centroid)
    fails.push({ measure: "centroidX", value: balance.centroid[0], limit: GATES.centroid });
  if (Math.abs(balance.centroid[1]) > GATES.centroid)
    fails.push({ measure: "centroidY", value: balance.centroid[1], limit: GATES.centroid });
  return fails;
}

/** Wires that cross on one page, over all its plates. */
function crossingsOf(page) {
  return page.made.reduce((sum, one) => sum + one.layout.measures.crossings, 0);
}

/** The best of a set: fewest crossings, least empty, then nearest the center, then fewest plates. */
function best(list) {
  return [...list].sort(
    (a, b) =>
      crossingsOf(a) - crossingsOf(b) ||
      a.balance.emptyShare - b.balance.emptyShare ||
      Math.hypot(...a.balance.centroid) - Math.hypot(...b.balance.centroid) ||
      a.views.length - b.views.length,
  )[0];
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
    view: chosen.views.map(({ id }) => id).join("-"),
    views: chosen.views.map(({ id }) => id),
    title: chosen.views.length === 1 ? chosen.views[0].title : model.title,
    width: POSTER.width,
    height: POSTER.height,
    fits: true,
    position: chosen.position,
    composition: chosen.composition,
    measures: {
      crossings: crossingsOf(chosen),
      bends: made.reduce((sum, one) => sum + one.layout.measures.bends, 0),
      emptyShare: chosen.balance.emptyShare,
      emptyRectangle: chosen.balance.emptyRectangle,
      emptyNinths: chosen.balance.emptyNinths,
      fill: chosen.balance.fill,
      centroid: chosen.balance.centroid,
      misses: chosen.fails,
    },
    svg,
  };
}

/** Compose and draw every page of a model. */
export function composePosters(model, views, typefaces, icons, provenance) {
  return composeEdition(model, views, typefaces, icons, provenance).map((chosen) =>
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
export function admitsView(
  model,
  view,
  typefaces,
  icons,
  provenance = { state: "none", records: [] },
) {
  const boundaryName = model.repository?.name ?? model.title;
  const made = sheet(
    model,
    [view],
    { index: 0, count: 1 },
    typefaces,
    icons,
    provenance,
    boundaryName,
  );
  return { fits: made !== null, width: POSTER.width, height: POSTER.height };
}
