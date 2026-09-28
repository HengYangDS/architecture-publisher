import { fail } from '../../protocol/values.mjs';

const sides = new Set(['top', 'right', 'bottom', 'left']);
const routes = new Set(['straight', 'orthogonal-h', 'orthogonal-v']);
const portSpacing = 22;

function point(box, side, offset = 0) {
  if (side === 'top') return [box.x + box.w / 2 + offset, box.y];
  if (side === 'right') return [box.x + box.w, box.y + box.h / 2 + offset];
  if (side === 'bottom') return [box.x + box.w / 2 + offset, box.y + box.h];
  return [box.x, box.y + box.h / 2 + offset];
}

function routePoints(from, to, route, bend) {
  if (route === 'straight') return [from, to];
  if (route === 'orthogonal-h') {
    if (from[1] === to[1]) return [from, to];
    const middle = (from[0] + to[0]) / 2;
    return [from, [middle, from[1]], [middle, to[1]], to];
  }
  if (from[0] === to[0]) return [from, to];
  const middle = bend ?? (from[1] + to[1]) / 2;
  return [from, [from[0], middle], [to[0], middle], to];
}

function intersectsSegment(from, to, box, padding = 0) {
  let low = 0,
    high = 1;
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

function pathsTouch(left, right) {
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const on = (a, b, c) =>
    c[0] >= Math.min(a[0], b[0]) &&
    c[0] <= Math.max(a[0], b[0]) &&
    c[1] >= Math.min(a[1], b[1]) &&
    c[1] <= Math.max(a[1], b[1]);
  for (const [a, b] of segments(left))
    for (const [c, d] of segments(right)) {
      const abC = cross(a, b, c);
      const abD = cross(a, b, d);
      const cdA = cross(c, d, a);
      const cdB = cross(c, d, b);
      if (
        (abC === 0 && on(a, b, c)) ||
        (abD === 0 && on(a, b, d)) ||
        (cdA === 0 && on(c, d, a)) ||
        (cdB === 0 && on(c, d, b)) ||
        (abC * abD < 0 && cdA * cdB < 0)
      )
        return true;
    }
  return false;
}

function boxesOverlap(a, b, padding = 0) {
  return (
    a.x < b.x + b.w + padding &&
    a.x + a.w + padding > b.x &&
    a.y < b.y + b.h + padding &&
    a.y + a.h + padding > b.y
  );
}

function checkedGraph(input) {
  if (
    !input ||
    !Array.isArray(input.nodes) ||
    !input.nodes.length ||
    !Array.isArray(input.groups) ||
    !input.groups.length ||
    !Array.isArray(input.relations)
  )
    fail('grouped_geometry_input_invalid');
  const nodes = new Map();
  for (const node of input.nodes) {
    if (
      typeof node?.id !== 'string' ||
      !node.id ||
      typeof node.label !== 'string' ||
      !node.label ||
      nodes.has(node.id)
    )
      fail('grouped_geometry_input_invalid');
    nodes.set(node.id, node);
  }
  const groupIds = new Set();
  const members = new Set();
  for (const group of input.groups) {
    if (
      typeof group?.id !== 'string' ||
      !group.id ||
      groupIds.has(group.id) ||
      typeof group.label !== 'string' ||
      !group.label ||
      !Array.isArray(group.members) ||
      !group.members.length ||
      group.members.length > 8
    )
      fail('grouped_geometry_input_invalid');
    groupIds.add(group.id);
    for (const id of group.members) {
      if (!nodes.has(id) || members.has(id)) fail('grouped_geometry_input_invalid');
      members.add(id);
    }
  }
  if (members.size !== nodes.size) fail('grouped_geometry_input_invalid');
  const relationIds = new Set();
  for (const relation of input.relations) {
    if (
      typeof relation?.id !== 'string' ||
      !relation.id ||
      relationIds.has(relation.id) ||
      !nodes.has(relation.from) ||
      !nodes.has(relation.to) ||
      typeof relation.text !== 'string' ||
      !sides.has(relation.fromSide) ||
      !sides.has(relation.toSide) ||
      !routes.has(relation.route)
    )
      fail('grouped_geometry_input_invalid');
    relationIds.add(relation.id);
  }
  return { nodes, groups: input.groups, relations: input.relations };
}

function groupRows(graph) {
  return new Map(graph.groups.flatMap((group, row) => group.members.map((id) => [id, row])));
}

function adjacentVerticalGap(relation, rows) {
  const from = rows.get(relation.from);
  const to = rows.get(relation.to);
  if (
    relation.route !== 'orthogonal-v' ||
    Math.abs(from - to) !== 1 ||
    !(
      (from < to && relation.fromSide === 'bottom' && relation.toSide === 'top') ||
      (from > to && relation.fromSide === 'top' && relation.toSide === 'bottom')
    )
  )
    return null;
  return { row: Math.min(from, to), upper: from < to ? relation.from : relation.to };
}

function endpoints(relation, layout, offsets) {
  return [
    point(layout.nodes.get(relation.from), relation.fromSide, offsets.get(relation.id + ':from')),
    point(layout.nodes.get(relation.to), relation.toSide, offsets.get(relation.id + ':to')),
  ];
}

function verticalCorridors(graph, layout, offsets) {
  const rows = groupRows(graph);
  const corridors = new Map();
  for (const relation of graph.relations) {
    const gap = adjacentVerticalGap(relation, rows);
    if (!gap) continue;
    const [from, to] = endpoints(relation, layout, offsets);
    const entries = corridors.get(gap.row) ?? [];
    entries.push({
      relation,
      from,
      to,
      x: gap.upper === relation.from ? from[0] : to[0],
      lowerX: gap.upper === relation.from ? to[0] : from[0],
    });
    corridors.set(gap.row, entries);
  }
  const bends = new Map();
  for (const [row, entries] of corridors) {
    const upper = layout.groups[row];
    const lower = layout.groups[row + 1];
    const first = upper.y + upper.h + 12;
    const last = lower.y - 12;
    const span = (entries.length - 1) * portSpacing;
    entries.sort(
      (a, b) => a.x - b.x || a.lowerX - b.lowerX || a.relation.id.localeCompare(b.relation.id),
    );
    const start = (first + last - span) / 2;
    // A nested fan-out needs bend order derived from actual ports, not source order.
    const predecessors = new Map(entries.map(({ relation }) => [relation.id, new Set()]));
    for (const [index, left] of entries.entries())
      for (const right of entries.slice(index + 1)) {
        const routed = (entry, bend) => routePoints(entry.from, entry.to, 'orthogonal-v', bend);
        const leftBeforeRight = !pathsTouch(
          routed(left, start),
          routed(right, start + portSpacing),
        );
        const rightBeforeLeft = !pathsTouch(
          routed(left, start + portSpacing),
          routed(right, start),
        );
        if (!leftBeforeRight && !rightBeforeLeft)
          fail(
            'semantic_publication_static_route_crossing',
            left.relation.id + ':' + right.relation.id,
          );
        if (!leftBeforeRight) predecessors.get(left.relation.id).add(right.relation.id);
        if (!rightBeforeLeft) predecessors.get(right.relation.id).add(left.relation.id);
      }
    const pending = new Set(entries.map(({ relation }) => relation.id));
    for (let index = 0; index < entries.length; index += 1) {
      const next = entries.find(
        ({ relation }) =>
          pending.has(relation.id) &&
          [...predecessors.get(relation.id)].every((id) => !pending.has(id)),
      );
      if (!next) fail('semantic_publication_static_route_crossing');
      bends.set(next.relation.id, start + index * portSpacing);
      pending.delete(next.relation.id);
    }
  }
  return bends;
}

function composeRoutes(graph, layout) {
  const slots = new Map();
  for (const authored of graph.relations) {
    for (const [id, side, peer, endpoint] of [
      [authored.from, authored.fromSide, authored.to, 'from'],
      [authored.to, authored.toSide, authored.from, 'to'],
    ]) {
      const key = id + ':' + side,
        entries = slots.get(key) ?? [];
      entries.push({ authored, peer: layout.nodes.get(peer), endpoint });
      slots.set(key, entries);
    }
  }
  const offsets = new Map();
  for (const [key, entries] of slots) {
    const side = key.split(':').at(-1),
      horizontal = ['top', 'bottom'].includes(side);
    entries.sort(
      (a, b) =>
        (horizontal ? a.peer.x - b.peer.x : a.peer.y - b.peer.y) ||
        a.authored.id.localeCompare(b.authored.id),
    );
    const box = layout.nodes.get(key.slice(0, key.lastIndexOf(':')));
    if ((entries.length - 1) * portSpacing > (horizontal ? box.w : box.h) - 40)
      fail('semantic_publication_static_port_infeasible');
    entries.forEach((entry, index) =>
      offsets.set(
        entry.authored.id + ':' + entry.endpoint,
        (index - (entries.length - 1) / 2) * portSpacing,
      ),
    );
  }
  const bends = verticalCorridors(graph, layout, offsets);
  const selected = graph.relations.map((authored) => {
    const [from, to] = endpoints(authored, layout, offsets);
    const points = routePoints(from, to, authored.route, bends.get(authored.id));
    for (const [id, box] of layout.nodes) {
      if ([authored.from, authored.to].includes(id)) continue;
      if (segments(points).some(([a, b]) => intersectsSegment(a, b, box, 6)))
        fail('semantic_publication_static_route_infeasible', authored.id + ':' + id);
    }
    return { id: authored.id, from: authored.from, to: authored.to, text: authored.text, points };
  });
  for (const [index, left] of selected.entries())
    for (const right of selected.slice(index + 1))
      if (pathsTouch(left.points, right.points))
        fail('semantic_publication_static_route_crossing', left.id + ':' + right.id);
  return selected;
}

function placeLabels(selectedRoutes, layout) {
  const occupied = [...layout.nodes.values()],
    borders = [];
  for (const group of layout.groups) {
    const { x, y, w, h } = group;
    borders.push(
      [
        [x, y],
        [x + w, y],
      ],
      [
        [x, y + h],
        [x + w, y + h],
      ],
      [
        [x, y],
        [x, y + h],
      ],
      [
        [x + w, y],
        [x + w, y + h],
      ],
    );
    occupied.push({ x: x + 20, y: y + 17, w: group.label.length * 9 + 12, h: 24 });
  }
  const strokes = selectedRoutes.flatMap((route) => segments(route.points));
  return selectedRoutes.map((route) => {
    if (!route.text) return { ...route, label: null };
    const w = route.text.length * 8.6 + 16,
      h = 24;
    const candidates = segments(route.points).sort(
      (a, b) =>
        Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]) -
        Math.hypot(a[1][0] - a[0][0], a[1][1] - a[0][1]),
    );
    for (const [from, to] of candidates) {
      const horizontal = from[1] === to[1];
      for (const fraction of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const x = from[0] + (to[0] - from[0]) * fraction;
        const y = from[1] + (to[1] - from[1]) * fraction;
        for (const sign of [-1, 1]) {
          const box = horizontal
            ? { x: x - w / 2, y: sign < 0 ? y - h - 10 : y + 10, w, h }
            : { x: sign < 0 ? x - w - 10 : x + 10, y: y - h / 2, w, h };
          if (
            box.x < 40 ||
            box.x + w > layout.width - 40 ||
            box.y < 140 ||
            box.y + h > layout.height - 40 ||
            occupied.some((other) => boxesOverlap(box, other, 6)) ||
            [...strokes, ...borders].some(([a, b]) => intersectsSegment(a, b, box, 6))
          )
            continue;
          occupied.push(box);
          return { ...route, label: [box.x + w / 2, box.y + 16], labelBox: box };
        }
      }
    }
    fail('semantic_publication_static_label_infeasible', route.id);
  });
}

