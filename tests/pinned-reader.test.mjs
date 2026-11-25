import assert from "node:assert/strict";
import test from "node:test";
import { readerWordsOf } from "../src/reader-words.mjs";
import { editionData, serializeData } from "../src/pinned/data.mjs";
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { readerFile, readerIds } from "../src/pinned/reader.mjs";
import { CITATIONS, GUIDE, READ, REVISION, sha256, shopBuild } from "./fixtures/pinned.mjs";
import { holderWordingLines } from "./fixtures/role-wording.mjs";

/** The guide's part as the projection writes it, its own heading and a list shaped like a statement in it. */
const GUIDE_TEXT = [
  "How does the shop take an order? The client asks.[^1]",
  "",
  "### Which parts take part?",
  "",
  "- component `ghost`: a part the model lacks",
  "",
  "[^1]: Commit: `src/store/store.go` lines 10 to 20",
  "",
].join("\n");

/** The reader file of the shop, with the data it is written from. */
async function shopReader(locale = "en", options = {}, extra = {}) {
  const built = await shopBuild(locale, options);
  const verified = options.verified ?? true;
  const guided = options.guide ?? true;
  const evidence = evidenceTable({
    records: built.binding.records,
    citations: guided ? CITATIONS : [],
    read: verified && guided ? READ : new Map(),
  });
  const data = editionData({
    ...built.input,
    evidence,
    guide: guided ? GUIDE : null,
    ...extra,
  });
  const digest = sha256(serializeData(data));
  const bytes = readerFile(data, { sha256: digest, guide: guided ? GUIDE_TEXT : null });
  return { ...built, data, digest, bytes, text: bytes.toString("utf8") };
}

const headings = (text) => text.split("\n").filter((line) => /^#{1,2} /u.test(line));
/** The lines of one section, from its heading to the next. */
function section(text, heading) {
  const lines = text.split("\n");
  const start = lines.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, heading);
  const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  return lines.slice(start + 1, end === -1 ? undefined : end).filter(Boolean);
}

test("the reader file holds its parts in order and ends with the guide's part", async () => {
  const { text, model } = await shopReader();
  assert.deepEqual(headings(text).slice(0, 9), [
    "# Shop",
    "## Scope and limits",
    "## The question",
    `## ${model.question}`,
    "## Core",
    "## Statements no view selects",
    "## Not covered",
    "## Checking again",
    "## The guide",
  ]);
  assert.ok(text.startsWith("# Shop\n\nReader file of the work `shop` in `en`, written by "));
  assert.deepEqual(section(text, "Scope and limits"), [
    "The services of the shop.",
    "1. No mobile client.",
  ]);
  assert.deepEqual(section(text, "The question"), [
    "How does the shop take an order?",
    "Orders are taken, stored and billed.",
  ]);
});

test("the head states the pin, the model, the data's digest, the counts and the delivery's other files", async () => {
  const { text, data, digest } = await shopReader();
  const head = text.slice(0, text.indexOf("\n## ")).split("\n").filter(Boolean);
  assert.deepEqual(head.slice(1, 8), [
    "Reader file of the work `shop` in `en`, written by Architecture Publisher 0.15.0.",
    `- Pin: \`shop\` \`${REVISION}\` · verified at the pin · date 2026-11-10 · release \`v1.2.0\``,
    `- Model: \`model.json\` · version 3 · ${data.model.bytes} bytes · SHA-256 \`${data.model.sha256}\``,
    `- Data: \`shop.json\` · SHA-256 \`${digest}\``,
    "- Statements: components 4 · relations 4 · groups 1 · cited 4 · unchecked 0 · uncited 4",
    "- Also in this delivery: `shop.pdf`, `images/`, `figures/`, `shop.html`, `manifest.json`",
    "- measured at the pin: `largest-part` `4000 bytes` · `pin-date` `2026-11-10` · `pin-release` `v1.2.0` · `files-read` `3 files`",
  ]);
  // The words of the lines are explained once, in the model's language.
  assert.match(head[8], /“stated”.*“measured at the pin”.*“counted from the model”.*“cited”/u);
  assert.equal(head.length, 9);
});

