import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { bindSources } from "../src/sources/bind.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { MAIN, README, globRepository, repository } from "./fixtures/repository.mjs";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

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
  });
  const model = claimingModel("a".repeat(40), [["src/", "README.md"]], ["src/main.mjs"]);
  const binding = bindSources(model, null);
  assert.equal(binding.state, "unverified");
  assert.deepEqual(binding.records, [
    { path: "README.md", sha256: null, owner: "a", relations: [], state: "unverified" },
    { path: "src/", sha256: null, owner: "a", relations: [], state: "unverified" },
    { path: "src/main.mjs", sha256: null, owner: null, relations: ["a-b"], state: "unverified" },
  ]);
  // Without the tree a directory cannot be read, so a component is known to own only the files it names.
  assert.deepEqual(binding.owned.get("a"), ["README.md"]);
});

test("files are read at the revision, not from the work tree", async (t) => {
  const { root, revision } = await repository(t);
  await fs.writeFile(path.join(root, "src/main.mjs"), "changed in the work tree\n");
  const binding = bindSources(claimingModel(revision, [["src/"], ["README.md"]]), root);
  assert.equal(binding.state, "verified");
  assert.deepEqual(binding.records, [
    { path: "README.md", sha256: sha256(README), owner: "b", relations: [], state: "verified" },
    { path: "src/main.mjs", sha256: sha256(MAIN), owner: "a", relations: [], state: "verified" },
  ]);
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
  const digest = sha256("x\n");
  assert.deepEqual(binding.records, [
    { path: "src/A_TEST.GO", sha256: digest, owner: "a", relations: [], state: "verified" },
    { path: "src/a.go", sha256: digest, owner: "a", relations: [], state: "verified" },
    { path: "src/lib/b.go", sha256: digest, owner: "b", relations: ["a-b"], state: "verified" },
    { path: "src/net/c.go", sha256: digest, owner: "c", relations: [], state: "verified" },
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
