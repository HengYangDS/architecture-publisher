import assert from "node:assert/strict";
import test from "node:test";
import { atoms, joined } from "../packages/publisher/src/breaks.mjs";
import { loadIcons } from "../packages/publisher/src/icons.mjs";
import { wordsOf } from "../packages/publisher/src/locale.mjs";
import { validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { admitsView } from "../packages/publisher/src/poster/compose/candidates.mjs";
import { composePosters } from "../packages/publisher/src/poster/compose/edition.mjs";
import { loadTypefaces, requireGlyphs } from "../packages/publisher/src/poster/text.mjs";
import { graphModel } from "./fixtures/models.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);
const style = { size: 18, weight: 400, line: 26 };
const units = (text) => atoms(text).map(({ gap, text: unit }) => `${gap}${unit}`);

test("spaced writing breaks at its spaces and unspaced writing between its characters", () => {
  assert.deepEqual(units("Source  archpub\tat 1234"), ["Source", " archpub", " at", " 1234"]);
  assert.deepEqual(units("데이터 서비스 계층"), ["데이터", " 서비스", " 계층"]);
  assert.deepEqual(units("认证服务"), ["认", "证", "服", "务"]);
  // A run of other characters inside unspaced text stays whole.
  assert.deepEqual(units("LikeC4的视图"), ["LikeC4", "的", "视", "图"]);
  // Closing marks stay with the character before them, opening marks with the one after.
  assert.deepEqual(units("调用（OAuth）数据库。然后"), [
    "调",
    "用",
    "（OAuth）",
    "数",
    "据",
    "库。",
    "然",
    "后",
  ]);
  assert.deepEqual(units("“引用”和「括号」"), ["“引", "用”", "和", "「括", "号」"]);
  assert.deepEqual(units("サーバーを"), ["サー", "バー", "を"]);
  for (const text of ["认证服务（OAuth）调用数据库。", "a b  c", "LikeC4的视图, 再导入"])
    assert.equal(joined(atoms(text)), text.replace(/\s+/gu, " ").trim());
});

test("a no-break space keeps the words beside it on one line", () => {
  for (const space of ["\u00A0", "\u2007", "\u202F", "\uFEFF"])
    assert.deepEqual(units(`the 9th search in 60${space}s`), [
      "the",
      " 9th",
      " search",
      " in",
      ` 60${space}s`,
    ]);
  // Where "s" would start a line alone after a space, "60 s" moves down whole.
  const text = "the 9th search in 60\u00A0s";
  const width = typefaces.measure("the 9th search in 60", style);
  assert.deepEqual(typefaces.wrap(text, width, style), ["the 9th search in", "60\u00A0s"]);
  assert.deepEqual(typefaces.wrap(text.replace("\u00A0", " "), width, style), [
    "the 9th search in 60",
    "s",
  ]);
});

test("unspaced text wraps between characters and never starts a line with a closing mark", () => {
  const text = "认证服务调用订单数据库，然后返回结果。";
  const width = typefaces.measure("认证服务调用", style);
  const lines = typefaces.wrap(text, width, style);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(""), text);
  for (const line of lines) {
    assert.ok(typefaces.measure(line, style) <= width, line);
    assert.doesNotMatch(line, /^[，。、]/u);
  }
  // A Latin text still wraps between its words, as before.
  assert.deepEqual(typefaces.wrap("one two three", typefaces.measure("one two", style), style), [
    "one two",
    "three",
  ]);
});

test("a detail wraps between its values with the list marks of the model's language", () => {
  const zh = wordsOf("zh-CN");
  const width = typefaces.measure("存储：订单、购物车、", style);
  const lines = typefaces.detailLines(zh, "存储", ["订单", "购物车", "用户", "库存"], width, style);
  assert.deepEqual(lines, ["存储：订单、购物车、", "用户、库存"]);
  const en = wordsOf("en");
  assert.deepEqual(
    typefaces.detailLines(
      en,
      "stores",
      ["orders", "carts"],
      typefaces.measure("stores:", style) * 3,
      style,
    ),
    ["stores: orders, carts"],
  );
});

test("a model written in Chinese composes into pages without breaking a label apart", async () => {
  const labels = ["网关服务", "订单服务", "支付服务提供方", "库存服务", "消息队列", "订单数据库"];
  const model = validateModel(
    graphModel(
      6,
      [
        [1, 2, "路由订单"],
        [2, 3, "发起扣款"],
        [2, 4, "预留库存"],
        [2, 5, "投递事件"],
        [2, 6, "写入订单"],
      ],
      {
        locale: "zh-CN",
        title: "商店",
        question: "一次下单经过哪些部分？",
        components: labels.map((label, index) => ({
          id: `c${index + 1}`,
          label,
          details: { 职责: [`处理第 ${index + 1} 步`] },
        })),
      },
    ),
  );
  const views = await planViews(model, async (view) => admitsView(model, view, typefaces, icons));
  const pages = composePosters(model, views, typefaces, icons);
  assert.ok(pages.length >= 1);
  for (const page of pages) {
    assert.ok(["balanced", "sparse"].includes(page.admission), page.admission);
    assert.doesNotMatch(page.svg, /<text|NaN|undefined/u);
  }
});

test("letters the CJK face lacks are set in the Latin, Greek and Cyrillic face", () => {
  for (const text of ["Łódź usługa", "Příliš žluťoučký", "Ağ geçidi", "Привіт, світ", "Ελληνικά ά"])
    assert.deepEqual(typefaces.missing(text), [], text);
  // A text the CJK face draws whole keeps its CJK Latin, so a word never mixes faces.
  const mixed = typefaces.outline("认证 Łódź", 0, 20, style);
  assert.equal(
    mixed,
    typefaces.outline("认证 ", 0, 20, style) +
      typefaces.outline("Łódź", typefaces.measure("认证 ", style), 20, style),
  );
  assert.equal(
    typefaces.measure("认证 Łódź", style),
    typefaces.measure("认证 ", style) + typefaces.measure("Łódź", style),
  );
});

test("right-to-left and shaped scripts are refused by name, and undrawable characters as missing", () => {
  assert.throws(
    () =>
      requireGlyphs(typefaces, [
        { path: "/title", text: "مرحبا" },
        { path: "/summary", text: "नमस्ते" },
        { path: "/components/0/label", text: "smile 😀" },
      ]),
    (error) =>
      error.code === "glyphs_missing" &&
      JSON.stringify(error.problems.map(({ code, path }) => [code, path])) ===
        JSON.stringify([
          ["script_unsupported", "/title"],
          ["script_unsupported", "/summary"],
          ["glyph_missing", "/components/0/label"],
        ]),
  );
});
