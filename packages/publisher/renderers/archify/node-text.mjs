import { fail } from "../../src/protocol/values.mjs";
import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";
import {
  architectureLogicalLines,
  architecturePaintRequest,
  wrapArchitectureText,
} from "./text-lines.mjs";
import { TEXT_MEASUREMENT_LIMITS } from "../resvg/measurement.mjs";

/** One source-space budget feeds intrinsic footprints, native paint and clearance. */
export function architectureTextBudget(minimum) {
  return {
    minimum,
    primary: Math.ceil(minimum * 1.2 * 10) / 10,
    sigilSize: Math.ceil(minimum * 1.5 * 10) / 10,
    sigilInset: Math.ceil(minimum * 0.5 * 10) / 10,
    maskTop: Math.ceil(minimum * 1.2),
    maskHeight: Math.ceil(minimum * 1.5),
  };
}

/** Exact ink travel and the measured return between consecutive text lines. */
function readingDistance(rows) {
  return rows.slice(1).reduce(
    (distance, row, index) => {
      const prior = rows[index];
      return (
        distance +
        Math.abs(prior.box.x + prior.box.width - row.box.x) +
        Math.abs(row.baseline - prior.baseline)
      );
    },
    rows.reduce((distance, { box }) => distance + box.width, 0),
  );
}

/** Group complete painted rows by their original reading identity before comparison. */
export function architectureReadingDistances(scene, candidate) {
  const rows = new Map();
  const add = (identity, measuredRows) => {
    const key = JSON.stringify(identity);
    rows.set(key, [...(rows.get(key) ?? []), ...measuredRows]);
  };
  for (const [id, layout] of Object.entries(candidate.nodeText.layouts))
    for (const row of layout.rows)
      if (row.painted)
        add(["node", id, row.field, row.occurrence ?? null], [{ ...row, baseline: row.y }]);
  for (const [id, edge] of Object.entries(candidate.physical.edges))
    if (edge.label) add(["edge", id], edge.label.baselines);
  for (const group of candidate.physical.groups) add(["group", group.id], group.label.baselines);
  for (const text of scene.texts ?? [])
    if (!scene.nodes.some(({ id }) => id === text.owner)) {
      const plan = candidate.physical.texts[text.id];
      add(["text", text.id], plan.baselines);
    }
  return new Map([...rows].map(([key, measuredRows]) => [key, readingDistance(measuredRows)]));
}

function nodeFields(node, scene, budget, intrinsic) {
  return [
    { field: "label", text: node.label, font: budget.primary, weight: "600" },
    ...(node.detail
      ? [{ field: "detail", text: node.detail, font: budget.minimum, weight: "400" }]
      : []),
    ...(node.note ? [{ field: "note", text: node.note, font: budget.minimum, weight: "400" }] : []),
    ...(intrinsic
      ? (scene.texts ?? [])
          .filter(({ owner }) => owner === node.id)
          .map(({ id, text, weight, family }) => ({
            field: "statement",
            occurrence: id,
            text,
            font: budget.minimum,
            weight,
            ...(family ? { family } : {}),
          }))
      : []),
  ];
}

