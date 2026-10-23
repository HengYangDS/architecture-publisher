import { rasterDimensions } from "../resvg/public.mjs";

const readingAspect = 4 / 3;

/** Enlarge the whole source structure within both reading-frame axes. */
export function staticStructureScale(bounds, width) {
  return Math.max(1, Math.min(width / bounds.width, width / (readingAspect * bounds.height)));
}

/** Select complete, raster-feasible arrangements after measured content reflow. */
export function selectMeasuredComposition(candidates, paint, refusalCodes) {
  let result = null;
  let refusal;
  const measured = new Map();
  const extent = (figure) => Math.max(figure.width, readingAspect * figure.height);
  for (const arrangement of candidates) {
    try {
      const candidate = paint(arrangement);
      const previous = measured.get(candidate.height);
      // Equal-height widening is padding, not a content-reflow improvement.
      if (!previous || candidate.width < previous.width) measured.set(candidate.height, candidate);
    } catch (cause) {
      if (!refusalCodes.includes(cause?.code) && cause?.code !== "raster_dimensions_invalid")
        throw cause;
      refusal ??= cause;
    }
  }
  for (const candidate of measured.values()) {
    try {
      rasterDimensions(candidate.width, candidate.height, candidate.rasterWidth);
    } catch (cause) {
      if (cause?.code !== "raster_dimensions_invalid") throw cause;
      refusal ??= cause;
      continue;
    }
    if (
      !result ||
      extent(candidate) < extent(result) ||
      (extent(candidate) === extent(result) &&
        candidate.width * candidate.height < result.width * result.height)
    )
      result = candidate;
  }
  if (!result) throw refusal;
  return result;
}
