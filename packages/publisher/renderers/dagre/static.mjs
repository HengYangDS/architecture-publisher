import { fail } from '../../src/source/manifest.mjs';
import { layoutStaticGraph } from './layout.mjs';

function checkedInput(input) {
  if (
    !input ||
    !Array.isArray(input.nodes) ||
    !input.nodes.length ||
    input.nodes.length > 512 ||
    !Array.isArray(input.groups) ||
    !input.groups.length ||
    input.groups.length > 128 ||
    !Array.isArray(input.relations) ||
    input.relations.length > 2048
  )
    fail('static_dagre_input_invalid');
  const nodes = new Map();
  for (const node of input.nodes) {
    if (
      typeof node?.id !== 'string' ||
      !node.id ||
      typeof node.label !== 'string' ||
      !node.label.trim() ||
      [...node.label].length > 256 ||
      nodes.has(node.id)
    )
      fail('static_dagre_input_invalid');
    nodes.set(node.id, node);
  }
  const members = new Set();
  const groups = new Set();
  for (const group of input.groups) {
    if (
      typeof group?.id !== 'string' ||
      !group.id ||
      groups.has(group.id) ||
      typeof group.label !== 'string' ||
      !group.label.trim() ||
      [...group.label].length > 256 ||
      !Array.isArray(group.members) ||
      !group.members.length ||
      group.members.length > 32
    )
      fail('static_dagre_input_invalid');
    groups.add(group.id);
    for (const id of group.members) {
      if (!nodes.has(id) || members.has(id)) fail('static_dagre_input_invalid');
      members.add(id);
    }
  }
  if (members.size !== nodes.size) fail('static_dagre_input_invalid');
  const relations = new Set();
  for (const relation of input.relations) {
    if (
      typeof relation?.id !== 'string' ||
      !relation.id ||
      relations.has(relation.id) ||
      !nodes.has(relation.from) ||
      !nodes.has(relation.to) ||
      relation.from === relation.to ||
      typeof relation.text !== 'string' ||
      [...relation.text].length > 256
    )
      fail('static_dagre_input_invalid');
    relations.add(relation.id);
  }
  return input;
}

function boxesOverlap(left, right, pad = 0) {
  return (
    left.x < right.x + right.w + pad &&
    left.x + left.w + pad > right.x &&
    left.y < right.y + right.h + pad &&
    left.y + left.h + pad > right.y
  );
}

function segmentHitsBox(from, to, box) {
  let lower = 0;
  let upper = 1;
  for (const [axis, minimum, maximum] of [
    [0, box.x, box.x + box.w],
    [1, box.y, box.y + box.h],
  ]) {
    const delta = to[axis] - from[axis];
    if (delta === 0) {
      if (from[axis] < minimum || from[axis] > maximum) return false;
      continue;
    }
    const a = (minimum - from[axis]) / delta;
    const b = (maximum - from[axis]) / delta;
    lower = Math.max(lower, Math.min(a, b));
    upper = Math.min(upper, Math.max(a, b));
    if (lower > upper) return false;
  }
  return true;
}

function placeRelationLabels(routes, nodes) {
  const occupied = [...nodes.values()];
  const strokes = routes.flatMap(({ points }) =>
    points.slice(1).map((to, index) => [points[index], to]),
  );
  return routes.map((route) => {
    if (!route.text) return { ...route, label: null };
    const w = Math.ceil([...route.text].length * 14 * 0.61 + 18);
    const h = 26;
    const place = (centerX, centerY) => {
      const box = { x: centerX - w / 2, y: centerY - h / 2, w, h };
      const clear = { x: box.x - 5, y: box.y - 5, w: w + 10, h: h + 10 };
      if (
        box.x < 40 ||
        box.y < 100 ||
        occupied.some((other) => boxesOverlap(box, other, 6)) ||
        strokes.some(([a, b]) => segmentHitsBox(a, b, clear))
      )
        return null;
      occupied.push(box);
      return { ...route, label: [centerX, box.y + 18], labelBox: box };
    };
    const segments = route.points
      .slice(1)
      .map((to, index) => [route.points[index], to])
      .sort(
        (left, right) =>
          Math.hypot(right[1][0] - right[0][0], right[1][1] - right[0][1]) -
          Math.hypot(left[1][0] - left[0][0], left[1][1] - left[0][1]),
      );
    for (const [from, to] of segments) {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const length = Math.hypot(dx, dy);
      if (length < 24) continue;
      const perpendicular = [-dy / length, dx / length];
      for (const fraction of [0.5, 0.35, 0.65, 0.2, 0.8])
        for (const sign of [-1, 1]) {
          const offset = Math.abs(dx) >= Math.abs(dy) ? h / 2 + 9 : w / 2 + 9;
          const centerX = from[0] + dx * fraction + perpendicular[0] * offset * sign;
          const centerY = from[1] + dy * fraction + perpendicular[1] * offset * sign;
          const candidate = place(centerX, centerY);
          if (candidate) return candidate;
        }
    }
    if (route.labelAnchor)
      for (const shiftX of [0, -w / 3, w / 3, -w / 2, w / 2])
        for (const shiftY of [0, 12, -12, 24, -24]) {
          const candidate = place(route.labelAnchor[0] + shiftX, route.labelAnchor[1] + shiftY);
          if (candidate) return candidate;
        }
    fail('static_dagre_relation_caption_infeasible', route.id);
  });
}

