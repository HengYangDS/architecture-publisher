import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { fromSources } from '@likec4/language-services/node';
import * as semantics from '../packages/publisher/src/semantics/index.mjs';
import {
  buildLikeC4Layout,
  validateLikeC4LayoutReply,
} from '../packages/publisher/src/semantics/native-layout.mjs';
import { importLikeC4NativeWithParser } from '../packages/publisher/src/semantics/native-likec4.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const files = new Map([
  [
    'example/model',
    Buffer.from(
      "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b }\n",
    ),
  ],
  ['example/views', Buffer.from('views { view overview { include * } }\n')],
]);

function selection(contents = files, view = { namespace: 'example/views', id: 'overview' }) {
  return {
    lock: {
      schema: 'architecture.materialized-input-lock/v1',
      sources: [...contents].map(([namespace, content]) => ({
        namespace,
        claimant: 'fixture-maintainer',
        format: { id: 'likec4/dsl', version: 'unversioned' },
        revision: { kind: 'content', algorithm: 'sha256', value: sha(content) },
        sha256: sha(content),
      })),
    },
    readSource(namespace) {
      return Buffer.from(contents.get(namespace));
    },
    view,
  };
}

test('a supervised layout is separate geometry with exact visible source bindings', async () => {
  assert.equal(typeof semantics.importLikeC4Layout, 'function');
  const selected = selection();
  const layout = await semantics.importLikeC4Layout(selected);
  assert.equal(layout.closure, 'upstream-layout-unqualified');
  assert.deepEqual(layout.view, {
    namespace: 'example/views',
    id: 'overview',
    sha256: sha(files.get('example/views')),
  });
  assert.deepEqual(
    layout.nodes.map(({ id }) => id),
    ['a', 'b'],
  );
  assert(layout.bounds.width > 0 && layout.bounds.height > 0);
  assert.equal(layout.edges.length, 1);
  assert.deepEqual(layout.edges[0].from, { namespace: 'example/model', id: 'a' });
  assert.deepEqual(layout.edges[0].to, { namespace: 'example/model', id: 'b' });
  assert.deepEqual(
    layout.edges[0].relations.map(({ namespace }) => namespace),
    ['example/model'],
  );
  assert.match(layout.edges[0].relations[0].reference, /^relation:[1-9]\d*:[1-9]\d*$/u);
  assert(layout.edges[0].points.length >= 2);
  assert.match(layout.parserSupply.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(Object.isFrozen(layout.nodes), true);
  const native = await semantics.importLikeC4Native(selected);
  assert.equal(JSON.stringify(layout).includes(native.relations[0].id), false);
  assert.equal(native.parserSupply.sha256, layout.parserSupply.sha256);
});

test('an unknown authored view cannot request geometry from a generated or ambient view', async () => {
  await assert.rejects(
    semantics.importLikeC4Layout(selection(files, { namespace: 'example/views', id: 'missing' })),
    { code: 'native_likec4_reference_unselected' },
  );
});

test('layout reply validation rejects lost, forged, or geometry-only semantic carriers', async () => {
  const selected = selection();
  const layout = await semantics.importLikeC4Layout(selected);
  const { parserSupply, ...reply } = layout;
  assert(parserSupply);
  const index = await semantics.importLikeC4Native(selected);
  assert.doesNotThrow(() => validateLikeC4LayoutReply(reply, index, selected.view));
  assert.throws(
    () => validateLikeC4LayoutReply(reply, index, { namespace: 'example/views', id: 'missing' }),
    { code: 'native_likec4_reference_unselected' },
  );
  const edits = [
    (value) => (value.schema = 'architecture.native-layout/unknown'),
    (value) => value.nodes.pop(),
    (value) => (value.nodes[0].id = 'ambient'),
    (value) => (value.nodes[0].width = 0),
    (value) => (value.nodes[0].x = 10_000_001),
    (value) => (value.edges[0].from.id = 'ambient'),
    (value) => (value.edges[0].relations[0].reference = 'relation:999:999'),
    (value) => (value.edges[0].relations[0].sha256 = '0'.repeat(64)),
    (value) => (value.edges[0].relations[0].generatedId = 'parser-run-only'),
    (value) => (value.edges[0].points[0][0] = Number.NaN),
    (value) => (value.edges[0].generatedId = 'parser-run-only'),
    (value) => (value.edges = []),
  ];
  for (const edit of edits) {
    const changed = structuredClone(reply);
    edit(changed);
    assert.throws(() => validateLikeC4LayoutReply(changed, index, selected.view), {
      code: 'native_likec4_response_invalid',
    });
  }
});

test('equal-endpoint source relations remain two traced members of layout', async () => {
  const duplicate = new Map(files);
  duplicate.set(
    'example/model',
    Buffer.from(
      "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b\n a -> b }\n",
    ),
  );
  const layout = await semantics.importLikeC4Layout(selection(duplicate));
  const references = layout.edges.flatMap((edge) =>
    edge.relations.map(({ reference }) => reference),
  );
  assert.equal(references.length, 2);
  assert.equal(new Set(references).size, 2);
  const index = structuredClone(await semantics.importLikeC4Native(selection(duplicate)));
  index.relations[1].origin = structuredClone(index.relations[0].origin);
  const { parserSupply, ...reply } = layout;
  assert(parserSupply);
  assert.throws(
    () => validateLikeC4LayoutReply(reply, index, { namespace: 'example/views', id: 'overview' }),
    { code: 'native_likec4_response_invalid' },
  );
});

test('a dynamic view cannot masquerade as an authored structural layout', async () => {
  const dynamic = new Map(files);
  dynamic.set(
    'example/views',
    Buffer.from('views { view overview { include * } dynamic view flow { a -> b } }\n'),
  );
  await assert.rejects(
    semantics.importLikeC4Layout(selection(dynamic, { namespace: 'example/views', id: 'flow' })),
    { code: 'native_likec4_view_uninterpreted' },
  );
});

test('view choice is snapshotted before asynchronous supply access', async () => {
  const input = selection();
  const pending = semantics.importLikeC4Layout(input);
  input.view.id = 'missing';
  const layout = await pending;
  assert.equal(layout.view.id, 'overview');
  await assert.rejects(
    semantics.importLikeC4Layout(
      selection(files, { namespace: 'example/views', id: 'x'.repeat(2049) }),
    ),
    { code: 'native_likec4_reference_invalid' },
  );
});

test('the native layout projector maps pinned upstream geometry without parser IDs', async () => {
  let parsed;
  const index = await importLikeC4NativeWithParser(selection(), async (sources, options) => {
    parsed = await fromSources(sources, options);
    return parsed;
  });
  try {
    const layout = await buildLikeC4Layout(index, parsed, selection().view);
    assert.deepEqual(
      layout.nodes.map(({ id }) => id),
      ['a', 'b'],
    );
    assert.equal(layout.edges.length, 1);
    assert.match(layout.edges[0].relations[0].reference, /^relation:[1-9]\d*:[1-9]\d*$/u);
    assert.equal(JSON.stringify(layout).includes(index.relations[0].id), false);
    assert.doesNotThrow(() => validateLikeC4LayoutReply(layout, index, selection().view));
  } finally {
    await parsed.dispose();
  }
});

test('the native layout projector rejects incomplete or unselected geometry', async () => {
  let parsed;
  const index = await importLikeC4NativeWithParser(selection(), async (sources, options) => {
    parsed = await fromSources(sources, options);
    return parsed;
  });
  try {
    const original = (await parsed.layoutedModel()).view('overview').$layouted;
    const invalid = [
      (view) => (view._stage = 'computed'),
      (view) => (view.nodes = null),
      (view) => (view.nodes[0].modelRef = 'absent'),
      (view) => (view.nodes[1].id = view.nodes[0].id),
      (view) => (view.edges[0].source = 'absent'),
      (view) => (view.edges[0].relations[0] = 'absent'),
      (view) => (view.edges[0].points = null),
    ];
    for (const edit of invalid) {
      const changed = structuredClone(original);
      edit(changed);
      const fake = {
        async layoutedModel() {
          return { view: () => ({ $layouted: changed }) };
        },
      };
      await assert.rejects(buildLikeC4Layout(index, fake, selection().view), {
        code: 'native_likec4_layout_unrepresentable',
      });
    }
    await assert.rejects(
      buildLikeC4Layout(
        index,
        {
          async layoutedModel() {
            throw new Error('layout failed');
          },
        },
        selection().view,
      ),
      { code: 'native_likec4_layout_unrepresentable' },
    );
  } finally {
    await parsed.dispose();
  }
});

test('source-duplicate native IDs cannot be mapped by label or last-writer wins', async () => {
  let parsed;
  const index = await importLikeC4NativeWithParser(selection(), async (sources, options) => {
    parsed = await fromSources(sources, options);
    return parsed;
  });
  try {
    const ambiguous = structuredClone(index);
    ambiguous.sources.push({ ...ambiguous.sources[0], namespace: 'other-source' });
    const first = ambiguous.elements.find(({ id }) => id === 'a');
    ambiguous.elements.push({
      ...first,
      namespace: 'other-source',
      origin: { ...first.origin, namespace: 'other-source' },
    });
    ambiguous.views[0].elements.push({ namespace: 'other-source', id: 'a' });
    await assert.rejects(buildLikeC4Layout(ambiguous, parsed, selection().view), {
      code: 'native_likec4_layout_unrepresentable',
    });
  } finally {
    await parsed.dispose();
  }
});
