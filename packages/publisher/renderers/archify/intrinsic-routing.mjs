import { fail } from "../../src/protocol/values.mjs";
import { expandBox, segmentHitsBox } from "../../src/scene/geometry.mjs";
import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";
import { placeMeasuredLabel } from "../elk/text.mjs";
import { createRouter } from "./supply/renderers/architecture/routing.mjs";
import {
  placeAutomaticLabels,
  reservedLabelRect,
} from "./supply/renderers/shared/automatic-labels.mjs";
import {
  anchor,
  automaticPortSpread,
  automaticPortRhythmBridge,
  collectAmbiguousCorridors,
  collectRouteRhythmIssues,
  defaultFromSide,
  defaultToSide,
  routeHonorsEndpointSides,
} from "./supply/renderers/shared/geometry.mjs";
import { shortestOrthogonalGridRoute } from "./supply/renderers/shared/route-quality.mjs";
import {
  auditGroupTitleMasks,
  auditIntrinsicGeometry,
  clearance,
  endpointSide,
  nativeRoutingInput,
  routeNodeMask,
  reserveRouteStrokes,
  routingLabelSlot,
  placeRoutingLabel,
  rhythm,
  vectors,
} from "./routing-contract.mjs";

export async function routePackedIntrinsicGeometry(graph) {
  auditIntrinsicGeometry({ ...graph, relations: [] });
  const { components, connections } = nativeRoutingInput(graph);
  const initialLabel = (connection, points) => {
    const slot = routingLabelSlot(connection.plan, points);
    return {
      ...slot,
      relation: connection,
      id: connection.subject.id,
    };
  };
  const router = createRouter(components, connections, {
    distinctAutomaticPorts: true,
    preferReadableRoutes: true,
    labelRectFor: (connection, points, { routes, labels }) =>
      connection.plan
        ? reservedLabelRect({
            label: initialLabel(connection, points),
            points,
            routes: routes.map((points, relationIndex) => ({ points, relationIndex })),
            labels,
            components: [...components.values()],
          })
        : null,
  });
  const routes = connections.map((connection, relationIndex) => ({
    relationIndex,
    points: router.pathFor(connection).points,
  }));
  const labels = connections.flatMap((connection, relationIndex) =>
    connection.plan
      ? [{ ...initialLabel(connection, routes[relationIndex].points), relationIndex }]
      : [],
  );
  const points = routes.flatMap(({ points }) => points);
  const dx = Math.max(0, 8 - Math.min(...points.map(([x]) => x), ...graph.nodes.map(({ x }) => x)));
  const dy = Math.max(
    0,
    8 - Math.min(...points.map(([, y]) => y), ...graph.nodes.map(({ y }) => y)),
  );
  for (const item of [...graph.groups, ...graph.nodes]) {
    item.x += dx;
    item.y += dy;
    item.label = {
      ...placeMeasuredLabel(item.label, dx, dy),
      x: (item.label.x ?? 0) + dx,
      y: (item.label.y ?? 0) + dy,
    };
  }
  for (const route of routes) route.points = route.points.map(([x, y]) => [x + dx, y + dy]);
  for (const label of labels) {
    label.x += dx;
    label.y += dy;
    label.lx += dx;
    label.ly += dy;
  }
  graph.bounds.width = Math.max(
    graph.bounds.width + dx,
    ...routes.flatMap(({ points }) => points.map(([x]) => x + 32)),
  );
  graph.bounds.height = Math.max(
    graph.bounds.height + dy,
    ...routes.flatMap(({ points }) => points.map(([, y]) => y + 32)),
  );
  const byId = new Map(labels.map((label) => [label.id, label]));
  const routesById = new Map(
    connections.map((connection, index) => [connection.subject.id, routes[index]]),
  );
  graph.relations = graph.relations.map((relation) => ({
    ...relation,
    points: relation.points.length
      ? relation.points.map(({ x, y }) => ({ x: x + dx, y: y + dy }))
      : routesById.get(relation.id).points.map(([x, y]) => ({ x, y })),
    label: relation.label
      ? relation.points.length
        ? {
            ...placeMeasuredLabel(relation.label, dx, dy),
            x: relation.label.x + dx,
            y: relation.label.y + dy,
          }
        : placeRoutingLabel(relation.label, byId.get(relation.id))
      : null,
  }));
  const originalOrder = graph.relations.map(({ id }) => id);
  const relations = new Map(graph.relations.map((relation) => [relation.id, relation]));
  const distance = (relation) => {
    const source = components.get(relation.source),
      target = components.get(relation.target);
    return Math.abs(target.cx - source.cx) + Math.abs(target.cy - source.cy);
  };
  // Match native planning: reserve short local relationships before shared fan-in routes.
  graph.relations = connections
    .map(({ subject }) => relations.get(subject.id))
    .sort((left, right) => distance(left) - distance(right));
  await routeIntrinsicGeometry(graph, { automatic: true });
  const resolved = new Map(graph.relations.map((relation) => [relation.id, relation]));
  graph.relations = originalOrder.map((id) => resolved.get(id));
}