function captionedGroups(groups, nodes, routes) {
  const occupied = [...nodes.values()];
  const edges = routes.flatMap(({ points }) =>
    points.slice(1).map((to, index) => [points[index], to]),
  );
  const labels = routes.flatMap(({ labelBox }) => (labelBox ? [labelBox] : []));
  return groups.map((group) => {
    const w = Math.ceil([...group.label].length * 14 * 0.61 + 12);
    const h = 22;
    if (w > 360) fail('static_dagre_group_caption_infeasible');
    const candidates = [
      ...[12, 48, 84, 120, 156, 192, 228].flatMap((gap) => [
        { x: group.x, y: group.y - h - gap, w, h },
        { x: group.x + group.w - w, y: group.y - h - gap, w, h },
      ]),
      { x: group.x, y: group.y + group.h + 12, w, h },
      { x: group.x + group.w - w, y: group.y + group.h + 12, w, h },
      { x: group.x - w - 12, y: group.y + 10, w, h },
      { x: group.x + group.w + 12, y: group.y + 10, w, h },
    ];
    const caption = candidates.find(
      (box) =>
        box.x >= 40 &&
        box.y >= 100 &&
        ![...occupied, ...labels].some((other) => boxesOverlap(box, other, 8)) &&
        !edges.some(([from, to]) => segmentHitsBox(from, to, box)),
    );
    if (!caption) fail('static_dagre_group_caption_infeasible', group.id);
    occupied.push(caption);
    const left = Math.min(group.x, caption.x);
    const top = Math.min(group.y, caption.y);
    const right = Math.max(group.x + group.w, caption.x + caption.w);
    const bottom = Math.max(group.y + group.h, caption.y + caption.h);
    return {
      ...group,
      x: left,
      y: top,
      w: right - left,
      h: bottom - top,
      caption: { x: caption.x, y: caption.y + 16, box: caption },
    };
  });
}

/** The existing pinned Dagre supply proposes coordinates, never source meaning. */
export async function composeDagreGroupedGeometry(value) {
  const input = checkedInput(value);
  const opaque = new Map(input.nodes.map(({ id }, index) => [id, `n${index}`]));
  const selected = await layoutStaticGraph({
    nodes: input.nodes.map((node, index) => ({
      id: `n${index}`,
      width: Math.max(150, Math.ceil([...node.label].length * 9.76 + 32)),
      height: 92,
    })),
    relations: input.relations.map((relation, index) => ({
      id: `e${index}`,
      source: opaque.get(relation.from),
      target: opaque.get(relation.to),
      width: relation.text ? Math.ceil([...relation.text].length * 14 * 0.61 + 18) : 0,
      height: relation.text ? 26 : 0,
    })),
  });
  const placedNodes = new Map(selected.nodes.map((node) => [node.id, node]));
  const nodes = new Map(
    input.nodes.map((node, index) => {
      const placed = placedNodes.get(`n${index}`);
      if (!placed) fail('static_dagre_geometry_invalid');
      return [
        node.id,
        {
          x: placed.x - placed.width / 2 + 80,
          y: placed.y - placed.height / 2 + 190,
          w: placed.width,
          h: placed.height,
        },
      ];
    }),
  );
  const placedEdges = new Map(selected.edges.map((edge) => [edge.id, edge]));
  const routes = input.relations.map((relation, index) => {
    const edge = placedEdges.get(`e${index}`);
    if (!edge) fail('static_dagre_geometry_invalid');
    const points = edge.points.map(({ x, y }) => [x + 80, y + 190]);
    return {
      ...relation,
      points,
      labelAnchor:
        Number.isFinite(edge.x) && Number.isFinite(edge.y) ? [edge.x + 80, edge.y + 190] : null,
    };
  });
  if (nodes.size !== input.nodes.length || placedEdges.size !== input.relations.length)
    fail('static_dagre_geometry_invalid');
  const memberGroups = input.groups.map((group) => {
    const members = group.members.map((id) => nodes.get(id));
    const left = Math.min(...members.map(({ x }) => x)) - 16;
    const top = Math.min(...members.map(({ y }) => y)) - 16;
    const right = Math.max(...members.map(({ x, w }) => x + w)) + 16;
    const bottom = Math.max(...members.map(({ y, h }) => y + h)) + 16;
    return { ...group, x: left, y: top, w: right - left, h: bottom - top };
  });
  const layout = { width: selected.width + 160, height: selected.height + 290 };
  const labeledRoutes = placeRelationLabels(routes, nodes);
  const groups = captionedGroups(memberGroups, nodes, labeledRoutes);
  layout.width = Math.max(layout.width, ...groups.map(({ x, w }) => x + w + 40));
  layout.height = Math.max(layout.height, ...groups.map(({ y, h }) => y + h + 30));
  layout.width = Math.max(
    layout.width,
    ...labeledRoutes.flatMap(({ labelBox }) => (labelBox ? [labelBox.x + labelBox.w + 40] : [])),
  );
  layout.height = Math.max(
    layout.height,
    ...labeledRoutes.flatMap(({ labelBox }) => (labelBox ? [labelBox.y + labelBox.h + 30] : [])),
  );
  return {
    layout: { ...layout, groups, nodes, groupPresentation: 'captions' },
    routes: labeledRoutes,
    supplySha256: selected.supplySha256,
  };
}
