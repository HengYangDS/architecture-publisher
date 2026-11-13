import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { loadIcons } from "../src/icons.mjs";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView } from "../src/poster/compose/plates.mjs";
import * as edition from "../src/poster/compose/plates.mjs";
import { loadTypefaces, requireGlyphs } from "../src/poster/text.mjs";
import { POSTER, figureStyles } from "../src/poster/tokens.mjs";
import { verifySupply } from "../src/supply.mjs";
import { minimalModel } from "./fixtures/models.mjs";

const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);

/** One face of a bundled supply, parsed by the same OpenType reader the engine uses. */
async function faceOf(supplyName, file) {
  const reader = await verifySupply("opentype");
  const opentype = await import(pathToFileURL(path.join(reader.root, "opentype.mjs")).href);
  const supply = await verifySupply(supplyName);
  const bytes = await fs.readFile(path.join(supply.root, file));
  return opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

const width = (face, text, size) => face.getAdvanceWidth(text, size, { kerning: true });

// The house palette: the overview's paper, ink, green, greys and ochre, and the
// tints the posters draw cards, outside systems and rules in.
const HOUSE_PALETTE = new Set([
  "#F5F3ED",
  "#FBFAF6",
  "#29372F",
  "#2B2A24",
  "#324F3E",
  "#617465",
  "#4F5F52",
  "#7B857C",
  "#8C877A",
  "#8C968D",
  "#845922",
  "#CBC6B8",
  "#C4BDAE",
  "#D6D1C4",
  "#ECE8DF",
]);

test("figure text is measured in Source Sans 3, its semibold for heavy text, and Han in Noto Sans CJK SC", async () => {
  const [regular, semibold, han] = await Promise.all([
    faceOf("house", "source-sans-3/SourceSans3-Regular.otf"),
    faceOf("house", "source-sans-3/SourceSans3-Semibold.otf"),
    faceOf("fonts", "noto-sans-cjk-sc/NotoSansCJKsc-Regular.otf"),
  ]);
  const text = "Architecture Publisher";
  const { detail, name } = figureStyles(POSTER.steps[0]);
  // Typst 0.15.1 sets the text in 9278 and 9597 units of a thousand to the em: the faces' advances less their kerning.
  const kerned = (units, size) => (units * size) / 1000;
  assert.ok(Math.abs(typefaces.measure(text, detail) - kerned(9278, detail.size)) < 0.02);
  assert.ok(Math.abs(typefaces.measure(text, name) - kerned(9597, name.size)) < 0.02);
  assert.ok(typefaces.measure(text, detail) < width(regular, text, detail.size));
  assert.ok(typefaces.measure(text, name) < width(semibold, text, name.size));
  assert.equal(typefaces.measure("数据", detail), width(han, "数据", detail.size));
});

test("letters the CJK face lacks are measured in Source Sans 3 and not refused", async () => {
  const regular = await faceOf("house", "source-sans-3/SourceSans3-Regular.otf");
  const { detail } = figureStyles(POSTER.steps[0]);
  requireGlyphs(typefaces, [{ path: "/components/0/label", text: "Łódź" }]);
  const [measured, advances] = [
    typefaces.measure("Łódź", detail),
    width(regular, "Łódź", detail.size),
  ];
  assert.ok(
    Math.abs(measured - advances) < 0.1 * detail.size,
    `measured ${measured} of ${advances}`,
  );
});

test("a line's typeset width is within a twentieth of an em of the width Typst sets it in, where its measure in one face is wider", () => {
  // Typst 0.15.1 measured each line in the house faces, flush left: a letter in Source Sans 3 and Han in Noto Sans
  // CJK SC within one line, a quarter em where Han meets a letter or digit, a mark that ends a line or stands beside
  // another in half its width.
  const set = [
    ["存放：Archify、LikeC4 解析器、", 24, 400, 320.616],
    ["第1版模型转成第3版", 24, 400, 239.856],
    ["（可选）上游：「默认」，其余略。", 24, 400, 336],
    ["校验：第 3 版模型，每个问题都给", 24, 400, 357.528],
    ["命令：check、build、import", 18, 400, 224.226],
    ["check, build and import", 18, 400, 178.65],
    ["编排：每个视图排成图册正文区的一幅图版", 14, 400, 266],
    ["LikeC4 导入器", 24, 600, 145.416],
  ];
  for (const [text, size, weight, typst] of set) {
    const width = typefaces.typesetWidth(text, { size, weight, line: size * 1.4 });
    // Typst kerns some pairs of letters closer than the engine reads from the face, by hundredths of an em a line.
    assert.ok(
      Math.abs(width - typst) <= 0.05 * size,
      `${text} is set in ${typst}, measured ${width}`,
    );
  }
  const mixed = { size: 24, weight: 400, line: 34 };
  assert.ok(
    typefaces.measure("存放：Archify、LikeC4 解析器、", mixed) > 320.616 + 24,
    "a mixed line measured in the CJK face alone is more than a character wider than it is set",
  );
});

test("plates are drawn in the house palette", async () => {
  assert.equal(typeof edition.composePlates, "function", "composePlates is not exported");
  const model = validateModel(minimalModel());
  const views = await planViews(model, async (view) => admitsView(model, view, typefaces, icons));
  const [plate] = edition.composePlates(model, views, typefaces, icons);
  const colours = new Set(plate.svg.match(/#[0-9A-Fa-f]{6}\b/gu)?.map((c) => c.toUpperCase()));
  assert.deepEqual(
    [...colours].filter((colour) => !HOUSE_PALETTE.has(colour)),
    [],
  );
});
