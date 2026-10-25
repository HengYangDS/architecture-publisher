import { fail } from "../../src/protocol/values.mjs";
import { renderFigureIcon } from "../icons/index.mjs";
import { escapeStaticText as escape, wrapStaticText as wrap } from "./text.mjs";
import { key } from "./edition-contract.mjs";
import {
  groupTitleBaseline,
  groupTitleLeading,
  groupTitleClearance,
  groupHeadingX,
  checkedRelationCaption,
  captionedGroupGraphic,
  checkedGroupHeading,
} from "./edition-geometry.mjs";
import { number } from "./edition-text.mjs";
import { claimQualifierText } from "../../src/scene/claim-card.mjs";

const nodePadding = 16;
const nodeLabelSize = 16;
const nodeKindSize = 10;
const nodeKindX = 35;
const nodeKindBaseline = 22;
const nodeLabelBaselineOffset = 7;
const nodeTextGap = 12;
const textRequest = (text, fontSize) => ({
  text,
  fontSize,
  weight: "600",
  anchor: "start",
  x: 0,
  baseline: 0,
});

/** Allocate sufficient equal peers from complete native ink before the solver runs. */
export async function measureStaticPeerCapacity(
  nodes,
  fontSupply,
  createTextMeasurer,
  extraRequests = [],
) {
  const requests = [
    ...extraRequests,
    ...nodes.flatMap((node) => [
      textRequest(node.label, nodeLabelSize),
      ...(node.kind === null ? [] : [textRequest(node.kind, nodeKindSize)]),
    ]),
  ];
  let textMeasurer = await createTextMeasurer(fontSupply, requests);
  let width = 96;
  let height = 64;
  for (const node of nodes) {
    const label = textMeasurer.box(textRequest(node.label, nodeLabelSize));
    width = Math.max(width, nodePadding + label.x + label.width + nodePadding);
    height = Math.max(height, 2 * (nodeLabelBaselineOffset + label.y + label.height + nodePadding));
    if (node.kind !== null) {
      const kind = textMeasurer.box(textRequest(node.kind, nodeKindSize));
      width = Math.max(width, nodeKindX + kind.x + kind.width + nodePadding);
      const typeBottom = Math.max(23, nodeKindBaseline + kind.y + kind.height);
      height = Math.max(height, 2 * (typeBottom + nodeTextGap - nodeLabelBaselineOffset - label.y));
    }
  }
  const nodeText = new Map();
  if (nodes.some((node) => node.qualifiers && Object.keys(node.qualifiers).length)) {
    width = Math.ceil(Math.max(256, width) / 4) * 4;
    const bodies = nodes.map((node) =>
      node.qualifiers && Object.keys(node.qualifiers).length
        ? wrap(claimQualifierText(node.qualifiers), width - 2 * nodePadding, 12)
        : [],
    );
    textMeasurer = await createTextMeasurer(fontSupply, [
      ...requests,
      ...bodies.flatMap((lines) => lines.map((line) => textRequest(line, 12))),
    ]);
    const labelBaseline = Math.ceil(
      Math.max(
        52,
        ...nodes.map((node) => {
          const label = textMeasurer.box(textRequest(node.label, nodeLabelSize));
          const typeBottom =
            node.kind === null
              ? 23
              : nodeKindBaseline +
                textMeasurer.box(textRequest(node.kind, nodeKindSize)).y +
                textMeasurer.box(textRequest(node.kind, nodeKindSize)).height;
          return typeBottom + nodeTextGap - label.y;
        }),
      ),
    );
    const bodyRows = bodies.flat();
    const bodyTop = Math.max(
      ...nodes.map((node) => {
        const ink = textMeasurer.box(textRequest(node.label, nodeLabelSize));
        return labelBaseline + ink.y + ink.height + nodeTextGap;
      }),
    );
    const bodyBaseline = Math.ceil(
      bodyTop - Math.min(...bodyRows.map((line) => textMeasurer.box(textRequest(line, 12)).y)),
    );
    const leading = Math.ceil(
      Math.max(18, ...bodyRows.map((line) => textMeasurer.box(textRequest(line, 12)).height + 6)),
    );
    for (const [index, node] of nodes.entries()) {
      const rows = [
        ...(node.kind === null
          ? []
          : [
              { text: node.kind, fontSize: nodeKindSize, x: nodeKindX, baseline: nodeKindBaseline },
            ]),
        { text: node.label, fontSize: nodeLabelSize, x: nodePadding, baseline: labelBaseline },
        ...bodies[index].map((text, row) => ({
          text,
          fontSize: 12,
          x: nodePadding,
          baseline: bodyBaseline + row * leading,
        })),
      ];
      const baselines = rows.map((row) => ({
        ...row,
        weight: "600",
        box: textMeasurer.box({
          ...textRequest(row.text, row.fontSize),
          x: row.x,
          baseline: row.baseline,
        }),
      }));
      for (const { box } of baselines) {
        width = Math.max(width, box.x + box.width + nodePadding);
        height = Math.max(height, box.y + box.height + nodePadding);
      }
      nodeText.set(node.id, { body: bodies[index], baselines });
    }
  }
  return {
    nodeSize: { width: Math.ceil(width / 4) * 4, height: Math.ceil(height / 4) * 4 },
    textMeasurer,
    nodeText,
  };
}

