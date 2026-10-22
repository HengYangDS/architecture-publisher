import { createHash } from "node:crypto";
import { fromSources } from "@likec4/language-services/node";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const model = Buffer.from(
  "specification { element component }\nmodel { left = component 'Left'\n right = component 'Right'\n left -> right }\n",
);

export const views = Buffer.from("views { view overview { include * } }\n");

export function selection(
  contents = new Map([
    ["example/model", model],
    ["example/views", views],
  ]),
) {
  return {
    lock: {
      schema: "architecture.materialized-input-lock/v1",
      sources: [...contents].map(([namespace, content]) => ({
        namespace,
        claimant: "example-maintainer",
        format: { id: "likec4/dsl", version: "unversioned" },
        revision: { kind: "content", algorithm: "sha256", value: sha(content) },
        sha256: sha(content),
      })),
    },
    readSource(namespace) {
      return Buffer.from(contents.get(namespace));
    },
  };
}

export function parserWith({ locate, elements, relations, views }) {
  return async (sources, options) => {
    const upstream = await fromSources(sources, options);
    const computed = upstream.syncComputedModel();
    return {
      documentPaths: () => upstream.documentPaths(),
      languageServices: {
        getErrors: () => upstream.languageServices.getErrors(),
        locate: (query) => {
          const original = upstream.languageServices.locate(query);
          return locate ? locate(original, query) : original;
        },
      },
      ensureSingleProject: () => upstream.ensureSingleProject(),
      syncComputedModel: () => ({
        elements: () => (elements ? elements([...computed.elements()]) : computed.elements()),
        relationships: () =>
          relations ? relations([...computed.relationships()]) : computed.relationships(),
        views: () => (views ? views([...computed.views()]) : computed.views()),
      }),
    };
  };
}
