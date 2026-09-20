import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, sha, stable } from './fixtures/ethos-source.mjs';
import fs from 'node:fs/promises';
import { composeNaturalOverview } from '../editions/ethos/static/natural-overview.mjs';
import { createMetricReader } from '../src/static/metrics.mjs';
import { auditNaturalSemantics } from '../editions/ethos/static/natural-semantics.mjs';

async function api() {
  const module = await import('../editions/ethos/evolution.mjs').catch(
    () => ({}),
  );
  assert.equal(
    typeof module.compileEthosEditionEvolution,
    'function',
    'ETHOS Edition evolution compiler must exist',
  );
  assert.equal(
    typeof module.selectEthosEditionDependencies,
    'function',
    'ETHOS Edition dependency adapter must exist',
  );
  return module;
}
function changed(mutate) {
  const f = fixture(),
    before = structuredClone(f.input);
  mutate(f.input);
  f.refresh();
  return [before, f.input];
}
const pages = [
  {
    id: 'overview',
    label: 'Overview',
    nodes: ['attempt'],
    relations: ['retry'],
    claims: ['maturity'],
  },
];

function selection(input, selectedPages = pages) {
  return {
    static: {
      label: 'Complete overview',
      nodes: Object.keys(input.semantics.nodes),
      relations: input.semantics.relations.map((relation) => relation.id),
      claims: Object.keys(input.documents.copy.assertions),
    },
    pages: selectedPages,
    narrative: selectedPages.map((page) => page.id),
  };
}

function compare(compiler, before, after, selectedPages = pages) {
  return compiler({
    before: {
      projection: before,
      sourceManifestSha256: before.digest,
      selection: selection(before, selectedPages),
    },
    after: {
      projection: after,
      sourceManifestSha256: after.digest,
      selection: selection(after, selectedPages),
    },
    correspondences: [],
  });
}

test('ETHOS adapter retains opaque assertions and exposes separate compiler obligations', async () => {
  const { compileEthosEditionEvolution } = await api();
  const [a, b] = changed((p) => {
    p.semantics.nodes.attempt.label = 'Longer attempt label';
  });
  const r = compare(compileEthosEditionEvolution, a, b);
  assert.deepEqual(r.delta.changed.entities, ['attempt']);
  assert.deepEqual(r.editions.affected[0].interactive, ['overview']);
  assert.deepEqual(Object.keys(r.obligations), [
    'rebuild',
    'semanticVerification',
    'mediumVerification',
    'humanReview',
    'acceptance',
    'publication',
  ]);
  assert.equal(r.obligations.humanReview.length, 1);
});

test('ETHOS adapter preserves source extensions rather than omit unrecognized meaning', async () => {
  const { compileEthosEditionEvolution } = await api();
  const [a, b] = changed((p) => {
    p.semantics.nodes.attempt.newConstraint = 'bounded';
  });
  assert.deepEqual(
    compare(compileEthosEditionEvolution, a, b).delta.changed.entities,
    ['attempt'],
  );
});

test('same graph counts do not hide changed conditions, quantifiers or direction', async () => {
  const { compileEthosEditionEvolution } = await api();
  for (const [key, value] of [
    ['condition', 'only after explicit re-observation'],
    ['quantifier', 'Zero or one'],
    ['scope', 'local resource'],
  ]) {
    const [a, b] = changed(
      (p) => (p.semantics.relations[0].attributes[key] = value),
    );
    const r = compare(compileEthosEditionEvolution, a, b);
    assert.deepEqual(r.delta.changed.relations, ['retry']);
    assert.deepEqual(r.editions.affected[0].interactive, ['overview']);
    assert.equal(Object.hasOwn(r, 'reuseAcceptance'), false);
  }
});
test('removed or added entities and unknown view dependencies never imply safe reuse', async () => {
  const { compileEthosEditionEvolution } = await api();
  const [a, b] = changed((p) => {
    p.semantics.nodes.extra = structuredClone(p.semantics.nodes.attempt);
    p.view.nodes.extra = { project: { witness: 'maturity' } };
  });
  const r = compare(compileEthosEditionEvolution, a, b);
  assert.deepEqual(r.delta.added.entities, ['extra']);
  assert.equal(r.editions.affected[0].scope, 'complete');
  assert.equal(r.obligations.acceptance[0].action, 'reaccept');
});
test('changed source bytes rebind the Edition without inventing scene work', async () => {
  const { compileEthosEditionEvolution } = await api();
  const [a, b] = changed(
    (p) => (p.source.bindings[0].sha256 = 'f'.repeat(64)),
  );
  const selectedPages = [
    ...pages,
    {
      id: 'details',
      label: 'Details',
      nodes: ['attempt'],
      relations: [],
      claims: ['maturity'],
    },
  ];
  const r = compare(compileEthosEditionEvolution, a, b, selectedPages);
  assert.deepEqual(r.delta.changed.sources, ['contract']);
  assert.deepEqual(r.editions.affected[0].interactive, []);
  assert.deepEqual(
    r.obligations.rebuild.map((item) => item.target),
    ['publication-bundle'],
  );
});

