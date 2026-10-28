import { layoutView, placementOf } from "../layout/grid.mjs";
import { ROW_LIMIT, viewRows, wrapRows } from "../layout/rows.mjs";
import { presentation } from "../kinds.mjs";
import { drawFigure } from "./figure.mjs";
import { justify } from "./justify.mjs";
import { measureWidth } from "./blocks.mjs";
import { softSegments } from "./text.mjs";
import { POSTER, figureMetrics, figureStyles } from "./tokens.mjs";

/**
 * One plate: one view's figure in one band of a page. The plate tries every
 * type step and row wrapping, lays each out at its content height, lets the
 * cards take the band's slack within their aspect, justifies the figure into
 * the band and keeps the candidate that fills it most completely and evenly.
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

/** Wrappings and placements already derived, per planned view. */
const wrappings = new WeakMap();
const placements = new WeakMap();

/**
 * The placement of one set of rows at one type step and field width. Placement
 * is the costly half of a layout and does not depend on the card height or the
 * band, so every plate, skeleton and page that asks again for the same view,
 * rows, step, width and centring reuses it, and a growing card reuses it too.
 * @returns {{ placement?: any, error?: any }}
 */
function placementFor(view, rows, metrics, key) {
  if (!placements.has(view)) placements.set(view, new Map());
  const known = placements.get(view);
  if (!known.has(key)) {
    try {
      known.set(key, { placement: placementOf(view, rows, metrics) });
    } catch (error) {
      if (!refusedLayout(error)) throw error;
      known.set(key, { error });
    }
  }
  return known.get(key);
}

/**
 * The layout metrics of one plate. The field decides the card's bounds; the card
 * keeps its content height, so the figure reports how tall it really is.
 */
