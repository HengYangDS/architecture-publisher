import assert from "node:assert/strict";
import test from "node:test";
import { drawnEntries } from "../src/map/guide-figures.mjs";
import { gridCells } from "../src/map/guide-grid.mjs";

// The queue item `page-figures`: a guide's entity-relationship and class diagrams, which Archify does not lay out,
// take the publisher's grid. A domain (an entity's tag) fills a solid rectangle of cells, as Archify requires.

const entry = (name, value) => ({
  name,
  bytes: Buffer.from(`${JSON.stringify(value, null, 2)}\n`),
});

test("a domain fills one run of one row, or full rows where the columns divide it, and else no candidate", () => {
  const order = ["a1", "x", "a2", "b1", "b2", "b3", "y"];
  const tagOf = new Map([
    ["a1", "A"],
    ["a2", "A"],
    ["b1", "B"],
    ["b2", "B"],
    ["b3", "B"],
  ]);
  assert.deepEqual(Object.fromEntries(gridCells(order, tagOf, 3) ?? []), {
    a1: [0, 0],
    a2: [0, 1],
    x: [0, 2],
    b1: [1, 0],
    b2: [1, 1],
    b3: [1, 2],
    y: [2, 0],
  });
  const four = new Map(["p", "q", "r", "s"].map((id) => [id, "D"]));
  assert.equal(
    gridCells(["p", "q", "r", "s"], four, 3),
    null,
    "four members cannot fill three columns",
  );
  assert.deepEqual(Object.fromEntries(gridCells(["p", "q", "r", "s"], four, 2) ?? []), {
    p: [0, 0],
    q: [0, 1],
    r: [1, 0],
    s: [1, 1],
  });
});

/** A small entity-relationship diagram that places nothing: two entities of one file, a third apart, a source. */
const records = () => ({
  schema_version: 1,
  diagram_type: "erd",
  meta: { title: "Records", output: "records.html", locale: "en" },
  entities: [
    {
      id: "order",
      label: "Order",
      tag: "orders.toml",
      attributes: [{ name: "id", type: "string", key: "pk" }],
      sources: [{ path: "src/main.mjs", line: 1, label: "Order" }],
    },
    {
      id: "line",
      label: "Order line",
      tag: "orders.toml",
      attributes: [
        { name: "id", type: "string", key: "pk" },
        { name: "order", type: "string", key: "fk", references: "order.id" },
      ],
    },
    { id: "customer", label: "Customer", attributes: [{ name: "id", type: "string", key: "pk" }] },
  ],
  relationships: [
    {
      id: "holds",
      from: "order",
      to: "line",
      label: "holds",
      fromCardinality: "one",
      toCardinality: "many",
    },
    {
      id: "places",
      from: "customer",
      to: "order",
      label: "places",
      fromCardinality: "one",
      toCardinality: "many",
    },
  ],
});

test("a guide's entity-relationship file that places nothing takes the publisher's grid, its sources kept", async () => {
  const author = records();
  const [drawn] = await drawnEntries([entry("records.erd.json", author)], "showcase");
  const laidOut = JSON.parse(drawn.bytes.toString("utf8"));
  assert.deepEqual(laidOut.layout, { mode: "grid" });
  for (const [index, entity] of laidOut.entities.entries()) {
    assert.ok(Number.isInteger(entity.row) && Number.isInteger(entity.col), entity.id);
    const stated = { ...entity };
    delete stated.row;
    delete stated.col;
    assert.deepEqual(stated, author.entities[index]);
  }
  const [order, line] = laidOut.entities;
  assert.equal(order.row, line.row, "the domain's two members share a row");
  assert.equal(Math.abs(order.col - line.col), 1, "side by side");
});

test("a guide's entity-relationship file that places its entities is drawn as written", async () => {
  const placed = records();
  placed.entities.forEach((entity, index) => Object.assign(entity, { row: 0, col: index }));
  const authored = entry("records.erd.json", placed);
  const [drawn] = await drawnEntries([authored], "showcase");
  assert.deepEqual(drawn.bytes, authored.bytes);
});

/** A class diagram that places nothing: a record composed of two parts. */
const kernel = () => ({
  schema_version: 1,
  diagram_type: "class",
  meta: { title: "Kernel", output: "kernel.html", locale: "en" },
  types: [
    {
      id: "model",
      label: "model.json",
      kind: "record",
      attributes: [{ name: "id", type: "string" }],
    },
    {
      id: "parts",
      label: "Parts",
      kind: "record",
      attributes: [{ name: "label", type: "string" }],
    },
    {
      id: "views",
      label: "Views",
      kind: "record",
      attributes: [{ name: "question", type: "string" }],
    },
  ],
  relationships: [
    { id: "holds-parts", from: "model", to: "parts", kind: "composition", label: "one or more" },
    { id: "holds-views", from: "model", to: "views", kind: "composition", label: "one or more" },
  ],
});

test("a guide's class file that places nothing takes the grid, and one that places its types is drawn as written", async () => {
  const [drawn] = await drawnEntries([entry("kernel.class.json", kernel())], "showcase");
  const laidOut = JSON.parse(drawn.bytes.toString("utf8"));
  assert.deepEqual(laidOut.layout, { mode: "grid" });
  const cells = laidOut.types.map(({ row, col }) => `${row}:${col}`);
  assert.equal(new Set(cells).size, 3, `three cells: ${cells}`);
  const placed = kernel();
  placed.types.forEach((type, index) => Object.assign(type, { row: 0, col: index }));
  const authored = entry("kernel.class.json", placed);
  const [kept] = await drawnEntries([authored], "showcase");
  assert.deepEqual(kept.bytes, authored.bytes);
});

test("a domain that no column count from two to four can hold is refused before Archify is asked", async () => {
  const author = records();
  const five = Array.from({ length: 5 }, (_, index) => ({
    id: `file-${index}`,
    label: `File ${index}`,
    tag: "five.toml",
    attributes: [{ name: "id", type: "string", key: "pk" }],
  }));
  author.entities.push(...five);
  await assert.rejects(drawnEntries([entry("records.erd.json", author)], "showcase"), (error) => {
    assert.equal(error.code, "page_diagram_unplaceable");
    assert.match(error.message, /records\.erd\.json/u);
    assert.deepEqual(
      error.problems.map(({ message }) => message),
      ['domain "orders.toml"', 'domain "five.toml"'],
    );
    return true;
  });
});
