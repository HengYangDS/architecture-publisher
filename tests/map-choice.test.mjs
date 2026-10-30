import assert from "node:assert/strict";
import test from "node:test";
import { diagramCandidates } from "../packages/publisher/src/map/archify.mjs";
import {
  besideSteps,
  chooseDiagram,
  drawingOf,
  pinSets,
  routeLayout,
  routeMetrics,
} from "../packages/publisher/src/map/choice.mjs";
import { clearLabels, routeDefects } from "../packages/publisher/src/map/routes.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import {
  AIGW_MODEL,
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
      card("c", 848, 20),
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
      // A label on its route 8 px from a card it does not connect: it reads as
      // its route's, Archify's shortest segment from the card, but crowds.
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
    // 6 px beside its route and 8 px from another: less than one and a half
    // times as far, so it reads as the other's.
    labelAt("near another", 854, 300),
    // 6 px beside its route and 9 px under a card: its own, but crowded.
    labelAt("far enough", 1054, 300),
    // 6 px left of its route and 14 px right of another running the same way:
    // the text, 11 px inside the box, stands less than one and a half times as
    // far from the other route, so it reads as the other's.
    labelAt("between two", 1254, 300),
  ];
  const layout = {
    components: [card("a", 0, 0), card("b", 0, 200), card("above", 1010, 231, 70, 60)],
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
      route(labels[4].labelAt, [900, 250], [900, 400]),
      route(null, [806, 250], [806, 400]),
      route(labels[5].labelAt, [1100, 250], [1100, 400]),
      route(labels[6].labelAt, [1300, 250], [1300, 400]),
      route(null, [1200, 250], [1200, 400]),
    ],
  };
  const ids = [
    "card",
    "upper",
    "lower",
    "outline",
    "double-a",
    "double-b",
    "near",
    "near-other",
    "far",
    "between",
    "between-other",
  ];
  const { mislabels, doubles, labels: crowding, owners } = routeDefects(layout, ids);
  assert.deepEqual([mislabels, doubles, crowding], [5, 1, 2]);
  assert.deepEqual(owners.mislabelled, ["card", "upper", "lower", "near", "between"]);
  assert.deepEqual(owners.labelled, ["outline", "far"]);
  assert.deepEqual(owners.doubled, ["double-a", "double-b"]);
});

