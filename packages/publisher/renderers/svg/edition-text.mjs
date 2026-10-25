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
  const columns = Math.max(
    1,
    Math.min(3, Math.floor(items.length / 2), Math.floor((width + 24) / (192 + 24))),
  );
  const columnWidth = (width - (columns - 1) * 24) / columns;
  for (let start = 0; start < items.length; start += columns) {
    let bottom = y;
    for (const [column, item] of items.slice(start, start + columns).entries()) {
      const attribute = item.graphicId ? ` data-graphic-id="${item.graphicId}"` : "";
      const rows = wrap(item.text, columnWidth, 15);
      const columnX = x + column * (columnWidth + 24);
      for (const [index, row] of rows.entries())
        output.push(
          `<text${attribute} x="${number(columnX)}" y="${number(y + index * noteLineLeading)}" fill="#27352e" font-size="15">${escape(row)}</text>`,
        );
      bottom = Math.max(bottom, y + rows.length * noteLineLeading);
    }
    y = bottom + noteItemGap;
  }
  // Block separation replaces the last item gap; it does not add another empty row.
  return y - noteItemGap + 12;
}
