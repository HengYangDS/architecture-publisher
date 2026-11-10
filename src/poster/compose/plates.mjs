import { presentation } from "../../kinds.mjs";
import { wordsOf } from "../../locale.mjs";
import { ROW_LIMIT, viewRows } from "../../layout/rows.mjs";
import { refuse } from "../../refusal.mjs";
import { DARKNESS, balanceOf, darkness } from "../balance.mjs";
import { platesOf } from "../plate.mjs";
import { HOUSE, POSTER, figureStyles } from "../tokens.mjs";
import { gateFailures } from "./gates.mjs";

/**
 * The print edition's plates: each view composed alone for the edition's body,
 * drawn as its shapes and its text runs. Typst sets the page and every run; the
 * engine lays the figure out.
 */

/** The edition's body in pixels, each two thirds of a point. */
const BODY = Object.freeze({
  width: Math.round(HOUSE.plate.width * HOUSE.plate.pixelsPerPoint),
  height: Math.round(HOUSE.plate.height * HOUSE.plate.pixelsPerPoint),
});

/**
 * The width of the column that holds a figure's tier labels: the widest label at
 * the largest tier size plus the numbered disc before it, and never more than the
 * token's column. A column wide enough for the longest label any model might
 * have leaves a blank strip down the plate beside short labels.
 * @param {any} typefaces
 * @param {string[]} labels
 */
export function gutterFor(typefaces, labels) {
  if (!labels.length) return 0;
  const tier = figureStyles(/** @type {any} */ (POSTER.steps.at(-1))).tier;
  const widest = Math.max(...labels.map((label) => typefaces.measure(label, tier)));
  return Math.min(POSTER.spacing.rowColumn, Math.ceil((widest + 64) / 8) * 8);
}

/**
 * The legend's entries: the kinds present, then the boundary when a figure draws
 * one — some component outside it and some inside — and the statuses present.
 */
function legendOf(model, views, boundary) {
  const words = wordsOf(model.locale);
  const kinds = [];
  const components = views.flatMap((view) => view.components);
  const outside = components.filter((component) => presentation(model, component).outside);
  const bounded = outside.length > 0 && outside.length < components.length;
  for (const component of components) {
    const style = presentation(model, component);
    if (kinds.some((entry) => entry.kind === style.kind)) continue;
    kinds.push({
      kind: style.kind,
      label: style.label,
      icon: style.icon,
      color: POSTER.hue[style.category],
    });
  }
  /** @type {Array<{ shape: string, label: string }>} */
  const rest = [];
  if (boundary && bounded)
    rest.push(
      { shape: "boundary", label: words.inside(boundary) },
      { shape: "outside", label: words.outside },
    );
  const shown = views.flatMap((view) => [...view.components, ...view.relations]);
  for (const status of /** @type {const} */ (["planned", "retired"]))
    if (shown.some((item) => item.status === status))
      rest.push({ shape: status, label: words[status] });
  return { kinds, rest };
}

/**
 * A summary set above a figure that keeps the full width: 17 points of the summary's face on 24-point lines, at most
 * the house's measure to a line, and 16 points more before the figure.
 */
const STANDFIRST = Object.freeze({
  style: Object.freeze({ size: 17, weight: 400, line: 24, face: /** @type {const} */ ("serif") }),
  measure: HOUSE.edition.measure * 17,
  before: 16,
});

/** The shares of the body's width a figure may take, widest first. */
const SHARES = Object.freeze([1, 0.8, 0.65]);

const compare = (a, b) => {
  for (let index = 0; index < a.length; index += 1)
    if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
};

/**
 * How a plate's ink stands over the body: its figure's rectangles and its text,
 * each line box weighted by how dark it prints.
 * @param {any} one a composition of the plate
 * @param {any} typefaces
 */
function balanceOfPlate(one, typefaces, width, height) {
  const text = (run) => ({
    x: run.x,
    y: run.top,
    width: Math.min(typefaces.measure(run.value, run.style), width - run.x),
    height: run.style.line,
    kind: /** @type {const} */ ("mass"),
    weight: DARKNESS.text * darkness(run.color),
  });
  const body = { x: 0, y: 0, width, height };
  return balanceOf([...one.figure.rects, ...one.figure.runs.map(text)], body, body);
}

