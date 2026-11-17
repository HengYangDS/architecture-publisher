import { presentation } from "../../kinds.mjs";
import { wordsOf } from "../../locale.mjs";
import { ROW_LIMIT, viewRows } from "../../layout/rows.mjs";
import { refuse } from "../../refusal.mjs";
import { DARKNESS, balanceOf, darkness } from "../balance.mjs";
import { setWidth } from "../spread.mjs";
import { stripKey } from "../strip.mjs";
import { platesOf } from "../plate.mjs";
import { HOUSE, HOUSE_STYLE, POSTER, figureStyles, linesOf } from "../tokens.mjs";
import { gateFailures } from "./gates.mjs";

/**
 * What every composition of an edition's plates shares: the model, its
 * typefaces and icons, and the style its parts are drawn in.
 * @typedef {{ model: any, typefaces: any, icons: any,
 *   style: import("../strip.mjs").Style }} Scene
 */

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
 * The key's entries: what a plate shows and cannot say where it stands. First the marks its strips and lines show,
 * where the edition draws strips. Then the boundary, where the figure draws it, by the shape the table of lines
 * names for its row; the ground of a part outside it, where the view shows a part on that ground; and the statuses
 * present, each by its row's shape. The key lists no kind, since every card sets its kind's icon before the kind's
 * label.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {string} boundary
 * @param {import("../strip.mjs").Style} drawn the style the plate is drawn in
 * @param {readonly string[]} rows the rows of the table of lines the figure draws
 */
function legendOf(model, view, boundary, drawn, rows) {
  const words = wordsOf(model.locale);
  const lines = linesOf(drawn.lines);
  const keyed = (row) => (rows.includes(row) ? lines.key(row) : null);
  const key = stripKey(model, view, drawn, rows);
  const frame = keyed("boundary");
  if (frame) key.push({ shape: frame, label: words.inside(boundary) });
  // Two sorts of part stand on the outside ground, and the key says of each what is true of it: a part outside
  // the repository stands outside the boundary's frame; a neighbour that a group's view shows as context lies
  // inside the repository and outside the group.
  if (view.components.some((component) => presentation(model, component).outside))
    key.push({ shape: "outside", label: words.outside });
  if (view.components.some((component) => component.context))
    key.push({ shape: "outside", label: words.context });
  for (const status of /** @type {const} */ (["planned", "retired"])) {
    const shape = keyed(status);
    if (shape) key.push({ shape, label: words[status] });
  }
  return key;
}

/**
 * What a build says of its plates' lines: each relation whose count of cited files has no clear place, by plate,
 * and each row of the table of lines that a plate draws and no work has tested.
 * @param {Array<{ page: number, lines: string[], touching: string[] }>} plates
 * @param {import("../strip.mjs").Style} style the style the plates are drawn in
 * @returns {Array<{ code: string, path?: string, message: string }>}
 */
