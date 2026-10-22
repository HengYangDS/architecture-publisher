import { createHash } from "node:crypto";
import { isDigest } from "../protocol/values.mjs";
import {
  canonical,
  claimModelDigest,
  deepFreeze,
  exact,
  jsonValue,
  record,
  strings,
  text,
  validateClaimModel,
} from "../semantics/document.mjs";

const EDITION_FIELDS = Object.freeze([
  "schema",
  "id",
  "owner",
  "product",
  "source",
  "claimModel",
  "title",
  "audiences",
  "questions",
  "requiredClaims",
  "omissions",
  "narrative",
  "visualGrammar",
  "scenes",
  "qualification",
  "scope",
]);
export const QUALIFICATION_KINDS = Object.freeze([
  "semantic",
  "coverage",
  "static",
  "interactive",
  "accessibility",
  "installed",
  "recovery",
  "human",
]);
export const VISUAL_REVIEW_PREDICATES = Object.freeze(["faithful", "intelligible", "aesthetic"]);
const SIDES = Object.freeze(["top", "right", "bottom", "left"]);
const STATIC_ROUTES = Object.freeze(["straight", "orthogonal-h", "orthogonal-v"]);
const INTERACTIVE_ROUTES = Object.freeze(["auto", ...STATIC_ROUTES]);
const LABEL_PLACEMENT_FIELDS = Object.freeze(["labelAt", "labelDx", "labelDy", "labelSegment"]);
const SEMANTIC_VERSION =
  /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

const editionError = (code, detail = "") => {
  throw Object.assign(new Error(code + (detail ? ": " + detail : "")), {
    code,
  });
};
const lexical = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const identifier = (value) => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const sameSet = (left, right) => [...left].sort().join("\n") === [...right].sort().join("\n");

function validateJson(edition) {
  try {
    jsonValue(edition, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === "semantic_json_alias") editionError("edition_json_alias");
    if (code === "semantic_size_exceeded") editionError("edition_size_exceeded");
    editionError("edition_json_invalid", String(code ?? "unknown"));
  }
}

function validateComposition(composition, model, sceneId, medium) {
  if (
    !exact(composition, ["groups", "relations"]) ||
    !Array.isArray(composition.groups) ||
    !composition.groups.length ||
    !Array.isArray(composition.relations)
  )
    editionError("edition_scene_composition_invalid", sceneId);
  const groups = new Set(),
    entities = new Set(),
    relations = new Set();
  for (const group of composition.groups) {
    if (
      !exact(group, ["id", "label", "entities"]) ||
      !identifier(group.id) ||
      groups.has(group.id) ||
      !text(group.label) ||
      !strings(group.entities, true) ||
      group.entities.length > 8
    )
      editionError("edition_scene_group_invalid", sceneId);
    groups.add(group.id);
    for (const id of group.entities) {
      if (!Object.hasOwn(model.entities, id) || entities.has(id))
        editionError("edition_scene_entity_invalid", sceneId + ", " + id);
      entities.add(id);
    }
  }
  const labelPlacementFields = medium === "interactive" ? LABEL_PLACEMENT_FIELDS : [],
    routes = medium === "interactive" ? INTERACTIVE_ROUTES : STATIC_ROUTES;
  for (const relation of composition.relations) {
    if (
      !record(relation) ||
      !["id", "fromSide", "toSide", "route"].every((key) => Object.hasOwn(relation, key)) ||
      Object.keys(relation).some(
        (key) => !["id", "fromSide", "toSide", "route", ...labelPlacementFields].includes(key),
      ) ||
      !text(relation.id) ||
      relations.has(relation.id) ||
      !Object.hasOwn(model.relations, relation.id) ||
      !SIDES.includes(relation.fromSide) ||
      !SIDES.includes(relation.toSide) ||
      !routes.includes(relation.route)
    )
      editionError("edition_scene_relation_invalid", sceneId);
    const source = model.relations[relation.id];
    if (!entities.has(source.subject) || !entities.has(source.object))
      editionError("edition_scene_endpoint_missing", sceneId + ", " + relation.id);
    if (
      (Object.hasOwn(relation, "labelAt") &&
        (!Array.isArray(relation.labelAt) ||
          relation.labelAt.length !== 2 ||
          relation.labelAt.some((value) => !Number.isFinite(value)))) ||
      (Object.hasOwn(relation, "labelDx") && !Number.isFinite(relation.labelDx)) ||
      (Object.hasOwn(relation, "labelDy") && !Number.isFinite(relation.labelDy)) ||
      (Object.hasOwn(relation, "labelSegment") &&
        (!Number.isSafeInteger(relation.labelSegment) || relation.labelSegment < 0))
    )
      editionError("edition_scene_relation_invalid", sceneId);
    relations.add(relation.id);
  }
  return { entities, relations };
}

