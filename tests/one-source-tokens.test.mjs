import assert from "node:assert/strict";
import test from "node:test";
import { HOUSE, HOUSE_BODY } from "../src/house.mjs";
import { SHARED } from "../src/names.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { code, escaped, modules, root } from "./fixtures/source.mjs";

/**
 * The queue item `one-source`, for the house tokens of `src/house.json`: a value the house class and the engine set
 * their pages by is read from the tokens, or derived from them, and not written again; and every token has a reader:
 * the shipped source, or the reference writer for the document text kept beside the values it describes. The searches of the names and labels the class shares stand in `tests/one-source.test.mjs`.
 */

/** The tokens, and what follows from them: the body's box as `body`. */
const DERIVED = Object.freeze({ ...HOUSE, body: HOUSE_BODY });

/**
 * The values the class and the engine set their pages by, which they read from the house tokens or derive from
 * them: each value's path, and the forms in which a file would write it again. In the Typst: `length`, any length
 * of its number, for a number that no other measure of the class takes; `named`, a pitch, a leading or a spacing
 * given its number; `baseline`, the baseline a text is set on; `space`, a space across; `weight`, a weight given or
 * recorded; `preset`, the name of one of Typst's dashes in quotes. In the JavaScript: `script`, the bare number, for
 * a number the JavaScript takes for nothing else. In both: `colour`, the colour's hexadecimal in either case.
 */
const MEASURES = Object.freeze({
  "edition.rule": ["length", "script"],
  "edition.foot": ["length", "script"],
  "text.pitch": ["named"],
  "text.leading": ["length", "script"],
  "baselines.label": ["length", "baseline"],
  "baselines.title": ["length", "baseline"],
  "baselines.lead": ["baseline"],
  "summary.size": ["length", "script"],
  "summary.pitch": ["named"],
  "mark.gap": ["space"],
  "mark.middle": ["length", "script"],
  "weights.rule": ["length", "weight"],
  "weights.hair": ["length", "weight"],
  "weights.ring": ["length", "weight", "script"],
  "body.width": ["length", "script"],
  "body.height": ["length", "script"],
  "seal.cinnabar": ["colour"],
  "lines.rows.planned.keyDash": ["preset"],
  "lines.rows.retired.keyDash": ["preset"],
});

/** A value of the tokens or derived from them, by its path. */
const token = (key) => key.split(".").reduce((group, name) => group[name], DERIVED);

/** The search of each form, for a value written as the source writes it. */
const FORMS = Object.freeze({
  length: (number) => `(?<![\\w.])${number}(?:pt|em)\\b`,
  named: (number) => `\\b(?:pitch|leading|spacing)\\s*:\\s*${number}pt\\b`,
  baseline: (number) => `\\btx[rc]?\\(\\s*[^,()]*,\\s*${number}pt\\b`,
  space: (number) => `\\bh\\(\\s*${number}pt\\b`,
  weight: (number) => `\\bw\\s*:\\s*${number}(?:pt)?(?![\\w.])`,
  preset: (name) => `(["'])${name}\\1`,
  script: (number) => `(?<![\\w.])${number}(?![\\w.])`,
  colour: (hex) =>
    `${hex.replace(/[a-f]/gu, (letter) => `[${letter}${letter.toUpperCase()}]`)}(?![\\da-fA-F])`,
});

/** Whether a file of the language its name gives is searched in a form. */
const searched = (form, file) => form === "colour" || (form === "script") === file.endsWith(".mjs");

/**
 * Each value the tokens hold or give that a file writes again, as `<file> repeats <path>`: a Typst file in the
 * value's forms, a module of the JavaScript as a bare number where `script` marks it, and either as a colour.
 */
const measureRepetitions = (found) =>
  found.flatMap(({ file, code: text }) =>
    Object.entries(MEASURES)
      .filter(([key, forms]) =>
        forms
          .filter((form) => searched(form, file))
          .some((form) => new RegExp(FORMS[form](escaped(String(token(key)))), "u").test(text)),
      )
      .map(([key]) => `${file} repeats ${key}`),
  );

/** A reading of the house tokens in the Typst: by the table's name for their staged file, or by that name. */
const READS_TOKENS = new RegExp(
  `json\\(\\s*(?:_shared\\.files\\.tokens|(["'])[^"']*${escaped(SHARED.files.tokens)}\\1)\\s*\\)`,
  "gu",
);

