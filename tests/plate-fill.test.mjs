import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { loadModel, validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { takesJustified } from "../src/poster/compose/gates.mjs";
import { admitsView, composePlates } from "../src/poster/compose/plates.mjs";
import {
  AIGW_MODEL,
  BIG_BANK_MODEL,
  BROWSER_USE_MODEL,
  CONTEXT_MODE_MODEL,
  ETHOS_PROOF_PLANE_MODEL,
  SELF_MODEL,
  graphModel,
} from "./fixtures/models.mjs";
import { icons, typefaces } from "./fixtures/strips.mjs";

// The tiers figure's fill on a plate (src/layout/fill.mjs, src/poster/compose/plates.mjs): the store it draws as a
// band and the band a guard takes back, the matrix's rule reading the figure with its band, the figure justified
// beside the chosen one and taken on its terms, the plate's record of each, and every other plate drawn as before.

/** The fixture works, by the names the tests give them. */
const WORKS = Object.freeze({
  bank: BIG_BANK_MODEL,
  aigw: AIGW_MODEL,
  ethos: ETHOS_PROOF_PLANE_MODEL,
  self: SELF_MODEL,
  browser: BROWSER_USE_MODEL,
  context: CONTEXT_MODE_MODEL,
});

/** Each fixture work's plates, planned and composed as the build does them, composed once for every test. */
const composed = new Map();
function platesOf(/** @type {keyof typeof WORKS} */ work) {
  if (!composed.has(work))
    composed.set(
      work,
      (async () => {
        const { model } = await loadModel(WORKS[work], { icon: icons.has });
        const views = await planViews(model, async (view) =>
          admitsView(model, view, typefaces, icons),
        );
        return composePlates(model, views, typefaces, icons);
      })(),
    );
  return composed.get(work);
}

/** A model's plates, its views planned as fitting. */
async function composedOf(model) {
  const views = await planViews(model, async () => ({ fits: true, width: 1, height: 1 }));
  return composePlates(model, views, typefaces, icons);
}

/**
 * A model of cards `c1` to `c<count>` in the tiers given, or in rows that follow its relations where `tiers` is null,
 * wired by `[from, to, label]` edges between their numbers, whose last card is a store of the category given, drawn
 * with the icon of a box whatever its category.
 */
function storeModel(count, edges, tiers, category) {
  return validateModel(
    graphModel(count, edges, {
      kinds: {
        service: { label: "service" },
        store: { label: "store", category, icon: "box" },
      },
      components: Array.from({ length: count }, (_, index) => ({
        id: `c${index + 1}`,
        label: `Component ${index + 1}`,
        kind: index === count - 1 ? "store" : "service",
      })),
      ...(tiers
        ? {
            views: [
              {
                id: "view",
                title: "View",
                tiers: tiers.map((members, index) => ({
                  id: `t${index}`,
                  label: `T${index}`,
                  members,
                })),
              },
            ],
          }
        : {}),
    }),
  );
}

/** Each card's name on a plate, by rows from the top and in each row from the left. */
function rowsOf(/** @type {any} */ plate) {
  /** @type {Map<string, { x: number, baseline: number }>} */
  const names = new Map();
  for (const { component, x, baseline } of plate.runs)
    if (component && !names.has(component)) names.set(component, { x, baseline });
  const tops = [...new Set([...names.values()].map(({ baseline }) => baseline))].sort(
    (a, b) => a - b,
  );
  return tops.map((top) =>
    [...names]
      .filter(([, { baseline }]) => baseline === top)
      .sort(([, a], [, b]) => a.x - b.x)
      .map(([id]) => id),
  );
}

test("a plate draws its last row's store that the row above reads as a band, and records it", async () => {
  const model = storeModel(
    5,
    [
      [1, 5, "reads"],
      [2, 5, "reads"],
      [3, 5, "reads"],
    ],
    [["c1", "c2", "c3", "c4"], ["c5"]],
    "database",
  );
  const [plate] = await composedOf(model);
  assert.deepEqual(plate.composition.bands, ["c5"]);
  assert.equal(plate.composition.unbanded, undefined);
  // The band's name stands at the figure's left, level with the first card's above it.
  const name = (id) => plate.runs.find(({ component }) => component === id).x;
  assert.equal(name("c5"), Math.min(...["c1", "c2", "c3", "c4"].map(name)));
});

test("a band whose figure, or whose plate, wires worse than plain is drawn plain, and the plate records the band it took back", async () => {
  // Found by searches of tiered views composed as plates. Drawn with its band, the first figure has a crossing or a
  // route defect more than drawn plain, and its guard takes the band back. The second keeps its band in every figure,
  // but the plate drawn with it has one crossing fewer and three route defects more than the plate drawn plain, and
  // the plate's guard takes it back.
  const cases = /** @type {Array<[string[][], Array<[number, number, string]>]>} */ ([
    [
      [["c1", "c2"], ["c3", "c4", "c5"], ["c6"]],
      [
        [4, 6, "reads"],
        [5, 6, "reads"],
        [1, 4, "calls"],
        [1, 5, "calls"],
        [2, 3, "calls"],
        [1, 6, "writes"],
      ],
    ],
    [
      [["c1"], ["c2", "c3", "c4", "c5", "c6"], ["c7", "c8"], ["c9"]],
      [
        [7, 9, "reads"],
        [8, 9, "reads"],
        [1, 7, "calls"],
        [3, 7, "calls"],
        [3, 8, "calls"],
        [4, 7, "calls"],
        [5, 8, "calls"],
        [6, 7, "calls"],
        [6, 8, "calls"],
        [1, 9, "writes"],
        [2, 9, "writes"],
        [4, 9, "writes"],
      ],
    ],
  ]);
  for (const [tiers, edges] of cases) {
    const count = tiers.flat().length;
    const store = `c${count}`;
    const [taken] = await composedOf(storeModel(count, edges, tiers, "database"));
    // The same store as a part of the code, which no band may draw, in the same box.
    const [plain] = await composedOf(storeModel(count, edges, tiers, "backend"));
    assert.deepEqual(taken.composition.unbanded, [store]);
    assert.equal(taken.composition.bands, undefined, store);
    const composition = { ...taken.composition };
    delete composition.unbanded;
    assert.deepEqual({ ...taken, composition }, plain, store);
  }
});

test("the matrix's rule reads the figure in tiers with its band", async () => {
  // Found by a search of views of eight parts or more that declare no tiers. Seven of eleven parts read the store;
  // drawn plain, the figure in tiers has four route defects at the full width, and the view is drawn as a matrix;
  // with the store drawn as a band it has fewer than two, and the view stays in tiers.
  const edges = /** @type {Array<[number, number, string]>} */ ([
    [1, 6, "calls"],
    [1, 8, "calls"],
    [1, 10, "calls"],
    [2, 10, "calls"],
    [4, 10, "calls"],
    [5, 9, "calls"],
    ...[3, 4, 6, 7, 8, 9, 10].map((from) => [from, 11, "reads"]),
  ]);
  const [banded] = await composedOf(storeModel(11, edges, null, "database"));
  const [plain] = await composedOf(storeModel(11, edges, null, "backend"));
  assert.deepEqual(
    [banded.composition.kind, banded.composition.tiers, banded.composition.bands],
    [undefined, undefined, ["c11"]],
  );
  assert.deepEqual([plain.composition.kind, plain.composition.tiers], ["matrix", { routes: 4 }]);
});

test("a plate takes the figure justified beside its chosen one when it clears a gate and is no worse", () => {
  const chosen = { misses: ["emptyShare", "holes"], crossings: 1, routes: 0 };
  assert.equal(takesJustified(chosen, { misses: ["emptyShare"], crossings: 1, routes: 0 }), true);
  assert.equal(takesJustified(chosen, { misses: [], crossings: 0, routes: 0 }), true);
  // A crossing or a route defect more, a gate missed that the chosen figure passes, or no gate cleared, and it is not.
  assert.equal(takesJustified(chosen, { misses: [], crossings: 2, routes: 0 }), false);
  assert.equal(takesJustified(chosen, { misses: [], crossings: 1, routes: 1 }), false);
  assert.equal(takesJustified(chosen, { misses: ["blankBand"], crossings: 0, routes: 0 }), false);
  assert.equal(takesJustified(chosen, { ...chosen, misses: ["holes", "emptyShare"] }), false);
});

test("a plate takes its justified figure where it clears a gate, every row in its order", async () => {
  // Found by a search of tiered views composed as plates. Drawn as chosen, this plate misses the blank rectangle and
  // the holes with no crossing and no route defect; justified, it clears the blank rectangle with the same wiring
  // (measured when this test was written).
  const tiers = [["c1", "c2", "c3"], ["c4"], ["c5", "c6", "c7"], ["c8"]];
  const edges = /** @type {Array<[number, number, string]>} */ (
    [
      [1, 4],
      [3, 4],
      [4, 6],
      [4, 7],
      [5, 8],
      [6, 8],
      [7, 8],
    ].map(([from, to]) => [from, to, "calls"])
  );
  const [plate] = await composedOf(
    validateModel(
      graphModel(8, edges, {
        views: [
          {
            id: "view",
            title: "View",
            tiers: tiers.map((members, index) => ({
              id: `t${index}`,
              label: `T${index}`,
              members,
            })),
          },
        ],
      }),
    ),
  );
  assert.equal(plate.composition.justified, true);
  assert.deepEqual(
    plate.misses.map(({ measure }) => measure),
    ["holes"],
  );
  assert.deepEqual([plate.measures.crossings, plate.measures.routes], [0, 0]);
  const rows = rowsOf(plate);
  assert.deepEqual(rows, [["c1", "c2", "c3"], ["c4"], ["c6", "c5", "c7"], ["c8"]]);
  // Its rows of three start at one left edge and end at one right edge; its lone cards keep the middle column.
  const left = (id) => plate.runs.find(({ component }) => component === id).x;
  assert.deepEqual([left("c6"), left("c7")], [left("c1"), left("c3")]);
  assert.ok(left("c1") < left("c2") && left("c2") < left("c3"));
  assert.deepEqual([left("c4"), left("c8")], [left("c2"), left("c2")]);
});

/**
 * The digest of each fixture plate that draws no band, took none back and keeps its chosen figure, as dev 92c19b2b
 * drew it before the fill: its SVG, runs, composition and measures. A change that means to move no such plate
 * leaves them as they are. aigw's overview and authority are as the Change that keeps the boundary inside its plate
 * draws them: the move that centres their ink was rounded past the left edge of their span, by less than half a
 * pixel, and is now rounded inward, 1 px to the right.
 */
const BEFORE = Object.freeze({
  "bank containers-tiers": "3b7e1bc36b2308cf0eaec253f3f91f40646e3b69a2798ca5ef7b4a5945461b88",
  "bank containers-automatic": "8f62655bc6c8d3f128b70452764d0ca473865d5d6eee59bf548068bb715e6e0b",
  "aigw overview": "eeb3133d71a216afe3b4527a3e077d2f25b3bc7a62ea2364bf4a25d511fe6e75",
  "aigw authority": "d4d2e6d9eea8abaf73270b7c36b5031a5409889b206d933f7161d65ee18df69a",
  "aigw adapters": "b64d9ac551f39a75a8f766bf56607ffa167fdb13ffbfac35a6a968f0d5d87acd",
  "ethos overview": "b07e1eca93fb0b2166e378093d21a8e221ec4728c6df7f599d35bc6fc81ef48e",
  "ethos proof": "fc68d8a4faf395179cfb7a1c047fdc04724c19104f7c8dff198faf43a9fe114b",
  "self overview": "599dbca584cd50fb67a092ec4c16ac6b76208bc4fcccd566f2ebcb1450ee32c0",
  "self layout": "10ad4240089983984ddfcb17d12e574a51947be9039b313b16c421899c02075b",
  "browser overview": "59b7ddfd9af893c04ab792f5354dd01c1047293d5fa8864460eba4bb1ed26793",
  "browser perception": "87eb1cef1a024f57800eb12b3ebbeaf43ee764764f490b7ed982f314620c5d6e",
  "context retrieval": "f48d80339d77f60e1ced94dec5f8246b6f96e07dab325cc4794f5d476462f365",
});

test("every fixture plate with no eligible card, and on which the justified figure is not taken, is drawn as on dev", async () => {
  /** @type {Record<string, object>} */
  const filled = {};
  for (const work of /** @type {Array<keyof typeof WORKS>} */ (Object.keys(WORKS)))
    for (const { views, svg, runs, composition, measures } of await platesOf(work)) {
      const name = `${work} ${views[0]}`;
      const { bands, unbanded, justified } = composition;
      if (bands || unbanded || justified) {
        filled[name] = { bands, unbanded, justified };
        continue;
      }
      const digest = crypto
        .createHash("sha256")
        .update(JSON.stringify({ svg, runs, composition, measures }))
        .digest("hex");
      assert.equal(digest, BEFORE[/** @type {keyof typeof BEFORE} */ (name)], name);
    }
  assert.deepEqual(JSON.parse(JSON.stringify(filled)), {
    "self media": { bands: ["supplies"] },
    "browser action": { bands: ["chrome-cdp"] },
    "context overview": { bands: ["agent-host"] },
    "context sandbox": { bands: ["web-origins"] },
  });
});
