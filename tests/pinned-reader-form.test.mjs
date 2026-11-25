import assert from "node:assert/strict";
import test from "node:test";
import { readerWordsOf } from "../src/reader-words.mjs";
import { editionData, serializeData } from "../src/pinned/data.mjs";
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { readerFile } from "../src/pinned/reader.mjs";
import { blockTitles } from "../src/map/guide.mjs";
import { parsedGuide } from "../src/map/guide-parse.mjs";
import { guideText } from "../src/map/guide-text.mjs";
import { CITATIONS, GUIDE, READ, sha256, shopBuild } from "./fixtures/pinned.mjs";
import { readerFormProblems } from "./fixtures/reader-form.mjs";

// The queue item `reader-file`: the reader file reads as a document in the model's language, rendered as a Markdown
// viewer renders it: one title, no line or mark of the guide's syntax, no link without text, and no word of the
// keys a reader file wrote before it spoke the model's language, outside its code.

const KEYS = [
  "stated",
  "measured",
  "component",
  "relation",
  "files",
  "members",
  "cited",
  "unchecked",
  "uncited",
  "version",
  "bytes",
  "state",
  "date",
  "release",
];

/** Archify's parse of a guide, by hand: an answer, a panel of prose, a flow of steps, a comparison and a callout. */
const PARSED = {
  meta: { title: "How does the shop take an order?" },
  answer: {
    scope: "Shop v1 · commit abc1234",
    summary: "The shop takes an order.[](source:readme-what)[](source:store-commit)",
    reasons: ["[Orders are stored](block:p-core).[](source:store-commit)"],
  },
  panels: [
    {
      id: "p-core",
      title: "How does an order reach the store?",
      blocks: [
        { type: "prose", text: "The client asks.[](source:store-commit)[](source:readme-what)" },
        { type: "facts", entries: [{ key: "Limit", value: "none" }] },
        {
          type: "diagram",
          id: "core-map",
          diagramType: "architecture",
          source: "core.architecture.json",
        },
        {
          type: "steps",
          items: [{ text: "Client", detail: "Asks.", target: { diagram: "core-map" } }],
        },
        { type: "diagram", id: "flow", diagramType: "workflow", source: null },
        {
          type: "steps",
          items: [
            {
              text: "Ask",
              detail: "One request.[](source:store-commit)",
              target: { diagram: "flow" },
            },
          ],
        },
        {
          type: "comparison",
          labelColumn: "Way",
          columns: ["What", "Result"],
          rows: [
            { label: "Queue", cells: [{ text: "Orders" }, { text: "kept", verdict: "Good" }] },
            {
              label: "Drop",
              cells: [
                { text: "Orders" },
                { text: "Rejected", verdict: "Rejected", assessment: "bad" },
              ],
            },
          ],
        },
        { type: "callout", title: "Note", text: "Orders are kept.[](source:store-commit)" },
        { type: "callout", level: "warning", title: "Two lines", text: "First.\nSecond." },
        { type: "snippet", language: "sh", title: "Run it", text: "npm test ```" },
        { type: "chart", title: "Counts", text: 'pie\n  "a": 1' },
        { type: "image", path: "shot.png", alt: "A screen" },
        { type: "metric", label: "Latency", value: 12, unit: "ms", limit: 20, note: "p50" },
        { type: "list", ordered: true, items: ["One", "Two"] },
        { type: "code", source: "store-commit" },
      ],
    },
  ],
  sources: [
    { id: "readme-what", title: "What it is", path: "README.md", lines: [3, 6] },
    { id: "store-commit", title: "Commit", path: "src/store/store.go", lines: [10, 20] },
  ],
};

async function shopText(locale) {
  const built = await shopBuild(locale);
  const evidence = evidenceTable({
    records: built.binding.records,
    citations: CITATIONS,
    read: READ,
  });
  const data = editionData({ ...built.input, evidence, guide: GUIDE });
  const guide = guideText(PARSED, {
    locale,
    titles: new Map([["core-map", "The core"]]),
    repository: { name: "shop", revision: "f".repeat(40) },
  });
  const text = readerFile(data, { sha256: sha256(serializeData(data)), guide }).toString("utf8");
  return { text, words: readerWordsOf(locale) };
}

