import { fail } from "../../src/protocol/values.mjs";
import { factorCommonClaimContext } from "../../src/scene/claim-card.mjs";

export const key = ({ namespace, id }) => JSON.stringify([namespace, id]);

export const sourceReferenceKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);

const text = (value) => typeof value === "string" && value.trim().length > 0;

export function factorClaimFacts(cards) {
  for (const claim of cards) {
    if (
      !text(claim?.namespace) ||
      !text(claim.id) ||
      !text(claim.sha256) ||
      !Array.isArray(claim.facts) ||
      !claim.facts.length ||
      claim.facts.some((fact) => !text(fact?.label) || !text(fact.value)) ||
      new Set(claim.facts.map(({ label }) => label)).size !== claim.facts.length
    )
      fail("static_edition_claim_invalid");
  }
  return factorCommonClaimContext(cards);
}

function validateSourceCarriers(scene) {
  const nodes = new Set(scene.nodes.map(key));
  const relationEntries = scene.edges.flatMap(({ relations }) => relations);
  const relations = new Set(relationEntries.map(sourceReferenceKey));
  const claims = new Set(
    (scene.claimCards ?? []).map(({ namespace, id, sha256 }) =>
      sourceReferenceKey({ namespace, reference: id, sha256 }),
    ),
  );
  if (
    nodes.size !== scene.nodes.length ||
    relations.size !== relationEntries.length ||
    claims.size !== (scene.claimCards ?? []).length
  )
    fail("static_edition_carrier_ambiguous");
  const claimedNodes = new Set();
  const claimedRelations = new Set();
  const claimedClaims = new Set();
  const assertions = new Set();
  for (const carrier of scene.sourceAssertionCarriers) {
    if (
      typeof carrier?.assertionId !== "string" ||
      !carrier.assertionId ||
      assertions.has(carrier.assertionId) ||
      !Array.isArray(carrier.nodeRefs) ||
      !Array.isArray(carrier.relationRefs) ||
      (carrier.claimRefs !== undefined && !Array.isArray(carrier.claimRefs)) ||
      (!carrier.nodeRefs.length && !carrier.relationRefs.length && !carrier.claimRefs?.length)
    )
      fail("static_edition_carrier_invalid");
    assertions.add(carrier.assertionId);
    for (const ref of carrier.nodeRefs) {
      if (!ref || typeof ref.namespace !== "string" || typeof ref.id !== "string")
        fail("static_edition_carrier_invalid");
      const identity = key(ref);
      if (!nodes.has(identity)) fail("static_edition_carrier_invalid");
      claimedNodes.add(identity);
    }
    for (const ref of carrier.relationRefs) {
      if (
        !ref ||
        typeof ref.namespace !== "string" ||
        typeof ref.reference !== "string" ||
        typeof ref.sha256 !== "string"
      )
        fail("static_edition_carrier_invalid");
      const identity = sourceReferenceKey(ref);
      if (!relations.has(identity)) fail("static_edition_carrier_invalid");
      claimedRelations.add(identity);
    }
    for (const ref of carrier.claimRefs ?? []) {
      if (
        !ref ||
        typeof ref.namespace !== "string" ||
        typeof ref.reference !== "string" ||
        typeof ref.sha256 !== "string"
      )
        fail("static_edition_carrier_invalid");
      const identity = sourceReferenceKey(ref);
      if (!claims.has(identity)) fail("static_edition_carrier_invalid");
      claimedClaims.add(identity);
    }
  }
  if (
    nodes.size !== claimedNodes.size ||
    relations.size !== claimedRelations.size ||
    claims.size !== claimedClaims.size
  )
    fail("static_edition_carrier_unclaimed");
}

export function linkedClaims(scene) {
  const relationLinks = scene.claimRelationLinks ?? [];
  const subjectLinks = scene.claimSubjectLinks ?? [];
  if (
    !Array.isArray(relationLinks) ||
    !Array.isArray(subjectLinks) ||
    relationLinks.length + subjectLinks.length !== scene.claimCards.length
  )
    fail("static_edition_claim_relation_invalid");
  const assertions = new Map(
    scene.sourceAssertionCarriers.map((carrier) => [carrier.assertionId, carrier]),
  );
  const relations = new Set(scene.edges.flatMap((edge) => edge.relations.map(sourceReferenceKey)));
  const links = new Map();
  for (const link of relationLinks) {
    if (!link || typeof link !== "object" || Array.isArray(link))
      fail("static_edition_claim_relation_invalid");
    const { claimAssertionId, relationAssertionId } = link;
    const claim = assertions.get(claimAssertionId);
    const relation = assertions.get(relationAssertionId);
    if (
      claim?.kind !== "claim" ||
      relation?.kind !== "relation" ||
      claim.claimRefs?.length !== 1 ||
      relation.relationRefs?.length !== 1 ||
      links.has(sourceReferenceKey(claim.claimRefs[0])) ||
      !relations.has(sourceReferenceKey(relation.relationRefs[0]))
    )
      fail("static_edition_claim_relation_invalid");
    links.set(sourceReferenceKey(claim.claimRefs[0]), sourceReferenceKey(relation.relationRefs[0]));
  }
  const subjects = new Map();
  for (const link of subjectLinks) {
    if (!link || typeof link !== "object" || Array.isArray(link))
      fail("static_edition_claim_relation_invalid");
    const claim = assertions.get(link.claimAssertionId);
    const identity = claim?.claimRefs?.length === 1 ? sourceReferenceKey(claim.claimRefs[0]) : null;
    if (
      claim?.kind !== "claim" ||
      !identity ||
      links.has(identity) ||
      subjects.has(identity) ||
      !text(link.subject?.namespace) ||
      !text(link.subject?.id) ||
      !text(link.subject?.sha256) ||
      link.subject.namespace !== claim.claimRefs[0].namespace ||
      link.subject.sha256 !== claim.claimRefs[0].sha256
    )
      fail("static_edition_claim_relation_invalid");
    subjects.set(identity, link.subject);
  }
  if (
    links.size + subjects.size !== scene.claimCards.length ||
    scene.claimCards.some(
      ({ namespace, id, sha256 }) =>
        !links.has(sourceReferenceKey({ namespace, reference: id, sha256 })) &&
        !subjects.has(sourceReferenceKey({ namespace, reference: id, sha256 })),
    )
  )
    fail("static_edition_claim_relation_invalid");
  return { relations: links, subjects };
}

