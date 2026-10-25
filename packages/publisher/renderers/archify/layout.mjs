import {
  validateInteractiveArchitectureInput,
  validateInteractiveArchitectureScene,
} from "../../src/scene/interactive/architecture.mjs";

import { fail } from "../../src/protocol/values.mjs";
import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";

import { resolvePrimitivePaint } from "../../src/scene/primitives.mjs";

import { loadBundledFonts } from "../fonts/index.mjs";

import { createBundledTextMeasurer } from "../resvg/measurement.mjs";

import { layoutInteractivePages } from "../elk/layout.mjs";
import { nodeEnvelopeExpansion, readingApertureExpansion } from "../elk/audit.mjs";

import { allocateCorrespondingFootprints } from "../elk/placement.mjs";

import { placeMeasuredLabel } from "../elk/text.mjs";

import { routeIntrinsicGeometry, routePackedIntrinsicGeometry } from "./intrinsic-routing.mjs";

import { auditIntrinsicGeometry, intrinsicReadingWidth } from "./routing-contract.mjs";

import {
  architectureTextBudget,
  architectureReadingDistances,
  measureArchitectureLabels,
  measureArchitectureNodeText,
} from "./node-text.mjs";

import {
  architectureExploration,
  intrinsicArchitectureFraming,
  measureArchitectureLegend,
} from "./legend.mjs";
import { nativeRelationTraversals } from "./semantics.mjs";

import { sharedContacts } from "./contacts.mjs";

import { emptyLabel, allocateLabelOccurrences } from "./allocation.mjs";
import { architecturePaintRequest } from "./text-lines.mjs";

const literalArrowGeometry = Object.freeze({ length: 10, halfWidth: 3.2, strokeWidth: 1.4 });
const readingViewport = { width: marks.desktopFrameWidth, height: marks.desktopReadingHeight };

