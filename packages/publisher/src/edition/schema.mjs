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
const view = closed(['id', 'questions'], {
  id: identifier,
  questions: questionIds,
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
        items: closed(['namespace', 'id'], { namespace: text, id: text }),
      },
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
      }),
    },
  ),
});

const coordinate = { type: 'number', minimum: -12000, maximum: 12000 };
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
      items: closed(
        ['id', 'kind', 'tone', 'center', 'radius', 'box', 'paintBox', 'strokeWidth', 'semanticIds'],
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
    },
    texts: {
      type: 'array',
      maxItems: 4096,
      items: closed(
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
          weight: { enum: ['400', '600'] },
          anchor: { enum: ['start', 'middle', 'end'] },
          tone: identifier,
          x: coordinate,
          baseline: coordinate,
          visible: { type: 'boolean' },
          semanticIds,
          box: canvasBox,
        },
      ),
    },
    edges: {
      type: 'array',
      maxItems: 8192,
      items: closed(
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
    },
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
  scene: canvasScene,
});
const neutralRefinement = closed(['kind'], { kind: { const: 'neutral' } });
const interactiveSize = closed(['width', 'height'], {
  width: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
  height: { type: 'number', exclusiveMinimum: 0, maximum: 12000 },
});
const interactiveNode = closed(['id', 'label', 'visualRole', 'position', 'size'], {
  id: identifier,
  label: text,
  visualRole: text,
  position: canvasPoint,
  size: interactiveSize,
  detail: text,
  semanticIds: { ...semanticIds, minItems: 1 },
});
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
const interactiveEdge = closed(
  ['id', 'from', 'to', 'label', 'visualRole', 'fromSide', 'toSide', 'route'],
  {
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
  },
);
const interactiveArchitectureScene = closed(
  ['schema', 'id', 'title', 'subtitle', 'viewport', 'nodes', 'groups', 'edges'],
  {
    schema: { const: 'architecture.interactive-scene/v1' },
    id: identifier,
    title: text,
    subtitle: text,
    viewport: interactiveSize,
    nodes: { type: 'array', minItems: 1, maxItems: 512, items: interactiveNode },
    groups: { type: 'array', maxItems: 256, items: interactiveGroup },
    edges: { type: 'array', maxItems: 2048, items: interactiveEdge },
  },
);
const interactiveArchitectureRefinement = closed(['kind', 'pages'], {
  kind: { const: 'authored-architecture' },
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
