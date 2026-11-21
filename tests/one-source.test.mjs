import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { HOUSE, HOUSE_FILE } from "../src/house.mjs";
import * as NAMES from "../src/names.mjs";

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

/** The module that names a delivery's files and forms the names of its pages, plates and revisions. */
const NAMES_MODULE = "src/names.mjs";

/** The extensions of the files a delivery names by its model's id. */
const OWN = Object.values(NAMES.filesOf("id")).map((file) => escaped(path.extname(file)));

/**
 * What the unit of names states or forms, each with the search that finds it written again elsewhere. A name it
 * states is found in quotes: a file's name as a word of a text, between quotes, spaces or a path's slash, and any
 * other name whole or at the head of a path, so that a placeholder such as `<model.json>` or the word "images" in
 * prose is not. A name it forms is found by the form the census found.
 */
const NAMED = Object.freeze([
  ...[...new Set(Object.values(NAMES).filter((value) => typeof value === "string"))].map(
    (value) => ({
      what: value,
      pattern: value.includes(".")
        ? new RegExp(`(?<=[\\s"'\`/])${escaped(value)}(?![\\w-]|\\.\\w)`, "u")
        : new RegExp(`(?<=["'\`])${escaped(value)}(?=["'\`/])`, "u"),
    }),
  ),
  {
    what: "a file named by the model's id",
    pattern: new RegExp(`\\$\\{(?:[\\w.]+\\.)?id\\}(?:${OWN.join("|")})(?!\\w)`, "u"),
  },
  {
    what: "a number in two digits",
    pattern: /(?<!toString\(16\))\.padStart\(\s*2\s*,\s*(["'`])0\1\s*\)/u,
  },
  { what: "a plate's key", pattern: /["'`]plate-/u },
  { what: "a revision cut to seven", pattern: /\.(?:slice|substring)\(\s*0\s*,\s*7\s*\)/u },
]);

/** Each name a module other than the unit of names writes again, as `<module> repeats <name>`. */
const repetitions = (found) =>
  found
    .filter(({ file }) => file !== NAMES_MODULE)
    .flatMap(({ file, code: text }) =>
      NAMED.filter(({ pattern }) => pattern.test(text)).map(
        ({ what }) => `${file} repeats ${what}`,
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

test("a delivery's files, its pages' and plates' names, a short revision and the Typst version are named in one module", async () => {
  assert.deepEqual(repetitions(await modules()), []);
});

test("a name written again is found however it is written, and a placeholder, a word of prose or a comment is not", () => {
  const found = (text) => repetitions([{ file: "src/scratch.mjs", code: code(text) }]);
  const { MANIFEST, ACCEPTANCE, SIGNATURE, MODEL, IMAGES, FIGURES, TYPST_VERSION } = NAMES;
  assert.deepEqual(found('fs.writeFile(path.join(staging, "manifest.json"), bytes);'), [
    `src/scratch.mjs repeats ${MANIFEST}`,
  ]);
  assert.deepEqual(found('"sign acceptance.json into acceptance.sig with this SSH key"'), [
    `src/scratch.mjs repeats ${ACCEPTANCE}`,
    `src/scratch.mjs repeats ${SIGNATURE}`,
  ]);
  assert.deepEqual(found("'#let stated = json(\"model.json\")'"), [
    `src/scratch.mjs repeats ${MODEL}`,
  ]);
  assert.deepEqual(found('command.argument("<model.json>", "the model to check");'), []);
  assert.deepEqual(found("// writes manifest.json beside the files\nconst kept = MANIFEST;"), []);
  assert.deepEqual(
    found('fs.mkdir(path.join(staging, "images"));\nconst f = `figures/${name}.png`;'),
    [`src/scratch.mjs repeats ${FIGURES}`, `src/scratch.mjs repeats ${IMAGES}`],
  );
  assert.deepEqual(found('"the edition\'s images at these widths, and its figures"'), []);
  assert.deepEqual(found("const edition = `${model.id}.pdf`;"), [
    "src/scratch.mjs repeats a file named by the model's id",
  ]);
  assert.deepEqual(found("const file = `${diagramId}.architecture.json`;"), []);
  assert.deepEqual(found('String(plate.page).padStart(2, "0");'), [
    "src/scratch.mjs repeats a number in two digits",
  ]);
  assert.deepEqual(
    found('level.toString(16).padStart(2, "0") + String(page).padStart(8, "0");'),
    [],
  );
  assert.deepEqual(found('const key = `plate-${number}`;\nnames.set("plate-00", page);'), [
    "src/scratch.mjs repeats plate-00",
    "src/scratch.mjs repeats a plate's key",
  ]);
  assert.deepEqual(found("`at ${commit.slice(0, 7)}` + manifest.slice(0, 12);"), [
    "src/scratch.mjs repeats a revision cut to seven",
  ]);
  assert.deepEqual(found(`const record = { typst: "${TYPST_VERSION}" };`), [
    `src/scratch.mjs repeats ${TYPST_VERSION}`,
  ]);
});

test("the names a delivery's files take are the ones it has always delivered", () => {
  assert.deepEqual(NAMES.filesOf("work"), {
    edition: "work.pdf",
    page: "work.html",
    data: "work.json",
    reader: "work.md",
  });
  const plate = { page: 3, views: ["context", "flow"] };
  assert.equal(NAMES.pageName(plate), "03-context+flow");
  assert.equal(NAMES.pageName({ page: 104, views: ["one"] }), "104-one");
  assert.equal(NAMES.imageFile(NAMES.DEFAULT_WIDTH, NAMES.OVERVIEW_PAGE), "images/00-overview.png");
  assert.equal(NAMES.imageFile(960, NAMES.pageName(plate)), "images/03-context+flow-960.png");
  assert.deepEqual(NAMES.figureFiles("03-context+flow"), [
    { format: "png", file: "figures/03-context+flow.png" },
    { format: "svg", file: "figures/03-context+flow.svg" },
  ]);
  assert.deepEqual([NAMES.plateKey(7), NAMES.OVERVIEW_KEY], ["plate-07", "plate-00"]);
  assert.deepEqual([NAMES.plateNumber(NAMES.plateKey(7)), NAMES.plateNumber("plate-12")], [7, 12]);
  assert.equal(NAMES.shortRevision("37848a34c0ffee"), "37848a3");
});
