import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadIcons } from "../src/icons.mjs";
import { loadModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView, composePlates } from "../src/poster/compose/plates.mjs";
import { loadTypefaces } from "../src/poster/text.mjs";
import { BROWSER_USE_MODEL, CONTEXT_MODE_MODEL } from "./fixtures/models.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

// Models of two repositories unrelated to this one, written outside them, keep the publisher
// general: every view is admitted and composed as a plate whose wires neither cross nor turn
// beside a card they do not connect.
for (const [file, views] of [
  [CONTEXT_MODE_MODEL, ["overview", "sandbox", "retrieval"]],
  [BROWSER_USE_MODEL, ["overview", "perception", "action"]],
]) {
  test(`the ${path.basename(file, ".json")} model is admitted in every view`, async () => {
    const { model } = await loadModel(file, { icon: icons.has });
    const planned = await planViews(model, async (view) =>
      admitsView(model, view, typefaces, icons),
    );
    const plates = composePlates(model, planned, typefaces, icons);
    assert.deepEqual(
      plates.map((plate) => plate.views[0]),
      views,
    );
    assert.deepEqual(
      plates.map(({ measures }) => [measures.crossings, measures.routes]),
      views.map(() => [0, 0]),
    );
  });
}
