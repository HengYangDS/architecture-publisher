import { fail, hasExactFields } from '../../src/protocol/values.mjs';
import { canonical, parseStrictJson } from '../../src/protocol/json.mjs';

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ origin, id }) => JSON.stringify([origin.namespace, id, origin.sha256]);
const claimKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);
const navigationLabel = (id) =>
  id.replaceAll('-', ' ').replace(/\b[a-z]/gu, (letter) => letter.toUpperCase());

function canonicalJsonLiteral(value) {
  if (typeof value !== 'string' || !value.length) return false;
  try {
    return canonical(parseStrictJson(Buffer.from(value), 'invalid', 'duplicate')) === value;
  } catch {
    return false;
  }
}

function linkedClaimAnchors(page, relations, claims) {
  if (!page.nodes.length || !page.claimCards?.length) {
    if (page.claimRelationLinks !== undefined || page.claimSubjectLinks !== undefined)
      fail('render_interactive_claim_relation_invalid');
    return { ordinals: new Map(), subjects: new Set() };
  }
  const relationLinks = page.claimRelationLinks ?? [];
  const subjectLinks = page.claimSubjectLinks ?? [];
  if (
    !Array.isArray(relationLinks) ||
    !Array.isArray(subjectLinks) ||
    relationLinks.length + subjectLinks.length !== page.claimCards.length
  )
    fail('render_interactive_claim_relation_invalid');
  const assertions = new Map(
    page.sourceAssertionCarriers.map((carrier) => [carrier.assertionId, carrier]),
  );
  const ordinals = new Map();
  for (const link of relationLinks) {
    if (!link || typeof link !== 'object' || Array.isArray(link))
      fail('render_interactive_claim_relation_invalid');
    const claim = assertions.get(link.claimAssertionId);
    const relation = assertions.get(link.relationAssertionId);
    if (
      claim?.kind !== 'claim' ||
      relation?.kind !== 'relation' ||
      claim.claimRefs?.length !== 1 ||
      relation.relationRefs?.length !== 1
    )
      fail('render_interactive_claim_relation_invalid');
    const claimGraphicId = claims.get(claimKey(claim.claimRefs[0]));
    const relationRef = relation.relationRefs[0];
    const relationGraphicId = relations.get(
      JSON.stringify([relationRef.namespace, relationRef.reference, relationRef.sha256]),
    );
    if (!claimGraphicId || !relationGraphicId || ordinals.has(claimGraphicId))
      fail('render_interactive_claim_relation_invalid');
    ordinals.set(claimGraphicId, Number(relationGraphicId.slice(2)) + 1);
  }
  const subjects = new Set();
  for (const link of subjectLinks) {
    if (!link || typeof link !== 'object' || Array.isArray(link))
      fail('render_interactive_claim_relation_invalid');
    const claim = assertions.get(link.claimAssertionId);
    const claimRef = claim?.claimRefs?.length === 1 ? claim.claimRefs[0] : null;
    const graphicId = claimRef ? claims.get(claimKey(claimRef)) : null;
    if (
      claim?.kind !== 'claim' ||
      !graphicId ||
      ordinals.has(graphicId) ||
      subjects.has(graphicId) ||
      !text(link.subject?.namespace) ||
      !text(link.subject?.id) ||
      !text(link.subject?.sha256) ||
      link.subject.namespace !== claimRef.namespace ||
      link.subject.sha256 !== claimRef.sha256
    )
      fail('render_interactive_claim_relation_invalid');
    subjects.add(graphicId);
  }
  if (ordinals.size + subjects.size !== claims.size)
    fail('render_interactive_claim_relation_invalid');
  return { ordinals, subjects };
}

