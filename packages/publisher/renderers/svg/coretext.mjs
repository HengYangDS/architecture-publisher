import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fail } from '../../src/source/manifest.mjs';
import { writeSourceBundle } from '../../src/source/write.mjs';
import { createMetricReader } from './metrics.mjs';
import { fileIdentity } from './files.mjs';

const fields = (value, keys) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((k) => Object.hasOwn(value, k));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const encode = (v) => Buffer.from(JSON.stringify(v, null, 2) + '\n');
const absolute = (p) => typeof p === 'string' && path.isAbsolute(p);

/** Explicit opt-in macOS measurement. This is not an SDK or OS sandbox. */
export async function measureCoreText(plan) {
  if (process.platform !== 'darwin') fail('coretext_platform_unsupported');
  if (
    !fields(plan, ['compiler', 'sdk', 'fonts', 'requests', 'output']) ||
    !fields(plan.compiler, ['path', 'sha256']) ||
    !fields(plan.sdk, ['path', 'settingsSha256']) ||
    !absolute(plan.output) ||
    !absolute(plan.sdk.path) ||
    !Array.isArray(plan.fonts) ||
    plan.fonts.length < 1 ||
    plan.fonts.length > 16 ||
    !Array.isArray(plan.requests) ||
    !plan.requests.length ||
    plan.requests.length > 20000
  )
    fail('coretext_plan_invalid');
  const ids = new Set();
  for (const font of plan.fonts) {
    if (
      !fields(font, ['id', 'path', 'sha256', 'postscript', 'cascade']) ||
      typeof font.id !== 'string' ||
      !font.id ||
      font.id.length > 128 ||
      ids.has(font.id) ||
      typeof font.postscript !== 'string' ||
      !font.postscript ||
      font.postscript.length > 128 ||
      !Array.isArray(font.cascade) ||
      font.cascade.length > 16 ||
      new Set(font.cascade).size !== font.cascade.length
    )
      fail('coretext_plan_invalid');
    ids.add(font.id);
  }
  if (plan.fonts.some((f) => f.cascade.some((id) => !ids.has(id) || id === f.id)))
    fail('coretext_plan_invalid');
  const requests = structuredClone(plan.requests),
    keys = new Set();
  let textBytes = 0;
  for (const r of requests) {
    if (!fields(r, ['text', 'size', 'font'])) fail('coretext_plan_invalid');
    const key = JSON.stringify([r.text, r.size, r.font]);
    if (
      typeof r.text !== 'string' ||
      !r.text.trim() ||
      r.text.length > 20000 ||
      !Number.isFinite(r.size) ||
      r.size <= 0 ||
      r.size > 1024 ||
      !ids.has(r.font) ||
      keys.has(key)
    )
      fail('coretext_plan_invalid');
    keys.add(key);
    textBytes += Buffer.byteLength(r.text);
  }
  if (textBytes > 4 * 1024 * 1024) fail('coretext_plan_invalid');
  const compiler = await fileIdentity(
    plan.compiler.path,
    plan.compiler.sha256,
    512 * 1024 * 1024,
    'coretext_compiler_changed',
  );
  await fs.access(compiler.path, constants.X_OK);
  const sdkPath = await fs.realpath(plan.sdk.path);
  if (!(await fs.stat(sdkPath)).isDirectory()) fail('coretext_sdk_invalid');
  const sdk = await fileIdentity(
    path.join(sdkPath, 'SDKSettings.json'),
    plan.sdk.settingsSha256,
    1024 * 1024,
    'coretext_sdk_changed',
  );
  const fonts = [];
  let fontBytes = 0;
  for (const f of plan.fonts) {
    const identity = await fileIdentity(
      f.path,
      f.sha256,
      128 * 1024 * 1024,
      'coretext_font_changed',
    );
    fontBytes += identity.bytes;
    fonts.push({ ...structuredClone(f), ...identity });
  }
  if (fontBytes > 256 * 1024 * 1024) fail('coretext_font_limit');
  const parent = path.dirname(plan.output),
    parentStat = await fs.lstat(parent);
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail('output_parent_invalid');
  try {
    await fs.lstat(plan.output);
    fail('output_exists');
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const scratch = await fs.mkdtemp(path.join(parent, '.architecture-coretext-'));
  try {
    const helper = await fs.readFile(new URL('./coretext.swift', import.meta.url));
    const script = path.join(scratch, 'measure.swift'),
      executable = path.join(scratch, 'measure');
    await fs.writeFile(script, helper, { flag: 'wx' });
    const env = {
      HOME: scratch,
      PATH: path.dirname(plan.compiler.path),
      TMPDIR: scratch,
      TMP: scratch,
      TEMP: scratch,
      LANG: 'C.UTF-8',
      SDKROOT: sdkPath,
    };
    const compiled = spawnSync(
      plan.compiler.path,
      [
        '-sdk',
        sdkPath,
        '-module-cache-path',
        path.join(scratch, 'module-cache'),
        script,
        '-o',
        executable,
      ],
      {
        cwd: scratch,
        env,
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    if (compiled.error || compiled.status !== 0) {
      const error = Object.assign(new Error('coretext_compile_failed'), {
        code: 'coretext_compile_failed',
        diagnostics: (compiled.stderr ?? '').slice(-4000),
      });
      throw error;
    }
    const response = spawnSync(executable, [], {
      cwd: scratch,
      env: { ...env, PATH: scratch },
      input: JSON.stringify({ fonts, requests }),
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (response.error)
      fail(
        response.error.code === 'ETIMEDOUT'
          ? 'coretext_execution_timeout'
          : 'coretext_execution_failed',
      );
    let measured;
    try {
      measured = JSON.parse(response.stdout);
    } catch {
      fail('coretext_response_invalid');
    }
    if (response.status !== 0 || measured.status !== 'measured')
      fail(measured.code ?? 'coretext_measurement_failed');
    if (!Array.isArray(measured.observations) || measured.observations.length !== requests.length)
      fail('coretext_response_invalid');
    const observations = measured.observations.map((o, i) => {
      if (!fields(o, ['fonts', 'metric']) || !Array.isArray(o.fonts) || !o.fonts.length)
        fail('coretext_response_invalid');
      const primary = fonts.find((f) => f.id === requests[i].font);
      const selected = new Set([primary.id, ...primary.cascade]);
      return {
        ...o,
        fonts: o.fonts.map((f) => {
          if (!fields(f, ['id', 'path', 'postscript'])) fail('coretext_response_invalid');
          const bound = fonts.find((x) => x.id === f.id);
          if (
            !bound ||
            !selected.has(f.id) ||
            bound.path !== f.path ||
            bound.postscript !== f.postscript
          )
            fail('coretext_font_unbound');
          return { ...f, sha256: bound.sha256 };
        }),
      };
    });
    const metrics = {
      schema: 'architecture.text-metrics/v1',
      provenance: {
        method: 'recorded',
        environment: 'CoreText measured data; reading this table later is not fresh execution',
        fonts: fonts.map((f) => f.postscript + ':' + f.sha256),
      },
      records: requests.map((r, i) => [
        JSON.stringify([r.text, r.size, r.font]),
        observations[i].metric,
      ]),
    };
    createMetricReader(metrics);
    await fileIdentity(
      plan.compiler.path,
      compiler.sha256,
      512 * 1024 * 1024,
      'coretext_compiler_changed',
    );
    await fileIdentity(
      path.join(sdkPath, 'SDKSettings.json'),
      sdk.sha256,
      1024 * 1024,
      'coretext_sdk_changed',
    );
    for (const f of fonts)
      await fileIdentity(f.path, f.sha256, 128 * 1024 * 1024, 'coretext_font_changed');
    const result = {
      status: 'measured',
      freshMeasurement: 'performed',
      requestCount: requests.length,
      compiler,
      sdk,
      helperSha256: sha(helper),
      fonts,
      observations,
      metricsSha256: sha(encode(metrics)),
      browserAcceptance: 'not-performed',
      semanticAcceptance: 'not-performed',
      scope:
        'Fresh CoreText run with explicit font identities. Compiler bytes and SDK settings are checked, not the complete operating-system/SDK closure.',
    };
    const output = await writeSourceBundle(
      plan.output,
      {
        id: 'coretext:measurements',
        revision: sha(encode({ requests, fonts, compiler, sdk, helper: sha(helper) })),
      },
      [
        { path: 'metrics.json', content: encode(metrics) },
        { path: 'observation.json', content: encode(result) },
      ],
    );
    return { ...result, output };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
