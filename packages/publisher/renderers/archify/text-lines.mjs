import { fail } from "../../src/protocol/values.mjs";
import { TEXT_MEASUREMENT_LIMITS as limits } from "../resvg/measurement.mjs";

/** Logical breaks and tab paint are internal; ranges use original UTF-16 string offsets. */
export function architectureLogicalLines(text) {
  if (text.length > limits.measurementGlyphs) fail("authored_canvas_text_measurement_limit");
  const lines = [];
  let from = 0;
  const append = (to, end) => {
    const source = text.slice(from, to);
    const stops = new Map([[0, from]]);
    let paintText = "";
    for (const { segment, index } of new Intl.Segmenter("und", {
      granularity: "grapheme",
    }).segment(source)) {
      paintText += segment === "\t" ? "    " : segment;
      stops.set(paintText.length, from + index + segment.length);
    }
    lines.push({ sourceStart: from, sourceEnd: end, paintText, stops });
    from = end;
  };
  for (const match of text.matchAll(/\r\n|\r|\n/gu))
    append(match.index, match.index + match[0].length);
  append(text.length, text.length);
  if (lines.length > limits.measurementQueries) fail("authored_canvas_text_measurement_limit");
  return lines;
}

export const architecturePaintRequest = (row) => ({
  ...row,
  text: row.paintText ?? row.text,
});

function wrapLine(text, request, width, measure, balanced) {
  const characters = [...new Intl.Segmenter("und", { granularity: "grapheme" }).segment(text)].map(
    ({ segment }) => segment,
  );
  const rows = [];
  let start = 0;
  while (start < characters.length) {
    const rowStart = start;
    while (characters[start] === " ") start++;
    if (start === characters.length) return null;
    let low = 1;
    let high = Math.min(characters.length - start, limits.measurementTextLength);
    let count = 0;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const value = characters.slice(start, start + middle).join("");
      if (value.length > limits.measurementTextLength) {
        high = middle - 1;
        continue;
      }
      if (measure.candidateWidth(request(value)) <= width) {
        count = middle;
        low = middle + 1;
      } else high = middle - 1;
    }
    if (!count) return null;
    if (start + count < characters.length) {
      const breakAt = characters.slice(start, start + count).lastIndexOf(" ");
      if (breakAt > 0) count = breakAt + 1;
    }
    let end = start + count;
    while (characters[end] === " ") end++;
    rows.push(request(characters.slice(rowStart, end).join("")));
    start = end;
  }
  if (rows.map(({ text }) => text).join("") !== text) fail("render_node_text_identity_invalid");
  if (!balanced || rows.length < 2) return rows;
  const boundaries = [0];
  for (const match of text.matchAll(/[^ ]+ */gu)) boundaries.push(match.index + match[0].length);
  const choices = new Map([[text.length, { lines: 0, cost: 0 }]]);
  for (let index = boundaries.length - 2; index >= 0; index--) {
    const from = boundaries[index];
    if (from && /^[\p{Punctuation}\p{Symbol}]+(?: |$)/u.test(text.slice(from))) continue;
    let selected;
    for (let next = index + 1; next < boundaries.length; next++) {
      const to = boundaries[next];
      const visible = text.slice(from, to).trim();
      if (visible.length > limits.measurementTextLength) break;
      const extent = measure.candidateWidth(request(visible));
      if (extent > width) break;
      const continuation = choices.get(to);
      if (!continuation) continue;
      const lines = continuation.lines + 1;
      const cost = continuation.cost + (width - extent) ** 2;
      if (!selected || lines < selected.lines || (lines === selected.lines && cost < selected.cost))
        selected = { lines, cost, to };
    }
    if (selected) choices.set(from, selected);
  }
  if (!choices.has(0)) return rows;
  const result = [];
  for (let from = 0; from < text.length;) {
    const { to } = choices.get(from);
    result.push(request(text.slice(from, to)));
    from = to;
  }
  return result;
}

/** Exact logical-line planning precedes the unchanged single-line font primitive. */
export function wrapArchitectureText(
  text,
  fontSize,
  weight,
  width,
  measure,
  family = undefined,
  balanced = true,
) {
  if (text === "") return [];
  const request = (value) => ({
    text: value,
    fontSize,
    weight,
    anchor: "middle",
    x: 0,
    baseline: 0,
    ...(family ? { family } : {}),
  });
  const result = [];
  for (const line of architectureLogicalLines(text)) {
    const rows = line.paintText.trim()
      ? wrapLine(line.paintText, request, width, measure, balanced)
      : [request(line.paintText)];
    if (!rows) return null;
    let offset = 0;
    for (const [index, row] of rows.entries()) {
      const sourceStart = line.stops.get(offset);
      offset += row.text.length;
      const sourceEnd = index === rows.length - 1 ? line.sourceEnd : line.stops.get(offset);
      if (sourceStart === undefined || sourceEnd === undefined)
        fail("render_node_text_identity_invalid");
      result.push({
        ...row,
        text: text.slice(sourceStart, sourceEnd),
        paintText: row.text,
        sourceStart,
        sourceEnd,
        painted: row.text.trim().length > 0,
      });
    }
  }
  if (result.length > limits.measurementQueries) fail("authored_canvas_text_measurement_limit");
  if (result.map(({ text }) => text).join("") !== text) fail("render_node_text_identity_invalid");
  return result;
}
