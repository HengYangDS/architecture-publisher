import { createHash } from "node:crypto";
import { compileEditionMeaning } from "../../packages/publisher/src/compiler/index.mjs";
import { assembleEditionSelection } from "../../packages/publisher/src/edition/selection.mjs";
import { importLikeC4Layout } from "../../packages/publisher/src/semantics/index.mjs";
import { loadFigureIconSupply } from "../../packages/publisher/renderers/icons/index.mjs";

export const figureIcons = await loadFigureIconSupply();

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

const sources = new Map([
  [
    "example/model",
    Buffer.from(
      "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b }\n",
    ),
  ],
  ["example/views", Buffer.from("views { view overview { include * } }\n")],
]);

export function editionProject() {
  return {
    schema: "architecture.edition-project/v1",
    id: "native-portrait",
    editor: "portrait-editor",
    title: "Selected architecture",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "What is connected?" }],
    scope: {
      sourceNamespaces: [...sources.keys()],
      selections: [
        {
          id: "overview",
          namespace: "example/views",
          kind: "reference",
          reference: "view:overview",
          questions: ["shape"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "The selected source view." },
    presentation: {
      static: { views: [{ id: "portrait", questions: ["shape"] }], intent: "One overview." },
      interactive: {
        views: [{ id: "portrait", questions: ["shape"] }],
        intent: "An explorable overview.",
      },
    },
    visualPolicy: { profile: "neutral", figureTypes: { component: "lucide:box" } },
  };
}

export function materialized(project = editionProject()) {
  return assembleEditionSelection({
    request: {
      sources: [...sources.keys()].map((namespace, index) => ({
        id: `source-${index}`,
        namespace,
      })),
      providers: [],
      media: ["static", "interactive"],
      toolchain: { profile: "portable" },
    },
    edition: { content: Buffer.from(JSON.stringify(project) + "\n"), resources: [] },
    sources: [...sources].map(([namespace, content]) => ({
      namespace,
      format: { id: "likec4/dsl", version: "unversioned" },
      claimant: "fixture-maintainer",
      revisionEvidence: {
        kind: "content",
        scope: "selected-root",
        canonicalization: "raw-bytes/v1",
        algorithm: "sha256",
        value: sha(content),
        verification: "recomputed",
      },
      content,
    })),
  });
}

export async function selectedInputs(project) {
  const selected = materialized(project);
  return {
    meaning: await compileEditionMeaning(selected),
    layout: await importLikeC4Layout({
      lock: selected.lock,
      readSource: selected.readSource,
      view: { namespace: "example/views", id: "overview" },
    }),
  };
}
