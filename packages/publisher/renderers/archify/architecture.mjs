import { fail } from '../../src/protocol/values.mjs';
import { validateInteractiveArchitectureScene } from '../../src/scene/interactive/architecture.mjs';

const componentTypes = new Set([
  'frontend',
  'backend',
  'database',
  'cloud',
  'security',
  'messagebus',
  'external',
]);
const variants = new Set(['default', 'emphasis', 'security', 'dashed']);

/** Adapt a renderer-neutral architecture scene to the bundled Archify protocol. */
export function adaptArchitectureScene(scene) {
  scene = validateInteractiveArchitectureScene(scene);
  if (scene.nodes.some((node) => !node.primitives && !componentTypes.has(node.visualRole)))
    fail('render_scene_visual_role_unsupported');
  if (scene.edges.some((edge) => !variants.has(edge.visualRole)))
    fail('render_scene_edge_role_unsupported');
  return {
    schema_version: 1,
    diagram_type: 'architecture',
    meta: {
      title: scene.title,
      subtitle: scene.subtitle,
      locale: 'en',
      quality_profile: 'showcase',
      visual_preset: 'editorial',
      viewBox: [scene.viewport.width, scene.viewport.height],
      legend: { mode: 'hidden' },
    },
    components: scene.nodes.map((node) => ({
      id: node.id,
      type: node.primitives ? 'paint' : node.visualRole,
      label: node.primitives ? node.id : node.label,
      ...(node.detail ? { sublabel: node.detail } : {}),
      pos: [node.position.x, node.position.y],
      size: [node.size.width, node.size.height],
    })),
    boundaries: scene.groups.map((group) => ({
      kind: 'region',
      label: group.label,
      wraps: group.nodeIds,
      pad: group.padding,
    })),
    connections: scene.edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label,
      variant: edge.visualRole,
      fromSide: edge.fromSide,
      toSide: edge.toSide,
      route: edge.route,
      ...(edge.waypoints ? { via: edge.waypoints.map(({ x, y }) => [x, y]) } : {}),
      ...(edge.labelPlacement?.at ? { labelAt: edge.labelPlacement.at } : {}),
      ...(edge.labelPlacement?.dx === undefined ? {} : { labelDx: edge.labelPlacement.dx }),
      ...(edge.labelPlacement?.dy === undefined ? {} : { labelDy: edge.labelPlacement.dy }),
      ...(edge.labelPlacement?.segment === undefined
        ? {}
        : { labelSegment: edge.labelPlacement.segment }),
    })),
  };
}
