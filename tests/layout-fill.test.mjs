import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { CATEGORY_LOOKS } from "../src/kinds.mjs";
import { keptBands } from "../src/layout/fill.mjs";
import { layoutView } from "../src/layout/grid.mjs";
import { validateModel } from "../src/model/load.mjs";
import { Refusal } from "../src/refusal.mjs";
import { simpleMetrics, wholeView } from "./fixtures/layout.mjs";
import { graphModel } from "./fixtures/models.mjs";

// The tiers figure's fill as the layout draws it (src/layout/fill.mjs): a lone card of the first or last row, of a
// kind outside the code that at least half its neighbouring row relates to, drawn across the whole figure; the
// guard that keeps a band only where it wires no worse; rows justified across the width in their order; and neither
// fill drawn where it would bring an outside card inside the system's boundary.

/**
 * A model of cards `c1` to `c<count>`, wired by `[from, to, label]` edges between their numbers, each card a service
 * unless `categories` gives its number a kind of another category, named after it.
 * @param {number} count
 * @param {Array<[number, number, string]>} edges
 * @param {Record<number, string>} categories
 */
function modelOf(count, edges, categories) {
  const kinds = Object.fromEntries(
    [...new Set(Object.values(categories))].map((category) => [
      category,
      { label: category, category },
    ]),
  );
  return validateModel(
    graphModel(count, edges, {
      kinds: { service: { label: "service" }, ...kinds },
      components: Array.from({ length: count }, (_, index) => ({
        id: `c${index + 1}`,
        label: `Component ${index + 1}`,
        kind: categories[index + 1] ?? "service",
      })),
    }),
  );
}

/**
 * A model of cards `c1` to `c<count>`, wired by `[from, to, label]` edges between their numbers, whose last card is
 * of a kind in the category given and every other card a service; a card named in `people` is a person.
 * @param {number} count
 * @param {Array<[number, number, string]>} edges
 * @param {string} category
 * @param {number[]} [people]
 */
function storeModel(count, edges, category, people = []) {
  return validateModel(
    graphModel(count, edges, {
      kinds: {
        service: { label: "service" },
        person: { label: "person", category: "person" },
        store: { label: "store", category },
      },
      components: Array.from({ length: count }, (_, index) => ({
        id: `c${index + 1}`,
        label: `Component ${index + 1}`,
        kind: index === count - 1 ? "store" : people.includes(index + 1) ? "person" : "service",
      })),
    }),
  );
}

/** Edges `[from, to]` between numbered cards, each labelled "uses". */
const uses = (/** @type {Array<[number, number]>} */ pairs) =>
  pairs.map(([from, to]) => /** @type {[number, number, string]} */ ([from, to, "uses"]));

/** The outside cards of a model that a figure's system boundary encloses, in whole or in part. */
function enclosed(/** @type {any} */ made, /** @type {any} */ model) {
  const outside = new Set(
    model.components
      .filter(({ kind }) => {
        const { category } = model.kinds.find(({ id }) => id === kind) ?? {};
        return CATEGORY_LOOKS[/** @type {keyof typeof CATEGORY_LOOKS} */ (category)]?.outside;
      })
      .map(({ id }) => id),
  );
  const box = made.boundary;
  return [...made.cards]
    .filter(
      ([id, card]) =>
        outside.has(id) &&
        box &&
        card.x < box.x + box.width &&
        card.x + card.width > box.x &&
        card.y < box.y + box.height &&
        card.y + card.height > box.y,
    )
    .map(([id]) => id);
}

/** The figure of a model's tiers on the poster's spacing, the band's rule read from the categories as a plate reads it. */
function figure(model, tiers, { band = true, ...more } = {}) {
  const spans = (component) => {
    const kind = model.kinds.find(({ id }) => id === component.kind);
    return CATEGORY_LOOKS[/** @type {keyof typeof CATEGORY_LOOKS} */ (kind?.category)].spans;
  };
  return layoutView(
    wholeView(model, tiers),
    { ...simpleMetrics(model), centring: "all", lanes: true, ...(band ? { spans } : {}), ...more },
    { boundaryName: "System" },
  );
}

/** Four cards over a fifth, of which the first `related` read the fifth. */
const overStore = (related, category) =>
  storeModel(
    5,
    Array.from({ length: related }, (_, index) => [index + 1, 5, "reads"]),
    category,
  );
const FOUR_OVER_ONE = [["c1", "c2", "c3", "c4"], ["c5"]];

