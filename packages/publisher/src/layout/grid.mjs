import { refuse } from "../refusal.mjs";
import { solveChannel } from "./channel-solver.mjs";
import { buildWires, channelGeometry, spreadPorts, straighten } from "./channels.mjs";
import { measureLayout } from "./measure.mjs";
import { placeRows, splitCrossedBuses } from "./placement.mjs";
import { ROW_LIMIT, viewRows } from "./rows.mjs";

/**
 * Lay out one view on the grid with one medium's metrics. Coordinates are local:
 * x runs from 0 to the content width, y from 0 to the returned height.
 *
 * @typedef {{ width: number, height: number, lines: Array<{ text: string, role: "label" | "detail" }> }} LabelBox
 * @typedef {{
 *   contentWidth: (labelled: boolean) => number,
 *   card: { minWidth: number, maxWidth: number,
 *     height: (component: any, width: number) => number },
 *   label: (relation: any, maxWidth?: number) => LabelBox,
 *   external: (component: any) => boolean,
 *   centring?: "all" | "inside",
 *   spacing: { column: number, columnSpread?: number, inset: number, stub: number, track: number, bandGap: number,
 *     arrowStub: number, labelGap: number, labelRowGap: number, portSpacing: number, portMargin: number,
 *     minJog: number, clear: number, minChannel: number, rowPad: number, boundaryPad: number,
 *     boundaryBottom: number, boundaryHead: number }
 * }} Metrics
 */

/** Port spacings tried for a channel, smallest first. */
const PORT_GAPS = [null, 64, 96, 140];

/**
 * Placement of one set of rows on the grid: the expensive half of a layout, and
 * the half that does not depend on card height or channel depth, so a
 * composition that tries several card heights pays for it once.
 * @param {import("../plan/views.mjs").View} view
 * @param {import("./rows.mjs").Row[]} rows
 * @param {Metrics} metrics
 */
export function placementOf(view, rows, metrics) {
  const { spacing } = metrics;
  const components = new Map(view.components.map((component) => [component.id, component]));
  const external = (id) => metrics.external(components.get(id));
  const labelled = rows.some(({ label }) => label);
  const contentWidth = metrics.contentWidth(labelled);
  const placement = placeRows({
    rows: rows.map(({ members }) => members),
    relations: view.relations.filter(({ from, to }) => from !== to),
    order: new Map(view.components.map(({ id }, index) => [id, index])),
    external,
    // A row beside the row-label column holds one card fewer.
    rowLimit: labelled ? ROW_LIMIT - 1 : ROW_LIMIT,
    contentWidth,
    card: metrics.card,
    columnGap: spacing.column,
    spread: spacing.columnSpread ?? 1,
    inset: spacing.inset,
    clearance: spacing.clear,
    labelWidth: (relation, maxWidth) => metrics.label(relation, maxWidth).width,
    centring: metrics.centring ?? null,
  });
  return { ...placement, labelled, contentWidth };
}

/**
 * @param {import("../plan/views.mjs").View} view
 * @param {Metrics} metrics
 * @param {{ boundaryName?: string | null, rows?: import("./rows.mjs").Row[],
 *   placement?: ReturnType<typeof placementOf> }} [options]
 */
