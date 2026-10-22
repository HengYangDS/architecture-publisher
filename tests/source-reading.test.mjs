import assert from "node:assert/strict";
import test from "node:test";
import { canonical } from "../packages/publisher/src/protocol/json.mjs";
import { deepFreeze } from "../packages/publisher/src/semantics/document.mjs";
import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import { composeInteractiveEditionScene } from "../packages/publisher/src/scene/interactive/edition.mjs";
import { importClaimModel } from "../packages/publisher/src/semantics/native-claim-model.mjs";
import { claimModel } from "./fixtures/claim-model.mjs";
import { meaningFor, namespace, ref as routeRef, sceneFor } from "./fixtures/authored-routes.mjs";
import {
  nativeSourceReadingFixture,
  sourceReadingFixture,
  sourceReference as ref,
  sha,
} from "./fixtures/source-reading.mjs";

function assertImmutable(value) {
  if (value === null || typeof value !== "object") return;
  assert.equal(value instanceof Map, false);
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) assertImmutable(child);
}

test("the public compiler retains complete imported sources without changing selection identity", async (t) => {
  const { selected, meaning } = await sourceReadingFixture(t);
  const reading = meaning.native.sourceReading;
  assert.ok(reading, "complete imports must reach the reader without source re-import");
  assert.equal(reading.subjectLockSha256, selected.lockSha256);
  assert.equal(meaning.native.semanticDigest, sha(canonical(meaning.native.selections)));
  assert.equal(reading.likec4, null);
  assert.deepEqual(
    reading.claimModels.map(({ source }) => source.namespace),
    ["alpha", "beta"],
  );
  const [alpha, beta] = reading.claimModels;
  assert.deepEqual(Object.keys(alpha.model.entities).sort(), ["a", "b"]);
  assert.deepEqual(Object.keys(beta.model.entities).sort(), ["b", "c", "d"]);
  assert.deepEqual(Object.keys(beta.model.relations).sort(), ["r", "unselected"]);
  assert.equal(beta.model.relations.unselected.subject, "c");
  assert.equal(beta.model.relations.unselected.object, "d");
  assert.equal(alpha.sourceClass, "native");
  assert.equal(
    alpha.source.sha256,
    selected.lock.sources.find(({ namespace }) => namespace === "alpha").sha256,
  );
  assert.equal(alpha.model.owner, "alpha-owner");
  assert.deepEqual(alpha.model.context, {
    purpose: "Release approval belongs to the source owner.",
  });
  assert.equal(alpha.model.vocabulary.predicates.statement.valueKind, "opaque");
  assert.equal(alpha.model.sources.contract.locator, "contract.md");
  assert.deepEqual(alpha.semanticLimits, ["claim-model-provenance-unverified"]);
  assertImmutable(reading);
  assertImmutable(meaning.native.selections);
});

test("relation-only page scope keeps disconnected source endpoints despite a shared figure", async (t) => {
  const { meaning } = await sourceReadingFixture(t);
  const result = composeAuthoredInteractiveArchitecture(meaning);
  const page = result.pages[0];
  assert.ok(
    page.sourceReading,
    "page reading scope must be derived from exact selected assertions",
  );
  assert.deepEqual(page.sourceReading.selectionIds, ["alpha-call", "beta-call"]);
  assert.deepEqual(page.sourceReading.references, [
    ref("alpha", "entity", "a"),
    ref("alpha", "entity", "b"),
    ref("alpha", "relation", "r"),
    ref("beta", "entity", "b"),
    ref("beta", "entity", "c"),
    ref("beta", "relation", "r"),
  ]);
  assert.deepEqual(page.sourceReading.occurrences, [
    { reference: ref("alpha", "entity", "a"), graphicIds: ["a"] },
    { reference: ref("alpha", "entity", "b"), graphicIds: ["b"] },
    { reference: ref("alpha", "relation", "r"), graphicIds: ["alpha-call"] },
    { reference: ref("beta", "entity", "b"), graphicIds: ["b"] },
    { reference: ref("beta", "entity", "c"), graphicIds: ["c"] },
    { reference: ref("beta", "relation", "r"), graphicIds: ["beta-call"] },
  ]);
  assert.equal(page.sourceReading.references.includes(ref("beta", "entity", "d")), false);
  assert.equal(
    page.sourceReading.references.includes(ref("beta", "relation", "unselected")),
    false,
  );
  assert.notEqual(ref("alpha", "entity", "b"), ref("beta", "entity", "b"));
  assertImmutable(page.sourceReading);
});

