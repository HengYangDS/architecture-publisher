import { AUTHORED_ROUTE_LIMITS as limits } from '../edition/schema.mjs';
import { authoredRoutesValid, literalSegmentValid } from '../edition/generated/validators.mjs';
import { fail } from '../protocol/values.mjs';
import { boundaryDistance, pointDistance, segmentHitsBox, expandBox } from './geometry.mjs';
import { authoredReference } from './statements.mjs';

const referenceFor = (namespace, id) => JSON.stringify([namespace, 'entity', id]);
const endpoint = (edge, medium, target = false) =>
  medium === 'static' ? edge[target ? 'target' : 'source'] : edge[target ? 'to' : 'from'];
const portBox = (node, medium) =>
  medium === 'static' ? node.box : { ...node.position, ...node.size };
const invalid = () => fail('authored_route_invalid');

function assertLiteralPaintGeometry(scene, edge, nodes, medium) {
  const width = medium === 'static' ? scene.width : scene.viewport.width;
  const height = medium === 'static' ? scene.height : scene.viewport.height;
  const parts = edge.points
    .slice(1)
    .map((end, index) => ({ start: edge.points[index], end, width: edge.strokeWidth }));
  if (edge.arrow) {
    const tip = edge.points.at(-1),
      previous = edge.points.at(-2);
    const distance = pointDistance(previous, tip);
    const ux = (tip.x - previous.x) / distance,
      uy = (tip.y - previous.y) / distance;
    const { length, halfWidth, strokeWidth } = edge.arrowGeometry;
    for (const sign of [-1, 1])
      parts.push({
        start: {
          x: tip.x - ux * length - sign * uy * halfWidth,
          y: tip.y - uy * length + sign * ux * halfWidth,
        },
        end: tip,
        width: strokeWidth,
      });
  }
  for (const part of parts) {
    const half = part.width / 2;
    if (
      [part.start, part.end].some(
        (point) =>
          point.x - half < 0 ||
          point.y - half < 0 ||
          point.x + half > width ||
          point.y + half > height,
      )
    )
      fail('authored_route_paint_geometry_invalid');
    if (
      (scene.texts ?? []).some(
        (text) =>
          text.visible &&
          text.text.trim() &&
          segmentHitsBox(part.start, part.end, expandBox(text.box, 5 + half)),
      )
    )
      fail('authored_route_paint_geometry_invalid');
    for (const node of nodes.values()) {
      if ([endpoint(edge, medium), endpoint(edge, medium, true)].includes(node.id)) continue;
      const box = node.paintBox ?? portBox(node, medium);
      if (segmentHitsBox(part.start, part.end, expandBox(box, 2 + half)))
        fail('authored_route_paint_geometry_invalid');
    }
  }
}

