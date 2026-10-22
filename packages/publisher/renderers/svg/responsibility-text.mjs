import { fail } from "../../src/protocol/values.mjs";

export const colors = {
  paper: "#f8f7f2",
  ink: "#24362e",
  muted: "#5c6d60",
  rule: "#bac8bb",
  source: "#617e69",
  editorial: "#a46f4c",
};

export const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const number = (value) => {
  if (!Number.isFinite(value) || Math.abs(value) > 10_000_000)
    fail("static_responsibility_geometry_invalid");
  return Number(value.toFixed(2));
};

export const advance = (value, size) => [...value].length * size * 0.61;

export function wrap(value, width, size, limit = 6) {
  if (typeof value !== "string" || !value.trim() || width < size * 3)
    fail("static_responsibility_text_unrepresentable");
  const result = [];
  let current = "";
  for (const word of value.trim().split(/\s+/u)) {
    const joined = current ? `${current} ${word}` : word;
    if (advance(joined, size) <= width) {
      current = joined;
      continue;
    }
    if (current) result.push(current);
    if (advance(word, size) > width || result.length >= limit)
      fail("static_responsibility_text_unrepresentable");
    current = word;
  }
  if (current) result.push(current);
  if (result.length > limit) fail("static_responsibility_text_unrepresentable");
  return result;
}

export function textLines(
  output,
  value,
  x,
  y,
  width,
  size,
  color,
  weight = 400,
  limit = 6,
  anchor = "start",
) {
  const content = wrap(value, width, size, limit);
  for (const [index, line] of content.entries())
    output.push(
      `<text x="${number(x)}" y="${number(y + index * size * 1.43)}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(line)}</text>`,
    );
  return y + content.length * size * 1.43;
}
