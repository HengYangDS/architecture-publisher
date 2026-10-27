import assert from "node:assert/strict";
import test from "node:test";
import { ROW_LIMIT, viewRows } from "../packages/publisher/src/layout/rows.mjs";
import { validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { graphModel, minimalModel } from "./fixtures/models.mjs";

const fits = async () => ({ fits: true, width: 1800, height: 1000 });
const tooTall = async () => ({ fits: false, width: 1800, height: 1600 });
const rowsOf = (model) =>
  viewRows({ tiers: null, components: model.components, relations: model.relations }).map(
    ({ members }) => members,
  );

test("a model that fits is one complete view carrying the model summary", async () => {
  const model = validateModel(minimalModel({ summary: "All of it." }));
  const [view] = await planViews(model, fits);
  assert.equal(view.id, "architecture");
  assert.equal(view.origin, "complete");
  assert.equal(view.summary, "All of it.");
  assert.deepEqual(
    view.components.map(({ id }) => id),
    ["a", "b"],
  );
  assert.deepEqual(
    view.relations.map(({ id }) => id),
    ["a-b"],
  );
});

test("declared views keep their members, tiers and the first view's summary", async () => {
  const model = validateModel(
    minimalModel({
      summary: "Model summary.",
      components: [
        { id: "a", label: "Alpha" },
        { id: "b", label: "Beta" },
        { id: "c", label: "Gamma" },
      ],
      relations: [
        { id: "a-b", from: "a", to: "b", label: "calls" },
        { id: "b-c", from: "b", to: "c", label: "stores" },
      ],
      groups: [{ id: "front", label: "Front", members: ["a"] }],
      views: [
        { id: "first", tiers: ["front", { id: "rest", label: "Rest", members: ["b"] }] },
        { id: "second", members: ["b", "c"], summary: "Own." },
      ],
    }),
  );
  const asked = [];
  const views = await planViews(model, async (view) => {
    asked.push(view.id);
    return { fits: true, width: 1, height: 1 };
  });
  assert.deepEqual(asked, ["first", "second"]);
  assert.deepEqual(
    views.map(({ summary }) => summary),
    ["Model summary.", "Own."],
  );
  assert.deepEqual(
    views[0].relations.map(({ id }) => id),
    ["a-b"],
  );
  assert.deepEqual(
    views[1].relations.map(({ id }) => id),
    ["b-c"],
  );
  assert.equal(views[0].origin, "declared");
});

test("an oversized model with groups becomes an overview plus one view per group", async () => {
  const model = validateModel(
    graphModel(
      5,
      [
        [1, 2],
        [1, 3, "reads"],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 1],
      ],
      {
        groups: [
          { id: "edge", label: "Edge", members: ["c1", "c2"] },
          { id: "core", label: "Core", members: ["c3", "c4"] },
        ],
      },
    ),
  );
  const views = await planViews(model, async (view) =>
    view.id === "architecture"
      ? { fits: false, width: 1800, height: 2000 }
      : { fits: true, width: 1, height: 1 },
  );
  assert.deepEqual(
    views.map(({ id }) => id),
    ["overview", "edge", "core"],
  );
  const overview = views[0];
  assert.deepEqual(
    overview.components.map(({ id, group }) => [id, group ?? false]),
    [
      ["edge", true],
      ["core", true],
      ["c5", false],
    ],
  );
  assert.deepEqual(overview.components[0].details, [["includes", ["Component 1", "Component 2"]]]);
  assert.deepEqual(
    overview.relations.map(({ from, to, label, details, relations }) => [
      from,
      to,
      label,
      details,
      relations,
    ]),
    [
      ["edge", "core", "reads / uses", [["relations", ["2"]]], ["r2", "r3"]],
      ["core", "c5", "uses", [], ["r5"]],
      ["c5", "edge", "uses", [], ["r6"]],
    ],
  );
  const core = views[2];
  assert.deepEqual(
    core.components.map(({ id, context }) => [id, context ?? false]),
    [
      ["c1", true],
      ["c2", true],
      ["c3", false],
      ["c4", false],
      ["c5", true],
    ],
  );
  assert.equal(core.title, "Core");
  assert.equal(core.summary, null);
});

