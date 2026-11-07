import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { loadIcons } from "../src/icons.mjs";
import { loadModel, validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView, composePlates, gutterFor } from "../src/poster/compose/plates.mjs";
import { loadTypefaces, requireGlyphs } from "../src/poster/text.mjs";
import { POSTER, figureStyles } from "../src/poster/tokens.mjs";
import {
  AIGW_MODEL,
  BIG_BANK_MODEL,
  ETHOS_PROOF_PLANE_MODEL,
  SELF_MODEL,
  graphModel,
  minimalModel,
} from "./fixtures/models.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

// The print edition's body, 1504 by 714 points, in pixels at two thirds of a
// point each.
const BODY = Object.freeze({ width: 2256, height: 1071 });

/** Plan a model's views and compose its edition plates, as the build does. */
async function platesOf(model) {
  const views = await planViews(model, async (view) => admitsView(model, view, typefaces, icons));
  return { views, plates: composePlates(model, views, typefaces, icons) };
}

const loaded = async (file) => (await loadModel(file, { icon: icons.has })).model;

/** The x or y of each numbered tier label a plate draws. */
const tierNumbers = (plate, axis) =>
  [...plate.svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="14"/gu)].map((match) =>
    Number(match[axis === "x" ? 1 : 2]),
  );

test("every figure step is on the type scale, and no size passes 1.8 times its densest step", () => {
  const [first] = POSTER.steps;
  for (const step of POSTER.steps)
    for (const [role, size] of Object.entries(step)) {
      assert.ok(size >= POSTER.floor, `${role} is ${size} px`);
      assert.ok(POSTER.scale.includes(size), `${role} ${size} px is off the scale`);
      assert.ok(size <= 1.8 * first[role], `${role} ${size} px against ${first[role]} px`);
    }
});

test("each edition plate draws its figures alone, within the edition's body", async () => {
  const { plates } = await platesOf(await loaded(AIGW_MODEL));
  assert.ok(plates.length > 0);
  for (const plate of plates) {
    assert.ok(plate.width <= BODY.width, `plate ${plate.page} is ${plate.width} px wide`);
    assert.ok(plate.height <= BODY.height, `plate ${plate.page} is ${plate.height} px high`);
    assert.match(plate.svg, new RegExp(`viewBox="0 0 ${plate.width} ${plate.height}"`, "u"));
    // No paper and no text: the edition's page is the paper, and Typst sets
    // the head, the key and every run.
    assert.doesNotMatch(plate.svg, /<rect width="\d+" height="\d+" fill=/u);
    assert.doesNotMatch(plate.svg, /<text|<path fill="#[0-9A-Fa-f]{6}" d="M[^"]*Z|NaN|undefined/u);
    assert.ok(plate.runs.length > 0);
  }
});

test("AIGW's plates are the same twice and none crosses a wire or runs one beside a card", async () => {
  const model = await loaded(AIGW_MODEL);
  const first = await platesOf(model);
  const second = await platesOf(model);
  assert.deepEqual(
    first.plates.map(({ views }) => views),
    [["overview"], ["authority"], ["adapters"]],
  );
  assert.deepEqual(first.plates, second.plates);
  for (const plate of first.plates)
    assert.deepEqual([plate.measures.crossings, plate.measures.routes], [0, 0], plate.views[0]);
});

test("an edition plate's legend names the kinds its figures show, each with its label", async () => {
  const model = await loaded(AIGW_MODEL);
  const { views, plates } = await platesOf(model);
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
  const { plates } = await platesOf(await loaded(ETHOS_PROOF_PLANE_MODEL));
  assert.deepEqual(
    plates.map(({ views }) => views),
    [["overview"], ["proof"]],
  );
});

test("the publisher's own model plates each view without crossings, its overview's tier labels in one column", async () => {
  const { plates } = await platesOf(await loaded(SELF_MODEL));
  assert.deepEqual(
    plates.map(({ views }) => views),
    [["overview"], ["layout"], ["media"]],
  );
  for (const plate of plates) assert.equal(plate.measures.crossings, 0, plate.views[0]);
  // The overview's five tiers start at different columns; their numbered
  // labels still stand in one straight column.
  const numbers = tierNumbers(plates[0], "x");
  assert.equal(numbers.length, 5);
  assert.equal(new Set(numbers).size, 1);
});

test("the tier-label column is as wide as its labels need and no wider than its token", () => {
  assert.equal(gutterFor(typefaces, []), 0);
  const tier = figureStyles(/** @type {any} */ (POSTER.steps.at(-1))).tier;
  const short = gutterFor(typefaces, ["Edge", "Core"]);
  assert.ok(short < POSTER.spacing.rowColumn, `${short} px for two short labels`);
  assert.ok(short >= typefaces.measure("Edge", tier) + 64);
  assert.equal(
    gutterFor(typefaces, ["A tier label far longer than any column could hold on one line"]),
    POSTER.spacing.rowColumn,
  );
});

test("tier labels stand before the edge their tier starts at when that leaves less of the plate blank", async () => {
  // AIGW's authority view starts its tiers at different edges: labels in one
  // column leave paper between it and the tiers that start further in, so the
  // plate sets each label before its own tier's edge.
  const { plates } = await platesOf(await loaded(AIGW_MODEL));
  const plate = plates.find(({ views: [id] }) => id === "authority");
  assert.equal(plate?.composition.tierLabels, "edges");
  const numbers = tierNumbers(plate, "x");
  assert.ok(numbers.length > 1);
  assert.ok(new Set(numbers).size > 1, "every label stands in one column");
});

