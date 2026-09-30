import assert from 'node:assert/strict';
import test from 'node:test';
import { claimWorkHtml } from '../packages/publisher/renderers/cytoscape/claim-work.mjs';

test('claim reading work keeps meaning and applicability visible with exact graph anchors', () => {
  const page = {
    nodes: [
      { id: 'n-0', label: 'Client' },
      { id: 'n-1', label: 'Route' },
    ],
    relations: [{ id: 'r-0', source: 'n-0', target: 'n-1' }],
    claims: [
      {
        graphicId: 'c-0',
        relationOrdinal: 1,
        facts: [
          { label: 'Claim plane', value: 'implemented' },
          { label: 'Predicate', value: 'selects-route · entity · single' },
          { label: 'Subject', value: 'Client' },
          { label: 'Object', value: 'Route' },
          { label: 'Condition', value: 'only when enabled' },
          { label: 'Scope', value: 'selected client' },
          { label: 'Claimed maturity', value: 'implemented' },
          { label: 'Claimant-declared validity', value: 'affirmed' },
          { label: 'Declared evidence authority', value: 'exact source authority' },
        ],
      },
    ],
  };
  const html = claimWorkHtml(page);
  assert.match(html, /data-graphic-id="c-0"/u);
  for (const value of [
    'implemented',
    'selects-route',
    'only when enabled',
    'selected client',
    'affirmed',
  ])
    assert(html.includes(value));
  assert.match(html, /Client → Route/u);
  assert.doesNotMatch(html, /exact source authority/u);
  assert.doesNotMatch(html, /ON SOURCE RELATION 01/u);
});

test('scalar claim reading preserves values without requiring a relation or reported plane', () => {
  const page = {
    nodes: [],
    relations: [],
    claims: [
      { graphicId: 'c-0', facts: [{ label: 'Value', value: 'reported <value>' }] },
      { graphicId: 'c-1', facts: [{ label: 'Subject', value: 'Repository' }] },
    ],
  };
  const html = claimWorkHtml(page);
  assert.match(html, /Claim plane · not reported/u);
  assert.match(html, /Selected source Claim/u);
  assert.match(html, /reported &lt;value&gt;/u);
  assert.match(html, /<h4>Repository<\/h4>/u);
  assert.doesNotMatch(html, /→|↔/u);
  assert.equal(claimWorkHtml({ nodes: [] }), '');
});

test('a linked claim derives exact endpoints and bidirectional spelling or fails on a missing anchor', () => {
  const page = {
    nodes: [
      { id: 'n-0', label: 'Client' },
      { id: 'n-1', label: 'Route' },
    ],
    relations: [{ id: 'r-0', source: 'n-0', target: 'n-1', direction: 'bidirectional' }],
    claims: [
      { graphicId: 'c-0', relationOrdinal: 1, facts: [{ label: 'Predicate', value: 'connects' }] },
    ],
  };
  assert.match(claimWorkHtml(page), /Client ↔ Route/u);
  page.claims[0].facts.push({ label: 'Value', value: 'selected' });
  assert.match(claimWorkHtml(page), /connects · selected/u);
  page.claims[0].relationOrdinal = 2;
  assert.throws(() => claimWorkHtml(page), { code: 'render_interactive_claim_anchor_invalid' });
});
