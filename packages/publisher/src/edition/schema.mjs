import { deepFreeze } from '../semantics/document.mjs';

const closed = (required, properties) => ({
  type: 'object',
  required,
  properties,
  additionalProperties: false,
});
const identifier = { type: 'string', pattern: '^[a-z][a-z0-9-]{0,79}$' };
const text = {
  type: 'string',
  minLength: 1,
  maxLength: 2048,
  pattern: '^(?!\\s)(?!.*\\s$)[^\\u0000-\\u001f\\u007f]+$',
};
const digest = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const portable = {
  type: 'string',
  minLength: 1,
  maxLength: 2048,
  pattern: '^[^\\\\\\u0000-\\u001f\\u007f]+$',
};
const questionIds = {
  type: 'array',
  minItems: 1,
  uniqueItems: true,
  items: identifier,
};

const sourceSelector = closed(['id', 'namespace', 'format', 'claimant', 'revision', 'input'], {
  id: identifier,
  namespace: text,
  format: closed(['id', 'version'], { id: text, version: text }),
  claimant: text,
  revision: {
    oneOf: [
      closed(['kind', 'algorithm'], {
        kind: { const: 'content' },
        algorithm: { const: 'sha256' },
        canonicalization: { enum: ['raw-bytes/v1', 'publisher-json/v1'] },
      }),
      closed(['kind', 'repository', 'ref'], {
        kind: { const: 'vcs' },
        repository: { anyOf: [{ const: '.' }, portable] },
        ref: text,
      }),
      closed(['kind', 'value'], { kind: { const: 'opaque' }, value: text }),
    ],
  },
  input: {
    oneOf: [
      closed(['kind', 'path'], { kind: { const: 'locator' }, path: portable }),
      closed(['kind', 'path', 'sha256'], {
        kind: { const: 'pin' },
        path: portable,
        sha256: digest,
      }),
    ],
  },
});

export const BUILD_REQUEST_SCHEMA = deepFreeze({
  $id: 'architecture.build-request/v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...closed(['schema', 'edition', 'sources', 'providers', 'media', 'toolchain'], {
    schema: { const: 'architecture.build-request/v1' },
    edition: {
      oneOf: [
        closed(['kind', 'root', 'manifest'], {
          kind: { const: 'direct' },
          root: portable,
          manifest: portable,
        }),
        closed(['kind', 'provider'], {
          kind: { const: 'provider' },
          provider: identifier,
        }),
      ],
    },
    sources: { type: 'array', maxItems: 256, items: sourceSelector },
    providers: {
      type: 'array',
      maxItems: 256,
      items: closed(['id', 'manifest', 'sha256'], {
        id: identifier,
        manifest: portable,
        sha256: digest,
        packageRoot: portable,
      }),
    },
    media: {
      type: 'array',
      minItems: 1,
      maxItems: 2,
      uniqueItems: true,
      items: { enum: ['static', 'interactive'] },
    },
    toolchain: closed(['profile'], { profile: identifier }),
  }),
});

const selection = closed(['id', 'namespace', 'kind', 'reference'], {
  id: identifier,
  namespace: text,
  kind: { const: 'reference' },
  reference: text,
  questions: questionIds,
});
const editorialAssertion = closed(['id', 'statement', 'proponent', 'basis', 'questions'], {
  id: identifier,
  statement: text,
  proponent: text,
  basis: { type: 'array', minItems: 1, uniqueItems: true, items: identifier },
  questions: questionIds,
});
const entityAddress = closed(['namespace', 'id'], { namespace: text, id: text });
const responsibilityForm = closed(['schema', 'kind', 'roles', 'handoffs'], {
  schema: { const: 'architecture.visual-form/v1' },
  kind: { const: 'responsibility' },
  roles: {
    type: 'array',
    minItems: 1,
    maxItems: 256,
    items: closed(['group', 'basis'], { group: identifier, basis: identifier }),
  },
  handoffs: {
    type: 'array',
    maxItems: 4096,
    items: closed(['from', 'to', 'basis'], {
      from: identifier,
      to: identifier,
      basis: identifier,
    }),
  },
});
const view = closed(['id', 'questions'], {
  id: identifier,
  questions: questionIds,
  form: responsibilityForm,
  groups: {
    type: 'array',
    minItems: 1,
    maxItems: 256,
    items: closed(['id', 'label', 'elements'], {
      id: identifier,
      label: text,
      elements: {
        type: 'array',
        minItems: 1,
        maxItems: 4096,
        items: entityAddress,
      },
    }),
  },
  forbiddenGroupPairs: {
    type: 'array',
    maxItems: 4096,
    items: closed(['members', 'reason'], {
      members: { type: 'array', minItems: 2, maxItems: 2, items: entityAddress },
      reason: text,
    }),
  },
});

