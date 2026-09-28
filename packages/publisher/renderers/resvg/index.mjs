import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fail, hasExactFields as fields } from '../../src/protocol/values.mjs';
import { verifyRasterSupply } from './supply.mjs';
import { RASTER_LIMITS as limits } from './limits.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');

/** Render selected bytes; source identity and selection belong to the caller. */
export async function rasterizeBytes(plan) {
  if (!fields(plan, ['svg', 'fonts', 'width', 'output'])) fail('raster_plan_invalid');
  if (typeof plan.output !== 'string' || !path.isAbsolute(plan.output))
    fail('raster_path_required');
  if (!Buffer.isBuffer(plan.svg)) fail('raster_plan_invalid');
  if (!Number.isSafeInteger(plan.width) || plan.width < 1 || plan.width > limits.width)
    fail('raster_dimensions_invalid');
  if (!Array.isArray(plan.fonts) || plan.fonts.length > limits.fonts) fail('raster_fonts_invalid');
  if (plan.svg.length > limits.svgBytes) fail('raster_svg_size_exceeded');
  const svg = Buffer.from(plan.svg);
  const output = plan.output;
  const width = plan.width;
  let total = 0;
  const fonts = plan.fonts.map((font) => {
    if (
      !fields(font, ['family', 'weight', 'bytes']) ||
      typeof font.family !== 'string' ||
      !font.family.trim() ||
      font.family.length > 128 ||
      !Number.isInteger(font.weight) ||
      font.weight < 100 ||
      font.weight > 900 ||
      !Buffer.isBuffer(font.bytes) ||
      font.bytes.length > limits.fontBytes
    )
      fail('raster_fonts_invalid');
    total += font.bytes.length;
    return { family: font.family, weight: font.weight, bytes: font.bytes.toString('base64') };
  });
  if (total > limits.fontTotalBytes) fail('raster_fonts_invalid');
  const parent = path.dirname(output),
    stat = await fs.lstat(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (await fs.realpath(parent)) !== parent)
    fail('raster_output_parent_invalid');
  try {
    await fs.lstat(output);
    fail('raster_output_exists');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const supply = await verifyRasterSupply();
  const scratch = await fs.mkdtemp(path.join(parent, '.architecture-raster-'));
  let request;
  try {
    // A completed regular file gives the child an explicit EOF without the
    // synchronous parent's pipe writer participating in input consumption.
    const requestPath = path.join(scratch, 'request.json');
    await fs.writeFile(
      requestPath,
      JSON.stringify({
        svg: svg.toString('base64'),
        fonts,
        width,
      }),
      { flag: 'wx', mode: 0o600 },
    );
    request = await fs.open(requestPath, 'r');
    const result = spawnSync(
      process.execPath,
      [
        `--max-old-space-size=${limits.heapMiB}`,
        `--wasm-max-mem-pages=${limits.wasmPages}`,
        fileURLToPath(new URL('./worker.mjs', import.meta.url)),
      ],
      {
        cwd: scratch,
        env: {
          HOME: scratch,
          PATH: scratch,
          TMPDIR: scratch,
          TMP: scratch,
          TEMP: scratch,
          LANG: 'C.UTF-8',
        },
        stdio: [request.fd, 'pipe', 'pipe'],
        encoding: 'utf8',
        timeout: limits.executionMs,
        killSignal: 'SIGKILL',
        maxBuffer: limits.responseBytes,
      },
    );
    if (result.error)
      fail(
        result.error.code === 'ETIMEDOUT' ? 'raster_execution_timeout' : 'raster_process_failed',
      );
    if (result.signal || result.status === null) fail('raster_process_failed');
    let response;
    try {
      response = JSON.parse(result.stdout);
    } catch {
      fail('raster_response_invalid');
    }
    if (fields(response, ['status', 'code']) && response.status === 'error') {
      if (typeof response.code !== 'string' || !response.code || response.code.length > 128)
        fail('raster_response_invalid');
      fail(response.code);
    }
    if (
      !fields(response, ['status', 'width', 'height', 'elements', 'fontCount', 'png']) ||
      response.status !== 'rendered' ||
      typeof response.png !== 'string' ||
      response.png.length > Math.ceil(limits.pngBytes / 3) * 4 ||
      !Number.isInteger(response.elements) ||
      response.elements < 1 ||
      response.elements > limits.elements ||
      !Number.isInteger(response.fontCount) ||
      response.fontCount < 0 ||
      response.fontCount > fonts.length
    )
      fail('raster_response_invalid');
    if (result.status !== 0) fail('raster_render_failed');
    const png = Buffer.from(response.png, 'base64');
    if (
      png.toString('base64') !== response.png ||
      png.length < 33 ||
      png.length > limits.pngBytes ||
      !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      response.width !== width ||
      !Number.isInteger(response.height) ||
      response.height < 1 ||
      response.height > limits.height ||
      response.width * response.height > limits.pixels ||
      png.readUInt32BE(16) !== response.width ||
      png.readUInt32BE(20) !== response.height
    )
      fail('raster_response_invalid');
    const candidate = path.join(scratch, 'candidate.png');
    await fs.writeFile(candidate, png, { flag: 'wx' });
    try {
      await fs.copyFile(candidate, output, constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code === 'EEXIST') fail('raster_output_exists');
      throw error;
    }
    const artifact = { bytes: png.length, sha256: sha(png) };
    if (sha(await fs.readFile(output)) !== artifact.sha256) fail('raster_output_changed');
    return {
      status: 'rendered',
      width: response.width,
      height: response.height,
      svgSha256: sha(svg),
      artifact,
      supply,
      browserAcceptance: 'not-performed',
      semanticAcceptance: 'not-performed',
    };
  } finally {
    try {
      await request?.close();
    } finally {
      await fs.rm(scratch, { recursive: true, force: true });
    }
  }
}
