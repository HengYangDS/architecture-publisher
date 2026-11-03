import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { checkModel } from "../src/build.mjs";
import { runCli } from "../src/cli/run.mjs";
import { validateModel } from "../src/model/load.mjs";
import { measureCoverage, uncitedStatements } from "../src/sources/coverage.mjs";
import { minimalModel, writeModel } from "./fixtures/models.mjs";
import { globRepository, historyRepository } from "./fixtures/repository.mjs";

const COVERAGE = {
  include: ["src/"],
  exclude: [
    { path: "src/vendor/", reason: "Vendored code, not this system's architecture." },
    { path: "src/generated/", reason: "Generated output." },
  ],
};

const historyJson = (pinned, extra = {}) =>
  minimalModel({
    repository: { name: "history", revision: pinned },
    sources: {
      a: { path: "src/a.mjs" },
      b: { path: "src/b.mjs" },
      c: { path: "src/c.mjs" },
      readme: { path: "README.md" },
    },
    components: [
      { id: "a", label: "Alpha", sources: ["a", "b"] },
      { id: "b", label: "Beta", sources: ["c", "readme"] },
    ],
    coverage: COVERAGE,
    ...extra,
  });
const historyModel = (pinned, extra) => validateModel(historyJson(pinned, extra));

/** Everything a read-only command could change in a repository. */
async function snapshot(root, git) {
  const digest = async (file) =>
    createHash("sha256")
      .update(await fs.readFile(path.join(root, ".git", file)))
      .digest("hex");
  return {
    status: git("status", "--porcelain", "--untracked-files=all", "--ignored"),
    refs: git("for-each-ref", "--format=%(refname) %(objectname)"),
    head: git("symbolic-ref", "HEAD"),
    index: await digest("index"),
    config: await digest("config"),
  };
}

test("coverage counts the declared scope at the pinned revision", async (t) => {
  const { root, pinned } = await historyRepository(t);
  const report = measureCoverage(historyModel(pinned), root);
  assert.equal(report.revision, pinned);
  assert.deepEqual(report.files, { scope: 6, cited: 3, uncovered: 3, excluded: 1 });
  assert.deepEqual(report.bytes, {
    scope: 6 * 20,
    cited: 3 * 20,
    uncovered: 3 * 20,
    excluded: 20,
  });
  assert.deepEqual(report.excluded, [
    {
      path: "src/vendor/",
      reason: "Vendored code, not this system's architecture.",
      files: 1,
      bytes: 20,
    },
    { path: "src/generated/", reason: "Generated output.", files: 0, bytes: 0 },
  ]);
  assert.deepEqual(report.unmatched, ["src/generated/"]);
  assert.deepEqual(report.citedOutsideScope, ["README.md"]);
  assert.deepEqual(report.largestUncovered, [{ path: "src/tools/", files: 2, bytes: 40 }]);
  assert.equal(report.currency, null);
});

test("a glob path counts the files Git matches at the revision, case-sensitively", async (t) => {
  const { root, pinned } = await globRepository(t);
  const model = (coverage) =>
    validateModel(
      minimalModel({
        repository: { name: "glob", revision: pinned },
        sources: { a: { path: "src/a.go" } },
        components: [
          { id: "a", label: "Alpha", sources: ["a"] },
          { id: "b", label: "Beta" },
        ],
        coverage,
      }),
    );
  const tests = { path: "**/*_test.go", reason: "Tests beside the code." };
  const report = measureCoverage(model({ include: ["src/"], exclude: [tests] }), root);
  // src/A_TEST.GO stays in the scope: the glob is case-sensitive on every platform.
  assert.deepEqual(report.files, { scope: 4, cited: 1, uncovered: 3, excluded: 2 });
  assert.deepEqual(report.excluded, [{ ...tests, files: 2, bytes: 4 }]);
  // The included glob holds no upper-case name, so src/A_TEST.GO is outside the scope.
  const classes = measureCoverage(
    model({
      include: ["src/**/*.go", "src/[A-Z]*"],
      exclude: [
        { path: "src/lib/?.go", reason: "One-letter files." },
        { path: "src/l*/", reason: "Directories whose name starts with l." },
        { path: "**/*.rs", reason: "Matches nothing." },
      ],
    }),
    root,
  );
  assert.deepEqual(
    classes.excluded.map(({ path: declared, files }) => [declared, files]),
    [
      ["src/lib/?.go", 1],
      ["src/l*/", 1],
      ["**/*.rs", 0],
    ],
  );
  assert.deepEqual(classes.files, { scope: 4, cited: 1, uncovered: 3, excluded: 2 });
  assert.deepEqual(classes.unmatched, ["**/*.rs"]);
  assert.deepEqual(
    classes.largestUncovered.map(({ path: directory }) => directory),
    ["src/net/"],
  );
});

