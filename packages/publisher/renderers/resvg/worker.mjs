import fs from 'node:fs';
import * as resvg from './supply/resvg/index.mjs';
import { validateSvg } from './validation.mjs';

try {
  const request = JSON.parse(fs.readFileSync(0, 'utf8'));
  const input = Buffer.from(request.svg, 'base64');
  const fonts = request.fonts.map((f) => ({
    ...f,
    bytes: Buffer.from(f.bytes, 'base64'),
  }));
  const checked = validateSvg(input, fonts, request.width);
  const module = new WebAssembly.Module(
    fs.readFileSync(new URL('./supply/resvg/index_bg.wasm', import.meta.url)),
  );
  const instance = new WebAssembly.Instance(module, { './index_bg.js': resvg });
  resvg.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  const renderer = new resvg.Renderer();
  for (const font of fonts) renderer.addFont(font.bytes);
  try {
    const png = Buffer.from(renderer.render(input, request.width));
    if (png.readUInt32BE(16) !== checked.width || png.readUInt32BE(20) !== checked.height)
      throw Object.assign(new Error(), { code: 'raster_dimensions_mismatch' });
    process.stdout.write(
      JSON.stringify({ status: 'rendered', ...checked, png: png.toString('base64') }),
    );
  } finally {
    renderer.free();
  }
} catch (error) {
  process.stdout.write(
    JSON.stringify({
      status: 'error',
      code: error.code ?? 'raster_render_failed',
    }),
  );
  process.exitCode = 1;
}
