import { fail } from "../../src/protocol/values.mjs";

/** Resource bounds of the supported raster operation, shared by both processes. */
export const RASTER_LIMITS = Object.freeze({
  svgBytes: 16 * 1024 * 1024,
  fontBytes: 8 * 1024 * 1024,
  fontTotalBytes: 32 * 1024 * 1024,
  fonts: 16,
  width: 8192,
  height: 8192,
  pixels: 32 * 1024 * 1024,
  elements: 100000,
  depth: 128,
  references: 100000,
  referenceDepth: 256,
  fontContexts: 100000,
  measurementQueries: 4096,
  measurementTextLength: 4096,
  measurementGlyphs: 200000,
  pngBytes: 96 * 1024 * 1024,
  responseBytes: 128 * 1024 * 1024,
  executionMs: 30000,
  heapMiB: 512,
  wasmPages: 8192,
});

/** Project complete SVG geometry into the same bounded raster used by rendering. */
export function rasterDimensions(sourceWidth, sourceHeight, rasterWidth) {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    sourceWidth > 100000 ||
    sourceHeight > 100000 ||
    !Number.isSafeInteger(rasterWidth) ||
    rasterWidth < 1 ||
    rasterWidth > RASTER_LIMITS.width
  )
    fail("raster_dimensions_invalid");
  const height = Math.round((rasterWidth * sourceHeight) / sourceWidth);
  if (height < 1 || height > RASTER_LIMITS.height || rasterWidth * height > RASTER_LIMITS.pixels)
    fail("raster_dimensions_invalid");
  return { width: rasterWidth, height };
}
