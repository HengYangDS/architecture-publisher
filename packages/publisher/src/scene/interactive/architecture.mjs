import { fail, hasExactFields as exact } from '../../source/manifest.mjs';

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const identifier = (value) => typeof value === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const side = new Set(['top', 'right', 'bottom', 'left']);
const route = new Set(['auto', 'straight', 'orthogonal-h', 'orthogonal-v']);

function validPoint(value) {
  return exact(value, ['x', 'y']) && Number.isFinite(value.x) && Number.isFinite(value.y);
}

function validSize(value) {
  return (
    exact(value, ['width', 'height']) &&
    Number.isFinite(value.width) &&
    value.width > 0 &&
    Number.isFinite(value.height) &&
    value.height > 0
  );
}

function validSemanticIds(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every(text)
  );
}

function validWaypoints(value) {
  return Array.isArray(value) && value.length > 0 && value.every(validPoint);
}

function validLabelPlacement(value) {
  if (!exact(value, [], ['at', 'dx', 'dy', 'segment'])) return false;
  if (
    Object.hasOwn(value, 'at') &&
    (!Array.isArray(value.at) ||
      value.at.length !== 2 ||
      value.at.some((coordinate) => !Number.isFinite(coordinate)))
  )
    return false;
  if (Object.hasOwn(value, 'dx') && !Number.isFinite(value.dx)) return false;
  if (Object.hasOwn(value, 'dy') && !Number.isFinite(value.dy)) return false;
  return (
    !Object.hasOwn(value, 'segment') || (Number.isSafeInteger(value.segment) && value.segment >= 0)
  );
}

/** Validate a backend-neutral interactive architecture scene. */
export function validateInteractiveArchitectureScene(scene) {
  if (
    !exact(scene, ['schema', 'id', 'title', 'subtitle', 'viewport', 'nodes', 'groups', 'edges']) ||
    scene.schema !== 'architecture.interactive-scene/v1' ||
    !identifier(scene.id) ||
    !text(scene.title) ||
    !text(scene.subtitle) ||
    !validSize(scene.viewport) ||
    !Array.isArray(scene.nodes) ||
    !scene.nodes.length ||
    !Array.isArray(scene.groups) ||
    !Array.isArray(scene.edges)
  )
    fail('interactive_scene_invalid');

  const nodes = new Set();
  for (const node of scene.nodes) {
    if (
      !exact(node, ['id', 'label', 'visualRole', 'position', 'size'], ['detail', 'semanticIds']) ||
      !identifier(node.id) ||
      nodes.has(node.id) ||
      !text(node.label) ||
      !text(node.visualRole) ||
      !validPoint(node.position) ||
      !validSize(node.size) ||
      (Object.hasOwn(node, 'detail') && !text(node.detail)) ||
      (Object.hasOwn(node, 'semanticIds') && !validSemanticIds(node.semanticIds))
    )
      fail('interactive_scene_node_invalid');
    nodes.add(node.id);
  }

  const groups = new Set(),
    grouped = new Set();
  for (const group of scene.groups) {
    if (
      !exact(group, ['id', 'label', 'nodeIds', 'padding']) ||
      !identifier(group.id) ||
      groups.has(group.id) ||
      !text(group.label) ||
      !Array.isArray(group.nodeIds) ||
      !group.nodeIds.length ||
      !Number.isFinite(group.padding) ||
      group.padding < 0
    )
      fail('interactive_scene_group_invalid');
    groups.add(group.id);
    for (const id of group.nodeIds) {
      if (!nodes.has(id) || grouped.has(id)) fail('interactive_scene_group_membership_invalid');
      grouped.add(id);
    }
  }
  if (scene.groups.length && grouped.size !== nodes.size)
    fail('interactive_scene_group_membership_invalid');

  const edges = new Set();
  for (const edge of scene.edges) {
    if (
      !exact(
        edge,
        ['id', 'from', 'to', 'label', 'visualRole', 'fromSide', 'toSide', 'route'],
        ['labelPlacement', 'semanticIds', 'waypoints'],
      ) ||
      !identifier(edge.id) ||
      edges.has(edge.id) ||
      !nodes.has(edge.from) ||
      !nodes.has(edge.to) ||
      !text(edge.label) ||
      !text(edge.visualRole) ||
      !side.has(edge.fromSide) ||
      !side.has(edge.toSide) ||
      !route.has(edge.route) ||
      (Object.hasOwn(edge, 'labelPlacement') && !validLabelPlacement(edge.labelPlacement)) ||
      (Object.hasOwn(edge, 'semanticIds') && !validSemanticIds(edge.semanticIds)) ||
      (Object.hasOwn(edge, 'waypoints') && !validWaypoints(edge.waypoints))
    )
      fail('interactive_scene_edge_invalid');
    edges.add(edge.id);
  }
  return scene;
}

/** Compile semantic and Edition input into a backend-neutral interactive scene. */
export function interactiveArchitectureScene(document, edition, view) {
  const widest = Math.max(...view.groups.map((group) => group.entities.length));
  const cellWidth = 170,
    columnGap = 70,
    contentWidth = widest * cellWidth + (widest - 1) * columnGap;
  const width = Math.max(920, contentWidth + 240);
  const height = 170 + view.groups.length * 210;
  const nodes = [];
  for (const [row, group] of view.groups.entries())
    for (const [col, id] of group.entities.entries()) {
      const entity = document.entities[id];
      const rowWidth = group.entities.length * cellWidth + (group.entities.length - 1) * columnGap,
        rowX = (width - rowWidth) / 2;
      nodes.push({
        id,
        label: entity.label,
        visualRole: edition.visualGrammar.entityTypes[entity.type],
        position: {
          x: rowX + col * (cellWidth + columnGap),
          y: 110 + row * 210,
        },
        size: { width: cellWidth, height: 82 },
      });
    }
  return validateInteractiveArchitectureScene({
    schema: 'architecture.interactive-scene/v1',
    id: view.id,
    title: edition.title,
    subtitle: view.label,
    viewport: { width, height },
    nodes,
    groups: view.groups.map((group) => ({
      id: group.id,
      label: group.label,
      nodeIds: group.entities,
      padding: 24,
    })),
    edges: view.relations.map((layout) => {
      const relation = document.relations[layout.id],
        style = edition.visualGrammar.relationTypes[relation.type];
      return {
        id: layout.id,
        from: relation.subject,
        to: relation.object,
        label: style.label,
        visualRole: style.variant,
        fromSide: layout.fromSide,
        toSide: layout.toSide,
        route: layout.route,
        ...(Array.isArray(layout.waypoints)
          ? {
              waypoints: layout.waypoints.map(({ x, y }) => ({ x, y })),
            }
          : {}),
        ...(layout.labelAt ||
        layout.labelDx !== undefined ||
        layout.labelDy !== undefined ||
        layout.labelSegment !== undefined
          ? {
              labelPlacement: {
                ...(layout.labelAt ? { at: layout.labelAt } : {}),
                ...(layout.labelDx === undefined ? {} : { dx: layout.labelDx }),
                ...(layout.labelDy === undefined ? {} : { dy: layout.labelDy }),
                ...(layout.labelSegment === undefined ? {} : { segment: layout.labelSegment }),
              },
            }
          : {}),
      };
    }),
  });
}
