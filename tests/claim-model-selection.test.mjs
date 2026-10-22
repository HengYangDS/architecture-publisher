import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";

import fs from "node:fs/promises";

import path from "node:path";

import test from "node:test";

import { fileURLToPath } from "node:url";

import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../packages/publisher/src/compiler/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import { composeStaticEditionScene } from "../packages/publisher/src/scene/index.mjs";

import { validateVisibleSelection } from "../packages/publisher/src/compiler/coverage.mjs";

import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/index.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import { composeStaticSelectionLayout } from "../packages/publisher/src/scene/static/selection.mjs";

import {
  figureIcons,
  sha,
  modelNamespace,
  fixture,
  groupedMixedFixture,
} from "./fixtures/claim-selection.mjs";

test("native Claim Model selection retains a typed claim rather than a bare arrow", async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const assertion = meaning.native.selections[0];
  assert.equal(assertion.format, "architecture.claim-model/v2");
  assert.equal(assertion.sourceClass, "native");
  assert.equal(assertion.target.kind, "claim");
  assert.equal(assertion.members.claims[0].plane, "intended");
  assert.deepEqual(assertion.members.claims[0].condition, { authorization: "granted" });
  assert.deepEqual(assertion.members.claims[0].dependsOn, [
    { section: "relations", id: "request" },
  ]);
  assert.deepEqual(assertion.members.claims[0].provenance, ["contract"]);
  assert.equal(assertion.predicate.valueKind, "entity");
  assert.equal(assertion.predicate.cardinality, "single");
  assert.deepEqual(assertion.provenanceSources.contract, selected.model.sources.contract);
  assert(meaning.limits.includes("claim-model-provenance-unverified"));
});

test("claim-only static composition admits neither mixed parsers nor unbound assertions", async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  assert.equal(composeStaticEditionScene(meaning, null).claimCards.length, 1);
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.doesNotMatch(svg, /READING GROUPS/u);

  const mixed = structuredClone(meaning);
  mixed.native.selections.push({
    ...structuredClone(mixed.native.selections[0]),
    selectionId: "foreign-format",
    format: "likec4/dsl",
  });
  assert.throws(() => composeStaticEditionScene(mixed, null), {
    code: "edition_scene_claim_model_unadmitted",
  });
  const grouped = structuredClone(meaning);
  grouped.editorial.presentation.static.views[0].groups = [];
  assert.throws(() => composeStaticEditionScene(grouped, null), {
    code: "static_scene_group_unadmitted",
  });
  const unknownAssertion = structuredClone(meaning);
  unknownAssertion.media.static.views[0].assertionIds = ["not-selected"];
  assert.throws(() => composeStaticEditionScene(unknownAssertion, null), {
    code: "static_scene_assertion_unbound",
  });
  const unboundSelection = structuredClone(meaning);
  unboundSelection.assertions[0].selection = "not-selected";
  assert.throws(() => composeStaticEditionScene(unboundSelection, null), {
    code: "static_scene_assertion_unbound",
  });
});

test("a claim-only static view ignores structural selections belonging to its sibling", async (t) => {
  const model = claimModel();
  model.claims.published.dependsOn = [];
  const selected = await fixture(t, { model, reference: "claim:published" });
  selected.project.questions.push({
    id: "structure",
    audience: "maintainer",
    text: "Which client calls the server?",
  });
  selected.project.scope.selections.push({
    id: "selected-relation",
    namespace: modelNamespace,
    kind: "reference",
    reference: "relation:request",
    questions: ["structure"],
  });
  selected.project.presentation.static.views.push({ id: "structure", questions: ["structure"] });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const statementView = {
    ...meaning,
    editorial: {
      ...meaning.editorial,
      presentation: {
        ...meaning.editorial.presentation,
        static: {
          ...meaning.editorial.presentation.static,
          views: [meaning.editorial.presentation.static.views[0]],
        },
      },
    },
    media: {
      ...meaning.media,
      static: { ...meaning.media.static, views: [meaning.media.static.views[0]] },
    },
  };
  const scene = composeStaticEditionScene(statementView, null);
  assert.deepEqual(scene.nodes, []);
  assert.deepEqual(scene.edges, []);
  assert.deepEqual(
    scene.claimCards.map(({ id }) => id),
    ["published"],
  );
  assert.deepEqual(
    scene.sourceAssertionCarriers.map(({ assertionId }) => assertionId),
    ["selected-claim"],
  );
  assert.deepEqual(
    meaning.native.selections.find(({ selectionId }) => selectionId === "selected-claim").members
      .claims[0].dependsOn,
    [],
  );
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.deepEqual(
    candidate.obligations.static.views.map(({ id }) => id),
    ["overview", "structure"],
  );
  assert.equal((svg.match(/data-static-view=/gu) ?? []).length, 2);
  assert.match(svg, /The client is available to operators\./u);
  assert.match(svg, /data-graphic-id="static-view-1-r-0"/u);
  assert(candidate.limits.includes("claim-model-provenance-unverified"));
});

