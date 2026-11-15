import assert from "node:assert/strict";
import test from "node:test";
import { editionRecord } from "../src/edition/record.mjs";
import { typesetEdition } from "../src/edition/typeset.mjs";
import { validateModel } from "../src/model/load.mjs";
import { drawLines } from "../src/poster/lines.mjs";
import {
  HOUSE,
  POSTER,
  colorsOf,
  figureMetrics,
  figureStyles,
  linesOf,
} from "../src/poster/tokens.mjs";
import { BROKEN, TABLE } from "./fixtures/line-tables.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { readPng } from "./fixtures/png.mjs";
import { recordFacts } from "./fixtures/record-facts.mjs";
import {
  HOUSE_TOKENS,
  icons,
  lineFacts,
  platesIn,
  rectsOf,
  stripModel,
  stripStyle,
  typefaces,
} from "./fixtures/strips.mjs";

// Every two tested rows drawn as lines are told apart on a plate's image 1920 px wide, in colour and reduced to
// grey, by the limits fixed before the trials: two weights by effective widths at least 1.0 px apart and core
// widths at least 1 px apart, a pattern from a continuous line by a median dash and a median gap of 2 px each.
// The lifecycle rows are not tested by a work and are left out.

const WIDTH = TABLE.widths[1];
const LIMITS = Object.freeze({ effective: 1.0, core: 1, pitch: 2 });
/** Image px to a page point, and to a px of the plate's drawing space. */
const PX = WIDTH / HOUSE.page.width;
const UNIT = PX / HOUSE.plate.pixelsPerPoint;
const across = (x) => HOUSE.plate.x * PX + x * UNIT;
const down = (y) => HOUSE.plate.y * PX + y * UNIT;
const BODY = Object.freeze({
  width: HOUSE.plate.width * HOUSE.plate.pixelsPerPoint,
  height: HOUSE.plate.height * HOUSE.plate.pixelsPerPoint,
});

const rgb = (color) => [1, 3, 5].map((at) => Number.parseInt(color.slice(at, at + 2), 16));
/** A colour as itself, and reduced to grey by its luminance. */
const SPACES = Object.freeze({
  colour: (channels) => channels,
  grey: ([r, g, b]) => [0.2126 * r + 0.7152 * g + 0.0722 * b],
});
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
const total = (values) => values.reduce((sum, value) => sum + value, 0);

/** The first page picture of a one-plate edition at 1920 px. */
async function pictureOf(model, plate) {
  const plates = [plate];
  const record = editionRecord({
    model,
    plates,
    icons,
    facts: recordFacts(),
    modelSha256: "0".repeat(64),
    publisher: "0.14.0",
    typst: "0.15.1",
    overview: false,
    page: "strips.html",
    time: null,
  });
  const typeset = await typesetEdition({
    record,
    plates,
    modelBytes: Buffer.from(JSON.stringify(model)),
    composition: null,
    revision: null,
    date: "2026-11-06",
    time: 1793918078,
    widths: [WIDTH],
  });
  return readPng(typeset.png[0].bytes);
}

/**
 * The darkness of the pixels from one point over a number of steps: each pixel's distance from the paper as a share
 * of a line colour's distance from the paper, from 0 to 1, in colour or in grey.
 */
function darknessFrom(image, [x, y], [dx, dy], steps, color, space) {
  const { width, channels, pixels } = image;
  const paper = space(rgb(HOUSE.palette.paper));
  const full = distance(space(rgb(color)), paper);
  return Array.from({ length: steps }, (_, step) => {
    const at = ((y + step * dy) * width + x + step * dx) * channels;
    const pixel = space([pixels[at], pixels[at + 1], pixels[at + 2]]);
    return Math.min(1, distance(pixel, paper) / full);
  });
}

/**
 * Ten upright lines, each 320 px long on the picture: five into one part, the hub, and five into five other parts.
 * A coordinate of the drawing space falls on one of five places within a pixel of the 1920 px picture, and a line's
 * core width there depends on which; the lines of each kind stand once on each, so the medians are read over
 * every place alike and not over the places one small plate's lines happen to take.
 */
const STAND = Object.freeze({
  hub: [200, 301, 402, 503, 604],
  other: [1400, 1501, 1602, 1703, 1804],
});

