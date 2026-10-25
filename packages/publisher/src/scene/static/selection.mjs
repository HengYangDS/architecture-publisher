import { canonical, deepFreeze } from "../../semantics/document.mjs";
import { likeC4LayoutMembers } from "../../semantics/native-layout.mjs";
import { fail } from "../../protocol/values.mjs";
import { composeGroupedGeometry } from "./architecture.mjs";

const address = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationAddress = ({ id, origin }) => JSON.stringify([origin.namespace, id, origin.sha256]);
const authoredRelationAddress = ({ namespace, reference }) =>
  JSON.stringify([namespace, reference]);

/** Resolve source selections from this view's exact assertion set. */
export function selectedStaticSourceSelections(meaning, view) {
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  return view.assertionIds.flatMap((id) => {
    const assertion = assertions.get(id);
    if (!assertion) fail("static_scene_assertion_unbound");
    if (assertion.kind === "editorial") return [];
    const selected = selections.get(assertion.selection);
    if (!selected) fail("static_scene_assertion_unbound");
    return [selected];
  });
}

/** Resolve native views only from this overview's exact assertion obligations. */
export function selectedStaticNativeViews(meaning, view) {
  const selectedIds = new Set(
    selectedStaticSourceSelections(meaning, view).map(({ selectionId }) => selectionId),
  );
  return meaning.native.selections.filter(
    ({ target, selectionId }) => target.kind === "view" && selectedIds.has(selectionId),
  );
}

function addBound(map, id, item) {
  const previous = map.get(id);
  if (previous && canonical(previous) !== canonical(item))
    fail("grouped_selection_semantic_conflict");
  map.set(id, item);
}

function selectedStructure(meaning) {
  const view = meaning?.media?.static?.views?.[0];
  const authored = meaning?.editorial?.presentation?.static?.views?.[0];
  if (
    !view ||
    !authored ||
    view.id !== authored.id ||
    !Array.isArray(view.assertionIds) ||
    !Array.isArray(meaning?.assertions) ||
    !Array.isArray(meaning?.native?.selections)
  )
    fail("grouped_selection_layout_unadmitted");
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  if (
    assertions.size !== meaning.assertions.length ||
    selections.size !== meaning.native.selections.length
  )
    fail("grouped_selection_layout_unadmitted");

  const nodes = new Map();
  const relations = new Map();
  for (const id of view.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail("grouped_selection_layout_unadmitted");
    if (assertion.kind === "editorial") continue;
    const selected = selections.get(assertion.selection);
    if (
      !selected ||
      !["likec4/dsl", "architecture.claim-model/v2"].includes(selected.format) ||
      !Array.isArray(selected.members?.elements) ||
      !Array.isArray(selected.members?.relations)
    )
      fail("grouped_selection_layout_unadmitted");
    if (selected.target.kind === "claim") continue;
    for (const item of selected.members.elements) addBound(nodes, address(item), item);
    for (const item of selected.members.relations) addBound(relations, relationAddress(item), item);
  }
  const nativeViews = selectedStaticNativeViews(meaning, view);
  for (const selected of nativeViews) {
    const index = meaning.native.sourceReading?.likec4;
    const projection = index?.views.find(
      ({ namespace, id }) => namespace === selected.source.namespace && id === selected.target.id,
    );
    if (!projection) fail("native_likec4_reference_unselected");
    likeC4LayoutMembers(index, projection);
    if (
      (nativeViews.length !== 1 || authored.groups !== undefined) &&
      projection.nodes.some((node) => node.parent !== null && node.parent !== undefined)
    )
      fail("native_likec4_layout_hierarchy_unrepresentable");
  }
  return {
    view,
    authored,
    nodes,
    relations,
    selectedView: nativeViews.length === 1 ? nativeViews[0] : undefined,
    closure:
      authored.groups !== undefined
        ? "grouped-layout-unqualified"
        : nativeViews.length !== 1 ||
            meaning.native.selections.some(({ format }) => format === "architecture.claim-model/v2")
          ? "flat-layout-unqualified"
          : "upstream-layout-unqualified",
  };
}

function nativeView(selectedView) {
  return selectedView
    ? {
        namespace: selectedView.source.namespace,
        id: selectedView.target.id,
        sha256: selectedView.source.sha256,
      }
    : null;
}