/** Derive ordinary physical composition; supplied literal scenes never enter this path. */
async function composeArchitectureCandidate(scene, fonts, exploration, sizing, measuredLayouts) {
  const readingContext = sizing.readingContext ?? "overview";
  const minimum = scene.typography?.minimumTextPx ?? 12;
  const budget = architectureTextBudget(minimum);
  const textFamilies = new Map((fonts.texts ?? []).map(({ id, family }) => [id, family]));
  const measuredScene = {
    ...scene,
    texts: (scene.texts ?? []).map((text) => ({
      ...text,
      ...(textFamilies.get(text.id) ? { family: textFamilies.get(text.id) } : {}),
    })),
  };
  const measured = await measureArchitectureNodeText(
    measuredScene,
    budget,
    fonts,
    createBundledTextMeasurer,
    {
      maximumWidth: sizing.nodeWidth ?? 280,
      preferredWidth: sizing.nodeWidth ?? 280,
      alignColumns: true,
    },
  );
  if (Object.values(measured.layouts).some(({ valid }) => !valid))
    fail("render_node_text_infeasible");
  const labels = [
    ...scene.edges
      .filter((edge) => !edge.adornment)
      .map((edge) => ({ id: edge.id, text: edge.label })),
    ...(scene.texts ?? []).map((text) => ({
      ...text,
      ...(textFamilies.get(text.id) ? { family: textFamilies.get(text.id) } : {}),
    })),
    ...scene.groups.map((group) => ({ id: group.id, text: group.label, weight: "600" })),
  ];
  const labelText = await measureArchitectureLabels(
    labels,
    budget,
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: sizing.labelWidth ?? 240 },
  );
  const viewportMeasure = await createBundledTextMeasurer(fonts);
  const viewportRows = [
    ...Object.values(measured.layouts).flatMap((layout) =>
      layout.rows
        .filter(({ painted }) => painted)
        .map((row) => ({
          ...architecturePaintRequest(row),
          family: row.family ?? layout.family,
          baseline: row.y,
        })),
    ),
    ...Object.values(labelText.layouts).flatMap((layout) =>
      layout.baselines.map((row) => ({
        ...architecturePaintRequest(row),
        family: layout.family,
        fontSize: layout.fontSize,
        weight: layout.weight,
      })),
    ),
  ];
  // Ink owns collision clearance; exact font line boxes additionally own viewport fit.
  const inset = Math.ceil(
    Math.max(
      0,
      ...viewportRows.flatMap((row) => {
        const line = viewportMeasure.lineMetrics({ ...row, anchor: "middle" });
        const ink = row.box;
        return [
          ink.y - row.baseline + line.ascent,
          row.baseline + line.descent - ink.y - ink.height,
        ];
      }),
    ),
  );
  const measuredLegend = await measureArchitectureLegend(scene, budget, fonts, exploration);
  const framing = intrinsicArchitectureFraming(readingViewport, inset, measuredLegend);
  const sizes = allocateCorrespondingFootprints(
    {
      nodes: scene.nodes,
      groups: scene.groups,
      relations: scene.edges.map((edge) => ({ source: edge.from, target: edge.to })),
    },
    measured.sizes,
  );
  const primitiveAllocations = new Map();
  for (const node of scene.nodes.filter((node) => node.primitives)) {
    const { paintBox } = resolvePrimitivePaint(node, { x: 0, y: 0 });
    const local = resolvePrimitivePaint(node, { x: -paintBox.x, y: -paintBox.y });
    primitiveAllocations.set(node.id, local.primitives);
    sizes[node.id] = {
      width: Math.max(1, Math.ceil(paintBox.width)),
      height: Math.max(1, Math.ceil(paintBox.height)),
    };
  }
  const contacts = sharedContacts(scene, sizes);
  const nodeFootprints = Object.fromEntries(
    scene.nodes.map((node) => {
      const layout = measured.layouts[node.id];
      return [
        node.id,
        {
          ...sizes[node.id],
          ...(contacts.ports[node.id] ? { ports: contacts.ports[node.id] } : {}),
          label: layout
            ? {
                lines: layout.rows.map(({ text }) => text),
                width: sizes[node.id].width,
                height: sizes[node.id].height,
                fontSize: budget.minimum,
                weight: "400",
                baselines: layout.rows
                  .filter(({ painted }) => painted)
                  .map(({ y: baseline, ...row }) => ({ ...row, baseline })),
              }
            : emptyLabel(budget.minimum),
        },
      ];
    }),
  );
  const relationFootprints = Object.create(null);
  const edgeAllocations = new Map();
  const edges = new Set(scene.edges.map(({ id }) => id));
  const nodes = new Set(scene.nodes.map(({ id }) => id));
  const islands = [];
  for (const text of scene.texts ?? []) {
    if (edges.has(text.owner)) {
      const items = edgeAllocations.get(text.owner) ?? [];
      items.push({ id: text.id, plan: labelText.layouts[text.id] });
      edgeAllocations.set(text.owner, items);
    } else if (nodes.has(text.owner)) {
      continue;
    } else {
      if (text.owner) fail("render_intrinsic_text_allocation_infeasible");
      const id = `archpub:text:${text.id}`;
      const plan = labelText.layouts[text.id];
      islands.push({ id, label: text.text });
      nodeFootprints[id] = { width: plan.width + 16, height: plan.height + 16, label: plan };
    }
  }
  for (const edge of scene.edges) {
    const occurrences = [
      ...(!edge.adornment ? [{ id: edge.id, plan: labelText.layouts[edge.id] }] : []),
      ...(edgeAllocations.get(edge.id) ?? []),
    ].filter(({ plan }) => plan.baselines.length);
    if (!occurrences.length) continue;
    const allocated = allocateLabelOccurrences(occurrences, budget.minimum);
    edgeAllocations.set(edge.id, allocated);
    relationFootprints[edge.id] = allocated.plan;
  }
  const bridges = scene.edges.filter(
    (edge) => edge.adornment && edge.from === edge.to && contacts.ports[edge.from],
  );
  const graph = architectureExploration(scene, exploration);
  const directions = new Map(
    nativeRelationTraversals(graph.relations, graph.nodes)
      .filter(({ edgeId }) => edgeId)
      .map(({ edgeId, direction }) => [edgeId, direction]),
  );
  const page = {
    id: scene.id,
    nodes: scene.nodes.map((node) => ({ id: node.id, label: node.label ?? node.id })),
    ...(islands.length ? { allocations: islands } : {}),
    ...(scene.groups.length ? { groups: scene.groups } : {}),
    relations: scene.edges
      .filter((edge) => !bridges.includes(edge))
      .map((edge) => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        direction: directions.get(edge.id) ?? "forward",
        ...(contacts.endpoints.has(`${edge.id}:from`)
          ? { sourcePort: contacts.endpoints.get(`${edge.id}:from`) }
          : {}),
        ...(contacts.endpoints.has(`${edge.id}:to`)
          ? { targetPort: contacts.endpoints.get(`${edge.id}:to`) }
          : {}),
        ...(!edge.adornment ? { graphLabel: edge.label } : {}),
      })),
  };
  const nativeEdges = new Map(scene.edges.map((edge) => [edge.id, edge]));
  const nativePaint = (layout) => {
    for (const relation of layout.relations) {
      const edge = nativeEdges.get(relation.id);
      relation.variant = edge.adornment ? "default" : edge.visualRole;
      relation.nativeArrow = !edge.adornment;
      if (edge.adornment && edge.arrow) relation.arrowGeometry = literalArrowGeometry;
    }
    return layout;
  };
  const layoutOptions = {
    nodeFootprints: [nodeFootprints],
    relationFootprints: [relationFootprints],
    groupFootprints: [
      Object.fromEntries(scene.groups.map(({ id }) => [id, labelText.layouts[id]])),
    ],
    readingWidth: intrinsicReadingWidth,
    readingContext,
    minimumLabelSize: budget.minimum,
    readingViewport,
    placementViewport: framing.placementViewport,
    candidateFootprint: (layout) => framing.resolve(layout.bounds).viewport,
    candidateLowerBound: (layout) => ({
      apertureExpansion: nodeEnvelopeExpansion(layout, readingViewport),
    }),
    composeCandidate: (layout) =>
      routeIntrinsicGeometry(nativePaint(layout), {
        automatic: !Object.keys(contacts.ports).length,
      }),
    composePackedCandidate: (layout) => routePackedIntrinsicGeometry(nativePaint(layout)),
    validateCandidate: (layout) => auditIntrinsicGeometry(nativePaint(layout)),
  };
  const layoutIdentity = JSON.stringify([page, layoutOptions, inset, measuredLegend]);
  // Reuse identical measured inputs only in this composition; distinct footprints solve afresh.
  if (!measuredLayouts.has(layoutIdentity))
    measuredLayouts.set(layoutIdentity, layoutInteractivePages([page], null, layoutOptions));
  const laidOut = structuredClone(await measuredLayouts.get(layoutIdentity));
  const layout = laidOut.layouts[0];
  const frame = framing.resolve(layout.bounds);
  const byNode = new Map(layout.nodes.map((node) => [node.id, node]));
  const byEdge = new Map(layout.relations.map((edge) => [edge.id, edge]));
  const nodeAt = (id) => byNode.get(id);
  const contactPoints = new Map();
  for (const [endpoint, port] of contacts.endpoints) {
    const separator = endpoint.lastIndexOf(":");
    const edge = byEdge.get(endpoint.slice(0, separator));
    if (!edge) continue;
    const point = endpoint.slice(separator + 1) === "from" ? edge.points[0] : edge.points.at(-1);
    const prior = contactPoints.get(port);
    if (prior && (prior.x !== point.x || prior.y !== point.y))
      fail("render_intrinsic_contact_infeasible");
    contactPoints.set(port, point);
  }
  for (const edge of bridges) {
    const node = nodeAt(edge.from);
    const ports = contacts.ports[edge.from];
    const source = ports.find(({ id }) => id === contacts.endpoints.get(`${edge.id}:from`));
    const target = ports.find(({ id }) => id === contacts.endpoints.get(`${edge.id}:to`));
    byEdge.set(edge.id, {
      id: edge.id,
      points: [source, target].map((port) => {
        if (!contactPoints.has(port.id))
          contactPoints.set(port.id, { x: node.x + port.x, y: node.y + port.y });
        return contactPoints.get(port.id);
      }),
    });
  }
  const translateLabel = (plan) => ({
    ...plan,
    x: plan.x + inset,
    y: plan.y + inset,
    baselines: plan.baselines.map((line) => ({
      ...line,
      x: line.x + inset,
      baseline: line.baseline + inset,
      box: { ...line.box, x: line.box.x + inset, y: line.box.y + inset },
    })),
    paintBox: { ...plan.paintBox, x: plan.paintBox.x + inset, y: plan.paintBox.y + inset },
  });
  const physical = {
    legend: frame.legend,
    edges: Object.fromEntries(
      [...byEdge].map(([id, edge]) => [
        id,
        {
          points: edge.points.map(({ x, y }) => ({ x: x + inset, y: y + inset })),
          label: (() => {
            const allocation = edgeAllocations.get(id)?.allocations.find((item) => item.id === id);
            return allocation && edge.label
              ? placeMeasuredLabel(
                  allocation.plan,
                  edge.label.x + allocation.x + inset,
                  edge.label.y + allocation.y + inset,
                )
              : null;
          })(),
        },
      ]),
    ),
    groups: layout.groups.map((group) => ({
      ...group,
      x: group.x + inset,
      y: group.y + inset,
      label: translateLabel(group.label),
    })),
    texts: Object.fromEntries(
      (scene.texts ?? []).map((text) => {
        if (edges.has(text.owner)) {
          const slot = byEdge.get(text.owner)?.label;
          const allocation = edgeAllocations
            .get(text.owner)
            ?.allocations.find(({ id }) => id === text.id);
          if (!slot || !allocation) fail("render_intrinsic_text_allocation_infeasible");
          return [
            text.id,
            placeMeasuredLabel(
              allocation.plan,
              slot.x + allocation.x + inset,
              slot.y + allocation.y + inset,
            ),
          ];
        }
        if (nodes.has(text.owner)) {
          const layout = measured.layouts[text.owner];
          const rows = layout?.rows.filter(
            ({ occurrence, painted }) => occurrence === text.id && painted,
          );
          if (!rows?.length) fail("render_intrinsic_text_allocation_infeasible");
          const node = nodeAt(text.owner);
          const plan = {
            lines: rows.map(({ text }) => text),
            width: node.width,
            height: node.height,
            fontSize: rows[0].fontSize,
            weight: text.weight,
            family: textFamilies.get(text.id) ?? layout.family,
            baselines: rows.map(({ y, ...row }) => ({ ...row, baseline: y })),
          };
          return [text.id, placeMeasuredLabel(plan, node.x + inset, node.y + inset)];
        }
        const allocated = byNode.get(`archpub:text:${text.id}`)?.label;
        if (!allocated) fail("render_intrinsic_text_allocation_infeasible");
        return [text.id, translateLabel(allocated)];
      }),
    ),
  };
  const portSide = (point, box) => {
    const sides = [
      ["left", Math.abs(point.x - box.x)],
      ["right", Math.abs(point.x - box.x - box.width)],
      ["top", Math.abs(point.y - box.y)],
      ["bottom", Math.abs(point.y - box.y - box.height)],
    ];
    return sides.sort((a, b) => a[1] - b[1])[0][0];
  };
  const resolved = {
    ...scene,
    viewport: frame.viewport,
    nodes: scene.nodes.map((node) => ({
      ...node,
      ...(primitiveAllocations.has(node.id)
        ? { primitives: primitiveAllocations.get(node.id) }
        : {}),
      position: { x: nodeAt(node.id).x + inset, y: nodeAt(node.id).y + inset },
      size: { width: nodeAt(node.id).width, height: nodeAt(node.id).height },
    })),
    groups: scene.groups.map((group) => ({ ...group, padding: 24 })),
    edges: scene.edges.map((edge) => {
      const laid = byEdge.get(edge.id);
      if (edge.adornment)
        return {
          ...edge,
          points: physical.edges[edge.id].points,
          arrowGeometry: literalArrowGeometry,
        };
      return {
        ...edge,
        fromSide: portSide(laid.points[0], nodeAt(edge.from)),
        toSide: portSide(laid.points.at(-1), nodeAt(edge.to)),
        route: "auto",
      };
    }),
    ...(scene.texts
      ? {
          texts: scene.texts.map((text) => {
            const plan = physical.texts[text.id];
            const row = plan.baselines[0];
            return {
              ...text,
              fontSize: budget.minimum,
              x: row.x,
              baseline: row.baseline,
              box: plan.paintBox,
              ...(textFamilies.get(text.id) ? { family: textFamilies.get(text.id) } : {}),
            };
          }),
        }
      : {}),
  };
  if (readingContext !== "source" && resolved.viewport.width > intrinsicReadingWidth)
    fail("render_intrinsic_readability_infeasible");
  return {
    scene: validateInteractiveArchitectureScene(resolved),
    nodeText: {
      ...measured,
      sizes: Object.fromEntries(
        scene.nodes.map(({ id }) => [id, { width: nodeAt(id).width, height: nodeAt(id).height }]),
      ),
    },
    physical,
    compositionCost: layout.compositionCost,
    compositionDisruption: layout.compositionDisruption,
    supplies: [
      { id: "intrinsic-layout", sha256: laidOut.supplySha256 },
      ...(layout.nativeRoutingSupply ? [layout.nativeRoutingSupply] : []),
      ...measuredLegend.supplies,
    ],
  };
}