test("claim-only scope keeps its source context and direct text without inventing relation edges", async (t) => {
  const { meaning } = await sourceReadingFixture(t);
  const page = composeAuthoredInteractiveArchitecture(meaning).pages[1];
  assert.ok(page.sourceReading, "claim statements must not disappear from page scope");
  assert.deepEqual(page.sourceReading.selectionIds, ["release"]);
  assert.deepEqual(page.sourceReading.references, [
    ref("alpha", "claim", "release"),
    ref("alpha", "entity", "b"),
  ]);
  assert.deepEqual(page.sourceReading.occurrences, [
    { reference: ref("alpha", "claim", "release"), graphicIds: ["release-statement"] },
  ]);
  assert.deepEqual(page.scene.nodes, []);
  assert.deepEqual(page.scene.edges, []);
  const claim = meaning.native.sourceReading.claimModels[0].model.claims.release;
  assert.equal(claim.predicate, "statement");
  assert.deepEqual(claim.condition, { approval: "required" });
  assert.deepEqual(claim.scope, { audience: "operators", environment: "production" });
  assert.deepEqual(claim.value, { text: "Release remains conditional." });
  assert.deepEqual(claim.provenance, ["contract"]);
  assert.deepEqual(claim.dependsOn, [{ section: "entities", id: "b" }]);
  assert.equal(page.sourceReading.references.includes(ref("alpha", "relation", "r")), false);
  assertImmutable(page.sourceReading);
});

test("the reader backend projects full source identities, not explanatory endpoints", async (t) => {
  const { projectSourceReading } =
    await import("../packages/publisher/renderers/interactive/source-reading.mjs");
  const { meaning } = await sourceReadingFixture(t);
  const pages = composeAuthoredInteractiveArchitecture(meaning).pages;
  const projected = projectSourceReading(meaning.native.sourceReading, pages);
  assert.equal(projected.imported, undefined, "complete imports remain compiler-private");
  assert.deepEqual(projected.elements.map(({ reference }) => reference).sort(), [
    ref("alpha", "entity", "a"),
    ref("alpha", "entity", "b"),
    ref("beta", "entity", "b"),
    ref("beta", "entity", "c"),
  ]);
  assert.deepEqual(
    projected.relations.map(({ reference, from, to }) => ({ reference, from, to })),
    [
      {
        reference: ref("alpha", "relation", "r"),
        from: ref("alpha", "entity", "a"),
        to: ref("alpha", "entity", "b"),
      },
      {
        reference: ref("beta", "relation", "r"),
        from: ref("beta", "entity", "b"),
        to: ref("beta", "entity", "c"),
      },
    ],
  );
  assert.deepEqual(projected.pages[0].relations, [
    ref("alpha", "relation", "r"),
    ref("beta", "relation", "r"),
  ]);
  assert.deepEqual(projected.pages[1].relations, []);
  assert.deepEqual(projected.pages[1].claims, [ref("alpha", "claim", "release")]);
  assert.deepEqual(projected.pages[1].elements, [ref("alpha", "entity", "b")]);
  const a = projected.elements.find(({ reference }) => reference === ref("alpha", "entity", "b"));
  const b = projected.elements.find(({ reference }) => reference === ref("beta", "entity", "b"));
  assert.notEqual(a.backendId, b.backendId);
  assert.equal(a.kind, "component");
  assert.equal(a.identityScope, "claim-model-id");
  assert.equal(a.sourceClass, "native");
  assert.equal(a.owner, "alpha-owner");
  assert.equal(a.record, meaning.native.sourceReading.claimModels[0].model.entities.b);
  assert.deepEqual(a.claims, [ref("alpha", "claim", "release")]);
  assert.equal(
    projected.claims[0].record,
    meaning.native.sourceReading.claimModels[0].model.claims.release,
  );
  assert.equal(
    projected.claims[0].predicate,
    meaning.native.sourceReading.claimModels[0].model.vocabulary.predicates.statement,
  );
  assert.deepEqual(projected.pages[0].occurrences, pages[0].sourceReading.occurrences);
  assertImmutable(projected);
});

test("the reader backend rejects invented page members before any official rendering", async (t) => {
  const { projectSourceReading } =
    await import("../packages/publisher/renderers/interactive/source-reading.mjs");
  const { meaning } = await sourceReadingFixture(t);
  const pages = structuredClone(composeAuthoredInteractiveArchitecture(meaning).pages);
  pages[0].sourceReading.references.push(ref("alpha", "entity", "missing"));
  assert.throws(() => projectSourceReading(meaning.native.sourceReading, pages), {
    code: "source_reading_reference_missing",
  });
});

