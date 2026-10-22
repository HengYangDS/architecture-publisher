import { createHash } from "node:crypto";
import { composeAuthoredInteractiveArchitecture } from "../../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import { composeAuthoredStaticCanvas } from "../../packages/publisher/src/scene/static/authored-canvas.mjs";
import {
  importClaimModel,
  resolveClaimModelSelection,
} from "../../packages/publisher/src/semantics/native-claim-model.mjs";
import { claimModel } from "./claim-model.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const namespace = "fixture/statements";

const editionId = "fixture-reading";

export const semantic = (kind, id) => JSON.stringify([namespace, kind, id]);

export const editorial = (id) => JSON.stringify([editionId, "editorial", id]);

function text(id, reference, value, baseline = 100) {
  return {
    id,
    text: value,
    fontSize: 14,
    weight: "400",
    anchor: "start",
    tone: "ink",
    x: 40,
    baseline,
    visible: true,
    semanticIds: [reference],
    box: { x: 40, y: baseline - 14, width: 360, height: 14 },
  };
}

export function meaningFor(medium, { typed = false, editor = false, anchored = false } = {}) {
  const model = claimModel();
  model.claims.published.dependsOn = anchored ? [{ section: "entities", id: "client" }] : [];
  model.claims["second-statement"] = {
    ...structuredClone(model.claims.published),
    value: { text: "The client preserves the selected intent." },
  };
  const bytes = Buffer.from(JSON.stringify(model));
  const imported = importClaimModel(
    {
      namespace,
      format: { id: "architecture.claim-model", version: "2" },
      sha256: sha(bytes),
      claimant: model.owner,
    },
    bytes,
    "native",
  );
  const targets = typed
    ? [
        ["entity", "client"],
        ["entity", "server"],
        ["relation", "request"],
        ["claim", "intended"],
        ["claim", "observed"],
      ]
    : [
        ...(anchored ? [["entity", "client"]] : []),
        ["claim", "published"],
        ["claim", "second-statement"],
      ];
  const selections = targets.map(([kind, id]) =>
    resolveClaimModelSelection(imported, {
      id: `${kind}-${id}`,
      namespace,
      kind: "reference",
      reference: `${kind}:${id}`,
    }),
  );
  const assertions = selections.map(({ selectionId }) => ({
    id: selectionId,
    kind: "source",
    selection: selectionId,
    questions: ["shape"],
  }));
  if (editor)
    assertions.push({
      id: "editor-decision",
      kind: "editorial",
      statement: "This reading separates source intent from editorial judgment.",
      proponent: "fixture-editor",
      basis: [typed ? "claim-intended" : "claim-published"],
      questions: ["shape"],
    });
  const meaning = {
    edition: {
      id: editionId,
      editor: "fixture-editor",
      sha256: sha(Buffer.from("selected-edition")),
    },
    assertions,
    native: { selections },
    editorial: {
      title: "Explicit statements",
      visualPolicy: { figureTypes: { component: "lucide:box", aggregate: "lucide:layers" } },
    },
    questions: [{ id: "shape", text: "What is asserted?" }],
    media: {
      [medium]: { views: [{ id: "overview", assertionIds: assertions.map(({ id }) => id) }] },
    },
    refinement: { media: {} },
  };
  const required = targets.map(([kind, id]) => semantic(kind, id));
  const texts = targets.map(([kind, id], index) =>
    text(`text-${kind}-${id}`, semantic(kind, id), `Selected ${kind}: ${id}`, 80 + index * 35),
  );
  if (editor) {
    required.push(editorial("editor-decision"));
    texts.push(text("editor-text", editorial("editor-decision"), assertions.at(-1).statement, 300));
  }
  if (medium === "static") {
    const node = (id, x) => ({
      id,
      kind: "stage",
      tone: "ink",
      center: { x, y: 340 },
      radius: 12,
      box: { x: x - 12, y: 328, width: 24, height: 24 },
      paintBox: { x: x - 13, y: 327, width: 26, height: 26 },
      strokeWidth: 2,
      semanticIds: [semantic("entity", id)],
    });
    meaning.refinement.media.static = {
      kind: "authored-canvas",
      scene: {
        schema: "architecture.authored-static-scene/v1",
        title: meaning.editorial.title,
        subtitle: "Source and editorial statements",
        width: 900,
        height: 460,
        referenceWidth: 900,
        spine: [],
        paint: { paper: "#f3f0e8", ink: "#26362f" },
        nodes: typed
          ? [node("client", 100), node("server", 600)]
          : anchored
            ? [node("client", 100)]
            : [],
        texts,
        edges: typed
          ? [
              {
                id: "request",
                kind: "flow",
                source: "client",
                target: "server",
                points: [
                  { x: 112, y: 340 },
                  { x: 588, y: 340 },
                ],
                strokeWidth: 1.5,
                arrow: true,
                arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
                strokeTone: "ink",
                semanticIds: [semantic("relation", "request")],
              },
            ]
          : [],
        decorations: [],
        requiredSemanticIds: required,
      },
    };
  } else {
    const node = (id, x) => ({
      id,
      label: id,
      visualRole: "backend",
      position: { x, y: 330 },
      size: { width: 140, height: 70 },
      semanticIds: [semantic("entity", id)],
    });
    meaning.refinement.media.interactive = {
      kind: "authored-architecture",
      pages: [
        {
          id: "overview",
          label: "Source and editorial statements",
          purpose: "overview",
          scene: {
            schema: "architecture.interactive-scene/v1",
            id: "overview",
            title: meaning.editorial.title,
            subtitle: "Source and editorial statements",
            viewport: { width: 900, height: 460 },
            nodes: typed
              ? [node("client", 60), node("server", 600)]
              : anchored
                ? [node("client", 60)]
                : [],
            groups: [],
            edges: typed
              ? [
                  {
                    id: "request",
                    from: "client",
                    to: "server",
                    label: "Source-reported request",
                    visualRole: "default",
                    fromSide: "right",
                    toSide: "left",
                    route: "auto",
                    semanticIds: [semantic("relation", "request")],
                  },
                ]
              : [],
            texts,
            requiredSemanticIds: required,
          },
        },
      ],
    };
  }
  return meaning;
}

export const sceneFor = (meaning, medium) =>
  medium === "static"
    ? meaning.refinement.media.static.scene
    : meaning.refinement.media.interactive.pages[0].scene;

export const compose = (meaning, medium) =>
  medium === "static"
    ? composeAuthoredStaticCanvas(meaning)
    : composeAuthoredInteractiveArchitecture(meaning);

export const carriersFor = (result, medium) =>
  medium === "static" ? result.carriers.assertions : result.pages[0].carriers;

export function useReaderNotes(meaning) {
  const scene = sceneFor(meaning, "interactive");
  const statements = scene.texts.filter(({ semanticIds }) =>
    semanticIds.some((id) => ["claim", "editorial"].includes(JSON.parse(id)[1])),
  );
  scene.notes = [
    {
      id: "reading-notes",
      title: "Source and editorial statements",
      items: [
        ...statements.map(({ id, text, semanticIds }) => ({ id, text, semanticIds })),
        { id: "reading-context", text: "Ordinary context remains explanatory.", semanticIds: [] },
      ],
    },
  ];
  scene.texts = scene.texts.filter((label) => !statements.includes(label));
  return scene;
}
