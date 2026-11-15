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
import { TABLE } from "./fixtures/line-tables.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { readPng } from "./fixtures/png.mjs";
import { recordFacts } from "./fixtures/record-facts.mjs";
import { HOUSE_TOKENS, icons, lineFacts, typefaces, wiresOf } from "./fixtures/strips.mjs";

// Every straight piece of one row of the table of lines has one weight on a page picture, wherever on the figure
// it stands: on the figure's middle column and middle row as anywhere else. A piece is read as the screen trial
// defined a line's width: across its middle, the sum of each pixel's darkness. The figure is drawn from hand-made
// layout input, since no layout is asked to put a line on the middle, and typeset by the edition's own path.
//

/** Widths a caller may name with `--png` whose pictures' heights are rounded: 569.25 and 768.375 px. */
const CALLERS = Object.freeze([1012, 1366]);
/** A piece is read when it is this long on the picture, and is absent when it leaves less ink than this. */
const LIMITS = Object.freeze({ length: 40, share: 0.75, absent: 0.05 });
const BODY = Object.freeze({
  width: HOUSE.plate.width * HOUSE.plate.pixelsPerPoint,
  height: HOUSE.plate.height * HOUSE.plate.pixelsPerPoint,
});
/** The figure's middle column and middle row, in the plate's drawing space. */
const MIDDLE = Object.freeze({ x: BODY.width / 2, y: BODY.height / 2 });

const rgb = (color) => [1, 3, 5].map((at) => Number.parseInt(color.slice(at, at + 2), 16));
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];

/**
 * Twelve straight pieces, six of a relation and six into a hub: of each row an upright piece on the middle column
 * and two beside it, and a level piece on the middle row and two beside it. No two pieces meet.
 */
const PIECES = Object.freeze({
  relation: [
    ...[700, MIDDLE.x, 1500].map((x) => [
      [x, 60],
      [x, 300],
    ]),
    ...[400, MIDDLE.y, 650].map((y) => [
      [100, y],
      [500, y],
    ]),
  ],
  emphasis: [
    ...[700, MIDDLE.x, 1500].map((x) => [
      [x, 700],
      [x, 1000],
    ]),
    ...[400, MIDDLE.y, 650].map((y) => [
      [1600, y],
      [2100, y],
    ]),
  ],
});

/** The figure of the twelve pieces as a plate draws its lines, and the wires it holds. */
function figureOf() {
  const relations = [
    ...PIECES.relation.map((_, index) => ({ id: `r${index}`, from: "s", to: `t${index}` })),
    ...PIECES.emphasis.map((_, index) => ({ id: `h${index}`, from: `s${index}`, to: "hub" })),
  ].map((relation) => ({ ...relation, files: [] }));
  const paths = [...PIECES.relation, ...PIECES.emphasis].map((points, index) => ({
    relations: [relations[index]],
    points,
  }));
  const styles = figureStyles(POSTER.steps[0], true);
  const shapes = [];
  drawLines(
    { cards: new Map(), paths, arrows: [] },
    {
      facts: lineFacts({ relations }),
      view: { relations },
      strips: true,
      styles,
      metrics: figureMetrics(styles),
      typefaces,
      colors: colorsOf(HOUSE_TOKENS),
      lines: linesOf(TABLE),
      at: (x) => x,
      down: (y) => y,
      lift: (point) => point,
      text: () => {},
      shapes,
      rects: [],
      marks: [],
    },
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BODY.width}" height="${BODY.height}" ` +
    `viewBox="0 0 ${BODY.width} ${BODY.height}">${shapes.join("")}</svg>`
  );
}

/** The page pictures of a one-plate edition of a figure, by width. */
async function picturesOf(svg, widths) {
  const model = validateModel(minimalModel({ editors: [{ name: "Yang HENG" }] }));
  const plates = [
    {
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
    },
  ];
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
    widths,
  });
  return new Map(typeset.png.map(({ width, bytes }) => [width, readPng(bytes)]));
}

