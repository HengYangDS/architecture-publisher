import path from 'node:path';
import { createHash } from 'node:crypto';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { exact, text, semanticError } from './document.mjs';
import { compileSemanticChange } from './change.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function selectedJSON(file, digest, kind, limit) {
  if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest))
    semanticError('semantic_' + kind + '_digest_required');
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, limit);
  if (sha(bytes) !== digest)
    semanticError('semantic_' + kind + '_digest_mismatch');
  try {
    return JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    );
  } catch {
    semanticError('semantic_json_invalid');
  }
}

/** Read only explicitly selected bytes; the returned obligations are not effects. */
export async function compareSemanticInput(file, digest) {
  const planPath = path.resolve(file);
  const plan = await selectedJSON(planPath, digest, 'plan', 1024 * 1024);
  if (
    !exact(plan, ['schema', 'before', 'after', 'views', 'correspondences']) ||
    plan.schema !== 'architecture.semantic-compare-input/v2'
  )
    semanticError('semantic_plan_invalid');
  const documents = [];
  for (const selection of [plan.before, plan.after]) {
    if (!exact(selection, ['path', 'sha256']) || !text(selection.path))
      semanticError('semantic_plan_invalid');
    documents.push(
      await selectedJSON(
        path.resolve(path.dirname(planPath), selection.path),
        selection.sha256,
        'document',
        16 * 1024 * 1024,
      ),
    );
  }
  return compileSemanticChange(
    documents[0],
    documents[1],
    plan.views,
    plan.correspondences,
  );
}
