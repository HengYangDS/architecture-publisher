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
      }),
      closed(['kind', 'repository', 'ref'], {
        kind: { const: 'vcs' },
        repository: portable,
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
        closed(['kind', 'provider', 'root', 'manifest'], {
          kind: { const: 'provider' },
          provider: identifier,
          root: portable,
          manifest: portable,
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

const selection = {
  oneOf: [
    closed(['id', 'namespace', 'kind', 'reference'], {
      id: identifier,
      namespace: text,
      kind: { const: 'reference' },
      reference: text,
    }),
    closed(['id', 'namespace', 'kind', 'language', 'expression'], {
      id: identifier,
      namespace: text,
      kind: { const: 'query' },
      language: text,
      expression: text,
    }),
  ],
};
const assertion = {
  oneOf: [
    closed(['id', 'kind', 'selection', 'questions'], {
      id: identifier,
      kind: { const: 'source' },
      selection: identifier,
      questions: questionIds,
    }),
    closed(['id', 'kind', 'statement', 'proponent', 'basis', 'questions'], {
      id: identifier,
      kind: { const: 'editorial' },
      statement: text,
      proponent: text,
      basis: { type: 'array', minItems: 1, uniqueItems: true, items: identifier },
      questions: questionIds,
    }),
  ],
};

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
      'requiredAssertions',
      'omissions',
      'transformations',
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
        selections: { type: 'array', minItems: 1, maxItems: 4096, items: selection },
        limits: {
          type: 'array',
          maxItems: 4096,
          items: closed(['question', 'reason'], { question: identifier, reason: text }),
        },
      }),
      requiredAssertions: { type: 'array', minItems: 1, maxItems: 8192, items: assertion },
      omissions: {
        type: 'array',
        maxItems: 8192,
        items: {
          oneOf: [
            closed(['selection', 'question', 'disposition', 'view', 'reason'], {
              selection: identifier,
              question: identifier,
              disposition: { enum: ['outside-question', 'explicit-limit'] },
              view: { anyOf: [text, { type: 'null' }] },
              reason: text,
            }),
            closed(['selection', 'question', 'disposition', 'view', 'coveredIn', 'reason'], {
              selection: identifier,
              question: identifier,
              disposition: { const: 'covered-elsewhere' },
              view: text,
              coveredIn: text,
              reason: text,
            }),
          ],
        },
      },
      transformations: {
        type: 'array',
        maxItems: 4096,
        items: closed(['id', 'kind', 'inputs', 'output', 'proponent', 'rule'], {
          id: identifier,
          kind: { enum: ['group', 'aggregate', 'compare', 'rephrase'] },
          inputs: { type: 'array', minItems: 1, uniqueItems: true, items: identifier },
          output: identifier,
          proponent: text,
          rule: text,
        }),
      },
      narrative: closed(['summary', 'readingOrder'], {
        summary: text,
        readingOrder: questionIds,
      }),
      presentation: closed(['static', 'interactive'], {
        static: closed(['questions', 'intent'], {
          questions: questionIds,
          intent: text,
          width: { type: 'integer', minimum: 320, maximum: 12000 },
        }),
        interactive: closed(['questions', 'intent'], {
          questions: questionIds,
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