/**
 * How the source reaches each table of the tokens: `by`, the expressions a key of the table follows, as `HOUSE.page`
 * in `HOUSE.page.width` or `_e`, the class's name for the edition's table; `quoted`, where the source names a key in
 * quotes (`_house.at("text")`, `row("relation")`); `entries`, a table whose entries the source takes apart as it
 * iterates them. `*` stands for each entry of a table of data, whose keys are ids, and `whole` marks a table the
 * source reads by iterating it, whose keys are its data. `documents` names the keys of an entry that only the
 * reference writer reads (tools/docs/references.mjs): text a reference document prints beside the entry's values.
 */
const REACHED = Object.freeze({
  "": { by: ["HOUSE", "house", "_house"], quoted: true },
  page: { by: ["(?:HOUSE|house|_house)\\.page"] },
  sizes: { by: ["sizes"] },
  text: { by: ["_text"] },
  baselines: { by: ["_baseline"] },
  summary: { by: ["HOUSE\\.summary", "_view-summary"] },
  mark: { by: ["(?:HOUSE|_house)\\.mark"] },
  weights: { by: ["HOUSE\\.weights", "_line"] },
  faces: { by: ["faces"] },
  palette: { by: ["palette"] },
  figure: { by: ["figure"] },
  dye: { by: ["dye"] },
  seal: { by: ["(?:HOUSE|_house)\\.seal"] },
  palettes: { whole: true },
  "palettes.*": { by: ["given"], documents: { by: ["each"], keys: ["colours"] } },
  "palettes.*.name": { whole: true },
  lines: { by: ["(?:HOUSE|_house|table)\\.lines", "table"] },
  "lines.rows": { by: ["(?:HOUSE|_house)\\.lines\\.rows", "table\\.rows"], quoted: true },
  "lines.rows.*": {
    by: ["row(?:\\([^()]*\\))?", "rows\\.values\\(\\)\\.find\\([^()]*\\)"],
    entries: ["table\\.rows"],
    documents: { by: ["row"], keys: ["answers", "page"] },
  },
  plate: { by: ["(?:HOUSE|house|_house)\\.plate"] },
  edition: { by: ["(?:HOUSE|house|_house)\\.edition", "_e"] },
});

/**
 * The keys of the tokens that only the reference writer reads, document text beside the values it describes (a
 * palette's `colours`, a line row's `answers` and `page`): each is read where the writer finds it by its handle, as
 * the shipped source's keys are where the source finds them. The writer is a tool, outside the package.
 */
const WRITER = {
  file: "tools/docs/references.mjs",
  code: code(await fs.readFile(path.join(root, "tools/docs/references.mjs"), "utf8")),
};

/** The searches that find a key of a table read: by a handle, taken apart from it, or named in quotes. */
function readings(table, key, reached = REACHED[table]) {
  const { by = [], quoted = false, entries = [] } = reached;
  const handle = `(?<![\\w$-])(?:${by.join("|")})`;
  const name = escaped(key);
  return [
    ...(by.length
      ? [
          `${handle}\\??\\.${name}(?![\\w$-])`,
          `${handle}\\.at\\(\\s*"${name}"`,
          `\\{[^{}]*(?<![\\w$])${name}(?![\\w$])[^{}]*\\}\\s*=\\s*${handle}(?![\\w$.-])`,
        ]
      : []),
    ...entries.map(
      (map) =>
        `Object\\.entries\\(\\s*(?:${map})\\s*\\)[^;{]*\\{[^{}]*(?<![\\w$])${name}(?![\\w$])`,
    ),
    ...(quoted ? [`(["'])${name}\\1`] : []),
  ].map((search) => new RegExp(search, "u"));
}

/**
 * Each key of the tokens that no file of the source reads, by its path: a key of a table the source reaches is read
 * where a file finds it by one of its table's searches; the keys of a table read whole are its data.
 */
