import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures/ethos-source.mjs';

async function api() {
  const m = await import('../editions/ethos/review.mjs');
  assert.equal(
    typeof m.verifyCurrentReview,
    'function',
    'current review validator exists',
  );
  return m.verifyCurrentReview;
}
function input() {
  const p = fixture().input;
  return {
    source: {
      commit: p.source.git.commit,
      tree: p.source.git.tree,
      digest: p.digest,
    },
    qualitySha256: 'a'.repeat(64),
    editionSha256: 'b'.repeat(64),
    outputManifestSha256: 'c'.repeat(64),
    pages: [{ id: 'overview', sha256: 'd'.repeat(64) }],
    requiredAssertions: ['maturity'],
  };
}
function review(t) {
  return {
    schema: 'architecture.ethos-edition-review/v1',
    source: t.source,
    qualitySha256: t.qualitySha256,
    editionSha256: t.editionSha256,
    outputManifestSha256: t.outputManifestSha256,
    pages: t.pages,
    assertions: t.requiredAssertions,
    reviewer: { kind: 'agent', id: 'test-reviewer' },
    scope: [
      'Source-backed semantics and actual rendered static and HTML inspection',
    ],
    notEstablished: ['Runtime implementation of ETHOS terminal design'],
    findings: [],
    evidence: [{ path: 'review.md', sha256: 'e'.repeat(64) }],
    observedAt: '2026-09-18T00:00:00Z',
  };
}
test('new review binds current source, each rendered page and complete assertions without historic acceptance', async () => {
  const verify = await api(),
    target = input(),
    r = review(target);
  assert.equal(verify(r, target).semanticAcceptance, 'bounded-current-review');
  for (const key of [
    'qualitySha256',
    'editionSha256',
    'outputManifestSha256',
  ]) {
    const bad = structuredClone(r);
    bad[key] = '0'.repeat(64);
    assert.throws(() => verify(bad, target));
  }
});
test('new review rejects missing coverage, findings and invented reviewer authority', async () => {
  const verify = await api(),
    target = input(),
    r = review(target);
  for (const mutate of [
    (r) => (r.assertions = []),
    (r) => (r.pages = []),
    (r) => (r.findings = ['omitted condition']),
    (r) => (r.reviewer = { kind: 'implicit-approval' }),
    (r) => (r.notEstablished = []),
  ]) {
    const bad = structuredClone(r);
    mutate(bad);
    assert.throws(() => verify(bad, target));
  }
});
