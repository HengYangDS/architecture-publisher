import { createHash } from 'node:crypto';

/** @internal Schema test seam; the JSON contract remains the public boundary. */
export const CLAIM_PLANES = Object.freeze([
  'intended',
  'implemented',
  'observed',
  'governed',
  'published',
]);
export const CLAIM_MODEL_SECTIONS = Object.freeze([
  'entities',
  'relations',
  'claims',
  'sources',
  'context',
  'vocabulary',
]);
const CLAIM_FIELDS = Object.freeze([
  'subject',
  'predicate',
  'object',
  'value',
  'plane',
  'condition',
  'scope',
  'maturity',
  'validity',
  'dependsOn',
  'coverage',
  'provenance',
]);
const VALIDITIES = Object.freeze(['affirmed', 'refuted']);
const PREDICATE_VALUE_KINDS = Object.freeze(['entity', 'scalar', 'opaque']);
const PREDICATE_CARDINALITIES = Object.freeze(['single', 'multiple']);
const PREDICATE_FIELDS = Object.freeze([
  'valueKind',
  'cardinality',
  'values',
  'provenance',
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
const validClaimReference = (value) =>
  exact(value, ['section', 'id']) &&
  CLAIM_MODEL_SECTIONS.includes(value.section) &&
  value.section !== 'vocabulary' &&
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
  seen = null,
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
  if (seen?.has(value)) semanticError('semantic_json_alias');
  seen?.add(value);
  ancestors.add(value);
  if (Object.getOwnPropertySymbols(value).length)
    semanticError('semantic_json_required');
  const descriptors = Object.getOwnPropertyDescriptors(value),
    ownKeys = Object.getOwnPropertyNames(value),
    arrayKeys = Array.isArray(value)
      ? ownKeys.filter((key) => key !== 'length')
      : ownKeys;
  if (arrayKeys.length !== Object.keys(value).length)
    semanticError('semantic_json_required');
  for (const key of arrayKeys) {
    const descriptor = descriptors[key];
    if (
      !descriptor ||
      !descriptor.enumerable ||
      !Object.hasOwn(descriptor, 'value') ||
      Object.hasOwn(descriptor, 'get') ||
      Object.hasOwn(descriptor, 'set')
    )
      semanticError('semantic_json_required');
    if (['__proto__', 'constructor', 'prototype'].includes(key))
      semanticError('semantic_key_forbidden');
    budget.bytes += Buffer.byteLength(key);
    jsonValue(descriptor.value, depth + 1, ancestors, budget, seen);
  }
  if (
    Array.isArray(value) &&
    (Object.keys(value).length !== value.length ||
      Object.keys(value).some((key, index) => key !== String(index)))
  )
    semanticError('semantic_json_required');
  ancestors.delete(value);
}

function validateClaimModelTopLevel(model) {
  if (
    !exact(model, ['schema', 'owner', ...CLAIM_MODEL_SECTIONS]) ||
    model.schema !== 'architecture.claim-model/v2' ||
    !text(model.owner)
  )
    semanticError('semantic_document_invalid');
  if (
    !exact(model.vocabulary, [
      'entities',
      'relations',
      'predicates',
      'maturities',
    ]) ||
    !strings(model.vocabulary.entities) ||
    !strings(model.vocabulary.relations) ||
    !strings(model.vocabulary.maturities, true) ||
    !record(model.vocabulary.predicates)
  )
    semanticError('semantic_vocabulary_invalid');
  for (const predicate of Object.values(model.vocabulary.predicates))
    if (
      !exact(predicate, PREDICATE_FIELDS) ||
      !PREDICATE_VALUE_KINDS.includes(predicate.valueKind) ||
      !PREDICATE_CARDINALITIES.includes(predicate.cardinality) ||
      !strings(predicate.values) ||
      (predicate.valueKind === 'entity' && predicate.values.length) ||
      !strings(predicate.provenance, true)
    )
      semanticError('semantic_vocabulary_invalid');
  for (const section of CLAIM_MODEL_SECTIONS) {
    if (
      !record(model[section]) ||
      Object.keys(model[section]).some((id) => !text(id))
    )
      semanticError('semantic_section_invalid', section);
  }
  if (
    CLAIM_MODEL_SECTIONS.reduce(
      (count, section) => count + Object.keys(model[section]).length,
      0,
    ) > 20000 ||
    Buffer.byteLength(canonical(model)) > 16 * 1024 * 1024
  )
    semanticError('semantic_size_exceeded');
}

function validateClaimModelSources(model) {
  if (!Object.keys(model.sources).length)
    semanticError('semantic_provenance_required');
  for (const source of Object.values(model.sources)) {
    if (
      !exact(source, ['sha256', 'locator', 'authority']) ||
      typeof source.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(source.sha256) ||
      !text(source.locator) ||
      !text(source.authority)
    )
      semanticError('semantic_source_invalid');
  }
  for (const predicate of Object.values(model.vocabulary.predicates))
    validateClaimProvenance(model, predicate.provenance);
}

function validateClaimProvenance(model, references) {
  if (
    !strings(references, true) ||
    references.some((id) => !Object.hasOwn(model.sources, id))
  )
    semanticError('semantic_provenance_invalid');
}

function validateClaimStructure(model) {
  const endpoint = (id) => text(id) && Object.hasOwn(model.entities, id);
  for (const entity of Object.values(model.entities)) {
    if (
      !exact(entity, ['type', 'label', 'qualifiers', 'provenance']) ||
      !model.vocabulary.entities.includes(entity.type) ||
      !text(entity.label) ||
      !record(entity.qualifiers)
    )
      semanticError('semantic_entity_invalid');
    validateClaimProvenance(model, entity.provenance);
  }
  for (const relation of Object.values(model.relations)) {
    if (
      !exact(relation, [
        'type',
        'subject',
        'object',
        'qualifiers',
        'provenance',
      ]) ||
      !model.vocabulary.relations.includes(relation.type) ||
      !endpoint(relation.subject) ||
      !endpoint(relation.object) ||
      !record(relation.qualifiers)
    )
      semanticError('semantic_relation_invalid');
    validateClaimProvenance(model, relation.provenance);
  }
  return endpoint;
}

function claimIdentity(claim, includeValidity) {
  return canonical({
    subject: claim.subject,
    predicate: claim.predicate,
    object: claim.object,
    value: claim.value,
    plane: claim.plane,
    condition: claim.condition,
    scope: claim.scope,
    maturity: claim.maturity,
    ...(includeValidity ? { validity: claim.validity } : {}),
  });
}

function contradictionSubject(claim) {
  return canonical({
    subject: claim.subject,
    predicate: claim.predicate,
    plane: claim.plane,
    maturity: claim.maturity,
  });
}

const claimTarget = (claim) => canonical([claim.object, claim.value]);

function incompatibleClaim(left, right, cardinality) {
  const sameTarget = claimTarget(left) === claimTarget(right);
  if (sameTarget) return left.validity !== right.validity;
  if (left.validity === 'refuted' || right.validity === 'refuted') return false;
  return cardinality === 'single';
}

function dependencyMatchesClaim(model, claim, reference) {
  if (reference.section === 'claims') return false;
  if (reference.section === 'entities') {
    if (reference.id === claim.subject) return true;
    return claim.object !== null && reference.id === claim.object;
  }
  if (reference.section === 'relations') {
    const relation = model.relations[reference.id];
    return (
      relation.type === claim.predicate &&
      relation.subject === claim.subject &&
      relation.object === claim.object
    );
  }
  return reference.section === 'sources';
}

function completeDependencyCoverage(model, claim, references) {
  if (claim.object === null)
    return references.some(
      (reference) =>
        reference.section === 'entities' && reference.id === claim.subject,
    );
  return references.some((reference) => {
    if (reference.section !== 'relations') return false;
    const relation = model.relations[reference.id];
    return (
      relation.type === claim.predicate &&
      relation.subject === claim.subject &&
      relation.object === claim.object
    );
  });
}

const valueAllowed = (predicate, value) =>
  predicate.values.length === 0 ||
  (typeof value === 'string' && predicate.values.includes(value));

const scalar = (value) =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value));

