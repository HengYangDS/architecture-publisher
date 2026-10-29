import assert from "node:assert/strict";
import test from "node:test";
import { diagramCandidates } from "../packages/publisher/src/map/archify.mjs";
import {
  besideSteps,
  chooseDiagram,
  routeDefects,
  routeMetrics,
} from "../packages/publisher/src/map/choice.mjs";
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
  assert.deepEqual([chosen.metrics.tangles, chosen.metrics.joins], [0, 0]);
});

test("routes that read as one, run along an edge or crowd one side of a card are counted", () => {
  const card = (id, x, y, width = 100, height = 60) => ({ id, x, y, width, height });
  const route = (...points) => ({ points });
  const layout = {
    components: [card("a", 0, 0), card("b", 200, 0), card("s", 40, 200, 20, 20)],
    boundaries: [],
    connections: [
      // One line, 14 px apart and nothing between: they read as one route.
      route([400, 0], [400, 100]),
      route([400, 114], [400, 200]),
      // One line, 24 px apart around a card: two routes.
      route([50, 160], [50, 198]),
      route([50, 222], [50, 260]),
      // 4 px under a card's bottom edge.
      route([0, 64], [100, 64]),
      // Two ends 14 px apart on one side of a card.
      route([150, 20], [200, 20]),
      route([150, 34], [200, 34]),
      // 3 px apart along 70 px.
      route([500, 0], [500, 80]),
      route([503, 10], [503, 90]),
      // One line through a shared end: one bundle, not a misread.
      route([600, 0], [600, 50]),
      route([600, 50], [600, 100]),
    ],
  };
  const ids = [
    "join-up",
    "join-down",
    "split-up",
    "split-down",
    "along",
    "crowd-a",
    "crowd-b",
    "side-a",
    "side-b",
    "bundle-a",
    "bundle-b",
  ];
  assert.deepEqual(routeDefects(layout, ids), {
    tangles: 1,
    joins: 1,
    hugs: 1,
    crowded: 1,
    misread: ["join-up", "join-down", "side-a", "side-b"],
    along: ["along"],
  });
});

test("a route on the line another enters a card by takes other sides", async () => {
  // On the grid's sides context-mode's sandbox runs "fetches pages" along the
  // line on which "checks deny rules" enters Security policy, 3 px under it.
  const { model } = await loadModel(CONTEXT_MODE_MODEL);
  const sandbox = (await viewsOf(model)).find(({ id }) => id === "sandbox");
  const chosen = await chooseDiagram(model, /** @type {any} */ (sandbox));
  const { crossings, tangles, joins, hugs } = chosen.metrics;
  assert.deepEqual([crossings, tangles, joins, hugs], [0, 0, 0, 0]);
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

test("a preview stands beside its steps when its smallest text reaches the floor there", () => {
  // A 9-unit sublabel needs 10.875 / 9 times the drawing's width; the 11-unit
  // label alone needs less than its width.
  assert.equal(besideSteps({ width: 700, sublabels: true }), true);
  assert.equal(besideSteps({ width: 760, sublabels: true }), false);
  assert.equal(besideSteps({ width: 860, sublabels: false }), true);
  assert.equal(besideSteps({ width: 920, sublabels: false }), false);
});
