import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const html = (title, link = '') =>
  Buffer.from(
    `<!DOCTYPE html><html lang="en"><head><title>${title}</title><style>body{color:#26362f}</style></head><body><svg data-page="${title}"><g data-node-id="compiler" data-node-label="Compiler"></g></svg>${link}<script>var Archify = {}; window.pageReady = true;</script></body></html>`,
  );

async function api() {
  return import('../packages/publisher/src/rendering/atlas.mjs');
}

function fixture() {
  const overview = html('Overview', '<a href="semantics.html">Semantics</a>'),
    semantics = html('Semantics', '<a href="overview.html">Overview</a>'),
    source = Buffer.from('export const meaning = true;\n');
  return {
    schema: 'architecture.atlas-composition/v1',
    title: 'Architecture Publisher',
    source: {
      id: 'architecture-publisher',
      revision: 'source-revision',
      manifestSha256: 'a'.repeat(64),
    },
    semanticDigest: 'b'.repeat(64),
    editionSha256: 'c'.repeat(64),
    editionDigest: 'd'.repeat(64),
    overview: 'overview',
    pages: [
      {
        id: 'overview',
        label: 'The complete system',
        shortLabel: 'Overview',
        purpose: 'overview',
        path: 'views/overview.html',
        sha256: sha256(overview),
        sourceIds: ['product-contract'],
        subjectSources: { compiler: ['product-contract'] },
        content: overview,
      },
      {
        id: 'semantics',
        label: 'Source-bound meaning',
        shortLabel: 'Semantics',
        purpose: 'mechanism',
        path: 'views/semantics.html',
        sha256: sha256(semantics),
        sourceIds: ['product-contract'],
        subjectSources: { compiler: ['product-contract'] },
        content: semantics,
      },
    ],
    sources: [
      {
        id: 'product-contract',
        path: 'sources/product-contract.source',
        sha256: sha256(source),
        authority: 'Canonical product meaning',
        content: source,
      },
    ],
    state: {
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    },
  };
}

function contrast(left, right) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (value) => {
    const rgb = value.match(/[a-f\d]{2}/gi).map((part) => parseInt(part, 16));
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  };
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('standalone Atlas retains exact page bytes and one source-bound navigation shell', async () => {
  const { composeStandaloneAtlas } = await api(),
    input = fixture(),
    output = composeStandaloneAtlas(input),
    text = output.toString('utf8'),
    match = text.match(
      /<script id="architecture-atlas-data" type="application\/json">([\s\S]*?)<\/script>/,
    );
  assert(match);
  const data = JSON.parse(match[1]);
  assert.equal(data.schema, 'architecture.standalone-atlas/v1');
  assert.equal(data.overview, 'overview');
  assert.deepEqual(data.order, ['overview', 'semantics']);
  assert.deepEqual(Object.keys(data.pages), ['overview', 'semantics']);
  for (const selected of input.pages) {
    const rebuilt = Buffer.from(
      data.pages[selected.id].pieces
        .map((part) => (typeof part === 'number' ? data.blocks[part] : part))
        .join(''),
    );
    assert.equal(sha256(rebuilt), selected.sha256);
  }
  assert.equal(data.pages.overview.sourceIds[0], 'product-contract');
  assert.deepEqual(data.pages.overview.subjectSources, {
    compiler: ['product-contract'],
  });
  assert.equal(
    Buffer.from(data.sources['product-contract'].base64, 'base64').toString(),
    'export const meaning = true;\n',
  );
  assert.match(text, /data-atlas-page="overview"/);
  assert.match(text, /data-atlas-page="semantics"/);
  assert.match(text, /id="atlas-sources"/);
  assert.match(
    text,
    /<aside id="atlas-source-panel" hidden role="dialog" aria-labelledby="atlas-source-title">/,
  );
  assert.match(text, /sourceClose\.focus\(\)/);
  assert.match(
    text,
    /addEventListener\('keydown',[\s\S]*event\.key === 'Escape'[\s\S]*closeSources\(\)/,
  );
  assert.match(text, /window\.__architectureAtlas/);
  const colors = Object.fromEntries(
    [...text.matchAll(/--([a-z]+):(#[a-f\d]{6})/gi)].map((match) => [match[1], match[2]]),
  );
  assert(contrast(colors.muted, colors.paper) >= 4.5);
  assert(contrast(colors.muted, colors.panel) >= 4.5);
  assert.match(text, /frame\.srcdoc/);
  assert.match(text, /html\[data-atlas-member\]\{height:100%;overflow:hidden\}/);
  assert.match(text, /html\[data-atlas-member\] body\{[^}]*height:100%;[^}]*overflow:hidden/);
  assert.match(text, /html\[data-atlas-member\] \.toolbar[^}]*display:none!important/);
  assert.match(text, /html\[data-atlas-member\] \.no-print[^}]*display:none!important/);
  assert.match(
    text,
    /html\[data-atlas-member\] \.diagram-container>svg\{[^}]*height:100%;[^}]*max-height:100%/,
  );
  assert.match(text, /aside>\*\{min-width:0\}/);
  assert.match(
    text,
    /aside>section\{[^}]*display:grid;[^}]*grid-template-rows:auto minmax\(0,1fr\);[^}]*min-width:0;[^}]*min-height:0;[^}]*overflow:hidden/,
  );
  assert.match(
    text,
    /pre\{[^}]*width:100%;[^}]*max-width:100%;[^}]*height:100%;[^}]*min-width:0;[^}]*min-height:0;[^}]*overflow:auto/,
  );
  assert.doesNotMatch(text, /ETHOS|archify\/plate|data-preset-badge/);
});

