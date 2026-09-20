import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  claimChangeModel,
  claimViews,
  ref,
} from './fixtures/claim-change.mjs';

async function api() {
  const contract = await import('../src/semantics/document.mjs').catch(
    () => ({}),
  );
  const compiler = await import('../src/semantics/change.mjs').catch(
    () => ({}),
  );
  assert.equal(
    typeof contract.validateClaimModel,
    'function',
    'portable Claim Model contract must exist',
  );
  assert.equal(
    typeof compiler.compileSemanticChange,
    'function',
    'single change compiler must exist',
  );
  return { ...contract, ...compiler };
}

test('in-process shared graphs cannot expand beyond the admission work budget', () => {
  const program = `
    import { validateClaimModel } from './src/semantics/document.mjs';
    import { claimChangeModel } from './tests/fixtures/claim-change.mjs';
    const document = claimChangeModel();
    let shared = 'x';
    for (let i = 0; i < 35; i++) shared = [shared, shared];
    document.context.shared = shared;
    try { validateClaimModel(document); process.exitCode = 2; }
    catch (error) { process.stdout.write(error.code); }
  `;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', program],
    {
      cwd: new URL('../', import.meta.url),
      encoding: 'utf8',
      timeout: 2000,
    },
  );
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
  const { claimModelDigest, compileSemanticChange } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  b.entities = Object.fromEntries(Object.entries(b.entities).reverse());
  assert.equal(claimModelDigest(a), claimModelDigest(b));
  b.entities.client.label = 'server';
  const delta = compileSemanticChange(a, b, claimViews());
  assert.deepEqual(delta.changed.entities, ['client']);
  assert.deepEqual(delta.added.entities, []);
  assert.deepEqual(delta.correspondences, []);
  assert.equal(delta.acceptance, 'not-performed');
});

test('all qualifiers and direction affect assertion-only and transitive views', async () => {
  const { compileSemanticChange } = await api();
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
    const delta = compileSemanticChange(a, b, claimViews());
    assert.deepEqual(delta.changed.relations, ['request']);
    assert.deepEqual(delta.affectedClaims, ['admission']);
    assert.deepEqual(delta.affectedViews, ['claim', 'detail']);
    for (const kind of ['rebuild', 'verify', 'review'])
      assert.deepEqual(
        delta.obligations[kind].map((o) => o.view),
        ['claim', 'detail'],
      );
  }
  const a = claimChangeModel(),
    b = structuredClone(a);
  b.entities.client.label = 'A much longer component label '.repeat(20);
  assert.deepEqual(
    compileSemanticChange(a, b, claimViews()).affectedViews,
    ['claim', 'detail'],
  );
  [b.relations.request.subject, b.relations.request.object] = [
    'server',
    'client',
  ];
  [b.claims.admission.subject, b.claims.admission.object] = [
    'server',
    'client',
  ];
  assert.deepEqual(
    compileSemanticChange(a, b, claimViews()).changed.relations,
    ['request'],
  );
});

test('deletion and rewiring traverse the old graph rather than lose dependencies', async () => {
  const { compileSemanticChange } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  delete b.relations.request;
  b.claims.admission.dependsOn = [ref('entities', 'client')];
  b.claims.admission.object = null;
  b.claims.admission.value = 'removed relation';
  b.claims.admission.predicate = 'tag';
  const delta = compileSemanticChange(a, b, claimViews());
  assert.deepEqual(delta.removed.relations, ['request']);
  assert.deepEqual(delta.affectedViews, ['claim', 'detail']);
});

test('unknown coverage, unrepresented additions and source changes broaden every obligation', async () => {
  const { compileSemanticChange } = await api();
  for (const mutate of [
    (b) => {
      b.claims.admission.coverage = 'unknown';
    },
    (b) => {
      b.entities.new = structuredClone(b.entities.client);
    },
    (b) => {
      b.sources.contract.sha256 = '2'.repeat(64);
    },
    (b) => {
      b.context.policy = { text: 'Changed policy' };
    },
  ]) {
    const a = claimChangeModel(),
      b = structuredClone(a);
    mutate(b);
    const delta = compileSemanticChange(a, b, claimViews());
    assert.equal(delta.requiresCompleteReview, true);
    assert.deepEqual(delta.affectedViews, ['claim', 'detail', 'other']);
    assert.equal(delta.acceptance, 'not-performed');
  }
});

