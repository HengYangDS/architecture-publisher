import { fail, hasExactFields as exact } from "../../protocol/values.mjs";
import { resolvePrimitiveNodes } from "../primitives.mjs";
import { validateAuthoredRouteGeometry, validateAuthoredRouteTopology } from "../routes.mjs";
import { validateAuthoredTextOwners } from "../text-ownership.mjs";
import {
  interactiveArchitectureInputValid,
  proseValid,
} from "../../edition/generated/validators.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const preciseText = (value) =>
  text(value) &&
  value.length <= 2048 &&
  value === value.trim() &&
  ![...value].some((character) => character.charCodeAt(0) < 32 || character === "\x7f");
const identifier = (value) => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const side = new Set(["top", "right", "bottom", "left"]);
const route = new Set(["auto", "straight", "orthogonal-h", "orthogonal-v"]);

function validPoint(value) {
  return exact(value, ["x", "y"]) && Number.isFinite(value.x) && Number.isFinite(value.y);
}

function validSize(value) {
  return (
    exact(value, ["width", "height"]) &&
    Number.isFinite(value.width) &&
    value.width > 0 &&
    Number.isFinite(value.height) &&
    value.height > 0
  );
}

function validTypography(value) {
  return (
    exact(value, ["minimumTextPx"]) &&
    Number.isFinite(value.minimumTextPx) &&
    value.minimumTextPx >= 6 &&
    value.minimumTextPx <= 32
  );
}

function validNodeAnnotations(node) {
  return (
    ["detail", "note"].every((field) => !Object.hasOwn(node, field) || text(node[field])) &&
    (!Object.hasOwn(node, "figureLabel") || preciseText(node.figureLabel))
  );
}

function validSemanticIds(value, allowEmpty = false) {
  return (
    Array.isArray(value) &&
    (allowEmpty || value.length > 0) &&
    new Set(value).size === value.length &&
    value.every(text)
  );
}

function validWaypoints(value) {
  return Array.isArray(value) && value.length > 0 && value.every(validPoint);
}

function validLabelPlacement(value) {
  if (!exact(value, [], ["at", "dx", "dy", "segment"])) return false;
  if (
    Object.hasOwn(value, "at") &&
    (!Array.isArray(value.at) ||
      value.at.length !== 2 ||
      value.at.some((coordinate) => !Number.isFinite(coordinate)))
  )
    return false;
  if (Object.hasOwn(value, "dx") && !Number.isFinite(value.dx)) return false;
  if (Object.hasOwn(value, "dy") && !Number.isFinite(value.dy)) return false;
  return (
    !Object.hasOwn(value, "segment") || (Number.isSafeInteger(value.segment) && value.segment >= 0)
  );
}

function validTextOccurrence(value) {
  return (
    exact(
      value,
      [
        "id",
        "text",
        "fontSize",
        "weight",
        "anchor",
        "tone",
        "x",
        "baseline",
        "visible",
        "semanticIds",
        "box",
      ],
      ["font", "family", "owner"],
    ) &&
    identifier(value.id) &&
    text(value.text) &&
    Number.isFinite(value.fontSize) &&
    value.fontSize > 0 &&
    value.fontSize <= 300 &&
    ["400", "500", "600", "700"].includes(value.weight) &&
    (!Object.hasOwn(value, "font") || identifier(value.font)) &&
    (!Object.hasOwn(value, "family") || (text(value.family) && value.family.length <= 128)) &&
    ["start", "middle", "end"].includes(value.anchor) &&
    identifier(value.tone) &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.baseline) &&
    typeof value.visible === "boolean" &&
    Array.isArray(value.semanticIds) &&
    value.semanticIds.length <= 4096 &&
    new Set(value.semanticIds).size === value.semanticIds.length &&
    value.semanticIds.every(text) &&
    exact(value.box, ["x", "y", "width", "height"]) &&
    Object.values(value.box).every(Number.isFinite) &&
    value.box.width > 0 &&
    value.box.height > 0
  );
}

