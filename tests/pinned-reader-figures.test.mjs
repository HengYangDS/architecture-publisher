import assert from "node:assert/strict";
import test from "node:test";
import { guideDiagrams } from "../src/map/guide.mjs";
import { guideText } from "../src/map/guide-text.mjs";
import { readerFormProblems } from "./fixtures/reader-form.mjs";

// The queue item `reader-file`, its second Change: a guide's figure is read in the reader file, its content written
// as text under the line that names it; where the guide's steps walk the figure, the author's words stand with its
// items once.

/** A guide of one panel that shows each figure by its file, then a prose line. */
const guideOf = (/** @type {Array<[string, string]>} */ shown, /** @type {any[]} */ more = []) => ({
  panels: [
    {
      title: "What does it hold?",
      blocks: [
        ...shown.map(([kind, source]) => ({
          type: "diagram",
          id: source,
          diagramType: kind,
          source,
        })),
        ...more,
      ],
    },
  ],
  sources: [{ id: "s1", title: "Notes", path: "notes.md", lines: [1, 2] }],
});

const cited = { path: "src/a.mjs", line: 3, end_line: 9, label: "A" };

const FIGURES = new Map(
  Object.entries({
    "parts.architecture.json": {
      meta: { title: "The parts" },
      components: [
        { id: "a", label: "Front", sublabel: "takes orders", sources: [cited] },
        { id: "b", label: "Store", sublabel: "keeps them" },
      ],
      connections: [{ id: "ab", from: "a", to: "b", label: "writes" }],
      boundaries: [{ kind: "region", label: "One host", wraps: ["a", "b"] }],
    },
    "flow.workflow.json": {
      lanes: [
        { id: "l1", label: "Author" },
        { id: "l2", label: "Reader" },
      ],
      mainPath: ["w1", "w2", "w3"],
      nodes: [
        { id: "w1", label: "Write", lane: "l1" },
        { id: "w2", label: "Build", lane: "l1" },
        { id: "w3", label: "Read", lane: "l2" },
        { id: "w4", label: "Refuse", lane: "l1" },
      ],
      edges: [
        { from: "w1", to: "w2" },
        { from: "w2", to: "w3" },
        { from: "w2", to: "w4", role: "error", label: "fails" },
      ],
    },
    "life.lifecycle.json": {
      mainPath: ["s1", "s2"],
      states: [
        { id: "s1", label: "Open" },
        { id: "s2", label: "Done" },
        { id: "s3", label: "Lost" },
      ],
      transitions: [
        { from: "s1", to: "s2", label: "close" },
        { from: "s1", to: "s3", label: "drop" },
      ],
      cards: [{ title: "Kept", items: ["The log is kept.", "The pin is kept."] }],
    },
    "data.erd.json": {
      entities: [
        {
          id: "o",
          label: "Order",
          attributes: [
            { name: "id", type: "string", key: "pk" },
            { name: "total", type: "number" },
          ],
        },
        { id: "c", label: "Customer", attributes: [{ name: "id", type: "string", key: "pk" }] },
      ],
      relationships: [
        {
          from: "o",
          to: "c",
          label: "placed by",
          fromCardinality: "many",
          toCardinality: "one",
          fromOptional: true,
        },
      ],
    },
    "kinds.class.json": {
      types: [
        {
          id: "t",
          label: "Model",
          sublabel: "the input",
          attributes: [{ name: "id", type: "str" }],
        },
      ],
      relationships: [],
    },
    "files.tree.json": {
      nodes: [
        { id: "r", label: "work/" },
        { id: "m", label: "model.json", parent: "r", sublabel: "the model" },
      ],
    },
    "past.timeline.json": {
      lanes: [{ id: "x", label: "Releases" }],
      events: [
        {
          id: "e",
          at: "2026-11-01T09:30:00+08:00",
          lane: "x",
          title: "v1",
          detail: "first | only",
        },
      ],
    },
    "proof.waterfall.json": {
      meta: { unit: "s" },
      spans: [
        { id: "p", name: "Proof", start: 0, end: 60 },
        { id: "t", name: "Tests", start: 5, end: 50, parent: "p", service: "node" },
      ],
    },
  }),
);

