import assert from "node:assert/strict";
import test from "node:test";
import { drawLines } from "../src/poster/lines.mjs";
import { POSTER, colorsOf, figureMetrics, figureStyles, linesOf } from "../src/poster/tokens.mjs";
import { BROKEN, TABLE } from "./fixtures/line-tables.mjs";
import { INDIGO, files, typefaces } from "./fixtures/strips.mjs";

// A bound channel follows its fact: with the layout held, a change of the hub changes the weight of the lines
// into the old and the new hub and nothing else, and one more cited file changes one number and nothing else.

const styles = figureStyles(POSTER.steps[0], true);
const metrics = figureMetrics(styles);

/** Six parts in two rows: three sources above, and below them the two parts they lead to and one more. */
const cards = new Map(
  ["a", "b", "c", "h", "g", "x"].map((id, index) => [
    id,
    { x: 200 * (index % 3), y: index < 3 ? 0 : 300, width: 100, height: 50 },
  ]),
);

/** A relation and the line the layout drew for it: down from its source, across, and down into where it ends. */
function wired(id, from, port, end, track, cited) {
  const start = cards.get(from).x + port;
  const points = [
    [start, 50],
    [start, track],
    [end, track],
    [end, 300],
  ];
  return { id, from, points, files: files(cited), arrow: { x: end, y: 300, direction: "down" } };
}

/** The lines as the layout holds them, whatever the relations' targets say: three end on h, two on g, one on x. */
const WIRES = [
  wired("a-h", "a", 20, 30, 100, 2),
  wired("b-h", "b", 20, 50, 130, 1),
  wired("c-h", "c", 20, 70, 160, 3),
  wired("a-g", "a", 80, 220, 190, 0),
  wired("b-g", "b", 80, 260, 220, 4),
  wired("c-x", "c", 80, 450, 250, 1),
];

/** Draw the held layout for the given targets and cited files, in a table of lines. */
function drawn(targets, table = TABLE, cited = {}, marks = []) {
  const relations = WIRES.map(({ id, from, files: own }) => ({
    id,
    from,
    to: targets[id],
    files: cited[id] ? files(cited[id]) : own,
  }));
  const layout = {
    cards,
    paths: WIRES.map(({ points }, index) => ({ relations: [relations[index]], points })),
    arrows: WIRES.map(({ arrow }, index) => ({ ...arrow, relations: [relations[index]] })),
  };
  const shapes = [];
  const runs = [];
  const { touching } = drawLines(layout, {
    model: { relations },
    view: { relations },
    strips: true,
    styles,
    metrics,
    typefaces,
    colors: colorsOf(INDIGO),
    lines: linesOf(table),
    at: (x) => x,
    down: (y) => y,
    lift: (point) => point,
    text: (layer, value, x, top) => runs.push({ value, x, top }),
    shapes,
    rects: [],
    marks,
  });
  const widths = shapes
    .filter((shape) => shape.includes('fill="none"'))
    .map((shape) => Number(/stroke-width="([\d.]+)"/u.exec(shape)[1]));
  return {
    shapes,
    runs,
    touching,
    widths: Object.fromEntries(WIRES.map(({ id }, index) => [id, widths[index]])),
  };
}

const TARGETS = { "a-h": "h", "b-h": "h", "c-h": "h", "a-g": "g", "b-g": "g", "c-x": "x" };
/** One relation's target changed: two relations now end at h and three at g, so the hub moves from h to g. */
const MOVED = { ...TARGETS, "c-h": "g" };

/** The ids of the lines whose weight differs between two drawings. */
const reweighed = (before, after) =>
  Object.keys(before.widths).filter((id) => before.widths[id] !== after.widths[id]);

/** The invariant: in a table of lines, moving the hub changes the weight of the lines into the two parts alone. */
function assertHubFollowed(table) {
  assert.deepEqual(
    reweighed(drawn(TARGETS, table), drawn(MOVED, table)),
    ["a-h", "b-h", "a-g", "b-g"],
    "row emphasis: the lines into the old and the new hub change weight, and no other",
  );
}

test("moving the hub changes the weight of the lines into the old and the new hub, and of no other line", () => {
  const before = drawn(TARGETS);
  const after = drawn(MOVED);
  const { relation, emphasis } = TABLE.rows;
  const [light, heavy] = [relation.stroke, relation.stroke * emphasis.factor];
  assert.deepEqual(before.widths, {
    "a-h": heavy,
    "b-h": heavy,
    "c-h": heavy,
    "a-g": light,
    "b-g": light,
    "c-x": light,
  });
  // The lines into h grow light and those into g heavy; the moved relation ends at the hub before and after.
  assertHubFollowed(TABLE);
  assert.deepEqual([after.widths["c-h"], after.widths["c-x"]], [heavy, light]);
  // No count moved or changed: weight alone follows the hub.
  assert.deepEqual(after.runs, before.runs);
});

test("on a table whose emphasis has a relation's weight, the test that moves the hub fails and names the row", () => {
  assert.throws(() => assertHubFollowed(BROKEN.idleEmphasis), /row emphasis/u);
});

test("one more cited file changes that relation's number and no other mark", () => {
  const before = drawn(TARGETS);
  const after = drawn(TARGETS, TABLE, { "b-g": 5 });
  assert.deepEqual(after.shapes, before.shapes);
  const changed = before.runs.flatMap((run, index) =>
    JSON.stringify(run) === JSON.stringify(after.runs[index]) ? [] : [[run, after.runs[index]]],
  );
  assert.equal(after.runs.length, before.runs.length);
  assert.equal(changed.length, 1);
  const [[was, is]] = changed;
  assert.deepEqual([was.value, is.value], ["4", "5"]);
  assert.deepEqual([is.x, is.top], [was.x, was.top]);
  // Five counts for the five relations that cite files, each written once.
  assert.deepEqual(before.runs.map(({ value }) => value).sort(), ["1", "1", "2", "3", "4"]);
});

test("a count whose own line offers no clear place is reported by its relation's id, and the others are not", () => {
  assert.deepEqual(drawn(TARGETS).touching, []);
  // A mark over the whole of one relation's line, from its source to where it ends.
  const covered = drawn(TARGETS, TABLE, {}, [{ x: 0, y: 40, width: 60, height: 300 }]);
  assert.deepEqual(covered.touching, ["a-h"]);
  // The count is still written, at the first place along its line.
  assert.deepEqual(covered.runs.map(({ value }) => value).sort(), ["1", "1", "2", "3", "4"]);
});