/** Validate a backend-neutral interactive architecture scene. */
function validateReaderNotes(scene, occupied) {
  if (!Object.hasOwn(scene, "notes")) return;
  if (!Array.isArray(scene.notes) || scene.notes.length > 256)
    fail("interactive_scene_note_invalid");
  const identities = new Set([...occupied, ...(scene.routes ?? []).map(({ id }) => id)]);
  let itemCount = 0;
  const admitIdentity = (id) => {
    if (!identifier(id) || identities.has(id)) fail("interactive_scene_note_invalid");
    identities.add(id);
  };
  for (const card of scene.notes) {
    if (
      !exact(card, ["id", "title", "items"]) ||
      !preciseText(card.title) ||
      !Array.isArray(card.items) ||
      !card.items.length ||
      card.items.length > 256
    )
      fail("interactive_scene_note_invalid");
    admitIdentity(card.id);
    for (const item of card.items) {
      if (
        ++itemCount > 4096 ||
        !exact(item, ["id", "text", "semanticIds"]) ||
        !proseValid(item.text) ||
        !validSemanticIds(item.semanticIds, true)
      )
        fail("interactive_scene_note_invalid");
      admitIdentity(item.id);
    }
  }
}

export function validateInteractiveArchitectureScene(scene) {
  if (
    !exact(
      scene,
      ["schema", "id", "title", "subtitle", "viewport", "nodes", "groups", "edges"],
      ["texts", "notes", "requiredSemanticIds", "routes", "typography"],
    ) ||
    scene.schema !== "architecture.interactive-scene/v1" ||
    !identifier(scene.id) ||
    !text(scene.title) ||
    !text(scene.subtitle) ||
    !validSize(scene.viewport) ||
    (Object.hasOwn(scene, "typography") && !validTypography(scene.typography)) ||
    !Array.isArray(scene.nodes) ||
    (!scene.nodes.length &&
      !scene.texts?.some(
        (value) => value.visible && text(value.text) && value.semanticIds?.length,
      )) ||
    !Array.isArray(scene.groups) ||
    !Array.isArray(scene.edges)
  )
    fail("interactive_scene_invalid");
  if (
    Object.hasOwn(scene, "requiredSemanticIds") &&
    (!validSemanticIds(scene.requiredSemanticIds) || scene.requiredSemanticIds.length > 8192)
  )
    fail("interactive_scene_invalid");
  if (
    Object.hasOwn(scene, "texts") &&
    (!Array.isArray(scene.texts) ||
      scene.texts.length > 4096 ||
      scene.texts.some((value) => !validTextOccurrence(value)))
  )
    fail("interactive_scene_text_invalid");

  const resolvedNodes = resolvePrimitiveNodes(scene.nodes, "interactive");
  const nodes = new Set();
  for (const node of resolvedNodes) {
    if (node.primitives) {
      if (nodes.has(node.id)) fail("interactive_scene_node_invalid");
      nodes.add(node.id);
      continue;
    }
    if (
      !exact(
        node,
        ["id", "label", "visualRole", "position", "size"],
        ["detail", "note", "semanticIds", "figureKind", "figureLabel", "icon"],
      ) ||
      !identifier(node.id) ||
      nodes.has(node.id) ||
      !text(node.label) ||
      !text(node.visualRole) ||
      !validPoint(node.position) ||
      !validSize(node.size) ||
      !validNodeAnnotations(node) ||
      (Object.hasOwn(node, "figureKind") && !preciseText(node.figureKind)) ||
      (Object.hasOwn(node, "icon") && !preciseText(node.icon)) ||
      (Object.hasOwn(node, "semanticIds") && !validSemanticIds(node.semanticIds))
    )
      fail("interactive_scene_node_invalid");
    nodes.add(node.id);
  }

  const groupedNodes = new Set(resolvedNodes.filter((node) => !node.adornment).map(({ id }) => id));
  const groups = new Set(),
    grouped = new Set();
  for (const group of scene.groups) {
    if (
      !exact(group, ["id", "label", "nodeIds", "padding"]) ||
      !identifier(group.id) ||
      groups.has(group.id) ||
      !text(group.label) ||
      !Array.isArray(group.nodeIds) ||
      !group.nodeIds.length ||
      !Number.isFinite(group.padding) ||
      group.padding < 0
    )
      fail("interactive_scene_group_invalid");
    groups.add(group.id);
    for (const id of group.nodeIds) {
      if (!groupedNodes.has(id) || grouped.has(id))
        fail("interactive_scene_group_membership_invalid");
      grouped.add(id);
    }
  }
  if (scene.groups.length && grouped.size !== groupedNodes.size)
    fail("interactive_scene_group_membership_invalid");

  const edges = new Set();
  for (const edge of scene.edges) {
    if (Object.hasOwn(edge, "adornment")) {
      if (edges.has(edge.id)) fail("interactive_scene_edge_invalid");
      edges.add(edge.id);
      continue;
    }
    if (
      !exact(
        edge,
        ["id", "from", "to", "label", "visualRole", "fromSide", "toSide", "route"],
        ["labelPlacement", "semanticIds", "waypoints"],
      ) ||
      !identifier(edge.id) ||
      edges.has(edge.id) ||
      !nodes.has(edge.from) ||
      !nodes.has(edge.to) ||
      (edge.label !== "" && !preciseText(edge.label)) ||
      !text(edge.visualRole) ||
      !side.has(edge.fromSide) ||
      !side.has(edge.toSide) ||
      !route.has(edge.route) ||
      (Object.hasOwn(edge, "labelPlacement") && !validLabelPlacement(edge.labelPlacement)) ||
      (Object.hasOwn(edge, "semanticIds") && !validSemanticIds(edge.semanticIds)) ||
      (Object.hasOwn(edge, "waypoints") && !validWaypoints(edge.waypoints))
    )
      fail("interactive_scene_edge_invalid");
    edges.add(edge.id);
  }
  const textIds = new Set();
  for (const label of scene.texts ?? []) {
    if (nodes.has(label.id) || edges.has(label.id) || textIds.has(label.id))
      fail("interactive_scene_text_invalid");
    textIds.add(label.id);
  }
  const normalized = resolvedNodes.some((node) => node.primitives)
    ? { ...scene, nodes: resolvedNodes }
    : scene;
  validateReaderNotes(scene, [...nodes, ...edges, ...groups, ...textIds]);
  validateAuthoredTextOwners(scene.texts ?? [], normalized.nodes, normalized.edges);
  validateAuthoredRouteGeometry(normalized, "interactive");
  return normalized;
}

