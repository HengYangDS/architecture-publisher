import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { sealMaterializedInputLock } from '../packages/publisher/src/source/materialize.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fixture() {
  const left = Buffer.from('left native\n');
  const right = Buffer.from('right native\n');
  const derived = Buffer.from('{"joined":true}\n');
  const revision = (content) => ({
    kind: 'content',
    scope: 'selected-root',
    canonicalization: 'raw-bytes/v1',
    algorithm: 'sha256',
    value: sha(content),
    verification: 'recomputed',
  });
  return {
    edition: {
      id: 'atlas',
      editor: 'editor',
      content: Buffer.from('{"edition":true}\n'),
      resources: [
        { ref: 'palette.json', content: Buffer.from('{"palette":"stone"}\n') },
        { ref: 'notes.txt', content: Buffer.from('editorial notes\n') },
      ],
    },
    sources: [
      {
        id: 'model',
        namespace: 'org.example/left',
        format: { id: 'example/native', version: '1' },
        claimant: 'left-maintainer',
        revisionEvidence: revision(left),
        content: left,
      },
      {
        id: 'model',
        namespace: 'org.example/right',
        format: { id: 'example/native', version: '1' },
        claimant: 'right-maintainer',
        revisionEvidence: revision(right),
        content: right,
      },
    ],
    derived: [
      {
        id: 'joined-index',
        claimant: 'adapter-maintainer',
        format: { id: 'example/index', version: '1' },
        derivedFrom: [
          { namespace: 'org.example/right', sha256: sha(right) },
          { namespace: 'org.example/left', sha256: sha(left) },
        ],
        adapter: { id: 'native-reader', version: '1', contentSha256: sha('adapter') },
        method: 'join/v1',
        content: derived,
      },
    ],
    media: ['interactive', 'static'],
    toolchain: { profile: 'portable' },
  };
}

test('one lock identity ignores local IDs, selected order, and object-key order', () => {
  const selected = fixture();
  selected.derived.push({
    ...selected.derived[0],
    id: 'other-index',
    adapter: { ...selected.derived[0].adapter, contentSha256: sha('other-adapter') },
  });
  const first = sealMaterializedInputLock(selected);
  const reordered = fixture();
  reordered.derived.push({
    ...reordered.derived[0],
    id: 'other-index',
    adapter: { ...reordered.derived[0].adapter, contentSha256: sha('other-adapter') },
  });
  reordered.sources.reverse();
  reordered.sources[0].id = 'different-local-handle';
  reordered.sources[1].id = 'another-local-handle';
  reordered.derived[0].id = 'renamed-projection';
  reordered.derived[0].derivedFrom.reverse();
  reordered.derived.reverse();
  reordered.edition.resources.reverse();
  reordered.media.reverse();
  reordered.sources[0].format = { version: '1', id: 'example/native' };
  reordered.sources[0].revisionEvidence = Object.fromEntries(
    Object.entries(reordered.sources[0].revisionEvidence).reverse(),
  );
  const second = sealMaterializedInputLock(reordered);
  assert.equal(second.lockSha256, first.lockSha256);
  assert.equal(second.lockJson, first.lockJson);
  assert.equal(first.lock.sources.length, 2);
  assert.equal(first.lock.derived.length, 2);
  assert.deepEqual(
    first.lock.derived[0].derivedFrom.map(({ namespace }) => namespace),
    ['org.example/left', 'org.example/right'],
  );
  assert.deepEqual(
    first.lock.edition.resources.map(({ ref }) => ref),
    ['notes.txt', 'palette.json'],
  );
  assert.equal(Object.hasOwn(first.lock, 'closure'), false);
  assert.equal(Object.hasOwn(first.lock, 'delivery'), false);
  assert.equal(Object.hasOwn(first.lock, 'provider'), false);
});

