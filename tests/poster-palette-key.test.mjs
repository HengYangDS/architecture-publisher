import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView, composePlates } from "../src/poster/compose/plates.mjs";
import { measureWordsOf, wordsOf } from "../src/locale.mjs";
import { BIG_BANK_MODEL, minimalModel } from "./fixtures/models.mjs";
import {
  typefaces,
  icons,
  HOUSE_TOKENS,
  INDIGO,
  DYES,
  part,
  PARTS,
  stripStyle,
  stripModel,
  platesIn,
  rectsOf,
  wiresOf,
  stripOf,
  lengthOf,
  REFERENCE,
} from "./fixtures/strips.mjs";

// The key and words of a plate whose parts carry strips, and the colours a palette gives a plate.

test("a plate's key lists exactly the marks it shows, each with a real sample", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  // No kind: a card names its own kind beside the kind's icon.
  assert.deepEqual(plate.legend, [
    // What the bands count from leads them, in two forms: with the date, and without it for a page whose foot
    // states the date.
    {
      shape: "reference",
      date: REFERENCE,
      label: "last changed before commit @ 2026-11-10:",
      undated: "last changed before commit:",
    },
    { shape: "band", band: 0, color: INDIGO.dye.new, label: "≤ 7 d" },
    { shape: "band", band: 2, color: INDIGO.dye.old, label: "> 90 d" },
    // 20 KB on the scale where the largest part, 56 KB, is 320 px long.
    {
      shape: "length",
      bytes: 20000,
      length: 114.3,
      thickness: 12,
      // A sample strip, dyed as the lightest strips are, so it reads as one of them and no louder.
      color: INDIGO.dye.new,
      label: "file size 20 KB",
    },
    // A count as the plate sets one: figures of the smallest type in the line colour.
    {
      shape: "count",
      count: 3,
      size: 14,
      color: INDIGO.palette.mid,
      label: "cited files",
    },
    // A line into the hub as the plate draws one: twice a line's weight, the oldest dye and the larger arrowhead.
    {
      shape: "hub",
      color: INDIGO.dye.old,
      weight: 3.2,
      arrow: 11.6,
      label: "to Supplies",
    },
    { shape: "boundary", label: "The print edition" },
    // Typst stands outside the boundary, on the ground of a part outside it.
    { shape: "outside", label: "outside" },
  ]);
});

test("a plate in Chinese sets its captions and key in Chinese", async () => {
  // One file of every band, so the key names all three.
  const parts = new Map(PARTS);
  parts.set("words", part([["src/locale.mjs", 6000, 1]]));
  const {
    plates: [plate],
  } = await platesIn(stripModel("zh-CN"), stripStyle(INDIGO, parts));
  const texts = plate.runs.map(({ text }) => text);
  for (const text of ["2 个文件，4 KB", "1 个文件，6 KB", "阶段", "外部工具"])
    assert.ok(texts.includes(text), text);
  // A part that owns no file has no count and no words in its place.
  assert.ok(!texts.includes("没有所属文件"));
  assert.deepEqual(
    plate.legend.slice(0, 7).map(({ label }) => label),
    [
      "改动距提交 @ 2026-11-10：",
      "≤ 7 天",
      "7–90 天",
      "> 90 天",
      "文件大小 20 KB",
      "个引用文件",
      "通向供给",
    ],
  );
  assert.equal(plate.legend[0].undated, "改动距提交：");
});

test("a band is named by its bounds in days after the entry that dates it, and the key shows only what the plate draws", async () => {
  const parts = new Map([["words", part([["src/locale.mjs", 400, 1]])]]);
  const measured = stripStyle(INDIGO, parts);
  const style = { ...measured, facts: { ...measured.facts, spans: [7 * 86400, 365 * 86400] } };
  const {
    plates: [plate],
  } = await platesIn(stripModel(), style);
  assert.deepEqual(plate.legend.slice(0, 2), [
    {
      shape: "reference",
      date: REFERENCE,
      label: "last changed before commit @ 2026-11-10:",
      undated: "last changed before commit:",
    },
    { shape: "band", band: 1, color: INDIGO.dye.mid, label: "7–365 d" },
  ]);
  // A sample under a kilobyte is given in bytes: 200 B where the largest part is 400 B.
  assert.deepEqual(
    plate.legend.slice(2, 3).map(({ shape, bytes, label }) => [shape, bytes ?? null, label]),
    [["length", 200, "file size 200 B"]],
  );
  // Without a reference date the bands are still named, undated.
  const undated = { ...style, facts: { ...style.facts, date: null } };
  const {
    plates: [plain],
  } = await platesIn(stripModel(), undated);
  assert.deepEqual(
    plain.legend.map(({ shape }) => shape),
    ["band", "length", "count", "hub", "boundary", "outside"],
  );
  // A plate whose parts own no files and whose relations cite none draws no strips or counts to key.
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
  } = await platesIn(bare, stripStyle(INDIGO, new Map()));
  // Its key holds nothing: its two parts name their one kind in their captions, and neither has a strip.
  assert.deepEqual(empty.legend, []);
  assert.equal(empty.runs.filter(({ text }) => text === "component").length, 2);
  assert.deepEqual(
    rectsOf(empty.svg).filter(({ fill, height }) => fill === "none" || height === 12),
    [],
  );
});

