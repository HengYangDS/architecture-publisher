import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  executeLikeC4Layout,
  executeLikeC4Native,
  nativePermissionSupported,
  validateNativeIndexReply,
} from '../packages/publisher/src/semantics/native-execution.mjs';
import { readLikeC4ParserSupply } from '../packages/publisher/src/semantics/supply.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = [
  [
    'example/model',
    Buffer.from(
      "specification { element component }\nmodel { left = component 'Left'\n right = component 'Right'\n left -> right }\n",
    ),
  ],
  ['example/views', Buffer.from('views { view overview { include * } }\n')],
];

function selected() {
  return sourceBytes.map(([namespace, content]) => ({
    source: {
      namespace,
      claimant: 'example-maintainer',
      format: { id: 'likec4/dsl', version: 'unversioned' },
      revision: { kind: 'content', algorithm: 'sha256', value: sha(content) },
      sha256: sha(content),
    },
    content: Buffer.from(content),
  }));
}

test('native permission support fails closed below the stable capability floor', () => {
  assert.equal(nativePermissionSupported('22.12.0'), false);
  assert.equal(nativePermissionSupported('22.13.0'), true);
  assert.equal(nativePermissionSupported('23.4.0'), false);
  assert.equal(nativePermissionSupported('23.5.0'), true);
  assert.equal(nativePermissionSupported('26.9.0'), true);
  assert.equal(nativePermissionSupported('invalid'), false);
});

test('native Worker parses selected bytes under the verified private supply', async () => {
  const supply = await readLikeC4ParserSupply();
  assert.equal(sha(supply.parserBytes), supply.parserSha256);
  assert.equal(Object.hasOwn(supply, 'fromSources'), false);
  const index = await executeLikeC4Native(selected(), supply);
  assert.equal(index.elements.length, 2);
  assert.equal(index.relations.length, 1);
  assert.equal(index.views.length, 1);
  assert.deepEqual(
    index.sources.map(({ namespace }) => namespace),
    ['example/model', 'example/views'],
  );
  assert.deepEqual(index.parserSupply, { id: 'likec4-parser', sha256: supply.sha256 });
});

test('native source order follows stable code-point identity, not host locale', async () => {
  const supply = await readLikeC4ParserSupply();
  const sources = selected();
  sources[0].source.namespace = 'A';
  sources[1].source.namespace = 'a';
  const index = await executeLikeC4Native(sources, supply);
  assert.deepEqual(
    index.sources.map(({ namespace }) => namespace),
    ['A', 'a'],
  );
});

test('native execution snapshots verified parser bytes before yielding', async () => {
  const supply = await readLikeC4ParserSupply();
  const running = executeLikeC4Native(selected(), supply);
  supply.parserBytes.fill(0, 0, 128);
  const index = await running;
  assert.equal(index.elements.length, 2);
});

test('native execution rejects an unbounded selected source descriptor', async () => {
  const supply = await readLikeC4ParserSupply();
  const sources = selected();
  sources[0].source.claimant = 'x'.repeat(9_000);
  await assert.rejects(executeLikeC4Native(sources, supply), {
    code: 'native_likec4_selection_invalid',
  });
});

test('native Worker withholds an index on timeout, output overflow, or unproved cleanup', async () => {
  const supply = await readLikeC4ParserSupply();
  await assert.rejects(executeLikeC4Native(selected(), supply, { timeoutMs: 1 }), {
    code: 'native_likec4_timeout',
  });
  await assert.rejects(executeLikeC4Native(selected(), supply, { replyBytes: 128 }), {
    code: 'native_likec4_reply_size_invalid',
  });
  await assert.rejects(
    executeLikeC4Native(selected(), supply, {
      terminateTree: async () => {
        throw Object.assign(new Error('cleanup unproved'), {
          code: 'native_likec4_cleanup_unproved',
        });
      },
    }),
    { code: 'native_likec4_cleanup_unproved' },
  );
});

