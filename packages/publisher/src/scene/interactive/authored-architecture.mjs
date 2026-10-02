import { canonical, deepFreeze } from '../../semantics/document.mjs';
import { fail } from '../../protocol/values.mjs';
import { validateInteractiveArchitectureScene } from './architecture.mjs';
import { classifyAggregateRelation } from '../aggregate-relation.mjs';
import {
  authoredReference,
  deriveAuthoredStatements,
  requireAuthoredStatementText,
} from '../statements.mjs';

const mismatch = () => fail('authored_interactive_semantic_mismatch');
const referenceFor = (namespace, kind, id) => JSON.stringify([namespace, kind, id]);

function reference(value) {
  if (typeof value !== 'string') mismatch();
  let parts;
  try {
    parts = JSON.parse(value);
  } catch {
    mismatch();
  }
  if (
    !Array.isArray(parts) ||
    parts.length !== 3 ||
    parts.some((part) => typeof part !== 'string' || !part) ||
    !['entity', 'relation'].includes(parts[1]) ||
    JSON.stringify(parts) !== value
  )
    mismatch();
  return parts;
}

function requiredMeaning(view, assertions, selections) {
  const required = new Map();
  const selectedForReference = new Map();
  const selectedByAssertion = new Map();
  let hasClaims = false;
  for (const id of view.assertionIds) {
    const assertion = assertions.get(id);
    if (assertion?.kind === 'editorial') {
      if (typeof assertion.statement !== 'string' || !assertion.statement.trim())
        fail('authored_interactive_editorial_unadmitted');
      continue;
    }
    if (assertion?.kind !== 'source') fail('authored_interactive_editorial_unadmitted');
    const item = selections.get(assertion.selection);
    if (
      item?.format !== 'architecture.claim-model/v2' ||
      !['entity', 'relation', 'claim'].includes(item.target?.kind)
    )
      fail('authored_interactive_source_unadmitted');
    selectedByAssertion.set(id, item);
    if (item.target.kind === 'claim') {
      hasClaims = true;
      continue;
    }
    for (const member of item.members.elements) {
      const key = referenceFor(member.namespace, 'entity', member.id);
      if (required.has(key) && canonical(required.get(key)) !== canonical(member)) mismatch();
      required.set(key, member);
      if (!selectedForReference.has(key)) selectedForReference.set(key, item);
    }
    for (const member of item.members.relations) {
      const key = referenceFor(member.origin.namespace, 'relation', member.id);
      if (required.has(key) && canonical(required.get(key)) !== canonical(member)) mismatch();
      required.set(key, member);
      if (!selectedForReference.has(key)) selectedForReference.set(key, item);
    }
  }
  if (
    !required.size &&
    !hasClaims &&
    !view.assertionIds.some((id) => assertions.get(id)?.kind === 'editorial')
  )
    mismatch();
  return { required, selectedForReference, selectedByAssertion, hasClaims };
}

function structuralFacts(id, member, selected, graphicId) {
  const [, kind] = reference(id);
  const provenance = member.provenance.map((sourceId) => {
    const authority = selected.provenanceSources?.[sourceId]?.authority;
    if (typeof authority !== 'string' || !authority) mismatch();
    return `${sourceId}: ${authority}`;
  });
  const facts =
    kind === 'entity'
      ? [
          { label: 'Entity kind', value: member.kind },
          { label: 'Source qualifiers', value: canonical(member.qualifiers) },
        ]
      : [
          { label: 'Relation kind', value: member.kind },
          { label: 'From', value: `${member.from.namespace}:${member.from.id}` },
          { label: 'To', value: `${member.to.namespace}:${member.to.id}` },
          { label: 'Source qualifiers', value: canonical(member.qualifiers) },
        ];
  return {
    reference: id,
    sourceSha256: selected.source.sha256,
    graphicId,
    title: kind === 'entity' ? member.label : `${member.from.id} → ${member.to.id}`,
    facts: [
      ...facts,
      { label: 'Declared provenance', value: provenance.join(' · ') },
      { label: 'Selected claimant', value: selected.source.claimant },
      { label: 'Declared model owner', value: selected.sourceOwner },
    ],
  };
}

