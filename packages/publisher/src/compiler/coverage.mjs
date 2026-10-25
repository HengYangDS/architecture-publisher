import { canonical } from "../protocol/json.mjs";
import { fail } from "../protocol/values.mjs";
import { claimCard } from "../scene/claim-card.mjs";
import { linkClaimModelSources } from "../scene/claim-relations.mjs";

const mismatch = () => fail("edition_visible_coverage_mismatch");
const same = (left, right) => canonical(left) === canonical(right);
const nodeKey = ({ namespace, id }) => canonical([namespace, id]);
const relationKey = ({ namespace, reference, sha256 }) => canonical([namespace, reference, sha256]);
const claimKey = relationKey;

function validateClaimCarriers(page, selections, assertions, visibleEntities) {
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
    if (selection?.target.kind !== "claim") {
      if (carrier.claimRefs?.length) mismatch();
      continue;
    }
    if (!Array.isArray(carrier.claimRefs) || carrier.claimRefs.length !== 1) mismatch();
    let expectedCard;
    try {
      expectedCard = claimCard(selection, visibleEntities);
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

function selectedRelationMatches(carrier, selection) {
  const relation = selection?.members?.relations?.[0];
  return (
    carrier?.kind === "relation" &&
    selection?.target.kind === "relation" &&
    Array.isArray(selection.members?.relations) &&
    selection.members.relations.length === 1 &&
    relation?.origin?.namespace &&
    relation.origin.sha256 &&
    Array.isArray(selection.members.elements) &&
    Array.isArray(carrier.nodeRefs) &&
    Array.isArray(carrier.relationRefs) &&
    same(carrier.relationRefs, [
      {
        namespace: relation.origin.namespace,
        reference: relation.id,
        sha256: relation.origin.sha256,
      },
    ]) &&
    same(
      carrier.nodeRefs,
      selection.members.elements.map(({ namespace, id }) => ({ namespace, id })),
    )
  );
}

function validateClaimLinks(view, page, selections, assertions, required) {
  for (const carrier of page.sourceAssertionCarriers) {
    const selection = selections.get(assertions.get(carrier.assertionId)?.selection);
    if (selection?.target.kind === "relation" && !selectedRelationMatches(carrier, selection))
      mismatch();
  }
  if (!required.size) {
    if (page.claimRelationLinks !== undefined || page.claimSubjectLinks !== undefined) mismatch();
    return;
  }
  const expected = linkClaimModelSources(
    view,
    assertions,
    selections,
    "edition_visible_coverage_mismatch",
  );
  if (expected.links.length + expected.subjectLinks.length !== required.size) mismatch();
  if (
    (expected.links.length
      ? !Array.isArray(page.claimRelationLinks) || !same(page.claimRelationLinks, expected.links)
      : page.claimRelationLinks !== undefined) ||
    (expected.subjectLinks.length
      ? !Array.isArray(page.claimSubjectLinks) ||
        !same(page.claimSubjectLinks, expected.subjectLinks)
      : page.claimSubjectLinks !== undefined)
  )
    mismatch();
}

function validateInteractiveGroups(meaning, view, index, page, map, nodeGraphics, graphicIds) {
  const authoredViews = meaning.editorial?.presentation?.interactive?.views;
  if (
    authoredViews !== undefined &&
    (!Array.isArray(authoredViews) ||
      authoredViews.length !== meaning.media.interactive.views.length ||
      authoredViews[index]?.id !== view.id)
  )
    mismatch();
  const authoredGroups = authoredViews?.[index]?.groups;
  if (authoredGroups === undefined) {
    if (page.groups !== undefined || map.groups !== undefined) mismatch();
    return;
  }
  if (
    !Array.isArray(authoredGroups) ||
    !authoredGroups.length ||
    !same(page.groups, authoredGroups) ||
    !Array.isArray(map.groups) ||
    map.groups.length !== authoredGroups.length
  )
    mismatch();
  const groupIds = new Set();
  const memberIds = new Set();
  const groupGraphicIds = new Set();
  for (const [at, authored] of authoredGroups.entries()) {
    const carrier = map.groups[at];
    if (
      !Array.isArray(authored?.elements) ||
      groupIds.has(authored.id) ||
      typeof carrier?.graphicId !== "string" ||
      !carrier.graphicId ||
      graphicIds.has(carrier.graphicId) ||
      groupGraphicIds.has(carrier.graphicId)
    )
      mismatch();
    groupIds.add(authored.id);
    groupGraphicIds.add(carrier.graphicId);
    const nodeIds = authored.elements.map((source) => source && nodeGraphics.get(nodeKey(source)));
    for (const id of nodeIds) {
      if (!id || memberIds.has(id)) mismatch();
      memberIds.add(id);
    }
    if (
      !same(carrier, {
        editorialId: authored.id,
        label: authored.label,
        graphicId: carrier.graphicId,
        nodeIds,
      })
    )
      mismatch();
  }
  if (memberIds.size !== map.nodes.length) mismatch();
}

function validateStaticResponsibility(meaning, view, index, page, map, nodeGraphics, graphicIds) {
  const authored = meaning.editorial?.presentation?.static?.views?.[index];
  if (
    authored === undefined &&
    page.schema !== "architecture.edition-static-responsibility-scene/v1" &&
    page.visualForm === undefined &&
    map.groups === undefined
  )
    return;
  if (authored?.id !== view.id) mismatch();
  if (authored.form === undefined) {
    if (page.visualForm !== undefined || map.groups !== undefined) mismatch();
    return;
  }
  if (
    page.schema !== "architecture.edition-static-responsibility-scene/v1" ||
    !same(page.visualForm, authored.form) ||
    !same(page.groups, authored.groups) ||
    !Array.isArray(map.groups) ||
    !Array.isArray(authored.form.roles) ||
    map.groups.length !== authored.groups.length ||
    authored.form.roles.length !== authored.groups.length
  )
    mismatch();
  const groups = new Map(authored.groups.map((group) => [group.id, group]));
  const order = authored.form.roles.map(({ group }) => group);
  if (
    groups.size !== authored.groups.length ||
    new Set(order).size !== groups.size ||
    order.some((id) => !groups.has(id))
  )
    mismatch();
  const groupGraphics = new Set();
  const seenMembers = new Set();
  for (const [at, id] of order.entries()) {
    const group = groups.get(id);
    const carrier = map.groups[at];
    const nodeIds = group.elements.map((member) => nodeGraphics.get(nodeKey(member)));
    if (
      typeof carrier?.graphicId !== "string" ||
      !carrier.graphicId ||
      graphicIds.has(carrier.graphicId) ||
      groupGraphics.has(carrier.graphicId) ||
      carrier.editorialId !== group.id ||
      carrier.label !== group.label ||
      !same(carrier.nodeIds, nodeIds) ||
      nodeIds.some((id) => !id || seenMembers.has(id))
    )
      mismatch();
    groupGraphics.add(carrier.graphicId);
    for (const id of nodeIds) seenMembers.add(id);
  }
  if (seenMembers.size !== map.nodes.length) mismatch();
}

/** Check the selected view-to-carrier join before building an unqualified Candidate. */
export function validateVisibleSelection(meaning, medium, scene, carriers) {
  const views = meaning?.media?.[medium]?.views;
  const figure = medium === "static" && scene?.schema === "architecture.edition-static-figure/v1";
  const pages = medium === "static" ? (figure ? scene.views : [scene]) : scene?.pages;
  const maps = medium === "static" ? (figure ? carriers : [carriers]) : carriers;
  if (
    !["static", "interactive"].includes(medium) ||
    !Array.isArray(meaning?.assertions) ||
    !Array.isArray(views) ||
    !Array.isArray(pages) ||
    !Array.isArray(maps) ||
    views.length !== pages.length ||
    views.length !== maps.length
  )
    mismatch();
  if (
    figure &&
    (!Array.isArray(scene.placements) ||
      scene.placements.length !== views.length ||
      scene.placements.some(({ id }, index) => id !== views[index].id) ||
      new Set(
        maps.flatMap((map) =>
          [...(map?.nodes ?? []), ...(map?.relations ?? []), ...(map?.claims ?? [])].map(
            ({ graphicId }) => graphicId,
          ),
        ),
      ).size !==
        maps.reduce(
          (count, map) =>
            count +
            (map?.nodes?.length ?? 0) +
            (map?.relations?.length ?? 0) +
            (map?.claims?.length ?? 0),
          0,
        ))
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
      view.assertionIds.some((id) => !["source", "editorial"].includes(assertions.get(id)?.kind))
    )
      mismatch();
    const sourceIds = view.assertionIds.filter((id) => assertions.get(id).kind === "source");
    const editorialIds = view.assertionIds.filter((id) => assertions.get(id).kind === "editorial");
    const expected = {
      id: view.id,
      questionIds: view.questionIds,
      limitsByQuestion: view.limitsByQuestion,
      sourceIds,
      editorialIds,
    };
    const actual = {
      id: medium === "static" ? page.editorialViewId : page.id,
      questionIds: page.questionIds,
      limitsByQuestion: page.limitsByQuestion,
      sourceIds: page.sourceAssertionCarriers.map(({ assertionId }) => assertionId),
      editorialIds: page.editorialAssertions.map(({ id }) => id),
    };
    if (
      !same(actual, expected) ||
      (medium === "interactive" && map.id !== view.id) ||
      !same(
        map.assertions.map(({ assertionId }) => assertionId),
        sourceIds,
      )
    )
      mismatch();
    const hasClaimModelRelations = sourceIds.some((id) => {
      const selected = selections.get(assertions.get(id).selection);
      return (
        selected?.format === "architecture.claim-model/v2" && selected.target.kind === "relation"
      );
    });
    if (hasClaimModelRelations && page.claimCards === undefined) mismatch();
    if (page.claimCards !== undefined) {
      const required = validateClaimCarriers(
        page,
        selections,
        assertions,
        medium === "static" ? page.nodes : [],
      );
      if (hasClaimModelRelations) validateClaimLinks(view, page, selections, assertions, required);
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
      graphics.some((id) => typeof id !== "string" || !id) ||
      map.assertions.some((carrier) => {
        const nodeIds = medium === "static" ? carrier.nodeGraphicIds : carrier.nodeIds;
        const relationIds = medium === "static" ? carrier.relationGraphicIds : carrier.relationIds;
        const claimIds = medium === "static" ? carrier.claimGraphicIds : carrier.claimIds;
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
    if (medium === "interactive")
      validateInteractiveGroups(meaning, view, index, page, map, nodeGraphics, graphicIds);
    else validateStaticResponsibility(meaning, view, index, page, map, nodeGraphics, graphicIds);
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
      const nodeIds = medium === "static" ? projected.nodeGraphicIds : projected.nodeIds;
      const relationIds =
        medium === "static" ? projected.relationGraphicIds : projected.relationIds;
      const claimIds = medium === "static" ? projected.claimGraphicIds : projected.claimIds;
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
