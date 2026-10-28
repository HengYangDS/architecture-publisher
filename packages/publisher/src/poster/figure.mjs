import { presentation } from "../kinds.mjs";
import { DARKNESS, darkness } from "./balance.mjs";
import { POSTER } from "./tokens.mjs";

/**
 * Draw one laid-out figure into SVG shapes and text runs, and report the
 * rectangle each element fills, as mass or as a stroke and with its darkness.
 * The balance gate measures those rectangles, so a card counts as filled across
 * its whole surface, as a reader sees it, and a wire is a line, not a wall.
 */

const C = POSTER.color;
/** Ink the balance measure reads: boxes that hold text are mass without darkness of their own. */
const MASS = Object.freeze({ kind: "mass", weight: 0 });
const CARD = Object.freeze({ kind: "mass", weight: DARKNESS.card });
const stroke = (color) => ({ kind: "stroke", weight: DARKNESS.stroke * darkness(color) });
const fixed = (value) => Math.round(value * 10) / 10;
const DASH = Object.freeze({ planned: "6 4", retired: "1.5 3.5" });

/** A path through `points` with rounded corners. */
function rounded(points, radius) {
  let d = `M${fixed(points[0][0])},${fixed(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
    d +=
      ` L${fixed(cx - Math.sign(cx - px) * r)},${fixed(cy - Math.sign(cy - py) * r)}` +
      ` Q${fixed(cx)},${fixed(cy)} ${fixed(cx + Math.sign(nx - cx) * r)},${fixed(cy + Math.sign(ny - cy) * r)}`;
  }
  const last = points.at(-1);
  return `${d} L${fixed(last[0])},${fixed(last[1])}`;
}

function arrowHead({ x, y, direction }, size) {
  const a = size;
  const shapes = {
    down: [
      [x, y],
      [x - a / 2, y - a],
      [x + a / 2, y - a],
    ],
    up: [
      [x, y],
      [x - a / 2, y + a],
      [x + a / 2, y + a],
    ],
    right: [
      [x, y],
      [x - a, y - a / 2],
      [x - a, y + a / 2],
    ],
    left: [
      [x, y],
      [x + a, y - a / 2],
      [x + a, y + a / 2],
    ],
  };
  const [p, q, r] = shapes[/** @type {keyof typeof shapes} */ (direction)];
  return `M${fixed(p[0])},${fixed(p[1])} L${fixed(q[0])},${fixed(q[1])} L${fixed(r[0])},${fixed(r[1])} Z`;
}

const statusOf = (relations) =>
  relations.some(({ status }) => status === "retired")
    ? "retired"
    : relations.some(({ status }) => status === "planned")
      ? "planned"
      : null;

function iconMarkup(icons, name, x, y, size, color) {
  return (
    `<g transform="translate(${fixed(x)},${fixed(y)}) scale(${size / 24})" fill="none" stroke="${color}" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons.artwork(name)}</g>`
  );
}

/** The paper kept between a tier label and the first card of its tier. */
const TIER_GAP = 24;

const touches = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Set each tier's numbered label beside the first card of its tier, centred on
 * the rows the tier was wrapped into, so a label stands with the row it names.
 * A label that would touch a card, a wire, a relation label or the boundary's
 * edge there, or that has no room before the card, sits in the plate's tier
 * column instead, which nothing else enters.
 * @param {any} layout the justified layout
 * @param {any} input the figure's input, with its tier column
 * @param {{ at: (x: number) => number, down: (y: number) => number,
 *   text: Function, shapes: string[], rects: any[] }} draw
 */
function tierLabels(layout, input, draw) {
  const { styles, typefaces } = input;
  const column = input.labelColumn;
  const { at, down, text, shapes, rects } = draw;
  const labelWidth = column.width - 64;
  /** @type {Array<{ tier: string, label: string | null, rows: any[] }>} */
  const tiers = [];
  for (const row of layout.rows) {
    const tier = row.tier ?? row.id;
    const last = tiers.at(-1);
    if (last && last.tier === tier) last.rows.push(row);
    else tiers.push({ tier, label: row.label, rows: [row] });
  }
  const pad = (rect) => ({
    x: rect.x - 4,
    y: rect.y - 4,
    width: rect.width + 8,
    height: rect.height + 8,
  });
  const obstacles = [
    ...[...layout.cards.values()].map((card) =>
      pad({ x: at(card.x), y: down(card.y), width: card.width, height: card.height }),
    ),
    ...layout.paths.flatMap(({ points }) =>
      points.slice(1).map((point, index) => {
        const [x1, y1] = [at(points[index][0]), down(points[index][1])];
        const [x2, y2] = [at(point[0]), down(point[1])];
        return pad({
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(x2 - x1),
          height: Math.abs(y2 - y1),
        });
      }),
    ),
    ...layout.labels.map((label) =>
      pad({ x: at(label.x), y: down(label.y), width: label.width, height: label.height }),
    ),
  ];
  if (layout.boundary) {
    const { x, y, width, height } = layout.boundary;
    obstacles.push(
      pad({ x: at(x), y: down(y), width, height: 0 }),
      pad({ x: at(x), y: down(y + height), width, height: 0 }),
      pad({ x: at(x), y: down(y), width: 0, height }),
      pad({ x: at(x + width), y: down(y), width: 0, height }),
    );
  }
  let number = 0;
  for (const { label, rows } of tiers) {
    if (!label) continue;
    number += 1;
    const members = rows.flatMap((row) => row.members.map((id) => layout.cards.get(id)));
    const first = Math.min(...members.map(({ x }) => at(x)));
    const lines = typefaces.wrap(label, labelWidth, styles.tier);
    const width = 42 + Math.max(...lines.map((line) => typefaces.measure(line, styles.tier)));
    const height = lines.length * styles.tier.line;
    const last = rows[rows.length - 1];
    const top = down((rows[0].top + last.top + last.height - height) / 2);
    const box = (x) => ({ x: x + 4, y: top - 4, width, height: height + 8 });
    const beside = Math.max(column.x, first - TIER_GAP - width);
    const x = obstacles.some((other) => touches(box(beside), other)) ? column.x : beside;
    shapes.push(
      `<circle cx="${fixed(x + 18)}" cy="${fixed(top + styles.tier.line / 2)}" r="14" fill="none" stroke="${C.muted}" stroke-width="1.4"/>`,
    );
    const digits = String(number);
    text(
      "figure",
      digits,
      x + 18 - typefaces.measure(digits, styles.note) / 2,
      top + (styles.tier.line - styles.note.line) / 2,
      styles.note,
      C.muted,
    );
    let y = top;
    for (const line of lines) y = text("figure", line, x + 42, y, styles.tier, C.muted);
    rects.push({ ...box(x), ...MASS, tier: true });
  }
}

/**
 * @param {any} layout the layout's geometry, in its own coordinates
 * @param {{ model: any, view: any, styles: any, metrics: any, icons: any,
 *   typefaces: any, field: { x: number, y: number, width: number, height: number },
 *   labelColumn?: { x: number, y: number, width: number, height: number } | null,
 *   offset?: number,
 *   cardText: (component: any, width: number) => { name: string[], details: string[] } }} input
 *   `offset` moves the figure across its field; its tier labels follow their rows.
 */
export function drawFigure(layout, input) {
  const { model, view, styles, metrics, icons, typefaces, field } = input;
  const shapes = [];
  const runs = [];
  /** @type {Array<{ x: number, y: number, width: number, height: number, tier?: boolean }>} */
  const rects = [];
  const shifts = {
    x: field.x + (input.offset ?? 0),
    y: field.y + (field.height - layout.height) / 2,
  };
  const at = (x) => x + shifts.x;
  const down = (y) => y + shifts.y;
  const text = (layer, value, x, top, style, color) => {
    // Runs carry the top of the line box, so the renderer and the balance
    // measure place the same line from the same number.
    runs.push({ layer, value, x, top, style, color });
    return top + style.line;
  };
  // Every plate that interrupts a wire is paper, so it reads as a gap in the line.
  const fillAt = () => C.paper;

  // A tier is bound by its own label and a rule under its members' extent, not by a
  // full-width tint: a background wash would cover the field and make every page
  // measure as full, which would hide exactly the blank bands this page forbids.
  if (layout.labelled) {
    layout.rows.forEach((row) => {
      const members = row.members.map((id) => /** @type {any} */ (layout.cards.get(id)));
      if (!members.length) return;
      const left = Math.min(...members.map(({ x }) => at(x)));
      const right = Math.max(...members.map(({ x, width }) => at(x) + width));
      const ruleY = down(row.top + row.height + 8);
      shapes.push(
        `<line x1="${fixed(left)}" y1="${fixed(ruleY)}" x2="${fixed(right)}" y2="${fixed(ruleY)}" ` +
          `stroke="${C.rule}" stroke-width="1.5"/>`,
      );
      rects.push({ x: left, y: ruleY - 1, width: right - left, height: 2, ...stroke(C.rule) });
    });
    if (input.labelColumn) tierLabels(layout, input, { at, down, text, shapes, rects });
  }

  const boundary = layout.boundary;
  /** @type {{ x: number, y: number, width: number, height: number } | null} */
  let frame = null;
  if (boundary) {
    // The frame is not ink a reader sees as filled, so the balance measure does
    // not count it; text set beside the figure still keeps clear of it.
    frame = {
      x: at(boundary.x),
      y: down(boundary.y) - 14,
      width: boundary.width,
      height: boundary.height + 14,
    };
    const tabWidth = typefaces.measure(boundary.name, styles.boundary) + 24;
    const crossings = layout.paths.flatMap(({ points }) =>
      points.slice(1).flatMap((point, i) => {
        const prior = points[i];
        return Math.abs(point[0] - prior[0]) < 0.5 &&
          Math.min(point[1], prior[1]) <= boundary.y &&
          Math.max(point[1], prior[1]) >= boundary.y
          ? [point[0]]
          : [];
      }),
    );
    let tabX = at(boundary.x + 24);
    while (crossings.some((x) => at(x) > tabX - 12 && at(x) < tabX + tabWidth + 12)) tabX += 12;
    shapes.push(
      `<rect x="${fixed(at(boundary.x))}" y="${fixed(down(boundary.y))}" width="${fixed(boundary.width)}" ` +
        `height="${fixed(boundary.height)}" rx="18" fill="none" stroke="${C.boundary}" stroke-width="1.4" stroke-dasharray="8 5"/>`,
    );
    shapes.push(
      `<rect x="${fixed(tabX)}" y="${fixed(down(boundary.y) - 14)}" width="${fixed(tabWidth)}" height="28" rx="7" fill="${fillAt()}"/>`,
    );
    text("figure", boundary.name, tabX + 12, down(boundary.y) - 13, styles.boundary, C.ink);
    rects.push({ x: tabX, y: down(boundary.y) - 14, width: tabWidth, height: 28, ...MASS });
  }

  for (const { relations, points } of layout.paths) {
    const status = statusOf(relations);
    const dash = status ? ` stroke-dasharray="${DASH[status]}"` : "";
    const moved = points.map(([x, y]) => [at(x), down(y)]);
    const ink = stroke(status === "retired" ? C.faint : C.line);
    shapes.push(
      `<path d="${rounded(moved, metrics.wire.radius)}" fill="none" stroke="${status === "retired" ? C.faint : C.line}" ` +
        `stroke-width="${metrics.wire.stroke}" stroke-linejoin="round" stroke-linecap="round"${dash}/>`,
    );
    for (const [x, y] of moved)
      rects.push({
        x: x - metrics.wire.stroke,
        y: y - metrics.wire.stroke,
        width: 2 * metrics.wire.stroke,
        height: 2 * metrics.wire.stroke,
        ...ink,
      });
    // A wire fills its whole run, not just its corners: a long horizontal or
    // vertical stretch is ink a reader sees, so the balance measure counts it.
    for (let index = 1; index < moved.length; index += 1) {
      const [x1, y1] = moved[index - 1];
      const [x2, y2] = moved[index];
      const width = Math.max(Math.abs(x2 - x1), 2 * metrics.wire.stroke);
      const height = Math.max(Math.abs(y2 - y1), 2 * metrics.wire.stroke);
      rects.push({
        x: Math.min(x1, x2) - metrics.wire.stroke,
        y: Math.min(y1, y2) - metrics.wire.stroke,
        width,
        height,
        ...ink,
      });
    }
  }
  for (const arrow of layout.arrows)
    shapes.push(
      `<path d="${arrowHead({ ...arrow, x: at(arrow.x), y: down(arrow.y) }, metrics.wire.arrow)}" ` +
        `fill="${statusOf(arrow.relations) === "retired" ? C.faint : C.line}"/>`,
    );

  shapes.push(
    `<defs><filter id="lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="1.8" flood-color="${C.shadow}" flood-opacity="0.08"/></filter></defs>`,
  );
  const components = new Map(view.components.map((component) => [component.id, component]));
  const { card: cardStyle } = metrics;
  for (const [id, card] of layout.cards) {
    const component = /** @type {any} */ (components.get(id));
    const style = presentation(model, component);
    const muted = style.outside || component.context;
    const hue = POSTER.hue[/** @type {keyof typeof POSTER.hue} */ (style.category)];
    const dash =
      component.status && component.status !== "implemented"
        ? ` stroke-dasharray="${DASH[component.status]}"`
        : "";
    const x = at(card.x);
    const y = down(card.y);
    shapes.push(
      `<rect x="${fixed(x)}" y="${fixed(y)}" width="${card.width}" height="${card.height}" rx="${cardStyle.radius}" ` +
        `fill="${muted ? C.external : C.card}" stroke="${muted ? C.externalStroke : C.cardStroke}" stroke-width="1.2" filter="url(#lift)"${dash}/>`,
    );
    shapes.push(
      `<rect x="${fixed(x)}" y="${fixed(y + cardStyle.pad)}" width="${cardStyle.bar}" ` +
        `height="${fixed(card.height - 2 * cardStyle.pad)}" rx="${cardStyle.bar / 2}" fill="${hue}"/>`,
    );
    rects.push({ x, y, width: card.width, height: card.height, ...CARD });
    const { name, details } = input.cardText(component, card.width);
    const labelTop = y + cardStyle.pad;
    shapes.push(
      iconMarkup(
        icons,
        style.icon,
        x + cardStyle.pad,
        labelTop + (styles.name.line - cardStyle.icon) / 2,
        cardStyle.icon,
        hue,
      ),
    );
    let top = labelTop;
    for (const line of name)
      top = text(
        "cards",
        line,
        x + cardStyle.pad + cardStyle.icon + cardStyle.iconGap,
        top,
        styles.name,
        component.status === "retired" ? C.muted : C.ink,
      );
    // Details follow the label as one block read from the card's top edge, so a
    // card shorter than its row's tallest keeps its spare height at its foot,
    // not between a name and what is said about it.
    top += details.length ? cardStyle.detailGap : 0;
    for (const line of details)
      top = text("cards", line, x + cardStyle.pad, top, styles.detail, C.muted);
  }

  for (const label of layout.labels) {
    const x = at(label.x);
    const y = down(label.y);
    const fill = fillAt();
    shapes.push(
      `<rect x="${fixed(x)}" y="${fixed(y)}" width="${fixed(label.width)}" height="${fixed(label.height)}" rx="6" fill="${fill}"/>`,
    );
    rects.push({ x, y, width: label.width, height: label.height, ...MASS });
    let top = y + metrics.wire.labelPadY;
    for (const line of label.lines) {
      const style = line.role === "label" ? styles.edge : styles.edgeDetail;
      top = text(
        "labels",
        line.text,
        x + (label.width - typefaces.measure(line.text, style)) / 2,
        top,
        style,
        line.role === "label" ? C.ink : C.muted,
      );
    }
  }
  return { shapes, runs, rects, frame };
}
