import { createHash } from "node:crypto";
import { canonical, deepFreeze } from "../../semantics/document.mjs";
import { fail } from "../../protocol/values.mjs";
import { claimCard } from "../claim-card.mjs";
import { claimRelationLabel, linkClaimModelSources } from "../claim-relations.mjs";
import { selectedStaticNativeViews, selectedStaticSourceSelections } from "./selection.mjs";
import { neutralFigurePolicy, resolveFigureTypes } from "../figure-types.mjs";

const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);
const memberRelationKey = ({ id, origin }) =>
  relationKey({ namespace: origin.namespace, reference: id, sha256: origin.sha256 });
const claimKey = ({ namespace, id, sha256 }) => JSON.stringify([namespace, id, sha256]);
const compareClaims = (left, right) => {
  const a = claimKey(left);
  const b = claimKey(right);
  return a < b ? -1 : a > b ? 1 : 0;
};
const sameMembers = (actual, expected) =>
  actual.size === expected.size && [...actual].every((item) => expected.has(item));

function addBound(map, identity, value) {
  const previous = map.get(identity);
  if (previous && canonical(previous) !== canonical(value)) fail("static_scene_semantic_conflict");
  map.set(identity, value);
}

function assertVisualPolicyRenderable(meaning) {
  if (
    meaning.editorial?.visualPolicy?.profile !== "neutral" ||
    (meaning.editorial.visualPolicy.override !== undefined &&
      meaning.editorial.visualPolicy.override !== null &&
      meaning.refinement?.media?.static === undefined)
  )
    fail("static_scene_visual_policy_unadmitted");
  if (meaning.editorial.presentation.static.views[0].form !== undefined)
    fail("edition_visual_form_renderer_unavailable");
}

