import { canonical, record } from '../semantics/document.mjs';
import { claimDependsOnSelectedRelation } from '../semantics/native-claim-model.mjs';
import { fail } from '../source/manifest.mjs';

export const SOURCE_REPORTED_TOPOLOGY_NOTE =
  'Source-reported topology; provenance unverified; typed claim status not selected.';
export const UNLINKED_RELATION_NOTE =
  'Unlinked relations show source topology only; typed claim status is not selected, and provenance is unverified.';

/** Derive relation and subject associations without inventing graph edges. */
export function linkClaimModelSources(view, assertions, selections, errorCode) {
  if (!Array.isArray(view?.assertionIds)) fail(errorCode);
  const sources = view.assertionIds
    .map((id) => ({ assertionId: id, assertion: assertions.get(id) }))
    .filter(({ assertion }) => assertion?.kind === 'source')
    .map(({ assertionId, assertion }) => ({
      assertionId,
      selection: selections.get(assertion.selection),
    }));
  if (
    sources.some(
      ({ selection }) => !['entity', 'relation', 'claim'].includes(selection?.target.kind),
    )
  )
    fail(errorCode);
  const relations = sources.filter(({ selection }) => selection.target.kind === 'relation');
  const claims = sources.filter(({ selection }) => selection.target.kind === 'claim');
  const links = [];
  const subjectLinks = [];
  for (const { assertionId, selection } of claims) {
    const claim = selection.members?.claims?.[0];
    if (claim?.object === null) {
      const subject = selection.members?.elements?.find((item) => item?.id === claim.subject);
      if (
        !subject ||
        selection.members?.claims?.length !== 1 ||
        !selection.predicate ||
        selection.predicate.valueKind === 'entity' ||
        subject.namespace !== selection.source?.namespace ||
        subject.sha256 !== selection.source?.sha256 ||
        !claim.dependsOn?.some(
          (reference) => reference?.section === 'entities' && reference.id === claim.subject,
        )
      )
        fail(errorCode);
      subjectLinks.push({
        claimAssertionId: assertionId,
        subject: {
          namespace: subject.namespace,
          id: subject.id,
          sha256: subject.sha256,
        },
      });
      continue;
    }
    const matches = relations.filter(({ selection: related }) =>
      claimDependsOnSelectedRelation(selection, related),
    );
    if (matches.length !== 1) fail(errorCode);
    links.push({ claimAssertionId: assertionId, relationAssertionId: matches[0].assertionId });
  }
  return { relations: relations.map(({ selection }) => selection), links, subjectLinks };
}

/** Preserve source-declared fields without turning them into typed claims. */
export function claimRelationQualifiers(relation, errorCode) {
  if (!record(relation?.qualifiers)) fail(errorCode);
  return Object.keys(relation.qualifiers)
    .sort()
    .map((name) => ({ name, value: structuredClone(relation.qualifiers[name]) }));
}

/** Show declared relation qualifiers in the independent static composition. */
export function claimRelationLabel(relation, errorCode) {
  const qualifiers = claimRelationQualifiers(relation, errorCode);
  return qualifiers.length
    ? `Source relation qualifiers (unverified): ${qualifiers
        .map(
          ({ name, value }) => `${name}: ${typeof value === 'string' ? value : canonical(value)}`,
        )
        .join(' · ')}`
    : null;
}
