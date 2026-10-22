import test from "node:test";
import assert from "node:assert/strict";
import { editionDigest, validateEdition } from "../packages/publisher/src/edition/contract.mjs";
import { semanticArchitectureProjections } from "../packages/publisher/src/scene/contract.mjs";
import { claimModelDigest } from "../packages/publisher/src/semantics/document.mjs";
import { editionFixture, editionVisualReviewDuties } from "./fixtures/edition.mjs";

test("Edition binds audience, questions, claims, scenes and obligations", () => {
  const { model, edition } = editionFixture(),
    before = structuredClone(edition);
  assert.deepEqual(validateEdition(model, edition), edition);
  assert.deepEqual(edition, before);
  assert.equal(editionDigest(model, edition).length, 64);
});

test("one current Edition contract rejects quality tiers and retired input without mutation", () => {
  const { model, edition } = editionFixture();
  edition.schema = "architecture.edition/v2";
  delete edition.class;
  edition.qualification.human = editionVisualReviewDuties();
  assert.doesNotThrow(() => validateEdition(model, edition));
  for (const qualityClass of ["structural", "flagship"]) {
    const classed = { ...structuredClone(edition), class: qualityClass };
    const before = structuredClone(classed);
    assert.throws(() => validateEdition(model, classed), { code: "edition_contract_invalid" });
    assert.deepEqual(classed, before);
  }
  const retired = { ...structuredClone(edition), schema: "architecture.edition/v1" };
  assert.throws(() => validateEdition(model, retired), { code: "edition_contract_invalid" });
});

test("every Edition requires each visual predicate for both media without mutation", () => {
  const { model, edition } = editionFixture();
  edition.qualification.human = editionVisualReviewDuties();
  assert.doesNotThrow(() => validateEdition(model, edition));
  for (const duty of editionVisualReviewDuties()) {
    const incomplete = structuredClone(edition);
    incomplete.qualification.human = incomplete.qualification.human.filter(
      ({ predicate, scope }) => predicate !== duty.predicate || scope.medium !== duty.scope.medium,
    );
    const before = structuredClone(incomplete);
    assert.throws(() => validateEdition(model, incomplete), {
      code: "edition_human_qualification_required",
    });
    assert.deepEqual(incomplete, before);
  }
});

test("each declared Edition display requires the complete visual review trio", () => {
  const { model, edition } = editionFixture();
  const split = structuredClone(edition);
  split.qualification.human.forEach((duty, index) => {
    duty.scope.width += index;
  });
  const before = structuredClone(split);
  assert.throws(() => validateEdition(model, split), {
    code: "edition_human_qualification_required",
  });
  assert.deepEqual(split, before);
  const additional = structuredClone(edition);
  additional.qualification.human.push(
    ...edition.qualification.human.map((duty) => ({
      ...structuredClone(duty),
      scope: { ...duty.scope, width: duty.scope.width + 100 },
    })),
  );
  assert.doesNotThrow(() => validateEdition(model, additional));
  additional.qualification.human.pop();
  assert.throws(() => validateEdition(model, additional), {
    code: "edition_human_qualification_required",
  });
});

test("Edition is closed and binds the exact product and Claim Model", () => {
  for (const mutate of [
    (e) => (e.extra = true),
    (e) => (e.schema = "architecture.semantic-publication/v2"),
    (e) => (e.id = ""),
    (e) => (e.owner = ""),
    (e) => (e.class = "theme"),
    (e) => (e.product.name = "Another Product"),
    (e) => (e.product.schema = "architecture.publisher/v2"),
    (e) => (e.claimModel.schema = "architecture.semantic-document/v1"),
    (e) => (e.claimModel.digest = "0".repeat(64)),
  ]) {
    const { model, edition } = editionFixture();
    mutate(edition);
    assert.throws(() => validateEdition(model, edition), /edition_/);
  }
});

