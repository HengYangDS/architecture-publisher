import { fail, hasExactFields } from "../../src/protocol/values.mjs";
import { placeMeasuredLabel } from "./text.mjs";
import { auditInteractiveGeometry } from "./audit.mjs";

const invalid = () => fail("render_interactive_layout_response_invalid");
const coordinate = (value) => Number.isFinite(value) && Math.abs(value) <= 100_000;
const extent = (value) => Number.isFinite(value) && value > 0 && value <= 100_000;
const canonicalCoordinate = (value) => Math.round(value * 1_000_000) / 1_000_000;

/** The owned worker protocol fails closed before geometric normalization. */
export function decodeInteractiveLayoutReply(raw, state, reason) {
  if (reason === "timeout") fail("render_interactive_layout_execution_timeout");
  if (reason === "overflow") fail("render_interactive_layout_response_limit");
  if (
    !["closed", "reply"].includes(reason) ||
    state.spawnError ||
    state.stderrBytes ||
    (reason === "closed" && (!state.closed || state.closed.code !== 0 || state.closed.signal))
  )
    fail("render_interactive_layout_execution_failed");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail("render_interactive_layout_response_invalid");
  }
  if (
    !hasExactFields(value, ["status", "layouts"]) ||
    value.status !== "ok" ||
    !Array.isArray(value.layouts)
  )
    fail("render_interactive_layout_response_invalid");
  return value.layouts;
}

function labelAt(raw, plan, offset) {
  if (
    !raw ||
    !coordinate(raw.x) ||
    !coordinate(raw.y) ||
    raw.width !== plan.width ||
    raw.height !== plan.height ||
    raw.text !== plan.lines.join("\n")
  )
    invalid();
  return placeMeasuredLabel(
    plan,
    canonicalCoordinate(raw.x + offset.x),
    canonicalCoordinate(raw.y + offset.y),
  );
}

/** Translate native segments and join only exact seams; never reroute their points. */
export function collapseCompoundGeometry(raw, bindings) {
  if (!raw || !Array.isArray(raw.children)) invalid();
  const offsets = new Map([["root", { x: 0, y: 0 }]]);
  const edges = new Map();
  const visit = (node, offset) => {
    if (node.edges !== undefined && !Array.isArray(node.edges)) invalid();
    for (const edge of node.edges ?? []) {
      if (!edge || edges.has(edge.id)) invalid();
      edges.set(edge.id, edge);
    }
    for (const child of node.children ?? []) {
      const position = { x: offset.x + child.x, y: offset.y + child.y };
      offsets.set(child.id, position);
      visit(child, position);
    }
  };
  visit(raw, { x: 0, y: 0 });
  if (edges.size !== bindings.reduce((count, { parts }) => count + parts.length, 0)) invalid();
  const joined = bindings.map(({ edge: original, parts }) => {
    const points = [];
    let labels = [];
    for (const part of parts) {
      const edge = edges.get(part.id);
      const offset = offsets.get(part.container);
      const section = edge?.sections?.[0];
      if (
        !offset ||
        !edge ||
        edge.container !== part.container ||
        edge.sources?.length !== 1 ||
        edge.sources[0] !== part.sources[0] ||
        edge.targets?.length !== 1 ||
        edge.targets[0] !== part.targets[0] ||
        !Array.isArray(edge.sections) ||
        edge.sections.length !== 1 ||
        section?.incomingShape !== part.sources[0] ||
        section.outgoingShape !== part.targets[0] ||
        section.incomingSections !== undefined ||
        section.outgoingSections !== undefined ||
        (section.bendPoints !== undefined && !Array.isArray(section.bendPoints)) ||
        (edge.labels?.length ?? 0) !== (part.labels?.length ?? 0)
      )
        invalid();
      const segment = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map(
        (point) => {
          if (!point || !coordinate(point.x) || !coordinate(point.y)) invalid();
          return {
            x: canonicalCoordinate(point.x + offset.x),
            y: canonicalCoordinate(point.y + offset.y),
          };
        },
      );
      if (points.length) {
        if (points.at(-1).x !== segment[0].x || points.at(-1).y !== segment[0].y) invalid();
        segment.shift();
      }
      points.push(...segment);
      if (part.labels?.length)
        labels = edge.labels.map((label) => ({
          ...label,
          x: canonicalCoordinate(label.x + offset.x),
          y: canonicalCoordinate(label.y + offset.y),
        }));
    }
    return {
      ...original,
      container: "root",
      labels,
      sections: [
        {
          incomingShape: original.sources[0],
          outgoingShape: original.targets[0],
          startPoint: points[0],
          bendPoints: points.slice(1, -1),
          endPoint: points.at(-1),
        },
      ],
    };
  });
  return {
    ...raw,
    children: raw.children.map((child) => ({ ...child, edges: [] })),
    edges: joined,
  };
}