test("a label read as another's is pinned beside a segment of its own route clear of it", () => {
  const card = (id, x, y, width = 100, height = 60) => ({ id, x, y, width, height });
  // The label stands 6 px left of its route's first segment and 4 px under a
  // card; beside the route's long last segment nothing comes near it.
  const label = labelAt("routes the call", 54, 64);
  const layout = {
    viewBox: [500, 400],
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
  // where it lies farthest from both cards: 75 px right of where Archify
  // anchors it by default, 10 px above that segment's middle.
  assert.deepEqual([...pins], [["call", [75, 0]]]);
  // On a canvas 360 px wide that place would cross its right edge, so the
  // label stands under the segment three eighths from its far end instead.
  const narrow = { ...layout, viewBox: [360, 400] };
  assert.deepEqual([...clearLabels(narrow, ["call"], ["call"])], [["call", [38, 26]]]);
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

test("a label another route's line runs into past its corner crowds and is pinned off that line", () => {
  // Route a comes down to (100, 100) and turns right; a reader carries its
  // vertical on past the corner. Route b's label stands 20 px under that
  // corner and 6 px above b: clear of every route, card and label by more
  // than 16 px, but on a's line, as if a ran on to it.
  const label = labelAt("on a line", 100, 120);
  const layout = {
    viewBox: [400, 300],
    components: [],
    boundaries: [],
    labels: [label],
    connections: [
      {
        from: "p",
        label: "turns",
        points: [
          [100, 0],
          [100, 100],
          [300, 100],
        ],
      },
      {
        from: "q",
        label: "on a line",
        points: [
          [0, 140],
          [200, 140],
        ],
        labelAt: label.labelAt,
      },
    ],
  };
  const ids = ["a", "b"];
  const { mislabels, labels, owners } = routeDefects(layout, ids);
  assert.deepEqual([mislabels, labels, owners.labelled], [0, 1, ["b"]]);
  const pins = clearLabels(layout, ids, ["b"]);
  assert.equal(pins.size, 1);
  // Pinned under its route, off a's line, the label reads as b's alone.
  const [dx, dy] = /** @type {number[]} */ (pins.get("b"));
  const box = { ...label, x: label.x + dx, y: label.y + dy, labelAt: [100 + dx, 130 + dy] };
  const moved = {
    ...layout,
    labels: [box],
    connections: [layout.connections[0], { ...layout.connections[1], labelAt: box.labelAt }],
  };
  assert.deepEqual([routeDefects(moved, ids).mislabels, routeDefects(moved, ids).labels], [0, 0]);
  assert.ok(box.y > 140, "the label stands under its route");
});

test("each pin round pins anew the labels left crowded, with the labels pinned before", () => {
  const starts = [
    { mislabelled: [], relabel: ["b"], pinned: ["a"] },
    { mislabelled: [], relabel: [], pinned: ["c"] },
    { mislabelled: ["d"], relabel: ["d", "e"], pinned: [] },
  ];
  // A diagram with nothing left to pin is not pinned again; labels read as
  // another's are pinned alone as well as with those that only crowd.
  assert.deepEqual(
    pinSets(starts).map(({ owners }) => owners),
    [["a", "b"], ["d"], ["d", "e"]],
  );
});

test("a label on a route of one segment is pinned from above where the route starts", () => {
  const card = (id, x, y) => ({ id, x, y, width: 100, height: 60 });
  // Archify anchors the label 10 px above where the route leaves card a, on
  // the card.
  const label = labelAt("routes the call", 50, 40);
  const layout = {
    viewBox: [200, 400],
    components: [card("a", 0, 0), card("b", 0, 300)],
    boundaries: [],
    labels: [label],
    connections: [
      {
        points: [
          [50, 60],
          [50, 300],
        ],
        labelAt: label.labelAt,
      },
    ],
  };
  assert.equal(routeDefects(layout, ["call"]).mislabels, 1);
  // On the middle of its route, its anchor at 183: 133 px below Archify's.
  assert.deepEqual([...clearLabels(layout, ["call"], ["call"])], [["call", [0, 133]]]);
});

test("a view that stands above its steps at every width takes rows of two beside them", async () => {
  // In rows of three every diagram of context-mode's sandbox stands above its
  // steps or misreads a route or a label; at 600 px in rows of two it stands
  // beside them and misreads none.
  const { model } = await loadModel(CONTEXT_MODE_MODEL);
  const sandbox = (await viewsOf(model)).find(({ id }) => id === "sandbox");
  const chosen = await chooseDiagram(model, /** @type {any} */ (sandbox));
  const { crossings, tangles, joins, hugs, mislabels } = chosen.metrics;
  assert.deepEqual([crossings, tangles, joins, hugs, mislabels], [0, 0, 0, 0, 0]);
  assert.equal(chosen.beside, true);
  assert.ok(Math.max(...chosen.rows) <= 2, String(chosen.rows));
});

test("a pinned label carries an offset from Archify's anchor, not an anchor of its own", async () => {
  const { model } = await loadModel(BROWSER_USE_MODEL);
  const perception = (await viewsOf(model)).find(({ id }) => id === "perception");
  const chosen = await chooseDiagram(model, /** @type {any} */ (perception));
  assert.equal(chosen.metrics.mislabels, 0);
  assert.ok(chosen.pinned.length > 0, "the view pins a label");
  // The pin is an offset from Archify's anchor, which keeps the route's ends spread.
  for (const id of chosen.pinned) {
    const pinned = chosen.document.connections.find((connection) => connection.id === id);
    assert.ok(Number.isInteger(pinned.labelDx) && Number.isInteger(pinned.labelDy), id);
    assert.equal("labelAt" in pinned, false, id);
  }
});

test("a label read as another's outranks a preview beside its steps", async () => {
  // The best of AIGW's adapter diagrams that Archify's reader sets beside their
  // steps sets "realized by" on the corner of Codex, the card it points to, and
  // "guards" 2 px from the card it guards; the best above its steps sets every
  // label where it reads as its own route's.
  const { model } = await loadModel(AIGW_MODEL);
  const adapters = (await viewsOf(model)).find(({ id }) => id === "adapters");
  const chosen = await chooseDiagram(model, /** @type {any} */ (adapters));
  assert.deepEqual([chosen.metrics.crossings, chosen.metrics.mislabels], [0, 0]);
  assert.equal(chosen.beside, false);
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
  // The layout the route defects and the pins read needs its canvas, cards,
  // boundaries, labels and the route of every connection.
  const layout = {
    viewBox: [840, 600],
    components: [],
    boundaries: [],
    connections: [{ points: [] }],
    labels: [],
  };
  assert.equal(routeLayout(layout, 1), layout);
  assert.throws(() => routeLayout(layout, 2), { code: "page_measures_missing" });
  for (const part of ["viewBox", "labels"])
    assert.throws(() => routeLayout({ ...layout, [part]: undefined }, 1), {
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
