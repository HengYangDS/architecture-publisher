import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";
import { endpointEscape, packingOptions, placementLeaf } from "./packing.mjs";
import {
  branchStages,
  connectedComponents,
  orderedLayoutPage,
  repeatedBranches,
} from "./topology.mjs";

export function branchPlacement(page, readingWidth, remainderGraph, compact = false) {
  page = orderedLayoutPage(page);
  const family = repeatedBranches(page);
  if (!family.length) return null;
  if (family[0].entry && family.flatMap(({ ids }) => ids).length === page.nodes.length - 2) {
    if (compact) {
      const used = new Set(page.nodes.map(({ id }) => id));
      const identity = (role) => {
        let id = `archpub:reading-region:${role}`;
        while (used.has(id)) id += ":";
        used.add(id);
        return id;
      };
      const nodes = new Map(page.nodes.map((node) => [node.id, node]));
      const rowGap = Math.ceil(
        Math.max(
          marks.routeEndpointStub * 2,
          ...page.relations.map(
            ({ label }) =>
              (label?.height ?? 0) + 2 * (marks.textClearance + marks.selectedRouteStroke / 2),
          ),
        ),
      );
      const branches = family.map(({ order, internal }, index) => {
        const gap = Math.ceil(
          Math.max(
            marks.routeEndpointStub * 2,
            ...internal.map(
              ({ label }) =>
                (label?.width ?? 0) + 2 * (marks.textClearance + marks.selectedRouteStroke / 2),
            ),
          ),
        );
        const width =
          order.reduce((sum, id) => sum + nodes.get(id).width, 0) + (order.length - 1) * gap;
        return {
          id: identity(`branch:${index}`),
          children: order.map((id, position) => ({
            ...placementLeaf(nodes.get(id), 0, 0),
            layoutOptions: { "elk.rectpacking.desiredPosition": String(position) },
          })),
          layoutOptions: packingOptions(width, gap, 0),
        };
      });
      const width = Math.max(
        ...branches.map((branch) =>
          Number(branch.layoutOptions["elk.rectpacking.widthApproximation.targetWidth"]),
        ),
      );
      const boundary = (id, role) => ({
        id: identity(role),
        children: [placementLeaf(nodes.get(id), 0, 0)],
        layoutOptions: {
          ...packingOptions(width, rowGap, 0),
          "elk.nodeSize.constraints": "MINIMUM_SIZE",
          "elk.nodeSize.minimum": `(${width},0)`,
          "elk.contentAlignment": "H_CENTER V_TOP",
        },
      });
      const parallel = {
        id: identity("parallel"),
        children: branches.map((branch, index) => ({
          ...branch,
          layoutOptions: {
            ...branch.layoutOptions,
            "elk.rectpacking.desiredPosition": String(index),
            "elk.rectpacking.inNewRow": String(index > 0),
          },
        })),
        layoutOptions: packingOptions(width, rowGap, 0),
      };
      return {
        containers: [],
        placementOnly: true,
        escape: 0,
        verticalEscape: 0,
        graph: {
          id: "root",
          children: [
            boundary(family[0].entry, "entry"),
            parallel,
            boundary(family[0].exit, "exit"),
          ].map((stage, index) => ({
            ...stage,
            layoutOptions: {
              ...stage.layoutOptions,
              "elk.rectpacking.desiredPosition": String(index),
              "elk.rectpacking.inNewRow": String(index > 0),
            },
          })),
          layoutOptions: packingOptions(width, rowGap, marks.graphInset),
        },
      };
    }
    const direction = "DOWN";
    const graph = remainderGraph(page);
    graph.layoutOptions = {
      ...graph.layoutOptions,
      "elk.direction": direction,
      "elk.layered.wrapping.strategy": "OFF",
      "elk.layered.layering.strategy": "LONGEST_PATH",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
      "elk.layered.nodePlacement.favorStraightEdges": "false",
      "elk.layered.spacing.nodeNodeBetweenLayers": String(marks.readingGap),
      "elk.spacing.nodeNode": String(marks.routeEndpointStub * 2),
    };
    return { graph, containers: [], placementOnly: true, escape: 0, verticalEscape: 0 };
  }
  const escape = compact ? 0 : endpointEscape;
  const captionGap = Math.ceil(
    Math.max(
      marks.routeEndpointStub * 2,
      ...family.flatMap(({ internal }) =>
        internal.map(
          ({ label }) =>
            (label?.height ?? 0) + 2 * (marks.textClearance + marks.selectedRouteStroke / 2),
        ),
      ),
    ),
  );
  const branchWidth =
    (readingWidth - marks.graphInset * 4 - marks.readingGap * (family.length - 1)) / family.length;
  const layerBound = compact
    ? Math.max(
        1,
        Math.floor(
          (branchWidth + marks.readingGap) /
            (Math.max(...page.nodes.map((node) => node.width)) + marks.readingGap),
        ),
      )
    : 1;
  const used = new Set(page.nodes.map(({ id }) => id));
  const containers = family.map((_, index) => {
    let id = `archpub:branch:${index}`;
    while (used.has(id)) id += ":";
    used.add(id);
    return id;
  });
  const owner = new Map();
  const branches = family.map(({ ids, internal }, index) => {
    for (const id of ids) owner.set(id, containers[index]);
    const order = [];
    const pending = [...family[index].order];
    while (pending.length) {
      const at = pending.findIndex((id) =>
        internal.every((edge) => edge.target !== id || order.includes(edge.source)),
      );
      if (at < 0) break;
      order.push(...pending.splice(at, 1));
    }
    const column = !compact && !pending.length;
    return {
      id: containers[index],
      children: (column ? order : family[index].order).map((id, position) => ({
        ...placementLeaf(
          page.nodes.find((node) => node.id === id),
          0,
          escape,
        ),
        ...(column
          ? {
              layoutOptions: {
                "elk.rectpacking.desiredPosition": String(position),
                "elk.rectpacking.inNewRow": String(position > 0),
              },
            }
          : {}),
      })),
      edges: column
        ? []
        : internal.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
            ...(edge.label
              ? {
                  labels: [
                    {
                      id: `${edge.id}-label`,
                      text: edge.label.lines.join("\n"),
                      width: edge.label.width,
                      height: edge.label.height,
                      ...(compact ? { layoutOptions: { "elk.edgeLabels.placement": "HEAD" } } : {}),
                    },
                  ],
                }
              : {}),
          })),
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "DOWN",
        "elk.hierarchyHandling": "SEPARATE_CHILDREN",
        "elk.edgeRouting": "ORTHOGONAL",
        "elk.spacing.nodeNode": String(marks.readingGap),
        "elk.spacing.edgeNode": "20",
        "elk.layered.layering.strategy": "COFFMAN_GRAHAM",
        "elk.layered.layering.coffmanGraham.layerBound": String(layerBound),
        "elk.layered.nodePlacement.strategy": "SIMPLE",
        // Layered placement sees complete captions; packing reserves their capacity below.
        "elk.layered.spacing.nodeNodeBetweenLayers": String(marks.readingGap),
        "elk.padding": compact
          ? "[top=0,left=0,bottom=0,right=0]"
          : "[top=16,left=16,bottom=16,right=16]",
        ...(column
          ? {
              ...packingOptions(
                Math.max(...ids.map((id) => page.nodes.find((node) => node.id === id).width)) +
                  escape * 2,
                captionGap,
                16,
              ),
              "elk.contentAlignment": "H_LEFT V_TOP",
            }
          : {}),
      },
    };
  });
  const remainder = page.nodes.filter(({ id }) => !owner.has(id));
  if (family[0].entry) {
    const width = readingWidth - marks.graphInset * 4;
    const { context, before, after, edges: edgeSet } = branchStages(page, family);
    const stage = (id, children, layoutOptions) => ({
      id,
      children,
      edges: [],
      layoutOptions,
    });
    const layeredStage = (nodes, name, boundary, constraint, budget) => {
      const ids = new Set(nodes.map(({ id }) => id));
      const graph = remainderGraph(
        orderedLayoutPage({
          ...page,
          nodes: nodes.map((node) => ({ ...node, width: node.width + escape * 2 })),
          relations: edgeSet.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
        }),
      );
      graph.id = name;
      for (const node of graph.children)
        node.layoutOptions = { ...node.layoutOptions, "elk.alignment": "TOP" };
      // Native endpoint labels avoid artificial center-label ranks in a stage.
      // https://eclipse.dev/elk/reference/options/org-eclipse-elk-edgeLabels-placement.html
      for (const edge of graph.edges ?? [])
        if (edge.labels)
          edge.labels = edge.labels.map((label) => ({
            ...label,
            layoutOptions: { ...label.layoutOptions, "elk.edgeLabels.placement": "HEAD" },
          }));
      graph.layoutOptions = {
        ...graph.layoutOptions,
        "elk.direction": "DOWN",
        "elk.padding": "[top=0,left=0,bottom=0,right=0]",
        "elk.hierarchyHandling": "SEPARATE_CHILDREN",
        "elk.separateConnectedComponents": "false",
        "elk.layered.wrapping.strategy": "OFF",
        "elk.layered.layering.strategy": "COFFMAN_GRAHAM",
        "elk.layered.layering.coffmanGraham.layerBound": String(
          Math.max(
            1,
            Math.floor(
              budget /
                (Math.max(...nodes.map((node) => node.width)) +
                  escape * 2 +
                  marks.routeEndpointStub * 2),
            ),
          ),
        ),
      };
      const node = graph.children.find(({ id }) => id === boundary);
      if (node)
        node.layoutOptions = {
          ...node.layoutOptions,
          "elk.layered.layering.layerConstraint": constraint,
        };
      return graph;
    };
    const graphStage = (nodes, name, boundary, constraint, budget = width) => {
      const ids = new Set(nodes.map(({ id }) => id));
      const components = connectedComponents({
        nodes,
        groups: [],
        relations: edgeSet.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
      });
      const primary = components.find((component) =>
        component.nodes.some(({ id }) => id === boundary),
      );
      const siblings = components.filter((component) => component !== primary);
      if (!primary || !siblings.length)
        return layeredStage(nodes, name, boundary, constraint, budget);
      const sidebarWidth =
        Math.max(...siblings.flatMap((component) => component.nodes.map((node) => node.width))) +
        escape * 2 +
        marks.readingGap * 2;
      const primaryWidth = budget - sidebarWidth - marks.readingGap;
      const sideGraphs = siblings.map((component, index) =>
        layeredStage(component.nodes, `${name}:component:${index}`, null, null, sidebarWidth),
      );
      for (const [index, graph] of sideGraphs.entries())
        graph.layoutOptions["elk.rectpacking.desiredPosition"] = String(index);
      return stage(
        name,
        [
          layeredStage(primary.nodes, `${name}:primary`, boundary, constraint, primaryWidth),
          {
            id: `${name}:siblings`,
            children: sideGraphs,
            edges: [],
            layoutOptions: packingOptions(sidebarWidth, marks.readingGap, 0),
          },
        ],
        packingOptions(budget, marks.readingGap, 0),
      );
    };
    const entryColumnWidth =
      Math.max(...before.map((node) => node.width)) + escape * 2 + marks.routeEndpointStub * 2;
    const measuredArea = (nodes) =>
      nodes.reduce(
        (area, node) => area + (node.width + escape * 2) * (node.height + marks.readingGap),
        0,
      );
    const entryArea = measuredArea(before);
    const entryWidth =
      entryColumnWidth *
      Math.max(
        1,
        Math.round(
          ((width - marks.readingGap) * entryArea) /
            ((entryArea + measuredArea(context)) * entryColumnWidth),
        ),
      );
    const contextWidth = width - entryWidth - marks.readingGap;
    const sharedIntroduction =
      context.length &&
      contextWidth >=
        Math.max(...context.map((node) => node.width)) + escape * 2 + marks.graphInset * 2;
    const contextStage = (budget) =>
      stage(
        "archpub:context",
        context.map((node) => placementLeaf(node, 0, escape)),
        packingOptions(budget - marks.graphInset * 2, marks.readingGap, marks.graphInset),
      );
    const entryStage = () =>
      layeredStage(before, "archpub:before", family[0].entry, "LAST_SEPARATE", entryWidth);
    const introduction = sharedIntroduction
      ? [
          stage(
            "archpub:introduction",
            [contextStage(contextWidth), entryStage()],
            packingOptions(width, marks.readingGap, 0),
          ),
        ]
      : [
          ...(context.length ? [contextStage(width)] : []),
          graphStage(before, "archpub:before", family[0].entry, "LAST_SEPARATE"),
        ];
    const children = [
      ...introduction,
      stage("archpub:parallel", branches, packingOptions(width, marks.readingGap, 0)),
      graphStage(after, "archpub:after", family[0].exit, "FIRST_SEPARATE"),
    ];
    for (const [index, child] of children.entries()) {
      child.layoutOptions["elk.rectpacking.desiredPosition"] = String(index);
      child.layoutOptions["elk.rectpacking.inNewRow"] = String(index > 0);
    }
    return {
      containers,
      placementOnly: true,
      escape,
      verticalEscape: 0,
      graph: {
        id: "root",
        children,
        edges: [],
        layoutOptions: packingOptions(width, marks.readingGap, marks.graphInset),
      },
    };
  }
  const connected = new Set(page.relations.flatMap(({ source, target }) => [source, target]));
  const context = remainder.filter(({ id }) => !connected.has(id));
  const resultNodes = remainder.filter(({ id }) => connected.has(id));
  const remainderIds = new Set(resultNodes.map(({ id }) => id));
  let coreId = "archpub:remainder";
  while (used.has(coreId)) coreId += ":";
  const core = remainderGraph(
    orderedLayoutPage({
      ...page,
      nodes: resultNodes.map((node) => ({ ...node, width: node.width + escape * 2 })),
      relations: page.relations.filter(
        (edge) => remainderIds.has(edge.source) && remainderIds.has(edge.target),
      ),
    }),
  );
  core.id = coreId;
  if (compact) {
    core.layoutOptions = {
      ...core.layoutOptions,
      "elk.aspectRatio": String(marks.desktopReadingAspect),
      "elk.padding": "[top=0,left=0,bottom=0,right=0]",
    };
    core.edges = (core.edges ?? []).map((edge) => ({
      ...edge,
      ...(edge.labels
        ? {
            labels: edge.labels.map((label) => ({
              ...label,
              layoutOptions: { ...label.layoutOptions, "elk.edgeLabels.placement": "HEAD" },
            })),
          }
        : {}),
    }));
  }
  containers.push(coreId);
  let parallelId = "archpub:parallel";
  while (used.has(parallelId)) parallelId += ":";
  const children = compact
    ? [
        {
          id: parallelId,
          children: branches,
          edges: [],
          layoutOptions: packingOptions(readingWidth - marks.graphInset * 4, marks.readingGap, 0),
        },
        core,
      ]
    : [...branches, core];
  if (context.length) {
    let contextId = "archpub:context";
    while (used.has(contextId)) contextId += ":";
    containers.unshift(contextId);
    children.unshift({
      id: contextId,
      children: context.map((node) => placementLeaf(node, 0, escape)),
      edges: [],
      layoutOptions: {
        ...packingOptions(readingWidth - marks.graphInset * 4, marks.routeEndpointStub * 2, 0),
        ...(compact ? { "elk.contentAlignment": "H_CENTER V_TOP" } : {}),
      },
    });
  }
  if (compact)
    for (const [index, stage] of children.entries())
      stage.layoutOptions = {
        ...stage.layoutOptions,
        "elk.rectpacking.desiredPosition": String(index),
        "elk.rectpacking.inNewRow": String(index > 0),
      };
  return {
    containers,
    placementOnly: true,
    escape,
    verticalEscape: 0,
    graph: {
      id: "root",
      children,
      edges: [],
      layoutOptions: packingOptions(
        readingWidth - marks.graphInset * 4,
        marks.routeEndpointStub * 2,
        marks.graphInset,
      ),
    },
  };
}
