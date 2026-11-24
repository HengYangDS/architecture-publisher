import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { editionWordsOf } from "../src/edition/words.mjs";
import { LOCALES, readerWordsOf, wordsOf } from "../src/locale.mjs";

// Ledger row 24: the product's terms in each language, with a check of wording. The reference page is the
// vocabulary: each row names a concept, its word in each language and the keys of the product's words that use it.

/** The three tables of the product's words, by the name a key begins with. */
const TABLES = { edition: editionWordsOf, page: wordsOf, reader: readerWordsOf };

/**
 * A key's text in a language: a word as written, a sentence with `‹A›`, `‹B›` … where it takes values.
 * @param {string} key `<table>.<path>`
 * @param {string} locale
 */
function textOf(key, locale) {
  const [table, ...steps] = key.split(".");
  /** @type {any} */
  let value = TABLES[/** @type {keyof typeof TABLES} */ (table)]?.(locale);
  for (const step of steps) value = value?.[step];
  if (typeof value === "function")
    value = value(...Array.from({ length: value.length }, (_, index) => `‹${"ABCD"[index]}›`));
  return typeof value === "string" ? value : null;
}

/** The page's rows: each concept with its word in each language and its keys. */
async function terms() {
  const page = await fs.readFile(new URL("../docs/reference/terms.md", import.meta.url), "utf8");
  const [head, , ...rows] = page
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
  assert.deepEqual(head, ["Concept", ...LOCALES.map((locale) => `\`${locale}\``), "Keys"]);
  for (const row of rows)
    assert.ok(
      row.every((cell) => cell.length > 0),
      `an empty cell in ${row[0]}`,
    );
  return rows.map(([concept, ...cells]) => ({
    concept,
    words: Object.fromEntries(LOCALES.map((locale, index) => [locale, cells[index]])),
    keys: [...cells[LOCALES.length].matchAll(/`([^`]+)`/gu)].map(([, key]) => key),
  }));
}

/**
 * A text as the check compares it: lower case, accents aside, so that relación holds in relaciones.
 * @param {string} text
 * @param {string} locale
 */
const plain = (text, locale) =>
  text.toLocaleLowerCase(locale).normalize("NFD").replace(/\p{M}/gu, "");

/**
 * The keys that do not name their concept by their language's word.
 * @param {Awaited<ReturnType<typeof terms>>} rows
 * @param {(key: string, locale: string) => string | null} read
 */
const findings = (rows, read) =>
  rows.flatMap(({ concept, words, keys }) =>
    keys.flatMap((key) =>
      LOCALES.flatMap((locale) => {
        const text = read(key, locale);
        if (text === null) return [`${key} holds no text in ${locale}`];
        return plain(text, locale).includes(plain(words[locale], locale))
          ? []
          : [`${key} names ${concept} without "${words[locale]}" in ${locale}: ${text}`];
      }),
    ),
  );

test("every key the term table names uses its concept's word in every language, and another word is refused", async () => {
  const rows = await terms();
  assert.ok(rows.length > 0 && rows.every(({ keys }) => keys.length > 0));
  assert.deepEqual(findings(rows, textOf), []);
  const [edition] = rows;
  assert.deepEqual(
    findings([edition], (key, locale) =>
      key === "edition.edition" && locale === "en" ? "Architecture volume" : edition.words[locale],
    ),
    ['edition.edition names edition without "edition" in en: Architecture volume'],
  );
});

test("a plate's key names the boundary by its name alone, and the context in the fewest words, in every language", () => {
  for (const locale of LOCALES) assert.equal(wordsOf(locale).inside("Shop"), "Shop", locale);
  assert.deepEqual(
    LOCALES.map((locale) => wordsOf(locale).context),
    ["outside this group", "本组之外", "本組之外", "fuera de este grupo", "이 그룹 밖"],
  );
});
