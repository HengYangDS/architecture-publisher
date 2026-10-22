import { fail } from "../../src/protocol/values.mjs";
import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";
import { branchPlacement } from "./branch-placement.mjs";
import { endpointEscape, packingOptions, placementLeaf } from "./packing.mjs";
import {
  branchStages,
  circuitHub,
  orderedLayoutPage,
  repeatedBranches,
  rootedTree,
} from "./topology.mjs";

/** Native placement receives the complete perimeter capacity before routing. */
export function allocateEndpointFootprints(page, direction) {
  const nodes = page.nodes.map((node) => ({ ...node }));
  const originals = new Map(page.nodes.map((node) => [node.id, node]));
  const relations = page.relations.map((relation) => ({ ...relation }));
  const used = new Set([
    ...nodes.flatMap((node) => [node.id, ...(node.ports ?? []).map(({ id }) => id)]),
    ...page.groups.map(({ id }) => id),
    ...relations.map(({ id }) => id),
  ]);
  const horizontal = direction === "RIGHT";
  for (const node of nodes) {
    if (node.ports) continue;
    const sources = relations.filter(({ source }) => source === node.id);
    const targets = relations.filter(({ target }) => target === node.id);
    const count = Math.max(sources.length, targets.length);
    if (!count) continue;
    const extent = horizontal ? "height" : "width";
    const capacity = marks.routeEndpointStub * 2 + marks.routeInteriorSegment * (count - 1);
    node[extent] = Math.max(node[extent], capacity);
    const original = originals.get(node.id);
    if (node.label.width === original.width && node.label.height === original.height)
      node.label = { ...node.label, width: node.width, height: node.height };
    const ports = (selected, field, side) =>
      selected.map((relation, index) => {
        let id = `${relation.id}:${field}`;
        while (used.has(id)) id += ":";
        used.add(id);
        relation[field === "source" ? "sourcePort" : "targetPort"] = id;
        const position =
          (node[extent] - marks.routeInteriorSegment * (selected.length - 1)) / 2 +
          marks.routeInteriorSegment * index;
        return {
          id,
          x: horizontal ? (side === "EAST" ? node.width : 0) : position,
          y: horizontal ? position : side === "SOUTH" ? node.height : 0,
          width: 0,
          height: 0,
          layoutOptions: { "elk.port.side": side },
        };
      });
    node.ports = [
      ...ports(sources, "source", horizontal ? "EAST" : "SOUTH"),
      ...ports(targets, "target", horizontal ? "WEST" : "NORTH"),
    ];
  }
  return { ...page, nodes, relations };
}

export function allocateCorrespondingFootprints(page, footprints) {
  const family = repeatedBranches(page);
  const allocated = Object.fromEntries(
    Object.entries(footprints).map(([id, size]) => [id, { ...size }]),
  );
  const memberships = new Map(
    (page.groups ?? []).flatMap(({ id, nodeIds }) => nodeIds.map((nodeId) => [nodeId, id])),
  );
  const tracks = new Map();
  for (const { id } of page.nodes) {
    const adjacent = page.relations
      .filter(({ source, target }) => source === id || target === id)
      .map(({ source, target, direction }) => [
        source === id ? "out" : "in",
        source === id ? target : source,
        direction ?? "forward",
      ])
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right), "en"));
    if (!adjacent.length) continue;
    const key = JSON.stringify([memberships.get(id) ?? null, adjacent]);
    if (!tracks.has(key)) tracks.set(key, []);
    tracks.get(key).push(id);
  }
  const shareHeight = (ids) => {
    const peers = ids.map((id) => allocated[id]);
    // Literal primitives have a separate paint measurement and cannot borrow text capacity.
    if (peers.some((size) => !size)) return;
    const height = Math.max(...peers.map((size) => size.height));
    for (const size of peers) size.height = height;
  };
  for (const ids of tracks.values()) shareHeight(ids);
  for (let role = 0; role < (family[0]?.order.length ?? 0); role++) {
    shareHeight(family.map(({ order }) => order[role]));
  }
  return allocated;
}

