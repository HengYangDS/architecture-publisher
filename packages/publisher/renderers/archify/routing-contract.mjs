import { fail } from "../../src/protocol/values.mjs";
import { expandBox, parallelStrokesOverlap, segmentHitsBox } from "../../src/scene/geometry.mjs";
import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";
import { auditInteractiveGeometry } from "../elk/audit.mjs";
import { placeMeasuredLabel } from "../elk/text.mjs";
import {
  DESKTOP_READABILITY_VIEWPORT,
  DECLARED_WIDE_REFERENCE_BODY_HORIZONTAL_PX,
  DECLARED_WIDE_REFERENCE_DIAGRAM_HORIZONTAL_PX,
} from "./supply/renderers/shared/desktop-readability.mjs";
import {
  collectArrowheadCollisions,
  collectRouteRhythmIssues,
  rectsOverlap,
  routeHonorsEndpointSides,
} from "./supply/renderers/shared/geometry.mjs";

export const intrinsicReadingWidth =
  Math.min(
    marks.desktopReadingWidth,
    marks.shellMaximumWidth,
    DESKTOP_READABILITY_VIEWPORT.width - DECLARED_WIDE_REFERENCE_BODY_HORIZONTAL_PX,
  ) - DECLARED_WIDE_REFERENCE_DIAGRAM_HORIZONTAL_PX;

export const rhythm = Object.freeze({
  interiorSegmentPx: marks.routeInteriorSegment,
  endpointStubPx: marks.routeEndpointStub,
});

export const clearance = marks.textClearance + marks.selectedRouteStroke / 2;

export const nodeRouteClearance =
  marks.readingGap / 2 + (marks.selectedNodeStroke + marks.selectedRouteStroke) / 2;

export const vectors = Object.freeze({
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  bottom: [0, 1],
});

/** The native planner reserves painted ink; allocation whitespace remains local. */
export function routingLabelSlot(plan, points) {
  const local = placeMeasuredLabel(plan, -(plan.x ?? 0), -(plan.y ?? 0));
  const { paintBox: ink } = local;
  const width = ink.width + clearance * 2;
  const height = ink.height + clearance * 2;
  const segment = points
    .slice(1)
    .map((end, index) => ({
      start: points[index],
      end,
      length: Math.abs(end[0] - points[index][0]) + Math.abs(end[1] - points[index][1]),
    }))
    .sort((left, right) => right.length - left.length)[0];
  const horizontal = segment.start[1] === segment.end[1];
  const middleX = (segment.start[0] + segment.end[0]) / 2;
  const middleY = (segment.start[1] + segment.end[1]) / 2;
  const x = horizontal ? middleX - width / 2 : middleX + clearance + 2;
  const y = horizontal ? middleY - height - clearance - 2 : middleY - height / 2;
  return { x, y, width, height, lx: x + width / 2, ly: y + 10 };
}

export function placeRoutingLabel(plan, slot) {
  const local = placeMeasuredLabel(plan, -(plan.x ?? 0), -(plan.y ?? 0));
  const ink = local.paintBox;
  return placeMeasuredLabel(local, slot.x - ink.x + clearance, slot.y - ink.y + clearance);
}

export function reserveRouteStrokes(segments) {
  const occupied = segments.map(({ start, end }) => ({
    start: { x: start[0], y: start[1] },
    end: { x: end[0], y: end[1] },
  }));
  const rejectedKeys = new Set();
  const rejected = [];
  return {
    segments: rejected,
    admits(points) {
      let clear = true;
      for (const [index, end] of points.slice(1).entries()) {
        const start = points[index];
        const segment = {
          start: { x: start[0], y: start[1] },
          end: { x: end[0], y: end[1] },
        };
        if (
          !occupied.some((prior) =>
            parallelStrokesOverlap(segment, prior, marks.selectedRouteStroke),
          )
        )
          continue;
        clear = false;
        const key = JSON.stringify([start, end]);
        if (!rejectedKeys.has(key)) {
          rejectedKeys.add(key);
          rejected.push({ start, end });
        }
      }
      return clear;
    },
  };
}

/** Every native grid path contains these fixed stubs, irrespective of its detour. */
export function gridEndpointCorridorsClear({
  start,
  end,
  fromSide,
  toSide,
  endpointStubPx,
  bounds,
  obstacles,
  segments,
}) {
  const inset = marks.selectedRouteStroke / 2;
  return [
    [start, fromSide],
    [end, toSide],
  ].every(([point, side]) => {
    const a = { x: point[0], y: point[1] };
    const b = {
      x: a.x + vectors[side][0] * endpointStubPx,
      y: a.y + vectors[side][1] * endpointStubPx,
    };
    return (
      [a, b].every(
        ({ x, y }) =>
          x >= inset && y >= inset && x <= bounds.width - inset && y <= bounds.height - inset,
      ) &&
      !obstacles.some((box) => segmentHitsBox(a, b, box)) &&
      !segments.some(({ start, end }) =>
        parallelStrokesOverlap(
          { start: a, end: b },
          { start: { x: start[0], y: start[1] }, end: { x: end[0], y: end[1] } },
          marks.selectedRouteStroke,
        ),
      )
    );
  });
}

/** A facing endpoint opens its contact corridor, never the rest of its perimeter. */
export function routeNodeMask(node, relation, endpoints) {
  const box = expandBox(node, nodeRouteClearance);
  if (![relation.source, relation.target].includes(node.id)) return box;
  const start = relation.points[0],
    end = relation.points.at(-1);
  const from = endpointSide(start, endpoints.get(relation.source));
  const to = endpointSide(end, endpoints.get(relation.target));
  const axis = ["left", "right"].includes(from) ? "x" : "y";
  const index = axis === "x" ? 0 : 1;
  if (
    vectors[from][index] !== -vectors[to][index] ||
    (end[axis] - start[axis]) * vectors[from][index] <= 0
  )
    return box;
  const side = node.id === relation.source ? from : to;
  const extent = axis === "x" ? "width" : "height";
  if (vectors[side][index] < 0) {
    box[extent] -= node[axis] - box[axis];
    box[axis] = node[axis];
  } else box[extent] = node[axis] + node[extent] - box[axis];
  return box;
}