/** Physical contacts and finite traversal admission; no source meaning is inferred. */
export function validateAuthoredRouteGeometry(scene, medium) {
  const routes = Object.hasOwn(scene, 'routes') ? scene.routes : [];
  if (!authoredRoutesValid(routes)) invalid();
  const nodes = new Map(scene.nodes.map((node) => [node.id, node]));
  const edges = new Map();
  let pointCount = 0;
  for (const edge of scene.edges) {
    if (edges.has(edge.id)) invalid();
    edges.set(edge.id, edge);
    if (!Object.hasOwn(edge, 'adornment')) continue;
    if (
      !literalSegmentValid(edge) ||
      !Object.hasOwn(edge, medium === 'static' ? 'source' : 'from') ||
      nodes.has(edge.id)
    )
      invalid();
    pointCount += edge.points.length;
    if (pointCount > limits.points) fail('authored_route_budget_exceeded');
    const from = nodes.get(endpoint(edge, medium));
    const to = nodes.get(endpoint(edge, medium, true));
    if (
      !from ||
      !to ||
      boundaryDistance(edge.points[0], portBox(from, medium)) > 1 ||
      boundaryDistance(edge.points.at(-1), portBox(to, medium)) > 1
    )
      invalid();
    for (let i = 1; i < edge.points.length; i++) {
      const a = edge.points[i - 1],
        b = edge.points[i];
      if (!pointDistance(a, b) || (a.x !== b.x && a.y !== b.y)) invalid();
    }
    if (
      edge.arrow &&
      (Object.values(edge.arrowGeometry).some((value) => value <= 0) ||
        pointDistance(edge.points.at(-2), edge.points.at(-1)) <
          Math.max(14, edge.arrowGeometry.length))
    )
      invalid();
    const ink =
      medium === 'static' ? scene.paint?.[edge.strokeTone]?.toLowerCase() : edge.strokeTone;
    const background = medium === 'static' ? scene.paint?.paper?.toLowerCase() : 'paper';
    if (!ink || ink === background) invalid();
    assertLiteralPaintGeometry(scene, edge, nodes, medium);
  }
  const routeIds = new Set();
  let traversalCount = 0;
  for (const route of routes) {
    traversalCount += route.traversals.length;
    if (traversalCount > limits.references) fail('authored_route_budget_exceeded');
    if (routeIds.has(route.id) || !nodes.has(route.source) || !nodes.has(route.target)) invalid();
    routeIds.add(route.id);
    const traversed = new Set();
    let previousId = route.source;
    let previousContact;
    for (const { edge: id, direction } of route.traversals) {
      const edge = edges.get(id);
      if (!edge?.adornment || traversed.has(id) || (direction === 'reverse' && edge.arrow))
        invalid();
      traversed.add(id);
      const reverse = direction === 'reverse';
      const from = endpoint(edge, medium, reverse),
        to = endpoint(edge, medium, !reverse);
      const start = reverse ? edge.points.at(-1) : edge.points[0];
      const end = reverse ? edge.points[0] : edge.points.at(-1);
      if (from !== previousId || (previousContact && pointDistance(start, previousContact) > 1))
        invalid();
      previousId = to;
      previousContact = end;
    }
    const terminal = route.traversals.at(-1);
    if (
      previousId !== route.target ||
      terminal.direction !== 'forward' ||
      !edges.get(terminal.edge).arrow
    )
      invalid();
  }
  return routes;
}

/** Exact reference bindings reuse upstream assertions and the existing physical edges. */
export function bindAuthoredRoutes(scene, { medium, entities, relations, editorials, selections }) {
  const routes = validateAuthoredRouteGeometry(scene, medium);
  const represented = new Map();
  let pairs = 0;
  for (const route of routes) {
    const [namespace, kind, id] = authoredReference(
      route.reference,
      ['relation', 'editorial'],
      'authored_route_reference_invalid',
    );
    const from = entities.get(route.source),
      to = entities.get(route.target);
    if (!from || !to) invalid();
    if (kind === 'relation') {
      const relation = relations.get(route.reference);
      if (
        Object.hasOwn(route, 'editionSha256') ||
        !relation ||
        !from.has(referenceFor(namespace, relation.from.id)) ||
        !to.has(referenceFor(namespace, relation.to.id))
      )
        invalid();
    } else {
      const editorial = editorials.get(id);
      if (
        !editorial ||
        editorial.reference !== route.reference ||
        editorial.edition.sha256 !== route.editionSha256
      )
        invalid();
      const basis = new Set(
        editorial.assertion.basis.flatMap((selectionId) =>
          selections
            .get(selectionId)
            .members.elements.map((entity) => referenceFor(entity.namespace, entity.id)),
        ),
      );
      if (![from, to].every((members) => [...members].some((reference) => basis.has(reference))))
        invalid();
    }
    const graphics = represented.get(route.reference) ?? [];
    for (const traversal of route.traversals) {
      pairs++;
      if (pairs > limits.pairs) fail('authored_route_budget_exceeded');
      if (!graphics.includes(traversal.edge)) graphics.push(traversal.edge);
    }
    represented.set(route.reference, graphics);
  }
  return represented;
}