test("without a checkout the head counts unchecked statements and states no date", async () => {
  const { text } = await shopReader("en", { verified: false });
  assert.ok(text.includes(`- Pin: \`shop\` \`${REVISION}\` · unverified, no checkout\n`));
  assert.ok(
    text.includes(
      "- Statements: components 4 · relations 4 · groups 1 · cited 0 · unchecked 4 · uncited 4\n",
    ),
  );
  assert.ok(text.includes("- stated: `files-read` `3 files`\n"));
  assert.ok(text.includes("  - stated: `owned-files` `1 paths`\n"));
  // The words' explanation names the origin; no line of facts states one measured at the pin.
  assert.ok(!/^ *- measured at the pin/mu.test(text));
  assert.match(section(text, "Not covered").join("\n"), /no checkout/u);
  // A model without a repository names no pin beyond the binding's state.
  const { input } = await shopBuild("en", { verified: false });
  const unbound = { model: { ...input.model, repository: null }, state: "none" };
  const none = await shopReader("en", { verified: false }, unbound);
  assert.ok(none.text.includes("- Pin: no repository\n"));
});

test("a view's section is headed by its question, names its plate, its image and its figure's two files, and holds one item for each statement", async () => {
  const { text, model } = await shopReader();
  assert.deepEqual(section(text, model.question), [
    "- view `overview` · plate 1 · `images/01-overview.png` · `figures/01-overview.png` · `figures/01-overview.svg`",
    "- measured at the pin: `bands-shown` `3 bands`",
    "- component `bill`: Billing · stated",
    "  - measured at the pin: `owned-files` `0 paths`",
    "- group `core`: Core · stated · members `sync`, `store`",
    "  - measured at the pin: `owned-files` `3 paths` · `owned-bytes` `4000 bytes`",
    "- relation `sync-bill`: sync —charges→ bill · stated",
    "  - via: queue",
    "  - counted from the model: `cited-files` `0 files`",
    "- relation `store-bill`: store —invoices→ bill · stated",
    "  - counted from the model: `cited-files` `0 files`",
    "- relation `bill-store`: bill —reads→ store · stated · files `src/store/store.go`",
    "  - counted from the model: `cited-files` `1 files`",
  ]);
  // A later view names a statement it shares by type and id alone; one whose question an earlier section
  // already carries is headed by its title.
  assert.deepEqual(section(text, "Core"), [
    "- view `core` · plate 2 · `images/02-core.png` · `figures/02-core.png` · `figures/02-core.svg`",
    "- measured at the pin: `bands-shown` `3 bands`",
    "- component `sync`: Synchronization · stated · files `src/sync/`",
    "  - converges: selections, files",
    "  - measured at the pin: `owned-files` `2 paths` · `owned-bytes` `3000 bytes`",
    "- component `store`: Configuration store, authority · planned · stated · files `src/store/store.go`",
    "  - measured at the pin: `owned-files` `1 paths` · `owned-bytes` `1000 bytes`",
    "- component `bill`",
    "- relation `sync-store`: sync —persists→ store · stated · files `src/store/store.go`, `src/sync/a.go`",
    "  - counted from the model: `cited-files` `2 files`",
    "- relation `sync-bill`",
    "- relation `store-bill`",
    "- relation `bill-store`",
  ]);
  assert.deepEqual(section(text, "Statements no view selects"), [
    "- component `audit`: Audit · stated",
    "  - measured at the pin: `owned-files` `0 paths`",
  ]);
});

test("a view with a summary states it, and one with a hub states the hub as measured from the model", async () => {
  const { input } = await shopBuild();
  const [, core] = input.views;
  const asked = { ...core, question: "How does the core persist?", summary: "It persists once." };
  const hub = { property: "hub", of: { kind: "view", id: "core" }, value: "store" };
  const facts = input.facts.map((fact) =>
    fact.property === "hub" && fact.of.id === "core" ? { ...fact, ...hub } : fact,
  );
  const { text } = await shopReader("en", {}, { views: [input.views[0], asked], facts });
  assert.deepEqual(section(text, "How does the core persist?").slice(0, 4), [
    "It persists once.",
    "- view `core` · plate 2 · `images/02-core.png` · `figures/02-core.png` · `figures/02-core.svg`",
    "- counted from the model: `hub` `store`",
    "- measured at the pin: `bands-shown` `3 bands`",
  ]);
  // A view that asks no question is headed by its title, whichever view comes first.
  const unasked = { ...core, question: null };
  const titled = await shopReader("en", {}, { views: [unasked, input.views[0]] });
  assert.deepEqual(headings(titled.text).slice(3, 5), ["## Core", `## ${input.model.question}`]);
});

