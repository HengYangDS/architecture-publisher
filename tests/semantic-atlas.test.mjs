import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { writeSourceBundle } from '../src/source/write.mjs';
import { readSourceBundle } from '../src/source/bundle.mjs';
import { semanticDigest } from '../src/semantics/document.mjs';
import { compileSemanticAtlas } from '../src/composition/architecture.mjs';

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
    schema: 'architecture.semantic-document/v1',
    owner: 'example:control-plane',
    vocabulary: {
      entities: ['component'],
      relations: ['delegates'],
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
    assertions: {},
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
  const authoring = {
    schema: 'architecture.semantic-publication/v1',
    semanticDigest: (() => {
      try {
        return semanticDigest(document);
      } catch {
        return '0'.repeat(64);
      }
    })(),
    title: 'A bounded control plane',
    entityTypes: { component: 'backend' },
    relationTypes: {
      delegates: { label: 'delegates', variant: 'emphasis' },
    },
    views: [
      {
        id: 'overview',
        label: 'Complete overview',
        purpose: 'overview',
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
      {
        id: 'registry-flow',
        label: 'Registry mechanism',
        purpose: 'mechanism',
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
    ],
    scope: 'Explicit fixture structure; no repository inference or approval',
  };
  const authoringFile = path.join(directory, 'authoring.json');
  await fs.writeFile(authoringFile, encode(authoring));
  return {
    directory,
    document,
    authoring,
    plan: {
      sourceManifest: sourceBundle.manifestPath,
      sourceSha256: sourceBundle.manifestSha256,
      semanticMember: 'semantic.json',
      authoring: authoringFile,
      authoringSha256: sha(await fs.readFile(authoringFile)),
      output: path.join(directory, 'publication'),
    },
  };
}

test('compiles complete source-bound structure into static and interactive media', async (t) => {
  const value = await fixture(t);
  const result = await compileSemanticAtlas(value.plan);
  const output = await readSourceBundle(
    result.manifestPath,
    result.manifestSha256,
  );
  const members = new Map(
    output.members.map((item) => [item.path, item.content]),
  );
  const publication = JSON.parse(members.get('publication.json'));
  assert.deepEqual(JSON.parse(members.get('semantic.json')), value.document);
  assert.equal(publication.semanticDigest, semanticDigest(value.document));
  assert.deepEqual(
    publication.views.map((view) => view.id),
    ['overview', 'registry-flow'],
  );
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
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<style><!\[CDATA\[[\s\S]*\.c-backend/);
  assert.match(svg, /<rect width="100%" height="100%" fill="var\(--bg\)"/);
  for (const text of [overview, svg]) {
    for (const id of ['cli', 'registry', 'adapter'])
      assert.match(text, new RegExp(`data-node-id="${id}"`));
    for (const id of ['cli-registry', 'registry-adapter'])
      assert.match(text, new RegExp(`data-edge-id="${id}"`));
  }
  assert.match(mechanism, /data-node-id="registry"/);
  assert.match(mechanism, /data-node-id="adapter"/);
  assert.doesNotMatch(mechanism, /data-node-id="cli"/);
  assert.equal(result.semanticAcceptance, 'source-bound-structure');
  assert.equal(result.browserAcceptance, 'not-performed');
});

for (const [name, mutate, error] of [
  [
    'omitted overview entity',
    (value) => {
      value.authoring.views[0].groups[0].entities.pop();
      value.authoring.views[0].relations.pop();
    },
    'semantic_publication_overview_incomplete',
  ],
  [
    'duplicate membership',
    (value) =>
      value.authoring.views[0].groups.push({
        id: 'duplicate',
        label: 'Duplicate',
        entities: ['registry'],
      }),
    'semantic_publication_membership_invalid',
  ],
  [
    'missing explicit port',
    (value) => delete value.authoring.views[0].relations[0].fromSide,
    'semantic_publication_relation_layout_invalid',
  ],
  [
    'unknown relation endpoint selection',
    (value) => value.authoring.views[1].groups[0].entities.pop(),
    'semantic_publication_relation_endpoint_missing',
  ],
  [
    'stale semantic identity',
    (value) => (value.authoring.semanticDigest = '0'.repeat(64)),
    'semantic_publication_semantic_digest_mismatch',
  ],
]) {
  test('rejects ' + name + ' before successful output', async (t) => {
    const value = await fixture(t);
    mutate(value);
    await fs.writeFile(value.plan.authoring, encode(value.authoring));
    value.plan.authoringSha256 = sha(await fs.readFile(value.plan.authoring));
    await assert.rejects(compileSemanticAtlas(value.plan), { code: error });
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
  await assert.rejects(compileSemanticAtlas(value.plan), {
    code: 'semantic_source_binding_mismatch',
  });
  await assert.rejects(fs.access(value.plan.output));
});

test('rejects contradictory semantic propositions before rendering', async (t) => {
  const value = await fixture(t, (document) => {
    document.assertions.allowed = {
      value: true,
      proposition: {
        subject: 'cli',
        predicate: 'delegates',
        object: 'registry',
        polarity: 'positive',
        qualifiers: {},
      },
      dependsOn: [],
      coverage: 'complete',
      provenance: ['registry-source'],
    };
    document.assertions.denied = {
      ...structuredClone(document.assertions.allowed),
      value: false,
      proposition: {
        ...document.assertions.allowed.proposition,
        polarity: 'negative',
      },
    };
  });
  await assert.rejects(compileSemanticAtlas(value.plan), {
    code: 'semantic_contradiction',
  });
  await assert.rejects(fs.access(value.plan.output));
});

test('rejects group cardinality beyond the finite compositor bound', async (t) => {
  const value = await fixture(t);
  value.authoring.views[0].groups[0].entities = Array(9).fill('cli');
  await fs.writeFile(value.plan.authoring, encode(value.authoring));
  value.plan.authoringSha256 = sha(await fs.readFile(value.plan.authoring));
  await assert.rejects(compileSemanticAtlas(value.plan), {
    code: 'semantic_publication_group_invalid',
  });
  await assert.rejects(fs.access(value.plan.output));
});

test('rejects renderer-declared geometric infeasibility', async (t) => {
  const value = await fixture(t, (document) => {
    document.entities.registry.label = 'Unbreakable'.repeat(80);
  });
  await assert.rejects(compileSemanticAtlas(value.plan), {
    code: 'render_native_rejected',
  });
  await assert.rejects(fs.access(value.plan.output));
});
