import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import {
  BROKEN,
  TABLE,
  WIDTHS,
  assertOneMeaning,
  channelOf,
  heavier,
  rounded,
} from "./fixtures/line-tables.mjs";
import { platesIn, stripModel, stripStyle, wiresOf } from "./fixtures/strips.mjs";

// The table of line values: its rows, and that a plate draws its lines from it alone.

test("the table holds the rows the trials admitted and no other, each with what it means", () => {
  assert.deepEqual(Object.keys(TABLE.rows), [
    "relation",
    "emphasis",
    "boundary",
    "citations",
    "planned",
    "retired",
  ]);
  for (const [id, row] of Object.entries(TABLE.rows)) {
    assert.ok(row.meaning.length > 0, id);
    assert.equal(typeof row.tested, "boolean", id);
    assert.ok(row.key === null || row.key.length > 0, id);
  }
  const { relation, emphasis, boundary, citations, planned, retired } = TABLE.rows;
  assert.deepEqual([channelOf(relation), relation.stroke], ["weight", 1.6]);
  assert.deepEqual([channelOf(emphasis), emphasis.factor, emphasis.arrow], ["weight", 2, 1.45]);
  assert.deepEqual([channelOf(boundary), boundary.stroke, boundary.dash], ["pattern", 1.4, [8, 5]]);
  assert.equal(channelOf(citations), "number");
  assert.deepEqual([channelOf(planned), planned.dash], ["pattern", [6, 4]]);
  assert.deepEqual([channelOf(retired), retired.dash], ["pattern", [1.5, 3.5]]);
  // The lifecycle patterns are the rows no work has tested.
  assert.deepEqual(
    Object.keys(TABLE.rows).filter((id) => !TABLE.rows[id].tested),
    ["planned", "retired"],
  );
});

test("no value of one channel stands under two meanings, and weight holds two levels", () => {
  assertOneMeaning(TABLE);
  // The broken table gives a second row the weight of emphasis: the test names both rows.
  assert.throws(() => assertOneMeaning(BROKEN.secondMeaning), /rows emphasis and echo both draw/u);
});

/** The strokes a plate of the small work draws: its relations' lines and its boundary. */
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
    // Typst stands outside the boundary, so the ground of a part outside follows the boundary's entry.
    ["reference", "length", "count", "hub", "boundary", "outside"],
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
  if (channelOf(row) === "number") return "a number";
  if (channelOf(row) === "pattern") return row.stroke ? `${pattern}; ${row.stroke} px` : pattern;
  return row.factor
    ? `continuous, ${row.factor} × the relation's weight; arrowhead ${row.arrow} × as large`
    : `continuous, ${row.stroke} px`;
}

test("the reference table of the documents holds one line for each row, with what the table says of it and what it answers", async () => {
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
  // The page states what each row answers and what the page of a delivery does for it; the table states the rest.
  assert.deepEqual(
    lines.map(([id, means, drawn, , tested]) => [id, means, drawn, tested]),
    Object.entries(TABLE.rows).map(([id, row]) => [
      `\`${id}\``,
      row.meaning,
      written(row),
      row.tested ? "yes" : "not yet tested by a work",
    ]),
  );
  for (const [id, , , answers, , shown] of lines) {
    assert.match(answers, /\?$/u, id);
    assert.ok(shown.length > 0, id);
  }
  // The page has no expression of emphasis or of the count.
  assert.deepEqual(
    lines.filter((cells) => cells[5] === "no expression").map(([id]) => id),
    ["`emphasis`", "`citations`"],
  );
  // The three widths the trials measured at stand in the page's first paragraph.
  for (const width of WIDTHS) assert.ok(page.includes(`${width} px wide`), `${width}`);
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
