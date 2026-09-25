import { canonical, deepFreeze, record, text } from '../../semantics/document.mjs';
import { fail, isDigest } from '../../source/manifest.mjs';

const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ id, origin }) => JSON.stringify([origin.namespace, id, origin.sha256]);
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
    fail('interactive_scene_source_binding_invalid');
  return {
    namespace: value.namespace,
    id: value.id,
    sha256: value.sha256,
    kind: value.kind,
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
    fail('interactive_scene_source_binding_invalid');
  return {
    id: value.id,
    from: structuredClone(value.from),
    to: structuredClone(value.to),
    kind: value.kind,
    direction: value.direction,
    label: value.label,
    origin: structuredClone(value.origin),
  };
}

function addBound(map, identity, value) {
  const previous = map.get(identity);
  if (previous && canonical(previous) !== canonical(value))
    fail('interactive_scene_semantic_conflict');
  map.set(identity, value);
}

function composePage(view, selections, assertions, questions) {
  const nodes = new Map();
  const relations = new Map();
  const sourceAssertionCarriers = [];
  const editorialAssertions = [];
  for (const id of view.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail('interactive_scene_assertion_unbound');
    if (assertion.kind === 'editorial') {
      editorialAssertions.push(structuredClone(assertion));
      continue;
    }
    const selected = selections.get(assertion.selection);
    if (!selected) fail('interactive_scene_assertion_unbound');
    const nodeRefs = selected.members.elements.map((member) => {
      const projected = element(member);
      addBound(nodes, key(projected), projected);
      return { namespace: projected.namespace, id: projected.id };
    });
    const relationRefs = selected.members.relations.map((member) => {
      const projected = relation(member);
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
      fail('interactive_scene_relation_endpoint_missing');
  const questionRecords = view.questionIds.map((id) => {
    const question = questions.get(id);
    if (!question) fail('interactive_scene_question_unbound');
    return question;
  });
  return {
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
    sourceAssertionCarriers,
    editorialAssertions,
  };
}

/** Compile page-local semantic work, leaving geometry and DOM to its medium owner. */
export function composeInteractiveEditionScene(meaning) {
  if (
    meaning?.completeness !== 'finite-unqualified-obligations' ||
    !Array.isArray(meaning.native?.selections) ||
    !Array.isArray(meaning.assertions) ||
    !Array.isArray(meaning.questions) ||
    !Array.isArray(meaning.media?.interactive?.views) ||
    !meaning.media.interactive.views.length ||
    !record(meaning.editorial)
  )
    fail('interactive_scene_input_invalid');
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const questions = new Map(meaning.questions.map((item) => [item.id, item]));
  const views = meaning.media.interactive.views;
  if (
    selections.size !== meaning.native.selections.length ||
    assertions.size !== meaning.assertions.length ||
    questions.size !== meaning.questions.length ||
    new Set(views.map(({ id }) => id)).size !== views.length
  )
    fail('interactive_scene_identity_ambiguous');
  return deepFreeze({
    schema: 'architecture.edition-interactive-scene/v1',
    completeness: 'unqualified-scene',
    edition: meaning.edition,
    title: meaning.editorial.title,
    summary: meaning.editorial.narrative.summary,
    readingOrder: meaning.editorial.narrative.readingOrder,
    visualPolicy: meaning.editorial.visualPolicy,
    pages: views.map((view) => composePage(view, selections, assertions, questions)),
    limits: meaning.limits,
  });
}