export function layoutView(view, metrics, options = {}) {
  const { spacing } = metrics;
  const components = new Map(view.components.map((component) => [component.id, component]));
  const external = (id) => metrics.external(components.get(id));
  const rows = options.rows ?? viewRows(view, ROW_LIMIT, external);
  const placement = options.placement ?? placementOf(view, rows, metrics);
  const { labelled, contentWidth } = placement;
  const { width: cardWidth, pitch, interval } = placement;
  const order = placement.order;
  // Every card of a row is as tall as the row's tallest text, so a row reads on
  // one line; rows differ, so a row of names is not as tall as the row with the
  // most detail.
  const rowHeights = order.map((members) =>
    Math.max(0, ...members.map((id) => metrics.card.height(components.get(id), cardWidth))),
  );
  const used = [...placement.position.values()];
  const usedSpan = ((Math.max(...used) - Math.min(...used)) / 2) * pitch + cardWidth;
  const gridLeft = (contentWidth - usedSpan) / 2 - (Math.min(...used) / 2) * pitch;
  const columnX = (position) => gridLeft + (position / 2) * pitch;
  const box = new Map(
    [...placement.position].map(([id, position]) => [
      id,
      { x: columnX(position), cx: columnX(position) + cardWidth / 2 },
    ]),
  );
  const internal = rows.map((_, index) => order[index].some((id) => !external(id)));
  const first = internal.indexOf(true);
  const last = internal.lastIndexOf(true);
  const bounded = first >= 0 && interval !== null;
  const insiders = bounded
    ? order
        .slice(first, last + 1)
        .flat()
        .filter((id) => !external(id))
    : [];
  const frame = bounded
    ? /** @type {[number, number]} */ ([
        Math.min(...insiders.map((id) => /** @type {any} */ (box.get(id)).x)) - spacing.boundaryPad,
        Math.max(...insiders.map((id) => /** @type {any} */ (box.get(id)).x)) +
          cardWidth +
          spacing.boundaryPad,
      ])
    : null;
  const classes = splitCrossedBuses(
    placement.relations,
    (id) => /** @type {any} */ (box.get(id)).cx,
    rows.length,
  );
  const wiring = buildWires({
    order,
    classes,
    box,
    cardWidth,
    rowHeights,
    contentWidth,
    columns: placement.columns,
    pitch,
    gridLeft,
    slots: placement.slots,
    frame,
    spacing,
    label: metrics.label,
  });
  // A one-row view's U wires run in a trailing channel below the row, inside the boundary.
  const trailing = wiring.channels.length === rows.length;
  for (const channel of wiring.channels)
    channel.edges =
      frame && ((channel.index >= first && channel.index < last) || trailing) ? frame : [];
  spreadPorts(wiring.sides, box, cardWidth, spacing, spacing.portSpacing);
  straighten(wiring.wires, wiring.sides, box, cardWidth, spacing);
  const solutions = wiring.channels.map((channel) =>
    routeChannel(channel, wiring, box, cardWidth, spacing),
  );

  // Rows and channels from top to bottom; the boundary edge adds its padding to the channel it crosses.
  const head = bounded ? spacing.boundaryPad + spacing.boundaryHead : 0;
  const rowTop = [];
  const offsets = [];
  let cursor = spacing.rowPad + (bounded && first === 0 ? head : 0);
  for (let index = 0; index < rows.length; index += 1) {
    rowTop[index] = cursor;
    if (index < rows.length - 1) {
      const above = bounded && index === last ? spacing.boundaryBottom + 8 : 0;
      const below = bounded && index + 1 === first ? head + 8 : 0;
      offsets.push(above);
      cursor += rowHeights[index] + above + solutions[index].height + below;
    }
  }
  const below = trailing ? solutions[rows.length - 1].height : 0;
  const height =
    rowTop[rows.length - 1] +
    rowHeights[rows.length - 1] +
    below +
    spacing.rowPad +
    (bounded && last === rows.length - 1 ? spacing.boundaryBottom : 0);
  const cards = new Map(
    [...box].map(([id, { x }]) => {
      const row = /** @type {number} */ (classes.rowOf.get(id));
      return [id, { x, y: rowTop[row], width: cardWidth, height: rowHeights[row] }];
    }),
  );

  const paths = [];
  const labels = [];
  const arrows = [];
  const channels = [];
  wiring.channels.forEach((channel, index) => {
    const top = rowTop[index] + rowHeights[index];
    const bottom = rowTop[index + 1] ?? top + solutions[index].height;
    const geometry = channelGeometry(
      channel,
      solutions[index],
      top,
      bottom,
      offsets[index] ?? 0,
      spacing,
    );
    paths.push(...geometry.paths);
    labels.push(...geometry.labels);
    arrows.push(...geometry.arrows);
    channels.push({
      index,
      top,
      bottom,
      labelRows: geometry.labelRows,
      crossings: solutions[index].crossings,
    });
  });
  for (const {
    relation,
    x,
    rows: [from, to],
  } of wiring.passages)
    for (let row = from; row <= to; row += 1)
      paths.push({
        relations: [relation],
        points: [
          [x, rowTop[row]],
          [x, rowTop[row] + rowHeights[row]],
        ],
      });
  for (const { relation, left, right, label, fromLeft, row } of wiring.straights) {
    const y = rowTop[row] + rowHeights[row] / 2;
    paths.push({
      relations: [relation],
      points: [
        [left.x + cardWidth, y],
        [right.x, y],
      ],
    });
    arrows.push(
      fromLeft
        ? { relations: [relation], x: right.x, y, direction: "right" }
        : { relations: [relation], x: left.x + cardWidth, y, direction: "left" },
    );
    let center = (left.x + cardWidth + right.x) / 2;
    // A label in a gap that the boundary crosses moves to the side of the gap away from the edge.
    if (frame)
      for (const edge of frame)
        if (Math.abs(center - edge) < label.width / 2 + 8)
          center =
            edge < center
              ? Math.max(center, edge + label.width / 2 + 10)
              : Math.min(center, edge - label.width / 2 - 10);
    labels.push({
      relations: [relation],
      x: center - label.width / 2,
      y: y - label.height / 2,
      width: label.width,
      height: label.height,
      lines: label.lines,
      row,
    });
  }
  /** @type {{ x: number, y: number, width: number, height: number, name: string | null } | null} */
  let boundary = null;
  if (frame) {
    const y = rowTop[first] - head;
    boundary = {
      x: frame[0],
      y,
      width: frame[1] - frame[0],
      height: rowTop[last] + rowHeights[last] + below + spacing.boundaryBottom - y,
      name: options.boundaryName ?? null,
    };
  }
  const geometry = {
    width: contentWidth,
    height,
    labelled,
    card: { width: cardWidth, height: Math.max(...rowHeights) },
    rows: rows.map((row, index) => ({
      ...row,
      members: order[index],
      top: rowTop[index],
      height: rowHeights[index],
    })),
    cards,
    paths,
    labels,
    arrows,
    channels,
    boundary,
  };
  // Paths are relative to the view; the plan names the view the refusal belongs to.
  const measures = measureLayout(geometry);
  if (measures.defects.length)
    refuse(
      "layout_untidy",
      "The view cannot be drawn without overlaps. Reorder its tiers or split the view.",
      measures.defects.map((defect) => ({
        code: defect.code,
        path: "",
        message: `${defect.message} (${defect.relations ?? defect.card})`,
      })),
    );
  return { ...geometry, measures: { crossings: measures.crossings, bends: measures.bends } };
}

