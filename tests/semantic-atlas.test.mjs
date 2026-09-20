import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { writeSourceBundle } from '../src/source/write.mjs';
import { readSourceBundle } from '../src/source/bundle.mjs';
import { claimModelDigest } from '../src/semantics/document.mjs';
import { compileSemanticPublication } from '../src/publication/semantic.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');

async function fixture(t, mutateDocument = () => {}) {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, 'semantic-atlas-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const source = Buffer.from('type Registry struct { ids []string }\n');
  const document = {
    schema: 'architecture.claim-model/v2',
    owner: 'example:control-plane',
    vocabulary: {
      entities: ['component'],
      relations: ['delegates'],
      maturities: ['implemented'],
      predicates: {
        delegates: {
          valueKind: 'entity',
          cardinality: 'multiple',
          values: [],
          provenance: ['registry-source'],
        },
      },
    },
    entities: {
      cli: {
        type: 'component',
        label: 'CLI',
        qualifiers: {},
        provenance: ['registry-source'],
      },
      registry: {
        type: 'component',
        label: 'Client registry',
        qualifiers: {},
        provenance: ['registry-source'],
      },
      adapter: {
        type: 'component',
        label: 'Client adapter',
        qualifiers: {},
        provenance: ['registry-source'],
      },
    },
    relations: {
      'cli-registry': {
        type: 'delegates',
        subject: 'cli',
        object: 'registry',
        qualifiers: {},
        provenance: ['registry-source'],
      },
      'registry-adapter': {
        type: 'delegates',
        subject: 'registry',
        object: 'adapter',
        qualifiers: {},
        provenance: ['registry-source'],
      },
    },
    claims: {
      'cli-registry': {
        subject: 'cli',
        predicate: 'delegates',
        object: 'registry',
        value: null,
        plane: 'implemented',
        condition: {},
        scope: {},
        maturity: 'implemented',
        validity: 'affirmed',
        dependsOn: [{ section: 'relations', id: 'cli-registry' }],
        coverage: 'complete',
        provenance: ['registry-source'],
      },
      'registry-adapter': {
        subject: 'registry',
        predicate: 'delegates',
        object: 'adapter',
        value: null,
        plane: 'implemented',
        condition: {},
        scope: {},
        maturity: 'implemented',
        validity: 'affirmed',
        dependsOn: [{ section: 'relations', id: 'registry-adapter' }],
        coverage: 'complete',
        provenance: ['registry-source'],
      },
    },
    sources: {
      'registry-source': {
        sha256: sha(source),
        locator: 'source/internal/client/registry.go',
        authority: 'selected repository source at an exact revision',
      },
    },
    context: {},
  };
  mutateDocument(document);
  const sourceBundle = await writeSourceBundle(
    path.join(directory, 'source'),
    { id: document.owner, revision: '1'.repeat(40) },
    [
      { path: 'semantic.json', content: encode(document) },
      { path: 'source/internal/client/registry.go', content: source },
    ],
  );
  const edition = {
    schema: 'architecture.edition/v1',
    id: 'bounded-control-plane',
    owner: document.owner,
    class: 'structural',
    product: {
      name: 'Architecture Publisher',
      schema: 'architecture.publisher/v1',
      version: '0.2.0-alpha.0',
    },
    source: { manifestSha256: sourceBundle.manifestSha256 },
    claimModel: {
      schema: 'architecture.claim-model/v2',
      digest: (() => {
      try {
        return claimModelDigest(document);
      } catch {
        return '0'.repeat(64);
      }
    })(),
    },
    title: 'A bounded control plane',
    audiences: {
      maintainer: { label: 'Maintainers' },
    },
    questions: {
      system: {
        audience: 'maintainer',
        prompt: 'How does the complete control plane delegate work?',
        claims: ['cli-registry', 'registry-adapter'],
        detail: 'overview',
        risk: 'Omission would hide a declared delegation.',
      },
      registry: {
        audience: 'maintainer',
        prompt: 'How does the registry delegate to the adapter?',
        claims: ['registry-adapter'],
        detail: 'mechanism',
        risk: 'Omission would hide the selected registry mechanism.',
      },
    },
    requiredClaims: ['cli-registry', 'registry-adapter'],
    omissions: {},
    narrative: ['overview', 'registry-flow'],
    visualGrammar: {
      entityTypes: { component: 'backend' },
      relationTypes: {
        delegates: { label: 'delegates', variant: 'emphasis' },
      },
      principles: [
        'Complete overview',
        'Independent media composition',
        'No decorative meaning',
      ],
    },
    scenes: {
      static: {
        label: 'Complete static overview',
        questions: ['system'],
        claims: ['cli-registry', 'registry-adapter'],
        composition: {
          groups: [
            {
              id: 'control',
              label: 'Control plane',
              entities: ['cli', 'registry', 'adapter'],
            },
          ],
          relations: [
            {
              id: 'cli-registry',
              fromSide: 'right',
              toSide: 'left',
              route: 'orthogonal-h',
            },
            {
              id: 'registry-adapter',
              fromSide: 'right',
              toSide: 'left',
              route: 'orthogonal-h',
            },
          ],
        },
      },
      interactive: {
        overview: {
          label: 'Complete overview',
          purpose: 'overview',
          questions: ['system'],
          claims: ['cli-registry', 'registry-adapter'],
          composition: {
            groups: [
              {
                id: 'control',
                label: 'Control plane',
                entities: ['cli', 'registry', 'adapter'],
              },
            ],
            relations: [
              {
                id: 'cli-registry',
                fromSide: 'right',
                toSide: 'left',
                route: 'orthogonal-h',
              },
              {
                id: 'registry-adapter',
                fromSide: 'right',
                toSide: 'left',
                route: 'orthogonal-h',
              },
            ],
          },
        },
        'registry-flow': {
          label: 'Registry mechanism',
          purpose: 'mechanism',
          questions: ['registry'],
          claims: ['registry-adapter'],
          composition: {
            groups: [
              {
                id: 'dispatch',
                label: 'Ordered dispatch',
                entities: ['registry', 'adapter'],
              },
            ],
            relations: [
              {
                id: 'registry-adapter',
                fromSide: 'right',
                toSide: 'left',
                route: 'orthogonal-h',
              },
            ],
          },
        },
      },
    },
    qualification: {
      semantic: ['claim-model-valid'],
      coverage: ['required-claims-visible'],
      static: ['static-geometry'],
      interactive: ['browser-behavior'],
      accessibility: ['keyboard-and-reduced-motion'],
      installed: ['offline-reproduction'],
      recovery: [],
      human: [],
    },
    scope: 'Explicit fixture structure; no repository inference or approval',
  };
  const editionFile = path.join(directory, 'edition.json');
  await fs.writeFile(editionFile, encode(edition));
  return {
    directory,
    document,
    edition,
    plan: {
      sourceManifest: sourceBundle.manifestPath,
      sourceSha256: sourceBundle.manifestSha256,
      semanticMember: 'semantic.json',
      edition: editionFile,
      editionSha256: sha(await fs.readFile(editionFile)),
      output: path.join(directory, 'publication'),
    },
  };
}

