import assert from "node:assert/strict";
import test from "node:test";
import { diagramCandidates } from "../packages/publisher/src/map/archify.mjs";
import {
  besideSteps,
  chooseDiagram,
  drawingOf,
  routeLayout,
  routeMetrics,
} from "../packages/publisher/src/map/choice.mjs";
import { clearLabels, routeDefects } from "../packages/publisher/src/map/routes.mjs";
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

test("a view whose every candidate misreads takes the one that misreads least", async () => {
  // On Archify's routes every Big Bank tiered candidate, and every re-siding the
  // repair measures, runs at least one pair of routes that read as one.
  const { model } = await loadModel(BIG_BANK_MODEL);
  const [tiered] = await viewsOf(model);
  const chosen = await chooseDiagram(model, tiered);
  const { tangles, joins, hugs } = chosen.metrics;
  assert.equal(tangles + joins + hugs, 1);
});

test("routes that read as one, run along an edge or crowd one side of a card are counted", () => {
  const card = (id, x, y, width = 100, height = 60) => ({ id, x, y, width, height });
  const route = (...points) => ({ points });
  const layout = {
    components: [
      card("a", 0, 0),
      card("b", 200, 0),
      card("s", 40, 200, 20, 20),
      card("c", 845, 20),
      card("t", 1500, 100),
      card("w", 1800, 100),
    ],
    boundaries: [],
    labels: [{ text: "near", x: 760, y: 43, width: 80, height: 14, labelAt: [800, 50] }],
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
      // One label fanning out of one point of one card: one relation, not a misread.
      { from: "f", label: "fans", ...route([600, 0], [600, 100]) },
      { from: "f", ...route([600, 0], [600, 50], [650, 50]) },
      // 3 px off one line and 14 px apart: still one route to a reader.
      route([700, 0], [700, 100]),
      route([703, 114], [703, 200]),
      // A label 5 px from a card it does not connect.
      {
        points: [
          [800, 0],
          [800, 100],
        ],
        labelAt: [800, 50],
      },
      // Relations of two cards into one point of a third read as one, along
      // one line or from two sides.
      { from: "p", label: "one", ...route([1550, 0], [1550, 100]) },
      { from: "q", label: "other", ...route([1480, 40], [1550, 40], [1550, 100]) },
      { from: "r", label: "third", ...route([1850, 0], [1850, 100]) },
      { from: "u", label: "fourth", ...route([1950, 100], [1850, 100]) },
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
    "fan-a",
    "fan-b",
    "offset-up",
    "offset-down",
    "labelled",
    "merge-a",
    "merge-b",
    "meet-a",
    "meet-b",
  ];
  assert.deepEqual(routeDefects(layout, ids), {
    tangles: 1,
    joins: 4,
    hugs: 2,
    mislabels: 0,
    doubles: 0,
    labels: 1,
    crowded: 1,
    owners: {
      misread: [
        "join-up",
        "join-down",
        "side-a",
        "side-b",
        "offset-up",
        "offset-down",
        "merge-a",
        "merge-b",
        "meet-a",
        "meet-b",
      ],
      along: ["along", "meet-b"],
      doubled: [],
      mislabelled: [],
      labelled: ["labelled"],
    },
  });
});

/** A relation label of `width` × 14 px whose anchor sits at `x`, 10 px under its top. */
const labelAt = (text, x, top, width = 80) => ({
  text,
  x: x - width / 2,
  y: top,
  width,
  height: 14,
  labelAt: [x, top + 10],
});

test("labels read as another's, labels that crowd and doubled routes are counted", () => {
  const card = (id, x, y, width = 100, height = 60) => ({ id, x, y, width, height });
  const route = (labelled, ...points) => ({ points, ...(labelled ? { labelAt: labelled } : {}) });
  const labels = [
    // 6 px left of its route and 4 px under a card it does not connect.
    labelAt("under a card", 54, 64),
    // Two labels 5 px apart, each 6 px beside its own route.
    labelAt("upper", 254, 300),
    labelAt("lower", 254, 319),
    // 6 px beside its route and 4 px inside the boundary's edge.
    labelAt("by the outline", 454, 304),
  ];
  const layout = {
    components: [card("a", 0, 0), card("b", 0, 200)],
    boundaries: [{ x: 410, y: 250, width: 200, height: 200 }],
    labels,
    connections: [
      route(labels[0].labelAt, [100, 60], [100, 200]),
      route(labels[1].labelAt, [300, 250], [300, 340]),
      route(labels[2].labelAt, [300, 300], [300, 400]),
      route(labels[3].labelAt, [500, 260], [500, 400]),
      // Two routes 17 px apart along 120 px read as one doubled line.
      route(null, [700, 0], [700, 200]),
      route(null, [717, 40], [717, 160]),
    ],
  };
  const ids = ["card", "upper", "lower", "outline", "double-a", "double-b"];
  const { mislabels, doubles, labels: crowding, owners } = routeDefects(layout, ids);
  assert.deepEqual([mislabels, doubles, crowding], [3, 1, 1]);
  assert.deepEqual(owners.mislabelled, ["card", "upper", "lower"]);
  assert.deepEqual(owners.labelled, ["outline"]);
  assert.deepEqual(owners.doubled, ["double-a", "double-b"]);
});