export function validateStaticScene(scene) {
  if (
    scene?.schema !== "architecture.edition-static-scene/v1" ||
    scene.completeness !== "unqualified-scene" ||
    !text(scene.edition?.editor) ||
    scene.visualPolicy?.profile !== "neutral" ||
    (scene.visualPolicy.override !== undefined && scene.visualPolicy.override !== null) ||
    !Array.isArray(scene.nodes) ||
    !Array.isArray(scene.edges) ||
    (scene.groups !== undefined && !Array.isArray(scene.groups)) ||
    (scene.groupPresentation !== undefined &&
      (!["captions", "key"].includes(scene.groupPresentation) || !scene.groups?.length)) ||
    (scene.claimCards !== undefined && !Array.isArray(scene.claimCards)) ||
    scene.edges.some((edge) => !edge || !Array.isArray(edge.relations)) ||
    !Array.isArray(scene.questions) ||
    !Array.isArray(scene.sourceAssertionCarriers) ||
    !Array.isArray(scene.editorialAssertions) ||
    !Array.isArray(scene.limits) ||
    !scene.limitsByQuestion ||
    typeof scene.limitsByQuestion !== "object" ||
    Array.isArray(scene.limitsByQuestion)
  )
    fail("static_edition_scene_invalid");
  if ((scene.claimCards ?? []).some((claim) => !claim || typeof claim !== "object"))
    fail("static_edition_claim_invalid");
  const mixed = Boolean(
    (scene.nodes.length || scene.edges.length || scene.groups?.length) && scene.claimCards?.length,
  );
  if (!mixed && (scene.claimRelationLinks !== undefined || scene.claimSubjectLinks !== undefined))
    fail("static_edition_claim_relation_invalid");
  if (
    scene.editorialAssertions.some(
      (item) =>
        item?.kind !== "editorial" ||
        item.semanticStatus !== "editor-attributed-unverified" ||
        !text(item.statement) ||
        !text(item.proponent),
    )
  )
    fail("static_edition_editorial_invalid");
  if (!Array.isArray(scene.questionIds)) fail("static_edition_question_invalid");
  const questionIds = new Set(scene.questionIds);
  const questions = new Map(scene.questions.map((question) => [question?.id, question]));
  if (
    questionIds.size !== scene.questionIds.length ||
    questions.size !== scene.questions.length ||
    questionIds.size !== questions.size ||
    [...questionIds].some((id) => typeof id !== "string" || !id || !questions.has(id)) ||
    Object.keys(scene.limitsByQuestion).length !== questionIds.size ||
    Object.keys(scene.limitsByQuestion).some((id) => !questionIds.has(id))
  )
    fail("static_edition_question_invalid");
  validateSourceCarriers(scene);
  return mixed;
}

export function readingGroups(scene) {
  if (scene.groupPresentation !== "key") return [];
  const nodes = new Map(scene.nodes.map((node) => [key(node), node.label]));
  const groupIds = new Set();
  const groupLabels = new Set();
  const members = new Set();
  const labels = new Set();
  const groups = scene.groups.map((group) => {
    if (
      !text(group?.id) ||
      groupIds.has(group.id) ||
      !text(group.label) ||
      groupLabels.has(group.label) ||
      !Array.isArray(group.elements) ||
      !group.elements.length
    )
      fail("static_edition_group_key_invalid");
    groupIds.add(group.id);
    groupLabels.add(group.label);
    return {
      id: group.id,
      label: group.label,
      members: group.elements.map((element) => {
        if (!text(element?.namespace) || !text(element.id))
          fail("static_edition_group_key_invalid");
        const identity = key(element);
        const label = nodes.get(identity);
        if (!label || members.has(identity) || labels.has(label))
          fail("static_edition_group_key_invalid");
        members.add(identity);
        labels.add(label);
        return label;
      }),
    };
  });
  if (members.size !== nodes.size) fail("static_edition_group_key_invalid");
  return groups;
}
