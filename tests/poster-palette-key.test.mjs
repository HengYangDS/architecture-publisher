import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView, composePlates } from "../src/poster/compose/plates.mjs";
import { wordsOf } from "../src/locale.mjs";
import { BIG_BANK_MODEL, minimalModel } from "./fixtures/models.mjs";
import {
  typefaces,
  icons,
  HOUSE_TOKENS,
  INDIGO,
  DYES,
  part,
  PARTS,
  boltsStyle,
  boltModel,
  platesIn,
  rectsOf,
  wiresOf,
  stripOf,
} from "./fixtures/bolts.mjs";

// The woven plate's key and words, and the colours a palette gives either style.

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

test("a caption counts one file in the singular in every language that has one", () => {
  assert.equal(wordsOf("en").files(1, "2 KB"), "1 file, 2 KB");
  assert.equal(wordsOf("es").files(1, "2 KB"), "1 archivo, 2 KB");
  assert.equal(wordsOf("es").files(3, "2 KB"), "3 archivos, 2 KB");
});
