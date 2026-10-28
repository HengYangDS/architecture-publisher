import { layoutView, placementOf } from "../layout/grid.mjs";
import { ROW_LIMIT, viewRows, wrapRows } from "../layout/rows.mjs";
import { presentation } from "../kinds.mjs";
import { drawFigure } from "./figure.mjs";
import { justify } from "./justify.mjs";
import { measureWidth } from "./blocks.mjs";
import { POSTER, figureMetrics, figureStyles } from "./tokens.mjs";

/**
 * One plate: one view's figure in one band of a page. The plate tries every
 * type step and row wrapping, lays each out with cards as large as their text
 * and no larger, justifies the figure into the band and orders the candidates
 * as figures. A band the figure cannot fill is not filled by stretching its
 * cards: a page fills by what it carries.
 */

/** Row wrappings tried for every view, widest first. */
const LIMITS = Object.freeze([ROW_LIMIT, 4, 3, 2, 1]);

/**
 * Every distinct set of rows a plate tries for a view: its rows wrapped at each
 * limit, and for rows that follow its relations, the flatter rows the row engine
 * draws when a further row costs more, so a chain of single cards can run along
 * a row of a wide page instead of down a column of its own. Each set keeps the
 * limit and shape that produced it, for the manifest.
 * @returns {Array<{ rows: import("../layout/rows.mjs").Row[], limit: number, flat: boolean }>}
 */
function wrappingsOf(model, view) {
  if (wrappings.has(view)) return /** @type {any} */ (wrappings.get(view));
  // The row engine asks about components by id, so the predicate answers by id.
  const components = new Map(view.components.map((component) => [component.id, component]));
  const outside = (id) => presentation(model, components.get(id)).outside;
  const shapes = view.tiers ? [false] : [false, true];
  const seen = new Set();
  const out = [];
  for (const flat of shapes) {
    const rows = viewRows(view, ROW_LIMIT, outside, { flat });
    for (const limit of LIMITS) {
      const wrapped = wrapRows(rows, limit);
      const key = JSON.stringify(wrapped.map(({ members }) => members));
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ rows: wrapped, limit, flat });
    }
  }
  wrappings.set(view, out);
  return out;
}

/**
 * The code of a layout refusal, or null for any other error: a refusal names a
 * candidate the engine cannot lay out, and every other error is a fault.
 * @param {unknown} error
 * @returns {string | null}
 */
function refusedLayout(error) {
  const code = /** @type {{ code?: unknown }} */ (error)?.code;
  return typeof code === "string" && code.startsWith("layout_") ? code : null;
}

/** Wrappings and layouts already derived, per planned view. */
const wrappings = new WeakMap();
const layouts = new WeakMap();

/**
 * The layout of one set of rows at one type step and field width. A layout's
 * placement and channel routing depend on nothing else — not on the band, the
 * page or where the figure is drawn — so every plate, skeleton and page that
 * asks again for the same view, rows, step, width and centring reuses it.
 * @returns {{ layout?: any, error?: any }}
 */
function layoutFor(view, rows, metrics, key, boundaryName) {
  if (!layouts.has(view)) layouts.set(view, new Map());
  const known = layouts.get(view);
  if (!known.has(key)) {
    try {
      const placement = placementOf(view, rows, metrics);
      known.set(key, { layout: layoutView(view, metrics, { rows, placement, boundaryName }) });
    } catch (error) {
      if (!refusedLayout(error)) throw error;
      known.set(key, { error });
    }
  }
  return known.get(key);
}

/**
 * How wide one card is at one type step: wide enough to set its label and each
 * of its details on one line, within the card measures, and no wider. A card as
 * wide as its field divides into is a panel of paper around a short line; a
 * card as wide as its text reads as a card.
 * @param {any} component
 * @param {any} typefaces
 * @param {any} styles
 * @param {any} card the card metrics at this step
 */
function cardWidthOf(component, typefaces, styles, card) {
  const name = POSTER.cardMeasure.name * styles.name.size;
  const detail = POSTER.cardMeasure.detail * styles.detail.size;
  const width = Math.max(
    card.minimumWidth,
    Math.min(typefaces.measure(component.label, styles.name), name) +
      card.icon +
      card.iconGap +
      2 * card.pad,
    ...component.details.map(
      ([key, values]) =>
        Math.min(typefaces.measure(`${key}: ${values.join(", ")}`, styles.detail), detail) +
        2 * card.pad,
    ),
  );
  return Math.ceil(width / 8) * 8;
}

/** How wide a view's widest card is at one type step. */
function naturalWidth(view, typefaces, styles, card) {
  return Math.max(
    card.minimumWidth,
    ...view.components.map((component) => cardWidthOf(component, typefaces, styles, card)),
  );
}

/**
 * The layout metrics of one plate. The field bounds the cards and their text
 * sets their width; every card keeps its content height, so the figure reports
 * how large it really is.
 */