function unread(tokens, found, path = [], table = "", writer = [WRITER]) {
  const reached = REACHED[table];
  if (!reached) return [`${path.join(".")} has no way the source reaches it`];
  return Object.entries(tokens).flatMap(([key, value]) => {
    const inner = [...path, key];
    const documents = reached.documents?.keys.includes(key) ? reached.documents : null;
    const read =
      reached.whole ||
      (documents
        ? writer.some(({ code: text }) =>
            readings(table, key, documents).some((search) => search.test(text)),
          )
        : found.some(({ code: text }) => readings(table, key).some((search) => search.test(text))));
    const [entry, own] = [`${table}.*`, [table, key].filter(Boolean).join(".")];
    const deeper =
      value && typeof value === "object" && !Array.isArray(value)
        ? unread(value, found, inner, REACHED[entry] ? entry : own, writer)
        : [];
    return [...(read ? [] : [inner.join(".")]), ...deeper];
  });
}

test("the class reads the house tokens once, and the drawing and the colophon page take them from it", async () => {
  const reads = (await modules([".typ"])).flatMap(({ file, code: text }) =>
    [...text.matchAll(READS_TOKENS)].map(() => file),
  );
  assert.deepEqual(reads, ["src/overview/house.typ"]);
});

test("a value the class or the engine reads from the house tokens, or derives from them, is not written again", async () => {
  assert.deepEqual(measureRepetitions(await modules([".mjs", ".typ"])), []);
});

test("every key of the house tokens has a reader: the shipped source, or the reference writer for document text", async () => {
  assert.deepEqual(unread(HOUSE, await modules([".mjs", ".typ"])), []);
});

test("a measure written again is found in its forms, and another measure of its number or a comment is not", () => {
  const found = (text, file = "src/scratch.typ") =>
    measureRepetitions([{ file, code: code(text) }]);
  const { edition, text, baselines, summary, mark, weights } = HOUSE;
  const repeats = (file, ...keys) => keys.map((key) => `${file} repeats ${key}`);
  const typst = (...keys) => repeats("src/scratch.typ", ...keys);
  assert.deepEqual(found(`hrule(${edition.rule}pt)`), typst("edition.rule"));
  assert.deepEqual(
    found(`set par(leading: ${text.leading}pt, spacing: ${text.leading}pt)`),
    typst("text.leading"),
  );
  assert.deepEqual(found(`#let tx(x, b, body, pitch: ${text.pitch}pt) = {}`), typst("text.pitch"));
  assert.deepEqual(found(`p.cell - ${text.pitch}pt\nrect(width: ${text.pitch}pt)`), []);
  assert.deepEqual(
    found(`tx(margin, ${baselines.lead}pt, lead)\nv(${baselines.lead}pt)`),
    typst("baselines.lead"),
  );
  assert.deepEqual(
    found(`[#_mark(entry)#h(${mark.gap}pt)#entry.label]\nring(x, y, r: ${mark.gap}pt)`),
    typst("mark.gap"),
  );
  assert.deepEqual(
    found(`place(left + horizon, dy: -${mark.middle}em, sample)`),
    typst("mark.middle"),
  );
  assert.deepEqual(
    found(`[#metadata((kind: "line", w: ${weights.rule})) <l>]`),
    typst("weights.rule"),
  );
  assert.deepEqual(
    found(`let size = ${summary.size}pt\nprose(w, s, pitch: ${summary.pitch}pt)`),
    typst("summary.size", "summary.pitch"),
  );
  assert.deepEqual(found(`// at ${edition.foot}pt\ntx(margin, _house.edition.foot * 1pt, x)`), []);
  assert.deepEqual(found(`seg(a, b, w: 1${weights.ring}pt)\nv(${baselines.title}.5pt)`), []);
  assert.deepEqual(
    found(`const MARK = { middle: ${mark.middle} };`, "src/scratch.mjs"),
    repeats("src/scratch.mjs", "mark.middle"),
  );
  assert.deepEqual(
    found(
      `const SHARES = [1, ${weights.rule}];\nconst gap = ${mark.gap} * 1.5;`,
      "src/scratch.mjs",
    ),
    [],
  );
  const both = code(`#let _house = json(_shared.files.tokens)\n#let h = json("house.json")`);
  assert.equal([...both.matchAll(READS_TOKENS)].length, 2);
});