test('ETHOS authored inputs participate in shared Edition evolution', async () => {
  const {
      compileEthosEditionEvolution,
      selectEthosEditionDependencies,
    } = await api(),
    { input } = fixture(),
    authoredPages = [
      {
        id: 'overview',
        label: 'Overview',
        spec: {
          schema_version: 1,
          diagram_type: 'architecture',
          meta: { title: 'Overview' },
          components: [{ id: 'attempt', label: 'Attempt' }],
          connections: [],
        },
        bindings: {
          semanticNodes: ['attempt'],
          sourceRelations: ['retry'],
          assertions: ['maturity'],
        },
      },
    ],
    changedPages = structuredClone(authoredPages);
  changedPages[0].spec.components[0].label = 'Changed authored label';
  const compareSelections = (before, after) =>
    compileEthosEditionEvolution({
      before: {
        projection: input,
        sourceManifestSha256: input.digest,
        selection: before,
      },
      after: {
        projection: structuredClone(input),
        sourceManifestSha256: input.digest,
        selection: after,
      },
      correspondences: [],
    });

  let result = compareSelections(
    selectEthosEditionDependencies(input, authoredPages, {}),
    selectEthosEditionDependencies(input, changedPages, {}),
  );
  assert.deepEqual(result.editions.affected[0].interactive, ['overview']);
  assert.equal(result.editions.affected[0].static, false);
  assert.equal(result.obligations.humanReview.length, 1);

  result = compareSelections(
    selectEthosEditionDependencies(input, authoredPages, {}),
    selectEthosEditionDependencies(input, authoredPages, { laneCount: 7 }),
  );
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.equal(result.obligations.humanReview.length, 1);
});
test('bound semantic carrier rejects stale meaning and missing visible copy', async () => {
  const { verifyMeaningCarriers } = await api();
  const { input } = fixture();
  const source = input.semantics.nodes.attempt;
  const bindings = [
    {
      kind: 'node',
      id: 'attempt',
      sha256: sha(stable(source)),
      carriers: ['refresh-policy'],
    },
  ];
  const carriers = { 'refresh-policy': 'Re-observe before retry' };
  assert.equal(verifyMeaningCarriers(input, bindings, carriers).length, 1);
  assert.throws(() => verifyMeaningCarriers(input, bindings, {}), /carrier/);
  input.semantics.nodes.attempt.attributes.scope = 'different';
  assert.throws(
    () => verifyMeaningCarriers(input, bindings, carriers),
    /meaning/,
  );
});

test('canonical document carriers require exact source bytes and a verbatim locator', async () => {
  const { verifyMeaningCarriers } = await api();
  const { input } = fixture();
  const content = Buffer.from(
    'Canonical rule.\nOptional verification remains local without a receipt.\n',
  );
  const row = { ...input.source.bindings[0], sha256: sha(content) };
  input.source.bindings[0] = row;
  const binding = {
    kind: 'document',
    id: row.id,
    sha256: row.sha256,
    excerpt: 'Optional verification remains local without a receipt.',
    carriers: ['policy'],
  };
  const carriers = { policy: 'Optional, without receipt → local' };
  const documents = [{ ...row, content }];
  assert.deepEqual(
    verifyMeaningCarriers(input, [binding], carriers, documents),
    ['document:' + row.id],
  );
  assert.throws(
    () => verifyMeaningCarriers(input, [binding], carriers),
    /document/,
  );
  assert.throws(
    () =>
      verifyMeaningCarriers(
        input,
        [{ ...binding, excerpt: 'Invented rule' }],
        carriers,
        documents,
      ),
    /excerpt/,
  );
  assert.throws(
    () =>
      verifyMeaningCarriers(input, [binding], carriers, [
        { ...row, content: Buffer.from('Changed bytes') },
      ]),
    /document/,
  );
});
test('unchanged identities and meaning report no semantic changes, without claiming approval', async () => {
  const { compileEthosEditionEvolution } = await api();
  const { input } = fixture();
  const r = compare(
    compileEthosEditionEvolution,
    input,
    structuredClone(input),
  );
  assert.deepEqual(r.editions.affected, []);
  assert.deepEqual(r.obligations.acceptance, []);
});

test('unhandled top-level source claims conservatively invalidate meaning reuse', async () => {
  const { compileEthosEditionEvolution } = await api();
  const [a, b] = changed((p) => {
    p.title = 'Different architectural claim';
    p.authority.scope = 'narrower selected scope';
  });
  const r = compare(compileEthosEditionEvolution, a, b);
  assert.equal(r.editions.affected[0].scope, 'complete');
  assert(r.delta.changed.context.includes('presentation:title'));
  assert(r.delta.changed.context.includes('presentation:authority'));
});

