import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { fixture, git, vcsFixture } from "./fixtures/source-materialization.mjs";

test("VCS locator reads the selected object and never falls back to HEAD", async (t) => {
  const f = await fixture(t);
  const repo = path.join(f.root, "repo");
  await fs.mkdir(repo);
  git(repo, "init", "-q");
  git(repo, "config", "user.name", "Fixture");
  git(repo, "config", "user.email", "fixture@example.invalid");
  const selected = Buffer.from('{"system":"committed"}\n');
  await fs.writeFile(path.join(repo, "system.json"), selected);
  git(repo, "add", "system.json");
  git(repo, "commit", "-qm", "selected");
  const selectedCommit = git(repo, "rev-parse", "HEAD");
  f.request.sources[0].revision = {
    kind: "vcs",
    repository: "repo",
    ref: "refs/heads/does-not-exist",
  };
  f.request.sources[0].input.path = "system.json";
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_vcs_ref_unresolved",
  });
  f.request.sources[0].revision.ref = selectedCommit;
  const expected = await f.save();
  await fs.writeFile(path.join(repo, "system.json"), '{"system":"working-tree"}\n');
  const first = await materializeBuildRequestInput(f.requestPath, expected);
  assert.deepEqual(first.read("system-source"), selected);
  assert.equal(first.lock.sources[0].revision.object, selectedCommit);
  assert.deepEqual(
    first.readEvidence.items.find(({ kind }) => kind === "native"),
    {
      kind: "native",
      key: "example/source",
      method: "git-selected-blob/v1",
    },
  );
  git(repo, "add", "system.json");
  git(repo, "commit", "-qm", "later");
  const replay = await materializeBuildRequestInput(f.requestPath, expected);
  assert.equal(replay.lockSha256, first.lockSha256);
  assert.deepEqual(replay.read("system-source"), selected);
});

test("a selected VCS path missing from the commit is never read from the worktree", async (t) => {
  const { f, repo } = await vcsFixture(t);
  await fs.writeFile(path.join(repo, "elsewhere.json"), "{}\n");
  await fs.writeFile(path.join(repo, "system.json"), '{"system":"unselected"}\n');
  git(repo, "add", "elsewhere.json");
  git(repo, "commit", "-qm", "selected");
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_vcs_object_unavailable",
  });
});

test("a selected VCS tree is not treated as a source file", async (t) => {
  const { f, repo } = await vcsFixture(t);
  await fs.mkdir(path.join(repo, "system.json"));
  await fs.writeFile(path.join(repo, "system.json", "part.json"), "{}\n");
  git(repo, "add", "system.json/part.json");
  git(repo, "commit", "-qm", "selected");
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_vcs_type_unsupported",
  });
});

test("a selected VCS symlink blob is not followed or treated as a regular file", async (t) => {
  const { f, repo } = await vcsFixture(t);
  await fs.writeFile(path.join(repo, "target.txt"), "target.txt");
  const blob = git(repo, "hash-object", "-w", "target.txt");
  git(repo, "update-index", "--add", "--cacheinfo", "120000", blob, "system.json");
  git(repo, "commit", "-qm", "selected");
  assert.match(git(repo, "ls-tree", "HEAD", "--", "system.json"), /^120000 blob /u);
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_vcs_type_unsupported",
  });
});

test("a missing selected VCS repository is reported as an input failure", async (t) => {
  const f = await fixture(t);
  f.request.sources[0].revision = {
    kind: "vcs",
    repository: "missing-repository",
    ref: "HEAD",
  };
  f.request.sources[0].input.path = "system.json";
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_vcs_repository_invalid",
  });
});

test("an ordinary file cannot be selected as a VCS repository", async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, "repo"), "not a repository\n");
  f.request.sources[0].revision = { kind: "vcs", repository: "repo", ref: "HEAD" };
  f.request.sources[0].input.path = "system.json";
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_vcs_repository_invalid",
  });
});

test("a VCS locator fails closed when no external Git executable is available", async (t) => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.root, "repo"));
  f.request.sources[0].revision = { kind: "vcs", repository: "repo", ref: "HEAD" };
  f.request.sources[0].input.path = "system.json";
  const expected = await f.save();
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = f.root;
    await assert.rejects(materializeBuildRequestInput(f.requestPath, expected), {
      code: "materialized_vcs_unavailable",
    });
  } finally {
    process.env.PATH = oldPath;
  }
});

