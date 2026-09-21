import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';
import {
  sha256,
  stableStringify,
} from '../migration/ethos/src/adapter/projection.mjs';
import { prepareEthosCandidate } from '../migration/ethos/src/edition/candidate.mjs';
import {
  readEthosAtlasSelection,
  renderEthosAtlas,
} from '../migration/ethos/src/edition/atlas.mjs';

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
      'migration/ethos/src/edition/authoring/manifest.json',
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
    await fs.readFile(path.join(root, 'migration/ethos/src/edition/refresh.json')),
  );
  const meaningSha256 = sha256(
    stableStringify(input.semantics.nodes.candidate_base_stale),
  );
  authoring.static.refresh.sha256 = meaningSha256;
  for (const page of authoring.interactive.pages)
    page.meaning[0].sha256 = meaningSha256;
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
  assert.deepEqual(result.evolution.ethos.changed.nodes, [
    'candidate_base_stale',
  ]);
  assert.equal(result.evolution.schema, 'architecture.semantic-change/v2');
  assert.deepEqual(Object.keys(result.evolution.obligations), [
    'rebuild',
    'semanticVerification',
    'mediumVerification',
    'humanReview',
    'acceptance',
    'publication',
  ]);
  assert.equal(result.evolution.editions.affected[0].interactive.length, 13);
  assert.equal(result.evolution.obligations.humanReview.length, 6);
  assert.deepEqual(
    new Set(
      result.evolution.obligations.humanReview.map(
        ({ predicate, scope }) => `${predicate}:${scope.medium}`,
      ),
    ),
    new Set([
      'faithful:static',
      'faithful:interactive',
      'intelligible:static',
      'intelligible:interactive',
      'restrained:static',
      'restrained:interactive',
    ]),
  );
  assert.equal(result.evolution.obligations.acceptance[0].action, 'reaccept');
  assert.equal(result.evolution.obligations.publication[0].action, 'replace');
  assert.equal(
    (await readEthosAtlasSelection(result.atlas)).pages.length,
    13,
  );
  assert.equal(result.semanticAcceptance, 'not-performed');
});

test('explicit non-refresh condition edits preserve a complete candidate and reject stale carriers', async (t) => {
  const plan = await changedSource(t, (p) => {
    p.semantics.nodes.independent_verifier.attributes.selection =
      'Committed policy selects whether independent verification is required.';
  });
  const selected = await readEthosAtlasSelection(plan.previous);
  const page = selected.pages.find((p) => p.id === 'verification');
  const node = page.spec.components.find(
    (n) => n.id === 'independent-verifier',
  );
  assert.ok(node, 'fixture contains the actual independent verifier carrier');
  const input = JSON.parse(
    await fs.readFile(
      plan.source.sourceManifest.replace(
        'manifest.json',
        'projection-input.json',
      ),
    ),
  );
  const authoring = {
    schema: 'architecture.ethos-authored-edits/v1',
    static: {},
    interactive: {
      order: selected.pages.map((p) => p.id),
      pages: [
        {
          id: page.id,
          edits: [
            {
              carrier: 'nodes/independent-verifier/tag',
              before: node.tag,
              after: 'Required by committed policy',
            },
          ],
          meaning: [
            {
              kind: 'node',
              id: 'independent_verifier',
              sha256: sha256(
                stableStringify(input.semantics.nodes.independent_verifier),
              ),
              carriers: ['nodes/independent-verifier/tag'],
            },
          ],
        },
      ],
    },
    scope: 'Synthetic condition fixture; not a real committed ETHOS export',
  };
  const write = async () => {
    await fs.writeFile(plan.authoring, encode(authoring));
    plan.authoringSha256 = sha256(await fs.readFile(plan.authoring));
  };
  await write();
  const result = await prepareEthosCandidate(plan);
  assert.deepEqual(result.evolution.ethos.changed.nodes, [
    'independent_verifier',
  ]);
  const next = await readEthosAtlasSelection(result.atlas);
  assert.deepEqual(
    next.pages.map((p) => p.id),
    selected.pages.map((p) => p.id),
  );
  assert.equal(
    next.pages
      .find((p) => p.id === page.id)
      .spec.components.find((n) => n.id === node.id).tag,
    'Required by committed policy',
  );
  assert.equal(result.semanticAcceptance, 'not-performed');
  const renderedRoot = plan.output + '-rendered';
  const rendered = await renderEthosAtlas({
    ...result.atlas,
    output: renderedRoot,
  });
  assert.equal(rendered.pages.length, selected.pages.length);
  assert.match(
    await fs.readFile(path.join(renderedRoot, page.path), 'utf8'),
    /Required by committed policy/,
  );
  authoring.interactive.pages[0].edits[0].before = 'Stale prior text';
  await write();
  const output = plan.output + '-stale';
  await assert.rejects(
    prepareEthosCandidate({ ...plan, output }),
    /Stale authored carrier/,
  );
  await assert.rejects(fs.access(output));
  const valid = structuredClone(authoring);
  valid.interactive.pages[0].edits[0].before = node.tag;
  for (const [name, mutate, error] of [
    [
      'unknown-static',
      (a) => {
        a.static.invented = true;
      },
      /Unsupported authored edits/,
    ],
    [
      'duplicate',
      (a) =>
        a.interactive.pages[0].edits.push(a.interactive.pages[0].edits[0]),
      /duplicate authored carrier/,
    ],
    [
      'unknown',
      (a) => {
        a.interactive.pages[0].edits[0].carrier = 'nodes/missing/tag';
      },
      /Unknown authored carrier/,
    ],
    [
      'missing-page',
      (a) => a.interactive.order.pop(),
      /Complete distinct page order/,
    ],
    [
      'stale-meaning',
      (a) => {
        a.interactive.pages[0].meaning[0].sha256 = '0'.repeat(64);
      },
      /meaning binding/,
    ],
    [
      'empty-meaning',
      (a) => {
        a.interactive.pages[0].meaning = [];
      },
      /authored page/,
    ],
  ]) {
    const candidate = structuredClone(valid);
    mutate(candidate);
    await fs.writeFile(plan.authoring, encode(candidate));
    const rejected = {
      ...plan,
      output: plan.output + '-' + name,
      authoringSha256: sha256(await fs.readFile(plan.authoring)),
    };
    await assert.rejects(prepareEthosCandidate(rejected), error);
    await assert.rejects(fs.access(rejected.output));
  }
});

