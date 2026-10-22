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
  const output = [];
  let x = 0;
  let y = 0;
  let rowHeight = 26;
  for (const [kind, { icon, label }] of entries) {
    const lines = wrapStaticText(label, width - 23, 11);
    const textWidth = Math.max(...lines.map((line) => measureStaticText(line, 11)));
    const itemWidth = textWidth + 23;
    if (x && x + itemWidth > width) {
      x = 0;
      y += rowHeight;
      rowHeight = 26;
    }
    output.push(
      `<g data-legend-kind="${escape(kind)}" transform="translate(${Number(x.toFixed(2))} ${y})" color="#526158">${renderFigureIcon(icon, icons, { y: 3, size: 11 })}${lines.map((line, index) => `<text x="19" y="${13 + index * 17}" fill="#526158" font-size="11">${escape(line)}</text>`).join("")}</g>`,
    );
    rowHeight = Math.max(rowHeight, lines.length * 17 + 9);
    x += itemWidth + 24;
  }
  return {
    markup: `<g aria-label="Figure types">${output.join("")}</g>`,
    width,
    height: y + rowHeight,
  };
}

export function figureIconLicenseMetadata(icons) {
  return icons
    ? `<desc id="figure-icon-license">${escape(icons.license.toString("utf8"))}</desc>`
    : "";
}
