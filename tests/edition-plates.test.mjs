import assert from "node:assert/strict";
import test from "node:test";
import { loadIcons } from "../src/icons.mjs";
import { loadModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView } from "../src/poster/compose/candidates.mjs";
import * as edition from "../src/poster/compose/edition.mjs";
import { loadTypefaces } from "../src/poster/text.mjs";
import { AIGW_MODEL, ETHOS_PROOF_PLANE_MODEL } from "./fixtures/models.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

// The print edition's body, 1504 by 714 points, in pixels at two thirds of a
// point each.
const BODY = Object.freeze({ width: 2256, height: 1071 });

/** Plan a model's views and compose its edition plates, as the build will. */
async function platesOf(file) {
  assert.equal(typeof edition.composePlates, "function", "composePlates is not exported");
  const { model } = await loadModel(file, { icon: icons.has });
  const views = await planViews(model, async (view) => admitsView(model, view, typefaces, icons));
  return { model, views, plates: edition.composePlates(model, views, typefaces, icons) };
}

test("each edition plate draws its figures alone, within the edition's body", async () => {
  const { plates } = await platesOf(AIGW_MODEL);
  assert.ok(plates.length > 0);
  for (const plate of plates) {
    assert.ok(plate.width <= BODY.width, `plate ${plate.page} is ${plate.width} px wide`);
    assert.ok(plate.height <= BODY.height, `plate ${plate.page} is ${plate.height} px high`);
    assert.match(plate.svg, new RegExp(`viewBox="0 0 ${plate.width} ${plate.height}"`, "u"));
    // No paper and no text: the edition's page is the paper, and Typst sets
    // the head, the key and every run.
    assert.doesNotMatch(plate.svg, /<rect width="\d+" height="\d+" fill=/u);
    assert.doesNotMatch(plate.svg, /<text|<path fill="#[0-9A-Fa-f]{6}" d="M[^"]*Z/u);
    assert.ok(plate.runs.length > 0);
    assert.ok(plate.step <= 2, `plate ${plate.page} is set at step ${plate.step}`);
  }
});

test("an edition plate's legend names the kinds its figures show, each with its label", async () => {
  const { model, views, plates } = await platesOf(AIGW_MODEL);
  const kindOf = new Map(model.components.map(({ id, kind }) => [id, kind]));
  for (const plate of plates) {
    const shown = new Set(
      views
        .filter(({ id }) => plate.views.includes(id))
        .flatMap(({ components }) => components.map(({ id }) => kindOf.get(id))),
    );
    const kinds = plate.legend.filter(({ kind }) => kind !== undefined).map(({ kind }) => kind);
    assert.deepEqual(new Set(kinds), shown, `plate ${plate.page}`);
    for (const entry of plate.legend) assert.equal(typeof entry.label, "string");
  }
});

test("the ETHOS proof plane is an edition plate of its own", async () => {
  const { plates } = await platesOf(ETHOS_PROOF_PLANE_MODEL);
  assert.deepEqual(
    plates.map(({ views }) => views),
    [["overview"], ["proof"]],
  );
});