test('explicit relation condition and page order retain source direction and full navigation', async (t) => {
  const id = 'candidate-state-to-independent';
  const plan = await changedSource(t, (p) => {
    p.semantics.relations.find((r) => r.id === id).attributes.guard =
      'Independent verification selected by committed policy';
  });
  const selected = await readEthosAtlasSelection(plan.previous);
  const page = selected.pages.find((p) => p.id === 'verification');
  const node = page.spec.components.find(
    (n) => n.id === 'independent-verifier',
  );
  const input = JSON.parse(
    await fs.readFile(
      plan.source.sourceManifest.replace(
        'manifest.json',
        'projection-input.json',
      ),
    ),
  );
  const order = selected.pages.map((p) => p.id);
  [order[1], order[2]] = [order[2], order[1]];
  const authoring = {
    schema: 'architecture.ethos-authored-edits/v1',
    static: {},
    interactive: {
      order,
      pages: [
        {
          id: page.id,
          edits: [
            {
              carrier: 'nodes/independent-verifier/tag',
              before: node.tag,
              after: 'Selected by committed policy',
            },
          ],
          meaning: [
            {
              kind: 'relation',
              id,
              sha256: sha256(
                stableStringify(
                  input.semantics.relations.find((r) => r.id === id),
                ),
              ),
              carriers: ['nodes/independent-verifier/tag'],
            },
          ],
        },
      ],
    },
    scope: 'Synthetic relation fixture; no real source approval',
  };
  await fs.writeFile(plan.authoring, encode(authoring));
  plan.authoringSha256 = sha256(await fs.readFile(plan.authoring));
  const result = await prepareEthosCandidate(plan);
  assert.deepEqual(result.evolution.ethos.changed.relations, [id]);
  const next = await readEthosAtlasSelection(result.atlas);
  assert.deepEqual(
    next.pages.map((p) => p.id),
    order,
  );
  assert.deepEqual(
    next.catalog.pages.map((p) => p.id),
    order,
  );
  assert.deepEqual(
    next.source.projection.semantics.relations.find((r) => r.id === id),
    input.semantics.relations.find((r) => r.id === id),
  );
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
