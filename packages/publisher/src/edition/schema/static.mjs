import {
  closed,
  identifier,
  text,
  coordinate,
  canvasPoint,
  canvasBox,
  semanticIds,
} from "./fields.mjs";
import {
  primitiveNode,
  literalSegment,
  AUTHORED_ROUTES_SCHEMA,
  authoredText,
} from "./primitive.mjs";

const visualNode = closed(["namespace", "id", "x", "y", "width", "height"], {
  namespace: text,
  id: text,
  x: coordinate,
  y: coordinate,
  width: { type: "number", minimum: 96, maximum: 12000 },
  height: { type: "number", minimum: 64, maximum: 12000 },
});

const visualEndpoint = closed(["namespace", "id"], { namespace: text, id: text });

const visualRelation = closed(["namespace", "reference"], {
  namespace: text,
  reference: text,
});

const visualEdge = closed(["from", "to", "relations", "points"], {
  from: visualEndpoint,
  to: visualEndpoint,
  relations: { type: "array", minItems: 1, maxItems: 2048, items: visualRelation },
  points: {
    type: "array",
    minItems: 2,
    maxItems: 2048,
    items: { type: "array", minItems: 2, maxItems: 2, items: coordinate },
  },
});

const visualGroup = closed(["id", "x", "y", "width", "height"], {
  id: identifier,
  x: coordinate,
  y: coordinate,
  width: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
  height: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
});

const canvasScene = closed(
  [
    "schema",
    "title",
    "subtitle",
    "width",
    "height",
    "referenceWidth",
    "spine",
    "paint",
    "nodes",
    "texts",
    "edges",
    "decorations",
    "requiredSemanticIds",
  ],
  {
    schema: { const: "architecture.authored-static-scene/v1" },
    title: text,
    subtitle: text,
    description: text,
    width: { type: "number", minimum: 320, maximum: 12000 },
    height: { type: "number", minimum: 320, maximum: 12000 },
    referenceWidth: { type: "number", minimum: 320, maximum: 12000 },
    spine: { type: "array", maxItems: 512, uniqueItems: true, items: identifier },
    paint: {
      type: "object",
      required: ["paper"],
      minProperties: 1,
      maxProperties: 32,
      patternProperties: {
        "^[a-z][a-z0-9-]{0,79}$": { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
      },
      additionalProperties: false,
    },
    nodes: {
      type: "array",
      maxItems: 512,
      items: {
        oneOf: [
          closed(
            [
              "id",
              "kind",
              "tone",
              "center",
              "radius",
              "box",
              "paintBox",
              "strokeWidth",
              "semanticIds",
            ],
            {
              id: identifier,
              kind: text,
              tone: identifier,
              center: canvasPoint,
              radius: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
              box: canvasBox,
              paintBox: canvasBox,
              strokeWidth: { type: "number", minimum: 0, maximum: 100 },
              semanticIds: { ...semanticIds, minItems: 1 },
            },
          ),
          closed(["id", "box", "semanticIds", "primitives"], {
            ...primitiveNode,
            box: canvasBox,
          }),
        ],
      },
    },
    texts: {
      type: "array",
      maxItems: 4096,
      items: authoredText,
    },
    edges: {
      type: "array",
      maxItems: 8192,
      items: {
        oneOf: [
          closed(
            [
              "id",
              "kind",
              "source",
              "target",
              "points",
              "strokeWidth",
              "arrow",
              "arrowGeometry",
              "semanticIds",
              "strokeTone",
            ],
            {
              id: identifier,
              kind: text,
              source: identifier,
              target: identifier,
              points: { type: "array", minItems: 2, maxItems: 2048, items: canvasPoint },
              strokeWidth: { type: "number", minimum: 0, maximum: 100 },
              arrow: { type: "boolean" },
              arrowGeometry: closed(["length", "halfWidth", "strokeWidth"], {
                length: { type: "number", minimum: 0, maximum: 100 },
                halfWidth: { type: "number", minimum: 0, maximum: 100 },
                strokeWidth: { type: "number", minimum: 0, maximum: 100 },
              }),
              semanticIds,
              strokeTone: identifier,
            },
          ),
          literalSegment("source", "target"),
        ],
      },
    },
    routes: AUTHORED_ROUTES_SCHEMA,
    decorations: {
      type: "array",
      maxItems: 4096,
      items: closed(["id", "role", "tone", "points", "strokeWidth"], {
        id: identifier,
        role: text,
        tone: identifier,
        points: { type: "array", minItems: 2, maxItems: 2048, items: canvasPoint },
        strokeWidth: { type: "number", minimum: 0, maximum: 100 },
      }),
    },
    requiredSemanticIds: {
      type: "array",
      minItems: 1,
      maxItems: 8192,
      uniqueItems: true,
      items: text,
    },
  },
);

export const staticGeometryRefinement = closed(["view", "nodes", "edges", "groups"], {
  view: identifier,
  nodes: { type: "array", maxItems: 4096, items: visualNode },
  edges: { type: "array", maxItems: 8192, items: visualEdge },
  groups: { type: "array", maxItems: 256, items: visualGroup },
});

export const staticCanvasRefinement = closed(["kind", "scene"], {
  kind: { const: "authored-canvas" },
  font: identifier,
  scene: canvasScene,
});