function composePage(meaning, view, page, assertions, selections) {
  const scene = validateInteractiveArchitectureScene(page.scene);
  if (
    page.id !== view.id ||
    scene.id !== view.id ||
    scene.title !== meaning.editorial.title ||
    scene.subtitle !== page.label ||
    !['overview', 'mechanism'].includes(page.purpose)
  )
    mismatch();
  const { required, selectedForReference, selectedByAssertion, hasClaims } = requiredMeaning(
    view,
    assertions,
    selections,
  );
  const statements = deriveAuthoredStatements(
    {
      views: [view],
      assertions,
      selections,
      edition: meaning.edition,
      structuralReferences: new Set(required.keys()),
      declaredReferences: scene.requiredSemanticIds,
    },
    'authored_interactive_semantic_mismatch',
    'authored_interactive_claim_unbound',
  );
  const represented = new Map();
  const represent = (id, graphicId) => {
    const graphics = represented.get(id) ?? [];
    if (!graphics.includes(graphicId)) graphics.push(graphicId);
    represented.set(id, graphics);
  };
  const nodeEntities = new Map();
  const subjectNamespaces = {};
  for (const node of scene.nodes) {
    if (!node.semanticIds?.length) mismatch();
    const entities = new Set();
    const namespaces = new Set();
    for (const id of node.semanticIds) {
      const [namespace, kind] = reference(id);
      if (!required.has(id)) mismatch();
      namespaces.add(namespace);
      if (kind === 'entity') entities.add(id);
      represent(id, node.id);
    }
    if (!entities.size) mismatch();
    nodeEntities.set(node.id, entities);
    subjectNamespaces[node.id] = [...namespaces].sort();
  }
  for (const node of scene.nodes) {
    const entities = nodeEntities.get(node.id);
    for (const id of node.semanticIds) {
      const [namespace, kind] = reference(id);
      if (kind !== 'relation') continue;
      const relation = required.get(id);
      if (
        !entities.has(referenceFor(namespace, 'entity', relation.from.id)) ||
        !entities.has(referenceFor(namespace, 'entity', relation.to.id))
      )
        mismatch();
    }
  }
  for (const edge of scene.edges) {
    if (nodeEntities.has(edge.id)) mismatch();
    if (!edge.semanticIds?.length) mismatch();
    const from = nodeEntities.get(edge.from);
    const to = nodeEntities.get(edge.to);
    const namespaces = new Set();
    let directed = false;
    for (const id of edge.semanticIds) {
      const [namespace, kind] = reference(id);
      const relation = required.get(id);
      if (kind !== 'relation' || !relation) mismatch();
      const subject = referenceFor(namespace, 'entity', relation.from.id);
      const object = referenceFor(namespace, 'entity', relation.to.id);
      const role = classifyAggregateRelation(from, to, subject, object);
      if (role === null) mismatch();
      if (role === 'cross') {
        directed = true;
        namespaces.add(namespace);
        represent(id, edge.id);
      } else {
        represent(id, role === 'from-context' ? edge.from : edge.to);
      }
    }
    if (!directed) mismatch();
    subjectNamespaces[edge.id] = [...namespaces].sort();
  }
  if (represented.size !== required.size || [...required.keys()].some((id) => !represented.has(id)))
    mismatch();

  const textGraphics = new Map();
  for (const label of scene.texts ?? []) {
    const namespaces = new Set();
    for (const id of label.semanticIds) {
      const [namespace, kind] = authoredReference(
        id,
        ['entity', 'relation', 'claim', 'editorial'],
        'authored_interactive_semantic_mismatch',
      );
      if (!label.visible || !label.text.trim() || !statements.requiredReferences.has(id))
        mismatch();
      const graphics = textGraphics.get(id) ?? [];
      graphics.push(label.id);
      textGraphics.set(id, graphics);
      if (kind !== 'editorial') namespaces.add(namespace);
    }
    if (label.semanticIds.length) subjectNamespaces[label.id] = [...namespaces].sort();
  }
  requireAuthoredStatementText(statements, textGraphics);
  const carriers = view.assertionIds.map((assertionId) => {
    const editorial = statements.editorial.get(assertionId);
    if (editorial)
      return {
        assertionId,
        edition: editorial.edition,
        graphicIds: [...textGraphics.get(editorial.reference)],
        representation: 'editorial-statement',
      };
    const selected = selectedByAssertion.get(assertionId);
    const statement = statements.claims.get(assertionId);
    const graphicIds =
      selected.target.kind === 'claim'
        ? [
            ...(statement.direct ? (textGraphics.get(statement.reference) ?? []) : []),
            ...(represented.get(statement.anchor) ?? []),
          ]
        : [
            ...selected.members.elements.flatMap(
              (member) =>
                represented.get(referenceFor(member.namespace, 'entity', member.id)) ?? [],
            ),
            ...selected.members.relations.flatMap(
              (member) =>
                represented.get(referenceFor(member.origin.namespace, 'relation', member.id)) ?? [],
            ),
          ];
    if (!graphicIds.length || graphicIds.some((graphicId) => !graphicId)) mismatch();
    if (statement?.anchor && !represented.get(statement.anchor)?.length) mismatch();
    return {
      assertionId,
      selectionId: selected.selectionId,
      graphicIds: [...new Set(graphicIds)],
      ...(statement?.direct ? { representation: 'source-statement' } : {}),
    };
  });
  const facts = [...required].flatMap(([id, member]) =>
    represented
      .get(id)
      .map((graphicId) => structuralFacts(id, member, selectedForReference.get(id), graphicId)),
  );
  const claimReferences = new Map();
  for (const assertionId of view.assertionIds) {
    const statement = statements.claims.get(assertionId);
    if (!statement) continue;
    const { card, reference: claimReference } = statement;
    const graphicIds = [
      ...(statement.direct ? (textGraphics.get(claimReference) ?? []) : []),
      ...(represented.get(statement.anchor) ?? []),
    ];
    for (const graphicId of new Set(graphicIds)) {
      const record = {
        reference: claimReference,
        sourceSha256: card.sha256,
        graphicId,
        title: `Claim: ${card.id}`,
        facts: card.facts,
      };
      const occurrence = JSON.stringify([claimReference, graphicId]);
      const previous = claimReferences.get(occurrence);
      if (previous && canonical(previous) !== canonical(record)) mismatch();
      claimReferences.set(occurrence, record);
    }
  }
  facts.push(...claimReferences.values());
  for (const { assertion, reference, edition } of statements.editorial.values())
    for (const graphicId of textGraphics.get(reference))
      facts.push({
        reference,
        editionSha256: edition.sha256,
        graphicId,
        title: `Editorial: ${assertion.id}`,
        facts: [
          { label: 'Statement', value: assertion.statement },
          { label: 'Proponent', value: assertion.proponent },
          { label: 'Basis', value: assertion.basis.join(' · ') },
          { label: 'Questions', value: assertion.questions.join(' · ') },
          { label: 'Status', value: 'editor-attributed-unverified' },
        ],
      });
  return {
    id: page.id,
    label: page.label,
    purpose: page.purpose,
    scene,
    subjectNamespaces,
    carriers,
    facts,
    hasClaims,
  };
}