test("VCS selection ignores a source-controlled Git binary reached through PATH", async (t) => {
  if (process.platform === "win32") {
    t.skip("POSIX executable-link counterexample; Windows executable selection is separate");
    return;
  }
  const { f, repo } = await vcsFixture(t);
  const selected = Buffer.from('{"system":"committed"}\n');
  await fs.writeFile(path.join(repo, "system.json"), selected);
  git(repo, "add", "system.json");
  git(repo, "commit", "-qm", "selected");
  const marker = path.join(f.root, "source-git-executed");
  const sourceGit = path.join(f.root, "git");
  await fs.writeFile(
    sourceGit,
    `#!/bin/sh\nprintf invoked > ${JSON.stringify(marker)}\nexit 99\n`,
    { mode: 0o755 },
  );
  await fs.chmod(sourceGit, 0o755);
  const outside = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-external-git-link-"),
  );
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  await fs.symlink(sourceGit, path.join(outside, "git"));
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = ["relative-bin", path.join(f.root, "missing-bin"), outside, oldPath].join(
      path.delimiter,
    );
    const materialized = await materializeBuildRequestInput(f.requestPath, await f.save());
    assert.deepEqual(materialized.read("system-source"), selected);
  } finally {
    process.env.PATH = oldPath;
  }
  await assert.rejects(fs.access(marker), { code: "ENOENT" });
});

test("VCS command output is bounded before it can become source evidence", async (t) => {
  if (process.platform === "win32") {
    t.skip("POSIX executable fixture; native Windows VCS limits are tested separately");
    return;
  }
  const { f } = await vcsFixture(t);
  const outside = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-oversized-git-"),
  );
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  const fakeGit = path.join(outside, "git");
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
      code: "file_size_exceeded",
    });
  } finally {
    process.env.PATH = oldPath;
  }
});

test("a source-owned request can select its own repository root", async (t) => {
  const f = await fixture(t);
  git(f.root, "init", "-q");
  git(f.root, "config", "user.name", "Fixture");
  git(f.root, "config", "user.email", "fixture@example.invalid");
  git(f.root, "add", "sources/system.json");
  git(f.root, "commit", "-qm", "selected");
  f.request.sources[0].revision = {
    kind: "vcs",
    repository: ".",
    ref: "HEAD",
  };
  const result = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(result.read("system-source").toString(), '{"system":"first"}\n');
});

test(
  "a repository cannot supply Git through a relative PATH entry",
  { skip: process.platform === "win32" },
  async (t) => {
    const f = await fixture(t);
    const repo = path.join(f.root, "repo");
    await fs.mkdir(repo);
    git(repo, "init", "-q");
    git(repo, "config", "user.name", "Fixture");
    git(repo, "config", "user.email", "fixture@example.invalid");
    await fs.writeFile(path.join(repo, "system.json"), '{"system":"committed"}\n');
    git(repo, "add", "system.json");
    git(repo, "commit", "-qm", "selected");
    await fs.writeFile(path.join(repo, "git"), "#!/bin/sh\nprintf pwned > marker.txt\nexit 99\n");
    await fs.chmod(path.join(repo, "git"), 0o755);
    f.request.sources[0].revision = { kind: "vcs", repository: "repo", ref: "HEAD" };
    f.request.sources[0].input.path = "system.json";
    const oldPath = process.env.PATH;
    try {
      process.env.PATH = `.${path.delimiter}${oldPath}`;
      const result = await materializeBuildRequestInput(f.requestPath, await f.save());
      assert.equal(result.read("system-source").toString(), '{"system":"committed"}\n');
      await assert.rejects(fs.stat(path.join(repo, "marker.txt")), { code: "ENOENT" });
    } finally {
      process.env.PATH = oldPath;
    }
  },
);

