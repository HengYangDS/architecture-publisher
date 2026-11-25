import assert from "node:assert/strict";
import test from "node:test";
import { drawnEntries } from "../src/map/guide-figures.mjs";
import { rowCandidates, sequenceLayout, stageOrder } from "../src/map/guide-rows.mjs";

// The queue item `page-figures`: a guide's dataflow takes the publisher's rows and a guide's sequence the publisher's
// heights, which Archify draws only where they are set.

const entry = (name, value) => ({
  name,
  bytes: Buffer.from(`${JSON.stringify(value, null, 2)}\n`),
});

const call = (from, to) => ({ from, to, label: `${from} to ${to}` });

/** Archify's own drilldown example, without its rows: a request through an edge to an API, then a cache and a store. */
const drilldown = () => ({
  schema_version: 1,
  diagram_type: "dataflow",
  meta: { title: "Drilldown", output: "drilldown.html", locale: "en" },
  stages: [{ label: "Client" }, { label: "Edge" }, { label: "API" }, { label: "Data" }],
  nodes: [
    { id: "client", type: "frontend", label: "Client", stage: 0 },
    { id: "edge", type: "backend", label: "Edge", stage: 1 },
    { id: "api", type: "backend", label: "API", stage: 2 },
    { id: "cache", type: "database", label: "Cache", stage: 3 },
    { id: "db", type: "database", label: "Store", stage: 3 },
  ],
  flows: [call("client", "edge"), call("edge", "api"), call("api", "cache"), call("api", "db")],
});

test("a stage's nodes follow their neighbours, and each stage takes one of the authors' row patterns", () => {
  const nodes = [
    { id: "a", stage: 0 },
    { id: "b", stage: 0 },
    { id: "x", stage: 1 },
    { id: "y", stage: 1 },
  ];
  // x is fed by b and y by a: the second stage is ordered y before x, beside their sources.
  const order = stageOrder(nodes, [call("b", "x"), call("a", "y")]);
  assert.deepEqual(Object.fromEntries(order), { 0: ["a", "b"], 1: ["y", "x"] });
  const candidates = rowCandidates(order);
  assert.equal(candidates.length, 16, "four patterns for each stage of two");
  assert.deepEqual(Object.fromEntries(candidates[0]), { a: 0, b: 2, y: 0, x: 2 });
  assert.deepEqual(
    Object.fromEntries(candidates[1]),
    { a: 0, b: 2, y: 1, x: 3 },
    "the later stage varies first",
  );
  const alone = rowCandidates(new Map([[0, ["only"]]]));
  assert.deepEqual(
    alone.map((rows) => rows.get("only")),
    [2, 1],
    "a node alone takes the middle row first",
  );
});

test("the candidates vary every stage before any strays far from its preferred pattern", () => {
  // The review of the Change (2026-11-25): a cut of the candidates' product left the first stages unvaried.
  const order = new Map([0, 1, 2, 3, 4].map((stage) => [stage, [`a${stage}`, `b${stage}`]]));
  const candidates = rowCandidates(order);
  assert.equal(candidates.length, 64);
  for (const stage of [0, 1, 2, 3, 4])
    assert.equal(
      new Set(candidates.map((rows) => `${rows.get(`a${stage}`)} ${rows.get(`b${stage}`)}`)).size,
      4,
      `stage ${stage}`,
    );
  assert.deepEqual(rowCandidates(new Map([[0, ["a", "b", "c", "d", "e", "f"]]])), []);
  assert.deepEqual(rowCandidates(new Map()), []);
  // By their distance from the preferred patterns: two stages of two nodes, four patterns each.
  const two = ["0 2", "1 3", "0 4", "2 4"];
  const index = (rows, first, second) => two.indexOf(`${rows.get(first)} ${rows.get(second)}`);
  const pairs = rowCandidates(
    new Map([
      [0, ["a", "b"]],
      [1, ["x", "y"]],
    ]),
  );
  assert.deepEqual(
    pairs.map((rows) => index(rows, "a", "b") + index(rows, "x", "y")),
    [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 6],
  );
  assert.equal(
    new Set(pairs.map((rows) => JSON.stringify([...rows]))).size,
    pairs.length,
    "no candidate twice",
  );
});

test("a sequence's messages stand at the publisher's heights, its other fields as written", () => {
  const author = {
    schema_version: 1,
    diagram_type: "sequence",
    meta: { title: "Turn", output: "turn.html", locale: "en" },
    participants: [
      { id: "a", type: "frontend", label: "A" },
      { id: "b", type: "backend", label: "B" },
    ],
    messages: [
      { from: "a", to: "b", label: "ask", note: "first" },
      { from: "b", to: "a", label: "answer", variant: "return" },
    ],
  };
  const laid = sequenceLayout(author);
  assert.deepEqual(
    laid.messages.map(({ y }) => y),
    [160, 208],
  );
  assert.deepEqual(
    laid.messages.map((message) => {
      const stated = { ...message };
      delete stated.y;
      return stated;
    }),
    author.messages,
  );
});

test("a dataflow that sets rows, a sequence that sets heights or spans them, and a crowded stage are refused", async () => {
  const placed = drilldown();
  placed.nodes[0].row = 1;
  const spanned = {
    diagram_type: "sequence",
    messages: [{ from: "a", to: "b", label: "ask", y: 160 }],
    segments: [{ from: 140, to: 180, label: "Ask" }],
  };
  await assert.rejects(
    drawnEntries(
      [entry("flow.dataflow.json", placed), entry("turn.sequence.json", spanned)],
      "showcase",
    ),
    (error) => {
      assert.equal(error.code, "page_diagram_publisher_field");
      assert.deepEqual(
        error.problems.map(({ path }) => path),
        [
          "flow.dataflow.json/nodes/0/row",
          "turn.sequence.json/segments",
          "turn.sequence.json/messages/0/y",
        ],
      );
      return true;
    },
  );
  const crowded = drilldown();
  crowded.nodes.push(
    ...["d1", "d2", "d3", "d4"].map((id) => ({ id, type: "database", label: id, stage: 3 })),
  );
  await assert.rejects(drawnEntries([entry("flow.dataflow.json", crowded)], "showcase"), {
    code: "page_dataflow_too_tall",
  });
  for (const odd of [
    entry("flow.dataflow.json", { ...drilldown(), nodes: [null, 1] }),
    entry("flow.dataflow.json", {
      ...drilldown(),
      nodes: drilldown().nodes.map((n) => ({ ...n, stage: "1" })),
    }),
    entry("turn.sequence.json", { diagram_type: "sequence", messages: "none" }),
  ]) {
    const [kept] = await drawnEntries([odd], "showcase");
    assert.deepEqual(kept.bytes, odd.bytes, "a file Archify judges reaches it as written");
  }
});

test("a guide's dataflow that sets no row takes the publisher's rows, and passes", async () => {
  const author = drilldown();
  const [drawn] = await drawnEntries([entry("flow.dataflow.json", author)], "showcase");
  const laid = JSON.parse(drawn.bytes.toString("utf8"));
  for (const [index, node] of laid.nodes.entries()) {
    assert.ok(Number.isInteger(node.row) && node.row >= 0 && node.row <= 4, node.id);
    const stated = { ...node };
    delete stated.row;
    assert.deepEqual(stated, author.nodes[index]);
  }
  const [cache, db] = laid.nodes.slice(3);
  assert.notEqual(cache.row, db.row, "two nodes of one stage in two rows");
});
