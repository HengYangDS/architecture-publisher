import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { editionFacts } from "../src/facts/edition.mjs";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { admitsView, composePlates } from "../src/poster/compose/plates.mjs";
import { drawPart, partBoxes } from "../src/poster/part.mjs";
import { POSTER, colorsOf, figureMetrics, figureStyles, linesOf } from "../src/poster/tokens.mjs";
import { editionStyle } from "../src/style.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import {
  INDIGO,
  PARTS,
  countsOf,
  icons,
  iconsOf,
  labelOf,
  lengthOf,
  outlineOf,
  platesIn,
  rectsOf,
  stripModel,
  stripOf,
  stripStyle,
  typefaces,
  within,
} from "./fixtures/strips.mjs";

// One part: a card whose regions compose. Its outline and ground, its name, the strip of the files it owns, its
// caption, which is its kind's icon before the kind's label, and its details, each drawn where the part has the
// fact. A kind is named where its icon stands, so the key lists no kind and holds what a card cannot say there.

/** Every part of the strip work, and those that own files at the pin. */
const EVERY = Object.freeze(["builder", "composer", "words", "record", "supplies", "typst"]);
const OWNING = Object.freeze([...PARTS.keys()]);

/** The rectangles as thick as a strip, 12 px, that a plate draws. */
const stripsOf = (plate) => rectsOf(plate.svg).filter(({ height }) => height === 12);

/** The one icon a plate draws within a part's outline. */
function iconIn(plate, box, id) {
  const inside = iconsOf(plate.svg).filter(
    ({ x, y }) => x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height,
  );
  assert.equal(inside.length, 1, `${id}: ${inside.length} icons in its card`);
  return inside[0];
}

/**
 * A part's caption opens with its kind's icon: at the card's left padding, as large as the name's type, in the
 * colour of the part's bar, its centre on the middle of the label beside it, 0.36 em above the label's baseline as
 * the key centres a mark, and the label 5 points on, the gap an icon and its text have in the key: 7.5 px of a
 * plate. Nothing stands before the name, which starts at the card's left padding.
 */
function assertNamedWhereItStands(plate, id, { label, color, pad }) {
  const box = outlineOf(plate, id);
  assert.ok(box, `no outline around ${id}`);
  const icon = iconIn(plate, box, id);
  const name = labelOf(plate, id);
  const kind = plate.runs.find((run) => run.text === label && within(box, run));
  assert.ok(kind, `${id}: no kind's label in its caption`);
  const left = box.x + pad;
  assert.ok(Math.abs(name.x - left) < 0.11, `${id}: its name starts at ${name.x} of ${left}`);
  assert.ok(icon.y > name.baseline, `${id}: its icon stands on its name's line`);
  assert.ok(Math.abs(icon.x - left) < 0.11, `${id}: its icon starts at ${icon.x} of ${left}`);
  assert.ok(Math.abs(icon.size - name.size) < 0.01, `${id}: its icon is ${icon.size} px`);
  assert.equal(icon.stroke, color);
  const middle = kind.baseline - 0.36 * kind.size;
  assert.ok(
    Math.abs(icon.y + icon.size / 2 - middle) < 0.11,
    `${id}: its icon is centred on ${icon.y + icon.size / 2}, its label on ${middle}`,
  );
  const gap = kind.x - (icon.x + icon.size);
  assert.ok(Math.abs(gap - 7.5) < 0.11, `${id}: its label stands ${gap} px after its icon`);
}

test("a part that owns files has its kind's icon in its caption, before the kind's label, and none beside its name", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const pad = stripOf(plate, "builder")[0].x - outlineOf(plate, "builder").x;
  assertNamedWhereItStands(plate, "builder", { label: "stage", color: INDIGO.palette.green, pad });
  // The supplies are of another kind and the largest part: the same caption, with their own icon's artwork.
  assertNamedWhereItStands(plate, "supplies", {
    label: "vendored supply",
    color: INDIGO.palette.green,
    pad,
  });
});

test("a part that owns no file has its kind's icon in its caption likewise, and none beside its name", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const pad = stripOf(plate, "builder")[0].x - outlineOf(plate, "builder").x;
  // Typst stands outside the repository: its icon keeps the grey of a part outside.
  assertNamedWhereItStands(plate, "typst", {
    label: "external tool",
    color: INDIGO.figure.outsideMark,
    pad,
  });
});

