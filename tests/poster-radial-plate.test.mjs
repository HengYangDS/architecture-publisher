import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import {
  composePlates,
  compositionOf,
  compositionWarnings,
  shapesOf,
} from "../src/poster/compose/plates.mjs";
import { ringOf, rings } from "../src/poster/compose/radial.mjs";
import { HOUSE_STYLE } from "../src/poster/tokens.mjs";
import { insideLength } from "../src/layout/measure.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { icons, typefaces } from "./fixtures/strips.mjs";

// Which views are drawn round their centre (src/poster/compose/plates.mjs, radial.mjs): the radial rule reads the view
// alone, so the choice is the same in every language; a plate the rule takes is drawn radial where its figure can be
// drawn at a type step no smaller than its tiers, and records why where it is not; an author may name the radial
// figure, which is then drawn wherever it can be, or the plate warns.

/** The parts of the views these tests draw: a centre and the parts round it, named in two languages. */
const PARTS = Object.freeze([
  ["centre", "Build graph", "构建图"],
  ["p1", "Script", "脚本"],
  ["p2", "Narration", "旁白"],
  ["p3", "Soundtrack", "配乐"],
  ["p4", "Pictures", "画面"],
  ["p5", "Captions", "字幕"],
]);

/** The same parts with Chinese names several times as wide: a figure in tiers of other widths, the same view. */
const WIDE = Object.freeze([
  ["centre", "Build graph", "负责调度全部构建步骤的构建图"],
  ["p1", "Script", "把剧本拆成镜头的脚本解析器"],
  ["p2", "Narration", "录制并对齐旁白音轨的服务"],
  ["p3", "Soundtrack", "混合配乐与音效的混音器"],
  ["p4", "Pictures", "逐帧渲染画面的渲染农场"],
  ["p5", "Captions", "生成并校对字幕的字幕工具"],
]);

/** The centre's five relations out to the parts round it. */
const SPOKES = Object.freeze(
  PARTS.slice(1).map(([id]) => /** @type {[string, string]} */ (["centre", id])),
);

/** Ten parts of long names round one centre: a ring the body holds only at a smaller type than its tiers set. */
const CROWD = Object.freeze([
  ["centre", "Build graph", "构建图"],
  ...Array.from({ length: 10 }, (_, index) => [
    `p${index + 1}`,
    `Station ${index + 1} that renders the frames of its scene`,
    `渲染本场画面的第 ${index + 1} 站`,
  ]),
]);

/**
 * A model of the six parts and one view of them all, its relations each `[from, to]`, in English or its Chinese twin;
 * `view` adds the view's fields, its tiers in place of its members; `outside` names a part outside the repository.
 * @param {Array<[string, string]>} pairs
 * @param {{ view?: { tiers?: object[], composition?: string }, locale?: "en" | "zh-CN",
 *   parts?: ReadonlyArray<readonly string[]>, outside?: string }} [options]
 */
function ringModel(pairs, { view = {}, locale = "en", parts = PARTS, outside } = {}) {
  const zh = locale === "zh-CN";
  return validateModel(
    minimalModel({
      locale,
      title: zh ? "成片" : "Films",
      question: zh ? "哪些部分由构建图驱动？" : "What does the build graph drive?",
      kinds: { external: { label: "external system", category: "external", icon: "landmark" } },
      components: parts.map(([id, en, cn]) => ({
        id,
        label: zh ? cn : en,
        ...(id === outside ? { kind: "external" } : {}),
      })),
      relations: pairs.map(([from, to], index) => ({
        id: `r${index}`,
        from,
        to,
        label: zh ? "生成" : "builds",
      })),
      views: [
        { id: "films", ...(view.tiers ? {} : { members: parts.map(([id]) => id) }), ...view },
      ],
    }),
  );
}

/** A model's views, planned as the build plans them. */
const viewsOf = (model) => planViews(model, async () => ({ fits: true, width: 1, height: 1 }));

/** A model's plates, each view composed in the house's style. */
async function platesOf(model) {
  return composePlates(model, await viewsOf(model), typefaces, icons);
}

/** The composition the rules give a model's one view, its figure in tiers having `routes` route defects. */
async function ruled(model, routes = 0) {
  const [view] = await viewsOf(model);
  return compositionOf(view, routes, shapesOf(model, view));
}

test("the radial rule takes a view whose centre relates to most parts, has no second hub and drives them", async () => {
  // The centre relates to all five parts; one other part relates to two of them; every relation leaves the centre.
  assert.equal(await ruled(ringModel([...SPOKES, ["p1", "p2"]])), "radial");
  // Twice as many of the centre's relations go out from it as come into it, the least the rule takes.
  const drives = [...SPOKES.slice(0, 4), ["p5", "centre"], ["p1", "centre"]];
  assert.equal(await ruled(ringModel(/** @type {Array<[string, string]>} */ (drives))), "radial");
  // It reads the view before the matrix's rule, which reads the figure in tiers of one language: eleven parts whose
  // figure in tiers had five route defects would be a matrix.
  const crowd = ringModel(
    CROWD.slice(1).map(([id]) => ["centre", id]),
    { parts: CROWD },
  );
  assert.equal(await ruled(crowd, 5), "radial");
});

