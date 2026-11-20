import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { evalEdition } from "./fixtures/edition-typeset.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";
import { minimalModel } from "./fixtures/models.mjs";

const REVISION = "a".repeat(40);

/** A model in a language, with a title, pinned so that the edition names its build. */
const modelOf = (locale, title) =>
  validateModel(
    minimalModel({
      locale,
      title,
      overview: everyBlock(),
      editors: [{ name: "Yang HENG" }],
      license: "MIT",
      repository: { name: "minimal", url: "https://github.com/o/minimal.git", revision: REVISION },
    }),
  );

/**
 * What the house class records under a label of a model's typeset edition, read back from Typst.
 * @param {string} selector a Typst selector, such as `<archpub-box>`
 */
const queryEdition = (t, model, selector) =>
  evalEdition(t, { model }, `query(${selector}).map(it => it.value)`);

test("a Chinese edition's overview masthead sets its build line in the model's language", async (t) => {
  const texts = (await queryEdition(t, modelOf("zh-CN", "最小"), "<archpub-box>")).map(
    ({ text }) => text,
  );
  assert.ok(texts.includes("构建于提交 aaaaaaa · 2026-11-06"), texts.join(" | "));
  assert.ok(!texts.some((text) => text.startsWith("As built")), texts.join(" | "));
});

test("an English edition's overview masthead keeps its build line", async (t) => {
  const texts = (await queryEdition(t, modelOf("en", "Minimal"), "<archpub-box>")).map(
    ({ text }) => text,
  );
  assert.ok(texts.includes("As built at aaaaaaa · 2026-11-06"), texts.join(" | "));
});

test("a CJK cover title wider than its column breaks into balanced lines, at a space where one fits", async (t) => {
  const guide = await queryEdition(
    t,
    modelOf("zh-CN", "数据部门工作指南"),
    "<archpub-cover-lines>",
  );
  assert.deepEqual(guide, [["数据部门", "工作指南"]]);
  const client = await queryEdition(
    t,
    modelOf("zh-CN", "AIGW 客户端投影"),
    "<archpub-cover-lines>",
  );
  assert.deepEqual(client, [["AIGW", "客户端投影"]]);
});

test("a CJK cover title that fits, and an English title, keep the cover's own breaks", async (t) => {
  assert.deepEqual(
    await queryEdition(t, modelOf("zh-CN", "架构图册"), "<archpub-cover-lines>"),
    [],
  );
  const english = modelOf("en", "OpenAI Responses Proxy and its listener");
  assert.deepEqual(await queryEdition(t, english, "<archpub-cover-lines>"), []);
});