test('compiles complete source-bound structure into static and interactive media', async (t) => {
  const value = await fixture(t);
  const result = await compileSemanticPublication(value.plan);
  const output = await readSourceBundle(
    result.manifestPath,
    result.manifestSha256,
  );
  const members = new Map(
    output.members.map((item) => [item.path, item.content]),
  );
  const publication = JSON.parse(members.get('publication.json'));
  assert.deepEqual(JSON.parse(members.get('semantic.json')), value.document);
  assert.deepEqual(JSON.parse(members.get('edition.json')), value.edition);
  assert.equal(publication.schema, 'architecture.edition-publication/v1');
  assert.equal(publication.semanticDigest, claimModelDigest(value.document));
  assert.equal(result.editionDigest, publication.editionDigest);
  assert.equal(result.staticSceneDigest, publication.staticSceneDigest);
  assert.equal(
    result.interactiveSceneDigest,
    publication.interactiveSceneDigest,
  );
  assert.deepEqual(
    publication.views.map((view) => view.id),
    ['overview', 'registry-flow'],
  );
  assert.equal(publication.static.id, 'overview');
  assert.deepEqual(publication.static.nodeIds, ['cli', 'registry', 'adapter']);
  assert.deepEqual(publication.static.relationIds, [
    'cli-registry',
    'registry-adapter',
  ]);
  assert.deepEqual(publication.views[0].relations, [
    {
      id: 'cli-registry',
      from: 'cli',
      to: 'registry',
      fromSide: 'right',
      toSide: 'left',
      route: 'orthogonal-h',
    },
    {
      id: 'registry-adapter',
      from: 'registry',
      to: 'adapter',
      fromSide: 'right',
      toSide: 'left',
      route: 'orthogonal-h',
    },
  ]);
  const overview = members.get('views/overview.html').toString();
  const mechanism = members.get('views/registry-flow.html').toString();
  const svg = members.get('overview.svg').toString();
  const png = members.get('overview.png');
  assert.match(svg, /@font-face/);
  assert.match(svg, /data:font\/ttf;base64,/);
  assert.match(svg, /SIL OPEN FONT LICENSE/);
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(svg, /var\(--|data-preset=|archify/i);
  assert.match(svg, /font-family="JetBrains Mono"/);
  const dimensions = svg.match(/<svg[^>]* width="([0-9]+)" height="([0-9]+)"/);
  assert(dimensions);
  assert.match(
    svg,
    new RegExp(
      `<rect width="${dimensions[1]}" height="${dimensions[2]}" fill="#181611"`,
    ),
  );
  assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  assert.equal(png.readUInt32BE(16), 2400);
  assert.equal(publication.overviewPngSha256, sha(png));
  assert.equal(publication.staticWidth, 2400);
  assert.doesNotMatch(overview, /data-preset-badge-/);
  assert.doesNotMatch(overview, /content:\s*attr\(data-preset-badge-/);
  for (const text of [overview, svg]) {
    for (const id of ['cli', 'registry', 'adapter'])
      assert.match(text, new RegExp(`data-node-id="${id}"`));
    for (const id of ['cli-registry', 'registry-adapter'])
      assert.match(text, new RegExp(`data-edge-id="${id}"`));
  }
  assert.match(mechanism, /data-node-id="registry"/);
  assert.match(mechanism, /data-node-id="adapter"/);
  assert.doesNotMatch(mechanism, /data-node-id="cli"/);
  assert.doesNotMatch(mechanism, /data-preset-badge-/);
  assert.equal(result.semanticAcceptance, 'source-bound-structure');
  assert.equal(result.browserAcceptance, 'not-performed');
});

test('static and interactive projections are compositionally independent', async (t) => {
  const baseline = await fixture(t);
  const first = await compileSemanticPublication(baseline.plan);
  const firstBundle = await readSourceBundle(
    first.manifestPath,
    first.manifestSha256,
  );
  const firstMembers = new Map(
    firstBundle.members.map((item) => [item.path, item.content]),
  );

  const interactive = await fixture(t);
  interactive.edition.scenes.interactive.overview.composition.groups[0].label =
    'Interactive control plane';
  await fs.writeFile(interactive.plan.edition, encode(interactive.edition));
  interactive.plan.editionSha256 = sha(
    await fs.readFile(interactive.plan.edition),
  );
  const second = await compileSemanticPublication(interactive.plan);
  const secondBundle = await readSourceBundle(
    second.manifestPath,
    second.manifestSha256,
  );
  const secondMembers = new Map(
    secondBundle.members.map((item) => [item.path, item.content]),
  );
  assert(firstMembers.get('overview.svg').equals(secondMembers.get('overview.svg')));
  assert(firstMembers.get('overview.png').equals(secondMembers.get('overview.png')));
  assert(
    !firstMembers
      .get('views/overview.html')
      .equals(secondMembers.get('views/overview.html')),
  );

  const staticOnly = await fixture(t);
  staticOnly.edition.scenes.static.composition.groups[0].label =
    'Static control plane';
  await fs.writeFile(staticOnly.plan.edition, encode(staticOnly.edition));
  staticOnly.plan.editionSha256 = sha(
    await fs.readFile(staticOnly.plan.edition),
  );
  const third = await compileSemanticPublication(staticOnly.plan);
  const thirdBundle = await readSourceBundle(
    third.manifestPath,
    third.manifestSha256,
  );
  const thirdMembers = new Map(
    thirdBundle.members.map((item) => [item.path, item.content]),
  );
  assert(!firstMembers.get('overview.svg').equals(thirdMembers.get('overview.svg')));
  assert(!firstMembers.get('overview.png').equals(thirdMembers.get('overview.png')));
  assert(
    firstMembers
      .get('views/overview.html')
      .equals(thirdMembers.get('views/overview.html')),
  );
});

test('rejects cross-medium semantic drift before rendering', async (t) => {
  const value = await fixture(t);
  value.edition.scenes.interactive.overview.composition.groups[0].entities.pop();
  value.edition.scenes.interactive.overview.composition.relations.pop();
  await fs.writeFile(value.plan.edition, encode(value.edition));
  value.plan.editionSha256 = sha(await fs.readFile(value.plan.edition));
  await assert.rejects(compileSemanticPublication(value.plan), {
    code: 'edition_scene_claim_carrier_missing',
  });
  await assert.rejects(fs.access(value.plan.output));
});

for (const [name, mutate, error] of [
  [
    'omitted overview entity',
    (value) => {
      value.edition.scenes.static.composition.groups[0].entities.pop();
      value.edition.scenes.static.composition.relations.pop();
    },
    'edition_scene_claim_carrier_missing',
  ],
  [
    'duplicate membership',
    (value) =>
      value.edition.scenes.static.composition.groups.push({
        id: 'duplicate',
        label: 'Duplicate',
        entities: ['registry'],
      }),
    'edition_scene_entity_invalid',
  ],
  [
    'missing explicit port',
    (value) =>
      delete value.edition.scenes.static.composition.relations[0].fromSide,
    'edition_scene_relation_invalid',
  ],
  [
    'unknown relation endpoint selection',
    (value) =>
      value.edition.scenes.interactive['registry-flow'].composition.groups[0]
        .entities.pop(),
    'edition_scene_endpoint_missing',
  ],
  [
    'stale semantic identity',
    (value) => (value.edition.claimModel.digest = '0'.repeat(64)),
    'edition_contract_invalid',
  ],
]) {
  test('rejects ' + name + ' before successful output', async (t) => {
    const value = await fixture(t);
    mutate(value);
    await fs.writeFile(value.plan.edition, encode(value.edition));
    value.plan.editionSha256 = sha(await fs.readFile(value.plan.edition));
    await assert.rejects(compileSemanticPublication(value.plan), { code: error });
    await assert.rejects(fs.access(value.plan.output));
  });
}

test('rejects a semantic source whose selected bytes changed', async (t) => {
  const value = await fixture(t);
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(value.directory, 'source/manifest.json'),
      'utf8',
    ),
  );
  const changed = await writeSourceBundle(
    path.join(value.directory, 'changed-source'),
    manifest.source,
    [
      { path: 'semantic.json', content: encode(value.document) },
      {
        path: 'source/internal/client/registry.go',
        content: Buffer.from(
          'changed while retaining the semantic source identity\n',
        ),
      },
    ],
  );
  value.plan.sourceManifest = changed.manifestPath;
  value.plan.sourceSha256 = changed.manifestSha256;
  await assert.rejects(compileSemanticPublication(value.plan), {
    code: 'semantic_source_binding_mismatch',
  });
  await assert.rejects(fs.access(value.plan.output));
});

