import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readSourceBundle } from '../src/source/bundle.mjs';
import { writeSourceBundle } from '../src/source/write.mjs';
import {
  sha256,
  stableStringify,
} from '../src/integrations/ethos/projection.mjs';
import { prepareEthosCandidate } from '../editions/ethos/candidate.mjs';
import { readEthosAtlasSelection } from '../editions/ethos/atlas.mjs';

const root = path.resolve(import.meta.dirname, '..');
const fixture = path.join(root, 'tests/fixtures/ethos-source/manifest.json');
const encode = (v) => Buffer.from(JSON.stringify(v, null, 2) + '\n');

async function changedSource(t, mutate) {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const dir = await fs.mkdtemp(path.join(parent, 'meaning-candidate-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const sourceSha256 = sha256(await fs.readFile(fixture));
  const bundle = await readSourceBundle(fixture, sourceSha256);
  const members = new Map(bundle.members.map((m) => [m.path, m.content]));
  const input = JSON.parse(members.get('projection-input.json'));
  const previous = {
    sourceManifest: fixture,
    sourceSha256,
    projectionDigest: input.digest,
    editionManifest: path.join(
      root,
      'editions/ethos/authoring/manifest.json',
    ),
  };
  previous.editionSha256 = sha256(
    await fs.readFile(previous.editionManifest),
  );
  mutate(input);
  input.source.revision = input.source.git.commit = 'b'.repeat(40);
  input.source.git.tree = 'c'.repeat(40);
  const graphBinding = input.source.documents.find(
    (d) => d.id === 'semantic_graph',
  );
  const graphPath = 'source/' + graphBinding.path;
  const graph = JSON.parse(members.get(graphPath));
  graph.nodes = Object.fromEntries(
    Object.entries(input.semantics.nodes).map(([id, n]) => [
      id,
      {
        ...n.attributes,
        kind: n.kind,
        label: n.label,
        evidence: n.provenance,
      },
    ]),
  );
  graph.edges = input.semantics.relations.map((r) => ({
    ...r.attributes,
    id: r.id,
    from: r.from,
    to: r.to,
    kind: r.kind,
    evidence: r.provenance,
  }));
  members.set(graphPath, encode(graph));
  graphBinding.sha256 = sha256(members.get(graphPath));
  for (const id of ['copy', 'view_profile']) {
    const binding = input.source.documents.find((d) => d.id === id);
    members.set('source/' + binding.path, encode(input.documents[id]));
    binding.sha256 = sha256(members.get('source/' + binding.path));
  }
  delete input.digest;
  input.digest = sha256(stableStringify(input) + '\n');
  members.set('projection-input.json', encode(input));
  const written = await writeSourceBundle(
    path.join(dir, 'source'),
    { id: input.source.id, revision: input.source.revision },
    [...members].map(([path, content]) => ({ path, content })),
  );
  const authoring = JSON.parse(
    await fs.readFile(path.join(root, 'editions/ethos/refresh.json')),
  );
  authoring.sha256 = sha256(
    stableStringify(input.semantics.nodes.candidate_base_stale),
  );
  const file = path.join(dir, 'authoring.json');
  await fs.writeFile(file, encode(authoring));
  return {
    previous,
    source: {
      sourceManifest: written.manifestPath,
      sourceSha256: written.manifestSha256,
      projectionDigest: input.digest,
    },
    authoring: file,
    authoringSha256: sha256(await fs.readFile(file)),
    output: path.join(dir, 'candidate'),
  };
}

test('real-shaped source refresh propagates compiler obligations through complete candidate consumption', async (t) => {
  const plan = await changedSource(t, (p) => {
    p.semantics.nodes.candidate_base_stale.attributes.semantics =
      'Re-observe. Replay unpublished work or merge preserved history, then prove again.';
  });
  const result = await prepareEthosCandidate(plan);
  assert.deepEqual(result.delta.changed.nodes, ['candidate_base_stale']);
  assert.equal(
    result.delta.compilation.schema,
    'architecture.semantic-change/v1',
  );
  assert.equal(result.delta.obligations.rebuild.length, 13);
  assert.equal(result.delta.obligations.verify.length, 13);
  assert.equal(result.delta.obligations.review.length, 13);
  assert.equal(
    (await readEthosAtlasSelection(result.atlas)).pages.length,
    13,
  );
  assert.equal(result.semanticAcceptance, 'not-performed');
});

for (const [name, mutate] of [
  [
    'added entity',
    (p) => {
      p.semantics.nodes.extra = structuredClone(
        p.semantics.nodes.candidate_base_stale,
      );
      p.view.nodes.extra = {
        omit: true,
        reason: 'Unsupported test addition',
      };
    },
  ],
  [
    'removed relation',
    (p) => {
      const relation = p.semantics.relations.pop();
      delete p.view.relations[relation.id];
    },
  ],
  [
    'changed relation',
    (p) => {
      p.semantics.relations[0].attributes.condition = 'New condition';
    },
  ],
])
  test(
    'candidate refuses ' + name + ' before reserving output',
    async (t) => {
      const plan = await changedSource(t, mutate);
      await assert.rejects(
        prepareEthosCandidate(plan),
        /Unsupported semantic delta/,
      );
      await assert.rejects(fs.access(plan.output));
    },
  );