test('native namespace and complete derived meaning each have one global owner', () => {
  const selected = fixture();
  selected.sources.push({ ...selected.sources[0], id: 'same-namespace' });
  assert.throws(() => sealMaterializedInputLock(selected), {
    code: 'materialized_source_namespace_duplicate',
  });

  const sameDerived = fixture();
  sameDerived.derived.push({ ...sameDerived.derived[0], id: 'second-local-id' });
  assert.throws(() => sealMaterializedInputLock(sameDerived), {
    code: 'materialized_derived_duplicate',
  });
  sameDerived.derived[1] = {
    ...sameDerived.derived[1],
    adapter: { ...sameDerived.derived[1].adapter, contentSha256: sha('other-adapter') },
  };
  assert.equal(sealMaterializedInputLock(sameDerived).lock.derived.length, 2);
});

test('different revision evidence cannot borrow an equivalent-content lock identity', () => {
  const selected = fixture();
  const first = sealMaterializedInputLock(selected);
  selected.sources[0].revisionEvidence = {
    kind: 'opaque',
    value: sha(selected.sources[0].content),
    verification: 'attributed-only',
    method: 'none',
  };
  const second = sealMaterializedInputLock(selected);
  assert.notEqual(second.lockSha256, first.lockSha256);
});

test('derived ancestors must resolve to exact selected native contents', () => {
  const missing = fixture();
  missing.derived[0].derivedFrom[0].namespace = 'org.example/absent';
  assert.throws(() => sealMaterializedInputLock(missing), {
    code: 'materialized_derived_ancestor_invalid',
  });

  const changed = fixture();
  changed.derived[0].derivedFrom[0].sha256 = sha('wrong bytes');
  assert.throws(() => sealMaterializedInputLock(changed), {
    code: 'materialized_derived_ancestor_invalid',
  });

  const repeated = fixture();
  repeated.derived[0].derivedFrom.push(repeated.derived[0].derivedFrom[0]);
  assert.throws(() => sealMaterializedInputLock(repeated), {
    code: 'materialized_derived_ancestor_invalid',
  });

  const empty = fixture();
  empty.derived[0].derivedFrom = [];
  assert.throws(() => sealMaterializedInputLock(empty), {
    code: 'materialized_derived_ancestor_invalid',
  });
});

test('Edition resources have unique logical references, independent of local paths', () => {
  const selected = fixture();
  selected.edition.resources.push({
    ref: 'PALETTE.json',
    content: Buffer.from('same bytes do not authorize a second resource'),
  });
  assert.throws(() => sealMaterializedInputLock(selected), {
    code: 'materialized_edition_resource_duplicate',
  });
});

test('legacy or missing Edition resource fields cannot disappear from the lock', () => {
  const legacy = fixture();
  delete legacy.edition.resources;
  legacy.edition.override = Buffer.from('legacy override bytes');
  assert.throws(() => sealMaterializedInputLock(legacy), {
    code: 'materialized_edition_resources_invalid',
  });

  const missing = fixture();
  delete missing.edition.resources;
  assert.throws(() => sealMaterializedInputLock(missing), {
    code: 'materialized_edition_resources_invalid',
  });
});

test('semantic accessors return byte copies without a global local-ID namespace', () => {
  const selected = fixture();
  const sealed = sealMaterializedInputLock(selected);
  assert.deepEqual(sealed.readSource('org.example/left'), selected.sources[0].content);
  assert.deepEqual(
    sealed.readEditionResource('palette.json'),
    selected.edition.resources[0].content,
  );
  assert.deepEqual(sealed.readDerived(sealed.lock.derived[0]), selected.derived[0].content);
  const copy = sealed.readSource('org.example/left');
  copy[0] = 0;
  assert.deepEqual(sealed.readSource('org.example/left'), selected.sources[0].content);
  assert.throws(() => sealed.readSource('model'), { code: 'materialized_item_unknown' });
  assert.throws(() => sealed.readEditionResource('missing.txt'), {
    code: 'materialized_item_unknown',
  });
  assert.throws(() => sealed.readDerived({ ...sealed.lock.derived[0], method: 'wrong' }), {
    code: 'materialized_item_unknown',
  });
});
