import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { composeAuthoredStaticCanvas } from "../../packages/publisher/src/scene/static/authored-canvas.mjs";
import { composeAuthoredInteractiveArchitecture } from "../../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import {
  importClaimModel,
  resolveClaimModelSelection,
} from "../../packages/publisher/src/semantics/native-claim-model.mjs";
import { claimModel } from "./claim-model.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const namespace = "fixture/routes";
export const ref = (kind, id) => JSON.stringify([namespace, kind, id]);
export const editorialRef = JSON.stringify(["route-reading", "editorial", "conditional"]);
export const arrowGeometry = { length: 8, halfWidth: 4, strokeWidth: 1.2 };

export function meaningFor(medium, editorial = false, model = claimModel()) {
  model.relations.telemetry = {
    ...structuredClone(model.relations.request),
    qualifiers: { purpose: "telemetry" },
  };
  const bytes = Buffer.from(JSON.stringify(model));
  const source = {
    namespace,
    format: { id: "architecture.claim-model", version: "2" },
    sha256: sha(bytes),
    claimant: model.owner,
  };
  const imported = importClaimModel(source, bytes, "native");
  const selections = ["request", "telemetry"].map((id) =>
    resolveClaimModelSelection(imported, {
      id,
      namespace,
      kind: "reference",
      reference: `relation:${id}`,
    }),
  );
  const assertions = selections.map(({ selectionId }) => ({
    id: selectionId,
    kind: "source",
    selection: selectionId,
  }));
  if (editorial)
    assertions.push({
      id: "conditional",
      kind: "editorial",
      statement: "The editor explains a conditional return.",
      proponent: "example:editor",
      basis: ["request"],
      questions: ["recovery"],
    });
  const node = (id, entity, x, adornment = false) => {
    const box = { x, y: 188, width: adornment ? 32 : 24, height: 24 };
    const primitives = adornment
      ? [
          {
            kind: "rect",
            box: { x: 0, y: 0, width: 32, height: 24 },
            fill: "paper",
            stroke: "ink",
            strokeWidth: 1,
          },
        ]
      : [
          {
            kind: "circle",
            center: { x: 12, y: 12 },
            radius: 10,
            fill: "paper",
            stroke: "ink",
            strokeWidth: 1,
          },
        ];
    return {
      id,
      ...(medium === "static"
        ? { box }
        : { position: { x, y: 188 }, size: { width: box.width, height: box.height } }),
      primitives,
      semanticIds: adornment ? [] : [ref("entity", entity)],
      ...(adornment ? { adornment: true } : {}),
    };
  };
  const edge = (id, from, to, points, arrow = false) => ({
    id,
    ...(medium === "static" ? { source: from, target: to } : { from, to }),
    points: points.map(([x, y]) => ({ x, y })),
    adornment: true,
    semanticIds: [],
    strokeWidth: 1.5,
    strokeTone: "ink",
    arrow,
    arrowGeometry: { ...arrowGeometry },
  });
  const label = (id, semantic, text, x, baseline) => ({
    id,
    text,
    x,
    baseline,
    fontSize: 12,
    weight: "400",
    anchor: "start",
    tone: "ink",
    visible: true,
    semanticIds: [semantic],
    box: { x, y: baseline - 12, width: text.length * 8, height: 14 },
  });
  const routes = ["request", "telemetry"].map((id) => ({
    id: `route-${id}`,
    reference: ref("relation", id),
    source: "client",
    target: "server",
    traversals: ["approach", "bridge", "terminal"].map((edge) => ({ edge, direction: "forward" })),
  }));
  const texts = [
    label("client-label", ref("entity", "client"), "Client", 120, 150),
    label("server-label", ref("entity", "server"), "Server", 660, 150),
    label("request-label", ref("relation", "request"), "Request", 120, 70),
    label("telemetry-label", ref("relation", "telemetry"), "Telemetry", 400, 70),
  ];
  if (editorial)
    texts.push(label("editorial-label", editorialRef, "Conditional explanation", 120, 360));
  const shared = {
    title: "Shared routes",
    subtitle: "Exact relations, common physical segments",
    nodes: [
      node("client", "client", 128),
      node("junction", "", 400, true),
      node("server", "server", 688),
    ],
    edges: [
      edge("approach", "client", "junction", [
        [152, 200],
        [400, 200],
      ]),
      edge("bridge", "junction", "junction", [
        [400, 200],
        [432, 200],
      ]),
      edge(
        "terminal",
        "junction",
        "server",
        [
          [432, 200],
          [688, 200],
        ],
        true,
      ),
    ],
    routes,
    texts,
    requiredSemanticIds: [
      ref("entity", "client"),
      ref("entity", "server"),
      ref("relation", "request"),
      ref("relation", "telemetry"),
      ...(editorial ? [editorialRef] : []),
    ],
  };
  const scene =
    medium === "static"
      ? {
          ...shared,
          schema: "architecture.authored-static-scene/v1",
          width: 960,
          height: 500,
          referenceWidth: 960,
          paint: { paper: "#faf9f6", ink: "#303733" },
          spine: ["client", "server"],
          decorations: [],
        }
      : {
          ...shared,
          schema: "architecture.interactive-scene/v1",
          id: "overview",
          viewport: { width: 960, height: 500 },
          groups: [],
        };
  const views = [{ id: "overview", assertionIds: assertions.map(({ id }) => id) }];
  return {
    edition: { id: "route-reading", sha256: "7".repeat(64) },
    editorial: { title: scene.title },
    assertions,
    native: { selections },
    media: { [medium]: { views } },
    refinement: {
      media: {
        [medium]:
          medium === "static"
            ? { kind: "authored-canvas", scene }
            : {
                kind: "authored-architecture",
                pages: [{ id: "overview", label: scene.subtitle, purpose: "overview", scene }],
              },
      },
    },
  };
}

export const sceneFor = (meaning, medium) =>
  medium === "static"
    ? meaning.refinement.media.static.scene
    : meaning.refinement.media.interactive.pages[0].scene;
export const compose = (meaning, medium) =>
  medium === "static"
    ? composeAuthoredStaticCanvas(meaning)
    : composeAuthoredInteractiveArchitecture(meaning);
export const composedScene = (result, medium) =>
  medium === "static" ? result.scene : result.pages[0].scene;
export const rejected = (meaning, medium) =>
  assert.throws(
    () => compose(meaning, medium),
    /authored_.*route|authored_.*binding|authored_.*semantic|authored_.*statement|authored_.*membership|interactive_scene/u,
  );