test('relationship reversal is explicit and stale removed dependencies fail closed', async () => {
  const { compileEthosEditionEvolution } = await api();
  const f = fixture();
  f.input.semantics.nodes.other = structuredClone(
    f.input.semantics.nodes.attempt,
  );
  f.input.view.nodes.other = { project: { witness: 'maturity' } };
  f.input.semantics.relations[0].to = 'other';
  f.refresh();
  const before = structuredClone(f.input);
  [f.input.semantics.relations[0].from, f.input.semantics.relations[0].to] = [
    'other',
    'attempt',
  ];
  f.refresh();
  assert.deepEqual(
    compare(compileEthosEditionEvolution, before, f.input).delta.changed.relations,
    ['retry'],
  );
  delete f.input.semantics.nodes.other;
  delete f.input.view.nodes.other;
  f.input.semantics.relations = [];
  f.input.view.relations = {};
  f.refresh();
  assert.throws(
    () => compare(compileEthosEditionEvolution, before, f.input),
    /Unknown ETHOS scene relation: retry/,
  );
});
test('static refresh authoring carries exact source meaning and rejects changed source', async () => {
  const p = JSON.parse(
    await fs.readFile(
      new URL(
        './fixtures/ethos-source/projection-input.json',
        import.meta.url,
      ),
    ),
  );
  const q = JSON.parse(p.documents.quality_contract);
  const metrics = JSON.parse(
    await fs.readFile(
      new URL(
        '../editions/ethos/static/authoring/metrics.json',
        import.meta.url,
      ),
    ),
  );
  const refresh = {
    sha256: sha(stable(p.semantics.nodes.candidate_base_stale)),
    replay: 'Unpublished: replay; then re-prove',
    merge: 'Preserve history: merge; then re-prove',
    pending: 'Merge: exact continuation or preserved rollback',
  };
  const added = JSON.parse(
    await fs.readFile(
      new URL('./fixtures/refresh-metrics.json', import.meta.url),
    ),
  );
  const m = createMetricReader({
    ...metrics,
    records: [...metrics.records, ...added.records],
  });
  const c = composeNaturalOverview(p, m.measure, q, { refresh });
  const visible = c.document.labels
    .filter((l) => l.id.startsWith('refresh-'))
    .map((l) => l.text)
    .join(' ');
  assert.match(visible, /Unpublished: replay/);
  assert.match(visible, /Preserve history: merge/);
  assert.match(visible, /exact continuation or preserved rollback/);
  assert.equal(auditNaturalSemantics(c, p).failures.length, 0);
  c.document.labels.find((l) => l.id === 'refresh-options').text =
    refresh.replay;
  assert(
    auditNaturalSemantics(c, p).failures.includes('refresh-meaning-visible'),
  );
  p.semantics.nodes.candidate_base_stale.attributes.semantics = 'different';
  assert.throws(
    () => composeNaturalOverview(p, m.measure, q, { refresh }),
    /meaning/,
  );
});

test('static authored carrier checks its preimage and binds actual emitted text', async () => {
  const p = JSON.parse(
    await fs.readFile(
      new URL(
        './fixtures/ethos-source/projection-input.json',
        import.meta.url,
      ),
    ),
  );
  const q = JSON.parse(p.documents.quality_contract);
  const metrics = JSON.parse(
    await fs.readFile(
      new URL(
        '../editions/ethos/static/authoring/metrics.json',
        import.meta.url,
      ),
    ),
  );
  const measure = createMetricReader(metrics).measure;
  const baseline = composeNaturalOverview(p, measure, q);
  const site = baseline.document.labels.find(
    (l) => l.id === 'verification-verifier-label',
  );
  const carriers = {
    edits: [{ id: site.id, before: site.text, after: 'Receipt' }],
    meaning: [
      {
        kind: 'node',
        id: 'independent_verifier',
        sha256: sha(stable(p.semantics.nodes.independent_verifier)),
        carriers: [site.id],
      },
    ],
  };
  const composed = composeNaturalOverview(p, measure, q, { carriers });
  assert.equal(
    composed.document.labels.find((l) => l.id === site.id).text,
    'Receipt',
  );
  assert.ok(
    auditNaturalSemantics(composed, p).failures.length > 0,
    'A digest binding must not override the existing semantic checks for incorrect copy',
  );
  assert.ok(
    !auditNaturalSemantics(composed, p).failures.includes(
      'authored-meaning-visible',
    ),
  );
  composed.document.labels.find((l) => l.id === site.id).text = 'Tampered';
  assert.ok(
    auditNaturalSemantics(composed, p).failures.includes(
      'authored-meaning-visible',
    ),
  );
  carriers.edits[0].before = 'Stale preimage';
  assert.throws(
    () => composeNaturalOverview(p, measure, q, { carriers }),
    /Stale authored label/,
  );
  carriers.edits[0].before = site.text;
  p.semantics.nodes.independent_verifier.attributes.selection = 'Different';
  assert.throws(
    () => composeNaturalOverview(p, measure, q, { carriers }),
    /meaning/,
  );
});