test("the guide's part follows one heading as prose, and no line of it is taken for a statement", async () => {
  const { text, model } = await shopReader();
  const at = text.indexOf("\n## The guide\n\n");
  assert.notEqual(at, -1);
  const part = text.slice(at + "\n## The guide\n\n".length);
  assert.equal(part, GUIDE_TEXT);
  assert.ok(part.includes("- component `ghost`: a part the model lacks"));
  // The guide's part holds an item shaped like a statement of a part the model lacks: the scan stops before it.
  const read = readerIds(text, model.locale);
  assert.deepEqual(read.stated, {
    components: ["bill", "sync", "store", "audit"],
    relations: ["sync-bill", "store-bill", "bill-store", "sync-store"],
    groups: ["core"],
  });
  assert.deepEqual(read.named, {
    components: ["bill"],
    relations: ["sync-bill", "store-bill", "bill-store"],
    groups: [],
  });
});

test("a view headed by the guide's words is read as a view, with a guide and without", async () => {
  // The review of the Change (2026-11-25): the reading stopped at the first such heading.
  const { input } = await shopBuild();
  const [, core] = input.views;
  const views = [input.views[0], { ...core, question: "The guide" }];
  for (const guide of [true, false]) {
    const { text, model } = await shopReader("en", { guide }, { views });
    assert.deepEqual(readerIds(text, "en", guide).stated.components.sort(), [
      "audit",
      "bill",
      "store",
      "sync",
    ]);
    assert.ok(text.includes("\n## The guide\n"), String(model.id));
  }
});

test("a model without a guide has no such part, and the file says so and ends with its last generated line", async () => {
  const { text } = await shopReader("en", { guide: false });
  assert.ok(!headings(text).includes("## The guide"));
  assert.match(section(text, "Not covered").join("\n"), /names no guide/u);
  assert.equal(headings(text).at(-1), "## Checking again");
  assert.ok(text.endsWith("--repo <checkout>`\n"));
  assert.ok(!text.endsWith("\n\n"));
});

test("a delivery of the page alone names no plate and says that no plate draws a statement", async () => {
  const { text, model } = await shopReader("en", {}, { plates: [], media: ["page"] });
  assert.equal(section(text, model.question)[0], "- view `overview`");
  assert.ok(text.includes("- Also in this delivery: `shop.html`, `manifest.json`\n"));
  assert.match(section(text, "Not covered").join("\n"), /no print edition/u);
  assert.deepEqual(readerIds(text, "en").stated.components.sort(), [
    "audit",
    "bill",
    "store",
    "sync",
  ]);
});

test("what is not covered names the excluded paths with their reasons, and the commands that check again", async () => {
  const { text } = await shopReader();
  const uncovered = section(text, "Not covered");
  assert.ok(uncovered.includes("  - `**/*_test.go`: Tests are not architecture."));
  assert.match(uncovered.join("\n"), /No plate draws .*"Statements no view selects" \(1\)/u);
  assert.match(uncovered.join("\n"), /judges no statement supported/u);
  assert.match(uncovered.join("\n"), /overview/u);
  assert.ok(!/no checkout|names no guide|no print edition/u.test(uncovered.join("\n")));
  const checking = section(text, "Checking again").join("\n");
  assert.match(checking, /`archpub verify <delivery>`/u);
  assert.match(checking, /`archpub check model\.json --repo <checkout>`/u);
});

test("a section with nothing to say is not written", async () => {
  const { input } = await shopBuild();
  const model = { ...input.model, scope: null, limits: [], summary: null, coverage: null };
  const everything = {
    ...input.views[1],
    components: [...input.views[1].components, { id: "audit" }],
  };
  // A statement the data holds no fact of has no line of facts.
  const facts = input.facts.filter(({ of }) => of.kind !== "relation");
  const { text } = await shopReader(
    "en",
    {},
    { model, views: [input.views[0], everything], facts },
  );
  assert.ok(!text.includes("cited-files"));
  assert.ok(text.includes("- relation `store-bill`: store —invoices→ bill · stated\n- relation"));
  assert.ok(!headings(text).includes("## Scope and limits"));
  assert.ok(!headings(text).includes("## Statements no view selects"));
  assert.deepEqual(section(text, "The question"), ["How does the shop take an order?"]);
  const uncovered = section(text, "Not covered").join("\n");
  assert.ok(!uncovered.includes("excludes"));
  assert.ok(!uncovered.includes("No plate draws"));
});

