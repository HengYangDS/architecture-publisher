import { interactiveDocument, interactivePage } from "./fixtures/interactive-member.mjs";
import { pageStartTags } from "../packages/publisher/src/rendering/document-input.mjs";
import assert from "node:assert/strict";

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

import { verifySelectedCandidateReplay } from "../packages/publisher/src/qualification/index.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import {
  figureIcons,
  modelNamespace,
  fixture,
  groupedMixedFixture,
  twoRelationClaimModel,
} from "./fixtures/claim-selection.mjs";

test("a selected relation and dependent claim build a readable interactive Candidate", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["interactive"] });
  const output = path.join(selected.root, "candidate");
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.deepEqual(built.media, ["interactive"]);
  const document = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  const html = interactivePage(document);
  const diagram = html.match(/<svg\b[^>]*data-diagram-type="architecture"[\s\S]*?<\/svg>/u)?.[0];
  assert(diagram, "the native selected diagram is visible");
  assert.deepEqual(
    pageStartTags(diagram, () => assert.fail("invalid native carrier"))
      .filter(({ attributes }) => attributes.has("data-node-id"))
      .map(({ attributes }) => attributes.get("data-node-id")),
    ["n-0", "n-1"],
  );
  assert.match(html, /data-note-card-id="claim-card-0"/u);
  assert.match(html, /data-note-id="c-0"/u);
  assert(html.includes("authorization: granted"));
  const facts = interactiveDocument(document).pages.overview.facts.find(
    ({ reference }) => reference === JSON.stringify([modelNamespace, "claim", "intended"]),
  ).facts;
  for (const [label, value] of [
    ["Subject", "client · component"],
    ["Object", "server · component"],
  ]) {
    assert(facts.some((fact) => fact.label === label && fact.value === value));
    assert(html.includes(`${label}: ${value}`), "the Claim visibly names its source endpoint");
  }
  const replay = await verifySelectedCandidateReplay({
    requestPath: selected.requestPath,
    requestSha256: selected.requestSha256,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  assert.equal(replay.verdict, "match");
});

test("interactive claim context is factored only when exact and leaves per-claim anchors", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["interactive"] });
  selected.project.scope.selections.push({
    id: "implemented-claim",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:implemented",
    questions: ["condition"],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const document = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  const html = interactivePage(document);
  assert.match(html, /data-note-card-id="claim-common-context"/u);
  assert(html.includes("Shared by every selected Claim"));
  assert.equal((html.match(/Claimant-declared validity: affirmed/gu) ?? []).length, 1);
  assert.equal((html.match(/Selected claimant: fixture-maintainer/gu) ?? []).length, 1);
  assert.equal((html.match(/data-note-id="c-[0-9]+"/gu) ?? []).length, 2);
  const facts = interactiveDocument(document).pages.overview.facts.filter(
    ({ reference }) => JSON.parse(reference)[1] === "claim",
  );
  assert.equal(facts.length, 2, "each complete source Claim keeps its own Inspect anchor");
  for (const claim of facts) {
    assert(claim.facts.some(({ label }) => label === "Subject"));
    assert(claim.facts.some(({ label }) => label === "Declared evidence authority"));
  }
});

test("mixed interactive media rejects a forged source dependency behind valid graphics", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["interactive"] });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeInteractiveEditionScene(meaning);
  const rendered = await renderInteractiveEditionHtml(scene);
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, "interactive", scene, rendered.carriers),
  );

  const forged = structuredClone(scene);
  forged.pages[0].claimRelationLinks[0].relationAssertionId = "not-selected";
  await assert.rejects(renderInteractiveEditionHtml(forged), {
    code: "render_interactive_claim_relation_invalid",
  });

  const falseDependency = structuredClone(meaning);
  falseDependency.native.selections[1].members.claims[0].dependsOn = [];
  assert.throws(
    () => validateVisibleSelection(falseDependency, "interactive", scene, rendered.carriers),
    { code: "edition_visible_coverage_mismatch" },
  );
});

test("two claims on one selected relation keep distinct visible carriers", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["static"] });
  selected.project.scope.selections.push({
    id: "implemented-claim",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:implemented",
    questions: ["condition"],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.deepEqual(
    [...svg.matchAll(/data-graphic-id="([^"]+)"/gu)].map((match) => match[1]).sort(),
    [
      "static-view-0-c-0",
      "static-view-0-c-1",
      "static-view-0-n-0",
      "static-view-0-n-1",
      "static-view-0-r-0",
    ],
  );
  assert.equal((svg.match(/ON SOURCE RELATION 01/gu) ?? []).length, 2);
  assert(svg.includes("Claim plane: intended"));
  assert(svg.includes("Claim plane: implemented"));
  const rectangles = [
    ...svg.matchAll(/<g data-graphic-id="static-view-0-c-([01])">([\s\S]*?)<\/g>/gu),
  ].map(([, id, markup]) => {
    const heading = /<text x="([\d.]+)" y="([\d.]+)"/u.exec(markup);
    const separator = /<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)"/u.exec(markup);
    assert(heading && separator);
    const y = Number(heading[2]) - 14;
    return {
      id,
      x: Number(separator[1]),
      y,
      width: Number(separator[3]) - Number(separator[1]),
      height: Number(separator[2]) - y,
    };
  });
  assert.deepEqual(rectangles.map(({ id }) => id).sort(), ["0", "1"]);
  for (const { x, y, width, height } of rectangles) {
    assert([x, y, width, height].every(Number.isFinite));
    assert(width > 0 && height > 0);
  }
  const [first, second] = rectangles;
  assert(
    first.x + first.width <= second.x ||
      second.x + second.width <= first.x ||
      first.y + first.height <= second.y ||
      second.y + second.height <= first.y,
    "complete Claim reading regions must not overlap in their common coordinate frame",
  );
});

