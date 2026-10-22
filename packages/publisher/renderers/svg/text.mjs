import { fail } from "../../src/protocol/values.mjs";

export const measureStaticText = (value, size) => [...value].length * size * 0.61;

export const escapeStaticText = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function wrapStaticText(value, width, size, limit = 12) {
  if (typeof value !== "string" || !value.trim()) fail("static_edition_text_unrepresentable");
  const lines = [];
  let current = "";
  for (const character of [...value]) {
    if (measureStaticText(current + character, size) <= width) {
      current += character;
      continue;
    }
    if (!current) fail("static_edition_text_unrepresentable");
    const breakAt = Math.max(current.lastIndexOf(" ") + 1, current.lastIndexOf("-") + 1);
    if (breakAt > 0 && breakAt < current.length) {
      lines.push(current.slice(0, breakAt));
      current = current.slice(breakAt) + character;
    } else {
      lines.push(current);
      current = character;
    }
    if (measureStaticText(current, size) > width) fail("static_edition_text_unrepresentable");
  }
  if (current) lines.push(current);
  if (lines.length > limit) fail("static_edition_text_unrepresentable");
  return lines;
}
