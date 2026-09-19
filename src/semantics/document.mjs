import { createHash } from 'node:crypto';

export const SECTIONS = Object.freeze([
  'entities',
  'relations',
  'assertions',
  'sources',
  'context',
  'vocabulary',
]);
export const semanticError = (code, detail = '') => {
  throw Object.assign(new Error(code + (detail ? ': ' + detail : '')), {
    code,
  });
};
export const record = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
export const text = (value) =>
  typeof value === 'string' && Boolean(value.trim());
export const exact = (value, keys) =>
  record(value) &&
  Object.keys(value).sort().join('\n') === [...keys].sort().join('\n');
export const strings = (values, nonempty = false) =>
  Array.isArray(values) &&
  (!nonempty || values.length > 0) &&
  values.every(text) &&
  new Set(values).size === values.length;
export const referenceKey = ({ section, id }) =>
  JSON.stringify([section, id]);
export const validReference = (value) =>
  exact(value, ['section', 'id']) &&
  SECTIONS.includes(value.section) &&
  text(value.id);

/** Canonical JSON preserves array order; only declared sets are normalized below. */
export function canonical(value) {
  if (value === null || typeof value !== 'object')
    return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return (
    '{' +
    Object.keys(value)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + canonical(value[k]))
      .join(',') +
    '}'
  );
}

export function jsonValue(
  value,
  depth = 0,
  ancestors = new Set(),
  budget = { nodes: 0, bytes: 0 },
) {
  budget.nodes++;
  budget.bytes += typeof value === 'string' ? Buffer.byteLength(value) : 8;
  if (budget.nodes > 500000 || budget.bytes > 16 * 1024 * 1024)
    semanticError('semantic_size_exceeded');
  if (depth > 64) semanticError('semantic_depth_exceeded');
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  )
    return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (!Array.isArray(value) && !record(value))
    semanticError('semantic_json_required');
  if (ancestors.has(value)) semanticError('semantic_json_cycle');
  ancestors.add(value);
  if (Object.getOwnPropertySymbols(value).length)
    semanticError('semantic_json_required');
  for (const [key, entry] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key))
      semanticError('semantic_key_forbidden');
    budget.bytes += Buffer.byteLength(key);
    jsonValue(entry, depth + 1, ancestors, budget);
  }
  if (
    Array.isArray(value) &&
    (Object.keys(value).length !== value.length ||
      Object.keys(value).some((key, index) => key !== String(index)))
  )
    semanticError('semantic_json_required');
  ancestors.delete(value);
}

/** Admission is structural and source-bound, not a proof of natural-language truth. */
export function validateSemanticDocument(doc) {
  jsonValue(doc);
  if (
    !exact(doc, ['schema', 'owner', ...SECTIONS]) ||
    doc.schema !== 'architecture.semantic-document/v1' ||
    !text(doc.owner)
  )
    semanticError('semantic_document_invalid');
  if (
    !exact(doc.vocabulary, ['entities', 'relations']) ||
    !strings(doc.vocabulary.entities) ||
    !strings(doc.vocabulary.relations)
  )
    semanticError('semantic_vocabulary_invalid');
  for (const section of SECTIONS) {
    if (
      !record(doc[section]) ||
      Object.keys(doc[section]).some((id) => !text(id))
    )
      semanticError('semantic_section_invalid', section);
  }
  if (
    SECTIONS.reduce((n, key) => n + Object.keys(doc[key]).length, 0) >
      20000 ||
    Buffer.byteLength(canonical(doc)) > 16 * 1024 * 1024
  )
    semanticError('semantic_size_exceeded');
  if (!Object.keys(doc.sources).length)
    semanticError('semantic_provenance_required');
  for (const source of Object.values(doc.sources)) {
    if (
      !exact(source, ['sha256', 'locator', 'authority']) ||
      typeof source.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(source.sha256) ||
      !text(source.locator) ||
      !text(source.authority)
    )
      semanticError('semantic_source_invalid');
  }
  const provenance = (refs) => {
    if (
      !strings(refs, true) ||
      refs.some((id) => !Object.hasOwn(doc.sources, id))
    )
      semanticError('semantic_provenance_invalid');
  };
  const endpoint = (id) => text(id) && Object.hasOwn(doc.entities, id);
  for (const entity of Object.values(doc.entities)) {
    if (
      !exact(entity, ['type', 'label', 'qualifiers', 'provenance']) ||
      !doc.vocabulary.entities.includes(entity.type) ||
      !text(entity.label) ||
      !record(entity.qualifiers)
    )
      semanticError('semantic_entity_invalid');
    provenance(entity.provenance);
  }
  for (const relation of Object.values(doc.relations)) {
    if (
      !exact(relation, [
        'type',
        'subject',
        'object',
        'qualifiers',
        'provenance',
      ]) ||
      !doc.vocabulary.relations.includes(relation.type) ||
      !endpoint(relation.subject) ||
      !endpoint(relation.object) ||
      !record(relation.qualifiers)
    )
      semanticError('semantic_relation_invalid');
    provenance(relation.provenance);
  }
  const propositions = new Map();
  for (const [id, assertion] of Object.entries(doc.assertions).sort()) {
    if (
      !exact(assertion, [
        'value',
        'proposition',
        'dependsOn',
        'coverage',
        'provenance',
      ]) ||
      !['complete', 'unknown'].includes(assertion.coverage) ||
      !Array.isArray(assertion.dependsOn)
    )
      semanticError('semantic_assertion_invalid', id);
    provenance(assertion.provenance);
    const refs = new Set();
    for (const ref of assertion.dependsOn) {
      if (
        !validReference(ref) ||
        !Object.hasOwn(doc[ref.section], ref.id) ||
        refs.has(referenceKey(ref))
      )
        semanticError('semantic_dependency_invalid', id);
      refs.add(referenceKey(ref));
    }
    const p = assertion.proposition;
    if (p === null) {
      if (assertion.coverage !== 'unknown')
        semanticError('semantic_opaque_coverage', id);
      continue;
    }
    if (
      !exact(p, [
        'subject',
        'predicate',
        'object',
        'polarity',
        'qualifiers',
      ]) ||
      !endpoint(p.subject) ||
      !endpoint(p.object) ||
      !doc.vocabulary.relations.includes(p.predicate) ||
      !['positive', 'negative'].includes(p.polarity) ||
      !record(p.qualifiers)
    )
      semanticError('semantic_proposition_invalid', id);
    const { polarity, ...meaning } = p,
      key = canonical(meaning),
      prior = propositions.get(key);
    if (prior && prior.polarity !== polarity)
      semanticError('semantic_contradiction', prior.id + ', ' + id);
    propositions.set(key, { id, polarity });
  }
  return doc;
}

export function normalizedDocument(doc) {
  validateSemanticDocument(doc);
  const result = structuredClone(doc);
  for (const key of ['entities', 'relations']) result.vocabulary[key].sort();
  for (const key of ['entities', 'relations', 'assertions'])
    for (const item of Object.values(result[key])) item.provenance.sort();
  for (const item of Object.values(result.assertions))
    item.dependsOn.sort((a, b) =>
      referenceKey(a) < referenceKey(b)
        ? -1
        : referenceKey(a) > referenceKey(b)
          ? 1
          : 0,
    );
  return result;
}

export function semanticDigest(doc) {
  return createHash('sha256')
    .update(canonical(normalizedDocument(doc)))
    .digest('hex');
}
