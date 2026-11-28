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
import { pathOf } from "../src/poster/compose/spine-path.mjs";
import {
  HOUSE_STYLE,
  POSTER,
  figureMetrics,
  figureStyles,
  linesOf,
} from "../src/poster/tokens.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import {
  INDIGO,
  arrowsOf,
  icons,
  part,
  platesIn,
  stripStyle,
  typefaces,
  wiresOf,
} from "./fixtures/strips.mjs";

// Which views are drawn as a spine (src/poster/compose/spine-path.mjs, plates.mjs) and how
// (spine.mjs, spine-fold.mjs, spine-wires.mjs): the spine's rule reads the view alone, so the choice is the same in
// every language; a plate the rule takes is drawn as a spine where its figure can be drawn at a type step no smaller
// than its tiers, and records why where it is not; an author may name the spine, which is then drawn wherever it can
// be, or the plate warns.

/**
 * A model of stations `s1` to `sN` and one view of them all, its relations each `[from, to]` by station number; `view`
 * adds the view's fields, its tiers in place of its members, and `views` gives the views in its place; `names` sets the
 * stations' names; `outside` names the stations that are tools outside the repository; `reversed` lists the stations
 * from the last.
 * @param {number} count
 * @param {Array<[number, number]>} pairs
 * @param {{ view?: object, views?: object[], names?: (index: number) => string, outside?: string[],
 *   reversed?: boolean }} [options]
 */
function stationsModel(count, pairs, options = {}) {
  const { view = {}, views, names = (index) => `Station ${index}`, outside = [] } = options;
  const numbered = Array.from({ length: count }, (_, index) => `s${index + 1}`);
  const ids = options.reversed ? numbered.toReversed() : numbered;
  const tool = { label: "external tool", category: "external", icon: "wrench" };
  return validateModel(
    minimalModel({
      ...(outside.length ? { kinds: { tool } } : {}),
      components: ids.map((id) => ({
        id,
        label: names(Number(id.slice(1))),
        ...(outside.includes(id) ? { kind: "tool" } : {}),
      })),
      relations: pairs.map(([from, to], index) => ({
        id: `r${index}`,
        from: `s${from}`,
        to: `s${to}`,
        label: "feeds",
      })),
      views: views ?? [
        { id: "line", .../** @type {any} */ (view.tiers ? {} : { members: ids }), ...view },
      ],
    }),
  );
}

/** Each station feeding the next, from `s1` to `sN`. */
const chain = (/** @type {number} */ count) =>
  /** @type {Array<[number, number]>} */ (
    Array.from({ length: count - 1 }, (_, index) => [index + 1, index + 2])
  );

/** Whether two px lie within half a pixel. */
const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 0.5;

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

/** The first clause of the spine's rule that a model's one view misses, or null. */
async function missed(model) {
  const [view] = await viewsOf(model);
  return pathOf(model, view)?.why ?? null;
}

/**
 * Six stations in a chain, a branch off the third (`s7`) and a relation from the second to the fifth, which skips
 * stations: a sequence the rule takes, with each kind of wire a spine draws.
 */
const SEQUENCE = () => stationsModel(7, [...chain(6), [3, 7], [2, 5]]);

/** Eight stations of long names in a chain: the rule takes it, and its spine fits only at a smaller type. */
const LONG = () =>
  stationsModel(8, chain(8), {
    names: (index) => `Station ${index} that renders the frames of its scene`,
  });

test("the spine's rule takes a sequence of five stations or more along which most parts and relations lie", async () => {
  assert.equal(await ruled(stationsModel(5, chain(5))), "spine");
  assert.equal(await missed(stationsModel(5, chain(5))), null);
  // A branch off a station and a relation that skips stations: six of seven parts stand on the path, five of seven
  // relations join neighbours on it.
  assert.equal(await ruled(SEQUENCE()), "spine");
  // It reads the view before the matrix's rule, which reads the figure in tiers of one language: eight parts whose
  // figure in tiers had five route defects would be a matrix.
  assert.equal(await ruled(stationsModel(8, chain(8)), 5), "spine");
});

