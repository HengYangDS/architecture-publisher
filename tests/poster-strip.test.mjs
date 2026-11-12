import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { citedFiles, hubOf, tickRuns, ticksAlong } from "../src/poster/strip.mjs";
import { admitsView } from "../src/poster/compose/plates.mjs";
import { POSTER } from "../src/poster/tokens.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import {
  typefaces,
  icons,
  INDIGO,
  part,
  PARTS,
  stripStyle,
  files,
  stripModel,
  platesIn,
  rectsOf,
  wiresOf,
  ticksOf,
  arrowsOf,
  labelOf,
  stripOf,
  lengthOf,
} from "./fixtures/strips.mjs";

// Strip marks: strips on one scale, their files, the ticks, the hub and the box a part keeps.

/** The largest part's strip, in px: every other part's strip is as long for its share of the largest's bytes. */
const LONGEST = 480;
/** The bytes of the largest part of the strip work, the supplies. */
const MOST = 56000;

test("a strip is as long as its part's bytes on one scale, the largest part longest", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  for (const [id, { bytes }] of PARTS) {
    const length = lengthOf(stripOf(plate, id));
    const expected = Math.max(2, (LONGEST * bytes) / MOST);
    assert.ok(Math.abs(length - expected) <= 0.15, `${id}: ${length} for ${expected}`);
  }
  // Lengths stand as the bytes do: the supplies own 56 KB and the builder 21 KB.
  const ratio = lengthOf(stripOf(plate, "supplies")) / lengthOf(stripOf(plate, "builder"));
  assert.ok(Math.abs(ratio / (56000 / 21000) - 1) < 0.01, String(ratio));
  // One thickness for every part: size is read from length alone.
  const heights = new Set(
    [...PARTS.keys()].flatMap((id) => stripOf(plate, id).map((s) => s.height)),
  );
  assert.deepEqual([...heights], [12]);
  // A part's box is as wide as the larger of its text and its strip: the supplies' strip sets
  // their box, and its counts end where the strip ends.
  const supplies = stripOf(plate, "supplies");
  const counts = plate.runs.find(({ text }) => text === "3 files, 56 KB");
  assert.ok(Math.abs(counts.x + counts.width - (supplies[0].x + lengthOf(supplies))) < 0.2);
  // The composer's text is wider than its strip, so its counts stand beyond it.
  const composer = stripOf(plate, "composer");
  const composed = plate.runs.find(({ text }) => text === "2 files, 4 KB");
  assert.ok(composed.x + composed.width > composer[0].x + lengthOf(composer) + 100);
  // The kind sets the caption's left, in the muted colour of a detail.
  const kind = plate.runs.find(
    ({ text, x }) => text === "stage" && Math.abs(x - composer[0].x) < 0.11,
  );
  assert.equal(kind?.color, INDIGO.palette.soft);
  assert.ok(plate.runs.some(({ text }) => text === "1 file, < 1 KB"));
  assert.ok(plate.runs.some(({ text }) => text === "builds: the edition"));
});

test("every plate of an edition measures its strips on the same scale, whatever its type step", async () => {
  const model = stripModel("en", {
    views: [
      { id: "all", members: ["builder", "composer", "words", "record", "supplies", "typst"] },
      { id: "pair", members: ["builder", "supplies"] },
    ],
  });
  const { plates } = await platesIn(model, stripStyle());
  const [all, pair] = plates;
  assert.notEqual(all.step, pair.step);
  for (const plate of plates) {
    assert.ok(Math.abs(lengthOf(stripOf(plate, "supplies")) - LONGEST) <= 0.15);
    assert.ok(Math.abs(lengthOf(stripOf(plate, "builder")) - (LONGEST * 21000) / MOST) <= 0.15);
  }
});

test("a strip's files keep their shares of its length, a sliver merging into its band", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  // 3 KB and 1 KB: three quarters and one quarter of the strip, a pixel of paper between.
  const strip = stripOf(plate, "composer");
  const [figure, platePart] = strip;
  const length = lengthOf(strip);
  assert.ok(Math.abs(figure.width + 1 - 0.75 * length) <= 0.15, `${figure.width} of ${length}`);
  assert.ok(Math.abs(platePart.width - 0.25 * length) <= 0.15, `${platePart.width} of ${length}`);
  assert.deepEqual([figure.fill, platePart.fill], [INDIGO.dye.new, INDIGO.dye.old]);
  // A file narrower than a pixel merges into its neighbour of the same band.
  const record = stripOf(plate, "record");
  assert.equal(record.length, 1);
  assert.equal(record[0].fill, INDIGO.dye.old);
  // A part far smaller than the largest is still a visible strip.
  assert.ok(lengthOf(stripOf(plate, "words")) >= 2);
  const tiny = new Map(PARTS);
  tiny.set("words", part([["src/locale.mjs", 3, 0]]));
  const {
    plates: [small],
  } = await platesIn(stripModel(), stripStyle(INDIGO, tiny));
  assert.ok(Math.abs(lengthOf(stripOf(small, "words")) - 2) <= 0.05);
});

test("a part that owns no files is an empty dashed strip of a fixed short length", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const [empty] = stripOf(plate, "typst");
  assert.equal(empty.fill, "none");
  assert.ok(empty.dash);
  assert.deepEqual([empty.width, empty.height], [40, 12]);
  assert.ok(plate.runs.some(({ text }) => text === "owns no files"));
  // No icons, no card boxes and no bars: the plate draws strips, wires, ticks and labels.
  assert.doesNotMatch(plate.svg, /<g transform|filter=|<text/u);
});

