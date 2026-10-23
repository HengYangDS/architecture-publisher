import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";

export const endpointEscape = Math.ceil(
  Math.max(marks.routeEndpointStub, marks.routeInteriorSegment) +
    marks.textClearance +
    marks.selectedRouteStroke / 2 +
    marks.selectedNodeStroke / 2,
);

export function placementLeaf(
  node,
  verticalEscape = endpointEscape,
  horizontalEscape = endpointEscape,
) {
  return {
    id: node.id,
    width: node.width + horizontalEscape * 2,
    height: node.height + verticalEscape * 2,
    layoutOptions: { "elk.alignment": "TOP" },
    labels: [
      {
        id: `${node.id}-label`,
        text: node.label.lines.join("\n"),
        width: node.label.width,
        height: node.label.height,
        x: horizontalEscape + (node.width - node.label.width) / 2,
        y: verticalEscape + (node.height - node.label.height) / 2,
      },
    ],
  };
}

export function packingOptions(readingWidth, spacing, padding) {
  return {
    "elk.algorithm": "rectpacking",
    "elk.hierarchyHandling": "SEPARATE_CHILDREN",
    "elk.rectpacking.widthApproximation.strategy": "TARGET_WIDTH",
    "elk.rectpacking.widthApproximation.targetWidth": String(readingWidth),
    "elk.rectpacking.orderBySize": "false",
    "elk.rectpacking.whiteSpaceElimination.strategy": "NONE",
    "elk.spacing.nodeNode": String(spacing),
    "elk.padding": `[top=${padding},left=${padding},bottom=${padding},right=${padding}]`,
  };
}

/** Native packing preserves each declared group as one complete physical region. */
export function groupedPlacement(page, readingWidth, readingViewport) {
  const inset = marks.graphInset;
  const outerWidth = Math.min(readingWidth, readingViewport?.width ?? readingWidth);
  const contentWidth = Math.max(1, outerWidth - inset * 2);
  const contentHeight = readingViewport
    ? Math.max(1, readingViewport.height - inset * 2)
    : contentWidth / marks.desktopReadingAspect;
  const aspect = contentWidth / contentHeight;
  const nodes = new Map(page.nodes.map((node) => [node.id, node]));
  const children = page.groups.map((group, index) => {
    const members = group.nodeIds.map((id) => nodes.get(id));
    const internal = page.relations.filter(
      ({ source, target }) => group.nodeIds.includes(source) && group.nodeIds.includes(target),
    );
    const spacing = Math.max(
      marks.readingGap,
      ...(internal.length ? [marks.routeEndpointStub * 2] : []),
      ...internal.map(({ label }) => (label?.width ?? 0) + marks.readingGap * 2),
    );
    const width = Math.max(...members.map((node) => node.width));
    const height = Math.max(...members.map((node) => node.height));
    const capacity = Math.max(1, Math.floor((contentWidth + spacing) / (width + spacing)));
    const columns = Math.max(
      1,
      Math.min(
        members.length,
        capacity,
        Math.round(Math.sqrt((members.length * aspect * (height + spacing)) / (width + spacing))),
      ),
    );
    const targetWidth = Math.max(
      columns * width + (columns - 1) * spacing,
      group.label.width - marks.readingGap * 2 + marks.textOwnerClearance * 2,
    );
    return {
      id: group.id,
      labels: [
        {
          id: `${group.id}-label`,
          text: group.label.lines.join("\n"),
          width: group.label.width,
          height: group.label.height,
        },
      ],
      children: members.map((node, at) => ({
        ...placementLeaf(node, 0, 0),
        layoutOptions: {
          "elk.rectpacking.desiredPosition": String(at),
          "elk.rectpacking.inNewRow": String(at > 0 && at % columns === 0),
        },
      })),
      layoutOptions: {
        ...packingOptions(targetWidth, spacing, marks.readingGap),
        "elk.padding": `[top=${group.label.height + marks.readingGap},left=${marks.readingGap},bottom=${marks.readingGap},right=${marks.readingGap}]`,
        "elk.nodeLabels.placement": "[INSIDE,H_CENTER,V_TOP]",
        "elk.rectpacking.desiredPosition": String(index),
      },
    };
  });
  children.push(
    ...page.nodes.filter(({ groupId }) => !groupId).map((node) => placementLeaf(node, 0, 0)),
  );
  return {
    containers: [],
    placementOnly: true,
    preserveGroups: true,
    escape: 0,
    verticalEscape: 0,
    graph: {
      id: "root",
      layoutOptions: packingOptions(contentWidth, marks.readingGap, inset),
      children,
    },
  };
}
