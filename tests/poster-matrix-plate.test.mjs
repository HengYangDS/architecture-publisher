import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { matrices } from "../src/poster/compose/matrix.mjs";
import {
  composePlates,
  compositionOf,
  compositionWarnings,
  shapesOf,
} from "../src/poster/compose/plates.mjs";
import { HOUSE_STYLE, colorsOf } from "../src/poster/tokens.mjs";
import { DENSE, denseModel } from "./fixtures/matrix.mjs";
import { ETHOS_PROOF_PLANE_MODEL, minimalModel } from "./fixtures/models.mjs";
import { icons, typefaces } from "./fixtures/strips.mjs";

// Which composition a view's plate is drawn in: the one its author names, or by the matrix's rule a matrix where its
// figure in tiers would tangle and a matrix fits the box its plate in tiers keeps; and what the plate keeps of it.

/** A view's shape as the rules read it: its tiers, its parts, and no relations, so no part is a hub or a station. */
const shape = (tiers, parts) => ({
  tiers,
  components: Array.from({ length: parts }, (_, index) => ({ id: `p${index}` })),
  relations: [],
});

/** The composition the rules give a view of no relations, its figure in tiers having `routes` route defects. */
const ruled = (view, routes) =>
  compositionOf(view, routes, shapesOf(validateModel(minimalModel()), view));

test("the rule draws a view of no tiers and eight parts or more as a matrix when its tiers have two route defects", () => {
  assert.equal(ruled(shape(null, 8), 2), "matrix");
  // One route defect is too few; seven parts are too few; declared tiers keep the grid.
  assert.equal(ruled(shape(null, 8), 1), "tiers");
  assert.equal(ruled(shape(null, 7), 5), "tiers");
  assert.equal(ruled(shape([{ id: "t", label: "T", members: [] }], 9), 5), "tiers");
});

test("a view's author names its composition over the rule", () => {
  assert.equal(ruled({ ...shape(null, 9), composition: "tiers" }, 5), "tiers");
  assert.equal(ruled({ ...shape([], 3), composition: "matrix" }, 0), "matrix");
  assert.equal(ruled({ ...shape(null, 9), composition: null }, 2), "matrix");
});

/** A model's plates, each view composed in the house's style. */
async function platesOf(model) {
  const views = await planViews(model, async () => ({ fits: true, width: 1, height: 1 }));
  return composePlates(model, views, typefaces, icons);
}

/** The dense model's one view, declared with the composition it names, or none. */
const denseNaming = (composition) =>
  denseModel(
    {},
    { views: [{ id: "dense", members: DENSE, ...(composition ? { composition } : {}) }] },
  );

test("a view that names the matrix is drawn as one, in the box and with the reading its tiers would have", async () => {
  const [tiers] = await platesOf(denseNaming("tiers"));
  const [matrix] = await platesOf(denseNaming("matrix"));
  // The dense view's tiers have no route defect, so the rule leaves it in tiers.
  const [ruled] = await platesOf(denseNaming(null));
  assert.equal(tiers.measures.routes, 0);
  assert.equal(tiers.composition.kind, undefined);
  assert.equal(ruled.composition.kind, undefined);
  assert.equal(matrix.composition.kind, "matrix");
  for (const field of ["width", "height", "share", "reading", "standfirst", "summary"])
    assert.deepEqual(matrix[field], tiers[field], field);
  assert.deepEqual(compositionWarnings([tiers, matrix, ruled]), []);
});

/**
 * Nine parts and sixteen relations among them, each `<from> <to>` by the parts' numbers: two wirings whose figures in
 * tiers at the full width have one route defect and two, and a third that has two once its first part's name is
 * `LONG`.
 */
const WIRINGS = Object.freeze({
  one: "8 7, 0 7, 5 8, 4 8, 8 0, 5 1, 2 3, 6 0, 1 3, 2 0, 5 0, 2 6, 1 2, 4 5, 4 7, 7 0".split(", "),
  two: "0 8, 8 3, 2 3, 3 4, 1 5, 5 1, 8 6, 7 1, 4 0, 8 1, 3 5, 6 2, 7 4, 2 7, 4 8, 3 0".split(", "),
  long: "4 8, 6 4, 2 8, 4 2, 0 3, 4 6, 1 3, 3 5, 8 3, 7 0, 2 5, 5 0, 8 1, 3 2, 3 7, 4 1".split(
    ", ",
  ),
});

/** A part's name that a card sets in more lines than the two a matrix's row head holds, at every type step. */
const LONG =
  "The part whose name runs on for so many words that a card sets it in more lines than a row head";

/**
 * A model of nine parts wired as given, in one view that names a composition or none; `view` adds the view's fields
 * and `first` names the first part.
 */
function wiredModel(wiring, composition = null, view = {}, first = "Part 0") {
  const ids = Array.from({ length: 9 }, (_, index) => `p${index}`);
  return validateModel(
    minimalModel({
      components: ids.map((id, index) => ({ id, label: index ? `Part ${index}` : first })),
      relations: wiring.map((pair, index) => {
        const [from, to] = pair.split(" ");
        return { id: `r${index}`, from: `p${from}`, to: `p${to}`, label: "calls" };
      }),
      views: [{ id: "wired", members: ids, ...(composition ? { composition } : {}), ...view }],
    }),
  );
}

