import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { materializeBuildRequestInput } from '../packages/publisher/src/edition/index.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function editionProject(namespace = 'example/source') {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'example-atlas',
    editor: 'example-editor',
    title: 'Example architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is connected?' }],
    scope: {
      sourceNamespaces: [namespace],
      selections: [{ id: 'system', namespace, kind: 'reference', reference: 'system' }],
      limits: [],
    },
    requiredAssertions: [
      { id: 'system-fact', kind: 'source', selection: 'system', questions: ['shape'] },
    ],
    omissions: [],
    transformations: [],
    narrative: { summary: 'A bounded view of the selected system.', readingOrder: ['shape'] },
    presentation: {
      static: { questions: ['shape'], intent: 'One clear overview.' },
      interactive: { questions: ['shape'], intent: 'An explorable view.' },
    },
    visualPolicy: { profile: 'neutral' },
  };
}

function buildRequest() {
  return {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'system-source',
        namespace: 'example/source',
        format: { id: 'example/native-json', version: '1' },
        claimant: 'example-maintainer',
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'locator', path: 'sources/system.json' },
      },
    ],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
}

async function fixture(t) {
  const parent = await fs.realpath(os.tmpdir());
  const root = await fs.mkdtemp(path.join(parent, 'archpub-materialize-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'edition'));
  await fs.mkdir(path.join(root, 'sources'));
  const project = editionProject();
  const request = buildRequest();
  const sourcePath = path.join(root, 'sources/system.json');
  const projectPath = path.join(root, 'edition/project.json');
  const requestPath = path.join(root, 'build-request.json');
  await fs.writeFile(sourcePath, '{"system":"first"}\n');
  await fs.writeFile(projectPath, JSON.stringify(project) + '\n');
  const save = async () => {
    const bytes = Buffer.from(JSON.stringify(request) + '\n');
    await fs.writeFile(requestPath, bytes);
    return sha(bytes);
  };
  return { root, project, request, sourcePath, projectPath, requestPath, save };
}

test('duplicate Build Request and Edition Project authority keys fail on exact bytes', async (t) => {
  const f = await fixture(t);
  const requestBytes = Buffer.from(
    JSON.stringify(f.request).replace(
      '{',
      '{"edition":{"kind":"direct","root":"wrong","manifest":"other.json"},',
    ) + '\n',
  );
  await fs.writeFile(f.requestPath, requestBytes);
  await assert.rejects(materializeBuildRequestInput(f.requestPath, sha(requestBytes)), {
    code: 'materialized_request_json_duplicate_key',
  });

  const projectBytes = Buffer.from(
    JSON.stringify(f.project).replace('"scope":', '"scope":{"sourceNamespaces":[]},"scope":') +
      '\n',
  );
  await fs.writeFile(f.projectPath, projectBytes);
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_edition_json_duplicate_key',
  });
});

test('formatted Build Request and Edition Project JSON remain valid', async (t) => {
  const f = await fixture(t);
  const requestBytes = Buffer.from(JSON.stringify(f.request, null, 2) + '\n');
  await fs.writeFile(f.requestPath, requestBytes);
  await fs.writeFile(f.projectPath, JSON.stringify(f.project, null, 2) + '\n');
  const result = await materializeBuildRequestInput(f.requestPath, sha(requestBytes));
  assert.equal(result.project.id, 'example-atlas');
});

test('mutable authoring locator creates a new identity without carrying acceptance', async (t) => {
  const f = await fixture(t);
  const first = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(first.lock.schema, 'architecture.materialized-input-lock/v1');
  assert.equal(sha(Buffer.from(first.lockJson)), first.lockSha256);
  assert.equal(first.lock.closure, 'selected-roots-only');
  assert(first.limits.includes('edition-dependency-closure-unchecked'));
  assert.equal(first.lock.sources[0].sha256, sha(Buffer.from('{"system":"first"}\n')));
  assert.equal(first.read('system-source').toString(), '{"system":"first"}\n');
  assert.equal(Object.hasOwn(first.lock, 'acceptance'), false);
  const alteredLock = first.lock;
  alteredLock.sources[0].sha256 = '0'.repeat(64);
  assert.equal(first.lock.sources[0].sha256, sha(Buffer.from('{"system":"first"}\n')));
  const mutable = first.read('system-source');
  mutable[0] = 0;
  assert.equal(first.read('system-source').toString(), '{"system":"first"}\n');

  await fs.writeFile(f.sourcePath, '{"system":"second"}\n');
  const second = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.notEqual(second.lockSha256, first.lockSha256);
  assert.notEqual(second.lock.sources[0].sha256, first.lock.sources[0].sha256);
  assert.equal(second.lock.edition.sha256, first.lock.edition.sha256);
});

