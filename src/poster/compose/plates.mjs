import { HOUSE, HOUSE_BODY } from "../../house.mjs";
import { presentation } from "../../kinds.mjs";
import { wordsOf } from "../../locale.mjs";
import { wiresNoMore } from "../../layout/fill.mjs";
import { ROW_LIMIT, viewRows } from "../../layout/rows.mjs";
import { two } from "../../names.mjs";
import { refuse } from "../../refusal.mjs";
import { setWidth } from "../spread.mjs";
import { heavyLine, stripKey } from "../strip.mjs";
import { bandable, platesOf } from "../plate.mjs";
import { HOUSE_STYLE, POSTER, figureStyles, linesOf } from "../tokens.mjs";
import { balanceOfPlate, gateFailures, takesJustified } from "./gates.mjs";
import { matrices, matrixKey, matrixSample } from "./matrix.mjs";
import { ringOf, rings } from "./radial.mjs";
import { spines } from "./spine.mjs";
import { pathOf } from "./spine-path.mjs";

/**
 * What every composition of an edition's plates shares: the model, its
 * typefaces and icons, and the style its parts are drawn in; `plain` where its
 * figures are drawn without the tiers figure's band, for its guard.
 * @typedef {{ model: any, typefaces: any, icons: any,
 *   style: import("../strip.mjs").Style, plain?: boolean }} Scene
 */

/**
 * The print edition's plates: each view composed alone for the edition's body,
 * drawn as its shapes and its text runs. Typst sets the page and every run; the
 * engine lays the figure out.
 */

