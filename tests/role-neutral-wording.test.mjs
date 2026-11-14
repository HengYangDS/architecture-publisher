import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { holderWordingLines } from "./fixtures/role-wording.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("wording that presumes a role's holder is found on its line, and a role's name is not", () => {
  const person = ["a", "person"].join(" ");
  assert.deepEqual(holderWordingLines(`The build ends.\nThen ${person} accepts it.\n`), [2]);
  assert.deepEqual(holderWordingLines(["Only", "the", "user", "accepts."].join(" ")), [1]);
  assert.deepEqual(holderWordingLines(["The", "people", "who edited it."].join(" ")), [1]);
  for (const fine of [
    "The reviewer accepts.",
    "kind `person`",
    "The user gives the name.",
    "its authors",
  ])
    assert.deepEqual(holderWordingLines(fine), [], fine);
});

test("no document, Skill or shipped source presumes that a role's holder is a person", async () => {
  const found = [];
  const read = async (/** @type {string} */ relative) => {
    const text = await fs.readFile(path.join(root, relative), "utf8").catch(() => null);
    for (const line of text === null ? [] : holderWordingLines(text))
      found.push(`${relative}:${line}`);
  };
  await read("README.md");
  for (const directory of ["docs", "skills", "src"]) {
    const entries = await fs
      .readdir(path.join(root, directory), { withFileTypes: true, recursive: true })
      .catch(() => []);
    for (const entry of entries)
      if (entry.isFile() && /\.(?:md|mjs|json|typ)$/u.test(entry.name))
        await read(path.relative(root, path.join(entry.parentPath, entry.name)));
  }
  assert.deepEqual(found, []);
});
