import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runCli } from "../src/cli/run.mjs";
import { json } from "./fixtures/command-line.mjs";
import {
  ETHOS_PROOF_PLANE_MODEL,
  minimalModel,
  pageModel,
  temporaryDirectory,
  writeModel,
} from "./fixtures/models.mjs";
import { repository } from "./fixtures/repository.mjs";
import { reportLines } from "./fixtures/report-lines.mjs";
import { SSH_KEYGEN } from "./fixtures/ssh.mjs";

const MAIN = fileURLToPath(new URL("../src/cli/main.mjs", import.meta.url));
const SHOP = fileURLToPath(new URL("../examples/likec4-shop/", import.meta.url));

test("a checkout that the model gives nothing to read is named in a warning", async (t) => {
  const { root } = await repository(t);
  const model = await writeModel(t, pageModel());
  const checked = await json(["check", model, "--repo", root, "--media", "edition"]);
  assert.equal(checked.exitCode, 0);
  assert.deepEqual(
    checked.body.warnings.map(({ code }) => code),
    ["repo_unused"],
  );
  const [unused] = reportLines(
    (await runCli(["check", model, "--repo", root, "--media", "edition"])).output,
  ).filter(([, label]) => label === "repo_unused");
  assert.equal(unused[0], "attention");
  assert.match(unused[2], /claims and cites no file/u);
  // Without a checkout nothing is unused, and that no part has a strip is no fallback to warn of.
  const unchecked = await json(["check", model, "--media", "edition"]);
  assert.deepEqual(unchecked.body.warnings, []);
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
  assert.deepEqual(reportLines(text.output), [
    ["title", `archpub check · ${model}`],
    ["heading", "Refused"],
    ["refused", "model_invalid", body.message],
    ["heading", "Problems"],
    ["refused", "/relations/0", body.problems[0].message],
    ["closing", "Exit status 1: refused"],
  ]);
  // A model with two problems has each on a line with its path.
  const twice = await writeModel(
    t,
    minimalModel({
      relations: [
        { id: "x", from: "a", to: "a", label: "y" },
        { id: "z", from: "b", to: "b", label: "w" },
      ],
    }),
  );
  const problems = (await json(["check", twice])).body.problems;
  assert.deepEqual(
    problems.map(({ path: where }) => where),
    ["/relations/0", "/relations/1"],
  );
  assert.deepEqual(
    reportLines((await runCli(["check", twice])).output).slice(4, -1),
    problems.map(({ path: where, message }) => ["refused", where, message]),
  );
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
  assert.deepEqual(reportLines(text.output), [
    ["title", `archpub accept · ${root}`],
    ["heading", "Internal error"],
    ["refused", "Error", body.message],
    ["closing", "Exit status 3: internal error"],
  ]);
  // A failure that is no Error is reported in its own words.
  const readFile = fs.readFile;
  t.mock.method(fs, "readFile", (file, ...rest) =>
    String(file).endsWith("SKILL.md")
      ? Promise.reject("the disk is gone")
      : readFile(file, ...rest),
  );
  assert.deepEqual(await json(["skill"]), {
    exitCode: 3,
    body: { ok: false, code: "internal_error", message: "the disk is gone" },
  });
  t.mock.restoreAll();
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
  const report = reportLines((await runCli(["check", model])).output);
  const [plate] = checked.body.plates;
  assert.deepEqual(
    report.map(([kind, label]) => [kind, label]),
    [
      ["title", "archpub check · page"],
      ["heading", "Model"],
      ["passed", "Views"],
      ["noted", "Files"],
      ["attention", "Uncited"],
      ["heading", "Plates"],
      // A plate that passes every gate carries no `misses` (the manifest drops an empty list).
      [plate.misses?.length ? "attention" : "passed", "01"],
      ["heading", "Data"],
      ["noted", "Statements"],
      ["noted", "Facts"],
      ["noted", "Evidence"],
      ["passed", "Faces"],
      ["closing", `Next: archpub build ${model} --out <directory>`],
    ],
  );
  // The data a build would write is counted: every statement names no file, and the one plate's face was held.
  const counted = checked.body.data;
  assert.deepEqual(
    report.slice(8, 12).map(([, , value]) => value),
    [
      `${counted.statements.components} components, ${counted.statements.relations} relations and 0 groups: ` +
        `0 cited, 0 unchecked and ${counted.statements.uncited} uncited`,
      `${counted.facts} facts`,
      "0 paths with 0 cited ranges",
      "1 plate, each its view's statements",
    ],
  );
  assert.deepEqual([report[2][2], report[3][2]], ["1 view admitted", "none claimed or cited"]);
  const { components, relations } = checked.body.statements.uncited;
  assert.equal(
    report[4][2],
    `${components.length} components (${components.join(", ")}) and ${relations.length} relations (${relations.join(", ")})`,
  );
  assert.match(
    report[6][2],
    /^architecture · figure (100|80|65)% of the body(, beside its reading)?( · misses [a-zA-Z0-9., ()-]+)?$/u,
  );

  const out = path.join(root, "delivery");
  const delivered = reportLines(
    (await runCli(["build", model, "--out", out, "--png", "240"])).output,
  );
  assert.match(delivered[5][2], /^\d+ files$/u);
  assert.deepEqual(delivered.toSpliced(5, 1).slice(0, 6), [
    ["title", "archpub build · page"],
    ["heading", "Delivery"],
    ["passed", "Views", "1 view"],
    ["passed", "Edition", "1 plate in page.pdf"],
    ["passed", "Page", "page.html"],
    ["passed", "Directory", out],
  ]);
  assert.deepEqual(delivered.at(-1), ["closing", `Next: archpub accept ${out} --reviewer <name>`]);
  assert.equal((await json(["verify", out])).body.code, "acceptance_missing");
  assert.deepEqual(
    reportLines(
      (
        await runCli([
          "accept",
          out,
          "--reviewer",
          "Reviewer",
          "--seal-name",
          "R",
          "--note",
          "fine",
        ])
      ).output,
    ),
    [
      ["title", `archpub accept · ${out}`],
      ["heading", "Acceptance"],
      ["passed", "Reviewer", "Reviewer"],
      ["noted", "Signature", "unsigned"],
      ["passed", "Colophon", path.join(out, "colophon.pdf")],
      ["closing", `Next: archpub verify ${out}`],
    ],
  );
  const verified = await json(["verify", out]);
  assert.deepEqual(
    [verified.exitCode, verified.body.reviewer, verified.body.signature],
    [0, "Reviewer", "unsigned"],
  );
  assert.deepEqual(reportLines((await runCli(["verify", out])).output), [
    ["title", `archpub verify · ${out}`],
    ["heading", "Acceptance"],
    [
      "passed",
      "Delivery",
      "its files match the manifest, the acceptance record names this manifest, and the colophon page is the one the record names",
    ],
    ["passed", "Reviewer", `Reviewer at ${verified.body.acceptedAt}`],
    ["noted", "Signature", "unsigned"],
    ["closing", `Next: archpub publish ${out} --to <root>`],
  ]);
  const allowed = path.join(root, "allowed-signers");
  const unsigned = await json(["verify", out, "--allowed-signers", allowed]);
  assert.deepEqual([unsigned.exitCode, unsigned.body.code], [1, "acceptance_signature_invalid"]);
  // A signed acceptance of a copy names its signer, and verify checks it against the allowed signers; a machine
  // without ssh-keygen cannot sign, so there the step is skipped.
  await t.test("a signed copy", async (step) => {
    if (!SSH_KEYGEN) return step.skip("no ssh-keygen on the path");
    const signed = path.join(root, "signed");
    await fs.cp(out, signed, { recursive: true });
    for (const file of ["acceptance.json", "colophon.pdf"]) await fs.rm(path.join(signed, file));
    assert.match((await runCli(["accept", "--help"])).output, /acceptance\.sig/u);
    const key = path.join(root, "key");
    spawnSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-f", key], { stdio: "ignore" });
    await fs.writeFile(allowed, `Reviewer ${await fs.readFile(`${key}.pub`, "utf8")}`);
    const signature = async (args) =>
      reportLines((await runCli(args)).output).find(([, label]) => label === "Signature");
    const accepted = await signature(["accept", signed, "--reviewer", "Reviewer", "--sign", key]);
    assert.equal(accepted[0], "passed");
    assert.match(accepted[2], /^signed by SHA256:\S+ in .*acceptance\.sig$/u);
    const unchecked = await signature(["verify", signed]);
    assert.equal(unchecked[0], "attention");
    assert.match(unchecked[2], /^signed by SHA256:\S+, unchecked without --allowed-signers$/u);
    const checkedSignature = await signature(["verify", signed, "--allowed-signers", allowed]);
    assert.equal(checkedSignature[0], "passed");
    assert.match(
      checkedSignature[2],
      /^signed by SHA256:\S+ and checked against the allowed signers$/u,
    );
  });
  const target = path.join(root, "published");
  const published = await runCli(["publish", out, "--to", target, "--version", "v1"]);
  const copy = path.join(target, "page", "v1");
  assert.deepEqual(reportLines(published.output), [
    ["title", `archpub publish · ${out}`],
    ["heading", "Publication"],
    ["passed", "Published", copy],
    ["closing", "Done."],
  ]);
  assert.deepEqual(
    reportLines((await runCli(["publish", out, "--to", target, "--version", "v1"])).output)[2],
    ["noted", "Already published", copy],
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
  const wrote = reportLines(result.output);
  assert.deepEqual(
    wrote.slice(0, 7).map((line) => line.slice(0, 2)),
    [
      ["title", `archpub import likec4 · ${SHOP}`],
      ["heading", "Model"],
      ["passed", "Components"],
      ["passed", "Relations"],
      ["passed", "File"],
      ["heading", "Warnings"],
      ["attention", "model.c4:24"],
    ],
  );
  assert.deepEqual([wrote[2][2], wrote[3][2], wrote[4][2]], ["6", "5", imported]);
  assert.deepEqual(wrote.at(-1), ["closing", `Next: archpub check ${imported}`]);
  assert.equal(JSON.parse(await fs.readFile(imported, "utf8")).id, "shop");
  const again = await json(["import", "likec4", SHOP, "--out", imported, "--id", "shop"]);
  assert.deepEqual([again.exitCode, again.body.code], [1, "import_output_exists"]);
  // Six components cannot fill the body even at the largest type step: each
  // plate records the balance gates it misses, and none is refused.
  const shop = path.join(root, "shop");
  const built = await json([
    "build",
    imported,
    "--out",
    shop,
    "--media",
    "edition",
    "--png",
    "240",
  ]);
  assert.equal(built.exitCode, 0);
  assert.deepEqual([built.body.media, built.body.plates], [["edition"], 2]);
  const manifest = JSON.parse(await fs.readFile(path.join(shop, "manifest.json"), "utf8"));
  assert.deepEqual(
    manifest.plates.map(({ views }) => views),
    [["index"], ["internals"]],
  );
  assert.ok(manifest.plates.every(({ misses }) => misses.length));
  // A check marks each of those plates as needing attention and names the gates it misses.
  const shopCheck = await json(["check", imported, "--media", "edition"]);
  const plateLines = reportLines((await runCli(["check", imported, "--media", "edition"])).output);
  for (const { page, misses } of shopCheck.body.plates) {
    const line = plateLines.find(([, label]) => label === String(page).padStart(2, "0"));
    assert.equal(line[0], "attention");
    for (const { measure, value, limit } of misses)
      assert.ok(line[2].includes(`${measure} ${value} (limit ${limit})`), `${page}: ${measure}`);
  }
  assert.equal(manifest.page, null);
  assert.deepEqual(
    (await fs.readdir(shop)).filter((name) => name.endsWith(".html")),
    [],
  );
});

test("check names each plate's share of the body and a plate that left its reading out", async (t) => {
  // The ETHOS proof plane with longer names would wire worse at 80 percent of the body, with a route defect it has
  // not at the full width, so its summary finds no room beside it. Under its own names it wires alike at both.
  const ethos = JSON.parse(await fs.readFile(ETHOS_PROOF_PLANE_MODEL, "utf8"));
  for (const component of ethos.components) component.label += " of one exact HEAD";
  for (const view of ethos.views) view.summary = `What the ${view.id} view shows.`;
  const model = await writeModel(t, ethos);
  const checked = await json(["check", model, "--media", "edition"]);
  assert.deepEqual(
    checked.body.plates.map(({ views: [id], share, reading }) => [id, share, reading]).slice(1),
    [["proof", 1, "above"]],
  );
  const lines = reportLines((await runCli(["check", model, "--media", "edition"])).output);
  const plate = (page) => lines.find(([, label]) => label === page)[2];
  assert.match(plate("01"), /^overview · figure (80|65)% of the body, beside its reading/u);
  assert.match(plate("02"), /^proof · figure 100% of the body, its reading above the figure/u);
});

test("scaffold guide writes a starting guide and says where", async (t) => {
  const model = await writeModel(t, minimalModel({ summary: "Alpha calls Beta." }));
  const out = path.join(await temporaryDirectory(t, "archpub-cli-scaffold-"), "guide");
  const { exitCode, output } = await runCli(["scaffold", "guide", model, "--out", out]);
  assert.equal(exitCode, 0);
  assert.deepEqual(reportLines(output), [
    ["title", `archpub scaffold guide · ${model}`],
    ["heading", "Guide"],
    ["passed", "Draft", "guide.archify.md"],
    ["passed", "Diagrams", "1 diagram"],
    ["passed", "Directory", out],
    [
      "noted",
      "Model",
      `name ${path.relative(path.dirname(model), path.join(out, "guide.archify.md")).split(path.sep).join("/")} as its guide, then rewrite the draft`,
    ],
    ["closing", `Next: archpub check ${model}`],
  ]);
  const again = await json(["scaffold", "guide", model, "--out", out]);
  assert.deepEqual([again.exitCode, again.body.code], [1, "scaffold_output_exists"]);
});

test("migrate writes a version 3 model, says where and refuses a file that exists", async (t) => {
  const input = await writeModel(t, minimalModel({ version: 2, scope: "All" }));
  const out = path.join(await temporaryDirectory(t, "archpub-cli-migrate-"), "model.json");
  const { exitCode, output } = await runCli(["migrate", input, "--out", out]);
  assert.equal(exitCode, 0);
  assert.equal(JSON.parse(await fs.readFile(out, "utf8")).version, 3);
  const lines = reportLines(output);
  assert.deepEqual(
    lines.map(([kind, label]) => [kind, label]),
    [
      ["title", `archpub migrate · ${input}`],
      ["heading", "Model"],
      ["passed", "Claims"],
      ["passed", "Citations"],
      ["passed", "File"],
      ["closing", `Next: archpub check ${out}`],
    ],
  );
  assert.equal(lines[4][2], out);
  const again = await runCli(["migrate", input, "--out", out]);
  assert.equal(again.exitCode, 1);
  assert.deepEqual(reportLines(again.output).slice(0, 3), [
    ["title", `archpub migrate · ${input}`],
    ["heading", "Refused"],
    ["refused", "migrate_output_exists", `${out} already exists.`],
  ]);
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
  assert.match(refused.stdout, /^error: unknown command 'frobnicate'\n/u);
});