test("a lone store of the last row that at least half the row above relates to spans the whole figure, its wires entering straight", () => {
  for (const [category, related] of /** @type {const} */ ([
    ["database", 3],
    ["external", 2],
  ])) {
    const made = figure(overStore(related, category), FOUR_OVER_ONE);
    assert.deepEqual(made.bands, ["c5"], category);
    const store = /** @type {any} */ (made.cards.get("c5"));
    const above = ["c1", "c2", "c3", "c4"].map((id) => /** @type {any} */ (made.cards.get(id)));
    assert.equal(store.x, Math.min(...above.map(({ x }) => x)), category);
    assert.equal(
      store.x + store.width,
      Math.max(...above.map(({ x, width }) => x + width)),
      category,
    );
    // Its text keeps the width of a card of its column.
    assert.equal(store.content, made.card.width, category);
    // Each relation is a wire of its own, which runs straight down from its source's centre into the band.
    const wires = made.paths.filter(({ relations }) => relations.some(({ to }) => to === "c5"));
    assert.equal(wires.length, related, category);
    for (const { relations, points } of wires) {
      assert.equal(relations.length, 1, category);
      const source = /** @type {any} */ (made.cards.get(relations[0].from));
      assert.ok(
        points.every(([x]) => x === source.x + source.width / 2),
        `${category}: ${relations[0].id} bends`,
      );
      assert.equal(/** @type {any} */ (points.at(-1))[1], store.y, category);
    }
    assert.equal(made.labels.length, related, category);
  }
});

test("a lone store that fewer than half the row above relate to, and a lone part of the code, stay cards", () => {
  for (const model of [overStore(1, "external"), overStore(4, "backend")]) {
    const made = figure(model, FOUR_OVER_ONE);
    assert.equal(made.bands, undefined);
    assert.equal(/** @type {any} */ (made.cards.get("c5")).width, made.card.width);
    assert.deepEqual(made, figure(model, FOUR_OVER_ONE, { band: false }));
  }
});

test("a lone card of the first row that at least half the row below relates to spans the figure, and a figure may have two bands", () => {
  const above = modelOf(
    5,
    uses([
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 5],
    ]),
    { 1: "cloud" },
  );
  const tiers = [["c1"], ["c2", "c3", "c4"], ["c5"]];
  const made = figure(above, tiers);
  assert.deepEqual(made.bands, ["c1"]);
  const band = /** @type {any} */ (made.cards.get("c1"));
  const below = ["c2", "c3", "c4"].map((id) => /** @type {any} */ (made.cards.get(id)));
  assert.equal(band.x, Math.min(...below.map(({ x }) => x)));
  assert.equal(band.x + band.width, Math.max(...below.map(({ x, width }) => x + width)));
  const both = modelOf(
    5,
    uses([
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [3, 5],
      [4, 5],
    ]),
    {
      1: "cloud",
      5: "database",
    },
  );
  assert.deepEqual(figure(both, tiers).bands, ["c1", "c5"]);
});

test("a lone end card that the rest of the figure is no wider than stays a card", () => {
  // One column: the store's neighbour relates to it, but the figure has no width a band could take.
  const model = modelOf(
    3,
    uses([
      [1, 2],
      [2, 3],
    ]),
    { 3: "database" },
  );
  const tiers = [["c1"], ["c2"], ["c3"]];
  const made = figure(model, tiers);
  assert.equal(made.bands, undefined);
  assert.deepEqual(made, figure(model, tiers, { band: false }));
});

test("a band that would bring an outside card inside the system's boundary is drawn plain, and the figure names it", () => {
  // People c1 and c5 stand beside the system's own parts in the first and third rows; drawn across the whole
  // figure, the store at its foot would widen the boundary over them.
  const model = modelOf(
    7,
    uses([
      [1, 2],
      [2, 3],
      [2, 4],
      [3, 5],
      [3, 6],
      [4, 6],
      [5, 7],
      [6, 7],
    ]),
    {
      1: "person",
      5: "person",
      7: "database",
    },
  );
  const tiers = [["c1", "c2"], ["c3", "c4"], ["c5", "c6"], ["c7"]];
  const { unbanded, ...made } = figure(model, tiers);
  assert.deepEqual(unbanded, ["c7"]);
  assert.deepEqual(enclosed(made, model), []);
  assert.deepEqual(made, figure(model, tiers, { band: false }));
});

test("the guard keeps a figure's bands only where they wire no worse than the figure drawn plain", () => {
  const draw = (/** @type {Record<string, [number, number]>} */ measures) => (bands) => {
    const [crossings, routes] = measures[bands.join() || "plain"];
    if (crossings < 0) throw new Refusal("layout_untidy", "untidy", []);
    return { bands, measures: { crossings, routes } };
  };
  const kept = (measures, justify = false) => keptBands(draw(measures), ["store"], justify);
  assert.deepEqual(kept({ store: [1, 0], plain: [1, 0] }), {
    bands: ["store"],
    measures: { crossings: 1, routes: 0 },
  });
  // More crossings, or more route defects, and the figure is drawn plain, naming the band it gave up.
  for (const store of /** @type {const} */ ([
    [2, 0],
    [0, 1],
  ]))
    assert.deepEqual(kept({ store, plain: [1, 0] }), {
      bands: [],
      measures: { crossings: 1, routes: 0 },
      unbanded: ["store"],
    });
  // A band that cannot be drawn gives way too; a plain figure that cannot be drawn leaves the band.
  assert.deepEqual(kept({ store: [-1, 0], plain: [3, 0] }).unbanded, ["store"]);
  assert.deepEqual(kept({ store: [3, 0], plain: [-1, 0] }).bands, ["store"]);
  // A justified figure keeps the bands it is drawn with: the plate takes it on its own terms.
  assert.deepEqual(kept({ store: [2, 0], plain: [1, 0] }, true).bands, ["store"]);
  assert.deepEqual(keptBands(draw({ plain: [0, 0] }), [], false).bands, []);
});

