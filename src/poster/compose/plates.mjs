import { presentation } from "../../kinds.mjs";
import { ROW_LIMIT, viewRows } from "../../layout/rows.mjs";
import { refuse } from "../../refusal.mjs";
import { DARKNESS, balanceOf, darkness } from "../balance.mjs";
import { legendOf } from "../blocks.mjs";
import { gutterFor } from "../page.mjs";
import { platesOf } from "../plate.mjs";
import { HOUSE } from "../tokens.mjs";
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
function balanceOfPlate(one, typefaces) {
  const text = (run) => ({
    x: run.x,
    y: run.top,
    width: Math.min(typefaces.measure(run.value, run.style), BODY.width - run.x),
    height: run.style.line,
    kind: /** @type {const} */ ("mass"),
    weight: DARKNESS.text * darkness(run.color),
  });
  const body = { x: 0, y: 0, ...BODY };
  return balanceOf([...one.figure.rects, ...one.figure.runs.map(text)], body, body);
}

/**
 * Compose every view of a model as one plate each. A plate tries its view at
 * every type step and wrapping, with its rows centred over all cards, over the
 * cards inside the boundary, and uncentred, and with tier labels in one column
 * or before the edges their tiers start at. It takes the fewest crossings, then
 * the fewest route defects, then the largest step, then the widest wrapping,
 * then the least of the body left blank. Balance is measured and recorded; a
 * view no composition lays out is refused.
 * @param {any} model
 * @param {import("../../plan/views.mjs").View[]} views
 * @param {any} typefaces
 * @param {any} icons
 */
export function composePlates(model, views, typefaces, icons) {
  const boundaryName = model.repository?.name ?? model.title;
  return views.map((view, index) => {
    const labels = viewRows(view, ROW_LIMIT, () => false).flatMap(({ label }) =>
      label ? [label] : [],
    );
    const column = gutterFor(typefaces, labels);
    const plate = {
      view,
      field: { x: column, y: 0, width: BODY.width - column, height: BODY.height },
      labelColumn: column ? { x: 0, y: 0, width: column, height: BODY.height, floor: 0 } : null,
    };
    const outside = view.components.some((component) => presentation(model, component).outside);
    /** @type {Array<"all" | "inside" | null>} */
    const centrings = outside ? ["all", "inside", null] : ["all", null];
    const candidates = [];
    for (const tierLabels of column ? ["column", "edges"] : ["column"])
      for (const centring of centrings) {
        const [one] = platesOf(
          { model, typefaces, icons, boundaryName, centring, tierLabels },
          plate,
        );
        if (!one) continue;
        const balance = balanceOfPlate(one, typefaces);
        const { crossings, routes } = one.layout.measures;
        const rank = [
          crossings,
          routes,
          -one.step,
          -one.limit,
          one.flat ? 1 : 0,
          balance.holes + balance.emptyShare,
        ];
        candidates.push({ one, centring, tierLabels, balance, rank });
      }
    if (!candidates.length)
      refuse(
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
    const { one, centring, tierLabels, balance } = candidates.sort((a, b) =>
      compare(a.rank, b.rank),
    )[0];
    const { kinds, rest } = legendOf(model, [view], boundaryName);
    return {
      page: index + 1,
      views: [view.id],
      title: view.title,
      question: view.question,
      width: BODY.width,
      height: BODY.height,
      step: one.step,
      svg: [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${BODY.width}" height="${BODY.height}" viewBox="0 0 ${BODY.width} ${BODY.height}">`,
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
