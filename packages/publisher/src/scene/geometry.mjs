/** Coordinate primitives shared by independent media audits, not layout authority. */
export const boxRight = (box) => box.x + box.width;
export const boxBottom = (box) => box.y + box.height;
export const expandBox = (box, padding) => ({
  x: box.x - padding,
  y: box.y - padding,
  width: box.width + 2 * padding,
  height: box.height + 2 * padding,
});
export const boxesOverlap = (left, right) =>
  Math.min(boxRight(left), boxRight(right)) > Math.max(left.x, right.x) &&
  Math.min(boxBottom(left), boxBottom(right)) > Math.max(left.y, right.y);
export const pointDistance = (left, right) => Math.hypot(left.x - right.x, left.y - right.y);
export const boundaryDistance = (point, box) =>
  Math.min(
    Math.hypot(point.x - box.x, Math.max(box.y - point.y, 0, point.y - boxBottom(box))),
    Math.hypot(point.x - boxRight(box), Math.max(box.y - point.y, 0, point.y - boxBottom(box))),
    Math.hypot(point.y - box.y, Math.max(box.x - point.x, 0, point.x - boxRight(box))),
    Math.hypot(point.y - boxBottom(box), Math.max(box.x - point.x, 0, point.x - boxRight(box))),
  );

export function parallelStrokesOverlap(left, right, width) {
  const horizontal = left.start.y === left.end.y;
  if (horizontal !== (right.start.y === right.end.y)) return false;
  const along = horizontal ? "x" : "y";
  const across = horizontal ? "y" : "x";
  return (
    Math.min(
      Math.max(left.start[along], left.end[along]),
      Math.max(right.start[along], right.end[along]),
    ) -
      Math.max(
        Math.min(left.start[along], left.end[along]),
        Math.min(right.start[along], right.end[along]),
      ) >
      0.0001 && Math.abs(left.start[across] - right.start[across]) < width - 0.0001
  );
}

export function segmentHitsBox(start, end, box) {
  let lower = 0;
  let upper = 1;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  for (const [p, q] of [
    [-dx, start.x - box.x],
    [dx, boxRight(box) - start.x],
    [-dy, start.y - box.y],
    [dy, boxBottom(box) - start.y],
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