export const EDITION_PROJECT_SCHEMA = deepFreeze({
  $id: 'architecture.edition-project/v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...closed(
    [
      'schema',
      'id',
      'editor',
      'title',
      'audiences',
      'questions',
      'scope',
      'omissions',
      'narrative',
      'presentation',
      'visualPolicy',
    ],
    {
      schema: { const: 'architecture.edition-project/v1' },
      id: identifier,
      editor: text,
      title: text,
      audiences: {
        type: 'array',
        minItems: 1,
        maxItems: 64,
        items: closed(['id', 'label'], { id: identifier, label: text }),
      },
      questions: {
        type: 'array',
        minItems: 1,
        maxItems: 256,
        items: closed(['id', 'audience', 'text'], {
          id: identifier,
          audience: identifier,
          text,
        }),
      },
      scope: closed(['sourceNamespaces', 'selections', 'limits'], {
        sourceNamespaces: {
          type: 'array',
          minItems: 1,
          uniqueItems: true,
          items: text,
        },
        projectionNamespaces: {
          type: 'array',
          maxItems: 256,
          uniqueItems: true,
          items: text,
        },
        selections: { type: 'array', minItems: 1, maxItems: 4096, items: selection },
        limits: {
          type: 'array',
          maxItems: 4096,
          items: closed(['question', 'reason'], { question: identifier, reason: text }),
        },
      }),
      editorialAssertions: { type: 'array', maxItems: 4096, items: editorialAssertion },
      omissions: {
        type: 'array',
        maxItems: 8192,
        items: {
          oneOf: [
            closed(['selection', 'question', 'medium', 'disposition', 'view', 'reason'], {
              selection: identifier,
              question: identifier,
              medium: { enum: ['static', 'interactive'] },
              disposition: { enum: ['outside-question', 'explicit-limit'] },
              view: identifier,
              reason: text,
            }),
            closed(
              ['selection', 'question', 'medium', 'disposition', 'view', 'coveredIn', 'reason'],
              {
                selection: identifier,
                question: identifier,
                medium: { enum: ['static', 'interactive'] },
                disposition: { const: 'covered-elsewhere' },
                view: identifier,
                coveredIn: identifier,
                reason: text,
              },
            ),
          ],
        },
      },
      narrative: closed(['summary'], {
        summary: text,
      }),
      presentation: closed(['static', 'interactive'], {
        static: closed(['views'], {
          views: { type: 'array', minItems: 1, maxItems: 256, items: view },
          intent: text,
          width: { type: 'integer', minimum: 320, maximum: 12000 },
        }),
        interactive: closed(['views'], {
          views: { type: 'array', minItems: 1, maxItems: 256, items: view },
          intent: text,
        }),
      }),
      visualPolicy: closed(['profile'], {
        profile: identifier,
        override: { anyOf: [portable, { type: 'null' }] },
        fonts: {
          type: 'array',
          minItems: 1,
          maxItems: 16,
          items: closed(['id', 'family', 'faces', 'distribution'], {
            id: identifier,
            family: { ...text, maxLength: 128 },
            faces: {
              type: 'array',
              minItems: 1,
              maxItems: 4,
              items: closed(['weight', 'ref', 'sha256'], {
                weight: { enum: ['400', '500', '600', '700'] },
                ref: portable,
                sha256: digest,
              }),
            },
            distribution: {
              type: 'array',
              minItems: 1,
              maxItems: 16,
              items: closed(['ref', 'sha256'], { ref: portable, sha256: digest }),
            },
          }),
        },
      }),
    },
  ),
});

