/** Shared models, styles and SVG readers for the woven-plate tests. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { loadIcons } from "../../src/icons.mjs";
import { validateModel } from "../../src/model/load.mjs";
import { planViews } from "../../src/plan/views.mjs";
import { admitsView, composePlates } from "../../src/poster/compose/plates.mjs";
import { loadTypefaces } from "../../src/poster/text.mjs";
import { POSTER } from "../../src/poster/tokens.mjs";
import { minimalModel } from "./models.mjs";
export const [typefaces, icons] = await Promise.all([loadTypefaces(), loadIcons()]);
const house = JSON.parse(
  await fs.readFile(new URL("../../src/house.json", import.meta.url), "utf8"),
);

/** The house tokens: the 0.12 colours every plate is drawn in when the edition names no style. */
export const HOUSE_TOKENS = Object.freeze({
  palette: house.palette,
  figure: house.figure,
  dye: house.dye,
});

/** Indigo as a resolved palette gives it: its ground, ink, dyes and accent, and the tokens between. */
export const INDIGO = Object.freeze({
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
export const DYES = [INDIGO.dye.new, INDIGO.dye.mid, INDIGO.dye.old];

/** Three days and a month, in seconds: the edition's two band boundaries. */
const SPANS = Object.freeze([3 * 86400, 30 * 86400]);

/** A part's files, as the edition binds them: path, bytes and age band, in path order. */
export const part = (files) => ({
  bytes: files.reduce((sum, [, bytes]) => sum + bytes, 0),
  files: files.map(([path, bytes, band]) => ({ path, bytes, band })),
});

/**
 * The parts of the bolts work: the composer owns 3 KB and 1 KB, the record a file and a
 * sliver of the same band, the supplies are the largest part, and Typst owns no files.
 */
export const PARTS = new Map([
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
export const boltsStyle = (tokens = INDIGO, parts = PARTS) => ({
  name: "bolts",
  tokens,
  parts,
  most: Math.max(...[...parts.values()].map(({ bytes }) => bytes)),
  bands: { spans: SPANS },
});

export const files = (count) => Array.from({ length: count }, (_, index) => `src/f${index}.mjs`);

/**
 * A small work: a builder that composes plates, runs Typst and loads fonts; four parts draw
 * on the supplies, each relation evidenced by three files or more.
 */
export function boltModel(locale = "en", extra = {}, statuses = {}) {
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
export async function platesIn(model, style) {
  const views = await planViews(model, async (view) =>
    admitsView(model, view, typefaces, icons, style),
  );
  return { views, plates: composePlates(model, views, typefaces, icons, style) };
}

const number = (text) => Number(text);

/** The rectangles a plate draws, with their fill and dash. */
export const rectsOf = (svg) =>
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
export const wiresOf = (svg) =>
  [...svg.matchAll(/<path d="[^"]+" fill="none" stroke="([^"]+)" stroke-width="([\d.]+)"/gu)].map(
    ([, stroke, width]) => ({ stroke, width: number(width) }),
  );

/** The arrowheads a plate draws: the tip and the fill. */
export const arrowsOf = (svg) =>
  [...svg.matchAll(/<path d="M([\d.]+),([\d.]+) L[^"]+Z" fill="([^"]+)"\/>/gu)].map(
    ([, x, y, fill]) => ({ x: number(x), y: number(y), fill }),
  );

/** The label run of a part: its last line, under which its strip is woven. */
export const labelOf = (plate, id) => plate.runs.filter(({ component }) => component === id).at(-1);

/** The segments of a part's strip: contiguous rectangles from the label's left edge, under it. */
export function stripOf(plate, id) {
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
export const unitOf = (plate) => POSTER.steps[plate.step].name / 24;