test('source identity cannot collide with the Edition accessor', async (t) => {
  const f = await fixture(t);
  f.request.sources[0].id = 'edition-project';
  const result = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(result.read('edition-project').toString(), '{"system":"first"}\n');
  assert.equal(result.readEdition().toString(), await fs.readFile(f.projectPath, 'utf8'));
});

test('request list order and locator spelling do not change selected content identity', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'sources/other.json'), '{"other":true}\n');
  f.request.sources.push({
    id: 'other-source',
    namespace: 'other/source',
    format: { id: 'example/native-json', version: '1' },
    claimant: 'other-maintainer',
    revision: { kind: 'content', algorithm: 'sha256' },
    input: { kind: 'locator', path: 'sources/other.json' },
  });
  f.project.scope.sourceNamespaces.push('other/source');
  f.project.scope.selections.push({
    id: 'other',
    namespace: 'other/source',
    kind: 'reference',
    reference: 'other',
  });
  f.project.requiredAssertions.push({
    id: 'other-fact',
    kind: 'source',
    selection: 'other',
    questions: ['shape'],
  });
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + '\n');
  const first = await materializeBuildRequestInput(f.requestPath, await f.save());
  f.request.sources.reverse();
  f.request.media.reverse();
  const reordered = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(reordered.lockSha256, first.lockSha256);
  const selected = f.request.sources.find(({ id }) => id === 'system-source');
  await fs.copyFile(
    path.join(f.root, selected.input.path),
    path.join(f.root, 'sources/relocated.json'),
  );
  selected.input.path = 'sources/relocated.json';
  selected.format = { version: '1', id: 'example/native-json' };
  selected.revision = { algorithm: 'sha256', kind: 'content' };
  const respelled = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(respelled.lockSha256, first.lockSha256);
});

test('portable aliases of selected root paths fail before platform-dependent reads', async (t) => {
  const f = await fixture(t);
  f.request.sources.push({
    id: 'alias-source',
    namespace: 'other/source',
    format: { id: 'example/native-json', version: '1' },
    claimant: 'other-maintainer',
    revision: { kind: 'content', algorithm: 'sha256' },
    input: { kind: 'locator', path: 'sources/SYSTEM.json' },
  });
  f.project.scope.sourceNamespaces.push('other/source');
  f.project.scope.selections.push({
    id: 'other',
    namespace: 'other/source',
    kind: 'reference',
    reference: 'other',
  });
  f.project.requiredAssertions.push({
    id: 'other-fact',
    kind: 'source',
    selection: 'other',
    questions: ['shape'],
  });
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + '\n');
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_path_alias',
  });

  f.request.sources.pop();
  f.request.sources[0].input.path = 'edition/PROJECT.json';
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_path_alias',
  });

  f.request.sources[0].input.path = 'BUILD-REQUEST.json';
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_path_alias',
  });
});

test('pin mismatch fails and exact selected inputs relocate without Git', async (t) => {
  const f = await fixture(t);
  const selected = await fs.readFile(f.sourcePath);
  f.request.sources[0].input = {
    kind: 'pin',
    path: 'sources/system.json',
    sha256: sha(selected),
  };
  const expected = await f.save();
  const first = await materializeBuildRequestInput(f.requestPath, expected);
  const moved = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-relocated-'));
  t.after(() => fs.rm(moved, { recursive: true, force: true }));
  await fs.cp(f.root, moved, { recursive: true });
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = '';
    const replay = await materializeBuildRequestInput(
      path.join(moved, 'build-request.json'),
      expected,
    );
    assert.equal(replay.lockSha256, first.lockSha256);
    assert.deepEqual(replay.read('system-source'), selected);
  } finally {
    process.env.PATH = oldPath;
  }
  await fs.writeFile(f.sourcePath, '{"system":"changed"}\n');
  await assert.rejects(materializeBuildRequestInput(f.requestPath, expected), {
    code: 'materialized_pin_mismatch',
  });
});

