import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { claimModel, ref } from './fixtures/claim-model.mjs';
import {
  CLAIM_PLANES,
  claimModelDigest,
  validateClaimModel,
} from '../src/semantics/document.mjs';

test('v2 admits one explicit claim in every plane without mutating input', () => {
  const model = claimModel(),
    before = structuredClone(model);
  assert.deepEqual(CLAIM_PLANES, [
    'intended',
    'implemented',
    'observed',
    'governed',
    'published',
  ]);
  assert.deepEqual(validateClaimModel(model), model);
  assert.deepEqual(model, before);
  assert.equal(claimModelDigest(model).length, 64);
  assert.deepEqual(
    [...new Set(Object.values(model.claims).map((claim) => claim.plane))].sort(),
    [...CLAIM_PLANES].sort(),
  );
});

test('v2 rejects v1 and closes every semantic shape', () => {
  const base = claimModel();
  for (const mutate of [
    (p) => (p.schema = 'architecture.semantic-document/v1'),
    (p) => (p.extra = true),
    (p) => (p.vocabulary.extra = []),
    (p) => (p.entities.client.extra = true),
    (p) => (p.relations.request.extra = true),
    (p) => (p.claims.intended.extra = true),
    (p) => (p.sources.contract.extra = true),
    (p) => (p.claims.intended.plane = 'desired'),
    (p) => (p.claims.intended.subject = 'missing'),
    (p) => (p.claims.intended.object = 'missing'),
    (p) => (p.claims.intended.predicate = 'undeclared'),
    (p) => (p.claims.intended.provenance = ['missing']),
    (p) => (p.claims.intended.dependsOn = [ref('claims', 'missing')]),
    (p) => (p.claims.intended.condition = undefined),
    (p) => (p.claims.intended.scope = undefined),
    (p) => (p.claims.intended.maturity = ''),
    (p) => (p.claims.intended.validity = ''),
    (p) => (p.claims.intended.coverage = 'partial'),
    (p) => {
      p.claims.intended.object = null;
      p.claims.intended.value = null;
    },
    (p) => {
      p.claims.intended.object = 'server';
      p.claims.intended.value = { duplicate: true };
    },
  ]) {
    const invalid = structuredClone(base);
    mutate(invalid);
    assert.throws(() => validateClaimModel(invalid), /semantic_/);
  }
});

test('unknown coverage preserves opaque value and cannot pretend formal dependency knowledge', () => {
  const model = claimModel();
  model.claims.published.dependsOn = [];
  assert.deepEqual(validateClaimModel(model), model);
  model.claims.published.coverage = 'complete';
  assert.throws(
    () => validateClaimModel(model),
    /semantic_claim_dependency_required/,
  );
});

test('complete object and literal claims require dependencies matching their meaning', () => {
  const objectClaim = claimModel();
  objectClaim.claims.intended.dependsOn = [ref('entities', 'client')];
  assert.throws(
    () => validateClaimModel(objectClaim),
    /semantic_claim_dependency_required.*intended/,
  );

  const literalClaim = claimModel();
  literalClaim.claims.observed.dependsOn = [ref('entities', 'server')];
  assert.throws(
    () => validateClaimModel(literalClaim),
    /semantic_(claim_dependency_required|dependency_invalid).*observed/,
  );
});

test('claims may depend on other claims but self-dependency is rejected', () => {
  const model = claimModel();
  model.claims.published.dependsOn = [
    ref('entities', 'client'),
    ref('claims', 'observed'),
  ];
  assert.doesNotThrow(() => validateClaimModel(model));
  model.claims.published.dependsOn = [ref('claims', 'published')];
  assert.throws(
    () => validateClaimModel(model),
    /semantic_dependency_invalid.*published/,
  );
});

