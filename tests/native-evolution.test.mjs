import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/index.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/index.mjs';
import { compileNativeSelectionDelta } from '../packages/publisher/src/semantics/change.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

async function snapshot(fixture) {
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  const meaning = await compileEditionMeaning(selected);
  return { lock: selected.lock, native: meaning.native };
}

async function replaceSource(fixture, source, bytes) {
  const entry = fixture.request.sources.find(({ id }) => id === source);
  assert(entry);
  await fs.writeFile(path.join(fixture.root, entry.input.path), bytes);
  entry.input.sha256 = sha(bytes);
  await rewriteRequest(fixture);
}

async function rewriteRequest(fixture) {
  const requestBytes = Buffer.from(JSON.stringify(fixture.request) + '\n');
  await fs.writeFile(fixture.file, requestBytes);
  fixture.digest = sha(requestBytes);
}

test('native comparison detects a source-bound label change without relying on cardinality', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(
    after,
    'model',
    Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'")),
  );
  const delta = compileNativeSelectionDelta(await snapshot(before), await snapshot(after));
  assert.deepEqual(delta.sourceBytes.changed, ['fixture/model']);
  assert.deepEqual(delta.supported, [
    {
      selectionId: 'overview',
      subject: { kind: 'element', namespace: 'fixture/model', id: 'alpha' },
      fields: ['label'],
    },
  ]);
  assert(delta.unknown.some(({ reason }) => reason === 'dependency-closure-unproved'));
  assert.equal(delta.hasChanges, true);
});

test('native comparison detects a changed selected view membership', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(after, 'views', Buffer.from('views { view overview { include alpha } }\n'));
  const delta = compileNativeSelectionDelta(await snapshot(before), await snapshot(after));
  assert.deepEqual(delta.sourceBytes.changed, ['fixture/views']);
  assert(
    delta.supported.some(
      ({ subject, fields }) => subject.kind === 'view-membership' && fields.includes('elements'),
    ),
  );
  assert.equal(delta.hasChanges, true);
});

test('native comparison of identical selected inputs has no invented change', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const delta = compileNativeSelectionDelta(await snapshot(before), await snapshot(after));
  assert.deepEqual(delta.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(delta.sourceBindings, { changed: [] });
  assert.deepEqual(delta.supported, []);
  assert.deepEqual(delta.unknown, []);
  assert.equal(delta.supplyChanged, false);
  assert.equal(delta.hasChanges, false);
});

test('native comparison does not hide changed source attribution behind equal content bytes', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  after.request.sources[0].claimant = 'another-maintainer';
  await rewriteRequest(after);
  const delta = compileNativeSelectionDelta(await snapshot(before), await snapshot(after));
  assert.deepEqual(delta.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(delta.sourceBindings.changed, ['fixture/model']);
  assert.equal(delta.hasChanges, true);
});

test('relocated relation locators retain uncertainty but expose changed qualifier values', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const changed =
    '\n' +
    after.model
      .toString()
      .replace('alpha -> beta', "alpha -> beta { metadata { policy 'review' } }");
  await replaceSource(after, 'model', Buffer.from(changed));
  const delta = compileNativeSelectionDelta(await snapshot(before), await snapshot(after));
  assert(delta.unknown.some(({ reason }) => reason === 'relation-lineage-unproved'));
  assert(
    delta.supported.some(
      ({ subject, fields }) =>
        subject.kind === 'relation-set' && fields.includes('relation-values'),
    ),
  );
});

test('relation locator drift alone is not reported as a proven view membership change', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(after, 'model', Buffer.from('\n' + after.model.toString()));
  const delta = compileNativeSelectionDelta(await snapshot(before), await snapshot(after));
  assert.deepEqual(delta.supported, []);
  assert(delta.unknown.some(({ reason }) => reason === 'relation-lineage-unproved'));
});