test('native parent rejects a reply with changed selected identity or malformed index', () => {
  const selectedSources = selected().map(({ source }) => source);
  assert.throws(
    () =>
      validateNativeIndexReply(
        { schema: 'architecture.native-index/v1', sources: [] },
        selectedSources,
      ),
    { code: 'native_likec4_response_invalid' },
  );
  assert.throws(
    () =>
      validateNativeIndexReply(
        { schema: 'architecture.native-index/v1', sources: selectedSources },
        selectedSources,
      ),
    { code: 'native_likec4_response_invalid' },
  );
});

test('native parent rejects a source range whose quality marker contradicts its span', async () => {
  const index = await executeLikeC4Native(selected(), await readLikeC4ParserSupply());
  const { parserSupply: _parserSupply, ...raw } = structuredClone(index);
  assert.doesNotThrow(() => validateNativeIndexReply(raw, index.sources));
  const changed = structuredClone(raw);
  changed.elements[0].origin.quality =
    changed.elements[0].origin.quality === 'point' ? 'range' : 'point';
  assert.throws(() => validateNativeIndexReply(changed, index.sources), {
    code: 'native_likec4_response_invalid',
  });
});

test('native parent rejects lost uncertainty and duplicate visible membership', async () => {
  const index = await executeLikeC4Native(selected(), await readLikeC4ParserSupply());
  const { parserSupply: _parserSupply, ...valid } = structuredClone(index);
  assert.doesNotThrow(() => validateNativeIndexReply(valid, index.sources));
  const counterexamples = [
    (value) => value.semanticLimits.pop(),
    (value) => value.views.push(structuredClone(value.views[0])),
    (value) => value.views[0].elements.push(structuredClone(value.views[0].elements[0])),
    (value) => value.generatedViews.push(value.generatedViews[0]),
    (value) =>
      value.opaqueViews.push({
        id: 'uninterpreted',
        namespace: value.views[0].namespace,
        kind: 'dynamic',
        origin: structuredClone(value.views[0].origin),
      }),
  ];
  for (const mutate of counterexamples) {
    const changed = structuredClone(valid);
    mutate(changed);
    assert.throws(() => validateNativeIndexReply(changed, index.sources), {
      code: 'native_likec4_response_invalid',
    });
  }
});

test('native parent rejects malformed typed meaning before admitting parser output', async () => {
  const index = await executeLikeC4Native(selected(), await readLikeC4ParserSupply());
  const { parserSupply: _parserSupply, ...valid } = structuredClone(index);
  const counterexamples = [
    ['changed selected source', (value) => (value.sources[0].sha256 = '0'.repeat(64))],
    ['non-JSON metadata', (value) => (value.elements[0].opaqueMetadata = { value: 1n })],
    ['origin without quality', (value) => delete value.elements[0].origin.quality],
    ['array element metadata', (value) => (value.elements[0].opaqueMetadata = [])],
    ['numeric relation kind', (value) => (value.relations[0].kind = 1)],
    ['numeric relation label', (value) => (value.relations[0].label = 1)],
    ['array relation metadata', (value) => (value.relations[0].opaqueMetadata = [])],
    [
      'duplicate relation identity',
      (value) => value.relations.push(structuredClone(value.relations[0])),
    ],
    ['unselected relation endpoint', (value) => (value.relations[0].to.id = 'missing')],
    [
      'opaque view without a kind',
      (value) =>
        value.opaqueViews.push({
          id: 'opaque',
          namespace: value.views[0].namespace,
          origin: structuredClone(value.views[0].origin),
        }),
    ],
    ['empty generated view identity', (value) => value.generatedViews.push('')],
  ];
  for (const [name, mutate] of counterexamples) {
    const changed = structuredClone(valid);
    mutate(changed);
    assert.throws(
      () => validateNativeIndexReply(changed, index.sources),
      {
        code: 'native_likec4_response_invalid',
      },
      name,
    );
  }
});