function checkedNodeReading(node, measure) {
  const { body, baselines } = node.textLayout;
  const content =
    node.qualifiers && Object.keys(node.qualifiers).length
      ? claimQualifierText(node.qualifiers)
      : "";
  if (
    !measure ||
    !Array.isArray(body) ||
    !Array.isArray(baselines) ||
    body.some((line) => typeof line !== "string" || !line.trim()) ||
    body.join("") !== content
  )
    fail("static_edition_node_unrepresentable");
  const expected = [...(node.kind === null ? [] : [node.kind]), node.label, ...body];
  if (baselines.length !== expected.length) fail("static_edition_node_unrepresentable");
  let bottom = 0;
  for (const [index, row] of baselines.entries()) {
    const isKind = node.kind !== null && index === 0;
    const isLabel = index === (node.kind === null ? 0 : 1);
    const size = isKind ? nodeKindSize : isLabel ? nodeLabelSize : 12;
    if (
      !row ||
      row.text !== expected[index] ||
      row.fontSize !== size ||
      row.weight !== "600" ||
      row.x !== (isKind ? nodeKindX : nodePadding) ||
      !Number.isFinite(row.baseline)
    )
      fail("static_edition_node_unrepresentable");
    const ink = measure.box({ ...textRequest(row.text, size), x: row.x, baseline: row.baseline });
    if (
      ink.x < nodePadding ||
      ink.x + ink.width > node.width - nodePadding ||
      ink.y < Math.max(12, bottom + (index ? 6 : 0)) ||
      ink.y + ink.height > node.height - nodePadding
    )
      fail("static_edition_node_unrepresentable");
    bottom = ink.y + ink.height;
  }
  return baselines;
}

