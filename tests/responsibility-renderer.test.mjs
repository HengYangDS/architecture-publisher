import assert from 'node:assert/strict';
import test from 'node:test';
import { responsibilityMapHtml } from '../packages/publisher/renderers/interactive/responsibility-map.mjs';
import { responsibilityPageHtml } from '../packages/publisher/renderers/interactive/responsibility.mjs';
import { loadFigureIconSupply } from '../packages/publisher/renderers/icons/index.mjs';

const figureIcons = await loadFigureIconSupply();

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
      { id: 'n-0', label: 'Alpha', kind: 'component', figureKind: 'component', icon: 'lucide:box' },
      { id: 'n-1', label: 'Beta', kind: 'component', figureKind: 'component', icon: 'lucide:box' },
      { id: 'n-2', label: 'Gamma', kind: 'component', figureKind: 'component', icon: 'lucide:box' },
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

test('one primary map carries roles, nodes, relations, and the editorial handoff', () => {
  const page = pageFixture();
  page.form.handoffs = [
    { fromGroup: 'g-0', toGroup: 'g-1', basis: editorial('Selected handoff.') },
  ];
  const html = responsibilityPageHtml(page, 0, [], figureIcons);
  const figure = html.match(/<figure class="form-map"[\s\S]*?<\/figure>/u)?.[0];
  assert.ok(figure, 'one primary visual map exists');
  for (const id of ['g-0', 'g-1', 'n-0', 'n-1', 'n-2', 'r-0', 'r-1'])
    assert.match(figure, new RegExp(`data-graphic-id="${id}"`, 'u'));
  assert.match(figure, /data-form-handoff="g-0:g-1"/u);
  assert.doesNotMatch(html, /class="form-relations"/u);
});

test('separate form pages keep SVG labels and arrow markers page-local', () => {
  const page = pageFixture();
  page.form.handoffs = [
    { fromGroup: 'g-0', toGroup: 'g-1', basis: editorial('Selected handoff.') },
  ];
  const html =
    responsibilityPageHtml(page, 0, [], figureIcons) +
    responsibilityPageHtml(page, 1, [], figureIcons);
  const ids = [...html.matchAll(/\sid="([^"]+)"/gu)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const reference of html.matchAll(/url\(#([^)]+)\)/gu))
    assert(ids.includes(reference[1]), `missing SVG target ${reference[1]}`);
  for (const figure of html.matchAll(/<svg class="form-map-graph"[^>]+>/gu))
    assert.match(figure[0], /aria-labelledby="[^"]+" aria-describedby="[^"]+"/u);
});

test('a one-member role in each domain still attaches a selected source relation', () => {
  const page = pageFixture();
  page.groups[0].nodeIds = ['n-0'];
  page.nodes.splice(1, 1);
  page.relations.splice(0, 1);
  page.relations[0].source = 'n-0';
  page.claims = [];
  const html = responsibilityPageHtml(page, 0, [], figureIcons);
  assert.match(html, /data-source="n-0" data-target="n-2"/u);
  assert.match(html, /data-graphic-id="n-0"/u);
  assert.match(html, /data-graphic-id="n-2"/u);
});

test('responsibility SVG identity requires a valid page index', () => {
  const page = pageFixture();
  for (const index of [-1, '0'])
    assert.throws(() => responsibilityMapHtml(page, index, figureIcons), {
      code: 'render_responsibility_page_invalid',
    });
});

