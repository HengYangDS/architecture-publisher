import { createHash } from 'node:crypto';
import path from 'node:path';
import { compileNativeEditionEvolution } from '../edition/evolution.mjs';
import { compareEditionInput } from '../edition/input.mjs';
import { readBuildRequestSelection } from '../edition/materialize.mjs';
import { materializeBuildRequestInput } from '../provider/build-request.mjs';
import { readSelectedProviderManifest } from '../provider/manifest.mjs';
import { exact, semanticError, text } from '../semantics/document.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { parseStrictJson } from '../source/json.mjs';
import { isDigest, portablePath } from '../source/manifest.mjs';
import { compileEditionMeaning } from './meaning.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function selectedPlan(file, digest) {
  if (!isDigest(digest)) semanticError('semantic_plan_digest_required');
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, 1024 * 1024);
  if (sha(bytes) !== digest) semanticError('semantic_plan_digest_mismatch');
  return parseStrictJson(bytes, 'semantic_plan_json_invalid', 'semantic_plan_json_duplicate_key');
}

async function selectedNativeSide(planPath, value) {
  const selected = value?.request;
  if (
    !exact(value, ['request']) ||
    !exact(selected, ['path', 'sha256']) ||
    !text(selected.path) ||
    !isDigest(selected.sha256)
  )
    semanticError('semantic_plan_invalid');
  try {
    portablePath(selected.path);
  } catch {
    semanticError('semantic_plan_invalid');
  }
  const requestPath = path.resolve(path.dirname(planPath), ...selected.path.split('/'));
  const { request, root } = await readBuildRequestSelection(requestPath, selected.sha256);
  for (const selection of request.providers) {
    const manifestPath = path.resolve(root, ...selection.manifest.split('/'));
    const { manifest } = await readSelectedProviderManifest(manifestPath, selection.sha256);
    if (manifest.delivery.kind !== 'declarative')
      semanticError('semantic_native_provider_comparison_unadmitted');
  }
  const materialized = await materializeBuildRequestInput(requestPath, selected.sha256);
  return { lock: materialized.lock, meaning: await compileEditionMeaning(materialized) };
}

/** Route one selected evolution plan through the existing Claim Model or native owner. */
export async function compareEvolutionInput(file, digest) {
  const planPath = path.resolve(file);
  const plan = await selectedPlan(planPath, digest);
  if (plan.schema !== 'architecture.semantic-compare-input/v3')
    return compareEditionInput(planPath, digest);
  if (!exact(plan, ['schema', 'before', 'after'])) semanticError('semantic_plan_invalid');
  return compileNativeEditionEvolution({
    before: await selectedNativeSide(planPath, plan.before),
    after: await selectedNativeSide(planPath, plan.after),
  });
}