function groupLayout(graph) {
  const rows = groupRows(graph);
  const corridorCounts = new Map();
  const labeledGaps = new Set();
  const topPorts = new Map();
  for (const relation of graph.relations) {
    for (const [id, side] of [
      [relation.from, relation.fromSide],
      [relation.to, relation.toSide],
    ])
      if (side === 'top') topPorts.set(id, (topPorts.get(id) ?? 0) + 1);
    const gap = adjacentVerticalGap(relation, rows);
    if (gap) corridorCounts.set(gap.row, (corridorCounts.get(gap.row) ?? 0) + 1);
    const from = rows.get(relation.from);
    const to = rows.get(relation.to);
    if (relation.text && Math.abs(from - to) === 1) labeledGaps.add(Math.min(from, to));
  }
  const longestNode = Math.max(
      ...graph.groups.flatMap((group) =>
        group.members.map((id) => [...graph.nodes.get(id).label].length),
      ),
    ),
    longestRelation = Math.max(0, ...graph.relations.map((item) => [...item.text].length));
  if (longestNode > 32 || longestRelation > 32)
    fail('semantic_publication_static_label_infeasible');
  const onGraphLabels = longestRelation > 0;
  const nodeWidth = Math.max(230, Math.ceil(longestNode * 9.76 + 32)),
    nodeHeight = 92,
    nodeGap = Math.max(70, Math.ceil(longestRelation * 8.6 + 40)),
    groupGaps = graph.groups
      .slice(1)
      .map((_, row) =>
        Math.max(
          labeledGaps.has(row) ? 120 : 62,
          corridorCounts.has(row) ? 24 + (corridorCounts.get(row) - 1) * portSpacing : 0,
        ),
      ),
    groupPad = onGraphLabels ? 34 : 24,
    headerHeight = onGraphLabels ? 54 : 40,
    minimumWidths = graph.groups.map((group) =>
      Math.max(
        group.members.length * nodeWidth +
          Math.max(0, group.members.length - 1) * nodeGap +
          groupPad * 2,
        // Multiple entering ports need a lateral shelf for the group heading.
        [...group.label].length * 18 +
          80 +
          Math.max(0, ...group.members.map((id) => (topPorts.get(id) ?? 0) - 1)) * portSpacing,
      ),
    ),
    groupWidths = minimumWidths,
    width = Math.max(1200, ...groupWidths.map((value) => value + 80)),
    groups = [],
    nodes = new Map();
  let y = 190;
  for (const [row, group] of graph.groups.entries()) {
    const rowWidth =
        group.members.length * nodeWidth + Math.max(0, group.members.length - 1) * nodeGap,
      height = headerHeight + nodeHeight + groupPad * 2,
      groupWidth = groupWidths[row],
      x = (width - groupWidth) / 2,
      rowX = (width - rowWidth) / 2;
    groups.push({ ...group, x, y, w: groupWidth, h: height });
    for (const [index, id] of group.members.entries())
      nodes.set(id, {
        x: rowX + index * (nodeWidth + nodeGap),
        y: y + headerHeight + groupPad,
        w: nodeWidth,
        h: nodeHeight,
      });
    y += height + (groupGaps[row] ?? 0);
  }
  return { width, height: y + 100, groups, nodes };
}

