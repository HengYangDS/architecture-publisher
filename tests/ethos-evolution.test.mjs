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
    typeof module.compareEthosMeaning,
    'function',
    'semantic comparison must exist',
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
const views = [
  {
    id: 'overview',
    nodes: ['attempt'],
    relations: ['retry'],
    assertions: ['maturity'],
  },
];
test('same graph counts do not hide changed conditions, quantifiers or direction', async () => {
  const { compareEthosMeaning } = await api();
  for (const [key, value] of [
    ['condition', 'only after explicit re-observation'],
    ['quantifier', 'Zero or one'],
    ['scope', 'local resource'],
  ]) {
    const [a, b] = changed(
      (p) => (p.semantics.relations[0].attributes[key] = value),
    );
    const r = compareEthosMeaning(a, b, views);
    assert.deepEqual(r.changed.relations, ['retry']);
    assert.deepEqual(r.affectedViews, ['overview']);
    assert.equal(r.reuseAcceptance, false);
  }
});
test('removed or added entities and unknown view dependencies never imply safe reuse', async () => {
  const { compareEthosMeaning } = await api();
  const [a, b] = changed((p) => {
    p.semantics.nodes.extra = structuredClone(p.semantics.nodes.attempt);
    p.view.nodes.extra = { project: { witness: 'maturity' } };
  });
  const r = compareEthosMeaning(a, b, views);
  assert.deepEqual(r.added.nodes, ['extra']);
  assert.deepEqual(r.unrepresented, ['nodes:extra']);
  assert.equal(r.requiresCompleteReview, true);
});
test('changed source documents invalidate all views conservatively', async () => {
  const { compareEthosMeaning } = await api();
  const [a, b] = changed((p) => (p.source.bindings[0].sha256 = 'f'.repeat(64)));
  const r = compareEthosMeaning(a, b, [
    ...views,
    { id: 'details', nodes: [], relations: [], assertions: [] },
  ]);
  assert.deepEqual(r.changed.documents, ['contract']);
  assert.deepEqual(r.affectedViews, ['details', 'overview']);
  assert.equal(r.requiresCompleteReview, true);
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
test('unchanged identities and meaning report no semantic changes, without claiming approval', async () => {
  const { compareEthosMeaning } = await api();
  const { input } = fixture();
  const r = compareEthosMeaning(input, structuredClone(input), views);
  assert.deepEqual(r.affectedViews, []);
  assert.equal(r.semanticAcceptance, 'not-performed');
});

test('unhandled top-level source claims conservatively invalidate meaning reuse', async () => {
  const { compareEthosMeaning } = await api();
  const [a, b] = changed((p) => {
    p.title = 'Different architectural claim';
    p.authority.scope = 'narrower selected scope';
  });
  const r = compareEthosMeaning(a, b, views);
  assert(r.requiresCompleteReview);
  assert(r.changed.presentation.includes('title'));
  assert(r.changed.presentation.includes('authority'));
});

test('relationship reversal and actual entity removal are explicit deltas', async () => {
  const { compareEthosMeaning } = await api();
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
    compareEthosMeaning(before, f.input, views).changed.relations,
    ['retry'],
  );
  delete f.input.semantics.nodes.other;
  delete f.input.view.nodes.other;
  f.input.semantics.relations = [];
  f.input.view.relations = {};
  f.refresh();
  const removed = compareEthosMeaning(before, f.input, views);
  assert.deepEqual(removed.removed.nodes, ['other']);
  assert.deepEqual(removed.removed.relations, ['retry']);
});
test('static refresh authoring carries exact source meaning and rejects changed source', async () => {
  const p = JSON.parse(
    await fs.readFile(
      new URL('./fixtures/ethos-source/projection-input.json', import.meta.url),
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
  c.document.labels.find((l) => l.id === 'refresh-merge').text = '';
  assert(
    auditNaturalSemantics(c, p).failures.includes('refresh-meaning-visible'),
  );
  p.semantics.nodes.candidate_base_stale.attributes.semantics = 'different';
  assert.throws(
    () => composeNaturalOverview(p, m.measure, q, { refresh }),
    /meaning/,
  );
});
