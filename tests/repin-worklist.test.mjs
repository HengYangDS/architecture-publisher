import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { checkModel } from "../src/build.mjs";
import { runCli } from "../src/cli/run.mjs";
import { validateModel } from "../src/model/load.mjs";
import { bindSources, ownershipAt } from "../src/sources/bind.mjs";
import { measureCoverage } from "../src/sources/coverage.mjs";
import { minimalModel, temporaryDirectory } from "./fixtures/models.mjs";
import { repinRepository } from "./fixtures/repository.mjs";

/** Three components over the re-pin repository's directories and two relations with files. */
const repinJson = (pinned, extra = {}) =>
  minimalModel({
    repository: { name: "repin", revision: pinned },
    components: [
      { id: "a", label: "Alpha", files: ["src/a/"] },
      { id: "b", label: "Beta", files: ["src/b/"] },
      { id: "old", label: "Old", files: ["src/old/"] },
    ],
    relations: [
      { id: "a-b", from: "a", to: "b", label: "calls", files: ["src/b/z.go"] },
      { id: "b-old", from: "b", to: "old", label: "reads", files: ["src/rel/gone.go"] },
    ],
    coverage: { include: ["src/", "tools/"] },
    ...extra,
  });

/** The worklist against `main` of a model whose files are bound to the same checkout first. */
const worklistOf = (model, root, citations = []) =>
  measureCoverage(model, bindSources(model, root), root, { against: "main", citations }).currency
    .worklist;

test("ownership at a commit names the claims and relation files a build there refuses", async (t) => {
  const { root, pinned, head } = await repinRepository(t);
  const model = validateModel(repinJson(pinned));
  const before = ownershipAt(model, root, pinned);
  assert.equal(before.winning.get("src/a/x.go"), "src/a/");
  assert.deepEqual([before.empty, before.missing], [[], []]);
  const after = ownershipAt(model, root, head);
  assert.equal(after.winning.get("src/b/x.go"), "src/b/");
  assert.deepEqual(after.empty, [
    { claim: "src/old/", component: "old", path: "/components/2/files/0" },
  ]);
  assert.deepEqual(after.missing, [
    { file: "src/rel/gone.go", relation: "b-old", path: "/relations/1/files/0" },
  ]);
});

test("the worklist names what a re-pin changes for each component and relation", async (t) => {
  const { root, pinned } = await repinRepository(t);
  const worklist = worklistOf(validateModel(repinJson(pinned)), root);
  assert.deepEqual(worklist.components, [
    {
      id: "a",
      label: "Alpha",
      modified: [],
      moved: [{ path: "src/a/x.go", to: "src/b/x.go", owner: "b" }],
      deleted: [],
      taken: ["src/a/new.go"],
    },
    {
      id: "b",
      label: "Beta",
      modified: ["src/b/z.go"],
      moved: [],
      deleted: [],
      taken: ["src/b/x.go"],
    },
    { id: "old", label: "Old", modified: [], moved: [], deleted: ["src/old/only.go"], taken: [] },
  ]);
  assert.deepEqual(worklist.relations, [
    { id: "a-b", files: [{ path: "src/b/z.go", state: "modified" }] },
    { id: "b-old", files: [{ path: "src/rel/gone.go", state: "deleted" }] },
  ]);
  assert.deepEqual(worklist.refused, [
    { code: "claim_unmatched", path: "/components/2/files/0", component: "old", claim: "src/old/" },
    {
      code: "relation_file_missing",
      path: "/relations/1/files/0",
      relation: "b-old",
      file: "src/rel/gone.go",
    },
  ]);
  // The tool kept since the pin was uncovered there already; only the new one is listed.
  assert.deepEqual(worklist.uncovered, ["tools/new.go"]);
  assert.deepEqual(worklist.citations, []);
});

