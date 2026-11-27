import { HOUSE } from "../../house.mjs";
import { darkness } from "../balance.mjs";
import { lineLook, named } from "../lines.mjs";
import { MARK, cardLift, drawCard, iconMarkup } from "../part.mjs";
import { drawSegments } from "../strip.mjs";
import { colorsOf, fixed, linesOf } from "../tokens.mjs";

/**
 * How a planned matrix is drawn. The filled cells carry the figure's tone, each a light tint of the colour of the
 * line it stands for; the rules between rows and between columns, and the diagonal where a part meets itself, are
 * hairlines in the colour of rules, each at its own stroke of the house. A cell's edge, drawn where its relations
 * are planned or retired, takes a relation's line's weight and its status's pattern from the table of lines, and a
 * bracket the boundary's. The balance gates measure what a reader reads: the heads' cards and strips, the cells'
 * tints and every word; not the rules, the diagonal or the boundary's brackets, which a reader does not see as
 * filled.
 */

/** How strongly a filled cell is tinted with its line's colour: lightly, so its words stay the darkest ink in it. */
export const TINT = 0.16;
/** What stands between a cell's label and its count: a space no line breaks at. */
export const JOINED = "\u00A0";

/**
 * Where a planned matrix's cells stand: the left of each column and the top of each row, from the first, and the
 * right and the bottom of the last.
 * @param {any} planned
 */
function gridOf(planned) {
  const { cell, parts } = planned;
  const left = planned.x + planned.left;
  const top = planned.y + planned.top;
  return {
    left,
    top,
    right: left + parts.length * cell.width,
    bottom: top + parts.length * cell.height,
    columnX: (/** @type {number} */ index) => left + index * cell.width,
    rowY: (/** @type {number} */ index) => top + index * cell.height,
  };
}

/** A path's outline through the corners of a box, closed. */
const corners = ({ x, y, width, height }) => [
  [x, y],
  [fixed(x + width), y],
  [fixed(x + width), fixed(y + height)],
  [x, fixed(y + height)],
  [x, y],
];

/**
 * Draw each cell's mark: the cell tinted as the line it stands for, its edge in the line's pattern where its
 * relations are planned or retired, and its label's lines centred in it, with the count of the files they cite in
 * the line's colour after the last; and hand back what the report says of them.
 * @param {any} planned
 * @param {ReturnType<typeof gridOf>} grid
 * @param {any} draw
 */
function drawCells(planned, grid, draw) {
  const { styles, parts, cell } = planned;
  const { text, shapes, rects, typefaces, rows, lines, colors: C } = draw;
  const order = new Map(parts.map((part, index) => [part.id, index]));
  const hub = planned.seen ? planned.seen.hub : null;
  /** @type {Array<{ relations: ReturnType<typeof named>[], points: number[][] }>} */
  const paths = [];
  /** @type {Array<{ relations: string[], box: { x: number, y: number, width: number, height: number } }>} */
  const labels = [];
  for (const { relations, figures, lines: set, height } of planned.marks.values()) {
    const look = lineLook(relations, hub, lines, C);
    for (const row of look.rows) rows.add(row);
    if (figures) rows.add("citations");
    const at = grid.columnX(/** @type {number} */ (order.get(relations[0].to)));
    const top = grid.rowY(/** @type {number} */ (order.get(relations[0].from)));
    shapes.push(
      `<rect x="${fixed(at)}" y="${fixed(top)}" width="${cell.width}" height="${cell.height}" ` +
        `fill="${look.color}" fill-opacity="${TINT}"/>`,
    );
    rects.push({
      x: at,
      y: top,
      width: cell.width,
      height: cell.height,
      kind: "mass",
      weight: TINT * darkness(look.color, C.paper),
    });
    if (look.dash) {
      const weight = lines.stroke(false);
      shapes.push(
        `<rect x="${fixed(at + weight / 2)}" y="${fixed(top + weight / 2)}" width="${fixed(cell.width - weight)}" ` +
          `height="${fixed(cell.height - weight)}" fill="none" stroke="${look.color}" stroke-width="${weight}" ` +
          `stroke-dasharray="${look.dash}"/>`,
      );
    }
    const box = { x: fixed(at), y: fixed(top), width: cell.width, height: cell.height };
    paths.push({ relations: relations.map(named), points: corners(box) });
    if (set.length) labels.push({ relations: relations.map(({ id }) => id), box });
    let line = top + (cell.height - height) / 2;
    if (!set.length && figures)
      text(
        "labels",
        figures,
        at + (cell.width - typefaces.measure(figures, styles.count)) / 2,
        line,
        styles.count,
        look.color,
      );
    for (const [place, written] of set.entries()) {
      const last = Boolean(figures) && place === set.length - 1;
      const space = last ? typefaces.measure(JOINED, styles.edge) : 0;
      const after = last ? space + typefaces.measure(figures, styles.count) : 0;
      const wide = typefaces.measure(written, styles.edge);
      const start = at + (cell.width - wide - after) / 2;
      text("labels", written, start, line, styles.edge, C.ink);
      // The count stands on the label's baseline.
      if (last)
        text(
          "labels",
          figures,
          start + wide + space,
          typefaces.baseline(line, styles.edge) - typefaces.baseline(0, styles.count),
          styles.count,
          look.color,
        );
      line += styles.edge.line;
    }
  }
  return { paths, labels };
}