function validateScene(scene, model, questions, id, medium, purposeRequired) {
  const fields = purposeRequired
    ? ["label", "purpose", "questions", "claims", "composition", "authoredInputSha256"]
    : ["label", "questions", "claims", "composition", "authoredInputSha256"];
  const required = purposeRequired
    ? ["label", "purpose", "questions", "claims", "composition"]
    : ["label", "questions", "claims", "composition"];
  if (
    !record(scene) ||
    !required.every((field) => Object.hasOwn(scene, field)) ||
    Object.keys(scene).some((field) => !fields.includes(field)) ||
    !text(scene.label) ||
    (purposeRequired && !["overview", "mechanism"].includes(scene.purpose)) ||
    (Object.hasOwn(scene, "authoredInputSha256") && !isDigest(scene.authoredInputSha256)) ||
    !strings(scene.questions, true) ||
    !strings(scene.claims) ||
    scene.questions.some((question) => !Object.hasOwn(questions, question)) ||
    scene.claims.some((claim) => !Object.hasOwn(model.claims, claim))
  )
    editionError("edition_scene_invalid", id);
  const composition = validateComposition(scene.composition, model, id, medium);
  for (const claimId of scene.claims) {
    const claim = model.claims[claimId];
    if (
      !composition.entities.has(claim.subject) ||
      (claim.object !== null && !composition.entities.has(claim.object)) ||
      claim.dependsOn.some(
        (reference) =>
          reference.section === "relations" && !composition.relations.has(reference.id),
      )
    )
      editionError("edition_scene_claim_carrier_missing", id + ", " + claimId);
  }
  return { ...composition, claims: new Set(scene.claims) };
}

function validateVisualGrammar(grammar, model) {
  if (
    !exact(grammar, ["entityTypes", "relationTypes", "principles"]) ||
    !record(grammar.entityTypes) ||
    !record(grammar.relationTypes) ||
    !strings(grammar.principles, true) ||
    !sameSet(Object.keys(grammar.entityTypes), model.vocabulary.entities) ||
    !sameSet(Object.keys(grammar.relationTypes), model.vocabulary.relations) ||
    Object.values(grammar.entityTypes).some((value) => !text(value)) ||
    Object.values(grammar.relationTypes).some(
      (value) => !exact(value, ["label", "variant"]) || !text(value.label) || !text(value.variant),
    )
  )
    editionError("edition_visual_grammar_invalid");
}

export function isHumanReviewScope(value) {
  return (
    record(value) &&
    exact(value, ["kind", "medium", "artifact", "width", "height"]) &&
    ["viewport", "physical"].includes(value.kind) &&
    ["static", "interactive"].includes(value.medium) &&
    (value.kind !== "viewport" || value.medium === "interactive") &&
    (value.kind !== "physical" || value.medium === "static") &&
    text(value.artifact) &&
    Number.isSafeInteger(value.width) &&
    value.width > 0 &&
    Number.isSafeInteger(value.height) &&
    value.height > 0
  );
}