test("the radial rule refuses a ring of two, a second hub, a centre that does not drive, a small centre and an author's tiers", async () => {
  // Two parts round a centre would stand on either side of it, one line across the plate: tiers draws them as a fan.
  const fan = ringModel(
    [
      ["centre", "p1"],
      ["centre", "p2"],
    ],
    { parts: PARTS.slice(0, 3) },
  );
  assert.equal(await ruled(fan), "tiers");
  // A part related to four of the five others besides the centre is a second hub.
  const second = [...SPOKES, ["p1", "p2"], ["p1", "p3"], ["p1", "p4"]];
  assert.equal(await ruled(ringModel(/** @type {Array<[string, string]>} */ (second))), "tiers");
  // Three relations out of the centre and two into it: the others write to it as much as it drives them.
  const product = [
    ["centre", "p1"],
    ["centre", "p2"],
    ["centre", "p3"],
    ["p4", "centre"],
    ["p5", "centre"],
  ];
  assert.equal(await ruled(ringModel(/** @type {Array<[string, string]>} */ (product))), "tiers");
  // A centre related to three of five parts relates to fewer than three quarters of them.
  const small = [
    ["centre", "p1"],
    ["centre", "p2"],
    ["centre", "p3"],
    ["p4", "p5"],
  ];
  assert.equal(await ruled(ringModel(/** @type {Array<[string, string]>} */ (small))), "tiers");
  // An author's tiers are kept.
  const tiers = [
    { id: "top", label: "Top", members: ["centre"] },
    { id: "rest", label: "Rest", members: PARTS.slice(1).map(([id]) => id) },
  ];
  assert.equal(await ruled(ringModel([...SPOKES], { view: { tiers } })), "tiers");
});

test("a model and its other-language twin, whose names set another figure in tiers, are drawn alike", async () => {
  const pairs = /** @type {Array<[string, string]>} */ ([...SPOKES, ["p1", "p2"]]);
  const twins = [ringModel(pairs), ringModel(pairs, { locale: "zh-CN", parts: WIDE })];
  // Their figures in tiers differ, as the wider names set them; a rule that read those figures could part the twins.
  const [englishTiers, chineseTiers] = await Promise.all(
    twins.map(async (model) => {
      const [view] = await viewsOf(model);
      const [plate] = composePlates(model, [{ ...view, composition: "tiers" }], typefaces, icons);
      return plate;
    }),
  );
  assert.notDeepEqual(englishTiers.extent, chineseTiers.extent);
  const [[english], [chinese]] = await Promise.all(twins.map(platesOf));
  assert.deepEqual(
    [english, chinese].map(({ composition: { kind, centre } }) => [kind, centre]),
    [
      ["radial", "centre"],
      ["radial", "centre"],
    ],
  );
});

test("a radial plate records its kind, its centre and the type step of its figure in tiers", async () => {
  const [plate] = await platesOf(ringModel([...SPOKES, ["p1", "p2"]]));
  const { kind, centre, tiers, step, refused } = plate.composition;
  assert.deepEqual(
    { kind, centre, refused },
    { kind: "radial", centre: "centre", refused: undefined },
  );
  assert.ok(step >= tiers.step, `radial step ${step} under the tiers' ${tiers.step}`);
  assert.equal(plate.step, step);
  // Its lines run at a slant from the centre: no bend, and its measures count them as the grid's are counted.
  assert.deepEqual(
    [plate.measures.crossings, plate.measures.routes, plate.measures.bends],
    [0, 0, 0],
  );
  assert.equal(plate.unfitted, undefined);
  assert.deepEqual(compositionWarnings([plate]), []);
});

test("a radial figure joins its centre to each part it relates to by a straight line, and its chord touches no card", async () => {
  const [plate] = await platesOf(ringModel([...SPOKES, ["p1", "p2"]]));
  const boxes = new Map(plate.report.parts.map(({ id, box }) => [id, box]));
  const pathOf = (/** @type {string} */ id) =>
    plate.report.paths.find(({ relations }) => relations.some((relation) => relation.id === id));
  const by = (/** @type {number[]} */ point, box, /** @type {number} */ distance) =>
    point[0] >= box.x - distance &&
    point[0] <= box.x + box.width + distance &&
    point[1] >= box.y - distance &&
    point[1] <= box.y + box.height + distance;
  SPOKES.forEach(([, to], index) => {
    const { points } = pathOf(`r${index}`);
    // One straight stretch, from the centre's card to the part's, which its arrowhead ends at.
    assert.equal(points.length, 2, `the spoke to ${to} bends`);
    assert.ok(by(points[0], boxes.get("centre"), 2), `the spoke to ${to} starts at ${points[0]}`);
    assert.ok(by(points[1], boxes.get(to), 16), `the spoke to ${to} ends at ${points[1]}`);
  });
  const { points } = pathOf("r5");
  for (const box of boxes.values())
    for (let index = 1; index < points.length; index += 1) {
      const inside = { x: box.x + 1, y: box.y + 1, width: box.width - 2, height: box.height - 2 };
      assert.equal(insideLength(points[index - 1], points[index], inside), 0);
    }
});

