import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const source = fileURLToPath(
  new URL("../packages/publisher/renderers/elk/supply/", import.meta.url),
);

test("the interactive layout engine is an exact offline EPL supply", async () => {
  const module = await import("../packages/publisher/renderers/elk/supply.mjs").catch(() => null);
  assert(module, "the product-owned interactive supply must exist");
  const supply = await module.loadElkSupply();
  assert.equal(supply.version, "0.12.0");
  assert.equal(supply.script.length, 1609707);
  assert.equal(
    sha(supply.script),
    "1222e44f953ce7746af23801e723708f8e6f436b8b377a6a5fc7552f34a307b3",
  );
  assert.match(supply.license.toString("utf8"), /Eclipse Public License/u);
  assert.match(supply.license.toString("utf8"), /LICENSE/u);
  assert.match(supply.manifestSha256, /^[0-9a-f]{64}$/u);
});

test("a caller cannot substitute a different renderer supply", async (t) => {
  const { loadElkSupply, verifyElkSupply } =
    await import("../packages/publisher/renderers/elk/supply.mjs");
  assert.throws(() => loadElkSupply(source), { code: "render_elk_supply_invalid" });
  const parent = path.resolve("build/test-work");
  await fs.mkdir(parent, { recursive: true });
  const work = await fs.mkdtemp(path.join(parent, "elk-supply-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const cases = [
    ["script", async (directory) => fs.appendFile(path.join(directory, "elk.cjs"), "changed")],
    ["license", async (directory) => fs.appendFile(path.join(directory, "LICENSE"), "changed")],
    ["manifest", async (directory) => fs.appendFile(path.join(directory, "supply.json"), "\n")],
    ["extra member", async (directory) => fs.writeFile(path.join(directory, "extra.js"), "")],
    ["missing member", async (directory) => fs.unlink(path.join(directory, "LICENSE"))],
  ];
  for (const [name, mutate] of cases) {
    const copy = path.join(work, name.replaceAll(" ", "-"));
    await fs.cp(source, copy, { recursive: true });
    await mutate(copy);
    await assert.rejects(
      verifyElkSupply(copy),
      {
        code: "render_elk_supply_invalid",
      },
      name,
    );
  }
});

test("the pinned supply descriptor cannot silently change engine identity", async () => {
  const module = await import("../packages/publisher/renderers/elk/supply.mjs");
  assert.equal(typeof module.validateElkManifest, "function");
  const manifest = JSON.parse(await fs.readFile(path.join(source, "supply.json")));
  assert.equal(module.validateElkManifest(manifest), manifest);
  assert.throws(
    () =>
      module.validateElkManifest({
        ...manifest,
        packages: [{ ...manifest.packages[0], version: "0.0.0" }],
      }),
    { code: "render_elk_supply_invalid" },
  );
});