/** Exact ink and line breaks shared by relation labels and free text occurrences. */
export async function measureArchitectureLabels(
  labels,
  budget,
  fonts,
  createTextMeasurer,
  { maximumWidth = 240 } = {},
) {
  const advance = await createTextMeasurer(fonts);
  const padding = Math.max(6, Math.ceil(budget.minimum * 0.45));
  const candidates = labels.map((label) => {
    const rows = wrapArchitectureText(
      label.text,
      budget.minimum,
      label.weight ?? "400",
      maximumWidth,
      advance,
      label.family,
    );
    if (!rows) fail("render_node_text_infeasible");
    return { label, rows };
  });
  const measure = await createTextMeasurer(
    fonts,
    candidates.flatMap(({ rows }) =>
      rows.filter(({ painted }) => painted).map(architecturePaintRequest),
    ),
  );
  const layouts = Object.create(null);
  for (const { label, rows } of candidates) {
    if (!rows.length) {
      layouts[label.id] = {
        lines: [""],
        width: 0,
        height: 0,
        fontSize: budget.minimum,
        weight: label.weight ?? "400",
        baselines: [],
      };
      continue;
    }
    const ink = rows.map((row) =>
      row.painted
        ? measure.box(architecturePaintRequest(row))
        : { x: 0, y: 0, width: 0, height: 0 },
    );
    const width = Math.ceil((Math.max(...ink.map((box) => box.width)) + padding * 2) / 8) * 8;
    const baselines = [];
    for (const [index, row] of rows.entries()) {
      const previous = baselines[index - 1];
      const baseline = index
        ? Math.max(
            previous.baseline + budget.minimum * 1.5,
            previous.box.y + previous.box.height + padding - ink[index].y,
          )
        : padding - ink[index].y;
      const x = (width - ink[index].width) / 2 - ink[index].x;
      baselines.push({
        ...row,
        x,
        baseline,
        box: { ...ink[index], x: ink[index].x + x, y: ink[index].y + baseline },
      });
    }
    layouts[label.id] = {
      lines: rows.map(({ text }) => text),
      width,
      height:
        Math.ceil(
          (Math.max(
            baselines.at(-1).box.y + baselines.at(-1).box.height,
            baselines.at(-1).baseline + (rows.at(-1).painted ? 0 : budget.minimum * 1.5),
          ) +
            padding) /
            8,
        ) * 8,
      fontSize: budget.minimum,
      weight: label.weight ?? "400",
      baselines: baselines.filter(({ painted }) => painted),
      family: label.family ?? measure.defaultFamily,
    };
  }
  return { layouts, supplies: [measure.supply] };
}

