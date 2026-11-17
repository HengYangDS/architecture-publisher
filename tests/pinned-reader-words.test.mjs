import assert from "node:assert/strict";
import test from "node:test";
import { LOCALES, readerWordsOf } from "../src/locale.mjs";
import { parseReader } from "../src/pinned/reader.mjs";

test("a line shaped like facts that hangs under no statement, or holds no fact, is no line of facts", () => {
  const words = readerWordsOf("en");
  const text = [
    "# Shop",
    "",
    "- measured (pin): three files",
    "",
    `## ${words.notCovered}`,
    "",
    "- A sentence.",
    "  - measured (pin): `owned-bytes` 9 bytes",
    "- component `sync`: Synchronization · stated",
    "  - measured: a detail of that name",
    "  - stated: `owned-files` 2 paths",
    "",
  ].join("\n");
  assert.deepEqual(parseReader(text, "en").facts, [
    {
      property: "owned-files",
      of: { kind: "part", id: "sync" },
      value: 2,
      unit: "paths",
      origin: "stated",
    },
  ]);
});

test("every language sets every word of the reader file in its own words", () => {
  const english = readerWordsOf("en");
  for (const locale of LOCALES) {
    const words = readerWordsOf(locale);
    if (locale !== "en") assert.notEqual(words, english, locale);
    assert.deepEqual(Object.keys(words).sort(), Object.keys(english).sort(), locale);
    for (const [key, value] of Object.entries(words)) {
      assert.equal(typeof value, typeof english[key], `${locale} ${key}`);
      if (typeof value === "function") {
        // Every argument English sets, the language sets too.
        const count = (set) => set("Ω", "Ω", "Ω").split("Ω").length;
        assert.equal(count(value), count(english[key]), `${locale} ${key}`);
        assert.ok(count(value) > 1, `${locale} ${key}`);
      } else if (locale !== "en" && key !== "pin")
        assert.notEqual(value, english[key], `${locale} ${key}`);
    }
    // The keys the invariants parse are written alike in every language.
    for (const key of [
      "stated",
      "measured (pin)",
      "measured (model)",
      "cited",
      "unchecked",
      "uncited",
    ])
      assert.ok(words.keys.includes(`\`${key}\``), `${locale} ${key}`);
  }
  assert.equal(readerWordsOf(undefined), english);
  assert.equal(readerWordsOf("xx"), english);
});

test("in Chinese a checkout the build reads is named as a directory, not by the bare verb", () => {
  // 检出 alone is what git does; the thing a build reads files in is the directory it leaves (2026-11-18).
  for (const [locale, verb, directory] of [
    ["zh-CN", "检出", "检出目录"],
    ["zh-TW", "簽出", "簽出目錄"],
  ]) {
    const words = readerWordsOf(locale);
    for (const key of ["keys", "noCheckout", "check"]) {
      const text = /** @type {string} */ (words[key]);
      assert.ok(text.includes(directory), `${locale} ${key} names the directory`);
      assert.equal(text.split(verb).length, text.split(directory).length, `${locale} ${key}`);
    }
  }
});
