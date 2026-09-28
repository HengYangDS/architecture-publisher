import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { materializeBuildRequestInput } from '../packages/publisher/src/compiler/build-input.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-closure-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'edition'));
  await fs.mkdir(path.join(root, 'sources'));
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'native',
        namespace: 'example/native',
        format: { id: 'example/json', version: '1' },
        claimant: 'source-maintainer',
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'locator', path: 'sources/native.json' },
      },
    ],
    providers: [],
    media: ['static'],
    toolchain: { profile: 'portable' },
  };
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'example-atlas',
    editor: 'example-editor',
    title: 'Example architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is connected?' }],
    scope: {
      sourceNamespaces: ['example/native'],
      selections: [
        {
          id: 'system',
          namespace: 'example/native',
          kind: 'reference',
          reference: 'system',
          questions: ['shape'],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: 'A bounded view.' },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'One clear overview.' },
      interactive: {
        views: [{ id: 'overview', questions: ['shape'] }],
        intent: 'An explorable view.',
      },
    },
    visualPolicy: { profile: 'neutral', override: 'policy.json' },
  };
  const requestPath = path.join(root, 'build-request.json');
  const overridePath = path.join(root, 'edition/policy.json');
  await fs.writeFile(path.join(root, 'sources/native.json'), '{"system":true}\n');
  await fs.writeFile(path.join(root, 'edition/project.json'), JSON.stringify(project));
  await fs.writeFile(overridePath, '{"palette":"stone"}\n');
  const materialize = async (at = root) => {
    const bytes = Buffer.from(JSON.stringify(request));
    await fs.writeFile(path.join(at, 'build-request.json'), bytes);
    return materializeBuildRequestInput(path.join(at, 'build-request.json'), sha(bytes));
  };
  return { root, requestPath, overridePath, project, materialize };
}

test('selected Edition override is byte-bound without claiming full dependency closure', async (t) => {
  const f = await fixture(t);
  const first = await f.materialize();
  const selected = await fs.readFile(f.overridePath);
  assert.deepEqual(first.lock.edition.resources, [
    { ref: 'policy.json', bytes: selected.length, sha256: sha(selected) },
  ]);
  assert.deepEqual(first.readEvidence, {
    subjectLockSha256: first.lockSha256,
    items: [
      { kind: 'edition', key: 'example-atlas', method: 'filesystem-read-sha256/v1' },
      { kind: 'edition-resource', key: 'policy.json', method: 'filesystem-read-sha256/v1' },
      { kind: 'native', key: 'example/native', method: 'filesystem-read-sha256/v1' },
    ],
  });
  assert.deepEqual(first.readEditionOverride(), selected);
  const copy = first.readEditionOverride();
  copy[0] = 0;
  assert.deepEqual(first.readEditionOverride(), selected);
  assert.equal(first.closure, 'selected-roots-only');
  assert(first.limits.includes('edition-dependency-closure-unchecked'));
  assert(first.limits.includes('rendering-supplies-unchecked'));
  assert(first.limits.includes('path-confinement-under-concurrent-mutation-unproved'));

  await fs.writeFile(f.overridePath, '{"palette":"earth"}\n');
  const changed = await f.materialize();
  assert.notEqual(changed.lockSha256, first.lockSha256);
  assert.equal(changed.lock.edition.sha256, first.lock.edition.sha256);
  assert.notEqual(changed.lock.edition.resources[0].sha256, first.lock.edition.resources[0].sha256);
});

test('relocated selected override replays, while missing or linked bytes fail closed', async (t) => {
  const f = await fixture(t);
  const first = await f.materialize();
  const moved = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-closure-copy-'),
  );
  t.after(() => fs.rm(moved, { recursive: true, force: true }));
  await fs.cp(f.root, moved, { recursive: true });
  const replay = await f.materialize(moved);
  assert.equal(replay.lockSha256, first.lockSha256);

  await fs.rm(f.overridePath);
  await assert.rejects(f.materialize(), { code: 'ENOENT' });
  await fs.symlink(path.join(f.root, 'sources/native.json'), f.overridePath);
  await assert.rejects(f.materialize(), { code: 'bundle_symlink_forbidden' });
});

test('unselected local content cannot silently count as dependency closure', async (t) => {
  const f = await fixture(t);
  const first = await f.materialize();
  await fs.writeFile(path.join(f.root, 'ambient.json'), '{"unselected":true}\n');
  const later = await f.materialize();
  assert.equal(later.lockSha256, first.lockSha256);
  assert.equal(later.closure, 'selected-roots-only');
  assert(later.limits.includes('native-dependency-closure-unchecked'));
});
