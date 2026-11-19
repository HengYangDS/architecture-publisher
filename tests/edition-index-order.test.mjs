import assert from "node:assert/strict";
import test from "node:test";
import { compareNames } from "../src/edition/record.mjs";

/** Names in the order an index of a model in a language sets them. */
const sorted = (names, locale) => [...names].sort((one, other) => compareNames(one, other, locale));

test("a word in Latin letters or digits stands before any other, word by word", () => {
  // The second word decides: a Latin word before a Han one, though the Han word's reading begins with a letter
  // that sorts later or earlier.
  assert.deepEqual(sorted(["OpenSpec 意图", "OpenSpec CLI"], "zh-CN"), [
    "OpenSpec CLI",
    "OpenSpec 意图",
  ]);
  assert.deepEqual(sorted(["仓库范式", "TransitionPlan", "Agent 技能", "CLI"], "zh-CN"), [
    "Agent 技能",
    "CLI",
    "TransitionPlan",
    "仓库范式",
  ]);
  // Within one word a run of Latin letters is a word of its own.
  assert.deepEqual(sorted(["Agent技能", "Agent", "Agent CLI"], "zh-CN"), [
    "Agent",
    "Agent CLI",
    "Agent技能",
  ]);
  assert.deepEqual(sorted(["가방", "API 서버", "2단계"], "ko"), ["2단계", "API 서버", "가방"]);
});

test("a name that begins another stands before it", () => {
  assert.deepEqual(sorted(["Git 改动引擎", "Git", "Git 与进程观察"], "zh-CN"), [
    "Git",
    "Git 改动引擎",
    "Git 与进程观察",
  ]);
  assert.deepEqual(sorted(["Store writer", "Store"], "en"), ["Store", "Store writer"]);
});

test("two words of one script stand as the model's language sorts them", () => {
  // Chinese by reading, Korean by syllable.
  assert.deepEqual(sorted(["通道", "仓库", "门禁"], "zh-CN"), ["仓库", "门禁", "通道"]);
  assert.deepEqual(sorted(["다리", "가방", "나무"], "ko"), ["가방", "나무", "다리"]);
  // Spanish files ñ after every n; English files it with n.
  assert.deepEqual(sorted(["ñu", "nube", "oso"], "es"), ["nube", "ñu", "oso"]);
  assert.deepEqual(sorted(["ñu", "nube", "oso"], "en"), ["ñu", "nube", "oso"]);
  // Case does not part two words, and digits count as numbers.
  assert.deepEqual(sorted(["beta", "Alpha", "stage 10", "stage 2"], "en"), [
    "Alpha",
    "beta",
    "stage 2",
    "stage 10",
  ]);
});

test("the order is one order: no two different names compare as equal, and it is the same both ways", () => {
  const names = ["Git", "Git 改动引擎", "git", "OpenSpec CLI", "OpenSpec 意图", "状态", "CLI"];
  for (const one of names)
    for (const other of names) {
      const order = Math.sign(compareNames(one, other, "zh-CN"));
      assert.equal(order + Math.sign(compareNames(other, one, "zh-CN")), 0, `${one} / ${other}`);
      assert.equal(order === 0, one === other, `${one} / ${other}`);
    }
});
