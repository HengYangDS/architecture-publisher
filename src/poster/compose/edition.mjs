import { refuse } from "../../refusal.mjs";
import { POSTER } from "../tokens.mjs";
import { PLATES, pageCandidates } from "./candidates.mjs";
import { renderSheet } from "./drawing.mjs";
import { best, compareRanks, faultsOf, nearest } from "./ranking.mjs";

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
 * @param {import("../../plan/views.mjs").View[]} views
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
 * Compose and draw every page of a model.
 * @param {{ quality?: "showcase" | "standard" }} [options]
 */
export function composePosters(model, views, typefaces, icons, options = {}) {
  return composeEdition(model, views, typefaces, icons, options).map((chosen) =>
    renderSheet(model, typefaces, icons, chosen),
  );
}
