import { createHash } from 'node:crypto';
import { validateEditionProject } from '../edition/authoring.mjs';
import { importLikeC4Native } from '../semantics/native-likec4.mjs';
import { resolveLikeC4Selection } from '../semantics/native-selection.mjs';
import { deepFreeze } from '../semantics/document.mjs';
import { canonical, parseStrictJson } from '../source/json.mjs';
import { fail, isDigest } from '../source/manifest.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Compile only the Edition's selected native meaning, not a Candidate or approval. */
export async function compileEditionNativeSelections(input) {
  const lock = input?.lock;
  if (
    lock?.schema !== 'architecture.materialized-input-lock/v1' ||
    !Array.isArray(lock.sources) ||
    !Array.isArray(input.limits) ||
    input.limits.some((limit) => typeof limit !== 'string' || !limit) ||
    !isDigest(input.lockSha256) ||
    typeof input.readEdition !== 'function' ||
    typeof input.readSource !== 'function' ||
    sha(Buffer.from(canonical(lock))) !== input.lockSha256
  )
    fail('edition_native_input_invalid');

  const editionBytes = input.readEdition();
  if (!Buffer.isBuffer(editionBytes) || sha(editionBytes) !== lock.edition?.sha256)
    fail('edition_native_input_invalid');
  const project = validateEditionProject(
    parseStrictJson(
      editionBytes,
      'materialized_edition_json_invalid',
      'materialized_edition_json_duplicate_key',
    ),
  );
  if (project.id !== lock.edition.id || project.editor !== lock.edition.editor)
    fail('edition_native_input_invalid');

  const sources = new Map(lock.sources.map((source) => [source.namespace, source]));
  if (
    sources.size !== lock.sources.length ||
    sources.size !== project.scope.sourceNamespaces.length ||
    project.scope.sourceNamespaces.some((namespace) => !sources.has(namespace))
  )
    fail('edition_native_input_invalid');
  for (const source of lock.sources) {
    const format = source.format;
    if (format?.id !== 'likec4/dsl' || format.version !== 'unversioned')
      fail('native_format_unadmitted');
  }

  const index = await importLikeC4Native({ lock, readSource: input.readSource });
  const selections = project.scope.selections.map((selection) =>
    resolveLikeC4Selection(index, selection),
  );
  const semanticDigest = sha(Buffer.from(canonical(selections)));
  return deepFreeze({
    subjectLockSha256: input.lockSha256,
    semanticDigest,
    selections,
    nativeClosure: index.closure,
    parserSupply: index.parserSupply,
    limits: [...new Set([...input.limits, ...index.semanticLimits])],
  });
}
