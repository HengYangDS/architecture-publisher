import { fail, hasExactFields as exact } from "../protocol/values.mjs";
import { primitiveValid } from "../edition/generated/validators.mjs";
import { expandBox } from "./geometry.mjs";

const invalid = () => fail("authored_primitive_invalid");
const coordinate = (value) => Number.isFinite(value) && Math.abs(value) <= 12000;
const point = (value) => exact(value, ["x", "y"]) && coordinate(value.x) && coordinate(value.y);
const box = (value) =>
  exact(value, ["x", "y", "width", "height"]) &&
  point({ x: value.x, y: value.y }) &&
  [value.width, value.height].every((n) => Number.isFinite(n) && n > 0 && n <= 12000);

function bounds(points) {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function nonzeroFill(points) {
  // A nonzero algebraic contour area proves some nonzero winding region.
  // Reject uncertainty within a conservative bound for both products and accumulation.
  let area = 0;
  let magnitude = 0;
  for (const [index, p] of points.entries()) {
    const next = points[(index + 1) % points.length];
    const forward = p.x * next.y;
    const backward = p.y * next.x;
    area += forward - backward;
    magnitude += Math.abs(forward) + Math.abs(backward);
  }
  const errorBound = Number.EPSILON * (4 * points.length + 2) * magnitude;
  return Math.abs(area) > errorBound;
}

/** Refuse objectively background-only source marks; perceptual contrast remains qualification. */
export function assertPrimitiveContrast(nodes, tone, background) {
  for (const node of nodes) {
    if (!node.primitives || node.adornment) continue;
    const last = node.primitives.at(-1);
    // SVG paints fill, then stroke, in authored primitive order. A final
    // background operation cannot certify an earlier possibly covered witness.
    if (tone(last.stroke ?? last.fill) === background) fail("authored_primitive_background_only");
  }
}

/** Resolve finite node-local painting once; the returned envelope is conservative ink geometry. */
export function resolvePrimitivePaint(node, origin) {
  if (
    !point(origin) ||
    !Array.isArray(node.primitives) ||
    !node.primitives.length ||
    node.primitives.length > 32
  )
    invalid();
  const translate = ({ x, y }) => {
    const resolved = { x: x + origin.x, y: y + origin.y };
    if (!point(resolved)) invalid();
    return resolved;
  };
  const envelopes = [];
  const primitives = node.primitives.map((primitive) => {
    if (
      !primitiveValid(primitive) ||
      (primitive.stroke === null && primitive.strokeWidth !== 0) ||
      (primitive.stroke !== null && primitive.strokeWidth <= 0) ||
      (primitive.fill === null && primitive.stroke === null)
    )
      invalid();
    let resolved;
    let extent;
    if (primitive.kind === "circle") {
      const center = translate(primitive.center);
      resolved = { ...primitive, center };
      extent = {
        x: center.x - primitive.radius,
        y: center.y - primitive.radius,
        width: primitive.radius * 2,
        height: primitive.radius * 2,
      };
    } else if (primitive.kind === "rect") {
      const rectangle = { ...primitive.box, ...translate(primitive.box) };
      resolved = { ...primitive, box: rectangle };
      extent = rectangle;
    } else {
      const local = primitive.kind === "line" ? [primitive.start, primitive.end] : primitive.points;
      if (
        local.every((p) => p.x === local[0].x && p.y === local[0].y) ||
        (primitive.kind === "polyline" &&
          ((!primitive.closed && primitive.fill !== null) ||
            (primitive.closed && primitive.fill !== null && !nonzeroFill(local))))
      )
        invalid();
      const points = local.map(translate);
      resolved =
        primitive.kind === "line"
          ? { ...primitive, start: points[0], end: points[1] }
          : { ...primitive, points };
      extent = bounds(points);
    }
    const envelope = expandBox(extent, primitive.strokeWidth / 2);
    if (
      ![envelope.x, envelope.y, envelope.x + envelope.width, envelope.y + envelope.height].every(
        coordinate,
      )
    )
      invalid();
    envelopes.push(envelope);
    return resolved;
  });
  const paintBox = bounds(
    envelopes.flatMap((extent) => [
      { x: extent.x, y: extent.y },
      { x: extent.x + extent.width, y: extent.y + extent.height },
    ]),
  );
  if (
    Object.hasOwn(node, "paintBox") &&
    (!box(node.paintBox) ||
      Object.keys(paintBox).some((key) => node.paintBox[key] !== paintBox[key]))
  )
    invalid();
  return { primitives, paintBox };
}

/** Add checked ink envelopes without changing semantic port bounds or source membership. */
export function resolvePrimitiveNodes(nodes, medium) {
  let primitiveCount = 0;
  let pointCount = 0;
  return nodes.map((node) => {
    if (!Object.hasOwn(node, "primitives")) {
      if (Object.hasOwn(node, "adornment")) invalid();
      return node;
    }
    const staticNode = medium === "static";
    if (
      !exact(
        node,
        ["id", "semanticIds", "primitives", ...(staticNode ? ["box"] : ["position", "size"])],
        ["paintBox", "adornment"],
      ) ||
      typeof node.id !== "string" ||
      !/^[a-z][a-z0-9-]{0,79}$/u.test(node.id) ||
      !Array.isArray(node.semanticIds) ||
      node.semanticIds.length > 4096 ||
      new Set(node.semanticIds).size !== node.semanticIds.length ||
      node.semanticIds.some((id) => typeof id !== "string" || !id.trim()) ||
      (Object.hasOwn(node, "adornment") && node.adornment !== true) ||
      (node.adornment ? node.semanticIds.length !== 0 : node.semanticIds.length === 0) ||
      !(staticNode
        ? box(node.box)
        : point(node.position) && box({ ...node.position, ...node.size }))
    )
      invalid();
    const resolved = resolvePrimitivePaint(
      node,
      staticNode ? { x: node.box.x, y: node.box.y } : node.position,
    );
    primitiveCount += node.primitives.length;
    pointCount += node.primitives.reduce(
      (count, primitive) =>
        count +
        (primitive.kind === "polyline"
          ? primitive.points.length + (primitive.closed ? 1 : 0)
          : primitive.kind === "line"
            ? 2
            : 0),
      0,
    );
    if (primitiveCount > 4096 || pointCount > 32768) fail("authored_primitive_budget_exceeded");
    return { ...node, primitives: structuredClone(node.primitives), paintBox: resolved.paintBox };
  });
}
