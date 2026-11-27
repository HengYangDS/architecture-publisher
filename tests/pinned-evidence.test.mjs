import assert from "node:assert/strict";
import test from "node:test";
import FORMAT from "../src/pinned/data.schema.json" with { type: "json" };
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { formatProblems } from "./fixtures/data-format.mjs";
import { CITATIONS, READ, bindingOf, sha256, shopModel } from "./fixtures/pinned.mjs";

const rowOf = (table, path) => table.find((row) => row.path === path);

test("a file a part owns, a relation cites and the guide cites stands once, with all three", () => {
  const { records } = bindingOf(shopModel());
  const table = evidenceTable({ records, citations: CITATIONS, read: READ });
  assert.deepEqual(
    table.map(({ path }) => path),
    ["README.md", "src/store/store.go", "src/sync/a.go", "src/sync/b.go"],
  );
  const row = rowOf(table, "src/store/store.go");
  assert.deepEqual(row, {
    path: "src/store/store.go",
    state: "verified",
    sha256: sha256("src/store/store.go"),
    bytes: 1000,
    changed: "2026-11-07",
    owner: "store",
    relations: ["sync-store", "bill-store"],
    ranges: [
      { lines: [10, 20], where: "@source store-commit" },
      // A citation of the whole file names no lines.
      { where: "parts.architecture.json/components/1/sources/0" },
    ],
  });
  // The keys stand in one order, the data's schema's, so two builds write the same bytes.
  assert.deepEqual(Object.keys(row), Object.keys(FORMAT.$defs.evidenceRow.properties));
  assert.deepEqual(formatProblems(table, "/properties/evidence"), []);
  assert.deepEqual(Object.keys(row.ranges[0]), ["lines", "where"]);
  // A file no citation of the guide names holds an empty list of ranges.
  assert.deepEqual(rowOf(table, "src/sync/b.go").ranges, []);
});

test("a file only the guide cites is read at the pin, has no owner and joins no record of the binding", () => {
  const { records } = bindingOf(shopModel());
  const before = structuredClone(records);
  const table = evidenceTable({ records, citations: CITATIONS, read: READ });
  assert.deepEqual(rowOf(table, "README.md"), {
    path: "README.md",
    state: "verified",
    sha256: sha256("README.md"),
    bytes: 120,
    changed: "2026-11-01",
    relations: [],
    ranges: [
      { lines: [3, 6], where: "@source readme-what" },
      { lines: [1, 1], where: "parts.architecture.json/components/2/sources/0" },
    ],
  });
  // The files the edition says were read are the binding's records, as they were.
  assert.deepEqual(records, before);
  assert.equal(records.length, 3);
});

test("a path the guide cites that the build did not read at the pin is unverified, beside verified rows", () => {
  const { records } = bindingOf(shopModel());
  const table = evidenceTable({ records, citations: CITATIONS, read: new Map() });
  assert.deepEqual(rowOf(table, "README.md"), {
    path: "README.md",
    state: "unverified",
    relations: [],
    ranges: [
      { lines: [3, 6], where: "@source readme-what" },
      { lines: [1, 1], where: "parts.architecture.json/components/2/sources/0" },
    ],
  });
  assert.equal(rowOf(table, "src/sync/a.go").state, "verified");
});

test("without a checkout every row is unverified and holds no digest, size or date", () => {
  const { records } = bindingOf(shopModel(), false);
  const table = evidenceTable({ records, citations: CITATIONS });
  assert.deepEqual(
    table.map(({ path }) => path),
    ["README.md", "src/store/store.go", "src/sync/", "src/sync/a.go"],
  );
  for (const row of table) {
    assert.equal(row.state, "unverified", row.path);
    for (const key of ["sha256", "bytes", "changed"])
      assert.ok(!(key in row), `${row.path} ${key}`);
  }
  // What the model declares stays: the claim's owner and the relations that cite a path.
  assert.deepEqual(rowOf(table, "src/sync/"), {
    path: "src/sync/",
    state: "unverified",
    owner: "sync",
    relations: [],
    ranges: [],
  });
  assert.deepEqual(rowOf(table, "src/store/store.go").relations, ["sync-store", "bill-store"]);
});

test("a model that names no file, without a guide, has an empty table", () => {
  assert.deepEqual(evidenceTable({ records: [] }), []);
});

test("the table is in path order whatever order its sources come in, and changes none of them", () => {
  const { records } = bindingOf(shopModel());
  const reversed = [...records].reverse();
  const citations = [...CITATIONS].reverse();
  const frozen = structuredClone(citations);
  const table = evidenceTable({ records: reversed, citations, read: READ });
  assert.deepEqual(
    table.map(({ path }) => path),
    ["README.md", "src/store/store.go", "src/sync/a.go", "src/sync/b.go"],
  );
  assert.deepEqual(citations, frozen);
  // The ranges of one path stand in the order the guide cites them.
  assert.deepEqual(
    rowOf(table, "README.md").ranges.map(({ where }) => where),
    ["parts.architecture.json/components/2/sources/0", "@source readme-what"],
  );
});
