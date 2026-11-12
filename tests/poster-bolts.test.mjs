import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import test from "node:test";
import { loadIcons } from "../src/icons.mjs";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { hubOf, wireWidth } from "../src/poster/bolts.mjs";
import { admitsView, composePlates } from "../src/poster/compose/plates.mjs";
import { loadTypefaces } from "../src/poster/text.mjs";
import { POSTER } from "../src/poster/tokens.mjs";
import { wordsOf } from "../src/locale.mjs";
import { BIG_BANK_MODEL, minimalModel } from "./fixtures/models.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);
const house = JSON.parse(await fs.readFile(new URL("../src/house.json", import.meta.url), "utf8"));

/** The house tokens: the 0.12 colours every plate is drawn in when the edition names no style. */
const HOUSE_TOKENS = Object.freeze({
  palette: house.palette,
  figure: house.figure,
  dye: house.dye,
});

/** Indigo as a resolved palette gives it: its ground, ink, dyes and accent, and the tokens between. */
const INDIGO = Object.freeze({
  palette: {
    paper: "#f6f5f1",
    ink: "#25282c",
    green: "#334965",
    mid: "#5f6a78",
    soft: "#4d5561",
    rule: "#c9cbcd",
    ochre: "#7a5534",
  },
  figure: {
    card: "#fbfbf9",
    cardStroke: "#d3d5d8",
    outside: "#e9eaeb",
    outsideStroke: "#bfc3c8",
    outsideMark: "#76808b",
    boundary: "#858b93",
    retired: "#8d949c",
    shadow: "#202326",
  },
  dye: { new: "#b7d8db", mid: "#7099ae", old: "#334965" },
});
const DYES = [INDIGO.dye.new, INDIGO.dye.mid, INDIGO.dye.old];

/** Three days and a month, in seconds: the edition's two band boundaries. */
const SPANS = Object.freeze([3 * 86400, 30 * 86400]);

/** A part's files, as the edition binds them: path, bytes and age band, in path order. */
const part = (files) => ({
  bytes: files.reduce((sum, [, bytes]) => sum + bytes, 0),
  files: files.map(([path, bytes, band]) => ({ path, bytes, band })),
});

/**
 * The parts of the bolts work: the composer owns 3 KB and 1 KB, the record a file and a
 * sliver of the same band, the supplies are the largest part, and Typst owns no files.
 */
const PARTS = new Map([
  ["builder", part([["src/build.mjs", 21000, 0]])],
  [
    "composer",
    part([
      ["src/poster/figure.mjs", 3000, 0],
      ["src/poster/plate.mjs", 1000, 2],
    ]),
  ],
  ["words", part([["src/locale.mjs", 400, 0]])],
  [
    "record",
    part([
      ["src/edition/record.mjs", 9000, 2],
      ["src/edition/stamp.mjs", 10, 2],
    ]),
  ],
  [
    "supplies",
    part([
      ["supplies/fonts/a.otf", 30000, 2],
      ["supplies/fonts/b.otf", 20000, 2],
      ["supplies/icons.json", 6000, 0],
    ]),
  ],
]);

/** A bolts style over the given tokens and parts. */
const boltsStyle = (tokens = INDIGO, parts = PARTS) => ({
  name: "bolts",
  tokens,
  parts,
  most: Math.max(...[...parts.values()].map(({ bytes }) => bytes)),
  bands: { spans: SPANS },
});

const files = (count) => Array.from({ length: count }, (_, index) => `src/f${index}.mjs`);

/**
 * A small work: a builder that composes plates, runs Typst and loads fonts; four parts draw
 * on the supplies, each relation evidenced by three files or more.
 */
