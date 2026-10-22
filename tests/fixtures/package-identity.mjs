import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function npmPackageIdentity(archiveBytes) {
  return Object.freeze({
    archiveSha256: sha256(archiveBytes),
    contentTarSha256: sha256(gunzipSync(archiveBytes)),
  });
}

export function archivePackageSource({ repository, tree }) {
  return execFileSync("git", ["-c", "core.autocrlf=false", "archive", "--format=tar", tree], {
    cwd: repository,
    maxBuffer: 32 * 1024 * 1024,
    timeout: 10_000,
  });
}

export async function assertPackageSourceReplay({ repository, tree, root, files }) {
  const invoke = (args) =>
    execFileSync("git", args, { cwd: repository, maxBuffer: 32 * 1024 * 1024, timeout: 10_000 });
  const expected = invoke(["ls-tree", "-r", "--name-only", "-z", tree])
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort();
  assert.ok((await fs.lstat(root)).isDirectory(), "Repacked unsupported source entry: root");
  const actual = [];
  const inventory = async (directory = "") => {
    for (const name of await fs.readdir(path.join(root, directory))) {
      const relative = path.posix.join(directory, name);
      const entry = await fs.lstat(path.join(root, relative));
      if (entry.isDirectory()) await inventory(relative);
      else {
        assert.ok(entry.isFile(), `Repacked unsupported source entry: ${relative}`);
        actual.push(relative);
      }
    }
  };
  await inventory();
  assert.deepEqual(actual.sort(), expected, "Repacked extracted source file set differs");
  assert.deepEqual([...files].sort(), expected, "Repacked reported source file set differs");
  for (const file of expected)
    assert.deepEqual(
      await fs.readFile(path.join(root, file)),
      invoke(["show", `${tree}:${file}`]),
      `Repacked source bytes differ: ${file}`,
    );
}
