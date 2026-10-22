import { fail } from "../../src/protocol/values.mjs";
import { validateInteractiveArchitectureScene } from "../../src/scene/interactive/architecture.mjs";
import nativeCommon from "./supply/schemas/common.schema.json" with { type: "json" };

const componentTypes = new Set([
  "frontend",
  "backend",
  "database",
  "cloud",
  "security",
  "messagebus",
  "external",
]);
const variants = new Set(["default", "emphasis", "security", "dashed"]);
const icons = new Set(nativeCommon.$defs.nodeIcon.enum);

/** Adapt a renderer-neutral architecture scene to the bundled Archify protocol. */
export function adaptArchitectureScene(scene, { intrinsic = false } = {}) {
  scene = validateInteractiveArchitectureScene(scene);
  if (scene.nodes.some((node) => !node.primitives && !componentTypes.has(node.visualRole)))
    fail("render_scene_visual_role_unsupported");
  if (scene.edges.some((edge) => !edge.adornment && !variants.has(edge.visualRole)))
    fail("render_scene_edge_role_unsupported");
  if (
    scene.nodes.some(
      (node) =>
        node.icon !== undefined && !icons.has(node.icon) && !/^lucide:[a-z0-9-]+$/u.test(node.icon),
    )
  )
    fail("render_scene_icon_unsupported");
  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: scene.title,
      subtitle: scene.subtitle,
      locale: "en",
      quality_profile: "showcase",
      visual_preset: "editorial",
      ...(intrinsic ? {} : { viewBox: [scene.viewport.width, scene.viewport.height] }),
      legend: { mode: "hidden" },
    },
    components: scene.nodes.map((node) => ({
      id: node.id,
      type: node.primitives ? "paint" : node.visualRole,
      ...(node.icon === undefined ? {} : { icon: node.icon }),
      label: node.primitives ? node.id : node.label,
      ...(node.detail ? { sublabel: node.detail } : {}),
      ...(node.note ? { tag: node.note } : {}),
      pos: [node.position.x, node.position.y],
      size: [node.size.width, node.size.height],
    })),
    boundaries: scene.groups.map((group) => ({
      kind: "region",
      label: group.label,
      wraps: group.nodeIds,
      pad: group.padding,
    })),
    connections: scene.edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.adornment ? "" : edge.label,
      variant: edge.adornment ? "default" : edge.visualRole,
      fromSide: edge.fromSide,
      toSide: edge.toSide,
      route: edge.adornment ? "straight" : edge.route,
      ...(edge.waypoints ? { via: edge.waypoints.map(({ x, y }) => [x, y]) } : {}),
      ...(edge.labelPlacement?.at ? { labelAt: edge.labelPlacement.at } : {}),
      ...(edge.labelPlacement?.dx === undefined ? {} : { labelDx: edge.labelPlacement.dx }),
      ...(edge.labelPlacement?.dy === undefined ? {} : { labelDy: edge.labelPlacement.dy }),
      ...(edge.labelPlacement?.segment === undefined
        ? {}
        : { labelSegment: edge.labelPlacement.segment }),
    })),
    ...(scene.notes?.length
      ? {
          cards: scene.notes.map(({ title, items }) => ({
            dot: "slate",
            title,
            items: items.map(({ text }) => text),
          })),
        }
      : {}),
  };
}
