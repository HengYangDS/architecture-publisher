import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readSourceBundle } from '../../src/source/bundle.mjs';
import { fail, hasExactFields as fields } from '../../src/protocol/values.mjs';
import { portablePath } from '../../src/file-input/contract.mjs';
import { verifyRasterSupply } from './supply.mjs';
import { RASTER_LIMITS as limits } from './limits.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');

/** PNG rendering only. Input meaning, visual approval and installation are separate. */
export async function rasterize(plan) {
  if (!fields(plan, ['manifest', 'manifestSha256', 'svg', 'fonts', 'width', 'output']))
    fail('raster_plan_invalid');
  for (const key of ['manifest', 'output'])
    if (typeof plan[key] !== 'string' || !path.isAbsolute(plan[key])) fail('raster_path_required');
  if (!Number.isSafeInteger(plan.width) || plan.width < 1 || plan.width > limits.width)
    fail('raster_dimensions_invalid');
  if (!Array.isArray(plan.fonts) || plan.fonts.length > limits.fonts) fail('raster_fonts_invalid');
  const bundle = await readSourceBundle(plan.manifest, plan.manifestSha256);
  const members = new Map(bundle.members.map((m) => [m.path, m.content]));
  const svg = members.get(portablePath(plan.svg));
  if (!svg) fail('raster_svg_missing');
  if (svg.length > limits.svgBytes) fail('raster_svg_size_exceeded');
  const selected = new Set([plan.svg]);
  let total = 0;
  const fonts = plan.fonts.map((font) => {
    if (
      !fields(font, ['path', 'family', 'weight']) ||
      typeof font.family !== 'string' ||
      !font.family.trim() ||
      font.family.length > 128 ||
      !Number.isInteger(font.weight) ||
      font.weight < 100 ||
      font.weight > 900
    )
      fail('raster_fonts_invalid');
    const name = portablePath(font.path),
      bytes = members.get(name);
    if (!bytes || selected.has(name) || bytes.length > limits.fontBytes)
      fail('raster_fonts_invalid');
    selected.add(name);
    total += bytes.length;
    return { ...font, bytes: bytes.toString('base64') };
  });
  if (total > limits.fontTotalBytes) fail('raster_fonts_invalid');
  const parent = path.dirname(plan.output),
    stat = await fs.lstat(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (await fs.realpath(parent)) !== parent)
    fail('raster_output_parent_invalid');
  try {
    await fs.lstat(plan.output);
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
        width: plan.width,
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
      response.width !== plan.width ||
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
      await fs.copyFile(candidate, plan.output, constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code === 'EEXIST') fail('raster_output_exists');
      throw error;
    }
    const artifact = { bytes: png.length, sha256: sha(png) };
    if (sha(await fs.readFile(plan.output)) !== artifact.sha256) fail('raster_output_changed');
    return {
      status: 'rendered',
      width: response.width,
      height: response.height,
      source: bundle.source,
      manifestSha256: bundle.manifestSha256,
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
