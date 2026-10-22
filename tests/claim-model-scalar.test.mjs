import assert from "node:assert/strict";
import { interactiveDocument, interactivePage } from "./fixtures/interactive-member.mjs";

import fs from "node:fs/promises";

import path from "node:path";

import test from "node:test";

import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../packages/publisher/src/compiler/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import {
  composeInteractiveEditionScene,
  composeStaticEditionScene,
} from "../packages/publisher/src/scene/index.mjs";

import { validateVisibleSelection } from "../packages/publisher/src/compiler/coverage.mjs";

import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/index.mjs";

import { projectInteractivePage } from "../packages/publisher/renderers/interactive/model.mjs";

import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/edition.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import { composeStaticSelectionLayout } from "../packages/publisher/src/scene/static/selection.mjs";

import {
  figureIcons,
  modelNamespace,
  groupedMixedFixture,
  twoRelationClaimModel,
} from "./fixtures/claim-selection.mjs";

async function mixedScalarFixture(t) {
  const model = claimModel();
  model.claims["other-status"] = {
    ...structuredClone(model.claims.observed),
    subject: "other",
    dependsOn: [{ section: "entities", id: "other" }],
  };
  const selected = await groupedMixedFixture(t, { model });
  selected.project.scope.selections.push({
    id: "selected-scalar",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:other-status",
    questions: ["condition"],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  return selected;
}

test("a mixed page carries a scalar claim on its own source subject without inventing an edge", async (t) => {
  const selected = await mixedScalarFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const staticScene = composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning));
  assert.equal(staticScene.nodes.length, 2);
  assert.equal(staticScene.edges.length, 1);
  assert.equal(staticScene.claimCards.length, 2);
  assert.deepEqual(staticScene.claimSubjectLinks, [
    {
      claimAssertionId: "selected-scalar",
      subject: {
        namespace: modelNamespace,
        id: "other",
        sha256: meaning.native.selections[0].source.sha256,
      },
    },
  ]);
  const staticRendered = composeStaticEditionSvg(staticScene, { icons: figureIcons });
  assert.match(staticRendered.bytes.toString("utf8"), /ON SOURCE ENTITY/u);
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, "static", staticScene, staticRendered.carriers),
  );

  const claimAssertionIds = new Set(
    meaning.assertions
      .filter(
        ({ selection }) =>
          meaning.native.selections.find(({ selectionId }) => selectionId === selection)?.target
            .kind === "claim",
      )
      .map(({ id }) => id),
  );
  for (const [name, mutate] of [
    [
      "duplicate claim card",
      (value) => value.scene.claimCards.push(structuredClone(value.scene.claimCards[0])),
    ],
    [
      "unselected claim card",
      (value) => value.scene.claimCards.push({ ...value.scene.claimCards[0], id: "invented" }),
    ],
    [
      "non-claim assertion borrows a claim",
      (value) => {
        const carrier = value.scene.sourceAssertionCarriers.find(
          ({ assertionId }) => !claimAssertionIds.has(assertionId),
        );
        carrier.claimRefs = structuredClone(
          value.scene.sourceAssertionCarriers.find(({ assertionId }) =>
            claimAssertionIds.has(assertionId),
          ).claimRefs,
        );
      },
    ],
    [
      "claim assertion hides its claim reference",
      (value) => {
        delete value.scene.sourceAssertionCarriers.find(({ assertionId }) =>
          claimAssertionIds.has(assertionId),
        ).claimRefs;
      },
    ],
    [
      "malformed selected claim",
      (value) => {
        value.meaning.native.selections.find(
          ({ target }) => target.kind === "claim",
        ).members.claims = [];
      },
    ],
    [
      "selected relation loses every claim card",
      (value) => {
        delete value.scene.claimCards;
        delete value.carriers.claims;
      },
    ],
    ["relation claim loses its source link", (value) => (value.scene.claimRelationLinks = [])],
    ["scalar claim loses its subject link", (value) => (value.scene.claimSubjectLinks = [])],
  ]) {
    const value = {
      meaning: structuredClone(meaning),
      scene: structuredClone(staticScene),
      carriers: structuredClone(staticRendered.carriers),
    };
    mutate(value);
    assert.throws(
      () => validateVisibleSelection(value.meaning, "static", value.scene, value.carriers),
      { code: "edition_visible_coverage_mismatch" },
      name,
    );
  }

  const interactiveScene = composeInteractiveEditionScene(meaning);
  const page = interactiveScene.pages[0];
  assert.equal(page.nodes.length, 2);
  assert.equal(page.relations.length, 1);
  assert.deepEqual(page.claimSubjectLinks, staticScene.claimSubjectLinks);
  const projected = projectInteractivePage(page, 0);
  assert(projected.publicPage.claims.some(({ sourceAnchor }) => sourceAnchor === "entity"));
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, "interactive", interactiveScene, [projected.carriers]),
  );

  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const document = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  const html = interactivePage(document);
  const facts = interactiveDocument(document).pages.overview.facts;
  assert(
    facts.some(({ facts }) =>
      facts.some(({ label, value }) => label === "Subject" && value.startsWith("other")),
    ),
  );
  assert.match(html, /healthy/u);
  assert.match(html, /other/u);
});