test("pure static claims size their complete content independently of absent structure", async (t) => {
  const model = claimModel();
  const value = {
    label: "Replaceable capabilities",
    surface: "overview",
    text: "People and Agents compose replaceable capabilities without taking ownership of repository truth. ".repeat(
      6,
    ),
  };
  model.claims.published.value = value;
  model.claims.published.dependsOn = [];
  const selected = await fixture(t, { model, reference: "claim:published" });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeStaticEditionScene(meaning, null);
  const rendered = composeStaticEditionSvg(scene, { icons: figureIcons, fragment: true });
  assert.deepEqual(scene.nodes, []);
  assert.deepEqual(scene.edges, []);
  assert.deepEqual(
    rendered.carriers.claims.map(({ source }) => source.reference),
    ["published"],
  );
  const painted = [...rendered.parts.claim.markup.matchAll(/<text[^>]*>(.*?)<\/text>/gu)]
    .map(([, text]) => text)
    .join("");
  assert.match(painted, /Replaceable capabilities/u);
  assert.match(painted, /overview/u);
  assert.equal((painted.match(/repository truth\./gu) ?? []).length, 6);
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "static", scene, rendered.carriers));
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const published = [...svg.matchAll(/<text[^>]*>(.*?)<\/text>/gu)]
    .map(([, text]) => text)
    .join("");
  assert.equal((published.match(/repository truth\./gu) ?? []).length, 6);
  assert.deepEqual(meaning.native.selections[0].members.claims[0].value, value);
  assert.deepEqual(meaning.native.selections[0].members.claims[0].dependsOn, []);
});

test("a Claim Model structural Scene cannot borrow an upstream view identity", async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = structuredClone(composeStaticSelectionLayout(meaning));
  assert.equal(layout.view, null);
  layout.view = { namespace: modelNamespace, id: "invented", sha256: "a".repeat(64) };
  assert.throws(() => composeStaticEditionScene(meaning, layout), {
    code: "static_scene_native_membership_mismatch",
  });
});

test("neutral Claim Model layout carries a plain relation on its visible edge, not a duplicate ledger", async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(layout.edges.length, 1);
  assert.equal(layout.edges[0].caption?.text, "calls");
  assert.equal(layout.edges[0].caption?.point.length, 2);

  const scene = composeStaticEditionScene(meaning, layout);
  const rendered = composeStaticEditionSvg(scene, {
    icons: figureIcons,
    idPrefix: "probe-",
    fragment: true,
  });
  assert.match(rendered.parts.graph, /data-graphic-id="probe-r-0"[\s\S]*?>calls<\/text>/u);
  assert.deepEqual(rendered.parts.relations, []);
  assert.deepEqual(
    rendered.carriers.relations.map(({ graphicId }) => graphicId),
    ["probe-r-0"],
  );
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "static", scene, rendered.carriers));
});

