import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { writeSourceBundle } from '../src/source/write.mjs';
import { readEthosAtlasSelection } from '../editions/ethos/atlas.mjs';
import { renderEthosPoster } from '../editions/ethos/poster.mjs';
import { checkBindings } from '../editions/ethos/bindings.mjs';
import {
  sha256,
  stableStringify,
} from '../src/integrations/ethos/projection.mjs';

const root = path.resolve(import.meta.dirname, '..');
const source = {
  sourceManifest: path.join(root, 'tests/fixtures/ethos-source/manifest.json'),
  sourceSha256:
    '58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0',
  projectionDigest:
    '4ea40f421434106948f1e1d2d9ae5ee6c8b9868edc5538ff755876fd01d37ef8',
};
async function prepare(t, kind, mutate = () => {}) {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'candidate-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const authoring = path.join(
    root,
    'editions/ethos',
    kind === 'poster' ? 'static/authoring' : 'authoring',
  );
  const m = JSON.parse(
    await fs.readFile(path.join(authoring, 'manifest.json')),
  );
  const members = await Promise.all(
    m.files.map(async (f) => ({
      path: f.path,
      content: await fs.readFile(path.join(authoring, f.path)),
    })),
  );
  const member = members.find((m) => m.path === 'edition.json');
  const edition = JSON.parse(member.content);
  if (kind === 'poster') {
    edition.schema = 'architecture.ethos-poster-candidate/v1';
    delete edition.expected;
    edition.authoring = {};
  } else {
    edition.schema = 'architecture.ethos-atlas-candidate/v1';
    delete edition.acceptedAtlasManifestSha256;
    edition.pages.forEach((p) => delete p.acceptedHtmlSha256);
  }
  mutate(edition);
  member.content = Buffer.from(JSON.stringify(edition));
  const written = await writeSourceBundle(
    path.join(dir, 'edition'),
    { id: 'candidate:test', revision: 'unaccepted' },
    members,
  );
  return {
    ...source,
    editionManifest: written.manifestPath,
    editionSha256: written.manifestSha256,
    output: path.join(dir, 'output'),
  };
}
test('candidate atlas selects complete authored pages without invented accepted output hashes', async (t) => {
  const { output, ...plan } = await prepare(t, 'atlas');
  const result = await readEthosAtlasSelection(plan);
  assert.equal(result.mode, 'candidate');
  assert.equal(result.pages.length, 13);
  assert(result.pages.every((p) => !Object.hasOwn(p, 'acceptedHtmlSha256')));
});
test('candidate poster compiles without prior output locks but still runs geometry and semantics', async (t) => {
  const plan = await prepare(t, 'poster');
  const result = await renderEthosPoster(plan);
  assert.equal(result.mode, 'candidate');
  assert.equal(result.labels, 180);
  assert.equal(result.semanticAcceptance, 'not-performed');
  assert(Object.values(result.checks).every((c) => c.failures.length === 0));
});
test('candidate poster refuses absent measured text without reserving output', async (t) => {
  const plan = await prepare(t, 'poster', (e) => {
    e.authoring = { labels: { 'compile-title': 'Unmeasured new candidate' } };
  });
  await assert.rejects(
    renderEthosPoster(plan),
    (e) => e.code === 'measurement_missing',
  );
  await assert.rejects(fs.access(plan.output));
});
test('candidate schema refuses accepted output locks rather than silently ignoring them', async (t) => {
  const plan = await prepare(t, 'poster', (e) => {
    e.expected = { svgSha256: '0'.repeat(64) };
  });
  await assert.rejects(
    renderEthosPoster(plan),
    (e) => e.code === 'poster_fields_invalid',
  );
  await assert.rejects(fs.access(plan.output));
});
test('authored HTML semantic carriers refuse stale source or missing visible explanation', async () => {
  const input = JSON.parse(
    await fs.readFile(
      source.sourceManifest.replace('manifest.json', 'projection-input.json'),
    ),
  );
  const spec = JSON.parse(
    await fs.readFile(
      path.join(root, 'editions/ethos/authoring/pages/candidate/diagram.json'),
    ),
  );
  const bindings = JSON.parse(
    await fs.readFile(
      path.join(root, 'editions/ethos/authoring/pages/candidate/bindings.json'),
    ),
  );
  const meaning = input.semantics.nodes.candidate_base_stale;
  bindings.meaning = [
    {
      kind: 'node',
      id: 'candidate_base_stale',
      sha256: sha256(stableStringify(meaning)),
      carriers: ['cards/0/items/0'],
    },
  ];
  assert.equal(checkBindings(spec, bindings, input), 'architecture');
  spec.cards[0].items[0] = '';
  assert.throws(() => checkBindings(spec, bindings, input), /carrier/);
});
test('candidate preparation rebinds explicit source and preserves all pages without accepting them', async (t) => {
  const module = await import('../editions/ethos/candidate.mjs').catch(
    () => ({}),
  );
  assert.equal(
    typeof module.prepareEthosCandidate,
    'function',
    'candidate preparation exists',
  );
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'prepare-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const authoring = {
    schema: 'architecture.ethos-refresh-authoring/v1',
    node: 'candidate_base_stale',
    sha256: sha256(
      stableStringify(
        JSON.parse(
          await fs.readFile(
            source.sourceManifest.replace(
              'manifest.json',
              'projection-input.json',
            ),
          ),
        ).semantics.nodes.candidate_base_stale,
      ),
    ),
    static: {
      replay: 'Unpublished: replay; then re-prove',
      merge: 'Preserve history: merge; then re-prove',
      pending: 'Pending merge: exact continuation or preserved rollback',
    },
    interactive: {
      summary: 'Explicit authored summary',
      candidate: {
        label: 'Reconcile the selected lane',
        sublabel: 'Select replay or merge',
        tag: 'Re-prove',
      },
    },
    scope: 'Test candidate input',
  };
  const file = path.join(dir, 'refresh.json');
  await fs.writeFile(file, JSON.stringify(authoring));
  const atlas = path.join(root, 'editions/ethos/authoring/manifest.json');
  const result = await module.prepareEthosCandidate({
    previous: {
      ...source,
      editionManifest: atlas,
      editionSha256: sha256(await fs.readFile(atlas)),
    },
    source,
    authoring: file,
    authoringSha256: sha256(await fs.readFile(file)),
    output: path.join(dir, 'candidate'),
  });
  assert.equal(result.status, 'prepared');
  assert.equal(result.pages, 13);
  const selected = await readEthosAtlasSelection(result.atlas);
  assert.equal(selected.mode, 'candidate');
  assert.match(
    selected.pages
      .find((p) => p.id === 'candidate')
      .spec.components.find((c) => c.id === 'expected').sublabel,
    /replay/,
  );
  assert.equal(result.semanticAcceptance, 'not-performed');
  await assert.rejects(
    module.prepareEthosCandidate({
      ...result.input,
      output: path.join(dir, 'candidate'),
    }),
  );
});
