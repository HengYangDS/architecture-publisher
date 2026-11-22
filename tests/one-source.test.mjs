import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { HOUSE, HOUSE_FILE } from "../src/house.mjs";
import { browseOf } from "../src/model/normalize.mjs";
import * as NAMES from "../src/names.mjs";
import { code, escaped, modules, root } from "./fixtures/source.mjs";

/**
 * The queue item `one-source`: a fact the product's source forms stands in one place of it, and what repeats the
 * fact reads it there. Each search below reads the shipped JavaScript, and where a name is shared with the house
 * class the Typst as well, without comments, and names every file that repeats a fact it should read. The searches
 * of the house tokens' measures and colours, the body's box and the tokens' readers stand in
 * `tests/one-source-tokens.test.mjs`.
 */

/** An address of the house tokens' file, relative to the module that holds it. */
const ADDRESS = /["'`][^"'`]*\bhouse\.json["'`]\s*,\s*import\.meta\.url/u;

/** The modules that address the house tokens' file themselves. */
const readersOfHouse = (found) =>
  found.filter(({ code: text }) => ADDRESS.test(text)).map(({ file }) => file);

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

/** A file's name as a word of a text: between quotes, spaces or a path's slash, and not inside a longer name. */
const asWord = (name) => new RegExp(`(?<=[\\s"'\`/])${escaped(name)}(?![\\w-]|\\.\\w)`, "u");

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
        ? asWord(value)
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

/** The table of the names the JavaScript shares with the house class, which both read. */
const { SHARED } = NAMES;

/**
 * A staged directory's name where a staged path is formed: at the head of a path in quotes, from the staged root
 * or not, joined to a path by `path.join`, or given whole to a name; not a JSON pointer into a field of that name
 * (`/plates/${…}`), a field read by its name, a comparison or a word.
 */
const asDirectory = (name) => {
  const it = escaped(name);
  return new RegExp(
    [
      `(?<=["'\`])${it}/`,
      `(?<=["'\`]/)${it}/(?!\\$\\{)`,
      `path\\.join\\([^()]*["'\`]${it}["'\`]`,
      `(?<![=!<>])=\\s*["'\`]${it}["'\`]`,
    ].join("|"),
    "u",
  );
};

/**
 * Each name of the table, with the search that finds it written again in the JavaScript or the Typst: a staged or
 * delivered file's name as a word, a staged directory's where a path is formed, a label whole between quotes or
 * angle brackets, and a quoted text that begins as a plate's key does.
 */
const SHARED_NAMES = Object.freeze([
  ...[...new Set([...Object.values(SHARED.files), ...Object.values(SHARED.delivered)])].map(
    (name) => ({ what: name, pattern: asWord(name) }),
  ),
  ...[SHARED.directory, SHARED.plates].map((name) => ({ what: name, pattern: asDirectory(name) })),
  ...Object.values(SHARED.labels).map((name) => ({
    what: name,
    pattern: new RegExp(`[<"'\`]${escaped(name)}[>"'\`]`, "u"),
  })),
  { what: "a plate's key", pattern: new RegExp(`["'\`]${escaped(SHARED.key)}`, "u") },
]);

/** A source file's address, relative to the module that holds it: the file in `src/`, not a staged one. */
const SOURCE = /new URL\(\s*(["'`])[^"'`]*\1\s*,\s*import\.meta\.url\s*\)/gu;

/**
 * Each name of the table that a file of the JavaScript or the Typst writes again, as `<file> repeats <name>`. A
 * source file's address names the file in `src/`, which the staging may copy under a name of the table.
 */
const sharedRepetitions = (found) =>
  found.flatMap(({ file, code: text }) =>
    SHARED_NAMES.filter(({ pattern }) => pattern.test(text.replace(SOURCE, ""))).map(
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
  assert.deepEqual(found('names.set("plate-00", page);'), ["src/scratch.mjs repeats plate-00"]);
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

test("the labels, a plate's key and the files staged for Typst are named in the table the JavaScript and the class share", async () => {
  assert.deepEqual(sharedRepetitions(await modules([".mjs", ".typ"])), []);
});

test("the table's own name is the one name both languages state: where the JavaScript addresses it and where the class reads it", async () => {
  const table = asWord(path.basename(fileURLToPath(NAMES.SHARED_FILE)));
  const naming = (await modules([".mjs", ".typ"])).filter(({ code: text }) => table.test(text));
  assert.deepEqual(
    naming.map(({ file }) => file),
    [NAMES_MODULE, "src/overview/house.typ"],
  );
});

test("a shared name written again is found in either language, and a field, a pointer, a word or another label is not", () => {
  const found = (text, file = "src/scratch.mjs") => sharedRepetitions([{ file, code: code(text) }]);
  const typst = "src/scratch.typ";
  const { files, labels } = SHARED;
  assert.deepEqual(found('await fs.writeFile(path.join(own, "edition.json"), record);'), [
    `src/scratch.mjs repeats ${files.edition}`,
  ]);
  assert.deepEqual(found('#let _model = json("/archpub/model.json")', typst), [
    `${typst} repeats ${files.model}`,
    `${typst} repeats ${SHARED.directory}`,
  ]);
  assert.deepEqual(found('fs.mkdir(path.join(own, "plates"));\nconst file = `plates/${n}.svg`;'), [
    `src/scratch.mjs repeats ${SHARED.plates}`,
  ]);
  assert.deepEqual(found('"(query(<archpub-end>).first().location().page())"'), [
    `src/scratch.mjs repeats ${labels.end}`,
  ]);
  assert.deepEqual(found('[#metadata((kind: "ring")) <archpub-mark>]', typst), [
    `${typst} repeats ${labels.mark}`,
  ]);
  assert.deepEqual(found('link(label("plate-" + number), number)', typst), [
    `${typst} repeats a plate's key`,
  ]);
  assert.deepEqual(
    found('g.at("plates", default: (:))\n[#heading(it) <archpub-contents>]', typst),
    [],
  );
  assert.deepEqual(
    found('const at = `/plates/${n}`;\nconst word = n === 1 ? "plate" : "plates";'),
    [],
  );
  assert.deepEqual(found('export const STAGED = "archpub";'), [
    `src/scratch.mjs repeats ${SHARED.directory}`,
  ]);
  assert.deepEqual(
    found('new Command("archpub");\nfs.mkdtemp(path.join(os.tmpdir(), "archpub-out-"));'),
    [],
  );
  assert.deepEqual(
    found('if (kind === "plates") return new URL("../house.json", import.meta.url);'),
    [],
  );
  assert.deepEqual(
    found("// staged as house.json\n#let _house = json(_shared.files.tokens)", typst),
    [],
  );
  assert.deepEqual(found('pdf.attach("model.json", read(_shared.files.model))', typst), [
    `${typst} repeats ${SHARED.delivered.model}`,
  ]);
  assert.deepEqual(found('export const MODEL = "model.json";'), [
    `src/scratch.mjs repeats ${files.model}`,
  ]);
});

test("the table names what the class has always been staged under and labelled with, read-only", () => {
  assert.deepEqual(SHARED, {
    directory: "archpub",
    files: {
      tokens: "house.json",
      model: "model.json",
      breaks: "breaks.json",
      overview: "overview-inputs.json",
      edition: "edition.json",
      colophon: "colophon.json",
    },
    delivered: { model: "model.json" },
    plates: "plates",
    labels: {
      box: "archpub-box",
      loose: "archpub-loose",
      line: "archpub-line",
      mark: "archpub-mark",
      end: "archpub-end",
    },
    key: "plate-",
  });
  assert.ok(
    Object.isFrozen(SHARED) && Object.isFrozen(SHARED.files) && Object.isFrozen(SHARED.labels),
  );
  assert.equal(NAMES.MODEL, SHARED.delivered.model);
  assert.equal(NAMES.stagedPlate(3), "plates/03.svg");
});

/** The files a repository block may stand in: the bundled examples, the fixtures and the tests, this one aside. */
async function bundled() {
  const found = [];
  for (const top of ["examples", "tests"])
    for (const entry of await fs.readdir(path.join(root, top), {
      withFileTypes: true,
      recursive: true,
    })) {
      const file = path.join(entry.parentPath, entry.name);
      if (!entry.isFile() || ![".json", ".mjs"].includes(path.extname(entry.name))) continue;
      if (file === fileURLToPath(import.meta.url)) continue;
      found.push({
        file: path.relative(root, file).split(path.sep).join("/"),
        code: await fs.readFile(file, "utf8"),
      });
    }
  return found.sort((one, other) => (one.file < other.file ? -1 : 1));
}

/** A field's text in a JSON object or a JavaScript object literal, quoted or not. */
const fieldOf = (block, name) =>
  block.match(new RegExp(`(?:^|[\\s,{])["']?${name}["']?\\s*:\\s*(["'\`])(.*?)\\1`, "u"))?.[2];

/**
 * Each object that declares the browse template its address implies, as `<file> declares the template <url>
 * implies`. A template's placeholders are braces too; they are set aside so that an object is read whole.
 */
const restatedTemplates = (found) =>
  found.flatMap(({ file, code: text }) =>
    (text.replace(/\{(revision|path)\}/gu, "\uE000$1\uE000").match(/\{[^{}]*\}/gu) ?? []).flatMap(
      (block) => {
        const url = fieldOf(block, "url");
        const browse = fieldOf(block, "browse")?.replace(/\uE000(revision|path)\uE000/gu, "{$1}");
        return url && browse && browse === browseOf(url)
          ? [`${file} declares the template ${url} implies`]
          : [];
      },
    ),
  );

test("no bundled example, fixture or test declares the browse template its repository's address implies", async () => {
  assert.deepEqual(restatedTemplates(await bundled()), []);
});

test("a template its address implies is found in JSON and in JavaScript, and another template is not", () => {
  const found = (code, file = "tests/scratch.mjs") => restatedTemplates([{ file, code }]);
  const github = "https://github.com/o/r/blob/{revision}/{path}";
  assert.deepEqual(found(`{ name: "r", url: "https://github.com/o/r.git", browse: "${github}" }`), [
    "tests/scratch.mjs declares the template https://github.com/o/r.git implies",
  ]);
  assert.deepEqual(
    found(
      `{"repository": {"url": "https://github.com/o/r", "browse": "${github}"}}`,
      "examples/x/model.json",
    ),
    ["examples/x/model.json declares the template https://github.com/o/r implies"],
  );
  assert.deepEqual(
    found(
      `{ url: "https://github.com/o/r.git", browse: "https://example.invalid/{revision}/{path}" }`,
    ),
    [],
  );
  assert.deepEqual(found(`{ url: "https://git.example.invalid/o/r", browse: "${github}" }`), []);
  assert.deepEqual(found(`{ name: "o/r", browse: "${github}" }`), []);
});