test("a long source relation type remains visible in the ledger when it cannot fit on an edge", async (t) => {
  const model = claimModel();
  const kind = "publishes-a-resource-to-an-independent-forge";
  model.vocabulary.relations = [kind];
  model.relations.request.type = kind;
  model.vocabulary.predicates[kind] = model.vocabulary.predicates.calls;
  delete model.vocabulary.predicates.calls;
  for (const claim of Object.values(model.claims))
    if (claim.predicate === "calls") claim.predicate = kind;
  const selected = await groupedMixedFixture(t, { model });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  assert.equal(layout.edges[0].caption, undefined);
  const scene = composeStaticEditionScene(meaning, layout);
  const rendered = composeStaticEditionSvg(scene, { icons: figureIcons, fragment: true });
  assert.match(rendered.parts.relations[0].text, /publishes-a-resource-to-an-independent-forge/u);
});

test("an invalid edge caption fails with a typed renderer error before bounds projection", async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  const scene = composeStaticEditionScene(meaning, layout);
  for (const mutate of [
    (edge) => (edge.caption = null),
    (edge) => (edge.caption.box = null),
    (edge) => (edge.caption.box.w = 0),
    (edge) => (edge.caption.point = null),
    (edge) => (edge.caption.point = [0]),
    (edge) => (edge.caption.point = [NaN, 0]),
    (edge) => (edge.caption.point[0] = edge.caption.box.x - 1),
    (edge) => (edge.caption.point[0] = edge.caption.box.x + edge.caption.box.w + 1),
    (edge) => (edge.caption.point[1] = edge.caption.box.y - 1),
    (edge) => (edge.caption.point[1] = edge.caption.box.y + edge.caption.box.h + 1),
    (edge) => (edge.caption.text = "forged relation"),
  ]) {
    const invalid = structuredClone(scene);
    mutate(invalid.edges[0]);
    assert.throws(() => composeStaticEditionSvg(invalid, { icons: figureIcons }), {
      code: "static_edition_relation_caption_invalid",
    });
  }
  const malformedLayout = structuredClone(layout);
  malformedLayout.edges[0].caption.box = null;
  assert.throws(() => composeStaticEditionScene(meaning, malformedLayout), {
    code: "static_scene_geometry_invalid",
  });
});

test("a condition change alters selected meaning without changing graph cardinality", async (t) => {
  const first = await fixture(t);
  const changedModel = claimModel();
  changedModel.claims.intended.condition.authorization = "denied";
  const changed = await fixture(t, { model: changedModel });
  const changedPlaneModel = claimModel();
  changedPlaneModel.claims.intended.plane = "observed";
  const changedPlane = await fixture(t, { model: changedPlaneModel });
  const before = await compileEditionMeaning(
    await materializeBuildRequestInput(first.requestPath, first.requestSha256),
  );
  const after = await compileEditionMeaning(
    await materializeBuildRequestInput(changed.requestPath, changed.requestSha256),
  );
  const afterPlane = await compileEditionMeaning(
    await materializeBuildRequestInput(changedPlane.requestPath, changedPlane.requestSha256),
  );
  assert.equal(
    Object.keys(first.model.entities).length,
    Object.keys(changed.model.entities).length,
  );
  assert.equal(
    Object.keys(first.model.relations).length,
    Object.keys(changed.model.relations).length,
  );
  assert.notEqual(after.native.semanticDigest, before.native.semanticDigest);
  assert.notEqual(afterPlane.native.semanticDigest, before.native.semanticDigest);
});

test("unknown coverage and missing Claim Model IDs cannot masquerade as complete scope", async (t) => {
  const unknown = await fixture(t, { reference: "claim:published" });
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(unknown.requestPath, unknown.requestSha256),
  );
  assert(meaning.limits.includes("claim-coverage-unknown:published"));
  const missing = await fixture(t, { reference: "claim:absent" });
  const selected = await materializeBuildRequestInput(missing.requestPath, missing.requestSha256);
  await assert.rejects(compileEditionMeaning(selected), (error) => {
    assert.equal(error.code, "native_claim_model_reference_unselected");
    assert.deepEqual(error.diagnostics, [
      {
        code: error.code,
        severity: "error",
        message: "Selected Claim Model reference is absent from the bound model.",
        predicate: "selected-reference-resolves",
        subject: {
          kind: "edition-source-reference",
          editionId: missing.project.id,
          editionSha256: selected.lock.edition.sha256,
          selectionId: "selected-claim",
          namespace: modelNamespace,
          reference: "claim:absent",
          sourceSha256: selected.lock.sources[0].sha256,
        },
        responsibility: { role: "edition-editor", declaredOwner: missing.project.editor },
        evidence: {},
        supportedFixes: [],
      },
    ]);
    return true;
  });
});