test("the spine's rule refuses a station that sends to four parts, four stations, relations that skip, a part off the path, and an author's tiers", async () => {
  // The third station feeds the fourth and three branches: a fan, not a station.
  const fan = stationsModel(8, [...chain(5), [3, 6], [3, 7], [3, 8]]);
  assert.equal(await missed(fan), "sends");
  assert.equal(await ruled(fan), "tiers");
  // Four stations are too few.
  assert.equal(await missed(stationsModel(4, chain(4))), "stations");
  assert.equal(await ruled(stationsModel(4, chain(4))), "tiers");
  // Five relations skip stations, four join neighbours: fewer than half of the relations lie along the path.
  const skips = stationsModel(5, [...chain(5), [1, 3], [1, 4], [2, 4], [2, 5], [3, 5]]);
  assert.equal(await missed(skips), "neighbours");
  assert.equal(await ruled(skips), "tiers");
  // A part that relates to no station has no place beside the path.
  const apart = stationsModel(7, [...chain(5), [6, 7]]);
  assert.equal(await missed(apart), "attached");
  assert.equal(await ruled(apart), "tiers");
  // An author's tiers are kept.
  const tiers = [
    { id: "first", label: "First", members: ["s1", "s2", "s3"] },
    { id: "then", label: "Then", members: ["s4", "s5"] },
  ];
  assert.equal(await ruled(stationsModel(5, chain(5), { view: { tiers } })), "tiers");
});

test("a spine plate records its kind, its stations, its rows and the type step of its figure in tiers", async () => {
  const [plate] = await platesOf(SEQUENCE());
  const { kind, stations, rows, tiers, step, refused } = plate.composition;
  assert.deepEqual({ kind, refused }, { kind: "spine", refused: undefined });
  assert.deepEqual(stations, ["s1", "s2", "s3", "s4", "s5", "s6"]);
  assert.equal(
    rows.reduce((sum, count) => sum + count, 0),
    stations.length,
  );
  assert.ok(rows.length >= 2, `${rows.length} rows`);
  assert.ok(step >= tiers.step, `spine step ${step} under the tiers' ${tiers.step}`);
  assert.equal(plate.unfitted, undefined);
  assert.deepEqual(compositionWarnings([plate]), []);
});

test("a spine plate draws every line across and down and keeps its cards off the frame by the grid's margin", async () => {
  const [plate] = await platesOf(SEQUENCE());
  for (const { relations, points } of plate.report.paths)
    for (let index = 1; index < points.length; index += 1) {
      const [[x0, y0], [x1, y1]] = [points[index - 1], points[index]];
      assert.ok(
        Math.abs(x1 - x0) < 0.5 || Math.abs(y1 - y0) < 0.5,
        `${relations.map(({ id }) => id)} runs at a slant from ${[x0, y0]} to ${[x1, y1]}`,
      );
    }
  const margin = figureMetrics(figureStyles(POSTER.steps[plate.step])).spacing.rowPad;
  for (const { id, box } of plate.report.parts) {
    assert.ok(box.x >= margin && box.y >= margin, `${id} at ${box.x}, ${box.y}`);
    assert.ok(box.x + box.width <= plate.width - margin, `${id} reaches ${box.x + box.width}`);
    assert.ok(box.y + box.height <= plate.height - margin, `${id} reaches ${box.y + box.height}`);
  }
});

