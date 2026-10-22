import { createBundledTextMeasurer } from "../resvg/measurement.mjs";
import { fail } from "../../src/protocol/values.mjs";

const legendMinimumLineGap = 32;

export function architectureExploration(scene, exploration) {
  return (
    exploration ?? {
      nodes: scene.nodes
        .filter((node) => !node.adornment)
        .map((node) => ({
          id: node.id,
          label: node.label ?? node.id,
          kind: node.figureKind ?? node.visualRole ?? "component",
        })),
      relations: [],
      limits: [],
    }
  );
}

/** One complete measured frame feeds native placement ranking and final paint. */
export function intrinsicArchitectureFrame(bounds, inset, measured) {
  const { entries, spacing } = measured;
  const width = Math.max(
    Math.ceil(bounds.width + inset * 2),
    entries.length ? Math.ceil(Math.max(...entries.map((entry) => entry.width)) + 80) : 0,
  );
  const footprint = alignedLegendFootprint(entries, {
    width: width - 80,
    itemGap: spacing.columnGap,
    lineGap: spacing.rowAdvance,
  });
  const reserve = entries.length
    ? spacing.contentGap + spacing.height + footprint.extraHeight + spacing.bottomInset
    : 0;
  const height = Math.ceil(bounds.height + inset * 2 + reserve);
  return {
    viewport: { width, height },
    legend: {
      ...measured,
      footprint,
      top: height - spacing.bottomInset - spacing.height - footprint.extraHeight,
    },
  };
}

/** One compact column grid owns both reserved space and final native placement. */
export function alignedLegendFootprint(
  entries,
  { width, itemGap = 22, lineGap = legendMinimumLineGap } = {},
) {
  if (!entries.length) return { measured: [], rows: [], rowCount: 0, minWidth: 0, extraHeight: 0 };
  const columnWidth = Math.max(...entries.map(({ width }) => width));
  const capacity = Math.max(
    1,
    Math.min(entries.length, Math.floor((width + itemGap) / (columnWidth + itemGap))),
  );
  const rowCount = Math.ceil(entries.length / capacity);
  const columns = Math.ceil(entries.length / rowCount);
  const rows = [];
  for (let index = 0; index < entries.length; index += columns)
    rows.push(entries.slice(index, index + columns).map((entry) => ({ ...entry, columnWidth })));
  return {
    measured: entries,
    rows,
    rowCount: rows.length,
    minWidth: columnWidth,
    extraHeight: (rows.length - 1) * lineGap,
  };
}

/** Measure exact declared type labels with the same selected font as the diagram. */
export async function measureArchitectureLegend(scene, budget, fonts, exploration) {
  const graph = architectureExploration(scene, exploration);
  const ordinary = new Set(
    scene.nodes.filter((node) => !node.primitives && !node.adornment).map(({ id }) => id),
  );
  const kinds = [
    ...new Set(graph.nodes.filter(({ id }) => ordinary.has(id)).map(({ kind }) => kind)),
  ];
  if (!kinds.length)
    return {
      entries: [],
      title: null,
      spacing: { height: 0, bottomInset: 0 },
      supplies: [],
    };
  const labels = new Map(scene.nodes.map((node) => [node.id, node.figureLabel]));
  const wording = new Map(graph.nodes.map(({ id, kind }) => [kind, labels.get(id) ?? kind]));
  const request = (text, weight = "400") => ({
    text,
    fontSize: budget.minimum,
    weight,
    anchor: "start",
    x: 0,
    baseline: 0,
  });
  const requests = kinds.map((kind) => request(wording.get(kind)));
  const titleRequest = request("Legend", "600");
  const measure = await createBundledTextMeasurer(fonts, [...requests, titleRequest]);
  const boxes = requests.map((request) => measure.box(request));
  const labelInset = Math.max(0, ...boxes.map(({ x }) => -x));
  const swatchGap = Math.max(budget.sigilInset, budget.minimum);
  const swatchY =
    (Math.min(0, ...boxes.map(({ y }) => y)) +
      Math.max(0, ...boxes.map(({ y, height }) => y + height)) -
      budget.sigilSize) /
    2;
  const entries = kinds.map((kind, index) => {
    const box = boxes[index];
    return {
      kind,
      label: wording.get(kind),
      weight: requests[index].weight,
      family: measure.defaultFamily,
      box,
      swatchY,
      top: Math.min(box.y, swatchY),
      bottom: Math.max(box.y + box.height, swatchY + budget.sigilSize),
      swatchWidth: budget.sigilSize,
      swatchGap,
      labelInset,
      width:
        Math.ceil(budget.sigilSize + swatchGap + labelInset + box.x + box.width) +
        12 +
        Math.max(
          14,
          String(graph.nodes.filter((node) => node.kind === kind).length).length * 5 + 8,
        ),
      interactive: true,
    };
  });
  const title = { ...titleRequest, family: measure.defaultFamily, box: measure.box(titleRequest) };
  const top = Math.min(0, ...entries.map(({ top }) => top));
  const bottom = Math.max(0, ...entries.map(({ bottom }) => bottom));
  const firstBaseline = Math.ceil(title.box.height + budget.minimum - top);
  return {
    entries,
    title,
    spacing: {
      titleBaseline: -title.box.y,
      firstBaseline,
      rowAdvance: Math.max(legendMinimumLineGap, Math.ceil(bottom - top + budget.minimum)),
      height: firstBaseline + bottom,
      columnGap: Math.ceil(budget.minimum * 2),
      contentGap: Math.ceil(budget.minimum * 2),
      bottomInset: Math.max(16, Math.ceil(budget.minimum)),
    },
    supplies: [measure.supply],
  };
}

/** Populate the native reader's data carrier without modifying executable bytes. */
export function applyArchitectureTypeLabels(bytes, scene) {
  const labels = scene.nodes
    .filter((node) => !node.primitives && !node.adornment && node.figureLabel !== undefined)
    .map((node) => [`viewer.kind.${node.figureKind.toLowerCase()}`, node.figureLabel]);
  if (!labels.length) return bytes;
  const html = bytes.toString("utf8");
  const pattern = /(<script\b[^>]*\bid="archify-i18n-data"[^>]*>)([\s\S]*?)(<\/script>)/gu;
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) fail("render_type_label_carrier_invalid");
  let data;
  try {
    data = JSON.parse(matches[0][2]);
  } catch {
    fail("render_type_label_carrier_invalid");
  }
  if (!data?.messages || typeof data.messages !== "object" || Array.isArray(data.messages))
    fail("render_type_label_carrier_invalid");
  Object.assign(data.messages, Object.fromEntries(labels));
  const content = JSON.stringify(data).replaceAll("<", "\\u003c");
  return Buffer.from(
    html.replace(pattern, (_, before, _previous, after) => before + content + after),
  );
}