/** Measure one derived row set; authored strings and geometry are never rewritten. */
export async function measureArchitectureNodeText(
  scene,
  budget,
  fonts,
  createTextMeasurer,
  { maximumWidth = 280, preferredWidth = maximumWidth, alignColumns = false } = {},
) {
  const ordinary = scene.nodes.filter((node) => !node.primitives);
  const intrinsic = ordinary.some((node) => node.size === undefined);
  if (intrinsic && ordinary.some((node) => node.size !== undefined))
    fail("render_node_text_geometry_mixed");
  const advance = await createTextMeasurer(fonts);
  const widths = new Map();
  if (intrinsic)
    for (const node of ordinary) {
      const padding = Math.max(8, budget.minimum * 0.6);
      const rail = node.icon !== "none" ? budget.sigilInset + budget.sigilSize + padding : padding;
      const fields = nodeFields(node, scene, budget, true);
      const extents = fields.map(({ field, text, font: fontSize, weight, family }) => {
        const request = (text) => ({
          text,
          fontSize,
          weight,
          anchor: "middle",
          x: 0,
          baseline: 0,
          ...(family ? { family } : {}),
        });
        const width = (text) =>
          text.length > TEXT_MEASUREMENT_LIMITS.measurementTextLength
            ? maximumWidth + 1
            : advance.candidateWidth(request(text));
        return {
          field,
          full: Math.max(
            0,
            ...architectureLogicalLines(text)
              .filter(({ paintText }) => paintText.trim())
              .map(({ paintText }) => width(paintText)),
          ),
          word: Math.max(
            0,
            ...architectureLogicalLines(text).flatMap(({ paintText }) =>
              [...paintText.matchAll(/[^ ]+/gu)].map(([word]) => width(word)),
            ),
          ),
        };
      });
      const required = (key) =>
        Math.ceil((Math.max(...extents.map((extent) => extent[key])) + rail + padding * 2) / 8) * 8;
      const headline =
        Math.ceil((extents.find(({ field }) => field === "label").full + rail + padding * 2) / 8) *
        8;
      const width = Math.min(
        maximumWidth,
        Math.max(Math.min(preferredWidth, required("full")), required("word"), headline),
      );
      widths.set(node.id, width);
    }
  if (intrinsic && alignColumns) {
    const columnWidth = Math.max(...widths.values());
    for (const id of widths.keys()) widths.set(id, columnWidth);
  }
  const plans = new Map();
  const requests = [];
  for (const source of ordinary) {
    const node = intrinsic
      ? { ...source, size: { width: widths.get(source.id), height: 12000 } }
      : source;
    const padding = Math.max(intrinsic ? 8 : 2, budget.minimum * (intrinsic ? 0.6 : 0.2));
    const glyph = node.icon !== "none";
    const rail = glyph ? budget.sigilInset + budget.sigilSize + padding : padding;
    const regions = intrinsic
      ? [{ left: rail + padding, right: node.size.width - padding, top: padding }]
      : [
          { left: padding, right: node.size.width - padding, top: padding },
          ...(glyph
            ? [
                { left: rail + padding, right: node.size.width - padding, top: padding },
                { left: padding, right: node.size.width - padding, top: rail + padding },
              ]
            : []),
        ];
    const fields = nodeFields(node, scene, budget, intrinsic);
    const candidates = regions.flatMap((region) => {
      if (region.right <= region.left) return [];
      const rows = [];
      for (const field of fields) {
        const lines = wrapArchitectureText(
          field.text,
          field.font,
          field.weight,
          region.right - region.left,
          advance,
          field.family,
          intrinsic,
        );
        if (!lines) return [];
        for (const line of lines) {
          const row = {
            ...line,
            field: field.field,
            ...(field.occurrence ? { occurrence: field.occurrence } : {}),
          };
          rows.push(row);
          if (row.painted) requests.push(architecturePaintRequest(row));
        }
      }
      return [{ region, rows }];
    });
    plans.set(node.id, { node, padding, glyph, candidates });
  }
  const measure = await createTextMeasurer(fonts, requests);
  const titleAscent = intrinsic
    ? Math.max(
        budget.primary,
        ...requests
          .filter(({ field }) => field === "label")
          .map((row) => Math.max(-measure.box(row).y, measure.lineMetrics(row).ascent)),
      )
    : null;
  const measuredPlans = [...plans].map(([id, plan]) => {
    const candidates = plan.candidates.map((candidate) => {
      const ink = candidate.rows.map((row) =>
        row.painted
          ? measure.box(architecturePaintRequest(row))
          : { x: 0, y: 0, width: 0, height: 0 },
      );
      const capacity = candidate.rows.map((row, index) => {
        if (!intrinsic || !row.painted) return ink[index];
        const line = measure.lineMetrics(architecturePaintRequest(row));
        const y = Math.min(ink[index].y, -line.ascent);
        return { y, height: Math.max(ink[index].y + ink[index].height, line.descent) - y };
      });
      const baselines = [];
      for (const [index, row] of candidate.rows.entries()) {
        const previous = candidate.rows[index - 1];
        const sameBlock =
          previous?.field === row.field && (!intrinsic || previous.occurrence === row.occurrence);
        // Perimeter inset belongs to the node once. Leading belongs to the
        // selected font envelope; only a change of field adds a separator.
        const clearance = intrinsic ? (sameBlock ? 0 : budget.minimum * 0.25) : plan.padding;
        baselines.push(
          index
            ? Math.max(
                baselines[index - 1] + previous.fontSize * (sameBlock ? 1.35 : 1.5),
                baselines[index - 1] +
                  capacity[index - 1].y +
                  capacity[index - 1].height +
                  clearance -
                  capacity[index].y,
                ...(intrinsic
                  ? [
                      baselines[index - 1] +
                        ink[index - 1].y +
                        ink[index - 1].height +
                        marks.textClearance -
                        ink[index].y,
                    ]
                  : []),
              )
            : (titleAscent ?? -ink[0].y),
        );
      }
      const last = ink.length - 1;
      return {
        ...candidate,
        ink,
        baselines,
        height:
          baselines[last] +
          (candidate.rows[last].painted
            ? capacity[last].y + capacity[last].height
            : candidate.rows[last].fontSize * 1.35),
      };
    });
    return [id, { ...plan, candidates }];
  });
  const heights = new Map();
  if (intrinsic)
    for (const [id, plan] of measuredPlans) {
      const candidate = plan.candidates[0];
      if (!candidate) fail("render_node_text_infeasible");
      const height =
        Math.ceil(
          Math.max(
            candidate.region.top + candidate.height + plan.padding,
            plan.glyph ? budget.sigilInset + budget.sigilSize + plan.padding : 0,
          ) / 8,
        ) * 8;
      if (height > 12000) fail("render_node_text_infeasible");
      heights.set(id, height);
    }
  const layouts = Object.create(null);
  const sizes = Object.create(null);
  for (const [id, { node, padding, glyph, candidates }] of measuredPlans) {
    const size = intrinsic ? { width: node.size.width, height: heights.get(id) } : node.size;
    sizes[id] = size;
    let selected;
    for (const candidate of candidates) {
      const { ink, baselines, height } = candidate;
      const available = size.height - padding - candidate.region.top;
      if (height > available) continue;
      const offset = candidate.region.top + (intrinsic ? 0 : (available - height) / 2);
      const rows = candidate.rows.map((row, index) => {
        const x = intrinsic
          ? candidate.region.left - ink[index].x
          : (candidate.region.left + candidate.region.right) / 2 -
            (ink[index].x + ink[index].width / 2);
        const y = offset + baselines[index];
        return { ...row, x, y, box: { ...ink[index], x: ink[index].x + x, y: ink[index].y + y } };
      });
      const collides = rows.some(({ painted, box }) => {
        if (!painted) return false;
        const outside =
          box.x < padding - 0.01 ||
          box.x + box.width > size.width - padding + 0.01 ||
          box.y < padding - 0.01 ||
          box.y + box.height > size.height - padding + 0.01;
        const glyphCollision =
          glyph &&
          box.x < budget.sigilInset + budget.sigilSize + padding &&
          box.x + box.width > budget.sigilInset - padding &&
          box.y < budget.sigilInset + budget.sigilSize + padding &&
          box.y + box.height > budget.sigilInset - padding;
        return outside || glyphCollision;
      });
      if (collides) continue;
      selected = {
        valid: true,
        rows,
        sigilY: budget.sigilInset,
        sigilSize: budget.sigilSize,
        family: measure.defaultFamily,
      };
      break;
    }
    layouts[id] = selected ?? {
      valid: false,
      rows: [],
      sigilY: budget.sigilInset,
      sigilSize: budget.sigilSize,
    };
  }
  return { layouts, sizes, supplies: [measure.supply] };
}

/** Painting consumes exactly the rows used by measured clearance. */
export function renderMeasuredNodeText(layout, component, accent, escape) {
  const fields = ["label", "detail", "note"];
  return fields
    .map((field) => {
      const rows = layout.rows.filter((row) => row.field === field && row.painted);
      if (!rows.length) return "";
      const attributes =
        field === "label"
          ? 'data-node-label=""'
          : `data-detail="${field === "detail" ? "context" : "fine"}"`;
      const tone = field === "label" ? "t-primary" : field === "detail" ? "t-muted" : accent;
      const position =
        rows.length === 1 ? ` x="${component.x + rows[0].x}" y="${component.y + rows[0].y}"` : "";
      const content =
        rows.length === 1
          ? escape(rows[0].paintText)
          : rows
              .map(
                (row) =>
                  `<tspan x="${component.x + row.x}" y="${component.y + row.y}">${escape(row.paintText)}</tspan>`,
              )
              .join("");
      return `<text ${attributes}${position} class="${tone}" font-family="${escape(JSON.stringify(layout.family))}" font-size="${rows[0].fontSize}" font-weight="${rows[0].weight}" text-anchor="middle" xml:space="preserve">${content}</text>`;
    })
    .join("\n");
}
