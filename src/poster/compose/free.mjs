import { atoms } from "../../breaks.mjs";
import { presentation } from "../../kinds.mjs";
import { measureLayout } from "../../layout/measure.mjs";
import { wordsOf } from "../../locale.mjs";
import { drawFigure } from "../figure.mjs";
import { partBoxes } from "../part.mjs";
import { POSTER, figureMetrics, figureStyles } from "../tokens.mjs";
import { balanceOfPlate, gateFailures } from "./gates.mjs";

/**
 * A figure drawn off the grid: what a composition that places its own cards and lines (the radial figure,
 * `radial.mjs`) needs to size, measure and draw them as every plate is drawn. Its cards are the parts' own boxes at
 * one type step, as wide as their text, which `partBoxes` gives a plate in tiers too; its relation labels are set as
 * the grid sets them; its lines run from card to card at any slant. It is measured by the layout's measure
 * (`src/layout/measure.mjs`), which reads a line at a slant along its own line, so its crossings and route defects
 * and those of a figure in tiers count alike; and it is drawn by the grid's figure drawing (`drawFigure`) from a
 * layout of the grid's shape, so cards, strips, lines, arrowheads, counts, labels and the boundary look as on every
 * plate.
 */

/**
 * Why a figure off the grid is not drawn, in the order its layout meets them: its cards do not stand apart in the
 * box or a card's word is wider than its card; its boundary cannot hold its own parts and no other; a line would pass
 * through a card or run along another relation's line; a label finds no place clear of the cards, the other labels
 * and the other lines. Where no layout is drawn, the plate records the furthest any of them came.
 */
export const FAULTS = Object.freeze(["cards", "boundary", "lines", "labels"]);

/**
 * A free layout's wiring by the layout's measure, and its first fault (`FAULTS`), or null where it may be drawn: the
 * measure's defects are lines through a card or along another line, and labels over a card, another label, another
 * relation's line or the boundary's edge; a label its composition found no place for is one too.
 * @param {{ cards: Map<string, { x: number, y: number, width: number, height: number }>,
 *   paths: Array<{ relations: Array<{ id: string }>, points: number[][] }>,
 *   labels: Array<{ relations: Array<{ id: string }>, x: number, y: number, width: number, height: number }>,
 *   arrows: Array<{ relations: Array<{ id: string }>, x: number, y: number }>, arrow: number,
 *   boundary: { x: number, y: number, width: number, height: number } | null, unplaced: string[] }} layout
 */
export function measureFree(layout) {
  const { crossings, bends, defects, routes } = measureLayout(layout, { slanting: true });
  /** @type {Set<string>} */
  const faults = new Set(
    defects.map(({ code }) => (code === "layout_label_collision" ? "labels" : "lines")),
  );
  if (layout.unplaced.length) faults.add("labels");
  return {
    crossings,
    bends,
    routes: routes.length,
    routeDefects: routes,
    fault: FAULTS.find((fault) => faults.has(fault)) ?? null,
  };
}

/**
 * The cards of a view's parts at one type step, each as large as its text: its width as the grid gives a card its
 * natural width, its height as its text sets at that width; with `details`, the details its part states. Null when a
 * word of a card's text is wider than its card.
 * @param {{ model: any, typefaces: any, style: any }} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {number} index the type step
 * @param {boolean} details
 */
