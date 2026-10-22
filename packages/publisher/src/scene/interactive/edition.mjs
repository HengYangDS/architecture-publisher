import { canonical, deepFreeze, record, text } from "../../semantics/document.mjs";
import { fail, hasExactFields, isDigest } from "../../protocol/values.mjs";
import { claimCard } from "../claim-card.mjs";
import { claimRelationQualifiers, linkClaimModelSources } from "../claim-relations.mjs";
import { interactiveAppearance } from "../appearance.mjs";
import { resolveFigureTypes } from "../figure-types.mjs";
import { deriveSourceReadingScope } from "./source-reading.mjs";

const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ id, origin }) => JSON.stringify([origin.namespace, id, origin.sha256]);
const claimKey = ({ namespace, id, sha256 }) => JSON.stringify([namespace, id, sha256]);
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function element(value) {
  if (
    !record(value) ||
    !text(value.namespace) ||
    !text(value.id) ||
    !isDigest(value.sha256) ||
    value.origin?.namespace !== value.namespace ||
    value.origin?.sha256 !== value.sha256
  )
    fail("interactive_scene_source_binding_invalid");
  return {
    namespace: value.namespace,
    id: value.id,
    sha256: value.sha256,
    kind: value.kind,
    figureKind: value.kind ?? "source element",
    label: value.label,
    origin: structuredClone(value.origin),
  };
}

function relation(value) {
  if (
    !record(value) ||
    !text(value.id) ||
    !record(value.from) ||
    !record(value.to) ||
    !text(value.from.namespace) ||
    !text(value.from.id) ||
    !text(value.to.namespace) ||
    !text(value.to.id) ||
    !text(value.origin?.namespace) ||
    !isDigest(value.origin?.sha256)
  )
    fail("interactive_scene_source_binding_invalid");
  return {
    id: value.id,
    from: structuredClone(value.from),
    to: structuredClone(value.to),
    kind: value.kind,
    direction: value.direction,
    label: value.label,
    origin: structuredClone(value.origin),
    ...(value.sourceQualifiers === undefined
      ? {}
      : { sourceQualifiers: structuredClone(value.sourceQualifiers) }),
  };
}

function addBound(map, identity, value) {
  const previous = map.get(identity);
  if (previous && canonical(previous) !== canonical(value))
    fail("interactive_scene_semantic_conflict");
  map.set(identity, value);
}

function selectedGroups(authored, nodes) {
  if (authored === undefined) return {};
  if (!Array.isArray(authored) || !authored.length)
    fail("interactive_scene_group_membership_invalid");
  const groupIds = new Set();
  const members = new Set();
  for (const group of authored) {
    if (
      !hasExactFields(group, ["id", "label", "elements"]) ||
      !text(group.id) ||
      !text(group.label) ||
      groupIds.has(group.id) ||
      !Array.isArray(group.elements) ||
      !group.elements.length
    )
      fail("interactive_scene_group_membership_invalid");
    groupIds.add(group.id);
    for (const item of group.elements) {
      if (!hasExactFields(item, ["namespace", "id"]) || !text(item.namespace) || !text(item.id))
        fail("interactive_scene_group_membership_invalid");
      const identity = key(item);
      if (!nodes.has(identity) || members.has(identity))
        fail("interactive_scene_group_membership_invalid");
      members.add(identity);
    }
  }
  if (members.size !== nodes.size) fail("interactive_scene_group_membership_invalid");
  return { groups: structuredClone(authored) };
}

