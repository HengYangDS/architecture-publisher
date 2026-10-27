import { refuse } from "../refusal.mjs";
import { layoutView } from "../layout/grid.mjs";
import { presentation } from "../kinds.mjs";
import { POSTER } from "./tokens.mjs";

const T = POSTER.type;
const C = POSTER.color;
const K = POSTER.card;
const W = POSTER.wire;
const fixed = (value) => Math.round(value * 10) / 10;
const DASH = Object.freeze({ planned: "6 4", retired: "1.5 3.5" });

/** The poster's own layout metrics: its type scale, card bounds and spacing. */
export function posterMetrics(model, typefaces) {
  const full = POSTER.width - 2 * POSTER.margin.x;
  const cardText = (component, width) => {
    const name = typefaces.wrap(component.label, width - 2 * K.pad - K.icon - K.iconGap, T.name);
    const details = component.details.flatMap(([key, values]) =>
      typefaces.detailLines(key, values, width - 2 * K.pad, T.detail),
    );
    return { name, details };
  };
  return {
    contentWidth: (labelled) => full - (labelled ? POSTER.rowColumn : 0),
    card: {
      minWidth: K.minWidth,
      maxWidth: K.maxWidth,
      height: (component, width) => {
        const { name, details } = cardText(component, width);
        return (
          2 * K.pad +
          name.length * T.name.line +
          (details.length ? K.detailGap + details.length * T.detail.line : 0)
        );
      },
    },
    cardText,
    label: (relation, maxWidth = /** @type {number} */ (W.maximumLabel)) => {
      const width = Math.min(maxWidth, W.maximumLabel);
      const lines = [
        ...typefaces.wrap(relation.label, width, T.edge).map((text) => ({ text, role: "label" })),
        ...relation.details.flatMap(([key, values]) =>
          typefaces
            .detailLines(key, values, width, T.edgeDetail)
            .map((text) => ({ text, role: "detail" })),
        ),
      ];
      const measured = Math.max(
        ...lines.map(({ text, role }) =>
          typefaces.measure(text, role === "label" ? T.edge : T.edgeDetail),
        ),
      );
      return {
        width: Math.ceil(measured) + 2 * W.labelPadX,
        height: lines.length * T.edge.line + 2 * W.labelPadY,
        lines,
      };
    },
    external: (component) => presentation(model, component).outside,
    spacing: POSTER.spacing,
  };
}

