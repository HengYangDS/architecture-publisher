import { canonical } from '../source/json.mjs';
import { fail } from '../source/manifest.mjs';
import { claimCard } from '../scene/claim-card.mjs';
import { claimDependsOnSelectedRelation } from '../semantics/native-claim-model.mjs';

const mismatch = () => fail('edition_visible_coverage_mismatch');
const same = (left, right) => canonical(left) === canonical(right);
const nodeKey = ({ namespace, id }) => canonical([namespace, id]);
const relationKey = ({ namespace, reference, sha256 }) => canonical([namespace, reference, sha256]);
const claimKey = relationKey;

function validateClaimCarriers(page, selections, assertions) {
  const cards = new Map(
    page.claimCards.map((card) => [
      claimKey({ namespace: card.namespace, reference: card.id, sha256: card.sha256 }),
      card,
    ]),
  );
  if (cards.size !== page.claimCards.length) mismatch();
  const required = new Set();
  for (const carrier of page.sourceAssertionCarriers) {
    const selection = selections.get(assertions.get(carrier.assertionId)?.selection);
    if (selection?.target.kind !== 'claim') {
      if (carrier.claimRefs?.length) mismatch();
      continue;
    }
    if (!Array.isArray(carrier.claimRefs) || carrier.claimRefs.length !== 1) mismatch();
    let expectedCard;
    try {
      expectedCard = claimCard(selection);
    } catch {
      mismatch();
    }
    const identity = claimKey(carrier.claimRefs[0]);
    if (!same(cards.get(identity), expectedCard)) mismatch();
    required.add(identity);
  }
  if (required.size !== cards.size) mismatch();
  return required;
}

function validateClaimLinks(page, selections, assertions, required) {
  const links = page.claimRelationLinks;
  const carriers = new Map(
    page.sourceAssertionCarriers.map((carrier) => [carrier.assertionId, carrier]),
  );
  const linkedClaims = new Set();
  const linkedRelations = new Set();
  if (!Array.isArray(links) || links.length !== required.size) mismatch();
  for (const link of links) {
    if (!link || typeof link !== 'object' || Array.isArray(link)) mismatch();
    const { claimAssertionId, relationAssertionId } = link;
    const claim = carriers.get(claimAssertionId);
    const relation = carriers.get(relationAssertionId);
    const claimSelection = selections.get(assertions.get(claimAssertionId)?.selection);
    const relationSelection = selections.get(assertions.get(relationAssertionId)?.selection);
    const sourceRelation = relationSelection?.members?.relations?.[0];
    if (
      linkedClaims.has(claimAssertionId) ||
      claim?.kind !== 'claim' ||
      relation?.kind !== 'relation' ||
      claim.claimRefs?.length !== 1 ||
      relation.relationRefs?.length !== 1 ||
      !sourceRelation?.origin?.namespace ||
      !sourceRelation.origin.sha256 ||
      !Array.isArray(relationSelection.members?.elements) ||
      !same(relation.relationRefs, [
        {
          namespace: sourceRelation.origin.namespace,
          reference: sourceRelation.id,
          sha256: sourceRelation.origin.sha256,
        },
      ]) ||
      !same(
        relation.nodeRefs,
        relationSelection.members.elements.map(({ namespace, id }) => ({ namespace, id })),
      ) ||
      !claimDependsOnSelectedRelation(claimSelection, relationSelection)
    )
      mismatch();
    linkedClaims.add(claimAssertionId);
    linkedRelations.add(relationAssertionId);
  }
  if (
    linkedClaims.size !== required.size ||
    page.sourceAssertionCarriers.some(
      (carrier) => carrier.kind === 'relation' && !linkedRelations.has(carrier.assertionId),
    )
  )
    mismatch();
}

