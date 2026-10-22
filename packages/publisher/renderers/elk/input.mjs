import { fail } from "../../src/protocol/values.mjs";
import { measuredLabel } from "./text.mjs";
import { orderedFlow } from "./topology.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const invalid = () => fail("render_interactive_layout_invalid");

export function preparePage(
  page,
  measure,
  footprints = null,
  relationFootprints = null,
  groupFootprints = null,
) {
  const allocations = page?.allocations ?? [];
  if (
    !page ||
    !Array.isArray(page.nodes) ||
    (!page.nodes.length && !allocations.length) ||
    page.nodes.length > 512 ||
    !Array.isArray(allocations) ||
    page.nodes.length + allocations.length > 512 ||
    (allocations.length && !footprints) ||
    !Array.isArray(page.relations) ||
    page.relations.length > 2048
  )
    invalid();
  const nodeIds = new Set();
  for (const node of [...page.nodes, ...allocations]) {
    if (!text(node?.id) || !text(node.label) || nodeIds.has(node.id) || node.id === "root")
      invalid();
    nodeIds.add(node.id);
  }
  const semanticNodeIds = new Set(page.nodes.map(({ id }) => id));
  const relationIds = new Set();
  for (const relation of page.relations) {
    if (
      !text(relation?.id) ||
      relationIds.has(relation.id) ||
      !semanticNodeIds.has(relation.source) ||
      !semanticNodeIds.has(relation.target) ||
      (relation.direction !== undefined &&
        !["forward", "bidirectional"].includes(relation.direction))
    )
      invalid();
    relationIds.add(relation.id);
  }
  const grouped = page.groups !== undefined;
  if (grouped && (!Array.isArray(page.groups) || !page.groups.length || page.groups.length > 512))
    fail("render_interactive_group_invalid");
  const groupIds = new Set();
  const memberships = new Map();
  const groups = (page.groups ?? []).map((group) => {
    if (
      !text(group?.id) ||
      !text(group.label) ||
      group.id === "root" ||
      nodeIds.has(group.id) ||
      groupIds.has(group.id) ||
      !Array.isArray(group.nodeIds) ||
      !group.nodeIds.length
    )
      fail("render_interactive_group_invalid");
    groupIds.add(group.id);
    for (const id of group.nodeIds) {
      if (!semanticNodeIds.has(id) || memberships.has(id)) fail("render_interactive_group_invalid");
      memberships.set(id, group.id);
    }
    return {
      id: group.id,
      nodeIds: [...group.nodeIds],
      label: groupFootprints ? groupFootprints[group.id] : measuredLabel(group.label, measure),
    };
  });
  if (grouped && memberships.size !== semanticNodeIds.size)
    fail("render_interactive_group_invalid");
  if (
    footprints &&
    (Object.keys(footprints).length !== nodeIds.size ||
      Object.keys(footprints).some((id) => !nodeIds.has(id)))
  )
    invalid();
  const measuredNodes = [...page.nodes, ...allocations].map((node) => ({
    id: node.id,
    ...(node.icon === undefined ? {} : { icon: node.icon }),
    groupId: memberships.get(node.id),
    label: footprints ? footprints[node.id]?.label : measuredLabel(node.label, measure),
  }));
  if (
    footprints &&
    measuredNodes.some(
      ({ id, label }) =>
        !label ||
        !Number.isFinite(footprints[id].width) ||
        !Number.isFinite(footprints[id].height) ||
        footprints[id].width <= 0 ||
        footprints[id].height <= 0 ||
        footprints[id].width > 12000 ||
        footprints[id].height > 12000,
    )
  )
    invalid();
  const width = Math.max(
    170,
    ...measuredNodes.map(({ label, icon }) => label.width + (icon === undefined ? 24 : 48)),
  );
  const height = Math.max(64, ...measuredNodes.map(({ label }) => label.height + 16));
  const nodes = measuredNodes.map((node) => ({
    ...node,
    width: footprints?.[node.id].width ?? width,
    height: footprints?.[node.id].height ?? height,
    ...(footprints?.[node.id].ports ? { ports: footprints[node.id].ports } : {}),
  }));
  const relations = page.relations.map((relation) => ({
    id: relation.id,
    source: relation.source,
    target: relation.target,
    direction: relation.direction ?? "forward",
    ...(relation.sourcePort ? { sourcePort: relation.sourcePort } : {}),
    ...(relation.targetPort ? { targetPort: relation.targetPort } : {}),
    label: relationFootprints
      ? (relationFootprints[relation.id] ?? null)
      : relation.graphLabel?.trim()
        ? measuredLabel(relation.graphLabel, measure, {
            fontSize: 13,
            weight: "400",
            maximumWidth: 220,
            maximumLines: 6,
          })
        : null,
  }));
  return { nodes, groups, relations, orderedFlow: orderedFlow(page) };
}
