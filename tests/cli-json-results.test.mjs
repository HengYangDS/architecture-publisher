import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { checkModel } from "../src/build.mjs";
import { runCli } from "../src/cli/run.mjs";
import { json } from "./fixtures/command-line.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

const SHOP = fileURLToPath(new URL("../examples/likec4-shop/", import.meta.url));

test("every command keeps the fields of its JSON body and its exit status", async (t) => {
  const root = await temporaryDirectory(t, "archpub-cli-json-");
  const model = await writeModel(t, minimalModel({ summary: "Alpha calls Beta." }));
  const invalid = await writeModel(
    t,
    minimalModel({ relations: [{ id: "x", from: "a", to: "a", label: "y" }] }),
  );
  const out = path.join(root, "delivery");
  const published = path.join(root, "published");
  const shop = path.join(root, "shop.json");
  await fs.mkdir(path.join(root, "broken", "manifest.json"), { recursive: true });
  const refusal = ["ok", "code", "message", "problems"];
  const check = [
    "ok",
    "model",
    "quality",
    "media",
    "sources",
    "views",
    "plates",
    "diagrams",
    "guide",
    "overview",
    "statements",
    "data",
    "coverage",
    "warnings",
  ];
  const accepted = ["ok", "directory", "manifest", "reviewer", "acceptedAt"];
  for (const [args, status, fields] of [
    [["--help"], 0, ["ok", "usage", "commands"]],
    [["build", "--help"], 0, ["ok", "usage", "commands"]],
    [["--version"], 0, ["ok", "version"]],
    [[], 2, ["ok", "code", "message"]],
    [["draw"], 2, ["ok", "code", "message"]],
    [["build", model], 2, ["ok", "code", "message"]],
    [["check", model], 0, check],
    [["check", invalid], 1, refusal],
    [["check", "missing.json", "--quality", "draft"], 1, refusal],
    [
      ["build", model, "--out", out],
      0,
      ["ok", "out", "model", "media", "views", "plates", "artifacts", "warnings"],
    ],
    [["build", model, "--out", out], 1, refusal],
    [["verify", out], 1, refusal],
    [
      ["accept", out, "--reviewer", "Reviewer"],
      0,
      [...accepted, "colophon", "signer", "signature"],
    ],
    [["accept", out, "--reviewer", "Reviewer"], 1, refusal],
    [["verify", out], 0, [...accepted, "signer", "signature"]],
    // An accepted delivery is compared as any other; its acceptance is no part of the comparison.
    [["compare", out, out], 0, ["ok", "first", "second", "identical", "plates", "files"]],
    [["compare", out, root], 1, refusal],
    [
      ["publish", out, "--to", published, "--version", "v1"],
      0,
      ["ok", "target", "version", "copied"],
    ],
    [
      ["publish", out, "--to", published, "--version", "v1"],
      0,
      ["ok", "target", "version", "copied"],
    ],
    [
      ["scaffold", "guide", model, "--out", path.join(root, "guide")],
      0,
      ["ok", "out", "draft", "files"],
    ],
    [["scaffold", "guide", model, "--out", path.join(root, "guide")], 1, refusal],
    [
      ["import", "likec4", SHOP, "--out", shop, "--id", "shop"],
      0,
      ["ok", "out", "components", "relations", "warnings"],
    ],
    [["import", "likec4", SHOP, "--out", shop, "--id", "shop"], 1, refusal],
    [["migrate", model, "--out", path.join(root, "migrated.json")], 1, refusal],
    [["accept", path.join(root, "broken"), "--reviewer", "Reviewer"], 3, ["ok", "code", "message"]],
    // Without --version a delivery is published under the name its manifest gives it.
    [
      ["publish", out, "--to", path.join(root, "unnamed")],
      0,
      ["ok", "target", "version", "copied"],
    ],
    // A model that cannot be written where --out names it is no refusal.
    [
      ["import", "likec4", SHOP, "--out", path.join(root, "absent", "shop.json"), "--id", "shop"],
      3,
      ["ok", "code", "message"],
    ],
    [["skill"], 0, ["ok", "file", "skill"]],
  ]) {
    const { exitCode, body } = await json(args);
    assert.equal(exitCode, status, args.join(" "));
    assert.deepEqual(Object.keys(body), fields, args.join(" "));
    assert.equal(body.ok, status === 0, args.join(" "));
  }
  // The build named no width: its plate's image is 3840 px wide and is named without the width.
  assert.deepEqual(await fs.readdir(path.join(out, "images")), ["01-architecture.png"]);
  const image = await fs.readFile(path.join(out, "images", "01-architecture.png"));
  assert.equal(image.readUInt32BE(16), 3840);
  // The body of a check is what the check found, field for field.
  assert.deepEqual(
    (await json(["check", model, "--media", "edition", "--png", "1200,2400"])).body,
    JSON.parse(
      JSON.stringify({
        ok: true,
        ...(await checkModel(model, { media: ["edition"], png: [1200, 2400] })),
      }),
    ),
  );
  // --json may stand anywhere on the command line.
  assert.deepEqual(
    (await runCli(["--json", "check", model])).output,
    (await runCli(["check", model, "--json"])).output,
  );
});
