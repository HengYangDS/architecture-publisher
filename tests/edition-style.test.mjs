import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { PALETTES, STYLES, resolvePalette } from "../src/model/edition.mjs";
import { validateModel } from "../src/model/load.mjs";
import { minimalModel } from "./fixtures/models.mjs";

const readJson = async (url) => JSON.parse(await fs.readFile(url, "utf8"));
const HOUSE = await readJson(new URL("../src/house.json", import.meta.url));

/** A printable custom palette of greys on white, which each refusal below changes in one role. */
const GREYS = Object.freeze({
  ground: "#ffffff",
  ink: "#000000",
  dye: Object.freeze(["#d0d0d0", "#a0a0a0", "#606060"]),
});

const editionOf = (edition) => validateModel(minimalModel({ edition })).edition;

/** The refusal of a model with this edition, as `code path: message` lines. */
function refusalOf(edition) {
  try {
    validateModel(minimalModel({ edition }));
  } catch (error) {
    assert.equal(error.code, "model_invalid");
    return error.problems.map(({ code, path, message }) => `${code} ${path}: ${message}`);
  }
  assert.fail("the model was accepted");
}

test("an edition chooses from two styles and the house's palettes, in its order", () => {
  assert.deepEqual(STYLES, ["bolts", "cards"]);
  assert.deepEqual(PALETTES, ["indigo", "persimmon", "ink", "forest"]);
  assert.deepEqual(PALETTES, Object.keys(HOUSE.palettes));
  assert.ok(Object.isFrozen(STYLES) && Object.isFrozen(PALETTES));
});

test("the published schema lists the same styles and palettes", async () => {
  const schema = await readJson(new URL("../src/model/schema.json", import.meta.url));
  const { edition } = schema.properties;
  assert.equal(edition.additionalProperties, false);
  assert.deepEqual(edition.properties.style.enum, STYLES);
  const [named, custom] = edition.properties.palette.oneOf;
  assert.deepEqual(named.enum, PALETTES);
  assert.deepEqual(custom.required, ["ground", "ink", "dye"]);
  assert.deepEqual(Object.keys(custom.properties), ["ground", "ink", "dye", "accent"]);
  assert.equal(custom.additionalProperties, false);
});

test("a model names its style and palette, and an edition it leaves out is null", () => {
  assert.deepEqual(editionOf({ style: "cards", palette: "persimmon" }), {
    style: "cards",
    palette: "persimmon",
  });
  assert.deepEqual(editionOf({ style: "bolts" }), { style: "bolts", palette: null });
  assert.deepEqual(editionOf({}), { style: null, palette: null });
  const model = validateModel(minimalModel());
  assert.deepEqual(model.edition, { style: null, palette: null });
  assert.ok(Object.isFrozen(model) && Object.isFrozen(model.edition));
});

test("a custom palette is kept as given, in lower case", () => {
  const palette = editionOf({
    palette: { ground: "#FFFFFF", ink: "#000000", dye: ["#D0D0D0", "#a0a0a0", "#606060"] },
  }).palette;
  assert.deepEqual(palette, GREYS);
  assert.equal("accent" in palette, false);
  assert.ok(Object.isFrozen(palette) && Object.isFrozen(palette.dye));
  assert.deepEqual(editionOf({ palette: { ...GREYS, accent: "#3E5873" } }).palette, {
    ...GREYS,
    accent: "#3e5873",
  });
});

test("every built-in palette passes the rules a custom palette must meet", () => {
  for (const name of PALETTES)
    assert.deepEqual(editionOf({ palette: HOUSE.palettes[name] }).palette, HOUSE.palettes[name]);
});

test("the house palette resolves to the 0.12 house tokens exactly", () => {
  const forest = resolvePalette(HOUSE.housePalette);
  assert.equal(forest.name, "forest");
  assert.deepEqual(forest.roles, HOUSE.palettes.forest);
  // Key order too: the class reads these tokens from a staged file that keeps 0.12's bytes.
  assert.equal(
    JSON.stringify(forest.tokens),
    JSON.stringify({ palette: HOUSE.palette, figure: HOUSE.figure, dye: HOUSE.dye }),
  );
  assert.ok(Object.isFrozen(forest.tokens.figure));
});

test("no palette resolves to indigo, whose other tokens mix its ink into its ground", () => {
  const indigo = resolvePalette(null);
  assert.deepEqual(indigo, resolvePalette("indigo"));
  assert.equal(indigo.name, "indigo");
  const roles = HOUSE.palettes.indigo;
  assert.deepEqual(indigo.roles, roles);
  assert.deepEqual(indigo.tokens.palette, {
    paper: roles.ground,
    ink: roles.ink,
    green: roles.dye[2],
    mid: "#656769",
    soft: "#4f5154",
    rule: "#c5c5c3",
    ochre: roles.accent,
  });
  assert.deepEqual(indigo.tokens.figure, {
    card: "#fbfbf9",
    cardStroke: "#d1d1ce",
    outside: "#eae9e6",
    outsideStroke: "#bbbbba",
    outsideMark: "#797b7c",
    boundary: "#7f8182",
    retired: "#8c8d8e",
    shadow: roles.ink,
  });
  assert.deepEqual(indigo.tokens.dye, { new: roles.dye[0], mid: roles.dye[1], old: roles.dye[2] });
  for (const group of ["palette", "figure", "dye"])
    assert.deepEqual(Object.keys(indigo.tokens[group]), Object.keys(HOUSE[group]), group);
});

