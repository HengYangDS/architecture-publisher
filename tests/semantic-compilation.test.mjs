import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  semanticDocument,
  semanticViews,
  ref,
} from './fixtures/semantic-document.mjs';

async function api() {
  const contract = await import('../src/semantics/document.mjs').catch(
    () => ({}),
  );
  const compiler = await import('../src/semantics/change.mjs').catch(
    () => ({}),
  );
  assert.equal(
    typeof contract.validateSemanticDocument,
    'function',
    'portable semantic contract must exist',
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
    import { validateSemanticDocument } from './src/semantics/document.mjs';
    import { semanticDocument } from './tests/fixtures/semantic-document.mjs';
    const document = semanticDocument();
    let shared = 'x';
    for (let i = 0; i < 35; i++) shared = [shared, shared];
    document.context.shared = shared;
    try { validateSemanticDocument(document); process.exitCode = 2; }
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
  assert.equal(result.stdout, 'semantic_size_exceeded');
});

test('portable semantics preserve qualifiers, reject unknown fields and bind provenance', async () => {
  const { validateSemanticDocument, semanticDigest } = await api();
  const input = semanticDocument(),
    before = structuredClone(input);
  assert.deepEqual(validateSemanticDocument(input), input);
  assert.equal(semanticDigest(input).length, 64);
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
      p.assertions.admission.dependsOn = [ref('entities', 'absent')];
    },
    (p) => {
      p.entities.client.qualifiers.bad = Number.NaN;
    },
  ]) {
    const invalid = structuredClone(input);
    mutate(invalid);
    assert.throws(() => validateSemanticDocument(invalid), /semantic_/);
  }
});

test('identity digest is deterministic under map and set ordering, not label similarity', async () => {
  const { semanticDigest, compileSemanticChange } = await api();
  const a = semanticDocument(),
    b = structuredClone(a);
  b.entities = Object.fromEntries(Object.entries(b.entities).reverse());
  assert.equal(semanticDigest(a), semanticDigest(b));
  b.entities.client.label = 'server';
  const delta = compileSemanticChange(a, b, semanticViews());
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
    const a = semanticDocument(),
      b = structuredClone(a);
    b.relations.request.qualifiers[key] = value;
    const delta = compileSemanticChange(a, b, semanticViews());
    assert.deepEqual(delta.changed.relations, ['request']);
    assert.deepEqual(delta.affectedAssertions, ['admission']);
    assert.deepEqual(delta.affectedViews, ['claim', 'detail']);
    for (const kind of ['rebuild', 'verify', 'review'])
      assert.deepEqual(
        delta.obligations[kind].map((o) => o.view),
        ['claim', 'detail'],
      );
  }
  const a = semanticDocument(),
    b = structuredClone(a);
  b.entities.client.label = 'A much longer component label '.repeat(20);
  assert.deepEqual(
    compileSemanticChange(a, b, semanticViews()).affectedViews,
    ['claim', 'detail'],
  );
  [b.relations.request.subject, b.relations.request.object] = [
    'server',
    'client',
  ];
  assert.deepEqual(
    compileSemanticChange(a, b, semanticViews()).changed.relations,
    ['request'],
  );
});

test('deletion and rewiring traverse the old graph rather than lose dependencies', async () => {
  const { compileSemanticChange } = await api();
  const a = semanticDocument(),
    b = structuredClone(a);
  delete b.relations.request;
  b.assertions.admission.dependsOn = [];
  const delta = compileSemanticChange(a, b, semanticViews());
  assert.deepEqual(delta.removed.relations, ['request']);
  assert.deepEqual(delta.affectedViews, ['claim', 'detail']);
});