test("an overview's group is made of its members' files in path order", async () => {
  const model = stripModel("en", {
    groups: [{ id: "edition", label: "Edition", members: ["composer", "words", "record"] }],
  });
  // The words own no files here, so the group is made of the composer's and the record's.
  const parts = new Map(PARTS);
  parts.delete("words");
  const style = stripStyle(INDIGO, parts, model);
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

test("a group larger than every part sets the edition's scale, on its own plate and its members'", async () => {
  const model = stripModel("en", {
    groups: [{ id: "edition", label: "Edition", members: ["builder", "supplies"] }],
  });
  const style = stripStyle(INDIGO, PARTS, model);
  const views = await planViews(model, async (view) =>
    view.origin === "complete"
      ? { fits: false, width: 0, height: 0 }
      : admitsView(model, view, typefaces, icons, style),
  );
  const plates = composePlates(model, views, typefaces, icons, style);
  const at = (origin, id) =>
    plates[views.findIndex((view) => view.origin === origin && view.id === id)];
  // 77 KB of the builder and the supplies is the longest strip; the supplies' 56 KB is 56/77 of it.
  const overview = plates[views.findIndex(({ origin }) => origin === "overview")];
  assert.ok(Math.abs(lengthOf(stripOf(overview, "edition")) - 320) <= 0.15);
  const members = at("group", "edition");
  const expected = (320 * 56000) / 77000;
  assert.ok(Math.abs(lengthOf(stripOf(members, "supplies")) - expected) <= 0.15);
});

test("a plate in indigo draws every colour from its tokens", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
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
  // Every part keeps its icon and its box and names its kind in its caption, and the key lists no kind.
  assert.match(plate.svg, /filter="url\(#lift\)"/u);
  assert.ok(plate.runs.some(({ text }) => text === "vendored supply"));
  assert.ok(!plate.legend.some((entry) => "kind" in entry));
});

test("the house tokens draw the plates of no style given, pinned by their digest", async () => {
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
  // Captured from the engine when a gap in a line became a hole of the lines' clip path: each plate lost its ten
  // rounded rectangles of the paper's colour, under nine labels and the boundary's name, and gained the clip path
  // with a hole for each and the group it clips, and no other shape or run moved. A change that means to move no
  // plate drawn without measured facts leaves this digest as it is. Until then it was 1706e7dd…, the cards that
  // name their kind, with a patch of paper under every label.
  const drawn = "4d9add38ef8b5143e3683b040d90f136f7e8b732920ace608dcefd8d7832bc03";
  const unnamed = await platesIn(model);
  assert.equal(digest(unnamed.plates), drawn);
  const named = await platesIn(model, { tokens: HOUSE_TOKENS });
  assert.equal(digest(named.plates), drawn);
  assert.deepEqual(named.plates, unnamed.plates);
});

test("a caption counts one file in the singular in every language that has one", () => {
  assert.equal(wordsOf("en").files(1, "2 KB"), "1 file, 2 KB");
  assert.equal(wordsOf("es").files(1, "2 KB"), "1 archivo, 2 KB");
  assert.equal(wordsOf("es").files(3, "2 KB"), "3 archivos, 2 KB");
  // A band is a bound and a unit, and the unit's sign has no plural: one day reads as two do.
  const bands = (locale) => measureWordsOf(locale)["file-age-band"];
  for (const locale of ["en", "es"]) {
    assert.equal(bands(locale).newest(1), "≤ 1 d");
    assert.equal(bands(locale).middle(1, 2), "1–2 d");
    assert.equal(bands(locale).oldest(2), "> 2 d");
  }
});