function routeAutomaticGeometry(graph) {
  const { components, connections } = nativeRoutingInput(graph);
  const accepted = [];
  const resolved = new Map();
  const tryPair = (relation, prior, searchBudget) => {
    if (prior.length) {
      const native = { ...relation, points: prior };
      const complete = [...accepted, native];
      const routes = complete.map((edge) => ({
        relation: { id: edge.id, from: edge.source, to: edge.target },
        points: edge.points.map(({ x, y }) => [x, y]),
      }));
      try {
        auditIntrinsicGeometry({ ...graph, relations: complete });
        if (
          !collectAmbiguousCorridors({
            routedRelations: routes,
            includeSharedEndpoints: () => true,
          }).length
        )
          return native;
      } catch (error) {
        if (error.code !== "render_interactive_layout_infeasible") throw error;
      }
    }
    const candidate = { ...relation, points: prior, label: null };
    const tentative = { ...graph, relations: [...accepted, candidate] };
    const qualify = (_, positioned) => {
      candidate.points = positioned;
      candidate.label = null;
      if (!relation.label) return true;
      const points = candidate.points.map(({ x, y }) => [x, y]);
      const slot = routingLabelSlot(relation.label, points);
      const [placed] = placeAutomaticLabels({
        labels: [
          {
            relation: {},
            relationIndex: 0,
            ...slot,
          },
        ],
        // Every physical segment stays visible, including the label's own route.
        routes: [
          { relationIndex: 0, points },
          ...tentative.relations.map((edge) => ({
            relationIndex: -1,
            points: edge.points.map(({ x, y }) => [x, y]),
          })),
        ],
        components: [
          ...graph.nodes.map((node) => expandBox(node, marks.selectedNodeStroke / 2)),
          ...accepted.flatMap(({ label }) => label?.baselines.map(({ box }) => box) ?? []),
        ],
        titles: graph.groups.map(({ label }) => label),
        viewBox: [graph.bounds.width, graph.bounds.height],
        keepFallbackNearRoute: true,
        gridSweep: true,
        maxOwnRouteDistance: slot.height * 2,
      });
      candidate.label = placeRoutingLabel(relation.label, placed);
      try {
        auditIntrinsicGeometry(tentative);
        return true;
      } catch (error) {
        candidate.label = null;
        if (error.code !== "render_interactive_layout_infeasible") throw error;
        return false;
      }
    };
    routeFixedGeometry(tentative, accepted, qualify, searchBudget);
    auditIntrinsicGeometry(tentative);
    return candidate;
  };
  // Existing accepted paths keep their reservation order; native tie-breaks stay private.
  for (const relation of graph.relations) {
    let candidate;
    const searchBudget = { remainingGridNodes: 100_000 };
    const attempt = (points) => {
      try {
        candidate = tryPair(relation, points, searchBudget);
        return true;
      } catch (error) {
        if (error.code !== "render_interactive_layout_infeasible") throw error;
        return false;
      }
    };
    if (!attempt(relation.points)) {
      const source = components.get(relation.source),
        target = components.get(relation.target);
      const from = defaultFromSide(source, target),
        to = defaultToSide(source, target);
      const sides = ["left", "right", "top", "bottom"];
      const pairs = [from, ...sides.filter((side) => side !== from)].flatMap((fromSide) =>
        [to, ...sides.filter((side) => side !== to)].map((toSide) => ({ fromSide, toSide })),
      );
      for (const pair of pairs) {
        const selected = connections.map((connection) => {
          const prior = resolved.get(connection.subject.id);
          if (connection.subject.id === relation.id) return { ...connection, ...pair };
          if (!prior) return connection;
          return {
            ...connection,
            fromSide: endpointSide(prior.points[0], components.get(connection.from)),
            toSide: endpointSide(prior.points.at(-1), components.get(connection.to)),
          };
        });
        const connection = selected.find(({ subject }) => subject.id === relation.id);
        const ports = automaticPortSpread(selected, components).get(connection);
        const start = ports?.from ?? anchor(source, pair.fromSide);
        const end = ports?.to ?? anchor(target, pair.toSide);
        if (attempt([start, end].map(([x, y]) => ({ x, y })))) break;
      }
    }
    if (!candidate)
      fail(
        "render_interactive_layout_infeasible",
        `render_interactive_layout_infeasible:route-label-pair:${relation.id}`,
      );
    accepted.push(candidate);
    resolved.set(relation.id, candidate);
  }
  const complete = { ...graph, relations: accepted };
  auditIntrinsicGeometry(complete);
  const corridors = collectAmbiguousCorridors({
    routedRelations: accepted.map((relation) => ({
      relation: { id: relation.id, from: relation.source, to: relation.target },
      points: relation.points.map(({ x, y }) => [x, y]),
    })),
    includeSharedEndpoints: () => true,
  });
  if (corridors.length) fail("render_interactive_layout_infeasible", corridors[0].code);
  graph.relations = graph.relations.map(({ id }) => resolved.get(id));
}

