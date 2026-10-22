import path from "node:path";
import { readSourceBundle } from "../source/bundle.mjs";
import { portablePath } from "../file-input/contract.mjs";
import { fail, hasExactFields as fields } from "../protocol/values.mjs";
import { RASTER_LIMITS as limits } from "../../renderers/resvg/limits.mjs";

/** Select a closed Source Bundle for the public raster command. */
export async function rasterizeBundle(plan) {
  if (!fields(plan, ["manifest", "manifestSha256", "svg", "fonts", "width", "output"]))
    fail("raster_plan_invalid");
  if (!Array.isArray(plan.fonts) || plan.fonts.length > limits.fonts) fail("raster_fonts_invalid");
  let selected;
  try {
    selected = structuredClone(plan);
  } catch {
    fail("raster_plan_invalid");
  }
  for (const key of ["manifest", "output"])
    if (typeof selected[key] !== "string" || !path.isAbsolute(selected[key]))
      fail("raster_path_required");
  if (!Number.isSafeInteger(selected.width) || selected.width < 1 || selected.width > limits.width)
    fail("raster_dimensions_invalid");
  if (!Array.isArray(selected.fonts) || selected.fonts.length > limits.fonts)
    fail("raster_fonts_invalid");
  const bundle = await readSourceBundle(selected.manifest, selected.manifestSha256);
  const members = new Map(bundle.members.map((member) => [member.path, member.content]));
  const svg = members.get(portablePath(selected.svg));
  if (!svg) fail("raster_svg_missing");
  const selectedNames = new Set([selected.svg]);
  const fonts = selected.fonts.map((font) => {
    if (!fields(font, ["path", "family", "weight"])) fail("raster_fonts_invalid");
    const name = portablePath(font.path);
    const bytes = members.get(name);
    if (!bytes || selectedNames.has(name)) fail("raster_fonts_invalid");
    selectedNames.add(name);
    return { family: font.family, weight: font.weight, bytes };
  });
  const { rasterizeBytes } = await import("../../renderers/resvg/index.mjs");
  const rendered = await rasterizeBytes({
    svg,
    fonts,
    width: selected.width,
    output: selected.output,
  });
  return { ...rendered, source: bundle.source, manifestSha256: bundle.manifestSha256 };
}