export function auditGroupTitleMasks(graph) {
  const titles = graph.groups.filter(({ label }) => label).map(({ id, label }) => ({ id, label }));
  for (const [index, title] of titles.entries()) {
    const collision =
      titles.slice(index + 1).find(({ label }) => rectsOverlap(title.label, label)) ??
      graph.nodes.find((node) => rectsOverlap(title.label, node)) ??
      graph.relations.find(({ label }) =>
        label?.baselines.some(({ box }) => rectsOverlap(title.label, box)),
      );
    if (collision)
      fail(
        "render_interactive_layout_infeasible",
        `render_interactive_layout_infeasible:group-title-mask-collision:${collision.id}`,
      );
  }
}

export function auditIntrinsicGeometry(graph) {
  auditInteractiveGeometry(graph);
  const endpoints = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const relation of graph.relations) {
    if (relation.nativeArrow === false && relation.source === relation.target) continue;
    for (let index = 1; index < relation.points.length; index++)
      for (const node of graph.nodes) {
        if (
          (node.id === relation.source && index === 1) ||
          (node.id === relation.target && index === relation.points.length - 1)
        )
          continue;
        if (
          segmentHitsBox(
            relation.points[index - 1],
            relation.points[index],
            routeNodeMask(node, relation, endpoints),
          )
        )
          fail(
            "render_interactive_layout_infeasible",
            `render_interactive_layout_infeasible:route-frame-clearance:${relation.id}:${node.id}`,
          );
      }
    const start = relation.points[0];
    const end = relation.points.at(-1);
    if (Math.hypot(end.x - start.x, end.y - start.y) < marks.routeEndpointStub)
      fail(
        "render_interactive_layout_infeasible",
        `render_interactive_layout_infeasible:endpoint-port-distance:${relation.id}`,
      );
    if (
      !routeHonorsEndpointSides(
        relation.points.map(({ x, y }) => [x, y]),
        endpointSide(start, endpoints.get(relation.source)),
        endpointSide(end, endpoints.get(relation.target)),
      )
    )
      fail(
        "render_interactive_layout_infeasible",
        `render_interactive_layout_infeasible:endpoint-side-direction:${relation.id}`,
      );
  }
  auditGroupTitleMasks(graph);
  for (const { label } of graph.groups) {
    if (!label) continue;
    const mask = expandBox(label, clearance);
    const collision = graph.relations.find(({ points }) =>
      points.slice(1).some((point, index) => segmentHitsBox(points[index], point, mask)),
    );
    if (collision)
      fail(
        "render_interactive_layout_infeasible",
        `render_interactive_layout_infeasible:group-title-mask-collision:${collision.id}`,
      );
  }
  const collisions = collectArrowheadCollisions({
    routedRelations: graph.relations
      .filter((relation) => relation.nativeArrow !== false)
      .flatMap((relation) => {
        const directed = {
          relation: {
            id: relation.id,
            from: relation.source,
            to: relation.target,
            variant: relation.variant,
          },
          points: relation.points.map(({ x, y }) => [x, y]),
        };
        return relation.direction === "bidirectional"
          ? [
              directed,
              {
                relation: { ...directed.relation, from: relation.target, to: relation.source },
                points: [...directed.points].reverse(),
              },
            ]
          : [directed];
      }),
  });
  if (collisions.length)
    fail(
      "render_interactive_layout_infeasible",
      `render_interactive_layout_infeasible:arrowhead-collision:${collisions[0].right.relation.id}`,
    );
  const issues = collectRouteRhythmIssues({
    routedRelations: graph.relations.map((relation) => ({
      relation,
      points: relation.points.map(({ x, y }) => [x, y]),
    })),
    ...rhythm,
  });
  if (issues.length) fail("render_interactive_layout_infeasible", issues[0].code);
}

export function endpointSide(point, box) {
  return [
    ["left", Math.abs(point.x - box.x)],
    ["right", Math.abs(point.x - box.x - box.width)],
    ["top", Math.abs(point.y - box.y)],
    ["bottom", Math.abs(point.y - box.y - box.height)],
  ].sort((left, right) => left[1] - right[1])[0][0];
}

export function nativeRoutingInput(graph) {
  const components = new Map(
    graph.nodes.map((node) => [
      node.id,
      {
        ...node,
        cx: node.x + node.width / 2,
        cy: node.y + node.height / 2,
      },
    ]),
  );
  const selected = graph.relations.map((relation) => ({
    subject: relation,
    from: relation.source,
    to: relation.target,
    label: relation.label?.lines.join("\n") ?? "",
    plan: relation.label,
  }));
  const coordinates = (connection) => {
    const source = components.get(connection.from),
      target = components.get(connection.to);
    return [source.y, source.x, target.y, target.x];
  };
  selected.sort((left, right) => {
    const a = coordinates(left),
      b = coordinates(right);
    for (let index = 0; index < a.length; index++)
      if (a[index] !== b[index]) return a[index] - b[index];
    return left.label.localeCompare(right.label, "en");
  });
  // Native tie-breaking receives private execution identity, never source ID spelling.
  const connections = selected.map((connection, index) => ({
    ...connection,
    id: `route-${String(index).padStart(6, "0")}`,
  }));
  return { components, connections };
}
