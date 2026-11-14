import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { BROKEN, TABLE, assertOneMeaning, heavier, rounded } from "./fixtures/line-tables.mjs";
import { platesIn, stripModel, stripStyle, wiresOf } from "./fixtures/strips.mjs";

// The table of line values: its rows, and that a plate draws its lines from it alone.

test("the table holds the rows the trials admitted and no other, each with what it means and answers", () => {
  assert.deepEqual(Object.keys(TABLE.rows), [
    "relation",
    "emphasis",
    "boundary",
    "citations",
    "planned",
    "retired",
  ]);
  for (const [id, row] of Object.entries(TABLE.rows)) {
    assert.ok(["weight", "pattern", "number"].includes(row.channel), id);
    assert.ok(row.meaning.length > 0, id);
    assert.match(row.question, /\?$/u, id);
    assert.equal(typeof row.tested, "boolean", id);
    // What the page does for the row, or null where it has no expression of it.
    assert.ok(row.page === null || row.page.length > 0, id);
    assert.ok(row.key === null || row.key.length > 0, id);
  }
  const { relation, emphasis, boundary, citations, planned, retired } = TABLE.rows;
  assert.deepEqual([relation.channel, relation.stroke], ["weight", 1.6]);
  assert.deepEqual([emphasis.channel, emphasis.factor, emphasis.arrow], ["weight", 2, 1.45]);
  assert.deepEqual([boundary.channel, boundary.stroke, boundary.dash], ["pattern", 1.4, [8, 5]]);
  assert.equal(citations.channel, "number");
  assert.deepEqual([planned.channel, planned.dash], ["pattern", [6, 4]]);
  assert.deepEqual([retired.channel, retired.dash], ["pattern", [1.5, 3.5]]);
  // The lifecycle patterns are the rows no work has tested.
  assert.deepEqual(
    Object.keys(TABLE.rows).filter((id) => !TABLE.rows[id].tested),
    ["planned", "retired"],
  );
  // The page has no expression of emphasis or of the count.
  assert.deepEqual(
    Object.keys(TABLE.rows).filter((id) => TABLE.rows[id].page === null),
    ["emphasis", "citations"],
  );
});

test("the table names the three image widths its values are measured at", () => {
  assert.deepEqual(TABLE.widths, [2400, 1920, 960]);
});

test("no value of one channel stands under two meanings, and weight holds two levels", () => {
  assertOneMeaning(TABLE);
  assert.deepEqual(TABLE.levels, { weight: 2 });
  // The broken table gives a second row the weight of emphasis: the test names both rows.
  assert.throws(() => assertOneMeaning(BROKEN.secondMeaning), /rows emphasis and echo both draw/u);
});

/** The strokes a strip plate of the small work draws: its relations' lines and its boundary. */
async function strokesIn(lines) {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), { ...stripStyle(), ...(lines ? { lines } : {}) });
  const boundary = /stroke-width="([\d.]+)" stroke-dasharray="([\d. ]+)"/u.exec(plate.svg);
  return {
    wires: [...new Set(wiresOf(plate.svg).map(({ width }) => rounded(width)))].sort(),
    boundary: [rounded(Number(boundary[1])), boundary[2]],
  };
}

test("a plate built from a table a quarter heavier draws every line and the boundary a quarter heavier", async () => {
  assert.deepEqual(await strokesIn(), { wires: [1.6, 3.2], boundary: [1.4, "8 5"] });
  assert.deepEqual(await strokesIn(heavier(1.25)), { wires: [2, 4], boundary: [1.75, "8 5"] });
});

test("a plate with a boundary cannot be built from a table without the boundary's row", async () => {
  await assert.rejects(
    platesIn(stripModel(), { ...stripStyle(), lines: BROKEN.noBoundary }),
    /no row "boundary"/u,
  );
});

/**
 * The key's rule: it holds the sample of a row exactly when the figure draws that row. A plain relation's line
 * has no sample; every other row is keyed by the shape the product's table names.
 */
function assertKeyed(plate) {
  const shapes = plate.legend.map(({ shape }) => shape);
  for (const [id, { key }] of Object.entries(TABLE.rows))
    if (key)
      assert.equal(
        shapes.includes(key),
        plate.lines.includes(id),
        `row ${id}: the figure ${plate.lines.includes(id) ? "draws" : "does not draw"} it`,
      );
}

test("a key holds the sample of a row exactly when its figure draws the row", async () => {
  const plateOf = async (statuses, lines) =>
    (await platesIn(stripModel("en", {}, statuses), { ...stripStyle(), ...lines })).plates[0];
  const plain = await plateOf({});
  assertKeyed(plain);
  assert.deepEqual(
    plain.legend.map(({ shape }) => shape).filter((shape) => shape !== "band"),
    ["reference", "length", "count", "hub", "boundary"],
  );
  // Statuses on a part and on a relation: both lifecycle rows are drawn and keyed.
  assertKeyed(await plateOf({ typst: "planned", stages: "retired" }));
  // Every relation into the hub retired: no line is heavy, so the key shows no heavy line.
  const faint = await plateOf({
    fonts: "retired",
    icons: "retired",
    faces: "retired",
    stages: "retired",
  });
  assert.ok(!faint.lines.includes("emphasis"));
  assert.ok(!faint.legend.some(({ shape }) => shape === "hub"));
  assertKeyed(faint);
  // The broken table names no sample for emphasis: the figure draws a row its key does not hold.
  const keyless = await plateOf({}, { lines: BROKEN.keylessEmphasis });
  assert.throws(() => assertKeyed(keyless), /row emphasis: the figure draws it/u);
});

/** A row's value as the reference table writes it. */
function written(row) {
  const pattern = row.dash ? `dashes of ${row.dash[0]} px, gaps of ${row.dash[1]} px` : null;
  if (row.channel === "number") return "a number";
  if (row.channel === "pattern") return row.stroke ? `${pattern}; ${row.stroke} px` : pattern;
  return row.factor
    ? `continuous, ${row.factor} × the relation's weight; arrowhead ${row.arrow} × as large`
    : `continuous, ${row.stroke} px`;
}

test("the reference table of the documents holds one line for each row, with what the table says of it", async () => {
  const page = await fs.readFile(new URL("../docs/reference/lines.md", import.meta.url), "utf8");
  const lines = page
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
  assert.deepEqual(
    lines,
    Object.entries(TABLE.rows).map(([id, row]) => [
      `\`${id}\``,
      row.meaning,
      written(row),
      row.question,
      row.tested ? "yes" : "not yet tested by a work",
      row.page ?? "no expression",
    ]),
  );
  // The three widths the table names stand in the page's first paragraph.
  for (const width of TABLE.widths) assert.ok(page.includes(`${width} px wide`), `${width}`);
});

test("a model cannot name a line value: its edition holds no weight and no pattern", async () => {
  const model = JSON.parse(await fs.readFile("examples/big-bank/model.json", "utf8"));
  for (const field of ["weight", "stroke", "dash", "pattern", "lines"])
    assert.throws(
      () => validateModel({ ...model, edition: { [field]: 3 } }),
      ({ code, problems }) =>
        code === "model_invalid" &&
        problems.some(
          ({ path, message }) =>
            path === `/edition/${field}` && /is not a model field/u.test(message),
        ),
      field,
    );
});