function visibleBounds(nodes, edges, groups = []) {
  if (!nodes.length && !edges.length && !groups.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) fail("static_scene_geometry_invalid");
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const node of nodes) {
    include(node.x, node.y);
    include(node.x + node.width, node.y + node.height);
  }
  for (const edge of edges) {
    for (const point of edge.points) include(point[0], point[1]);
    if (Object.hasOwn(edge, "caption")) {
      if (!edge.caption || typeof edge.caption !== "object" || Array.isArray(edge.caption))
        fail("static_scene_geometry_invalid");
      const box = edge.caption.box;
      if (!box || ![box.x, box.y, box.w, box.h].every(Number.isFinite) || box.w <= 0 || box.h <= 0)
        fail("static_scene_geometry_invalid");
      include(box.x, box.y);
      include(box.x + box.w, box.y + box.h);
    }
  }
  for (const group of groups) {
    if (group.width <= 0 || group.height <= 0) fail("static_scene_geometry_invalid");
    include(group.x, group.y);
    include(group.x + group.width, group.y + group.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function composeClaimScene(meaning, layout) {
  if (layout !== null || meaning.media.static.views.length !== 1)
    fail("static_scene_composition_ambiguous");
  const editorialView = meaning.media.static.views[0];
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const cards = new Map();
  const sourceAssertionCarriers = [];
  const editorialAssertions = [];
  for (const id of editorialView.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail("static_scene_assertion_unbound");
    if (assertion.kind === "editorial") {
      editorialAssertions.push(assertion);
      continue;
    }
    const selected = selections.get(assertion.selection);
    if (!selected) fail("static_scene_assertion_unbound");
    const card = claimCard(selected);
    cards.set(claimKey(card), card);
    sourceAssertionCarriers.push({
      assertionId: id,
      kind: "claim",
      selectionId: assertion.selection,
      nodeRefs: [],
      relationRefs: [],
      claimRefs: [{ namespace: card.namespace, reference: card.id, sha256: card.sha256 }],
    });
  }
  const questions = new Map(meaning.questions.map((item) => [item.id, item]));
  return deepFreeze({
    schema: "architecture.edition-static-scene/v1",
    completeness: "unqualified-scene",
    edition: meaning.edition,
    title: meaning.editorial.title,
    ...(meaning.editorial.narrative.summary === undefined
      ? {}
      : { summary: meaning.editorial.narrative.summary }),
    visualPolicy: meaning.editorial.visualPolicy,
    requestedWidth: meaning.editorial.presentation.static.width ?? null,
    editorialViewId: editorialView.id,
    nativeView: null,
    questionIds: editorialView.questionIds,
    questions: editorialView.questionIds.map((id) => questions.get(id)),
    limitsByQuestion: editorialView.limitsByQuestion,
    bounds: null,
    nodes: [],
    edges: [],
    claimCards: [...cards.values()].sort(compareClaims),
    sourceAssertionCarriers,
    editorialAssertions,
    limits: meaning.limits,
  });
}

/** Compose one unqualified static scene from bound assertions and native geometry. */
export function composeStaticEditionScene(meaning, layout) {
  if (
    meaning?.completeness !== "finite-unqualified-obligations" ||
    !Array.isArray(meaning.native?.selections) ||
    !Array.isArray(meaning.assertions) ||
    !Array.isArray(meaning.media?.static?.views)
  )
    fail("static_scene_input_invalid");
  if (meaning.media.static.views.length !== 1) fail("static_scene_composition_ambiguous");
  assertVisualPolicyRenderable(meaning);
  const claimModelMode = meaning.native.selections.some(
    ({ format }) => format === "architecture.claim-model/v2",
  );
  const authoredGroups = meaning.editorial.presentation.static.views[0].groups;
  if (claimModelMode) {
    if (meaning.native.selections.some(({ format }) => format !== "architecture.claim-model/v2"))
      fail("edition_scene_claim_model_unadmitted");
    if (
      selectedStaticSourceSelections(meaning, meaning.media.static.views[0]).every(
        ({ target }) => target.kind === "claim",
      )
    ) {
      if (authoredGroups !== undefined) fail("static_scene_group_unadmitted");
      return composeClaimScene(meaning, layout);
    }
  }
  const editorialView = meaning.media.static.views[0];
  const nativeViews = selectedStaticNativeViews(meaning, editorialView);
  const viewless = !nativeViews.length;
  const recomposed = claimModelMode || nativeViews.length !== 1;
  if (
    layout?.closure !==
      (authoredGroups !== undefined
        ? "grouped-layout-unqualified"
        : recomposed
          ? "flat-layout-unqualified"
          : "upstream-layout-unqualified") ||
    !Array.isArray(layout.nodes) ||
    !Array.isArray(layout.edges)
  )
    fail("static_scene_input_invalid");
  const groups = authoredGroups === undefined ? [] : layout.groups;
  if (
    authoredGroups !== undefined &&
    (!Array.isArray(groups) ||
      groups.length !== authoredGroups.length ||
      groups.some((group, index) => {
        const authored = authoredGroups[index];
        return (
          group.id !== authored.id ||
          group.label !== authored.label ||
          JSON.stringify(group.elements) !== JSON.stringify(authored.elements) ||
          ![group.x, group.y, group.width, group.height].every(Number.isFinite) ||
          group.width <= 0 ||
          group.height <= 0
        );
      }))
  )
    fail("static_scene_group_mismatch");
  if (claimModelMode && !viewless) fail("static_scene_composition_ambiguous");
  const nativeView = nativeViews[0];
  if (nativeViews.length !== 1) {
    if (layout.view !== null) fail("static_scene_native_membership_mismatch");
  } else if (
    layout.view?.namespace !== nativeView.source.namespace ||
    layout.view?.id !== nativeView.target.id ||
    layout.view?.sha256 !== nativeView.source.sha256
  )
    fail("static_scene_native_membership_mismatch");
  if (
    groups.some((group) =>
      group.elements.some((element) => {
        const node = layout.nodes.find((item) => key(item) === key(element));
        return (
          !node ||
          node.x < group.x ||
          node.y < group.y ||
          node.x + node.width > group.x + group.width ||
          node.y + node.height > group.y + group.height
        );
      }),
    )
  )
    fail("static_scene_group_mismatch");

  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const claimSources = claimModelMode
    ? linkClaimModelSources(
        editorialView,
        assertions,
        selections,
        "static_scene_claim_relation_unbound",
      )
    : null;
  const structural = recomposed
    ? editorialView.assertionIds
        .map((id) => assertions.get(id))
        .filter((assertion) => assertion?.kind === "source")
        .map(({ selection }) => selections.get(selection))
        .filter((selected) =>
          ["entity", "element", "relation", "view"].includes(selected?.target.kind),
        )
    : [nativeView];
  const semanticNodes = new Map();
  const semanticRelations = new Map();
  for (const selected of structural) {
    if (!Array.isArray(selected?.members?.elements) || !Array.isArray(selected.members.relations))
      fail("static_scene_assertion_unbound");
    for (const node of selected.members.elements) addBound(semanticNodes, key(node), node);
    for (const relation of selected.members.relations)
      addBound(semanticRelations, memberRelationKey(relation), relation);
  }
  const requiredNodes = new Set();
  const requiredRelations = new Set();
  const cards = new Map();
  const sourceAssertionCarriers = [];
  const editorialAssertions = [];
  for (const id of editorialView.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail("static_scene_assertion_unbound");
    if (assertion.kind === "editorial") {
      editorialAssertions.push(assertion);
      continue;
    }
    const selected = selections.get(assertion.selection);
    if (!selected) fail("static_scene_assertion_unbound");
    if (claimModelMode && selected.target.kind === "claim") {
      const card = claimCard(selected);
      addBound(cards, claimKey(card), card);
      sourceAssertionCarriers.push({
        assertionId: id,
        kind: "claim",
        selectionId: assertion.selection,
        nodeRefs: [],
        relationRefs: [],
        claimRefs: [{ namespace: card.namespace, reference: card.id, sha256: card.sha256 }],
      });
      continue;
    }
    const nodeRefs = selected.members.elements.map((node) => {
      const identity = key(node);
      if (!semanticNodes.has(identity)) fail("static_scene_assertion_unbound");
      requiredNodes.add(identity);
      return { namespace: node.namespace, id: node.id };
    });
    const relationRefs = selected.members.relations.map((relation) => {
      const identity = memberRelationKey(relation);
      if (!semanticRelations.has(identity)) fail("static_scene_assertion_unbound");
      requiredRelations.add(identity);
      return {
        namespace: relation.origin.namespace,
        reference: relation.id,
        sha256: relation.origin.sha256,
      };
    });
    sourceAssertionCarriers.push({
      assertionId: id,
      kind: selected.target.kind,
      selectionId: assertion.selection,
      nodeRefs,
      relationRefs,
    });
  }

  const layoutNodes = new Set(layout.nodes.map(key));
  const relationEntries = layout.edges.flatMap((edge) => edge.relations.map(relationKey));
  const layoutRelations = new Set(relationEntries);
  const expectedNodes =
    authoredGroups === undefined ? new Set(semanticNodes.keys()) : requiredNodes;
  const expectedRelations =
    authoredGroups === undefined ? new Set(semanticRelations.keys()) : requiredRelations;
  if (
    layout.nodes.length !== layoutNodes.size ||
    relationEntries.length !== layoutRelations.size ||
    !sameMembers(layoutNodes, expectedNodes) ||
    !sameMembers(layoutRelations, expectedRelations) ||
    layout.nodes.some((node) => semanticNodes.get(key(node))?.sha256 !== node.sha256) ||
    layout.edges.some(
      (edge) =>
        !edge.relations.length ||
        edge.relations.some((relation) => {
          const semantic = semanticRelations.get(relationKey(relation));
          return key(semantic.from) !== key(edge.from) || key(semantic.to) !== key(edge.to);
        }),
    )
  )
    fail("static_scene_native_membership_mismatch");

  const selectedNodes = layout.nodes
    .filter((node) => requiredNodes.has(key(node)))
    .map((node) => {
      const semantic = semanticNodes.get(key(node));
      return {
        ...node,
        kind: semantic.kind,
        label: semantic.label,
        origin: semantic.origin,
      };
    });
  const [{ nodes }] = resolveFigureTypes(
    [{ nodes: selectedNodes }],
    meaning.editorial.visualPolicy.figureTypes,
  );
  const edges = layout.edges
    .filter((edge) => {
      const identities = edge.relations.map(relationKey);
      if (identities.some((identity) => requiredRelations.has(identity))) {
        if (identities.some((identity) => !requiredRelations.has(identity)))
          fail("static_scene_aggregate_unrepresentable");
        return true;
      }
      return false;
    })
    .map((edge) => ({
      ...edge,
      relations: edge.relations.map((relation) => {
        const semantic = semanticRelations.get(relationKey(relation));
        return {
          ...relation,
          label: claimModelMode
            ? claimRelationLabel(semantic, "static_scene_relation_qualifiers_invalid")
            : semantic.label,
          kind: semantic.kind,
          direction: claimModelMode ? "forward" : semantic.direction,
          origin: semantic.origin,
        };
      }),
    }));
  const questions = new Map(meaning.questions.map((item) => [item.id, item]));
  const staticRefinement = meaning.refinement?.media?.static;
  return deepFreeze({
    schema: "architecture.edition-static-scene/v1",
    completeness: "unqualified-scene",
    edition: meaning.edition,
    title: meaning.editorial.title,
    ...(meaning.editorial.narrative.summary === undefined
      ? {}
      : { summary: meaning.editorial.narrative.summary }),
    visualPolicy: meaning.refinement
      ? neutralFigurePolicy(meaning.editorial.visualPolicy)
      : meaning.editorial.visualPolicy,
    ...(staticRefinement && staticRefinement.kind !== "neutral"
      ? {
          refinement: {
            schema: meaning.refinement.schema,
            decisionSha256: createHash("sha256").update(canonical(staticRefinement)).digest("hex"),
          },
        }
      : {}),
    requestedWidth: meaning.editorial.presentation.static.width ?? null,
    editorialViewId: editorialView.id,
    nativeView: layout.view,
    questionIds: editorialView.questionIds,
    questions: editorialView.questionIds.map((id) => questions.get(id)),
    limitsByQuestion: editorialView.limitsByQuestion,
    bounds: visibleBounds(nodes, edges, groups),
    nodes,
    edges,
    ...(authoredGroups === undefined ? {} : { groups }),
    ...(layout.groupPresentation ? { groupPresentation: layout.groupPresentation } : {}),
    sourceAssertionCarriers,
    ...(claimModelMode
      ? {
          ...(claimSources?.links.length ? { claimRelationLinks: claimSources.links } : {}),
          ...(claimSources?.subjectLinks.length
            ? { claimSubjectLinks: claimSources.subjectLinks }
            : {}),
          claimCards: [...cards.values()].sort(compareClaims),
        }
      : {}),
    editorialAssertions,
    limits: meaning.limits,
  });
}