function humanQualificationEntry(value) {
  return (
    record(value) &&
    exact(value, ["predicate", "scope"]) &&
    text(value.predicate) &&
    isHumanReviewScope(value.scope)
  );
}

export function hasCompleteVisualReviewScopes(reviews) {
  const scopes = new Map();
  for (const { predicate, scope } of reviews) {
    if (!VISUAL_REVIEW_PREDICATES.includes(predicate)) continue;
    const key = canonical(scope);
    if (!scopes.has(key)) scopes.set(key, new Set());
    scopes.get(key).add(predicate);
  }
  return [...scopes.values()].every((predicates) =>
    VISUAL_REVIEW_PREDICATES.every((predicate) => predicates.has(predicate)),
  );
}

function validateQualification(qualification) {
  const machineKinds = QUALIFICATION_KINDS.filter((kind) => kind !== "human");
  if (
    !exact(qualification, QUALIFICATION_KINDS) ||
    machineKinds.some((kind) => !strings(qualification[kind])) ||
    !Array.isArray(qualification.human) ||
    qualification.human.some((item) => !humanQualificationEntry(item)) ||
    new Set(qualification.human.map((item) => canonical(item))).size !==
      qualification.human.length ||
    ["semantic", "coverage", "static", "interactive", "accessibility", "installed"].some(
      (kind) => !qualification[kind].length,
    )
  )
    editionError("edition_qualification_invalid");
  if (
    !hasCompleteVisualReviewScopes(qualification.human) ||
    VISUAL_REVIEW_PREDICATES.some((predicate) =>
      ["static", "interactive"].some(
        (medium) =>
          !qualification.human.some(
            (item) => item.predicate === predicate && item.scope.medium === medium,
          ),
      ),
    )
  )
    editionError("edition_human_qualification_required");
}