test('one visual map retains internal and cross-domain source evidence', () => {
  const html = responsibilityPageHtml(pageFixture(), 0, [], figureIcons);
  const figure = html.match(/<figure class="form-map"[\s\S]*?<\/figure>/u)?.[0];
  assert.ok(figure);
  const firstRole = html.indexOf('data-graphic-id="g-0"');
  const secondRole = html.indexOf('data-graphic-id="g-1"');
  const internalRelation = html.indexOf('data-graphic-id="r-0"');
  const crossRelation = html.indexOf('data-graphic-id="r-1"');
  assert.ok(firstRole < secondRole && secondRole < internalRelation);
  assert.ok(internalRelation < crossRelation);
  assert.match(html, /maintains/u);
  assert.equal(html.match(/Editorial judgment · editor · unverified/gu)?.length, 2);
  assert.match(html, /<dt>condition<\/dt><dd>active<\/dd>/u);
  assert.match(html, /data-graphic-id="c-0"/u);
  assert.match(figure, /Claim on Alpha → Beta/u);
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
  const html = responsibilityPageHtml(page, 0, [], figureIcons);
  assert.match(html, /Selected source Claim · editorial interpretation/u);
  assert.match(html, /Scope · selected client only/u);
  assert.match(html, /data-form-handoff="g-1:g-0"/u);
  assert.match(html, /data-source="n-2" data-target="n-1"/u);
  assert.match(html, /marker-start="url\(#form-source-arrow-0\)"/u);
  assert.match(html, /Both directions/u);
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
  const html = responsibilityPageHtml(page, 1, ['Parser is not a sandbox.'], figureIcons);
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
  const html = responsibilityPageHtml(page, 0, [], figureIcons);
  assert.doesNotMatch(
    html,
    /form-domain-detail|form-handoffs|form-relations|form-claim|form-scope|form-inspect/u,
  );
  assert.match(html, /data-graphic-id="n-2"/u);
});

test('a selected node label wraps without dropping words or shrinking type', () => {
  const page = pageFixture();
  page.nodes[0].label = 'Primary control authority';
  const html = responsibilityPageHtml(page, 0, [], figureIcons);
  assert.match(html, />Primary control<\/text>/u);
  assert.match(html, />authority<\/text>/u);
  assert.match(html, /font-size="12"/u);
});

test('a responsibility relation retains its selected predicate spelling', () => {
  const page = pageFixture();
  page.relations[0].label = 'read-only';
  const html = responsibilityPageHtml(page, 0, [], figureIcons);
  assert.match(html, />read-only<\/text>/u);

  page.relations[0].label = null;
  const unlabeled = responsibilityPageHtml(page, 0, [], figureIcons);
  assert.match(unlabeled, /<h3>Unlabeled source relation<\/h3>/u);
  assert.doesNotMatch(unlabeled, /<text[^>]*>Selected source relation<\/text>/u);
  assert.match(unlabeled, /data-graphic-id="r-0" data-source="n-0" data-target="n-1"/u);
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
      'group member absent from selected nodes',
      (page) => page.groups[0].nodeIds.push('missing'),
      'render_responsibility_page_invalid',
    ],
    [
      'selected node without a role',
      (page) => page.nodes.push({ id: 'n-3', label: 'Delta' }),
      'render_responsibility_page_invalid',
    ],
    [
      'empty selected role',
      (page) => {
        page.groups[0].nodeIds = [];
        page.nodes = page.nodes.filter(({ id }) => id === 'n-2');
        page.relations = [];
        page.claims = [];
      },
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
      'duplicate handoff',
      (page) =>
        page.form.handoffs.push(
          { fromGroup: 'g-0', toGroup: 'g-1', basis: editorial('One.') },
          { fromGroup: 'g-0', toGroup: 'g-1', basis: editorial('Two.') },
        ),
      'render_responsibility_page_invalid',
    ],
    [
      'internal source cycle',
      (page) =>
        page.relations.push({
          id: 'r-2',
          source: 'n-1',
          target: 'n-0',
          label: 'returns',
          direction: 'directed',
        }),
      'render_responsibility_page_infeasible',
    ],
    [
      'source relation label cannot fit',
      (page) =>
        (page.relations[0].label = 'a predicate too long for its selected relation corridor'),
      'render_responsibility_text_unrepresentable',
    ],
    [
      'single node word cannot fit',
      (page) => (page.nodes[0].label = 'Supercalifragilisticexpialidocious'),
      'render_responsibility_text_unrepresentable',
    ],
    [
      'node label needs more than two lines',
      (page) => (page.nodes[0].label = 'Primary control authority connection'),
      'render_responsibility_text_unrepresentable',
    ],
    [
      'Claim link outside selected relations',
      (page) => (page.claims[0].relationOrdinal = 99),
      'render_responsibility_page_invalid',
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
      assert.throws(() => responsibilityPageHtml(page, 0, [], figureIcons), { code });
    });
  }
});
