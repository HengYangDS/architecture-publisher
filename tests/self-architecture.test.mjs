import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { readSourceBundle } from "../packages/publisher/src/source/bundle.mjs";
import { validateEditionProject } from "../packages/publisher/src/edition/authoring.mjs";
import { validateClaimModel } from "../packages/publisher/src/semantics/document.mjs";
import { SELF_ENTITY_IDS } from "../editions/self/src/edition/entities.mjs";
import { root, request, directedPath } from "./fixtures/self-edition.mjs";

test("the first-party self Edition covers the complete product chain and authority boundaries", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, "prepared");
  const prepared = await prepareArchitecturePublisherEdition(await request(output));
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256),
    members = new Map(bundle.members.map((member) => [member.path, member.content])),
    model = validateClaimModel(JSON.parse(members.get("semantic.json"))),
    project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, "utf8")));

  const installedVersion = JSON.parse(
    await fs.readFile(path.join(root, "packages/publisher/package.json"), "utf8"),
  ).version;
  assert.equal(prepared.selectedCoreVersion, installedVersion);
  assert.equal(project.id, "architecture-publisher-self");
  assert.equal(project.editor, model.owner);
  assert.deepEqual(project.omissions, []);
  for (const [claim, field, value] of [
    ["role-static-artifact", "delivery", "static-6000px"],
    ["role-interactive-artifact", "delivery", "standalone-html"],
    ["flow-backend-renders-static", "delivery", "static-6000px"],
    ["flow-backend-renders-interactive", "delivery", "standalone-html"],
    ["flow-static-enters-candidate", "artifact", "static"],
    ["flow-interactive-enters-candidate", "artifact", "interactive"],
  ])
    assert.equal(model.claims[claim].condition[field], value);
  assert.equal(
    project.scope.selections.filter(({ reference }) => reference.startsWith("claim:")).length,
    Object.keys(model.claims).length,
  );
  for (const id of [
    "accepted-intent",
    "implementation",
    "runtime-observation",
    "evidence",
    "source-adapter",
    "source-bundle",
    "claim-model",
    "uncertainty",
    "edition",
    "build-request",
    "static-scene",
    "interactive-scenes",
    "static-artifact",
    "interactive-artifact",
    "edition-candidate",
    "qualification-set",
    "acceptance",
    "authorization",
    "publication",
    "self-consumer",
    "ethos-consumer",
    "aigw-consumer",
    "feedback",
    "evolution-inputs",
    "semantic-delta",
    "affected-views",
    "rebuild-obligations",
    "semantic-verification-obligations",
    "medium-verification-obligations",
    "human-review-obligations",
    "acceptance-obligations",
    "publication-obligations",
  ])
    assert(model.entities[id], `missing complete self-model entity: ${id}`);
  const connected = new Set(
    Object.values(model.relations).flatMap(({ subject, object }) => [subject, object]),
  );
  assert.deepEqual(
    SELF_ENTITY_IDS.filter((id) => !connected.has(id)),
    [],
    "the self-model must not contain decorative or disconnected entities",
  );
  for (const id of [
    "core-compiles-static",
    "core-compiles-interactive",
    "uncertainty-broadens-edition",
    "publication-returns-feedback",
    "feedback-returns-to-adapter",
    "recovery-excludes-off-host",
    "static-scene-enters-renderer",
    "interactive-scenes-enter-renderer",
    "models-enter-evolution",
    "edition-enters-evolution",
    "evolution-produces-delta",
    "delta-identifies-affected-views",
    "affected-views-require-rebuild",
    "affected-views-require-semantic-verification",
    "affected-views-require-medium-verification",
    "affected-views-require-human-review",
    "affected-views-require-acceptance",
    "affected-views-require-publication",
    "rebuild-renews-static",
    "rebuild-renews-interactive",
    "semantic-verification-renews-claims",
    "medium-verification-renews-qualification",
    "human-review-obligation-renews-review",
    "acceptance-obligation-renews-acceptance",
    "publication-obligation-renews-publication",
  ])
    assert(model.relations[id], `missing complete self-model relation: ${id}`);
  assert.deepEqual(directedPath(model.relations, "edition", "static-artifact"), [
    "edition-authors-static",
    "static-scene-enters-renderer",
    "backend-renders-static",
  ]);
  assert.deepEqual(directedPath(model.relations, "edition", "interactive-artifact"), [
    "edition-authors-interactive",
    "interactive-scenes-enter-renderer",
    "backend-renders-interactive",
  ]);
  assert.deepEqual(directedPath(model.relations, "evolution-inputs", "rebuild-obligations"), [
    "evolution-produces-delta",
    "delta-identifies-affected-views",
    "affected-views-require-rebuild",
  ]);
  assert.deepEqual(
    directedPath(model.relations, "evolution-inputs", "medium-verification-obligations"),
    [
      "evolution-produces-delta",
      "delta-identifies-affected-views",
      "affected-views-require-medium-verification",
    ],
  );
  const role = (id) => model.claims["role-" + id],
    flow = (id) => model.claims["flow-" + id];
  for (const id of ["ethos-consumer", "aigw-consumer"]) {
    assert.deepEqual(
      [role(id).plane, role(id).maturity, role(id).provenance],
      ["intended", "target", ["product-contract"]],
      "historical adopter handoffs cannot prove current successor adoption",
    );
  }
  for (const id of ["publication-serves-ethos", "publication-serves-aigw"]) {
    assert.deepEqual(
      [flow(id).plane, flow(id).maturity, flow(id).provenance],
      ["intended", "target", ["product-contract"]],
      "the target service relation must not inherit an old adopter observation",
    );
  }
  assert.deepEqual(flow("publication-serves-self").condition, {
    acceptance: "exact-candidate-required",
  });
  assert.equal(model.sources["ethos-source-owned-handoff"], undefined);
  assert.equal(model.sources["aigw-source-owned-handoff"], undefined);
  assert.deepEqual(
    [role("static-artifact").plane, role("static-artifact").maturity],
    ["intended", "target"],
    "the selected source model does not treat renderer implementation as an existing accepted artifact",
  );
  assert.deepEqual(
    [role("interactive-artifact").plane, role("interactive-artifact").maturity],
    ["implemented", "implemented"],
  );
  assert.deepEqual(
    [
      flow("acceptance-precedes-authorization").plane,
      flow("acceptance-precedes-authorization").maturity,
    ],
    ["intended", "target"],
    "the current file publisher must not be presented as qualification-gated",
  );
  assert.equal(role("runtime-observation").plane, "intended");
  assert.equal(role("publisher-core").plane, "implemented");
  assert.equal(
    model.sources["installed-test-owner"]?.authority,
    "Installed-use test implementation; not an execution observation",
  );
  assert.equal(model.sources["installed-evidence"], undefined);
  assert.deepEqual(
    project.presentation.interactive.views.map(({ id }) => id),
    [
      "overview",
      "semantics",
      "edition",
      "composition",
      "qualification",
      "publication-recovery",
      "adoption",
      "evolution",
    ],
  );
  assert.equal(project.presentation.static.width, 6000);
  assert.equal(project.presentation.static.views[0].id, "system-map");
  assert.notDeepEqual(
    project.presentation.static.views[0].groups,
    project.presentation.interactive.views[0].groups,
  );
  assert.equal(project.visualPolicy.override, "refinement.json");
  assert.equal(model.context.selfUse, true);
  assert.equal(model.context.independentAdopterEvidence, false);
  assert.equal(prepared.adoptionRole, "self-hosted");
  assert.equal(prepared.humanAcceptance, "not-performed");
});