test("each cited range is the same, shifted, moved, touched or gone at the named revision", async (t) => {
  const { root, pinned } = await repinRepository(t);
  const cite = (where, file, lines) => ({ where, path: file, lines });
  const worklist = worklistOf(validateModel(repinJson(pinned)), root, [
    cite("@source shifted", "docs/cite.md", [10, 12]),
    cite("parts.architecture.json/components/0/sources/0", "docs/cite.md", [5, 6]),
    cite("@source touched", "docs/touch.md", [10, 12]),
    cite("@source above", "docs/touch.md", [1, 3]),
    cite("@source whole", "docs/touch.md", null),
    cite("@source moved", "docs/move.md", [2, 3]),
    cite("@source gone", "docs/gone.md", [1, 1]),
    cite("@source same", "docs/same.md", [1, 2]),
  ]);
  assert.deepEqual(worklist.citations, [
    { ...cite("@source shifted", "docs/cite.md", [10, 12]), fate: "shifted", at: [12, 14] },
    {
      ...cite("parts.architecture.json/components/0/sources/0", "docs/cite.md", [5, 6]),
      fate: "shifted",
      at: [7, 8],
    },
    { ...cite("@source touched", "docs/touch.md", [10, 12]), fate: "touched" },
    { ...cite("@source above", "docs/touch.md", [1, 3]), fate: "same" },
    { ...cite("@source whole", "docs/touch.md", null), fate: "touched" },
    {
      ...cite("@source moved", "docs/move.md", [2, 3]),
      fate: "moved",
      to: "docs/moved.md",
      at: [2, 3],
    },
    { ...cite("@source gone", "docs/gone.md", [1, 1]), fate: "gone" },
    { ...cite("@source same", "docs/same.md", [1, 2]), fate: "same" },
  ]);
});

test("check reads a guide's citations for the worklist and prints it", async (t) => {
  const { root, pinned, head } = await repinRepository(t);
  const directory = await temporaryDirectory(t, "archpub-repin-model-");
  const model = path.join(directory, "model.json");
  await fs.writeFile(model, JSON.stringify(repinJson(pinned, { guide: "guide/guide.archify.md" })));
  await fs.mkdir(path.join(directory, "guide"));
  await fs.writeFile(
    path.join(directory, "guide/guide.archify.md"),
    [
      "# How does the fixture re-pin? {#repin}",
      "",
      "It moves its lines.[](source:cite)",
      "",
      '@answer scope="A fixture for the re-pin worklist."',
      "@meta locale=en",
      '@source cite title="Cited lines" path="docs/cite.md" lines=10:12',
      '@source touch title="Changed lines" path="docs/touch.md" lines=10:12',
      "",
    ].join("\n"),
  );
  const result = await checkModel(model, { repo: root, against: "main", media: ["posters"] });
  assert.deepEqual(
    result.coverage.currency.worklist.citations.map(({ where, fate }) => [where, fate]),
    [
      ["@source cite", "shifted"],
      ["@source touch", "touched"],
    ],
  );
  const args = ["check", model, "--repo", root, "--against", "main", "--media", "posters"];
  const { exitCode, output } = await runCli(args);
  assert.equal(exitCode, 0);
  const lines = output.split("\n");
  assert.deepEqual(lines.slice(lines.indexOf("Re-pin worklist:")), [
    "Re-pin worklist:",
    "  Alpha (a): src/a/x.go moved to src/b/x.go, owned by b; takes in src/a/new.go.",
    "  Beta (b): 1 modified; takes in src/b/x.go.",
    "  Old (old): src/old/only.go deleted.",
    "  Relations whose files changed: a-b (1 file) and b-old (1 file).",
    `  Refused at ${head.slice(0, 7)}: src/old/ of old owns no file; src/rel/gone.go of b-old is gone.`,
    "  Newly uncovered: tools/new.go.",
    "  Guide citations: 2: 1 shifted and 1 touched.",
    "    shifted: @source cite docs/cite.md 10:12 to 12:14",
    "    touched: @source touch docs/touch.md 10:12",
    "",
  ]);
});