const coordinate = { type: 'number', minimum: -12000, maximum: 12000 };
export const AUTHORED_ROUTE_LIMITS = deepFreeze({
  routes: 2048,
  traversals: 2048,
  references: 8192,
  pairs: 8192,
  points: 32768,
});
const visualNode = closed(['namespace', 'id', 'x', 'y', 'width', 'height'], {
  namespace: text,
  id: text,
  x: coordinate,
  y: coordinate,
  width: { type: 'number', minimum: 96, maximum: 12000 },
  height: { type: 'number', minimum: 64, maximum: 12000 },
});
const visualEndpoint = closed(['namespace', 'id'], { namespace: text, id: text });
const visualRelation = closed(['namespace', 'reference'], {
  namespace: text,
  reference: text,
});
const visualEdge = closed(['from', 'to', 'relations', 'points'], {
  from: visualEndpoint,
  to: visualEndpoint,
  relations: { type: 'array', minItems: 1, maxItems: 2048, items: visualRelation },
  points: {
    type: 'array',
    minItems: 2,
    maxItems: 2048,
    items: { type: 'array', minItems: 2, maxItems: 2, items: coordinate },
  },
});
const visualGroup = closed(['id', 'x', 'y', 'width', 'height'], {
  id: identifier,
  x: coordinate,
  y: coordinate,
  width: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
  height: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
});
const canvasPoint = closed(['x', 'y'], { x: coordinate, y: coordinate });
const canvasBox = closed(['x', 'y', 'width', 'height'], {
  x: coordinate,
  y: coordinate,
  width: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
  height: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
});
const semanticIds = {
  type: 'array',
  maxItems: 4096,
  uniqueItems: true,
  items: text,
};
const primitivePaint = {
  fill: { anyOf: [identifier, { type: 'null' }] },
  stroke: { anyOf: [identifier, { type: 'null' }] },
  strokeWidth: { type: 'number', minimum: 0, maximum: 100 },
};
export const PRIMITIVE_SCHEMA = deepFreeze({
  $id: 'architecture.paint-primitive/v1',
  oneOf: [
    closed(['kind', 'center', 'radius', 'fill', 'stroke', 'strokeWidth'], {
      kind: { const: 'circle' },
      center: canvasPoint,
      radius: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
      ...primitivePaint,
    }),
    closed(['kind', 'box', 'fill', 'stroke', 'strokeWidth'], {
      kind: { const: 'rect' },
      box: canvasBox,
      ...primitivePaint,
    }),
    closed(['kind', 'start', 'end', 'fill', 'stroke', 'strokeWidth'], {
      kind: { const: 'line' },
      start: canvasPoint,
      end: canvasPoint,
      ...primitivePaint,
      fill: { type: 'null' },
    }),
    closed(['kind', 'points', 'closed', 'fill', 'stroke', 'strokeWidth'], {
      kind: { const: 'polyline' },
      points: { type: 'array', minItems: 2, maxItems: 64, items: canvasPoint },
      closed: { type: 'boolean' },
      ...primitivePaint,
    }),
  ],
});
const primitiveNode = {
  id: identifier,
  semanticIds,
  primitives: { type: 'array', minItems: 1, maxItems: 32, items: PRIMITIVE_SCHEMA },
  paintBox: canvasBox,
  adornment: { const: true },
};
const literalSegment = (source, target) =>
  closed(
    [
      'id',
      source,
      target,
      'points',
      'strokeWidth',
      'strokeTone',
      'arrow',
      'arrowGeometry',
      'semanticIds',
      'adornment',
    ],
    {
      id: identifier,
      [source]: identifier,
      [target]: identifier,
      adornment: { const: true },
      semanticIds: { type: 'array', maxItems: 0, items: text },
      points: { type: 'array', minItems: 2, maxItems: 2048, items: canvasPoint },
      strokeWidth: { type: 'number', exclusiveMinimum: 0, maximum: 100 },
      strokeTone: identifier,
      arrow: { type: 'boolean' },
      arrowGeometry: closed(['length', 'halfWidth', 'strokeWidth'], {
        length: { type: 'number', minimum: 0, maximum: 100 },
        halfWidth: { type: 'number', minimum: 0, maximum: 100 },
        strokeWidth: { type: 'number', minimum: 0, maximum: 100 },
      }),
    },
  );
