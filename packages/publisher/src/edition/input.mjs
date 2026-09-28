import path from 'node:path';
import { createHash } from 'node:crypto';
import { noSymlinkAncestors, regularBytes } from '../file-input/read.mjs';
import { exact, text, semanticError } from '../semantics/document.mjs';
import { compileEditionEvolution } from './evolution.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function selectedJson(file, digest, kind, limit) {
  if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest))
    semanticError('semantic_' + kind + '_digest_required');
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, limit);
  if (sha(bytes) !== digest) semanticError('semantic_' + kind + '_digest_mismatch');
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    semanticError('semantic_' + kind + '_json_invalid');
  }
}

const selection = (value) => exact(value, ['path', 'sha256']) && text(value.path);

async function selectedSide(planPath, value) {
  if (
    !exact(value, ['claimModel', 'editions']) ||
    !selection(value.claimModel) ||
    !Array.isArray(value.editions) ||
    value.editions.length > 256 ||
    value.editions.some((edition) => !selection(edition))
  )
    semanticError('semantic_plan_invalid');
  const resolve = (file) => path.resolve(path.dirname(planPath), file),
    claimModel = await selectedJson(
      resolve(value.claimModel.path),
      value.claimModel.sha256,
      'document',
      16 * 1024 * 1024,
    ),
    editions = [];
  for (const edition of value.editions)
    editions.push(
      await selectedJson(resolve(edition.path), edition.sha256, 'edition', 4 * 1024 * 1024),
    );
  return { claimModel, editions };
}

/** Read exact selected Claim Models and Editions; compilation performs no effects. */
export async function compareEditionInput(file, digest) {
  const planPath = path.resolve(file),
    plan = await selectedJson(planPath, digest, 'plan', 1024 * 1024);
  if (
    !exact(plan, ['schema', 'before', 'after', 'correspondences']) ||
    plan.schema !== 'architecture.semantic-compare-input/v2' ||
    !Array.isArray(plan.correspondences)
  )
    semanticError('semantic_plan_invalid');
  return compileEditionEvolution({
    before: await selectedSide(planPath, plan.before),
    after: await selectedSide(planPath, plan.after),
    correspondences: plan.correspondences,
  });
}
