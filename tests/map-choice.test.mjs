import assert from "node:assert/strict";
import test from "node:test";
import { diagramCandidates } from "../packages/publisher/src/map/archify.mjs";
import { chooseDiagram, routeMetrics } from "../packages/publisher/src/map/choice.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import {
  BIG_BANK_MODEL,
  BROWSER_USE_MODEL,
  CONTEXT_MODE_MODEL,
  graphModel,
} from "./fixtures/models.mjs";

const fits = async () => ({ fits: true, width: 2400, height: 1350 });
/** A model's views as the plan derives them, every view admitted. */
const viewsOf = (model) => planViews(model, fits);
const firstView = async (model) => (await viewsOf(model))[0];

test("Archify chooses every side when the grid's sides cross on its routes", async () => {
  const { model } = await loadModel(BROWSER_USE_MODEL);
  const action = (await viewsOf(model)).find(({ id }) => id === "action");
  const chosen = await chooseDiagram(model, /** @type {any} */ (action));
  assert.equal(chosen.sides, "archify");
  assert.deepEqual([chosen.metrics.crossings, chosen.metrics.tangles], [0, 0]);
  assert.ok(chosen.candidates > diagramCandidates(model, /** @type {any} */ (action)).length);
});

test("a diagram whose routes run side by side is not chosen", async () => {
  // On Archify's routes the Big Bank tiered candidate that crosses least runs
  // the e-mail system's reply to the customer 2 px beside two other routes.
  const { model } = await loadModel(BIG_BANK_MODEL);
  const [tiered] = await viewsOf(model);
  const chosen = await chooseDiagram(model, tiered);
  assert.equal(chosen.metrics.tangles, 0);
});

test("the connections that cross take other sides when that clears their crossings", async () => {
  const { model } = await loadModel(CONTEXT_MODE_MODEL);
  const retrieval = (await viewsOf(model)).find(({ id }) => id === "retrieval");
  const chosen = await chooseDiagram(model, /** @type {any} */ (retrieval));
  assert.deepEqual([chosen.metrics.crossings, chosen.metrics.tangles], [0, 0]);
  assert.ok(chosen.resided.length > 0);
});

test("an Archify answer without a route measure the choice ranks by is refused, not read as zero", () => {
  const metrics = {
    properCrossings: 0,
    resolvedCrossovers: 1,
    routesOverSuggestedBends: 0,
    maxBends: 2,
    maxStretch: 1.1,
    ambiguousCorridors: 0,
  };
  assert.deepEqual(routeMetrics({ metrics }), {
    crossings: 1,
    routesOverTwoBends: 0,
    maxBends: 2,
    maxStretch: 1.1,
    corridors: 0,
  });
  const renamed = Object.fromEntries(
    Object.entries(metrics).filter(([name]) => name !== "maxStretch"),
  );
  assert.throws(() => routeMetrics({ metrics: renamed }), { code: "page_measures_missing" });
});

test("a dense view is drawn with its crossings measured, not refused", async () => {
  // Three callers that each use the same three services: two rows of three
  // cannot draw these nine relations without crossings.
  const model = validateModel(
    graphModel(
      6,
      [1, 2, 3].flatMap((from) => [4, 5, 6].map((to) => [from, to])),
    ),
  );
  const chosen = await chooseDiagram(model, await firstView(model));
  assert.deepEqual(chosen.rows, [3, 3]);
  assert.ok(chosen.metrics.crossings > 0, `${chosen.metrics.crossings} crossings`);
});