/**
 * The effective width of each straight piece of a figure's wires that is at least 40 px long on a picture: the sum
 * of darkness across the piece at its middle, each pixel's distance from the paper as a share of the line colour's.
 */
function piecesOn(image, svg) {
  const px = image.width / HOUSE.page.width;
  const unit = px / HOUSE.plate.pixelsPerPoint;
  const paper = rgb(HOUSE.palette.paper);
  const read = [];
  for (const { stroke, width: weight, points } of wiresOf(svg))
    for (let index = 1; index < points.length; index += 1) {
      const [[x1, y1], [x2, y2]] = [points[index - 1], points[index]];
      const upright = x1 === x2;
      if ((!upright && y1 !== y2) || Math.hypot(x2 - x1, y2 - y1) * unit < LIMITS.length) continue;
      const column = Math.round(HOUSE.plate.x * px + ((x1 + x2) / 2) * unit);
      const row = Math.round(HOUSE.plate.y * px + ((y1 + y2) / 2) * unit);
      const reach = Math.ceil((weight * unit) / 2) + 3;
      let effective = 0;
      for (let step = -reach; step <= reach; step += 1) {
        const at =
          ((row + (upright ? 0 : step)) * image.width + column + (upright ? step : 0)) *
          image.channels;
        const pixel = [image.pixels[at], image.pixels[at + 1], image.pixels[at + 2]];
        effective += Math.min(1, distance(pixel, paper) / distance(rgb(stroke), paper));
      }
      read.push({
        weight,
        effective,
        place: upright ? `upright at x ${x1}` : `level at y ${y1}`,
      });
    }
  return read;
}

/** The invariant: on a picture, no piece of a row is absent or lighter than three quarters of its row's median. */
function assertOneWeight(image, svg, note = () => {}) {
  const read = piecesOn(image, svg);
  const lines = linesOf(TABLE);
  const light = [];
  for (const [row, heavy] of [
    ["relation", false],
    ["emphasis", true],
  ]) {
    const pieces = read.filter(({ weight }) => weight === lines.stroke(heavy));
    assert.equal(pieces.length, PIECES[row].length, `row ${row}: ${pieces.length} pieces read`);
    const middle = median(pieces.map(({ effective }) => effective));
    note(
      `${image.width} px, row ${row}: median ${middle.toFixed(2)} px; ` +
        pieces.map(({ place, effective }) => `${place} ${effective.toFixed(2)}`).join(", "),
    );
    for (const { place, effective } of pieces)
      if (effective < LIMITS.absent) light.push(`row ${row}: the piece ${place} is absent`);
      else if (effective < LIMITS.share * middle)
        light.push(
          `row ${row}: the piece ${place} reads ${effective.toFixed(2)} px ` +
            `of its row's ${middle.toFixed(2)} px`,
        );
  }
  assert.deepEqual(light, [], `at ${image.width} px`);
}

/** Two lines at 45 degrees from the figure's top to its foot: they cross every row, and most columns. */
const SLOPES = Object.freeze([100, 1085]);
const SLOPED =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${BODY.width}" height="${BODY.height}" ` +
  `viewBox="0 0 ${BODY.width} ${BODY.height}">${SLOPES.map(
    (x) =>
      `<path d="M${x},0 L${x + BODY.height},${BODY.height}" fill="none" ` +
      `stroke="${HOUSE.palette.ink}" stroke-width="8"/>`,
  ).join("")}</svg>`;

/**
 * The rows and columns of the sloped figure a picture leaves out. Read row by row, a line at 45 degrees stands one
 * pixel further along in each; where a row is lost it steps a pixel more, and read column by column, where a column
 * is. A row or column in which no line is read is named too.
 */
