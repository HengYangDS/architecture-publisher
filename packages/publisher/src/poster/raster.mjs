import fs from "node:fs/promises";
import path from "node:path";
import { verifySupply } from "../supply.mjs";
import { refuse } from "../refusal.mjs";

const MAXIMUM_WIDTH = 6000;
const MAXIMUM_PIXELS = 6000 * 6000;

let renderer;

async function resvg() {
  if (!renderer) {
    const supply = await verifySupply("resvg");
    const glue = await import(path.join(supply.root, "resvg", "index.mjs"));
    const wasm = new WebAssembly.Module(
      await fs.readFile(path.join(supply.root, "resvg", "index_bg.wasm")),
    );
    const instance = new WebAssembly.Instance(wasm, { "./index_bg.js": glue });
    glue.__wbg_set_wasm(instance.exports);
    instance.exports.__wbindgen_start();
    renderer = new glue.Renderer();
  }
  return renderer;
}

/**
 * Render a self-contained poster SVG (text already outlined) to PNG at one width.
 * @param {string} svg
 * @param {number} width
 * @param {number} height the SVG's own height, used to bound the raster size
 * @param {number} svgWidth the SVG's own width
 */
export async function rasterize(svg, width, height, svgWidth) {
  const pixels = width * Math.ceil((height * width) / svgWidth);
  if (!Number.isSafeInteger(width) || width < 1 || width > MAXIMUM_WIDTH || pixels > MAXIMUM_PIXELS)
    refuse(
      "raster_size_invalid",
      `Cannot render ${width} px wide: the raster limit is ${MAXIMUM_WIDTH} px.`,
    );
  const png = Buffer.from((await resvg()).render(Buffer.from(svg, "utf8"), width));
  if (png.readUInt32BE(16) !== width)
    refuse("raster_failed", "The raster renderer returned another width.");
  return png;
}