test("the rule draws the view whose tiers have two route defects as a matrix, and not the one with one", async () => {
  for (const [wiring, routes, kind] of /** @type {const} */ ([
    ["one", 1, undefined],
    ["two", 2, "matrix"],
  ])) {
    // Named tiers, at the full width and with compact cards, the plate is the figure the rule measures.
    const [tiers] = await platesOf(wiredModel(WIRINGS[wiring], "tiers"));
    assert.deepEqual([tiers.share, tiers.measures.routes], [1, routes], wiring);
    const [ruled] = await platesOf(wiredModel(WIRINGS[wiring]));
    assert.equal(ruled.composition.kind, kind, wiring);
    // A matrix records the route defects of the figure in tiers that chose it; a plate in tiers records none.
    assert.deepEqual(ruled.composition.tiers, kind ? { routes } : undefined, wiring);
    assert.equal(tiers.composition.tiers, undefined);
  }
});

test("a view the rule takes whose matrix does not fit is drawn in tiers, and the build is not warned", async () => {
  // Its figure in tiers has two route defects, and no matrix's row head holds its first part's name.
  const [tiers] = await platesOf(wiredModel(WIRINGS.long, "tiers", {}, LONG));
  assert.deepEqual([tiers.share, tiers.measures.routes], [1, 2]);
  const plates = await platesOf(wiredModel(WIRINGS.long, null, {}, LONG));
  assert.equal(plates[0].composition.kind, undefined);
  assert.equal(plates[0].unfitted, undefined);
  assert.deepEqual(compositionWarnings(plates), []);
});

test("a matrix is set at the largest type step at which it fits its plate's box", async () => {
  const model = wiredModel(WIRINGS.two, "matrix");
  const [plate] = await platesOf(model);
  const [view] = await planViews(model, async () => ({ fits: true, width: 1, height: 1 }));
  const box = { x: 0, y: 0, width: plate.width, height: plate.height };
  const scene = { model, typefaces, icons, style: HOUSE_STYLE };
  const steps = [...matrices(scene, view, box)].map(({ step }) => step);
  assert.ok(steps.length > 1, `the matrix fits at ${steps.length} steps`);
  assert.equal(plate.step, Math.max(...steps));
});

/**
 * The proof plane's proof view with longer names and a summary, in the composition given: at the full width below
 * its summary its figure wires no worse than in the whole body, and at 80 percent of the body it wires worse.
 */
async function proofView(composition) {
  const ethos = JSON.parse(await fs.readFile(ETHOS_PROOF_PLANE_MODEL, "utf8"));
  ethos.views = ethos.views
    .filter(({ id }) => id === "proof")
    .map((view) => ({ ...view, summary: "What the proof view shows.", composition }));
  for (const component of ethos.components) component.label += " of one exact HEAD";
  return platesOf(validateModel(ethos));
}

test("a matrix keeps the box of its tiers plate and the reading set beside its figure or above it", async () => {
  const summary = "The parts call one another.";
  for (const [reading, plates] of /** @type {const} */ ([
    ["set", (composition) => platesOf(wiredModel(WIRINGS.two, composition, { summary }))],
    ["above", proofView],
  ])) {
    const [tiers] = await plates("tiers");
    const [matrix] = await plates("matrix");
    assert.deepEqual([tiers.reading, matrix.composition.kind], [reading, "matrix"]);
    for (const field of ["width", "height", "share", "reading", "standfirst", "summary"])
      assert.deepEqual(matrix[field], tiers[field], `${reading}: ${field}`);
  }
});

test("a matrix plate's key draws the boundary as its bracket and a status as a cell edged in its pattern", async () => {
  const [tiers] = await platesOf(denseNaming("tiers"));
  const [matrix] = await platesOf(denseNaming("matrix"));
  const shapes = ["boundary", "planned", "retired"];
  const labels = tiers.legend
    .filter(({ shape }) => shapes.includes(shape))
    .map(({ label }) => label);
  assert.equal(labels.length, shapes.length);
  const samples = matrix.legend.filter(({ label }) => labels.includes(label));
  assert.deepEqual(
    samples.map(({ shape, status }) => [shape, status ?? null]),
    [
      ["bracket", null],
      ["cell", "planned"],
      ["cell", "retired"],
    ],
  );
  // A status's cell takes the colour its relation's cell takes, and is ruled round as every cell.
  const C = colorsOf(HOUSE_STYLE.tokens);
  assert.deepEqual(
    samples.slice(1).map(({ color, rule }) => [color, rule]),
    [
      [C.line, C.rule],
      [C.faint, C.rule],
    ],
  );
});

test("a matrix a view names that does not fit falls back to tiers, and the build is warned", async () => {
  const model = validateModel(
    minimalModel({
      components: ["a", "b", "c"].map((id) => ({ id, label: id === "c" ? LONG : `Part ${id}` })),
      relations: [
        { id: "r1", from: "a", to: "b", label: "calls" },
        { id: "r2", from: "b", to: "c", label: "calls" },
      ],
      views: [{ id: "named", members: ["a", "b", "c"], composition: "matrix" }],
    }),
  );
  const plates = await platesOf(model);
  assert.equal(plates[0].composition.kind, undefined);
  assert.equal(plates[0].unfitted, "matrix");
  assert.deepEqual(compositionWarnings(plates), [
    {
      code: "plate_composition_unfitted",
      path: "/views/named/composition",
      message:
        "View named names the composition matrix, which does not fit the box its plate keeps; the plate is drawn in tiers.",
    },
  ]);
  // A small view that names the matrix and fits is drawn as one, whatever the rule says of its size.
  const [small] = await platesOf(
    validateModel(
      minimalModel({ views: [{ id: "v", members: ["a", "b"], composition: "matrix" }] }),
    ),
  );
  assert.equal(small.composition.kind, "matrix");
  assert.equal(small.unfitted, undefined);
});