/** The picture of the ten lines drawn from a table of lines, and the colours they are drawn in. */
async function linesIn(table) {
  const relations = [
    ...STAND.hub.map((x, index) => ({ id: `hub-${index}`, from: `s${index}`, to: "hub", x })),
    ...STAND.other.map((x, index) => ({ id: `other-${index}`, from: "s", to: `t${index}`, x })),
  ].map((relation) => ({ ...relation, files: [] }));
  const layout = {
    cards: new Map(),
    paths: relations.map((relation) => ({
      relations: [relation],
      points: [
        [relation.x, 200],
        [relation.x, 600],
      ],
    })),
    arrows: relations.map((relation) => ({
      x: relation.x,
      y: 600,
      direction: "down",
      relations: [relation],
    })),
  };
  const styles = figureStyles(POSTER.steps[0], true);
  const colors = colorsOf(HOUSE_TOKENS);
  const shapes = [];
  drawLines(layout, {
    facts: lineFacts({ relations }),
    view: { relations },
    strips: true,
    styles,
    metrics: figureMetrics(styles),
    typefaces,
    colors,
    lines: linesOf(table),
    at: (x) => x,
    down: (y) => y,
    lift: (point) => point,
    text: () => {},
    shapes,
    rects: [],
    marks: [],
  });
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BODY.width}" height="${BODY.height}" ` +
    `viewBox="0 0 ${BODY.width} ${BODY.height}">${shapes.join("")}</svg>`;
  const model = validateModel(minimalModel({ editors: [{ name: "Yang HENG" }] }));
  const image = await pictureOf(model, {
    page: 1,
    views: ["view-1"],
    width: BODY.width,
    share: 1,
    reading: "none",
    title: "View 1",
    question: "What does view 1 show?",
    svg,
    runs: [],
    legend: [],
  });
  return { image, colors };
}

/** The median effective width and core width of upright lines, each read across its middle. */
function widthsOf(image, stands, color, space) {
  const read = stands.map((x) => {
    const values = darknessFrom(
      image,
      [Math.round(across(x)) - 4, Math.round(down(400))],
      [1, 0],
      8,
      color,
      space,
    );
    return { effective: total(values), core: values.filter((value) => value >= 0.5).length };
  });
  return {
    effective: median(read.map(({ effective }) => effective)),
    core: median(read.map(({ core }) => core)),
    lines: read.map(({ effective, core }) => `${effective.toFixed(2)}/${core}`).join(" "),
  };
}

/** The invariant for two weights: in a table of lines, emphasis is told from a relation, in colour and in grey. */
async function assertWeightsApart(table) {
  const { image, colors } = await linesIn(table);
  for (const [name, space] of Object.entries(SPACES)) {
    const heavy = widthsOf(image, STAND.hub, colors.dye[2], space);
    const light = widthsOf(image, STAND.other, colors.line, space);
    assert.ok(
      heavy.effective - light.effective >= LIMITS.effective &&
        heavy.core - light.core >= LIMITS.core,
      `row emphasis: in ${name} at ${WIDTH} px the lines into the hub read ${heavy.lines} ` +
        `(effective width/core width) and the other lines ${light.lines}`,
    );
  }
}

test("at 1920 px a line into the hub is told from every other line, in colour and in grey", async () => {
  await assertWeightsApart(TABLE);
});

test("on a table whose emphasis is one and a half times a relation's weight, the test of lines told apart fails and names the row", async () => {
  await assert.rejects(
    assertWeightsApart(BROKEN.faintEmphasis),
    /row emphasis: in colour at 1920 px/u,
  );
});

test("at 1920 px the boundary's dashes and gaps are told from a continuous line, in colour and in grey", async () => {
  const model = stripModel();
  const {
    plates: [plate],
  } = await platesIn(model, stripStyle(HOUSE_TOKENS));
  assert.deepEqual([plate.reading, plate.share], ["none", 1]);
  const image = await pictureOf(model, plate);
  // The boundary's lower edge, read between its round corners on its darker row.
  const { dash } = TABLE.rows.boundary;
  const frame = rectsOf(plate.svg).find((rect) => rect.dash === dash.join(" "));
  const [left, right] = [across(frame.x + 18), across(frame.x + frame.width - 18)].map(Math.round);
  for (const [name, space] of Object.entries(SPACES)) {
    const rows = [Math.floor, Math.ceil].map((round) =>
      darknessFrom(
        image,
        [left, round(down(frame.y + frame.height))],
        [1, 0],
        right - left,
        HOUSE.figure.boundary,
        space,
      ),
    );
    const edge = total(rows[0]) > total(rows[1]) ? rows[0] : rows[1];
    const stretches = edge
      .map((value) => (value >= 0.5 ? "#" : " "))
      .join("")
      .match(/#+| +/gu)
      .slice(1, -1);
    const lengths = (mark) =>
      stretches.filter((stretch) => stretch.startsWith(mark)).map(({ length }) => length);
    const [dashes, gaps] = [median(lengths("#")), median(lengths(" "))];
    assert.ok(
      dashes >= LIMITS.pitch && gaps >= LIMITS.pitch,
      `row boundary: in ${name} at ${WIDTH} px its dash reads ${dashes} px and its gap ${gaps} px`,
    );
    // The drawing space's 8 and 5 are 6.4 and 4 px here, as the trial measured 6 and 4.
    assert.ok(
      Math.abs(dashes - dash[0] * UNIT) <= 1.5 && Math.abs(gaps - dash[1] * UNIT) <= 1.5,
      `row boundary: in ${name} its dash reads ${dashes} px and its gap ${gaps} px`,
    );
  }
});
