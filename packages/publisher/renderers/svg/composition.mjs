import { rasterDimensions } from "../resvg/public.mjs";

const readingAspect = 4 / 3;
const desktopExtent = (figure) => Math.max(figure.width, readingAspect * figure.height);

/** Enlarge the whole source structure within both reading-frame axes. */
export function staticStructureScale(bounds, width) {
  return Math.max(1, Math.min(width / bounds.width, width / (readingAspect * bounds.height)));
}

/** Select complete, raster-feasible arrangements after measured content reflow. */
export function selectMeasuredComposition(
  candidates,
  paint,
  refusalCodes,
  { extent = desktopExtent, raster = true } = {},
) {
  let result = null;
  let refusal;
  const measured = new Map();
  for (const arrangement of candidates) {
    try {
      const candidate = paint(arrangement);
      const reflow = JSON.stringify([
        candidate.height,
        candidate.readingSpan ?? 0,
        ...(candidate.reflowHeights ?? []),
      ]);
      const previous = measured.get(reflow);
      // Widening unchanged blocks is padding; an equal page height can still hide real reflow.
      if (!previous || candidate.width < previous.width) measured.set(reflow, candidate);
    } catch (cause) {
      if (!refusalCodes.includes(cause?.code) && cause?.code !== "raster_dimensions_invalid")
        throw cause;
      refusal ??= cause;
    }
  }
  const feasible = [];
  for (const candidate of measured.values()) {
    try {
      if (raster) rasterDimensions(candidate.width, candidate.height, candidate.rasterWidth);
    } catch (cause) {
      if (cause?.code !== "raster_dimensions_invalid") throw cause;
      refusal ??= cause;
      continue;
    }
    feasible.push(candidate);
  }
  const baseline = Math.min(...feasible.map((candidate) => candidate.readingSpan ?? 0));
  const cost = (candidate) =>
    extent(candidate) *
    (1 + Math.max(0, (candidate.readingSpan ?? 0) - baseline) / candidate.height);
  for (const candidate of feasible) {
    if (
      !result ||
      cost(candidate) < cost(result) ||
      (cost(candidate) === cost(result) &&
        candidate.width * candidate.height < result.width * result.height)
    )
      result = candidate;
  }
  if (!result) throw refusal;
  return result;
}