/**
 * Draw the rules the cells stand between, round the grid and between every two rows and columns, and the diagonal
 * through the cells where a part meets itself, each at its stroke.
 * @param {any} planned
 * @param {ReturnType<typeof gridOf>} grid
 * @param {{ shapes: string[], colors: ReturnType<typeof colorsOf> }} draw
 */
function drawRules(planned, grid, { shapes, colors: C }) {
  const path = (d, weight) =>
    shapes.push(`<path d="${d}" fill="none" stroke="${C.rule}" stroke-width="${weight}"/>`);
  const steps = [];
  for (let index = 0; index <= planned.parts.length; index += 1) {
    const [across, down] = [fixed(grid.columnX(index)), fixed(grid.rowY(index))];
    steps.push(
      `M${fixed(grid.left)},${down} H${fixed(grid.right)}`,
      `M${across},${fixed(grid.top)} V${fixed(grid.bottom)}`,
    );
  }
  path(steps.join(" "), HOUSE.strokes.cellRule);
  path(
    `M${fixed(grid.left)},${fixed(grid.top)} L${fixed(grid.right)},${fixed(grid.bottom)}`,
    HOUSE.strokes.diagonal,
  );
}

/**
 * Draw the compact cards that head the rows, each its card, its kind's icon, its name and its strip on one line;
 * the kinds' names in the column before them, each at the first row of its run; and the labels the rows say once
 * in the column after them. Every line of a row stands on the baseline of its part's name.
 * @param {any} planned
 * @param {ReturnType<typeof gridOf>} grid
 * @param {{ model: any, icons: any }} scene
 * @param {any} draw
 */
