import assert from "node:assert/strict";
import test from "node:test";
import { citedFiles, viewFacts } from "../src/facts/view.mjs";
import { validateModel } from "../src/model/load.mjs";
import { lineWarnings } from "../src/poster/compose/plates.mjs";
import { citationRuns, drawCount, placesAlong } from "../src/poster/lines.mjs";
import { POSTER } from "../src/poster/tokens.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import {
  INDIGO,
  typefaces,
  part,
  stripStyle,
  files,
  stripModel,
  platesIn,
  countsOf,
  labelOf,
} from "./fixtures/strips.mjs";

// Strip marks: the number a relation's line carries for the files it cites.

test("a line carries the number of files its relation cites, once, in the line's colour, and no tick", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const counts = countsOf(plate);
  // Two, three, three, four, three, one and one: the relation that cites none has no number.
  assert.deepEqual(counts.map(({ text }) => text).sort(), ["1", "1", "2", "3", "3", "3", "4"]);
  // Every relation into the supplies cites three files or more and is numbered in the hub's dye.
  assert.deepEqual(
    counts
      .filter(({ color }) => color === INDIGO.dye.old)
      .map(({ text }) => text)
      .sort(),
    ["3", "3", "3", "4"],
  );
  for (const { size, color } of counts) {
    assert.equal(size, POSTER.floor);
    assert.ok([INDIGO.dye.old, INDIGO.palette.mid].includes(color), color);
  }
  // A tick was a stroke across a line: a path that names its stroke before any fill.
  assert.doesNotMatch(plate.svg, /<path d="[^"]+" stroke=/u);
  // Every count has a clear place, and the plate names the rows of the table it draws.
  assert.deepEqual(plate.touching, []);
  assert.deepEqual(plate.lines.toSorted(), ["boundary", "citations", "emphasis", "relation"]);
  // The relation labels are set in the regular weight, so the parts' names lead.
  const label = plate.runs.find(({ text }) => text === "loads fonts");
  assert.equal(label?.weight, 400);
});

test("a relation that cites one, two or seven files carries 1, 2 or 7, and one that cites none carries nothing", async () => {
  const model = validateModel(
    minimalModel({
      id: "many",
      components: [
        { id: "builder", label: "Delivery builder" },
        { id: "supplies", label: "Supplies" },
        { id: "typst", label: "Typst" },
        { id: "words", label: "Words" },
        { id: "record", label: "Record" },
      ],
      relations: [
        { id: "fonts", from: "builder", to: "supplies", label: "loads fonts", files: files(7) },
        { id: "runs", from: "builder", to: "typst", label: "runs Typst", files: files(2) },
        { id: "sets", from: "builder", to: "words", label: "sets words", files: files(1) },
        { id: "writes", from: "builder", to: "record", label: "writes" },
      ],
    }),
  );
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle());
  assert.deepEqual(
    countsOf(plate)
      .map(({ text }) => text)
      .sort(),
    ["1", "2", "7"],
  );
  assert.doesNotMatch(plate.svg, /<path d="[^"]+" stroke=/u);
});

test("along a row the count stands above its line, and down a column right of it", async () => {
  const row = validateModel(
    minimalModel({
      id: "row",
      components: [
        { id: "a", label: "Alpha" },
        { id: "b", label: "Beta" },
      ],
      relations: [{ id: "a-b", from: "a", to: "b", label: "calls", files: files(6) }],
      views: [{ id: "row", tiers: [{ id: "t", label: "Tier", members: ["a", "b"] }] }],
    }),
  );
  const parts = new Map([
    ["a", part([["a.mjs", 2000, 0]])],
    ["b", part([["b.mjs", 1000, 1]])],
  ]);
  const {
    plates: [along],
  } = await platesIn(row, stripStyle(INDIGO, parts));
  const [six] = countsOf(along);
  assert.equal(six.text, "6");
  const [, y] = /<path d="M[\d.-]+,([\d.-]+) /u.exec(along.svg);
  assert.ok(six.baseline < Number(y), `${six.baseline} above ${y}`);
});

