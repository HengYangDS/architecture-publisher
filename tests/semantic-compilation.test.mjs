import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { claimChangeModel, ref } from './fixtures/claim-change.mjs';

async function api() {
  const contract = await import('../packages/publisher/src/semantics/document.mjs').catch(
    () => ({}),
  );
  const compiler = await import('../packages/publisher/src/semantics/change.mjs').catch(() => ({}));
  assert.equal(
    typeof contract.validateClaimModel,
    'function',
    'portable Claim Model contract must exist',
  );
  assert.equal(
    typeof compiler.compileClaimModelDelta,
    'function',
    'single Claim Model delta compiler must exist',
  );
  return { ...contract, ...compiler };
}

test('in-process shared graphs cannot expand beyond the admission work budget', () => {
  const program = `
    import { validateClaimModel } from './packages/publisher/src/semantics/document.mjs';
    import { claimChangeModel } from './tests/fixtures/claim-change.mjs';
    const document = claimChangeModel();
    let shared = 'x';
    for (let i = 0; i < 35; i++) shared = [shared, shared];
    document.context.shared = shared;
    try { validateClaimModel(document); process.exitCode = 2; }
    catch (error) { process.stdout.write(error.code); }
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', program], {
    cwd: new URL('../', import.meta.url),
    encoding: 'utf8',
    timeout: 2000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'semantic_json_alias');
});

test('portable semantics preserve qualifiers, reject unknown fields and bind provenance', async () => {
  const { validateClaimModel, claimModelDigest } = await api();
  const input = claimChangeModel(),
    before = structuredClone(input);
  assert.deepEqual(validateClaimModel(input), input);
  assert.equal(claimModelDigest(input).length, 64);
  assert.deepEqual(input, before);
  for (const mutate of [
    (p) => {
      p.silentMeaning = true;
    },
    (p) => {
      p.entities.client.extra = 'uninterpreted';
    },
    (p) => {
      p.relations.request.type = 'unknown';
    },
    (p) => {
      p.relations.request.object = 'absent';
    },
    (p) => {
      p.entities.client.provenance = ['absent'];
    },
    (p) => {
      p.sources.contract.sha256 = 'bad';
    },
    (p) => {
      p.sources.contract.sha256 = ['1'.repeat(64)];
    },
    (p) => {
      p.claims.admission.dependsOn = [ref('entities', 'absent')];
    },
    (p) => {
      p.entities.client.qualifiers.bad = Number.NaN;
    },
  ]) {
    const invalid = structuredClone(input);
    mutate(invalid);
    assert.throws(() => validateClaimModel(invalid), /semantic_/);
  }
});

test('identity digest is deterministic under map and set ordering, not label similarity', async () => {
  const { claimModelDigest, compileClaimModelDelta } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  b.entities = Object.fromEntries(Object.entries(b.entities).reverse());
  assert.equal(claimModelDigest(a), claimModelDigest(b));
  b.entities.client.label = 'server';
  const delta = compileClaimModelDelta(a, b);
  assert.deepEqual(delta.changed.entities, ['client']);
  assert.deepEqual(delta.added.entities, []);
  assert.deepEqual(delta.correspondences, []);
  assert.equal(delta.schema, 'architecture.claim-model-change/v1');
  assert.equal(Object.hasOwn(delta, 'obligations'), false);
});

test('all qualifiers and direction affect dependent claims', async () => {
  const { compileClaimModelDelta } = await api();
  for (const [key, value] of [
    ['condition', 'reobserved'],
    ['quantifier', 'zero-or-one'],
    ['scope', 'remote'],
    ['maturity', 'implemented'],
    ['direction', 'bidirectional'],
  ]) {
    const a = claimChangeModel(),
      b = structuredClone(a);
    b.relations.request.qualifiers[key] = value;
    const delta = compileClaimModelDelta(a, b);
    assert.deepEqual(delta.changed.relations, ['request']);
    assert.deepEqual(delta.affectedClaims, ['admission']);
  }
  const a = claimChangeModel(),
    b = structuredClone(a);
  b.entities.client.label = 'A much longer component label '.repeat(20);
  assert.deepEqual(compileClaimModelDelta(a, b).affectedClaims, ['admission']);
  [b.relations.request.subject, b.relations.request.object] = ['server', 'client'];
  [b.claims.admission.subject, b.claims.admission.object] = ['server', 'client'];
  assert.deepEqual(compileClaimModelDelta(a, b).changed.relations, ['request']);
});

test('deletion and rewiring traverse the old graph rather than lose dependencies', async () => {
  const { compileClaimModelDelta } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  delete b.relations.request;
  b.claims.admission.dependsOn = [ref('entities', 'client')];
  b.claims.admission.object = null;
  b.claims.admission.value = 'removed relation';
  b.claims.admission.predicate = 'tag';
  const delta = compileClaimModelDelta(a, b);
  assert.deepEqual(delta.removed.relations, ['request']);
  assert.deepEqual(delta.affectedClaims, ['admission']);
});

test('unknown coverage and opaque context are explicit delta reasons', async () => {
  const { compileClaimModelDelta } = await api();
  const a = claimChangeModel(),
    unknown = structuredClone(a);
  unknown.claims.admission.coverage = 'unknown';
  unknown.claims.admission.dependsOn = [];
  let delta = compileClaimModelDelta(a, unknown);
  assert.deepEqual(delta.unknownClaims, ['admission']);
  assert(delta.globalReasons.includes('unknown-claim-dependencies'));

  const context = structuredClone(a);
  context.context.policy = { text: 'Changed policy' };
  delta = compileClaimModelDelta(a, context);
  assert(delta.globalReasons.includes('opaque-context-change'));

  const vocabulary = structuredClone(a);
  vocabulary.vocabulary.entities.push('other-component');
  delta = compileClaimModelDelta(a, vocabulary);
  assert(delta.globalReasons.includes('vocabulary-change'));
});

test('opaque context transitions retain stable whole-value change reporting', async () => {
  const { compileClaimModelDelta } = await api(),
    transitions = [
      [null, 'enabled'],
      ['enabled', ['enabled', 'observed']],
      [['enabled'], { state: 'observed' }],
    ];
  for (const [before, after] of transitions) {
    const left = claimChangeModel(),
      right = structuredClone(left);
    left.context.policy = before;
    right.context.policy = after;
    const delta = compileClaimModelDelta(left, right);
    assert.deepEqual(delta.changed.context, ['policy']);
    assert.deepEqual(delta.changedFields.context.policy, ['$']);
    assert(delta.globalReasons.includes('opaque-context-change'));
  }
});

test('no-op has no delta or effect policy', async () => {
  const { compileClaimModelDelta } = await api();
  const a = claimChangeModel(),
    delta = compileClaimModelDelta(a, structuredClone(a));
  assert.equal(delta.hasChanges, false);
  assert.deepEqual(delta.affectedClaims, []);
  assert.equal(Object.hasOwn(delta, 'affectedViews'), false);
});

test('explicit contradiction detection is applicability scoped and opaque prose remains unknown', async () => {
  const { validateClaimModel } = await api();
  const p = claimChangeModel();
  p.claims.denial = structuredClone(p.claims.admission);
  p.claims.denial.validity = 'refuted';
  assert.throws(() => validateClaimModel(p), /semantic_contradiction.*admission.*denial/);
  p.claims.denial.condition.authorization = 'denied';
  assert.doesNotThrow(() => validateClaimModel(p));
  p.vocabulary.predicates.statement = {
    valueKind: 'opaque',
    cardinality: 'multiple',
    values: [],
    provenance: ['contract'],
  };
  p.claims.denial = {
    ...p.claims.denial,
    predicate: 'statement',
    object: null,
    value: { text: 'Legacy prose remains opaque.' },
    coverage: 'unknown',
    dependsOn: [],
  };
  assert.doesNotThrow(() => validateClaimModel(p));
});

test('rename, split and merge require disjoint source-backed removed and added identities', async () => {
  const { compileClaimModelDelta } = await api();
  for (const [kind, from, to] of [
    ['rename', ['other'], ['renamed']],
    ['split', ['other'], ['one', 'two']],
    ['merge', ['client', 'other'], ['merged']],
  ]) {
    const a = claimChangeModel();
    a.relations = {};
    a.claims = {
      baseline: {
        subject: 'server',
        predicate: 'tag',
        object: null,
        value: 'baseline',
        plane: 'published',
        condition: {},
        scope: {},
        maturity: 'target',
        validity: 'affirmed',
        dependsOn: [ref('entities', 'server')],
        coverage: 'complete',
        provenance: ['contract'],
      },
    };
    const b = structuredClone(a),
      value = a.entities.other;
    for (const id of from) delete b.entities[id];
    for (const id of to) b.entities[id] = structuredClone(value);
    const mapping = {
      kind,
      section: 'entities',
      from,
      to,
      evidence: [
        {
          version: 'after',
          source: 'contract',
          sha256: b.sources.contract.sha256,
          locator: '#migration',
        },
      ],
    };
    const delta = compileClaimModelDelta(a, b, [mapping]);
    assert.deepEqual(delta.correspondences, [mapping]);
    assert.deepEqual(delta.removed.entities, [...from].sort());
    assert.deepEqual(delta.added.entities, [...to].sort());
    const beforeEvidence = {
      ...mapping,
      evidence: [{ ...mapping.evidence[0], version: 'before' }],
    };
    assert.deepEqual(compileClaimModelDelta(a, b, [beforeEvidence]).correspondences, [
      beforeEvidence,
    ]);
    for (const invalid of [
      { ...mapping, evidence: [] },
      {
        ...mapping,
        evidence: [{ ...mapping.evidence[0], sha256: 'f'.repeat(64) }],
      },
      {
        ...mapping,
        evidence: [{ ...mapping.evidence[0], source: 'unselected' }],
      },
      {
        ...mapping,
        evidence: [{ ...beforeEvidence.evidence[0], source: 'unselected' }],
      },
      {
        ...mapping,
        evidence: [{ ...beforeEvidence.evidence[0], sha256: 'f'.repeat(64) }],
      },
      { ...mapping, evidence: [mapping.evidence[0], mapping.evidence[0]] },
      { ...mapping, from: ['server'] },
      { ...mapping, kind: 'guess' },
      ...['toString', 'constructor', '__proto__'].map((kind) => ({
        ...mapping,
        kind,
      })),
    ])
      assert.throws(() => compileClaimModelDelta(a, b, [invalid]), /semantic_correspondence/);
    assert.throws(
      () => compileClaimModelDelta(a, b, [mapping, mapping]),
      /semantic_correspondence/,
    );
    assert.throws(() => compileClaimModelDelta(a, b, null), /semantic_correspondence_invalid/);
  }
});

test('correspondence serialization is independent of input property order', async () => {
  const { compileClaimModelDelta } = await api(),
    before = claimChangeModel();
  before.relations = {};
  before.claims = {
    baseline: {
      subject: 'server',
      predicate: 'tag',
      object: null,
      value: 'baseline',
      plane: 'published',
      condition: {},
      scope: {},
      maturity: 'target',
      validity: 'affirmed',
      dependsOn: [ref('entities', 'server')],
      coverage: 'complete',
      provenance: ['contract'],
    },
  };
  const after = structuredClone(before);
  delete after.entities.other;
  after.entities.renamed = structuredClone(before.entities.other);
  const ordered = {
      kind: 'rename',
      section: 'entities',
      from: ['other'],
      to: ['renamed'],
      evidence: [
        {
          version: 'after',
          source: 'contract',
          sha256: after.sources.contract.sha256,
          locator: '#migration',
        },
      ],
    },
    reordered = {
      section: 'entities',
      kind: 'rename',
      to: ['renamed'],
      from: ['other'],
      evidence: [
        {
          locator: '#migration',
          sha256: after.sources.contract.sha256,
          source: 'contract',
          version: 'after',
        },
      ],
    };
  assert.equal(
    JSON.stringify(compileClaimModelDelta(before, after, [ordered])),
    JSON.stringify(compileClaimModelDelta(before, after, [reordered])),
  );
});

test('declared set ordering is not meaning and complete-value arrays remain ordered', async () => {
  const { claimModelDigest, compileClaimModelDelta } = await api();
  const a = claimChangeModel();
  a.sources.second = { ...a.sources.contract, locator: 'second.md' };
  a.entities.client.provenance.push('second');
  a.claims.admission.provenance.push('second');
  a.vocabulary.entities.push('process');
  a.claims.admission.dependsOn.push(ref('entities', 'client'));
  a.entities.client.qualifiers.order = ['observe', 'act'];
  const b = structuredClone(a);
  b.entities.client.provenance.reverse();
  b.vocabulary.entities.reverse();
  b.claims.admission.dependsOn.reverse();
  assert.equal(claimModelDigest(a), claimModelDigest(b));
  assert.deepEqual(compileClaimModelDelta(a, b).affectedClaims, []);
  b.entities.client.qualifiers.order.reverse();
  assert.deepEqual(compileClaimModelDelta(a, b).changed.entities, ['client']);
});

test('invalid owner and oversized or cyclic documents fail explicitly', async () => {
  const { validateClaimModel, compileClaimModelDelta } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  b.owner = 'other:system';
  assert.throws(() => compileClaimModelDelta(a, b), /semantic_owner_changed/);
  a.context.loop = a;
  assert.throws(() => validateClaimModel(a), /semantic_json_cycle/);
  delete a.context.loop;
  a.context.long = 'x'.repeat(16 * 1024 * 1024);
  assert.throws(() => validateClaimModel(a), /semantic_size_exceeded/);
});

test('sparse and decorated arrays cannot hide meaning or supply absent correspondence evidence', async () => {
  const { validateClaimModel, compileClaimModelDelta } = await api();
  const a = claimChangeModel(),
    values = new Array(2);
  values[0] = 'visible';
  values.extra = 'hidden';
  a.entities.client.qualifiers.values = values;
  assert.throws(() => validateClaimModel(a), /semantic_json_required/);
  delete a.entities.client.qualifiers.values;
  const b = structuredClone(a);
  delete b.entities.other;
  b.entities.renamed = structuredClone(a.entities.other);
  const row = {
    kind: 'rename',
    section: 'entities',
    from: ['other'],
    to: ['renamed'],
    evidence: new Array(1),
  };
  assert.throws(() => compileClaimModelDelta(a, b, [row]), /semantic_json_required/);
});

test('growth is reported rather than silently omitted or treated as an automatic layout', async () => {
  const { compileClaimModelDelta } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  for (let i = 0; i < 80; i++) b.entities['extra-' + i] = structuredClone(b.entities.other);
  const delta = compileClaimModelDelta(a, b);
  assert.equal(delta.added.entities.length, 80);
  assert.deepEqual(delta.affectedClaims, []);
  assert.equal(Object.hasOwn(delta, 'obligations'), false);
});
