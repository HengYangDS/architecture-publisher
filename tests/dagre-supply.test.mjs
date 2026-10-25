import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const source = fileURLToPath(
  new URL("../packages/publisher/renderers/dagre/supply/", import.meta.url),
);

test("one exact offline Dagre geometry supply retains both MIT package identities", async () => {
  const module = await import("../packages/publisher/renderers/dagre/supply.mjs").catch(() => null);
  assert(module, "the selected geometry supply must exist");
  const supply = await module.loadDagreSupply();
  assert.equal(supply.version, "3.1.3");
  assert.equal(supply.script.length, 49326);
  assert.equal(
    sha(supply.script),
    "54a503e346f93ca0bb10abe7999587e037262935687aca45eb4e4b0f64bbb578",
  );
  assert.match(supply.license.toString("utf8"), /Copyright \(c\) 2012-2014 Chris Pettitt/u);
  assert.match(supply.license.toString("utf8"), /Permission is hereby granted/u);
  assert.match(supply.manifestSha256, /^[0-9a-f]{64}$/u);
});

test("a caller cannot substitute another geometry supply or alter pinned bytes", async (t) => {
  const { loadDagreSupply, verifyDagreSupply } =
    await import("../packages/publisher/renderers/dagre/supply.mjs");
  assert.throws(() => loadDagreSupply(source), { code: "render_dagre_supply_invalid" });
  const parent = path.resolve("build/test-work");
  await fs.mkdir(parent, { recursive: true });
  const work = await fs.mkdtemp(path.join(parent, "dagre-supply-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const cases = [
    ["script", async (directory) => fs.appendFile(path.join(directory, "dagre.min.js"), "changed")],
    ["license", async (directory) => fs.appendFile(path.join(directory, "LICENSE"), "changed")],
    ["manifest", async (directory) => fs.appendFile(path.join(directory, "supply.json"), "\n")],
    ["extra member", async (directory) => fs.writeFile(path.join(directory, "extra.js"), "")],
    ["missing member", async (directory) => fs.unlink(path.join(directory, "LICENSE"))],
  ];
  for (const [name, mutate] of cases) {
    const copy = path.join(work, name.replaceAll(" ", "-"));
    await fs.cp(source, copy, { recursive: true });
    await mutate(copy);
    await assert.rejects(verifyDagreSupply(copy), { code: "render_dagre_supply_invalid" }, name);
  }
});

test("the pinned descriptor cannot silently change Dagre or Graphlib identity", async () => {
  const { validateDagreManifest } =
    await import("../packages/publisher/renderers/dagre/supply.mjs");
  const manifest = JSON.parse(await fs.readFile(path.join(source, "supply.json")));
  assert.equal(validateDagreManifest(manifest), manifest);
  for (const index of [0, 1]) {
    const changed = structuredClone(manifest);
    changed.packages[index].version = "0.0.0";
    assert.throws(() => validateDagreManifest(changed), {
      code: "render_dagre_supply_invalid",
    });
  }
});