test("native page reading uses selected source locations, not parser-run relation IDs", async (t) => {
  const { projectSourceReading } =
    await import("../packages/publisher/renderers/interactive/source-reading.mjs");
  const { meaning } = await nativeSourceReadingFixture(t);
  const native = meaning.native.sourceReading.likec4;
  const scene = composeInteractiveEditionScene(meaning);
  assert.ok(
    scene.pages[0].sourceReading,
    "automatic and authored pages share exact source reading",
  );
  const projected = projectSourceReading(meaning.native.sourceReading, scene.pages);
  assert.equal(projected.pages[0].label, "Which source calls are selected?");
  const selectedRelation = meaning.native.selections[0].members.relations[0];
  const selectedReference = ref(selectedRelation.origin.namespace, "relation", selectedRelation.id);
  assert.deepEqual(projected.pages[0].relations, [selectedReference]);
  const relation = projected.relations.find(({ reference }) => reference === selectedReference);
  assert.ok(relation, "source-location scope resolves the original parser-run record");
  assert.equal(
    relation.record,
    native.relations.find(({ id }) => id === relation.record.id),
  );
  assert.equal(relation.identityScope, "parser-run");
  assert.notEqual(relation.record.id, selectedRelation.id);
  assert.deepEqual(relation.record.opaqueMetadata, { contract: "exact-source" });
  assert.equal(
    projected.pages[0].elements.includes(ref("native/model", "entity", "root.c")),
    false,
  );
  assert.deepEqual(projected.claims, []);
  assertImmutable(projected);
});

test("the native reading backend preserves source containment without fabricating view-group entities", async (t) => {
  const { projectSourceReading } =
    await import("../packages/publisher/renderers/interactive/source-reading.mjs");
  const { meaning } = await nativeSourceReadingFixture(t);
  const scene = composeInteractiveEditionScene(meaning);
  const projected = projectSourceReading(meaning.native.sourceReading, scene.pages);
  const parent = projected.elements.find(
    ({ reference }) => reference === ref("native/model", "entity", "root"),
  );
  const child = projected.elements.find(
    ({ reference }) => reference === ref("native/model", "entity", "root.a"),
  );
  assert.equal(child.parent, parent.reference);
  assert.equal(child.backendId.startsWith(`${parent.backendId}.`), true);
  assert.equal(
    child.record,
    meaning.native.sourceReading.likec4.elements.find(({ id }) => id === "root.a"),
  );
  assert.deepEqual(child.record.opaqueMetadata, { policy: "requires-review" });
  assert.equal(projected.elements.length, 3);
  assert.equal(parent.label, null);
  assert.equal(parent.record, null, "unselected source hierarchy is identity only");
  assert.equal(
    projected.elements.some(({ label }) => label === "Global only"),
    false,
  );
  assert.equal(
    projected.elements.some(({ label }) => label === "Reader group"),
    false,
  );
  assert.equal(child.label, "Alpha");
});

test("pure explanation painting retains visual ink without installing a second reader", async (t) => {
  const { renderArchitectureSvg } =
    await import("../packages/publisher/renderers/archify/assembly-svg.mjs");
  const { loadBundledFonts } = await import("../packages/publisher/renderers/fonts/index.mjs");
  const { loadFigureIconSupply } = await import("../packages/publisher/renderers/icons/index.mjs");
  const { meaning } = await sourceReadingFixture(t);
  const page = composeAuthoredInteractiveArchitecture(meaning).pages[0];
  const input = {
    fonts: await loadBundledFonts(),
    icons: await loadFigureIconSupply(),
    exploration: page.exploration,
  };
  const interactive = await renderArchitectureSvg(page.scene, input);
  const presentation = await renderArchitectureSvg(page.scene, {
    ...input,
    interaction: "presentation",
  });
  const claimPage = composeAuthoredInteractiveArchitecture(meaning).pages[1];
  const { createBundledTextMeasurer } =
    await import("../packages/publisher/renderers/resvg/measurement.mjs");
  const measure = await createBundledTextMeasurer(input.fonts, claimPage.scene.texts);
  const measuredClaimScene = {
    ...claimPage.scene,
    texts: claimPage.scene.texts.map((text) => ({ ...text, box: measure.box(text) })),
  };
  const claimPresentation = await renderArchitectureSvg(measuredClaimScene, {
    ...input,
    exploration: claimPage.exploration,
    interaction: "presentation",
  });
  assert.match(interactive.svg, /data-inspect-id="b"/u);
  assert.doesNotMatch(
    presentation.svg,
    /data-inspect|data-focus|data-legend-bridge|data-relationship-queries|tabindex=|role="button"/u,
  );
  assert.doesNotMatch(
    claimPresentation.svg,
    /data-inspect|data-focus|data-legend-bridge|tabindex=|role="button"/u,
  );
  assert.match(presentation.svg, /role="img"/u);
  const visibleInk = (svg) =>
    [...svg.matchAll(/<(rect|path|circle|polygon|polyline|text)\b[^>]*>/gu)]
      .map(([tag]) => tag)
      .filter((tag) => !tag.includes("data-logical-relation"))
      .join("\n");
  assert.equal(visibleInk(presentation.svg), visibleInk(interactive.svg));
  assert.equal(
    page.sourceReading.occurrences.filter(({ graphicIds }) => graphicIds.includes("b")).length,
    2,
  );
});