test('a pinned VCS claim remains an explicit provenance limit without Git', async (t) => {
  const f = await fixture(t);
  const content = await fs.readFile(f.sourcePath);
  f.request.sources[0].revision = {
    kind: 'vcs',
    repository: 'unavailable-repository',
    ref: 'refs/heads/unavailable',
  };
  f.request.sources[0].input = {
    kind: 'pin',
    path: 'sources/system.json',
    sha256: sha(content),
  };
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = '';
    const result = await materializeBuildRequestInput(f.requestPath, await f.save());
    assert.deepEqual(result.read('system-source'), content);
    assert.equal(result.lock.sources[0].revision.object, null);
    assert(result.limits.includes('vcs-provenance-unverified:example/source'));
  } finally {
    process.env.PATH = oldPath;
  }
});

test('unimplemented Provider convergence is rejected, never silently skipped', async (t) => {
  const f = await fixture(t);
  f.request.providers.push({
    id: 'source-provider',
    manifest: 'provider.json',
    sha256: 'a'.repeat(64),
  });
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_provider_pending',
  });
});

function git(repo, ...args) {
  const result = spawnSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    timeout: 10_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1' },
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout.trim();
}

test('VCS locator reads the selected object and never falls back to HEAD', async (t) => {
  const f = await fixture(t);
  const repo = path.join(f.root, 'repo');
  await fs.mkdir(repo);
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.name', 'Fixture');
  git(repo, 'config', 'user.email', 'fixture@example.invalid');
  const selected = Buffer.from('{"system":"committed"}\n');
  await fs.writeFile(path.join(repo, 'system.json'), selected);
  git(repo, 'add', 'system.json');
  git(repo, 'commit', '-qm', 'selected');
  const selectedCommit = git(repo, 'rev-parse', 'HEAD');
  f.request.sources[0].revision = {
    kind: 'vcs',
    repository: 'repo',
    ref: 'refs/heads/does-not-exist',
  };
  f.request.sources[0].input.path = 'system.json';
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_vcs_ref_unresolved',
  });
  f.request.sources[0].revision.ref = selectedCommit;
  const expected = await f.save();
  await fs.writeFile(path.join(repo, 'system.json'), '{"system":"working-tree"}\n');
  const first = await materializeBuildRequestInput(f.requestPath, expected);
  assert.deepEqual(first.read('system-source'), selected);
  assert.equal(first.lock.sources[0].revision.object, selectedCommit);
  git(repo, 'add', 'system.json');
  git(repo, 'commit', '-qm', 'later');
  const replay = await materializeBuildRequestInput(f.requestPath, expected);
  assert.equal(replay.lockSha256, first.lockSha256);
  assert.deepEqual(replay.read('system-source'), selected);
});

test('a missing selected VCS repository is reported as an input failure', async (t) => {
  const f = await fixture(t);
  f.request.sources[0].revision = {
    kind: 'vcs',
    repository: 'missing-repository',
    ref: 'HEAD',
  };
  f.request.sources[0].input.path = 'system.json';
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_vcs_repository_invalid',
  });
});

test('a source-owned request can select its own repository root', async (t) => {
  const f = await fixture(t);
  git(f.root, 'init', '-q');
  git(f.root, 'config', 'user.name', 'Fixture');
  git(f.root, 'config', 'user.email', 'fixture@example.invalid');
  git(f.root, 'add', 'sources/system.json');
  git(f.root, 'commit', '-qm', 'selected');
  f.request.sources[0].revision = {
    kind: 'vcs',
    repository: '.',
    ref: 'HEAD',
  };
  const result = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(result.read('system-source').toString(), '{"system":"first"}\n');
});

test(
  'a repository cannot supply Git through a relative PATH entry',
  { skip: process.platform === 'win32' },
  async (t) => {
    const f = await fixture(t);
    const repo = path.join(f.root, 'repo');
    await fs.mkdir(repo);
    git(repo, 'init', '-q');
    git(repo, 'config', 'user.name', 'Fixture');
    git(repo, 'config', 'user.email', 'fixture@example.invalid');
    await fs.writeFile(path.join(repo, 'system.json'), '{"system":"committed"}\n');
    git(repo, 'add', 'system.json');
    git(repo, 'commit', '-qm', 'selected');
    await fs.writeFile(path.join(repo, 'git'), '#!/bin/sh\nprintf pwned > marker.txt\nexit 99\n');
    await fs.chmod(path.join(repo, 'git'), 0o755);
    f.request.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: 'HEAD' };
    f.request.sources[0].input.path = 'system.json';
    const oldPath = process.env.PATH;
    try {
      process.env.PATH = `.${path.delimiter}${oldPath}`;
      const result = await materializeBuildRequestInput(f.requestPath, await f.save());
      assert.equal(result.read('system-source').toString(), '{"system":"committed"}\n');
      await assert.rejects(fs.stat(path.join(repo, 'marker.txt')), { code: 'ENOENT' });
    } finally {
      process.env.PATH = oldPath;
    }
  },
);

