import { fail } from '../../src/source/manifest.mjs';

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ origin, id }) => JSON.stringify([origin.namespace, id, origin.sha256]);

/** Reduce one selected page to public reading data without raw source identity. */
export function projectInteractivePage(page, index) {
  if (
    !page ||
    !text(page.id) ||
    !Array.isArray(page.questionIds) ||
    !Array.isArray(page.questions) ||
    !Array.isArray(page.nodes) ||
    !Array.isArray(page.relations) ||
    !Array.isArray(page.sourceAssertionCarriers) ||
    !Array.isArray(page.editorialAssertions) ||
    !page.limitsByQuestion ||
    typeof page.limitsByQuestion !== 'object'
  )
    fail('render_interactive_scene_invalid');

  const nodes = new Map();
  const publicNodes = page.nodes.map((node, position) => {
    if (!text(node?.namespace) || !text(node.id) || !text(node.label))
      fail('render_interactive_node_invalid');
    const identity = key(node);
    if (nodes.has(identity)) fail('render_interactive_identity_ambiguous');
    const graphicId = `n-${position}`;
    nodes.set(identity, graphicId);
    return {
      id: graphicId,
      label: node.label,
      kind: text(node.kind) ? node.kind : null,
    };
  });

  const relations = new Map();
  const publicRelations = page.relations.map((relation, position) => {
    if (
      !text(relation?.id) ||
      !text(relation.origin?.namespace) ||
      !text(relation.origin?.sha256) ||
      !['forward', 'bidirectional'].includes(relation.direction)
    )
      fail('render_interactive_relation_invalid');
    if (
      !text(relation.from?.namespace) ||
      !text(relation.from?.id) ||
      !text(relation.to?.namespace) ||
      !text(relation.to?.id)
    )
      fail('render_interactive_relation_endpoint_missing');
    const source = nodes.get(key(relation.from));
    const target = nodes.get(key(relation.to));
    if (!source || !target) fail('render_interactive_relation_endpoint_missing');
    const identity = relationKey(relation);
    if (relations.has(identity)) fail('render_interactive_identity_ambiguous');
    const graphicId = `r-${position}`;
    relations.set(identity, graphicId);
    const qualifiers = [relation.label, relation.kind]
      .filter((value, at, all) => text(value) && all.indexOf(value) === at)
      .join(' · ');
    return {
      id: graphicId,
      source,
      target,
      label: qualifiers,
      direction: relation.direction,
    };
  });

  const questions = new Map(page.questions.map((question) => [question?.id, question]));
  if (questions.size !== page.questions.length) fail('render_interactive_identity_ambiguous');
  const publicQuestions = page.questionIds.map((id) => {
    const question = questions.get(id);
    const limits = page.limitsByQuestion[id];
    if (!text(question?.text) || !Array.isArray(limits))
      fail('render_interactive_question_invalid');
    return {
      text: question.text,
      limits: limits.map(({ reason }) => {
        if (!text(reason)) fail('render_interactive_limit_invalid');
        return reason;
      }),
    };
  });
  if (!publicQuestions.length) fail('render_interactive_question_invalid');

  const publicEditorial = page.editorialAssertions.map((assertion) => {
    if (
      assertion?.kind !== 'editorial' ||
      assertion.semanticStatus !== 'editor-attributed-unverified' ||
      !text(assertion.statement) ||
      !text(assertion.proponent)
    )
      fail('render_interactive_editorial_invalid');
    return { statement: assertion.statement, proponent: assertion.proponent };
  });

  const assertionIds = new Set();
  const assertions = page.sourceAssertionCarriers.map((assertion) => {
    if (
      !text(assertion?.assertionId) ||
      !Array.isArray(assertion.nodeRefs) ||
      !Array.isArray(assertion.relationRefs)
    )
      fail('render_interactive_carrier_invalid');
    if (assertionIds.has(assertion.assertionId)) fail('render_interactive_identity_ambiguous');
    assertionIds.add(assertion.assertionId);
    const nodeIds = assertion.nodeRefs.map((item) => {
      if (!text(item?.namespace) || !text(item?.id)) fail('render_interactive_carrier_invalid');
      return nodes.get(key(item));
    });
    const relationIds = assertion.relationRefs.map((item) => {
      if (!text(item?.namespace) || !text(item?.reference) || !text(item?.sha256))
        fail('render_interactive_carrier_invalid');
      return relations.get(JSON.stringify([item.namespace, item.reference, item.sha256]));
    });
    if (!nodeIds.length && !relationIds.length) fail('render_interactive_carrier_missing');
    if ([...nodeIds, ...relationIds].some((id) => !id)) fail('render_interactive_carrier_missing');
    return { assertionId: assertion.assertionId, nodeIds, relationIds };
  });
  const claimedNodes = new Set(assertions.flatMap(({ nodeIds }) => nodeIds));
  const claimedRelations = new Set(assertions.flatMap(({ relationIds }) => relationIds));
  if (
    publicNodes.some(({ id }) => !claimedNodes.has(id)) ||
    publicRelations.some(({ id }) => !claimedRelations.has(id))
  )
    fail('render_interactive_carrier_unclaimed');

  return {
    publicPage: {
      id: `page-${index}`,
      title: publicQuestions[0].text,
      questions: publicQuestions,
      nodes: publicNodes,
      relations: publicRelations,
      editorialAssertions: publicEditorial,
    },
    carriers: {
      id: page.id,
      nodes: page.nodes.map((node, position) => ({
        source: { namespace: node.namespace, id: node.id },
        graphicId: `n-${position}`,
      })),
      relations: page.relations.map((relation, position) => ({
        source: {
          namespace: relation.origin.namespace,
          reference: relation.id,
          sha256: relation.origin.sha256,
        },
        graphicId: `r-${position}`,
      })),
      assertions,
    },
  };
}