function candidateMetrics(input) {
  const { model, view, typefaces, styles, metrics, field } = input;
  const { card, wire, spacing } = metrics;
  const cardText = (component, width) => ({
    name: typefaces.wrap(
      component.label,
      Math.min(
        width - 2 * card.pad - card.icon - card.iconGap,
        measureWidth(typefaces, styles.name),
      ),
      styles.name,
    ),
    details: component.details.flatMap(([key, values]) =>
      typefaces.detailLines(
        key,
        values,
        Math.min(width - 2 * card.pad, measureWidth(typefaces, styles.detail)),
        styles.detail,
      ),
    ),
  });
  return {
    // The field already excludes the tier-label column, so it is the content width.
    contentWidth: () => field.width,
    card: {
      minWidth: card.minimumWidth,
      maxWidth: Math.min(
        card.maximumWidth,
        field.width - 2 * spacing.inset,
        naturalWidth(view, typefaces, styles, card),
      ),
      natural: (component) => cardWidthOf(component, typefaces, styles, card),
      height: (component, width) => {
        const { name, details } = cardText(component, width);
        return (
          2 * card.pad +
          name.length * styles.name.line +
          (details.length ? card.detailGap + details.length * styles.detail.line : 0)
        );
      },
    },
    cardText,
    label: (relation, maxWidth = wire.maximumLabel) => {
      const width = Math.min(maxWidth, wire.maximumLabel);
      const lines = [
        ...typefaces
          .wrap(relation.label, width, styles.edge)
          .map((text) => ({ text, role: "label" })),
        ...relation.details.flatMap(([key, values]) =>
          typefaces
            .detailLines(key, values, width, styles.edgeDetail)
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
      };
    },
    external: (component) => presentation(model, component).outside,
    // The poster draws its own wires, so a long relation may run around the cards.
    lanes: true,
    arrow: wire.arrow,
    spacing,
  };
}

/**
 * Lay out and draw one plate: one view in one band. A candidate that cannot be
 * wired or does not fit its band is rejected with the measured reason.
 * @returns {{ made?: any, rejected?: { reason: string, value?: number, bound?: number } }}
 */
function attempt(input) {
  const { rows } = input;
  // A wrapping the engine cannot wire is one rejected candidate, not a failure
  // of the view: another wrapping or a larger page may still compose.
  const { layout, error } = layoutFor(
    input.view,
    rows,
    input.metrics,
    input.key,
    input.boundaryName,
  );
  if (error) return { rejected: { reason: error.code } };
  if (layout.width > input.field.width + 1)
    return { rejected: { reason: "too_wide", value: layout.width, bound: input.field.width } };
  // Card text never breaks inside a word: a column too narrow for one of its
  // words sets "TransitionPl" over "an", which is not a label a reader can read,
  // and a path or identifier split after a slash or hyphen reads as two names.
  const broken = brokenText(input, layout);
  if (broken)
    return { rejected: { reason: broken.reason, value: broken.width, bound: broken.room } };
  const justified = justify(layout, input.field.height, { bound: POSTER.channelBound });
  if (justified.height > input.field.height + 1)
    return { rejected: { reason: "too_tall", value: justified.height, bound: input.field.height } };
  const draw = (offset) =>
    drawFigure(justified, {
      model: input.model,
      view: input.view,
      styles: input.styles,
      metrics: input.figureMetrics,
      icons: input.icons,
      typefaces: input.typefaces,
      field: input.field,
      labelColumn: input.labelColumn ?? null,
      offset,
      cardText: input.metrics.cardText,
    });
  // The layout centres the span of its cards. A figure whose single-card rows
  // stand off the middle of its wide rows, or whose wires run down one side, is
  // then balanced on its outline but heavy to one side, and a figure whose tier
  // labels are set beside its rows leaves the label column empty; so the figure
  // moves across its plate just far enough to bring its ink, labels included,
  // back near the plate's centre line. Labels beside their rows move with it,
  // and it may move into the label column only while no label touches it there;
  // otherwise it is balanced within its field alone.
  const column = input.labelColumn;
  const left = column ? column.x : input.field.x;
  const right = input.field.x + input.field.width;
  const bottom = input.field.y + input.field.height;
  let figure = draw(0);
  const offset = balancingShift(figure.rects, { x: left, width: right - left });
  if (offset) {
    const moved = draw(offset);
    if (labelsClear(moved.rects)) figure = moved;
    else {
      const within = balancingShift(
        figure.rects.filter((rect) => !rect.tier),
        input.field,
      );
      if (within) figure = draw(within);
    }
  }
  // Nothing is drawn outside the plate: its field and, for a labelled figure,
  // the column its tier labels sit in.
  const outside = figure.rects.find(
    (rect) =>
      rect.x < left - 2 ||
      rect.y < input.field.y - 2 ||
      rect.x + rect.width > right + 2 ||
      rect.y + rect.height > bottom + 2,
  );
  if (outside) return { rejected: { reason: "outside_field" } };
  return { made: { rows, layout, justified, figure } };
}

/**
 * How far to move a drawn figure across its span so that its ink centroid lies
 * within the centring tolerance of the span's centre line, without any of it
 * leaving the span. A figure already within the tolerance keeps its outline
 * centred.
 * @param {Array<{ x: number, y: number, width: number, height: number }>} rects
 * @param {{ x: number, width: number }} field
 */
function balancingShift(rects, field) {
  let mass = 0;
  let moment = 0;
  let left = Infinity;
  let right = -Infinity;
  for (const rect of rects) {
    if (rect.x + rect.width <= field.x) continue;
    const area = rect.width * rect.height;
    mass += area;
    moment += area * (rect.x + rect.width / 2);
    left = Math.min(left, rect.x);
    right = Math.max(right, rect.x + rect.width);
  }
  if (!mass) return 0;
  const off = field.x + field.width / 2 - moment / mass;
  const wanted = Math.sign(off) * Math.max(0, Math.abs(off) - POSTER.centreTolerance * field.width);
  return Math.round(Math.max(field.x - left, Math.min(field.x + field.width - right, wanted)));
}

/**
 * Whether every tier label of a drawn figure keeps clear of its cards, wires
 * and relation labels.
 * @param {Array<{ x: number, y: number, width: number, height: number, tier?: boolean }>} rects
 */
function labelsClear(rects) {
  const labels = rects.filter((rect) => rect.tier);
  const others = rects.filter((rect) => !rect.tier);
  return labels.every((label) =>
    others.every(
      (other) =>
        label.x >= other.x + other.width ||
        other.x >= label.x + label.width ||
        label.y >= other.y + other.height ||
        other.y >= label.y + label.height,
    ),
  );
}

/**
 * The first word of a card's label or details wider than the line it is set
 * on at that card's width, or null when every one fits. Card text wraps between
 * words only, so every word of a card must fit the card.
 * @param {any} input
 * @param {any} layout the layout, with every card's width
 * @returns {{ reason: string, id: string, width: number, room: number } | null}
 */
function brokenText(input, layout) {
  const { card } = input.figureMetrics;
  const { typefaces, styles } = input;
  const words = (text) => String(text).split(/\s+/u).filter(Boolean);
  for (const component of input.view.components) {
    const width = layout.cards.get(component.id)?.width ?? layout.card.width;
    const nameRoom = Math.min(
      width - 2 * card.pad - card.icon - card.iconGap,
      measureWidth(typefaces, styles.name),
    );
    const detailRoom = Math.min(width - 2 * card.pad, measureWidth(typefaces, styles.detail));
    for (const word of words(component.label)) {
      const measured = typefaces.measure(word, styles.name);
      if (measured > nameRoom)
        return {
          reason: "label_broken",
          id: component.id,
          width: Math.ceil(measured),
          room: Math.floor(nameRoom),
        };
    }
    for (const [key, values] of component.details)
      for (const word of words(`${key}: ${values.join(", ")}`)) {
        const measured = typefaces.measure(word, styles.detail);
        if (measured > detailRoom)
          return {
            reason: "detail_broken",
            id: component.id,
            width: Math.ceil(measured),
            room: Math.floor(detailRoom),
          };
      }
  }
  return null;
}

/**
 * How tall one plate's figure naturally is: the shortest figure the plate can
 * draw at the densest step, over every wrapping that keeps its cards cards.
 * A band plan built on these heights never asks a plate for less than it needs,
 * so a grouping whose figures do not fit the page is refused instead of being
 * squeezed into bands that cannot hold them.
 * @param {any} input
 * @param {any} plate
 * @returns {number | null} null when no wrapping of this view composes
 */
export function naturalOf(input, plate) {
  const styles = figureStyles(POSTER.steps[0]);
  const metrics = figureMetrics(styles);
  let best = null;
  for (const [order, { rows }] of wrappingsOf(input.model, plate.view).entries()) {
    const measured = candidateMetrics({
      model: input.model,
      view: plate.view,
      typefaces: input.typefaces,
      styles,
      metrics,
      field: plate.field,
    });
    // One wrapping the engine cannot wire says nothing about the others.
    const { layout } = layoutFor(
      plate.view,
      rows,
      measured,
      `0|${order}|${plate.field.width}|-`,
      input.boundaryName,
    );
    if (!layout || layout.width > plate.field.width + 1) continue;
    if (best === null || layout.height < best) best = layout.height;
  }
  return best === null ? null : Math.round(best);
}

/** Figure widths already measured, per planned view. */
const extents = new WeakMap();

/**
 * How wide one view's figure is at the densest step when nothing asks it to
 * spread: the span of its cards and boundary at their own widths, with the
 * token gaps between them, in its most natural wrapping. Plates that share a
 * band divide it in proportion to these widths.
 * @param {any} input
 * @param {any} view
 * @returns {number}
 */
export function extentOf(input, view) {
  if (extents.has(view)) return extents.get(view);
  const styles = figureStyles(POSTER.steps[0]);
  const metrics = figureMetrics(styles);
  const field = { x: 0, y: 0, width: POSTER.width - 2 * POSTER.margin, height: POSTER.height };
  const measured = candidateMetrics({
    model: input.model,
    view,
    typefaces: input.typefaces,
    styles,
    metrics,
    field,
  });
  const fixed = { ...measured, spacing: { ...measured.spacing, columnSpread: 1 } };
  let width = field.width;
  for (const [order, { rows }] of wrappingsOf(input.model, view).entries()) {
    const { layout } = layoutFor(view, rows, fixed, `extent|${order}`, input.boundaryName);
    if (!layout) continue;
    const cards = [...layout.cards.values()];
    const left = Math.min(...cards.map((card) => card.x), layout.boundary?.x ?? Infinity);
    const right = Math.max(
      ...cards.map((card) => card.x + card.width),
      layout.boundary ? layout.boundary.x + layout.boundary.width : -Infinity,
    );
    width = Math.ceil(right - left + 2 * metrics.spacing.inset);
    break;
  }
  extents.set(view, width);
  return width;
}

/**
 * Every composition of one plate, best first. A page whose text is set around
 * its figure needs more than the plate's own best: the best figure may leave no
 * corner for the page's head, and a figure one rank down may balance the page.
 */
export function platesOf(input, plate) {
  const found = [];
  for (const [index, step] of POSTER.steps.entries()) {
    const styles = figureStyles(step);
    const metrics = figureMetrics(styles);
    for (const [order, { rows, limit, flat }] of wrappingsOf(input.model, plate.view).entries()) {
      const { centring } = input;
      const fields = {
        model: input.model,
        view: plate.view,
        typefaces: input.typefaces,
        icons: input.icons,
        styles,
        rows,
        key: `${index}|${order}|${plate.field.width}|${centring}`,
        field: plate.field,
        labelColumn: plate.labelColumn,
        boundaryName: input.boundaryName,
        figureMetrics: metrics,
        metrics: {
          ...candidateMetrics({
            model: input.model,
            view: plate.view,
            typefaces: input.typefaces,
            styles,
            metrics,
            field: plate.field,
          }),
          centring,
        },
      };
      const { made } = attempt(fields);
      if (!made) continue;
      // Each plate is flat: the page needs its figure, and the manifest needs
      // the step and wrapping that produced it.
      found.push({
        rank: [
          made.layout.measures.crossings,
          made.layout.measures.routes,
          -index,
          order,
          offCenter(made.figure.rects, plate.field),
        ],
        plate: { step: index, limit, flat, ...made },
      });
    }
  }
  // A plate offers every wrapping it can draw, ordered as figures. Wires that
  // cross, run together or carry another's label are faults a reader sees
  // before anything else, so the compositions with the fewest come first; then
  // the largest type step, because
  // the same figure set larger reads from further away; then the widest rows,
  // layered before flatter ones, so the page splits a row only when the figure
  // its widest rows make leaves the page unbalanced; then the centroid nearest
  // the field's centre. Filling the page is the page's work: it sets larger
  // type, takes a narrower wrapping, groups views and sets its text beside the
  // figure.
  found.sort((a, b) => compare(a.rank, b.rank));
  return found.map(({ plate: one }) => one);
}

const compare = (a, b) => {
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
};

/**
 * How far a drawn plate's ink mass sits from its field's centre, as a share of
 * the field. It ranks candidates inside one plate, where the field is fixed, so
 * a wrapping or step that piles the cards to one side loses to one that does not.
 * @param {{ x: number, y: number, width: number, height: number }[]} rects
 * @param {{ x: number, y: number, width: number, height: number }} field
 */
function offCenter(rects, field) {
  let mass = 0;
  let mx = 0;
  let my = 0;
  for (const rect of rects) {
    const width = Math.max(0, Math.min(rect.width, field.x + field.width - rect.x));
    const height = Math.max(0, Math.min(rect.height, field.y + field.height - rect.y));
    const area = width * height;
    if (area <= 0) continue;
    mass += area;
    mx += area * (Math.max(rect.x, field.x) + width / 2);
    my += area * (Math.max(rect.y, field.y) + height / 2);
  }
  if (!mass) return 0;
  const dx = (mx / mass - (field.x + field.width / 2)) / field.width;
  const dy = (my / mass - (field.y + field.height / 2)) / field.height;
  return Math.hypot(dx, dy);
}
