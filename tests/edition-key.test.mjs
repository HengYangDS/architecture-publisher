import assert from "node:assert/strict";
import test from "node:test";
import { editionRecord } from "../src/edition/record.mjs";
import { icons, platesIn, stripModel, stripStyle } from "./fixtures/strips.mjs";

// The edition sets a strip plate's key from its record: each mark carries what the house class needs to draw a
// true sample beside its words.

test("an edition's key marks carry the date, the sample strip and the ticks the plate draws", async () => {
  const model = stripModel();
  const { plates } = await platesIn(model, stripStyle());
  const record = editionRecord({
    model,
    plates,
    icons,
    owned: new Map(),
    files: 0,
    modelSha256: "0".repeat(64),
    publisher: "0.13.0",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    commit: null,
    release: null,
  });
  const marks = record.plates[0].marks;
  const legend = plates[0].legend;
  // Every mark keeps the fields of its legend entry; only a kind's icon is swapped for its artwork.
  assert.deepEqual(
    marks.filter(({ artwork }) => !artwork),
    legend.filter(({ icon }) => !icon),
  );
  assert.deepEqual(
    marks
      .filter(({ shape }) => ["reference", "length", "ticks"].includes(shape))
      .map(({ shape }) => shape),
    ["reference", "length", "ticks"],
  );
});
