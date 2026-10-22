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
} from "./edition-geometry.mjs";
import { number } from "./edition-text.mjs";

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
    const labelLines = wrap(node.label, nodeWidth - 28, 16, 2);
    const kindLines = node.kind === null ? [] : wrap(node.kind, nodeWidth - 51, 10, 1);
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
    if (kindLines.length)
      graph.push(
        `<text x="${number(x + 35)}" y="${number(nodeY + 22)}" fill="#6a776d" font-size="10" font-weight="600">${escape(kindLines[0])}</text>`,
      );
    const baseline = nodeY + nodeHeight / 2 + (labelLines.length === 1 ? 7 : -1);
    for (const [index, label] of labelLines.entries())
      graph.push(
        `<text x="${number(x + 16)}" y="${number(baseline + index * 21)}" fill="#21332a" font-size="16" font-weight="600">${escape(label)}</text>`,
      );
    graph.push("</g>");
  }

  return { graph, labels, nodeCarriers, relationCarriers };
}