test("a text of the model that holds line breaks is written on one line, and is taken for no item", async () => {
  const { input } = await shopBuild();
  const model = {
    ...input.model,
    title: "Shop\nand more",
    summary: "Orders are taken.\n- component `ghost`: no statement\n## The guide",
    limits: ["No mobile\r\n  client."],
    components: input.model.components.map((component) =>
      component.id === "sync"
        ? {
            ...component,
            label: "Synchronization\n  and convergence",
            details: [["converges", ["selections\nand files"]]],
          }
        : component,
    ),
  };
  const { text, data } = await shopReader("en", {}, { model });
  assert.equal(headings(text)[0], "# Shop and more");
  assert.deepEqual(section(text, "The question"), [
    "How does the shop take an order?",
    "Orders are taken. - component `ghost`: no statement ## The guide",
  ]);
  assert.deepEqual(section(text, "Scope and limits")[1], "1. No mobile client.");
  assert.ok(text.includes("- component `sync`: Synchronization and convergence · stated · files"));
  assert.ok(text.includes("  - converges: selections and files\n"));
  assert.deepEqual(readerIds(text, "en").stated.components, ["bill", "sync", "store", "audit"]);
  // The data keeps the model's text as it is.
  assert.equal(data.work.summary, model.summary);
});

test("a Chinese work is written in Chinese alone, its ids, values and paths as code", async () => {
  const en = await shopReader("en");
  const zh = await shopReader("zh-CN");
  const words = readerWordsOf("zh-CN");
  assert.deepEqual(headings(zh.text).slice(0, 9), [
    "# 商店",
    `## ${words.scope}`,
    `## ${words.question}`,
    "## 商店如何接单？",
    "## 核心",
    `## ${words.unselected}`,
    `## ${words.notCovered}`,
    `## ${words.checking}`,
    `## ${words.guide}`,
  ]);
  for (const key of ["scope", "question", "unselected", "notCovered", "checking", "guide"])
    assert.match(words[key], /\p{Script=Han}/u, key);
  assert.ok(
    zh.text.includes(
      "- 组件 `store`：配置库、authority · 计划中 · 作者陈述 · 文件 `src/store/store.go`\n",
    ),
  );
  assert.ok(zh.text.includes("- 关系 `sync-store`：sync —持久化→ store · 作者陈述 · 文件"));
  assert.ok(zh.text.includes("  - 收敛：选择、文件\n"));
  assert.ok(
    zh.text.includes(`- 固定提交：\`shop\` \`${REVISION}\` · 已在固定提交中核对 · 日期 2026-11-10`),
  );
  assert.ok(zh.text.includes("- 在固定提交中测得：`largest-part` `4000 bytes`"));
  // The two languages name the same ids.
  assert.deepEqual(readerIds(zh.text, "zh-CN"), readerIds(en.text, "en"));
  // Outside its code, its generated part holds no word of another language's keys.
  const generated = zh.text.slice(0, zh.text.indexOf(`\n## ${words.guide}\n`));
  const prose = generated.replace(/`[^`]*`/gu, "").replace(/Architecture Publisher|SHA-256/gu, "");
  for (const word of [
    "stated",
    "measured",
    "component",
    "relation",
    "files",
    "members",
    "cited",
    "state",
    "version",
  ])
    assert.ok(!new RegExp(`\\b${word}\\b`, "u").test(prose), word);
  // A label of the head ends as the language ends a label; an item's own mark is the same in every language.
  assert.ok(zh.text.includes("- 陈述：组件 4 · 关系 4 · 分组 1 · 引用已核对 4"));
  assert.ok(zh.text.includes("- 模型范围排除的路径：\n  - `**/*_test.go`: 测试不属于架构。\n"));
  assert.ok(zh.text.includes("- 按清单核验本交付物的文件：`archpub verify <delivery>`\n"));
  // The commands are written alike in every language.
  assert.ok(zh.text.includes("`archpub verify <delivery>`"));
  assert.ok(zh.text.includes("`archpub check model.json --repo <checkout>`"));
});

test("two builds of one state write the same bytes, and the file names no holder of a role", async () => {
  const first = await shopReader();
  const second = await shopReader();
  assert.ok(first.bytes.equals(second.bytes));
  assert.deepEqual(holderWordingLines(first.text), []);
});