test("a band that crosses wires the plain figure does not is drawn plain, and the figure names it", () => {
  // Found by a search of three-row views: with its last row's store drawn as a band, this figure has more crossings
  // than its two drawn plain.
  const model = storeModel(
    7,
    [
      [4, 7, "reads"],
      [6, 7, "reads"],
      [2, 4, "calls"],
      [2, 5, "calls"],
      [3, 4, "calls"],
      [3, 6, "calls"],
      [2, 7, "writes"],
    ],
    "external",
  );
  const tiers = [["c1", "c2", "c3"], ["c4", "c5", "c6"], ["c7"]];
  const { unbanded, ...made } = figure(model, tiers);
  assert.deepEqual(unbanded, ["c7"]);
  assert.deepEqual(made, figure(model, tiers, { band: false }));
  assert.equal(made.measures.crossings, 2);
});

/** Seven cards: c1, a person, uses c2, which calls c3, c4 and c5; c4 runs c6, which reads c7. */
const SPREAD = storeModel(
  7,
  uses([
    [1, 2],
    [2, 3],
    [2, 4],
    [2, 5],
    [4, 6],
    [6, 7],
  ]),
  "backend",
  [1],
);

test("justified rows spread between the insets in the order placement gave them, and a lone card keeps its place", () => {
  // The person stands on a row of its own above the system's boundary.
  const tiers = [["c1"], ["c2"], ["c3", "c4", "c5"], ["c6"], ["c7"]];
  const plain = figure(SPREAD, tiers, { band: false });
  const made = figure(SPREAD, tiers, { band: false, justify: true });
  assert.deepEqual(
    made.rows.map(({ members }) => members),
    plain.rows.map(({ members }) => members),
  );
  const { inset } = simpleMetrics(SPREAD).spacing;
  const at = (/** @type {any} */ layout, /** @type {string} */ id) => layout.cards.get(id);
  const spread = made.rows[2].members.map((id) => at(made, id));
  assert.equal(spread[0].x, inset);
  assert.equal(spread.at(-1).x + spread.at(-1).width, made.width - inset);
  const gaps = spread.slice(1).map((card, index) => card.x - spread[index].x - spread[index].width);
  assert.ok(
    gaps.every((gap) => Math.abs(gap - gaps[0]) < 1e-9),
    `gaps ${gaps}`,
  );
  for (const id of ["c1", "c2", "c6", "c7"]) assert.equal(at(made, id).x, at(plain, id).x, id);
  assert.ok(made.measures.crossings === 0 && made.measures.routes === 0);
  assert.deepEqual(enclosed(made, SPREAD), []);
});

test("a justified figure that would bring an outside card inside the system's boundary is not drawn", () => {
  // The person stands beside c2 in the first row; the spread row below would widen the boundary over it.
  const tiers = [["c1", "c2"], ["c3", "c4", "c5"], ["c6"], ["c7"]];
  assert.deepEqual(enclosed(figure(SPREAD, tiers, { band: false }), SPREAD), []);
  assert.throws(() => figure(SPREAD, tiers, { band: false, justify: true }), {
    code: "layout_boundary_unplaced",
  });
});

test("a justified row of outside and inside parts keeps its places", () => {
  const model = storeModel(
    3,
    uses([
      [1, 2],
      [2, 3],
    ]),
    "backend",
    [1],
  );
  const tiers = [["c1", "c2"], ["c3"]];
  assert.deepEqual(
    figure(model, tiers, { band: false, justify: true }).cards,
    figure(model, tiers, { band: false }).cards,
  );
});

test("a figure neither banded nor justified routes its wires on the lattice, as on dev", () => {
  // Found by a search of random views: offered the corridors between a justified row's cards, this plain figure's
  // wires take others. The digest is of its wires as dev 92c19b2b laid them out.
  const edges = /** @type {Array<[number, number, string]>} */ (
    [
      [1, 2],
      [1, 5],
      [1, 7],
      [1, 8],
      [1, 9],
      [2, 8],
      [4, 6],
      [4, 7],
      [4, 9],
      [5, 8],
      [6, 7],
      [6, 9],
      [7, 9],
    ].map(([from, to]) => [from, to, "calls"])
  );
  const model = validateModel(graphModel(9, edges));
  const made = figure(model, [["c1"], ["c2", "c3", "c4", "c5"], ["c6", "c7", "c8", "c9"]], {
    band: false,
  });
  assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(made.paths)).digest("hex"),
    "48c277b2abda90aad4ecf02f544406c69db53422b3793c59940148a34f6206d6",
  );
});
