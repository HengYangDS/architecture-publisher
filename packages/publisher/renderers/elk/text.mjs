import { fail } from "../../src/protocol/values.mjs";

function labelWords(value) {
  if (typeof value !== "string" || !value.trim()) fail("render_interactive_text_infeasible");
  if (value.length > 4096 || [...value].some((character) => character.codePointAt(0) < 32))
    fail("render_interactive_text_infeasible");
  return value.trim().split(/\s+/u);
}

/** Prepare every possible contiguous line; no character-count layout estimate. */
export function* wrappedLabelRequests(value, { fontSize = 16, weight = "600" } = {}) {
  const words = labelWords(value);
  for (let start = 0; start < words.length; start++) {
    let text = "";
    for (let end = start; end < words.length; end++) {
      text = text ? `${text} ${words[end]}` : words[end];
      yield { text, fontSize, weight, anchor: "start", x: 0, baseline: 0 };
    }
  }
}

/** Mirror the one native geometry owner's group, node and relation label roles. */
export function* interactiveLabelRequests(pages) {
  for (const page of pages) {
    for (const group of page.groups ?? []) yield* wrappedLabelRequests(group.label);
    for (const node of page.nodes) yield* wrappedLabelRequests(node.label);
    for (const relation of page.relations)
      if (relation.graphLabel?.trim())
        yield* wrappedLabelRequests(relation.graphLabel, { fontSize: 13, weight: "400" });
  }
}

/** Exact selected words, with measured glyph positions relative to the layout label. */
export function measuredLabel(
  value,
  measure,
  { fontSize = 16, weight = "600", maximumWidth = 216, maximumLines = 4 } = {},
) {
  const words = labelWords(value);
  if (typeof measure?.box !== "function") fail("render_interactive_text_measurement_required");
  const box = (text) => measure.box({ text, fontSize, weight, anchor: "start", x: 0, baseline: 0 });
  const lines = [];
  let current = "";
  for (const word of words) {
    if (box(word).width > maximumWidth) fail("render_interactive_text_infeasible");
    const next = current ? `${current} ${word}` : word;
    if (box(next).width <= maximumWidth) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maximumLines) fail("render_interactive_text_infeasible");
  const boxes = lines.map(box);
  const width = Math.ceil(Math.max(...boxes.map(({ width }) => width))) + 24;
  const ascent = Math.max(...boxes.map(({ y }) => -y));
  const descent = Math.max(...boxes.map(({ y, height }) => y + height));
  const lineHeight = Math.ceil(Math.max(fontSize * 1.4, ascent + descent + 4));
  const height = Math.ceil(ascent + descent + (lines.length - 1) * lineHeight) + 20;
  const baselines = lines.map((text, index) => {
    const metric = boxes[index];
    const x = (width - metric.width) / 2 - metric.x;
    const baseline = 10 + ascent + index * lineHeight;
    return { text, x, baseline, box: boxAt(metric, x, baseline) };
  });
  return { lines, width, height, fontSize, weight, baselines };
}

function boxAt(box, x, baseline) {
  return { x: box.x + x, y: box.y + baseline, width: box.width, height: box.height };
}

export function placeMeasuredLabel(plan, x, y) {
  const baselines = plan.baselines.map((line) => ({
    ...line,
    x: line.x + x,
    baseline: line.baseline + y,
    box: { ...line.box, x: line.box.x + x, y: line.box.y + y },
  }));
  const left = baselines.length ? Math.min(...baselines.map(({ box }) => box.x)) : x;
  const top = baselines.length ? Math.min(...baselines.map(({ box }) => box.y)) : y;
  const right = baselines.length ? Math.max(...baselines.map(({ box }) => box.x + box.width)) : x;
  const bottom = baselines.length ? Math.max(...baselines.map(({ box }) => box.y + box.height)) : y;
  return {
    x,
    y,
    width: plan.width,
    height: plan.height,
    lines: [...plan.lines],
    fontSize: plan.fontSize,
    weight: plan.weight,
    ...(plan.family ? { family: plan.family } : {}),
    baselines,
    paintBox: { x: left, y: top, width: right - left, height: bottom - top },
  };
}
