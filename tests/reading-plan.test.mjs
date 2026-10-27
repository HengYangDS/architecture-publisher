import assert from "node:assert/strict";
import test from "node:test";
import { ROW_LIMIT, viewRows } from "../packages/publisher/src/layout/rows.mjs";
import { validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import { refuse } from "../packages/publisher/src/refusal.mjs";
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

/** An admission whose layout refuses the named views and finds the others too tall. */
const unroutable =
  (refused, tall = []) =>
  async (view) => {
    if (refused.includes(view.id))
      refuse("layout_channel_unroutable", "The relations between rows 1 and 2 cannot be wired.", [
        { code: "layout_channel_unroutable", path: "/channels/0", message: "a-b" },
      ]);
    return tall.includes(view.id) ? tooTall() : fits();
  };

test("a refused layout names its view, and every refused view is reported", async () => {
  const model = validateModel(
    minimalModel({
      views: ["first", "second", "third"].map((id) => ({ id, members: ["a", "b"] })),
    }),
  );
  await assert.rejects(
    planViews(model, unroutable(["second"], ["third"])),
    (error) =>
      error.code === "layout_channel_unroutable" &&
      error.message ===
        "View second: The relations between rows 1 and 2 cannot be wired. View third is refused too." &&
      JSON.stringify(error.problems.map(({ code, path }) => [code, path])) ===
        JSON.stringify([
          ["layout_channel_unroutable", "/views/second/channels/0"],
          ["view_not_admitted", "/views/third"],
        ]),
  );
  await assert.rejects(
    planViews(model, unroutable([], ["first", "second", "third"])),
    (error) =>
      error.code === "plan_not_admitted" &&
      error.message ===
        "View first does not fit its poster frame. Views second and third are refused too.",
  );
  await assert.rejects(
    planViews(model, async () => {
      throw new TypeError("not a refusal");
    }),
    TypeError,
  );
});

test("an automatic view that cannot be laid out is planned like one that does not fit", async () => {
  const grouped = validateModel(
    graphModel(
      4,
      [
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      {
        groups: [
          { id: "edge", label: "Edge", members: ["c1", "c2"] },
          { id: "core", label: "Core", members: ["c3", "c4"] },
        ],
      },
    ),
  );
  const views = await planViews(grouped, unroutable(["architecture"]));
  assert.deepEqual(
    views.map(({ id }) => id),
    ["overview", "edge", "core"],
  );
  await assert.rejects(
    planViews(validateModel(minimalModel()), unroutable(["architecture"])),
    (error) =>
      error.code === "plan_requires_structure" &&
      error.message ===
        "View architecture with 2 components and 1 relations cannot be laid out: " +
          "The relations between rows 1 and 2 cannot be wired. Add groups or declare views." &&
      error.problems[0].path === "/views/architecture/channels/0",
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
  // The relation that closes the cycle runs back up, so the three draw as a triangle.
  const cycle = graphModel(3, [
    [1, 2],
    [2, 3],
    [3, 1],
  ]);
  assert.deepEqual(rowsOf(cycle), [["c1"], ["c2", "c3"]]);
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

test("siblings that call each other share a row rather than lengthen their caller's relation", () => {
  const model = graphModel(4, [
    [1, 2],
    [1, 3],
    [2, 3],
    [3, 4],
  ]);
  assert.deepEqual(rowsOf(model), [["c1"], ["c2", "c3"], ["c4"]]);
});

test("sources move down beside their nearest consumer", () => {
  const model = graphModel(4, [
    [1, 2],
    [2, 3],
    [4, 3],
  ]);
  assert.deepEqual(rowsOf(model), [["c1"], ["c2", "c4"], ["c3"]]);
});

test("a relation within a row is preferred to one that skips rows", () => {
  // c1 reaches c4 directly and through c2 and c3; one row of three keeps every relation short.
  const shortcut = graphModel(4, [
    [1, 2],
    [1, 4],
    [2, 3],
    [3, 4],
  ]);
  assert.deepEqual(rowsOf(shortcut), [["c1", "c2", "c3"], ["c4"]]);
  const looping = graphModel(4, [
    [1, 2],
    [1, 3],
    [2, 3],
    [2, 4],
    [4, 3],
  ]);
  assert.deepEqual(rowsOf(looping), [
    ["c1", "c2"],
    ["c3", "c4"],
  ]);
  const deep = graphModel(5, [
    [1, 2],
    [1, 3],
    [2, 3],
    [1, 4],
    [4, 5],
    [5, 3],
  ]);
  assert.deepEqual(rowsOf(deep), [
    ["c1", "c4"],
    ["c2", "c3", "c5"],
  ]);
});

test("rows stay within their limit and keep a column beside the boundary for outside components", () => {
  const fan = (count) =>
    graphModel(
      count + 1,
      Array.from({ length: count }, (_, index) => [1, index + 2]),
    );
  const rowsAt = (model, limit, outside) =>
    viewRows(
      { tiers: null, components: model.components, relations: model.relations },
      limit,
      outside,
    ).map(({ members }) => members);
  // One of seven callees joins its caller's row instead of overfilling the next.
  assert.deepEqual(rowsOf(fan(ROW_LIMIT + 1)), [
    ["c1", "c2"],
    ["c3", "c4", "c5", "c6", "c7", "c8"],
  ]);
  // c3 joins c1 and c2 so that c2's callee c3 and the other callees share the next row.
  const crowded = graphModel(ROW_LIMIT + 3, [
    [1, 2],
    ...Array.from({ length: ROW_LIMIT + 1 }, (_, index) => [1, index + 3]),
    [2, 3],
  ]);
  assert.deepEqual(rowsOf(crowded), [
    ["c1", "c2", "c4"],
    ["c3", "c5", "c6", "c7", "c8", "c9"],
  ]);
  // Four inside callees leave the fifth column of a five-card row to an outside one.
  const outsideLast = (count) => (id) => id === `c${count + 1}`;
  assert.deepEqual(rowsAt(fan(5), 5, outsideLast(5)), [["c1"], ["c2", "c3", "c4", "c5", "c6"]]);
  assert.deepEqual(rowsAt(fan(6), 5, outsideLast(6)), [
    ["c1", "c2"],
    ["c3", "c4", "c5", "c6", "c7"],
  ]);
});