test("public Edition build returns a local, non-authorizing missing-reference diagnostic", async (t) => {
  const missing = await fixture(t, { reference: "claim:absent" });
  const output = path.join(missing.root, "candidate");
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url)),
      "edition",
      "build",
      missing.requestPath,
      "--sha256",
      missing.requestSha256,
      "--output",
      output,
    ],
    { cwd: missing.root, encoding: "utf8", timeout: 30_000 },
  );
  assert.equal(result.status, 1, result.stderr);
  const response = JSON.parse(result.stdout);
  assert.equal(response.error.code, "native_claim_model_reference_unselected");
  assert.deepEqual(
    response.error.diagnostics?.map(({ subject, responsibility, predicate }) => ({
      subject,
      responsibility,
      predicate,
    })),
    [
      {
        subject: {
          kind: "edition-source-reference",
          editionId: missing.project.id,
          editionSha256: sha(await fs.readFile(path.join(missing.root, "edition/project.json"))),
          selectionId: "selected-claim",
          namespace: modelNamespace,
          reference: "claim:absent",
          sourceSha256: sha(await fs.readFile(path.join(missing.root, "sources/model.json"))),
        },
        responsibility: { role: "edition-editor", declaredOwner: missing.project.editor },
        predicate: "selected-reference-resolves",
      },
    ],
  );
  assert.equal(JSON.stringify(response).includes(missing.root), false);
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
});

test("public Edition build attributes an unanswered authored view to its editor", async (t) => {
  const selected = await fixture(t);
  selected.project.presentation.static.views.push({ id: "detail", questions: ["condition"] });
  selected.project.omissions.push({
    medium: "static",
    view: "overview",
    coveredIn: "detail",
    selection: "selected-claim",
    question: "condition",
    disposition: "covered-elsewhere",
    reason: "The detail view carries the source assertion.",
  });
  const editionPath = path.join(selected.root, "edition/project.json");
  await fs.writeFile(editionPath, JSON.stringify(selected.project) + "\n");
  const nativePath = path.join(selected.root, "sources/model.json");
  const nativeBefore = sha(await fs.readFile(nativePath));
  const output = path.join(selected.root, "candidate");
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url)),
      "edition",
      "build",
      selected.requestPath,
      "--sha256",
      selected.requestSha256,
      "--output",
      output,
    ],
    { cwd: selected.root, encoding: "utf8", timeout: 30_000 },
  );
  assert.equal(result.status, 1, result.stderr);
  const response = JSON.parse(result.stdout);
  assert.equal(response.error.code, "materialized_view_question_unanswered");
  assert.deepEqual(
    response.error.diagnostics?.map(({ subject, responsibility, predicate }) => ({
      subject,
      responsibility,
      predicate,
    })),
    [
      {
        subject: {
          kind: "edition-view-question",
          editionId: selected.project.id,
          editionSha256: sha(await fs.readFile(editionPath)),
          medium: "static",
          viewId: "overview",
          questionId: "condition",
          omissions: [
            {
              selection: "selected-claim",
              disposition: "covered-elsewhere",
              coveredIn: "detail",
            },
          ],
        },
        responsibility: { role: "edition-editor", declaredOwner: selected.project.editor },
        predicate: "view-question-answered",
      },
    ],
  );
  assert.equal(JSON.stringify(response).includes(selected.root), false);
  assert.equal(sha(await fs.readFile(nativePath)), nativeBefore);
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
});