test("a part that owns files is one card: its outline, its name, its strip, its caption and its details", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  const box = outlineOf(plate, "builder");
  assert.ok(box, "no outline around the builder");
  assert.equal(box.fill, INDIGO.figure.card);
  // Its strip lies within the outline, on the edition's one scale: 21 KB where the largest part's 56 KB is 320 px.
  const strip = stripOf(plate, "builder");
  assert.ok(Math.abs(lengthOf(strip) - (320 * 21000) / 56000) <= 0.15, String(lengthOf(strip)));
  assert.equal(strip[0].fill, INDIGO.dye.new);
  const pad = strip[0].x - box.x;
  assert.ok(pad >= 8, String(pad));
  // The caption stands under the strip: the kind's icon from the strip's left and the kind's label after it, the
  // count and size ending one padding short of the outline's right edge.
  const kind = plate.runs.find((run) => run.text === "stage" && within(box, run));
  const count = plate.runs.find(({ text }) => text === "1 file, 21 KB");
  assert.ok(kind && count && within(box, count));
  assert.ok(Math.abs(iconIn(plate, box, "builder").x - strip[0].x) < 0.11);
  assert.ok(kind.x > strip[0].x && kind.x + kind.width < count.x);
  assert.ok(Math.abs(box.x + box.width - pad - (count.x + count.width)) < 0.2);
  assert.ok(kind.baseline > strip[0].y + strip[0].height);
  // Its details follow the caption, within the outline.
  const detail = plate.runs.find(({ text }) => text === "builds: the edition");
  assert.ok(detail && within(box, detail) && detail.baseline > kind.baseline);
  // Every part has an outline and its kind's icon, and every part that owns files a strip within it.
  for (const id of EVERY) assert.ok(outlineOf(plate, id), `no outline around ${id}`);
  assert.equal([...plate.svg.matchAll(/<g transform=/gu)].length, EVERY.length);
  for (const id of OWNING) {
    const [first] = stripOf(plate, id);
    assert.ok(within(outlineOf(plate, id), first), id);
  }
});

test("a part that owns no file has an outline and no strip, and its caption names its kind alone", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  // Typst is a tool outside the repository: its card stands on the ground of a part outside it.
  const box = outlineOf(plate, "typst");
  assert.ok(box, "no outline around Typst");
  assert.equal(box.fill, INDIGO.figure.outside);
  // Nothing as thick as a strip lies within it, filled or outlined, and no words say that it owns nothing.
  assert.deepEqual(
    stripsOf(plate).filter((rect) => within(box, rect)),
    [],
  );
  assert.deepEqual(
    stripsOf(plate).filter(({ fill }) => fill === "none"),
    [],
  );
  assert.ok(!plate.runs.some(({ text }) => text === "owns no files"));
  const caption = plate.runs.filter((run) => within(box, run) && !run.component);
  assert.deepEqual(
    caption.map(({ text }) => text),
    ["external tool"],
  );
  // A count of files stands in the caption of each part that owns some, and of no other.
  assert.equal(plate.runs.filter(({ text }) => /^\d+ files?, /u.test(text)).length, OWNING.length);
});

test("a build without a checkout draws every part's outline and no strip, and warns of no fallback", async () => {
  const model = stripModel();
  const unbound = {
    state: "none",
    records: [],
    owned: new Map(model.components.map(({ id }) => [id, []])),
  };
  // The style is the palette's tokens and the facts, with nothing chosen between two ways and no warning to give.
  const styled = editionStyle(model, editionFacts(model, unbound, null));
  assert.deepEqual(Object.keys(styled), ["style", "record"]);
  const { style, record } = styled;
  assert.deepEqual(Object.keys(style), ["tokens", "facts"]);
  assert.deepEqual(Object.keys(record), ["palette", "names", "roles", "bands"]);
  assert.equal(record.bands, null);
  const {
    plates: [plate],
  } = await platesIn(model, style);
  // The outlines stand on the grounds of the palette the build resolved.
  for (const id of EVERY) assert.ok(outlineOf(plate, id, style.tokens), `no outline around ${id}`);
  assert.deepEqual(stripsOf(plate), []);
  // Each caption names its part's kind, and none counts files.
  assert.ok(plate.runs.some(({ text }) => text === "vendored supply"));
  assert.ok(!plate.runs.some(({ text }) => /\bfiles?, /u.test(text)));
  // Without file facts no line carries a number and none is drawn heavier for a hub, though four relations of the
  // view end at the supplies and cite files.
  assert.deepEqual(countsOf(plate), []);
  assert.deepEqual(
    plate.lines.filter((row) => row === "citations" || row === "emphasis"),
    [],
  );
  // The key holds no entry of a strip: the boundary and the ground of the part outside it, and no kind.
  assert.deepEqual(plate.legend, [
    { shape: "boundary", label: "inside The print edition" },
    { shape: "outside", label: "outside it" },
  ]);
});

