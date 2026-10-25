import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";

export function elkGraph(
  prepared,
  direction,
  { wrapAspect = null, layerBound = null, placement = null } = {},
) {
  const label = (id, plan) => ({
    id: `${id}-label`,
    text: plan.lines.join("\n"),
    width: plan.width,
    height: plan.height,
  });
  const leaf = (node) => ({
    id: node.id,
    width: node.width,
    height: node.height,
    labels: [label(node.id, node.label)],
    ...(node.ports ? { ports: node.ports } : {}),
    layoutOptions: {
      "elk.nodeLabels.placement": "[INSIDE,H_CENTER,V_CENTER]",
      "elk.alignment": direction === "DOWN" ? "TOP" : "LEFT",
      ...(node.ports ? { "elk.portConstraints": "FIXED_POS" } : {}),
    },
  });
  const byId = new Map(prepared.nodes.map((node) => [node.id, node]));
  const children = [
    ...prepared.groups.map((group) => {
      const inset = marks.readingGap;
      const memberWidth = Math.max(...group.nodeIds.map((id) => byId.get(id).width));
      const side = inset + Math.max(0, group.label.width - memberWidth) / 2;
      const leading = direction === "DOWN";
      const top = leading ? inset : inset + group.label.height + inset;
      // Top ingress needs ELK's native title reservation; a fixed label is not
      // a routing obstacle. Lateral ingress retains the compact measured band.
      return {
        id: group.id,
        labels: [
          leading
            ? label(group.id, group.label)
            : { ...label(group.id, group.label), x: inset, y: inset },
        ],
        children: group.nodeIds.map((id) => leaf(byId.get(id))),
        layoutOptions: {
          "elk.nodeLabels.placement": leading ? "[INSIDE,H_LEFT,V_TOP]" : "[]",
          "elk.padding": `[top=${top},left=${side},bottom=${inset},right=${side}]`,
        },
      };
    }),
    ...prepared.nodes.filter(({ groupId }) => !groupId).map(leaf),
  ];
  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.randomSeed": "1",
      "elk.spacing.nodeNode": placement === "SIMPLE" ? "16" : "24",
      "elk.spacing.edgeNode": placement === "SIMPLE" ? "16" : "20",
      "elk.spacing.edgeEdge": placement === "SIMPLE" ? "12" : "16",
      "elk.spacing.labelNode": "16",
      "elk.spacing.edgeLabel": "8",
      "elk.spacing.portPort": String(marks.routeInteriorSegment),
      "elk.layered.mergeEdges": "false",
      "elk.layered.mergeHierarchyEdges": "false",
      "elk.layered.spacing.edgeNodeBetweenLayers": placement === "SIMPLE" ? "16" : "24",
      "elk.layered.spacing.edgeEdgeBetweenLayers": placement === "SIMPLE" ? "12" : "16",
      "elk.layered.spacing.nodeNodeBetweenLayers": String(marks.routeEndpointStub),
      "elk.layered.nodePlacement.favorStraightEdges": "false",
      ...(placement ? { "elk.layered.nodePlacement.strategy": placement } : {}),
      ...(wrapAspect !== null
        ? { "elk.layered.wrapping.strategy": "MULTI_EDGE", "elk.aspectRatio": String(wrapAspect) }
        : {}),
      ...(layerBound !== null
        ? {
            "elk.layered.layering.strategy": "COFFMAN_GRAHAM",
            "elk.layered.layering.coffmanGraham.layerBound": String(layerBound),
          }
        : {}),
      "elk.edgeLabels.inline": "false",
      "elk.layered.edgeLabels.sideSelection": "ALWAYS_DOWN",
      "elk.padding": "[top=24,left=24,bottom=24,right=24]",
    },
    children,
    edges: prepared.relations.map((relation) => ({
      id: relation.id,
      sources: [relation.sourcePort ?? relation.source],
      targets: [relation.targetPort ?? relation.target],
      ...(relation.label ? { labels: [label(relation.id, relation.label)] } : {}),
    })),
  };
}

/** Group boundaries are native routing seams, never additional source relations. */
export function separateGroupTracks(graph, direction) {
  const groups = new Map(
    graph.children.filter((node) => node.children).map((node) => [node.id, node]),
  );
  const owner = new Map();
  const used = new Set();
  for (const node of graph.children) {
    used.add(node.id);
    for (const child of node.children ?? [node]) {
      owner.set(child.id, node.children ? node : null);
      used.add(child.id);
      for (const port of child.ports ?? []) {
        owner.set(port.id, node.children ? node : null);
        used.add(port.id);
      }
    }
  }
  for (const edge of graph.edges) used.add(edge.id);
  const identity = (id) => {
    while (used.has(id)) id += ":";
    used.add(id);
    return id;
  };
  for (const group of groups.values()) {
    group.ports = [];
    group.edges = [];
    Object.assign(group.layoutOptions, {
      "elk.hierarchyHandling": "SEPARATE_CHILDREN",
      "elk.portConstraints": "FIXED_SIDE",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    });
  }
  Object.assign(graph.layoutOptions, {
    "elk.layered.nodePlacement.strategy": "INTERACTIVE",
    "elk.layered.interactiveReferencePoint": "TOP_LEFT",
  });
  const originalEdges = graph.edges;
  graph.edges = [];
  const bindings = originalEdges.map((edge) => {
    const source = owner.get(edge.sources[0]);
    const target = owner.get(edge.targets[0]);
    const parts = [];
    const record = (part, container) => {
      (container ? container.edges : graph.edges).push(part);
      parts.push({ ...part, container: container?.id ?? "root" });
    };
    if (source === target) record(edge, source);
    else {
      const boundary = (group, role) => {
        const id = identity(`${edge.id}:boundary-${role}`);
        group.ports.push({
          id,
          width: 0,
          height: 0,
          layoutOptions: {
            "elk.port.side":
              direction === "RIGHT"
                ? role === "source"
                  ? "EAST"
                  : "WEST"
                : role === "source"
                  ? "SOUTH"
                  : "NORTH",
          },
        });
        return id;
      };
      const from = source ? boundary(source, "source") : edge.sources[0];
      const to = target ? boundary(target, "target") : edge.targets[0];
      if (source)
        record(
          { id: identity(`${edge.id}:source-segment`), sources: edge.sources, targets: [from] },
          source,
        );
      record({ ...edge, sources: [from], targets: [to] }, null);
      if (target)
        record(
          { id: identity(`${edge.id}:target-segment`), sources: [to], targets: edge.targets },
          target,
        );
    }
    return { edge, parts };
  });
  return { graph, bindings, containers: [] };
}