test("a reader file renders as one document in its language, in every language", async () => {
  for (const locale of ["en", "zh-CN", "zh-TW", "es", "ko"]) {
    const { text } = await shopText(locale);
    const foreign = locale === "en" ? [] : KEYS.filter((key) => key !== "bytes" || locale !== "es");
    assert.deepEqual(readerFormProblems(text, { foreign }), [], locale);
  }
});

test("the guide's part is prose with footnotes in ascending order, its figures named, a flow's steps numbered", async () => {
  const { text } = await shopText("en");
  const part = text.slice(text.indexOf("\n## The guide\n"));
  assert.ok(part.includes("The shop takes an order. [^1][^2]"));
  assert.ok(part.includes("- Orders are stored. [^2]"));
  assert.ok(part.includes("### How does an order reach the store?\n\nThe client asks. [^1][^2]"));
  assert.ok(part.includes("- **Limit**: none"));
  assert.ok(part.includes("*Figure: The core* (`core.architecture.json`)"));
  assert.ok(part.includes("- **Client**: Asks.") && part.includes("1. **Ask**: One request. [^2]"));
  assert.ok(part.includes("| Queue | Orders | kept (Good) |"));
  // A cell that is its verdict alone says it once, with its tone.
  assert.ok(part.includes("| Drop | Orders | Rejected (bad) |"));
  assert.ok(part.includes("> **Note**\n>\n> Orders are kept. [^2]"));
  assert.ok(part.includes("> **Warning: Two lines**\n>\n> First.\n>\n> Second."));
  // A fence longer than the text's own backticks; a Mermaid chart keeps its text; an image and a metric by name.
  assert.ok(part.includes("*Run it*\n\n````sh\nnpm test ```\n````"));
  assert.ok(part.includes("*Figure: Counts*\n\n```mermaid\npie"));
  assert.ok(part.includes("*Figure: A screen* (`shot.png`)"));
  assert.ok(part.includes("- **Latency**: 12 ms; limit 20 ms (p50)"));
  assert.ok(part.includes("1. One\n2. Two"));
  assert.ok(
    part.includes("**How does the shop take an order?**\n\n*Shop v1 · commit abc1234*\n\n"),
  );
  assert.ok(part.includes("*Code excerpt* (`src/store/store.go` lines 10 to 20) [^2]"));
  assert.ok(
    part
      .trimEnd()
      .endsWith(
        "The sources' lines are those of `shop` at `" +
          "f".repeat(40) +
          "`.\n\n[^1]: What it is: `README.md` lines 3 to 6\n[^2]: Commit: `src/store/store.go` lines 10 to 20",
      ),
  );
});

test("each rule of the rendered form is refused where it is broken", () => {
  const broken = [
    "# A",
    "## A",
    "#### A",
    "",
    "@source a",
    "The {#guide} mark.",
    "An [](source:x) link.",
    "It is stated.",
    "`stated` is code.",
  ].join("\n");
  assert.deepEqual(readerFormProblems(broken, { foreign: ["stated"] }), [
    "line 3 skips a heading level",
    "line 5 is a line of the guide's syntax",
    "line 6 holds a mark of the guide's syntax",
    "line 7 holds a link without text",
    'line 8 holds the word "stated"',
  ]);
});

test("a citation of any script or with its own words is a footnote, and a link into the page keeps its text", () => {
  const text = guideText(
    {
      answer: {
        summary:
          "Read [the notes](source:2024-notes) and [](source:说明)[](source:2024-notes). See [the map](node:x) and [here](#p-a).",
      },
      panels: [{ title: "**Bold** [x](source:说明)", blocks: [] }],
      sources: [
        { id: "2024-notes", path: "notes.md" },
        { id: "说明", path: "readme.md" },
      ],
    },
    { locale: "en" },
  );
  assert.ok(text.includes("Read the notes [^1] and [^1][^2]. See the map and here."), text);
  assert.ok(text.includes("### **Bold** x [^2]"), text);
  assert.deepEqual(readerFormProblems(`# T\n\n## G\n\n${text}`), []);
});