test("self Project gives the static map structural scope and interactive pages exact claims", async (t) => {
  const self = await import("../editions/self/src/edition/index.mjs");
  const parent = await fs.mkdtemp(path.join(root, "build/test-work/self-project-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await self.prepareArchitecturePublisherEdition(
    await request(path.join(parent, "prepared")),
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const modelBytes = bundle.members.find(({ path: name }) => name === "semantic.json").content;
  const model = validateClaimModel(JSON.parse(modelBytes));
  const project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, "utf8")));
  assert.deepEqual(project, self.projectFromSelfModel(model));
  assert.deepEqual(
    project.presentation.static.views.map(({ id }) => id),
    ["system-map"],
  );
  assert.deepEqual(
    project.presentation.interactive.views.map(({ id }) => id),
    [
      "overview",
      "semantics",
      "edition",
      "composition",
      "qualification",
      "publication-recovery",
      "adoption",
      "evolution",
    ],
  );
  const { deriveEditionQuestionObligations } =
    await import("../packages/publisher/src/edition/selection.mjs");
  const obligations = deriveEditionQuestionObligations(project, ["static", "interactive"]);
  const structuralCount = Object.keys(model.entities).length + Object.keys(model.relations).length;
  assert.equal(obligations.static.assertionIds.length, structuralCount);
  assert.equal(obligations.static.assertionIds.filter((id) => id.startsWith("claim-")).length, 0);
  assert.equal(
    obligations.interactive.assertionIds.filter((id) => id.startsWith("claim-")).length,
    Object.keys(model.claims).length,
  );
  const metrics = bundle.members.find(
    ({ path: name }) => name === model.sources["self-static-metrics"].locator,
  ).content;
  const refinement = self.refinementFromSelfProject(model, project, metrics);
  assert.equal(refinement.schema, "architecture.scene-refinement/v1");
  assert.equal(refinement.media.static.kind, "authored-canvas");
  assert.equal(refinement.media.static.scene.requiredSemanticIds.length, structuralCount);
  assert.deepEqual(
    refinement.media.interactive.pages.map(({ id }) => id),
    project.presentation.interactive.views.map(({ id }) => id),
  );
  const scene = refinement.media.static.scene;
  assert.match(scene.description, /^Target flow:/u);
  assert(scene.texts.some(({ text }) => text === "Edition Project"));
  assert.doesNotMatch(scene.description, /selected Source Bundle/u);
  assert(
    scene.texts.some(
      ({ id, text }) => id === "target-caveat" && text.includes("Target architecture"),
    ),
  );
  const relation = (id) => JSON.stringify(["architecture-publisher/self", "relation", id]);
  const renewal = scene.edges.find(({ id }) => id === "evolution-4");
  assert.equal(renewal?.source, "affected-views");
  assert.equal(renewal.target, "review-publication");
  assert.deepEqual(renewal.semanticIds, [
    relation("affected-views-require-human-review"),
    relation("affected-views-require-acceptance"),
    relation("affected-views-require-publication"),
  ]);
  const { auditScene, auditEmittedEdges } =
    await import("../packages/publisher/src/qualification/index.mjs");
  const { renderAuthoredCanvasSvg } = await import("../packages/publisher/renderers/svg/index.mjs");
  const { loadBundledFonts } = await import("../packages/publisher/renderers/fonts/index.mjs");
  const { createBundledTextMeasurer } =
    await import("../packages/publisher/renderers/resvg/measurement.mjs");
  const { authoredCanvasFramingRequest } =
    await import("../packages/publisher/renderers/svg/canvas.mjs");
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...scene.texts,
    authoredCanvasFramingRequest(project.editor),
    authoredCanvasFramingRequest("A".repeat(500)),
  ]);
  assert.throws(() => renderAuthoredCanvasSvg(scene), {
    code: "authored_canvas_editor_invalid",
  });
  assert.throws(() => renderAuthoredCanvasSvg(scene, project.editor), {
    code: "authored_canvas_measurer_required",
  });
  assert.throws(() => renderAuthoredCanvasSvg(scene, "A".repeat(500), measurer), {
    code: "authored_canvas_framing_unrepresentable",
  });
  const svg = renderAuthoredCanvasSvg(scene, project.editor, measurer).toString("utf8");
  assert.match(
    svg,
    /role="img" aria-labelledby="canvas-title" aria-describedby="canvas-description"/u,
  );
  assert(
    svg.includes(
      `<desc id="canvas-description">${scene.description} Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here</desc>`,
    ),
  );
  assert.match(
    renderAuthoredCanvasSvg(
      { ...scene, description: "A & B <C>" },
      project.editor,
      measurer,
    ).toString("utf8"),
    /<desc id="canvas-description">A &amp; B &lt;C&gt; Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here<\/desc>/u,
  );
  assert.throws(
    () => renderAuthoredCanvasSvg({ ...scene, description: "" }, project.editor, measurer),
    {
      code: "authored_canvas_description_invalid",
    },
  );
  const malformed = structuredClone(refinement);
  malformed.media.static.scene.description = "";
  const { sceneRefinementValid } =
    await import("../packages/publisher/src/edition/generated/validators.mjs");
  assert.equal(sceneRefinementValid(malformed), false);
  const withoutDescription = structuredClone(scene);
  delete withoutDescription.description;
  assert(
    renderAuthoredCanvasSvg(withoutDescription, project.editor, measurer)
      .toString("utf8")
      .includes(
        `<desc id="canvas-description">${scene.subtitle} Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here</desc>`,
      ),
  );
  const auditPolicy = {
    minimumFont: 10,
    ownerClearance: 8,
    textClearance: 5,
    textToTextClearance: 5,
    endpointTolerance: 1,
    minimumTerminal: 14,
    widthGrowth: 0.04,
    heightGrowth: 0.04,
  };
  assert.deepEqual(auditScene(scene, auditPolicy).failures, []);
  assert.deepEqual(auditEmittedEdges(svg, scene, auditPolicy).failures, []);
  const changedMetrics = Buffer.from(metrics);
  changedMetrics[0] ^= 1;
  assert.throws(() => self.refinementFromSelfProject(model, project, changedMetrics), {
    code: "self_refinement_metric_mismatch",
  });
  const { materializeBuildRequestInput } =
    await import("../packages/publisher/src/compiler/build-input.mjs");
  const { compileEditionMeaning } = await import("../packages/publisher/src/compiler/meaning.mjs");
  const selected = await materializeBuildRequestInput(
    prepared.buildRequest,
    prepared.buildRequestSha256,
  );
  const meaning = await compileEditionMeaning(selected);
  assert.deepEqual(
    meaning.media.static.views.map(({ id }) => id),
    ["system-map"],
  );
  assert.equal(
    meaning.media.static.views[0].assertionIds.filter((id) => id.startsWith("claim-")).length,
    0,
  );
  const { compileEditionCandidateInput } =
    await import("../packages/publisher/src/compiler/index.mjs");
  const candidateRoot = path.join(parent, "candidate");
  const built = await compileEditionCandidateInput(
    prepared.buildRequest,
    prepared.buildRequestSha256,
    candidateRoot,
  );
  assert.deepEqual(built.media.sort(), ["interactive", "static"]);
  const candidate = JSON.parse(
    await fs.readFile(path.join(candidateRoot, "candidate.json"), "utf8"),
  );
  assert.equal(
    candidate.limits.includes("authored-canvas-claim-facts-not-exhaustively-painted"),
    false,
  );
  const png = await fs.readFile(path.join(candidateRoot, "static/architecture.png"));
  assert.equal(png.readUInt32BE(16), 6000);
  const staticSvg = await fs.readFile(path.join(candidateRoot, "static/architecture.svg"), "utf8");
  assert.match(
    staticSvg,
    /<text[^>]+data-role="editorial-framing"[^>]*>Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here<\/text>/u,
  );
  const html = await fs.readFile(path.join(candidateRoot, "interactive/architecture.html"));
  assert.match(
    html.toString("utf8"),
    /<p class="editorial-framing">Editorial framing by architecture-publisher:self-edition · source endorsement not evidenced here<\/p>/u,
  );
  assert.equal(html.includes(modelBytes), false);
  const atlasMatch = html
    .toString("utf8")
    .match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    );
  assert(atlasMatch);
  const atlas = JSON.parse(atlasMatch[1]);
  assert.deepEqual(
    atlas.order,
    project.presentation.interactive.views.map(({ id }) => id),
  );
  assert(Object.values(atlas.pages).every(({ sourceIds }) => sourceIds.length > 0));
  assert(Object.values(atlas.sources).every((source) => !Object.hasOwn(source, "base64")));
});
