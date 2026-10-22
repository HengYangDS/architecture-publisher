import { createHash } from "node:crypto";
import {
  importClaimModel,
  resolveClaimModelSelection,
} from "../../packages/publisher/src/semantics/native-claim-model.mjs";
import { claimModel } from "./claim-model.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

const namespace = "fixture/occurrences";

export const semantic = (kind, id) => JSON.stringify([namespace, kind, id]);

function selectedMeaning() {
  const model = claimModel();
  const bytes = Buffer.from(JSON.stringify(model));
  const source = {
    namespace,
    format: { id: "architecture.claim-model", version: "2" },
    sha256: sha(bytes),
    claimant: model.owner,
  };
  const imported = importClaimModel(source, bytes, "native");
  const selections = [
    ["entity", "client"],
    ["entity", "server"],
    ["relation", "request"],
    ["claim", "intended"],
    ["claim", "observed"],
  ].map(([kind, id]) =>
    resolveClaimModelSelection(imported, {
      id: `${kind}-${id}`,
      namespace,
      kind: "reference",
      reference: `${kind}:${id}`,
    }),
  );
  return {
    assertions: selections.map(({ selectionId }) => ({
      id: selectionId,
      kind: "source",
      selection: selectionId,
    })),
    native: { selections },
    editorial: {
      title: "Shared source meaning",
      visualPolicy: { figureTypes: { component: "lucide:box", aggregate: "lucide:layers" } },
    },
    media: {},
    refinement: { media: {} },
  };
}

export function interactiveMeaning() {
  const meaning = selectedMeaning();
  const node = (id, entity, x) => ({
    id,
    label: entity,
    visualRole: "backend",
    position: { x, y: 120 },
    size: { width: 140, height: 70 },
    semanticIds: [semantic("entity", entity)],
  });
  const edge = (id, from) => ({
    id,
    from,
    to: "server",
    label: "Source-reported request",
    visualRole: "default",
    fromSide: "right",
    toSide: "left",
    route: "auto",
    semanticIds: [semantic("relation", "request")],
  });
  meaning.media.interactive = {
    views: [{ id: "overview", assertionIds: meaning.assertions.map(({ id }) => id) }],
  };
  meaning.refinement.media.interactive = {
    kind: "authored-architecture",
    pages: [
      {
        id: "overview",
        label: "Repeated concepts",
        purpose: "overview",
        scene: {
          schema: "architecture.interactive-scene/v1",
          id: "overview",
          title: meaning.editorial.title,
          subtitle: "Repeated concepts",
          viewport: { width: 900, height: 420 },
          nodes: [
            node("client-a", "client", 40),
            node("client-b", "client", 280),
            node("server", "server", 640),
          ],
          edges: [edge("request-a", "client-a"), edge("request-b", "client-b")],
          groups: [],
        },
      },
    ],
  };
  return meaning;
}

export function staticMeaning() {
  const meaning = selectedMeaning();
  const node = (id, entity, x) => ({
    id,
    kind: "stage",
    tone: "ink",
    center: { x, y: 200 },
    radius: 12,
    box: { x: x - 12, y: 188, width: 24, height: 24 },
    paintBox: { x: x - 13, y: 187, width: 26, height: 26 },
    strokeWidth: 2,
    semanticIds: [semantic("entity", entity)],
  });
  const label = (id, reference, x) => ({
    id,
    text: "Source-bound carrier",
    fontSize: 12,
    weight: "400",
    anchor: "start",
    tone: "ink",
    x,
    baseline: 100,
    visible: true,
    semanticIds: [reference],
    box: { x, y: 88, width: 140, height: 12 },
  });
  const edge = (id, from, x) => ({
    id,
    kind: "flow",
    source: from,
    target: "server",
    points: [
      { x: x + 12, y: 200 },
      { x: 628, y: 200 },
    ],
    strokeWidth: 1.5,
    arrow: true,
    arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
    strokeTone: "ink",
    semanticIds: [semantic("relation", "request")],
  });
  meaning.media.static = {
    views: [{ id: "overview", assertionIds: meaning.assertions.map(({ id }) => id) }],
  };
  meaning.refinement.media.static = {
    kind: "authored-canvas",
    scene: {
      schema: "architecture.authored-static-scene/v1",
      title: meaning.editorial.title,
      subtitle: "Repeated concepts",
      width: 900,
      height: 420,
      referenceWidth: 900,
      spine: [],
      paint: { paper: "#f3f0e8", ink: "#26362f" },
      nodes: [
        node("client-a", "client", 40),
        node("client-b", "client", 280),
        node("server", "server", 640),
      ],
      texts: [
        label("client-a-label", semantic("entity", "client"), 40),
        label("client-b-label", semantic("entity", "client"), 280),
        label("server-label", semantic("entity", "server"), 640),
        label("request-a-label", semantic("relation", "request"), 150),
        label("request-b-label", semantic("relation", "request"), 430),
      ],
      edges: [edge("request-a", "client-a", 40), edge("request-b", "client-b", 280)],
      decorations: [],
      requiredSemanticIds: [
        semantic("entity", "client"),
        semantic("entity", "server"),
        semantic("relation", "request"),
      ],
    },
  };
  return meaning;
}