test(
  "a selected input root cannot supply Git through an absolute PATH entry",
  { skip: process.platform === "win32" },
  async (t) => {
    const f = await fixture(t);
    const repo = path.join(f.root, "repo");
    const bin = path.join(f.root, "bin");
    await fs.mkdir(repo);
    await fs.mkdir(bin);
    git(repo, "init", "-q");
    git(repo, "config", "user.name", "Fixture");
    git(repo, "config", "user.email", "fixture@example.invalid");
    await fs.writeFile(path.join(repo, "system.json"), '{"system":"committed"}\n');
    git(repo, "add", "system.json");
    git(repo, "commit", "-qm", "selected");
    await fs.writeFile(path.join(bin, "git"), "#!/bin/sh\nprintf pwned > marker.txt\nexit 99\n");
    await fs.chmod(path.join(bin, "git"), 0o755);
    f.request.sources[0].revision = { kind: "vcs", repository: "repo", ref: "HEAD" };
    f.request.sources[0].input.path = "system.json";
    const oldPath = process.env.PATH;
    try {
      process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
      const result = await materializeBuildRequestInput(f.requestPath, await f.save());
      assert.equal(result.read("system-source").toString(), '{"system":"committed"}\n');
      await assert.rejects(fs.stat(path.join(repo, "marker.txt")), { code: "ENOENT" });
    } finally {
      process.env.PATH = oldPath;
    }
  },
);

test(
  "case-variant request spelling cannot bypass the trusted Git boundary",
  { skip: process.platform === "win32" },
  async (t) => {
    const f = await fixture(t);
    const aliasRoot = path.join(path.dirname(f.root), path.basename(f.root).toUpperCase());
    try {
      await fs.realpath(aliasRoot);
    } catch {
      t.skip("the temporary volume is case-sensitive");
      return;
    }
    const repo = path.join(f.root, "repo");
    const bin = path.join(f.root, "bin");
    await fs.mkdir(repo);
    await fs.mkdir(bin);
    git(repo, "init", "-q");
    git(repo, "config", "user.name", "Fixture");
    git(repo, "config", "user.email", "fixture@example.invalid");
    await fs.writeFile(path.join(repo, "system.json"), '{"system":"committed"}\n');
    git(repo, "add", "system.json");
    git(repo, "commit", "-qm", "selected");
    await fs.writeFile(path.join(bin, "git"), "#!/bin/sh\nprintf pwned > marker.txt\nexit 99\n");
    await fs.chmod(path.join(bin, "git"), 0o755);
    f.request.sources[0].revision = { kind: "vcs", repository: "repo", ref: "HEAD" };
    f.request.sources[0].input.path = "system.json";
    const expected = await f.save();
    const oldPath = process.env.PATH;
    try {
      process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
      const result = await materializeBuildRequestInput(
        path.join(aliasRoot, "build-request.json"),
        expected,
      );
      assert.equal(result.read("system-source").toString(), '{"system":"committed"}\n');
      await assert.rejects(fs.stat(path.join(repo, "marker.txt")), { code: "ENOENT" });
    } finally {
      process.env.PATH = oldPath;
    }
  },
);

test("a selected VCS blob read fails closed if the chosen Git command cannot read it", async (t) => {
  if (process.platform === "win32") {
    t.skip("POSIX executable fixture; native Windows VCS selection is tested separately");
    return;
  }
  const { f, repo } = await vcsFixture(t);
  const outside = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-git-failure-"),
  );
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  const fakeGit = path.join(outside, "git");
  await fs.writeFile(
    fakeGit,
    `#!${process.execPath}\nconst operation = process.argv[2];
if (operation === 'rev-parse' && process.argv[3] === '--show-toplevel') process.stdout.write(${JSON.stringify(repo)} + '\\n');
else if (operation === 'rev-parse') process.stdout.write('a'.repeat(40) + '\\n');
else if (operation === 'ls-tree') process.stdout.write('100644 blob ' + 'b'.repeat(40) + '\\tsystem.json\\0');
else if (operation === 'cat-file') process.exitCode = 1;
else process.exitCode = 2;
`,
    { mode: 0o755 },
  );
  await fs.chmod(fakeGit, 0o755);
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = outside;
    await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
      code: "materialized_vcs_object_unavailable",
    });
  } finally {
    process.env.PATH = oldPath;
  }
});
