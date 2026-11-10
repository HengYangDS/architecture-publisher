import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { USAGE, runCli } from "../src/cli/run.mjs";
import { minimalModel, pageModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

const MAIN = fileURLToPath(new URL("../src/cli/main.mjs", import.meta.url));
const SHOP = fileURLToPath(new URL("../examples/likec4-shop/", import.meta.url));
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
    [["scaffold", "guide", "model.json"], "--out is required."],
    [["scaffold", "page"], "Unknown command scaffold page."],
    [["check"], "Name exactly one model."],
    [["check", "model.json", "--against", "main"], "--against needs --repo."],
    [["build", "model.json", "--out", "x", "--against", "main"], "Unknown option --against."],
    [
      ["check", "model.json", "--png", "2400,wide"],
      "--png takes whole pixel widths separated by commas.",
    ],
  ]) {
    const { exitCode, body } = await json(args);
    assert.equal(exitCode, 2, args.join(" "));
    assert.deepEqual(body, { ok: false, code: "usage", message });
  }
  const text = await runCli(["draw"]);
  assert.equal(text.exitCode, 2);
  assert.equal(text.output, `Unknown command draw.\n\n${USAGE}`);
});

test("help and version answer without a command", async () => {
  for (const flag of ["--help", "-h", "help"])
    assert.deepEqual(await runCli([flag]), { exitCode: 0, output: USAGE });
  assert.deepEqual((await json(["--help"])).body, { ok: true, usage: USAGE });
  const manifest = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(await runCli(["--version"]), { exitCode: 0, output: `${manifest.version}\n` });
  assert.deepEqual((await json(["--version"])).body, { ok: true, version: manifest.version });
});

test("build options outside their range are refused before anything is read", async () => {
  for (const [args, code] of [
    [["--media", "posters,video"], "build_media_invalid"],
    [["--png", "0"], "build_png_invalid"],
    [["--png", "6001"], "build_png_invalid"],
    [["--quality", "draft"], "build_quality_invalid"],
  ]) {
    const { exitCode, body } = await json(["check", "missing.json", ...args]);
    assert.deepEqual([exitCode, body.code], [1, code], args.join(" "));
  }
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
  assert.deepEqual(checked.body.statements, {
    undrawn: { components: [], relations: [] },
    uncited: {
      components: checked.body.views[0].components,
      relations: checked.body.views[0].relations,
    },
  });
  assert.equal(checked.body.coverage, null);
  assert.match(
    (await runCli(["check", model])).output,
    /^page: 1 views admitted; files none\.\nUncited: \d+ components and \d+ relations\.\nPlate 01 \(architecture\): figure (100|80|65)% of the body(, beside its reading)?(; misses [a-zA-Z, ]+)?\.\n$/u,
  );

  const out = path.join(root, "delivery");
  assert.match(
    (await runCli(["build", model, "--out", out])).output,
    /^Built 1 view as the print edition of 1 plate and the page into /u,
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
  // Six components cannot fill the body even at the largest type step: each
  // plate records the balance gates it misses, and none is refused.
  const shop = path.join(root, "shop");
  const built = await json(["build", imported, "--out", shop, "--media", "edition"]);
  assert.equal(built.exitCode, 0);
  assert.deepEqual([built.body.media, built.body.plates], [["edition"], 2]);
  const manifest = JSON.parse(await fs.readFile(path.join(shop, "manifest.json"), "utf8"));
  assert.deepEqual(
    manifest.plates.map(({ views }) => views),
    [["index"], ["internals"]],
  );
  assert.ok(manifest.plates.every(({ misses }) => misses.length));
  assert.equal(manifest.page, null);
  assert.deepEqual(
    (await fs.readdir(shop)).filter((name) => name.endsWith(".html")),
    [],
  );
});

test("check names each plate's share of the body and a plate that left its reading out", async (t) => {
  // Big Bank's tiered containers would wire with route defects at 80 percent, so a summary finds no room.
  const bank = JSON.parse(
    await fs.readFile(new URL("../examples/big-bank/model.json", import.meta.url), "utf8"),
  );
  for (const view of bank.views) view.summary = `What the ${view.id} view shows.`;
  const model = await writeModel(t, bank);
  const checked = await json(["check", model, "--media", "edition"]);
  assert.deepEqual(
    checked.body.plates.map(({ views: [id], share, reading }) => [id, share, reading]).slice(0, 1),
    [["containers-tiers", 1, "above"]],
  );
  const text = (await runCli(["check", model, "--media", "edition"])).output;
  assert.match(
    text,
    /^Plate 01 \(containers-tiers\): figure 100% of the body, its reading above the figure/mu,
  );
  assert.match(
    text,
    /^Plate 02 \(containers-automatic\): figure (80|65)% of the body, beside its reading/mu,
  );
});

test("scaffold guide writes a starting guide and says where", async (t) => {
  const model = await writeModel(t, minimalModel({ summary: "Alpha calls Beta." }));
  const out = path.join(await temporaryDirectory(t, "archpub-cli-scaffold-"), "guide");
  const { exitCode, output } = await runCli(["scaffold", "guide", model, "--out", out]);
  assert.equal(exitCode, 0);
  assert.equal(output, `Wrote guide.archify.md and 1 diagram into ${out}.\n`);
  const again = await json(["scaffold", "guide", model, "--out", out]);
  assert.deepEqual([again.exitCode, again.body.code], [1, "scaffold_output_exists"]);
});

test("the archpub executable prints one result and sets its exit status", async (t) => {
  const model = await writeModel(t, minimalModel());
  const passed = spawnSync(process.execPath, [MAIN, "check", model, "--json"], {
    encoding: "utf8",
  });
  assert.equal(passed.status, 0, passed.stderr);
  assert.equal(JSON.parse(passed.stdout).ok, true);
  const refused = spawnSync(process.execPath, [MAIN, "frobnicate"], { encoding: "utf8" });
  assert.equal(refused.status, 2);
  assert.match(refused.stdout, /^Unknown command frobnicate\./u);
});