function circuitPlacement(page, readingWidth) {
  const circuit = circuitHub(page);
  if (!circuit || page.groups?.length || page.nodes.some((node) => node.ports)) return null;
  const nodes = new Map(page.nodes.map((node) => [node.id, node]));
  const width = Math.max(...page.nodes.map((node) => node.width));
  const captionWidth = Math.max(0, ...page.relations.map((edge) => edge.label?.width ?? 0));
  const captionHeight = Math.max(0, ...page.relations.map((edge) => edge.label?.height ?? 0));
  const horizontalGap = Math.max(endpointEscape * 2, captionWidth + marks.readingGap * 2);
  const verticalGap = Math.max(endpointEscape * 2, captionHeight + marks.readingGap * 2);
  const columns = Math.min(
    Math.floor(circuit.order.length / 2),
    Math.floor((readingWidth - marks.graphInset * 2 + horizontalGap) / (width + horizontalGap)),
  );
  if (columns < 3) return null;
  const rowWidth = columns * width + (columns - 1) * horizontalGap;
  const sideCount = circuit.order.length - columns * 2;
  const rightCount = Math.ceil(sideCount / 2);
  const top = circuit.order.slice(0, columns);
  const right = circuit.order.slice(columns, columns + rightCount);
  const bottom = circuit.order.slice(columns + rightCount, columns * 2 + rightCount).reverse();
  const left = circuit.order.slice(columns * 2 + rightCount).reverse();
  const used = new Set(nodes.keys());
  const identity = (role) => {
    let id = `archpub:reading-region:${role}`;
    while (used.has(id)) id += ":";
    used.add(id);
    return id;
  };
  const leaf = (id) => placementLeaf(nodes.get(id), 0, 0);
  const row = (ids, role) => ({
    id: identity(role),
    children: ids.map((id, index) => ({
      ...leaf(id),
      layoutOptions: { "elk.rectpacking.desiredPosition": String(index) },
    })),
    layoutOptions: packingOptions(rowWidth, horizontalGap, 0),
  });
  const height = (ids) =>
    ids.reduce((sum, id) => sum + nodes.get(id).height, 0) +
    Math.max(0, ids.length - 1) * verticalGap;
  const hub = nodes.get(circuit.hub);
  const middleHeight = Math.max(hub.height, height(left), height(right));
  const column = (ids, role) => {
    const inset = (middleHeight - height(ids)) / 2;
    return {
      id: identity(role),
      children: ids.map((id, index) => ({
        ...leaf(id),
        layoutOptions: {
          "elk.rectpacking.desiredPosition": String(index),
          "elk.rectpacking.inNewRow": String(index > 0),
        },
      })),
      layoutOptions: {
        ...packingOptions(width, verticalGap, 0),
        "elk.padding": `[top=${inset},left=0,bottom=${inset},right=0]`,
      },
    };
  };
  const coreInset = (middleHeight - hub.height) / 2;
  const core = {
    id: identity("core"),
    children: [leaf(hub.id)],
    layoutOptions: {
      ...packingOptions(hub.width, 0, 0),
      "elk.padding": `[top=${coreInset},left=0,bottom=${coreInset},right=0]`,
    },
  };
  const middleGap = (rowWidth - width * 2 - hub.width) / 2;
  const middle = {
    id: identity("middle"),
    children: [
      ...(left.length ? [column(left, "left")] : []),
      core,
      ...(right.length ? [column(right, "right")] : []),
    ],
    layoutOptions: {
      ...packingOptions(rowWidth, middleGap, 0),
      "elk.padding": `[top=0,left=${left.length ? 0 : width + middleGap},bottom=0,right=${right.length ? 0 : width + middleGap}]`,
    },
  };
  return {
    containers: [],
    placementOnly: true,
    escape: 0,
    graph: {
      id: "root",
      children: [row(top, "top"), middle, row(bottom, "bottom")].map((region, index) => ({
        ...region,
        layoutOptions: {
          ...region.layoutOptions,
          "elk.rectpacking.desiredPosition": String(index),
          "elk.rectpacking.inNewRow": String(index > 0),
        },
      })),
      layoutOptions: packingOptions(rowWidth, verticalGap, marks.graphInset),
    },
  };
}