function validateEditionContract(model, edition, completeOverviewRequired) {
  validateClaimModel(model);
  validateJson(edition);
  if (
    !exact(edition.product, ["name", "schema", "version"]) ||
    edition.product.name !== "Architecture Publisher" ||
    edition.product.schema !== "architecture.publisher/v1" ||
    !SEMANTIC_VERSION.test(edition.product.version)
  )
    editionError("edition_identity_invalid");
  if (
    !exact(edition, EDITION_FIELDS) ||
    edition.schema !== "architecture.edition/v2" ||
    !identifier(edition.id) ||
    !text(edition.owner) ||
    !exact(edition.source, ["manifestSha256"]) ||
    !isDigest(edition.source.manifestSha256) ||
    !exact(edition.claimModel, ["schema", "digest"]) ||
    edition.claimModel.schema !== "architecture.claim-model/v2" ||
    edition.claimModel.digest !== claimModelDigest(model) ||
    !text(edition.title) ||
    !text(edition.scope) ||
    !record(edition.audiences) ||
    !Object.keys(edition.audiences).length ||
    !record(edition.questions) ||
    !Object.keys(edition.questions).length ||
    !strings(edition.requiredClaims, true) ||
    !record(edition.omissions) ||
    !Array.isArray(edition.narrative) ||
    !edition.narrative.length ||
    edition.narrative.some((id) => !text(id)) ||
    !exact(edition.scenes, ["static", "interactive"]) ||
    !record(edition.scenes.interactive)
  )
    editionError("edition_contract_invalid");

  for (const [id, audience] of Object.entries(edition.audiences))
    if (!identifier(id) || !exact(audience, ["label"]) || !text(audience.label))
      editionError("edition_audience_invalid", id);

  for (const [id, question] of Object.entries(edition.questions))
    if (
      !identifier(id) ||
      !exact(question, ["audience", "prompt", "claims", "detail", "risk"]) ||
      !Object.hasOwn(edition.audiences, question.audience) ||
      !text(question.prompt) ||
      !strings(question.claims, true) ||
      question.claims.some((claim) => !Object.hasOwn(model.claims, claim)) ||
      !["overview", "mechanism"].includes(question.detail) ||
      !text(question.risk)
    )
      editionError("edition_question_invalid", id);

  const modelClaims = Object.keys(model.claims),
    required = new Set(edition.requiredClaims),
    omitted = new Set(Object.keys(edition.omissions));
  if (
    edition.requiredClaims.some((id) => !Object.hasOwn(model.claims, id)) ||
    Object.keys(edition.omissions).some((id) => !Object.hasOwn(model.claims, id))
  )
    editionError("edition_claim_unknown");
  if ([...required].some((id) => omitted.has(id)))
    editionError("edition_claim_classification_overlap");
  if (!modelClaims.every((id) => required.has(id) || omitted.has(id)))
    editionError("edition_claim_classification_incomplete");

  validateVisualGrammar(edition.visualGrammar, model);
  validateQualification(edition.qualification);
  const staticScene = validateScene(
      edition.scenes.static,
      model,
      edition.questions,
      "static",
      "static",
      false,
    ),
    interactive = new Map();
  for (const [id, scene] of Object.entries(edition.scenes.interactive)) {
    if (!identifier(id)) editionError("edition_scene_invalid", id);
    interactive.set(id, validateScene(scene, model, edition.questions, id, "interactive", true));
  }
  if (
    !interactive.size ||
    !sameSet(edition.narrative, interactive.keys()) ||
    edition.scenes.interactive[edition.narrative[0]]?.purpose !== "overview" ||
    [...interactive.keys()].filter((id) => edition.scenes.interactive[id].purpose === "overview")
      .length !== 1
  )
    editionError("edition_narrative_invalid");

  const overviewId = edition.narrative[0],
    overview = interactive.get(overviewId),
    modelEntities = Object.keys(model.entities),
    modelRelations = Object.keys(model.relations);
  if (!sameSet(staticScene.claims, required) || !sameSet(overview.claims, required))
    editionError("edition_overview_incomplete");
  if (completeOverviewRequired) {
    if (
      !sameSet(staticScene.entities, modelEntities) ||
      !sameSet(staticScene.relations, modelRelations)
    )
      editionError("edition_overview_incomplete");
    if (
      !sameSet(staticScene.entities, overview.entities) ||
      !sameSet(staticScene.relations, overview.relations)
    )
      editionError("edition_overview_carrier_drift");
  }

  const overviewQuestions = Object.entries(edition.questions)
    .filter(([, question]) => question.detail === "overview")
    .map(([id]) => id);
  if (
    !sameSet(edition.scenes.static.questions, overviewQuestions) ||
    !sameSet(edition.scenes.interactive[overviewId].questions, overviewQuestions)
  )
    editionError("edition_overview_questions_incomplete");

  for (const [id, omission] of Object.entries(edition.omissions)) {
    if (
      !exact(omission, ["disposition", "reason", "view"]) ||
      !["out-of-scope", "represented-by"].includes(omission.disposition) ||
      !text(omission.reason) ||
      (omission.disposition === "out-of-scope" && omission.view !== null) ||
      (omission.disposition === "represented-by" &&
        (!text(omission.view) || !interactive.has(omission.view)))
    )
      editionError("edition_omission_invalid", id);
    const represented = [...interactive.entries()]
      .filter(([, scene]) => scene.claims.has(id))
      .map(([sceneId]) => sceneId);
    if (
      (omission.disposition === "out-of-scope" && represented.length) ||
      (omission.disposition === "represented-by" && !represented.includes(omission.view))
    )
      editionError("edition_omission_invalid", id);
  }

  for (const [id, question] of Object.entries(edition.questions)) {
    const scenes = [
      ...(question.detail === "overview"
        ? [edition.scenes.static, edition.scenes.interactive[overviewId]]
        : Object.values(edition.scenes.interactive).filter(
            (scene) => scene.purpose === "mechanism" && scene.questions.includes(id),
          )),
    ];
    if (
      !scenes.length ||
      scenes.some(
        (scene) =>
          !scene.questions.includes(id) ||
          question.claims.some((claim) => !scene.claims.includes(claim)),
      )
    )
      editionError("edition_question_incomplete", id);
  }
  return edition;
}