test("a mixed scalar claim cannot forge or lose its subject dependency", async (t) => {
  const selected = await mixedScalarFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const wrongDependency = structuredClone(meaning);
  wrongDependency.native.selections.find(
    ({ target }) => target.id === "other-status",
  ).members.claims[0].dependsOn = [{ section: "entities", id: "server" }];
  assert.throws(() => composeInteractiveEditionScene(wrongDependency), {
    code: "interactive_scene_claim_relation_unbound",
  });
  for (const [change, code] of [
    [
      (selection) => {
        selection.members.elements[0] = null;
      },
      "edition_claim_card_invalid",
    ],
    [
      (selection) => {
        selection.members.claims[0].dependsOn = [null];
      },
      "interactive_scene_claim_relation_unbound",
    ],
  ]) {
    const malformed = structuredClone(meaning);
    change(malformed.native.selections.find(({ target }) => target.id === "other-status"));
    assert.throws(() => composeInteractiveEditionScene(malformed), { code });
  }
  const scene = structuredClone(
    composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning)),
  );
  const missing = structuredClone(scene);
  delete missing.claimSubjectLinks;
  assert.throws(() => composeStaticEditionSvg(missing, { icons: figureIcons }), {
    code: "static_edition_claim_relation_invalid",
  });
  const interactive = composeInteractiveEditionScene(meaning);
  const projected = projectInteractivePage(interactive.pages[0], 0);
  const missingInteractive = structuredClone(interactive);
  delete missingInteractive.pages[0].claimSubjectLinks;
  assert.throws(
    () =>
      validateVisibleSelection(meaning, "interactive", missingInteractive, [projected.carriers]),
    { code: "edition_visible_coverage_mismatch" },
  );
  scene.claimSubjectLinks[0].subject.id = "invented";
  const rendered = composeStaticEditionSvg(scene, { icons: figureIcons });
  assert.throws(() => validateVisibleSelection(meaning, "static", scene, rendered.carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("a selected relation can publish structural media without inventing claim status", async (t) => {
  const model = claimModel();
  model.relations.request.qualifiers = { "Claim plane": "implemented" };
  const selected = await groupedMixedFixture(t, { model });
  selected.project.scope.selections = selected.project.scope.selections.filter(({ reference }) =>
    reference.startsWith("relation:"),
  );
  selected.project.scope.limits.push({
    question: "condition",
    reason: "Relation topology only; typed claim status is not selected.",
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );

  const output = path.join(selected.root, "candidate");
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.deepEqual(built.media, ["interactive", "static"]);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  for (const [name, medium] of [
    ["svg", svg],
    ["html", html],
  ]) {
    const visible = medium.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ");
    assert(visible.includes("Relation topology only; typed claim status is not selected."), name);
    assert(
      visible.includes(
        "Source-reported topology; provenance unverified; typed claim status not selected.",
      ),
      name,
    );
  }
  const visibleStatic = svg.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ");
  assert.equal(
    (visibleStatic.match(/Source relation qualifiers \(unverified\)/gu) ?? []).length,
    1,
  );
  assert(visibleStatic.includes("Claim plane: implemented"));
  assert(!visibleStatic.includes("Claim plane: implemented · calls"));
  assert(html.includes("Source-reported relation qualifiers · unverified"));
  assert(html.includes("Claim plane: &quot;implemented&quot;"));
  assert(!html.includes("Source relation qualifiers (unverified): Claim plane: implemented"));
  assert(svg.includes("SOURCE RELATIONS"));
  assert(!svg.includes("SOURCE CLAIMS"));
  assert.equal(
    (html.match(/data-logical-relation="true"/gu) ?? []).length,
    1,
    "selected source topology remains visible",
  );
  assert(!html.includes("Source claims"));

  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(scene.pages[0].claimCards, []);
  assert.deepEqual(scene.pages[0].relations[0].sourceQualifiers, [
    { name: "Claim plane", value: '"implemented"' },
  ]);
  const rendered = await renderInteractiveEditionHtml(scene);
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, "interactive", scene, rendered.carriers),
  );
  const inventedClaimLink = structuredClone(scene);
  inventedClaimLink.pages[0].claimRelationLinks = [];
  assert.throws(
    () => validateVisibleSelection(meaning, "interactive", inventedClaimLink, rendered.carriers),
    { code: "edition_visible_coverage_mismatch" },
  );
  const forged = structuredClone(scene);
  forged.pages[0].sourceAssertionCarriers[0].relationRefs[0].reference = "not-selected";
  assert.throws(() => validateVisibleSelection(meaning, "interactive", forged, rendered.carriers), {
    code: "edition_visible_coverage_mismatch",
  });
});

test("relation-only coverage rejects endpoints without the selected relation", async (t) => {
  const selected = await groupedMixedFixture(t);
  selected.project.scope.selections = selected.project.scope.selections.filter(({ reference }) =>
    reference.startsWith("relation:"),
  );
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);

  const staticScene = composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning));
  const staticForged = structuredClone(staticScene);
  staticForged.edges = [];
  staticForged.sourceAssertionCarriers[0].relationRefs = [];
  const staticRendered = composeStaticEditionSvg(staticForged, { icons: figureIcons });
  assert.throws(
    () => validateVisibleSelection(meaning, "static", staticForged, staticRendered.carriers),
    { code: "edition_visible_coverage_mismatch" },
  );

  const interactiveScene = composeInteractiveEditionScene(meaning);
  const interactiveForged = structuredClone(interactiveScene);
  interactiveForged.pages[0].relations = [];
  interactiveForged.pages[0].sourceAssertionCarriers[0].relationRefs = [];
  const interactiveRendered = await renderInteractiveEditionHtml(interactiveForged);
  assert.throws(
    () =>
      validateVisibleSelection(
        meaning,
        "interactive",
        interactiveForged,
        interactiveRendered.carriers,
      ),
    { code: "edition_visible_coverage_mismatch" },
  );
});

