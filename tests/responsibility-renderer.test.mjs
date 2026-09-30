import assert from 'node:assert/strict';
import test from 'node:test';
import { responsibilityPageHtml } from '../packages/publisher/renderers/cytoscape/responsibility.mjs';

const editorial = (statement) => ({ kind: 'editorial', statement, proponent: 'editor' });

function pageFixture() {
  return {
    navigationLabel: 'Responsibilities',
    form: {
      roles: [
        { groupId: 'g-0', basis: editorial('First role.') },
        { groupId: 'g-1', basis: editorial('Second role.') },
      ],
      handoffs: [],
    },
    groups: [
      { id: 'g-0', label: 'First role', nodeIds: ['n-0', 'n-1'] },
      { id: 'g-1', label: 'Second role', nodeIds: ['n-2'] },
    ],
    nodes: [
      { id: 'n-0', label: 'Alpha' },
      { id: 'n-1', label: 'Beta' },
      { id: 'n-2', label: 'Gamma' },
    ],
    relations: [
      {
        id: 'r-0',
        source: 'n-0',
        target: 'n-1',
        label: 'maintains',
        direction: 'directed',
        sourceQualifiers: [{ name: 'condition', value: 'active' }],
      },
      {
        id: 'r-1',
        source: 'n-1',
        target: 'n-2',
        label: 'configures',
        direction: 'directed',
      },
    ],
    claims: [
      {
        graphicId: 'c-0',
        relationOrdinal: 1,
        facts: [{ label: 'Claim plane', value: 'governed' }],
      },
    ],
    questions: [
      {
        text: 'Which roles own the selected work?',
        limits: ['This is not a runtime observation.'],
      },
    ],
    editorialAssertions: [],
  };
}

test('same-domain relations use a labeled detail band while cross-domain relations use the shared track', () => {
  const html = responsibilityPageHtml(pageFixture(), 0, []);
  const firstRole = html.indexOf('data-graphic-id="g-0"');
  const secondRole = html.indexOf('data-graphic-id="g-1"');
  const detailBand = html.indexOf('aria-label="Relations within First role"');
  const internalRelation = html.indexOf('data-graphic-id="r-0"');
  const crossRelation = html.indexOf('data-graphic-id="r-1"');
  assert.ok(firstRole < secondRole && secondRole < detailBand);
  assert.ok(detailBand < internalRelation && internalRelation < crossRelation);
  assert.match(html, /maintains/u);
  assert.equal(html.match(/Editorial judgment · editor · unverified/gu)?.length, 2);
  assert.match(html, /<dt>condition<\/dt><dd>active<\/dd>/u);
  assert.match(html, /data-graphic-id="c-0"/u);
  assert.match(html, /This is not a runtime observation/u);
  for (const id of ['r-0', 'r-1', 'c-0'])
    assert.equal(html.split(`data-graphic-id="${id}"`).length - 1, 1);
});

test('source-Claim role and reverse relationships retain their direction and limits', () => {
  const page = pageFixture();
  page.form.roles[1].basis = {
    kind: 'source-claim',
    conditions: [{ label: 'Scope', value: 'selected client only' }],
  };
  page.form.handoffs = [{ fromGroup: 'g-1', toGroup: 'g-0', basis: editorial('Reverse handoff.') }];
  page.relations[0].direction = 'bidirectional';
  page.relations[1].source = 'n-2';
  page.relations[1].target = 'n-1';
  page.relations[1].direction = 'bidirectional';
  const html = responsibilityPageHtml(page, 0, []);
  assert.match(html, /Selected source Claim · editorial interpretation/u);
  assert.match(html, /Scope · selected client only/u);
  assert.match(html, /form-route--handoff form-route--reverse/u);
  assert.match(html, /form-route--source form-route--reverse form-route--bidirectional/u);
  assert.match(html, /maintains <i aria-hidden="true">↔<\/i>/u);
  assert.match(html, /Source relation · both directions/u);
});

test('complete source record, unlinked Claim and method limits remain inspectable', () => {
  const page = pageFixture();
  page.claims.push({
    graphicId: 'c-1',
    facts: [{ label: 'Condition', value: 'only when selected' }],
  });
  page.editorialAssertions.push({
    statement: 'Another bounded interpretation.',
    proponent: 'editor',
  });
  const html = responsibilityPageHtml(page, 1, ['Parser is not a sandbox.']);
  assert.match(html, /data-graphic-id="c-1"/u);
  assert.match(html, /Additional editorial assertions/u);
  assert.match(html, /Another bounded interpretation/u);
  assert.match(html, /Parser is not a sandbox/u);
  assert.match(html, /<dt>Condition<\/dt><dd>only when selected<\/dd>/u);
  assert.match(html, /id="page-1"/u);
});

test('a relation-free role page does not fabricate handoff or relation sections', () => {
  const page = pageFixture();
  page.relations = [];
  page.claims = [];
  page.questions[0].limits = [];
  const html = responsibilityPageHtml(page, 0, []);
  assert.doesNotMatch(
    html,
    /form-domain-detail|form-handoffs|form-relations|form-claim|form-scope|form-inspect/u,
  );
  assert.match(html, /data-graphic-id="n-2"/u);
});

test('the renderer refuses malformed responsibility structures instead of guessing', async (t) => {
  for (const [name, change, code] of [
    ['absent form', (page) => (page.form = null), 'render_responsibility_page_invalid'],
    ['absent groups', (page) => (page.groups = []), 'render_responsibility_page_invalid'],
    [
      'too many roles',
      (page) => (page.form.roles = Array(7).fill(page.form.roles[0])),
      'render_responsibility_page_infeasible',
    ],
    [
      'duplicate role',
      (page) => (page.form.roles[1].groupId = 'g-0'),
      'render_responsibility_page_invalid',
    ],
    [
      'missing group member',
      (page) => (page.groups[0].nodeIds = []),
      'render_responsibility_page_invalid',
    ],
    [
      'unbound relation endpoint',
      (page) => (page.relations[0].source = 'missing'),
      'render_responsibility_page_invalid',
    ],
    [
      'unknown handoff group',
      (page) =>
        page.form.handoffs.push({
          fromGroup: 'g-0',
          toGroup: 'missing',
          basis: editorial('Unknown.'),
        }),
      'render_responsibility_page_invalid',
    ],
    [
      'same-group handoff',
      (page) =>
        page.form.handoffs.push({ fromGroup: 'g-0', toGroup: 'g-0', basis: editorial('Invalid.') }),
      'render_responsibility_lane_invalid',
    ],
    [
      'unknown role group',
      (page) => {
        page.relations = [];
        page.form.roles[0].groupId = 'missing';
      },
      'render_responsibility_page_invalid',
    ],
  ]) {
    await t.test(name, () => {
      const page = pageFixture();
      change(page);
      assert.throws(() => responsibilityPageHtml(page, 0, []), { code });
    });
  }
});