test("a relation's count stands near its source, on its own run from where it branches", async () => {
  // The builder fans out to two parts under one label: their lines share a trunk from the builder,
  // so each relation's count stands on its own branch.
  const model = validateModel(
    minimalModel({
      id: "fan",
      components: [
        { id: "a", label: "Builder" },
        { id: "b", label: "Composer" },
        { id: "c", label: "Record" },
      ],
      relations: [
        { id: "ab", from: "a", to: "b", label: "uses", files: files(2) },
        { id: "ac", from: "a", to: "c", label: "uses", files: files(1) },
      ],
    }),
  );
  const parts = new Map([
    ["a", part([["a.mjs", 2000, 0]])],
    ["b", part([["b.mjs", 1000, 1]])],
    ["c", part([["c.mjs", 1000, 2]])],
  ]);
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle(INDIGO, parts));
  const counts = countsOf(plate);
  assert.deepEqual(counts.map(({ text }) => text).sort(), ["1", "2"]);
  const top = labelOf(plate, "a").baseline;
  for (const { baseline } of counts) {
    // Below the builder and its caption, and above the parts they reach.
    assert.ok(baseline > top + 40, `${baseline}`);
    assert.ok(baseline < labelOf(plate, "b").baseline - 20, `${baseline}`);
  }
  assert.notEqual(counts[0].x, counts[1].x);
});

test("a relation's count is read on its own run, from its source's end", () => {
  const card = (x, y) => ({ x, y, width: 100, height: 50 });
  const cards = new Map([
    ["a", card(0, 0)],
    ["b", card(0, 150)],
    ["c", card(200, 150)],
    ["d", card(400, 0)],
  ]);
  const ab = { id: "ab", from: "a", to: "b", files: files(2) };
  const ac = { id: "ac", from: "a", to: "c", files: files(1) };
  const cd = { id: "cd", from: "c", to: "d", files: files(3) };
  const none = { id: "none", from: "d", to: "c", files: [] };
  const fan = [ab, ac];
  const line = (relations, ...points) => ({ relations, points });
  const layout = {
    cards,
    paths: [
      // The fan's trunk and bar, shared by both relations, then each one's branch.
      line(fan, [50, 50], [50, 100]),
      line(fan, [50, 100], [250, 100]),
      line(fan, [50, 100], [50, 150]),
      line(fan, [250, 100], [250, 150]),
      // A relation up from the lower row: its source is the line's last point.
      line([cd], [430, 50], [430, 100], [270, 100], [270, 150]),
      line([none], [470, 50], [470, 100], [290, 100], [290, 150]),
    ],
  };
  // Each relation's count, as the layer measures it for a view of the four.
  const { cited } = viewFacts(
    { relations: [] },
    { id: "fan", relations: [ab, ac, cd, none] },
    null,
  );
  const runs = citationRuns(cited, layout);
  assert.deepEqual(
    [...runs].sort(([a], [b]) => a - b),
    [
      [2, [{ id: "ab", count: 2, reverse: false }]],
      [3, [{ id: "ac", count: 1, reverse: false }]],
      [4, [{ id: "cd", count: 3, reverse: true }]],
    ],
  );
});

test("a count's places run along its line from its source, clear of its corners and its far end", () => {
  const at = (places) => places.map(({ x, y, vertical }) => [x, y, vertical]);
  // Down a straight line: from 12 px past its start, 5 px apart, to 12 px before its end; then its middle.
  const down = placesAlong(
    [
      [0, 0],
      [0, 40],
    ],
    7,
  );
  assert.deepEqual(at(down), [
    [0, 12, true],
    [0, 17, true],
    [0, 22, true],
    [0, 27, true],
    [0, 20, true],
  ]);
  // Round a corner: no place within the corner's radius, the rest on the next stretch.
  const turned = placesAlong(
    [
      [0, 0],
      [0, 20],
      [30, 20],
    ],
    7,
  );
  assert.deepEqual(at(turned), [
    [0, 12, true],
    [7, 20, false],
    [12, 20, false],
    [17, 20, false],
    [0, 10, true],
  ]);
  // A line too short for any place offers its middle alone.
  const short = placesAlong(
    [
      [0, 0],
      [20, 0],
    ],
    7,
  );
  assert.deepEqual(at(short), [[10, 0, false]]);
});

