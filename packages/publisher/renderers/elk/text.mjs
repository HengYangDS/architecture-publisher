import { fail } from '../../src/protocol/values.mjs';

/** Exact selected words, with measured glyph positions relative to the layout label. */
export function measuredLabel(
  value,
  measure,
  { fontSize = 16, weight = '600', maximumWidth = 216, maximumLines = 4 } = {},
) {
  if (typeof value !== 'string' || !value.trim()) fail('render_interactive_text_infeasible');
  if (typeof measure?.box !== 'function') fail('render_interactive_text_measurement_required');
  if (value.length > 4096 || [...value].some((character) => character.codePointAt(0) < 32))
    fail('render_interactive_text_infeasible');
  const box = (text) => measure.box({ text, fontSize, weight, anchor: 'start', x: 0, baseline: 0 });
  const lines = [];
  let current = '';
  for (const word of value.trim().split(/\s+/u)) {
    if (box(word).width > maximumWidth) fail('render_interactive_text_infeasible');
    const next = current ? `${current} ${word}` : word;
    if (box(next).width <= maximumWidth) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maximumLines) fail('render_interactive_text_infeasible');
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
  const left = Math.min(...baselines.map(({ box }) => box.x));
  const top = Math.min(...baselines.map(({ box }) => box.y));
  const right = Math.max(...baselines.map(({ box }) => box.x + box.width));
  const bottom = Math.max(...baselines.map(({ box }) => box.y + box.height));
  return {
    x,
    y,
    width: plan.width,
    height: plan.height,
    lines: [...plan.lines],
    fontSize: plan.fontSize,
    weight: plan.weight,
    baselines,
    paintBox: { x: left, y: top, width: right - left, height: bottom - top },
  };
}