function drawHeads(planned, grid, { model, icons }, draw) {
  const { styles, metrics, parts, heads, cell } = planned;
  const { card } = metrics;
  const { text, shapes, typefaces, rows, lines, colors: C } = draw;
  shapes.push(cardLift(C));
  const x = planned.x + planned.bracket + planned.kindWidth + planned.gap;
  const inset = (cell.height - heads.height) / 2;
  const labelled = x + heads.width + planned.gap;
  /** @type {Array<{ relations: string[], box: { x: number, y: number, width: number, height: number } }>} */
  const labels = [];
  const drawn = parts.map((component, index) => {
    const y = grid.rowY(index) + inset;
    if (component.status && component.status !== "implemented") rows.add(component.status);
    const part = { x, y, width: heads.width, height: heads.height, model, component, card };
    const { look, hue } = drawCard({ ...part, colors: C, lines }, card.detailGap, draw);
    const left = x + card.pad;
    const top = y + card.detailGap;
    const size = styles.name.size;
    const middle = typefaces.baseline(top, styles.name) - MARK.middle * size;
    shapes.push(iconMarkup(icons, look.icon, left, middle - size / 2, size, hue));
    const ink = component.status === "retired" ? C.muted : C.ink;
    heads.names[index].forEach((line, at) =>
      text(
        "cards",
        line,
        left + heads.icon,
        top + at * styles.name.line,
        styles.name,
        ink,
        component.id,
      ),
    );
    const strip = heads.strips[index];
    if (strip) {
      const across = left + heads.icon + heads.nameWidth + card.pad;
      drawSegments({ x: across, y: middle - strip.thickness / 2, strip, colors: C }, draw);
    }
    const baseline = typefaces.baseline(top, styles.name);
    let kindTop = baseline - typefaces.baseline(0, styles.detail);
    for (const word of planned.kinds[index])
      kindTop = text("figure", word, planned.x + planned.bracket, kindTop, styles.detail, C.muted);
    const said = planned.rowLabels.get(index);
    if (said) {
      const labelTop = baseline - typefaces.baseline(0, styles.edge);
      said.lines.forEach((line, at) =>
        text("labels", line, labelled, labelTop + at * styles.edge.line, styles.edge, C.ink),
      );
      labels.push({
        relations: said.keys.flatMap((key) => planned.marks.get(key).relations.map(({ id }) => id)),
        box: {
          x: fixed(labelled),
          y: fixed(labelTop),
          width: planned.rowLabelWidth,
          height: said.lines.length * styles.edge.line,
        },
      });
    }
    return {
      id: component.id,
      ...(component.group ? { group: true } : {}),
      box: { x: fixed(x), y: fixed(y), width: heads.width, height: heads.height },
    };
  });
  return { parts: drawn, labels };
}

/**
 * Draw the heads of the columns: each part's name, its last line on one baseline across the columns, and under it
 * the label its column says once.
 * @param {any} planned
 * @param {ReturnType<typeof gridOf>} grid
 * @param {any} draw
 */
function drawColumnHeads(planned, grid, draw) {
  const { styles, parts, cell } = planned;
  const { text, typefaces, colors: C } = draw;
  const said = grid.top - planned.below - planned.labelLines * styles.edge.line;
  const centred = (index, line, style) =>
    grid.columnX(index) + (cell.width - typefaces.measure(line, style)) / 2;
  planned.names.forEach((name, index) => {
    let top = said - name.length * styles.name.line;
    for (const line of name)
      top = text(
        "cards",
        line,
        centred(index, line, styles.name),
        top,
        styles.name,
        C.ink,
        parts[index].id,
      );
  });
  /** @type {Array<{ relations: string[], box: { x: number, y: number, width: number, height: number } }>} */
  const labels = [];
  for (const [index, { keys, lines }] of planned.columnLabels) {
    lines.forEach((line, at) =>
      text(
        "labels",
        line,
        centred(index, line, styles.edge),
        said + at * styles.edge.line,
        styles.edge,
        C.ink,
      ),
    );
    labels.push({
      relations: keys.flatMap((key) => planned.marks.get(key).relations.map(({ id }) => id)),
      box: {
        x: fixed(grid.columnX(index)),
        y: fixed(said),
        width: cell.width,
        height: lines.length * styles.edge.line,
      },
    });
  }
  return labels;
}

/**
 * Draw the boundary as brackets: one down the left of the rows of each run of parts inside the repository, and one
 * over the heads of their columns, in the boundary's pattern. The first bracket over the columns carries the
 * boundary's name on its line where the plan set it, as the figure in tiers sets the name on its frame; an end of
 * that bracket the name stands over stops under the name.
 * @param {any} planned
 * @param {ReturnType<typeof gridOf>} grid
 * @param {any} draw
 */