/** The edition's body in pixels, each two thirds of a point. */
const BODY = Object.freeze({
  width: Math.round(HOUSE_BODY.width * HOUSE.plate.pixelsPerPoint),
  height: Math.round(HOUSE_BODY.height * HOUSE.plate.pixelsPerPoint),
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
 * label. A plate drawn as a matrix draws no line: its key names its cells' marks in place of the lines' samples, and
 * draws the boundary and the statuses as the matrix draws them. On a plate drawn as a spine the heavy line is the
 * path along its stations, not the lines into the hub (`drawLines`), and the key names it so, with or without strips.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 * @param {string} boundary
 * @param {import("../strip.mjs").Style} drawn the style the plate is drawn in
 * @param {readonly string[]} rows the rows of the table of lines the figure draws
 * @param {{ matrix?: { side: number }, spine?: boolean }} figure the measures of the cells of a figure drawn as a
 *   matrix, or whether it is drawn as a spine
 */
function legendOf(model, view, boundary, drawn, rows, { matrix, spine }) {
  const words = wordsOf(model.locale);
  const lines = linesOf(drawn.lines);
  const keyed = (row) => (rows.includes(row) ? lines.key(row) : null);
  const key = matrix
    ? matrixKey(model, view, drawn, rows, matrix)
    : stripKey(model, view, drawn, spine ? rows.filter((row) => row !== "emphasis") : rows);
  if (spine && keyed("emphasis")) key.push(heavyLine(drawn, words.spine.path));
  /** A row's sample: the shape its row of lines names, or the mark a matrix draws for it. */
  const sample = (row, shape) => (matrix ? matrixSample(drawn, matrix, row) : { shape });
  const frame = keyed("boundary");
  if (frame) key.push({ ...sample("boundary", frame), label: words.inside(boundary) });
  // Two sorts of part stand on the outside ground, and the key says of each what is true of it: a part outside
  // the repository stands outside the boundary's frame; a neighbour that a group's view shows as context lies
  // inside the repository and outside the group.
  if (view.components.some((component) => presentation(model, component).outside))
    key.push({ shape: "outside", label: words.outside });
  if (view.components.some((component) => component.context))
    key.push({ shape: "outside", label: words.context });
  for (const status of /** @type {const} */ (["planned", "retired"])) {
    const shape = keyed(status);
    if (shape) key.push({ ...sample(status, shape), label: words[status] });
  }
  return key;
}

/**
 * What a build says of its plates' lines: each relation whose count of cited files has no clear place, by plate,
 * and each row of the table of lines that a plate draws and no work has tested.
 * @param {Array<{ page: number, lines: string[], touching: string[] }>} plates
 * @param {import("../strip.mjs").Style} style the style the plates are drawn in
 * @returns {Array<import("../../refusal.mjs").Problem>}
 */
export function lineWarnings(plates, style) {
  const number = ({ page }) => two(page);
  /** @type {Array<import("../../refusal.mjs").Problem>} */
  const touching = plates.flatMap((plate) =>
    plate.touching.map((id) => ({
      code: "citation_count_touches",
      path: `/plates/${number(plate)}/relations/${id}`,
      message: `Plate ${number(plate)}: the number of files relation ${id} cites has no clear place and touches another mark.`,
    })),
  );
  /** @type {Array<import("../../refusal.mjs").Problem>} */
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
 * A summary set above a figure that keeps the full width: the summary's face at a view summary's size and pitch,
 * as the house class sets it, at most the house's measure to a line, and 16 points more before the figure.
 */
const STANDFIRST = Object.freeze({
  style: Object.freeze({
    size: HOUSE.summary.size,
    weight: 400,
    line: HOUSE.summary.pitch,
    face: /** @type {const} */ ("serif"),
  }),
  measure: HOUSE.edition.measure * HOUSE.summary.size,
  before: 16,
});

/** The shares of the body's width a figure may take, widest first. */
const SHARES = Object.freeze([1, 0.8, 0.65]);

/**
 * The matrix's rule: a view that names no composition, declares no tiers and has at least `parts` parts is drawn as
 * a matrix when its figure in tiers at the full width has at least `routes` route defects, the layout's measure of
 * wiring a reader misreads (`src/layout/measure.mjs`), and a matrix fits the box its plate in tiers keeps. `parts`
 * is the owner's approved plan's of 2026-11-11. `routes` was calibrated on 2026-11-27 on readers' picks: six blind
 * readers, agents and not people, three to a pair, chose between the two drawings of each of the 51 views, in eleven
 * editions of the six published works, that have that many parts and declare no tiers. The rule agrees with the
 * majority on 43 of the 50 pairs that have one, and on 41 when each edition in turn is judged by the number the
 * others pick. Crossings and bends a relation agree on fewer, and are not part of it. The balance gates never choose
 * a matrix.
 */
const MATRIX_RULE = Object.freeze({ parts: 8, routes: 2 });

/**
 * The radial rule: a view whose author names no composition and declares no tiers is drawn round its centre (`ringOf`),
 * the part related to the most others, when at least `ring` parts stand round it, it relates to at least `centre` of
 * them, no other part relates to more than `second` of them, and at least `drives` times as many of its relations go
 * out from it as come into it. Read from the view's parts and relations alone, the choice is the view's and the same
 * in every language. The owner's delegate set `centre`, `second` and `drives` on 2026-11-27, after three seats and then
 * a fourth reader, agents and not people, judged the radial figures of the views in tiers of five works
 * (docs/research/radial.md): at 60% the test took centres every reader rejected; a second part related to more than
 * half of the others is a second hub, whose chords cross the figure; and a centre that the others write to more than
 * it drives them is a product, not a centre. `ring` keeps a fan of two in tiers: two parts round a centre would stand
 * on either side of it, one line across the plate with its corners blank.
 */
const RADIAL_RULE = Object.freeze({ ring: 3, centre: 0.75, second: 0.5, drives: 2 });

/**
 * Whether the radial rule draws a view round its centre, from the view's ring (`ringOf`).
 * @param {ReturnType<typeof ringOf>} shape
 */
function drawnRound(shape) {
  if (!shape) return false;
  return (
    shape.ring.length >= RADIAL_RULE.ring &&
    shape.share >= RADIAL_RULE.centre &&
    shape.second <= RADIAL_RULE.second &&
    shape.out >= RADIAL_RULE.drives * shape.into
  );
}

/**
 * The composition the matrix's rule gives a view that declares no tiers: a matrix, or the grid of tiers.
 * @param {import("../../plan/views.mjs").View} view
 * @param {number} routes the route defects of its figure in tiers at the full width
 * @returns {"tiers" | "matrix"}
 */
const byMatrixRule = (view, routes) =>
  view.components.length >= MATRIX_RULE.parts && routes >= MATRIX_RULE.routes ? "matrix" : "tiers";

/**
 * The shapes of a view that the radial and the spine's rules read, from its parts and relations and its model's kinds
 * alone, so the same in every language: its ring (`ringOf`) and its main path (`pathOf`), which the spine's rule
 * admits or refuses (spine-path.mjs). Each is read when first asked for and kept, so a view the rules settle before
 * the spine's walks no path.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View} view
 */
export function shapesOf(model, view) {
  /** @type {{ ring?: ReturnType<typeof ringOf>, path?: ReturnType<typeof pathOf> }} */
  const read = {};
  return {
    ring: () => (read.ring === undefined ? (read.ring = ringOf(view)) : read.ring),
    path: () => (read.path === undefined ? (read.path = pathOf(model, view)) : read.path),
  };
}

/**
 * The composition a view is drawn in where one of that kind can be drawn: the one its author names; for a view that
 * declares no tiers, by the radial rule a radial figure, else by the spine's rule a spine, else by the matrix's rule a
 * matrix; and the grid of tiers otherwise. The radial and the spine's rules come before the matrix's because they
 * read the view alone, where the matrix's reads the figure in tiers, which differs between languages. The radial rule
 * comes before the spine's because a ring is the more special shape: a part that drives three quarters of the others
 * is the view's centre even where a path runs past it.
 * @param {import("../../plan/views.mjs").View} view
 * @param {number} routes the route defects of its figure in tiers at the full width
 * @param {ReturnType<typeof shapesOf>} shapes
 * @returns {"tiers" | "matrix" | "radial" | "spine"}
 */
export function compositionOf(view, routes, { ring, path }) {
  if (view.composition) return view.composition;
  if (view.tiers) return "tiers";
  if (drawnRound(ring())) return "radial";
  if (path()?.admitted) return "spine";
  return byMatrixRule(view, routes);
}

/**
 * What a build says of the compositions authors name: each view whose plate could not be drawn in the composition
 * it names, and is drawn in tiers.
 * @param {Array<{ views: string[], unfitted?: string }>} plates
 * @returns {Array<import("../../refusal.mjs").Problem>}
 */
export function compositionWarnings(plates) {
  /** @type {Array<import("../../refusal.mjs").Problem>} */
  const unfitted = plates.flatMap(({ views: [id], unfitted: named }) =>
    named
      ? [
          {
            code: "plate_composition_unfitted",
            path: `/views/${id}/composition`,
            message: `View ${id} names the composition ${named}, which does not fit the box its plate keeps; the plate is drawn in tiers.`,
          },
        ]
      : [],
  );
  return unfitted;
}

const compare = (a, b) => {
  for (let index = 0; index < a.length; index += 1)
    if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
};

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
  const plate = plateIn(scene, view, width, height);
  const column = plate.labelColumn?.width ?? 0;
  const outside = view.components.some((component) => presentation(scene.model, component).outside);
  /** @type {Array<"all" | "inside" | null>} */
  const centrings = outside ? ["all", "inside", null] : ["all", null];
  for (const tierLabels of column ? ["column", "edges"] : ["column"])
    for (const centring of centrings) {
      const [one] = platesOf(inputOf(scene, centring, tierLabels, cards), plate);
      if (one) yield { one, centring, tierLabels };
    }
}

/**
 * What a plate is laid out from in a scene: its model, faces, icons and style, the boundary's name, the centring
 * and tier labels it tries, and what more it is asked; drawn plain where the scene is.
 * @param {Scene} scene
 * @param {"all" | "inside" | null} centring
 * @param {string} tierLabels
 * @param {object} more
 */
function inputOf(scene, centring, tierLabels, more) {
  const { model, typefaces, icons, style, plain } = scene;
  const boundaryName = model.repository?.name ?? model.title;
  return { model, typefaces, icons, boundaryName, centring, tierLabels, style, plain, ...more };
}

/**
 * The field a view's figure is laid out in, within a width and height of the body: the body less the column its
 * tier labels take.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {number} width
 * @param {number} height
 */
function plateIn(scene, view, width, height) {
  const labels = viewRows(view, ROW_LIMIT, () => false).flatMap(({ label }) =>
    label ? [label] : [],
  );
  const column = gutterFor(scene.typefaces, labels);
  return {
    view,
    field: { x: column, y: 0, width: width - column, height },
    labelColumn: column ? { x: 0, y: 0, width: column, height, floor: 0 } : null,
  };
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
  const scene = { model, typefaces, icons, style };
  // A view its figure drawn plain admits is admitted, whatever its band does.
  if (
    compositions(scene, view).next().done &&
    compositions({ ...scene, plain: true }, view).next().done
  )
    unfittable(view);
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

/** The box a composition's figure draws in: its rectangles, its text and its boundary, in the figure's px. */
function extentOf(one, typefaces) {
  const boxes = [
    ...one.figure.rects,
    ...one.figure.runs.map((run) => ({
      x: run.x,
      y: run.top,
      width: setWidth(run, typefaces),
      height: run.style.line,
    })),
    ...(one.figure.frame ? [one.figure.frame] : []),
  ];
  const [left, top] = [Math.min(...boxes.map((b) => b.x)), Math.min(...boxes.map((b) => b.y))];
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
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
 * A view drawn as a matrix: in the box the grid of tiers keeps beside or under its reading, so the reading and its
 * content are the plate's whatever its figure, at the largest type step a matrix fits at there; or null when none
 * fits, and the plate keeps its grid.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} tiers the grid the plate is drawn in otherwise
 */
function matrixOf(scene, view, tiers) {
  const { width, height } = tiers;
  const one = [...matrices(scene, view, { x: 0, y: 0, width, height })].at(-1);
  if (!one) return null;
  const paper = scene.style.tokens.palette.paper;
  const balance = balanceOfPlate(one, scene.typefaces, width, height, paper);
  return {
    one,
    matrix: true,
    centring: null,
    tierLabels: null,
    balance,
    width,
    height,
  };
}

/**
 * A plate of a figure drawn off the grid, the best a free composition drew in the box the grid of tiers keeps: its type
 * step, cards' details, wiring measured as the grid's is, figure and balance.
 * @param {any} best the composition's best figure
 * @param {{ width: number, height: number }} tiers the grid the plate is drawn in otherwise
 */
function freePlate(best, { width, height }) {
  const { crossings, routes, routeDefects, bends } = best.measured;
  const one = {
    step: best.cards.index,
    limit: null,
    flat: false,
    details: best.cards.details,
    layout: { measures: { crossings, routes, routeDefects, bends } },
    figure: best.drawn.figure,
  };
  return { one, centring: null, tierLabels: null, balance: best.drawn.balance, width, height };
}

/**
 * A view drawn as a radial figure round its centre (`rings`), in the box the grid of tiers keeps, as a matrix is: the
 * best ring that box holds; or, where none is drawn, why: `parts` for a view of fewer than three parts, which has no
 * ring, or the furthest fault its layouts came to (`FAULTS`).
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} tiers the grid the plate is drawn in otherwise
 * @param {ReturnType<typeof ringOf>} shape the view's ring
 * @returns {any}
 */
function radialOf(scene, view, tiers, shape) {
  if (!shape) return { fault: "parts" };
  const { width, height } = tiers;
  const {
    figures: [best],
    fault,
  } = rings(scene, view, { width, height }, shape);
  return best ? { ...freePlate(best, tiers), radial: shape.centre } : { fault };
}

/**
 * A view drawn as a spine along its main path (`spines`), in the box the grid of tiers keeps, as a radial figure is:
 * the best spine that box holds, weighed among the type steps no smaller than its figure in tiers' where a rule takes
 * it, and at every step the plate allows where its author names it, since, as for a radial figure, the type test is
 * the rule's alone (`composePlates`); or, where none is drawn, why: `parts` for a view whose relations make no path,
 * or one too short to fold or that leaves a part related to no station, or the furthest fault its layouts came to
 * (`FAULTS`).
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} tiers the grid the plate is drawn in otherwise
 * @param {ReturnType<typeof pathOf>} path the view's main path
 * @returns {any}
 */
function spineOf(scene, view, tiers, path) {
  if (!path) return { fault: "parts" };
  const { width, height } = tiers;
  const {
    figures: [best],
    fault,
  } = spines(scene, view, { width, height }, path, view.composition ? 0 : tiers.one.step);
  if (!best) return { fault };
  const { plan, split } = best.arrangement;
  return { ...freePlate(best, tiers), spine: { stations: plan.stations, rows: split } };
}

/**
 * A view's plate in tiers in one scene: its best figure at the full width, the width and reading the plate takes,
 * and its figure there with its cards' details where they fit; or null when no composition lays it out.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 */
function planOf(scene, view) {
  const full = bestWithin(scene, view, BODY.width);
  if (!full) return null;
  const { chosen, share, reading, standfirst } = widthOf(scene, view, full);
  return { full, share, reading, standfirst, tiers: withDetails(scene, view, chosen) };
}

/**
 * A view's plate in tiers with the tiers figure's band, guarded per plate on the rule each of its figures is guarded
 * on (`wiresNoMore`, src/layout/fill.mjs): the plate drawn with its bands, unless its figure wires worse than the
 * plate drawn plain, which is then drawn; and the cards a guard drew plain. A view is planned once where no band
 * may draw a card of it, or where its plate drew none, at the full width or as it ships, so its guard has no band to
 * take back; a view no composition lays out is refused.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 */
function guardedPlan(scene, view) {
  const filled = planOf(scene, view);
  const drewBands =
    !filled || Boolean(filled.full.one.layout.bands || filled.tiers.one.layout.bands);
  const plain =
    drewBands && bandable(scene.model, view) ? planOf({ ...scene, plain: true }, view) : filled;
  const measures = (/** @type {any} */ planned) => planned.tiers.one.layout.measures;
  const plan =
    filled && (!plain || wiresNoMore(measures(filled), measures(plain))) ? filled : plain;
  if (!plan) return unfittable(view);
  const layout = filled?.tiers.one.layout;
  const unbanded =
    plan === filled
      ? (layout?.unbanded ?? [])
      : [...(layout?.bands ?? []), ...(layout?.unbanded ?? [])];
  return { plan, unbanded };
}

/**
 * The plate's chosen figure in tiers, or the same figure justified where the plate takes it on its terms
 * (`takesJustified`): the same rows, order of cards, wrapping, step, centring, tier labels, cards and bands, in the
 * same box, with each row of two or more cards spread across the width. A figure that misses no gate keeps its rows.
 * @param {Scene} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {any} chosen
 */
function justifiedBeside(scene, view, chosen) {
  const { one, width, height, centring, tierLabels, balance } = chosen;
  const faults = (/** @type {any} */ figure, /** @type {any} */ measured) => ({
    misses: gateFailures(measured).map(({ measure }) => measure),
    crossings: figure.layout.measures.crossings,
    routes: figure.layout.measures.routes,
  });
  const before = faults(one, balance);
  if (!before.misses.length) return chosen;
  const rowsOf = (/** @type {any} */ figure) =>
    JSON.stringify(figure.layout.rows.map(({ members }) => members));
  const more = {
    justify: true,
    plain: !one.layout.bands,
    details: one.details,
    steps: [one.step],
    wrapping: { limit: one.limit, flat: one.flat },
  };
  const paper = scene.style.tokens.palette.paper;
  for (const twin of platesOf(
    inputOf(scene, centring, tierLabels, more),
    plateIn(scene, view, width, height),
  )) {
    if (rowsOf(twin) !== rowsOf(one)) continue;
    const measured = balanceOfPlate(twin, scene.typefaces, width, height, paper);
    if (takesJustified(before, faults(twin, measured)))
      return { ...chosen, one: twin, balance: measured, justified: true };
  }
  return chosen;
}

/**
 * Compose every view of a model as one plate each, its figure at the width the plate width rule gives it: the
 * best composition at that width, measured and recorded. A view no composition lays out is refused.
 * Every plate is drawn in the edition's one style, so strip lengths and age bands keep one scale across it.
 * Each plate carries its figure's report of what it drew, as the drawing handed it back. A plate is drawn as a
 * matrix, a radial figure or a spine where its view names one or a rule takes one, in the box its tiers would have,
 * and records that kind; one its view names that cannot be drawn there leaves the plate in tiers, and the plate says
 * so. A radial figure or a spine a rule takes is drawn at a type step no smaller than its figure in tiers; where it is
 * not drawn, the plate is drawn as the matrix's rule gives it and records why, so a view drawn round its centre or
 * along its path in one language and not in another says which and why. A plate in tiers draws the tiers figure's
 * fill (src/layout/fill.mjs) and records it: the cards it drew as bands, the bands a guard drew plain, and the
 * justified figure where it took that.
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
    const { plan, unbanded } = guardedPlan(scene, view);
    const { full, share, reading, standfirst } = plan;
    // The matrix's rule reads the figure in tiers that would be drawn, its band where it keeps one.
    const { routes } = full.one.layout.measures;
    const shapes = shapesOf(model, view);
    const kind = compositionOf(view, routes, shapes);
    // A radial figure or a spine its author names is drawn wherever one can be, at any type step; one a rule takes,
    // where it sets its type no smaller than the figure in tiers would.
    const free =
      kind === "radial"
        ? radialOf(scene, view, plan.tiers, shapes.ring())
        : kind === "spine"
          ? spineOf(scene, view, plan.tiers, shapes.path())
          : null;
    const refused =
      free &&
      (free.fault ?? (!view.composition && free.one.step < plan.tiers.one.step ? "type" : null));
    // A radial figure or a spine a rule takes and the plate does not draw leaves the view to the matrix's rule; one
    // its author names, to tiers, as a named matrix that does not fit.
    const fallback = free && !view.composition ? byMatrixRule(view, routes) : kind;
    const chosen =
      free && !refused
        ? free
        : ((fallback === "matrix" ? matrixOf(scene, view, plan.tiers) : null) ??
          justifiedBeside(scene, view, plan.tiers));
    const {
      one,
      matrix,
      radial: centre,
      spine,
      centring,
      tierLabels,
      balance,
      width,
      height,
    } = chosen;
    // A composition the view names and its plate is not drawn in.
    const drawn = matrix ? "matrix" : centre ? "radial" : spine ? "spine" : "tiers";
    const unfitted = view.composition === drawn ? null : view.composition;
    const legend = legendOf(model, view, boundaryName, style, one.figure.lines, {
      matrix: one.figure.matrix,
      spine: Boolean(spine),
    });
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
      // What the figure draws on, for the figure set alone: its rectangles, its text and its boundary.
      extent: extentOf(one, typefaces),
      lines: one.figure.lines,
      touching: one.figure.touching,
      report: one.figure.report,
      ...(unfitted ? { unfitted } : {}),
      composition: {
        // A matrix records the route defects of the figure in tiers at the full width, which the rule weighs.
        ...(matrix ? { kind: "matrix", tiers: { routes } } : {}),
        // A radial figure records its centre and the type step of the figure in tiers it is weighed against.
        ...(centre ? { kind: "radial", centre, tiers: { step: plan.tiers.one.step } } : {}),
        // A spine records the stations it folds and how many stand in each row, and the type step of the figure in
        // tiers it is weighed against.
        ...(spine ? { kind: "spine", ...spine, tiers: { step: plan.tiers.one.step } } : {}),
        step: one.step,
        wrap: one.limit,
        flat: one.flat,
        centring,
        tierLabels,
        details: one.details,
        // The tiers figure's fill: the cards drawn as bands, the bands a guard drew plain, the justified figure.
        ...(!matrix && one.layout.bands ? { bands: one.layout.bands } : {}),
        ...(!matrix && !centre && !spine && unbanded.length ? { unbanded } : {}),
        ...(chosen.justified ? { justified: true } : {}),
        // A radial figure or a spine its author or a rule asked for and the plate does not draw, and why.
        ...(refused ? { refused: { kind, why: refused } } : {}),
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