test("the seal's colour, the body's box and the key's dashes written again are found, and other values are not", () => {
  const found = (text, file = "src/scratch.typ") =>
    measureRepetitions([{ file, code: code(text) }]);
  const repeats = (file, ...keys) => keys.map((key) => `${file} repeats ${key}`);
  const { width, height } = HOUSE_BODY;
  const { planned, retired } = HOUSE.lines.rows;
  const upper = HOUSE.seal.cinnabar.toUpperCase();
  assert.deepEqual(
    found(`#let cinnabar = rgb("${upper}")`),
    repeats("src/scratch.typ", "seal.cinnabar"),
  );
  assert.deepEqual(
    found(`const CINNABAR = "${HOUSE.seal.cinnabar}";`, "src/model/scratch.mjs"),
    repeats("src/model/scratch.mjs", "seal.cinnabar"),
  );
  assert.deepEqual(found(`// the seal's ${HOUSE.seal.cinnabar}\nrgb(_house.seal.cinnabar)`), []);
  assert.deepEqual(
    found(`const BODY = { width: ${width} * 1.5, height: ${height} * 1.5 };`, "src/scratch.mjs"),
    repeats("src/scratch.mjs", "body.width", "body.height"),
  );
  assert.deepEqual(
    found(`box(width: ${width}pt, height: 1${height}pt)`),
    repeats("src/scratch.typ", "body.width"),
  );
  assert.deepEqual(
    found(
      `line(length: 16pt, stroke: (dash: if retired { "${retired.keyDash}" } else { '${planned.keyDash}' }))`,
    ),
    repeats("src/scratch.typ", "lines.rows.planned.keyDash", "lines.rows.retired.keyDash"),
  );
  assert.deepEqual(found(`{ variant: "${planned.keyDash}" }`, "src/map/scratch.mjs"), []);
});

test("a key is read by its table's handle, taken apart from it, or named in quotes, and not by its name alone", () => {
  const tokens = {
    plate: { x: 1, pixelsPerPoint: 1.5, alonePad: 16 },
    edition: { bodyTop: 1, bodyBottom: 2, key: 3 },
    lines: {
      widths: [1],
      rows: { boundary: { dash: [1], question: "?", meaning: "m", tested: true } },
    },
    text: { pitch: 1 },
    stray: { one: 1 },
  };
  const found = [
    "const { pixelsPerPoint } = house.plate;\nconst x = plate.x + input.widths;",
    '#let _pad = _house.plate.alonePad\n#let _e = _house.edition\n_e.key\n_house.at("text")\n_text.pitch',
    'const { bodyTop, bodyBottom } = HOUSE.edition;\nconst row = (id) => table.rows[id];\nrow("boundary").dash',
    "Object.entries(table.rows).flatMap(([id, { tested, meaning }]) => [view.question])",
    "HOUSE.lines.rows; const stray = HOUSE.stray;",
  ].map((text) => ({ code: code(text) }));
  // A key only the reference writer reads is found in the writer, by its handle there, and nowhere else.
  tokens.lines.rows.boundary.answers = "?";
  tokens.lines.rows.boundary.page = "p";
  const writer = [{ code: code("row.answers") }];
  assert.deepEqual(unread(tokens, found, [], "", writer), [
    "plate.x",
    "lines.widths",
    "lines.rows.boundary.question",
    "lines.rows.boundary.page",
    "stray has no way the source reaches it",
  ]);
});

test("the values the class sets its pages by are those it has always set them by", () => {
  assert.deepEqual(Object.fromEntries(Object.keys(MEASURES).map((key) => [key, token(key)])), {
    "edition.rule": 866,
    "edition.foot": 886,
    "text.pitch": 16,
    "text.leading": 6.6,
    "baselines.label": 64,
    "baselines.title": 52,
    "baselines.lead": 84,
    "summary.size": 17,
    "summary.pitch": 24,
    "mark.gap": 5,
    "mark.middle": 0.36,
    "weights.rule": 0.8,
    "weights.hair": 0.4,
    "weights.ring": 1.7,
    "body.width": 1504,
    "body.height": 714,
    "seal.cinnabar": "#a93d31",
    "lines.rows.planned.keyDash": "dashed",
    "lines.rows.retired.keyDash": "dotted",
  });
  assert.deepEqual(HOUSE_BODY, {
    x: HOUSE.page.margin,
    y: HOUSE.edition.bodyTop,
    width: 1504,
    height: 714,
  });
  assert.ok(Object.isFrozen(HOUSE_BODY));
});
