import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { writeSourceBundle } from '../src/source/write.mjs';
import { readEthosSource } from '../adapters/ethos/projection.mjs';
import { fixture, encode, sha } from './fixtures/ethos-source.mjs';

async function setup(t) {
  const dir = new URL('../build/test-work/', import.meta.url);
  await fs.mkdir(dir, { recursive: true });
  const root = await fs.mkdtemp(new URL('ethos input-', dir));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('writes and consumes full ETHOS projection without executing source code', async (t) => {
  const root = await setup(t),
    f = fixture();
  const written = await writeSourceBundle(
    path.join(root, 'bundle'),
    f.source,
    f.members,
  );
  const read = await readEthosSource(
    written.manifestPath,
    written.manifestSha256,
    f.input.digest,
  );
  assert.deepEqual(read.projection, f.input);
  assert.deepEqual(read.projection.semantics.relations[0].attributes, {
    condition: 'transient failure',
    quantifier: 'Any',
    scope: 'attempt',
  });
  assert.equal(read.officialReplay, 'not-performed');
  assert.equal(read.semanticAcceptance, 'not-performed');
  assert.deepEqual(
    read.sourceDocuments.find((d) => d.path === 'docs/contract.md').content,
    f.contents['docs/contract.md'],
  );
});

test('writer refuses an occupied target without changing it', async (t) => {
  const root = await setup(t),
    f = fixture(),
    target = path.join(root, 'occupied');
  await fs.mkdir(target);
  await fs.writeFile(path.join(target, 'keep'), 'original');
  await assert.rejects(writeSourceBundle(target, f.source, f.members), {
    code: 'output_exists',
  });
  assert.equal(
    await fs.readFile(path.join(target, 'keep'), 'utf8'),
    'original',
  );
});

test('writer validates member identity before creating the destination', async (t) => {
  const root = await setup(t),
    f = fixture(),
    target = path.join(root, 'bad');
  f.members[0].path = '../escape';
  await assert.rejects(writeSourceBundle(target, f.source, f.members), {
    code: 'member_path_invalid',
  });
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });
});

test('offline reader requires externally selected projection identity', async (t) => {
  const root = await setup(t),
    f = fixture(),
    w = await writeSourceBundle(path.join(root, 'bundle'), f.source, f.members);
  await assert.rejects(
    readEthosSource(w.manifestPath, w.manifestSha256, '0'.repeat(64)),
    { code: 'projection_digest_mismatch' },
  );
  await assert.rejects(readEthosSource(w.manifestPath, w.manifestSha256), {
    code: 'projection_digest_required',
  });
});