function rounded(points) {
  let d = `M${fixed(points[0][0])},${fixed(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const r = Math.min(
      W.radius,
      Math.hypot(cx - px, cy - py) / 2,
      Math.hypot(nx - cx, ny - cy) / 2,
    );
    d +=
      ` L${fixed(cx - Math.sign(cx - px) * r)},${fixed(cy - Math.sign(cy - py) * r)}` +
      ` Q${fixed(cx)},${fixed(cy)} ${fixed(cx + Math.sign(nx - cx) * r)},${fixed(cy + Math.sign(ny - cy) * r)}`;
  }
  return `${d} L${fixed(points.at(-1)[0])},${fixed(points.at(-1)[1])}`;
}

function arrowHead({ x, y, direction }) {
  const a = W.arrow;
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

function footnotes(model, provenance) {
  const sentence = (text) => (/[.!?。]$/u.test(text) ? text : `${text}.`);
  const notes = [];
  const scope = [model.scope, ...new Set(model.limits)].filter(Boolean).map(sentence).join(" ");
  if (scope) notes.push(scope);
  const parts = [];
  if (model.repository)
    parts.push(`Source ${model.repository.name} at ${model.repository.revision.slice(0, 12)}`);
  const count = provenance.records.length;
  if (provenance.state === "verified") parts.push(`${count} sources verified by SHA-256`);
  if (provenance.state === "unverified") parts.push(`${count} sources declared and not verified`);
  if (model.attribution) parts.push(`Model by ${model.attribution}`);
  if (parts.length) notes.push(`${parts.join("; ")}.`);
  return notes;
}

/**
 * Compose one view into a complete poster. The returned SVG has fixed pixel
 * dimensions, outlined text and inline icons.
 * @param {any} model
 * @param {import("../plan/views.mjs").View} view
 * @param {{ index: number, count: number }} position
 * @param {any} typefaces
 * @param {any} icons
 * @param {{ state: string, records: any[] }} provenance
 */
export function composePoster(model, view, position, typefaces, icons, provenance) {
  const metrics = posterMetrics(model, typefaces);
  const layout = layoutView(view, metrics, { boundaryName: model.repository?.name ?? model.title });
  const runs = [];
  const text = (layer, value, x, top, style, color) => {
    runs.push({ layer, value, x, y: typefaces.baseline(top, style), style, color });
    return top + style.line;
  };
  const full = POSTER.width - 2 * POSTER.margin.x;
  const page = [];

  // Header.
  /** @type {number} */
  let y = POSTER.margin.top;
  const meta = [
    model.repository
      ? `${model.repository.name} · ${model.repository.revision.slice(0, 7)}`
      : model.id,
    `view ${position.index + 1} of ${position.count}`,
  ].join(" · ");
  text(
    "page",
    meta,
    POSTER.width - POSTER.margin.x - typefaces.measure(meta, T.meta),
    y + 12,
    T.meta,
    C.muted,
  );
  for (const line of typefaces.wrap(view.title, full - POSTER.titleReserve, T.title))
    y = text("page", line, POSTER.margin.x, y, T.title, C.ink);
  y += 6;
  for (const line of typefaces.wrap(view.question, full, T.question))
    y = text("page", line, POSTER.margin.x, y, T.question, C.accent);
  if (view.summary) {
    const lines = typefaces.wrap(view.summary, POSTER.summaryWidth, T.summary);
    if (lines.length > POSTER.summaryLines)
      refuse(
        "poster_summary_too_long",
        `The summary of view ${view.id} needs ${lines.length} lines; the poster allows ${POSTER.summaryLines}.`,
      );
    y += 4;
    for (const line of lines) y = text("page", line, POSTER.margin.x, y, T.summary, C.muted);
  }
  const headerBottom = y + POSTER.headerGap;

  // Legend and footnote sit at the bottom of the frame.
  const notes = footnotes(model, provenance).flatMap((note) => typefaces.wrap(note, full, T.foot));
  const footerTop =
    POSTER.height -
    POSTER.margin.bottom -
    (T.legend.line + 14 + 1 + 12 + notes.length * T.foot.line);
  const stage = {
    x: POSTER.margin.x + (layout.labelled ? POSTER.rowColumn : 0),
    y: headerBottom,
    width: layout.width,
    height: footerTop - POSTER.stageGap - headerBottom,
  };
  // Fit and center the drawn extent, not the whole content width.
  const xs = [
    ...[...layout.cards.values()].flatMap((card) => [card.x, card.x + card.width]),
    ...layout.labels.flatMap((label) => [label.x, label.x + label.width]),
    ...layout.paths.flatMap(({ points }) => points.map(([px]) => px)),
    ...(layout.boundary ? [layout.boundary.x, layout.boundary.x + layout.boundary.width] : []),
  ];
  const left = Math.min(...xs) - 8;
  const right = Math.max(...xs) + 8;
  const fitScale = Math.min(stage.width / (right - left), stage.height / layout.height);
  const scale = Math.max(1, Math.min(POSTER.maximumZoom, Math.floor(fitScale * 20) / 20));
  const fits = fitScale >= 1;
  const offsetX = stage.x + (stage.width - (right - left) * scale) / 2 - left * scale;
  const offsetY = stage.y + Math.max(0, (stage.height - layout.height * scale) / 2);
  const local = (pageX) => (pageX - offsetX) / scale;

  // Graph, in local layout coordinates under one transform.
  const graph = [];
  const bandEdges = [0];
  for (const channel of layout.channels) {
    const last = channel.labelRows.at(-1);
    bandEdges.push(last ? last.center + last.height / 2 + 4 : (channel.top + channel.bottom) / 2);
  }
  bandEdges.push(layout.height);
  const bandFill = (row) => (row % 2 === 0 ? C.bandA : C.bandB);
  const fillAt = (localY) =>
    layout.labelled
      ? bandFill(
          Math.max(
            0,
            bandEdges.findLastIndex((edge) => edge <= localY),
          ),
        )
      : C.paper;
  if (layout.labelled) {
    layout.rows.forEach((row, index) => {
      graph.push(
        `<rect x="${fixed(local(POSTER.margin.x))}" y="${fixed(bandEdges[index])}" width="${fixed(full / scale)}" height="${fixed(bandEdges[index + 1] - bandEdges[index])}" fill="${bandFill(index)}"/>`,
      );
      if (!row.label) return;
      const x = local(POSTER.margin.x + 20);
      const lines = typefaces.wrap(row.label, (POSTER.rowColumn - 64) / scale, T.row);
      let top = row.top + (layout.card.height - lines.length * T.row.line) / 2;
      graph.push(
        `<circle cx="${fixed(x + 12)}" cy="${fixed(top + T.row.line / 2)}" r="12" fill="none" stroke="${C.muted}" stroke-width="1.3"/>`,
      );
      const number = String(index + 1);
      text(
        "graph",
        number,
        x + 12 - typefaces.measure(number, T.rowNumber) / 2,
        top + (T.row.line - T.rowNumber.line) / 2,
        T.rowNumber,
        C.muted,
      );
      for (const line of lines) top = text("graph", line, x + 32, top, T.row, C.muted);
    });
  }
  const boundary = layout.boundary;
  if (boundary) {
    const name = boundary.name;
    const tabWidth = typefaces.measure(name, T.boundary) + 20;
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
    let tabX = boundary.x + 18;
    while (crossings.some((x) => x > tabX - 10 && x < tabX + tabWidth + 10)) tabX += 8;
    graph.push(
      `<rect x="${fixed(boundary.x)}" y="${fixed(boundary.y)}" width="${fixed(boundary.width)}" height="${fixed(boundary.height)}" rx="16" fill="none" stroke="${C.boundary}" stroke-width="1.4" stroke-dasharray="7 5"/>`,
    );
    graph.push(
      `<rect x="${fixed(tabX)}" y="${fixed(boundary.y - 12)}" width="${fixed(tabWidth)}" height="24" rx="6" fill="${fillAt(boundary.y)}"/>`,
    );
    text("graph", name, tabX + 10, boundary.y - 11, T.boundary, C.ink);
  }
  for (const { relations, points } of layout.paths) {
    const status = statusOf(relations);
    const dash = status ? ` stroke-dasharray="${DASH[status]}"` : "";
    graph.push(
      `<path d="${rounded(points)}" fill="none" stroke="${status === "retired" ? C.faint : C.line}" stroke-width="${W.stroke}" stroke-linejoin="round" stroke-linecap="round"${dash}/>`,
    );
  }
  for (const arrow of layout.arrows)
    graph.push(
      `<path d="${arrowHead(arrow)}" fill="${statusOf(arrow.relations) === "retired" ? C.faint : C.line}"/>`,
    );
  graph.push(
    `<defs><filter id="lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="1.6" flood-color="${C.shadow}" flood-opacity="0.09"/></filter></defs>`,
  );
  const components = new Map(view.components.map((component) => [component.id, component]));
  for (const [id, card] of layout.cards) {
    const component = /** @type {any} */ (components.get(id));
    const style = presentation(model, component);
    const muted = style.outside || component.context;
    const hue = POSTER.hue[/** @type {keyof typeof POSTER.hue} */ (style.category)];
    const dash =
      component.status && component.status !== "implemented"
        ? ` stroke-dasharray="${DASH[component.status]}"`
        : "";
    graph.push(
      `<rect x="${fixed(card.x)}" y="${fixed(card.y)}" width="${card.width}" height="${card.height}" rx="${K.radius}" fill="${muted ? C.external : C.card}" stroke="${muted ? C.externalStroke : C.cardStroke}" stroke-width="1.1" filter="url(#lift)"${dash}/>`,
    );
    graph.push(
      `<rect x="${fixed(card.x)}" y="${fixed(card.y + 14)}" width="${K.bar}" height="${card.height - 28}" rx="2" fill="${hue}"/>`,
    );
    graph.push(
      iconMarkup(
        icons,
        style.icon,
        card.x + K.pad,
        card.y + K.pad + (T.name.line - K.icon) / 2,
        K.icon,
        hue,
      ),
    );
    const { name, details } = metrics.cardText(component, card.width);
    let top = card.y + K.pad;
    for (const line of name)
      top = text(
        "cards",
        line,
        card.x + K.pad + K.icon + K.iconGap,
        top,
        T.name,
        component.status === "retired" ? C.muted : C.ink,
      );
    top += K.detailGap;
    for (const line of details) top = text("cards", line, card.x + K.pad, top, T.detail, C.muted);
  }
  const labelShapes = [];
  for (const label of layout.labels) {
    const fill =
      label.row !== undefined
        ? layout.labelled
          ? bandFill(label.row)
          : C.paper
        : fillAt(label.y + label.height / 2);
    labelShapes.push(
      `<rect x="${fixed(label.x)}" y="${fixed(label.y)}" width="${fixed(label.width)}" height="${fixed(label.height)}" rx="5" fill="${fill}"/>`,
    );
    let top = label.y + W.labelPadY;
    for (const line of label.lines) {
      const style = line.role === "label" ? T.edge : T.edgeDetail;
      top = text(
        "labels",
        line.text,
        label.x + (label.width - typefaces.measure(line.text, style)) / 2,
        top,
        style,
        line.role === "label" ? C.ink : C.muted,
      );
    }
  }

  // Legend: the kinds present, the boundary and the statuses present.
  y = footerTop;
  let x = POSTER.margin.x;
  const entries = [];
  for (const component of view.components) {
    const style = presentation(model, component);
    if (!entries.some((entry) => entry.kind === style.kind)) entries.push(style);
  }
  for (const entry of entries) {
    page.push(
      iconMarkup(
        icons,
        entry.icon,
        x,
        y + 1,
        18,
        POSTER.hue[/** @type {keyof typeof POSTER.hue} */ (entry.category)],
      ),
    );
    text("page", entry.label, x + 25, y, T.legend, C.ink);
    x += 25 + typefaces.measure(entry.label, T.legend) + 28;
  }
  if (boundary) {
    page.push(
      `<rect x="${fixed(x)}" y="${fixed(y + 3)}" width="22" height="14" rx="4" fill="none" stroke="${C.boundary}" stroke-dasharray="4 3"/>`,
    );
    const inside = `inside ${boundary.name}`;
    text("page", inside, x + 30, y, T.legend, C.ink);
    x += 30 + typefaces.measure(inside, T.legend) + 28;
    page.push(
      `<rect x="${fixed(x)}" y="${fixed(y + 3)}" width="22" height="14" rx="4" fill="${C.external}" stroke="${C.externalStroke}"/>`,
    );
    text("page", "outside it", x + 30, y, T.legend, C.ink);
    x += 30 + typefaces.measure("outside it", T.legend) + 28;
  }
  for (const status of ["planned", "retired"].filter((status) =>
    [...view.components, ...view.relations].some((item) => item.status === status),
  )) {
    page.push(
      `<line x1="${fixed(x)}" y1="${fixed(y + 10)}" x2="${fixed(x + 24)}" y2="${fixed(y + 10)}" stroke="${status === "retired" ? C.faint : C.line}" stroke-width="${W.stroke}" stroke-dasharray="${DASH[status]}"/>`,
    );
    text("page", status, x + 32, y, T.legend, C.ink);
    x += 32 + typefaces.measure(status, T.legend) + 28;
  }
  if (x > POSTER.width - POSTER.margin.x)
    refuse(
      "poster_legend_too_wide",
      `The legend of view ${view.id} does not fit one line; use fewer kinds in the view.`,
    );
  y += T.legend.line + 14;
  page.push(
    `<line x1="${POSTER.margin.x}" y1="${y}" x2="${POSTER.width - POSTER.margin.x}" y2="${y}" stroke="${C.rule}"/>`,
  );
  y += 12;
  for (const line of notes) y = text("page", line, POSTER.margin.x, y, T.foot, C.muted);

  const layer = (name) => {
    const byColor = new Map();
    for (const run of runs.filter((item) => item.layer === name))
      byColor.set(
        run.color,
        (byColor.get(run.color) ?? "") + typefaces.outline(run.value, run.x, run.y, run.style),
      );
    return [...byColor].map(([color, d]) => `<path fill="${color}" d="${d}"/>`);
  };
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER.width}" height="${POSTER.height}" viewBox="0 0 ${POSTER.width} ${POSTER.height}">`,
    `<rect width="${POSTER.width}" height="${POSTER.height}" fill="${C.paper}"/>`,
    ...page,
    ...layer("page"),
    `<g transform="translate(${fixed(offsetX)},${fixed(offsetY)}) scale(${scale})">`,
    ...graph,
    ...layer("graph"),
    ...layer("cards"),
    ...labelShapes,
    ...layer("labels"),
    "</g>",
    "</svg>",
    "",
  ].join("\n");
  const requiredHeight = Math.ceil(
    headerBottom + layout.height + POSTER.stageGap + (POSTER.height - footerTop),
  );
  return {
    view: view.id,
    width: POSTER.width,
    height: POSTER.height,
    fits,
    required: { width: POSTER.width, height: requiredHeight },
    scale,
    measures: layout.measures,
    svg,
  };
}