test("every line is one weight, and the hub's lines and arrowheads are in the oldest dye", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const wires = wiresOf(plate.svg);
  assert.deepEqual([...new Set(wires.map(({ width }) => width))], [POSTER.wire.stroke]);
  assert.ok(wires.some(({ stroke }) => stroke === INDIGO.dye.old));
  assert.ok(wires.some(({ stroke }) => stroke === INDIGO.palette.mid));
  const strip = stripOf(plate, "supplies");
  const right = strip[0].x + lengthOf(strip);
  const top = labelOf(plate, "supplies").baseline;
  const arrows = arrowsOf(plate.svg);
  const into = arrows.filter(
    ({ x, y }) =>
      x >= strip[0].x && x <= Math.max(right, strip[0].x + 480) && y < top && y > top - 40,
  );
  assert.ok(into.length > 0);
  for (const arrow of into) assert.equal(arrow.fill, INDIGO.dye.old);
  for (const arrow of arrows.filter((arrow) => !into.includes(arrow)))
    assert.equal(arrow.fill, INDIGO.palette.mid);
});

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

test("a view's hub draws three relations or more and strictly more than any other part", () => {
  const view = (pairs) => ({
    components: [],
    relations: pairs.map(([from, to]) => ({ from, to })),
  });
  const ends = (...tos) => view(tos.map((to, index) => [`s${index}`, to]));
  assert.equal(hubOf(ends("h", "h", "h", "b")), "h");
  // No relation, two relations or a tie: no hub.
  assert.equal(hubOf(view([])), null);
  assert.equal(hubOf(ends("h", "h")), null);
  assert.equal(hubOf(ends("h", "h", "h", "g", "g", "g")), null);
});

test("a planned or retired part's strip is outlined in its status's dashes", async () => {
  const model = stripModel("en", {}, { record: "retired", typst: "planned" });
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle());
  const outlines = rectsOf(plate.svg).filter(({ fill }) => fill === "none");
  assert.ok(outlines.some(({ dash }) => dash === POSTER.dash.retired));
  assert.ok(outlines.some(({ dash }) => dash === POSTER.dash.planned));
  // A retired part's label is muted, as on a card, and its outline is as long as its strip.
  assert.equal(labelOf(plate, "record").color, INDIGO.palette.soft);
  const retired = outlines.find(({ dash }) => dash === POSTER.dash.retired);
  assert.ok(Math.abs(retired.width - lengthOf(stripOf(plate, "record"))) <= 0.15);
  assert.deepEqual(
    plate.legend.slice(-2).map(({ shape }) => shape),
    ["planned", "retired"],
  );
});

test("a part of empty files is the shortest strip, its files sharing it evenly", async () => {
  const parts = new Map(PARTS);
  parts.set(
    "words",
    part([
      ["src/locale/a.mjs", 0, 0],
      ["src/locale/b.mjs", 0, 1],
    ]),
  );
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle(INDIGO, parts));
  const [first, second] = stripOf(plate, "words");
  assert.deepEqual([first.width, second.width], [1, 1]);
  assert.ok(plate.runs.some(({ text }) => text === "2 files, 0 KB"));
});

test("a strip part whose label cannot break within any box is refused as a card would be", () => {
  const long = validateModel({
    ...minimalModel(),
    id: "long",
    components: [
      { id: "a", label: "Unbreakable".repeat(9) },
      { id: "b", label: "Beta" },
    ],
    relations: [{ id: "a-b", from: "a", to: "b", label: "calls" }],
  });
  const view = {
    id: "view",
    title: long.title,
    question: long.question,
    summary: null,
    origin: "complete",
    tiers: null,
    components: long.components,
    relations: long.relations,
  };
  assert.throws(
    () => admitsView(long, view, typefaces, icons, stripStyle()),
    (error) => error.code === "plate_unfittable",
  );
});

test("a wire leaves a short strip part one gap under its caption, not at its row's foot", async () => {
  const model = validateModel(
    minimalModel({
      id: "feet",
      components: [
        {
          id: "tall",
          label: "Tall part",
          details: {
            holds: [
              "the first of many long values that wrap",
              "a second long value that wraps again",
              "and a third that wraps once more",
            ],
          },
        },
        { id: "short", label: "Short part" },
        { id: "sink", label: "Sink" },
      ],
      relations: [
        { id: "t", from: "tall", to: "sink", label: "feeds", files: files(1) },
        { id: "s", from: "short", to: "sink", label: "feeds too", files: files(1) },
      ],
    }),
  );
  const parts = new Map([
    ["tall", part([["src/tall.mjs", 4000, 0]])],
    ["short", part([["src/short.mjs", 2000, 2]])],
    ["sink", part([["src/sink.mjs", 1000, 1]])],
  ]);
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle(INDIGO, parts));
  const [strip] = stripOf(plate, "short");
  const caption = plate.runs.find(({ text }) => text === "1 file, 2 KB");
  const detail = plate.runs.filter(({ text }) => /wrap|once/u.test(text)).at(-1);
  // The two parts share a row: the tall one's detail runs well below the short one's caption.
  assert.ok(detail.baseline > caption.baseline + 40);
  const starts = [...plate.svg.matchAll(/<path d="M([\d.]+),([\d.]+)[^"]*" fill="none"/gu)].map(
    ([, x, y]) => [Number(x), Number(y)],
  );
  const under = starts.filter(([x]) => x > strip.x && x < strip.x + 400);
  assert.ok(under.length > 0);
  for (const [, y] of under) assert.ok(y - caption.baseline < 24, `${y} under ${caption.baseline}`);
});
