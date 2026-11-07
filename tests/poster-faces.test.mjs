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
  assert.equal(typefaces.measure(text, detail), width(regular, text, detail.size));
  assert.equal(typefaces.measure(text, name), width(semibold, text, name.size));
  assert.equal(typefaces.measure("数据", detail), width(han, "数据", detail.size));
});

test("letters the CJK face lacks are measured in Source Sans 3 and not refused", async () => {
  const regular = await faceOf("house", "source-sans-3/SourceSans3-Regular.otf");
  const { detail } = figureStyles(POSTER.steps[0]);
  requireGlyphs(typefaces, [{ path: "/components/0/label", text: "Łódź" }]);
  assert.equal(typefaces.measure("Łódź", detail), width(regular, "Łódź", detail.size));
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