test("a wrapped tier's label stands level with its first row beside a bracket over its rows", async () => {
  // Nine workers are more than one row holds, so their tier wraps onto two rows
  // under the one card that calls them all.
  const model = validateModel(
    graphModel(
      10,
      Array.from({ length: 9 }, (_, index) => [10, index + 1]),
      {
        views: [
          {
            id: "wide",
            tiers: [
              { id: "entry", label: "Entry", members: ["c10"] },
              {
                id: "workers",
                label: "Workers",
                members: Array.from({ length: 9 }, (_, index) => `c${index + 1}`),
              },
            ],
          },
        ],
      },
    ),
  );
  const {
    plates: [plate],
  } = await platesOf(model);
  assert.equal(plate.composition.tierLabels, "column");
  const brackets = [
    ...plate.svg.matchAll(/<path d="M[\d.]+,([\d.]+) H[\d.]+ V([\d.]+) H[\d.]+" fill="none"/gu),
  ].map(([, top, bottom]) => [Number(top), Number(bottom)]);
  assert.equal(brackets.length, 1);
  const [[top, bottom]] = brackets;
  const [, label] = tierNumbers(plate, "y");
  // The workers' label stands level with the first of the rows its bracket
  // spans, which are taller than one card row.
  assert.ok(
    top < label && label < (top + bottom) / 2,
    `label at ${label}, bracket ${top}–${bottom}`,
  );
  assert.ok(bottom - top > 300, `bracket ${bottom - top} px`);
});

test("a plate lays its rows out uncentred when centring crosses a relation that skips a row", async () => {
  // Centred, the AIGW authority view's lone credential store sits under the
  // middle of the row above it, so the relation from native discovery past it
  // to the synchronizer turns across the store's wire to the adapter contract.
  // Placement weighs only the wires between neighbouring rows, so the plate
  // measures the uncentred rows as well and draws those.
  const { plates } = await platesOf(await loaded(AIGW_MODEL));
  const plate = plates.find(({ views }) => views.includes("authority"));
  assert.equal(plate?.composition.centring, null);
  assert.equal(plate?.measures.crossings, 0);
});

test("statuses and the boundary appear in the drawing", async () => {
  const base = JSON.parse(await fs.readFile(BIG_BANK_MODEL, "utf8"));
  base.components[1].status = "planned";
  base.components[2].status = "retired";
  base.relations[0].status = "planned";
  base.relations[1].status = "retired";
  const { plates } = await platesOf(validateModel(base));
  const drawn = plates.map(({ svg }) => svg).join("\n");
  assert.match(drawn, /stroke-dasharray="6 4"/u);
  assert.match(drawn, /stroke-dasharray="1\.5 3\.5"/u);
  const shapes = new Set(plates.flatMap(({ legend }) => legend.map(({ shape }) => shape)));
  for (const shape of ["boundary", "outside", "planned", "retired"])
    assert.ok(shapes.has(shape), shape);
});

test("a plate records the balance gates it misses rather than refusing them", async () => {
  // One relation between two cards leaves most of the body blank at the
  // largest type step; the plate is still printed, with what it misses.
  const { plates } = await platesOf(validateModel(graphModel(2, [[1, 2]])));
  assert.equal(plates.length, 1);
  const [plate] = plates;
  assert.equal(plate.step, POSTER.steps.length - 1);
  assert.ok(plate.misses.length);
  for (const miss of plate.misses)
    assert.ok(Math.abs(miss.value) > miss.limit || miss.measure === "blankBand", miss.measure);
});

test("a view no composition lays out in the body is refused by name", async () => {
  const base = graphModel(4, [
    [1, 2],
    [2, 3],
    [3, 4],
  ]);
  base.components[0] = { ...base.components[0], label: "Unbreakable".repeat(9) };
  const model = validateModel(base);
  const views = await planViews(model, async () => ({ fits: true, width: 1, height: 1 }));
  assert.throws(
    () => composePlates(model, views, typefaces, icons),
    (error) =>
      error.code === "plate_unfittable" &&
      /View architecture cannot be laid out in the edition's body/u.test(error.message) &&
      error.problems[0].path === "/views/architecture",
  );
  // A plan without groups whose only view is refused asks for structure, naming why.
  await assert.rejects(platesOf(model), (error) => {
    assert.equal(error.code, "plan_requires_structure");
    assert.ok(error.problems.some(({ code }) => code === "plate_unfittable"));
    return true;
  });
});

test("CJK labels compose and characters the fonts lack are refused", () => {
  const model = validateModel(
    minimalModel({
      title: "网关架构",
      question: "请求如何到达上游？",
      components: [
        { id: "a", label: "客户端" },
        { id: "b", label: "统一网关", details: { 职责: ["鉴权", "路由"] } },
      ],
      relations: [{ id: "a-b", from: "a", to: "b", label: "发送请求" }],
    }),
  );
  const view = {
    id: "view",
    title: model.title,
    question: model.question,
    summary: model.summary,
    origin: "complete",
    tiers: null,
    components: model.components,
    relations: model.relations,
  };
  assert.equal(admitsView(model, view, typefaces, icons).fits, true);
  requireGlyphs(typefaces, [{ path: "/title", text: model.title }]);
  assert.throws(
    () =>
      requireGlyphs(typefaces, [
        { path: "/title", text: "ok" },
        { path: "/components/0/label", text: "smile 😀" },
      ]),
    (error) =>
      error.code === "glyphs_missing" &&
      error.problems.length === 1 &&
      error.problems[0].path === "/components/0/label",
  );
});