test("a directive's title in single quotes or with a backslash is read as Archify reads it", () => {
  const titles = blockTitles(
    [
      "@diagram architecture id=a title='Single quoted' source=x.json",
      '@callout level=note id=c title="Use \\d+ here"',
      "  @diagram tree id=d title='It\\'s \\\"so\\\"' source=z.json",
      '@diagram tree id=b title="Say \\"hi\\" now" source=y.json',
    ].join("\n"),
  );
  assert.deepEqual(
    [...titles],
    [
      ["a", "Single quoted"],
      ["c", "Use \\d+ here"],
      // The review of the Change (2026-11-25): an indented directive is Archify's too, and a backslash escapes
      // only the quote that opened the value.
      ["d", 'It\'s \\"so\\"'],
      ["b", 'Say "hi" now'],
    ],
  );
});

test("a draft Archify's parser refuses is refused with its line and its fix", async () => {
  await assert.rejects(parsedGuide("@meta locale=en\n"), (error) => {
    assert.equal(error.code, "guide_unparsed");
    assert.ok(error.problems.length > 0);
    assert.ok(error.problems.every(({ path }) => /^guide:\d+$/u.test(path)));
    assert.ok(error.problems.some(({ message }) => /panel/u.test(message)));
    return true;
  });
  const parsed = await parsedGuide(
    "# A question? {#q}\n\nAn answer.\n\n## A panel? {#p-a}\n\nProse.\n",
  );
  assert.equal(parsed.panels.length, 1);
});

test("two lists that follow each other stay two, a checklist keeps its boxes, and a cited verdict is said once", () => {
  // The second review of the Change (2026-11-25): a viewer joined facts and a checklist into one list, dropped the
  // boxes, and printed a verdict that a citation followed twice.
  const parsed = {
    answer: { summary: "[](source:s1) Queue the orders." },
    panels: [
      {
        title: "How do they compare?",
        blocks: [
          { type: "facts", entries: [{ key: "`__init__.py`", value: "none" }] },
          { type: "list", ordered: false, checklist: true, items: ["Run `ethos status`", "Read"] },
          { type: "metric", label: "Latency", value: 12, unit: "ms", limit: 20 },
          { type: "metric", label: "Errors" },
          { type: "list", ordered: true, items: ["One"] },
          { type: "list", ordered: true, items: ["Two"] },
          { type: "callout", level: "open-question", title: "Why?", text: "Unknown." },
          {
            type: "comparison",
            labelColumn: "Way",
            columns: ["Result"],
            rows: [
              {
                label: "Drop",
                cells: [{ text: "Rejected[](source:s1)", assessment: "bad", verdict: "Rejected" }],
              },
              { label: "Keep", cells: [{ text: "[](source:s1)", assessment: "good" }] },
            ],
          },
        ],
      },
    ],
    sources: [{ id: "s1", title: "Notes", path: "notes.md" }],
  };
  const en = guideText(parsed, { locale: "en" });
  assert.ok(en.startsWith("[^1] Queue the orders."), en);
  assert.ok(
    en.includes("- **`__init__.py`**: none\n\n* [ ] Run `ethos status`\n* [ ] Read\n\n"),
    en,
  );
  assert.ok(
    en.includes("- **Latency**: 12 ms; limit 20 ms\n\n* **Errors**\n\n1. One\n\n1) Two"),
    en,
  );
  assert.ok(en.includes("> **Open question: Why?**"), en);
  assert.ok(en.includes("| Drop | Rejected [^1] (bad) |\n| Keep | [^1] (good) |"), en);
  assert.deepEqual(readerFormProblems(`# T\n\n## G\n\n${en}`), []);
  const zh = guideText(parsed, { locale: "zh-CN" });
  assert.ok(zh.includes("| Drop | Rejected[^1]（欠佳） |\n| Keep | [^1]（良好） |"), zh);
  assert.ok(zh.includes("- **Latency**：12 ms；上限 20 ms"), zh);
  assert.ok(zh.includes("> **待解问题：Why?**"), zh);
  assert.deepEqual(readerFormProblems("# T\n\n- a\n\n- b\n\n1. c\n\n1) d\n\n2) e"), [
    "line 5 joins the list before it",
    "line 11 joins the list before it",
  ]);
});
