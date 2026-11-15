import assert from "node:assert/strict";
import test from "node:test";
import { readerWordsOf } from "../src/locale.mjs";
import { editionData, serializeData } from "../src/pinned/data.mjs";
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { parseReader, readerFile } from "../src/pinned/reader.mjs";
import { CITATIONS, DRAFT, GUIDE, READ, REVISION, sha256, shopBuild } from "./fixtures/pinned.mjs";
import { holderWordingLines } from "./fixtures/role-wording.mjs";

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
  const bytes = readerFile(data, { sha256: digest, draft: guided ? DRAFT : null });
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

test("the reader file holds its parts in order and ends with the guide's text", async () => {
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
    "## The guide's text",
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
    `- Pin: \`shop\` \`${REVISION}\` · state verified · date 2026-11-10 · release \`v1.2.0\``,
    `- Model: \`model.json\` · version 3 · bytes ${data.model.bytes} · sha256 \`${data.model.sha256}\``,
    `- Data: \`shop.json\` · sha256 \`${digest}\``,
    "- Statements: components 4 · relations 4 · groups 1 · cited 4 · unchecked 0 · uncited 4",
    "- Also in this delivery: `shop.pdf`, `images/`, `shop.html`, `manifest.json`",
    "- measured (pin): `largest-part` 4000 bytes · `pin-date` `2026-11-10` date · `pin-release` `v1.2.0` release · `files-read` 3 files",
  ]);
  // The keys of the lines are explained once, in the model's language.
  assert.match(
    head[8],
    /`stated`.*`measured \(pin\)`.*`measured \(model\)`.*`cited`.*`unchecked`.*`uncited`/u,
  );
  assert.equal(head.length, 9);
});

test("without a checkout the head counts unchecked statements and states no date", async () => {
  const { text } = await shopReader("en", { verified: false });
  assert.ok(text.includes(`- Pin: \`shop\` \`${REVISION}\` · state unverified\n`));
  assert.ok(
    text.includes(
      "- Statements: components 4 · relations 4 · groups 1 · cited 0 · unchecked 4 · uncited 4\n",
    ),
  );
  assert.ok(text.includes("- stated: `files-read` 3 files\n"));
  assert.ok(text.includes("  - stated: `owned-files` 1 paths\n"));
  // The keys' explanation names the origin; no line of facts states one measured at the pin.
  assert.ok(!/^ *- measured \(pin\)/mu.test(text));
  assert.match(section(text, "Not covered").join("\n"), /no checkout/u);
  // A model without a repository names no pin beyond the binding's state.
  const { input } = await shopBuild("en", { verified: false });
  const unbound = { model: { ...input.model, repository: null }, state: "none" };
  const none = await shopReader("en", { verified: false }, unbound);
  assert.ok(none.text.includes("- Pin: state none\n"));
});

test("a view's section is headed by its question, names its plate and image, and holds one item for each statement", async () => {
  const { text, model } = await shopReader();
  assert.deepEqual(section(text, model.question), [
    "- view `overview` · plate 1 · `images/01-overview.png`",
    "- measured (pin): `bands-shown` 3 bands",
    "- component `bill`: Billing · stated",
    "  - measured (pin): `owned-files` 0 paths",
    "- group `core`: Core · stated · members `sync`, `store`",
    "  - measured (pin): `owned-files` 3 paths · `owned-bytes` 4000 bytes",
    "- relation `sync-bill`: sync —charges→ bill · stated",
    "  - via: queue",
    "  - measured (model): `cited-files` 0 files",
    "- relation `store-bill`: store —invoices→ bill · stated",
    "  - measured (model): `cited-files` 0 files",
    "- relation `bill-store`: bill —reads→ store · stated · files `src/store/store.go`",
    "  - measured (model): `cited-files` 1 files",
  ]);
  // A later view names a statement it shares by type and id alone; one whose question an earlier section
  // already carries is headed by its title.
  assert.deepEqual(section(text, "Core"), [
    "- view `core` · plate 2 · `images/02-core.png`",
    "- measured (pin): `bands-shown` 3 bands",
    "- component `sync`: Synchronization · stated · files `src/sync/`",
    "  - converges: selections, files",
    "  - measured (pin): `owned-files` 2 paths · `owned-bytes` 3000 bytes",
    "- component `store`: Configuration store, authority · planned · stated · files `src/store/store.go`",
    "  - measured (pin): `owned-files` 1 paths · `owned-bytes` 1000 bytes",
    "- component `bill`",
    "- relation `sync-store`: sync —persists→ store · stated · files `src/store/store.go`, `src/sync/a.go`",
    "  - measured (model): `cited-files` 2 files",
    "- relation `sync-bill`",
    "- relation `store-bill`",
    "- relation `bill-store`",
  ]);
  assert.deepEqual(section(text, "Statements no view selects"), [
    "- component `audit`: Audit · stated",
    "  - measured (pin): `owned-files` 0 paths",
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
    "- view `core` · plate 2 · `images/02-core.png`",
    "- measured (model): `hub` `store` part",
    "- measured (pin): `bands-shown` 3 bands",
  ]);
  // A view that asks no question is headed by its title, whichever view comes first.
  const unasked = { ...core, question: null };
  const titled = await shopReader("en", {}, { views: [unasked, input.views[0]] });
  assert.deepEqual(headings(titled.text).slice(3, 5), ["## Core", `## ${input.model.question}`]);
});