const changes = [
  [
    'missing source member',
    (f) => {
      f.members = f.members.filter((m) => m.path !== 'source/docs/contract.md');
    },
    'projection_member_missing',
  ],
  [
    'source bytes substituted',
    (f) => {
      f.members.find((m) => m.path === 'source/docs/contract.md').content =
        Buffer.from('substitute');
    },
    'projection_binding_mismatch',
  ],
  [
    'embedded quality substituted',
    (f) => {
      f.input.documents.quality_contract = '{}';
      f.refresh();
    },
    'projection_document_mismatch',
  ],
  [
    'embedded copy substituted',
    (f) => {
      f.input.documents.copy = {};
      f.refresh();
    },
    'projection_document_mismatch',
  ],
  [
    'embedded view substituted',
    (f) => {
      f.input.documents.view_profile = {};
      f.refresh();
    },
    'projection_document_mismatch',
  ],
  [
    'duplicate source binding',
    (f) => {
      f.input.source.bindings.push({ ...f.input.source.bindings[0] });
      f.refresh();
    },
    'projection_binding_duplicate',
  ],
  [
    'changed source revision',
    (f) => {
      f.input.source.revision = '3'.repeat(40);
      f.refresh();
    },
    'projection_source_invalid',
  ],
  [
    'unknown provenance',
    (f) => {
      f.input.semantics.nodes.attempt.provenance = ['missing'];
      f.refresh();
    },
    'projection_provenance_invalid',
  ],
  [
    'unknown endpoint',
    (f) => {
      f.input.semantics.relations[0].to = 'missing';
      f.refresh();
    },
    'projection_relation_invalid',
  ],
  [
    'escaping source path',
    (f) => {
      f.input.source.bindings[0].path = '../escape';
      f.refresh();
    },
    'member_path_invalid',
  ],
  [
    'extra source document',
    (f) => {
      f.input.source.documents.push({
        id: 'unknown',
        path: 'extra',
        sha256: sha(''),
      });
      f.refresh();
    },
    'projection_documents_invalid',
  ],
  [
    'declaration drift',
    (f) => {
      f.declaration.documents.copy = 'other';
      f.members.find((m) => m.path.endsWith('declaration.json')).content =
        encode(f.declaration);
    },
    'projection_declaration_mismatch',
  ],
  [
    'unbound bundle member',
    (f) => {
      f.members.push({ path: 'unbound.txt', content: Buffer.from('noise') });
    },
    'projection_members_mismatch',
  ],
  [
    'self-declared effect authority',
    (f) => {
      f.input.authority.effect_authority = true;
      f.refresh();
    },
    'projection_authority_invalid',
  ],
];
for (const collection of ['nodes', 'relations'])
  for (const field of [
    'id',
    'label',
    'kind',
    'from',
    'to',
    'provenance',
    'attributes',
    'authority',
    'contracts',
  ])
    changes.push([
      `${collection} presentation overriding ${field}`,
      (f) => {
        const view = Object.values(f.input.view[collection])[0];
        view.project[field] = 'substituted source meaning';
        f.refresh();
      },
      'projection_view_semantic_override',
    ]);
for (const [name, change, code] of changes)
  test(`rejects ${name}`, async (t) => {
    const root = await setup(t),
      f = fixture();
    change(f);
    const w = await writeSourceBundle(
      path.join(root, 'bundle'),
      f.source,
      f.members,
    );
    await assert.rejects(
      readEthosSource(w.manifestPath, w.manifestSha256, f.input.digest),
      { code },
    );
  });

test('requires source license in the exact bundle closure', async (t) => {
  const root = await setup(t),
    f = fixture();
  f.members = f.members.filter((m) => m.path !== 'source/LICENSE');
  const w = await writeSourceBundle(
    path.join(root, 'bundle'),
    f.source,
    f.members,
  );
  await assert.rejects(
    readEthosSource(w.manifestPath, w.manifestSha256, f.input.digest),
    { code: 'projection_member_missing' },
  );
});

test('writer rejects symlink parent and manifest subdirectory collisions', async (t) => {
  const root = await setup(t),
    f = fixture(),
    actual = path.join(root, 'actual'),
    link = path.join(root, 'link');
  await fs.mkdir(actual);
  await fs.symlink('actual', link);
  await assert.rejects(
    writeSourceBundle(path.join(link, 'output'), f.source, f.members),
    { code: 'output_parent_invalid' },
  );
  await assert.rejects(
    writeSourceBundle(path.join(root, 'collision'), f.source, [
      { path: 'manifest.json/member', content: Buffer.from('x') },
    ]),
    { code: 'manifest_self_member' },
  );
});

for (const [name, members, code] of [
  [
    'manifest size',
    Array.from({ length: 4096 }, (_, i) => ({
      path: `${i}-` + 'a'.repeat(220),
      content: Buffer.alloc(0),
    })),
    'manifest_size_exceeded',
  ],
  [
    'directory entries',
    Array.from({ length: 4096 }, (_, i) => ({
      path: `${i}/nested/member`,
      content: Buffer.alloc(0),
    })),
    'bundle_entries_exceeded',
  ],
])
  test(`writer rejects unreadable ${name} before creating output`, async (t) => {
    const root = await setup(t),
      target = path.join(root, 'oversized');
    await assert.rejects(
      writeSourceBundle(target, { id: 'bounded' }, members),
      { code },
    );
    await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  });