/** Container-relative layout output becomes one closed geometry value. */
export function normalizeInteractiveGeometry(
  raw,
  prepared,
  composeCandidate = undefined,
  deferPaintAudit = false,
  expandTracks = false,
) {
  if (
    !raw ||
    raw.id !== "root" ||
    !extent(raw.width) ||
    !extent(raw.height) ||
    !Array.isArray(raw.children)
  )
    invalid();
  const boxes = new Map([["root", { x: 0, y: 0 }]]);
  const leaves = new Map(prepared.nodes.map((node) => [node.id, node]));
  const groups = new Map(prepared.groups.map((group) => [group.id, group]));
  const selectedNodes = new Map();
  const selectedGroups = new Map();
  const rawEdges = [];
  const seen = new Set(["root"]);
  function visit(parent, offset, parentId) {
    if (parent.edges !== undefined) {
      if (!Array.isArray(parent.edges)) invalid();
      rawEdges.push(...parent.edges);
    }
    for (const child of parent.children ?? []) {
      if (
        !child ||
        seen.has(child.id) ||
        !coordinate(child.x) ||
        !coordinate(child.y) ||
        !extent(child.width) ||
        !extent(child.height) ||
        !Array.isArray(child.labels) ||
        child.labels.length !== 1
      )
        invalid();
      seen.add(child.id);
      const box = {
        id: child.id,
        x: canonicalCoordinate(offset.x + child.x),
        y: canonicalCoordinate(offset.y + child.y),
        width: canonicalCoordinate(child.width),
        height: canonicalCoordinate(child.height),
      };
      boxes.set(child.id, box);
      if (groups.has(child.id)) {
        if (parentId !== "root" || !Array.isArray(child.children)) invalid();
        const plan = groups.get(child.id);
        if (
          child.children.length !== plan.nodeIds.length ||
          child.children.some(({ id }) => !plan.nodeIds.includes(id))
        )
          invalid();
        selectedGroups.set(child.id, { ...box, label: labelAt(child.labels[0], plan.label, box) });
        visit(child, box, child.id);
      } else {
        const plan = leaves.get(child.id);
        if (
          !plan ||
          child.children !== undefined ||
          (expandTracks
            ? child.width < plan.width || child.height < plan.height
            : child.width !== plan.width || child.height !== plan.height) ||
          (plan.groupId ?? "root") !== parentId
        )
          invalid();
        if (parentId !== "root") {
          const parentBox = selectedGroups.get(parentId);
          if (
            box.x < parentBox.x + 8 ||
            box.y < parentBox.y + 8 ||
            box.x + box.width > parentBox.x + parentBox.width - 8 ||
            box.y + box.height > parentBox.y + parentBox.height - 8
          )
            invalid();
        }
        selectedNodes.set(child.id, {
          ...box,
          groupId: plan.groupId ?? null,
          ...(plan.icon === undefined ? {} : { icon: plan.icon }),
          label: labelAt(child.labels[0], plan.label, box),
        });
        if (child.edges !== undefined) invalid();
      }
    }
  }
  visit(raw, { x: 0, y: 0 }, "root");
  if (
    selectedNodes.size !== leaves.size ||
    selectedGroups.size !== groups.size ||
    rawEdges.length !== prepared.relations.length
  )
    invalid();
  const edges = new Map();
  for (const edge of rawEdges) {
    if (!edge || edges.has(edge.id)) invalid();
    edges.set(edge.id, edge);
  }
  const relations = prepared.relations.map((plan) => {
    const edge = edges.get(plan.id);
    const offset = boxes.get(edge?.container);
    if (
      !edge ||
      !offset ||
      (edge.container !== "root" && !groups.has(edge.container)) ||
      !Array.isArray(edge.sources) ||
      edge.sources.length !== 1 ||
      edge.sources[0] !== (plan.sourcePort ?? plan.source) ||
      !Array.isArray(edge.targets) ||
      edge.targets.length !== 1 ||
      edge.targets[0] !== (plan.targetPort ?? plan.target) ||
      !Array.isArray(edge.sections) ||
      edge.sections.length !== 1
    )
      invalid();
    const section = edge.sections[0];
    if (
      !section ||
      section.incomingShape !== (plan.sourcePort ?? plan.source) ||
      section.outgoingShape !== (plan.targetPort ?? plan.target) ||
      section.incomingSections !== undefined ||
      section.outgoingSections !== undefined ||
      (section.bendPoints !== undefined && !Array.isArray(section.bendPoints))
    )
      invalid();
    const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
    if (points.some((point) => !point || !coordinate(point.x) || !coordinate(point.y))) invalid();
    if (points.length > 128)
      fail(
        "render_interactive_layout_infeasible",
        `render_interactive_layout_infeasible:route-complexity:${plan.id}`,
      );
    const normalized = points.map(({ x, y }) => ({
      x: canonicalCoordinate(x + offset.x),
      y: canonicalCoordinate(y + offset.y),
    }));
    for (let index = 1; index < normalized.length; index++) {
      const previous = normalized[index - 1];
      const current = normalized[index];
      if (
        (previous.x === current.x && previous.y === current.y) ||
        (previous.x !== current.x && previous.y !== current.y)
      )
        invalid();
    }
    const labels = edge.labels ?? [];
    if (!Array.isArray(labels) || labels.length !== (plan.label ? 1 : 0)) invalid();
    return {
      id: plan.id,
      source: plan.source,
      target: plan.target,
      direction: plan.direction,
      points: normalized,
      label: plan.label ? labelAt(labels[0], plan.label, offset) : null,
    };
  });
  const result = {
    bounds: { width: canonicalCoordinate(raw.width), height: canonicalCoordinate(raw.height) },
    nodes: prepared.nodes.map(({ id }) => selectedNodes.get(id)),
    groups: prepared.groups.map(({ id }) => selectedGroups.get(id)),
    relations,
  };
  composeCandidate?.(result);
  if (!deferPaintAudit) auditInteractiveGeometry(result);
  return result;
}