export function lineWarnings(plates, style) {
  const number = ({ page }) => String(page).padStart(2, "0");
  const touching = plates.flatMap((plate) =>
    plate.touching.map((id) => ({
      code: "citation_count_touches",
      path: `/plates/${number(plate)}/relations/${id}`,
      message: `Plate ${number(plate)}: the number of files relation ${id} cites has no clear place and touches another mark.`,
    })),
  );
  const untested = linesOf(style.lines)
    .untested()
    .flatMap(({ id, meaning }) => {
      const drawing = plates.filter(({ lines }) => lines.includes(id)).map(number);
      return drawing.length
        ? [
            {
              code: "line_row_untested",
              message: `Plates ${drawing.join(", ")} draw the pattern of ${meaning}, which no work has tested.`,
            },
          ]
        : [];
    });
  return [...touching, ...untested];
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
 * each line box weighted by how dark it prints on the style's paper.
 * @param {any} one a composition of the plate
 * @param {any} typefaces
 * @param {string} paper
 */
function balanceOfPlate(one, typefaces, width, height, paper) {
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
 * Each composition of one view the body admits. A plate tries its view at every
 * type step and wrapping, with its rows centred over all cards, over the cards
 * inside the boundary, and uncentred, and with tier labels in one column or
 * before the edges their tiers start at, within the given width and height of the body.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {number} [width]
 * @param {number} [height]
 * @param {{ details?: boolean, steps?: number[] }} [cards] compact cards at every step unless said otherwise
 */
function* compositions(scene, view, width = BODY.width, height = BODY.height, cards = {}) {
  const { model, typefaces, icons, style } = scene;
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
        { model, typefaces, icons, boundaryName, centring, tierLabels, style, ...cards },
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
 * Whether the edition's body admits a view in the edition's style: some
 * composition lays it out, or the view is refused with `plate_unfittable`.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} typefaces
 * @param {any} icons
 * @param {import("../strip.mjs").Style} [style] the house tokens and no measured facts unless given
 */
export function admitsView(model, view, typefaces, icons, style = HOUSE_STYLE) {
  if (compositions({ model, typefaces, icons, style }, view).next().done) unfittable(view);
  return { fits: true, width: BODY.width, height: BODY.height };
}

/**
 * The best composition of a view within one width and height of the body: the fewest crossings, then the fewest
 * route defects, then the largest step, then the widest wrapping, then layered rows before flatter ones, then the
 * least of the body left blank; or null when none lays it out.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {number} width
 * @param {number} [height]
 * @param {{ details?: boolean, steps?: number[] }} [cards]
 */
function bestWithin(scene, view, width, height = BODY.height, cards = {}) {
  const candidates = [];
  const paper = scene.style.tokens.palette.paper;
  for (const { one, centring, tierLabels } of compositions(scene, view, width, height, cards)) {
    const balance = balanceOfPlate(one, scene.typefaces, width, height, paper);
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
    ...one.figure.runs.map((run) => run.x + setWidth(run, typefaces)),
  ];
  const left = [...one.figure.rects, ...one.figure.runs].map((item) => item.x);
  return Math.max(...right) - Math.min(...left);
}

/** Whether a composition wires no worse than another: no more crossings, then no more route defects. */
const wiresNoWorse = (a, b) => compare(a.rank.slice(0, 2), b.rank.slice(0, 2)) <= 0;

/**
 * A view's summary above its figure: its lines within the house's measure, and the figure at the full width below
 * them when it wires no worse there than at the full body; or null.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} full the best composition at the full width
 */
function standfirstOf(scene, view, full) {
  const lines = scene.typefaces.wrap(view.summary, STANDFIRST.measure, STANDFIRST.style);
  const reserved =
    (lines.length * STANDFIRST.style.line + STANDFIRST.before) * HOUSE.plate.pixelsPerPoint;
  const height = BODY.height - Math.round(reserved);
  const shorter = height > 0 ? bestWithin(scene, view, BODY.width, height) : null;
  return shorter && wiresNoWorse(shorter, full)
    ? { chosen: shorter, share: 1, reading: "above", standfirst: { lines } }
    : null;
}

/**
 * The width a view's figure takes and whether its reading is set beside it. A view with a summary gives up a
 * fifth of the body, or more at no cost to its type, or else keeps the width and sets its summary above the
 * figure when that costs it no wiring; a view without one gives up only width its figure leaves, and only when one
 * of its components claims files to list.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} full the best composition at the full width
 * @returns {{ chosen: any, share: number, reading: string, standfirst?: { lines: string[] } }}
 */
function widthOf(scene, view, full) {
  const within = (share) => bestWithin(scene, view, Math.round(BODY.width * share));
  if (view.summary) {
    const wide = within(SHARES[1]);
    if (!wide || !wiresNoWorse(wide, full))
      return (
        standfirstOf(scene, view, full) ?? {
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
  const reach = reachOf(full.one, scene.typefaces) / BODY.width;
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
 * A plate's composition with its cards' details, where it has the room. A plate is composed for compact cards, so
 * what its parts state costs it neither wiring nor type; the view is then laid out once more with every card's
 * details, in the same width and height and at the same type step, and that composition is taken when it wires no
 * worse. A view whose parts state nothing keeps its compact cards.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} compact the composition chosen for the plate
 */
function withDetails(scene, view, compact) {
  if (!view.components.some((component) => component.details.length)) return compact;
  const detailed = bestWithin(scene, view, compact.width, compact.height, {
    details: true,
    steps: [compact.one.step],
  });
  return detailed && wiresNoWorse(detailed, compact) ? detailed : compact;
}

/**
 * Compose every view of a model as one plate each, its figure at the width the plate width rule gives it: the
 * best composition at that width, measured and recorded. A view no composition lays out is refused.
 * Every plate is drawn in the edition's one style, so strip lengths and age bands keep one scale across it.
 * Each plate carries its figure's report of what it drew, as the drawing handed it back.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View[]} views
 * @param {any} typefaces
 * @param {any} icons
 * @param {import("../strip.mjs").Style} [style] the house tokens and no measured facts unless given
 */
export function composePlates(model, views, typefaces, icons, style = HOUSE_STYLE) {
  const boundaryName = model.repository?.name ?? model.title;
  const scene = { model, typefaces, icons, style };
  return views.map((view, index) => {
    const full = bestWithin(scene, view, BODY.width);
    if (!full) unfittable(view);
    const { chosen: compact, share, reading, standfirst } = widthOf(scene, view, full);
    const chosen = withDetails(scene, view, compact);
    const { one, centring, tierLabels, balance, width, height } = chosen;
    const legend = legendOf(model, view, boundaryName, style, one.figure.lines);
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
        // A line laid out by the width Typst sets it in reports that width, so the edition holds Typst to it.
        width: run.set ?? typefaces.measure(run.value, run.style),
        ...(run.component ? { component: run.component } : {}),
        ...(run.measure ? { measure: run.measure } : {}),
      })),
      legend,
      lines: one.figure.lines,
      touching: one.figure.touching,
      report: one.figure.report,
      composition: {
        step: one.step,
        wrap: one.limit,
        flat: one.flat,
        centring,
        tierLabels,
        details: one.details,
      },
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
