import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { importLikeC4 } from "../packages/publisher/src/importers/likec4.mjs";
import { presentation } from "../packages/publisher/src/kinds.mjs";
import {
  DEFAULT_LOCALE,
  LOCALES,
  detailPieces,
  detailText,
  sentence,
  sentences,
  wordsOf,
} from "../packages/publisher/src/locale.mjs";
import { diagramCandidates } from "../packages/publisher/src/map/archify.mjs";
import { explainerDraft } from "../packages/publisher/src/map/explainer.mjs";
import { validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { notesOf } from "../packages/publisher/src/poster/blocks.mjs";
import { graphModel, minimalModel } from "./fixtures/models.mjs";

const fits = async () => ({ fits: true, width: 2400, height: 1350 });
const readJson = async (url) => JSON.parse(await fs.readFile(url, "utf8"));
const SHOP = fileURLToPath(new URL("./fixtures/likec4/shop/", import.meta.url));

test("every language a model may name is one Archify speaks, and the schema lists the same", async () => {
  const catalogs = await readJson(
    new URL(
      "../packages/publisher/renderers/archify/supply/locales/manifest.json",
      import.meta.url,
    ),
  );
  const spoken = new Set(catalogs.catalogs.map(({ locale }) => locale));
  for (const locale of LOCALES) assert.ok(spoken.has(locale), locale);
  const schema = await readJson(
    new URL("../packages/publisher/src/model/schema.json", import.meta.url),
  );
  assert.deepEqual(schema.properties.locale.enum, LOCALES);
  assert.equal(DEFAULT_LOCALE, LOCALES[0]);
});

test("every language sets every word the publisher writes", () => {
  const english = wordsOf("en");
  for (const locale of LOCALES) {
    const words = wordsOf(locale);
    assert.deepEqual(Object.keys(words).sort(), Object.keys(english).sort(), locale);
    for (const [key, value] of Object.entries(words)) {
      assert.equal(typeof value, typeof english[/** @type {keyof typeof english} */ (key)], key);
      if (typeof value === "function") assert.match(value("A", 2), /A/u, `${locale} ${key}`);
    }
  }
  // An unknown or absent language reads as English.
  assert.equal(wordsOf(undefined), english);
  assert.equal(wordsOf("xx"), english);
});

test("a model names its language, which defaults to English", () => {
  assert.equal(validateModel(minimalModel()).locale, "en");
  assert.equal(validateModel(minimalModel({ locale: "zh-CN" })).locale, "zh-CN");
  assert.throws(
    () => validateModel(minimalModel({ locale: "fr" })),
    (error) =>
      error.code === "model_invalid" &&
      error.problems.some(
        ({ code, path, message }) =>
          code === "model_locale_unsupported" && path === "/locale" && /zh-CN/u.test(message),
      ),
  );
});

test("details, lists and sentences are punctuated as the model's language sets them", () => {
  const en = wordsOf("en");
  const zh = wordsOf("zh-CN");
  assert.equal(detailText(en, "stores", ["orders", "carts"]), "stores: orders, carts");
  assert.equal(detailText(zh, "存储", ["订单", "购物车"]), "存储：订单、购物车");
  assert.deepEqual(detailPieces(en, "stores", ["orders", "carts", "users"]), {
    pieces: ["stores: orders,", "carts,", "users"],
    gap: " ",
  });
  assert.deepEqual(detailPieces(zh, "存储", ["订单", "购物车"]), {
    pieces: ["存储：订单、", "购物车"],
    gap: "",
  });
  assert.equal(sentence(en, " Checkout only "), "Checkout only.");
  assert.equal(sentence(en, "Done!"), "Done!");
  // Text that ends in Han or Kana takes the ideographic full stop in any language.
  assert.equal(sentence(en, "不含退款"), "不含退款。");
  assert.equal(sentence(zh, "Checkout only"), "Checkout only。");
  assert.equal(sentences(en, ["One", "Two."]), "One. Two.");
  assert.equal(sentences(zh, ["只含结账", "不含退款"]), "只含结账。不含退款。");
  // A sentence that ends with a Latin stop is followed by a space even in Chinese.
  assert.equal(sentences(zh, ["Checkout only.", "不含退款"]), "Checkout only. 不含退款。");
});

test("a Chinese model's poster notes, legend words and generated details are Chinese", async () => {
  const model = validateModel(
    minimalModel({
      locale: "zh-CN",
      scope: "只含结账",
      limits: ["不含退款", "不含库存"],
      attribution: "商店团队",
      repository: { name: "shop", revision: "0123456789ab".padEnd(40, "0") },
    }),
  );
  assert.deepEqual(notesOf(model), [
    { label: "范围", text: "只含结账。" },
    { label: "局限", text: "不含退款。不含库存。" },
    { label: "来源", text: "源码 shop，修订 0123456789ab；建模：商店团队。" },
  ]);
  assert.equal(presentation(model, { kind: null }).label, "组件");
  assert.equal(presentation(model, { kind: null, group: true }).label, "分组");
  const grouped = validateModel(
    graphModel(
      4,
      [
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 4],
      ],
      {
        locale: "zh-CN",
        groups: [
          { id: "front", label: "前端", members: ["c1", "c2"] },
          { id: "back", label: "后端", members: ["c3", "c4"] },
        ],
      },
    ),
  );
  // An overview is drawn when the whole model does not fit one page.
  const views = await planViews(grouped, async (view) => ({
    fits: view.id !== "architecture",
    width: 2400,
    height: 1350,
  }));
  const [overview] = views;
  assert.equal(overview.id, "overview");
  assert.deepEqual(overview.components[0].details, [["包含", ["Component 1", "Component 2"]]]);
  assert.deepEqual(overview.relations.at(-1).details, [["关系数", ["2"]]]);
});

test("the page and its diagrams speak the model's language", async () => {
  const model = validateModel(
    minimalModel({ locale: "zh-CN", scope: "只含结账", limits: ["不含退款"] }),
  );
  const views = await planViews(model, fits);
  const [candidate] = diagramCandidates(model, views[0]);
  assert.equal(candidate.document.meta.locale, "zh-CN");
  const { draft } = explainerDraft(model, views, [candidate]);
  assert.match(draft, /^@meta locale=zh-CN$/mu);
  assert.match(draft, /^@answer scope="只含结账。不含退款。"$/mu);
  // A model without a summary is summarized in its own language.
  assert.match(draft, /^Minimal，共 1 个视图。$/mu);
  // An English model's diagrams leave Archify's default language unnamed.
  const english = validateModel(minimalModel());
  const [plain] = diagramCandidates(english, (await planViews(english, fits))[0]);
  assert.equal("locale" in plain.document.meta, false);
});

test("an import sets the words it supplies in the language it is asked for", async () => {
  const { model } = await importLikeC4(SHOP, { id: "shop", title: "商店", locale: "zh-CN" });
  assert.equal(model.locale, "zh-CN");
  assert.equal(model.question, "商店 由哪些部分组成？");
  assert.ok(model.relations.some(({ label }) => label === "使用"));
  // The import names no author: a model's attribution is its author's to give.
  assert.equal("attribution" in model, false);
});
