import { createHash } from 'node:crypto';
import { deepFreeze, normalizedClaimModel, record, text } from './document.mjs';
import { parseStrictJson } from '../source/json.mjs';
import { fail, isDigest } from '../source/manifest.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const format = 'architecture.claim-model/v2';
const originFor = (source) => ({ namespace: source.namespace, sha256: source.sha256 });

/** Import exact selected Claim Model bytes without endorsing internal provenance. */
export function importClaimModel(source, content, sourceClass) {
  if (
    !record(source) ||
    !text(source.namespace) ||
    !isDigest(source.sha256) ||
    source.format?.id !== 'architecture.claim-model' ||
    source.format?.version !== '2' ||
    !['native', 'derived'].includes(sourceClass) ||
    !Buffer.isBuffer(content)
  )
    fail('native_claim_model_input_invalid');
  if (sha(content) !== source.sha256) fail('native_claim_model_digest_mismatch');
  const model = normalizedClaimModel(
    parseStrictJson(
      content,
      'native_claim_model_json_invalid',
      'native_claim_model_json_duplicate_key',
    ),
  );
  return deepFreeze({
    source: structuredClone(source),
    sourceClass,
    model,
    semanticLimits: ['claim-model-provenance-unverified'],
  });
}

/** Resolve one model ID; claim fields remain typed rather than becoming an edge. */
export function resolveClaimModelSelection(imported, selection) {
  if (
    !record(imported) ||
    !record(imported.model) ||
    !record(imported.source) ||
    !record(selection) ||
    !text(selection.id) ||
    selection.namespace !== imported.source.namespace
  )
    fail('native_claim_model_reference_invalid');
  if (selection.kind === 'query') fail('native_claim_model_query_unadmitted');
  const match =
    selection.kind === 'reference' && typeof selection.reference === 'string'
      ? /^(entity|relation|claim):([^\s].*)$/u.exec(selection.reference)
      : null;
  if (!match) fail('native_claim_model_reference_invalid');
  const [, kind, id] = match;
  const section = { entity: 'entities', relation: 'relations', claim: 'claims' }[kind];
  const item = imported.model[section]?.[id];
  if (!item) fail('native_claim_model_reference_unselected');
  const origin = originFor(imported.source);
  const element = (entityId) => ({
    id: entityId,
    namespace: origin.namespace,
    sha256: origin.sha256,
    kind: imported.model.entities[entityId].type,
    label: imported.model.entities[entityId].label,
    qualifiers: structuredClone(imported.model.entities[entityId].qualifiers),
    provenance: [...imported.model.entities[entityId].provenance],
    origin: structuredClone(origin),
  });
  const entityIds =
    kind === 'entity'
      ? [id]
      : kind === 'relation'
        ? [item.subject, item.object]
        : [item.subject, ...(item.object === null ? [] : [item.object])];
  const elements = [...new Set(entityIds)].sort().map(element);
  const relations =
    kind === 'relation'
      ? [
          {
            id,
            identityScope: 'claim-model-id',
            from: { namespace: origin.namespace, id: item.subject },
            to: { namespace: origin.namespace, id: item.object },
            kind: item.type,
            qualifiers: structuredClone(item.qualifiers),
            provenance: [...item.provenance],
            origin: structuredClone(origin),
          },
        ]
      : [];
  const claims = kind === 'claim' ? [{ id, ...structuredClone(item), origin }] : [];
  const predicate =
    kind === 'claim' ? structuredClone(imported.model.vocabulary.predicates[item.predicate]) : null;
  const sourceIds = new Set([
    ...elements.flatMap(({ provenance }) => provenance),
    ...relations.flatMap(({ provenance }) => provenance),
    ...claims.flatMap(({ provenance }) => provenance),
    ...(predicate?.provenance ?? []),
  ]);
  const provenanceSources = Object.fromEntries(
    [...sourceIds]
      .sort()
      .map((sourceId) => [sourceId, structuredClone(imported.model.sources[sourceId])]),
  );
  return deepFreeze({
    format,
    selectionId: selection.id,
    sourceClass: imported.sourceClass,
    sourceOwner: imported.model.owner,
    source: structuredClone(imported.source),
    target: { kind, id, identityScope: 'claim-model-id', origin: structuredClone(origin) },
    members: { elements, relations, claims },
    ...(predicate === null ? {} : { predicate }),
    provenanceSources,
    limits: [
      ...imported.semanticLimits,
      ...(kind === 'claim' && item.coverage === 'unknown' ? [`claim-coverage-unknown:${id}`] : []),
    ],
  });
}