test("mixed interactive pages keep separate question-local graphs and claims", async (t) => {
  const selected = await groupedMixedFixture(t, {
    model: twoRelationClaimModel(),
    media: ["interactive"],
  });
  selected.project.questions.push({
    id: "followup",
    audience: "maintainer",
    text: "What happens after the server?",
  });
  selected.project.scope.selections.push(
    {
      id: "second-relation",
      namespace: modelNamespace,
      kind: "reference",
      reference: "relation:second",
      questions: ["followup"],
    },
    {
      id: "first-claim",
      namespace: modelNamespace,
      kind: "reference",
      reference: "claim:aaa",
      questions: ["followup"],
    },
  );
  selected.project.presentation.static.views[0].groups.push({
    id: "other-group",
    label: "Other",
    elements: [{ namespace: modelNamespace, id: "other" }],
  });
  selected.project.presentation.interactive.views = [
    { id: "condition", questions: ["condition"] },
    { id: "followup", questions: ["followup"] },
  ];
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(
    scene.pages.map(({ id }) => id),
    ["condition", "followup"],
  );
  assert.deepEqual(
    scene.pages.map(({ relations }) => relations.length),
    [1, 1],
  );
  assert.deepEqual(
    scene.pages.map(({ claimCards }) => claimCards.length),
    [1, 1],
  );
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const document = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  for (const id of ["condition", "followup"]) {
    const html = interactivePage(document, id);
    assert.equal((html.match(/data-note-card-id="claim-card-[0-9]+"/gu) ?? []).length, 1);
    assert.equal((html.match(/data-note-id="c-[0-9]+"/gu) ?? []).length, 1);
    const selectedPage = interactiveDocument(document).pages[id];
    assert.equal(
      selectedPage.facts.filter(({ reference }) => JSON.parse(reference)[1] === "claim").length,
      1,
    );
    assert(
      html.includes(
        id === "condition" ? "When may the client call?" : "What happens after the server?",
      ),
    );
  }
});

test("a forged Scene cannot hide a selected claim condition behind a valid carrier ID", async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = structuredClone(composeStaticEditionScene(meaning, null));
  scene.claimCards[0].facts.find(({ label }) => label === "Condition").value = "hidden";
  const rendered = composeStaticEditionSvg(scene, { icons: figureIcons });
  assert.throws(() => validateVisibleSelection(meaning, "static", scene, rendered.carriers), {
    code: "edition_visible_coverage_mismatch",
  });
  const interactive = structuredClone(composeInteractiveEditionScene(meaning));
  interactive.pages[0].claimCards[0].facts.find(({ label }) => label === "Condition").value =
    "hidden";
  const projected = projectInteractivePage(interactive.pages[0], 0);
  assert.throws(
    () => validateVisibleSelection(meaning, "interactive", interactive, [projected.carriers]),
    { code: "edition_visible_coverage_mismatch" },
  );
});

test("malformed claimant and applicability fail before a claim Scene exists", async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  for (const mutate of [
    (selection) => (selection.sourceOwner = ""),
    (selection) => (selection.members.claims[0].condition = null),
  ]) {
    const forged = structuredClone(meaning);
    mutate(forged.native.selections[0]);
    assert.throws(() => composeStaticEditionScene(forged, null), {
      code: "edition_claim_card_invalid",
    });
  }
});

test("malformed claim carriers fail by name before either renderer emits media", async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const staticScene = structuredClone(composeStaticEditionScene(meaning, null));
  staticScene.claimCards[0] = null;
  assert.throws(() => composeStaticEditionSvg(staticScene, { icons: figureIcons }), {
    code: "static_edition_claim_invalid",
  });
  const interactive = structuredClone(composeInteractiveEditionScene(meaning));
  interactive.pages[0].claimCards[0].facts[0] = null;
  assert.throws(() => projectInteractivePage(interactive.pages[0], 0), {
    code: "render_interactive_claim_invalid",
  });
});

test("source-controlled claim values cannot inject HTML or SVG markup", async (t) => {
  const model = claimModel();
  model.claims.tagged.value = "</script><img src=x onerror=globalThis.__injected=true>";
  const selected = await fixture(t, { model, reference: "claim:tagged" });
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.doesNotMatch(html, /<img src=x|<\/script><img/u);
  assert.doesNotMatch(svg, /<img src=x/u);
  assert.match(html, /&lt;img src=x/u);
  assert.match(svg, /&lt;img src=x/u);
});
