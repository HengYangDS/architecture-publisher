import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fail, hasExactFields as fields } from '../protocol/values.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { measureCoreTextBytes, validateCoreTextPlan } from '../../renderers/svg/coretext.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');

/** Package an explicit CoreText observation only after measurement succeeds. */
export async function measureTypographyBundle(plan) {
  if (process.platform !== 'darwin') fail('coretext_platform_unsupported');
  if (!fields(plan, ['compiler', 'sdk', 'fonts', 'requests', 'output']))
    fail('coretext_plan_invalid');
  if (typeof plan.output !== 'string' || !path.isAbsolute(plan.output))
    fail('coretext_plan_invalid');
  validateCoreTextPlan({
    compiler: plan.compiler,
    sdk: plan.sdk,
    fonts: plan.fonts,
    requests: plan.requests,
    scratchRoot: path.dirname(plan.output),
  });
  let selected;
  try {
    selected = structuredClone(plan);
  } catch {
    fail('coretext_plan_invalid');
  }
  const parent = path.dirname(selected.output);
  const { output, ...selection } = selected;
  const parentStat = await fs.lstat(parent);
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail('output_parent_invalid');
  try {
    await fs.lstat(output);
    fail('output_exists');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const measured = await measureCoreTextBytes({ ...selection, scratchRoot: parent });
  const { result, metricsBytes, requests } = measured;
  const revision = sha(
    encode({
      requests,
      fonts: result.fonts,
      compiler: result.compiler,
      sdk: result.sdk,
      helper: result.helperSha256,
    }),
  );
  const published = await writeSourceBundle(output, { id: 'coretext:measurements', revision }, [
    { path: 'metrics.json', content: metricsBytes },
    { path: 'observation.json', content: encode(result) },
  ]);
  return { ...result, output: published };
}