export async function routeIntrinsicGeometry(graph, { automatic = false } = {}) {
  auditIntrinsicGeometry({ ...graph, relations: [] });
  try {
    auditIntrinsicGeometry(graph);
    return;
  } catch (error) {
    if (error.code !== "render_interactive_layout_infeasible") throw error;
  }
  const candidate = structuredClone(graph);
  if (automatic) routeAutomaticGeometry(candidate);
  else routeFixedGeometry(candidate);
  Object.assign(graph, candidate);
}

function routeFixedGeometry(graph, accepted = [], qualify = undefined, searchBudget = undefined) {
  auditGroupTitleMasks(graph);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const ink = [
    ...[...graph.nodes, ...graph.relations].flatMap(
      ({ label }) => label?.baselines.map(({ box }) => box) ?? [],
    ),
    ...graph.groups.flatMap(({ label }) => (label ? [label] : [])),
  ];
  const resolved = accepted.map((relation) => ({
    relation: { id: relation.id, from: relation.source, to: relation.target },
    points: relation.points.map(({ x, y }) => [x, y]),
  }));
  const relationsById = new Map(graph.relations.map((relation) => [relation.id, relation]));
  for (const relation of graph.relations.slice(accepted.length)) {
    const source = nodes.get(relation.source),
      target = nodes.get(relation.target);
    const startPoint = relation.points[0],
      endPoint = relation.points.at(-1);
    const start = [startPoint.x, startPoint.y],
      end = [endPoint.x, endPoint.y];
    const fromSide = endpointSide(startPoint, source),
      toSide = endpointSide(endPoint, target);
    const routed = (points) => ({
      relation: { id: relation.id, from: relation.source, to: relation.target },
      points,
    });
    const avoidedSegments = resolved.flatMap(({ points }) =>
      points.slice(1).map((end, index) => ({ start: points[index], end })),
    );
    const strokeReservations = reserveRouteStrokes(avoidedSegments);
    const accept = (points) => {
      if (
        !routeHonorsEndpointSides(points, fromSide, toSide) ||
        collectRouteRhythmIssues({ routedRelations: [{ points }], ...rhythm }).length
      )
        return false;
      if (!strokeReservations.admits(points)) return false;
      if (
        collectAmbiguousCorridors({
          routedRelations: [...resolved, routed(points)],
          includeSharedEndpoints: () => true,
        }).length
      )
        return false;
      const positioned = points.map(([x, y]) => ({ x, y }));
      if (
        positioned
          .slice(1)
          .some((point, at) =>
            ink.some((box) => segmentHitsBox(positioned[at], point, expandBox(box, clearance))),
          )
      )
        return false;
      try {
        auditIntrinsicGeometry({
          ...graph,
          relations: [
            ...resolved.map(({ relation: previous, points }) => ({
              ...relationsById.get(previous.id),
              points: points.map(([x, y]) => ({ x, y })),
            })),
            { ...relation, points: positioned },
          ],
        });
        return qualify?.(relation, positioned) ?? true;
      } catch (error) {
        if (error.code !== "render_interactive_layout_infeasible") throw error;
        return false;
      }
    };
    const prior = relation.points.map(({ x, y }) => [x, y]);
    if (accept(prior)) {
      resolved.push(routed(prior));
      continue;
    }
    const axis = ["left", "right"].includes(fromSide) ? 0 : 1;
    const outward = vectors[fromSide];
    const opposed =
      outward[axis] === -vectors[toSide][axis] && (end[axis] - start[axis]) * outward[axis] > 0;
    const gap = opposed ? Math.abs(end[axis] - start[axis]) : null;
    const stub =
      gap === null
        ? rhythm.endpointStubPx
        : Math.min(rhythm.endpointStubPx, (gap - rhythm.interiorSegmentPx) / 2);
    let points;
    // Opposed sides share one corridor. Independent fixed stubs can exceed its gap.
    if (opposed && gap >= 18) {
      const crossAxis = 1 - axis;
      const initial = [start[axis] + outward[axis] * 8, end[axis] - outward[axis] * 10].sort(
        (left, right) => left - right,
      );
      const crossLow = Math.min(start[crossAxis], end[crossAxis]);
      const crossHigh = Math.max(start[crossAxis], end[crossAxis]);
      let intervals = [initial];
      const obstacles = [
        ...ink,
        ...graph.nodes.filter((node) => ![relation.source, relation.target].includes(node.id)),
      ];
      for (const obstacle of obstacles) {
        const box = expandBox(obstacle, clearance);
        const alongLow = axis === 0 ? box.x : box.y;
        const alongHigh = alongLow + (axis === 0 ? box.width : box.height);
        const low = crossAxis === 0 ? box.x : box.y;
        const high = low + (crossAxis === 0 ? box.width : box.height);
        if (high < crossLow || low > crossHigh) continue;
        intervals = intervals.flatMap(([from, to]) => {
          if (alongHigh < from || alongLow > to) return [[from, to]];
          return [
            ...(from < alongLow ? [[from, alongLow]] : []),
            ...(alongHigh < to ? [[alongHigh, to]] : []),
          ];
        });
      }
      const center = (start[axis] + end[axis]) / 2;
      const channels = intervals
        .map(([from, to]) => (from + to) / 2)
        .sort((left, right) => Math.abs(left - center) - Math.abs(right - center));
      for (const channel of channels) {
        const first = [...start],
          last = [...end];
        first[axis] = channel;
        last[axis] = channel;
        const direct = [start, first, last, end].filter(
          (point, index, all) =>
            index === 0 || point[0] !== all[index - 1][0] || point[1] !== all[index - 1][1],
        );
        if (accept(direct)) {
          points = direct;
          break;
        }
      }
    }
    points ??= automaticPortRhythmBridge(start, end, fromSide, toSide, {
      ...rhythm,
      accept,
    });
    if (!points) {
      const edgeInset = marks.selectedRouteStroke / 2;
      // The native search may cross relationship strokes, never the canvas.
      // Closed one-pixel obstacles keep its accepted path inside the full paint box.
      const extent = Math.max(graph.bounds.width, graph.bounds.height) + 1;
      const borders = [
        { x: -extent, y: -extent, width: extent + edgeInset, height: extent * 3 },
        { x: graph.bounds.width - edgeInset, y: -extent, width: extent * 2, height: extent * 3 },
        { x: -extent, y: -extent, width: extent * 3, height: extent + edgeInset },
        { x: -extent, y: graph.bounds.height - edgeInset, width: extent * 3, height: extent * 2 },
      ].map((box) => expandBox(box, -clearance));
      // Start at native readable-segment resolution; retain exact corridors as fallback.
      // All endpoint alternatives solve one relationship within its original budget.
      const budget = searchBudget ?? { remainingGridNodes: 100_000 };
      for (const minimumSegmentPx of [rhythm.interiorSegmentPx, marks.selectedRouteStroke]) {
        while (budget.remainingGridNodes > 0) {
          const reservationCount = strokeReservations.segments.length;
          const metrics = {};
          const route = shortestOrthogonalGridRoute({
            start,
            end,
            points: prior,
            obstacles: [
              // Node bodies already reserve their internal glyphs. Repeating every
              // glyph edge adds no paint protection and fragments the native grid.
              ...graph.relations.flatMap(
                ({ label }) => label?.baselines.map(({ box }) => box) ?? [],
              ),
              ...graph.groups.flatMap(({ label }) => (label ? [label] : [])),
              ...borders,
              ...graph.nodes.map((node) =>
                expandBox(routeNodeMask(node, relation, nodes), -clearance),
              ),
            ],
            fromSide,
            toSide,
            clearance,
            maximumObstacleCount: graph.nodes.length + ink.length + borders.length,
            maximumGridNodes: budget.remainingGridNodes,
            endpointStubPx: Math.max(10, stub),
            minimumSegmentPx,
            bendPenaltyPx: rhythm.endpointStubPx * 2,
            avoidedSegments: [...avoidedSegments, ...strokeReservations.segments],
            minimumAvoidedOverlapPx: 0.0001,
            allowAvoidedCrossings: true,
            routeSeparationPx: rhythm.interiorSegmentPx,
            accept,
            metrics,
          });
          budget.remainingGridNodes -= metrics.candidateNodeCount ?? 0;
          if (route) {
            points = route.points;
            break;
          }
          // A rejected painted segment becomes a native reservation. Search again
          // only for that new constraint, within the original aggregate node budget.
          if (strokeReservations.segments.length === reservationCount) break;
        }
        if (points) break;
      }
    }
    if (!points)
      fail(
        "render_interactive_layout_infeasible",
        `render_interactive_layout_infeasible:route-ink-or-rhythm:${relation.id}`,
      );
    relation.points = points.map(([x, y]) => ({ x, y }));
    resolved.push(routed(points));
  }
  auditIntrinsicGeometry(graph);
}
