import { interactiveGraphMarks as marks } from '../../src/scene/marks.mjs';

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
const pathData = (points) =>
  points.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');

function labelText(label, kind) {
  return label.baselines
    .map(
      ({ text, x, baseline }) =>
        `<text class="graph-label graph-label--${kind}" x="${x}" y="${baseline}" font-size="${label.fontSize}" font-weight="${label.weight}">${escape(text)}</text>`,
    )
    .join('');
}

/** Exact normalized coordinates are painted once; interaction transforms the viewport only. */
export function renderGraphSvg(page, index) {
  const graph = page.geometry;
  const prefix = `graph-${index}`;
  const length = marks.arrowLength;
  const half = marks.arrowHalfWidth;
  const markers = `<defs><marker id="${prefix}-arrow-end" viewBox="0 -${half} ${length} ${half * 2}" refX="${length}" refY="0" markerUnits="userSpaceOnUse" markerWidth="${length}" markerHeight="${half * 2}" orient="auto"><path d="M0 -${half} L${length} 0 L0 ${half} Z"/></marker><marker id="${prefix}-arrow-start" viewBox="0 -${half} ${length} ${half * 2}" refX="0" refY="0" markerUnits="userSpaceOnUse" markerWidth="${length}" markerHeight="${half * 2}" orient="auto"><path d="M${length} -${half} L0 0 L${length} ${half} Z"/></marker></defs>`;
  const groups = graph.groups
    .map(
      (group) =>
        `<g class="graph-group" data-graphic-id="${escape(group.id)}"><rect x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" rx="${marks.groupCorner}"/>${labelText(group.label, 'group')}</g>`,
    )
    .join('');
  const relations = graph.relations
    .map((relation) => {
      const route = pathData(relation.points);
      const source =
        relation.direction === 'bidirectional' ? ` marker-start="url(#${prefix}-arrow-start)"` : '';
      return `<g class="graph-relation" data-graphic-id="${escape(relation.id)}" data-select-id="${escape(relation.id)}"><path class="graph-route" d="${route}" marker-end="url(#${prefix}-arrow-end)"${source}/><path class="graph-hit" d="${route}"/>${relation.label ? labelText(relation.label, 'relation') : ''}</g>`;
    })
    .join('');
  const nodes = graph.nodes
    .map(
      (node) =>
        `<g class="graph-node" data-graphic-id="${escape(node.id)}" data-select-id="${escape(node.id)}"><rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"/>${labelText(node.label, 'node')}</g>`,
    )
    .join('');
  return `<svg class="graph-svg" id="${prefix}-svg" viewBox="0 0 ${graph.bounds.width} ${graph.bounds.height}" width="${graph.bounds.width}" height="${graph.bounds.height}" aria-hidden="true">${markers}<g class="graph-viewport">${groups}${relations}${nodes}</g></svg>`;
}
