import assert from "node:assert/strict";
import test from "node:test";
import { partBoxes } from "../src/poster/part.mjs";
import { POSTER, figureMetrics, figureStyles } from "../src/poster/tokens.mjs";
import { platesIn, stripModel, stripStyle, typefaces } from "./fixtures/strips.mjs";

// A part's details are set where the plate has the room: a plate is composed for its parts' compact cards, their
// name, strip, kind and counts, and its cards take their details only when the composition chosen holds them at
// its type step with wiring no worse. What a part answers for never costs a figure its wiring or its type.

/** The strip work with what every part states replaced: four long details each, or none. */
const stating = (details) => {
  const base = stripModel();
  return stripModel("en", {
    components: base.components.map(({ id, label, kind }) => ({ id, label, kind, details })),
  });
};

const LONG = Object.freeze({
  owns: ["the composition of every plate of the edition, from its rows to its routes"],
  reads: ["the model, the facts measured at the pin and the value table of the house"],
  writes: ["the shapes and the runs of text of each plate, and what its figure drew"],
  refuses: ["a view no layout draws, a word wider than its card and text under its floor"],
});

/** A plate's wiring and type step. */
const standing = ({ composition, measures }) => [
  measures.crossings,
  measures.routes,
  composition.step,
];

test("a compact card is its part without its details, and no taller than its name, strip and caption", () => {
  const model = stripModel();
  const styles = figureStyles(POSTER.steps[2]);
  const { card } = figureMetrics(styles);
  const style = stripStyle();
  const builder = model.components.find(({ id }) => id === "builder");
  const full = partBoxes({ model, typefaces, styles, card, style, details: true });
  const compact = partBoxes({ model, typefaces, styles, card, style, details: false });
  const width = full.width(builder);
  assert.deepEqual(full.text(builder, width).details, ["builds: the edition"]);
  assert.deepEqual(compact.text(builder, width).details, []);
  assert.equal(full.height(builder, width) - compact.height(builder, width), styles.detail.line);
  assert.ok(compact.width(builder) <= full.width(builder));
});

test("a plate with room sets its parts' details and says so in its record", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  assert.equal(plate.composition.details, true);
  assert.ok(plate.runs.some(({ text }) => text === "builds: the edition"));
});

test("details that the composition cannot hold at its step are left out, and cost it no wiring and no type", async () => {
  const style = stripStyle();
  const {
    plates: [bare],
  } = await platesIn(stating({}), style);
  const {
    plates: [crowded],
  } = await platesIn(stating(LONG), style);
  // The plate stands as the same parts stand without anything stated: the same crossings, route defects and step.
  assert.deepEqual(standing(crowded), standing(bare));
  assert.equal(crowded.composition.details, false);
  assert.ok(!crowded.runs.some(({ text }) => text.startsWith("owns: ")));
  // A view whose parts state nothing sets no details and says so.
  assert.equal(bare.composition.details, false);
});
