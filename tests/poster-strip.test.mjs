import assert from "node:assert/strict";
import test from "node:test";
import { hubOf } from "../src/facts/view.mjs";
import { validateModel } from "../src/model/load.mjs";
import { admitsView } from "../src/poster/compose/plates.mjs";
import { TABLE } from "./fixtures/line-tables.mjs";
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
  arrowsOf,
  labelOf,
  outlineOf,
  stripOf,
  lengthOf,
} from "./fixtures/strips.mjs";

// The strip of a part: strips on one scale, their files, the hub and the box a part keeps; the part as a whole is
// in poster-part and the counts are in poster-line-counts.

/** The patterns the table of lines gives a planned and a retired part or relation. */
const DASH = Object.freeze({
  planned: TABLE.rows.planned.dash.join(" "),
  retired: TABLE.rows.retired.dash.join(" "),
});

/** The largest part's strip, in px: every other part's strip is as long for its share of the largest's bytes. */
const LONGEST = 320;
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
  // A part's card is as wide as the widest of its regions within its padding: the supplies' strip, the edition's
  // longest, stands within the card's padding, and their counts end at the card's right padding.
  const supplies = stripOf(plate, "supplies");
  const card = outlineOf(plate, "supplies");
  const pad = supplies[0].x - card.x;
  const inner = card.x + card.width - pad;
  const counts = plate.runs.find(({ text }) => text === "3 files, 56 KB");
  assert.ok(supplies[0].x + lengthOf(supplies) <= inner + 0.2, String(lengthOf(supplies)));
  assert.ok(Math.abs(counts.x + counts.width - inner) < 0.2, String(counts.x + counts.width));
  // The composer's text is wider than its strip, so its counts stand beyond it.
  const composer = stripOf(plate, "composer");
  const composed = plate.runs.find(({ text }) => text === "2 files, 4 KB");
  assert.ok(composed.x + composed.width > composer[0].x + lengthOf(composer) + 100);
  // The kind's label follows the kind's icon, which sets the caption's left, in the muted colour of a detail.
  const kind = plate.runs.find(
    ({ text, x }) => text === "stage" && x > composer[0].x && x < composer[0].x + 40,
  );
  assert.equal(kind?.color, INDIGO.palette.soft);
  assert.ok(plate.runs.some(({ text }) => text === "1 file, < 1 KB"));
  assert.ok(plate.runs.some(({ text }) => text === "builds: the edition"));
});

