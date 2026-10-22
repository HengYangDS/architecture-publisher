import assert from "node:assert/strict";
import test from "node:test";
import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import { composeAuthoredStaticCanvas } from "../packages/publisher/src/scene/static/authored-canvas.mjs";
import { composeInteractiveHtml } from "../packages/publisher/src/rendering/index.mjs";
import {
  semantic,
  interactiveMeaning,
  staticMeaning,
  htmlFixture,
  aggregatedMeaning,
} from "./fixtures/authored-occurrence.mjs";

test("mixed source kinds cannot invent a component type from grouped presentation", () => {
  const meaning = structuredClone(aggregatedMeaning(interactiveMeaning, "context"));
  for (const selection of meaning.native.selections)
    for (const element of selection.members?.elements ?? [])
      if (element.id === "other") element.kind = "state";
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: "authored_interactive_figure_kind_required",
  });
  for (const node of meaning.refinement.media.interactive.pages[0].scene.nodes)
    if (node.id.startsWith("client-")) node.figureKind = "request-context";
  meaning.editorial.visualPolicy.figureTypes = {
    component: "lucide:box",
    "request-context": { icon: "lucide:layers", label: "Request context" },
  };
  const before = structuredClone(meaning);
  const page = composeAuthoredInteractiveArchitecture(meaning).pages[0];
  assert.deepEqual(meaning, before);
  assert(
    page.scene.nodes
      .filter(({ id }) => id.startsWith("client-"))
      .every(
        ({ figureKind, figureLabel }) =>
          figureKind === "request-context" && figureLabel === "Request context",
      ),
  );
  assert.deepEqual(
    new Set(
      page.facts
        .filter(({ graphicId }) => graphicId === "client-a")
        .flatMap(({ facts }) =>
          facts.filter(({ label }) => label === "Entity kind").map(({ value }) => value),
        ),
    ),
    new Set(["component", "state"]),
  );
  assert(!page.exploration.nodes.some(({ kind }) => kind === "aggregate"));
  assert(page.exploration.limits.includes("nonbijective-source-membership"));
});

test("authored interactive occurrences retain each structural and typed-claim carrier", () => {
  const page = composeAuthoredInteractiveArchitecture(interactiveMeaning()).pages[0];
  const carriers = new Map(
    page.carriers.map(({ assertionId, graphicIds }) => [assertionId, graphicIds]),
  );
  assert.deepEqual(carriers.get("entity-client"), ["client-a", "client-b"]);
  assert.deepEqual(carriers.get("claim-intended"), ["request-a", "request-b"]);
  assert.deepEqual(carriers.get("claim-observed"), ["client-a", "client-b"]);
  assert.equal(page.facts.length, 9);
  assert.equal(new Set(page.facts.map(({ reference }) => reference)).size, 5);
  for (const reference of [
    "entity:client",
    "relation:request",
    "claim:intended",
    "claim:observed",
  ]) {
    const [kind, id] = reference.split(":");
    const records = page.facts.filter((item) => item.reference === semantic(kind, id));
    assert.equal(records.length, 2);
    assert.equal(new Set(records.map(({ facts }) => JSON.stringify(facts))).size, 1);
  }
});

test("authored static occurrences retain all labels and source-bound claim anchors", () => {
  const { carriers } = composeAuthoredStaticCanvas(staticMeaning());
  assert.equal(carriers.schema, "architecture.authored-canvas-carriers/v2");
  const assertions = new Map(
    carriers.assertions.map(({ assertionId, graphicIds }) => [assertionId, graphicIds]),
  );
  assert.deepEqual(assertions.get("entity-client"), ["text:client-a-label", "text:client-b-label"]);
  assert.deepEqual(assertions.get("claim-intended"), [
    "text:request-a-label",
    "text:request-b-label",
    "edge:request-a",
    "edge:request-b",
  ]);
  assert.deepEqual(assertions.get("claim-observed"), [
    "text:client-a-label",
    "text:client-b-label",
    "node:client-a",
    "node:client-b",
  ]);
  assert.deepEqual(new Map(carriers.nodeGraphics).get(semantic("entity", "client")), [
    "node:client-a",
    "node:client-b",
  ]);
  assert.deepEqual(new Map(carriers.relationGraphics).get(semantic("relation", "request")), [
    "edge:request-a",
    "edge:request-b",
  ]);
});

test("static typed Claims require structural owners even when their visible text survives", () => {
  for (const kind of ["relation", "subject", "context"]) {
    const meaning =
      kind === "context" ? aggregatedMeaning(staticMeaning, "context") : staticMeaning();
    const scene = meaning.refinement.media.static.scene;
    scene.edges = [];
    if (kind === "subject") {
      meaning.media.static.views[0].assertionIds =
        meaning.media.static.views[0].assertionIds.filter((id) => id !== "claim-intended");
      scene.nodes = scene.nodes.filter(({ id }) => id === "server");
    }
    assert.throws(
      () => composeAuthoredStaticCanvas(meaning),
      {
        code:
          kind === "subject"
            ? "authored_canvas_membership_mismatch"
            : "authored_canvas_claim_unbound",
      },
      kind,
    );
  }
});