/**
 * Each composition of one view the body admits. A plate tries its view at every
 * type step and wrapping, with its rows centred over all cards, over the cards
 * inside the boundary, and uncentred, and with tier labels in one column or
 * before the edges their tiers start at, within the given width and height of the body.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} typefaces
 * @param {any} icons
 * @param {number} [width]
 * @param {number} [height]
 */
function* compositions(model, view, typefaces, icons, width = BODY.width, height = BODY.height) {
  const boundaryName = model.repository?.name ?? model.title;
  const labels = viewRows(view, ROW_LIMIT, () => false).flatMap(({ label }) =>
    label ? [label] : [],
  );
  const column = gutterFor(typefaces, labels);
  const plate = {
    view,
    field: { x: column, y: 0, width: width - column, height },
    labelColumn: column ? { x: 0, y: 0, width: column, height, floor: 0 } : null,
  };
  const outside = view.components.some((component) => presentation(model, component).outside);
  /** @type {Array<"all" | "inside" | null>} */
  const centrings = outside ? ["all", "inside", null] : ["all", null];
  for (const tierLabels of column ? ["column", "edges"] : ["column"])
    for (const centring of centrings) {
      const [one] = platesOf(
        { model, typefaces, icons, boundaryName, centring, tierLabels },
        plate,
      );
      if (one) yield { one, centring, tierLabels };
    }
}

/** @param {import("../../plan/views.mjs").View} view */
function unfittable(view) {
  return refuse(
    "plate_unfittable",
    `View ${view.id} cannot be laid out in the edition's body at any type step or wrapping.`,
    [
      {
        code: "plate_unfittable",
        path: `/views/${view.id}`,
        message: "No wrapping lays its cards out within the body at the smallest step.",
      },
    ],
  );
}

/**
 * Whether the edition's body admits a view: some composition lays it out, or the
 * view is refused with `plate_unfittable`.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} typefaces
 * @param {any} icons
 */
export function admitsView(model, view, typefaces, icons) {
  if (compositions(model, view, typefaces, icons).next().done) unfittable(view);
  return { fits: true, width: BODY.width, height: BODY.height };
}

/**
 * The best composition of a view within one width and height of the body: the fewest crossings, then the fewest
 * route defects, then the largest step, then the widest wrapping, then layered rows before flatter ones, then the
 * least of the body left blank; or null when none lays it out.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} typefaces
 * @param {any} icons
 * @param {number} width
 * @param {number} [height]
 */
function bestWithin(model, view, typefaces, icons, width, height = BODY.height) {
  const candidates = [];
  for (const { one, centring, tierLabels } of compositions(
    model,
    view,
    typefaces,
    icons,
    width,
    height,
  )) {
    const balance = balanceOfPlate(one, typefaces, width, height);
    const { crossings, routes } = one.layout.measures;
    const rank = [
      crossings,
      routes,
      -one.step,
      -one.limit,
      one.flat ? 1 : 0,
      balance.holes + balance.emptyShare,
    ];
    candidates.push({ one, centring, tierLabels, balance, rank, width, height });
  }
  return candidates.sort((a, b) => compare(a.rank, b.rank))[0] ?? null;
}

/** How far a composition's figure reaches across the body: its rectangles and its text. */
function reachOf(one, typefaces) {
  const right = [
    ...one.figure.rects.map((rect) => rect.x + rect.width),
    ...one.figure.runs.map((run) => run.x + typefaces.measure(run.value, run.style)),
  ];
  const left = [...one.figure.rects, ...one.figure.runs].map((item) => item.x);
  return Math.max(...right) - Math.min(...left);
}

/** Whether a composition wires no worse than another: no more crossings, then no more route defects. */
const wiresNoWorse = (a, b) => compare(a.rank.slice(0, 2), b.rank.slice(0, 2)) <= 0;

/**
 * A view's summary above its figure: its lines within the house's measure, and the figure at the full width below
 * them when it wires no worse there than at the full body; or null.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} typefaces
 * @param {any} icons
 * @param {any} full the best composition at the full width
 */
