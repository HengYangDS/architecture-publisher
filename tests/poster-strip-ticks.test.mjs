import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { citedFiles, tickRuns, ticksAlong } from "../src/poster/strip.mjs";
import { POSTER } from "../src/poster/tokens.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import {
  INDIGO,
  part,
  stripStyle,
  files,
  stripModel,
  platesIn,
  ticksOf,
  labelOf,
} from "./fixtures/strips.mjs";

// Strip marks: the ticks a relation's line carries, one per file it cites.

test("a line carries one tick per file its relation cites, in the line's colour", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const groups = ticksOf(plate.svg);
  // Two, three, three, four, three, one and one: the relation that cites none has no ticks.
  assert.deepEqual(
    groups.map(({ ticks }) => ticks.length).sort((a, b) => a - b),
    [1, 1, 2, 3, 3, 3, 4],
  );
  // Every relation into the supplies cites three files or more and is drawn in the hub's dye.
  assert.deepEqual(
    groups
      .filter(({ stroke }) => stroke === INDIGO.dye.old)
      .map(({ ticks }) => ticks.length)
      .sort(),
    [3, 3, 3, 4],
  );
  for (const { width, ticks } of groups) {
    assert.equal(width, POSTER.wire.stroke);
    for (const [x1, y1, x2, y2] of ticks) assert.equal(Math.hypot(x2 - x1, y2 - y1), 10);
  }
  // The relation labels are set in the regular weight, so the parts' names lead.
  const label = plate.runs.find(({ text }) => text === "loads fonts");
  assert.equal(label?.weight, 400);
});

test("past five ticks, the line writes how many files its relation cites", async () => {
  const model = validateModel(
    minimalModel({
      id: "many",
      components: [
        { id: "builder", label: "Delivery builder" },
        { id: "supplies", label: "Supplies" },
        { id: "typst", label: "Typst" },
      ],
      relations: [
        { id: "fonts", from: "builder", to: "supplies", label: "loads fonts", files: files(8) },
        { id: "runs", from: "builder", to: "typst", label: "runs Typst", files: files(5) },
      ],
    }),
  );
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle());
  const groups = ticksOf(plate.svg).map(({ ticks }) => ticks.length);
  assert.deepEqual(groups.sort(), [5, 5]);
  const counts = plate.runs.filter(({ text }) => /^\d+$/u.test(text));
  assert.deepEqual(
    counts.map(({ text }) => text),
    ["8"],
  );
  assert.equal(counts[0].size, POSTER.floor);
  // Along a row, the count stands above the line.
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
  const [{ ticks }] = ticksOf(along.svg);
  const [x1, y1, x2, y2] = ticks[0];
  assert.equal(x1, x2);
  const six = along.runs.find(({ text }) => text === "6");
  assert.ok(six.baseline < Math.min(y1, y2), `${six.baseline} above ${y1}`);
});

test("a line's ticks stand near its source, on its own run from where it branches", async () => {
  // The builder fans out to two parts under one label: their lines share a trunk from the builder,
  // so each relation's ticks stand on its own branch.
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
  const groups = ticksOf(plate.svg);
  assert.deepEqual(groups.map(({ ticks }) => ticks.length).sort(), [1, 2]);
  const top = labelOf(plate, "a").baseline;
  for (const { ticks } of groups) {
    const [, y] = ticks[0];
    // Below the builder and its caption, and above the parts they reach.
    assert.ok(y > top + 40, `${y}`);
    assert.ok(y < labelOf(plate, "b").baseline - 20, `${y}`);
  }
  assert.notEqual(groups[0].ticks[0][0], groups[1].ticks[0][0]);
});

test("a relation's ticks start on its own run, from its source's end", () => {
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
  const layout = {
    cards,
    paths: [
      // The fan's trunk and bar, shared by both relations, then each one's branch.
      {
        relations: fan,
        points: [
          [50, 50],
          [50, 100],
        ],
      },
      {
        relations: fan,
        points: [
          [50, 100],
          [250, 100],
        ],
      },
      {
        relations: fan,
        points: [
          [50, 100],
          [50, 150],
        ],
      },
      {
        relations: fan,
        points: [
          [250, 100],
          [250, 150],
        ],
      },
      // A relation up from the lower row: its source is the line's last point.
      {
        relations: [cd],
        points: [
          [430, 50],
          [430, 100],
          [270, 100],
          [270, 150],
        ],
      },
      {
        relations: [none],
        points: [
          [470, 50],
          [470, 100],
          [290, 100],
          [290, 150],
        ],
      },
    ],
  };
  const runs = tickRuns({ relations: [] }, layout);
  assert.deepEqual(
    [...runs].sort(([a], [b]) => a - b),
    [
      [2, [{ count: 2, reverse: false }]],
      [3, [{ count: 1, reverse: false }]],
      [4, [{ count: 3, reverse: true }]],
    ],
  );
});

test("ticks stand across their line, clear of its corners and its far end", () => {
  const ends = ({ ticks }) => ticks.map((tick) => tick.flat().map((v) => Math.round(v * 10) / 10));
  // Down a straight line: from 12 px past its start, 5 px apart, 10 px long.
  const down = ticksAlong(
    [
      [0, 0],
      [0, 100],
    ],
    3,
    7,
  );
  assert.deepEqual(ends(down), [
    [-5, 12, 5, 12],
    [-5, 17, 5, 17],
    [-5, 22, 5, 22],
  ]);
  assert.equal(down.note, null);
  // Eight files: five ticks and the count beside the last.
  const many = ticksAlong(
    [
      [0, 0],
      [0, 100],
    ],
    8,
    7,
  );
  assert.equal(many.ticks.length, 5);
  assert.deepEqual(many.note, { x: 0, y: 32, vertical: true });
  // Round a corner: no tick within the corner's radius, the rest on the next run.
  const turned = ticksAlong(
    [
      [0, 0],
      [0, 20],
      [50, 20],
    ],
    5,
    7,
  );
  assert.deepEqual(ends(turned), [
    [-5, 12, 5, 12],
    [7, 25, 7, 15],
    [12, 25, 12, 15],
    [17, 25, 17, 15],
    [22, 25, 22, 15],
  ]);
  assert.equal(turned.note, null);
  // A line too short for every tick writes the count beside those it holds, or at its middle.
  const short = ticksAlong(
    [
      [0, 0],
      [30, 0],
    ],
    3,
    7,
  );
  assert.deepEqual(ends(short), [
    [12, 5, 12, -5],
    [17, 5, 17, -5],
  ]);
  assert.deepEqual(short.note, { x: 17, y: 0, vertical: false });
  assert.deepEqual(
    ticksAlong(
      [
        [0, 0],
        [0, 20],
      ],
      2,
      7,
    ),
    {
      ticks: [],
      note: { x: 0, y: 10, vertical: true },
    },
  );
  // A relation label set over the line hides what lies under it, so no tick stands there.
  const label = { x: -20, y: 15, width: 40, height: 10 };
  assert.deepEqual(
    ends(
      ticksAlong(
        [
          [0, 0],
          [0, 100],
        ],
        3,
        7,
        [label],
      ),
    ).map(([, y]) => y),
    [12, 27, 32],
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
