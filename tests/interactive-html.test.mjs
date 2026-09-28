import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { composeInteractiveHtml } from '../packages/publisher/src/rendering/index.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const html = (title, link = '') =>
  Buffer.from(
    `<!DOCTYPE html><html lang="en"><head><title>${title}</title><style>body{color:#26362f}</style></head><body><svg data-page="${title}"><g data-node-id="compiler" data-node-label="Compiler"></g></svg>${link}<script>var Archify = {}; window.pageReady = true;</script></body></html>`,
  );

function fixture() {
  const pages = [
    ['overview', 'Overview', '<a href="semantics.html">Semantics</a>', 'overview'],
    ['semantics', 'Semantics', '<a href="overview.html">Overview</a>', 'mechanism'],
  ].map(([id, label, link, purpose]) => {
    const content = html(label, link);
    return {
      id,
      label,
      shortLabel: label,
      purpose,
      path: `views/${id}.html`,
      sha256: sha256(content),
      sourceIds: ['selected-1'],
      subjectSources: { compiler: ['selected-1'] },
      facts: [
        {
          reference: '["fixture/claims","entity","compiler"]',
          sourceSha256: 'f'.repeat(64),
          graphicId: 'compiler',
          title: 'Compiler',
          facts: [{ label: 'Source kind', value: 'backend' }],
        },
      ],
      content,
    };
  });
  return {
    schema: 'architecture.interactive-html-composition/v1',
    title: 'Architecture Publisher',
    build: {
      lockSha256: 'a'.repeat(64),
      editionSha256: 'b'.repeat(64),
      semanticDigest: 'c'.repeat(64),
    },
    overview: 'overview',
    pages,
    sources: [
      {
        id: 'selected-1',
        kind: 'native',
        namespace: 'fixture/claims',
        sha256: 'f'.repeat(64),
        claimant: 'fixture-maintainer',
      },
    ],
    state: {
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    },
  };
}

function embedded(bytes) {
  const text = bytes.toString('utf8');
  const match = text.match(
    /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
  );
  assert(match, 'selected interactive data is embedded');
  return { text, data: JSON.parse(match[1]) };
}

test('one interactive HTML contract binds exact pages and source metadata without an Atlas facade', () => {
  const input = fixture();
  const { text, data } = embedded(composeInteractiveHtml(input));
  assert.equal(data.schema, 'architecture.interactive-html/v1');
  assert.deepEqual(data.build, input.build);
  assert.deepEqual(data.order, ['overview', 'semantics']);
  assert.deepEqual(data.sources['selected-1'], {
    kind: 'native',
    namespace: 'fixture/claims',
    sha256: 'f'.repeat(64),
    claimant: 'fixture-maintainer',
  });
  for (const page of input.pages) {
    const selected = data.pages[page.id];
    const rebuilt = Buffer.from(
      selected.pieces
        .map((piece) => (typeof piece === 'number' ? data.blocks[piece] : piece))
        .join(''),
    );
    assert.equal(sha256(rebuilt), page.sha256);
    assert.deepEqual(selected.facts, page.facts);
    assert.deepEqual(selected.subjectSources, page.subjectSources);
  }
  assert.match(text, /data-interactive-page="overview"/u);
  assert.match(text, /id="interactive-inspect"/u);
  assert.match(text, /id="interactive-inspector"/u);
  assert.doesNotMatch(text, /id="interactive-sources"|id="interactive-meaning"/u);
  assert.doesNotMatch(text, /id="interactive-source-code"|Source bytes are not embedded\./u);
  assert.match(text, /<link rel="icon" href="data:,">/u);
  assert.match(text, /window\.__architectureInteractive/u);
  assert.match(text, /sandbox="allow-scripts allow-downloads"/u);
  assert.doesNotMatch(text, /(?:Atlas|atlas|allow-same-origin)/u);
});

test('interactive HTML rejects changed pages, ambiguous navigation, external dependencies, and forged state', () => {
  for (const [name, mutate, code] of [
    [
      'page digest',
      (value) => (value.pages[0].sha256 = '0'.repeat(64)),
      'interactive_html_page_digest_mismatch',
    ],
    [
      'missing overview',
      (value) => (value.overview = 'missing'),
      'interactive_html_overview_missing',
    ],
    [
      'duplicate page',
      (value) => (value.pages[1].id = 'overview'),
      'interactive_html_page_invalid',
    ],
    [
      'duplicate source',
      (value) => value.sources.push({ ...value.sources[0] }),
      'interactive_html_source_invalid',
    ],
    [
      'forged qualification',
      (value) => (value.state.qualification = 'passed'),
      'interactive_html_composition_invalid',
    ],
    [
      'unknown page source',
      (value) => (value.pages[0].sourceIds = ['absent']),
      'interactive_html_page_invalid',
    ],
    [
      'unknown graphic source',
      (value) => (value.pages[0].subjectSources.compiler = ['absent']),
      'interactive_html_page_source_invalid',
    ],
    [
      'missing graphic facts',
      (value) => (value.pages[0].facts = []),
      'interactive_html_page_facts_invalid',
    ],
    [
      'source bytes',
      (value) => (value.sources[0].content = Buffer.from('secret')),
      'interactive_html_source_invalid',
    ],
  ]) {
    const input = fixture();
    mutate(input);
    assert.throws(() => composeInteractiveHtml(input), { code }, name);
  }
  const external = fixture();
  external.pages[0].content = html(
    'Overview',
    '<script src="https://example.invalid/x.js"></script>',
  );
  external.pages[0].sha256 = sha256(external.pages[0].content);
  assert.throws(() => composeInteractiveHtml(external), {
    code: 'interactive_html_external_dependency',
  });
  const missing = fixture();
  missing.pages[0].content = html('Overview', '<a href="absent.html">Missing</a>');
  missing.pages[0].sha256 = sha256(missing.pages[0].content);
  assert.throws(() => composeInteractiveHtml(missing), {
    code: 'interactive_html_navigation_target_missing',
  });
});

test('interactive HTML neutralizes script-data termination without embedding source bytes', () => {
  const input = fixture();
  input.pages[0].content = Buffer.concat([
    input.pages[0].content,
    Buffer.from('<!-- </script><script>pageEscape()</script> -->'),
  ]);
  input.pages[0].sha256 = sha256(input.pages[0].content);
  const { text, data } = embedded(composeInteractiveHtml(input));
  assert.equal(data.pages.overview.sha256, input.pages[0].sha256);
  assert.doesNotMatch(text, /<script>pageEscape\(\)<\/script>/u);
  assert.deepEqual(Object.keys(data.sources['selected-1']).sort(), [
    'claimant',
    'kind',
    'namespace',
    'sha256',
  ]);
});

test('embedded page assets do not become embedded source bytes', () => {
  const input = fixture();
  input.pages[0].content = html(
    'Overview',
    '<style>@font-face{font-family:fixture;src:url(data:font/ttf;base64,AA==)}</style>',
  );
  input.pages[0].sha256 = sha256(input.pages[0].content);
  const { text, data } = embedded(composeInteractiveHtml(input));
  assert.match(text, /data:font\/ttf;base64,AA==/u);
  assert.deepEqual(Object.keys(data.sources['selected-1']).sort(), [
    'claimant',
    'kind',
    'namespace',
    'sha256',
  ]);
});