/** Check the selected view-to-carrier join before building an unqualified Candidate. */
export function validateVisibleSelection(meaning, medium, scene, carriers) {
  const views = meaning?.media?.[medium]?.views;
  const pages = medium === 'static' ? [scene] : scene?.pages;
  const maps = medium === 'static' ? [carriers] : carriers;
  if (
    !['static', 'interactive'].includes(medium) ||
    !Array.isArray(meaning?.assertions) ||
    !Array.isArray(views) ||
    !Array.isArray(pages) ||
    !Array.isArray(maps) ||
    views.length !== pages.length ||
    views.length !== maps.length
  )
    mismatch();
  const assertions = new Map(meaning.assertions.map((assertion) => [assertion.id, assertion]));
  if (assertions.size !== meaning.assertions.length) mismatch();
  const selections = new Map(
    (meaning.native?.selections ?? []).map((selection) => [selection.selectionId, selection]),
  );
  for (const [index, view] of views.entries()) {
    const page = pages[index];
    const map = maps[index];
    if (
      !Array.isArray(view?.assertionIds) ||
      !Array.isArray(view.questionIds) ||
      !Array.isArray(page?.sourceAssertionCarriers) ||
      !Array.isArray(page.editorialAssertions) ||
      !Array.isArray(map?.assertions) ||
      !Array.isArray(map.nodes) ||
      !Array.isArray(map.relations) ||
      (page.claimCards !== undefined && !Array.isArray(page.claimCards)) ||
      (map.claims !== undefined && !Array.isArray(map.claims)) ||
      (page.claimCards === undefined) !== (map.claims === undefined) ||
      view.assertionIds.some((id) => !['source', 'editorial'].includes(assertions.get(id)?.kind))
    )
      mismatch();
    const sourceIds = view.assertionIds.filter((id) => assertions.get(id).kind === 'source');
    const editorialIds = view.assertionIds.filter((id) => assertions.get(id).kind === 'editorial');
    const expected = {
      id: view.id,
      questionIds: view.questionIds,
      limitsByQuestion: view.limitsByQuestion,
      sourceIds,
      editorialIds,
    };
    const actual = {
      id: medium === 'static' ? page.editorialViewId : page.id,
      questionIds: page.questionIds,
      limitsByQuestion: page.limitsByQuestion,
      sourceIds: page.sourceAssertionCarriers.map(({ assertionId }) => assertionId),
      editorialIds: page.editorialAssertions.map(({ id }) => id),
    };
    if (
      !same(actual, expected) ||
      (medium === 'interactive' && map.id !== view.id) ||
      !same(
        map.assertions.map(({ assertionId }) => assertionId),
        sourceIds,
      )
    )
      mismatch();
    if (page.claimCards !== undefined) {
      const required = validateClaimCarriers(page, selections, assertions);
      if (
        (medium === 'static' && page.edges?.length) ||
        (medium === 'interactive' && page.relations?.length)
      )
        validateClaimLinks(page, selections, assertions, required);
    }
    if (
      !view.assertionsByQuestion ||
      !same(Object.keys(view.assertionsByQuestion).sort(), [...view.questionIds].sort()) ||
      view.questionIds.some((question) => {
        const selected = view.assertionsByQuestion[question];
        const limits = view.limitsByQuestion?.[question];
        return (
          !Array.isArray(selected) ||
          !Array.isArray(limits) ||
          (!selected.length && !limits.length) ||
          selected.some((id) => {
            const declared = assertions.get(id)?.questions;
            return (
              !view.assertionIds.includes(id) ||
              !Array.isArray(declared) ||
              !declared.includes(question)
            );
          })
        );
      })
    )
      mismatch();
    const represented = new Set(
      view.questionIds.flatMap((question) => view.assertionsByQuestion[question]),
    );
    if (!same([...represented].sort(), [...view.assertionIds].sort())) mismatch();
    const graphics = [...map.nodes, ...map.relations, ...(map.claims ?? [])].map(
      ({ graphicId }) => graphicId,
    );
    const graphicIds = new Set(graphics);
    if (
      graphicIds.size !== graphics.length ||
      graphics.some((id) => typeof id !== 'string' || !id) ||
      map.assertions.some((carrier) => {
        const nodeIds = medium === 'static' ? carrier.nodeGraphicIds : carrier.nodeIds;
        const relationIds = medium === 'static' ? carrier.relationGraphicIds : carrier.relationIds;
        const claimIds = medium === 'static' ? carrier.claimGraphicIds : carrier.claimIds;
        return (
          !Array.isArray(nodeIds) ||
          !Array.isArray(relationIds) ||
          (map.claims !== undefined && !Array.isArray(claimIds)) ||
          (!nodeIds.length && !relationIds.length && !claimIds?.length) ||
          [...nodeIds, ...relationIds, ...(claimIds ?? [])].some((id) => !graphicIds.has(id))
        );
      })
    )
      mismatch();
    const nodeGraphics = new Map(
      map.nodes.map(({ source, graphicId }) => [nodeKey(source), graphicId]),
    );
    const relationGraphics = new Map(
      map.relations.map(({ source, graphicId }) => [relationKey(source), graphicId]),
    );
    const claimGraphics = new Map(
      (map.claims ?? []).map(({ source, graphicId }) => [claimKey(source), graphicId]),
    );
    if (
      nodeGraphics.size !== map.nodes.length ||
      relationGraphics.size !== map.relations.length ||
      claimGraphics.size !== (map.claims ?? []).length ||
      !same(
        (map.claims ?? []).map(({ source }) => claimKey(source)).sort(),
        (page.claimCards ?? [])
          .map(({ namespace, id, sha256 }) => ({
            namespace,
            reference: id,
            sha256,
          }))
          .map(claimKey)
          .sort(),
      )
    )
      mismatch();
    for (const [at, assertion] of page.sourceAssertionCarriers.entries()) {
      const projected = map.assertions[at];
      const nodeIds = medium === 'static' ? projected.nodeGraphicIds : projected.nodeIds;
      const relationIds =
        medium === 'static' ? projected.relationGraphicIds : projected.relationIds;
      const claimIds = medium === 'static' ? projected.claimGraphicIds : projected.claimIds;
      if (
        !same(
          nodeIds,
          assertion.nodeRefs.map((ref) => nodeGraphics.get(nodeKey(ref))),
        ) ||
        !same(
          relationIds,
          assertion.relationRefs.map((ref) => relationGraphics.get(relationKey(ref))),
        ) ||
        !same(
          claimIds ?? [],
          (assertion.claimRefs ?? []).map((ref) => claimGraphics.get(claimKey(ref))),
        )
      )
        mismatch();
    }
  }
}