test('standalone Atlas fails closed on drift, incomplete navigation, and executable dependencies', async () => {
  const { composeStandaloneAtlas } = await api();
  const changed = fixture();
  changed.pages[0].sha256 = '0'.repeat(64);
  assert.throws(() => composeStandaloneAtlas(changed), {
    code: 'atlas_page_digest_mismatch',
  });

  const absentOverview = fixture();
  absentOverview.overview = 'missing';
  assert.throws(() => composeStandaloneAtlas(absentOverview), {
    code: 'atlas_overview_missing',
  });

  const external = fixture();
  external.pages[0].content = Buffer.from(
    '<!DOCTYPE html><svg><g data-node-id="compiler"></g></svg><script src="https://example.invalid/x.js"></script>',
  );
  external.pages[0].sha256 = sha256(external.pages[0].content);
  assert.throws(() => composeStandaloneAtlas(external), {
    code: 'atlas_external_dependency',
  });
});

test('standalone Atlas rejects unbound pages, sources and reader-state claims', async () => {
  const { composeStandaloneAtlas } = await api();
  const cases = [
    ['qualified state', (v) => (v.state.qualification = 'passed'), 'atlas_composition_invalid'],
    ['duplicate source', (v) => v.sources.push({ ...v.sources[0] }), 'atlas_source_invalid'],
    ['source authority', (v) => (v.sources[0].authority = ''), 'atlas_source_invalid'],
    ['duplicate page', (v) => (v.pages[1].id = 'overview'), 'atlas_page_invalid'],
    ['duplicate page path', (v) => (v.pages[1].path = v.pages[0].path), 'atlas_page_invalid'],
    ['missing page source', (v) => (v.pages[0].sourceIds = ['absent']), 'atlas_page_invalid'],
    [
      'invalid subject source',
      (v) => (v.pages[0].subjectSources.compiler = ['absent']),
      'atlas_page_source_invalid',
    ],
    [
      'missing subject binding',
      (v) => delete v.pages[0].subjectSources,
      'atlas_page_source_invalid',
    ],
    ['wrong overview purpose', (v) => (v.pages[0].purpose = 'mechanism'), 'atlas_overview_invalid'],
    [
      'duplicate overview purpose',
      (v) => (v.pages[1].purpose = 'overview'),
      'atlas_overview_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = fixture();
    mutate(input);
    assert.throws(() => composeStandaloneAtlas(input), { code }, name);
  }

  const invalidEncoding = fixture();
  invalidEncoding.pages[0].content = Buffer.from([0xff]);
  invalidEncoding.pages[0].sha256 = sha256(invalidEncoding.pages[0].content);
  assert.throws(() => composeStandaloneAtlas(invalidEncoding), {
    code: 'atlas_page_encoding_invalid',
  });

  const missingTarget = fixture();
  missingTarget.pages[0].content = Buffer.from(
    missingTarget.pages[0].content.toString().replace('semantics.html', 'absent.html'),
  );
  missingTarget.pages[0].sha256 = sha256(missingTarget.pages[0].content);
  assert.throws(() => composeStandaloneAtlas(missingTarget), {
    code: 'atlas_navigation_target_missing',
  });

  const externalReference = fixture();
  externalReference.pages[0].content = Buffer.from(
    externalReference.pages[0].content
      .toString()
      .replace('semantics.html', 'https://example.invalid'),
  );
  externalReference.pages[0].sha256 = sha256(externalReference.pages[0].content);
  assert.doesNotThrow(() => composeStandaloneAtlas(externalReference));
});

test('standalone Atlas neutralizes script-data termination in pages and sources', async () => {
  const { composeStandaloneAtlas } = await api(),
    input = fixture();
  input.pages[0].content = Buffer.concat([
    input.pages[0].content,
    Buffer.from('<!-- </script><script>pageEscape()</script> -->'),
  ]);
  input.pages[0].sha256 = sha256(input.pages[0].content);
  input.sources[0].content = Buffer.from('</script><script>sourceEscape()</script>');
  input.sources[0].sha256 = sha256(input.sources[0].content);
  const text = composeStandaloneAtlas(input).toString('utf8'),
    data = text.match(
      /<script id="architecture-atlas-data" type="application\/json">([\s\S]*?)<\/script>/,
    )[1];
  assert(!data.includes('<'));
  assert(JSON.parse(data));
});
