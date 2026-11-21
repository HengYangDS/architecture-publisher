import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { HOUSE, HOUSE_FILE } from "../src/house.mjs";

/**
 * The queue item `one-source`: a fact the product's source forms stands in one place of it, and what repeats the
 * fact reads it there. Each search below reads the shipped JavaScript without its comments and names every module
 * that repeats a fact it should read.
 */

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "src");

/** A module's source without its comments, where a fact may be named freely. */
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");

/** The shipped JavaScript: each module by its path from the repository's root, and its code. */
async function modules() {
  const found = [];
  for (const entry of await fs.readdir(source, { withFileTypes: true, recursive: true }))
    if (entry.isFile() && entry.name.endsWith(".mjs")) {
      const file = path.join(entry.parentPath, entry.name);
      const text = await fs.readFile(file, "utf8");
      found.push({ file: path.relative(root, file).split(path.sep).join("/"), code: code(text) });
    }
  return found.sort((one, other) => (one.file < other.file ? -1 : 1));
}

/** An address of the house tokens' file, relative to the module that holds it. */
const ADDRESS = /["'`][^"'`]*\bhouse\.json["'`]\s*,\s*import\.meta\.url/u;

/** The modules that address the house tokens' file themselves. */
const readersOfHouse = (found) =>
  found.filter(({ code: text }) => ADDRESS.test(text)).map(({ file }) => file);

const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/** What the house states that no module may restate: each face's name, and the page's measures. */
const STATED = Object.freeze([
  ...Object.values(HOUSE.faces).map((name) => ({
    value: name,
    pattern: new RegExp(`(["'\`])${escaped(name)}\\1`, "u"),
  })),
  ...[HOUSE.page.width, HOUSE.page.height, HOUSE.page.width - HOUSE.page.margin].map((value) => ({
    value,
    pattern: new RegExp(`(?<![\\w.])${value}(?![\\w.])`, "u"),
  })),
]);

/** Each value of the house a module restates, as `<module> restates <value>`. */
const restatements = (found) =>
  found.flatMap(({ file, code: text }) =>
    STATED.filter(({ pattern }) => pattern.test(text)).map(
      ({ value }) => `${file} restates ${value}`,
    ),
  );

test("the JavaScript addresses the house tokens' file in one module", async () => {
  assert.deepEqual(readersOfHouse(await modules()), ["src/house.mjs"]);
});

test("no module restates a face's name or a page's measure that the house states", async () => {
  assert.deepEqual(restatements(await modules()), []);
});

test("a repetition is found however it is written, and a word in a comment or a staged name is not", () => {
  const one = (text) => [{ file: "src/scratch.mjs", code: code(text) }];
  const parse = 'JSON.parse(fs.readFileSync(new URL("../house.json", import.meta.url), "utf8"));';
  assert.deepEqual(readersOfHouse(one(parse)), ["src/scratch.mjs"]);
  assert.deepEqual(readersOfHouse(one('path.join(root, STAGED, "house.json");')), []);
  assert.deepEqual(readersOfHouse(one(`// ${parse}`)), []);
  const { sans, han } = HOUSE.faces;
  assert.deepEqual(restatements(one(`face(house, '${sans}', 400);`)), [
    `src/scratch.mjs restates ${sans}`,
  ]);
  assert.deepEqual(restatements(one(`/** Set in ${sans} and ${han}. */\nface(house, sans);`)), []);
  const { width, margin } = HOUSE.page;
  assert.deepEqual(restatements(one(`const LIVE = { right: ${width - margin} };`)), [
    `src/scratch.mjs restates ${width - margin}`,
  ]);
  assert.deepEqual(restatements(one(`const wider = ${width}0 + ${width}.5 + x${width};`)), []);
});

test("the house tokens are one read-only object, read from the file the house states", async () => {
  assert.deepEqual(HOUSE, JSON.parse(await fs.readFile(HOUSE_FILE, "utf8")));
  assert.ok(Object.isFrozen(HOUSE) && Object.isFrozen(HOUSE.faces));
  assert.ok(Object.isFrozen(HOUSE.lines.rows.boundary.dash));
  assert.throws(() => {
    HOUSE.page.width += 1;
  }, TypeError);
});
