const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** The bounded standard SVG painter used by both literal-segment adapters. */
export function renderLiteralSegment(edge, attributes, color, markerId) {
  const points = edge.points.map(({ x, y }, index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
  const geometry = edge.arrowGeometry;
  const marker = edge.arrow
    ? `<defs><marker id="${escape(markerId)}" markerUnits="userSpaceOnUse" markerWidth="${geometry.length}" markerHeight="${geometry.halfWidth * 2}" refX="${geometry.length}" refY="${geometry.halfWidth}" orient="auto"><path d="M 0 0 L ${geometry.length} ${geometry.halfWidth} L 0 ${geometry.halfWidth * 2}" fill="none" stroke="${escape(color)}" stroke-width="${geometry.strokeWidth}"/></marker></defs>`
    : "";
  return `${marker}<path data-literal-segment-id="${escape(edge.id)}" ${attributes} d="${points}" fill="none" stroke="${escape(color)}" stroke-width="${edge.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${edge.arrow ? ` marker-end="url(#${escape(markerId)})"` : ""}/>`;
}