/** Re-derive selected meaning to visible Archify carriers before rendering. */
export function composeAuthoredInteractiveArchitecture(meaning) {
  const views = meaning?.media?.interactive?.views;
  const selected = meaning?.refinement?.media?.interactive;
  if (
    selected?.kind !== 'authored-architecture' ||
    !Array.isArray(views) ||
    !Array.isArray(selected.pages) ||
    views.length !== selected.pages.length ||
    !Array.isArray(meaning.assertions) ||
    !Array.isArray(meaning.native?.selections)
  )
    fail('authored_interactive_input_invalid');
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  if (
    assertions.size !== meaning.assertions.length ||
    selections.size !== meaning.native.selections.length
  )
    fail('authored_interactive_input_invalid');
  const pages = views.map((view, index) =>
    composePage(meaning, view, selected.pages[index], assertions, selections),
  );
  if (
    pages[0]?.purpose !== 'overview' ||
    pages.slice(1).some(({ purpose }) => purpose !== 'mechanism')
  )
    fail('authored_interactive_narrative_invalid');
  return deepFreeze({
    pages,
    carriers: pages.map(({ id, carriers }) => ({ id, assertions: carriers })),
    limits: pages.some(({ scene }) =>
      (scene.texts ?? []).some(({ semanticIds }) =>
        semanticIds.some((id) => ['claim', 'editorial'].includes(JSON.parse(id)[1])),
      ),
    )
      ? ['authored-statement-wording-unverified']
      : [],
  });
}