test("the guide's draft follows one heading byte for byte, and no line of it is taken for a statement", async () => {
  const { bytes, text, data, model } = await shopReader();
  const heading = Buffer.from("\n## The guide's text\n\n");
  const at = bytes.indexOf(heading);
  assert.notEqual(at, -1);
  const tail = bytes.subarray(at + heading.length);
  assert.ok(tail.equals(DRAFT));
  assert.equal(sha256(tail), data.guide.sha256);
  // The draft holds an item shaped like a statement of a part the model lacks: the parser stops before it.
  assert.ok(text.includes("- component `ghost`: a part the model lacks"));
  const parsed = parseReader(text, model.locale);
  assert.deepEqual(parsed.stated, {
    components: ["bill", "sync", "store", "audit"],
    relations: ["sync-bill", "store-bill", "bill-store", "sync-store"],
    groups: ["core"],
  });
  assert.deepEqual(parsed.named, {
    components: ["bill"],
    relations: ["sync-bill", "store-bill", "bill-store"],
    groups: [],
  });
  assert.match(section(text, "Not covered").join("\n"), /as its author wrote it/u);
});

test("a model without a guide has no such part, and the file says so and ends with its last generated line", async () => {
  const { text } = await shopReader("en", { guide: false });
  assert.ok(!headings(text).includes("## The guide's text"));
  assert.match(section(text, "Not covered").join("\n"), /names no guide/u);
  assert.equal(headings(text).at(-1), "## Checking again");
  assert.ok(text.endsWith("--repo <checkout>`\n"));
  assert.ok(!text.endsWith("\n\n"));
});

test("the parser reads the lines of facts back to values, each with what it is a fact of", async () => {
  const { text, model } = await shopReader();
  const { facts } = parseReader(text, model.locale);
  assert.deepEqual(facts.slice(0, 5), [
    {
      property: "largest-part",
      of: { kind: "edition" },
      value: 4000,
      unit: "bytes",
      origin: "measured",
      from: "pin",
    },
    {
      property: "pin-date",
      of: { kind: "edition" },
      value: "2026-11-10",
      unit: "date",
      origin: "measured",
      from: "pin",
    },
    {
      property: "pin-release",
      of: { kind: "edition" },
      value: "v1.2.0",
      unit: "release",
      origin: "measured",
      from: "pin",
    },
    {
      property: "files-read",
      of: { kind: "edition" },
      value: 3,
      unit: "files",
      origin: "measured",
      from: "pin",
    },
    {
      property: "bands-shown",
      of: { kind: "view", id: "overview" },
      value: 3,
      unit: "bands",
      origin: "measured",
      from: "pin",
    },
  ]);
  const of = (kind, id) => facts.filter((fact) => fact.of.kind === kind && fact.of.id === id);
  assert.deepEqual(of("group", "core"), [
    {
      property: "owned-files",
      of: { kind: "group", id: "core" },
      value: 3,
      unit: "paths",
      origin: "measured",
      from: "pin",
    },
    {
      property: "owned-bytes",
      of: { kind: "group", id: "core" },
      value: 4000,
      unit: "bytes",
      origin: "measured",
      from: "pin",
    },
  ]);
  assert.deepEqual(of("relation", "sync-store"), [
    {
      property: "cited-files",
      of: { kind: "relation", id: "sync-store" },
      value: 2,
      unit: "files",
      origin: "measured",
      from: "model",
    },
  ]);
  // A stated fact names nothing it was measured from.
  const unpinned = await shopReader("en", { verified: false });
  const stated = parseReader(unpinned.text, "en").facts.find(({ origin }) => origin === "stated");
  assert.deepEqual(stated, {
    property: "files-read",
    of: { kind: "edition" },
    value: 3,
    unit: "files",
    origin: "stated",
  });
});

test("a delivery of the page alone names no plate and says that no plate draws a statement", async () => {
  const { text, model } = await shopReader("en", {}, { plates: [], media: ["page"] });
  assert.equal(section(text, model.question)[0], "- view `overview`");
  assert.ok(text.includes("- Also in this delivery: `shop.html`, `manifest.json`\n"));
  assert.match(section(text, "Not covered").join("\n"), /no print edition/u);
  assert.deepEqual(parseReader(text, "en").stated.components.sort(), [
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
    summary: "Orders are taken.\n- component `ghost`: no statement\n## The guide's text",
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
    "Orders are taken. - component `ghost`: no statement ## The guide's text",
  ]);
  assert.deepEqual(section(text, "Scope and limits")[1], "1. No mobile client.");
  assert.ok(text.includes("- component `sync`: Synchronization and convergence · stated · files"));
  assert.ok(text.includes("  - converges: selections and files\n"));
  assert.deepEqual(parseReader(text, "en").stated.components, ["bill", "sync", "store", "audit"]);
  // The data keeps the model's text as it is.
  assert.equal(data.work.summary, model.summary);
});

test("a Chinese work has Chinese headings and sentences, and the keys of every language", async () => {
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
      "- component `store`: 配置库, authority · planned · stated · files `src/store/store.go`\n",
    ),
  );
  assert.ok(zh.text.includes("- relation `sync-store`: sync —持久化→ store · stated · files"));
  assert.ok(zh.text.includes("  - 收敛：选择、文件\n"));
  // The two languages name the same ids and state the same facts.
  assert.deepEqual(parseReader(zh.text, "zh-CN"), parseReader(en.text, "en"));
  assert.ok(zh.bytes.subarray(zh.bytes.length - DRAFT.length).equals(DRAFT));
  // A label of the head ends as the language ends a label; an item's own mark is the same in every language.
  assert.ok(zh.text.includes("- 陈述：components 4 · relations 4 · groups 1 · cited 4"));
  assert.ok(zh.text.includes("- 模型范围排除的路径：\n  - `**/*_test.go`: 测试不属于架构。\n"));
  assert.ok(zh.text.includes("- 按清单核对本交付的文件：`archpub verify <delivery>`\n"));
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
