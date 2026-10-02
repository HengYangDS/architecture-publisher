import fs from 'node:fs';
import { takeCoverage } from 'node:v8';
import * as resvg from './supply/resvg/index.mjs';
import { validateSvg } from './validation.mjs';
import { RASTER_LIMITS as limits } from './limits.mjs';
import { hasExactFields } from '../../src/protocol/values.mjs';

try {
  const request = JSON.parse(fs.readFileSync(0, 'utf8'));
  const measuring = request.schema === 'architecture.raster-measurement-request/v1';
  if (measuring) {
    const deadlineMs = Number(process.argv[2]);
    if (
      !hasExactFields(request, ['schema', 'svg', 'fonts', 'count']) ||
      !Number.isSafeInteger(request.count) ||
      request.count < 1 ||
      request.count > limits.measurementQueries ||
      !Number.isSafeInteger(deadlineMs) ||
      deadlineMs < 1 ||
      deadlineMs > 36000
    )
      throw Object.assign(new Error(), { code: 'authored_canvas_measurement_request_invalid' });
    // Preserve a live tree root until the existing supervisor reclaims it.
    setTimeout(() => process.exit(1), deadlineMs);
  } else if (!hasExactFields(request, ['svg', 'fonts', 'width'])) {
    throw Object.assign(new Error(), { code: 'raster_plan_invalid' });
  }
  const input = Buffer.from(request.svg, 'base64');
  const fonts = request.fonts.map((f) => ({
    ...f,
    bytes: Buffer.from(f.bytes, 'base64'),
  }));
  const checked = validateSvg(input, fonts, measuring ? 1 : request.width);
  const module = new WebAssembly.Module(
    fs.readFileSync(new URL('./supply/resvg/index_bg.wasm', import.meta.url)),
  );
  const instance = new WebAssembly.Instance(module, { './index_bg.js': resvg });
  resvg.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  const renderer = new resvg.Renderer();
  for (const font of fonts) renderer.addFont(font.bytes);
  try {
    if (measuring) {
      const boxes = [...renderer.measureText(input, request.count)];
      if (boxes.length !== request.count * 4 || boxes.some((value) => !Number.isFinite(value)))
        throw Object.assign(new Error(), { code: 'authored_canvas_measurement_response_invalid' });
      if (process.env.NODE_V8_COVERAGE) takeCoverage();
      process.stdout.write(JSON.stringify({ status: 'measured', boxes }) + '\n');
    } else {
      const png = Buffer.from(renderer.render(input, request.width));
      if (png.readUInt32BE(16) !== checked.width || png.readUInt32BE(20) !== checked.height)
        throw Object.assign(new Error(), { code: 'raster_dimensions_mismatch' });
      process.stdout.write(
        JSON.stringify({ status: 'rendered', ...checked, png: png.toString('base64') }),
      );
    }
  } finally {
    renderer.free();
  }
} catch (error) {
  if (process.env.NODE_V8_COVERAGE) takeCoverage();
  process.stdout.write(
    JSON.stringify({
      status: 'error',
      code: error.code ?? 'raster_render_failed',
    }) + '\n',
  );
  process.exitCode = 1;
}
