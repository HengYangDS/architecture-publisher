#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  exact,
  jsonValue,
  record,
  semanticError,
  strings,
  text,
  validateClaimModel,
} from '../../src/semantics/document.mjs';

const LEGACY_SECTIONS = Object.freeze([
  'entities',
  'relations',
  'assertions',
  'sources',
  'context',
  'vocabulary',
]);

const validLegacyReference = (value) =>
  exact(value, ['section', 'id']) &&
  LEGACY_SECTIONS.includes(value.section) &&
  value.section !== 'vocabulary' &&
  text(value.id);

function validateLegacyDocument(document) {
  jsonValue(document);
  if (
    !exact(document, ['schema', 'owner', ...LEGACY_SECTIONS]) ||
    document.schema !== 'architecture.semantic-document/v1' ||
    !text(document.owner) ||
    !exact(document.vocabulary, ['entities', 'relations']) ||
    !strings(document.vocabulary.entities) ||
    !strings(document.vocabulary.relations)
  )
    semanticError('semantic_migration_source_invalid');
  for (const section of LEGACY_SECTIONS)
    if (
      !record(document[section]) ||
      Object.keys(document[section]).some((id) => !text(id))
    )
      semanticError('semantic_migration_source_invalid', section);
  if (!Object.keys(document.sources).length)
    semanticError('semantic_migration_source_invalid', 'sources');
  const provenance = (references) =>
    strings(references, true) &&
    references.every((id) => Object.hasOwn(document.sources, id));
  for (const source of Object.values(document.sources))
    if (
      !exact(source, ['sha256', 'locator', 'authority']) ||
      typeof source.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(source.sha256) ||
      !text(source.locator) ||
      !text(source.authority)
    )
      semanticError('semantic_migration_source_invalid', 'source');
  const endpoint = (id) => text(id) && Object.hasOwn(document.entities, id);
  for (const entity of Object.values(document.entities))
    if (
      !exact(entity, ['type', 'label', 'qualifiers', 'provenance']) ||
      !document.vocabulary.entities.includes(entity.type) ||
      !text(entity.label) ||
      !record(entity.qualifiers) ||
      !provenance(entity.provenance)
    )
      semanticError('semantic_migration_source_invalid', 'entity');
  for (const relation of Object.values(document.relations))
    if (
      !exact(relation, [
        'type',
        'subject',
        'object',
        'qualifiers',
        'provenance',
      ]) ||
      !document.vocabulary.relations.includes(relation.type) ||
      !endpoint(relation.subject) ||
      !endpoint(relation.object) ||
      !record(relation.qualifiers) ||
      !provenance(relation.provenance)
    )
      semanticError('semantic_migration_source_invalid', 'relation');
  for (const [id, assertion] of Object.entries(document.assertions))
    if (
      !exact(assertion, [
        'value',
        'proposition',
        'dependsOn',
        'coverage',
        'provenance',
      ]) ||
      !['complete', 'unknown'].includes(assertion.coverage) ||
      !Array.isArray(assertion.dependsOn) ||
      assertion.dependsOn.some(
        (reference) =>
          !validLegacyReference(reference) ||
          !Object.hasOwn(document[reference.section], reference.id),
      ) ||
      !provenance(assertion.provenance)
    )
      semanticError('semantic_migration_source_invalid', id);
  return document;
}

function partitionQualifiers(qualifiers, mapping, id) {
  if (
    !strings(mapping.conditionKeys) ||
    !strings(mapping.scopeKeys) ||
    mapping.conditionKeys.some((key) => mapping.scopeKeys.includes(key)) ||
    [...mapping.conditionKeys, ...mapping.scopeKeys].sort().join('\n') !==
      Object.keys(qualifiers).sort().join('\n')
  )
    semanticError('semantic_migration_qualifier_mapping_invalid', id);
  return Object.fromEntries(
    ['condition', 'scope'].map((kind) => [
      kind,
      Object.fromEntries(
        mapping[kind + 'Keys'].map((key) => [key, qualifiers[key]]),
      ),
    ]),
  );
}