/** Validate one complete audience-specific Edition without mutating it. */
export function validateEdition(model, edition) {
  return validateEditionContract(model, edition, true);
}

function normalizeEdition(model, edition, completeOverviewRequired) {
  validateEditionContract(model, edition, completeOverviewRequired);
  const result = structuredClone(edition);
  result.requiredClaims.sort();
  for (const question of Object.values(result.questions)) question.claims.sort();
  for (const kind of QUALIFICATION_KINDS)
    if (kind === "human")
      result.qualification.human.sort((left, right) => lexical(canonical(left), canonical(right)));
    else result.qualification[kind].sort();
  result.visualGrammar.principles.sort();
  result.scenes.static.claims.sort();
  result.scenes.static.questions.sort();
  for (const scene of Object.values(result.scenes.interactive)) {
    scene.claims.sort();
    scene.questions.sort();
  }
  return result;
}

export function normalizedEdition(model, edition) {
  return normalizeEdition(model, edition, true);
}

function qualificationObligations(edition) {
  const obligations = QUALIFICATION_KINDS.flatMap((kind) =>
    kind === "human"
      ? edition.qualification.human.map(({ predicate, scope }) => ({
          kind,
          predicate,
          scope: structuredClone(scope),
        }))
      : edition.qualification[kind].map((predicate) => ({ kind, predicate })),
  );
  obligations.sort((left, right) => lexical(canonical(left), canonical(right)));
  return deepFreeze(obligations);
}

export function editionQualificationObligations(modelValue, editionValue) {
  return qualificationObligations(normalizedEdition(modelValue, editionValue));
}

const digest = (value) => createHash("sha256").update(canonical(value)).digest("hex");

/**
 * Admit one Edition side for conservative evolution analysis. Publication
 * remains strict; this path permits only overview coverage drift so the
 * compiler can report the rebuild required to restore a complete Edition.
 */
export function inspectEditionForEvolution(model, edition) {
  const normalized = normalizeEdition(model, edition, false);
  return {
    edition: normalized,
    digest: digest(normalized),
    qualificationObligations: qualificationObligations(normalized),
  };
}

function sceneSemanticProjection(model, scene) {
  const entityIds = [
      ...new Set(scene.composition.groups.flatMap((group) => group.entities)),
    ].sort(),
    relationIds = [...new Set(scene.composition.relations.map((relation) => relation.id))].sort();
  return {
    entities: Object.fromEntries(
      entityIds.map((id) => [
        id,
        {
          type: model.entities[id].type,
          label: model.entities[id].label,
        },
      ]),
    ),
    relations: Object.fromEntries(
      relationIds.map((id) => [
        id,
        {
          type: model.relations[id].type,
          subject: model.relations[id].subject,
          object: model.relations[id].object,
        },
      ]),
    ),
  };
}

export const editionDigest = (model, edition) => digest(normalizedEdition(model, edition));

export const staticSceneDigest = (model, edition) => {
  const normalized = normalizedEdition(model, edition),
    scene = normalized.scenes.static;
  return digest({
    title: normalized.title,
    visualGrammar: normalized.visualGrammar,
    scene,
    semantics: sceneSemanticProjection(model, scene),
  });
};

export const interactiveSceneDigest = (model, edition) => {
  const normalized = normalizedEdition(model, edition);
  return digest({
    title: normalized.title,
    visualGrammar: normalized.visualGrammar,
    narrative: normalized.narrative,
    scenes: normalized.scenes.interactive,
    semantics: Object.fromEntries(
      normalized.narrative.map((id) => [
        id,
        sceneSemanticProjection(model, normalized.scenes.interactive[id]),
      ]),
    ),
  });
};