test("a count takes the first place where its figures touch no mark, and with none stands at the first and is reported", () => {
  const style = { size: 14, weight: 400, line: 20 };
  const run = {
    points: [
      [100, 100],
      [100, 200],
    ],
    count: 3,
    color: "#617465",
    radius: 7,
    style,
  };
  const set = (marks) => {
    const texts = [];
    const rects = [];
    const text = (layer, value, x, top, used, color) => texts.push({ layer, value, x, top, color });
    const clear = drawCount(run, marks, { text, rects, typefaces });
    return { clear, texts, rects, marks };
  };
  // Nothing near: the count's line box is centred on the first place, 9 px right of its line.
  const free = set([]);
  assert.equal(free.clear, true);
  assert.deepEqual(free.texts, [
    { layer: "labels", value: "3", x: 109, top: 102, color: "#617465" },
  ]);
  assert.deepEqual(
    free.rects.map(({ x, y, height, kind, weight }) => [x, y, height, kind, weight]),
    [[109, 102, 20, "mass", 0]],
  );
  // The count's figures are a mark the next count keeps clear of.
  assert.equal(free.marks.length, 1);
  assert.equal(free.marks[0].x, 109);
  // A label over the first two places: the count stands at the third.
  const moved = set([{ x: 105, y: 100, width: 40, height: 13 }]);
  assert.equal(moved.clear, true);
  assert.deepEqual([moved.texts[0].x, moved.texts[0].top], [109, 112]);
  // A second count on the same run finds the first one's figures in its way and moves on.
  const second = drawCount(run, free.marks, { text: () => {}, rects: [], typefaces });
  assert.equal(second, true);
  assert.equal(free.marks.length, 2);
  assert.ok(free.marks[1].y > free.marks[0].y + free.marks[0].height);
  // A part beside the whole run: no place is clear, so the count stands at the first and is reported.
  const blocked = set([{ x: 104, y: 90, width: 60, height: 120 }]);
  assert.equal(blocked.clear, false);
  assert.deepEqual([blocked.texts[0].x, blocked.texts[0].top], [109, 102]);
});

test("a build names each count with no clear place by plate and relation, and each untested row its plates draw", () => {
  const style = stripStyle();
  assert.deepEqual(
    lineWarnings(
      [
        { page: 2, lines: ["relation", "planned"], touching: [] },
        { page: 5, lines: ["relation", "emphasis", "planned"], touching: ["fonts", "icons"] },
      ],
      style,
    ),
    [
      {
        code: "citation_count_touches",
        path: "/plates/05/relations/fonts",
        message:
          "Plate 05: the number of files relation fonts cites has no clear place and touches another mark.",
      },
      {
        code: "citation_count_touches",
        path: "/plates/05/relations/icons",
        message:
          "Plate 05: the number of files relation icons cites has no clear place and touches another mark.",
      },
      {
        code: "line_row_untested",
        message:
          "Plates 02, 05 draw the pattern of a planned part or relation, which no work has tested.",
      },
    ],
  );
  assert.deepEqual(
    lineWarnings([{ page: 1, lines: ["relation", "boundary"], touching: [] }], style),
    [],
  );
});

test("a relation of an overview cites every file of the relations it stands for", () => {
  const model = {
    relations: [
      { id: "a", files: ["x", "y"] },
      { id: "b", files: ["y", "z"] },
    ],
  };
  assert.equal(citedFiles(model, { files: ["x"] }), 1);
  assert.equal(citedFiles(model, { files: [], relations: ["a", "b"] }), 3);
  assert.equal(citedFiles(model, { files: [], relations: ["a", "missing"] }), 2);
});
