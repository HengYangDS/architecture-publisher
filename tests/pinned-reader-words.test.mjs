import assert from "node:assert/strict";
import test from "node:test";
import { LOCALES } from "../src/locale.mjs";
import { readerWordsOf } from "../src/reader-words.mjs";
import { readerIds } from "../src/pinned/reader.mjs";

test("an item names its statement in its language's word, and a line of another kind names none", () => {
  const words = readerWordsOf("zh-CN");
  const text = [
    "# 商店",
    "",
    "- 在固定提交中测得：`owned-files` `2 paths`",
    "- 组件 `sync`：同步 · 作者陈述",
    "  - 在固定提交中测得：`owned-files` `2 paths`",
    "- 视图 `core` · 图版 1",
    "- 组件 `sync`",
    "- component `other`: no item of this language",
    "",
    `## ${words.guide}`,
    "",
    "- 组件 `ghost`：导读里的一行",
    "",
  ].join("\n");
  assert.deepEqual(readerIds(text, "zh-CN"), {
    stated: { components: ["sync"], relations: [], groups: [] },
    named: { components: ["sync"], relations: [], groups: [] },
  });
});

/** A word two languages write alike: a byte count is written as `bytes` in Spanish too. */
const SAME = new Set(["es bytes"]);

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
      } else if (locale !== "en" && key !== "pin" && !SAME.has(`${locale} ${key}`))
        assert.notEqual(value, english[key], `${locale} ${key}`);
    }
    // The paragraph of words explains each in the language's own.
    for (const key of ["stated", "measuredPin", "measuredModel", "cited", "unchecked", "uncited"])
      assert.ok(words.keys.includes(words[key]), `${locale} ${key}`);
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
