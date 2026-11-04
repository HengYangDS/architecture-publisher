import assert from "node:assert/strict";
import test from "node:test";
import { DIAGRAM_WIDTHS, archifyIds, diagramCandidates, textUnits } from "../src/map/archify.mjs";
import { chooseDiagram } from "../src/map/choice.mjs";
import { loadModel, validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { AIGW_MODEL, BIG_BANK_MODEL, graphModel, minimalModel } from "./fixtures/models.mjs";

const fits = async () => ({ fits: true, width: 2400, height: 1350 });
/** A model's views as the plan derives them, every view admitted. */
const viewsOf = (model) => planViews(model, fits);
const firstView = async (model) => (await viewsOf(model))[0];
/** Each connection's sides by relation id, null where Archify chooses. */
const sidesOf = (document) =>
  Object.fromEntries(
    document.connections.map(({ id, fromSide, toSide }) => [
      id,
      [fromSide ?? null, toSide ?? null],
    ]),
  );
/** Inline tiers, one row each, so a test fixes the rows. */
const tiers = (...rows) =>
  rows.map((members, index) => ({ id: `t${index}`, label: `T${index}`, members }));

test("text units count full-width characters twice", () => {
  assert.equal(textUnits("abc"), 3);
  assert.equal(textUnits("网关"), 4);
  assert.equal(textUnits("ＡＢ"), 4);
});

test("ids become valid and unique, relation labels are shared and a card shows only a whole detail", async () => {
  assert.deepEqual([...archifyIds(["1st", "a.b", "a_b"]).values()], ["n-1st", "a_b", "a_b-2"]);
  const model = validateModel(
    minimalModel({
      components: [
        {
          id: "1st",
          label: "First",
          details: {
            purpose: "a long explanation of what this component does for everyone",
            role: "source",
          },
        },
        { id: "a.b", label: "Dotted" },
        { id: "a_b", label: "Underscored" },
      ],
      relations: [
        { id: "1", from: "1st", to: "a.b", label: "feeds" },
        { id: "2", from: "1st", to: "a_b", label: "feeds" },
      ],
    }),
  );
  const [{ document }] = diagramCandidates(model, await firstView(model));
  assert.deepEqual(
    document.components.map(({ id }) => id),
    ["n-1st", "a_b", "a_b-2"],
  );
  // The first detail is longer than the card holds, so the card shows the
  // first one it holds whole; the page's steps carry both.
  assert.equal(document.components[0].sublabel, "role: source");
  assert.equal(document.components[1].sublabel, undefined);
  assert.deepEqual(
    document.connections.map(({ id, label }) => [id, label ?? null]),
    [
      ["n-1", "feeds"],
      ["n-2", null],
    ],
  );
});

test("every AIGW view has native architecture candidates on the grid, without kind tags", async () => {
  const { model } = await loadModel(AIGW_MODEL);
  const views = await viewsOf(model);
  assert.equal(views.length, 3);
  for (const view of views) {
    const candidates = diagramCandidates(model, view);
    assert.ok(candidates.length > 0, view.id);
    assert.equal(
      new Set(candidates.map(({ document }) => JSON.stringify(document))).size,
      candidates.length,
    );
    for (const { width, rows, nodes, document } of candidates) {
      assert.ok(DIAGRAM_WIDTHS.includes(width), `${width}`);
      assert.ok(Math.max(...rows) <= 5, JSON.stringify(rows));
      assert.equal(document.diagram_type, "architecture");
      assert.equal(document.meta.quality_profile, "showcase");
      const [canvas, height] = document.meta.viewBox;
      assert.equal(canvas, width);
      assert.ok(canvas / height < 1.55, "the reader would narrow a wider canvas");
      assert.equal(document.components.length, view.components.length);
      assert.equal(nodes.size, view.components.length);
      assert.equal(new Set(document.components.map(({ size }) => size.join("x"))).size, 1);
      // A kind tag is drawn below Archify's reading floor and would make the page shrink the preview.
      for (const component of document.components) assert.equal(component.tag, undefined);
      for (const connection of document.connections) {
        assert.equal(connection.route, undefined);
        assert.equal(connection.via, undefined);
      }
    }
  }
});

test("inside components share one region and planned relations are dashed", async () => {
  const model = validateModel(
    minimalModel({
      kinds: { user: { label: "user", category: "person" }, service: { label: "service" } },
      components: [
        { id: "user", label: "User", kind: "user" },
        { id: "api", label: "API", kind: "service" },
        { id: "db", label: "Store", kind: "service" },
      ],
      relations: [
        { id: "r1", from: "user", to: "api", label: "calls", status: "planned" },
        { id: "r2", from: "api", to: "db", label: "writes" },
      ],
    }),
  );
  const [{ document }] = diagramCandidates(model, await firstView(model));
  const [region] = document.boundaries;
  assert.equal(region.kind, "region");
  assert.deepEqual(region.wraps, ["api", "db"]);
  assert.equal(document.connections[0].variant, "dashed");
  assert.equal(document.connections[1].variant, undefined);
});

test("cards are as wide as the longest label needs, so a long label takes a spare column's room", async () => {
  // "Personal Banking Customer" needs 173 units at Archify's label size; a spare
  // column for routing once narrowed every card of its view to 166.
  const { model } = await loadModel(BIG_BANK_MODEL);
  for (const view of await viewsOf(model))
    for (const { document } of diagramCandidates(model, view))
      for (const { size } of document.components) assert.ok(size[0] >= 173, `${size[0]}`);
});

test("labels longer than the narrowest diagram's content are refused", async () => {
  const model = validateModel(
    graphModel(6, [[1, 2]], {
      components: Array.from({ length: 6 }, (_, index) => ({
        id: `c${index + 1}`,
        label: `${"Extraordinarily ".repeat(6)}Long Component ${index + 1}`,
      })),
      views: [{ id: "row", members: ["c1", "c2", "c3", "c4", "c5", "c6"] }],
    }),
  );
  const view = await firstView(model);
  assert.throws(
    () => diagramCandidates(model, view),
    (error) =>
      error.code === "page_label_too_long" &&
      error.problems.length === 6 &&
      /640 units/u.test(error.message),
  );
});

test("a label wider than a standard card gets a card as wide as it needs, in narrower rows", async () => {
  // Three labels of 60 characters each need cards over twice the standard
  // width: no row of three holds them, so the view is drawn two or one a row.
  const model = validateModel(
    graphModel(
      3,
      [
        [1, 2],
        [2, 3],
      ],
      {
        components: Array.from({ length: 3 }, (_, index) => ({
          id: `c${index + 1}`,
          label: `${"Extraordinarily ".repeat(3)}Long ${index + 1}`,
        })),
      },
    ),
  );
  const candidates = diagramCandidates(model, await firstView(model));
  assert.ok(candidates.length);
  const need = Math.ceil(textUnits(model.components[0].label) * 11 * 0.6 + 8);
  for (const { rows, document } of candidates) {
    assert.ok(Math.max(...rows) <= 2, JSON.stringify(rows));
    for (const component of document.components) assert.ok(component.size[0] >= need);
  }
});

test("rows hold at most five and are also wrapped at four and three, the widest diagram first", async () => {
  const model = validateModel(
    graphModel(
      7,
      [2, 3, 4, 5, 6, 7].map((to) => [1, to, "notifies"]),
    ),
  );
  const candidates = diagramCandidates(model, await firstView(model));
  for (const { rows } of candidates) assert.ok(Math.max(...rows) <= 5, JSON.stringify(rows));
  assert.ok(candidates.some(({ rows }) => Math.max(...rows) === 5));
  assert.ok(candidates.some(({ rows }) => Math.max(...rows) === 3));
  const widths = candidates.map(({ width }) => width);
  assert.deepEqual(
    widths,
    [...widths].sort((a, b) => b - a),
  );
});

test("a candidate whose boundary cannot be placed omits it and keeps outside components external", async () => {
  const ids = Array.from({ length: 8 }, (_, index) => `c${index + 1}`);
  const model = validateModel(
    graphModel(
      8,
      [
        [1, 5],
        [2, 6],
        [3, 7],
        [4, 8],
      ],
      {
        kinds: { person: { label: "person", category: "person" }, service: { label: "service" } },
        components: ids.map((id, index) => ({
          id,
          label: `Component ${index + 1}`,
          kind: index < 3 ? "person" : "service",
        })),
      },
    ),
  );
  const candidates = diagramCandidates(model, await firstView(model));
  const bounded = candidates.find(({ document }) => document.boundaries);
  assert.deepEqual(bounded?.document.boundaries[0].wraps, ids.slice(3));
  const unbounded = candidates.find(({ document }) => !document.boundaries);
  assert.ok(unbounded);
  assert.equal(unbounded.document.components.filter(({ type }) => type === "external").length, 3);
});

test("a view whose relations the grid cannot wire is refused as the view's layout", async () => {
  // Four cards each asking four others under sixteen labels cannot set their
  // labels in one channel's rows.
  const edges = [1, 2, 3, 4].flatMap((from) =>
    [5, 6, 7, 8].map((to) => [from, to, `asks ${from}${to}`]),
  );
  const model = validateModel(graphModel(8, edges));
  const view = await firstView(model);
  assert.throws(
    () => diagramCandidates(model, view),
    (error) =>
      error.code === "page_layout_refused" &&
      error.problems.length === 16 &&
      error.problems.every(({ code }) => code === "layout_channel_unroutable"),
  );
});

test("a relation within a row too narrow for its label runs below the row, as the grid draws it", async () => {
  const model = validateModel(
    graphModel(
      7,
      [
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [1, 6],
        [5, 6, "resolves the element index"],
        [6, 7],
      ],
      { views: [{ id: "fan", tiers: tiers(["c1"], ["c2", "c3", "c4", "c5", "c6"], ["c7"]) }] },
    ),
  );
  const [first] = diagramCandidates(model, await firstView(model));
  assert.deepEqual(first.rows, [1, 5, 1]);
  assert.deepEqual(sidesOf(first.document).r6, ["bottom", "bottom"]);
});

test("a relation that skips rows leaves its sides to Archify, which routes it around the cards between", async () => {
  const model = validateModel(
    graphModel(
      4,
      [
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 4, "audits"],
      ],
      { views: [{ id: "chain", tiers: tiers(["c1"], ["c2"], ["c3"], ["c4"]) }] },
    ),
  );
  const view = await firstView(model);
  assert.deepEqual(sidesOf(diagramCandidates(model, view)[0].document), {
    r1: ["bottom", "top"],
    r2: ["bottom", "top"],
    r3: ["bottom", "top"],
    r4: [null, null],
  });
  const chosen = await chooseDiagram(model, view);
  assert.deepEqual([chosen.metrics.crossings, chosen.metrics.corridors], [0, 0]);
});

test("a relation that passes cards in its row leaves its sides to Archify as well", async () => {
  const model = validateModel(
    graphModel(
      4,
      [
        [1, 2],
        [2, 3],
        [3, 4],
        [2, 4, "audits"],
      ],
      { views: [{ id: "row", tiers: tiers(["c1"], ["c2", "c3", "c4"]) }] },
    ),
  );
  const view = await firstView(model);
  assert.deepEqual(sidesOf(diagramCandidates(model, view)[0].document), {
    r1: ["bottom", "top"],
    r2: ["right", "left"],
    r3: ["right", "left"],
    r4: [null, null],
  });
  const chosen = await chooseDiagram(model, view);
  assert.deepEqual([chosen.metrics.crossings, chosen.metrics.corridors], [0, 0]);
});
