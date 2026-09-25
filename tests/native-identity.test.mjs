import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { importLikeC4Native } from '../packages/publisher/src/semantics/index.mjs';
import { resolveLikeC4Selection } from '../packages/publisher/src/semantics/native-selection.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const contents = new Map([
  [
    'example/first',
    Buffer.from("specification { element component }\nmodel { a = component 'Shared' }\n"),
  ],
  [
    'example/second',
    Buffer.from("model { b = component 'Shared'\n c = component 'Third'\n a -> b\n b -> c }\n"),
  ],
  ['example/views', Buffer.from('views { view overview { include * } }\n')],
]);

async function nativeIndex() {
  return importLikeC4Native({
    lock: {
      schema: 'architecture.materialized-input-lock/v1',
      sources: [...contents].map(([namespace, content]) => ({
        namespace,
        claimant: 'fixture-source',
        format: { id: 'likec4/dsl', version: 'unversioned' },
        revision: { kind: 'content', algorithm: 'sha256', value: sha(content) },
        sha256: sha(content),
      })),
    },
    readSource(namespace) {
      return Buffer.from(contents.get(namespace));
    },
  });
}

const reference = (id, namespace, target) => ({
  id,
  namespace,
  kind: 'reference',
  reference: target,
});
const relationReference = ({ origin }) =>
  `relation:${origin.range.start.line + 1}:${origin.range.start.character + 1}`;

test('typed native references keep same-label source identities separate', async () => {
  const index = await nativeIndex();
  const first = resolveLikeC4Selection(index, reference('first', 'example/first', 'element:a'));
  const second = resolveLikeC4Selection(index, reference('second', 'example/second', 'element:b'));
  assert.equal(first.format, 'likec4/dsl');
  assert.equal(first.target.kind, 'element');
  assert.equal(first.target.id, 'a');
  assert.equal(first.source.namespace, 'example/first');
  assert.equal(first.source.claimant, 'fixture-source');
  assert.equal(first.members.elements.length, 1);
  assert.equal(first.members.elements[0].namespace, 'example/first');
  assert.equal(first.members.elements[0].id, 'a');
  assert.equal(first.members.elements[0].sha256, sha(contents.get('example/first')));
  assert.equal(first.members.elements[0].label, 'Shared');
  assert.equal(first.members.elements[0].kind, 'component');
  assert.deepEqual(first.members.relations, []);
  assert.equal(second.target.id, 'b');
  assert.equal(second.source.namespace, 'example/second');
  assert.notEqual(first.source.sha256, second.source.sha256);
  assert(index.elements.filter(({ label }) => label === 'Shared').length === 2);
  assert(first.limits.includes('domain-metadata-opaque'));
});

test('a relation binds only its endpoints and never invents a transitive edge', async () => {
  const index = await nativeIndex();
  const selected = index.relations.find(({ from, to }) => from.id === 'a' && to.id === 'b');
  const result = resolveLikeC4Selection(
    index,
    reference('edge', 'example/second', relationReference(selected)),
  );
  assert.equal(result.target.kind, 'relation');
  assert.equal(result.target.id, relationReference(selected));
  assert.equal(result.target.identityScope, 'source-location');
  assert.deepEqual(
    result.members.elements.map(({ id }) => id),
    ['a', 'b'],
  );
  assert.deepEqual(
    result.members.relations.map(({ id }) => id),
    [relationReference(selected)],
  );
  assert.equal(result.members.relations[0].origin.namespace, 'example/second');
  assert.equal(result.members.relations[0].direction, 'forward');
  assert.equal(result.members.relations[0].kind, null);
  assert.equal(JSON.stringify(result).includes(selected.id), false);
  assert.notEqual(index.relations[1].id, selected.id);
});

test('a native view resolves exact computed membership with its uncertainty visible', async () => {
  const index = await nativeIndex();
  const result = resolveLikeC4Selection(
    index,
    reference('overview', 'example/views', 'view:overview'),
  );
  assert.equal(result.target.kind, 'view');
  assert.deepEqual(
    result.members.elements.map(({ id }) => id),
    ['a', 'b', 'c'],
  );
  assert.equal(result.members.relations.length, 2);
  assert(result.limits.includes('view-membership-upstream-computed-unqualified'));
  assert.equal(Object.isFrozen(result.members.elements), true);
});

