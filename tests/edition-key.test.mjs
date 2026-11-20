import assert from "node:assert/strict";
import test from "node:test";
import { editionRecord } from "../src/edition/record.mjs";
import { recordFacts } from "./fixtures/record-facts.mjs";
import { icons, platesIn, stripModel, stripStyle } from "./fixtures/strips.mjs";

// The edition sets a plate's key from its record: each mark carries what the house class needs to draw a
// true sample beside its words.

test("an edition's key marks carry the date, the sample strip and the count the plate draws", async () => {
  const model = stripModel();
  const { plates } = await platesIn(model, stripStyle());
  const record = editionRecord({
    model,
    plates,
    icons,
    facts: recordFacts(),
    publisher: "0.13.0",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    time: null,
  });
  const marks = record.plates[0].marks;
  const legend = plates[0].legend;
  // Every mark is its legend entry, with its fields; the key holds no kind's icon.
  assert.deepEqual(marks, legend);
  assert.ok(marks.every((mark) => !("artwork" in mark) && !("icon" in mark)));
  assert.deepEqual(
    marks
      .filter(({ shape }) => ["reference", "length", "count"].includes(shape))
      .map(({ shape }) => shape),
    ["reference", "length", "count"],
  );
  // The commit's mark carries both forms of its words: the house class sets the one without the date on a page,
  // whose foot states the date, and the one with it under a figure set alone.
  const reference = marks.find(({ shape }) => shape === "reference");
  assert.deepEqual(
    [reference.label, reference.undated],
    ["last changed before commit @ 2026-11-10:", "last changed before commit:"],
  );
});
