import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const files = ["package.json", "packages/publisher/package.json", "package-lock.json"];

async function contents(directory) {
  return Promise.all(files.map((name) => fs.readFile(path.join(directory, name), "utf8")));
}

async function fixture(t) {
  const parent = path.join(root, "build/test-work");
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, "version-source-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  for (const name of [...files, "tools/release/version.mjs"]) {
    const destination = path.join(directory, name);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(path.join(root, name), destination);
  }
  await fs.writeFile(path.join(directory, "VERSION"), "2.4.6\n");
  return directory;
}

function run(directory, mode) {
  return spawnSync(process.execPath, [path.join(directory, "tools/release/version.mjs"), mode], {
    cwd: directory,
    encoding: "utf8",
    timeout: 30000,
  });
}

function assertProjection(texts, version) {
  const [workspace, product, lock] = texts.map((text) => JSON.parse(text));
  assert.equal(Object.hasOwn(workspace, "version"), false);
  assert.equal(product.version, version);
  assert.equal(Object.hasOwn(lock, "version"), false);
  assert.equal(Object.hasOwn(lock.packages[""], "version"), false);
  assert.equal(lock.packages["packages/publisher"].version, version);
}

test("VERSION owns the repository version and npm manifests are checked projections", async () => {
  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  assertProjection(await contents(root), version);
  const result = run(root, "--check");
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("version projection refuses drift without mutation and updates only owned version fields", async (t) => {
  const directory = await fixture(t);
  const before = await contents(directory);
  const refused = run(directory, "--check");
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /version_projection_drift/);
  assert.deepEqual(await contents(directory), before);

  const written = run(directory, "--write");
  assert.equal(written.status, 0, written.stdout + written.stderr);
  const projected = await contents(directory);
  assertProjection(projected, "2.4.6");
  const beforeLock = JSON.parse(before[2]),
    afterLock = JSON.parse(projected[2]);
  for (const [name, value] of Object.entries(beforeLock.packages))
    if (!["", "packages/publisher"].includes(name))
      assert.deepEqual(afterLock.packages[name], value, name);
  assert.equal(run(directory, "--check").status, 0);
  assert.equal(run(directory, "--write").status, 0);
  assert.deepEqual(await contents(directory), projected);

  await fs.writeFile(path.join(directory, "VERSION"), "2.4.7-rc.1\n");
  assert.equal(run(directory, "--write").status, 0);
  assertProjection(await contents(directory), "2.4.7-rc.1");
});

test("invalid or absent version and unknown mode cannot change package or lock bytes", async (t) => {
  const directory = await fixture(t);
  const before = await contents(directory);
  for (const value of [
    "2.4.6",
    "v2.4.6\n",
    "02.4.6\n",
    "2.4.6-01\n",
    "2.4.6\r\n",
    "2.4.6\n\n",
    "",
  ]) {
    await fs.writeFile(path.join(directory, "VERSION"), value);
    for (const mode of ["--check", "--write"]) {
      const result = run(directory, mode);
      assert.notEqual(result.status, 0, JSON.stringify({ value, mode }));
      assert.match(result.stderr, /version_source_invalid/);
      assert.deepEqual(await contents(directory), before);
    }
  }
  await fs.rm(path.join(directory, "VERSION"));
  assert.notEqual(run(directory, "--write").status, 0);
  assert.deepEqual(await contents(directory), before);
  await fs.writeFile(path.join(directory, "VERSION"), "2.4.6\n");
  const result = run(directory, "--unknown");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage:/);
  assert.deepEqual(await contents(directory), before);
});