test('claim dependency cycles are rejected rather than admitted as coverage', () => {
  const model = claimModel();
  model.claims.published.dependsOn = [
    ref('entities', 'client'),
    ref('claims', 'observed'),
  ];
  model.claims.observed.dependsOn = [
    ref('entities', 'client'),
    ref('claims', 'published'),
  ];
  assert.throws(
    () => validateClaimModel(model),
    /semantic_dependency_cycle.*observed.*published/,
  );
});

test('plane is part of meaning and no cross-plane equivalence is invented', () => {
  const model = claimModel(),
    digest = claimModelDigest(model);
  model.claims.implemented.plane = 'observed';
  assert.notEqual(claimModelDigest(model), digest);

  const duplicate = claimModel();
  duplicate.claims.secondIntention = structuredClone(duplicate.claims.intended);
  assert.throws(
    () => validateClaimModel(duplicate),
    /semantic_claim_duplicate.*intended.*secondIntention/,
  );
});

test('contradiction is scoped by plane, condition, scope and maturity', () => {
  const model = claimModel();
  model.claims.denial = structuredClone(model.claims.intended);
  model.claims.denial.validity = 'refuted';
  assert.throws(
    () => validateClaimModel(model),
    /semantic_contradiction.*denial.*intended/,
  );
  model.claims.denial.condition.authorization = 'denied';
  assert.doesNotThrow(() => validateClaimModel(model));
  model.claims.denial.condition.authorization = 'granted';
  model.claims.denial.plane = 'observed';
  assert.doesNotThrow(() => validateClaimModel(model));
});

test('claims with incompatible literal values contradict at the same semantic position', () => {
  const model = claimModel();
  model.claims.unhealthy = structuredClone(model.claims.observed);
  model.claims.unhealthy.value.status = 'unhealthy';
  assert.throws(
    () => validateClaimModel(model),
    /semantic_contradiction.*observed.*unhealthy/,
  );
});

test('canonical digest normalizes declared sets but retains semantic array order', () => {
  const a = claimModel();
  a.sources.second = { ...a.sources.contract, locator: 'second.md' };
  a.claims.intended.provenance.push('second');
  a.claims.intended.dependsOn.push(ref('entities', 'client'));
  a.vocabulary.entities.push('process');
  a.claims.intended.value = null;
  a.claims.observed.value.samples = ['first', 'second'];
  const b = structuredClone(a);
  b.claims = Object.fromEntries(Object.entries(b.claims).reverse());
  b.entities = Object.fromEntries(Object.entries(b.entities).reverse());
  b.claims.intended.provenance.reverse();
  b.claims.intended.dependsOn.reverse();
  b.vocabulary.entities.reverse();
  assert.equal(claimModelDigest(a), claimModelDigest(b));
  b.claims.observed.value.samples.reverse();
  assert.notEqual(claimModelDigest(a), claimModelDigest(b));
});

test('hostile JSON, cycles, excessive depth and size fail closed within bounded work', () => {
  const model = claimModel();
  const sparse = new Array(2);
  sparse[0] = 'visible';
  sparse.extra = 'hidden';
  model.claims.observed.value.samples = sparse;
  assert.throws(() => validateClaimModel(model), /semantic_json_required/);

  delete model.claims.observed.value.samples;
  model.context.loop = model;
  assert.throws(() => validateClaimModel(model), /semantic_json_cycle/);

  const program = `
    import { validateClaimModel } from './src/semantics/document.mjs';
    import { claimModel } from './tests/fixtures/claim-model.mjs';
    const model = claimModel();
    let shared = 'x';
    for (let i = 0; i < 35; i++) shared = [shared, shared];
    model.context.shared = shared;
    try { validateClaimModel(model); process.exitCode = 2; }
    catch (error) { process.stdout.write(error.code); }
  `;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', program],
    { cwd: new URL('../', import.meta.url), encoding: 'utf8', timeout: 2000 },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'semantic_size_exceeded');

  const oversized = claimModel();
  oversized.context.long = 'x'.repeat(16 * 1024 * 1024);
  assert.throws(() => validateClaimModel(oversized), /semantic_size_exceeded/);
});
