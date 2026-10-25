import { fail } from "../../src/protocol/values.mjs";
import {
  resolvePrimitiveNodes,
  resolvePrimitivePaint,
  assertPrimitiveContrast,
} from "../../src/scene/primitives.mjs";
import { validateAuthoredRouteGeometry } from "../../src/scene/routes.mjs";
import { renderPrimitives } from "../svg/primitives.mjs";
import { renderLiteralSegment } from "../svg/segments.mjs";
import { renderFigureIcon, validateResolvedFigureIcons } from "../icons/index.mjs";
import { figureIconLicenseMetadata } from "../svg/figure-types.mjs";
import { createBundledTextMeasurer, verifyAuthoredCanvasTextBoxes } from "../resvg/measurement.mjs";
import { measureArchitectureLabels, renderMeasuredNodeText } from "../archify/node-text.mjs";
import { assertArchitectureTextLayout, measureArchitectureTypography } from "./text.mjs";
import {
  architectureStartMarker,
  assertArchitecturePaintLayout,
  assertArchitectureRelationLayout,
} from "./paint.mjs";
import { nativeRelationTraversals } from "./semantics.mjs";
import {
  alignedLegendFootprint,
  architectureExploration,
  measureArchitectureLegend,
} from "../archify/legend.mjs";
import { createRouter } from "../archify/supply/renderers/architecture/routing.mjs";
import {
  placeAutomaticLabels,
  reservedLabelRect,
} from "../archify/supply/renderers/architecture/labels.mjs";
import { arrowClassMap, edgeLabelAccent } from "../archify/supply/renderers/shared/geometry.mjs";
import {
  focusNodeAttrs,
  focusNodeTitle,
  focusEdgeAttrs,
  svgAccessibleText,
  svgRootAttrs,
} from "../archify/supply/renderers/shared/cli.mjs";
import {
  esc,
  renderDefinitions,
  renderSemanticSigil,
} from "../archify/supply/renderers/shared/utils.mjs";

