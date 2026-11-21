import { HOUSE } from "../house.mjs";
import { refuse } from "../refusal.mjs";

/**
 * The area the overview's text must stay within, in points: across, between the page's margins, which the house
 * states; down, within the check's own bounds.
 */
const LIVE_AREA = Object.freeze({
  left: HOUSE.page.margin,
  right: HOUSE.page.width - HOUSE.page.margin,
  top: 16,
  bottom: 892,
});

/** How far two text boxes may touch before they count as overlapping, in points. */
const TOLERANCE = 0.25;

/** A text named for a refusal: quoted, and shortened when long. */
const named = (box) =>
  JSON.stringify(box.text.length > 48 ? `${box.text.slice(0, 47)}…` : box.text);

const where = (box) => `at ${Math.round(box.x)},${Math.round(box.y)} pt`;

/**
 * Refuse a typeset page whose text leaves the live area or lies over other text. Each box is
 * one text the house class set, with its glyphs' extent in points.
 * @param {Array<{ x: number, y: number, w: number, h: number, size: number, text: string }>} boxes
 */
export function checkBoxes(boxes) {
  /** @type {Array<{ code: string, path?: string, message: string }>} */
  const problems = [];
  for (const box of boxes)
    if (
      box.x < LIVE_AREA.left - TOLERANCE ||
      box.x + box.w > LIVE_AREA.right + TOLERANCE ||
      box.y < LIVE_AREA.top - TOLERANCE ||
      box.y + box.h > LIVE_AREA.bottom + TOLERANCE
    )
      problems.push({
        code: "overview_text_outside",
        message: `${named(box)} ${where(box)} leaves the area from ${LIVE_AREA.left} to ${LIVE_AREA.right} pt across and ${LIVE_AREA.top} to ${LIVE_AREA.bottom} pt down`,
      });
  const overlaps = (a, b) =>
    a.x < b.x + b.w - TOLERANCE &&
    b.x < a.x + a.w - TOLERANCE &&
    a.y < b.y + b.h - TOLERANCE &&
    b.y < a.y + a.h - TOLERANCE;
  boxes.forEach((a, index) => {
    for (const b of boxes.slice(index + 1))
      if (overlaps(a, b))
        problems.push({
          code: "overview_text_overlap",
          message: `${named(a)} ${where(a)} overlaps ${named(b)} ${where(b)}`,
        });
  });
  if (problems.length)
    refuse(problems[0].code, "The overview's text must stay in its area and apart.", problems);
}

/** How far a line or a ring may reach into a text's box before it counts as lying over it, in points. */
const LINE_TOLERANCE = 0.5;

/** The half width of a ring's stroke, in points: the drawing strokes its rings at 1.7 pt and less. */
const RING_STROKE = 0.85;

/**
 * Whether the segment from p to q, widened by `half` on each side, meets the rectangle: the rectangle is widened
 * instead, and the segment clipped against it (Liang and Barsky).
 * @param {number[]} p @param {number[]} q @param {number} half
 * @param {{ x0: number, y0: number, x1: number, y1: number }} r
 */
function meets(p, q, half, r) {
  const [x0, y0, x1, y1] = [r.x0 - half, r.y0 - half, r.x1 + half, r.y1 + half];
  const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
  let [low, high] = [0, 1];
  for (const [step, room] of [
    [-dx, p[0] - x0],
    [dx, x1 - p[0]],
    [-dy, p[1] - y0],
    [dy, y1 - p[1]],
  ]) {
    if (step === 0) {
      if (room < 0) return false;
    } else {
      const t = room / step;
      if (step < 0) low = Math.max(low, t);
      else high = Math.min(high, t);
      if (low > high) return false;
    }
  }
  return true;
}

const at = (point) => `${Math.round(point[0])},${Math.round(point[1])}`;

/**
 * Refuse a drawn page that sets a line or a ring over its text. A line is a run of points with its width, as the
 * drawing records each one; a ring is a mark with its centre and radius. The test is made against each text's
 * glyph box, less the tolerance on every side, so a line that only grazes a glyph's extent passes.
 * @param {Array<{ x: number, y: number, w: number, h: number, text: string }>} boxes
 * @param {Array<{ points: number[][], w: number }>} lines
 * @param {Array<{ kind: string, x: number, y: number, r: number }>} marks
 */
export function checkLines(boxes, lines, marks) {
  /** @type {Array<{ code: string, message: string }>} */
  const problems = [];
  for (const box of boxes) {
    const inner = {
      x0: box.x + LINE_TOLERANCE,
      y0: box.y + LINE_TOLERANCE,
      x1: box.x + box.w - LINE_TOLERANCE,
      y1: box.y + box.h - LINE_TOLERANCE,
    };
    if (inner.x1 <= inner.x0 || inner.y1 <= inner.y0) continue;
    for (const { points, w } of lines)
      for (let k = 1; k < points.length; k++)
        if (meets(points[k - 1], points[k], w / 2, inner))
          problems.push({
            code: "overview_text_over_line",
            message: `${named(box)} ${where(box)} lies under a line from ${at(points[k - 1])} to ${at(points[k])} pt`,
          });
    for (const mark of marks) {
      const nearest = [
        Math.min(Math.max(mark.x, inner.x0), inner.x1),
        Math.min(Math.max(mark.y, inner.y0), inner.y1),
      ];
      if (Math.hypot(nearest[0] - mark.x, nearest[1] - mark.y) < mark.r + RING_STROKE)
        problems.push({
          code: "overview_text_over_line",
          message: `${named(box)} ${where(box)} lies under a ${mark.kind} at ${at([mark.x, mark.y])} pt`,
        });
    }
  }
  if (problems.length)
    refuse(
      problems[0].code,
      "The overview's text must stand clear of its lines and marks.",
      problems,
    );
}
