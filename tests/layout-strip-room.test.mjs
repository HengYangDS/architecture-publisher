import assert from "node:assert/strict";
import test from "node:test";
import { layoutView } from "../src/layout/grid.mjs";
import { validateModel } from "../src/model/load.mjs";
import { simpleMetrics, wholeView } from "./fixtures/layout.mjs";
import { minimalModel } from "./fixtures/models.mjs";

// A strip cannot be shortened to fit a column, as a card's text can be rewrapped: a row whose columns are narrower
// than its longest strip is no layout, so the plate tries another wrapping instead of letting the strip run on.

/** A hub that calls four parts, which stand in one row. */
const fan = validateModel(
  minimalModel({
    components: ["hub", "a", "b", "c", "d"].map((id) => ({ id, label: id.toUpperCase() })),
    relations: ["a", "b", "c", "d"].map((id) => ({
      id: `hub-${id}`,
      from: "hub",
      to: id,
      label: "calls",
    })),
  }),
);

/** Metrics whose boxes need `least` px at least, as the longest strip of a view does. */
const withLeast = (least) => {
  const metrics = simpleMetrics();
  return { ...metrics, card: { ...metrics.card, maxWidth: 760, natural: () => least, least } };
};

test("a row whose columns are narrower than its longest strip is refused", () => {
  assert.throws(() => layoutView(wholeView(fan), withLeast(500)), { code: "layout_row_too_wide" });
});

test("a row whose columns hold its longest strip gives every box that width", () => {
  const layout = layoutView(wholeView(fan), withLeast(300));
  for (const id of ["a", "b", "c", "d"])
    assert.ok(layout.cards.get(id).width >= 300, `${id} is ${layout.cards.get(id).width} px wide`);
});