test("every plate of an edition measures its strips on the same scale, whatever its type step", async () => {
  // Four details to a part set the plate of all six parts in a smaller type than the plate of two.
  const details = Object.fromEntries(
    [1, 2, 3, 4].map((index) => [`note ${index}`, ["a line of a few words that a card holds"]]),
  );
  const model = stripModel("en", {
    components: [
      {
        id: "builder",
        label: "Delivery builder",
        kind: "stage",
        details: { builds: ["the edition"] },
      },
      { id: "composer", label: "Plate composer", kind: "stage", details },
      { id: "words", label: "Words", kind: "stage", details },
      { id: "record", label: "Record", kind: "stage", details },
      { id: "supplies", label: "Supplies", kind: "supply" },
      { id: "typst", label: "Typst", kind: "tool", details },
    ],
    views: [
      { id: "all", members: ["builder", "composer", "words", "record", "supplies", "typst"] },
      { id: "pair", members: ["builder", "supplies"] },
    ],
  });
  const { plates } = await platesIn(model, stripStyle());
  const [all, pair] = plates;
  assert.ok(all.step < pair.step, `${all.step} and ${pair.step}`);
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

/** Whether a wire has an end at a distance from a point, to a tenth of a pixel. */
const endsAt = ({ points }, { x, y }, distance = 0) =>
  [points[0], points.at(-1)].some(
    ([px, py]) => Math.abs(Math.hypot(px - x, py - y) - distance) < 0.11,
  );

test("the lines into the hub are twice as heavy, in the oldest dye, each ending inside a larger arrowhead", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const wires = wiresOf(plate.svg);
  const { relation, emphasis } = TABLE.rows;
  const heavy = wires.filter(({ width }) => width === relation.stroke * emphasis.factor);
  const light = wires.filter(({ width }) => width === relation.stroke);
  assert.equal(heavy.length + light.length, wires.length);
  assert.ok(heavy.length > 0 && light.length > 0);
  for (const { stroke, dash } of heavy) assert.deepEqual([stroke, dash], [INDIGO.dye.old, null]);
  for (const { stroke } of light) assert.equal(stroke, INDIGO.palette.mid);
  // The lines into the hub end on the top edge of its card.
  const hub = outlineOf(plate, "supplies");
  const arrows = arrowsOf(plate.svg);
  const into = arrows.filter(
    ({ x, y }) => x >= hub.x && x <= hub.x + hub.width && Math.abs(y - hub.y) < 0.11,
  );
  const others = arrows.filter((arrow) => !into.includes(arrow));
  assert.ok(into.length > 0 && others.length > 0);
  const [ordinary, ...further] = [...new Set(others.map(({ size }) => size))];
  assert.deepEqual(further, []);
  for (const arrow of into) {
    assert.equal(arrow.fill, INDIGO.dye.old);
    assert.equal(arrow.size, Math.round(ordinary * emphasis.arrow * 10) / 10);
    // A heavy line stops half a head short of the tip, inside the head, and no line's round cap reaches the tip.
    assert.ok(heavy.some((wire) => endsAt(wire, arrow, arrow.size / 2)));
    assert.ok(!wires.some((wire) => endsAt(wire, arrow)));
  }
  for (const arrow of others) {
    assert.equal(arrow.fill, INDIGO.palette.mid);
    assert.ok(light.some((wire) => endsAt(wire, arrow)));
  }
});

test("a planned relation into the hub is heavy in its dashes, and a retired one keeps its colour, weight and dots", async () => {
  const model = stripModel("en", {}, { icons: "planned", stages: "retired" });
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle());
  const wires = wiresOf(plate.svg);
  const { relation, emphasis } = TABLE.rows;
  const planned = wires.filter(({ dash }) => dash === DASH.planned);
  const retired = wires.filter(({ dash }) => dash === DASH.retired);
  assert.ok(planned.length > 0 && retired.length > 0);
  for (const { stroke, width } of planned)
    assert.deepEqual([stroke, width], [INDIGO.dye.old, relation.stroke * emphasis.factor]);
  for (const { stroke, width } of retired)
    assert.deepEqual([stroke, width], [INDIGO.figure.retired, relation.stroke]);
  // The retired line keeps the arrowhead of every other line, in its own colour.
  const arrows = arrowsOf(plate.svg);
  const sizes = [...new Set(arrows.map(({ size }) => size))].sort((a, b) => a - b);
  assert.equal(sizes.length, 2);
  for (const arrow of arrows.filter(({ fill }) => fill === INDIGO.figure.retired))
    assert.equal(arrow.size, sizes[0]);
  assert.deepEqual(plate.lines.toSorted(), [
    "boundary",
    "citations",
    "emphasis",
    "planned",
    "relation",
    "retired",
  ]);
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

test("a planned or retired part's card is outlined in its status's dashes, and keeps its strip", async () => {
  const model = stripModel("en", {}, { record: "retired", typst: "planned" });
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle());
  assert.equal(outlineOf(plate, "record").dash, DASH.retired);
  assert.equal(outlineOf(plate, "typst").dash, DASH.planned);
  assert.equal(outlineOf(plate, "builder").dash, null);
  // A retired part's label is muted, and the strip of the files it still owns is as long as its bytes.
  assert.equal(labelOf(plate, "record").color, INDIGO.palette.soft);
  const expected = (LONGEST * PARTS.get("record").bytes) / MOST;
  assert.ok(Math.abs(lengthOf(stripOf(plate, "record")) - expected) <= 0.15);
  // No strip is outlined: a status is its card's pattern.
  assert.deepEqual(
    rectsOf(plate.svg).filter(({ fill, height }) => fill === "none" && height === 12),
    [],
  );
  // The statuses close the key.
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

test("a part whose label cannot break within any box is refused", () => {
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

test("the parts of a row share one height, and a wire leaves a short part at the foot of its card", async () => {
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
  const [tall, short] = [outlineOf(plate, "tall"), outlineOf(plate, "short")];
  const caption = plate.runs.find(({ text }) => text === "1 file, 2 KB");
  const detail = plate.runs.filter(({ text }) => /wrap|once/u.test(text)).at(-1);
  // The two parts share a row: the tall one's detail runs well below the short one's caption, and their cards
  // are as tall as each other, the short one's spare height at its foot.
  assert.ok(detail.baseline > caption.baseline + 40);
  assert.deepEqual([short.y, short.height], [tall.y, tall.height]);
  const starts = [...plate.svg.matchAll(/<path d="M([\d.]+),([\d.]+)[^"]*" fill="none"/gu)].map(
    ([, x, y]) => [Number(x), Number(y)],
  );
  const under = starts.filter(([x]) => x > short.x && x < short.x + short.width);
  assert.ok(under.length > 0);
  for (const [, y] of under) assert.ok(Math.abs(y - (short.y + short.height)) < 0.11, String(y));
});