test('unknown coverage, unrepresented additions and source changes broaden every obligation', async () => {
  const { compileSemanticChange } = await api();
  for (const mutate of [
    (b) => {
      b.assertions.admission.coverage = 'unknown';
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
    const a = semanticDocument(),
      b = structuredClone(a);
    mutate(b);
    const delta = compileSemanticChange(a, b, semanticViews());
    assert.equal(delta.requiresCompleteReview, true);
    assert.deepEqual(delta.affectedViews, ['claim', 'detail', 'other']);
    assert.equal(delta.acceptance, 'not-performed');
  }
});

test('no-op has no obligations, unknown references are conservative, dependency cycles terminate', async () => {
  const { compileSemanticChange } = await api();
  const a = semanticDocument(),
    b = structuredClone(a),
    views = semanticViews();
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

test('explicit contradiction detection is qualifier scoped and opaque prose remains unknown', async () => {
  const { validateSemanticDocument } = await api();
  const p = semanticDocument();
  p.assertions.denial = structuredClone(p.assertions.admission);
  p.assertions.denial.proposition.polarity = 'negative';
  assert.throws(
    () => validateSemanticDocument(p),
    /semantic_contradiction.*admission.*denial/,
  );
  p.assertions.denial.proposition.qualifiers.condition = 'unauthorized';
  assert.doesNotThrow(() => validateSemanticDocument(p));
  p.assertions.denial.proposition = null;
  assert.throws(
    () => validateSemanticDocument(p),
    /semantic_opaque_coverage/,
  );
  p.assertions.denial.coverage = 'unknown';
  assert.doesNotThrow(() => validateSemanticDocument(p));
});

test('rename, split and merge require disjoint source-backed removed and added identities', async () => {
  const { compileSemanticChange } = await api();
  for (const [kind, from, to] of [
    ['rename', ['other'], ['renamed']],
    ['split', ['other'], ['one', 'two']],
    ['merge', ['client', 'other'], ['merged']],
  ]) {
    const a = semanticDocument();
    a.relations = {};
    a.assertions = {};
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
  const { semanticDigest, compileSemanticChange } = await api();
  const a = semanticDocument();
  a.sources.second = { ...a.sources.contract, locator: 'second.md' };
  a.entities.client.provenance.push('second');
  a.vocabulary.entities.push('process');
  a.assertions.admission.dependsOn.push(ref('entities', 'client'));
  a.entities.client.qualifiers.order = ['observe', 'act'];
  const b = structuredClone(a);
  b.entities.client.provenance.reverse();
  b.vocabulary.entities.reverse();
  b.assertions.admission.dependsOn.reverse();
  assert.equal(semanticDigest(a), semanticDigest(b));
  assert.deepEqual(
    compileSemanticChange(a, b, semanticViews()).affectedViews,
    [],
  );
  b.entities.client.qualifiers.order.reverse();
  assert.deepEqual(
    compileSemanticChange(a, b, semanticViews()).changed.entities,
    ['client'],
  );
});

test('invalid owner, view declarations and oversized or cyclic documents fail explicitly', async () => {
  const { validateSemanticDocument, compileSemanticChange } = await api();
  const a = semanticDocument(),
    b = structuredClone(a);
  b.owner = 'other:system';
  assert.throws(
    () => compileSemanticChange(a, b, semanticViews()),
    /semantic_owner_changed/,
  );
  for (const views of [
    null,
    [null],
    [...semanticViews(), semanticViews()[0]],
    [
      {
        ...semanticViews()[0],
        dependsOn: [{ section: 'typo', id: 'request' }],
      },
    ],
    [{ ...semanticViews()[0], views: ['claim', 'claim'] }],
  ])
    assert.throws(
      () => compileSemanticChange(a, a, views),
      /semantic_views_invalid/,
    );
  a.context.loop = a;
  assert.throws(() => validateSemanticDocument(a), /semantic_json_cycle/);
  delete a.context.loop;
  a.context.long = 'x'.repeat(16 * 1024 * 1024);
  assert.throws(() => validateSemanticDocument(a), /semantic_size_exceeded/);
});

test('sparse and decorated arrays cannot hide meaning or supply absent correspondence evidence', async () => {
  const { validateSemanticDocument, compileSemanticChange } = await api();
  const a = semanticDocument(),
    values = new Array(2);
  values[0] = 'visible';
  values.extra = 'hidden';
  a.entities.client.qualifiers.values = values;
  assert.throws(() => validateSemanticDocument(a), /semantic_json_required/);
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
  const a = semanticDocument(),
    b = structuredClone(a);
  for (let i = 0; i < 80; i++)
    b.entities['extra-' + i] = structuredClone(b.entities.other);
  const delta = compileSemanticChange(a, b, semanticViews());
  assert.equal(delta.added.entities.length, 80);
  assert.equal(delta.unrepresented.length, 80);
  assert.deepEqual(delta.affectedViews, ['claim', 'detail', 'other']);
  assert.equal(
    delta.obligations.verify.every((o) => o.checks.includes('geometry')),
    true,
  );
});
