import { refuse } from "../refusal.mjs";

/** The overview page and the area its text must stay within, in points. */
export const LIVE_AREA = Object.freeze({
  width: 1600,
  height: 900,
  left: 48,
  right: 1552,
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