test("a spine draws its path as the heavy line, which its key names, with a heavy arrowhead under each turn", async () => {
  const [plate] = await platesOf(SEQUENCE());
  const lines = linesOf(HOUSE_STYLE.lines);
  const wires = wiresOf(plate.svg);
  // The five relations along the path are stroked at the hub lines' weight; the branch and the skip are not.
  assert.equal(wires.filter(({ width }) => width === lines.stroke(true)).length, 5);
  assert.equal(wires.filter(({ width }) => width === lines.stroke(false)).length, 2);
  assert.deepEqual(
    plate.legend.filter(({ label }) => label === "main path").map(({ weight }) => weight),
    [lines.stroke(true)],
  );
  // Each turn's arrowhead stands on a heavy wire's upright, pointing down, as large as the heavy line's arrowheads.
  const uprights = wires
    .filter(({ width }) => width === lines.stroke(true))
    .flatMap(({ points }) => points.slice(1).map((q, index) => [points[index], q]))
    .filter(([p, q]) => near(p[0], q[0]) && !near(p[1], q[1]));
  const heads = arrowsOf(plate.svg);
  const onTurns = heads.filter(({ x, y }) =>
    uprights.some(
      ([p, q]) => near(p[0], x) && Math.min(p[1], q[1]) < y && y < Math.max(p[1], q[1]),
    ),
  );
  assert.equal(onTurns.length, plate.composition.rows.length - 1);
  const sizes = heads.map(({ size }) => size);
  assert.ok(Math.max(...sizes) > Math.min(...sizes));
  for (const { x, y, size } of onTurns) {
    assert.equal(size, Math.max(...sizes), `the turn's arrowhead at ${x}, ${y}`);
    const [, ...base] = /** @type {RegExpExecArray} */ (
      new RegExp(`<path d="M${x},${y} L[\\d.-]+,([\\d.-]+) L[\\d.-]+,([\\d.-]+) Z"`, "u").exec(
        plate.svg,
      )
    );
    assert.ok(
      base.every((one) => Number(one) < y),
      `the turn's arrowhead at ${x}, ${y} points down`,
    );
  }
});

test("only a relation from a station to the next is the heavy line: a branch beside its station and a reply are not", async () => {
  // Six stations, a tool outside the repository that the first calls, and a reply from the fourth to the third.
  const model = stationsModel(7, [...chain(6), [1, 7], [4, 3]], { outside: ["s7"] });
  assert.equal(await ruled(model), "spine");
  const [plate] = await platesOf(model);
  assert.equal(plate.composition.kind, "spine");
  const lines = linesOf(HOUSE_STYLE.lines);
  const widths = wiresOf(plate.svg).map(({ width }) => width);
  assert.deepEqual(
    [lines.stroke(true), lines.stroke(false)].map(
      (one) => widths.filter((width) => width === one).length,
    ),
    [5, 2],
  );
  // The tool stands beside the first station, level with it, beyond the boundary.
  const box = (/** @type {string} */ id) =>
    /** @type {any} */ (plate.report.parts.find((part) => part.id === id)).box;
  assert.ok(box("s7").x + box("s7").width < box("s1").x);
  assert.ok(near(box("s7").y + box("s7").height / 2, box("s1").y + box("s1").height / 2));
});

test("on an edition with strips the key names the main path on a spine plate only, where the hub's lines are plain", async () => {
  const ids = ["s1", "s2", "s3", "s4", "s5", "s6"];
  // The fourth station is the hub: its neighbour on the path and two others send to it.
  const model = stationsModel(6, [...chain(6), [1, 4], [2, 4]], {
    views: [
      { id: "line", title: "Line", members: ids, composition: "spine" },
      { id: "fan", title: "Fan", members: ["s1", "s2", "s3", "s4"] },
    ],
  });
  const parts = new Map(
    ids.map((id, index) => [id, part([[`src/${id}.mjs`, 1000 * (index + 1), index % 3]])]),
  );
  const {
    plates: [line, fan],
  } = await platesIn(model, stripStyle(INDIGO, parts, model));
  assert.equal(line.composition.kind, "spine");
  assert.equal(fan.composition.kind, undefined);
  const heavyRows = (/** @type {any} */ plate) =>
    plate.legend.filter(({ shape }) => shape === "hub").map(({ label }) => label);
  assert.deepEqual(heavyRows(line), ["main path"]);
  assert.deepEqual(heavyRows(fan), ["to Station 4"]);
  const heavy = linesOf(HOUSE_STYLE.lines).stroke(true);
  const heavyWires = (/** @type {any} */ plate) =>
    wiresOf(plate.svg).filter(({ width }) => width === heavy).length;
  // On the spine only the path's five relations are heavy, not the two others into the hub; on the fan the lines
  // into the hub are.
  assert.equal(heavyWires(line), 5);
  assert.ok(heavyWires(fan) > 0);
});

