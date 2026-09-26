import { canonical, record } from '../semantics/document.mjs';
import { claimDependsOnSelectedRelation } from '../semantics/native-claim-model.mjs';
import { fail } from '../source/manifest.mjs';

export const SOURCE_REPORTED_TOPOLOGY_NOTE =
  'Source-reported topology; provenance unverified; typed claim status not selected.';

/** Derive one claim-to-relation association from selected source meaning. */
export function linkClaimModelSources(view, assertions, selections, errorCode) {
  if (!Array.isArray(view?.assertionIds)) fail(errorCode);
  const sources = view.assertionIds
    .map((id) => ({ assertionId: id, assertion: assertions.get(id) }))
    .filter(({ assertion }) => assertion?.kind === 'source')
    .map(({ assertionId, assertion }) => ({
      assertionId,
      selection: selections.get(assertion.selection),
    }));
  if (sources.some(({ selection }) => !['relation', 'claim'].includes(selection?.target.kind)))
    fail(errorCode);
  const relations = sources.filter(({ selection }) => selection.target.kind === 'relation');
  const claims = sources.filter(({ selection }) => selection.target.kind === 'claim');
  if (!relations.length) fail(errorCode);
  if (!claims.length) return { relations: relations.map(({ selection }) => selection), links: [] };
  const links = claims.map(({ assertionId, selection }) => {
    const matches = relations.filter(({ selection: related }) =>
      claimDependsOnSelectedRelation(selection, related),
    );
    if (matches.length !== 1) fail(errorCode);
    return { claimAssertionId: assertionId, relationAssertionId: matches[0].assertionId };
  });
  if (
    relations.some(
      ({ assertionId }) => !links.some((link) => link.relationAssertionId === assertionId),
    )
  )
    fail(errorCode);
  return { relations: relations.map(({ selection }) => selection), links };
}

/** Show declared relation qualifiers without inventing claim status. */
export function claimRelationLabel(relation, errorCode) {
  if (!record(relation?.qualifiers)) fail(errorCode);
  const names = Object.keys(relation.qualifiers).sort();
  return names.length
    ? `Source relation qualifiers (unverified): ${names
        .map((name) => {
          const value = relation.qualifiers[name];
          return `${name}: ${typeof value === 'string' ? value : canonical(value)}`;
        })
        .join(' · ')}`
    : null;
}
