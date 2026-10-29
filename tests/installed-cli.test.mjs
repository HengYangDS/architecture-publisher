import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { installPublisher } from "./fixtures/installed-packages.mjs";
import { minimalModel, writeModel } from "./fixtures/models.mjs";

const root = path.resolve(import.meta.dirname, "..");

function archpub(consumer, ...args) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(consumer, "node_modules/architecture-publisher/src/cli/main.mjs"),
      ...args,
      "--json",
    ],
    { cwd: consumer, encoding: "utf8", timeout: 300000 },
  );
  return { status: result.status, body: JSON.parse(result.stdout || "{}"), stderr: result.stderr };
}

test("the packed publisher installs, relocates and builds with its own verified supplies", async (t) => {
  const parent = path.join(root, "build/test-work");
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, "installed-cli-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  const { consumer, record } = await installPublisher(root, directory);
  assert.equal(record.version, version);
  const packed = record.files.map(({ path: file }) => file);
  assert.ok(packed.includes("src/cli/main.mjs"));
  assert.ok(packed.includes("renderers/archify/supply/bin/archify.mjs"));
  assert.ok(packed.includes("supplies/likec4/parser.mjs"));
  assert.ok(!packed.some((file) => /^(tests|tools|build)\//u.test(file)));

  const relocated = path.join(directory, "relocated");
  await fs.rename(consumer, relocated);
  // The smallest model still runs every bundled supply, Archify included.
  const model = await writeModel(t, minimalModel());
  const out = path.join(directory, "delivery");
  const built = archpub(relocated, "build", model, "--out", out);
  assert.equal(built.status, 0, built.stderr + JSON.stringify(built.body));
  const manifest = JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8"));
  assert.deepEqual(manifest.publisher, { name: "architecture-publisher", version });

  await fs.appendFile(
    path.join(relocated, "node_modules/architecture-publisher/renderers/icons/supply/LICENSE"),
    "tampered\n",
  );
  const refused = archpub(relocated, "check", model);
  assert.equal(refused.status, 1);
  assert.equal(refused.body.code, "supply_invalid");
});
