import assert from "node:assert/strict";
import test from "node:test";
import { CATALOGUE } from "../src/facts/catalogue.mjs";
import { LOCALES, measureWordsOf } from "../src/locale.mjs";
import { PARTS, part, platesIn, stripModel, stripStyle } from "./fixtures/strips.mjs";

/** Every way a language's words of one property can be said, as text: a sentence, or a function of sample values. */
const said = (words) =>
  typeof words === "function"
    ? [words("20 KB")]
    : typeof words === "string"
      ? [words]
      : Object.values(words).flatMap(said);

/** What a language calls a size and files, which the words of a fact in bytes or in files have to name. */
const NOUNS = {
  en: { bytes: /\bsize\b/u, files: /\bfiles\b/u },
  "zh-CN": { bytes: /大小/u, files: /文件/u },
  "zh-TW": { bytes: /大小/u, files: /檔案/u },
  es: { bytes: /\btamaño\b/u, files: /\barchivos\b/u },
  ko: { bytes: /크기/u, files: /파일/u },
};

test("every language holds the words of the same measured properties, each one of the catalogue's", () => {
  const properties = new Set(CATALOGUE.map(({ property }) => property));
  const [first, ...rest] = LOCALES.map((locale) => [
    locale,
    Object.keys(measureWordsOf(locale)).sort(),
  ]);
  for (const name of first[1])
    assert.ok(properties.has(name), `${name} is no property of the catalogue`);
  for (const [locale, names] of rest)
    assert.deepEqual(names, first[1], `${locale} against ${first[0]}`);
  assert.ok(first[1].includes("owned-bytes") && first[1].includes("cited-files"));
});

test("the words of a fact in bytes name a size, and the words of a fact in files name files", () => {
  for (const locale of LOCALES) {
    const words = measureWordsOf(locale);
    for (const { property, unit } of CATALOGUE) {
      const noun = NOUNS[locale][unit];
      if (!noun || !(property in words)) continue;
      for (const text of said(words[property]))
        assert.match(text, noun, `${locale} ${property}: ${text}`);
    }
  }
});

test("the middle age band is named by both its bounds, so its words are untrue of a file of the newest band", () => {
  // The catalogue gives the middle band the files changed over the first span and within the second before the
  // pin. Named by its upper bound alone ("within 90 days"), its words are as true of a file changed yesterday,
  // which the strip dyes as the newest band: a reader takes the two dyes for overlapping spans.
  for (const locale of LOCALES) {
    const { middle, newest } = measureWordsOf(locale)["file-age-band"];
    const text = middle(7, 90);
    assert.match(text, /(^|\D)7(\D|$)/u, `${locale}: ${text}`);
    assert.match(text, /(^|\D)90(\D|$)/u, `${locale}: ${text}`);
    assert.notEqual(
      text,
      newest(90),
      `${locale}: the middle band reads as a newest band of 90 days`,
    );
  }
});

test("a plate's key names its middle band by the two spans the edition measured", async () => {
  // Every part that owns files owns one of each band, so the plate shows all three.
  const parts = new Map(
    [...PARTS].map(([id, { files }]) => [
      id,
      files.length
        ? part([
            ["src/new.mjs", 4000, 0],
            ["src/mid.mjs", 3000, 1],
            ["src/old.mjs", 2000, 2],
          ])
        : part([]),
    ]),
  );
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle(undefined, parts));
  const bands = plate.legend.filter(({ shape }) => shape === "band").map(({ label }) => label);
  assert.deepEqual(bands, [
    "within 7 days of the commit",
    "over 7 and within 90 days of the commit",
    "earlier",
  ]);
});

test("a plate of parts that own Markdown alone names no code in its key", async () => {
  const parts = new Map(
    [...PARTS].map(([id, { files }]) => [
      id,
      files.length ? part([["docs/guide.md", 4000, 0]]) : part([]),
    ]),
  );
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle(undefined, parts));
  const labels = plate.legend.map(({ label }) => label).join(" | ");
  assert.match(labels, /size of a part's files/u);
  assert.doesNotMatch(labels, /\bcode\b|source/iu);
});
