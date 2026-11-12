import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { validateModel } from "../src/model/load.mjs";
import { bindSources } from "../src/sources/bind.mjs";
import { minimalModel, temporaryDirectory } from "./fixtures/models.mjs";
import { MAIN, README, globRepository, repository } from "./fixtures/repository.mjs";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const bytes = (text) => Buffer.byteLength(text);
/** A time in seconds since the epoch as its UTC date. */
const dayOf = (time) => new Date(time * 1000).toISOString().slice(0, 10);
const secondsAt = (date) => Date.parse(date) / 1000;
/** The fields of a file record, in the order a manifest writes them. */
const FIELDS = ["path", "sha256", "bytes", "changed", "owner", "relations", "state"];

/** Commit in a fixture repository with both of the commit's dates at `date`, and name the commit. */
function commitAt(root, date, ...args) {
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1" };
  execFileSync(
    "git",
    [
      "-C",
      root,
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      ...args,
    ],
    { env: { ...env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } },
  );
  return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8", env }).trim();
}

/** A model at a revision whose components claim `claims` and whose one relation cites `cited`. */
function claimingModel(revision, claims, cited = [], extra = {}) {
  const ids = ["a", "b", "c"];
  return validateModel(
    minimalModel({
      repository: { name: "fixture", revision },
      components: ids.map((id, index) => ({
        id,
        label: id.toUpperCase(),
        ...(claims[index] ? { files: claims[index] } : {}),
      })),
      relations: [{ id: "a-b", from: "a", to: "b", label: "calls", files: cited }],
      ...extra,
    }),
  );
}

const problemsOf = (error) => error.problems.map(({ code, path: where }) => [code, where]);

test("models without files bind nothing, and without a checkout every declared path stays unverified", () => {
  assert.deepEqual(bindSources(validateModel(minimalModel()), null), {
    state: "none",
    repository: null,
    records: [],
    owned: new Map([
      ["a", []],
      ["b", []],
    ]),
    times: new Map(),
    pinTime: null,
    pinDate: null,
  });
  const model = claimingModel("a".repeat(40), [["src/", "README.md"]], ["src/main.mjs"]);
  const binding = bindSources(model, null);
  assert.equal(binding.state, "unverified");
  const unread = { sha256: null, bytes: null, changed: null };
  assert.deepEqual(binding.records, [
    { path: "README.md", ...unread, owner: "a", relations: [], state: "unverified" },
    { path: "src/", ...unread, owner: "a", relations: [], state: "unverified" },
    { path: "src/main.mjs", ...unread, owner: null, relations: ["a-b"], state: "unverified" },
  ]);
  assert.deepEqual(Object.keys(binding.records[0]), FIELDS);
  assert.deepEqual([binding.times, binding.pinTime, binding.pinDate], [new Map(), null, null]);
  // Without the tree a directory cannot be read, so a component is known to own only the files it names.
  assert.deepEqual(binding.owned.get("a"), ["README.md"]);
});

test("files are read at the revision, not from the work tree", async (t) => {
  const { root, git, revision } = await repository(t);
  await fs.writeFile(path.join(root, "src/main.mjs"), "changed in the work tree\n");
  const binding = bindSources(claimingModel(revision, [["src/"], ["README.md"]]), root);
  assert.equal(binding.state, "verified");
  // The one commit is every file's last change.
  const pinTime = Number(git("show", "-s", "--format=%ct", revision));
  const changed = dayOf(pinTime);
  assert.deepEqual(binding.records, [
    {
      path: "README.md",
      sha256: sha256(README),
      bytes: bytes(README),
      changed,
      owner: "b",
      relations: [],
      state: "verified",
    },
    {
      path: "src/main.mjs",
      sha256: sha256(MAIN),
      bytes: bytes(MAIN),
      changed,
      owner: "a",
      relations: [],
      state: "verified",
    },
  ]);
  assert.deepEqual(
    binding.times,
    new Map([
      ["README.md", pinTime],
      ["src/main.mjs", pinTime],
    ]),
  );
  assert.equal(binding.pinTime, pinTime);
  // The pin's date is the one its committer recorded, as the edition's foot prints it.
  assert.equal(binding.pinDate, git("show", "-s", "--format=%cs", revision));
  assert.deepEqual(Object.keys(binding.records[0]), FIELDS);
});