export function intrinsicPlacements(page, readingWidth, remainderGraph, readingViewport = null) {
  if (page.orderedFlow && page.relations.length) page = orderedLayoutPage(page);
  const captioned = page.relations.some((edge) => edge.label?.width);
  const compactGap = marks.routeEndpointStub * (captioned ? 3 : 2);
  const readingAspect = readingViewport
    ? readingViewport.width / readingViewport.height
    : marks.desktopReadingAspect;
  const candidates = [false, true].map((compact) => {
    const padding = Math.max(marks.readingGap, endpointEscape);
    const escape = compact ? 0 : endpointEscape;
    const verticalEscape = compact
      ? 0
      : Math.ceil(
          Math.max(
            marks.routeEndpointStub,
            Math.max(0, ...page.relations.map((edge) => edge.label?.height ?? 0)) / 2 +
              marks.textClearance +
              marks.selectedRouteStroke / 2,
          ),
        );
    return {
      containers: [],
      placementOnly: true,
      expandTracks: !page.relations.length,
      escape,
      verticalEscape,
      graph: {
        id: "root",
        layoutOptions: {
          ...packingOptions(
            readingWidth - padding * 2,
            compact ? compactGap : marks.routeInteriorSegment,
            padding,
          ),
          ...(!page.relations.length
            ? { "elk.rectpacking.whiteSpaceElimination.strategy": "EQUAL_BETWEEN_STRUCTURES" }
            : {}),
        },
        children: page.nodes.map((node, index) => ({
          ...placementLeaf(node, verticalEscape, escape),
          layoutOptions: { "elk.rectpacking.desiredPosition": String(index) },
        })),
      },
    };
  });
  const branches = branchPlacement(page, readingWidth, remainderGraph);
  const circuit = circuitPlacement(page, readingWidth);
  if (circuit) candidates[1] = circuit;
  else if (branches) {
    candidates[0] = branchPlacement(page, readingWidth, remainderGraph, true);
    candidates[1] = branches;
  } else if (page.relations.length && (page.orderedFlow || captioned)) {
    if (!readingViewport) {
      const options = candidates[0].graph.layoutOptions;
      options["elk.rectpacking.widthApproximation.strategy"] = "GREEDY";
      options["elk.rectpacking.widthApproximation.optimizationGoal"] = "ASPECT_RATIO_DRIVEN";
      options["elk.aspectRatio"] = String(readingAspect);
      delete options["elk.rectpacking.widthApproximation.targetWidth"];
    }
    const options = candidates[1].graph.layoutOptions;
    if (readingViewport) {
      const captionHeight = Math.max(0, ...page.relations.map((edge) => edge.label?.height ?? 0));
      const verticalEscape = captionHeight / 2;
      candidates[1].verticalEscape = verticalEscape;
      candidates[1].graph.children = page.nodes.map((node) =>
        placementLeaf(node, verticalEscape, 0),
      );
      const width = Math.max(...page.nodes.map((node) => node.width));
      const height = Math.max(...page.nodes.map((node) => node.height));
      const columns = Math.max(
        1,
        Math.min(
          Math.floor((readingWidth - marks.readingGap * 2 + compactGap) / (width + compactGap)),
          page.orderedFlow
            ? Math.floor(
                Math.sqrt(
                  (page.nodes.length * readingAspect * (height + compactGap)) /
                    (width + compactGap),
                ),
              )
            : Math.floor(
                (readingViewport.width - marks.readingGap * 2 + compactGap) / (width + compactGap),
              ),
        ),
      );
      options["elk.rectpacking.widthApproximation.strategy"] = "TARGET_WIDTH";
      options["elk.rectpacking.widthApproximation.targetWidth"] = String(
        readingWidth - marks.graphInset * 4,
      );
      options["elk.rectpacking.widthApproximation.optimizationGoal"] = "ASPECT_RATIO_DRIVEN";
      let order = [...page.nodes];
      if (!page.orderedFlow) {
        const pending = [...page.nodes];
        order = [];
        while (pending.length) {
          const previous = order.at(-1)?.id;
          const at = pending.findIndex(({ id }) =>
            page.relations.some(
              ({ source, target, direction }) =>
                (source === previous && target === id) ||
                (direction === "bidirectional" && target === previous && source === id),
            ),
          );
          order.push(...pending.splice(Math.max(0, at), 1));
        }
        order = order.flatMap((node, index, all) =>
          index % columns
            ? []
            : Math.floor(index / columns) % 2
              ? all.slice(index, index + columns).reverse()
              : all.slice(index, index + columns),
        );
      }
      const byId = new Map(candidates[1].graph.children.map((node) => [node.id, node]));
      candidates[1].graph.children = order.map(({ id }) => byId.get(id));
      candidates[1].graph.children.forEach((node, index) => {
        node.layoutOptions["elk.rectpacking.desiredPosition"] = String(index);
        node.layoutOptions["elk.rectpacking.inNewRow"] = String(index > 0 && index % columns === 0);
      });
    }
  }
  return candidates;
}

