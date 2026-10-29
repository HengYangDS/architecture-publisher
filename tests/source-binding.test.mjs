import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validateModel } from "../packages/publisher/src/model/load.mjs";
import { bindSources } from "../packages/publisher/src/sources/bind.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { MAIN, README, repository } from "./fixtures/repository.mjs";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

function sourcedModel(revision, sources, extra = {}) {
  return validateModel(
    minimalModel({
      repository: { name: "fixture", revision, ...extra },
      sources,
      components: [
        { id: "a", label: "Alpha", sources: Object.keys(sources) },
        { id: "b", label: "Beta" },
      ],
    }),
  );
}

test("models without sources bind nothing and unverified sources keep their declarations", () => {
  assert.deepEqual(bindSources(validateModel(minimalModel()), null), {
    state: "none",
    repository: null,
    records: [],
  });
  const model = sourcedModel("a".repeat(40), {
    main: { path: "src/main.mjs", sha256: sha256(MAIN) },
  });
  assert.deepEqual(bindSources(model, null).records, [
    {
      id: "main",
      path: "src/main.mjs",
      declaredSha256: sha256(MAIN),
      sha256: null,
      state: "unverified",
    },
  ]);
  assert.equal(bindSources(model, null).state, "unverified");
});

test("sources are read at the declared revision and their digests verified", async (t) => {
  const { root, revision } = await repository(t);
  await fs.writeFile(path.join(root, "src/main.mjs"), "changed in the work tree\n");
  const model = sourcedModel(revision, {
    main: { path: "src/main.mjs", sha256: sha256(MAIN) },
    readme: { path: "README.md" },
  });
  const binding = bindSources(model, root);
  assert.equal(binding.state, "verified");
  assert.deepEqual(
    binding.records.map(({ id, sha256: digest, state }) => [id, digest, state]),
    [
      ["main", sha256(MAIN), "verified"],
      ["readme", sha256(README), "verified"],
    ],
  );
});

test("missing paths, directories and digest mismatches are refused together", async (t) => {
  const { root, revision } = await repository(t);
  const model = sourcedModel(revision, {
    gone: { path: "src/gone.mjs" },
    folder: { path: "src" },
    main: { path: "src/main.mjs", sha256: "0".repeat(64) },
  });
  assert.throws(
    () => bindSources(model, root),
    (error) =>
      error.code === "sources_unverified" &&
      JSON.stringify(error.problems.map(({ code, path: where }) => [code, where])) ===
        JSON.stringify([
          ["source_missing", "/sources/gone/path"],
          ["source_missing", "/sources/folder/path"],
          ["source_digest_mismatch", "/sources/main/sha256"],
        ]),
  );
});

test("verification needs a known revision and a working Git", async (t) => {
  const { root } = await repository(t);
  const unrevised = validateModel(
    minimalModel({
      sources: { main: { path: "src/main.mjs" } },
      components: [
        { id: "a", label: "Alpha", sources: ["main"] },
        { id: "b", label: "Beta" },
      ],
    }),
  );
  assert.throws(() => bindSources(unrevised, root), { code: "source_revision_missing" });
  const unknown = sourcedModel("b".repeat(40), { main: { path: "src/main.mjs" } });
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
  const model = sourcedModel(revision, { main: { path: "src/main.mjs", sha256: sha256(MAIN) } });
  const saved = process.env.GIT_DIR;
  process.env.GIT_DIR = path.join(elsewhere.root, ".git");
  try {
    assert.equal(bindSources(model, root).state, "verified");
  } finally {
    if (saved === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = saved;
  }
});
