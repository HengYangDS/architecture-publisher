/** Shared models, styles and SVG readers for the tests of plates whose parts carry strips. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { editionFacts } from "../../src/facts/edition.mjs";
import { viewFacts } from "../../src/facts/view.mjs";
import { loadIcons } from "../../src/icons.mjs";
import { validateModel } from "../../src/model/load.mjs";
import { planViews } from "../../src/plan/views.mjs";
import { admitsView, composePlates } from "../../src/poster/compose/plates.mjs";
import { loadTypefaces } from "../../src/poster/text.mjs";
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

/** The day of the pin's commit, which the key dates the ages from. */
export const REFERENCE = "2026-11-10";

/** A part's files, as the edition binds them: path, bytes and age band, in path order. */
export const part = (files) => ({
  bytes: files.reduce((sum, [, bytes]) => sum + bytes, 0),
  files: files.map(([path, bytes, band]) => ({ path, bytes, band })),
});

/**
 * The parts of the strip work: the composer owns 3 KB and 1 KB, the record a file and a
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

/** The pin's commit time, and how long before it a file of each band last changed, in seconds. */
const PINNED = 1_794_000_000;
const AGES = Object.freeze([0, 30 * 86400, 400 * 86400]);

/** A model of parts alone: one that draws an overview gives its own, for its groups and the relations they stand for. */
const PARTS_ALONE = Object.freeze({
  groups: [],
  get relations() {
    throw new Error("An overview's facts need the model: give it to stripStyle.");
  },
});

/**
 * The edition's facts over the given parts, measured by the layer from a binding made by hand: each part owns its
 * files, read at a pin with the bytes and the age band the part names for them. `model` gives the layer the groups
 * and relations of a work whose overview is drawn.
 */
function stripFacts(parts = PARTS, model = PARTS_ALONE) {
  const read = [...parts.values()].flatMap(({ files: owned }) => owned);
  return editionFacts(
    model,
    {
      state: "verified",
      records: read.map(({ path, bytes }) => ({ path, bytes })),
      times: new Map(read.map(({ path, band }) => [path, PINNED - AGES[band]])),
      owned: new Map(
        [...parts].map(([id, { files: owned }]) => [id, owned.map(({ path }) => path)]),
      ),
    },
    { date: REFERENCE, time: PINNED, release: null },
  );
}

/**
 * The edition's style over the given tokens and parts measured at a pin, so every part that owns files has its
 * strip, and the model of a work whose overview is drawn.
 */
export const stripStyle = (tokens = INDIGO, parts = PARTS, model = PARTS_ALONE) => ({
  tokens,
  facts: stripFacts(parts, model),
});

/** The facts of the views of a model given by its relations alone, as a plate's lines read them. */
export const lineFacts = (model) => ({ view: (view) => viewFacts(model, view, null) });

export const files = (count) => Array.from({ length: count }, (_, index) => `src/f${index}.mjs`);

/**
 * A small work: a builder that composes plates, runs Typst and loads fonts; four parts draw
 * on the supplies, each of those relations citing three files or more. `statuses` gives a part
 * or one of the four relations into the supplies a status, by id.
 */
