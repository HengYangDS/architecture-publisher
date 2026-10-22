import { fail } from "../../src/protocol/values.mjs";
import {
  TEXT_OWNER_CLEARANCE,
  textOwnerInsets,
  textOwnerPaintCollides,
} from "../../src/scene/text-ownership.mjs";
import { resolvePrimitivePaint } from "../../src/scene/primitives.mjs";
import { interactiveGraphMarks } from "../../src/scene/marks.mjs";
import { createBundledTextMeasurer } from "../resvg/measurement.mjs";
import {
  MIN_PROJECTED_NODE_TEXT_PX,
  minimumReadableSourceTextPx,
} from "./supply/renderers/shared/desktop-readability.mjs";
import { rectsOverlap, segmentIntersectsRect } from "./supply/renderers/shared/geometry.mjs";
import { architectureTextBudget, measureArchitectureNodeText } from "./node-text.mjs";

function rejectTypography(message) {
  throw Object.assign(new Error(message), {
    code: "render_native_rejected",
    diagnostics: [{ code: "composition/desktop-readability", message }],
  });
}

/** One complete desktop aperture owns projected targets and source-space glyph fitting. */
export async function measureArchitectureTypography(
  scene,
  fonts,
  measured = null,
  readingContext = "overview",
) {
  const sourceReading = readingContext === "source" && measured !== null;
  const requested = scene.typography?.minimumTextPx;
  const readingScale = Math.min(
    1,
    interactiveGraphMarks.desktopFrameWidth / scene.viewport.width,
    interactiveGraphMarks.desktopReadingHeight / scene.viewport.height,
  );
  const minimum = measured
    ? (requested ?? 12)
    : requested
      ? Math.ceil((requested / readingScale) * 10) / 10
      : 10;
  if (!sourceReading && !requested && minimum < minimumReadableSourceTextPx(scene.viewport.width))
    rejectTypography("The undeclared desktop text budget cannot remain readable at native width.");
  if ((scene.texts ?? []).some((text) => text.visible && text.fontSize < minimum))
    fail("authored_interactive_text_budget_unmet");
  const budget = architectureTextBudget(minimum);
  const text =
    measured ??
    (await measureArchitectureNodeText(scene, budget, fonts, createBundledTextMeasurer));
  if (Object.values(text.layouts).some(({ valid }) => !valid))
    rejectTypography(
      "A component cannot contain the declared desktop glyph budget and all measured node fields.",
    );
  return {
    ...text,
    budget,
    requestedMinimum: sourceReading ? minimum : (requested ?? MIN_PROJECTED_NODE_TEXT_PX),
    requestedPrimary: requested ? architectureTextBudget(requested).primary : budget.primary,
  };
}

/** Validate actual text ink against its allocation, other paint, routes and the canvas. */
export function assertArchitectureTextLayout(scene, texts, nodeText, boundaries, labels, paths) {
  const components = scene.nodes.map((node) => {
    const layout = nodeText.layouts[node.id];
    return {
      id: node.id,
      ...(node.paintBox ?? { ...node.position, ...node.size }),
      portBox: { ...node.position, ...node.size },
      ownerPaint: node.primitives ? resolvePrimitivePaint(node, node.position).primitives : [],
      nativeText: !node.primitives,
      nativeContent: layout
        ? [
            ...layout.rows
              .filter(({ occurrence, painted }) => !occurrence && painted)
              .map(({ box }) => ({
                ...box,
                x: node.position.x + box.x,
                y: node.position.y + box.y,
              })),
            ...(node.icon !== "none"
              ? [
                  {
                    x: node.position.x + nodeText.budget.sigilInset,
                    y: node.position.y + layout.sigilY,
                    width: layout.sigilSize,
                    height: layout.sigilSize,
                  },
                ]
              : []),
          ]
        : [],
    };
  });
  const owners = new Map(components.map((node) => [node.id, node]));
  for (const [index, text] of texts.entries()) {
    const box = text.box;
    if (
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > scene.viewport.width ||
      box.y + box.height > scene.viewport.height
    )
      fail("authored_interactive_text_geometry_invalid", `${text.id}:bounds`);
    if (text.owner && owners.has(text.owner)) {
      const owner = owners.get(text.owner);
      if (Math.min(...textOwnerInsets(box, owner.portBox)) < TEXT_OWNER_CLEARANCE)
        fail("authored_interactive_text_geometry_invalid", `${text.id}:owner`);
      if (
        textOwnerPaintCollides(
          box,
          owner.ownerPaint,
          5,
          (start, end, glyphs) =>
            segmentIntersectsRect({ start: [start.x, start.y], end: [end.x, end.y] }, glyphs),
          owner.portBox,
        )
      )
        fail("authored_interactive_text_geometry_invalid", `${text.id}:collision`);
    }
    if (
      [...components, ...boundaries, ...labels].some((owner) => {
        if (owner.id !== text.owner) return rectsOverlap(box, owner, 5);
        return owner.nativeText && owner.nativeContent.some((paint) => rectsOverlap(box, paint, 5));
      }) ||
      texts.slice(0, index).some((other) => rectsOverlap(box, other.box, 5)) ||
      paths.some((points) =>
        points
          .slice(1)
          .some((point, i) =>
            segmentIntersectsRect(
              { start: [points[i].x, points[i].y], end: [point.x, point.y] },
              box,
              6,
            ),
          ),
      )
    )
      fail("authored_interactive_text_geometry_invalid", `${text.id}:collision`);
  }
}
