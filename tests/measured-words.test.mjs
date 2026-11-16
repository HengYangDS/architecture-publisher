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