export function stripModel(locale = "en", extra = {}, statuses = {}) {
  const zh = locale === "zh-CN";
  const status = (id) => (statuses[id] ? { status: statuses[id] } : {});
  return validateModel(
    minimalModel({
      id: "strips",
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
        {
          id: "fonts",
          from: "builder",
          to: "supplies",
          label: "loads fonts",
          files: files(3),
          ...status("fonts"),
        },
        {
          id: "icons",
          from: "composer",
          to: "supplies",
          label: "loads icons",
          files: files(3),
          ...status("icons"),
        },
        {
          id: "faces",
          from: "words",
          to: "supplies",
          label: "reads faces",
          files: files(4),
          ...status("faces"),
        },
        {
          id: "stages",
          from: "record",
          to: "supplies",
          label: "stages",
          files: files(3),
          ...status("stages"),
        },
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

/** The wires a plate draws: their colour, width and dashes, and the points their path names. */
export const wiresOf = (svg) =>
  [
    ...svg.matchAll(
      /<path d="([^"]+)" fill="none" stroke="([^"]+)" stroke-width="([\d.]+)"[^>]*?(?: stroke-dasharray="([^"]+)")?\/>/gu,
    ),
  ].map(([, d, stroke, width, dash]) => ({
    stroke,
    width: number(width),
    dash: dash ?? null,
    points: [...d.matchAll(/([\d.-]+),([\d.-]+)/gu)].map(([, x, y]) => [number(x), number(y)]),
  }));

/** The arrowheads a plate draws: the tip, the fill and the size, the length of the side opposite the tip. */
export const arrowsOf = (svg) =>
  [
    ...svg.matchAll(
      /<path d="M([\d.-]+),([\d.-]+) L([\d.-]+),([\d.-]+) L([\d.-]+),([\d.-]+) Z" fill="([^"]+)"\/>/gu,
    ),
  ].map(([, x, y, qx, qy, rx, ry, fill]) => ({
    x: number(x),
    y: number(y),
    fill,
    size: Math.round(Math.hypot(number(rx) - number(qx), number(ry) - number(qy)) * 10) / 10,
  }));

/** The counts of cited files a plate sets by its lines: runs of figures in the regular weight. */
export const countsOf = (plate) =>
  plate.runs.filter(({ text, weight }) => /^\d+$/u.test(text) && weight === 400);

/** The kinds' icons a plate draws: where each stands, how large it is drawn and in which colour. */
export const iconsOf = (svg) =>
  [
    ...svg.matchAll(
      /<g transform="translate\(([\d.-]+),([\d.-]+)\) scale\(([\d.]+)\)" fill="none" stroke="([^"]+)"/gu,
    ),
  ].map(([, x, y, scale, stroke]) => ({
    x: number(x),
    y: number(y),
    size: number(scale) * 24,
    stroke,
  }));

/** The label run of a part: its last line, under which its strip is drawn. */
export const labelOf = (plate, id) => plate.runs.filter(({ component }) => component === id).at(-1);

/** Whether a rectangle or a run stands within a box. */
export const within = (box, { x, y, baseline, width = 0, height = 0 }) =>
  x > box.x &&
  x + width < box.x + box.width + 0.11 &&
  (baseline ?? y) > box.y &&
  (baseline ?? y + height) < box.y + box.height + 0.11;

/** The outline of a part: the card its label stands in, on the ground of a part inside or outside the repository. */
export function outlineOf(plate, id, tokens = INDIGO) {
  const label = labelOf(plate, id);
  return rectsOf(plate.svg).find(
    (rect) =>
      [tokens.figure.card, tokens.figure.outside].includes(rect.fill) && within(rect, label),
  );
}

/** The segments of a part's strip: contiguous rectangles under its label, within its outline. */
export function stripOf(plate, id) {
  const label = labelOf(plate, id);
  const box = outlineOf(plate, id);
  assert.ok(box, `no outline around ${id}`);
  const under = rectsOf(plate.svg)
    .filter((rect) => within(box, rect) && rect.y > label.baseline && rect.y < label.baseline + 40)
    .sort((a, b) => a.x - b.x);
  const [first] = under;
  assert.ok(first, `no strip under ${id}`);
  const strip = [first];
  for (const rect of under.filter(({ y }) => y === first.y))
    if (rect.x > strip.at(-1).x && rect.x - (strip.at(-1).x + strip.at(-1).width) < 1.25)
      strip.push(rect);
  return strip;
}

/** How long a part's strip is: from its first segment's left edge to its last one's right edge. */
export const lengthOf = (strip) => strip.at(-1).x + strip.at(-1).width - strip[0].x;
