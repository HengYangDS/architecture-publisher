import { fail } from "../../src/protocol/values.mjs";
import {
  interactiveGraphMarks as marks,
  literalArrowMinimumTerminal,
} from "../../src/scene/marks.mjs";
import {
  boundaryDistance,
  boxesOverlap,
  boxRight,
  boxBottom,
  expandBox,
  pointDistance,
  parallelStrokesOverlap,
  segmentHitsBox,
} from "../../src/scene/geometry.mjs";

const bad = (kind, id) =>
  fail(
    "render_interactive_layout_infeasible",
    `render_interactive_layout_infeasible:${kind}:${id}`,
  );

/** Reject paint collisions before emitting exact coordinates; this never repairs a layout. */
export function auditInteractiveGeometry(graph) {
  const canvas = graph.bounds;
  const inside = (box) =>
    box.x >= 0 && box.y >= 0 && boxRight(box) <= canvas.width && boxBottom(box) <= canvas.height;
  const leaves = new Map(graph.nodes.map((node) => [node.id, node]));
  const texts = [];
  for (const node of [...graph.groups, ...graph.nodes]) {
    if (!inside(expandBox(node, marks.selectedNodeStroke / 2))) bad("node-bounds", node.id);
    for (const line of node.label.baselines) {
      if (
        !inside(line.box) ||
        line.box.x < node.x + marks.textOwnerClearance ||
        line.box.y < node.y + marks.textOwnerClearance ||
        boxRight(line.box) > boxRight(node) - marks.textOwnerClearance ||
        boxBottom(line.box) > boxBottom(node) - marks.textOwnerClearance
      )
        bad("text-containment", node.id);
      texts.push({ ...line.box, owner: node.id });
    }
  }
  for (const [index, node] of graph.nodes.entries()) {
    for (const other of graph.nodes.slice(index + 1))
      if (boxesOverlap(expandBox(node, 4), other)) bad("node-collision", node.id);
  }
  for (const [index, group] of graph.groups.entries()) {
    for (const other of graph.groups.slice(index + 1))
      if (boxesOverlap(expandBox(group, 4), other)) bad("group-collision", group.id);
    for (const node of graph.nodes)
      if (node.groupId !== group.id && boxesOverlap(expandBox(group, 2), node))
        bad("group-nonmember-collision", group.id);
  }
  for (const relation of graph.relations) {
    if (relation.label)
      for (const line of relation.label.baselines) {
        if (!inside(line.box)) bad("label-bounds", relation.id);
        texts.push({ ...line.box, owner: relation.id });
      }
  }
  for (const [index, text] of texts.entries()) {
    for (const other of texts.slice(index + 1))
      if (boxesOverlap(expandBox(text, marks.textClearance), other))
        bad("text-collision", text.owner);
    for (const node of graph.nodes)
      if (
        node.id !== text.owner &&
        boxesOverlap(
          expandBox(text, marks.textClearance),
          expandBox(node, marks.selectedNodeStroke / 2),
        )
      )
        bad("label-node-collision", text.owner);
  }
  const routeSegments = [];
  for (const relation of graph.relations) {
    const minimumTerminal = relation.arrowGeometry
      ? Math.max(literalArrowMinimumTerminal, relation.arrowGeometry.length)
      : 10;
    for (const [id, point] of [
      [relation.source, relation.points[0]],
      [relation.target, relation.points.at(-1)],
    ]) {
      const node = leaves.get(id);
      if (!node || boundaryDistance(point, node) > 0.01) bad("detached-terminal", relation.id);
    }
    if (
      pointDistance(relation.points.at(-2), relation.points.at(-1)) < minimumTerminal ||
      (relation.direction === "bidirectional" &&
        pointDistance(relation.points[0], relation.points[1]) < minimumTerminal)
    )
      bad("short-terminal", relation.id);
    for (let index = 1; index < relation.points.length; index++) {
      const start = relation.points[index - 1];
      const end = relation.points[index];
      if ((start.x !== end.x && start.y !== end.y) || (start.x === end.x && start.y === end.y))
        bad("nonorthogonal-segment", relation.id);
      for (const previous of routeSegments)
        if (
          previous.owner !== relation.id &&
          parallelStrokesOverlap({ start, end }, previous, marks.selectedRouteStroke)
        )
          bad("route-stroke-collision", relation.id);
      routeSegments.push({ owner: relation.id, start, end });
      if (
        !inside({
          x: Math.min(start.x, end.x) - marks.selectedRouteStroke / 2,
          y: Math.min(start.y, end.y) - marks.selectedRouteStroke / 2,
          width: Math.abs(end.x - start.x) + marks.selectedRouteStroke,
          height: Math.abs(end.y - start.y) + marks.selectedRouteStroke,
        })
      )
        bad("route-bounds", relation.id);
      for (const text of texts)
        if (
          segmentHitsBox(
            start,
            end,
            expandBox(text, marks.textClearance + marks.selectedRouteStroke / 2),
          )
        )
          bad("route-text-collision", relation.id);
      for (const node of graph.nodes)
        if (
          segmentHitsBox(
            start,
            end,
            expandBox(node, [relation.source, relation.target].includes(node.id) ? -0.01 : 2.25),
          )
        )
          bad("route-node-collision", relation.id);
    }
    const terminals = [[relation.points.at(-1), relation.points.at(-2)]];
    if (relation.direction === "bidirectional")
      terminals.push([relation.points[0], relation.points[1]]);
    for (const [tip, previous] of terminals) {
      const arrowLength = relation.arrowGeometry?.length ?? marks.arrowLength;
      const arrowHalfWidth = relation.arrowGeometry?.halfWidth ?? marks.arrowHalfWidth;
      const length = pointDistance(tip, previous);
      const ux = (tip.x - previous.x) / length;
      const uy = (tip.y - previous.y) / length;
      const points = [
        tip,
        {
          x: tip.x - ux * arrowLength - uy * arrowHalfWidth,
          y: tip.y - uy * arrowLength + ux * arrowHalfWidth,
        },
        {
          x: tip.x - ux * arrowLength + uy * arrowHalfWidth,
          y: tip.y - uy * arrowLength - ux * arrowHalfWidth,
        },
      ];
      const box = {
        x: Math.min(...points.map(({ x }) => x)),
        y: Math.min(...points.map(({ y }) => y)),
        width: Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x)),
        height: Math.max(...points.map(({ y }) => y)) - Math.min(...points.map(({ y }) => y)),
      };
      if (!inside(box)) bad("arrow-bounds", relation.id);
      for (const node of graph.nodes)
        if (
          ![relation.source, relation.target].includes(node.id) &&
          boxesOverlap(box, expandBox(node, 1))
        )
          bad("arrow-node-collision", relation.id);
      for (const text of texts)
        if (boxesOverlap(expandBox(box, marks.textClearance), text))
          bad("arrow-text-collision", relation.id);
    }
  }
}
