import { fail } from "../../src/protocol/values.mjs";
import { escapeStaticText as escape, wrapStaticText as wrap } from "./text.mjs";

const noteLineLeading = 26;

const noteItemGap = 9;

export function number(value) {
  if (!Number.isFinite(value) || Math.abs(value) > 10_000_000)
    fail("static_edition_geometry_invalid");
  return Number(value.toFixed(2));
}

export function textLines(output, content, x, y, width, size, color, weight = 400, limit = 12) {
  const lines = wrap(content, width, size, limit);
  for (const [index, line] of lines.entries())
    output.push(
      `<text x="${number(x)}" y="${number(y + index * size * 1.4)}" fill="${color}" font-size="${size}" font-weight="${weight}" xml:space="preserve">${escape(line)}</text>`,
    );
  return y + lines.length * size * 1.4;
}

export function namedSection(output, name, items, x, y, width) {
  if (!items.length) return y;
  y = textLines(output, name, x, y, width, 11, "#66736b", 600, 1) + 12;
  for (const item of items) {
    const attribute = item.graphicId ? ` data-graphic-id="${item.graphicId}"` : "";
    const rows = wrap(item.text, width, 15);
    for (const row of rows) {
      output.push(
        `<text${attribute} x="${number(x)}" y="${number(y)}" fill="#27352e" font-size="15">${escape(row)}</text>`,
      );
      y += noteLineLeading;
    }
    y += noteItemGap;
  }
  return y + 17;
}