test('rejects contradictory semantic claims before rendering', async (t) => {
  const value = await fixture(t, (document) => {
    document.claims.denied = {
      ...structuredClone(document.claims['cli-registry']),
      validity: 'refuted',
      coverage: 'complete',
    };
  });
  await assert.rejects(compileSemanticPublication(value.plan), {
    code: 'semantic_contradiction',
  });
  await assert.rejects(fs.access(value.plan.output));
});

test('rejects group cardinality beyond the finite compositor bound', async (t) => {
  const value = await fixture(t);
  value.edition.scenes.static.composition.groups[0].entities =
    Array(9).fill('cli');
  await fs.writeFile(value.plan.edition, encode(value.edition));
  value.plan.editionSha256 = sha(await fs.readFile(value.plan.edition));
  await assert.rejects(compileSemanticPublication(value.plan), {
    code: 'edition_scene_group_invalid',
  });
  await assert.rejects(fs.access(value.plan.output));
});

test('rejects static geometric infeasibility before rendering', async (t) => {
  const value = await fixture(t, (document) => {
    document.entities.registry.label = 'Unbreakable'.repeat(80);
  });
  await assert.rejects(compileSemanticPublication(value.plan), {
    code: 'semantic_publication_static_label_infeasible',
  });
  await assert.rejects(fs.access(value.plan.output));
});