/** Solve one channel, widening port spacing only when the default leaves no clean routing. */
function routeChannel(channel, wiring, box, cardWidth, spacing) {
  const keys = [
    ...new Set(
      channel.wires.flatMap((made) => [
        ...made.top.filter((point) => point.id).map((point) => `${point.id}:bottom`),
        ...made.bottom.filter((point) => point.id).map((point) => `${point.id}:top`),
      ]),
    ),
  ];
  /** @type {{ rank: number, gap: number | null, rows: number } | null} */
  let best = null;
  for (const gap of [...PORT_GAPS, cardWidth]) {
    spreadPorts(wiring.sides, box, cardWidth, spacing, gap ?? spacing.portSpacing, keys);
    straighten(channel.wires, wiring.sides, box, cardWidth, spacing);
    // A wider spacing is worth searching only for routings with no more label rows than the best.
    const solution = solveChannel(channel, spacing, best?.rows);
    if (!solution) continue;
    const rank = solution.height * 10 + solution.score + (gap ?? 0) / 100;
    if (!best || rank < best.rank) best = { rank, gap, rows: solution.labelHeights.length };
  }
  if (!best)
    refuse(
      "layout_channel_unroutable",
      `The relations between rows ${channel.index + 1} and ${channel.index + 2} cannot be wired without overlaps. ` +
        "Reorder the tiers or split the view.",
      channel.wires.map((made) => ({
        code: "layout_channel_unroutable",
        path: `/channels/${channel.index}`,
        message: made.relations.map(({ id }) => id).join(", "),
      })),
    );
  spreadPorts(wiring.sides, box, cardWidth, spacing, best.gap ?? spacing.portSpacing, keys);
  straighten(channel.wires, wiring.sides, box, cardWidth, spacing);
  return /** @type {NonNullable<ReturnType<typeof solveChannel>>} */ (
    solveChannel(channel, spacing)
  );
}