test('no-op has no obligations, unknown references are conservative, dependency cycles terminate', async () => {
  const { compileSemanticChange } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a),
    views = claimViews();
  views[0].views = ['detail'];
  assert.deepEqual(compileSemanticChange(a, b, views).obligations, {
    rebuild: [],
    verify: [],
    review: [],
  });
  b.entities.client.label = 'Changed';
  assert.deepEqual(compileSemanticChange(a, b, views).affectedViews, [
    'claim',
    'detail',
  ]);
  views[2].dependsOn = [ref('entities', 'unknown')];
  assert.deepEqual(compileSemanticChange(a, b, views).affectedViews, [
    'claim',
    'detail',
    'other',
  ]);
});

test('explicit contradiction detection is applicability scoped and opaque prose remains unknown', async () => {
  const { validateClaimModel } = await api();
  const p = claimChangeModel();
  p.claims.denial = structuredClone(p.claims.admission);
  p.claims.denial.validity = 'refuted';
  assert.throws(
    () => validateClaimModel(p),
    /semantic_contradiction.*admission.*denial/,
  );
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
  const { compileSemanticChange } = await api();
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
    const delta = compileSemanticChange(a, b, [], [mapping]);
    assert.deepEqual(delta.correspondences, [mapping]);
    assert.deepEqual(delta.removed.entities, [...from].sort());
    assert.deepEqual(delta.added.entities, [...to].sort());
    assert.equal(delta.acceptance, 'not-performed');
    for (const invalid of [
      { ...mapping, evidence: [] },
      {
        ...mapping,
        evidence: [{ ...mapping.evidence[0], sha256: 'f'.repeat(64) }],
      },
      { ...mapping, from: ['server'] },
      { ...mapping, kind: 'guess' },
      ...['toString', 'constructor', '__proto__'].map((kind) => ({
        ...mapping,
        kind,
      })),
    ])
      assert.throws(
        () => compileSemanticChange(a, b, [], [invalid]),
        /semantic_correspondence/,
      );
    assert.throws(
      () => compileSemanticChange(a, b, [], [mapping, mapping]),
      /semantic_correspondence/,
    );
  }
});

test('declared set ordering is not meaning and complete-value arrays remain ordered', async () => {
  const { claimModelDigest, compileSemanticChange } = await api();
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
  assert.deepEqual(
    compileSemanticChange(a, b, claimViews()).affectedViews,
    [],
  );
  b.entities.client.qualifiers.order.reverse();
  assert.deepEqual(
    compileSemanticChange(a, b, claimViews()).changed.entities,
    ['client'],
  );
});

test('invalid owner, view declarations and oversized or cyclic documents fail explicitly', async () => {
  const { validateClaimModel, compileSemanticChange } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  b.owner = 'other:system';
  assert.throws(
    () => compileSemanticChange(a, b, claimViews()),
    /semantic_owner_changed/,
  );
  for (const views of [
    null,
    [null],
    [...claimViews(), claimViews()[0]],
    [
      {
        ...claimViews()[0],
        dependsOn: [{ section: 'typo', id: 'request' }],
      },
    ],
    [{ ...claimViews()[0], views: ['claim', 'claim'] }],
  ])
    assert.throws(
      () => compileSemanticChange(a, a, views),
      /semantic_views_invalid/,
    );
  a.context.loop = a;
  assert.throws(() => validateClaimModel(a), /semantic_json_cycle/);
  delete a.context.loop;
  a.context.long = 'x'.repeat(16 * 1024 * 1024);
  assert.throws(() => validateClaimModel(a), /semantic_size_exceeded/);
});

test('sparse and decorated arrays cannot hide meaning or supply absent correspondence evidence', async () => {
  const { validateClaimModel, compileSemanticChange } = await api();
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
  assert.throws(
    () => compileSemanticChange(a, b, [], [row]),
    /semantic_json_required/,
  );
});

test('growth is reported rather than silently omitted or treated as an automatic layout', async () => {
  const { compileSemanticChange } = await api();
  const a = claimChangeModel(),
    b = structuredClone(a);
  for (let i = 0; i < 80; i++)
    b.entities['extra-' + i] = structuredClone(b.entities.other);
  const delta = compileSemanticChange(a, b, claimViews());
  assert.equal(delta.added.entities.length, 80);
  assert.equal(delta.unrepresented.length, 80);
  assert.deepEqual(delta.affectedViews, ['claim', 'detail', 'other']);
  assert.equal(
    delta.obligations.verify.every((o) => o.checks.includes('geometry')),
    true,
  );
});
