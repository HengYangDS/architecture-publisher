import { createHash } from 'node:crypto';
import { validateEditionProject } from '../edition/authoring.mjs';
import { importLikeC4Native } from '../semantics/native-likec4.mjs';
import { resolveLikeC4Selection } from '../semantics/native-selection.mjs';
import { importClaimModel, resolveClaimModelSelection } from '../semantics/native-claim-model.mjs';
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
    !Array.isArray(lock.derived) ||
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
  const derived = new Map(lock.derived.map((projection) => [projection.namespace, projection]));
  const addressedProjections = (project.scope.projectionNamespaces ?? []).map((namespace) =>
    derived.get(namespace),
  );
  if (
    sources.size !== lock.sources.length ||
    derived.size !== lock.derived.length ||
    [...derived.keys()].some((namespace) => sources.has(namespace)) ||
    sources.size !== project.scope.sourceNamespaces.length ||
    project.scope.sourceNamespaces.some((namespace) => !sources.has(namespace)) ||
    addressedProjections.some((projection) => projection === undefined)
  )
    fail('edition_native_input_invalid');
  const claimFormat = (format) =>
    format?.id === 'architecture.claim-model' && format.version === '2';
  const likeFormat = (format) => format?.id === 'likec4/dsl' && format.version === 'unversioned';
  if (
    addressedProjections.some(
      (projection) =>
        !Array.isArray(projection.derivedFrom) ||
        !projection.derivedFrom.length ||
        new Set(projection.derivedFrom.map((item) => item?.namespace)).size !==
          projection.derivedFrom.length,
    )
  )
    fail('edition_native_input_invalid');
  const ancestor = new Set(
    addressedProjections.flatMap((projection) =>
      projection.derivedFrom.map((item) => item?.namespace),
    ),
  );
  for (const source of lock.sources) {
    if (
      !likeFormat(source.format) &&
      !claimFormat(source.format) &&
      !ancestor.has(source.namespace)
    )
      fail('native_format_unadmitted');
  }
  if (addressedProjections.some((projection) => !claimFormat(projection.format)))
    fail('native_format_unadmitted');
  for (const projection of addressedProjections) {
    for (const ancestor of projection.derivedFrom) {
      const source = sources.get(ancestor?.namespace);
      if (!source || source.sha256 !== ancestor.sha256) fail('edition_native_input_invalid');
      const bytes = input.readSource(source.namespace);
      if (!Buffer.isBuffer(bytes) || sha(bytes) !== source.sha256)
        fail('native_claim_model_ancestor_digest_mismatch');
    }
  }

  const likeIndex = lock.sources.some((source) => likeFormat(source.format))
    ? await importLikeC4Native({ lock, readSource: input.readSource })
    : null;
  const claimModels = new Map();
  for (const source of lock.sources)
    if (claimFormat(source.format))
      claimModels.set(
        source.namespace,
        importClaimModel(source, input.readSource(source.namespace), 'native'),
      );
  for (const projection of addressedProjections) {
    if (typeof input.readDerived !== 'function') fail('edition_native_input_invalid');
    claimModels.set(
      projection.namespace,
      importClaimModel(projection, input.readDerived(projection), 'derived'),
    );
  }

  const selections = project.scope.selections.map((selection) => {
    if (claimModels.has(selection.namespace)) {
      const imported = claimModels.get(selection.namespace);
      try {
        return resolveClaimModelSelection(imported, selection);
      } catch (error) {
        if (error?.code === 'native_claim_model_reference_unselected')
          error.diagnostics = [
            {
              code: error.code,
              severity: 'error',
              message: 'Selected Claim Model reference is absent from the bound model.',
              predicate: 'selected-reference-resolves',
              subject: {
                kind: 'edition-source-reference',
                editionId: project.id,
                editionSha256: lock.edition.sha256,
                selectionId: selection.id,
                namespace: selection.namespace,
                reference: selection.reference,
                sourceSha256: imported.source.sha256,
              },
              responsibility: { role: 'edition-editor', declaredOwner: project.editor },
              evidence: {},
              supportedFixes: [],
            },
          ];
        throw error;
      }
    }
    if (sources.has(selection.namespace) && likeFormat(sources.get(selection.namespace).format))
      return resolveLikeC4Selection(likeIndex, selection);
    fail('native_format_unadmitted');
  });
  const semanticDigest = sha(Buffer.from(canonical(selections)));
  return deepFreeze({
    subjectLockSha256: input.lockSha256,
    semanticDigest,
    selections,
    nativeClosure: likeIndex
      ? claimModels.size
        ? 'mixed-selected-models-unqualified'
        : likeIndex.closure
      : 'selected-model-bytes-only',
    parserSupply: likeIndex?.parserSupply ?? null,
    limits: [
      ...new Set([
        ...input.limits,
        ...(likeIndex?.semanticLimits ?? []),
        ...[...claimModels.values()].flatMap(({ semanticLimits }) => semanticLimits),
        ...selections.flatMap(({ limits }) => limits),
      ]),
    ],
  });
}