test("a part outside the repository stands beyond the boundary round the centre and the parts inside", async () => {
  const model = ringModel([...SPOKES, ["p1", "p2"]], { outside: "p5" });
  const [plate] = await platesOf(model);
  assert.equal(plate.composition.kind, "radial");
  // The figure the plate draws, laid out as the composer lays it out in the box of its tiers.
  const [view] = await viewsOf(model);
  const scene = { model, typefaces, icons, style: HOUSE_STYLE };
  const {
    figures: [{ layout }],
  } = rings(scene, view, { width: plate.width, height: plate.height }, ringOf(view));
  const { boundary, cards } = layout;
  const within = (box) =>
    box.x >= boundary.x &&
    box.y >= boundary.y &&
    box.x + box.width <= boundary.x + boundary.width &&
    box.y + box.height <= boundary.y + boundary.height;
  const apart = (box) =>
    box.x >= boundary.x + boundary.width ||
    box.x + box.width <= boundary.x ||
    box.y >= boundary.y + boundary.height ||
    box.y + box.height <= boundary.y;
  for (const id of ["centre", "p1", "p2", "p3", "p4"]) assert.ok(within(cards.get(id)), id);
  assert.ok(apart(cards.get("p5")));
});

test("a centre outside the repository is not drawn round, and the plate records why", async () => {
  const [plate] = await platesOf(ringModel([...SPOKES, ["p1", "p2"]], { outside: "centre" }));
  assert.equal(plate.composition.kind, undefined);
  assert.deepEqual(plate.composition.refused, { kind: "radial", why: "boundary" });
  assert.equal(plate.unfitted, undefined);
});

test("a view the rule takes whose radial figure would set smaller type keeps its tiers and records why", async () => {
  const model = ringModel(
    CROWD.slice(1).map(([id]) => ["centre", id]),
    { parts: CROWD },
  );
  assert.equal(await ruled(model), "radial");
  const [plate] = await platesOf(model);
  assert.equal(plate.composition.kind, undefined);
  assert.deepEqual(plate.composition.refused, { kind: "radial", why: "type" });
  // The rule chose it, so the build is not warned.
  assert.equal(plate.unfitted, undefined);
  assert.deepEqual(compositionWarnings([plate]), []);
});

test("a view whose radial figure the rule takes and the plate refuses is drawn as the matrix's rule gives it", async () => {
  // Three chords across the ring tangle the crowd's figure in tiers, so the matrix's rule, which reads that figure,
  // takes the view its radial figure leaves; the plate still records that the radial figure was refused, and why.
  const chords = [
    ["p1", "p6"],
    ["p2", "p7"],
    ["p3", "p8"],
  ];
  const model = ringModel([...CROWD.slice(1).map(([id]) => ["centre", id]), ...chords], {
    parts: CROWD,
  });
  assert.equal(await ruled(model), "radial");
  const [plate] = await platesOf(model);
  assert.equal(plate.composition.kind, "matrix");
  assert.ok(plate.composition.tiers.routes >= 2, `${plate.composition.tiers.routes} route defects`);
  assert.deepEqual(plate.composition.refused, { kind: "radial", why: "type" });
  assert.equal(plate.unfitted, undefined);
  assert.deepEqual(compositionWarnings([plate]), []);
});

test("an author's radial is drawn where the rule would not take it, and warns where none can be drawn", async () => {
  // A chain, not a star: the radial rule leaves it to the spine's, its author's word draws it round its most related
  // part.
  const chain = /** @type {Array<[string, string]>} */ (
    PARTS.slice(1).map(([id], index) => [PARTS[index][0], id])
  );
  assert.equal(await ruled(ringModel(chain)), "spine");
  const [named] = await platesOf(ringModel(chain, { view: { composition: "radial" } }));
  assert.equal(named.composition.kind, "radial");
  assert.equal(named.unfitted, undefined);
  // A view of two parts has no ring.
  const [pair] = await platesOf(
    validateModel(
      minimalModel({ views: [{ id: "pair", members: ["a", "b"], composition: "radial" }] }),
    ),
  );
  assert.equal(pair.composition.kind, undefined);
  assert.deepEqual(pair.composition.refused, { kind: "radial", why: "parts" });
  assert.equal(pair.unfitted, "radial");
  assert.deepEqual(
    compositionWarnings([pair]).map(({ code, path }) => `${code} ${path}`),
    ["plate_composition_unfitted /views/pair/composition"],
  );
});
