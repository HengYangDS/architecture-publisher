import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnNativeSync } from "./npm-pack-report.mjs";

export const root = fileURLToPath(new URL("../../", import.meta.url));

export const publisher = path.join(root, "packages/publisher");

export const handoffPath = path.join(
  root,
  "tests/conformance/fixtures/aigw-source-owned-handoff.json",
);

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function json(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

export function run(command, args, options = {}) {
  const result = spawnNativeSync(command, args, {
    encoding: "utf8",
    timeout: 120_000,
    ...options,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}

export async function copyHandoffFiles(source, destination, files) {
  for (const relative of Object.keys(files)) {
    const input = path.join(source, ...relative.split("/"));
    const output = path.join(destination, ...relative.split("/"));
    const stat = await fs.lstat(input);
    assert(stat.isFile() && !stat.isSymbolicLink(), relative);
    const bytes = await fs.readFile(input);
    assert.equal(sha(bytes), files[relative], relative);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, bytes, { flag: "wx" });
  }
}

export const aigwEditionRoot = process.env.AIGW_EDITION_ROOT;

export const aigwSourceRoot = process.env.AIGW_SOURCE_ROOT;

export const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

export const externalSelection =
  path.isAbsolute(aigwEditionRoot ?? "") && path.isAbsolute(aigwSourceRoot ?? "");