function composePage(
  view,
  selections,
  assertions,
  questions,
  claimMode,
  authoredGroups,
  authoredForm,
) {
  const nodes = new Map();
  const relations = new Map();
  const claims = new Map();
  const sourceAssertionCarriers = [];
  const editorialAssertions = [];
  for (const id of view.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail("interactive_scene_assertion_unbound");
    if (assertion.kind === "editorial") {
      editorialAssertions.push(structuredClone(assertion));
      continue;
    }
    const selected = selections.get(assertion.selection);
    if (!selected) fail("interactive_scene_assertion_unbound");
    if (claimMode && selected.target.kind === "claim") {
      const card = claimCard(selected);
      addBound(claims, claimKey(card), card);
      sourceAssertionCarriers.push({
        assertionId: id,
        selectionId: assertion.selection,
        kind: "claim",
        nodeRefs: [],
        relationRefs: [],
        claimRefs: [{ namespace: card.namespace, reference: card.id, sha256: card.sha256 }],
      });
      continue;
    }
    if (claimMode && !["entity", "relation"].includes(selected.target.kind))
      fail("edition_scene_claim_model_unadmitted");
    const nodeRefs = selected.members.elements.map((member) => {
      const projected = element(member);
      addBound(nodes, key(projected), projected);
      return { namespace: projected.namespace, id: projected.id };
    });
    const relationRefs = selected.members.relations.map((member) => {
      const sourceQualifiers = claimMode
        ? claimRelationQualifiers(member, "interactive_scene_relation_qualifiers_invalid").map(
            ({ name, value }) => ({ name, value: canonical(value) }),
          )
        : [];
      const projected = relation(
        claimMode
          ? {
              ...member,
              direction: "forward",
              label: null,
              ...(sourceQualifiers.length ? { sourceQualifiers } : {}),
            }
          : member,
      );
      addBound(relations, relationKey(projected), projected);
      return {
        namespace: projected.origin.namespace,
        reference: projected.id,
        sha256: projected.origin.sha256,
      };
    });
    sourceAssertionCarriers.push({
      assertionId: id,
      selectionId: assertion.selection,
      kind: selected.target.kind,
      nodeRefs,
      relationRefs,
    });
  }
  for (const item of relations.values())
    if (!nodes.has(key(item.from)) || !nodes.has(key(item.to)))
      fail("interactive_scene_relation_endpoint_missing");
  const questionRecords = view.questionIds.map((id) => {
    const question = questions.get(id);
    if (!question) fail("interactive_scene_question_unbound");
    return question;
  });
  const claimSourceLinks =
    claimMode && nodes.size && claims.size
      ? linkClaimModelSources(
          view,
          assertions,
          selections,
          "interactive_scene_claim_relation_unbound",
        )
      : null;
  const page = {
    id: view.id,
    questionIds: view.questionIds,
    questions: questionRecords,
    limitsByQuestion: view.limitsByQuestion,
    nodes: [...nodes.entries()]
      .sort(([left], [right]) => compare(left, right))
      .map(([, value]) => value),
    relations: [...relations.entries()]
      .sort(([left], [right]) => compare(left, right))
      .map(([, value]) => value),
    ...selectedGroups(authoredGroups, nodes),
    ...(authoredForm === undefined ? {} : { visualForm: structuredClone(authoredForm) }),
    ...(claimMode
      ? {
          claimCards: [...claims.entries()]
            .sort(([left], [right]) => compare(left, right))
            .map(([, value]) => value),
          ...(claimSourceLinks?.links.length ? { claimRelationLinks: claimSourceLinks.links } : {}),
          ...(claimSourceLinks?.subjectLinks.length
            ? { claimSubjectLinks: claimSourceLinks.subjectLinks }
            : {}),
        }
      : {}),
    sourceAssertionCarriers,
    editorialAssertions,
  };
  const reference = (namespace, kind, id) => JSON.stringify([namespace, kind, id]);
  const facts = [
    ...page.nodes.map((node, index) => ({
      reference: reference(node.namespace, "entity", node.id),
      graphicId: `n-${index}`,
    })),
    ...page.relations.map((relation, index) => ({
      reference: reference(relation.origin.namespace, "relation", relation.id),
      graphicId: `r-${index}`,
    })),
    ...(page.claimCards ?? []).map((claim, index) => ({
      reference: reference(claim.namespace, "claim", claim.id),
      graphicId: `c-${index}`,
    })),
    ...(page.groups ?? []).flatMap((group, index) =>
      group.elements.map((member) => ({
        reference: reference(member.namespace, "entity", member.id),
        graphicId: `g-${index}`,
      })),
    ),
  ];
  const bindSourceBasis = (basis, graphicId) => {
    const carrier = sourceAssertionCarriers.find((item) => item.assertionId === basis);
    for (const claim of carrier?.claimRefs ?? [])
      facts.push({
        reference: reference(claim.namespace, "claim", claim.reference),
        graphicId,
      });
  };
  for (const role of page.visualForm?.roles ?? [])
    bindSourceBasis(
      role.basis,
      `g-${(page.groups ?? []).findIndex((group) => group.id === role.group)}`,
    );
  for (const [index, handoff] of (page.visualForm?.handoffs ?? []).entries())
    bindSourceBasis(handoff.basis, `h-${index}`);
  return {
    ...page,
    sourceReading: deriveSourceReadingScope({ view, assertions, selections, facts }),
  };
}