/** Derive geometry only; node and relation IDs remain opaque to this owner. */
export function composeGroupedGeometry(input) {
  const graph = checkedGraph(input);
  const layout = groupLayout(graph);
  return { layout, routes: placeLabels(composeRoutes(graph, layout), layout) };
}

/** Preserve the historical v1 scene shape through the same geometry owner. */
export function composeStaticArchitectureScene(document, edition, view) {
  const selectedIds = view.groups.flatMap((group) => group.entities);
  const selected = composeGroupedGeometry({
    nodes: selectedIds.map((id) => ({ id, label: document.entities[id].label })),
    groups: view.groups.map(({ id, label, entities }) => ({ id, label, members: entities })),
    relations: view.relations.map((authored) => {
      const relation = document.relations[authored.id];
      const text = edition.visualGrammar.relationTypes[relation.type].label;
      if (typeof text !== 'string' || !text) fail('grouped_geometry_input_invalid');
      return {
        ...authored,
        from: relation.subject,
        to: relation.object,
        text,
      };
    }),
  });
  const byId = new Map(view.relations.map((authored) => [authored.id, authored]));
  return {
    layout: {
      ...selected.layout,
      groups: selected.layout.groups.map((group, index) => ({
        ...view.groups[index],
        x: group.x,
        y: group.y,
        w: group.w,
        h: group.h,
      })),
    },
    routes: selected.routes.map((route) => ({
      authored: byId.get(route.id),
      relation: document.relations[route.id],
      points: route.points,
      label: route.label,
    })),
  };
}