function lostOn(image) {
  const px = image.width / HOUSE.page.width;
  const unit = px / HOUSE.plate.pixelsPerPoint;
  const paper = rgb(HOUSE.palette.paper);
  const full = distance(rgb(HOUSE.palette.ink), paper);
  const reach = Math.ceil(8 * unit) + 3;
  const lost = [];
  for (const [name, rows] of [
    ["row", true],
    ["column", false],
  ])
    for (const start of SLOPES) {
      // Rows are counted from the figure's top, columns from the line's first.
      const origin = rows ? HOUSE.plate.y * px : HOUSE.plate.x * px + start * unit;
      const end = Math.min(
        rows ? image.height : image.width,
        Math.floor(origin + (BODY.height - 8) * unit),
      );
      let last = null;
      for (let at = Math.ceil(origin + 8 * unit); at < end; at += 1) {
        const along = (at + 0.5 - origin) / unit;
        const expected = rows
          ? HOUSE.plate.x * px + (start + along) * unit
          : HOUSE.plate.y * px + along * unit;
        let [sum, moment] = [0, 0];
        for (let step = -reach; step <= reach; step += 1) {
          const across = Math.round(expected) + step;
          const [x, y] = rows ? [across, at] : [at, across];
          if (x >= image.width || y >= image.height) continue;
          const pixel = (y * image.width + x) * image.channels;
          const dark =
            distance(
              [0, 1, 2].map((channel) => image.pixels[pixel + channel]),
              paper,
            ) / full;
          sum += dark;
          moment += dark * (across + 0.5);
        }
        const offset = moment / sum - expected;
        const place = `${name} ${at}, the figure's ${rows ? "y" : "x"} ${Math.round(rows ? along : start + along)}`;
        if (sum < 0.5) lost.push(`no line in ${place}`);
        else if (last !== null && Math.abs(offset - last) > 0.6)
          lost.push(`a ${name} lost at ${place}`);
        if (sum >= 0.5) last = offset;
      }
    }
  return [...new Set(lost)];
}

const SVG = figureOf();
/** The pictures of the pieces are typeset once, by the first test that reads one. */
let pictures = null;
const pictureAt = async (width) => (await (pictures ??= picturesOf(SVG, TABLE.widths))).get(width);

for (const width of TABLE.widths)
  test(`at ${width} px every piece of a row has one weight, on the figure's middle as beside it`, async (t) => {
    assertOneWeight(await pictureAt(width), SVG, (line) => t.diagnostic(line));
  });

test("a picture that draws a row's piece on the middle column without its ink fails and names the piece", async () => {
  // The middle column's ink is taken off a copy of a picture, as a lost column of the figure thins it.
  const image = await pictureAt(TABLE.widths[0]);
  const thinned = { ...image, pixels: Buffer.from(image.pixels) };
  const paper = rgb(HOUSE.palette.paper);
  const column = Math.round(
    (HOUSE.plate.x + MIDDLE.x / HOUSE.plate.pixelsPerPoint) * (image.width / HOUSE.page.width),
  );
  for (let y = 0; y < image.height; y += 1)
    for (const x of [column - 1, column])
      paper.forEach((value, channel) => {
        thinned.pixels[(y * image.width + x) * image.channels + channel] = value;
      });
  assert.throws(
    () => assertOneWeight(thinned, SVG),
    /row relation: the piece upright at x 1128 is absent/u,
  );
});

/** The pictures of the sloped figure at the widths a caller names, typeset once. */
let sloped = null;
const slopedAt = async (width) => (await (sloped ??= picturesOf(SLOPED, CALLERS))).get(width);

for (const width of CALLERS)
  test(`at ${width} px, a width a caller names, a picture leaves out no row or column of the figure`, async () => {
    assert.deepEqual(lostOn(await slopedAt(width)), [], `at ${width} px`);
  });

test("a picture with one row taken out fails and names the row", async () => {
  // Every row from one a third of the way down is moved up by one on a copy of a picture.
  const image = await slopedAt(CALLERS[0]);
  const row = Math.round(image.height / 3);
  const stride = image.width * image.channels;
  const short = { ...image, pixels: Buffer.from(image.pixels) };
  short.pixels.copyWithin(row * stride, (row + 1) * stride);
  const lost = lostOn(short);
  assert.ok(
    lost.some((entry) => entry.startsWith(`a row lost at row ${row},`)),
    lost.join("; "),
  );
});
