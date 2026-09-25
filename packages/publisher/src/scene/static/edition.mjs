import { deepFreeze } from '../../semantics/document.mjs';
import { fail } from '../../source/manifest.mjs';

const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);
const memberRelationKey = ({ id, origin }) =>
  relationKey({ namespace: origin.namespace, reference: id, sha256: origin.sha256 });
const sameMembers = (actual, expected) =>
  actual.size === expected.size && [...actual].every((item) => expected.has(item));

function visibleBounds(nodes, edges) {
  if (!nodes.length && !edges.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) fail('static_scene_geometry_invalid');
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const node of nodes) {
    include(node.x, node.y);
    include(node.x + node.width, node.y + node.height);
  }
  for (const edge of edges) for (const point of edge.points) include(point[0], point[1]);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Compose one unqualified static scene from bound assertions and native geometry. */
export function composeStaticEditionScene(meaning, layout) {
  if (
    meaning?.completeness !== 'finite-unqualified-obligations' ||
    !Array.isArray(meaning.native?.selections) ||
    !Array.isArray(meaning.assertions) ||
    !Array.isArray(meaning.media?.static?.views) ||
    layout?.closure !== 'upstream-layout-unqualified' ||
    !Array.isArray(layout.nodes) ||
    !Array.isArray(layout.edges)
  )
    fail('static_scene_input_invalid');
  if (meaning.media.static.views.length !== 1) fail('static_scene_composition_ambiguous');
  if (
    meaning.editorial?.visualPolicy?.profile !== 'neutral' ||
    (meaning.editorial.visualPolicy.override !== undefined &&
      meaning.editorial.visualPolicy.override !== null)
  )
    fail('static_scene_visual_policy_unadmitted');
  const editorialView = meaning.media.static.views[0];
  const nativeViews = meaning.native.selections.filter(({ target }) => target.kind === 'view');
  if (nativeViews.length !== 1) fail('static_scene_composition_ambiguous');
  const nativeView = nativeViews[0];
  if (
    layout.view?.namespace !== nativeView.source.namespace ||
    layout.view?.id !== nativeView.target.id ||
    layout.view?.sha256 !== nativeView.source.sha256
  )
    fail('static_scene_native_membership_mismatch');

  const semanticNodes = new Map(nativeView.members.elements.map((node) => [key(node), node]));
  const semanticRelations = new Map(
    nativeView.members.relations.map((relation) => [memberRelationKey(relation), relation]),
  );
  const layoutNodes = new Set(layout.nodes.map(key));
  const relationEntries = layout.edges.flatMap((edge) => edge.relations.map(relationKey));
  const layoutRelations = new Set(relationEntries);
  if (
    layout.nodes.length !== layoutNodes.size ||
    relationEntries.length !== layoutRelations.size ||
    !sameMembers(layoutNodes, new Set(semanticNodes.keys())) ||
    !sameMembers(layoutRelations, new Set(semanticRelations.keys())) ||
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
    fail('static_scene_native_membership_mismatch');

  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const requiredNodes = new Set();
  const requiredRelations = new Set();
  const sourceAssertionCarriers = [];
  const editorialAssertions = [];
  for (const id of editorialView.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail('static_scene_assertion_unbound');
    if (assertion.kind === 'editorial') {
      editorialAssertions.push(assertion);
      continue;
    }
    const selected = selections.get(assertion.selection);
    if (!selected) fail('static_scene_assertion_unbound');
    const nodeRefs = selected.members.elements.map((node) => {
      const identity = key(node);
      if (!semanticNodes.has(identity)) fail('static_scene_assertion_unbound');
      requiredNodes.add(identity);
      return { namespace: node.namespace, id: node.id };
    });
    const relationRefs = selected.members.relations.map((relation) => {
      const identity = memberRelationKey(relation);
      if (!semanticRelations.has(identity)) fail('static_scene_assertion_unbound');
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

  const nodes = layout.nodes
    .filter((node) => requiredNodes.has(key(node)))
    .map((node) => {
      const semantic = semanticNodes.get(key(node));
      return { ...node, kind: semantic.kind, label: semantic.label, origin: semantic.origin };
    });
  const edges = layout.edges
    .filter((edge) => {
      const identities = edge.relations.map(relationKey);
      if (identities.some((identity) => requiredRelations.has(identity))) {
        if (identities.some((identity) => !requiredRelations.has(identity)))
          fail('static_scene_aggregate_unrepresentable');
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
          label: semantic.label,
          kind: semantic.kind,
          direction: semantic.direction,
          origin: semantic.origin,
        };
      }),
    }));
  const questions = new Map(meaning.questions.map((item) => [item.id, item]));
  return deepFreeze({
    schema: 'architecture.edition-static-scene/v1',
    completeness: 'unqualified-scene',
    edition: meaning.edition,
    title: meaning.editorial.title,
    summary: meaning.editorial.narrative.summary,
    visualPolicy: meaning.editorial.visualPolicy,
    requestedWidth: meaning.editorial.presentation.static.width ?? null,
    editorialViewId: editorialView.id,
    nativeView: layout.view,
    questionIds: editorialView.questionIds,
    questions: editorialView.questionIds.map((id) => questions.get(id)),
    limitsByQuestion: editorialView.limitsByQuestion,
    bounds: visibleBounds(nodes, edges),
    nodes,
    edges,
    sourceAssertionCarriers,
    editorialAssertions,
    limits: meaning.limits,
  });
}
