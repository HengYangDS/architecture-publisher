import { fail } from "../protocol/values.mjs";
import { authoredReference } from "./statements.mjs";

export const TEXT_OWNER_CLEARANCE = 8;

/** Owner is an explicit graphic allocation, never an inferred semantic identity. */
export function validateAuthoredTextOwners(texts, nodes, edges = []) {
  const owners = new Map(nodes.map((node) => [node.id, node]));
  const relations = new Map(edges.map((edge) => [edge.id, edge]));
  for (const text of texts) {
    if (!Object.hasOwn(text, "owner")) continue;
    const owner = owners.get(text.owner);
    const relation = relations.get(text.owner);
    if (relation) {
      if (text.semanticIds.some((reference) => !(relation.semanticIds ?? []).includes(reference)))
        fail("authored_text_owner_binding_invalid");
      continue;
    }
    if (
      owners.size !== nodes.length ||
      typeof text.owner !== "string" ||
      !/^[a-z][a-z0-9-]{0,79}$/u.test(text.owner) ||
      !owner ||
      owner.adornment ||
      !owner.semanticIds?.length
    )
      fail("authored_text_owner_invalid");
    const members = new Set(owner.semanticIds);
    for (const reference of text.semanticIds) {
      const [, kind] = authoredReference(
        reference,
        ["entity", "relation", "claim", "editorial"],
        "authored_text_owner_binding_invalid",
      );
      if (["entity", "relation"].includes(kind) && !members.has(reference))
        fail("authored_text_owner_binding_invalid");
    }
  }
}

/** Pure geometry reused by analytic and renderer-native checks. */
export function textOwnerInsets(text, owner) {
  return [
    text.x - owner.x,
    text.y - owner.y,
    owner.x + owner.width - text.x - text.width,
    owner.y + owner.height - text.y - text.height,
  ];
}

/** Exempt a containing fill, never a primitive boundary or an interior stroke. */
export function textOwnerPaintCollides(box, primitives, clearance, segmentHits, owner) {
  for (const [index, primitive] of primitives.entries()) {
    const stroke = primitive.stroke !== null;
    const fill = primitive.fill !== null && primitive.kind !== "line";
    if (!stroke && !fill) continue;
    const padding = clearance + (stroke ? primitive.strokeWidth / 2 : 0);
    const glyphs = {
      x: box.x - padding,
      y: box.y - padding,
      width: box.width + 2 * padding,
      height: box.height + 2 * padding,
    };
    if (fill) {
      const points =
        primitive.kind === "rect"
          ? [
              primitive.box,
              {
                x: primitive.box.x + primitive.box.width,
                y: primitive.box.y + primitive.box.height,
              },
            ]
          : primitive.kind === "circle"
            ? [
                {
                  x: primitive.center.x - primitive.radius,
                  y: primitive.center.y - primitive.radius,
                },
                {
                  x: primitive.center.x + primitive.radius,
                  y: primitive.center.y + primitive.radius,
                },
              ]
            : primitive.points;
      const left = Math.min(...points.map(({ x }) => x));
      const right = Math.max(...points.map(({ x }) => x));
      const top = Math.min(...points.map(({ y }) => y));
      const bottom = Math.max(...points.map(({ y }) => y));
      const containing =
        index === 0 &&
        left <= owner.x &&
        top <= owner.y &&
        right >= owner.x + owner.width &&
        bottom >= owner.y + owner.height;
      if (
        !containing &&
        left < glyphs.x + glyphs.width &&
        right > glyphs.x &&
        top < glyphs.y + glyphs.height &&
        bottom > glyphs.y
      )
        return true;
    }
    if (primitive.kind === "circle") {
      const { x, y } = primitive.center;
      const right = glyphs.x + glyphs.width;
      const bottom = glyphs.y + glyphs.height;
      const nearest = Math.hypot(
        Math.max(glyphs.x - x, 0, x - right),
        Math.max(glyphs.y - y, 0, y - bottom),
      );
      const farthest = Math.hypot(
        Math.max(Math.abs(glyphs.x - x), Math.abs(right - x)),
        Math.max(Math.abs(glyphs.y - y), Math.abs(bottom - y)),
      );
      if (nearest <= primitive.radius && farthest >= primitive.radius) return true;
      continue;
    }
    let points;
    if (primitive.kind === "rect") {
      const { x, y, width, height } = primitive.box;
      points = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
        { x, y },
      ];
    } else if (primitive.kind === "line") points = [primitive.start, primitive.end];
    else points = primitive.closed ? [...primitive.points, primitive.points[0]] : primitive.points;
    if (points.slice(1).some((point, index) => segmentHits(points[index], point, glyphs)))
      return true;
  }
  return false;
}
