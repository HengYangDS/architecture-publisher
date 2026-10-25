import { fail } from "../../src/protocol/values.mjs";
import { escapeStaticText as escape, measureStaticText as advance } from "./text.mjs";
import { number } from "./edition-text.mjs";

export const groupTitleBaseline = 31;

export const groupTitleLeading = 19;

export const groupTitleClearance = 17;

export const maximumExtent = 12_000;

export function boundsOf(scene) {
  if (!scene.nodes.length && !scene.edges.length && !scene.groups?.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x, y) => {
    number(x);
    number(y);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const node of scene.nodes) {
    if (node.width <= 0 || node.height <= 0) fail("static_edition_geometry_invalid");
    include(node.x, node.y);
    include(node.x + node.width, node.y + node.height);
  }
  for (const edge of scene.edges) {
    if (!Array.isArray(edge.points) || edge.points.length < 2)
      fail("static_edition_geometry_invalid");
    for (const point of edge.points) {
      if (!Array.isArray(point) || point.length !== 2) fail("static_edition_geometry_invalid");
      include(point[0], point[1]);
    }
    const caption = checkedRelationCaption(edge);
    if (caption) {
      const box = caption.box;
      include(box.x, box.y);
      include(box.x + box.w, box.y + box.h);
    }
  }
  for (const group of scene.groups ?? []) {
    if (group.width <= 0 || group.height <= 0) fail("static_edition_geometry_invalid");
    include(group.x, group.y);
    include(group.x + group.width, group.y + group.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function segmentHitsBox(from, to, box) {
  let lower = 0;
  let upper = 1;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  for (const [p, q] of [
    [-dx, from[0] - box.x],
    [dx, box.x + box.width - from[0]],
    [-dy, from[1] - box.y],
    [dy, box.y + box.height - from[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const ratio = q / p;
    if (p < 0) lower = Math.max(lower, ratio);
    else upper = Math.min(upper, ratio);
    if (lower > upper) return false;
  }
  return true;
}

function headingOverlapsCaption(heading, caption) {
  const clearance = 3;
  return (
    heading.x < caption.x + caption.w + clearance &&
    heading.x + heading.width + clearance > caption.x &&
    heading.y < caption.y + caption.h + clearance &&
    heading.y + heading.height + clearance > caption.y
  );
}

/** Native heading positions are consumed, never replanned after compound layout. */
export function checkedGroupHeading(group, nodes, edges, measure) {
  const heading = group.heading;
  if (
    !heading ||
    heading.fontSize !== 14 ||
    heading.weight !== "600" ||
    heading.lines?.join("") !== group.label ||
    !Array.isArray(heading.baselines) ||
    heading.baselines.length !== heading.lines.length
  )
    fail("static_edition_group_heading_collision");
  for (const [index, line] of heading.baselines.entries()) {
    if (line.text !== heading.lines[index] || ![line.x, line.baseline].every(Number.isFinite))
      fail("static_edition_group_heading_collision");
    const box = measure
      ? measure.box({
          text: line.text,
          fontSize: 14,
          weight: "600",
          anchor: "start",
          x: line.x,
          baseline: line.baseline,
        })
      : line.box;
    if (
      !box ||
      ![box.x, box.y, box.width, box.height].every(Number.isFinite) ||
      box.x < group.x + 8 ||
      box.y < group.y + 8 ||
      box.x + box.width > group.x + group.width - 8 ||
      box.y + box.height > group.y + group.height - 8 ||
      nodes.some((node) =>
        headingOverlapsCaption(box, { x: node.x, y: node.y, w: node.width, h: node.height }),
      ) ||
      edges.some(
        ({ points, caption }) =>
          points.slice(1).some((point, at) =>
            segmentHitsBox(points[at], point, {
              x: box.x - 5,
              y: box.y - 5,
              width: box.width + 10,
              height: box.height + 10,
            }),
          ) ||
          (caption && headingOverlapsCaption(box, caption.box)),
      )
    )
      fail("static_edition_group_heading_collision");
  }
  return heading.baselines;
}

export function groupHeadingX(group, lines, edges) {
  const textWidth = Math.max(...lines.map((line) => advance(line, 14))) + 12;
  const left = group.x + 26;
  const right = group.x + group.width - 26 - textWidth;
  if (right < left) fail("static_edition_group_heading_collision");
  const boxY = group.y + 13;
  const boxHeight = groupTitleBaseline + (lines.length - 1) * groupTitleLeading + 4 - 13;
  const positions = [left, right, (left + right) / 2];
  for (let x = left + 20; x < right; x += 20) positions.push(x);
  for (const x of positions) {
    const box = { x: x - 3, y: boxY - 3, width: textWidth + 6, height: boxHeight + 6 };
    if (
      edges.some(
        ({ points, caption }) =>
          points.slice(1).some((point, index) => segmentHitsBox(points[index], point, box)) ||
          (caption && headingOverlapsCaption(box, caption.box)),
      )
    )
      continue;
    return x;
  }
  fail("static_edition_group_heading_collision");
}

export function checkedRelationCaption(edge) {
  const caption = edge.caption;
  if (caption === undefined) return null;
  if (!caption || typeof caption !== "object" || Array.isArray(caption))
    fail("static_edition_relation_caption_invalid");
  const box = caption.box;
  const point = caption.point;
  if (
    edge.relations.length !== 1 ||
    typeof edge.relations[0]?.kind !== "string" ||
    caption.text !== edge.relations[0].kind.replaceAll("-", " ") ||
    !Array.isArray(point) ||
    point.length !== 2 ||
    !point.every(Number.isFinite) ||
    !box ||
    ![box.x, box.y, box.w, box.h].every(Number.isFinite) ||
    box.w <= 0 ||
    box.h <= 0 ||
    point[0] - advance(caption.text, 14) / 2 < box.x ||
    point[0] + advance(caption.text, 14) / 2 > box.x + box.w ||
    point[1] - 14 < box.y ||
    point[1] + 4 > box.y + box.h
  )
    fail("static_edition_relation_caption_invalid");
  return caption;
}

export function captionedGroupGraphic(group) {
  const caption = group.caption;
  const box = caption?.box;
  if (
    !box ||
    ![caption.x, caption.y, box.x, box.y, box.w, box.h].every(Number.isFinite) ||
    box.w <= 0 ||
    box.h <= 0 ||
    caption.x < box.x ||
    caption.y < box.y ||
    caption.x + advance(group.label, 14) > box.x + box.w ||
    caption.y > box.y + box.h ||
    box.x < group.x ||
    box.y < group.y ||
    box.x + box.w > group.x + group.width ||
    box.y + box.h > group.y + group.height
  )
    fail("static_edition_group_heading_collision");
  return `<text x="${number(caption.x)}" y="${number(caption.y)}" fill="#526158" font-size="14" font-weight="600">${escape(group.label)}</text>`;
}
