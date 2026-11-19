import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { installPublisher } from "./fixtures/installed-packages.mjs";
import { minimalModel, writeModel } from "./fixtures/models.mjs";

const root = path.resolve(import.meta.dirname, "..");

function archpub(consumer, ...args) {
  // The installed package measures every candidate itself: the suite's kept answers are not named to it.
  const env = { ...process.env };
  delete env.ARCHPUB_ARCHIFY_ANSWERS;
  const result = spawnSync(
    process.execPath,
    [
      path.join(consumer, "node_modules/architecture-publisher/src/cli/main.mjs"),
      ...args,
      "--json",
    ],
    { cwd: consumer, encoding: "utf8", timeout: 300000, env },
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
  assert.ok(packed.includes("skills/architecture-publisher/SKILL.md"));
  assert.ok(!packed.some((file) => /^(tests|tools|build)\//u.test(file)));
  // The package bundles the libraries its command line is built on, as the lock records them, each with its licence.
  const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
  const bundled = Object.entries(lock.packages).filter(([, entry]) => entry.inBundle);
  for (const name of ["node_modules/@clack/prompts", "node_modules/commander"])
    assert.ok(
      bundled.some(([lockPath]) => lockPath === name),
      `the lock bundles no ${name}`,
    );
  for (const [lockPath] of bundled) {
    assert.ok(packed.includes(`${lockPath}/package.json`), `the package holds no ${lockPath}`);
    assert.ok(
      packed.some((file) => file.toLowerCase().startsWith(`${lockPath}/licen`)),
      `the package holds no licence of ${lockPath}`,
    );
  }

  const relocated = path.join(directory, "relocated");
  await fs.rename(consumer, relocated);
  // Each bundled library is installed inside the package at the version the lock records.
  const installed = path.join(relocated, "node_modules/architecture-publisher");
  for (const [lockPath, entry] of bundled)
    assert.equal(
      JSON.parse(await fs.readFile(path.join(installed, lockPath, "package.json"), "utf8")).version,
      entry.version,
      lockPath,
    );
  // The installed command prints its help from the libraries it carries, with the npm cache empty and offline.
  const help = spawnSync(process.execPath, [path.join(installed, "src/cli/main.mjs"), "--help"], {
    cwd: relocated,
    encoding: "utf8",
  });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /^Usage: archpub /u);
  // The smallest model still runs every bundled supply, Archify included.
  const model = await writeModel(t, minimalModel());
  const out = path.join(directory, "delivery");
  const built = archpub(relocated, "build", model, "--out", out, "--png", "240");
  assert.equal(built.status, 0, built.stderr + JSON.stringify(built.body));
  const manifest = JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8"));
  assert.deepEqual(manifest.publisher, { name: "architecture-publisher", version });
  // The installed command prints the Skill it carries, wherever it was moved.
  const skill = path.join(
    relocated,
    "node_modules/architecture-publisher/skills/architecture-publisher/SKILL.md",
  );
  assert.deepEqual(archpub(relocated, "skill").body, {
    ok: true,
    file: skill,
    skill: await fs.readFile(path.join(root, "skills/architecture-publisher/SKILL.md"), "utf8"),
  });

  await fs.appendFile(
    path.join(relocated, "node_modules/architecture-publisher/renderers/icons/supply/LICENSE"),
    "tampered\n",
  );
  const refused = archpub(relocated, "check", model);
  assert.equal(refused.status, 1);
  assert.equal(refused.body.code, "supply_invalid");
});
