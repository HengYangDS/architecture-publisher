import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validateModel } from "../packages/publisher/src/model/load.mjs";
import { bindSources, matchingOrigin } from "../packages/publisher/src/sources/bind.mjs";
import { minimalModel, temporaryDirectory } from "./fixtures/models.mjs";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const MAIN = "export const main = 1;\n";
const README = "# Read me\n";

/** A one-commit repository holding src/main.mjs and README.md. */
async function repository(t) {
  const root = await temporaryDirectory("archpub-sources-");
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "src"));
  await fs.writeFile(path.join(root, "src/main.mjs"), MAIN);
  await fs.writeFile(path.join(root, "README.md"), README);
  const git = (...args) =>
    execFileSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" },
    }).trim();
  git("init", "--quiet", "--initial-branch=main");
  git("add", ".");
  git(
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "--quiet",
    "--message=initial",
  );
  return { root, git, revision: git("rev-parse", "HEAD") };
}

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

test("native links need an origin remote equal to the declared URL", async (t) => {
  const { root, git, revision } = await repository(t);
  const url = "https://example.invalid/fixture.git";
  const model = sourcedModel(revision, { main: { path: "src/main.mjs" } }, { url });
  assert.equal(matchingOrigin(model, null), null);
  assert.equal(matchingOrigin(sourcedModel(revision, {}), root), null);
  assert.equal(matchingOrigin(model, root), null);
  git("remote", "add", "origin", "https://example.invalid/other.git");
  assert.equal(matchingOrigin(model, root), null);
  git("remote", "set-url", "origin", url);
  assert.equal(matchingOrigin(model, root), url);
});
