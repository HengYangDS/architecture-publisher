import fs from 'node:fs';
import { initWasm, Resvg } from '../../assets/raster/resvg/index.mjs';
import { validateSvg } from './svg.mjs';

try {
  const request = JSON.parse(fs.readFileSync(0, 'utf8'));
  const input = Buffer.from(request.svg, 'base64');
  const fonts = request.fonts.map((f) => ({
    ...f,
    bytes: Buffer.from(f.bytes, 'base64'),
  }));
  const checked = validateSvg(input, fonts, request.width);
  await initWasm(
    fs.readFileSync(
      new URL('../../assets/raster/resvg/index_bg.wasm', import.meta.url),
    ),
  );
  const renderer = new Resvg(input, {
    fitTo: { mode: 'width', value: request.width },
    font: { fontBuffers: fonts.map((f) => f.bytes) },
  });
  try {
    if (renderer.imagesToResolve().length)
      throw Object.assign(new Error(), { code: 'raster_external_resource' });
    const rendered = renderer.render();
    try {
      if (
        rendered.width !== checked.width ||
        rendered.height !== checked.height
      )
        throw Object.assign(new Error(), {
          code: 'raster_dimensions_mismatch',
        });
      process.stdout.write(
        JSON.stringify({
          status: 'rendered',
          ...checked,
          png: Buffer.from(rendered.asPng()).toString('base64'),
        }),
      );
    } finally {
      rendered.free();
    }
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
