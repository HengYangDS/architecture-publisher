import assert from "node:assert/strict";
import test from "node:test";
import { loadIcons } from "../packages/publisher/src/icons.mjs";
import { validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { GATES, composeEdition } from "../packages/publisher/src/poster/compose.mjs";
import { LIVE, gutterFor, planSheet } from "../packages/publisher/src/poster/page.mjs";
import { loadTypefaces } from "../packages/publisher/src/poster/text.mjs";
import { POSTER, figureStyles } from "../packages/publisher/src/poster/tokens.mjs";
import { graphModel, pageModel } from "./fixtures/models.mjs";

const none = { state: "none", records: [] };
const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

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

test("a long legend is set in sub-columns beside a one-line title", () => {
  const kinds = Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => [
      `k${index}`,
      { label: `kind ${index}`, category: "backend", icon: "server" },
    ]),
  );
  const model = validateModel(
    graphModel(10, [], {
      title: "Wide",
      kinds,
      components: Array.from({ length: 10 }, (_, index) => ({
        id: `c${index + 1}`,
        label: `Component ${index + 1}`,
        kind: `k${index}`,
      })),
    }),
  );
  const view = {
    id: "all",
    title: model.title,
    question: model.question,
    components: model.components,
    relations: [],
  };
  const page = planSheet(
    { model, views: [view], provenance: none, typefaces },
    { archetype: "stack" },
  );
  assert.ok(page);
  // Ten entries in one column would stand 240 px tall beside a 140 px head.
  const columns = new Set(page.glyphs.map((glyph) => glyph.x));
  assert.ok(columns.size > 1, "the legend keeps one column");
  const bottom = Math.max(...page.glyphs.map((glyph) => glyph.top + glyph.size));
  assert.ok(bottom - LIVE.y <= 160, `the legend ends ${bottom - LIVE.y} px below the top`);
});

test("a single view sets its head and legend beside its figure, clear of every card and wire", async () => {
  const model = validateModel(pageModel());
  const views = await planViews(model, () => ({
    fits: true,
    width: POSTER.width,
    height: POSTER.height,
  }));
  const [page] = composeEdition(model, views, typefaces, icons, none);
  assert.equal(page.composition.archetype, "corner");
  assert.ok(page.balance.emptyShare <= GATES.emptyShare);
  // Every run of page text keeps clear of every card, wire and label.
  const figure = page.made.flatMap((one) => one.figure.rects);
  for (const run of page.page.runs) {
    const box = {
      x: run.x,
      y: run.top,
      width: typefaces.measure(run.value, run.style),
      height: run.style.line,
    };
    for (const rect of figure)
      assert.ok(
        box.x >= rect.x + rect.width + 31 ||
          rect.x >= box.x + box.width + 31 ||
          box.y >= rect.y + rect.height + 31 ||
          rect.y >= box.y + box.height + 31,
        `"${run.value}" touches the figure`,
      );
  }
});

test("a title no composition can set is refused, not cut", () => {
  const title = Array.from({ length: 30 }, () => "Architecture").join(" ");
  const model = validateModel(graphModel(4, [[1, 2]], { title }));
  return planViews(model, () => ({ fits: true, width: POSTER.width, height: POSTER.height })).then(
    (views) =>
      assert.throws(
        () => composeEdition(model, views, typefaces, icons, none),
        (error) => error.code === "poster_title_too_long",
      ),
  );
});

test("a plan whose text or plates do not fit its archetype is not a candidate", () => {
  const model = validateModel(pageModel());
  const view = (id) => ({ ...wholeView(model), id });
  const input = (views, extra = {}) => ({
    model: { ...model, ...extra },
    views,
    provenance: none,
    typefaces,
  });
  const one = [view("one")];
  const two = [view("one"), view("two")];
  // A corner page sets one view.
  assert.equal(planSheet(input(two), { archetype: "corner" }), null);
  // Figures taller than the region, together or side by side.
  assert.equal(planSheet(input(one), { archetype: "stack", weights: [5000] }), null);
  assert.equal(
    planSheet(input(two), { archetype: "stack", across: true, weights: [5000, 1] }),
    null,
  );
  // A plate squeezed below the shallowest band.
  assert.equal(
    planSheet(input([view("one"), view("two"), view("three")]), {
      archetype: "stack",
      weights: [600, 1, 1],
    }),
    null,
  );
  // A head too long for a rail or a reserved strip.
  const title = Array.from({ length: 24 }, () => "Architecture").join(" ");
  assert.equal(planSheet(input(one, { title }), { archetype: "column", rail: 3 }), null);
  assert.equal(planSheet(input(one, { title }), { archetype: "corner", reserve: true }), null);
  assert.equal(planSheet(input(one, { title }), { archetype: "stack" }), null);
});

test("a view no page can draw is refused by name", async () => {
  const word = "Unbreakable".repeat(9);
  const base = graphModel(4, [
    [1, 2],
    [2, 3],
    [3, 4],
  ]);
  base.components[0] = { ...base.components[0], label: word };
  const model = validateModel(base);
  const views = await planViews(model, () => ({
    fits: true,
    width: POSTER.width,
    height: POSTER.height,
  }));
  assert.throws(
    () => composeEdition(model, views, typefaces, icons, none),
    (error) =>
      error.code === "poster_unfittable" &&
      /cannot be laid out on a 2400 × 1350 page/u.test(error.message) &&
      error.problems.length === views.length,
  );
});

/** A view of the whole model, as a plan without groups draws it. */
function wholeView(model) {
  return {
    id: "whole",
    title: model.title,
    question: model.question,
    summary: model.summary,
    origin: "complete",
    tiers: null,
    components: model.components,
    relations: model.relations,
  };
}