/** Bind exact selected structure to one replaceable geometry owner. */
export function composeStaticSelectionLayout(meaning, geometryOwner = composeGroupedGeometry) {
  const { authored, nodes, relations, selectedView, closure } = selectedStructure(meaning);
  const claimModelMode = meaning.native.selections.some(
    ({ format }) => format === "architecture.claim-model/v2",
  );
  const authoredGroups = authored.groups ?? [];
  if (!authoredGroups.length && !claimModelMode && selectedView)
    fail("static_selection_flat_unadmitted");
  const placement = new Map();
  for (const [row, group] of authoredGroups.entries())
    for (const [column, member] of group.elements.entries())
      placement.set(address(member), { row, column });
  const geometry = geometryOwner({
    nodes: [...nodes].map(([id, item]) => ({
      id,
      label: item.label,
      kind: item.kind,
      ...(item.qualifiers ? { qualifiers: item.qualifiers } : {}),
    })),
    groups: authoredGroups.map((group) => ({
      id: group.id,
      label: group.label,
      members: group.elements.map(address),
    })),
    relations: [...relations].map(([id, item]) => {
      const from = address(item.from);
      const to = address(item.to);
      const source = placement.get(from);
      const target = placement.get(to);
      if (!nodes.has(from) || !nodes.has(to) || (authoredGroups.length && (!source || !target)))
        fail("grouped_selection_layout_unadmitted");
      if (from === to) fail("grouped_selection_self_relation_unrepresentable");
      const caption = claimModelMode ? item.kind.replaceAll("-", " ") : "";
      const lateral = authoredGroups.length && source.row === target.row;
      const forward =
        authoredGroups.length &&
        (lateral ? source.column < target.column : source.row < target.row);
      return {
        id,
        from,
        to,
        text: /^[\x20-\x7e]+$/u.test(caption) && [...caption].length <= 32 ? caption : "",
        ...(authoredGroups.length
          ? {
              fromSide: lateral ? (forward ? "right" : "left") : forward ? "bottom" : "top",
              toSide: lateral ? (forward ? "left" : "right") : forward ? "top" : "bottom",
              route: lateral ? "orthogonal-h" : "orthogonal-v",
            }
          : {}),
      };
    }),
  });
  const assemble = (selected) =>
    deepFreeze({
      closure,
      view: nativeView(selectedView),
      ...(authoredGroups.length
        ? {
            groups: selected.layout.groups.map((group, index) => ({
              id: group.id,
              label: group.label,
              elements: authoredGroups[index].elements,
              x: group.x,
              y: group.y,
              width: group.w,
              height: group.h,
              ...(group.heading ? { heading: group.heading } : {}),
            })),
          }
        : {}),
      ...(selected.layout.groupPresentation
        ? { groupPresentation: selected.layout.groupPresentation }
        : {}),
      nodes: [...selected.layout.nodes].map(([id, box]) => {
        const node = nodes.get(id);
        return {
          namespace: node.namespace,
          id: node.id,
          sha256: node.sha256,
          x: box.x,
          y: box.y,
          width: box.w,
          height: box.h,
          ...(box.textLayout ? { textLayout: box.textLayout } : {}),
        };
      }),
      edges: selected.routes.map((route) => {
        const relation = relations.get(route.id);
        return {
          from: relation.from,
          to: relation.to,
          relations: [
            {
              namespace: relation.origin.namespace,
              reference: relation.id,
              sha256: relation.origin.sha256,
            },
          ],
          points: route.points,
          ...(route.label
            ? {
                caption: {
                  text: relation.kind.replaceAll("-", " "),
                  point: route.label,
                  box: route.labelBox,
                },
              }
            : {}),
        };
      }),
    });
  return geometry instanceof Promise ? geometry.then(assemble) : assemble(geometry);
}

/** Bind authored geometry to selected members without requiring neutral geometry to exist. */
export function composeSelectedStaticRefinementLayout(meaning, refinement) {
  const { view, authored, nodes, relations, selectedView, closure } = selectedStructure(meaning);
  const selected = refinement?.media?.static;
  if (
    selected?.view !== view.id ||
    !Array.isArray(selected.nodes) ||
    !Array.isArray(selected.edges) ||
    !Array.isArray(selected.groups) ||
    (!nodes.size && !relations.size)
  )
    fail("scene_refinement_composition_unadmitted");
  const expectedGroups = authored.groups ?? [];
  if (selected.nodes.length !== nodes.size || selected.groups.length !== expectedGroups.length)
    fail("scene_refinement_membership_mismatch");
  const usedNodes = new Set();
  const refinedNodes = selected.nodes.map((geometry) => {
    const key = address(geometry);
    const node = nodes.get(key);
    if (!node || usedNodes.has(key)) fail("scene_refinement_membership_mismatch");
    usedNodes.add(key);
    return {
      namespace: node.namespace,
      id: node.id,
      sha256: node.sha256,
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
    };
  });
  const selectedRelations = new Map(
    [...relations.values()].map((item) => [
      authoredRelationAddress({ namespace: item.origin.namespace, reference: item.id }),
      item,
    ]),
  );
  if (selectedRelations.size !== relations.size) fail("scene_refinement_membership_mismatch");
  const usedRelations = new Set();
  const refinedEdges = selected.edges.map((edge) => {
    if (!Array.isArray(edge?.relations) || !Array.isArray(edge.points))
      fail("scene_refinement_membership_mismatch");
    return {
      from: edge.from,
      to: edge.to,
      relations: edge.relations.map((reference) => {
        const key = authoredRelationAddress(reference);
        const relation = selectedRelations.get(key);
        if (
          !relation ||
          usedRelations.has(key) ||
          address(relation.from) !== address(edge.from) ||
          address(relation.to) !== address(edge.to)
        )
          fail("scene_refinement_membership_mismatch");
        usedRelations.add(key);
        return {
          namespace: relation.origin.namespace,
          reference: relation.id,
          sha256: relation.origin.sha256,
        };
      }),
      points: edge.points,
    };
  });
  const groups = new Map(expectedGroups.map((group) => [group.id, group]));
  const usedGroups = new Set();
  const refinedGroups = selected.groups.map((geometry) => {
    const group = groups.get(geometry.id);
    if (!group || usedGroups.has(group.id)) fail("scene_refinement_membership_mismatch");
    usedGroups.add(group.id);
    return {
      id: group.id,
      label: group.label,
      elements: group.elements,
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
    };
  });
  if (usedRelations.size !== relations.size || groups.size !== expectedGroups.length)
    fail("scene_refinement_membership_mismatch");
  return deepFreeze({
    closure,
    view: nativeView(selectedView),
    ...(authored.groups === undefined ? {} : { groups: refinedGroups }),
    nodes: refinedNodes,
    edges: refinedEdges,
  });
}