test("Edition rejects malformed authored scenes and reader commitments at their owner", () => {
  const cases = [
    [
      "composition",
      (v) => (v.scenes.static.composition = null),
      "edition_scene_composition_invalid",
    ],
    [
      "label vertical offset",
      (v) => (v.scenes.interactive.overview.composition.relations[0].labelDy = "far"),
      "edition_scene_relation_invalid",
    ],
    [
      "label segment",
      (v) => (v.scenes.interactive.overview.composition.relations[0].labelSegment = -1),
      "edition_scene_relation_invalid",
    ],
    [
      "authored identity",
      (v) => (v.scenes.static.authoredInputSha256 = "bad"),
      "edition_scene_invalid",
    ],
    [
      "audience identity",
      (v) => (v.audiences["Bad ID"] = { label: "Unknown" }),
      "edition_audience_invalid",
    ],
    [
      "question audience",
      (v) => (v.questions.system.audience = "absent"),
      "edition_question_invalid",
    ],
    ["unknown required claim", (v) => v.requiredClaims.push("absent"), "edition_claim_unknown"],
    [
      "scene identity",
      (v) => (v.scenes.interactive["Bad ID"] = structuredClone(v.scenes.interactive.runtime)),
      "edition_scene_invalid",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const { model, edition } = editionFixture();
    mutate(edition);
    assert.throws(() => validateEdition(model, edition), { code }, name);
  }
});

test("every Claim Model claim is required or explicitly omitted exactly once", () => {
  const { model, edition } = editionFixture();
  edition.requiredClaims.pop();
  assert.throws(() => validateEdition(model, edition), /edition_claim_classification_incomplete/);

  const classified = editionFixture();
  const omitted = classified.edition.requiredClaims.pop();
  classified.edition.omissions[omitted] = {
    disposition: "out-of-scope",
    reason: "The bounded reader question does not require this claim.",
    view: null,
  };
  for (const scene of [
    classified.edition.scenes.static,
    ...Object.values(classified.edition.scenes.interactive),
  ])
    scene.claims = scene.claims.filter((id) => id !== omitted);
  classified.edition.questions.system.claims = classified.edition.questions.system.claims.filter(
    (id) => id !== omitted,
  );
  assert.doesNotThrow(() => validateEdition(classified.model, classified.edition));

  classified.edition.requiredClaims.push(omitted);
  assert.throws(
    () => validateEdition(classified.model, classified.edition),
    /edition_claim_classification_overlap/,
  );
});

test("overview and mechanism scenes completely answer their questions", () => {
  const staticGap = editionFixture();
  staticGap.edition.scenes.static.claims.pop();
  assert.throws(
    () => validateEdition(staticGap.model, staticGap.edition),
    /edition_overview_incomplete/,
  );

  const interactiveGap = editionFixture();
  interactiveGap.edition.scenes.interactive.overview.claims.pop();
  assert.throws(
    () => validateEdition(interactiveGap.model, interactiveGap.edition),
    /edition_overview_incomplete/,
  );

  const mechanismGap = editionFixture();
  mechanismGap.edition.scenes.interactive.runtime.claims = [];
  assert.throws(
    () => validateEdition(mechanismGap.model, mechanismGap.edition),
    /edition_question_incomplete.*runtime/,
  );

  const carrierGap = editionFixture();
  carrierGap.edition.scenes.interactive.runtime.composition.groups[0].entities = ["server"];
  assert.throws(
    () => validateEdition(carrierGap.model, carrierGap.edition),
    /edition_scene_claim_carrier_missing.*runtime.*observed/,
  );
});

test("narrative order names every interactive scene once and starts with overview", () => {
  for (const narrative of [
    ["runtime", "overview"],
    ["overview"],
    ["overview", "runtime", "runtime"],
    ["overview", "missing"],
  ]) {
    const { model, edition } = editionFixture();
    edition.narrative = narrative;
    assert.throws(() => validateEdition(model, edition), /edition_narrative_invalid/);
  }
});

test("visual grammar and qualification obligations are explicit", () => {
  const missingGrammar = editionFixture();
  missingGrammar.edition.visualGrammar.principles = [];
  assert.throws(
    () => validateEdition(missingGrammar.model, missingGrammar.edition),
    /edition_visual_grammar_invalid/,
  );

  const missingGate = editionFixture();
  missingGate.edition.qualification.coverage = [];
  assert.throws(
    () => validateEdition(missingGate.model, missingGate.edition),
    /edition_qualification_invalid/,
  );

  const selected = editionFixture();
  selected.edition.qualification.human = [];
  assert.throws(
    () => validateEdition(selected.model, selected.edition),
    /edition_human_qualification_required/,
  );
  const targets = [
    {
      kind: "physical",
      medium: "static",
      artifact: "overview-png",
      width: 6000,
      height: 3375,
    },
    {
      kind: "viewport",
      medium: "interactive",
      artifact: "atlas",
      width: 1440,
      height: 1000,
    },
  ];
  selected.edition.qualification.human = ["faithful", "intelligible", "aesthetic"].flatMap(
    (predicate) => targets.map((scope) => ({ predicate, scope: { ...scope } })),
  );
  assert.doesNotThrow(() => validateEdition(selected.model, selected.edition));

  const oneMedium = structuredClone(selected);
  oneMedium.edition.qualification.human = oneMedium.edition.qualification.human.filter(
    ({ scope }) => scope.medium === "static",
  );
  assert.throws(
    () => validateEdition(oneMedium.model, oneMedium.edition),
    /edition_human_qualification_required/,
  );

  const duplicate = structuredClone(selected);
  duplicate.edition.qualification.human.push(
    structuredClone(duplicate.edition.qualification.human[0]),
  );
  assert.throws(
    () => validateEdition(duplicate.model, duplicate.edition),
    /edition_qualification_invalid/,
  );
});

test("visual admission requires aesthetic judgment rather than restraint alone", () => {
  const { model, edition } = editionFixture();
  const scopes = [
    { kind: "physical", medium: "static", artifact: "overview-png", width: 6000, height: 3375 },
    { kind: "viewport", medium: "interactive", artifact: "atlas", width: 1440, height: 1000 },
  ];
  edition.qualification.human = ["faithful", "intelligible", "aesthetic"].flatMap((predicate) =>
    scopes.map((scope) => ({ predicate, scope: { ...scope } })),
  );
  const before = structuredClone(edition);
  assert.doesNotThrow(() => validateEdition(model, edition));
  assert.deepEqual(edition, before);
  const restrained = structuredClone(edition);
  for (const item of restrained.qualification.human)
    if (item.predicate === "aesthetic") item.predicate = "restrained";
  const restrainedBefore = structuredClone(restrained);
  assert.throws(() => validateEdition(model, restrained), {
    code: "edition_human_qualification_required",
  });
  assert.deepEqual(restrained, restrainedBefore);
});

test("Edition owns medium-specific composition admission", () => {
  const staticAuto = editionFixture();
  staticAuto.edition.scenes.static.composition.relations[0].route = "auto";
  assert.throws(
    () => validateEdition(staticAuto.model, staticAuto.edition),
    /edition_scene_relation_invalid.*static/,
  );

  const staticLabelPlacement = editionFixture();
  staticLabelPlacement.edition.scenes.static.composition.relations[0].labelAt = [420, 240];
  assert.throws(
    () => validateEdition(staticLabelPlacement.model, staticLabelPlacement.edition),
    /edition_scene_relation_invalid.*static/,
  );

  const interactiveAuto = editionFixture();
  const relation = interactiveAuto.edition.scenes.interactive.overview.composition.relations[0];
  relation.route = "auto";
  relation.labelAt = [420, 240];
  assert.equal(
    validateEdition(interactiveAuto.model, interactiveAuto.edition),
    interactiveAuto.edition,
  );
  assert.equal(
    semanticArchitectureProjections(interactiveAuto.model, interactiveAuto.edition)
      .interactiveScenes[0].relations[0].route,
    "auto",
  );

  const overfull = editionFixture();
  for (let index = 0; index < 6; index++)
    overfull.model.entities[`extra-${index}`] = {
      type: "component",
      label: `Extra ${index}`,
      qualifiers: {},
      provenance: ["contract"],
    };
  overfull.edition.claimModel.digest = claimModelDigest(overfull.model);
  const entityIds = Object.keys(overfull.model.entities);
  overfull.edition.scenes.static.composition.groups[0].entities = [...entityIds];
  overfull.edition.scenes.interactive.overview.composition.groups[0].entities = [...entityIds];
  assert.throws(
    () => validateEdition(overfull.model, overfull.edition),
    /edition_scene_group_invalid.*static/,
  );
});