export function compositionDisruption(page, layout) {
  let defects = 0;
  const nodes = new Map(layout.nodes.map((node) => [node.id, node]));
  if (!page.relations.length) {
    const rows = new Map();
    for (const node of layout.nodes) {
      if (!rows.has(node.y)) rows.set(node.y, []);
      rows.get(node.y).push(node);
    }
    for (const row of rows.values())
      if (new Set(row.map(({ width, height }) => JSON.stringify([width, height]))).size > 1)
        defects++;
  }
  if (page.orderedFlow)
    for (const { source, target } of page.relations) {
      const from = nodes.get(source),
        to = nodes.get(target);
      if (to.y < from.y - 1 || (Math.abs(to.y - from.y) <= 1 && to.x < from.x - 1)) defects++;
    }
  const family = repeatedBranches(page);
  if (!family.length) return defects;
  const branches = family.flatMap(({ ids }) => ids.map((id) => nodes.get(id)));
  const top = Math.min(...branches.map(({ y }) => y));
  const bottom = Math.max(...branches.map(({ y, height }) => y + height));
  const left = Math.min(...branches.map(({ x }) => x));
  const right = Math.max(...branches.map(({ x, width }) => x + width));
  if (family[0].entry && branches.length === page.nodes.length - 2) {
    const entry = nodes.get(family[0].entry);
    const exit = nodes.get(family[0].exit);
    const centered = (node, axis, extent, middle) =>
      Math.abs(node[axis] + node[extent] / 2 - middle) <= marks.readingGap;
    const horizontal =
      entry.x + entry.width + marks.readingGap <= left &&
      exit.x >= right + marks.readingGap &&
      [entry, exit].every((node) => centered(node, "y", "height", (top + bottom) / 2));
    const vertical =
      entry.y + entry.height + marks.readingGap <= top &&
      exit.y >= bottom + marks.readingGap &&
      [entry, exit].every((node) => centered(node, "x", "width", (left + right) / 2));
    if (!horizontal && !vertical) defects++;
  }
  const { context, before } = branchStages(page, family);
  for (const stage of [context, before])
    if (
      stage.length &&
      Math.max(
        ...stage.map(({ id }) => {
          const { y, height } = nodes.get(id);
          return y + height;
        }),
      ) +
        marks.readingGap >
        top &&
      stage.some(({ id }) => nodes.get(id).x + nodes.get(id).width + marks.readingGap > left)
    )
      defects++;
  const entry = nodes.get(family[0].entry);
  const introducedAbove = entry && entry.y + entry.height + marks.readingGap <= top;
  if (
    family[0].exit &&
    nodes.get(family[0].exit).y < bottom + marks.readingGap &&
    (introducedAbove || nodes.get(family[0].exit).x < right + marks.readingGap)
  )
    defects++;
  const alignedAxis = ["x", "y"].find((axis) =>
    family[0].order.every((_, role) => {
      const positions = family.map(({ order }) => nodes.get(order[role])[axis]);
      return Math.max(...positions) - Math.min(...positions) <= 1;
    }),
  );
  if (!alignedAxis) defects++;
  for (const { order, internal } of family)
    for (const anchor of order) {
      const peers = new Map();
      const remaining = internal.filter((edge) => edge.source !== anchor && edge.target !== anchor);
      for (const edge of internal) {
        if (edge.source !== anchor && edge.target !== anchor) continue;
        const id = edge.source === anchor ? edge.target : edge.source;
        const direction =
          edge.direction === "bidirectional" ? "both" : edge.source === anchor ? "out" : "in";
        const signature = `${direction}${rootedTree(id, remaining).signature}`;
        if (!peers.has(signature)) peers.set(signature, []);
        peers.get(signature).push(nodes.get(id));
      }
      for (const group of peers.values())
        if (
          group.length > 1 &&
          Math.max(...group.map(({ x }) => x)) - Math.min(...group.map(({ x }) => x)) > 1 &&
          Math.max(...group.map(({ y }) => y)) - Math.min(...group.map(({ y }) => y)) > 1
        )
          defects++;
    }
  const envelopes = family
    .map(({ ids }) => {
      const members = ids.map((id) => nodes.get(id));
      return {
        top: Math.min(...members.map(({ y }) => y)),
        bottom: Math.max(...members.map(({ y, height }) => y + height)),
        left: Math.min(...members.map(({ x }) => x)),
        right: Math.max(...members.map(({ x, width }) => x + width)),
      };
    })
    .sort((left, right) => (alignedAxis === "x" ? left.top - right.top : left.left - right.left));
  const [start, end] = alignedAxis === "x" ? ["top", "bottom"] : ["left", "right"];
  for (let index = 1; index < envelopes.length; index++)
    if (envelopes[index][start] - envelopes[index - 1][end] < marks.readingGap) defects++;
  return defects;
}