function boltModel(locale = "en", extra = {}, statuses = {}) {
  const zh = locale === "zh-CN";
  const status = (id) => (statuses[id] ? { status: statuses[id] } : {});
  return validateModel(
    minimalModel({
      id: "bolts",
      locale,
      title: zh ? "印刷版" : "The print edition",
      question: zh ? "什么把视图变成印刷版？" : "What turns the views into the print edition?",
      kinds: {
        stage: { label: zh ? "阶段" : "stage", category: "backend", icon: "server" },
        supply: { label: zh ? "供给" : "vendored supply", category: "backend", icon: "package" },
        tool: { label: zh ? "外部工具" : "external tool", category: "external", icon: "wrench" },
      },
      components: [
        {
          id: "builder",
          label: zh ? "交付构建" : "Delivery builder",
          kind: "stage",
          details: { [zh ? "产出" : "builds"]: [zh ? "印刷版" : "the edition"] },
        },
        { id: "composer", label: zh ? "图版排布" : "Plate composer", kind: "stage" },
        { id: "words", label: zh ? "词语" : "Words", kind: "stage" },
        { id: "record", label: zh ? "记录" : "Record", kind: "stage", ...status("record") },
        { id: "supplies", label: zh ? "供给" : "Supplies", kind: "supply" },
        { id: "typst", label: "Typst", kind: "tool", ...status("typst") },
      ],
      relations: [
        { id: "composes", from: "builder", to: "composer", label: "composes", files: files(2) },
        { id: "fonts", from: "builder", to: "supplies", label: "loads fonts", files: files(3) },
        { id: "icons", from: "composer", to: "supplies", label: "loads icons", files: files(3) },
        { id: "faces", from: "words", to: "supplies", label: "reads faces", files: files(4) },
        { id: "stages", from: "record", to: "supplies", label: "stages", files: files(3) },
        { id: "sets", from: "composer", to: "words", label: "sets words", files: files(1) },
        { id: "writes", from: "composer", to: "record", label: "writes" },
        { id: "runs", from: "builder", to: "typst", label: "runs Typst", files: files(1) },
      ],
      ...extra,
    }),
  );
}

/** Plan a model's views and compose its plates in one style, as the build does. */
async function platesIn(model, style) {
  const views = await planViews(model, async (view) =>
    admitsView(model, view, typefaces, icons, style),
  );
  return { views, plates: composePlates(model, views, typefaces, icons, style) };
}

const number = (text) => Number(text);

/** The rectangles a plate draws, with their fill and dash. */
const rectsOf = (svg) =>
  [
    ...svg.matchAll(
      /<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"([^>]*)\/>/gu,
    ),
  ].map(([, x, y, width, height, rest]) => ({
    x: number(x),
    y: number(y),
    width: number(width),
    height: number(height),
    fill: /fill="([^"]+)"/u.exec(rest)?.[1],
    dash: /stroke-dasharray="([^"]+)"/u.exec(rest)?.[1] ?? null,
  }));

