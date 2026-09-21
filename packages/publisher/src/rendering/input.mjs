import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';

function inputError(code) {
  throw Object.assign(new Error(code), { code });
}

async function selectedJson(file, maximum, code) {
  const selected = path.resolve(file);
  await noSymlinkAncestors(selected);
  const bytes = await regularBytes(selected, maximum);
  try {
    return {
      base: path.dirname(selected),
      value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)),
    };
  } catch {
    inputError(code);
  }
}

/** Adapt explicit diagram input to the bundled interactive renderer. */
export async function renderInteractiveInput(type, input, inputSha256, output) {
  const { renderDiagram } = await import('../../renderers/archify/index.mjs');
  return renderDiagram({
    type,
    input: path.resolve(input),
    inputSha256,
    output: path.resolve(output),
  });
}

/** Adapt an explicit raster request without exposing a renderer-vendor command. */
export async function renderRasterInput(file) {
  const { rasterize } = await import('../../renderers/resvg/index.mjs');
  const { base, value: plan } = await selectedJson(file, 1024 * 1024, 'raster_plan_invalid');
  for (const key of ['manifest', 'output']) {
    if (typeof plan?.[key] !== 'string' || !plan[key]) inputError('raster_plan_invalid');
    plan[key] = path.resolve(base, plan[key]);
  }
  return rasterize(plan);
}

/** Measure explicitly selected typography inputs through the native backend. */
export async function measureTypographyInput(file) {
  const { measureCoreText } = await import('../../renderers/svg/coretext.mjs');
  const { base, value: plan } = await selectedJson(
    file,
    8 * 1024 * 1024,
    'measurement_plan_invalid',
  );
  const resolve = (value) => {
    if (typeof value !== 'string' || !value) inputError('measurement_plan_invalid');
    return path.resolve(base, value);
  };
  if (!plan?.compiler || !plan?.sdk || !Array.isArray(plan.fonts))
    inputError('measurement_plan_invalid');
  plan.compiler.path = resolve(plan.compiler.path);
  plan.sdk.path = resolve(plan.sdk.path);
  plan.output = resolve(plan.output);
  for (const font of plan.fonts) {
    if (!font || typeof font !== 'object') inputError('measurement_plan_invalid');
    font.path = resolve(font.path);
  }
  return measureCoreText(plan);
}