test("each kind of figure is written as text under its line, its title from its file where the draft names none", () => {
  const text = guideText(
    guideOf([
      ["architecture", "parts.architecture.json"],
      ["workflow", "flow.workflow.json"],
      ["lifecycle", "life.lifecycle.json"],
      ["erd", "data.erd.json"],
      ["class", "kinds.class.json"],
      ["tree", "files.tree.json"],
      ["timeline", "past.timeline.json"],
      ["waterfall", "proof.waterfall.json"],
    ]),
    { locale: "en", figures: FIGURES },
  );
  const has = (/** @type {string} */ part) =>
    assert.ok(text.includes(part), `${part}\n---\n${text}`);
  has(
    "*Figure: The parts* (`parts.architecture.json`)\n\n- **Front** [^1]: takes orders\n  - → **Store**: writes\n- **Store**: keeps them",
  );
  has("* *One host* (boundary): Front, Store");
  // The main path in order; a line to the next step that says nothing is the order itself; an error route is said;
  // a node off the path stands apart, unnumbered.
  has(
    "1. **Write** (Lane: Author)\n2. **Build** (Lane: Author)\n   - → **Refuse**: fails\n3. **Read** (Lane: Reader)\n\n*Off the main path*\n\n- **Refuse** (Lane: Author)",
  );
  // A line to the next step that carries a label is said.
  has(
    "1. **Open**\n   - → **Done**: close\n   - → **Lost**: drop\n2. **Done**\n\n*Off the main path*\n\n- **Lost**",
  );
  // A card's items are sentences, each its own item.
  has("* **Kept**\n  - The log is kept.\n  - The pin is kept.");
  has("- **Order**: `id` (string, pk), `total` (number)");
  // A line's note stands beside its ends, before its label.
  has("* **Order** → **Customer** (zero or many to one): placed by");
  has("- **Model**: the input: `id` (str)");
  has("- **work/**\n  - **model.json**: the model");
  has("| Date | Event |\n| --- | --- |\n| 2026-11-01 | **v1**: first \\| only |");
  has(
    "| Span | Within | Start | End |\n| --- | --- | ---: | ---: |\n| Proof | — | 0 s | 60 s |\n| Tests (node) | Proof | 5 s | 50 s |",
  );
  has("[^1]: A: `src/a.mjs` lines 3 to 9");
  assert.deepEqual(readerFormProblems(`# T\n\n## G\n\n${text}`), []);
});

test("steps that walk a figure stand with its items once, in the steps' order, a step's own name as an aside", () => {
  const steps = {
    type: "steps",
    items: [
      {
        text: "Store",
        detail: "Keeps every order.[](source:s1)",
        target: { diagram: "parts.architecture.json", node: "b" },
      },
      {
        text: "Shop front",
        detail: "Takes the order.",
        target: { diagram: "parts.architecture.json", node: "a" },
      },
    ],
  };
  const text = guideText(guideOf([["architecture", "parts.architecture.json"]], [steps]), {
    locale: "en",
    figures: FIGURES,
  });
  assert.ok(
    text.includes(
      "- **Store** (keeps them): Keeps every order. [^1]\n- **Front** (Shop front, takes orders) [^2]: Takes the order.\n  - → **Store**: writes",
    ),
    text,
  );
  assert.equal(text.match(/Keeps every order/gu)?.length, 1, "the step is not written again");
  // Steps that name an item the figure lacks stay as the guide's own list.
  const astray = {
    ...steps,
    items: [
      {
        text: "Gone",
        detail: "Not drawn.",
        target: { diagram: "parts.architecture.json", node: "z" },
      },
    ],
  };
  const apart = guideText(guideOf([["architecture", "parts.architecture.json"]], [astray]), {
    locale: "en",
    figures: FIGURES,
  });
  assert.ok(apart.includes("- **Gone**: Not drawn."), apart);
});

test("an inline sequence is numbered by its phases, a reply said; Chinese takes its own marks", () => {
  const sequence = {
    type: "diagram",
    id: "turn",
    diagramType: "sequence",
    nodeSources: { b: "s1" },
    spec: {
      meta: { title: "A turn" },
      participants: [
        { id: "a", label: "Client" },
        { id: "b", label: "Server" },
      ],
      messages: [
        { from: "a", to: "b", label: "ask", y: 160 },
        { from: "b", to: "a", label: "answer", variant: "return", y: 208 },
      ],
      segments: [{ from: 150, to: 220, label: "Ask" }],
    },
  };
  const en = guideText(
    { panels: [{ title: "T", blocks: [sequence] }], sources: [] },
    { locale: "en" },
  );
  assert.ok(
    en.includes(
      "*Figure: A turn*\n\n*Ask*\n\n1. **Client** → **Server**: ask\n2. **Server** → **Client** (reply): answer",
    ),
    en,
  );
  const zh = guideText(guideOf([["erd", "data.erd.json"]]), { locale: "zh-CN", figures: FIGURES });
  assert.ok(zh.includes("- **Order**：`id`（string、pk）、`total`（number）"), zh);
  assert.ok(zh.includes("**Order** → **Customer**（零或多对一）：placed by"), zh);
});