export function cardsAt(scene, view, index, details) {
  const { model, typefaces, style } = scene;
  const styles = figureStyles(POSTER.steps[index]);
  const metrics = figureMetrics(styles);
  const boxes = partBoxes({
    model,
    typefaces,
    styles,
    card: metrics.card,
    style,
    details,
    caption: "fit",
  });
  /** @type {Map<string, { width: number, height: number }>} */
  const sizes = new Map();
  for (const component of view.components) {
    const width = Math.min(metrics.card.maximumWidth, boxes.width(component));
    if (boxes.broken(component, width)) return null;
    sizes.set(component.id, { width, height: boxes.height(component, width) });
  }
  const words = wordsOf(model.locale);
  const { wire } = metrics;
  /**
   * A relation's label box, as the grid sets it: its label and its details wrapped within the widest label, or
   * within a narrower `most` where its line has less room. `broken` where a word of the label is wider than that.
   */
  const label = (relation, most = wire.maximumLabel) => {
    const width = Math.min(most, wire.maximumLabel);
    const lines = [
      ...typefaces
        .wrap(relation.label, width, styles.edge)
        .map((text) => ({ text, role: "label" })),
      ...relation.details.flatMap(([key, values]) =>
        typefaces
          .detailLines(words, key, values, width, styles.edgeDetail)
          .map((text) => ({ text, role: "detail" })),
      ),
    ];
    const measured = Math.max(
      ...lines.map(({ text, role }) =>
        typefaces.measure(text, role === "label" ? styles.edge : styles.edgeDetail),
      ),
    );
    return {
      width: Math.ceil(measured) + 2 * wire.labelPadX,
      height: lines.length * styles.edge.line + 2 * wire.labelPadY,
      lines,
      broken: atoms(relation.label).some(
        ({ text }) => typefaces.measure(text, styles.edge) > width,
      ),
    };
  };
  const outside = (id) =>
    presentation(model, /** @type {any} */ (view.components.find((one) => one.id === id))).outside;
  return { index, details, styles, metrics, boxes, sizes, label, outside };
}

/**
 * The relations of a view a figure off the grid draws: each between two different parts of the view.
 * @param {import("../../plan/views.mjs").View} view
 */
export const drawnRelations = (view) => {
  const ids = new Set(view.components.map(({ id }) => id));
  return view.relations.filter(({ from, to }) => from !== to && ids.has(from) && ids.has(to));
};

/** The direction an arrowhead at the end of a stretch points: a word across or down, its unit step at a slant. */
export function headingOf(from, to) {
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  if (Math.abs(dx) < 0.5) return dy > 0 ? "down" : "up";
  if (Math.abs(dy) < 0.5) return dx > 0 ? "right" : "left";
  const length = Math.hypot(dx, dy);
  return [dx / length, dy / length];
}

/**
 * Draw a free layout as a plate's figure, in a field at the body's origin, by the grid's figure drawing; with its
 * balance on the body as a plate's (`balanceOfPlate`), the gates it misses, and a fault where anything it draws, its
 * boundary's stroke included, reaches past the plate's edge.
 * @param {{ model: any, typefaces: any, icons: any, style: any }} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {NonNullable<ReturnType<typeof cardsAt>>} cards
 * @param {any} layout
 * @param {{ width: number, height: number }} field
 */
export function drawFree(scene, view, cards, layout, field) {
  const { model, typefaces, icons, style } = scene;
  const { width, height } = field;
  const figure = drawFigure(
    { ...layout, labelled: false, rows: [], width, height },
    {
      model,
      view,
      styles: cards.styles,
      metrics: cards.metrics,
      icons,
      typefaces,
      field: { x: 0, y: 0, width, height },
      labelColumn: null,
      style,
      cardText: cards.boxes.text,
    },
  );
  const balance = balanceOfPlate({ figure }, typefaces, width, height, style.tokens.palette.paper);
  const past = (/** @type {{ x: number, y: number, width: number, height: number }} */ rect) =>
    rect.x < -2 ||
    rect.y < -2 ||
    rect.x + rect.width > width + 2 ||
    rect.y + rect.height > height + 2;
  const fault =
    figure.stroked && past(figure.stroked) ? "boundary" : figure.rects.some(past) ? "cards" : null;
  return { figure, balance, misses: gateFailures(balance), fault };
}

/**
 * The order of a figure's candidates, as the grid orders its own: the fewest crossings, then the fewest route
 * defects, then the largest type step; then the fewest gates missed, the least blank, and compact cards before
 * detailed ones.
 */
export const rankFree = (candidate) => [
  candidate.measured.crossings,
  candidate.measured.routes,
  -candidate.cards.index,
  candidate.drawn.misses.length,
  candidate.drawn.balance.emptyShare + candidate.drawn.balance.holes,
  candidate.cards.details ? 1 : 0,
];

/** Two ranks compared in order, as numbers. */
export const compareRanks = (a, b) => {
  for (let index = 0; index < a.length; index += 1)
    if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
};