test("a view the radial rule takes stays radial where the spine's rule would take it too", async () => {
  // The second part drives the first, the third and the fifth; a chain runs from the first to the fifth.
  const model = validateModel(
    minimalModel({
      components: ["a", "b", "c", "d", "e"].map((id) => ({ id, label: `Part ${id}` })),
      relations: [
        ["a", "b"],
        ["b", "c"],
        ["c", "d"],
        ["d", "e"],
        ["b", "a"],
        ["b", "e"],
      ].map(([from, to], index) => ({ id: `r${index}`, from, to, label: "feeds" })),
    }),
  );
  assert.equal(await missed(model), null);
  assert.equal(await ruled(model), "radial");
});

test("a work's languages read one path from the same ids, whatever the order of their parts", async () => {
  // Two paths of five stations through the second and the fifth: by s3 and by s4, alike in every measure.
  const pairs = /** @type {Array<[number, number]>} */ ([
    [1, 2],
    [2, 3],
    [2, 4],
    [3, 5],
    [4, 5],
    [5, 6],
  ]);
  const forward = stationsModel(6, pairs);
  const backward = stationsModel(6, pairs, { reversed: true });
  const [[one], [other]] = await Promise.all([viewsOf(forward), viewsOf(backward)]);
  assert.notDeepEqual(
    one.components.map(({ id }) => id),
    other.components.map(({ id }) => id),
  );
  assert.deepEqual(pathOf(forward, one)?.stations, ["s1", "s2", "s3", "s5", "s6"]);
  assert.deepEqual(pathOf(backward, other)?.stations, ["s1", "s2", "s3", "s5", "s6"]);
});

test("a view the rule takes whose spine would set smaller type keeps its tiers and records why; its author's spine is drawn so", async () => {
  assert.equal(await ruled(LONG()), "spine");
  const [plate] = await platesOf(LONG());
  assert.equal(plate.composition.kind, undefined);
  assert.deepEqual(plate.composition.refused, { kind: "spine", why: "type" });
  // The rule chose it, so the build is not warned.
  assert.equal(plate.unfitted, undefined);
  assert.deepEqual(compositionWarnings([plate]), []);
  // Named by its author, the spine is drawn at the step it takes, as a named radial figure is.
  const [named] = await platesOf(
    stationsModel(8, chain(8), {
      view: { composition: "spine" },
      names: (index) => `Station ${index} that renders the frames of its scene`,
    }),
  );
  assert.equal(named.composition.kind, "spine");
  assert.ok(named.step < plate.step, `spine step ${named.step}, tiers ${plate.step}`);
  assert.equal(named.unfitted, undefined);
});

test("an author's spine is drawn where the rule would not take it, and warns where none can be", async () => {
  // Four stations: the rule leaves them in tiers, their author's word folds them into two rows of two.
  assert.equal(await ruled(stationsModel(4, chain(4))), "tiers");
  const [named] = await platesOf(stationsModel(4, chain(4), { view: { composition: "spine" } }));
  assert.equal(named.composition.kind, "spine");
  assert.deepEqual(named.composition.rows, [2, 2]);
  assert.equal(named.unfitted, undefined);
  // Two parts related to no station, which the rule refuses, stand in a row of their own off the path's rows.
  const [apart] = await platesOf(
    stationsModel(7, [...chain(5), [6, 7]], { view: { composition: "spine" } }),
  );
  assert.equal(apart.composition.kind, "spine");
  const box = (/** @type {string} */ id) =>
    /** @type {any} */ (apart.report.parts.find((part) => part.id === id)).box;
  const stationRows = new Set(["s1", "s2", "s3", "s4", "s5"].map((id) => box(id).y));
  assert.ok(["s6", "s7"].every((id) => !stationRows.has(box(id).y)));
  // Three stations are too few to fold.
  const [short] = await platesOf(stationsModel(3, chain(3), { view: { composition: "spine" } }));
  assert.equal(short.composition.kind, undefined);
  assert.deepEqual(short.composition.refused, { kind: "spine", why: "parts" });
  assert.equal(short.unfitted, "spine");
  assert.deepEqual(
    compositionWarnings([short]).map(({ code, path }) => `${code} ${path}`),
    ["plate_composition_unfitted /views/line/composition"],
  );
});
