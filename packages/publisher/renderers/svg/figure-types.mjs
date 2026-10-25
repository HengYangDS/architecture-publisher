import { fail } from "../../src/protocol/values.mjs";
import { renderFigureIcon, validateResolvedFigureIcons } from "../icons/index.mjs";
import { escapeStaticText as escape, measureStaticText, wrapStaticText } from "./text.mjs";

/** Lay out a derived, icon-first key in an explicit bounded reading area. */
export function composeFigureTypeLegend(nodes, icons, width) {
  if (!nodes.length) return null;
  if (!icons) fail("figure_icon_supply_required");
  validateResolvedFigureIcons([{ nodes }], icons);
  if (!Number.isFinite(width) || width < 96) fail("figure_legend_width_invalid");
  const entries = [
    ...new Map(
      nodes
        .filter((node) => !node.primitives && !node.adornment)
        .map(({ figureKind, kind, figureLabel, icon }) => [
          figureKind ?? kind,
          { icon, label: figureLabel ?? figureKind ?? kind },
        ]),
    ),
  ];
  if (!entries.length) return null;
  return reflowFigureTypeLegend(
    {
      entries: entries.map(([kind, { icon, label }]) => ({
        kind,
        label,
        glyph: renderFigureIcon(icon, icons, { y: 2, size: 14 }),
      })),
    },
    width,
  );
}

/** Reflow resolved artwork and exact labels without embedding an execution closure. */
export function reflowFigureTypeLegend(legend, width) {
  if (!legend.entries) return legend;
  if (!Number.isFinite(width) || width < 96) fail("figure_legend_width_invalid");
  const { entries } = legend;
  const fontSize = 14;
  const leading = 20;
  const textX = 26;
  const columnGap = 24;
  const preferredWidth = Math.max(
    ...entries.map(({ label }) => measureStaticText(label, fontSize) + textX + 4),
  );
  const columns = Math.min(
    entries.length,
    Math.max(1, Math.floor((width + columnGap) / (preferredWidth + columnGap))),
  );
  const columnWidth = (width - (columns - 1) * columnGap) / columns;
  const output = [];
  let y = 0;
  let readingSpan = 0;
  for (let start = 0; start < entries.length; start += columns) {
    let rowHeight = 0;
    for (const [column, { kind, glyph, label }] of entries
      .slice(start, start + columns)
      .entries()) {
      const lines = wrapStaticText(label, columnWidth - textX - 4, fontSize);
      readingSpan += lines.length * leading;
      const x = Number((column * (columnWidth + columnGap)).toFixed(2));
      output.push(
        `<g data-legend-kind="${escape(kind)}" transform="translate(${x} ${y})" color="#526158">${glyph}${lines.map((line, index) => `<text x="${textX}" y="${fontSize + index * leading}" fill="#526158" font-size="${fontSize}">${escape(line)}</text>`).join("")}</g>`,
      );
      rowHeight = Math.max(rowHeight, lines.length * leading + 12);
    }
    y += rowHeight;
  }
  return {
    markup: `<g aria-label="Figure types">${output.join("")}</g>`,
    width,
    height: y,
    readingSpan,
    entries,
  };
}

export function figureIconLicenseMetadata(icons) {
  return icons
    ? `<desc id="figure-icon-license">${escape(icons.license.toString("utf8"))}</desc>`
    : "";
}
