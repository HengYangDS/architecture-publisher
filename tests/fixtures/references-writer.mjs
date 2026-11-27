// A copy of what the reference writer (tools/docs/references.mjs) reads, and the writer run on it: the tests of each
// family of its sources change a source or a document of the copy and read what the writer refuses or writes.
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "../..");
/** The writer. */
export const WRITER = path.join(root, "tools/docs/references.mjs");

/** A tree of what the writer reads: the documents it writes, the source, the trials' fixture, the package, the mise
 * lock, the release archive's table and the formatter's policy, with the bundled renderers the command it runs for a
 * sample reads, linked as they are never changed here. */
export async function tree() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-references-"));
  for (const part of [
    ".github/ISSUE_TEMPLATE/bug-report.yml",
    "README.md",
    "docs/how-to.md",
    "docs/reference",
    "src",
    "tests/fixtures/line-tables.mjs",
    ".config/checks/prettier",
    ".config/mise/mise.lock",
    "tools/release/archive/members.json",
    "package.json",
  ])
    await fs.cp(path.join(root, part), path.join(dir, part), { recursive: true });
  for (const linked of ["node_modules", "renderers"])
    await fs.symlink(path.join(root, linked), path.join(dir, linked));
  return dir;
}

/** The writer run in a mode on a tree, with its exit status and what it said on stderr. */
export const writer = (/** @type {string} */ mode, /** @type {string} */ dir) =>
  run(process.execPath, [WRITER, mode, "--root", dir], { encoding: "utf8" }).then(
    () => ({ code: 0, stderr: "" }),
    (error) => ({ code: error.code, stderr: String(error.stderr) }),
  );
