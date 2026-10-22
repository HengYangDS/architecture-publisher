import { rasterDimensions } from "../resvg/public.mjs";

/** Select complete, raster-feasible arrangements after measured content reflow. */
export function selectMeasuredComposition(candidates, paint, refusalCodes) {
  let result = null;
  let refusal;
  let measured = [];
  const extent = (figure) => Math.max(figure.width, (4 / 3) * figure.height);
  for (const arrangement of candidates) {
    let candidate;
    try {
      candidate = paint(arrangement);
      if (
        measured.some(({ width, height }) => width <= candidate.width && height <= candidate.height)
      )
        continue;
      measured = measured.filter(
        ({ width, height }) => width < candidate.width || height < candidate.height,
      );
      measured.push({ width: candidate.width, height: candidate.height });
      rasterDimensions(candidate.width, candidate.height, candidate.rasterWidth);
    } catch (cause) {
      if (!refusalCodes.includes(cause?.code) && cause?.code !== "raster_dimensions_invalid")
        throw cause;
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
