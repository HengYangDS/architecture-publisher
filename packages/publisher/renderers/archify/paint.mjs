import { fail } from "../../src/protocol/values.mjs";
import {
  rectsOverlap,
  segmentIntersectsRect,
  collectLabelRouteClearance,
  collectArrowheadCollisions,
} from "./supply/renderers/shared/geometry.mjs";

export const architectureStartMarker = Object.freeze({ width: 10, height: 7, refX: 9, refY: 3.5 });

/** Apply the original geometry collectors to every measured row and actual marker. */
export function assertArchitectureRelationLayout(scene, labels, geometries, sourceMarkers = []) {
  const routedRelations = scene.edges.map((edge, relationIndex) => ({
    relation: { ...edge, variant: edge.visualRole, width: edge.strokeWidth },
    relationIndex,
    points: geometries.get(edge.id).map(({ x, y }) => [x, y]),
  }));
  for (const [id, label] of labels) {
    const owner = routedRelations.find(({ relation }) => relation.id === id);
    for (const { box } of label.baselines) {
      const hits = collectLabelRouteClearance({
        labels: [{ relation: owner.relation, relationIndex: owner.relationIndex, rect: box }],
        routedRelations,
        threshold: 4,
      });
      if (hits.length)
        throw Object.assign(new Error("Measured relationship text collides with a route."), {
          code: "render_native_rejected",
          diagnostics: hits.map((hit) => ({
            code: "composition/label-route-clearance",
            evidence: { labelRect: hit.rect, clearance: hit.clearance, threshold: hit.threshold },
          })),
        });
    }
  }
  const collisions = collectArrowheadCollisions({
    routedRelations: [
      ...routedRelations.filter(({ relation }) => !relation.adornment),
      ...sourceMarkers.map(({ edge: id, direction }) => {
        const entry = routedRelations.find(({ relation }) => relation.id === id);
        const reverse = direction !== "reverse";
        return {
          ...entry,
          relation: {
            ...entry.relation,
            from: reverse ? entry.relation.to : entry.relation.from,
            to: reverse ? entry.relation.from : entry.relation.to,
          },
          points: reverse ? entry.points.slice().reverse() : entry.points,
        };
      }),
    ],
  });
  if (collisions.length)
    throw Object.assign(new Error("Native relationship arrowheads collide."), {
      code: "render_native_rejected",
      diagnostics: collisions.map((hit) => ({
        code: "composition/arrowhead-collision",
        evidence: { distancePx: hit.distance, minimumPx: hit.minimum },
      })),
    });
}

/** Audit local primitive ink without rewriting the native painter or moving ports. */
export function assertArchitecturePaintLayout(
  scene,
  nodes,
  labels,
  paths,
  sourceMarkers = [],
  texts = [],
) {
  const owners = new Map(nodes.map((node) => [node.id, node]));
  for (const { edge: id, direction } of sourceMarkers) {
    const index = scene.edges.findIndex((edge) => edge.id === id);
    const edge = scene.edges[index];
    const points = direction === "reverse" ? paths[index].slice().reverse() : paths[index];
    const tip = points[0],
      next = points[1];
    const distance = Math.hypot(next.x - tip.x, next.y - tip.y);
    const ux = (next.x - tip.x) / distance,
      uy = (next.y - tip.y) / distance;
    const scale = edge.strokeWidth ?? (edge.visualRole === "emphasis" ? 1.8 : 1.5);
    const marker = architectureStartMarker;
    const vertices = [
      [marker.width, marker.refY],
      [0, 0],
      [0, marker.height],
    ].map(([x, y]) => ({
      x: tip.x - (x - marker.refX) * scale * ux + (y - marker.refY) * scale * uy,
      y: tip.y - (x - marker.refX) * scale * uy - (y - marker.refY) * scale * ux,
    }));
    const left = Math.min(...vertices.map(({ x }) => x)),
      top = Math.min(...vertices.map(({ y }) => y));
    const box = {
      x: left,
      y: top,
      width: Math.max(...vertices.map(({ x }) => x)) - left,
      height: Math.max(...vertices.map(({ y }) => y)) - top,
    };
    if (
      !Number.isFinite(distance) ||
      distance === 0 ||
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > scene.viewport.width ||
      box.y + box.height > scene.viewport.height ||
      [...labels, ...texts].some((label) => rectsOverlap(box, label, 5)) ||
      nodes.some(
        (node) =>
          ![edge.from, edge.to].includes(node.id) &&
          rectsOverlap(box, node.paintBox ?? { ...node.position, ...node.size }, 2),
      )
    )
      fail("authored_interactive_paint_geometry_invalid", `${id}:source-marker`);
  }
  for (const mark of nodes.filter((node) => node.primitives)) {
    const box = mark.paintBox;
    if (
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > scene.viewport.width ||
      box.y + box.height > scene.viewport.height
    )
      fail("authored_interactive_paint_geometry_invalid", `${mark.id}:bounds`);
    for (const owner of owners.values()) {
      const other = owner.paintBox ?? { ...owner.position, ...owner.size };
      if (owner.id !== mark.id && rectsOverlap(box, other, 8))
        fail("authored_interactive_paint_geometry_invalid", `${mark.id}:node`);
    }
    if (labels.some((owner) => rectsOverlap(box, owner, 5)))
      fail("authored_interactive_paint_geometry_invalid", `${mark.id}:label`);
    for (const [index, points] of paths.entries()) {
      const edge = scene.edges[index];
      if ([edge.from, edge.to].includes(mark.id)) continue;
      if (
        points
          .slice(1)
          .some((point, i) =>
            segmentIntersectsRect(
              { start: [points[i].x, points[i].y], end: [point.x, point.y] },
              box,
              1,
            ),
          )
      )
        fail("authored_interactive_paint_geometry_invalid", `${mark.id}:route`);
    }
  }
}
