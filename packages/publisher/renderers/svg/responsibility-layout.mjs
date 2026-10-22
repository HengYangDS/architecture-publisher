import { fail } from "../../src/protocol/values.mjs";
import { nodeKey } from "./responsibility-contract.mjs";
import { staticBodyGeometry } from "./edition-claims.mjs";

export const margin = 56;

export const nodeWidth = 142;

export const nodeHeight = 50;

const rankGap = 142;

export const roleGap = 152;

function groupRanks(group, relations) {
  const order = group.elements.map(nodeKey);
  const pending = new Set(order);
  const rank = new Map(order.map((id) => [id, 0]));
  const parents = new Map(order.map((id) => [id, new Set()]));
  for (const relation of relations) parents.get(nodeKey(relation.to)).add(nodeKey(relation.from));
  while (pending.size) {
    const next = order.find(
      (id) => pending.has(id) && [...parents.get(id)].every((parent) => !pending.has(parent)),
    );
    if (!next) fail("static_responsibility_graph_unrepresentable");
    pending.delete(next);
    for (const relation of relations)
      if (nodeKey(relation.from) === next) {
        const target = nodeKey(relation.to);
        rank.set(target, Math.max(rank.get(target), rank.get(next) + 1));
      }
  }
  const buckets = new Map();
  for (const id of order) {
    const level = rank.get(id);
    buckets.set(level, [...(buckets.get(level) ?? []), id]);
  }
  if (buckets.size > 3 || [...buckets.values()].some((bucket) => bucket.length > 2))
    fail("static_responsibility_graph_unrepresentable");
  return buckets;
}

export function layout(scene, roles, roleByNode, { width: canvasWidth, beside = false } = {}) {
  const widths = roles.map(({ group }) => 210 + 60 * (group.elements.length - 1));
  const graphWidth = margin * 2 + widths.reduce((a, b) => a + b, 0) + roleGap * (roles.length - 1);
  const width =
    canvasWidth ??
    Math.max(
      graphWidth,
      scene.claimCards?.length ? staticBodyGeometry(null, scene.claimCards).width + 2 * margin : 0,
    );
  const xs = widths.map(
    (_, index) =>
      margin +
      (beside ? 0 : (width - graphWidth) / 2) +
      widths.slice(0, index).reduce((a, b) => a + b, 0) +
      roleGap * index,
  );
  const internal = roles.map(() => []);
  const cross = [];
  const pairs = new Set();
  for (const relation of scene.relations) {
    const from = roleByNode.get(nodeKey(relation.from));
    const to = roleByNode.get(nodeKey(relation.to));
    if (from === undefined || to === undefined)
      fail("static_responsibility_relation_endpoint_missing");
    if (from === to) internal[from].push(relation);
    else {
      const pair = `${from}:${to}`;
      if (to !== from + 1 || pairs.has(pair)) fail("static_responsibility_graph_unrepresentable");
      pairs.add(pair);
      cross.push(relation);
    }
  }
  const buckets = roles.map(({ group }, index) => groupRanks(group, internal[index]));
  const highest = Math.max(0, ...buckets.flatMap((item) => [...item.keys()]));
  const positions = new Map();
  const graphTop = 265;
  for (const [roleIndex, levels] of buckets.entries()) {
    if (roles[roleIndex].group.elements.length === 1) continue;
    for (const [level, ids] of levels)
      for (const [at, id] of ids.entries())
        positions.set(id, {
          x: xs[roleIndex] + widths[roleIndex] / 2 + (at - (ids.length - 1) / 2) * 166,
          y: graphTop + level * rankGap,
        });
  }
  if (!positions.size)
    positions.set(nodeKey(roles[0].group.elements[0]), { x: xs[0] + widths[0] / 2, y: graphTop });
  for (let pass = 0; pass < roles.length; pass += 1)
    for (const relation of cross) {
      const first = nodeKey(relation.from);
      const last = nodeKey(relation.to);
      if (positions.has(first) && !positions.has(last)) {
        const role = roleByNode.get(last);
        positions.set(last, { x: xs[role] + widths[role] / 2, y: positions.get(first).y });
      } else if (positions.has(last) && !positions.has(first)) {
        const role = roleByNode.get(first);
        positions.set(first, { x: xs[role] + widths[role] / 2, y: positions.get(last).y });
      }
    }
  for (const [index, { group }] of roles.entries())
    for (const member of group.elements) {
      const id = nodeKey(member);
      if (!positions.has(id))
        positions.set(id, {
          x: xs[index] + widths[index] / 2,
          y: graphTop + (highest * rankGap) / 2,
        });
    }
  return {
    xs,
    widths,
    width,
    graphWidth,
    positions,
    graphTop,
    graphBottom: graphTop + highest * rankGap + nodeHeight,
  };
}