const tones = new Map([
  ["paper", "var(--bg)"],
  ["ink", "var(--text)"],
  ["muted", "var(--text-muted)"],
]);
const pathData = (points) =>
  points.map(({ x, y }, index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
const moveLabel = (plan, x, y) => ({
  ...plan,
  x,
  y,
  baselines: plan.baselines.map((row) => ({
    ...row,
    x: row.x + x,
    baseline: row.baseline + y,
    box: { ...row.box, x: row.box.x + x, y: row.box.y + y },
  })),
});

function paintLabel(plan, attributes = "", tone = "t-primary") {
  if (plan.baselines.length === 1) {
    const { text: source, paintText = source, x, baseline } = plan.baselines[0];
    return `<text ${attributes} class="${tone}" x="${x}" y="${baseline}" font-family="${esc(JSON.stringify(plan.family))}" font-size="${plan.fontSize}" font-weight="${plan.weight}" text-anchor="middle" xml:space="preserve">${esc(paintText)}</text>`;
  }
  const rows = plan.baselines
    .map(
      ({ text, paintText = text, x, baseline }) =>
        `<tspan x="${x}" y="${baseline}">${esc(paintText)}</tspan>`,
    )
    .join("");
  return `<text ${attributes} class="${tone}" font-family="${esc(JSON.stringify(plan.family))}" font-size="${plan.fontSize}" font-weight="${plan.weight}" text-anchor="middle" xml:space="preserve">${rows}</text>`;
}

/** Consume checked geometry; official Archify helpers supply the native reading protocol. */
export async function renderArchitectureSvg(
  scene,
  {
    fonts,
    icons,
    exploration,
    physical = null,
    nodeText: measured = null,
    interaction = "native",
    readingContext = "overview",
  },
) {
  if (!["native", "presentation"].includes(interaction)) fail("render_scene_interaction_invalid");
  const interactive = interaction === "native";
  const nodes = resolvePrimitiveNodes(scene.nodes, "interactive");
  validateAuthoredRouteGeometry(scene, "interactive");
  assertPrimitiveContrast(
    nodes,
    (name) => {
      if (!tones.has(name)) fail("render_scene_primitive_tone_unsupported");
      return tones.get(name);
    },
    tones.get("paper"),
  );
  const typed = nodes.filter(
    (node) => !node.primitives && (exploration !== undefined || node.icon?.startsWith("lucide:")),
  );
  validateResolvedFigureIcons([{ nodes: typed }], icons);
  const text = await measureArchitectureTypography(scene, fonts, measured, readingContext);
  const budget = text.budget;
  const minimum = budget.minimum;
  const components = new Map(
    nodes.map((node) => [
      node.id,
      {
        id: node.id,
        ...node.position,
        ...node.size,
        cx: node.position.x + node.size.width / 2,
        cy: node.position.y + node.size.height / 2,
      },
    ]),
  );
  const connections = scene.edges
    .filter((edge) => !edge.adornment)
    .map((edge) => ({
      ...edge,
      variant: edge.visualRole,
      ...(edge.waypoints ? { via: edge.waypoints.map(({ x, y }) => [x, y]) } : {}),
    }));
  const labelRequests = connections
    .filter(({ label }) => label)
    .map(({ id, label }) => ({ id, text: label }));
  const measuredLabels = physical
    ? null
    : await measureArchitectureLabels(labelRequests, budget, fonts, createBundledTextMeasurer);
  const initialLabel = (connection, points) => {
    const plan = measuredLabels.layouts[connection.id];
    const index = Math.max(0, Math.floor((points.length - 1) / 2));
    const start = points[index],
      end = points[index + 1];
    const x = (start[0] + end[0]) / 2 - plan.width / 2;
    const y = (start[1] + end[1]) / 2 - plan.height / 2 - 8;
    return {
      relation: connection,
      id: connection.id,
      x,
      y,
      lx: x + plan.width / 2,
      ly: y + 10,
      width: plan.width,
      height: plan.height,
    };
  };
  const groups = (
    physical?.groups ??
    scene.groups.map((group) => {
      const members = group.nodeIds.map((id) => components.get(id));
      const x = Math.min(...members.map(({ x }) => x)) - group.padding;
      const y = Math.min(...members.map(({ y }) => y)) - group.padding;
      return {
        x,
        y,
        width: Math.max(...members.map((node) => node.x + node.width)) + group.padding - x,
        height: Math.max(...members.map((node) => node.y + node.height)) + group.padding - y,
      };
    })
  ).map((group) => ({ ...group, radius: 10 }));
  const router = createRouter(components, connections, {
    frames: groups,
    distinctAutomaticPorts: true,
    preferReadableRoutes: true,
    labelRectFor: (connection, points, { routes, labels }) =>
      !physical && connection.label
        ? reservedLabelRect({
            label: initialLabel(connection, points),
            points,
            routes: routes.map((points, relationIndex) => ({ points, relationIndex })),
            labels,
            components: [...components.values()],
            viewBox: [scene.viewport.width, scene.viewport.height],
          })
        : null,
  });
  const geometries = new Map(
    scene.edges.map((edge) => [
      edge.id,
      physical?.edges[edge.id]?.points ??
        edge.points ??
        router
          .pathFor(connections.find(({ id }) => id === edge.id))
          .points.map(([x, y]) => ({ x, y })),
    ]),
  );
  const automaticLabels = physical
    ? []
    : placeAutomaticLabels({
        labels: connections.flatMap((connection, relationIndex) =>
          connection.label
            ? [
                {
                  ...initialLabel(
                    connection,
                    geometries.get(connection.id).map(({ x, y }) => [x, y]),
                  ),
                  relationIndex,
                },
              ]
            : [],
        ),
        routes: scene.edges.map((edge, relationIndex) => ({
          relationIndex: edge.adornment
            ? connections.length + relationIndex
            : connections.findIndex(({ id }) => id === edge.id),
          points: geometries.get(edge.id).map(({ x, y }) => [x, y]),
        })),
        components: [...components.values()],
        titles: (scene.texts ?? []).filter(({ visible }) => visible).map(({ box }) => box),
        viewBox: [scene.viewport.width, scene.viewport.height],
        keepFallbackNearRoute: true,
      });
  const placements = new Map(automaticLabels.map((label) => [label.id, label]));
  const relationLabels = new Map(
    connections
      .filter(({ label }) => label)
      .map((edge) => {
        const plan =
          physical?.edges[edge.id]?.label ??
          moveLabel(
            measuredLabels.layouts[edge.id],
            placements.get(edge.id).x,
            placements.get(edge.id).y,
          );
        return [edge.id, plan];
      }),
  );
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const groupContext = new Map(
    scene.groups.flatMap(({ label, nodeIds }) => nodeIds.map((id) => [id, label])),
  );
  const graph = architectureExploration(scene, exploration);
  const traversals = nativeRelationTraversals(graph.relations, graph.nodes);
  const bidirectional = new Set(
    graph.relations
      .filter(({ direction }) => direction === "bidirectional")
      .map(({ edgeId }) => edgeId),
  );
  const routeStarts = new Map();
  for (const relation of graph.relations) {
    if (relation.direction !== "bidirectional" || !relation.routeId) continue;
    const route = scene.routes.find(({ id }) => id === relation.routeId);
    const first = route.traversals[0];
    routeStarts.set(`${first.edge}:${first.direction}`, first);
  }
  const glyph = (node, x, y, size) =>
    node.icon?.startsWith("lucide:")
      ? renderFigureIcon(node.icon, icons, { x, y, size })
      : renderSemanticSigil(node.figureKind ?? node.visualRole, { icon: node.icon, x, y, size });
  const nodePaint = nodes
    .map((node) => {
      const member = graph.nodes.find(({ id }) => id === node.id);
      const paint = node.primitives
        ? renderPrimitives(resolvePrimitivePaint(node, node.position).primitives, (name) =>
            tones.get(name),
          )
        : (() => {
            const layout = text.layouts[node.id];
            return `<rect x="${node.position.x}" y="${node.position.y}" width="${node.size.width}" height="${node.size.height}" rx="6" class="c-mask"/><rect x="${node.position.x}" y="${node.position.y}" width="${node.size.width}" height="${node.size.height}" rx="6" class="c-${node.visualRole}" stroke-width="1.5"/>${glyph(node, node.position.x + budget.sigilInset, node.position.y + layout.sigilY, layout.sigilSize)}${renderMeasuredNodeText(layout, components.get(node.id), "t-muted", esc)}`;
          })();
      if (node.adornment) return paint;
      const label = graph.limits.length
        ? (node.label ?? node.id)
        : (member?.label ?? node.label ?? node.id);
      const passport = {
        kind: member?.kind ?? node.figureKind ?? node.visualRole,
        sublabel: node.detail,
        tag: node.note,
        context: groupContext.get(node.id),
      };
      return interactive
        ? `<g ${focusNodeAttrs(node.id, label, passport, "en")} data-inspect-id="${esc(node.id)}" data-inspect-label="${esc(label)}">${focusNodeTitle(label, passport)}${paint}</g>`
        : `<g data-graphic-id="${esc(node.id)}">${paint}</g>`;
    })
    .join("\n");
  const edgePaint = scene.edges.map((edge) => {
    const points = geometries.get(edge.id);
    const [nativeClass, marker] = arrowClassMap[edge.visualRole] ?? arrowClassMap.default;
    const strokeWidth = edge.strokeWidth ?? (edge.visualRole === "emphasis" ? 1.8 : 1.5);
    const bound = scene.routes?.some((route) =>
      route.traversals.some((part) => part.edge === edge.id),
    );
    const automatic = physical?.edges[edge.id] !== undefined;
    const attrs = `data-composition-points="${points.map(({ x, y }) => `${x},${y}`).join(";")}"${bound || !edge.adornment ? ` data-edge-id="${esc(edge.id)}"` : ' aria-hidden="true"'}${automatic ? ' data-composition-crossover="halo" data-composition-independent="true"' : ""}`;
    const painted = edge.adornment
      ? renderLiteralSegment(
          { ...edge, points },
          attrs,
          tones.get(edge.strokeTone),
          `literal-arrow-${edge.id}`,
        )
      : `<path ${attrs} data-composition-edge-from="${esc(edge.from)}" data-composition-edge-to="${esc(edge.to)}" d="${pathData(points)}" class="${nativeClass}" stroke-width="${strokeWidth}"${bidirectional.has(edge.id) ? ` marker-start="url(#${marker}-start)"` : ""} marker-end="url(#${marker})"/>`;
    const underlay = automatic
      ? `<path data-graph-role="automatic-crossover-underlay"${edge.adornment ? ` data-intrinsic-segment-underlay="${esc(edge.id)}"` : ""} d="${pathData(points)}" fill="none" stroke="var(--mask)" stroke-width="${strokeWidth + 4}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`
      : "";
    return {
      after: edge.from === edge.to,
      paint: automatic
        ? `<g data-graph-role="automatic-crossover">${underlay}${painted}</g>`
        : painted,
    };
  });
  const logical = traversals
    .map((relation) => {
      const route = relation.routeId
        ? scene.routes.find(({ id }) => id === relation.routeId)
        : null;
      const points = route
        ? route.traversals.flatMap((part, index) => {
            const original = geometries.get(part.edge);
            const ordered = part.direction === "reverse" ? original.slice().reverse() : original;
            return index ? ordered.slice(1) : ordered;
          })
        : geometries.get(relation.edgeId);
      const identity = interactive
        ? `${focusEdgeAttrs(relation.from, relation.to, relation.label, relation.key, relation.id)} aria-hidden="true"`
        : `data-graphic-id="${esc(relation.id)}"`;
      return `<path ${identity} d="${pathData(relation.reverse ? points.slice().reverse() : points)}" fill="none" stroke="none" pointer-events="none" data-logical-relation="true"/>`;
    })
    .join("\n");
  const labels = [...relationLabels]
    .map(
      ([id, plan]) =>
        `<g data-detail="context" data-edge-id="${esc(id)}" data-intrinsic-relation-label="${esc(id)}">${plan.baselines.map(({ box }) => `<rect data-intrinsic-label-ink="" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="1" class="c-mask"/>`).join("")}${paintLabel(plan, "", edgeLabelAccent(scene.edges.find((edge) => edge.id === id).visualRole))}</g>`,
    )
    .join("\n");
  const visibleTexts = (scene.texts ?? []).filter(({ visible }) => visible);
  const checkedTexts = physical
    ? visibleTexts.flatMap((label) =>
        physical.texts[label.id].baselines.map((row) => ({
          ...label,
          text: row.paintText ?? row.text,
          x: row.x,
          baseline: row.baseline,
          box: row.box,
          fontSize: physical.texts[label.id].fontSize,
          anchor: "middle",
        })),
      )
    : visibleTexts;
  const verifiedText = await verifyAuthoredCanvasTextBoxes({ texts: checkedTexts }, fonts);
  const textPaint = visibleTexts
    .map((label) => {
      if (!["ink", "muted"].includes(label.tone)) fail("render_scene_text_tone_unsupported");
      const identity =
        interactive && label.semanticIds.length
          ? `data-text-id="${esc(label.id)}" data-text-label="${esc(label.text)}" role="button" tabindex="0" aria-label="Inspect ${esc(label.text)}"`
          : `data-graphic-id="text:${esc(label.id)}"`;
      return physical
        ? paintLabel(
            physical.texts[label.id],
            `${identity} data-intrinsic-text="${esc(label.id)}"`,
            label.tone === "ink" ? "t-primary" : "t-muted",
          )
        : `<text ${identity} x="${label.x}" y="${label.baseline}" font-family="${esc(JSON.stringify(label.family ?? verifiedText.defaultFamily))}" font-size="${label.fontSize}" font-weight="${label.weight}" text-anchor="${label.anchor}" xml:space="preserve" class="${label.tone === "ink" ? "t-primary" : "t-muted"}">${esc(label.text)}</text>`;
    })
    .join("\n");
  const groupLabels = physical
    ? null
    : await measureArchitectureLabels(
        scene.groups.map((group, index) => ({ id: String(index), text: group.label })),
        budget,
        fonts,
        createBundledTextMeasurer,
      );
  const frames = groups
    .map(
      (group, index) =>
        `<rect data-graphic-id="${esc(scene.groups[index].id)}" data-inspect-label="${esc(scene.groups[index].label)}" data-group-id="${esc(scene.groups[index].id)}" data-graph-role="structural-frame" data-composition-frame-id="${index}" data-composition-frame-kind="region" x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" rx="${group.radius}" class="c-cloud" fill-opacity=".12" stroke-width="1"/>`,
    )
    .join("\n");
  const frameTitles = groups
    .map((group, index) => {
      const label = group.label?.baselines
        ? group.label
        : moveLabel(groupLabels.layouts[String(index)], group.x + 12, group.y - budget.minimum / 2);
      return `<g data-graph-role="structural-frame-label" data-composition-frame-id="${index}">${paintLabel(label, 'data-boundary-label=""', "t-muted")}</g>`;
    })
    .join("\n");
  const boundaryRows = groups.flatMap((group, index) =>
    (group.label?.baselines ?? groupLabels?.layouts[String(index)]?.baselines ?? []).map(
      ({ box }) => box,
    ),
  );
  const labelRows = [...relationLabels.values()].flatMap((plan) =>
    plan.baselines.map(({ box }) => box),
  );
  const paths = [...geometries.values()];
  const sourceMarkers = [
    ...scene.edges
      .filter(({ id, adornment }) => !adornment && bidirectional.has(id))
      .map(({ id }) => ({ edge: id, direction: "forward" })),
    ...routeStarts.values(),
  ];
  assertArchitectureRelationLayout(scene, relationLabels, geometries, sourceMarkers);
  assertArchitecturePaintLayout(
    scene,
    nodes,
    [...boundaryRows, ...labelRows],
    paths,
    sourceMarkers,
    checkedTexts.map(({ box }) => box),
  );
  assertArchitectureTextLayout(scene, checkedTexts, text, boundaryRows, labelRows, paths);
  const legend = physical?.legend ?? (await measureArchitectureLegend(scene, budget, fonts, graph));
  const { spacing, title } = legend;
  const footprint =
    legend.footprint ??
    alignedLegendFootprint(legend.entries, {
      width: scene.viewport.width - 80,
      itemGap: spacing.columnGap,
      lineGap: spacing.rowAdvance,
    });
  const top =
    legend.top ??
    scene.viewport.height - spacing.bottomInset - spacing.height - footprint.extraHeight;
  const legendPaint = footprint.rows
    .map((row, index) => {
      let x = 40;
      const baseline = top + spacing.firstBaseline + index * spacing.rowAdvance;
      return row
        .map((entry) => {
          const node = byId.get(graph.nodes.find(({ kind }) => kind === entry.kind).id);
          const reading = interactive
            ? ` role="button" tabindex="0" aria-label="Inspect ${esc(entry.label)}"`
            : "";
          const painted = `<g data-legend-kind="${esc(entry.kind)}" data-legend-label="${esc(entry.label)}" data-legend-x="${x}" data-legend-baseline="${baseline}"${reading}><g>${glyph(node, x, baseline + entry.swatchY, entry.swatchWidth)}</g><text x="${x + entry.swatchWidth + entry.swatchGap + entry.labelInset}" y="${baseline}" font-family="${esc(JSON.stringify(entry.family))}" font-size="${minimum}" font-weight="${entry.weight}" class="t-primary">${esc(entry.label)}</text></g>`;
          x += entry.columnWidth + spacing.columnGap;
          return painted;
        })
        .join("");
    })
    .join("\n");
  const meta = {
    title: scene.title,
    subtitle: scene.subtitle,
    locale: "en",
    visual_preset: "editorial",
    quality_profile: "showcase",
  };
  const rootAttrs = `${
    interactive
      ? `${svgRootAttrs(meta).replace('role="img"', 'role="group"')} data-relationship-queries="${graph.limits.length ? "unavailable" : "complete"}"`
      : svgRootAttrs(meta)
  } data-reader-fit="${physical || scene.typography?.minimumTextPx ? "intrinsic-height" : "authored-height"}"`;
  const legendAttrs = interactive ? ' data-legend="" data-legend-bridge="true"' : ' data-legend=""';
  const startMarkers =
    bidirectional.size || routeStarts.size
      ? [
          ...new Set(
            scene.edges
              .filter(({ id }) => bidirectional.has(id))
              .map(({ visualRole }) => (arrowClassMap[visualRole] ?? arrowClassMap.default)[1])
              .concat(routeStarts.size ? ["arrowhead"] : []),
          ),
        ]
          .map(
            (marker) =>
              `<marker id="${marker}-start" markerWidth="${architectureStartMarker.width}" markerHeight="${architectureStartMarker.height}" refX="${architectureStartMarker.refX}" refY="${architectureStartMarker.refY}" orient="auto-start-reverse"><polygon points="0 0, ${architectureStartMarker.width} ${architectureStartMarker.refY}, 0 ${architectureStartMarker.height}" class="m-${marker === "arrowhead" ? "default" : marker.slice("arrowhead-".length)}"/></marker>`,
          )
          .join("")
      : "";
  const routeDirectionPaint = [...routeStarts.values()]
    .map(({ edge: id, direction }) => {
      const edge = scene.edges.find((edge) => edge.id === id);
      const points = geometries.get(id);
      const ordered = direction === "reverse" ? points.slice().reverse() : points;
      return `<path data-source-direction-marker="true" aria-hidden="true" d="${pathData(ordered.slice(0, 2))}" fill="none" stroke="none" stroke-width="${edge.strokeWidth}" marker-start="url(#arrowhead-start)" pointer-events="none"/>`;
    })
    .join("\n");
  const svg = `<svg viewBox="0 0 ${scene.viewport.width} ${scene.viewport.height}" ${rootAttrs} data-diagram-type="architecture" data-reader-min-text="${text.requestedMinimum}" data-reader-primary-text="${text.requestedPrimary}">${svgAccessibleText(meta, "architecture")}${renderDefinitions(startMarkers)}<rect width="100%" height="100%" fill="url(#grid)"/>${frames}${edgePaint
    .filter(({ after }) => !after)
    .map(({ paint }) => paint)
    .join("\n")}${nodePaint}${edgePaint
    .filter(({ after }) => after)
    .map(({ paint }) => paint)
    .join(
      "\n",
    )}${routeDirectionPaint}${labels}${frameTitles}${textPaint}${legendPaint ? `<g class="legend"${legendAttrs}><text x="${40 - title.box.x}" y="${top + spacing.titleBaseline}" font-family="${esc(JSON.stringify(title.family))}" font-size="${minimum}" font-weight="${title.weight}" class="t-primary">Legend</text>${legendPaint}</g>` : ""}${logical}</svg>`;
  const supplies = new Map(
    [
      ...text.supplies,
      verifiedText.supply,
      ...legend.supplies,
      ...(visibleTexts.length ? [{ id: "statement-fonts", sha256: fonts.sha256 }] : []),
    ].map((entry) => [entry.id, entry]),
  );
  return {
    svg: svg.replace("</svg>", `${figureIconLicenseMetadata(icons)}</svg>`),
    supplies: [...supplies.values()],
  };
}