test(
  'a selected input root cannot supply Git through an absolute PATH entry',
  { skip: process.platform === 'win32' },
  async (t) => {
    const f = await fixture(t);
    const repo = path.join(f.root, 'repo');
    const bin = path.join(f.root, 'bin');
    await fs.mkdir(repo);
    await fs.mkdir(bin);
    git(repo, 'init', '-q');
    git(repo, 'config', 'user.name', 'Fixture');
    git(repo, 'config', 'user.email', 'fixture@example.invalid');
    await fs.writeFile(path.join(repo, 'system.json'), '{"system":"committed"}\n');
    git(repo, 'add', 'system.json');
    git(repo, 'commit', '-qm', 'selected');
    await fs.writeFile(path.join(bin, 'git'), '#!/bin/sh\nprintf pwned > marker.txt\nexit 99\n');
    await fs.chmod(path.join(bin, 'git'), 0o755);
    f.request.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: 'HEAD' };
    f.request.sources[0].input.path = 'system.json';
    const oldPath = process.env.PATH;
    try {
      process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
      const result = await materializeBuildRequestInput(f.requestPath, await f.save());
      assert.equal(result.read('system-source').toString(), '{"system":"committed"}\n');
      await assert.rejects(fs.stat(path.join(repo, 'marker.txt')), { code: 'ENOENT' });
    } finally {
      process.env.PATH = oldPath;
    }
  },
);

test(
  'case-variant request spelling cannot bypass the trusted Git boundary',
  { skip: process.platform === 'win32' },
  async (t) => {
    const f = await fixture(t);
    const aliasRoot = path.join(path.dirname(f.root), path.basename(f.root).toUpperCase());
    try {
      await fs.realpath(aliasRoot);
    } catch {
      t.skip('the temporary volume is case-sensitive');
      return;
    }
    const repo = path.join(f.root, 'repo');
    const bin = path.join(f.root, 'bin');
    await fs.mkdir(repo);
    await fs.mkdir(bin);
    git(repo, 'init', '-q');
    git(repo, 'config', 'user.name', 'Fixture');
    git(repo, 'config', 'user.email', 'fixture@example.invalid');
    await fs.writeFile(path.join(repo, 'system.json'), '{"system":"committed"}\n');
    git(repo, 'add', 'system.json');
    git(repo, 'commit', '-qm', 'selected');
    await fs.writeFile(path.join(bin, 'git'), '#!/bin/sh\nprintf pwned > marker.txt\nexit 99\n');
    await fs.chmod(path.join(bin, 'git'), 0o755);
    f.request.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: 'HEAD' };
    f.request.sources[0].input.path = 'system.json';
    const expected = await f.save();
    const oldPath = process.env.PATH;
    try {
      process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
      const result = await materializeBuildRequestInput(
        path.join(aliasRoot, 'build-request.json'),
        expected,
      );
      assert.equal(result.read('system-source').toString(), '{"system":"committed"}\n');
      await assert.rejects(fs.stat(path.join(repo, 'marker.txt')), { code: 'ENOENT' });
    } finally {
      process.env.PATH = oldPath;
    }
  },
);

test('direct materialization rejects unselected sources and missing requested-media coverage', async (t) => {
  const f = await fixture(t);
  f.project.scope.sourceNamespaces = ['other/source'];
  f.project.scope.selections[0].namespace = 'other/source';
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + '\n');
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_edition_sources_mismatch',
  });
  f.project = editionProject();
  f.project.questions.push({
    id: 'hidden',
    audience: 'maintainer',
    text: 'Which evidence was selected?',
  });
  f.project.requiredAssertions[0].questions.push('hidden');
  f.project.narrative.readingOrder.push('hidden');
  f.project.presentation.interactive.questions.push('hidden');
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + '\n');
  f.request.media = ['static'];
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_selected_media_incomplete',
  });
});