function standfirstOf(model, view, typefaces, icons, full) {
  const lines = typefaces.wrap(view.summary, STANDFIRST.measure, STANDFIRST.style);
  const reserved =
    (lines.length * STANDFIRST.style.line + STANDFIRST.before) * HOUSE.plate.pixelsPerPoint;
  const height = BODY.height - Math.round(reserved);
  const shorter = height > 0 ? bestWithin(model, view, typefaces, icons, BODY.width, height) : null;
  return shorter && wiresNoWorse(shorter, full)
    ? { chosen: shorter, share: 1, reading: "above", standfirst: { lines } }
    : null;
}

/**
 * The width a view's figure takes and whether its reading is set beside it. A view with a summary gives up a
 * fifth of the body, or more at no cost to its type, or else keeps the width and sets its summary above the
 * figure when that costs it no wiring; a view without one gives up only width its figure leaves, and only when one
 * of its components claims files to list.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} typefaces
 * @param {any} icons
 * @param {any} full the best composition at the full width
 */
function widthOf(model, view, typefaces, icons, full) {
  const within = (share) =>
    bestWithin(model, view, typefaces, icons, Math.round(BODY.width * share));
  if (view.summary) {
    const wide = within(SHARES[1]);
    if (!wide || !wiresNoWorse(wide, full))
      return (
        standfirstOf(model, view, typefaces, icons, full) ?? {
          chosen: full,
          share: 1,
          reading: "omitted",
        }
      );
    const narrow = within(SHARES[2]);
    return narrow && wiresNoWorse(narrow, full) && narrow.one.step === wide.one.step
      ? { chosen: narrow, share: SHARES[2], reading: "set" }
      : { chosen: wide, share: SHARES[1], reading: "set" };
  }
  const listed = view.components.some((component) => component.files?.length);
  const reach = reachOf(full.one, typefaces) / BODY.width;
  let result = { chosen: full, share: 1, reading: "none" };
  for (const share of SHARES.slice(1)) {
    if (!listed || reach > share) break;
    const candidate = within(share);
    if (!candidate || !wiresNoWorse(candidate, full) || candidate.one.step !== full.one.step) break;
    result = { chosen: candidate, share, reading: "set" };
  }
  return result;
}

/**
 * Compose every view of a model as one plate each, its figure at the width the plate width rule gives it: the
 * best composition at that width, measured and recorded. A view no composition lays out is refused.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View[]} views
 * @param {any} typefaces
 * @param {any} icons
 */
export function composePlates(model, views, typefaces, icons) {
  const boundaryName = model.repository?.name ?? model.title;
  return views.map((view, index) => {
    const full = bestWithin(model, view, typefaces, icons, BODY.width);
    if (!full) unfittable(view);
    const { chosen, share, reading, standfirst } = widthOf(model, view, typefaces, icons, full);
    const { one, centring, tierLabels, balance, width, height } = chosen;
    const { kinds, rest } = legendOf(model, [view], boundaryName);
    return {
      page: index + 1,
      views: [view.id],
      title: view.title,
      question: view.question,
      width,
      height,
      share,
      reading,
      ...(standfirst ? { standfirst } : {}),
      summary: view.summary,
      step: one.step,
      svg: [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
        ...one.figure.shapes,
        "</svg>",
        "",
      ].join("\n"),
      runs: one.figure.runs.map((run) => ({
        text: run.value,
        x: run.x,
        baseline: typefaces.baseline(run.top, run.style),
        size: run.style.size,
        weight: run.style.weight,
        color: run.color,
        width: typefaces.measure(run.value, run.style),
        ...(run.component ? { component: run.component } : {}),
      })),
      legend: [
        ...kinds.map(({ kind, label, icon, color }) => ({ kind, label, icon, color })),
        ...rest,
      ],
      composition: { step: one.step, wrap: one.limit, flat: one.flat, centring, tierLabels },
      measures: {
        crossings: one.layout.measures.crossings,
        routes: one.layout.measures.routes,
        bends: one.layout.measures.bends,
        emptyShare: balance.emptyShare,
        emptyRectangle: balance.emptyRectangle,
        blankBand: balance.band.height,
        holes: balance.holes,
        centroid: balance.centroid,
      },
      misses: gateFailures(balance),
    };
  });
}