test("one source-reading contract preserves repeated figures and every shared physical traversal", async () => {
  const { projectSourceReading } =
    await import("../packages/publisher/renderers/interactive/source-reading.mjs");
  const model = claimModel();
  const meaning = meaningFor("interactive", false, model);
  const scene = sceneFor(meaning, "interactive");
  scene.nodes.push({
    ...structuredClone(scene.nodes[0]),
    id: "client-again",
    position: { x: 128, y: 300 },
  });
  const bytes = Buffer.from(JSON.stringify(model));
  const source = {
    namespace,
    format: { id: "architecture.claim-model", version: "2" },
    sha256: sha(bytes),
    claimant: model.owner,
  };
  const imported = deepFreeze({
    subjectLockSha256: sha(bytes),
    claimModels: [importClaimModel(source, bytes, "native")],
    likec4: null,
  });
  const pages = composeAuthoredInteractiveArchitecture(meaning).pages;
  const projection = projectSourceReading(imported, pages);
  const occurrences = new Map(
    projection.pages[0].occurrences.map(({ reference, graphicIds }) => [reference, graphicIds]),
  );
  assert.deepEqual(occurrences.get(routeRef("entity", "client")), ["client", "client-again"]);
  for (const id of ["request", "telemetry"]) {
    const graphics = occurrences.get(routeRef("relation", id));
    for (const shared of ["approach", "bridge", "terminal"]) assert.ok(graphics.includes(shared));
  }
  assert.deepEqual(projection.pages[0].relations, [
    routeRef("relation", "request"),
    routeRef("relation", "telemetry"),
  ]);
  const selected = projection.relations.filter(({ reference }) =>
    projection.pages[0].relations.includes(reference),
  );
  assert.equal(selected.length, 2);
  assert.equal(selected[0].from, selected[1].from);
  assert.equal(selected[0].to, selected[1].to);
  assert.notDeepEqual(selected[0].record, selected[1].record);
  assert.equal(
    scene.edges.some(({ id }) => id === "client-again"),
    false,
  );
  assertImmutable(projection);
});

test("source reading checks imported identity, hierarchy, endpoints and selected occurrences once", async (t) => {
  const { projectSourceReading } =
    await import("../packages/publisher/renderers/interactive/source-reading.mjs");
  const { meaning } = await sourceReadingFixture(t);
  const pages = composeAuthoredInteractiveArchitecture(meaning).pages;
  const original = meaning.native.sourceReading;
  const invalid = (input, views, code) =>
    assert.throws(() => projectSourceReading(input, views), { message: code });
  invalid({ ...original, subjectLockSha256: null }, pages, "source_reading_input_invalid");
  invalid(
    { ...original, claimModels: [...original.claimModels, original.claimModels[0]] },
    pages,
    "source_reading_identity_ambiguous",
  );
  const disconnected = structuredClone(original);
  disconnected.claimModels[0].model.relations.r.subject = "missing";
  invalid(disconnected, pages, "source_reading_endpoint_missing");
  invalid(original, [{ ...pages[0], sourceReading: null }], "source_reading_input_invalid");
  invalid(
    original,
    [
      {
        ...pages[0],
        sourceReading: {
          ...pages[0].sourceReading,
          occurrences: [{ reference: ref("beta", "entity", "d"), graphicIds: ["c"] }],
        },
      },
    ],
    "source_reading_occurrence_invalid",
  );
  const { meaning: nativeMeaning } = await nativeSourceReadingFixture(t);
  const nativePages = composeInteractiveEditionScene(nativeMeaning).pages;
  const native = nativeMeaning.native.sourceReading;
  const missingSource = structuredClone(native);
  missingSource.likec4.sources = [];
  invalid(missingSource, nativePages, "source_reading_reference_missing");
  const missingParent = structuredClone(native);
  missingParent.likec4.elements[0].parent = { namespace: "native/model", id: "missing" };
  invalid(missingParent, nativePages, "source_reading_parent_missing");
  const cycle = structuredClone(native);
  const [first, second] = cycle.likec4.elements;
  first.parent = { namespace: second.namespace, id: second.id };
  second.parent = { namespace: first.namespace, id: first.id };
  invalid(cycle, nativePages, "source_reading_hierarchy_invalid");
});
