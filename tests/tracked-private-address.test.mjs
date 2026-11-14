import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { privateAddressLines } from "./fixtures/private-address.mjs";

const root = path.resolve(import.meta.dirname, "..");

/** The files Git tracks here, or nothing when this directory is not a checkout's root. */
function trackedFiles() {
  const git = (/** @type {string[]} */ ...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  try {
    if (path.resolve(git("rev-parse", "--show-toplevel").trim()) !== root) return undefined;
    return git("ls-files", "-z").split("\0").filter(Boolean);
  } catch {
    return undefined;
  }
}

test("a private address is found on its line, and a public address or a version is not", () => {
  const host = [192, 168, 7, 20].join(".");
  assert.deepEqual(privateAddressLines(`first\nsee http://${host}:8080/x.\nlast`), [2]);
  assert.deepEqual(privateAddressLines([10, 1, 2, 3].join(".")), [1]);
  assert.deepEqual(privateAddressLines([172, 31, 0, 9].join(".")), [1]);
  for (const other of [
    [172, 32, 0, 9],
    [8, 8, 8, 8],
    [110, 1, 2, 3],
    [1, 10, 1, 2, 3],
    [10, 2, 3],
  ])
    assert.deepEqual(privateAddressLines(`at ${other.join(".")} today`), [], other.join("."));
});

test("no tracked text file names a private network address", async (t) => {
  const files = trackedFiles();
  if (!files) return t.skip("not a Git checkout");
  const found = [];
  for (const file of files) {
    const bytes = await fs.readFile(path.join(root, file)).catch(() => undefined);
    if (!bytes || bytes.subarray(0, 8000).includes(0)) continue;
    for (const line of privateAddressLines(bytes.toString("utf8"))) found.push(`${file}:${line}`);
  }
  assert.deepEqual(found, []);
});