test("a glob matches in a repository of SHA-256 objects", async (t) => {
  const { root, pinned } = await globRepository(t, "sha256");
  assert.equal(pinned.length, 64);
  const report = measureCoverage(
    validateModel(
      minimalModel({
        repository: { name: "glob", revision: pinned },
        coverage: { include: ["src/"], exclude: [{ path: "**/*_test.go", reason: "Tests." }] },
      }),
    ),
    root,
  );
  assert.deepEqual(report.files, { scope: 4, cited: 0, uncovered: 4, excluded: 2 });
});

test("without a declared scope the whole repository is measured", async (t) => {
  const { root, pinned } = await historyRepository(t);
  const report = measureCoverage(historyModel(pinned, { coverage: undefined }), root);
  assert.deepEqual(report.files, { scope: 9, cited: 4, uncovered: 5, excluded: 0 });
  assert.deepEqual(report.citedOutsideScope, []);
  assert.deepEqual(
    report.largestUncovered.map(({ path: directory }) => directory),
    ["src/tools/", "src/vendor/", "docs/"],
  );
});

test("currency reads each cited source's fate and the commits since the pin", async (t) => {
  const { root, git, pinned, head } = await historyRepository(t);
  const before = await snapshot(root, git);
  const model = historyModel(pinned);
  const report = measureCoverage(model, root, { against: "main" });
  assert.deepEqual(report.currency, {
    against: { revision: "main", commit: head },
    ancestor: true,
    commits: 2,
    sources: [
      { id: "a", path: "src/a.mjs", state: "modified" },
      { id: "b", path: "src/b.mjs", state: "moved", to: "src/lib/b.mjs" },
      { id: "c", path: "src/c.mjs", state: "deleted" },
      { id: "readme", path: "README.md", state: "unchanged" },
    ],
  });
  assert.deepEqual(measureCoverage(model, root, { against: "main" }), report);
  assert.deepEqual(await snapshot(root, git), before);
});

test("an unknown revision or a model without one is refused", async (t) => {
  const { root, pinned } = await historyRepository(t);
  assert.throws(() => measureCoverage(historyModel(pinned), root, { against: "no-such-branch" }), {
    code: "currency_revision_unknown",
  });
  assert.throws(() => measureCoverage(historyModel("f".repeat(40)), root), {
    code: "source_revision_unknown",
  });
  assert.throws(
    () =>
      measureCoverage(validateModel(minimalModel()), root, {
        against: "main",
      }),
    { code: "coverage_revision_missing" },
  );
  assert.equal(measureCoverage(validateModel(minimalModel()), root), null);
  await assert.rejects(checkModel("unread.json", { against: "main" }), {
    code: "coverage_repository_missing",
  });
});

test("components and relations without sources are listed as uncited", () => {
  const model = validateModel(
    minimalModel({
      sources: { main: { path: "src/main.mjs" } },
      components: [
        { id: "a", label: "Alpha", sources: ["main"] },
        { id: "b", label: "Beta" },
      ],
    }),
  );
  assert.deepEqual(uncitedStatements(model), { components: ["b"], relations: ["a-b"] });
});

test("check prints coverage and currency with --repo and --against", async (t) => {
  const { root, pinned, head } = await historyRepository(t);
  const model = await writeModel(t, historyJson(pinned));
  const args = ["check", model, "--repo", root, "--against", "main", "--media", "posters"];
  const { exitCode, output } = await runCli([...args, "--json"]);
  assert.equal(exitCode, 0);
  const body = JSON.parse(output);
  assert.deepEqual(body.coverage.files, { scope: 6, cited: 3, uncovered: 3, excluded: 1 });
  assert.deepEqual(body.coverage.currency.against, { revision: "main", commit: head });
  assert.deepEqual(body.statements.uncited, { components: [], relations: ["a-b"] });
  const text = (await runCli(args)).output.split("\n");
  assert.deepEqual(text.slice(1), [
    "Uncited: 0 components and 1 relation.",
    `Coverage at ${pinned.slice(0, 7)}: 3 of 6 files cited, 3 uncovered, 1 excluded.`,
    "Largest uncovered: src/tools/ (2 files).",
    "Matching no file: src/generated/. Cited outside the scope: 1 file.",
    `Currency against main at ${head.slice(0, 7)}: 2 commits since the pin; 1 source unchanged, 1 modified, 1 moved and 1 deleted.`,
    "",
  ]);
});
