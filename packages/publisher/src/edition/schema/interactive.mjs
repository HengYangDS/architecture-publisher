import { deepFreeze } from "../../semantics/document.mjs";
import {
  closed,
  identifier,
  text,
  prose,
  coordinate,
  canvasPoint,
  semanticIds,
} from "./fields.mjs";
import {
  primitiveNode,
  literalSegment,
  AUTHORED_ROUTES_SCHEMA,
  authoredText,
} from "./primitive.mjs";

const interactiveSize = closed(["width", "height"], {
  width: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
  height: { type: "number", exclusiveMinimum: 0, maximum: 12000 },
});

const interactiveNode = {
  oneOf: [
    closed(["id", "label", "visualRole", "position", "size"], {
      id: identifier,
      label: text,
      visualRole: text,
      position: canvasPoint,
      size: interactiveSize,
      detail: text,
      note: text,
      figureKind: text,
      semanticIds: { ...semanticIds, minItems: 1 },
    }),
    closed(["id", "position", "size", "semanticIds", "primitives"], {
      ...primitiveNode,
      position: canvasPoint,
      size: interactiveSize,
    }),
  ],
};

const interactiveGroup = closed(["id", "label", "nodeIds", "padding"], {
  id: identifier,
  label: text,
  nodeIds: { type: "array", minItems: 1, maxItems: 512, uniqueItems: true, items: identifier },
  padding: { type: "number", minimum: 0, maximum: 12000 },
});

const interactiveLabelPlacement = closed([], {
  at: { type: "array", minItems: 2, maxItems: 2, items: coordinate },
  dx: coordinate,
  dy: coordinate,
  segment: { type: "integer", minimum: 0, maximum: 2048 },
});

const interactiveEdge = {
  oneOf: [
    closed(["id", "from", "to", "label", "visualRole", "fromSide", "toSide", "route"], {
      id: identifier,
      from: identifier,
      to: identifier,
      label: { anyOf: [{ const: "" }, text] },
      visualRole: text,
      fromSide: { enum: ["top", "right", "bottom", "left"] },
      toSide: { enum: ["top", "right", "bottom", "left"] },
      route: { enum: ["auto", "straight", "orthogonal-h", "orthogonal-v"] },
      labelPlacement: interactiveLabelPlacement,
      semanticIds: { ...semanticIds, minItems: 1 },
      waypoints: { type: "array", minItems: 1, maxItems: 2048, items: canvasPoint },
    }),
    literalSegment("from", "to"),
  ],
};

const interactiveArchitectureScene = closed(
  ["schema", "id", "title", "subtitle", "viewport", "nodes", "groups", "edges"],
  {
    schema: { const: "architecture.interactive-scene/v1" },
    id: identifier,
    title: text,
    subtitle: text,
    viewport: interactiveSize,
    typography: closed(["minimumTextPx"], {
      minimumTextPx: { type: "number", minimum: 6, maximum: 32 },
    }),
    nodes: { type: "array", maxItems: 512, items: interactiveNode },
    groups: { type: "array", maxItems: 256, items: interactiveGroup },
    edges: { type: "array", maxItems: 2048, items: interactiveEdge },
    routes: AUTHORED_ROUTES_SCHEMA,
    texts: { type: "array", maxItems: 4096, items: authoredText },
    notes: {
      type: "array",
      maxItems: 256,
      items: closed(["id", "title", "items"], {
        id: identifier,
        title: text,
        items: {
          type: "array",
          minItems: 1,
          maxItems: 256,
          items: closed(["id", "text", "semanticIds"], {
            id: identifier,
            text: prose,
            semanticIds,
          }),
        },
      }),
    },
    requiredSemanticIds: { ...semanticIds, minItems: 1, maxItems: 8192 },
  },
);

const withoutGeometry = (schema, names) => {
  if (schema.oneOf) return { oneOf: schema.oneOf.map((item) => withoutGeometry(item, names)) };
  return closed(
    schema.required.filter((name) => !names.includes(name)),
    Object.fromEntries(Object.entries(schema.properties).filter(([name]) => !names.includes(name))),
  );
};

const automaticArchitectureScene = withoutGeometry(interactiveArchitectureScene, ["viewport"]);

automaticArchitectureScene.properties.nodes = {
  ...interactiveArchitectureScene.properties.nodes,
  items: withoutGeometry(interactiveNode, ["position", "size", "paintBox"]),
};

automaticArchitectureScene.properties.groups = {
  ...interactiveArchitectureScene.properties.groups,
  items: withoutGeometry(interactiveGroup, ["padding"]),
};

automaticArchitectureScene.properties.edges = {
  ...interactiveArchitectureScene.properties.edges,
  items: withoutGeometry(interactiveEdge, [
    "fromSide",
    "toSide",
    "route",
    "waypoints",
    "labelPlacement",
    "points",
    "arrowGeometry",
  ]),
};

automaticArchitectureScene.properties.texts = {
  ...interactiveArchitectureScene.properties.texts,
  items: withoutGeometry(
    { ...authoredText, properties: { ...authoredText.properties, text: prose } },
    ["x", "baseline", "box", "fontSize"],
  ),
};

export const INTERACTIVE_ARCHITECTURE_INPUT_SCHEMA = deepFreeze({
  oneOf: [interactiveArchitectureScene, automaticArchitectureScene],
});

export const interactiveArchitectureRefinement = closed(["kind", "pages"], {
  kind: { const: "authored-architecture" },
  font: identifier,
  pages: {
    type: "array",
    minItems: 1,
    maxItems: 64,
    items: closed(["id", "label", "purpose", "scene"], {
      id: identifier,
      label: text,
      purpose: { enum: ["overview", "mechanism"] },
      scene: INTERACTIVE_ARCHITECTURE_INPUT_SCHEMA,
    }),
  },
});