test("planning refuses oversized views it cannot split", async () => {
  await assert.rejects(planViews(validateModel(minimalModel()), tooTall), {
    code: "plan_requires_structure",
  });
  const groups = Array.from({ length: 5 }, (_, index) => ({
    id: `g${index}`,
    label: `G${index}`,
    members: [`c${index + 1}`],
  }));
  await assert.rejects(
    planViews(validateModel(graphModel(5, [[1, 2]], { groups })), tooTall),
    (error) => error.code === "plan_views_exceeded" && /exceeds 5 views/u.test(error.message),
  );
  await assert.rejects(
    planViews(validateModel(minimalModel({ views: [{ id: "v", members: ["a", "b"] }] })), tooTall),
    (error) =>
      error.code === "plan_not_admitted" &&
      error.problems[0].path === "/views/v" &&
      /1800 × 1600 px with 2 components and 1 relations/u.test(error.problems[0].message),
  );
});

test("declared tiers keep their order and drop members the view does not show", () => {
  const rows = viewRows({
    tiers: [
      { id: "t1", label: "One", members: ["a", "x"] },
      { id: "t2", label: "Two", members: ["b"] },
    ],
    components: [{ id: "a" }, { id: "b" }],
    relations: [],
  });
  assert.deepEqual(rows, [
    { id: "t1", label: "One", members: ["a"] },
    { id: "t2", label: "Two", members: ["b"] },
  ]);
});

test("automatic rows follow relations, reverse cycles and ignore self relations", () => {
  const chain = validateModel(
    graphModel(4, [
      [1, 2],
      [2, 3],
      [3, 4],
    ]),
  );
  assert.deepEqual(rowsOf(chain), [["c1"], ["c2"], ["c3"], ["c4"]]);
  const cycle = graphModel(3, [
    [1, 2],
    [2, 3],
    [3, 1],
  ]);
  assert.deepEqual(rowsOf(cycle), [["c1"], ["c2"], ["c3"]]);
  const looped = graphModel(2, [[1, 2]]);
  looped.relations.push({ id: "self", from: "c1", to: "c1", label: "loops" });
  assert.deepEqual(rowsOf(looped), [["c1"], ["c2"]]);
  const rows = viewRows({ tiers: null, components: chain.components, relations: chain.relations });
  assert.deepEqual(
    rows.map(({ id, label }) => [id, label]),
    [
      ["row-1", null],
      ["row-2", null],
      ["row-3", null],
      ["row-4", null],
    ],
  );
});

test("siblings that call each other share a row when that reduces depth", () => {
  const model = graphModel(4, [
    [1, 2],
    [1, 3],
    [2, 3],
    [3, 4],
  ]);
  assert.deepEqual(rowsOf(model), [["c1"], ["c2", "c3"], ["c4"]]);
});

test("sibling merges that would contradict an order or overfill a row are rejected", () => {
  // c2 and c4 share caller c1 but c2 reaches c4 through c3, so one row cannot hold both.
  const contradicted = graphModel(4, [
    [1, 2],
    [1, 4],
    [2, 3],
    [3, 4],
  ]);
  assert.deepEqual(rowsOf(contradicted), [["c1"], ["c2"], ["c3"], ["c4"]]);
  // Pulling c3 up beside its sibling c2 would put eight cards in one row.
  const edges = [
    [1, 2],
    ...Array.from({ length: ROW_LIMIT + 1 }, (_, index) => [1, index + 3]),
    [2, 3],
  ];
  const crowded = graphModel(ROW_LIMIT + 3, edges);
  assert.deepEqual(rowsOf(crowded), [["c1"], ["c2", "c4", "c5", "c6", "c7", "c8", "c9"], ["c3"]]);
});

test("sources move down beside their nearest consumer", () => {
  const model = graphModel(4, [
    [1, 2],
    [2, 3],
    [4, 3],
  ]);
  assert.deepEqual(rowsOf(model), [["c1"], ["c2", "c4"], ["c3"]]);
});
