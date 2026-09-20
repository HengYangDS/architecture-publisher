import { fail } from '../source/manifest.mjs';

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

function escape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function point(box, side, offset = 0) {
  if (side === 'top') return [box.x + box.w / 2 + offset, box.y];
  if (side === 'right') return [box.x + box.w, box.y + box.h / 2 + offset];
  if (side === 'bottom') return [box.x + box.w / 2 + offset, box.y + box.h];
  return [box.x, box.y + box.h / 2 + offset];
}

function routePoints(from, to, route) {
  if (route === 'straight') return [from, to];
  if (route === 'orthogonal-h') {
    if (from[1] === to[1]) return [from, to];
    const middle = (from[0] + to[0]) / 2;
    return [from, [middle, from[1]], [middle, to[1]], to];
  }
  if (from[0] === to[0]) return [from, to];
  const middle = (from[1] + to[1]) / 2;
  return [from, [from[0], middle], [to[0], middle], to];
}

function routePath(points) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point[0]} ${point[1]}`).join(' ');
}

function intersectsSegment(from, to, box, padding = 0) {
  let low = 0, high = 1;
  for (const [axis, minimum, maximum] of [
    [0, box.x - padding, box.x + box.w + padding],
    [1, box.y - padding, box.y + box.h + padding],
  ]) {
    const delta = to[axis] - from[axis];
    if (delta === 0) {
      if (from[axis] < minimum || from[axis] > maximum) return false;
    } else {
      const a = (minimum - from[axis]) / delta;
      const b = (maximum - from[axis]) / delta;
      low = Math.max(low, Math.min(a, b));
      high = Math.min(high, Math.max(a, b));
      if (low > high) return false;
    }
  }
  return true;
}

function segments(points) {
  return points.slice(1).map((to, index) => [points[index], to]);
}

function boxesOverlap(a, b, padding = 0) {
  return a.x < b.x + b.w + padding && a.x + a.w + padding > b.x &&
    a.y < b.y + b.h + padding && a.y + a.h + padding > b.y;
}

function composeRoutes(document, view, layout) {
  const slots = new Map();
  for (const authored of view.relations) {
    const relation = document.relations[authored.id];
    for (const [id, side, peer, endpoint] of [
      [relation.subject, authored.fromSide, relation.object, 'from'],
      [relation.object, authored.toSide, relation.subject, 'to'],
    ]) {
      const key = id + ':' + side, entries = slots.get(key) ?? [];
      entries.push({ authored, peer: layout.nodes.get(peer), endpoint });
      slots.set(key, entries);
    }
  }
  const offsets = new Map();
  for (const [key, entries] of slots) {
    const side = key.split(':').at(-1), horizontal = ['top', 'bottom'].includes(side);
    entries.sort((a, b) =>
      (horizontal ? a.peer.x - b.peer.x : a.peer.y - b.peer.y) ||
      a.authored.id.localeCompare(b.authored.id));
    const box = layout.nodes.get(key.slice(0, key.lastIndexOf(':')));
    if ((entries.length - 1) * 22 > (horizontal ? box.w : box.h) - 40)
      fail('semantic_publication_static_port_infeasible');
    entries.forEach((entry, index) => offsets.set(
      entry.authored.id + ':' + entry.endpoint, (index - (entries.length - 1) / 2) * 22));
  }
  return view.relations.map((authored) => {
    const relation = document.relations[authored.id];
    const from = point(layout.nodes.get(relation.subject), authored.fromSide, offsets.get(authored.id + ':from'));
    const to = point(layout.nodes.get(relation.object), authored.toSide, offsets.get(authored.id + ':to'));
    const points = routePoints(from, to, authored.route);
    for (const [id, box] of layout.nodes) {
      if ([relation.subject, relation.object].includes(id)) continue;
      if (segments(points).some(([a, b]) => intersectsSegment(a, b, box, 6)))
        fail('semantic_publication_static_route_infeasible', authored.id + ':' + id);
    }
    return { authored, relation, points };
  });
}

function placeLabels(routes, edition, layout) {
  const occupied = [...layout.nodes.values()], borders = [];
  for (const group of layout.groups) {
    const { x, y, w, h } = group;
    borders.push([[x, y], [x + w, y]], [[x, y + h], [x + w, y + h]],
      [[x, y], [x, y + h]], [[x + w, y], [x + w, y + h]]);
    occupied.push({ x: x + 20, y: y + 17, w: group.label.length * 9 + 12, h: 24 });
  }
  const strokes = routes.flatMap((route) => segments(route.points));
  return routes.map((route) => {
    const label = edition.visualGrammar.relationTypes[route.relation.type].label;
    const w = label.length * 8 + 16, h = 24;
    const candidates = segments(route.points).sort((a, b) =>
      Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]) -
      Math.hypot(a[1][0] - a[0][0], a[1][1] - a[0][1]));
    for (const [from, to] of candidates) {
      const horizontal = from[1] === to[1];
      for (const fraction of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const x = from[0] + (to[0] - from[0]) * fraction;
        const y = from[1] + (to[1] - from[1]) * fraction;
        for (const sign of [-1, 1]) {
          const box = horizontal
            ? { x: x - w / 2, y: sign < 0 ? y - h - 10 : y + 10, w, h }
            : { x: sign < 0 ? x - w - 10 : x + 10, y: y - h / 2, w, h };
          if (box.x < 40 || box.x + w > layout.width - 40 ||
              box.y < 140 || box.y + h > layout.height - 40 ||
              occupied.some((other) => boxesOverlap(box, other, 6)) ||
              [...strokes, ...borders].some(([a, b]) => intersectsSegment(a, b, box, 6))) continue;
          occupied.push(box);
          return { ...route, label: [box.x + w / 2, box.y + 16] };
        }
      }
    }
    fail('semantic_publication_static_label_infeasible', route.authored.id);
  });
}

function groupLayout(document, edition, view) {
  const longestNode = Math.max(
      ...view.groups.flatMap((group) =>
        group.entities.map((id) => [...document.entities[id].label].length),
      ),
    ),
    longestRelation = Math.max(
      0,
      ...view.relations.map(
        (item) =>
          [
            ...edition.visualGrammar.relationTypes[
              document.relations[item.id].type
            ].label,
          ]
            .length,
      ),
    );
  if (longestNode > 32 || longestRelation > 32)
    fail('semantic_publication_static_label_infeasible');
  const nodeWidth = Math.max(230, Math.ceil(longestNode * 10.2 + 56)),
    nodeHeight = 92,
    nodeGap = Math.max(70, Math.ceil(longestRelation * 10 + 56)),
    groupGap = 70,
    groupPad = 34,
    headerHeight = 54,
    widest = Math.max(...view.groups.map((group) => group.entities.length)),
    groupWidth =
      widest * nodeWidth + Math.max(0, widest - 1) * nodeGap + groupPad * 2,
    width = Math.max(1200, groupWidth + 160),
    groups = [],
    nodes = new Map();
  let y = 190;
  for (const group of view.groups) {
    const rowWidth =
        group.entities.length * nodeWidth +
        Math.max(0, group.entities.length - 1) * nodeGap,
      height = headerHeight + nodeHeight + groupPad * 2,
      x = (width - groupWidth) / 2,
      rowX = (width - rowWidth) / 2;
    groups.push({ ...group, x, y, w: groupWidth, h: height });
    for (const [index, id] of group.entities.entries())
      nodes.set(id, {
        x: rowX + index * (nodeWidth + nodeGap),
        y: y + headerHeight + groupPad,
        w: nodeWidth,
        h: nodeHeight,
      });
    y += height + groupGap;
  }
  return { width, height: y - groupGap + 100, groups, nodes };
}

/** Compose a bounded static overview directly from a Claim Model and static scene. */
export function composeStaticOverview(document, edition, view) {
  const layout = groupLayout(document, edition, view),
    routes = placeLabels(composeRoutes(document, view, layout), edition, layout),
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
      style = palette[edition.visualGrammar.entityTypes[entity.type]];
    if (!style) fail('semantic_publication_entity_style_missing');
    lines.push(
      `<g>`,
      `<rect data-node-id="${escape(id)}" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="14" fill="${style[0]}" stroke="${style[1]}" stroke-width="2"/>`,
      `<text x="${box.x + box.w / 2}" y="${box.y + 55}" fill="#f4eddf" font-size="17" font-weight="600" text-anchor="middle">${escape(entity.label)}</text>`,
      '</g>',
    );
  }
  for (const { authored, relation, points, label } of routes) {
    const style = edition.visualGrammar.relationTypes[relation.type],
      color = edge[style.variant],
      dash = ['security', 'dashed'].includes(style.variant)
        ? ' stroke-dasharray="9 7"'
        : '';
    lines.push(
      `<path data-edge-id="${escape(authored.id)}" data-edge-from="${escape(relation.subject)}" data-edge-to="${escape(relation.object)}" d="${routePath(points)}" fill="none" stroke="${color}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"${dash}/>` ,
      `<g data-edge-label="${escape(authored.id)}"><text x="${label[0]}" y="${label[1]}" fill="${color}" font-size="13" font-weight="600" text-anchor="middle">${escape(style.label)}</text></g>`,
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
