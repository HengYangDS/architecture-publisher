import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { compileEditionNativeSelections } from '../packages/publisher/src/compiler/native.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/index.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(
  t,
  {
    label = 'Selected',
    target = 'element:a',
    format = 'likec4/dsl',
    extraUnselected = false,
    narrative = 'Selected native architecture.',
    visualProfile = 'neutral',
    toolchainProfile = 'portable',
  } = {},
) {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-native-edition-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'edition'));
  await fs.mkdir(path.join(root, 'sources'));
  const model = Buffer.from(
    `specification { element component }\nmodel { a = component '${label}' }\n`,
  );
  const views = Buffer.from('views { view overview { include * } }\n');
  await fs.writeFile(path.join(root, 'sources/model.c4'), model);
  await fs.writeFile(path.join(root, 'sources/views.c4'), views);
  const namespaces = ['example/model', 'example/views'];
  const opaque = Buffer.from('{"uninterpreted":true}\n');
  if (extraUnselected) {
    namespaces.push('example/opaque');
    await fs.writeFile(path.join(root, 'sources/opaque.json'), opaque);
  }
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'native-atlas',
    editor: 'example-editor',
    title: 'Native architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is selected?' }],
    scope: {
      sourceNamespaces: namespaces,
      selections: [
        { id: 'selected-element', namespace: namespaces[0], kind: 'reference', reference: target },
        {
          id: 'selected-view',
          namespace: namespaces[1],
          kind: 'reference',
          reference: 'view:overview',
        },
      ],
      limits: [],
    },
    requiredAssertions: [
      { id: 'element', kind: 'source', selection: 'selected-element', questions: ['shape'] },
      { id: 'view', kind: 'source', selection: 'selected-view', questions: ['shape'] },
    ],
    omissions: [],
    transformations: [],
    narrative: { summary: narrative, readingOrder: ['shape'] },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'One overview.' },
      interactive: {
        views: [{ id: 'overview', questions: ['shape'] }],
        intent: 'An explorable overview.',
      },
    },
    visualPolicy: { profile: visualProfile },
  };
  await fs.writeFile(path.join(root, 'edition/project.json'), JSON.stringify(project) + '\n');
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      { id: 'model', namespace: namespaces[0], path: 'sources/model.c4', content: model, format },
      { id: 'views', namespace: namespaces[1], path: 'sources/views.c4', content: views, format },
      ...(extraUnselected
        ? [
            {
              id: 'opaque',
              namespace: namespaces[2],
              path: 'sources/opaque.json',
              content: opaque,
              format: 'example/native-json',
            },
          ]
        : []),
    ].map(({ id, namespace, path: locator, content, format: sourceFormat }) => ({
      id,
      namespace,
      format: { id: sourceFormat, version: sourceFormat === 'likec4/dsl' ? 'unversioned' : '1' },
      claimant: 'example-maintainer',
      revision: { kind: 'content', algorithm: 'sha256' },
      input: { kind: 'pin', path: locator, sha256: sha(content) },
    })),
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: toolchainProfile },
  };
  const bytes = Buffer.from(JSON.stringify(request) + '\n');
  const file = path.join(root, 'build-request.json');
  await fs.writeFile(file, bytes);
  return materializeBuildRequestInput(file, sha(bytes));
}

test('native Edition compilation binds selected meaning without a duplicate Claim Model', async (t) => {
  assert.equal(typeof compileEditionNativeSelections, 'function');
  const selected = await fixture(t);
  const result = await compileEditionNativeSelections(selected);
  assert.equal(result.subjectLockSha256, selected.lockSha256);
  assert.match(result.semanticDigest, /^[0-9a-f]{64}$/u);
  assert.deepEqual(
    result.selections.map(({ selectionId, target }) => [selectionId, target.kind, target.id]),
    [
      ['selected-element', 'element', 'a'],
      ['selected-view', 'view', 'overview'],
    ],
  );
  assert.equal(result.selections[0].members.elements[0].label, 'Selected');
  assert.equal(result.selections[0].source.sha256, selected.lock.sources[0].sha256);
  assert.equal(result.nativeClosure, 'parsed-document-set-only');
  assert.match(result.parserSupply.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(JSON.stringify(result).includes('parser-run'), false);
});

test('relocation preserves meaning while changed selected bytes create a new identity', async (t) => {
  const first = await compileEditionNativeSelections(await fixture(t));
  const relocated = await compileEditionNativeSelections(await fixture(t));
  assert.deepEqual(relocated, first);
  const changed = await compileEditionNativeSelections(await fixture(t, { label: 'Changed' }));
  assert.notEqual(changed.subjectLockSha256, first.subjectLockSha256);
  assert.notEqual(changed.semanticDigest, first.semanticDigest);
  assert.equal(changed.selections[0].members.elements[0].label, 'Changed');
});

test('editorial and toolchain changes alter the lock but not selected native meaning', async (t) => {
  const first = await compileEditionNativeSelections(await fixture(t));
  for (const change of [
    { narrative: 'A different editorial summary.' },
    { visualProfile: 'restrained' },
    { toolchainProfile: 'candidate-layout' },
  ]) {
    const next = await compileEditionNativeSelections(await fixture(t, change));
    assert.notEqual(next.subjectLockSha256, first.subjectLockSha256);
    assert.equal(next.semanticDigest, first.semanticDigest);
    assert.deepEqual(next.selections, first.selections);
  }
});

test('native compilation fails closed on an unresolved or unadmitted source reference', async (t) => {
  const unknown = await fixture(t, { target: 'element:absent' });
  await assert.rejects(compileEditionNativeSelections(unknown), {
    code: 'native_likec4_reference_unselected',
  });
  const unsupported = await fixture(t, { format: 'example/native' });
  await assert.rejects(compileEditionNativeSelections(unsupported), {
    code: 'native_format_unadmitted',
  });
  const mixed = await fixture(t, { extraUnselected: true });
  await assert.rejects(compileEditionNativeSelections(mixed), {
    code: 'native_format_unadmitted',
  });
});

test('native compilation rejects a missing limit envelope and unbound input identity', async (t) => {
  const selected = await fixture(t);
  const withoutLimits = { ...selected };
  delete withoutLimits.limits;
  await assert.rejects(compileEditionNativeSelections(withoutLimits), {
    code: 'edition_native_input_invalid',
  });
  for (const changed of [
    { ...selected, lockSha256: '0'.repeat(64) },
    { ...selected, readEdition: () => Buffer.from('{}\n') },
    { ...selected, readEdition: () => '{}' },
    { ...selected, readSource: null },
  ])
    await assert.rejects(compileEditionNativeSelections(changed), {
      code: 'edition_native_input_invalid',
    });
  const mismatchedEdition = structuredClone(selected.lock);
  mismatchedEdition.edition.id = 'other-editorial-root';
  await assert.rejects(
    compileEditionNativeSelections({
      ...selected,
      lock: mismatchedEdition,
      lockSha256: sha(Buffer.from(JSON.stringify(mismatchedEdition))),
    }),
    { code: 'edition_native_input_invalid' },
  );
});