/** Development-only, explicit conversion. It is not a current runtime reader. */
export function migrateSemanticV1(document, plan) {
  validateLegacyDocument(document);
  if (
    !exact(plan, ['maturities', 'predicates', 'relations', 'claims']) ||
    !strings(plan.maturities, true) ||
    !record(plan.predicates) ||
    !record(plan.relations) ||
    !record(plan.claims) ||
    Object.keys(plan.relations).some(
      (id) => !Object.hasOwn(document.relations, id),
    ) ||
    Object.keys(plan.claims).some(
      (id) => !Object.hasOwn(document.assertions, id),
    )
  )
    semanticError('semantic_migration_plan_invalid');
  const claims = {},
    retainedValues = {};
  for (const [id, relation] of Object.entries(document.relations)) {
    const mapping = plan.relations[id],
      predicate = plan.predicates[relation.type];
    if (
      !record(mapping) ||
      !record(predicate) ||
      !exact(mapping, [
        'plane',
        'maturity',
        'conditionKeys',
        'scopeKeys',
      ])
    )
      semanticError('semantic_migration_relation_mapping_required', id);
    const { condition, scope } = partitionQualifiers(
      relation.qualifiers,
      mapping,
      id,
    );
    claims[id] = {
      subject: relation.subject,
      predicate: relation.type,
      object: relation.object,
      value: null,
      plane: mapping.plane,
      condition,
      scope,
      maturity: mapping.maturity,
      validity: 'affirmed',
      dependsOn: [{ section: 'relations', id }],
      coverage: 'complete',
      provenance: [
        ...new Set([...relation.provenance, ...predicate.provenance]),
      ],
    };
  }
  for (const [id, assertion] of Object.entries(document.assertions)) {
    const mapping = plan.claims[id];
    if (!record(mapping))
      semanticError('semantic_migration_claim_mapping_required', id);
    const proposition = assertion.proposition;
    if (proposition === null) {
      if (
        !exact(mapping, [
          'subject',
          'predicate',
          'plane',
          'condition',
          'scope',
          'maturity',
          'validity',
        ]) ||
        !record(mapping.condition) ||
        !record(mapping.scope)
      )
        semanticError('semantic_migration_claim_mapping_required', id);
      claims[id] = {
        subject: mapping.subject,
        predicate: mapping.predicate,
        object: null,
        value: structuredClone(assertion.value),
        plane: mapping.plane,
        condition: structuredClone(mapping.condition),
        scope: structuredClone(mapping.scope),
        maturity: mapping.maturity,
        validity: mapping.validity,
        dependsOn: assertion.dependsOn.map((reference) => {
          if (reference.section === 'assertions')
            semanticError('semantic_migration_claim_dependency_unsupported', id);
          return structuredClone(reference);
        }),
        coverage: assertion.coverage,
        provenance: [...assertion.provenance],
      };
      continue;
    }
    if (
      !exact(mapping, [
        'plane',
        'maturity',
        'conditionKeys',
        'scopeKeys',
      ]) ||
      !exact(proposition, [
        'subject',
        'predicate',
        'object',
        'polarity',
        'qualifiers',
      ]) ||
      !record(proposition.qualifiers)
    )
      semanticError('semantic_migration_claim_mapping_required', id);
    const { condition, scope } = partitionQualifiers(
      proposition.qualifiers,
      mapping,
      id,
    );
    if (Object.hasOwn(claims, id))
      semanticError('semantic_migration_claim_identity_collision', id);
    claims[id] = {
      subject: proposition.subject,
      predicate: proposition.predicate,
      object: proposition.object,
      value: null,
      plane: mapping.plane,
      condition,
      scope,
      maturity: mapping.maturity,
      validity: proposition.polarity === 'positive' ? 'affirmed' : 'refuted',
      dependsOn: assertion.dependsOn.map((reference) => {
        if (reference.section === 'assertions')
          semanticError('semantic_migration_claim_dependency_unsupported', id);
        return structuredClone(reference);
      }),
      coverage: assertion.coverage,
      provenance: [...assertion.provenance],
    };
    if (assertion.value !== null)
      retainedValues[id] = structuredClone(assertion.value);
  }
  const migrated = {
    schema: 'architecture.claim-model/v2',
    owner: document.owner,
    vocabulary: {
      entities: [...document.vocabulary.entities],
      relations: [...document.vocabulary.relations],
      maturities: [...plan.maturities],
      predicates: structuredClone(plan.predicates),
    },
    sources: structuredClone(document.sources),
    entities: structuredClone(document.entities),
    relations: structuredClone(document.relations),
    claims,
    context: {
      ...structuredClone(document.context),
      ...(Object.keys(retainedValues).length
        ? { 'migration:assertion-values': retainedValues }
        : {}),
    },
  };
  validateClaimModel(migrated);
  return migrated;
}

async function main() {
  const [sourceFile, planFile, outputFile] = process.argv.slice(2);
  if (![sourceFile, planFile, outputFile].every(text))
    throw new Error('usage: semantic-v1-to-claim-v2 <source> <plan> <output>');
  const [document, plan] = await Promise.all(
    [sourceFile, planFile].map(async (file) =>
      JSON.parse(await fs.readFile(path.resolve(file), 'utf8')),
    ),
  );
  await fs.writeFile(
    path.resolve(outputFile),
    JSON.stringify(migrateSemanticV1(document, plan), null, 2) + '\n',
    { flag: 'wx' },
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