function drawBrackets(planned, grid, draw) {
  const { styles, metrics, tick, clear, name } = planned;
  const { text, shapes, typefaces, rows, lines, colors: C } = draw;
  const edge = lines.boundary();
  const pad = metrics.wire.labelPadX;
  const stroke = (d) =>
    shapes.push(
      `<path d="${d}" fill="none" stroke="${C.boundary}" stroke-width="${edge.stroke}" stroke-dasharray="${edge.dash}"/>`,
    );
  const across = planned.y + styles.boundary.line / 2;
  const under = planned.y + styles.boundary.line;
  const foot = planned.y + planned.above;
  // The gap the name keeps on the bracket's line.
  const [from, to] = [
    planned.named - pad,
    planned.named + typefaces.measure(name, styles.boundary) + pad,
  ];
  for (const [order, [first, last]] of planned.runs.entries()) {
    const [top, bottom] = [grid.rowY(first) + clear, grid.rowY(last + 1) - clear];
    const down = planned.x;
    stroke(
      `M${fixed(down + tick)},${fixed(top)} H${fixed(down)} V${fixed(bottom)} H${fixed(down + tick)}`,
    );
    const [left, right] = [grid.columnX(first) + clear, grid.columnX(last + 1) - clear];
    if (order) {
      stroke(`M${fixed(left)},${fixed(foot)} V${fixed(across)} H${fixed(right)} V${fixed(foot)}`);
      continue;
    }
    text("figure", name, planned.named, planned.y, styles.boundary, C.ink);
    stroke(
      left < from
        ? `M${fixed(left)},${fixed(foot)} V${fixed(across)} H${fixed(from)}`
        : `M${fixed(left)},${fixed(foot)} V${fixed(under)}`,
    );
    stroke(
      to < right
        ? `M${fixed(to)},${fixed(across)} H${fixed(right)} V${fixed(foot)}`
        : `M${fixed(right)},${fixed(under)} V${fixed(foot)}`,
    );
  }
  rows.add("boundary");
}

/**
 * Draw a planned matrix: its shapes, its text runs, the rectangles of ink the balance gates measure, the rows of
 * the table of lines its cells draw, and its report of what it drew. Each cell's mark is reported as a path of its
 * relations round the cell, and its label's box, or the box of the head that says its label, as their label.
 * @param {any} planned what the matrix's plan measured
 * @param {{ model: any, typefaces: any, icons: any, style: import("../strip.mjs").Style }} scene
 */
export function drawMatrix(planned, scene) {
  const { typefaces, style } = scene;
  const C = colorsOf(style.tokens);
  /** @type {string[]} */
  const shapes = [];
  /** @type {any[]} */
  const runs = [];
  /** @type {any[]} */
  const rects = [];
  /** @type {Set<string>} */
  const rows = new Set();
  // Runs carry the top of their line box, as a grid's figure sets them; the balance measure reads them as text.
  const text = (layer, value, at, top, textStyle, color, component = null) => {
    runs.push({
      layer,
      value,
      x: at,
      top,
      style: textStyle,
      color,
      ...(component ? { component } : {}),
    });
    return top + textStyle.line;
  };
  const draw = { text, shapes, rects, typefaces, rows, lines: linesOf(style.lines), colors: C };
  const grid = gridOf(planned);
  const cells = drawCells(planned, grid, draw);
  drawRules(planned, grid, draw);
  const heads = drawHeads(planned, grid, scene, draw);
  const columns = drawColumnHeads(planned, grid, draw);
  if (planned.bounded) drawBrackets(planned, grid, draw);
  // The corner says which way a relation runs: from the part a row heads to the part a column heads.
  const { styles } = planned;
  text(
    "figure",
    planned.corner,
    grid.left - planned.gap - typefaces.measure(planned.corner, styles.detail),
    grid.top - planned.below - styles.detail.line,
    styles.detail,
    C.muted,
  );
  const box = { x: planned.x, y: planned.y, width: planned.width, height: planned.height };
  return {
    shapes,
    runs,
    rects,
    // The rules, the diagonal and the brackets are not ink a reader sees as filled; the matrix's box holds them for
    // the figure set alone.
    frame: box,
    lines: [...rows],
    touching: [],
    report: {
      parts: heads.parts,
      paths: cells.paths,
      labels: [...cells.labels, ...heads.labels, ...columns],
    },
    matrix: { side: planned.side },
  };
}
