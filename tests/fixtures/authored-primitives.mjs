import { createHash } from "node:crypto";
import { composeAuthoredStaticCanvas } from "../../packages/publisher/src/scene/static/authored-canvas.mjs";
import { composeAuthoredInteractiveArchitecture } from "../../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import {
  importClaimModel,
  resolveClaimModelSelection,
} from "../../packages/publisher/src/semantics/native-claim-model.mjs";
import { claimModel } from "./claim-model.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

const namespace = "fixture/primitives";

export const reference = JSON.stringify([namespace, "entity", "client"]);

export const rect = () => ({
  kind: "rect",
  box: { x: 0, y: 0, width: 80, height: 60 },
  fill: "paper",
  stroke: "ink",
  strokeWidth: 2,
});

export function meaning(medium) {
  const model = claimModel();
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
  const selection = resolveClaimModelSelection(imported, {
    id: "client",
    namespace,
    kind: "reference",
    reference: "entity:client",
  });
  const common = { id: "painted-client", semanticIds: [reference], primitives: [rect()] };
  const text = {
    id: "client-label",
    text: "Source client",
    fontSize: 14,
    weight: "400",
    anchor: "start",
    tone: "ink",
    x: 60,
    baseline: 100,
    visible: true,
    semanticIds: [reference],
    box: { x: 60, y: 86, width: 150, height: 14 },
  };
  const staticScene = {
    schema: "architecture.authored-static-scene/v1",
    title: "Finite painting",
    subtitle: "Exact semantic ports",
    width: 900,
    height: 460,
    referenceWidth: 900,
    spine: [],
    paint: { paper: "#f3f0e8", ink: "#26362f" },
    nodes: [{ ...common, box: { x: 200, y: 200, width: 80, height: 60 } }],
    texts: [text],
    edges: [],
    decorations: [],
    requiredSemanticIds: [reference],
  };
  const interactiveScene = {
    schema: "architecture.interactive-scene/v1",
    id: "overview",
    title: "Finite painting",
    subtitle: "Exact semantic ports",
    viewport: { width: 900, height: 460 },
    nodes: [{ ...common, position: { x: 200, y: 200 }, size: { width: 80, height: 60 } }],
    texts: [text],
    groups: [],
    edges: [],
    requiredSemanticIds: [reference],
  };
  return {
    edition: { id: "finite-reading", editor: "fixture-editor", sha256: "1".repeat(64) },
    editorial: { title: "Finite painting" },
    assertions: [{ id: "client", kind: "source", selection: "client" }],
    native: { selections: [selection] },
    media: { [medium]: { views: [{ id: "overview", assertionIds: ["client"] }] } },
    refinement: {
      media: {
        [medium]:
          medium === "static"
            ? { kind: "authored-canvas", scene: staticScene }
            : {
                kind: "authored-architecture",
                pages: [
                  {
                    id: "overview",
                    label: "Exact semantic ports",
                    purpose: "overview",
                    scene: interactiveScene,
                  },
                ],
              },
      },
    },
  };
}

export const sceneFor = (value, medium) =>
  medium === "static"
    ? value.refinement.media.static.scene
    : value.refinement.media.interactive.pages[0].scene;

export const compose = (value, medium) =>
  medium === "static"
    ? composeAuthoredStaticCanvas(value)
    : composeAuthoredInteractiveArchitecture(value);

export const resultScene = (result, medium) =>
  medium === "static" ? result.scene : result.pages[0].scene;
