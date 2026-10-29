import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { USAGE, runCli } from "../packages/publisher/src/cli/run.mjs";
import { minimalModel, pageModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

const MAIN = fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url));
const SHOP = fileURLToPath(new URL("./fixtures/likec4/shop/", import.meta.url));
const json = async (args) => {
  const { exitCode, output } = await runCli([...args, "--json"]);
  return { exitCode, body: JSON.parse(output) };
};

test("usage errors exit with status 2 and say what is wrong", async () => {
  for (const [args, message] of [
    [[], "Name a command."],
    [["draw"], "Unknown command draw."],
    [["import", "mermaid"], "Unknown command import mermaid."],
    [["check", "--color", "red"], "Unknown option --color."],
    [["check", "model.json", "--repo"], "--repo needs a value."],
    [["build", "model.json"], "--out is required."],
    [["check"], "Name exactly one model."],
  ]) {
    const { exitCode, body } = await json(args);
    assert.equal(exitCode, 2, args.join(" "));
    assert.deepEqual(body, { ok: false, code: "usage", message });
  }
  const text = await runCli(["draw"]);
  assert.equal(text.exitCode, 2);
  assert.equal(text.output, `Unknown command draw.\n\n${USAGE}`);
});

test("refusals exit with status 1 and list each problem", async (t) => {
  const model = await writeModel(
    t,
    minimalModel({ relations: [{ id: "x", from: "a", to: "a", label: "y" }] }),
  );
  const { exitCode, body } = await json(["check", model]);
  assert.equal(exitCode, 1);
  assert.equal(body.code, "model_invalid");
  assert.deepEqual(
    body.problems.map(({ code }) => code),
    ["model_relation_self"],
  );
  const text = await runCli(["check", model]);
  assert.equal(text.exitCode, 1);
  assert.match(text.output, /\n {2}\/relations\/0 /u);
});

test("a failure that is not a refusal exits with status 3 and a JSON body", async (t) => {
  // A manifest that is a directory cannot be read, which is not a missing manifest.
  const root = await temporaryDirectory(t, "archpub-cli-");
  await fs.mkdir(path.join(root, "manifest.json"));
  const { exitCode, body } = await json(["accept", root, "--reviewer", "Reviewer"]);
  assert.equal(exitCode, 3);
  assert.deepEqual([body.ok, body.code], [false, "internal_error"]);
  assert.match(body.message, /EISDIR/u);
  const text = await runCli(["accept", root, "--reviewer", "Reviewer"]);
  assert.equal(text.exitCode, 3);
  assert.match(text.output, /^Internal error: /u);
});

test("check, build, accept, publish and import run end to end", async (t) => {
  const root = await temporaryDirectory(t, "archpub-cli-");
  const model = await writeModel(t, pageModel());
  const checked = await json(["check", model]);
  assert.equal(checked.exitCode, 0);
  assert.equal(checked.body.ok, true);
  assert.equal(checked.body.model.id, "page");
  assert.match(
    (await runCli(["check", model])).output,
    /^page: 1 views admitted; sources none\.\n$/u,
  );

  const out = path.join(root, "delivery");
  assert.match(
    (await runCli(["build", model, "--out", out])).output,
    /^Built 1 views and the page into /u,
  );
  const accepted = await json(["accept", out, "--reviewer", "Reviewer", "--note", "fine"]);
  assert.equal(accepted.body.reviewer, "Reviewer");
  const target = path.join(root, "published");
  const published = await runCli(["publish", out, "--to", target, "--version", "v1"]);
  assert.match(published.output, /^Published .*v1\.\n$/u);
  assert.match(
    (await runCli(["publish", out, "--to", target, "--version", "v1"])).output,
    /^Already published/u,
  );
  assert.equal((await runCli(["accept", out, "--reviewer", "Reviewer"])).exitCode, 1);

  const imported = path.join(root, "shop.json");
  const result = await runCli([
    "import",
    "likec4",
    SHOP,
    "--out",
    imported,
    "--id",
    "shop",
    "--title",
    "Shop",
  ]);
  assert.equal(result.exitCode, 0);
  assert.match(
    result.output,
    /^Wrote .* with 6 components and 5 relations\.\nwarning: model\.c4:24: /u,
  );
  assert.equal(JSON.parse(await fs.readFile(imported, "utf8")).id, "shop");
  const again = await json(["import", "likec4", SHOP, "--out", imported, "--id", "shop"]);
  assert.deepEqual([again.exitCode, again.body.code], [1, "import_output_exists"]);
  // Six components cannot fill a balanced 16:9 page: the build refuses, names
  // each view with what its closest page misses, and writes nothing.
  const built = await json(["build", imported, "--out", path.join(root, "shop")]);
  assert.deepEqual([built.exitCode, built.body.code], [1, "poster_unbalanced"]);
  assert.deepEqual(
    built.body.problems.map((problem) => problem.path),
    ["/views/index", "/views/internals"],
  );
  await assert.rejects(fs.access(path.join(root, "shop")));
});

test("the archpub executable prints one result and sets its exit status", async (t) => {
  const model = await writeModel(t, pageModel());
  const passed = spawnSync(process.execPath, [MAIN, "check", model, "--json"], {
    encoding: "utf8",
  });
  assert.equal(passed.status, 0, passed.stderr);
  assert.equal(JSON.parse(passed.stdout).ok, true);
  const refused = spawnSync(process.execPath, [MAIN, "frobnicate"], { encoding: "utf8" });
  assert.equal(refused.status, 2);
  assert.match(refused.stdout, /^Unknown command frobnicate\./u);
});