test("a model that names edition.marks is refused, by the field's name", async () => {
  for (const marks of ["strip", "card", "loom"])
    assert.throws(
      () => validateModel(minimalModel({ edition: { marks, palette: "soot" } })),
      ({ code, problems }) => {
        assert.equal(code, "model_invalid");
        assert.deepEqual(problems, [
          {
            code: "model_field_retired",
            path: "/edition/marks",
            message:
              "is no longer a model field: every part is drawn as one card, with its strip where it owns files; remove it",
          },
        ]);
        return true;
      },
    );
  // The published schema takes a palette and nothing else.
  const schema = JSON.parse(
    await fs.readFile(new URL("../src/model/schema.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(Object.keys(schema.properties.edition.properties), ["palette"]);
  assert.deepEqual(validateModel(minimalModel({ edition: {} })).edition, { palette: null });
});

test("a card narrower than its kind and its count on one line sets the count under the kind", () => {
  const model = stripModel();
  const supplies = model.components.find(({ id }) => id === "supplies");
  const styles = figureStyles(POSTER.steps[0]);
  const { card } = figureMetrics(styles);
  const boxes = partBoxes({ model, typefaces, styles, card, style: stripStyle() });
  // The caption's two ends: the kind's label after its icon, 5 points on, and the count.
  const kind = styles.name.size + 7.5 + typefaces.measure("vendored supply", styles.detail);
  const count = typefaces.measure("3 files, 56 KB", styles.detail);
  const line = kind + 2 * styles.detail.size + count;
  const wide = Math.ceil(line) + 2 * card.pad;
  const narrow = Math.ceil(Math.max(kind, count)) + 2 * card.pad;
  assert.ok(narrow < wide, `${narrow} of ${wide}`);
  // A card that holds the line sets the caption on one line; a narrower one that holds either end sets two, is a
  // candidate still, and is one line of the caption's type taller.
  assert.equal(boxes.text(supplies, wide).captionLines, 1);
  assert.equal(boxes.text(supplies, narrow).captionLines, 2);
  assert.equal(boxes.broken(supplies, wide), null);
  assert.equal(boxes.broken(supplies, narrow), null);
  assert.equal(boxes.height(supplies, narrow) - boxes.height(supplies, wide), styles.detail.line);
  // A card narrower than the kind with its icon, or than the count, is no candidate.
  const least = Math.floor(Math.max(kind, count)) + 2 * card.pad - 1;
  assert.equal(boxes.broken(supplies, least)?.reason, "caption_broken");
  // Drawn, the count stands one line under the kind, from the card's left padding.
  const runs = [];
  const draw = {
    text: (_layer, value, x, top, style) => {
      runs.push({ value, x, top });
      return top + style.line;
    },
    shapes: [],
    rects: [],
    typefaces,
  };
  const drawn = (width) => {
    runs.length = 0;
    drawPart(
      {
        x: 0,
        y: 0,
        width,
        height: boxes.height(supplies, width),
        model,
        component: supplies,
        text: boxes.text(supplies, width),
        styles,
        card,
        icons,
        colors: colorsOf(INDIGO),
        lines: linesOf(),
      },
      draw,
    );
    const at = (said) => runs.find(({ value }) => value === said);
    return { kind: at("vendored supply"), count: at("3 files, 56 KB") };
  };
  const broken = drawn(narrow);
  assert.equal(broken.count.top, broken.kind.top + styles.detail.line);
  assert.equal(broken.count.x, card.pad);
  // On one line the count stands on the kind's line and ends at the card's right padding.
  const whole = drawn(wide);
  assert.equal(whole.count.top, whole.kind.top);
  assert.ok(Math.abs(whole.count.x + count - (wide - card.pad)) < 0.01, String(whole.count.x));
});

test("the key lists no kind, and holds the strip's entries, the count, the hub, the boundary, the ground of a part outside and the statuses", async () => {
  const {
    plates: [plate],
  } = await platesIn(stripModel(), stripStyle());
  // The plate draws three kinds and its key holds none: each card names its kind beside the kind's icon.
  assert.ok(plate.legend.every((entry) => !("kind" in entry) && !("icon" in entry)));
  const labels = plate.legend.map(({ label }) => label);
  const texts = plate.runs.map(({ text }) => text);
  for (const said of ["stage", "vendored supply", "external tool"]) {
    assert.ok(!labels.includes(said), said);
    assert.ok(texts.includes(said), said);
  }
  // What a card cannot say where it stands: the age bands its strips hold and the pin's date, the scale bar, the
  // count beside a relation, the hub's line, the boundary and, since Typst stands outside it, the ground of a part
  // outside. An entry holds its shape, its label and its sample's own fields, and names no group.
  assert.deepEqual(
    plate.legend.map(({ shape }) => shape),
    ["band", "band", "reference", "length", "count", "hub", "boundary", "outside"],
  );
  assert.deepEqual(plate.legend.slice(-2), [
    { shape: "boundary", label: "inside The print edition" },
    { shape: "outside", label: "outside it" },
  ]);
  assert.ok(plate.legend.every((entry) => !("group" in entry) && !("guide" in entry)));
  // The statuses present close the key.
  const {
    plates: [dashed],
  } = await platesIn(stripModel("en", {}, { record: "retired", typst: "planned" }), stripStyle());
  assert.deepEqual(
    dashed.legend.slice(-4).map(({ shape, label }) => [shape, label]),
    [
      ["boundary", "inside The print edition"],
      ["outside", "outside it"],
      ["planned", "planned"],
      ["retired", "retired"],
    ],
  );
  // A view that shows no part outside the repository keys no such ground.
  const inside = stripModel();
  const alone = stripModel("en", {
    components: inside.components
      .filter(({ id }) => id !== "typst")
      .map(({ id, label, kind }) => ({ id, label, kind })),
    relations: inside.relations
      .filter(({ to }) => to !== "typst")
      .map(({ id, from, to, label, files }) => ({ id, from, to, label, files })),
  });
  const {
    plates: [whole],
  } = await platesIn(alone, stripStyle());
  assert.deepEqual(
    whole.legend.map(({ shape }) => shape),
    ["band", "band", "reference", "length", "count", "hub"],
  );
  // A group's own view shows its neighbours as context, on the outside ground though they lie inside the
  // repository: its key holds that ground, after the boundary where the figure draws one.
  const grouped = stripModel("en", {
    groups: [{ id: "edition", label: "Edition", members: ["composer", "words", "record"] }],
  });
  const style = stripStyle(INDIGO, PARTS, grouped);
  const views = await planViews(grouped, async (view) =>
    view.origin === "complete"
      ? { fits: false, width: 0, height: 0 }
      : admitsView(grouped, view, typefaces, icons, style),
  );
  const plates = composePlates(grouped, views, typefaces, icons, style);
  const own = views.findIndex(({ id }) => id === "edition");
  assert.ok(views[own].components.some(({ context }) => context));
  // No part of that view lies outside the repository, so the key says "outside it" of nothing: the neighbours'
  // ground is keyed by its own words, after the boundary where the figure draws one.
  const entries = plates[own].legend.map(({ shape, label }) => [shape, label]);
  assert.deepEqual(entries.at(-1), ["outside", "outside this group, shown for context"]);
  assert.ok(!entries.some(([, label]) => label === "outside it"));
  assert.equal(
    entries.some(([shape]) => shape === "boundary"),
    plates[own].lines.includes("boundary"),
  );
});
