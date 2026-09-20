// Small synthetic boundary fixture only. It is never publication evidence.
import path from 'node:path';
import { sha256 } from '../../adapters/ethos/projection.mjs';
export function reviewHistoryFixture() {
  const root = path.resolve(path.sep, 'review-fixture'),
    data = new Map(),
    bytes = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v));
  const put = (name, value) => {
    data.set(name, bytes(value));
    return sha256(data.get(name));
  };
  const source = {
    commit: '1'.repeat(40),
    tree: '2'.repeat(40),
    digest: '3'.repeat(64),
  };
  const history = {
    review: 'reader.md',
    reviewApplicability: 'binding.json',
    ownerVisualAcceptance: 'owner.json',
    priorReview: 'prior.md',
    priorReviewApplicability: 'prior-applicability.json',
    reviewedAtlas: 'reviewed',
    predecessorAtlas: 'prior',
  };
  const pages = [
    {
      id: 'overview',
      path: 'index.html',
      htmlSha256: sha256('<p>same visible meaning</p>'),
    },
  ];
  const manifest = { sourceDigest: source.digest, pages };
  put('input.json', 'source');
  put('scripts/native-atlas.mjs', 'historical bytes only');
  put('selection.json', { sourceInput: 'input.json' });
  put('prior.md', 'prior review');
  put('prior/atlas-manifest.json', manifest);
  const comparisons = [];
  for (const file of [
    'system.architecture.json',
    'system.bindings.json',
    'preview.svg',
    'preview.png',
  ]) {
    const value = 'same ' + file;
    for (const base of ['reviewed', 'prior', 'current'])
      put(base + '/authoring/overview/' + file, value);
    comparisons.push({
      page: 'overview',
      file,
      paths: ['reviewed', 'prior', 'current'].map(
        (base) => base + '/authoring/overview/' + file,
      ),
      sha256: sha256(value),
    });
  }
  for (const base of ['reviewed', 'prior', 'current'])
    put(base + '/publication/index.html', '<p>same visible meaning</p>');
  put('prior-applicability.json', {
    status: 'PASS',
    review: { sha256: sha256('prior review') },
    checks: [
      ...comparisons.map((c) => ({
        page: 'overview',
        file: c.file,
        old: c.sha256,
        current: c.sha256,
      })),
      { page: 'overview', file: 'visible-document', same: true },
    ],
  });
  const manifestSha = put('current/atlas-manifest.json', manifest);
  const report =
    'RECEIVED_READER_CLARITY_REVIEW\n```text\n' +
    [
      ['Source commit', source.commit],
      ['Source tree', source.tree],
      ['Declared source digest', source.digest],
      ['input.json', sha256('source')],
      ['current/atlas-manifest.json', manifestSha],
      ['scripts/native-atlas.mjs', sha256('historical bytes only')],
      ['current/publication/index.html', pages[0].htmlSha256],
    ]
      .map(([k, v]) => k + '\n' + v)
      .join('\n\n') +
    '\n```\n';
  put('reader.md', report);
  put('reader.prompt.txt', 'read-only fixture');
  put('reader.log', 'read-only fixture\n' + report);
  put('owner.json', 'visual fixture only');
  const binding = {
    schema: 'ethos.reader-review-binding/v1',
    reviewVerdict: 'No remaining P0/P1/P2 finding within inspected scope',
    verifier: {
      processExitCode: 0,
      readOnlyReported: true,
      marker: 'RECEIVED_READER_CLARITY_REVIEW',
    },
    subject: {
      source,
      atlasRoot: 'current',
      atlasManifest: {
        path: 'current/atlas-manifest.json',
        sha256: manifestSha,
      },
    },
    evidenceFiles: [
      'reader.md',
      'reader.log',
      'reader.prompt.txt',
      'owner.json',
      'prior.md',
      'prior-applicability.json',
      'scripts/native-atlas.mjs',
      'input.json',
    ].map((name) => ({
      path: name,
      sha256: sha256(data.get(name)),
      bytes: data.get(name).length,
    })),
    pages,
    diagramComparisons: comparisons,
    browserAcceptance: 'UNVERIFIED',
    documentsPromoted: false,
  };
  put('binding.json', binding);
  const read = async (file) => {
    const name = path.relative(root, file).split(path.sep).join('/');
    if (!data.has(name)) throw Error('missing fixture: ' + name);
    return data.get(name);
  };
  return {
    options: { atlasRoot: root, atlasCandidate: 'current', evidence: history },
    atlas: path.join(root, 'current'),
    manifest,
    source,
    read,
    json: async (f) => JSON.parse(await read(f)),
    selectionPath: 'selection.json',
    binding,
    put,
  };
}