test("each file's size and last change are read from the history at the pin", async (t) => {
  const { root, git } = await repository(t);
  const write = (file, text) => fs.writeFile(path.join(root, file), text);
  commitAt(root, "2026-01-01T00:00:00Z", "--amend", "--no-edit");
  await write("src/main.mjs", "export const main = 2;\n");
  commitAt(root, "2026-02-01T00:00:00Z", "--all", "--message=change main");
  git("switch", "--quiet", "--create", "side");
  await write("src/side.mjs", "export const side = 1;\n");
  git("add", "src/side.mjs");
  commitAt(root, "2026-03-01T00:00:00Z", "--message=add side");
  git("switch", "--quiet", "main");
  // A file the merge itself adds changed in no parent, so only the merge can date it. Git reports a merge stopped
  // before its commit on standard error even with --quiet, so the report is captured, not printed; a merge needs a
  // committer even before it commits, which a hosted runner's account does not name.
  execFileSync(
    "git",
    [
      "-C",
      root,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "merge",
      "--quiet",
      "--no-ff",
      "--no-commit",
      "side",
    ],
    { stdio: "pipe", env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" } },
  );
  await write("src/merged.mjs", "export const merged = true;\n");
  git("add", "src/merged.mjs");
  commitAt(root, "2026-04-01T00:00:00Z", "--message=merge side");
  await write("README.md", "# Read me again\n");
  // Eight hours east of Greenwich the pin is on 1 May; its UTC date is still 30 April.
  const pinned = commitAt(root, "2026-05-01T07:59:59+08:00", "--all", "--message=pin");
  await write("src/main.mjs", "export const main = 3;\n");
  commitAt(root, "2026-06-01T00:00:00Z", "--all", "--message=after the pin");
  const model = claimingModel(pinned, [["src/"], ["README.md"]], ["src/merged.mjs"]);
  const binding = bindSources(model, root);
  assert.deepEqual(
    binding.records.map(({ path: file, bytes: size, changed, owner }) => [
      file,
      size,
      changed,
      owner,
    ]),
    [
      ["README.md", 16, "2026-04-30", "b"],
      ["src/main.mjs", 23, "2026-02-01", "a"],
      ["src/merged.mjs", 28, "2026-04-01", "a"],
      ["src/side.mjs", 23, "2026-03-01", "a"],
    ],
  );
  assert.deepEqual(
    binding.times,
    new Map([
      ["README.md", secondsAt("2026-04-30T23:59:59Z")],
      ["src/main.mjs", secondsAt("2026-02-01T00:00:00Z")],
      ["src/merged.mjs", secondsAt("2026-04-01T00:00:00Z")],
      ["src/side.mjs", secondsAt("2026-03-01T00:00:00Z")],
    ]),
  );
  assert.equal(binding.pinTime, secondsAt("2026-04-30T23:59:59Z"));
});

test("a shallow clone is refused rather than dated by the commit it was cut at", async (t) => {
  const { root, git } = await repository(t);
  await fs.writeFile(path.join(root, "README.md"), "# Read me again\n");
  const pinned = commitAt(root, "2026-02-01T00:00:00Z", "--all", "--message=second");
  const clone = path.join(await temporaryDirectory(t, "archpub-shallow-"), "clone");
  git("clone", "--quiet", "--depth=1", pathToFileURL(root).href, clone);
  assert.throws(
    () => bindSources(claimingModel(pinned, [["src/"], ["README.md"]]), clone),
    (error) => error.code === "source_history_unavailable" && error.message.includes(clone),
  );
});

test("history that never adds a cited file, or that Git cannot read, is refused", async (t) => {
  // Git still honours a graft file. Two commits grafted onto each other leave no root, so the
  // file neither changes is never added.
  const cyclic = await repository(t);
  await fs.writeFile(path.join(cyclic.root, "src/main.mjs"), "export const main = 2;\n");
  const first = commitAt(cyclic.root, "2026-02-01T00:00:00Z", "--all", "--message=second");
  await fs.writeFile(path.join(cyclic.root, "src/main.mjs"), "export const main = 3;\n");
  const second = commitAt(cyclic.root, "2026-03-01T00:00:00Z", "--all", "--message=third");
  await fs.mkdir(path.join(cyclic.root, ".git/info"), { recursive: true });
  await fs.writeFile(path.join(cyclic.root, ".git/info/grafts"), `${first} ${second}\n`);
  assert.throws(
    () => bindSources(claimingModel(second, [["src/"], ["README.md"]]), cyclic.root),
    (error) => error.code === "source_history_unavailable" && error.message.includes("README.md"),
  );
  // Without the first commit's tree, Git cannot tell what the second changed.
  const broken = await repository(t);
  await fs.writeFile(path.join(broken.root, "src/main.mjs"), "export const main = 2;\n");
  const pinned = commitAt(broken.root, "2026-02-01T00:00:00Z", "--all", "--message=second");
  const tree = broken.git("rev-parse", `${broken.revision}^{tree}`);
  const object = path.join(broken.root, ".git/objects", tree.slice(0, 2), tree.slice(2));
  await fs.chmod(object, 0o644);
  await fs.rm(object);
  assert.throws(
    () => bindSources(claimingModel(pinned, [["src/"]]), broken.root),
    (error) => error.code === "source_read_failed" && error.message.includes("history"),
  );
});

test("each file in the scope belongs to its most specific claim", async (t) => {
  const { root, pinned } = await globRepository(t);
  const model = claimingModel(
    pinned,
    [["src/"], ["src/lib/"], ["src/net/c.go"]],
    ["src/lib/b.go"],
    {
      coverage: {
        include: ["src/"],
        exclude: [{ path: "**/*_test.go", reason: "Tests beside the code." }],
      },
    },
  );
  const binding = bindSources(model, root);
  const read = { sha256: sha256("x\n"), bytes: 2, changed: dayOf(binding.pinTime) };
  assert.deepEqual(binding.records, [
    { path: "src/A_TEST.GO", ...read, owner: "a", relations: [], state: "verified" },
    { path: "src/a.go", ...read, owner: "a", relations: [], state: "verified" },
    { path: "src/lib/b.go", ...read, owner: "b", relations: ["a-b"], state: "verified" },
    { path: "src/net/c.go", ...read, owner: "c", relations: [], state: "verified" },
  ]);
  assert.deepEqual(
    [...binding.owned],
    [
      ["a", ["src/A_TEST.GO", "src/a.go"]],
      ["b", ["src/lib/b.go"]],
      ["c", ["src/net/c.go"]],
    ],
  );
});

test("a claim that owns no file in the scope and an absent relation file are refused together", async (t) => {
  const { root, pinned } = await globRepository(t);
  // src/net/ holds one file, which a deeper claim takes, so it owns none.
  const model = claimingModel(
    pinned,
    [["src/old/", "src/a_test.go", "src/a.go"], ["src/net/"], ["src/net/c.go"]],
    ["src/gone.go"],
    {
      coverage: { exclude: [{ path: "**/*_test.go", reason: "Tests beside the code." }] },
    },
  );
  assert.throws(
    () => bindSources(model, root),
    (error) =>
      error.code === "files_unresolved" &&
      JSON.stringify(problemsOf(error)) ===
        JSON.stringify([
          ["claim_unmatched", "/components/0/files/0"],
          ["claim_unmatched", "/components/0/files/1"],
          ["claim_unmatched", "/components/1/files/0"],
          ["relation_file_missing", "/relations/0/files/0"],
        ]),
  );
});

test("verification needs a known revision and a working Git", async (t) => {
  const { root } = await repository(t);
  const unrevised = validateModel(
    minimalModel({
      components: [
        { id: "a", label: "Alpha", files: ["src/main.mjs"] },
        { id: "b", label: "Beta" },
      ],
    }),
  );
  assert.throws(() => bindSources(unrevised, root), { code: "source_revision_missing" });
  const unknown = claimingModel("b".repeat(40), [["src/main.mjs"]]);
  assert.throws(() => bindSources(unknown, root), { code: "source_revision_unknown" });
  const saved = process.env.PATH;
  process.env.PATH = "";
  try {
    assert.throws(() => bindSources(unknown, root), { code: "source_git_unavailable" });
  } finally {
    process.env.PATH = saved;
  }
});

test("the caller's Git variables cannot point binding at another repository", async (t) => {
  const { root, revision } = await repository(t);
  const elsewhere = await repository(t);
  const model = claimingModel(revision, [["src/main.mjs"]]);
  const saved = process.env.GIT_DIR;
  process.env.GIT_DIR = path.join(elsewhere.root, ".git");
  try {
    assert.equal(bindSources(model, root).state, "verified");
  } finally {
    if (saved === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = saved;
  }
});