function candidateMetrics(input) {
  const { model, typefaces, styles, metrics, field, cardFloor = 0 } = input;
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
      maxWidth: Math.min(card.maximumWidth, field.width - 2 * spacing.inset),
      // The page may ask the cards to carry its vertical fill; the layout grows
      // them all to this floor, which the plate never sets above the token's cap.
      minimumHeight: cardFloor,
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
  const { placement, error: unplaced } = placementFor(input.view, rows, input.metrics, input.key);
  if (unplaced) return { rejected: { reason: unplaced.code } };
  let layout;
  try {
    layout = layoutView(input.view, input.metrics, {
      rows,
      placement,
      boundaryName: input.boundaryName,
    });
  } catch (error) {
    // A wrapping the engine cannot wire is one rejected candidate, not a failure
    // of the view: another wrapping or a larger page may still compose.
    const refused = refusedLayout(error);
    if (refused) return { rejected: { reason: refused } };
    throw error;
  }
  if (layout.width > input.field.width + 1)
    return { rejected: { reason: "too_wide", value: layout.width, bound: input.field.width } };
  // Card text never breaks inside a word: a column too narrow for one of its
  // words sets "TransitionPl" over "an", which is not a label a reader can read.
  // A detail may break a path or identifier after a slash or hyphen, never
  // between two letters.
  const broken = brokenText(input, layout.card.width);
  if (broken)
    return { rejected: { reason: broken.reason, value: broken.width, bound: broken.room } };
  // Cards carry the band's vertical fill: the space a figure does not need for
  // its wires is given to its cards, up to the token's cap and no further than
  // the aspect a card still reads as a panel at. Growing a card never changes
  // its width, so the plate keeps its columns and its wires.
  const floor = cardFloor(layout, input.field);
  if (floor > layout.card.height + 0.5) {
    const grown = {
      ...input.metrics,
      card: { ...input.metrics.card, minimumHeight: floor },
    };
    try {
      layout = layoutView(input.view, grown, {
        rows,
        placement,
        boundaryName: input.boundaryName,
      });
    } catch (error) {
      const refused = refusedLayout(error);
      if (refused) return { rejected: { reason: refused } };
      throw error;
    }
  }
  // A card wider than a few times its height is a strip across the page: a line
  // of text in a long box. The check comes after the cards have taken the band's
  // slack, because growing is what turns a one-card row back into a panel; only
  // a strip the band still leaves is a wrapping this format must not print.
  if (layout.card.width > POSTER.cardLimit * layout.card.height)
    return {
      rejected: {
        reason: "too_wide_card",
        value: layout.card.width,
        bound: POSTER.cardLimit * layout.card.height,
      },
    };
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
  // then balanced on its outline but heavy to one side, so it moves across its
  // field just far enough to bring its ink back near the centre line.
  let figure = draw(0);
  const offset = balancingShift(figure.rects, input.field);
  if (offset) figure = draw(offset);
  // Nothing is drawn outside the plate: its field and, for a labelled figure,
  // the column its tier labels sit in.
  const column = input.labelColumn;
  const left = column ? column.x : input.field.x;
  const right = input.field.x + input.field.width;
  const bottom = input.field.y + input.field.height;
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
 * How far to move a drawn figure across its field so that its ink centroid lies
 * within the centring tolerance of the field's centre line, without any of it
 * leaving the field. A figure already within the tolerance keeps its outline
 * centred. Tier labels sit in their own column left of the field and do not
 * move with the figure.
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
 * The card height that lets a laid-out figure fill its band. The rows and the
 * spaces between them keep their size; only the cards grow, up to the cap the
 * tokens set and the aspect a card keeps.
 * @param {any} layout
 * @param {{ width: number, height: number }} field
 */
function cardFloor(layout, field) {
  const rows = layout.rows.length;
  if (!rows) return layout.card.height;
  const fixed = layout.height - rows * layout.card.height;
  const wanted = (field.height - fixed) / rows;
  const byAspect = layout.card.width / POSTER.cardAspect;
  return Math.min(wanted, POSTER.maximumCardHeight, byAspect);
}

/**
 * The first word of a card label wider than the label's line at this card
 * width, or the first piece of a detail wider than the detail's line, or null
 * when every one fits. A label wraps between words only; a detail also after a
 * slash, hyphen, underscore, dot or colon.
 * @param {any} input
 * @param {number} width
 * @returns {{ reason: string, id: string, width: number, room: number } | null}
 */
function brokenText(input, width) {
  const { card } = input.figureMetrics;
  const { typefaces, styles } = input;
  const nameRoom = Math.min(
    width - 2 * card.pad - card.icon - card.iconGap,
    measureWidth(typefaces, styles.name),
  );
  const detailRoom = Math.min(width - 2 * card.pad, measureWidth(typefaces, styles.detail));
  const words = (text) => String(text).split(/\s+/u).filter(Boolean);
  for (const component of input.view.components) {
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
      for (const word of words(`${key}: ${values.join(", ")}`))
        for (const piece of softSegments(word)) {
          const measured = typefaces.measure(piece, styles.detail);
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
    const { placement } = placementFor(
      plate.view,
      rows,
      measured,
      `0|${order}|${plate.field.width}|-`,
    );
    if (!placement) continue;
    try {
      const layout = layoutView(plate.view, measured, {
        rows,
        placement,
        boundaryName: input.boundaryName,
      });
      if (layout.width > plate.field.width + 1) continue;
      if (best === null || layout.height < best) best = layout.height;
    } catch {
      // One wrapping the engine cannot wire says nothing about the others.
      continue;
    }
  }
  return best === null ? null : Math.round(best);
}

/**
 * Every composition of one plate, best first. A page whose text is set around
 * its figure needs more than the plate's own best: the figure that fills its
 * band most may leave no corner for the page's head, and a figure one rank
 * down may leave a page that is fuller overall.
 */
export function platesOf(input, plate) {
  const found = [];
  for (const [index, step] of POSTER.steps.entries()) {
    const styles = figureStyles(step);
    const metrics = figureMetrics(styles);
    for (const [order, { rows, limit, flat }] of wrappingsOf(input.model, plate.view).entries()) {
      const centring = input.centring ?? "all";
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
      const area = plate.field.width * plate.field.height;
      const ink = made.figure.rects.reduce(
        (sum, rect) =>
          sum + Math.min(rect.width, plate.field.width) * Math.min(rect.height, plate.field.height),
        0,
      );
      const off = offCenter(made.figure.rects, plate.field);
      // Each plate is flat: the page needs its figure, and the manifest needs
      // the step and wrapping that produced it.
      found.push({
        fill: ink / area,
        rank: [made.justified.padding ?? 0, off, order],
        step: index,
        plate: { step: index, limit, flat, ...made },
      });
      // A crossing-free wrapping that fills the band at this step leaves no
      // narrower wrapping a better composition to find.
      if (ink / area > 0.98 && made.layout.measures.crossings === 0) break;
    }
  }
  // Wires that cross are a fault a reader sees before any measure of the page,
  // so the compositions with the fewest crossings come first. Among them the
  // plate that fills its band most is the one a reader sees as composed. Cards
  // carry the band's slack, so a sparse figure fills it at every type step;
  // among the compositions within a small margin of the fullest, the larger
  // step comes first, because a card grown to fill its band at the smallest
  // step is a panel of paper around a line of small text. Then the least slack
  // the justification left, the centroid nearest the field's centre and the
  // wider wrapping.
  const crossings = (one) => one.plate.layout.measures.crossings;
  const fewest = Math.min(...found.map(crossings));
  const clean = found.filter((one) => crossings(one) === fewest);
  const fullest = Math.max(...clean.map(({ fill }) => fill));
  const near = (one) => one.fill >= fullest - FILL_MARGIN;
  return found
    .sort(
      (a, b) =>
        crossings(a) - crossings(b) ||
        Number(near(b)) - Number(near(a)) ||
        (near(a) ? b.step - a.step : b.fill - a.fill) ||
        compare(a.rank, b.rank),
    )
    .map(({ plate: one }) => one);
}

/** Compositions this close to the fullest in a band count as filling it. */
const FILL_MARGIN = 0.02;

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
