import assert from "node:assert/strict";
import test from "node:test";
import { presentation } from "../src/kinds.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView } from "../src/poster/compose/plates.mjs";
import { platesOf } from "../src/poster/plate.mjs";
import { icons, stripModel, stripStyle, typefaces } from "./fixtures/strips.mjs";

// The boundary's name stands on the boundary's top edge, over the cards the boundary encloses. It starts on the
// text edge of a card that stands at the boundary's left edge, so the name and the names of the cards under it
// share one left edge at every type step. Set at an offset of its own, the name stood 8 px left of those names at
// the three largest steps, which a reader sees as a line that just misses.

/** The left edges of the boundary's name and of the names of the enclosed cards furthest left. */
function leftEdges(model, boundaryName, figure) {
  const named = figure.runs.find(({ value, component }) => value === boundaryName && !component);
  assert.ok(named, "the figure sets no name of its boundary");
  const inside = figure.report.parts.filter(
    ({ id }) =>
      !presentation(
        model,
        model.components.find((component) => component.id === id),
      ).outside,
  );
  const left = Math.min(...inside.map(({ box }) => box.x));
  const names = inside
    .filter(({ box }) => box.x === left)
    .map(({ id }) => figure.runs.find(({ component }) => component === id).x);
  return { name: named.x, cards: [...new Set(names)] };
}

test("the boundary's name starts on the text edge of the cards at the boundary's left edge, at every type step", async () => {
  const model = stripModel();
  const style = stripStyle();
  const [view] = await planViews(model, async (planned) =>
    admitsView(model, planned, typefaces, icons, style),
  );
  const steps = new Set();
  for (const width of [2256, 1500, 1100]) {
    const made = platesOf(
      {
        model,
        typefaces,
        icons,
        boundaryName: model.title,
        centring: "all",
        tierLabels: "column",
        style,
      },
      { view, field: { x: 0, y: 0, width, height: 1071 }, labelColumn: null },
    );
    for (const one of made) {
      const { name, cards } = leftEdges(model, model.title, one.figure);
      // A wire that crosses the top edge where the name would stand moves the name clear of it, 12 px at a time.
      const moved = cards.length === 1 ? (name - cards[0]) / 12 : NaN;
      assert.ok(
        Number.isInteger(moved) && moved >= 0,
        `width ${width}, step ${one.step}: the name at ${name}, the cards' names at ${cards}`,
      );
      if (moved === 0) steps.add(one.step);
    }
  }
  // The rule is shown at the small steps and at the large ones, where a card's padding is wider.
  assert.ok(
    steps.has(0) && steps.has(4),
    `steps with the name on the cards' edge: ${[...steps].sort()}`,
  );
});
