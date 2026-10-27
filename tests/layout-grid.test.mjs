import assert from "node:assert/strict";
import test from "node:test";
import { layoutView } from "../packages/publisher/src/layout/grid.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { simpleMetrics, wholeView } from "./fixtures/layout.mjs";
import { BIG_BANK_MODEL, graphModel } from "./fixtures/models.mjs";

const ids = (count, start = 1) => Array.from({ length: count }, (_, index) => `c${start + index}`);

/** Equal cards on shared row lines and only horizontal or vertical wire segments. */
function assertTidy(layout) {
  const cards = [...layout.cards.values()];
  for (const card of cards) {
    assert.equal(card.width, layout.card.width);
    assert.equal(card.height, layout.card.height);
  }
  for (const row of layout.rows) {
    const placed = row.members.map((id) => layout.cards.get(id));
    for (const card of placed) assert.equal(card.y, row.top);
    const sorted = placed.map(({ x }) => x).sort((a, b) => a - b);
    for (let index = 1; index < sorted.length; index += 1)
      assert.ok(sorted[index] - sorted[index - 1] >= layout.card.width, "cards overlap in a row");
  }
  for (const { points } of layout.paths)
    for (let index = 1; index < points.length; index += 1) {
      const [a, b] = [points[index - 1], points[index]];
      assert.ok(Math.abs(a[0] - b[0]) < 0.5 || Math.abs(a[1] - b[1]) < 0.5, "diagonal segment");
    }
  for (const card of cards) {
    assert.ok(card.x >= 0 && card.x + card.width <= layout.width, "card outside the content width");
    assert.ok(card.y >= 0 && card.y + card.height <= layout.height, "card outside the height");
  }
}

function layout(model, tiers = null, metricsModel = null) {
  const valid = validateModel(model);
  return layoutView(wholeView(valid, tiers), simpleMetrics(metricsModel ?? valid), {
    boundaryName: "System",
  });
}

test("Big Bank lays out tidily with tiers, an inside boundary and deterministic geometry", async () => {
  const { model } = await loadModel(BIG_BANK_MODEL);
  const [tiered] = model.views;
  const view = { ...wholeView(model), tiers: tiered.tiers };
  const first = layoutView(view, simpleMetrics(model), { boundaryName: "Internet Banking" });
  const second = layoutView(view, simpleMetrics(model), { boundaryName: "Internet Banking" });
  assert.deepEqual(first, second);
  assertTidy(first);
  assert.equal(first.labelled, true);
  assert.deepEqual(
    first.rows.map(({ id }) => id),
    ["people", "front", "back", "data"],
  );
  const frame = first.boundary;
  assert.equal(frame.name, "Internet Banking");
  const inside = (card) =>
    card.x >= frame.x &&
    card.x + card.width <= frame.x + frame.width &&
    card.y >= frame.y &&
    card.y + card.height <= frame.y + frame.height;
  const apart = (card) =>
    card.x + card.width <= frame.x ||
    card.x >= frame.x + frame.width ||
    card.y + card.height <= frame.y ||
    card.y >= frame.y + frame.height;
  for (const id of ["web", "spa", "mobile", "api", "db"])
    assert.ok(inside(first.cards.get(id)), `${id} lies outside the boundary`);
  for (const id of ["customer", "mainframe", "email"])
    assert.ok(apart(first.cards.get(id)), `${id} touches the boundary`);
  assert.equal(first.labels.length > 0, true);
});

test("Big Bank lays out without tiers from its relations", async () => {
  const { model } = await loadModel(BIG_BANK_MODEL);
  const result = layoutView(wholeView(model), simpleMetrics(model));
  assertTidy(result);
  assert.equal(result.labelled, false);
  assert.ok(result.rows.length >= 3);
  assert.equal(result.boundary.name, null);
});

test("cycles, skipped rows and same-row relations are wired without defects", () => {
  assertTidy(
    layout(
      graphModel(3, [
        [1, 2],
        [2, 3],
        [3, 1],
      ]),
    ),
  );
  const skipped = layout(
    graphModel(4, [
      [1, 2],
      [2, 3],
      [1, 3, "skips"],
      [4, 3],
    ]),
    [["c1"], ["c2", "c4"], ["c3"]],
  );
  assertTidy(skipped);
  const neighbors = layout(graphModel(2, [[1, 2, "calls"]]), [["c1", "c2"]]);
  assertTidy(neighbors);
  assert.equal(neighbors.arrows.length, 1);
  assert.equal(neighbors.labels[0].row, 0);
  const apart = layout(
    graphModel(4, [
      [1, 3, "reaches"],
      [3, 1, "answers"],
      [4, 2],
    ]),
    [["c1", "c2", "c3"], ["c4"]],
  );
  assertTidy(apart);
});

test("a six-way fan-out shares one bus and three-by-three calls cross only where they must", () => {
  const bus = layout(
    graphModel(
      7,
      ids(6, 2).map((id) => [1, Number(id.slice(1)), "notifies"]),
    ),
  );
  assertTidy(bus);
  assert.equal(bus.labels.length, 1);
  assert.equal(bus.rows[1].members.length, 6);
  const mesh = layout(
    graphModel(
      6,
      [1, 2, 3].flatMap((from) => [4, 5, 6].map((to) => [from, to, `call ${from}${to}`])),
    ),
  );
  assertTidy(mesh);
  assert.ok(mesh.measures.crossings >= 0);
  assert.equal(mesh.labels.length, 9);
});

test("upward relations, two-hub buses and long labels lay out tidily", () => {
  const upward = layout(
    graphModel(5, [
      [2, 1, "reports"],
      [3, 1, "reports"],
      [4, 1, "reports"],
      [5, 4, "feeds"],
    ]),
    [["c1"], ["c2", "c3", "c4"], ["c5"]],
  );
  assertTidy(upward);
  const long = layout(
    graphModel(3, [
      [1, 2, "sends every settled request to the downstream ledger for reconciliation"],
      [1, 3, "audits"],
    ]),
  );
  assertTidy(long);
});

test("a row of seven cards is refused with the row and its members", () => {
  assert.throws(
    () =>
      layout(
        graphModel(
          8,
          ids(7, 2).map((id) => [1, Number(id.slice(1))]),
        ),
      ),
    (error) =>
      error.code === "layout_row_too_wide" &&
      error.problems[0].path === "/rows/1" &&
      error.problems[0].message === ids(7, 2).join(", "),
  );
  assert.throws(
    () => layoutView(wholeView(validateModel(graphModel(6, [[1, 2]])), [ids(6)]), simpleMetrics()),
    { code: "layout_row_too_wide" },
  );
});

test("one-row views route requests, responses and triangles through a trailing channel", () => {
  const pair = layout(
    graphModel(2, [
      [1, 2, "requests"],
      [2, 1, "responds"],
    ]),
    [["c1", "c2"]],
  );
  assertTidy(pair);
  assert.equal(pair.channels.length, 1);
  assert.ok(pair.channels[0].bottom > pair.channels[0].top);
  assert.ok(pair.height >= pair.channels[0].bottom);
  const triangle = layout(
    graphModel(4, [
      [1, 2, "asks"],
      [2, 3, "tells"],
      [1, 3, "audits"],
    ]),
    [["c1", "c2", "c3", "c4"]],
  );
  assertTidy(triangle);
  const single = layout(graphModel(1, []), [["c1"]]);
  assertTidy(single);
  assert.deepEqual(single.paths, []);
});