test("a custom palette resolves its roles, its accent defaulting to its oldest dye", () => {
  const custom = resolvePalette({ ...GREYS, ground: "#FFFFFF" });
  assert.equal(custom.name, "custom");
  assert.deepEqual(custom.roles, { ...GREYS, accent: "#606060" });
  assert.equal(custom.tokens.palette.ochre, "#606060");
  assert.equal(custom.tokens.palette.paper, "#ffffff");
  // A grey's OKLab lightness is the cube root of its linear light: 0.34 is 0.0393, sRGB 56.
  assert.equal(custom.tokens.palette.mid, "#383838");
  assert.equal(custom.tokens.figure.card, "#ffffff");
  assert.equal(custom.tokens.figure.shadow, "#000000");
  assert.equal(resolvePalette({ ...GREYS, accent: "#3E5873" }).tokens.palette.ochre, "#3e5873");
});

test("a custom palette is refused at the role that breaks a rule, with its measure and bound", () => {
  const refused = (change) => refusalOf({ palette: { ...GREYS, ...change } });
  const at = (role, message) => `model_palette_rejected /edition/palette/${role}: ${message}`;
  assert.deepEqual(refused({ ink: "#8a8a8a" }), [
    at("ink", "has contrast 3.45 against the ground; the bound is 7"),
  ]);
  assert.deepEqual(refused({ ink: "#1a2a5a" }), [at("ink", "has chroma 0.089; the bound is 0.05")]);
  assert.deepEqual(refused({ ground: "#e0e0e0" }), [
    at("ground", "has lightness 0.907; the bound is 0.92"),
    at("dye/0", "has lightness 0.049 below the ground; the bound is 0.07"),
  ]);
  assert.deepEqual(refused({ ground: "#fdf2e4" }), [
    at("ground", "has chroma 0.022; the bound is 0.02"),
  ]);
  assert.deepEqual(refused({ dye: ["#d0d0d0", "#a0a0a0", "#c00000"] }), [
    at("dye/2", "has chroma 0.208; the bound is 0.08"),
  ]);
  assert.deepEqual(refused({ dye: ["#d0d0d0", "#c0c0c0", "#606060"] }), [
    at("dye/1", "has lightness 0.050 below dye 0; the bound is 0.12"),
  ]);
  assert.deepEqual(refused({ dye: ["#e0e0e0", "#b8b8b8", "#909090"] }), [
    at("dye/2", "has contrast 3.19 against the ground; the bound is 4.5"),
  ]);
  assert.deepEqual(refused({ accent: "#a0a0a0" }), [
    at("accent", "has contrast 2.61 against the ground; the bound is 4.5"),
  ]);
  assert.deepEqual(refused({ accent: "#0050c0" }), [
    at("accent", "has chroma 0.188; the bound is 0.12"),
  ]);
  assert.deepEqual(refused({ accent: "#9d493d" }), [
    at("accent", "has OKLab distance 0.030 from the seal's cinnabar #a93d31; the bound is 0.06"),
  ]);
});

test("a measure that rounds onto its bound is shown one step past it", () => {
  const refused = (change) => refusalOf({ palette: { ...GREYS, ...change } });
  // Contrast 6.9987 rounds to 7.00, and chroma 0.12008 to 0.120: neither shows as passing.
  assert.deepEqual(refused({ ink: "#3d5f5f" }), [
    "model_palette_rejected /edition/palette/ink: has contrast 6.99 against the ground; the bound is 7",
  ]);
  assert.deepEqual(refused({ accent: "#003675" }), [
    "model_palette_rejected /edition/palette/accent: has chroma 0.121; the bound is 0.12",
  ]);
});

test("an edition's shape, style, palette name and colours are checked before its rules", () => {
  assert.deepEqual(refusalOf({ style: "loom", pallete: "indigo" }), [
    "model_field_unknown /edition/pallete: is not a model field; did you mean palette?",
    "model_style_unknown /edition/style: must be one of bolts, cards",
  ]);
  const unknown =
    "model_palette_unknown /edition/palette: must be one of indigo, persimmon, ink, forest, or an object of ground, ink, dye and accent";
  assert.deepEqual(refusalOf({ palette: "sakura" }), [unknown]);
  assert.deepEqual(refusalOf({ palette: null }), [unknown]);
  assert.deepEqual(refusalOf("cards"), ["model_object_required /edition: must be an object"]);
  assert.deepEqual(
    refusalOf({ palette: { ink: "black", dye: ["#ffffff", "#000000"], accent: "#12345" } }),
    [
      "model_field_required /edition/palette/ground: is required",
      "model_palette_rejected /edition/palette/dye: must list three colours, from new to old",
      "model_color_invalid /edition/palette/ink: must be a #rrggbb colour",
      "model_color_invalid /edition/palette/accent: must be a #rrggbb colour",
    ],
  );
  assert.deepEqual(refusalOf({ palette: { ground: "#ffffff", ink: "#000000" } }), [
    "model_field_required /edition/palette/dye: is required",
  ]);
  assert.deepEqual(
    refusalOf({ palette: { ...GREYS, dye: ["#d0d0d0", ["#a0a0a0"], "#606060"], tone: 1 } }),
    [
      "model_field_unknown /edition/palette/tone: is not a model field",
      "model_color_invalid /edition/palette/dye/1: must be a #rrggbb colour",
    ],
  );
});
