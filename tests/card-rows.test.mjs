import assert from "node:assert/strict";
import test from "node:test";
import { presentation } from "../src/kinds.mjs";
import { part, PARTS, platesIn, stripModel, stripStyle } from "./fixtures/strips.mjs";

// The cards of one row are read across: their names, strips, captions and details stand on shared lines. A card
// whose name takes one line beside a card whose name takes two, or a card without a strip beside one with a strip,
// set its caption a line higher than its neighbour's, and the measure of tidiness found such a caption 2.7 pt off
// the next card's line in the first acceptance builds of the one part (2026-11-17). So a row lays each region of
// its cards at one top: the name block as tall as the row's tallest name, the strip's band where any card of the
// row has a strip, the caption as tall as the row's tallest caption.

/** The runs a plate sets in one part's card, and that part's box. */
function runsOf(plate, model, id) {
  const { box } = plate.report.parts.find((one) => one.id === id);
  const inside = plate.runs.filter(
    (run) =>
      run.x >= box.x &&
      run.x < box.x + box.width &&
      run.baseline > box.y &&
      run.baseline < box.y + box.height,
  );
  const component = model.components.find((one) => one.id === id);
  const kind = inside.find(({ text }) => text === presentation(model, component).label);
  return { box, kind };
}

test("the captions of a row stand on one baseline when names wrap differently and a card has no strip", async () => {
  // Words gets a name long enough to take two lines; Typst, beside it in its row, owns no file and has no strip.
  const base = stripModel();
  const model = stripModel("en", {
    components: base.components.map(({ id, label, kind }) => ({
      id,
      label:
        id === "words"
          ? "Words of every key and caption the edition sets in five languages"
          : label,
      kind,
    })),
  });
  const parts = new Map([...PARTS].map(([id, value]) => [id, id === "typst" ? part([]) : value]));
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle(undefined, parts));
  const rows = new Map();
  for (const { id, box } of plate.report.parts) {
    const key = Math.round(box.y);
    rows.set(key, [...(rows.get(key) ?? []), id]);
  }
  let compared = 0;
  for (const ids of rows.values()) {
    if (ids.length < 2) continue;
    const baselines = ids.map((id) => runsOf(plate, model, id).kind?.baseline);
    assert.ok(
      baselines.every((value) => value !== undefined),
      `a card of row ${ids} sets no kind`,
    );
    assert.equal(new Set(baselines).size, 1, `row ${ids}: captions at ${baselines}`);
    compared += ids.length;
  }
  // The fixture's view is laid out in rows of more than one card, among them the row of the long name.
  assert.ok(compared >= 4, `${compared} cards compared`);
  const wrapped = plate.runs.filter(({ component }) => component === "words");
  assert.ok(wrapped.length >= 2, "the long name takes two lines");
});