function publicResponsibilityForm(page, privateGroups, claimGraphics, publicClaims) {
  const form = page.visualForm;
  if (form === undefined) return null;
  if (
    !hasExactFields(form, ['schema', 'kind', 'roles', 'handoffs']) ||
    form.schema !== 'architecture.visual-form/v1' ||
    form.kind !== 'responsibility' ||
    !Array.isArray(form.roles) ||
    !Array.isArray(form.handoffs) ||
    !Array.isArray(privateGroups) ||
    form.roles.length !== privateGroups.length
  )
    fail('render_responsibility_form_invalid');
  const groups = new Map(privateGroups.map((group) => [group.editorialId, group]));
  const editorial = new Map(page.editorialAssertions.map((item) => [item.id, item]));
  const source = new Map(page.sourceAssertionCarriers.map((item) => [item.assertionId, item]));
  const claimFacts = new Map(publicClaims.map((item) => [item.graphicId, item.facts]));
  const basis = (id) => {
    const authored = editorial.get(id);
    if (authored) {
      if (
        authored.kind !== 'editorial' ||
        authored.semanticStatus !== 'editor-attributed-unverified' ||
        !text(authored.statement) ||
        !text(authored.proponent)
      )
        fail('render_responsibility_form_invalid');
      return {
        kind: 'editorial',
        statement: authored.statement,
        proponent: authored.proponent,
      };
    }
    const carrier = source.get(id);
    const claimRef =
      carrier?.kind === 'claim' && carrier.claimRefs?.length === 1 ? carrier.claimRefs[0] : null;
    const graphicId = claimRef ? claimGraphics.get(claimKey(claimRef)) : null;
    const facts = claimFacts.get(graphicId);
    if (!graphicId || !facts) fail('render_responsibility_form_invalid');
    return {
      kind: 'source-claim',
      claimGraphicId: graphicId,
      conditions: facts
        .filter(({ label }) => ['Condition', 'Scope'].includes(label))
        .map(({ label, value }) => ({ label, value })),
    };
  };
  const seen = new Set();
  const roles = form.roles.map((item) => {
    if (!hasExactFields(item, ['group', 'basis']) || seen.has(item.group))
      fail('render_responsibility_form_invalid');
    const group = groups.get(item.group);
    if (!group) fail('render_responsibility_form_invalid');
    seen.add(item.group);
    return { groupId: group.graphicId, basis: basis(item.basis) };
  });
  const handoffs = form.handoffs.map((item) => {
    if (!hasExactFields(item, ['from', 'to', 'basis']) || item.from === item.to)
      fail('render_responsibility_form_invalid');
    const from = groups.get(item.from);
    const to = groups.get(item.to);
    if (!from || !to) fail('render_responsibility_form_invalid');
    return { fromGroup: from.graphicId, toGroup: to.graphicId, basis: basis(item.basis) };
  });
  if (seen.size !== groups.size) fail('render_responsibility_form_invalid');
  return { schema: form.schema, kind: form.kind, roles, handoffs };
}