test("static source assertions can retain their admitted text-only representation", () => {
  const meaning = staticMeaning();
  meaning.media.static.views[0].assertionIds = meaning.media.static.views[0].assertionIds.filter(
    (id) => !id.startsWith("claim-"),
  );
  const scene = meaning.refinement.media.static.scene;
  scene.edges = [];
  const { carriers } = composeAuthoredStaticCanvas(meaning);
  assert.deepEqual(
    carriers.assertions.map(({ source }) => source.kind),
    ["entity", "entity", "relation"],
  );
  assert.ok(
    carriers.assertions.every(({ graphicIds }) => graphicIds.every((id) => id.startsWith("text:"))),
  );
});

test("occurrence reuse still refuses wrong direction, local duplicates and unknown members", () => {
  for (const [factory, compose, medium] of [
    [interactiveMeaning, composeAuthoredInteractiveArchitecture, "interactive"],
    [staticMeaning, composeAuthoredStaticCanvas, "static"],
  ]) {
    const scene = (value) =>
      medium === "interactive"
        ? value.refinement.media.interactive.pages[0].scene
        : value.refinement.media.static.scene;
    for (const mutate of [
      (value) => scene(value).nodes[1].semanticIds.push(semantic("entity", "unknown")),
      (value) => scene(value).nodes[1].semanticIds.push(scene(value).nodes[1].semanticIds[0]),
      (value) => (scene(value).nodes[1].id = scene(value).nodes[0].id),
      (value) => (scene(value).edges[1].id = scene(value).edges[0].id),
      (value) => scene(value).edges[1].semanticIds.push(scene(value).edges[1].semanticIds[0]),
      (value) => {
        if (medium === "static")
          scene(value).texts[1].semanticIds.push(scene(value).texts[1].semanticIds[0]);
        else scene(value).nodes[1].semanticIds.push(scene(value).nodes[1].semanticIds[0]);
      },
      (value) => {
        const edge = scene(value).edges[1];
        const fields = medium === "interactive" ? ["from", "to"] : ["source", "target"];
        [edge[fields[0]], edge[fields[1]]] = [edge[fields[1]], edge[fields[0]]];
      },
    ]) {
      const input = factory();
      mutate(input);
      assert.throws(() => compose(input));
    }
  }
});

test("inspection repeats immutable facts at each graphic site without competing authority", () => {
  assert(Buffer.isBuffer(composeInteractiveHtml(htmlFixture())));
  for (const mutate of [
    (value) => (value.pages[0].facts[1].facts[0].value = "contradictory type"),
    (value) => (value.pages[0].facts[1].title = "Different meaning"),
    (value) => (value.pages[0].facts[1].graphicId = "left"),
    (value) => (value.pages[0].facts[1].sourceSha256 = "e".repeat(64)),
  ]) {
    const input = htmlFixture();
    mutate(input);
    assert.throws(() => composeInteractiveHtml(input), {
      code: "interactive_html_page_facts_invalid",
    });
  }
});

test("one standalone work cannot assign conflicting facts to a shared reference on different pages", () => {
  const input = htmlFixture();
  const second = structuredClone(input.pages[0]);
  second.id = "detail";
  second.label = "Detail";
  second.shortLabel = "Detail";
  second.purpose = "mechanism";
  second.path = "detail.html";
  second.content = Buffer.from(second.content);
  input.pages.push(second);
  assert(Buffer.isBuffer(composeInteractiveHtml(input)));
  second.facts[0].facts[0].value = "Conflicting source meaning";
  second.facts[1].facts[0].value = "Conflicting source meaning";
  assert.throws(() => composeInteractiveHtml(input), {
    code: "interactive_html_page_facts_invalid",
  });
});

test("a forward relation cannot excuse a reverse, internal-only or ambiguous aggregate", () => {
  for (const [factory, compose, code] of [
    [
      interactiveMeaning,
      composeAuthoredInteractiveArchitecture,
      "authored_interactive_semantic_mismatch",
    ],
    [staticMeaning, composeAuthoredStaticCanvas, "authored_canvas_edge_binding_mismatch"],
  ]) {
    for (const mode of ["reverse", "internal-only", "ambiguous"])
      assert.throws(() => compose(aggregatedMeaning(factory, mode)), { code }, mode);
  }
});

test("legal aggregate context remains on its owning node rather than borrowing arrow direction", () => {
  const page = composeAuthoredInteractiveArchitecture(
    aggregatedMeaning(interactiveMeaning, "context"),
  ).pages[0];
  assert.deepEqual(
    page.facts
      .filter(({ reference }) => reference === semantic("relation", "client-context"))
      .map(({ graphicId }) => graphicId),
    ["client-a", "client-b"],
  );
  assert.deepEqual(
    page.facts
      .filter(({ reference }) => reference === semantic("relation", "server-context"))
      .map(({ graphicId }) => graphicId),
    ["server"],
  );
  assert.deepEqual(
    page.carriers.find(({ assertionId }) => assertionId === "context-claim").graphicIds,
    ["client-a", "client-b"],
  );
  const { carriers } = composeAuthoredStaticCanvas(aggregatedMeaning(staticMeaning, "context"));
  const graphics = new Map(carriers.relationGraphics);
  assert.deepEqual(graphics.get(semantic("relation", "client-context")), [
    "node:client-a",
    "node:client-b",
  ]);
  assert.deepEqual(graphics.get(semantic("relation", "server-context")), ["node:server"]);
  assert.deepEqual(
    carriers.assertions.find(({ assertionId }) => assertionId === "context-claim").graphicIds,
    ["text:client-context-label", "node:client-a", "node:client-b"],
  );
});