/** The wires a plate draws: their colour and width. */
const wiresOf = (svg) =>
  [...svg.matchAll(/<path d="[^"]+" fill="none" stroke="([^"]+)" stroke-width="([\d.]+)"/gu)].map(
    ([, stroke, width]) => ({ stroke, width: number(width) }),
  );

/** The arrowheads a plate draws: the tip and the fill. */
const arrowsOf = (svg) =>
  [...svg.matchAll(/<path d="M([\d.]+),([\d.]+) L[^"]+Z" fill="([^"]+)"\/>/gu)].map(
    ([, x, y, fill]) => ({ x: number(x), y: number(y), fill }),
  );

/** The label run of a part: its last line, under which its strip is woven. */
const labelOf = (plate, id) => plate.runs.filter(({ component }) => component === id).at(-1);

/** The segments of a part's strip: contiguous rectangles from the label's left edge, under it. */
function stripOf(plate, id) {
  const label = labelOf(plate, id);
  const under = rectsOf(plate.svg).filter(
    (rect) => rect.y > label.baseline && rect.y < label.baseline + 40,
  );
  const first = under.find((rect) => Math.abs(rect.x - label.x) < 0.11);
  assert.ok(first, `no strip under ${id}`);
  const strip = [first];
  for (const rect of under.filter(({ y }) => y === first.y).sort((a, b) => a.x - b.x))
    if (rect.x > strip.at(-1).x && rect.x - (strip.at(-1).x + strip.at(-1).width) < 1.25)
      strip.push(rect);
  return strip;
}

/** The px a step's unit scales the bolts' thickness and line weights by. */
const unitOf = (plate) => POSTER.steps[plate.step].name / 24;

test("a strip is woven of its part's files, each as wide as its share of the part's bytes", async () => {
  const {
    plates: [plate],
  } = await platesIn(boltModel(), boltsStyle());
  // 3 KB and 1 KB: three quarters and one quarter of the strip, a pixel of paper between.
  const [figure, platePart] = stripOf(plate, "composer");
  const length = platePart.x + platePart.width - figure.x;
  assert.ok(Math.abs(figure.width + 1 - 0.75 * length) <= 0.15, `${figure.width} of ${length}`);
  assert.ok(Math.abs(platePart.width - 0.25 * length) <= 0.15, `${platePart.width} of ${length}`);
  assert.deepEqual([figure.fill, platePart.fill], [INDIGO.dye.new, INDIGO.dye.old]);
  // A file narrower than a pixel merges into its neighbour of the same band.
  const record = stripOf(plate, "record");
  assert.equal(record.length, 1);
  assert.equal(record[0].fill, INDIGO.dye.old);
  // Every part's strip is as long as its box: its caption's counts end where it ends.
  const counts = plate.runs.find(({ text }) => text === "2 files, 4 KB");
  assert.ok(counts);
  assert.ok(Math.abs(counts.x + counts.width - (figure.x + length)) < 0.2);
  // The kind sets the caption's left, in the muted colour of a detail.
  const kind = plate.runs.find(({ text, x }) => text === "stage" && Math.abs(x - figure.x) < 0.11);
  assert.equal(kind?.color, INDIGO.palette.soft);
  assert.ok(plate.runs.some(({ text }) => text === "1 file, < 1 KB"));
  assert.ok(plate.runs.some(({ text }) => text === "builds: the edition"));
});

test("a strip's thickness grows with the root of its part's bytes over the edition's largest part", async () => {
  const {
    plates: [plate],
  } = await platesIn(boltModel(), boltsStyle());
  const unit = unitOf(plate);
  const most = 56000;
  for (const [id, { bytes }] of PARTS) {
    const thickness = Math.round(4 + 16 * Math.sqrt(bytes / most)) * unit;
    for (const segment of stripOf(plate, id))
      assert.ok(Math.abs(segment.height - thickness) <= 0.05, `${id}: ${segment.height}`);
  }
  // The supplies are the largest part: 20 units thick.
  assert.ok(Math.abs(stripOf(plate, "supplies")[0].height - 20 * unit) <= 0.05);
});

test("a part that owns no files is an empty dashed strip at the thinnest thickness", async () => {
  const {
    plates: [plate],
  } = await platesIn(boltModel(), boltsStyle());
  const [empty] = stripOf(plate, "typst");
  assert.equal(empty.fill, "none");
  assert.ok(empty.dash);
  assert.ok(Math.abs(empty.height - 4 * unitOf(plate)) <= 0.05);
  assert.ok(plate.runs.some(({ text }) => text === "owns no files"));
  // No icons, no card boxes and no bars: the plate draws strips, wires and labels.
  assert.doesNotMatch(plate.svg, /<g transform|filter=|<text/u);
});

test("the hub's wires are in the oldest dye and every line's weight counts its evidence", async () => {
  const {
    plates: [plate],
  } = await platesIn(boltModel(), boltsStyle());
  const unit = unitOf(plate);
  const weights = [1.2, 1.8, 2.4].map((weight) => Math.round(weight * unit * 100) / 100);
  const wires = wiresOf(plate.svg);
  const hub = wires.filter(({ stroke }) => stroke === INDIGO.dye.old);
  assert.ok(hub.length > 0);
  // Every relation into the supplies cites three files or more.
  for (const wire of hub) assert.equal(wire.width, weights[2]);
  for (const wire of wires) assert.ok(weights.includes(wire.width), String(wire.width));
  assert.ok(wires.some(({ width }) => width === weights[0]));
  // The arrowheads into the hub take its dye; every other arrowhead keeps the line's colour.
  const [left, ...rest] = stripOf(plate, "supplies");
  const right = (rest.at(-1) ?? left).x + (rest.at(-1) ?? left).width;
  const top = labelOf(plate, "supplies").baseline;
  const arrows = arrowsOf(plate.svg);
  const into = arrows.filter(({ x, y }) => x >= left.x && x <= right && y < top && y > top - 40);
  assert.ok(into.length > 0);
  for (const arrow of into) assert.equal(arrow.fill, INDIGO.dye.old);
  for (const arrow of arrows.filter((arrow) => !into.includes(arrow)))
    assert.equal(arrow.fill, INDIGO.palette.mid);
});

test("a line takes the weight of the most files any of its relations cites", () => {
  const model = { relations: [] };
  const cites = (count) => ({ files: files(count) });
  assert.equal(wireWidth(model, [cites(0)], 1), 1.2);
  assert.equal(wireWidth(model, [cites(1)], 1), 1.2);
  assert.equal(wireWidth(model, [cites(2)], 1), 1.8);
  assert.equal(wireWidth(model, [cites(5)], 1), 2.4);
  assert.equal(wireWidth(model, [cites(1), cites(2)], 0.75), 1.35);
  // An overview's relation stands for the model's relations between two groups and their files.
  const grouped = {
    relations: [
      { id: "a", files: ["x", "y"] },
      { id: "b", files: ["y", "z"] },
    ],
  };
  assert.equal(wireWidth(grouped, [{ files: [], relations: ["a", "b"] }], 1), 2.4);
  assert.equal(wireWidth(grouped, [{ files: [], relations: ["a", "missing"] }], 1), 1.8);
});

test("a view's hub draws three relations or more and strictly more than any other part", () => {
  const view = (pairs) => ({
    components: [],
    relations: pairs.map(([from, to]) => ({ from, to })),
  });
  assert.equal(
    hubOf(
      view([
        ["a", "h"],
        ["b", "h"],
        ["c", "h"],
        ["a", "b"],
      ]),
    ),
    "h",
  );
  // No relation, two relations or a tie: no hub.
  assert.equal(hubOf(view([])), null);
  assert.equal(
    hubOf(
      view([
        ["a", "h"],
        ["b", "h"],
      ]),
    ),
    null,
  );
  assert.equal(
    hubOf(
      view([
        ["a", "h"],
        ["b", "h"],
        ["c", "h"],
        ["a", "g"],
        ["b", "g"],
        ["c", "g"],
      ]),
    ),
    null,
  );
});

test("a bolts plate's key lists exactly the marks it shows", async () => {
  const {
    plates: [plate],
  } = await platesIn(boltModel(), boltsStyle());
  assert.deepEqual(plate.legend, [
    { shape: "band", band: 0, color: INDIGO.dye.new, label: "changed within 3 days" },
    { shape: "band", band: 2, color: INDIGO.dye.old, label: "earlier" },
    { shape: "thickness", label: "a strip's thickness is the code a part owns" },
    {
      shape: "weight",
      counts: [1, 2, 3],
      label: "line weight counts the files that evidence a relation",
    },
    { shape: "hub", color: INDIGO.dye.old, label: "draws on Supplies" },
    { shape: "boundary", label: "inside The print edition" },
  ]);
});

test("a bolts plate in Chinese sets its captions and key in Chinese", async () => {
  // One file of every band, so the key names all three.
  const parts = new Map(PARTS);
  parts.set("words", part([["src/locale.mjs", 6000, 1]]));
  const {
    plates: [plate],
  } = await platesIn(boltModel("zh-CN"), boltsStyle(INDIGO, parts));
  const texts = plate.runs.map(({ text }) => text);
  for (const text of ["2 个文件，4 KB", "1 个文件，6 KB", "不拥有文件", "阶段", "外部工具"])
    assert.ok(texts.includes(text), text);
  assert.deepEqual(
    plate.legend.slice(0, 6).map(({ label }) => label),
    [
      "三天内改过",
      "一月内改过",
      "更早",
      "布条的厚薄是组件拥有的代码量",
      "线的粗细是证明这次调用的源文件数",
      "调用供给",
    ],
  );
});

test("a band's name follows the edition's spans on the ladder", async () => {
  const parts = new Map([["words", part([["src/locale.mjs", 6000, 1]])]]);
  const style = { ...boltsStyle(INDIGO, parts), bands: { spans: [7 * 86400, 365 * 86400] } };
  const {
    plates: [plate],
  } = await platesIn(boltModel(), style);
  assert.deepEqual(plate.legend[0], {
    shape: "band",
    band: 1,
    color: INDIGO.dye.mid,
    label: "within a year",
  });
  // A plate without evidenced relations draws no weights and has no hub to name.
  assert.deepEqual(
    plate.legend.map(({ shape }) => shape),
    ["band", "thickness", "weight", "hub", "boundary"],
  );
  const bare = validateModel(
    minimalModel({
      components: [
        { id: "a", label: "Alpha" },
        { id: "b", label: "Beta" },
      ],
      relations: [{ id: "a-b", from: "a", to: "b", label: "calls" }],
    }),
  );
  const {
    plates: [empty],
  } = await platesIn(bare, { ...style, parts: new Map(), most: 0 });
  assert.deepEqual(empty.legend, []);
  assert.equal(rectsOf(empty.svg).filter(({ fill }) => fill === "none").length, 2);
});

test("an overview's group is woven of its members' files in path order", async () => {
  const model = boltModel("en", {
    groups: [{ id: "edition", label: "Edition", members: ["composer", "words", "record"] }],
  });
  // The words own no files here, so the group weaves the composer's and the record's.
  const parts = new Map(PARTS);
  parts.delete("words");
  const style = boltsStyle(INDIGO, parts);
  // The whole work fits one plate; set aside, it is planned as an overview and a view of its group.
  const views = await planViews(model, async (view) =>
    view.origin === "complete"
      ? { fits: false, width: 0, height: 0 }
      : admitsView(model, view, typefaces, icons, style),
  );
  const plates = composePlates(model, views, typefaces, icons, style);
  const overview = plates[views.findIndex(({ origin }) => origin === "overview")];
  // The record's file and its merged sliver, then the composer's two files.
  assert.deepEqual(
    stripOf(overview, "edition").map(({ fill }) => fill),
    [INDIGO.dye.old, INDIGO.dye.new, INDIGO.dye.old],
  );
  assert.ok(overview.runs.some(({ text }) => text === "4 files, 13 KB"));
  assert.ok(overview.runs.some(({ text }) => text === "group"));
  // Two relations into the supplies are not a hub.
  assert.ok(wiresOf(overview.svg).every(({ stroke }) => stroke !== INDIGO.dye.old));
  assert.ok(!overview.legend.some(({ shape }) => shape === "hub"));
});

test("a cards plate in indigo draws every colour from its tokens", async () => {
  const style = { ...boltsStyle(), name: "cards" };
  const {
    plates: [plate],
  } = await platesIn(boltModel(), style);
  const tokens = new Set([
    ...Object.values(INDIGO.palette),
    ...Object.values(INDIGO.figure),
    ...DYES,
  ]);
  const drawn = new Set([
    ...[...plate.svg.matchAll(/#[0-9a-f]{6}/giu)].map(([color]) => color),
    ...plate.runs.map(({ color }) => color),
    ...plate.legend.flatMap(({ color }) => (color ? [color] : [])),
  ]);
  for (const color of drawn) assert.ok(tokens.has(color), color);
  for (const color of [INDIGO.figure.card, INDIGO.figure.outside, INDIGO.palette.mid])
    assert.ok(drawn.has(color), color);
  // Cards keep their icons, boxes and kinds.
  assert.match(plate.svg, /filter="url\(#lift\)"/u);
  assert.ok(plate.legend.some(({ kind }) => kind === "supply"));
});

test("cards in the house tokens draw the plates Architecture Publisher 0.12 drew", async () => {
  const bank = JSON.parse(await fs.readFile(BIG_BANK_MODEL, "utf8"));
  bank.components[1].status = "planned";
  bank.components[2].status = "retired";
  bank.relations[0].status = "planned";
  bank.relations[1].status = "retired";
  const model = validateModel(bank);
  const digest = (plates) =>
    crypto
      .createHash("sha256")
      .update(JSON.stringify(plates.map(({ svg, runs }) => ({ svg, runs }))))
      .digest("hex");
  // Captured from 0.12.0's engine, before styles and palettes.
  const drawn = "9ddb126b2fa312f5a8afa44d952bf523f42dd87ac32d3fefc221b935fed6599c";
  const unnamed = await platesIn(model);
  assert.equal(digest(unnamed.plates), drawn);
  const named = await platesIn(model, { name: "cards", tokens: HOUSE_TOKENS });
  assert.equal(digest(named.plates), drawn);
  assert.deepEqual(named.plates, unnamed.plates);
});

test("a planned or retired part's strip is outlined in its status's dashes", async () => {
  const model = boltModel("en", {}, { record: "retired", typst: "planned" });
  const {
    plates: [plate],
  } = await platesIn(model, boltsStyle());
  const outlines = rectsOf(plate.svg).filter(({ fill }) => fill === "none");
  assert.ok(outlines.some(({ dash }) => dash === POSTER.dash.retired));
  assert.ok(outlines.some(({ dash }) => dash === POSTER.dash.planned));
  // A retired part's label is muted, as on a card.
  assert.equal(labelOf(plate, "record").color, INDIGO.palette.soft);
  assert.deepEqual(
    plate.legend.slice(-2).map(({ shape }) => shape),
    ["planned", "retired"],
  );
});

test("a part of empty files shares its strip evenly", async () => {
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
  } = await platesIn(boltModel(), boltsStyle(INDIGO, parts));
  const [first, second] = stripOf(plate, "words");
  assert.ok(Math.abs(first.width + 1 - second.width) <= 0.15, `${first.width} ${second.width}`);
  assert.ok(plate.runs.some(({ text }) => text === "2 files, 0 KB"));
});

test("a caption counts one file in the singular in every language that has one", () => {
  assert.equal(wordsOf("en").files(1, "2 KB"), "1 file, 2 KB");
  assert.equal(wordsOf("es").files(1, "2 KB"), "1 archivo, 2 KB");
  assert.equal(wordsOf("es").files(3, "2 KB"), "3 archivos, 2 KB");
});

test("a bolt whose label cannot break within any box is refused as a card would be", () => {
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
    () => admitsView(long, view, typefaces, icons, boltsStyle()),
    (error) => error.code === "plate_unfittable",
  );
});

test("a wire leaves a short bolt one gap under its caption, not at its row's foot", async () => {
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
  } = await platesIn(model, boltsStyle(INDIGO, parts));
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