/** Reduce one selected page to public reading data without raw source identity. */
export function projectInteractivePage(page, index) {
  if (
    !page ||
    !text(page.id) ||
    !Array.isArray(page.questionIds) ||
    !Array.isArray(page.questions) ||
    !Array.isArray(page.nodes) ||
    !Array.isArray(page.relations) ||
    (page.claimCards !== undefined && !Array.isArray(page.claimCards)) ||
    !Array.isArray(page.sourceAssertionCarriers) ||
    !Array.isArray(page.editorialAssertions) ||
    !page.limitsByQuestion ||
    typeof page.limitsByQuestion !== 'object' ||
    Array.isArray(page.limitsByQuestion)
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

  let publicGroups;
  let privateGroups;
  if (page.groups !== undefined) {
    if (!Array.isArray(page.groups) || !page.groups.length)
      fail('render_interactive_group_invalid');
    const ids = new Set();
    const grouped = new Set();
    privateGroups = page.groups.map((group, position) => {
      if (
        !hasExactFields(group, ['id', 'label', 'elements']) ||
        !text(group.id) ||
        !text(group.label) ||
        ids.has(group.id) ||
        !Array.isArray(group.elements) ||
        !group.elements.length
      )
        fail('render_interactive_group_invalid');
      ids.add(group.id);
      const nodeIds = group.elements.map((item) => {
        if (!hasExactFields(item, ['namespace', 'id'])) fail('render_interactive_group_invalid');
        const identity = key(item);
        const graphicId = nodes.get(identity);
        if (!graphicId || grouped.has(graphicId)) fail('render_interactive_group_invalid');
        grouped.add(graphicId);
        return graphicId;
      });
      return { editorialId: group.id, label: group.label, graphicId: `g-${position}`, nodeIds };
    });
    if (grouped.size !== publicNodes.length) fail('render_interactive_group_invalid');
    publicGroups = privateGroups.map(({ graphicId, label, nodeIds }) => ({
      id: graphicId,
      label,
      nodeIds,
    }));
  }

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
    const sourceQualifiers = relation.sourceQualifiers;
    if (sourceQualifiers !== undefined) {
      if (!Array.isArray(sourceQualifiers)) fail('render_interactive_relation_qualifiers_invalid');
      let bytes = 0;
      const names = new Set();
      for (const field of sourceQualifiers) {
        if (
          !hasExactFields(field, ['name', 'value']) ||
          typeof field.name !== 'string' ||
          typeof field.value !== 'string' ||
          names.has(field.name)
        )
          fail('render_interactive_relation_qualifiers_invalid');
        names.add(field.name);
        bytes += Buffer.byteLength(field.name) + Buffer.byteLength(field.value);
        if (bytes > 16 * 1024 * 1024 || !canonicalJsonLiteral(field.value))
          fail('render_interactive_relation_qualifiers_invalid');
      }
    }
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
      graphLabel: qualifiers,
      direction: relation.direction,
      ...(sourceQualifiers === undefined
        ? {}
        : { sourceQualifiers: structuredClone(sourceQualifiers) }),
    };
  });

  const claims = new Map();
  const publicClaims = (page.claimCards ?? []).map((claim, position) => {
    if (
      !text(claim?.namespace) ||
      !text(claim.id) ||
      !text(claim.sha256) ||
      !Array.isArray(claim.facts) ||
      !claim.facts.length ||
      claim.facts.some((fact) => !text(fact?.label) || !text(fact.value))
    )
      fail('render_interactive_claim_invalid');
    const identity = claimKey({
      namespace: claim.namespace,
      reference: claim.id,
      sha256: claim.sha256,
    });
    if (claims.has(identity)) fail('render_interactive_identity_ambiguous');
    const graphicId = `c-${position}`;
    claims.set(identity, graphicId);
    return { graphicId, facts: claim.facts };
  });
  const claimAnchors = linkedClaimAnchors(page, relations, claims);
  const visibleClaims = publicClaims
    .map((claim) => ({
      ...claim,
      ...(claimAnchors.ordinals.has(claim.graphicId)
        ? { relationOrdinal: claimAnchors.ordinals.get(claim.graphicId) }
        : {}),
      ...(claimAnchors.subjects.has(claim.graphicId) ? { sourceAnchor: 'entity' } : {}),
    }))
    .sort(
      (left, right) =>
        (left.relationOrdinal ?? Number.MAX_SAFE_INTEGER) -
        (right.relationOrdinal ?? Number.MAX_SAFE_INTEGER),
    );

  const questions = new Map(page.questions.map((question) => [question?.id, question]));
  if (questions.size !== page.questions.length) fail('render_interactive_identity_ambiguous');
  const questionIds = new Set(page.questionIds);
  if (
    questionIds.size !== page.questionIds.length ||
    questionIds.size !== questions.size ||
    [...questionIds].some((id) => !text(id) || !questions.has(id)) ||
    Object.keys(page.limitsByQuestion).length !== questionIds.size ||
    Object.keys(page.limitsByQuestion).some((id) => !questionIds.has(id))
  )
    fail('render_interactive_question_invalid');
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
      !Array.isArray(assertion.relationRefs) ||
      (assertion.claimRefs !== undefined && !Array.isArray(assertion.claimRefs))
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
    const claimIds = (assertion.claimRefs ?? []).map((item) => {
      if (!text(item?.namespace) || !text(item?.reference) || !text(item?.sha256))
        fail('render_interactive_carrier_invalid');
      return claims.get(claimKey(item));
    });
    if (!nodeIds.length && !relationIds.length && !claimIds.length)
      fail('render_interactive_carrier_missing');
    if ([...nodeIds, ...relationIds, ...claimIds].some((id) => !id))
      fail('render_interactive_carrier_missing');
    return {
      assertionId: assertion.assertionId,
      nodeIds,
      relationIds,
      ...(page.claimCards === undefined ? {} : { claimIds }),
    };
  });
  const claimedNodes = new Set(assertions.flatMap(({ nodeIds }) => nodeIds));
  const claimedRelations = new Set(assertions.flatMap(({ relationIds }) => relationIds));
  const claimedClaims = new Set(assertions.flatMap(({ claimIds }) => claimIds ?? []));
  if (
    publicNodes.some(({ id }) => !claimedNodes.has(id)) ||
    publicRelations.some(({ id }) => !claimedRelations.has(id)) ||
    publicClaims.some(({ graphicId }) => !claimedClaims.has(graphicId))
  )
    fail('render_interactive_carrier_unclaimed');

  const form = publicResponsibilityForm(page, privateGroups, claims, publicClaims);

  return {
    publicPage: {
      id: `page-${index}`,
      navigationLabel: navigationLabel(page.id),
      title: publicQuestions[0].text,
      questions: publicQuestions,
      nodes: publicNodes,
      ...(publicGroups === undefined ? {} : { groups: publicGroups }),
      ...(form === null ? {} : { form }),
      relations: publicRelations,
      ...(page.claimCards === undefined ? {} : { claims: visibleClaims }),
      editorialAssertions: publicEditorial,
    },
    carriers: {
      id: page.id,
      nodes: page.nodes.map((node, position) => ({
        source: { namespace: node.namespace, id: node.id },
        graphicId: `n-${position}`,
      })),
      ...(privateGroups === undefined ? {} : { groups: privateGroups }),
      relations: page.relations.map((relation, position) => ({
        source: {
          namespace: relation.origin.namespace,
          reference: relation.id,
          sha256: relation.origin.sha256,
        },
        graphicId: `r-${position}`,
      })),
      ...(page.claimCards === undefined
        ? {}
        : {
            claims: page.claimCards.map((claim, position) => ({
              source: {
                namespace: claim.namespace,
                reference: claim.id,
                sha256: claim.sha256,
              },
              graphicId: `c-${position}`,
            })),
          }),
      assertions,
    },
  };
}