/** Compile page-local semantic work, leaving geometry and DOM to its medium owner. */
export function composeInteractiveEditionScene(meaning) {
  if (
    meaning?.completeness !== "finite-unqualified-obligations" ||
    !Array.isArray(meaning.native?.selections) ||
    !Array.isArray(meaning.assertions) ||
    !Array.isArray(meaning.questions) ||
    !Array.isArray(meaning.media?.interactive?.views) ||
    !meaning.media.interactive.views.length ||
    !record(meaning.editorial)
  )
    fail("interactive_scene_input_invalid");
  const claimMode = meaning.native.selections.some(
    ({ format }) => format === "architecture.claim-model/v2",
  );
  if (
    claimMode &&
    !meaning.native.selections.every(
      ({ format, target }) =>
        format === "architecture.claim-model/v2" &&
        ["claim", "entity", "relation"].includes(target.kind),
    )
  )
    fail("edition_scene_claim_model_unadmitted");
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const questions = new Map(meaning.questions.map((item) => [item.id, item]));
  const views = meaning.media.interactive.views;
  const authoredViews = meaning.editorial.presentation?.interactive?.views;
  if (
    selections.size !== meaning.native.selections.length ||
    assertions.size !== meaning.assertions.length ||
    questions.size !== meaning.questions.length ||
    new Set(views.map(({ id }) => id)).size !== views.length ||
    (authoredViews !== undefined &&
      (!Array.isArray(authoredViews) ||
        authoredViews.length !== views.length ||
        authoredViews.some((view, index) => view?.id !== views[index].id)))
  )
    fail("interactive_scene_identity_ambiguous");
  return deepFreeze({
    schema: "architecture.edition-interactive-scene/v1",
    completeness: "unqualified-scene",
    edition: meaning.edition,
    title: meaning.editorial.title,
    ...(meaning.editorial.narrative.summary === undefined
      ? {}
      : { summary: meaning.editorial.narrative.summary }),
    appearance: interactiveAppearance(meaning.editorial.presentation?.interactive?.appearance),
    visualPolicy:
      meaning.refinement?.media?.interactive?.kind === "neutral"
        ? {
            profile: "neutral",
            ...(meaning.editorial.visualPolicy?.figureTypes === undefined
              ? {}
              : { figureTypes: meaning.editorial.visualPolicy.figureTypes }),
          }
        : meaning.editorial.visualPolicy,
    pages: resolveFigureTypes(
      views.map((view, index) =>
        composePage(
          view,
          selections,
          assertions,
          questions,
          claimMode,
          authoredViews?.[index]?.groups,
          authoredViews?.[index]?.form,
        ),
      ),
      meaning.editorial.visualPolicy?.figureTypes,
    ),
    limits: meaning.limits,
  });
}
