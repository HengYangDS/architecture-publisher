import path from 'node:path';
import { createHash } from 'node:crypto';
import { noSymlinkAncestors, regularBytes } from '../file-input/read.mjs';
import { LIMITS } from '../file-input/contract.mjs';
import { fail, hasExactFields as fields, isDigest } from '../protocol/values.mjs';
import { validateManifest } from './manifest.mjs';
import { writeSourceBundle } from './write.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Package explicit file bytes; selection does not authorize code or publication. */
export async function packSourceFiles(planPath, expectedSha256) {
  if (!isDigest(expectedSha256)) fail('pack_plan_digest_required');
  if (typeof planPath !== 'string' || !planPath) fail('pack_plan_path_required');
  const file = path.resolve(planPath);
  await noSymlinkAncestors(file);
  const raw = await regularBytes(file, LIMITS.manifestBytes);
  if (sha(raw) !== expectedSha256) fail('pack_plan_digest_mismatch');
  let plan;
  try {
    plan = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  } catch {
    fail('pack_plan_json_invalid');
  }
  if (
    !fields(plan, ['schema', 'source', 'files', 'output']) ||
    plan.schema !== 'architecture.pack-input/v1' ||
    !Array.isArray(plan.files) ||
    typeof plan.output !== 'string' ||
    !plan.output ||
    plan.files.some(
      (row) =>
        !fields(row, ['input', 'path', 'bytes', 'sha256']) ||
        typeof row.input !== 'string' ||
        !row.input,
    )
  )
    fail('pack_plan_invalid');
  const manifest = validateManifest({
    schema: 'architecture.source-bundle/v1',
    source: plan.source,
    files: plan.files.map(({ input, ...row }) => row),
  });
  const members = [];
  for (const row of plan.files) {
    const input = path.resolve(path.dirname(file), row.input);
    await noSymlinkAncestors(input);
    const content = await regularBytes(input, LIMITS.memberBytes);
    if (content.length !== row.bytes) fail('member_size_mismatch');
    if (sha(content) !== row.sha256) fail('member_digest_mismatch');
    members.push({ path: row.path, content });
  }
  const written = await writeSourceBundle(
    path.resolve(path.dirname(file), plan.output),
    manifest.source,
    members,
  );
  return {
    status: 'packed',
    ...written,
    source: manifest.source,
    scope: 'selected-file-packaging',
    semanticAcceptance: 'not-performed',
    officialReplay: 'not-performed',
  };
}
