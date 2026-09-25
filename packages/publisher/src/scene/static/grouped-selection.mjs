import { canonical, deepFreeze } from '../../semantics/document.mjs';
import { fail } from '../../source/manifest.mjs';
import { composeGroupedGeometry } from './architecture.mjs';

const address = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationAddress = ({ id, origin }) => JSON.stringify([origin.namespace, id, origin.sha256]);

function addBound(map, id, item) {
  const previous = map.get(id);
  if (previous && canonical(previous) !== canonical(item))
    fail('grouped_selection_semantic_conflict');
  map.set(id, item);
}

/** Project selected structural assertions through one replaceable geometry owner. */
export function composeGroupedSelectionLayout(meaning) {
  const view = meaning?.media?.static?.views?.[0];
  const authored = meaning?.editorial?.presentation?.static?.views?.[0];
  if (
    !view ||
    !authored ||
    view.id !== authored.id ||
    !Array.isArray(authored.groups) ||
    !Array.isArray(view.assertionIds) ||
    !Array.isArray(meaning?.assertions) ||
    !Array.isArray(meaning?.native?.selections)
  )
    fail('grouped_selection_layout_unadmitted');
  const assertions = new Map(meaning.assertions.map((item) => [item.id, item]));
  const selections = new Map(meaning.native.selections.map((item) => [item.selectionId, item]));
  if (
    assertions.size !== meaning.assertions.length ||
    selections.size !== meaning.native.selections.length
  )
    fail('grouped_selection_layout_unadmitted');

  const nodes = new Map();
  const relations = new Map();
  const nativeViews = meaning.native.selections.filter(({ target }) => target.kind === 'view');
  for (const id of view.assertionIds) {
    const assertion = assertions.get(id);
    if (!assertion) fail('grouped_selection_layout_unadmitted');
    if (assertion.kind === 'editorial') continue;
    const selected = selections.get(assertion.selection);
    if (
      !selected ||
      !['likec4/dsl', 'architecture.claim-model/v2'].includes(selected.format) ||
      !Array.isArray(selected.members?.elements) ||
      !Array.isArray(selected.members?.relations)
    )
      fail('grouped_selection_layout_unadmitted');
    if (selected.target.kind === 'claim') continue;
    for (const item of selected.members.elements) addBound(nodes, address(item), item);
    for (const item of selected.members.relations) addBound(relations, relationAddress(item), item);
  }
  if (nativeViews.length > 1) fail('grouped_selection_layout_unadmitted');
  const geometry = composeGroupedGeometry({
    nodes: [...nodes].map(([id, item]) => ({ id, label: item.label })),
    groups: authored.groups.map((group) => ({
      id: group.id,
      label: group.label,
      members: group.elements.map(address),
    })),
    relations: [...relations].map(([id, item]) => ({
      id,
      from: address(item.from),
      to: address(item.to),
      text: '',
      fromSide: 'bottom',
      toSide: 'top',
      route: 'orthogonal-v',
    })),
  });
  const selectedView = nativeViews[0];
  return deepFreeze({
    closure: 'grouped-layout-unqualified',
    view: selectedView
      ? {
          namespace: selectedView.source.namespace,
          id: selectedView.target.id,
          sha256: selectedView.source.sha256,
        }
      : null,
    groups: geometry.layout.groups.map((group, index) => ({
      id: group.id,
      label: group.label,
      elements: authored.groups[index].elements,
      x: group.x,
      y: group.y,
      width: group.w,
      height: group.h,
    })),
    nodes: [...geometry.layout.nodes].map(([id, box]) => {
      const node = nodes.get(id);
      return {
        namespace: node.namespace,
        id: node.id,
        sha256: node.sha256,
        x: box.x,
        y: box.y,
        width: box.w,
        height: box.h,
      };
    }),
    edges: geometry.routes.map((route) => {
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
      };
    }),
  });
}
