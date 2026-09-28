import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { materializeBuildRequestInput } from '../packages/publisher/src/compiler/build-input.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-revision-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'edition'));
  await fs.mkdir(path.join(root, 'sources'));
  const sourcePath = path.join(root, 'sources/system.json');
  const requestPath = path.join(root, 'build-request.json');
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'system-source',
        namespace: 'example/source',
        format: { id: 'example/json', version: '1' },
        claimant: 'example-maintainer',
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'locator', path: 'sources/system.json' },
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
      sourceNamespaces: ['example/source'],
      selections: [
        {
          id: 'system',
          namespace: 'example/source',
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
    visualPolicy: { profile: 'neutral' },
  };
  await fs.writeFile(path.join(root, 'edition/project.json'), JSON.stringify(project));
  await fs.writeFile(sourcePath, '{"a":1}\n');
  const materialize = async () => {
    const bytes = Buffer.from(JSON.stringify(request));
    await fs.writeFile(requestPath, bytes);
    return materializeBuildRequestInput(requestPath, sha(bytes));
  };
  return { root, sourcePath, request, materialize };
}

function git(repo, ...args) {
  const result = spawnSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    timeout: 10_000,
    env: { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0' },
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout.trim();
}

test('content revision recomputes a scoped digest separate from selected byte identity', async (t) => {
  const f = await fixture(t);
  const raw = await f.materialize();
  const rawBytes = await fs.readFile(f.sourcePath);
  assert.deepEqual(raw.lock.sources[0].revision, {
    kind: 'content',
    scope: 'selected-root',
    canonicalization: 'raw-bytes/v1',
    algorithm: 'sha256',
    value: sha(rawBytes),
    verification: 'recomputed',
  });
  assert.equal(raw.lock.sources[0].sha256, sha(rawBytes));

  f.request.sources[0].revision.canonicalization = 'publisher-json/v1';
  const canonical = await f.materialize();
  assert.equal(canonical.lock.sources[0].revision.value, sha(Buffer.from('{"a":1}')));
  assert.equal(canonical.lock.sources[0].revision.verification, 'recomputed');
  assert.notEqual(canonical.lock.sources[0].revision.value, canonical.lock.sources[0].sha256);
  assert.notEqual(canonical.lockSha256, raw.lockSha256);
});

test('declared canonical JSON is strict; a hash-shaped opaque label never becomes Git evidence', async (t) => {
  const f = await fixture(t);
  f.request.sources[0].revision.canonicalization = 'publisher-json/v1';
  await fs.writeFile(f.sourcePath, '{"z":2,"a":1}\n');
  await assert.rejects(f.materialize(), { code: 'materialized_revision_not_canonical' });
  await fs.writeFile(f.sourcePath, '{"a":1,"a":2}\n');
  await assert.rejects(f.materialize(), { code: 'materialized_revision_not_canonical' });
  await fs.writeFile(f.sourcePath, '{"__proto__":1}\n');
  await assert.rejects(f.materialize(), { code: 'materialized_revision_json_invalid' });
  await fs.writeFile(f.sourcePath, Buffer.from([0xff]));
  await assert.rejects(f.materialize(), { code: 'materialized_revision_json_invalid' });

  f.request.sources[0].revision = { kind: 'opaque', value: 'a'.repeat(40) };
  const priorPath = process.env.PATH;
  try {
    process.env.PATH = '';
    const opaque = await f.materialize();
    assert.deepEqual(opaque.lock.sources[0].revision, {
      kind: 'opaque',
      value: 'a'.repeat(40),
      verification: 'attributed-only',
      method: 'none',
    });
    assert.equal(opaque.lock.sources[0].sha256, sha(Buffer.from([0xff])));
  } finally {
    process.env.PATH = priorPath;
  }
});

test('VCS revision distinguishes a checked selected object from unverified pinned provenance', async (t) => {
  const f = await fixture(t);
  const repo = path.join(f.root, 'repo');
  await fs.mkdir(repo);
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.name', 'Fixture');
  git(repo, 'config', 'user.email', 'fixture@example.invalid');
  const bytes = Buffer.from('{"a":2}\n');
  await fs.writeFile(path.join(repo, 'system.json'), bytes);
  git(repo, 'add', 'system.json');
  git(repo, 'commit', '-qm', 'selected');
  const commit = git(repo, 'rev-parse', 'HEAD');
  const blob = git(repo, 'rev-parse', 'HEAD:system.json');
  f.request.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: commit };
  f.request.sources[0].input = { kind: 'locator', path: 'system.json' };
  const checked = await f.materialize();
  assert.deepEqual(checked.lock.sources[0].revision, {
    kind: 'vcs',
    repository: 'repo',
    ref: commit,
    object: commit,
    blob,
    verification: 'selected-object-checked',
    method: 'git-commit-tree-blob/v1',
  });
  assert.equal(checked.lock.sources[0].sha256, sha(bytes));

  await fs.writeFile(f.sourcePath, bytes);
  f.request.sources[0].input = {
    kind: 'pin',
    path: 'sources/system.json',
    sha256: sha(bytes),
  };
  const priorPath = process.env.PATH;
  try {
    process.env.PATH = '';
    const pinned = await f.materialize();
    assert.deepEqual(pinned.lock.sources[0].revision, {
      kind: 'vcs',
      repository: 'repo',
      ref: commit,
      object: null,
      blob: null,
      verification: 'unverified',
      method: 'none',
    });
    assert(pinned.limits.includes('vcs-provenance-unverified:example/source'));
    assert.equal(pinned.lock.sources[0].sha256, checked.lock.sources[0].sha256);
  } finally {
    process.env.PATH = priorPath;
  }
});