test('native execution refuses malformed supply, selection, limits, and layout intent before spawn', async () => {
  const supply = await readLikeC4ParserSupply();
  const valid = selected();
  const cyclic = selected();
  cyclic[0].source.format.self = cyclic[0].source.format;
  const cases = [
    ['missing supply', valid, null, {}, 'native_likec4_supply_invalid'],
    [
      'changed parser bytes',
      valid,
      { ...supply, parserBytes: Buffer.alloc(supply.parserBytes.length) },
      {},
      'native_likec4_supply_invalid',
    ],
    ['empty selection', [], supply, {}, 'native_likec4_selection_invalid'],
    [
      'non-buffer content',
      [{ source: valid[0].source, content: 'not bytes' }],
      supply,
      {},
      'native_likec4_selection_invalid',
    ],
    ['cyclic source descriptor', cyclic, supply, {}, 'native_likec4_selection_invalid'],
    ['duplicate namespaces', [valid[0], valid[0]], supply, {}, 'native_likec4_selection_invalid'],
    [
      'changed selected digest',
      [{ ...valid[0], source: { ...valid[0].source, sha256: '0'.repeat(64) } }],
      supply,
      {},
      'native_likec4_digest_mismatch',
    ],
    [
      'excessive reply limit',
      valid,
      supply,
      { replyBytes: 16 * 1024 * 1024 + 1 },
      'native_likec4_execution_limit_invalid',
    ],
  ];
  for (const [name, items, selectedSupply, limits, code] of cases)
    await assert.rejects(executeLikeC4Native(items, selectedSupply, limits), { code }, name);
  await assert.rejects(executeLikeC4Layout(valid, supply, { namespace: '', id: 'overview' }), {
    code: 'native_likec4_reference_invalid',
  });
});

test('native Worker expires after replying when its supervisor is absent', async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-native-orphan-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const parser = path.join(scratch, 'parser.mjs');
  const worker = fileURLToPath(
    new URL('../packages/publisher/src/semantics/native-worker.mjs', import.meta.url),
  );
  await fs.writeFile(parser, (await readLikeC4ParserSupply()).parserBytes);
  const environment = {
    HOME: scratch,
    PATH: scratch,
    ...(process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}),
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const child = spawnSync(process.execPath, [worker, '3000'], {
    cwd: scratch,
    env: environment,
    input: JSON.stringify({
      schema: 'architecture.native-parser-request/v1',
      selected: selected().map(({ source, content }) => ({
        source,
        contentBase64: content.toString('base64'),
      })),
    }),
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(child.status, 1, child.stderr);
  assert.equal(child.signal, null);
  assert.equal(child.stderr, '');
  const reply = JSON.parse(child.stdout.trim());
  assert.equal(reply.status, 'ok');
  assert.equal(reply.index.elements.length, 2);
});

test('native Worker rejects malformed input and never falls back to an installed parser', async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-native-invalid-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const worker = fileURLToPath(
    new URL('../packages/publisher/src/semantics/native-worker.mjs', import.meta.url),
  );
  const environment = {
    HOME: scratch,
    PATH: scratch,
    ...(process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}),
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
  };
  const cases = [
    [{}, 'native_likec4_selection_invalid'],
    [
      {
        schema: 'architecture.native-parser-request/v1',
        selected: [{ source: { namespace: 'model' }, contentBase64: '%' }],
      },
      'native_likec4_selection_invalid',
    ],
    [
      {
        schema: 'architecture.native-parser-request/v1',
        selected: selected().map(({ source, content }) => ({
          source,
          contentBase64: content.toString('base64'),
        })),
      },
      'native_likec4_execution_failed',
    ],
  ];
  for (const [request, code] of cases) {
    const child = spawnSync(process.execPath, [worker, '200'], {
      cwd: scratch,
      env: environment,
      input: JSON.stringify(request),
      encoding: 'utf8',
      timeout: 3_000,
      maxBuffer: 1024 * 1024,
    });
    assert.equal(child.status, 1, child.stderr);
    assert.equal(child.stderr, '');
    assert.deepEqual(JSON.parse(child.stdout.trim()), { status: 'error', code });
  }
});
