import { renderFigureIcon } from "../icons/index.mjs";

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function renderFigureTypeLegend(nodes, icons) {
  const kinds = [
    ...new Map(
      nodes.map(({ figureKind, kind, figureLabel, icon }) => [
        figureKind ?? kind,
        { icon, label: figureLabel ?? figureKind ?? kind },
      ]),
    ),
  ];
  return kinds.length
    ? `<ul class="figure-types" aria-label="Figure types">${kinds.map(([kind, { icon, label }]) => `<li data-legend-kind="${escape(kind)}"><svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">${renderFigureIcon(icon, icons)}</svg><span>${escape(label)}</span></li>`).join("")}</ul>`
    : "";
}