/** Measurement and topology jointly select the private composition, without altering meaning. */
export async function composeIntrinsicArchitecture(
  scene,
  selectedFonts = null,
  exploration = undefined,
  readingContext = "overview",
) {
  const input = validateInteractiveArchitectureInput(structuredClone(scene));
  const fonts = selectedFonts ?? (await loadBundledFonts());
  let lastFailure;
  const candidates = [];
  const measuredLayouts = new Map();
  for (const sizing of [
    { nodeWidth: intrinsicReadingWidth - marks.graphInset * 2, labelWidth: 240 },
    { nodeWidth: 280, labelWidth: 240 },
    { nodeWidth: 224, labelWidth: 152 },
    { nodeWidth: 176, labelWidth: 96 },
  ]) {
    try {
      candidates.push(
        await composeArchitectureCandidate(
          input,
          fonts,
          exploration,
          { ...sizing, readingContext },
          measuredLayouts,
        ),
      );
    } catch (error) {
      if (
        ![
          "render_interactive_layout_infeasible",
          "render_intrinsic_readability_infeasible",
          "render_node_text_infeasible",
          "authored_route_paint_geometry_invalid",
        ].includes(error.code)
      )
        throw error;
      lastFailure = error;
    }
  }
  const measured = candidates.map((candidate) => ({
    candidate,
    readingDistances: architectureReadingDistances(input, candidate),
  }));
  const minimumDistances = new Map();
  for (const { readingDistances } of measured)
    for (const [key, extent] of readingDistances)
      minimumDistances.set(key, Math.min(minimumDistances.get(key) ?? Infinity, extent));
  for (const entry of measured)
    entry.textDisruption = Math.max(
      0,
      ...[...entry.readingDistances].map(([key, extent]) => {
        const baseline = minimumDistances.get(key);
        return (extent - baseline) / Math.max(1, baseline);
      }),
    );
  // Evaluate the complete reading burden: aperture expansion cannot hide fractured phrases.
  const apertureExpansion = ({ candidate }) =>
    readingApertureExpansion(candidate.scene.viewport, readingViewport);
  measured.sort(
    (left, right) =>
      left.candidate.compositionDisruption - right.candidate.compositionDisruption ||
      apertureExpansion(left) - apertureExpansion(right) ||
      (!input.edges.length &&
        new Set(left.candidate.scene.nodes.map(({ position }) => position.y)).size -
          new Set(right.candidate.scene.nodes.map(({ position }) => position.y)).size) ||
      left.candidate.compositionCost * (1 + left.textDisruption) -
        right.candidate.compositionCost * (1 + right.textDisruption),
  );
  if (measured.length) return measured[0].candidate;
  throw lastFailure;
}