function validateApplicability(value, kind, claimId) {
  if (
    !record(value) ||
    Object.keys(value).some((key) => !text(key) || !scalar(value[key]))
  )
    semanticError('semantic_claim_' + kind + '_invalid', claimId);
}

const dimensionsOverlap = (left, right) =>
  Object.keys(left).every(
    (key) =>
      !Object.hasOwn(right, key) || canonical(left[key]) === canonical(right[key]),
  );

function applicabilityRelation(left, right) {
  const conditionsOverlap =
      dimensionsOverlap(left.condition, right.condition),
    scopesOverlap = dimensionsOverlap(left.scope, right.scope);
  if (!conditionsOverlap || !scopesOverlap) return 'disjoint';
  if (
    canonical(left.condition) === canonical(right.condition) &&
    canonical(left.scope) === canonical(right.scope)
  )
    return 'equal';
  return 'unknown-overlap';
}

function dependencySources(model, reference) {
  if (reference.section === 'sources') return [reference.id];
  return model[reference.section][reference.id].provenance ?? [];
}

function validateClaims(model, endpoint) {
  const identities = new Map(),
    positions = new Map();
  if (!Object.keys(model.claims).length) semanticError('semantic_claim_required');
  for (const id of Object.keys(model.claims).sort()) {
    const claim = model.claims[id],
      predicate = model.vocabulary.predicates[claim?.predicate];
    if (
      !exact(claim, CLAIM_FIELDS) ||
      !endpoint(claim.subject) ||
      !record(predicate) ||
      !CLAIM_PLANES.includes(claim.plane) ||
      !model.vocabulary.maturities.includes(claim.maturity) ||
      !VALIDITIES.includes(claim.validity) ||
      !['complete', 'unknown'].includes(claim.coverage) ||
      !Array.isArray(claim.dependsOn)
    )
      semanticError('semantic_claim_invalid', id);
    validateApplicability(claim.condition, 'condition', id);
    validateApplicability(claim.scope, 'scope', id);
    const hasObject = claim.object !== null,
      hasValue = claim.value !== null;
    if (hasObject === hasValue)
      semanticError('semantic_claim_object_or_value', id);
    if (hasObject && !endpoint(claim.object))
      semanticError('semantic_claim_invalid', id);
    if (
      (predicate.valueKind === 'entity') !== hasObject ||
      (predicate.valueKind === 'scalar' &&
        (!['string', 'number', 'boolean'].includes(typeof claim.value) ||
          !valueAllowed(predicate, claim.value))) ||
      (predicate.valueKind === 'opaque' && claim.coverage !== 'unknown')
    )
      semanticError(
        predicate.valueKind === 'opaque'
          ? 'semantic_claim_coverage_unknown_required'
          : 'semantic_claim_value_invalid',
        id,
      );
    validateClaimProvenance(model, claim.provenance);
    if (claim.coverage === 'complete' && claim.dependsOn.length === 0)
      semanticError('semantic_claim_dependency_required', id);
    const references = new Set();
    for (const reference of claim.dependsOn) {
      if (
        !validClaimReference(reference) ||
        !Object.hasOwn(model[reference.section], reference.id) ||
        references.has(referenceKey(reference)) ||
        !dependencyMatchesClaim(model, claim, reference)
      )
        semanticError('semantic_dependency_invalid', id);
      references.add(referenceKey(reference));
      for (const source of dependencySources(model, reference))
        if (!claim.provenance.includes(source))
          semanticError(
            'semantic_claim_provenance_incomplete',
            id + ', ' + source,
          );
    }
    if (
      claim.coverage === 'complete' &&
      !completeDependencyCoverage(model, claim, claim.dependsOn)
    )
      semanticError('semantic_claim_dependency_required', id);

    for (const source of predicate.provenance)
      if (!claim.provenance.includes(source))
        semanticError(
          'semantic_claim_provenance_incomplete',
          id + ', ' + source,
        );

    if (claim.coverage === 'complete') {
      const identity = claimIdentity(claim, true),
        duplicate = identities.get(identity);
      if (duplicate)
        semanticError('semantic_claim_duplicate', duplicate + ', ' + id);
      identities.set(identity, id);

      const position = contradictionSubject(claim),
        priorClaims = positions.get(position) ?? [];
      for (const prior of priorClaims) {
        const applicability = applicabilityRelation(prior.claim, claim);
        if (
          applicability !== 'disjoint' &&
          incompatibleClaim(prior.claim, claim, predicate.cardinality)
        )
          semanticError('semantic_contradiction', prior.id + ', ' + id);
      }
      priorClaims.push({ id, claim });
      positions.set(position, priorClaims);
    }
  }
}

/** Validate one closed, source-bound v2 Claim Model without inferring truth. */
export function validateClaimModel(model) {
  jsonValue(model, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
  validateClaimModelTopLevel(model);
  validateClaimModelSources(model);
  const endpoint = validateClaimStructure(model);
  validateClaims(model, endpoint);
  return model;
}

export function normalizedClaimModel(model) {
  validateClaimModel(model);
  const result = structuredClone(model);
  for (const key of ['entities', 'relations', 'maturities'])
    result.vocabulary[key].sort();
  for (const predicate of Object.values(result.vocabulary.predicates)) {
    predicate.values.sort();
    predicate.provenance.sort();
  }
  for (const key of ['entities', 'relations', 'claims'])
    for (const item of Object.values(result[key])) item.provenance.sort();
  for (const item of Object.values(result.claims))
    item.dependsOn.sort((left, right) =>
      referenceKey(left) < referenceKey(right)
        ? -1
        : referenceKey(left) > referenceKey(right)
          ? 1
          : 0,
    );
  return result;
}

export function claimModelDigest(model) {
  return createHash('sha256')
    .update(canonical(normalizedClaimModel(model)))
    .digest('hex');
}
