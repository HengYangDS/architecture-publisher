import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

// The queue item `derived-references`: a table of a reference document that restates the source is written from it
// by a command, and the check of generated inputs refuses a table that differs. This runs the writer on a copy of
// what it reads, with one table of each kind changed by hand.

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const WRITER = path.join(root, "tools/docs/references.mjs");

/** A tree of what the writer reads: the documents it writes, the source, the package, the bundled Archify's
 * manifest and the formatter's policy. */
async function tree() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-references-"));
  for (const part of [
    "docs/reference",
    "src",
    "renderers/archify/supply/supply.json",
    ".config/checks/prettier",
    "package.json",
  ])
    await fs.cp(path.join(root, part), path.join(dir, part), { recursive: true });
  await fs.symlink(path.join(root, "node_modules"), path.join(dir, "node_modules"));
  return dir;
}

const writer = (/** @type {string} */ mode, /** @type {string} */ dir) =>
  run(process.execPath, [WRITER, mode, "--root", dir], { encoding: "utf8" }).then(
    () => ({ code: 0, stderr: "" }),
    (error) => ({ code: error.code, stderr: String(error.stderr) }),
  );

test("the writer refuses a table changed by hand, naming its document, and writes it back", async () => {
  const dir = await tree();
  try {
    assert.equal((await writer("--check", dir)).code, 0);
    for (const [file, from, to] of [
      ["docs/reference/refusals.md", "| `usage`", "| `usage`, `usage_typo`"],
      ["docs/reference/operations.md", "archpub skill [--json]", "archpub skill"],
      ["docs/reference/operations.md", "| `acceptance.sig`", "| `acceptance.asc`"],
      ["docs/reference/operations.md", "| Typst   | 0.15.1 ", "| Typst   | 0.15.2 "],
    ]) {
      const target = path.join(dir, file);
      const before = await fs.readFile(target, "utf8");
      assert.ok(before.includes(from), file);
      await fs.writeFile(target, before.replace(from, to));
      const refused = await writer("--check", dir);
      assert.equal(refused.code, 1, file);
      assert.match(refused.stderr, new RegExp(`references_drift: ${file}: run`, "u"));
      assert.equal((await writer("--write", dir)).code, 0, file);
      assert.equal(await fs.readFile(target, "utf8"), before, file);
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the writer takes a mode and an optional root, and nothing else", async () => {
  const refused = await run(process.execPath, [WRITER, "--draft"], { encoding: "utf8" }).catch(
    (error) => error,
  );
  assert.equal(refused.code, 1);
  assert.match(String(refused.stderr), /references_mode_required/u);
});
