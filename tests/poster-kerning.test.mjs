import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { kerningOf } from "../src/poster/kerning.mjs";
import { loadTypefaces } from "../src/poster/text.mjs";
import { verifySupply } from "../src/supply.mjs";

// The engine measures text as Typst sets it, with the kerning each house face gives two glyphs side by side. Typst
// 0.15.1 set every text below at 1000 pt, where a point is a font unit of these faces.
const TYPST = {
  regular: {
    "format: (json)": 5732,
    "package.json, tsconfig.json": 11298,
    "[jobs]": 2447,
    "(shelf)": 2661,
    "Architecture Publisher": 9278,
    "Type (job)": 4249,
    To: 1012,
    "(j": 630,
    LT: 902,
    "f)": 644,
    ".j": 522,
    "T.": 679,
    ry: 839,
  },
  semibold: {
    "format: (json)": 5948,
    "package.json, tsconfig.json": 11690,
    "Architecture Publisher": 9597,
    "Type (job)": 4387,
    To: 1024,
    "(j": 667,
  },
  serif: {
    "format: (json)": 6214,
    "The author runs archpub build, and": 15919,
    To: 1083,
    "(j": 718,
    AV: 1219,
  },
};
const STYLES = {
  regular: { size: 1000, weight: 400, line: 1400 },
  semibold: { size: 1000, weight: 700, line: 1400 },
  serif: { size: 1000, weight: 400, line: 1400, face: /** @type {const} */ ("serif") },
};
const typefaces = await loadTypefaces();

test("text is measured as wide as Typst sets it, pairs it kerns apart and pairs it kerns together alike", () => {
  for (const [face, texts] of Object.entries(TYPST))
    for (const [text, width] of Object.entries(texts)) {
      const measured = typefaces.measure(text, STYLES[face]);
      assert.ok(
        Math.abs(measured - width) < 0.6,
        `${face} "${text}" is set in ${width}, measured ${measured}`,
      );
    }
});

test("a face's pair kerning is read from its own table, in font units, and a file without one has none", async () => {
  const [house, reader] = await Promise.all([verifySupply("house"), verifySupply("opentype")]);
  const opentype = await import(pathToFileURL(path.join(reader.root, "opentype.mjs")).href);
  const bytes = await fs.readFile(path.join(house.root, "source-sans-3/SourceSans3-Regular.otf"));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const face = opentype.parse(buffer);
  const kerning = kerningOf(buffer);
  const pair = (text) =>
    kerning(...Array.from(text, (character) => face.charToGlyphIndex(character)));
  assert.deepEqual(["To", "(j", "LT", "f)", ".j", "nn"].map(pair), [-66, 80, -120, 49, 26, 0]);
  // A font file that holds no tables has no kerning to give.
  assert.equal(kerningOf(new ArrayBuffer(12))(1, 2), 0);
});

// A table built by hand holds the forms the house faces do not use: a default script, a coverage of glyph ranges,
// classes listed from a first glyph, an advance for the second glyph and a class the subtable has no record for.

/** The bytes of 16-bit words, most significant byte first. */
const words = (...values) => values.flatMap((value) => [(value >> 8) & 0xff, value & 0xff]);
/** The bytes of a four-letter tag. */
const tag = (name) => Array.from(name, (letter) => letter.charCodeAt(0));
/** Tables behind a head, their count and their offsets, each offset counted from the head's first byte. */
function listed(tables, head = []) {
  let at = head.length + 2 + 2 * tables.length;
  const offsets = tables.map((table) => {
    const offset = at;
    at += table.length;
    return offset;
  });
  return [...head, ...words(tables.length, ...offsets), ...tables.flat()];
}

// Pairs listed glyph by glyph: after glyphs 10 to 12, covered as one range, a placement and an advance for the first.
const SETS = [words(1, 20, 7, -50), words(0), words(1, 21, 3, 30)];
const LISTED = [
  ...listed(SETS, words(1, listed(SETS, words(1, 0, 5, 0)).length, 5, 0)),
  ...words(2, 1, 10, 12, 0),
];
// Pairs by class: after glyphs 10 and 30, an advance for each glyph of the pair. Glyph 30 is of the first class 1,
// glyphs 20 and 21 of the second class 1, and glyph 22 of a second class 5, which the two columns do not reach.
const CLASSED = [
  ...words(2, 32, 4, 4, 40, 48, 2, 2),
  ...words(0, 0, -10, -1, 5, 0, 40, 2),
  ...words(1, 2, 10, 30),
  ...words(1, 30, 1, 1),
  ...words(2, 2, 20, 21, 1, 22, 22, 5),
];
// The `kern` feature names both lookups and a mark attachment, which holds no pairs; `mark` names that one alone.
const LOOKUPS = listed([
  listed([LISTED], words(2, 0)),
  listed([CLASSED], words(2, 0)),
  listed([words(1, 0)], words(4, 0)),
]);
const FEATURES = [
  ...words(2),
  ...tag("mark"),
  ...words(14),
  ...tag("kern"),
  ...words(20),
  ...words(0, 1, 2),
  ...words(0, 3, 0, 1, 2),
];

/**
 * A font file of one table, GPOS, whose one script gives both features to its default language, or to Turkish
 * alone and has no default.
 */
function fileOf(script, system = true) {
  const scripts = [
    ...words(1),
    ...tag(script),
    ...words(8),
    ...(system ? words(4, 0) : [...words(0, 1), ...tag("TRK "), ...words(10)]),
    ...words(0, 0xffff, 2, 0, 1),
  ];
  const table = [
    ...words(1, 0, 10, 10 + scripts.length, 10 + scripts.length + FEATURES.length),
    ...scripts,
    ...FEATURES,
    ...LOOKUPS,
  ];
  // The file's directory names the table 28 bytes in.
  return new Uint8Array([
    ...words(1, 0, 1, 0, 0, 0),
    ...tag("GPOS"),
    ...words(0, 0, 0, 28, 0, table.length),
    ...table,
  ]).buffer;
}

test("a face's default script, glyph ranges, listed classes and second advances are read as its table gives them", () => {
  const kerning = kerningOf(fileOf("DFLT"));
  // Both lookups position glyphs 10 and 20: the listed pair by -50, the classes by -10 and by -1 for the second.
  assert.equal(kerning(10, 20), -61);
  assert.equal(kerning(12, 21), 30);
  assert.equal(kerning(30, 20), 42);
  // A second glyph no class names is of class 0, which the subtable positions too.
  assert.equal(kerning(30, 99), 5);
  // A first glyph no coverage holds, a pair no set lists and a class without a record add nothing.
  assert.deepEqual([kerning(31, 20), kerning(11, 20), kerning(30, 22)], [0, 0, 0]);
  // Kerning is the default language's, in the Latin script or the default one; a script without one gives none.
  assert.equal(kerningOf(fileOf("latn"))(10, 20), -61);
  assert.equal(kerningOf(fileOf("DFLT", false))(10, 20), 0);
  assert.equal(kerningOf(fileOf("cyrl"))(10, 20), 0);
});