test("a document the writers cannot read leaves the figure's line alone, and odd parts are read as far as they go", () => {
  const odd = new Map(
    Object.entries({
      "a.architecture.json": { components: { a: 1 } },
      "b.architecture.json": { components: [null, { id: "x", label: "X*" }], connections: "x" },
      "c.lifecycle.json": {
        states: [{ id: "s", label: "S" }],
        mainPath: "s",
        cards: [{ title: "T", items: "abc" }],
      },
      "d.erd.json": {
        entities: [
          { id: "e", label: "E", attributes: { x: 1 } },
          { id: "f", label: "F", attributes: [null, { type: "t" }] },
        ],
      },
      "e.waterfall.json": { spans: [{ id: "p", name: "P" }] },
      "f.tree.json": {
        nodes: [
          { id: "a", label: "A", parent: "b" },
          { id: "b", label: "B", parent: "a" },
        ],
      },
      "g.workflow.json": {
        nodes: [
          { id: "n", label: "N" },
          { id: "n", label: "Again" },
        ],
        edges: [{ from: "gone", to: "n", label: "feeds" }],
      },
    }),
  );
  const text = guideText(
    guideOf([
      ["architecture", "a.architecture.json"],
      ["architecture", "b.architecture.json"],
      ["lifecycle", "c.lifecycle.json"],
      ["erd", "d.erd.json"],
      ["waterfall", "e.waterfall.json"],
      ["tree", "f.tree.json"],
      ["workflow", "g.workflow.json"],
    ]),
    { locale: "en", figures: odd },
  );
  const has = (/** @type {string} */ part) =>
    assert.ok(text.includes(part), `${part}\n---\n${text}`);
  has("*Figure* (`a.architecture.json`)\n\n*Figure* (`b.architecture.json`)");
  has("**X\\***");
  has("- **S**");
  has("**E**");
  has("| P |  |  |");
  // A cycle of parents has no root: its nodes stand at the top.
  has("- **A**\n  - **B**");
  // An item whose id repeats is left out; a line from an item no list names is written from its id.
  assert.ok(!text.includes("Again"), text);
  has("`gone` → **N**: feeds");
  assert.doesNotMatch(text, /undefined/u);
  assert.deepEqual(readerFormProblems(`# T\n\n## G\n\n${text}`), []);
});

test("the guide's diagram documents are read by file name, and one that does not read as an object is left out", () => {
  const entry = (/** @type {string} */ name, /** @type {string} */ text) => ({
    name,
    bytes: Buffer.from(text),
  });
  const read = guideDiagrams([
    entry("guide.archify.md", "# A {#a}\n"),
    entry("parts.architecture.json", '{"components": []}'),
    entry("broken.tree.json", "{"),
    entry("list.tree.json", "[]"),
    entry("notes.json", '{"x": 1}'),
  ]);
  assert.deepEqual([...read.keys()], ["parts.architecture.json"]);
});

test("steps walk a figure by its block's id, which need not be its file's name; Chinese takes its words", () => {
  const panel = {
    title: "P",
    blocks: [
      { type: "diagram", id: "life-map", diagramType: "lifecycle", source: "life.lifecycle.json" },
      {
        type: "steps",
        items: [
          { text: "Done", detail: "It ends.", target: { diagram: "life-map", node: "s2" } },
          { text: "Open", detail: "It starts.", target: { diagram: "life-map", node: "s1" } },
        ],
      },
    ],
  };
  const zh = guideText({ panels: [panel], sources: [] }, { locale: "zh-CN", figures: FIGURES });
  assert.ok(
    zh.includes(
      "1. **Done**：It ends.\n2. **Open**：It starts.\n   - → **Done**：close\n   - → **Lost**：drop\n3. **Lost**",
    ),
    zh,
  );
  assert.ok(zh.includes("- **Kept**\n  - The log is kept."), zh);
  assert.equal(zh.match(/It ends/gu)?.length, 1);
  const types = new Map([
    [
      "k.class.json",
      {
        types: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        relationships: [{ from: "a", to: "b", kind: "composition", label: "holds" }],
      },
    ],
  ]);
  const zhClass = guideText(guideOf([["class", "k.class.json"]]), {
    locale: "zh-CN",
    figures: types,
  });
  assert.ok(zhClass.includes("**A** → **B**（组合关系）：holds"), zhClass);
});