/** Admit one complete input form; physical validation still owns resolved geometry. */
export function validateInteractiveArchitectureInput(scene) {
  if (Object.hasOwn(scene ?? {}, "viewport")) return validateInteractiveArchitectureScene(scene);
  const schemaInput = {
    ...scene,
    nodes: scene?.nodes?.map((node) => {
      const input = { ...node };
      delete input.figureLabel;
      return input;
    }),
  };
  if (
    !interactiveArchitectureInputValid(schemaInput) ||
    (!scene.nodes.length &&
      !scene.texts?.some(
        (value) => value.visible && text(value.text) && value.semanticIds?.length,
      )) ||
    scene.nodes.some((node) => Object.hasOwn(node, "figureLabel") && !preciseText(node.figureLabel))
  )
    fail("interactive_scene_invalid");
  const identities = new Set();
  for (const member of [...scene.nodes, ...scene.groups, ...scene.edges, ...(scene.texts ?? [])]) {
    if (identities.has(member.id)) fail("interactive_scene_identity_invalid");
    identities.add(member.id);
  }
  const nodes = new Set(scene.nodes.map(({ id }) => id));
  for (const edge of scene.edges)
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) fail("interactive_scene_edge_invalid");
  const memberships = new Set();
  for (const group of scene.groups)
    for (const id of group.nodeIds) {
      if (!nodes.has(id) || memberships.has(id)) fail("interactive_scene_group_invalid");
      memberships.add(id);
    }
  if (scene.groups.length && memberships.size !== nodes.size)
    fail("interactive_scene_group_invalid");
  validateReaderNotes(scene, [...identities]);
  validateAuthoredTextOwners(scene.texts ?? [], scene.nodes, scene.edges);
  validateAuthoredRouteTopology(scene, "interactive");
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
    schema: "architecture.interactive-scene/v1",
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
