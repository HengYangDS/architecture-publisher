import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runCli } from "../src/cli/run.mjs";
import { migrateModel } from "../src/importers/model.mjs";
import { validateModel } from "../src/model/load.mjs";
import { bindSources } from "../src/sources/bind.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { repository } from "./fixtures/repository.mjs";

/** A version 1 model: a source catalog that components and relations cite by id. */
const catalogModel = (extra = {}) =>
  minimalModel({
    version: 1,
    sources: {
      main: { path: "src/main.mjs", sha256: "0".repeat(64) },
      readme: { path: "README.md", note: "The entry for readers." },
    },
    components: [
      { id: "a", label: "Alpha", sources: ["main", "readme"], status: "implemented" },
      { id: "b", label: "Beta", sources: ["readme"] },
      { id: "c", label: "Gamma" },
    ],
    relations: [{ id: "a-b", from: "a", to: "b", label: "calls", sources: ["main", "main"] }],
    ...extra,
  });

test("a catalog model becomes one whose components claim the files they cited", async (t) => {
  const { model, moved } = await migrateModel(await writeModel(t, catalogModel()));
  assert.deepEqual(model, {
    format: "architecture-publisher.model",
    version: 2,
    id: "minimal",
    title: "Minimal",
    question: "What is minimal?",
    components: [
      { id: "a", label: "Alpha", files: ["src/main.mjs", "README.md"], status: "implemented" },
      { id: "b", label: "Beta" },
      { id: "c", label: "Gamma" },
    ],
    relations: [{ id: "a-b", from: "a", to: "b", label: "calls", files: ["src/main.mjs"] }],
  });
  // A file two components cited stays with the first; the second is named.
  assert.deepEqual(moved, [{ path: "README.md", owner: "a", components: ["b"] }]);
  assert.equal(validateModel(model).components[0].files.length, 2);
});

test("a migrated model owns at its revision the files it cited", async (t) => {
  const { root, revision } = await repository(t);
  const { model } = await migrateModel(
    await writeModel(t, catalogModel({ repository: { name: "fixture", revision } })),
  );
  const binding = bindSources(validateModel(model), root);
  assert.deepEqual(
    binding.records.map(({ path: file, owner, relations }) => [file, owner, relations]),
    [
      ["README.md", "a", []],
      ["src/main.mjs", "a", ["a-b"]],
    ],
  );
  assert.deepEqual(binding.owned.get("a"), ["src/main.mjs", "README.md"]);
});

test("only a version 1 model whose sources resolve is migrated", async (t) => {
  await assert.rejects(migrateModel(await writeModel(t, minimalModel())), {
    code: "migrate_version_unsupported",
  });
  await assert.rejects(
    migrateModel(
      await writeModel(
        t,
        catalogModel({ components: [{ id: "a", label: "A", sources: ["gone"] }] }),
      ),
    ),
    (error) =>
      error.code === "migrate_source_unknown" &&
      error.problems[0].path === "/components/0/sources/0",
  );
});

test("migrate writes a new file and refuses one that exists", async (t) => {
  const input = await writeModel(t, catalogModel());
  const directory = await temporaryDirectory(t, "archpub-migrate-");
  const out = path.join(directory, "model.json");
  const written = await runCli(["migrate", input, "--out", out]);
  assert.equal(written.exitCode, 0);
  assert.equal(
    written.output,
    `Wrote ${out}: components claim 2 files, relations cite 1 file.\nkept with a: README.md, no longer cited by b\n`,
  );
  assert.equal(JSON.parse(await fs.readFile(out, "utf8")).version, 2);
  await fs.writeFile(out, "kept\n");
  const refused = await runCli(["migrate", input, "--out", out, "--json"]);
  assert.equal(refused.exitCode, 1);
  assert.equal(JSON.parse(refused.output).code, "migrate_output_exists");
  assert.equal(await fs.readFile(out, "utf8"), "kept\n");
  assert.equal((await runCli(["migrate", input])).exitCode, 2);
});
