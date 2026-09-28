import { fail } from '../../src/protocol/values.mjs';
import { composeStaticArchitectureScene } from '../../src/scene/static/architecture.mjs';

const palette = Object.freeze({
  frontend: ['#163338', '#86cdd0'],
  backend: ['#1c3327', '#91c9a1'],
  database: ['#30283a', '#c5aad6'],
  cloud: ['#3a3020', '#ddb472'],
  security: ['#3b2422', '#e3978c'],
  messagebus: ['#3b271d', '#e29b75'],
  external: ['#302d28', '#bdb29f'],
});
const edge = Object.freeze({
  default: '#a89d8b',
  emphasis: '#df7548',
  security: '#e3978c',
  dashed: '#c5aad6',
});

function entityStyle(role) {
  const style = palette[role];
  if (!style) fail('render_scene_visual_role_unsupported');
  return style;
}

function edgeStyle(role) {
  const color = edge[role];
  if (!color) fail('render_scene_edge_role_unsupported');
  return {
    color,
    dashed: ['security', 'dashed'].includes(role),
  };
}

function escape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function routePath(points) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point[0]} ${point[1]}`).join(' ');
}

/** Compose a bounded static overview directly from a Claim Model and static scene. */
export function composeStaticOverview(document, edition, view) {
  const { layout, routes } = composeStaticArchitectureScene(document, edition, view),
    lines = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="diagram-title diagram-description" font-family="JetBrains Mono" font-weight="400" font-style="normal">`,
      `<title id="diagram-title">${escape(edition.title)}</title>`,
      `<desc id="diagram-description">${escape(view.label)}</desc>`,
      `<rect width="${layout.width}" height="${layout.height}" fill="#181611"/>`,
      `<text x="80" y="76" fill="#f4eddf" font-size="34" font-weight="600">${escape(edition.title)}</text>`,
      `<text x="80" y="112" fill="#b9ae9b" font-size="17">${escape(view.label)}</text>`,
      '<defs><marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 10 4 L 0 8 Z" fill="#a89d8b"/></marker></defs>',
    ];
  for (const group of layout.groups) {
    lines.push(
      `<g data-group-id="${escape(group.id)}">`,
      `<rect x="${group.x}" y="${group.y}" width="${group.w}" height="${group.h}" rx="22" fill="#211e18" stroke="#5d5548" stroke-width="1.5"/>`,
      `<text x="${group.x + 26}" y="${group.y + 34}" fill="#a99e8c" font-size="14" font-weight="600">${escape(group.label)}</text>`,
      '</g>',
    );
  }
  for (const [id, box] of layout.nodes) {
    const entity = document.entities[id],
      style = entityStyle(edition.visualGrammar.entityTypes[entity.type]);
    lines.push(
      `<g>`,
      `<rect data-node-id="${escape(id)}" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="14" fill="${style[0]}" stroke="${style[1]}" stroke-width="2"/>`,
      `<text x="${box.x + box.w / 2}" y="${box.y + 55}" fill="#f4eddf" font-size="17" font-weight="600" text-anchor="middle">${escape(entity.label)}</text>`,
      '</g>',
    );
  }
  for (const { authored, relation, points, label } of routes) {
    const grammar = edition.visualGrammar.relationTypes[relation.type],
      style = edgeStyle(grammar.variant),
      dash = style.dashed ? ' stroke-dasharray="9 7"' : '';
    lines.push(
      `<path data-edge-id="${escape(authored.id)}" data-edge-from="${escape(relation.subject)}" data-edge-to="${escape(relation.object)}" d="${routePath(points)}" fill="none" stroke="${style.color}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"${dash}/>`,
      `<g data-edge-label="${escape(authored.id)}"><text x="${label[0]}" y="${label[1]}" fill="${style.color}" font-size="13" font-weight="600" text-anchor="middle">${escape(grammar.label)}</text></g>`,
    );
  }
  lines.push('</svg>', '');
  return {
    bytes: Buffer.from(lines.join('\n')),
    width: layout.width,
    height: layout.height,
    nodeIds: [...layout.nodes.keys()],
    relationIds: view.relations.map((item) => item.id),
  };
}
