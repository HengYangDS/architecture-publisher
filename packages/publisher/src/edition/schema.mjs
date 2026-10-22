import { deepFreeze } from "../semantics/document.mjs";
import { INTERACTIVE_APPEARANCE_SCHEMA } from "./appearance.mjs";
import { closed, identifier, text, digest, portable, questionIds } from "./schema/fields.mjs";

const sourceSelector = closed(["id", "namespace", "format", "claimant", "revision", "input"], {
  id: identifier,
  namespace: text,
  format: closed(["id", "version"], { id: text, version: text }),
  claimant: text,
  revision: {
    oneOf: [
      closed(["kind", "algorithm"], {
        kind: { const: "content" },
        algorithm: { const: "sha256" },
        canonicalization: { enum: ["raw-bytes/v1", "publisher-json/v1"] },
      }),
      closed(["kind", "repository", "ref"], {
        kind: { const: "vcs" },
        repository: { anyOf: [{ const: "." }, portable] },
        ref: text,
      }),
      closed(["kind", "value"], { kind: { const: "opaque" }, value: text }),
    ],
  },
  input: {
    oneOf: [
      closed(["kind", "path"], { kind: { const: "locator" }, path: portable }),
      closed(["kind", "path", "sha256"], {
        kind: { const: "pin" },
        path: portable,
        sha256: digest,
      }),
    ],
  },
});

export const BUILD_REQUEST_SCHEMA = deepFreeze({
  $id: "architecture.build-request/v1",
  $schema: "http://json-schema.org/draft-07/schema#",
  ...closed(["schema", "edition", "sources", "media"], {
    schema: { const: "architecture.build-request/v1" },
    edition: {
      oneOf: [
        closed(["kind", "root", "manifest"], {
          kind: { const: "direct" },
          root: portable,
          manifest: portable,
        }),
        closed(["kind", "provider"], {
          kind: { const: "provider" },
          provider: identifier,
        }),
      ],
    },
    sources: { type: "array", maxItems: 256, items: sourceSelector },
    providers: {
      type: "array",
      maxItems: 256,
      items: closed(["id", "manifest", "sha256"], {
        id: identifier,
        manifest: portable,
        sha256: digest,
        packageRoot: portable,
      }),
    },
    media: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      uniqueItems: true,
      items: { enum: ["static", "interactive"] },
    },
    toolchain: closed(["profile"], { profile: identifier }),
  }),
});

const selection = closed(["id", "namespace", "kind", "reference"], {
  id: identifier,
  namespace: text,
  kind: { const: "reference" },
  reference: text,
  questions: questionIds,
});

const editorialAssertion = closed(["id", "statement", "proponent", "basis", "questions"], {
  id: identifier,
  statement: text,
  proponent: text,
  basis: { type: "array", minItems: 1, uniqueItems: true, items: identifier },
  questions: questionIds,
});

const entityAddress = closed(["namespace", "id"], { namespace: text, id: text });

const responsibilityForm = closed(["schema", "kind", "roles", "handoffs"], {
  schema: { const: "architecture.visual-form/v1" },
  kind: { const: "responsibility" },
  roles: {
    type: "array",
    minItems: 1,
    maxItems: 256,
    items: closed(["group", "basis"], { group: identifier, basis: identifier }),
  },
  handoffs: {
    type: "array",
    maxItems: 4096,
    items: closed(["from", "to", "basis"], {
      from: identifier,
      to: identifier,
      basis: identifier,
    }),
  },
});

const view = closed(["id", "questions"], {
  id: identifier,
  questions: questionIds,
  form: responsibilityForm,
  groups: {
    type: "array",
    minItems: 1,
    maxItems: 256,
    items: closed(["id", "label", "elements"], {
      id: identifier,
      label: text,
      elements: {
        type: "array",
        minItems: 1,
        maxItems: 4096,
        items: entityAddress,
      },
    }),
  },
  forbiddenGroupPairs: {
    type: "array",
    maxItems: 4096,
    items: closed(["members", "reason"], {
      members: { type: "array", minItems: 2, maxItems: 2, items: entityAddress },
      reason: text,
    }),
  },
});

export const EDITION_PROJECT_SCHEMA = deepFreeze({
  $id: "architecture.edition-project/v1",
  $schema: "http://json-schema.org/draft-07/schema#",
  ...closed(["schema", "id", "editor", "title", "audiences", "questions", "scope"], {
    schema: { const: "architecture.edition-project/v1" },
    id: identifier,
    editor: text,
    title: text,
    audiences: {
      type: "array",
      minItems: 1,
      maxItems: 64,
      items: closed(["id", "label"], { id: identifier, label: text }),
    },
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 256,
      items: closed(["id", "audience", "text"], {
        id: identifier,
        audience: identifier,
        text,
      }),
    },
    scope: closed(["sourceNamespaces", "selections"], {
      sourceNamespaces: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: text,
      },
      projectionNamespaces: {
        type: "array",
        maxItems: 256,
        uniqueItems: true,
        items: text,
      },
      selections: { type: "array", minItems: 1, maxItems: 4096, items: selection },
      limits: {
        type: "array",
        maxItems: 4096,
        items: closed(["question", "reason"], { question: identifier, reason: text }),
      },
    }),
    editorialAssertions: { type: "array", maxItems: 4096, items: editorialAssertion },
    omissions: {
      type: "array",
      maxItems: 8192,
      items: {
        oneOf: [
          closed(["selection", "question", "medium", "disposition", "view", "reason"], {
            selection: identifier,
            question: identifier,
            medium: { enum: ["static", "interactive"] },
            disposition: { enum: ["outside-question", "explicit-limit"] },
            view: identifier,
            reason: text,
          }),
          closed(
            ["selection", "question", "medium", "disposition", "view", "coveredIn", "reason"],
            {
              selection: identifier,
              question: identifier,
              medium: { enum: ["static", "interactive"] },
              disposition: { const: "covered-elsewhere" },
              view: identifier,
              coveredIn: identifier,
              reason: text,
            },
          ),
        ],
      },
    },
    narrative: closed([], {
      summary: text,
    }),
    presentation: closed([], {
      static: closed([], {
        views: { type: "array", minItems: 1, maxItems: 256, items: view },
        intent: text,
        width: { type: "integer", minimum: 320, maximum: 12000 },
      }),
      interactive: closed([], {
        views: { type: "array", minItems: 1, maxItems: 256, items: view },
        intent: text,
        appearance: INTERACTIVE_APPEARANCE_SCHEMA,
      }),
    }),
    visualPolicy: closed([], {
      profile: identifier,
      override: { anyOf: [portable, { type: "null" }] },
      figureTypes: {
        type: "object",
        minProperties: 1,
        maxProperties: 512,
        propertyNames: text,
        additionalProperties: {
          anyOf: [
            { type: "string", pattern: "^lucide:[a-z0-9-]+$" },
            closed(["icon", "label"], {
              icon: { type: "string", pattern: "^lucide:[a-z0-9-]+$" },
              label: text,
            }),
          ],
        },
      },
      fonts: {
        type: "array",
        minItems: 1,
        maxItems: 16,
        items: closed(["id", "family", "faces", "distribution"], {
          id: identifier,
          family: { ...text, maxLength: 128 },
          faces: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: closed(["weight", "ref", "sha256"], {
              weight: { enum: ["400", "500", "600", "700"] },
              ref: portable,
              sha256: digest,
            }),
          },
          distribution: {
            type: "array",
            minItems: 1,
            maxItems: 16,
            items: closed(["ref", "sha256"], { ref: portable, sha256: digest }),
          },
        }),
      },
    }),
  }),
});