export const LITERAL_SEGMENT_SCHEMA = deepFreeze({
  oneOf: [literalSegment('source', 'target'), literalSegment('from', 'to')],
});
export const AUTHORED_ROUTES_SCHEMA = deepFreeze({
  type: 'array',
  maxItems: AUTHORED_ROUTE_LIMITS.routes,
  items: closed(['id', 'reference', 'source', 'target', 'traversals'], {
    id: identifier,
    reference: text,
    source: identifier,
    target: identifier,
    editionSha256: digest,
    traversals: {
      type: 'array',
      minItems: 1,
      maxItems: AUTHORED_ROUTE_LIMITS.traversals,
      items: closed(['edge', 'direction'], {
        edge: identifier,
        direction: { enum: ['forward', 'reverse'] },
      }),
    },
  }),
});
const authoredText = closed(
  [
    'id',
    'text',
    'fontSize',
    'weight',
    'anchor',
    'tone',
    'x',
    'baseline',
    'visible',
    'semanticIds',
    'box',
  ],
  {
    id: identifier,
    text,
    fontSize: { type: 'number', exclusiveMinimum: 0, maximum: 300 },
    weight: { enum: ['400', '500', '600', '700'] },
    font: identifier,
    owner: identifier,
    anchor: { enum: ['start', 'middle', 'end'] },
    tone: identifier,
    x: coordinate,
    baseline: coordinate,
    visible: { type: 'boolean' },
    semanticIds,
    box: canvasBox,
  },
);
const canvasScene = closed(
  [
    'schema',
    'title',
    'subtitle',
    'width',
    'height',
    'referenceWidth',
    'spine',
    'paint',
    'nodes',
    'texts',
    'edges',
    'decorations',
    'requiredSemanticIds',
  ],
  {
    schema: { const: 'architecture.authored-static-scene/v1' },
    title: text,
    subtitle: text,
    description: text,
    width: { type: 'number', minimum: 320, maximum: 12000 },
    height: { type: 'number', minimum: 320, maximum: 12000 },
    referenceWidth: { type: 'number', minimum: 320, maximum: 12000 },
    spine: { type: 'array', maxItems: 512, uniqueItems: true, items: identifier },
    paint: {
      type: 'object',
      required: ['paper'],
      minProperties: 1,
      maxProperties: 32,
      patternProperties: {
        '^[a-z][a-z0-9-]{0,79}$': { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
      },
      additionalProperties: false,
    },
    nodes: {
      type: 'array',
      maxItems: 512,
      items: {
        oneOf: [
          closed(
            [
              'id',
              'kind',
              'tone',
              'center',
              'radius',
              'box',
              'paintBox',
              'strokeWidth',
              'semanticIds',
            ],
            {
              id: identifier,
              kind: text,
              tone: identifier,
              center: canvasPoint,
              radius: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
              box: canvasBox,
              paintBox: canvasBox,
              strokeWidth: { type: 'number', minimum: 0, maximum: 100 },
              semanticIds: { ...semanticIds, minItems: 1 },
            },
          ),
          closed(['id', 'box', 'semanticIds', 'primitives'], {
            ...primitiveNode,
            box: canvasBox,
          }),
        ],
      },
    },
    texts: {
      type: 'array',
      maxItems: 4096,
      items: authoredText,
    },
    edges: {
      type: 'array',
      maxItems: 8192,
      items: {
        oneOf: [
          closed(
            [
              'id',
              'kind',
              'source',
              'target',
              'points',
              'strokeWidth',
              'arrow',
              'arrowGeometry',
              'semanticIds',
              'strokeTone',
            ],
            {
              id: identifier,
              kind: text,
              source: identifier,
              target: identifier,
              points: { type: 'array', minItems: 2, maxItems: 2048, items: canvasPoint },
              strokeWidth: { type: 'number', minimum: 0, maximum: 100 },
              arrow: { type: 'boolean' },
              arrowGeometry: closed(['length', 'halfWidth', 'strokeWidth'], {
                length: { type: 'number', minimum: 0, maximum: 100 },
                halfWidth: { type: 'number', minimum: 0, maximum: 100 },
                strokeWidth: { type: 'number', minimum: 0, maximum: 100 },
              }),
              semanticIds,
              strokeTone: identifier,
            },
          ),
          literalSegment('source', 'target'),
        ],
      },
    },
    routes: AUTHORED_ROUTES_SCHEMA,
    decorations: {
      type: 'array',
      maxItems: 4096,
      items: closed(['id', 'role', 'tone', 'points', 'strokeWidth'], {
        id: identifier,
        role: text,
        tone: identifier,
        points: { type: 'array', minItems: 2, maxItems: 2048, items: canvasPoint },
        strokeWidth: { type: 'number', minimum: 0, maximum: 100 },
      }),
    },
    requiredSemanticIds: {
      type: 'array',
      minItems: 1,
      maxItems: 8192,
      uniqueItems: true,
      items: text,
    },
  },
);
const staticGeometryRefinement = closed(['view', 'nodes', 'edges', 'groups'], {
  view: identifier,
  nodes: { type: 'array', maxItems: 4096, items: visualNode },
  edges: { type: 'array', maxItems: 8192, items: visualEdge },
  groups: { type: 'array', maxItems: 256, items: visualGroup },
});
const staticCanvasRefinement = closed(['kind', 'scene'], {
  kind: { const: 'authored-canvas' },
  font: identifier,
  scene: canvasScene,
});
const neutralRefinement = closed(['kind'], { kind: { const: 'neutral' } });
const interactiveSize = closed(['width', 'height'], {
  width: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
  height: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
});
const interactiveNode = {
  oneOf: [
    closed(['id', 'label', 'visualRole', 'position', 'size'], {
      id: identifier,
      label: text,
      visualRole: text,
      position: canvasPoint,
      size: interactiveSize,
      detail: text,
      semanticIds: { ...semanticIds, minItems: 1 },
    }),
    closed(['id', 'position', 'size', 'semanticIds', 'primitives'], {
      ...primitiveNode,
      position: canvasPoint,
      size: interactiveSize,
    }),
  ],
};
const interactiveGroup = closed(['id', 'label', 'nodeIds', 'padding'], {
  id: identifier,
  label: text,
  nodeIds: { type: 'array', minItems: 1, maxItems: 512, uniqueItems: true, items: identifier },
  padding: { type: 'number', minimum: 0, maximum: 12000 },
});
const interactiveLabelPlacement = closed([], {
  at: { type: 'array', minItems: 2, maxItems: 2, items: coordinate },
  dx: coordinate,
  dy: coordinate,
  segment: { type: 'integer', minimum: 0, maximum: 2048 },
});
const interactiveEdge = {
  oneOf: [
    closed(['id', 'from', 'to', 'label', 'visualRole', 'fromSide', 'toSide', 'route'], {
      id: identifier,
      from: identifier,
      to: identifier,
      label: text,
      visualRole: text,
      fromSide: { enum: ['top', 'right', 'bottom', 'left'] },
      toSide: { enum: ['top', 'right', 'bottom', 'left'] },
      route: { enum: ['auto', 'straight', 'orthogonal-h', 'orthogonal-v'] },
      labelPlacement: interactiveLabelPlacement,
      semanticIds: { ...semanticIds, minItems: 1 },
      waypoints: { type: 'array', minItems: 1, maxItems: 2048, items: canvasPoint },
    }),
    literalSegment('from', 'to'),
  ],
};
const interactiveArchitectureScene = closed(
  ['schema', 'id', 'title', 'subtitle', 'viewport', 'nodes', 'groups', 'edges'],
  {
    schema: { const: 'architecture.interactive-scene/v1' },
    id: identifier,
    title: text,
    subtitle: text,
    viewport: interactiveSize,
    nodes: { type: 'array', maxItems: 512, items: interactiveNode },
    groups: { type: 'array', maxItems: 256, items: interactiveGroup },
    edges: { type: 'array', maxItems: 2048, items: interactiveEdge },
    routes: AUTHORED_ROUTES_SCHEMA,
    texts: { type: 'array', maxItems: 4096, items: authoredText },
    requiredSemanticIds: { ...semanticIds, minItems: 1, maxItems: 8192 },
  },
);
const interactiveArchitectureRefinement = closed(['kind', 'pages'], {
  kind: { const: 'authored-architecture' },
  font: identifier,
  pages: {
    type: 'array',
    minItems: 1,
    maxItems: 64,
    items: closed(['id', 'label', 'purpose', 'scene'], {
      id: identifier,
      label: text,
      purpose: { enum: ['overview', 'mechanism'] },
      scene: interactiveArchitectureScene,
    }),
  },
});

export const SCENE_REFINEMENT_SCHEMA = deepFreeze({
  $id: 'architecture.scene-refinement/v1',
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...closed(['schema', 'media'], {
    schema: { const: 'architecture.scene-refinement/v1' },
    media: {
      ...closed([], {
        static: { oneOf: [staticGeometryRefinement, staticCanvasRefinement, neutralRefinement] },
        interactive: { oneOf: [interactiveArchitectureRefinement, neutralRefinement] },
      }),
      minProperties: 1,
    },
  }),
});