export function htmlFixture() {
  const content = Buffer.from(
    '<!DOCTYPE html><html><body><svg><g data-node-id="left"/><g data-node-id="right"/></svg></body></html>',
  );
  const fact = {
    reference: semantic("entity", "client"),
    sourceSha256: "f".repeat(64),
    graphicId: "left",
    title: "Client",
    facts: [{ label: "Type", value: "component" }],
  };
  return {
    schema: "architecture.interactive-html-composition/v1",
    title: "Repeated concepts",
    overview: "overview",
    build: {
      lockSha256: "a".repeat(64),
      editionSha256: "b".repeat(64),
      semanticDigest: "c".repeat(64),
    },
    state: {
      qualification: "not-performed",
      humanAcceptance: "not-performed",
      publication: "not-performed",
    },
    sources: [
      {
        id: "source",
        kind: "native",
        namespace,
        sha256: "f".repeat(64),
        claimant: "fixture-owner",
      },
    ],
    pages: [
      {
        id: "overview",
        label: "Overview",
        shortLabel: "Overview",
        purpose: "overview",
        path: "overview.html",
        sha256: sha(content),
        content,
        sourceIds: ["source"],
        subjectSources: { left: ["source"], right: ["source"] },
        facts: [fact, { ...structuredClone(fact), graphicId: "right" }],
      },
    ],
  };
}

export function aggregatedMeaning(factory, mode) {
  const meaning = factory();
  const model = claimModel();
  const relation = (subject, object) => ({
    type: "calls",
    subject,
    object,
    qualifiers: {},
    provenance: ["contract"],
  });
  model.relations["client-context"] = relation("client", "other");
  model.relations["server-context"] = relation("server", "server");
  model.relations.response = relation("server", "client");
  model.claims["context-claim"] = {
    ...structuredClone(model.claims.intended),
    subject: "other",
    object: "other",
    condition: { role: "aggregate-context" },
    dependsOn: [{ section: "relations", id: "client-context" }],
  };
  model.relations["client-context"].subject = "other";
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
  const selected = meaning.native.selections.map(({ target, selectionId }) => ({
    kind: target.kind,
    id: target.id,
    selectionId,
  }));
  selected.push(
    { kind: "relation", id: "client-context", selectionId: "client-context" },
    { kind: "relation", id: "server-context", selectionId: "server-context" },
    { kind: "claim", id: "context-claim", selectionId: "context-claim" },
  );
  if (mode === "reverse")
    selected.push({ kind: "relation", id: "response", selectionId: "response" });
  meaning.native.selections = selected.map(({ kind, id, selectionId }) =>
    resolveClaimModelSelection(imported, {
      id: selectionId,
      namespace,
      kind: "reference",
      reference: `${kind}:${id}`,
    }),
  );
  meaning.assertions = meaning.native.selections.map(({ selectionId }) => ({
    id: selectionId,
    kind: "source",
    selection: selectionId,
  }));
  const medium = factory === interactiveMeaning ? "interactive" : "static";
  meaning.media[medium].views[0].assertionIds = meaning.assertions.map(({ id }) => id);
  const scene =
    medium === "interactive"
      ? meaning.refinement.media.interactive.pages[0].scene
      : meaning.refinement.media.static.scene;
  for (const node of scene.nodes.filter(({ id }) => id.startsWith("client-")))
    node.semanticIds.push(semantic("entity", "other"));
  for (const edge of scene.edges) {
    edge.semanticIds.push(
      semantic("relation", "client-context"),
      semantic("relation", "server-context"),
    );
    if (mode === "reverse") edge.semanticIds.push(semantic("relation", "response"));
    if (mode === "internal-only") edge.semanticIds = [semantic("relation", "client-context")];
  }
  if (mode === "ambiguous")
    scene.nodes.find(({ id }) => id === "server").semanticIds.push(semantic("entity", "client"));
  if (medium === "static") {
    const copyText = (id, reference) => ({
      ...structuredClone(scene.texts[0]),
      id,
      semanticIds: [reference],
    });
    scene.texts.push(
      copyText("other-label", semantic("entity", "other")),
      copyText("client-context-label", semantic("relation", "client-context")),
      copyText("server-context-label", semantic("relation", "server-context")),
    );
    scene.requiredSemanticIds.push(
      semantic("entity", "other"),
      semantic("relation", "client-context"),
      semantic("relation", "server-context"),
    );
    if (mode === "reverse") {
      scene.texts.push(copyText("response-label", semantic("relation", "response")));
      scene.requiredSemanticIds.push(semantic("relation", "response"));
    }
  }
  return meaning;
}