test("a label read as another's is pinned beside a segment of its own route clear of it", () => {
  const card = (id, x, y, width = 100, height = 60) => ({ id, x, y, width, height });
  // The label stands 6 px left of its route's first segment and 4 px under a
  // card; beside the route's long last segment nothing comes near it.
  const label = labelAt("routes the call", 54, 64);
  const layout = {
    components: [card("a", 0, 0), card("b", 300, 300)],
    boundaries: [],
    labels: [label],
    connections: [
      {
        points: [
          [100, 60],
          [100, 120],
          [400, 120],
          [400, 300],
        ],
        labelAt: label.labelAt,
      },
    ],
  };
  const pins = clearLabels(layout, ["call"], ["call"]);
  // Above the horizontal segment a quarter from its far end, 6 px from it,
  // where it lies farthest from both cards.
  assert.deepEqual([...pins], [["call", [325, 110]]]);
  assert.equal(routeDefects(layout, ["call"]).mislabels, 1);
  const pinned = { ...label, x: 285, y: 100, labelAt: [325, 110] };
  const moved = {
    ...layout,
    labels: [pinned],
    connections: [{ ...layout.connections[0], labelAt: pinned.labelAt }],
  };
  assert.deepEqual(
    [routeDefects(moved, ["call"]).mislabels, routeDefects(moved, ["call"]).labels],
    [0, 0],
  );
  // A label already clear of everything is left where Archify set it.
  assert.equal(clearLabels(moved, ["call"], ["call"]).size, 0);
});

test("a route on the line another enters a card by takes other sides", async () => {
  // On the grid's sides context-mode's sandbox runs "fetches pages" along the
  // line on which "checks deny rules" enters Security policy, 3 px under it.
  const { model } = await loadModel(CONTEXT_MODE_MODEL);
  const sandbox = (await viewsOf(model)).find(({ id }) => id === "sandbox");
  const chosen = await chooseDiagram(model, /** @type {any} */ (sandbox));
  const { crossings, tangles, joins, hugs, mislabels } = chosen.metrics;
  assert.deepEqual([crossings, tangles, joins, hugs], [0, 0, 0, 0]);
  // Archify then sets "fetches pages" 4 px under Security policy and 6 px from
  // its own route; the label is pinned where it reads as its route's.
  assert.equal(mislabels, 0);
  assert.ok(chosen.pinned.includes("runtimes-web"), String(chosen.pinned));
});

test("labels Archify stacks in one gap are each chosen clearly their own route's", async () => {
  // On context-mode's overview Archify sets "writes events" and "queries
  // events" 5 px apart between their two routes.
  const { model } = await loadModel(CONTEXT_MODE_MODEL);
  const overview = (await viewsOf(model)).find(({ id }) => id === "overview");
  const chosen = await chooseDiagram(model, /** @type {any} */ (overview));
  assert.deepEqual([chosen.metrics.mislabels, chosen.metrics.crossings], [0, 0]);
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
  // The layout the route defects read needs its cards, boundaries, labels and
  // the route of every connection.
  const layout = { components: [], boundaries: [], connections: [{ points: [] }], labels: [] };
  assert.equal(routeLayout(layout, 1), layout);
  assert.throws(() => routeLayout(layout, 2), { code: "page_measures_missing" });
  assert.throws(() => routeLayout({ ...layout, labels: undefined }, 1), {
    code: "page_measures_missing",
  });
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
  // A 9-unit sublabel or boundary label needs 10.875 / 9 times the drawing's
  // width; the 11-unit label alone needs less than its width.
  assert.equal(besideSteps({ width: 700, smallest: 9 }), true);
  assert.equal(besideSteps({ width: 760, smallest: 9 }), false);
  assert.equal(besideSteps({ width: 860, smallest: 11 }), true);
  assert.equal(besideSteps({ width: 920, smallest: 11 }), false);
  // The reader crops a preview to everything Archify draws, so a route and its
  // label that reach past the cards widen it.
  const card = (x) => ({ x, y: 0, width: 200, height: 60 });
  const layout = {
    components: [card(0), card(500)],
    boundaries: [],
    connections: [
      {
        points: [
          [200, 30],
          [760, 30],
          [760, 90],
        ],
      },
    ],
    labels: [{ x: 700, y: 40, width: 90, height: 14 }],
  };
  assert.deepEqual(drawingOf(layout, { components: [{}, {}] }), { width: 790, smallest: 11 });
  const bounded = { ...layout, boundaries: [{ x: -20, y: -20, width: 740, height: 100 }] };
  assert.deepEqual(drawingOf(bounded, { components: [] }), { width: 810, smallest: 9 });
});