test("a mixed page keeps unclaimed relations structural beside linked claims", async (t) => {
  const selected = await groupedMixedFixture(t, { model: twoRelationClaimModel() });
  selected.project.scope.selections.push({
    id: "second-relation",
    namespace: modelNamespace,
    kind: "reference",
    reference: "relation:second",
    questions: ["condition"],
  });
  selected.project.presentation.static.views[0].groups.push({
    id: "other-group",
    label: "Other",
    elements: [{ namespace: modelNamespace, id: "other" }],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );

  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  const note =
    "Unlinked relations show source topology only; typed claim status is not selected, and provenance is unverified.";
  for (const [name, medium] of [
    ["svg", svg],
    ["html", html],
  ]) {
    const visible = medium.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ");
    assert(visible.includes(note), name);
  }
  assert.deepEqual(
    [...svg.matchAll(/data-graphic-id="static-view-0-r-([^"]+)"/gu)]
      .map((match) => match[1])
      .sort(),
    ["0", "1"],
  );
  assert(!svg.includes("SOURCE RELATIONS"));
  assert(svg.includes("SOURCE CLAIMS"));
  assert.equal(
    (html.match(/data-logical-relation="true"/gu) ?? []).length,
    2,
    "both source relations remain visible",
  );
  assert(html.includes("Selected source Claim"));

  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const staticScene = composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning));
  assert.deepEqual(
    staticScene.sourceAssertionCarriers
      .filter(({ kind }) => kind === "relation")
      .map(({ relationRefs }) => relationRefs[0].reference)
      .sort(),
    ["request", "second"],
  );
  assert.equal(staticScene.claimCards.length, 1);
  assert.deepEqual(staticScene.claimRelationLinks, [
    { claimAssertionId: "selected-claim", relationAssertionId: "selected-relation" },
  ]);
  const staticWrongLink = structuredClone(staticScene);
  staticWrongLink.claimRelationLinks[0].relationAssertionId = "second-relation";
  const staticWrongRendered = composeStaticEditionSvg(staticWrongLink, { icons: figureIcons });
  assert.throws(
    () =>
      validateVisibleSelection(meaning, "static", staticWrongLink, staticWrongRendered.carriers),
    { code: "edition_visible_coverage_mismatch" },
  );
  const staticForged = structuredClone(staticScene);
  staticForged.edges = staticForged.edges.filter(
    (edge) => !edge.relations.some(({ reference }) => reference === "second"),
  );
  staticForged.sourceAssertionCarriers.find(
    ({ assertionId }) => assertionId === "second-relation",
  ).relationRefs = [];
  const staticRendered = composeStaticEditionSvg(staticForged, { icons: figureIcons });
  assert.throws(
    () => validateVisibleSelection(meaning, "static", staticForged, staticRendered.carriers),
    { code: "edition_visible_coverage_mismatch" },
  );

  const interactiveScene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(
    interactiveScene.pages[0].sourceAssertionCarriers
      .filter(({ kind }) => kind === "relation")
      .map(({ relationRefs }) => relationRefs[0].reference)
      .sort(),
    ["request", "second"],
  );
  assert.equal(interactiveScene.pages[0].claimCards.length, 1);
  assert.deepEqual(interactiveScene.pages[0].claimRelationLinks, [
    { claimAssertionId: "selected-claim", relationAssertionId: "selected-relation" },
  ]);
  const interactiveWrongLink = structuredClone(interactiveScene);
  interactiveWrongLink.pages[0].claimRelationLinks[0].relationAssertionId = "second-relation";
  const interactiveWrongRendered = await renderInteractiveEditionHtml(interactiveWrongLink);
  assert.throws(
    () =>
      validateVisibleSelection(
        meaning,
        "interactive",
        interactiveWrongLink,
        interactiveWrongRendered.carriers,
      ),
    { code: "edition_visible_coverage_mismatch" },
  );
  const interactiveForged = structuredClone(interactiveScene);
  interactiveForged.pages[0].relations = interactiveForged.pages[0].relations.filter(
    ({ id }) => id !== "second",
  );
  interactiveForged.pages[0].sourceAssertionCarriers.find(
    ({ assertionId }) => assertionId === "second-relation",
  ).relationRefs = [];
  const interactiveRendered = await renderInteractiveEditionHtml(interactiveForged);
  assert.throws(
    () =>
      validateVisibleSelection(
        meaning,
        "interactive",
        interactiveForged,
        interactiveRendered.carriers,
      ),
    { code: "edition_visible_coverage_mismatch" },
  );
});