test('parser-run ID drift preserves a source-location selection but not a moved locator', async () => {
  const index = await nativeIndex();
  const original = index.relations[0];
  const selection = reference('edge', original.origin.namespace, relationReference(original));
  const first = resolveLikeC4Selection(index, selection);
  const moved = structuredClone(index);
  moved.relations[0].id = 'new-parser-run-id';
  moved.views[0].relations = moved.views[0].relations.map((id) =>
    id === original.id ? 'new-parser-run-id' : id,
  );
  assert.deepEqual(resolveLikeC4Selection(moved, selection), first);
  moved.relations[0].origin.range.start.line += 1;
  moved.relations[0].origin.range.end.line += 1;
  assert.throws(() => resolveLikeC4Selection(moved, selection), {
    code: 'native_likec4_reference_unselected',
  });
});

test('duplicate source relations remain distinct by location and ambiguous locators fail', async () => {
  const content = Buffer.from(
    "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b\n a -> b }\n",
  );
  const index = await importLikeC4Native({
    lock: {
      schema: 'architecture.materialized-input-lock/v1',
      sources: [
        {
          namespace: 'duplicate',
          claimant: 'fixture-source',
          format: { id: 'likec4/dsl', version: 'unversioned' },
          revision: { kind: 'content', algorithm: 'sha256', value: sha(content) },
          sha256: sha(content),
        },
      ],
    },
    readSource() {
      return Buffer.from(content);
    },
  });
  assert.equal(index.relations.length, 2);
  const [left, right] = index.relations.map((relation, offset) =>
    resolveLikeC4Selection(
      index,
      reference(`edge-${offset}`, 'duplicate', relationReference(relation)),
    ),
  );
  assert.notEqual(left.target.id, right.target.id);
  assert.deepEqual(left.members.relations[0].from, right.members.relations[0].from);
  assert.deepEqual(left.members.relations[0].to, right.members.relations[0].to);

  const malformed = structuredClone(index);
  malformed.relations[1].origin.range = structuredClone(malformed.relations[0].origin.range);
  assert.throws(
    () =>
      resolveLikeC4Selection(
        malformed,
        reference('ambiguous', 'duplicate', relationReference(malformed.relations[0])),
      ),
    { code: 'native_likec4_reference_ambiguous' },
  );
});

test('a computed view with a relation outside visible endpoint membership fails', async () => {
  const index = structuredClone(await nativeIndex());
  index.views[0].elements = index.views[0].elements.filter(({ id }) => id !== 'a');
  assert.throws(
    () => resolveLikeC4Selection(index, reference('overview', 'example/views', 'view:overview')),
    { code: 'native_likec4_view_membership_unrepresentable' },
  );
});

test('unknown, untyped, generated, opaque, and unadmitted query references fail', async () => {
  const index = await nativeIndex();
  for (const [selection, code] of [
    [
      reference('unknown', 'example/first', 'element:missing'),
      'native_likec4_reference_unselected',
    ],
    [reference('untyped', 'example/first', 'a'), 'native_likec4_reference_invalid'],
    [
      reference('wrong-source', 'example/second', 'element:a'),
      'native_likec4_reference_unselected',
    ],
    [reference('generated', 'example/views', 'view:index'), 'native_likec4_reference_unselected'],
    [
      {
        id: 'query',
        namespace: 'example/first',
        kind: 'query',
        language: 'likec4/dsl',
        expression: '*',
      },
      'native_likec4_query_unadmitted',
    ],
  ])
    assert.throws(() => resolveLikeC4Selection(index, selection), { code });

  const changed = structuredClone(index);
  changed.opaqueViews.push({
    id: 'flow',
    namespace: 'example/views',
    kind: 'dynamic',
    origin: structuredClone(changed.views[0].origin),
  });
  assert.throws(
    () => resolveLikeC4Selection(changed, reference('opaque', 'example/views', 'view:flow')),
    { code: 'native_likec4_view_uninterpreted' },
  );
});
