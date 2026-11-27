import { bodyOf } from "../house.mjs";
import { nodeAt, shaped } from "./format.mjs";

/**
 * A plate's entry in the pinned data: its number and views, its page in the PDF, its images and the files of its
 * figure set alone where an edition was typeset, the frame its figure stands in on that page, the scales it draws
 * on, and its face. The face is what the drawing reported as it drew: each part with the rectangle it set, and
 * each relation with the stretches of line it stroked and the box of its label. Nothing is laid out again here,
 * and nothing is read from the plan, so a face compared with its view's statement set compares two sources.
 *
 * @typedef {{ x: number, y: number, width: number, height: number }} Box
 * @typedef {{ id: string, from: string, to: string, label: string, relations?: string[] }} Stroked
 *   A relation as the drawing holds it on a line: its ends, its label and, for a line of an overview that stands
 *   for several relations of the model, their ids.
 * @typedef {{ parts: Array<{ id: string, group?: boolean, box: Box }>,
 *   paths: Array<{ relations: Stroked[], points: number[][] }>,
 *   labels: Array<{ relations: string[], box: Box }> }} Report
 *   What a figure's drawing hands back beside its shapes, in the order drawn and in the numbers its SVG writes.
 * @typedef {{ components: Array<{ id: string, box: Box }>, groups: Array<{ id: string, box: Box }>,
 *   relations: Array<{ id: string, from: string, to: string, text?: string, relations?: string[],
 *     segments: number[][][], label: Box | null }> }} Face
 */

/**
 * A plate's face from its figure's report: the parts drawn, groups apart, and one entry for each relation in the
 * order first stroked, with every stretch it is stroked on. A relation that shares a trunk with others lists the
 * trunk too. A relation of the model is written as `<from> —<label>→ <to>`; a line that stands for relations of
 * the model names them and has no text. A relation whose figure sets no label has none.
 * @param {Report} report
 * @returns {Face}
 */
export function plateFace(report) {
  const part = ({ id, box }) => ({ id, box });
  /** @type {Map<string, { relation: Stroked, segments: number[][][] }>} */
  const stroked = new Map();
  for (const { relations, points } of report.paths)
    for (const relation of relations) {
      const held = stroked.get(relation.id) ?? { relation, segments: [] };
      held.segments.push(points);
      stroked.set(relation.id, held);
    }
  return {
    components: report.parts.filter(({ group }) => !group).map(part),
    groups: report.parts.filter(({ group }) => group).map(part),
    relations: [...stroked.values()].map(({ relation, segments }) => ({
      id: relation.id,
      from: relation.from,
      to: relation.to,
      ...(relation.relations
        ? { relations: relation.relations }
        : { text: `${relation.from} —${relation.label}→ ${relation.to}` }),
      segments,
      label: report.labels.find(({ relations }) => relations.includes(relation.id))?.box ?? null,
    })),
  };
}

/**
 * The scales a plate draws on, from the style's record: strips are as long as their parts' bytes on one scale for
 * the whole edition, whose end is the largest part's bytes drawn at the recorded length. Cards record no length,
 * and strips of an edition in which no part owns a file are drawn on no scale: both have none.
 * @param {{ longest?: number, scale?: number | null }} style the length the style records for its longest strip,
 *   in the drawing space, and the bytes it stands for
 * @returns {Array<{ property: string, unit: string, value: number, length: number }>}
 */
export function plateScales({ longest, scale }) {
  return longest && scale
    ? [{ property: "owned-bytes", unit: "bytes", value: scale, length: longest }]
    : [];
}

/**
 * Where a plate's figure stands on its page, in points from the page's top left corner, and the scale of its
 * drawing space: an element at `x` in the drawing space stands at `x / pixelsPerPoint` points right of the
 * frame's left edge. The house class sets a figure at the page's margin: at the body's top and as tall as the
 * body, or, under a summary set above it, as tall as it was composed and standing on the body's bottom. The
 * frame repeats that arithmetic on the body's box the same tokens give, so no typesetting is asked for it.
 * @param {{ width: number, height: number, reading: string }} plate a composed plate: its figure's width and
 *   height in the drawing space, and whether its summary is set above it
 * @param {Parameters<typeof bodyOf>[0] & { plate: { pixelsPerPoint: number } }} house the house's tokens
 */
export function plateFrame(plate, house) {
  const { pixelsPerPoint } = house.plate;
  const body = bodyOf(house);
  const height = plate.reading === "above" ? plate.height / pixelsPerPoint : body.height;
  return {
    x: body.x,
    y: plate.reading === "above" ? body.y + body.height - height : body.y,
    width: plate.width / pixelsPerPoint,
    height,
    pixelsPerPoint,
  };
}

/**
 * A plate's entry in the data, in the shape the data's format states. Its number, its views, its images and its
 * face are always held; a run that renders no image of the plate lists none. What else only a typeset edition gives
 * is written when the build holds it and has no key otherwise: the plate's page in the PDF, the files of its figure
 * set alone, the frame of its figure on that page, for which the house's tokens are given, and its scales.
 * @param {{ page: number, views: string[], width: number, height: number, reading: string, report: Report }} plate
 *   a composed plate; its `page` is its number in the edition
 * @param {{ page?: number, images?: Array<{ width: number, file: string }>,
 *   figures?: Array<{ format: string, file: string }>,
 *   house?: Parameters<typeof plateFrame>[1], scales?: ReturnType<typeof plateScales> }} [known]
 */
export function plateEntry(plate, known = {}) {
  return shaped(nodeAt("#/$defs/plate"), {
    number: plate.page,
    views: plate.views,
    page: known.page,
    images: known.images ?? [],
    figures: known.figures,
    frame: known.house && plateFrame(plate, known.house),
    scales: known.scales,
    face: plateFace(plate.report),
  });
}
