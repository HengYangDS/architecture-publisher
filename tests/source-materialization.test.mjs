import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/index.mjs';

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
      selections: [
        { id: 'system', namespace, kind: 'reference', reference: 'system', questions: ['shape'] },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: 'A bounded view of the selected system.' },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'One clear overview.' },
      interactive: {
        views: [{ id: 'overview', questions: ['shape'] }],
        intent: 'An explorable view.',
      },
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
  assert.equal(first.closure, 'selected-roots-only');
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

test('request-local source selector names do not alter selected source identity', async (t) => {
  const f = await fixture(t);
  const first = await materializeBuildRequestInput(f.requestPath, await f.save());
  f.request.sources[0].id = 'renamed-selector';
  const second = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(second.lockSha256, first.lockSha256);
  assert.deepEqual(second.lock.sources, first.lock.sources);
  assert.equal(second.read('renamed-selector').toString(), '{"system":"first"}\n');
  assert.throws(() => second.read('system-source'), { code: 'materialized_item_unknown' });
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

test('missing selected Provider is rejected, never silently skipped', async (t) => {
  const f = await fixture(t);
  f.request.providers.push({
    id: 'source-provider',
    manifest: 'provider.json',
    sha256: 'a'.repeat(64),
  });
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'ENOENT',
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

async function vcsFixture(t) {
  const f = await fixture(t);
  const repo = path.join(f.root, 'repo');
  await fs.mkdir(repo);
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.name', 'Fixture');
  git(repo, 'config', 'user.email', 'fixture@example.invalid');
  f.request.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: 'HEAD' };
  f.request.sources[0].input.path = 'system.json';
  return { f, repo };
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
  assert.deepEqual(
    first.readEvidence.items.find(({ kind }) => kind === 'native'),
    {
      kind: 'native',
      key: 'example/source',
      method: 'git-selected-blob/v1',
    },
  );
  git(repo, 'add', 'system.json');
  git(repo, 'commit', '-qm', 'later');
  const replay = await materializeBuildRequestInput(f.requestPath, expected);
  assert.equal(replay.lockSha256, first.lockSha256);
  assert.deepEqual(replay.read('system-source'), selected);
});

test('a selected VCS path missing from the commit is never read from the worktree', async (t) => {
  const { f, repo } = await vcsFixture(t);
  await fs.writeFile(path.join(repo, 'elsewhere.json'), '{}\n');
  await fs.writeFile(path.join(repo, 'system.json'), '{"system":"unselected"}\n');
  git(repo, 'add', 'elsewhere.json');
  git(repo, 'commit', '-qm', 'selected');
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_vcs_object_unavailable',
  });
});

test('a selected VCS tree is not treated as a source file', async (t) => {
  const { f, repo } = await vcsFixture(t);
  await fs.mkdir(path.join(repo, 'system.json'));
  await fs.writeFile(path.join(repo, 'system.json', 'part.json'), '{}\n');
  git(repo, 'add', 'system.json/part.json');
  git(repo, 'commit', '-qm', 'selected');
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_vcs_type_unsupported',
  });
});

test('a selected VCS symlink blob is not followed or treated as a regular file', async (t) => {
  const { f, repo } = await vcsFixture(t);
  await fs.writeFile(path.join(repo, 'target.txt'), 'target.txt');
  const blob = git(repo, 'hash-object', '-w', 'target.txt');
  git(repo, 'update-index', '--add', '--cacheinfo', '120000', blob, 'system.json');
  git(repo, 'commit', '-qm', 'selected');
  assert.match(git(repo, 'ls-tree', 'HEAD', '--', 'system.json'), /^120000 blob /u);
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_vcs_type_unsupported',
  });
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

test('an ordinary file cannot be selected as a VCS repository', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'repo'), 'not a repository\n');
  f.request.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: 'HEAD' };
  f.request.sources[0].input.path = 'system.json';
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_vcs_repository_invalid',
  });
});

test('a VCS locator fails closed when no external Git executable is available', async (t) => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.root, 'repo'));
  f.request.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: 'HEAD' };
  f.request.sources[0].input.path = 'system.json';
  const expected = await f.save();
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = f.root;
    await assert.rejects(materializeBuildRequestInput(f.requestPath, expected), {
      code: 'materialized_vcs_unavailable',
    });
  } finally {
    process.env.PATH = oldPath;
  }
});

test('VCS selection ignores a source-controlled Git binary reached through PATH', async (t) => {
  if (process.platform === 'win32') {
    t.skip('POSIX executable-link counterexample; Windows executable selection is separate');
    return;
  }
  const { f, repo } = await vcsFixture(t);
  const selected = Buffer.from('{"system":"committed"}\n');
  await fs.writeFile(path.join(repo, 'system.json'), selected);
  git(repo, 'add', 'system.json');
  git(repo, 'commit', '-qm', 'selected');
  const marker = path.join(f.root, 'source-git-executed');
  const sourceGit = path.join(f.root, 'git');
  await fs.writeFile(
    sourceGit,
    `#!/bin/sh\nprintf invoked > ${JSON.stringify(marker)}\nexit 99\n`,
    { mode: 0o755 },
  );
  await fs.chmod(sourceGit, 0o755);
  const outside = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-external-git-link-'),
  );
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  await fs.symlink(sourceGit, path.join(outside, 'git'));
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = ['relative-bin', path.join(f.root, 'missing-bin'), outside, oldPath].join(
      path.delimiter,
    );
    const materialized = await materializeBuildRequestInput(f.requestPath, await f.save());
    assert.deepEqual(materialized.read('system-source'), selected);
  } finally {
    process.env.PATH = oldPath;
  }
  await assert.rejects(fs.access(marker), { code: 'ENOENT' });
});

test('VCS command output is bounded before it can become source evidence', async (t) => {
  if (process.platform === 'win32') {
    t.skip('POSIX executable fixture; native Windows VCS limits are tested separately');
    return;
  }
  const { f } = await vcsFixture(t);
  const outside = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-oversized-git-'),
  );
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  const fakeGit = path.join(outside, 'git');
  await fs.writeFile(
    fakeGit,
    `#!${process.execPath}\nprocess.stdout.write('x'.repeat(2 * 1024 * 1024));\n`,
    { mode: 0o755 },
  );
  await fs.chmod(fakeGit, 0o755);
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = outside;
    await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
      code: 'file_size_exceeded',
    });
  } finally {
    process.env.PATH = oldPath;
  }
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
  f.project.scope.selections[0].questions.push('hidden');
  f.project.presentation.interactive.views[0].questions.push('hidden');
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + '\n');
  f.request.media = ['static'];
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: 'materialized_selected_media_incomplete',
  });
});
