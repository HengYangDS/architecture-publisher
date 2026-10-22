import { deepFreeze } from "../../semantics/document.mjs";
import {
  closed,
  identifier,
  text,
  digest,
  coordinate,
  canvasPoint,
  canvasBox,
  semanticIds,
} from "./fields.mjs";

export const AUTHORED_ROUTE_LIMITS = deepFreeze({
  routes: 2048,
  traversals: 2048,
  references: 8192,
  pairs: 8192,
  points: 32768,
});

const primitivePaint = {
  fill: { anyOf: [identifier, { type: "null" }] },
  stroke: { anyOf: [identifier, { type: "null" }] },
  strokeWidth: { type: "number", minimum: 0, maximum: 100 },
};

export const PRIMITIVE_SCHEMA = deepFreeze({
  $id: "architecture.paint-primitive/v1",
  oneOf: [
    closed(["kind", "center", "radius", "fill", "stroke", "strokeWidth"], {
      kind: { const: "circle" },
      center: canvasPoint,
      radius: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
      ...primitivePaint,
    }),
    closed(["kind", "box", "fill", "stroke", "strokeWidth"], {
      kind: { const: "rect" },
      box: canvasBox,
      ...primitivePaint,
    }),
    closed(["kind", "start", "end", "fill", "stroke", "strokeWidth"], {
      kind: { const: "line" },
      start: canvasPoint,
      end: canvasPoint,
      ...primitivePaint,
      fill: { type: "null" },
    }),
    closed(["kind", "points", "closed", "fill", "stroke", "strokeWidth"], {
      kind: { const: "polyline" },
      points: { type: "array", minItems: 2, maxItems: 64, items: canvasPoint },
      closed: { type: "boolean" },
      ...primitivePaint,
    }),
  ],
});

export const primitiveNode = {
  id: identifier,
  semanticIds,
  primitives: { type: "array", minItems: 1, maxItems: 32, items: PRIMITIVE_SCHEMA },
  paintBox: canvasBox,
  adornment: { const: true },
};

export const literalSegment = (source, target) =>
  closed(
    [
      "id",
      source,
      target,
      "points",
      "strokeWidth",
      "strokeTone",
      "arrow",
      "arrowGeometry",
      "semanticIds",
      "adornment",
    ],
    {
      id: identifier,
      [source]: identifier,
      [target]: identifier,
      adornment: { const: true },
      semanticIds: { type: "array", maxItems: 0, items: text },
      points: { type: "array", minItems: 2, maxItems: 2048, items: canvasPoint },
      strokeWidth: { type: "number", exclusiveMinimum: 0, maximum: 100 },
      strokeTone: identifier,
      arrow: { type: "boolean" },
      arrowGeometry: closed(["length", "halfWidth", "strokeWidth"], {
        length: { type: "number", minimum: 0, maximum: 100 },
        halfWidth: { type: "number", minimum: 0, maximum: 100 },
        strokeWidth: { type: "number", minimum: 0, maximum: 100 },
      }),
    },
  );

export const LITERAL_SEGMENT_SCHEMA = deepFreeze({
  oneOf: [literalSegment("source", "target"), literalSegment("from", "to")],
});

export const AUTHORED_ROUTES_SCHEMA = deepFreeze({
  type: "array",
  maxItems: AUTHORED_ROUTE_LIMITS.routes,
  items: closed(["id", "reference", "source", "target", "traversals"], {
    id: identifier,
    reference: text,
    source: identifier,
    target: identifier,
    editionSha256: digest,
    traversals: {
      type: "array",
      minItems: 1,
      maxItems: AUTHORED_ROUTE_LIMITS.traversals,
      items: closed(["edge", "direction"], {
        edge: identifier,
        direction: { enum: ["forward", "reverse"] },
      }),
    },
  }),
});

export const authoredText = closed(
  [
    "id",
    "text",
    "fontSize",
    "weight",
    "anchor",
    "tone",
    "x",
    "baseline",
    "visible",
    "semanticIds",
    "box",
  ],
  {
    id: identifier,
    text,
    fontSize: { type: "number", exclusiveMinimum: 0, maximum: 300 },
    weight: { enum: ["400", "500", "600", "700"] },
    font: identifier,
    owner: identifier,
    anchor: { enum: ["start", "middle", "end"] },
    tone: identifier,
    x: coordinate,
    baseline: coordinate,
    visible: { type: "boolean" },
    semanticIds,
    box: canvasBox,
  },
);
