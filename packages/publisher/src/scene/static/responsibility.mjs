import { canonical, deepFreeze } from '../../semantics/document.mjs';
import { fail } from '../../protocol/values.mjs';
import { claimCard } from '../claim-card.mjs';
import { claimRelationLabel, linkClaimModelSources } from '../claim-relations.mjs';
import { selectedStaticNativeViews } from './selection.mjs';

const nodeKey = ({ namespace, id }) => canonical([namespace, id]);
const relationKey = ({ id, origin }) => canonical([origin.namespace, id, origin.sha256]);
const claimKey = ({ namespace, id, sha256 }) => canonical([namespace, id, sha256]);

function addBound(map, key, value) {
  const previous = map.get(key);
  if (previous && canonical(previous) !== canonical(value))
    fail('static_responsibility_semantic_conflict');
  map.set(key, value);
}

/** Select one static responsibility argument without borrowing interactive geometry or DOM. */
export function composeStaticResponsibilityScene(meaning) {
  const view = meaning?.media?.static?.views?.[0];
  const authored = meaning?.editorial?.presentation?.static?.views?.[0];
  const form = authored?.form;
  if (
    meaning?.completeness !== 'finite-unqualified-obligations' ||
    meaning.media.static.views.length !== 1 ||
    view?.id !== authored?.id ||
    view?.questionIds?.length !== 1 ||
    form?.schema !== 'architecture.visual-form/v1' ||
    form.kind !== 'responsibility' ||
    !Array.isArray(authored.groups) ||
    !Array.isArray(form.roles) ||
    !Array.isArray(form.handoffs) ||
    !Array.isArray(meaning.native?.selections) ||
    !Array.isArray(meaning.assertions)
  )
    fail('static_responsibility_input_invalid');
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  if (
    selections.size !== meaning.native.selections.length ||
    assertions.size !== meaning.assertions.length
  )
    fail('static_responsibility_identity_ambiguous');
  const claimMode = meaning.native.selections.some(
    ({ format }) => format === 'architecture.claim-model/v2',
  );
  if (
    claimMode
      ? meaning.native.selections.some(({ format }) => format !== 'architecture.claim-model/v2')
      : selectedStaticNativeViews(meaning, view).length !== 1
  )
    fail('static_responsibility_source_unadmitted');

  const nodes = new Map();
  const relations = new Map();
  const cards = new Map();
  const sourceAssertionCarriers = [];
  const editorialAssertions = [];
  for (const id of view.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail('static_responsibility_assertion_unbound');
    if (assertion.kind === 'editorial') {
      editorialAssertions.push(structuredClone(assertion));
      continue;
    }
    if (assertion.kind !== 'source') fail('static_responsibility_assertion_unbound');
    const selected = selections.get(assertion.selection);
    if (!selected) fail('static_responsibility_assertion_unbound');
    if (claimMode && selected.target.kind === 'claim') {
      const card = claimCard(selected);
      addBound(cards, claimKey(card), card);
      sourceAssertionCarriers.push({
        assertionId: id,
        selectionId: assertion.selection,
        kind: 'claim',
        nodeRefs: [],
        relationRefs: [],
        claimRefs: [{ namespace: card.namespace, reference: card.id, sha256: card.sha256 }],
      });
      continue;
    }
    if (
      !Array.isArray(selected.members?.elements) ||
      !Array.isArray(selected.members?.relations) ||
      (claimMode && !['entity', 'relation'].includes(selected.target.kind))
    )
      fail('static_responsibility_assertion_unbound');
    const nodeRefs = selected.members.elements.map((node) => {
      addBound(nodes, nodeKey(node), node);
      return { namespace: node.namespace, id: node.id };
    });
    const relationRefs = selected.members.relations.map((relation) => {
      addBound(relations, relationKey(relation), relation);
      return {
        namespace: relation.origin.namespace,
        reference: relation.id,
        sha256: relation.origin.sha256,
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

  const groupIds = new Set();
  const groupedNodes = new Set();
  for (const group of authored.groups) {
    if (groupIds.has(group.id) || !Array.isArray(group.elements) || !group.elements.length)
      fail('static_responsibility_group_invalid');
    groupIds.add(group.id);
    for (const member of group.elements) {
      const key = nodeKey(member);
      if (!nodes.has(key) || groupedNodes.has(key)) fail('static_responsibility_group_invalid');
      groupedNodes.add(key);
    }
  }
  if (
    groupedNodes.size !== nodes.size ||
    form.roles.length !== groupIds.size ||
    form.roles.some(({ group }) => !groupIds.has(group))
  )
    fail('static_responsibility_group_invalid');
  for (const relation of relations.values())
    if (!nodes.has(nodeKey(relation.from)) || !nodes.has(nodeKey(relation.to)))
      fail('static_responsibility_relation_endpoint_missing');
  const questions = new Map(meaning.questions.map((item) => [item.id, item]));
  const question = questions.get(view.questionIds[0]);
  if (!question) fail('static_responsibility_question_unbound');
  const links = claimMode
    ? linkClaimModelSources(
        view,
        assertions,
        selections,
        'static_responsibility_claim_relation_unbound',
      )
    : { links: [], subjectLinks: [] };
  return deepFreeze({
    schema: 'architecture.edition-static-responsibility-scene/v1',
    completeness: 'unqualified-scene',
    edition: meaning.edition,
    title: meaning.editorial.title,
    summary: meaning.editorial.narrative.summary,
    requestedWidth: meaning.editorial.presentation.static.width ?? null,
    editorialViewId: view.id,
    questionIds: view.questionIds,
    questions: [question],
    limitsByQuestion: view.limitsByQuestion,
    visualForm: structuredClone(form),
    groups: structuredClone(authored.groups),
    nodes: [...nodes.values()].map((item) => structuredClone(item)),
    relations: [...relations.values()].map((item) => ({
      ...structuredClone(item),
      label: claimMode
        ? claimRelationLabel(item, 'static_responsibility_relation_qualifiers_invalid')
        : item.label,
    })),
    ...(claimMode
      ? {
          claimCards: [...cards.values()],
          ...(links.links.length ? { claimRelationLinks: links.links } : {}),
          ...(links.subjectLinks.length ? { claimSubjectLinks: links.subjectLinks } : {}),
        }
      : {}),
    sourceAssertionCarriers,
    editorialAssertions,
    limits: meaning.limits,
  });
}