export function unpackGeometry(raw, containers, placementOnly = false) {
  if (placementOnly) {
    if (!Array.isArray(raw?.children) || (raw.edges !== undefined && !Array.isArray(raw.edges)))
      fail("render_interactive_layout_response_invalid");
    const children = [];
    const edges = (raw.edges ?? []).map((edge) => ({ ...edge, container: "root" }));
    const visit = (node, x, y) => {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y))
        fail("render_interactive_layout_response_invalid");
      if (Array.isArray(node.children)) {
        const translate = (point) => ({ x: x + node.x + point.x, y: y + node.y + point.y });
        for (const edge of node.edges ?? [])
          edges.push({
            ...edge,
            container: "root",
            labels: edge.labels?.map((label) => ({ ...label, ...translate(label) })),
            sections: edge.sections?.map((section) => ({
              ...section,
              startPoint: translate(section.startPoint),
              endPoint: translate(section.endPoint),
              ...(section.bendPoints ? { bendPoints: section.bendPoints.map(translate) } : {}),
            })),
          });
        for (const child of node.children) visit(child, x + node.x, y + node.y);
      } else children.push({ ...node, x: x + node.x, y: y + node.y });
    };
    for (const child of raw.children) visit(child, 0, 0);
    return { ...raw, children, edges };
  }
  if (!containers.length) return raw;
  if (
    !Array.isArray(raw?.children) ||
    (!placementOnly && raw.children.length !== containers.length)
  )
    fail("render_interactive_layout_response_invalid");
  const byId = new Map(raw.children.map((child) => [child.id, child]));
  const children = [],
    edges = [];
  for (const id of containers) {
    const container = byId.get(id);
    if (
      !container ||
      !Number.isFinite(container.x) ||
      !Number.isFinite(container.y) ||
      !Array.isArray(container.children)
    )
      fail("render_interactive_layout_response_invalid");
    const translate = ({ x, y }) => ({ x: x + container.x, y: y + container.y });
    for (const child of container.children) children.push({ ...child, ...translate(child) });
    if (!placementOnly)
      for (const edge of container.edges ?? [])
        edges.push({
          ...edge,
          container: "root",
          labels: edge.labels?.map((label) => ({ ...label, ...translate(label) })),
          sections: edge.sections?.map((section) => ({
            ...section,
            startPoint: translate(section.startPoint),
            endPoint: translate(section.endPoint),
            ...(section.bendPoints ? { bendPoints: section.bendPoints.map(translate) } : {}),
          })),
        });
  }
  if (placementOnly) children.push(...raw.children.filter(({ id }) => !containers.includes(id)));
  return { ...raw, children, edges };
}