export function composeStaticEditionStructure(scene, idPrefix, options) {
  const graph = [];
  const labels = new Map(scene.nodes.map((node) => [key(node), node.label]));
  const nodeCarriers = [];
  const relationCarriers = scene.edges
    .flatMap(({ relations }) => relations)
    .map((relation, index) => ({
      graphicId: `${idPrefix}r-${index}`,
      source: {
        namespace: relation.namespace,
        reference: relation.reference,
        sha256: relation.sha256,
      },
    }));
  for (const group of scene.groups ?? []) {
    if (scene.groupPresentation === "key") continue;
    if (scene.groupPresentation === "captions") {
      graph.push(captionedGroupGraphic(group));
      continue;
    }
    if (group.heading) {
      const heading = checkedGroupHeading(group, scene.nodes, scene.edges, options.textMeasurer);
      graph.push(
        `<rect x="${number(group.x)}" y="${number(group.y)}" width="${number(group.width)}" height="${number(group.height)}" rx="18" fill="#eef0e9"/>`,
      );
      for (const line of heading)
        graph.push(
          `<text x="${number(line.x)}" y="${number(line.baseline)}" fill="#526158" font-size="14" font-weight="600">${escape(line.text)}</text>`,
        );
      continue;
    }
    const lines = wrap(group.label, group.width - 52, 14, 2);
    const headerBottom =
      group.y + groupTitleBaseline + (lines.length - 1) * groupTitleLeading + groupTitleClearance;
    if (
      headerBottom >= group.y + group.height ||
      scene.nodes.some(
        (node) =>
          node.x < group.x + group.width &&
          node.x + node.width > group.x &&
          node.y < headerBottom &&
          node.y + node.height > group.y,
      )
    )
      fail("static_edition_group_heading_collision");
    const headingX = groupHeadingX(group, lines, scene.edges);
    graph.push(
      `<rect x="${number(group.x)}" y="${number(group.y)}" width="${number(group.width)}" height="${number(group.height)}" rx="18" fill="#eef0e9"/>`,
    );
    for (const [index, line] of lines.entries())
      graph.push(
        `<text x="${number(headingX)}" y="${number(group.y + groupTitleBaseline + index * groupTitleLeading)}" fill="#526158" font-size="14" font-weight="600">${escape(line)}</text>`,
      );
  }
  let relationOffset = 0;
  for (const edge of scene.edges) {
    if (!labels.has(key(edge.from)) || !labels.has(key(edge.to)))
      fail("static_edition_relation_endpoint_missing");
    const caption = checkedRelationCaption(edge);
    const directions = new Set(edge.relations.map(({ direction }) => direction));
    if (directions.size !== 1 || !["forward", "bidirectional"].includes([...directions][0]))
      fail("static_edition_direction_unrepresentable");
    const points = edge.points.map(([x, y]) => `${number(x)} ${number(y)}`);
    const start = directions.has("bidirectional")
      ? ` marker-start="url(#${idPrefix}source-arrow)"`
      : "";
    const carrierOnGraph = caption && edge.relations[0].label === null;
    if (carrierOnGraph)
      graph.push(`<g data-graphic-id="${relationCarriers[relationOffset].graphicId}">`);
    graph.push(
      `<path d="M ${points.join(" L ")}" fill="none" stroke="#60786a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"${start} marker-end="url(#${idPrefix}source-arrow)"/>`,
    );
    if (caption)
      graph.push(
        `<text x="${number(caption.point[0])}" y="${number(caption.point[1])}" text-anchor="middle" fill="#526158" font-size="14" font-weight="600">${escape(caption.text)}</text>`,
      );
    if (carrierOnGraph) graph.push("</g>");
    relationOffset += edge.relations.length;
  }
  for (const [position, node] of scene.nodes.entries()) {
    const x = number(node.x);
    const nodeY = number(node.y);
    const nodeWidth = number(node.width);
    const nodeHeight = number(node.height);
    if (nodeWidth < 96 || nodeHeight < 64) fail("static_edition_node_unrepresentable");
    const measured = options.textMeasurer;
    const labelLines = measured ? [node.label] : wrap(node.label, nodeWidth - 28, nodeLabelSize, 2);
    const kindLines =
      node.kind === null
        ? []
        : measured
          ? [node.kind]
          : wrap(node.kind, nodeWidth - 51, nodeKindSize, 1);
    const reading = node.textLayout ? checkedNodeReading(node, measured) : null;
    if (measured && !reading) {
      const label = measured.box(textRequest(node.label, nodeLabelSize));
      const kind = node.kind === null ? null : measured.box(textRequest(node.kind, nodeKindSize));
      const baseline = nodeHeight / 2 + nodeLabelBaselineOffset;
      if (
        nodePadding + label.x < 0 ||
        nodePadding + label.x + label.width > nodeWidth - nodePadding ||
        baseline + label.y <
          (kind ? nodeKindBaseline + kind.y + kind.height + nodeTextGap : nodePadding) ||
        baseline + label.y + label.height > nodeHeight - nodePadding ||
        (kind && nodeKindX + kind.x + kind.width > nodeWidth - nodePadding)
      )
        fail("static_edition_node_unrepresentable");
    }
    if (labelLines.length > 1 && nodeHeight < 86) fail("static_edition_node_unrepresentable");
    const graphicId = `${idPrefix}n-${position}`;
    nodeCarriers.push({
      graphicId,
      source: { namespace: node.namespace, id: node.id, sha256: node.sha256 },
    });
    graph.push(
      `<g data-graphic-id="${graphicId}" color="#6a776d">`,
      `<rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="${nodeHeight}" rx="12" fill="#fffefa" stroke="#84978a" stroke-width="1.6"/>`,
      renderFigureIcon(node.icon, options.icons, { x: x + 16, y: nodeY + 12, size: 11 }),
    );
    if (reading) {
      for (const row of reading)
        graph.push(
          `<text x="${number(x + row.x)}" y="${number(nodeY + row.baseline)}" fill="${row.fontSize === nodeLabelSize ? "#21332a" : "#526158"}" font-size="${row.fontSize}" font-weight="600">${escape(row.text)}</text>`,
        );
    } else {
      if (kindLines.length)
        graph.push(
          `<text x="${number(x + nodeKindX)}" y="${number(nodeY + nodeKindBaseline)}" fill="#6a776d" font-size="${nodeKindSize}" font-weight="600">${escape(kindLines[0])}</text>`,
        );
      const baseline =
        nodeY + nodeHeight / 2 + (labelLines.length === 1 ? nodeLabelBaselineOffset : -1);
      for (const [index, label] of labelLines.entries())
        graph.push(
          `<text x="${number(x + nodePadding)}" y="${number(baseline + index * 21)}" fill="#21332a" font-size="${nodeLabelSize}" font-weight="600">${escape(label)}</text>`,
        );
    }
    graph.push("</g>");
  }

  return { graph, labels, nodeCarriers, relationCarriers };
}
