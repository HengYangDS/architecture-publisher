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
