import assert from "node:assert/strict";
import test from "node:test";
import { presentation } from "../src/kinds.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView } from "../src/poster/compose/plates.mjs";
import { partBoxes } from "../src/poster/part.mjs";
import { platesOf } from "../src/poster/plate.mjs";
import { POSTER, figureMetrics, figureStyles } from "../src/poster/tokens.mjs";
import { icons, stripModel, stripStyle, typefaces } from "./fixtures/strips.mjs";

// A caption is a part's kind and, where it owns files, their number and size. On one plate every caption has one
// form: the count beside its kind where every card has the room for that line, and under its kind on every card
// otherwise. A reader compares the cards of a plate, and a count that stands beside on one and under on the next
// reads as two sorts of card.

/** Where each counted part of a drawn figure sets its count: beside its kind's label, or under it. */
function captionForms(model, figure) {
  const forms = new Map();
  for (const { id, box } of figure.report.parts) {
    const inside = figure.runs.filter(
      (run) =>
        run.x >= box.x &&
        run.x < box.x + box.width &&
        run.top >= box.y &&
        run.top < box.y + box.height,
    );
    const count = inside.find(({ value }) => /^\d+ files?, /u.test(value));
    if (!count) continue;
    const label = presentation(
      model,
      model.components.find((component) => component.id === id),
    ).label;
    const kind = inside.find(({ value }) => value === label);
    assert.ok(kind, `${id}: no kind's label in its card`);
    forms.set(id, count.top > kind.top ? "under" : "beside");
  }
  return forms;
}

test("with counts under their kinds every counted card takes two caption lines and is no wider for its caption", () => {
  const model = stripModel();
  const styles = figureStyles(POSTER.steps[2]);
  const { card } = figureMetrics(styles);
  const style = stripStyle();
  const fit = partBoxes({ model, typefaces, styles, card, style, details: false });
  const under = partBoxes({
    model,
    typefaces,
    styles,
    card,
    style,
    details: false,
    caption: "under",
  });
  for (const component of model.components) {
    const wide = fit.width(component);
    const counted = fit.text(component, wide).caption.count !== null;
    assert.equal(fit.text(component, wide).captionLines, 1, component.id);
    assert.equal(under.text(component, wide).captionLines, counted ? 2 : 1, component.id);
    assert.ok(under.width(component) <= wide, component.id);
  }
  // Words: its count on one line with its kind is its widest region, so under its kind the card is narrower.
  const words = model.components.find(({ id }) => id === "words");
  assert.ok(under.width(words) < fit.width(words) || fit.width(words) === card.minimumWidth);
});

test("on one plate every count stands beside its kind, or every count under it, in fields of any width", async () => {
  const model = stripModel();
  const style = stripStyle();
  const [view] = await planViews(model, async (planned) =>
    admitsView(model, planned, typefaces, icons, style),
  );
  let under = 0;
  let plates = 0;
  for (const width of [2256, 1800, 1500, 1300, 1100]) {
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
      const forms = new Set(captionForms(model, one.figure).values());
      assert.equal(
        forms.size,
        1,
        `width ${width}, step ${one.step}, rows of ${one.limit}: ${[...forms]}`,
      );
      plates += 1;
      if (forms.has("under")) under += 1;
    }
  }
  // The fields are narrow enough that some compositions set their counts under, so the rule is exercised.
  assert.ok(
    plates > 0 && under > 0 && under < plates,
    `${under} of ${plates} plates set counts under`,
  );
});
