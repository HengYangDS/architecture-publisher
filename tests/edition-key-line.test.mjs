import assert from "node:assert/strict";
import test from "node:test";
import { editionRecord } from "../src/edition/record.mjs";
import { typesetEdition } from "../src/edition/typeset.mjs";
import { loadIcons } from "../src/icons.mjs";
import { validateModel } from "../src/model/load.mjs";
import { HOUSE } from "../src/house.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { readPng } from "./fixtures/png.mjs";
import { recordFacts } from "./fixtures/record-facts.mjs";

// A plate's key is one line: its text stands on one baseline on every plate, and each mark, whatever its height, is
// centred on the middle of the text beside it. The pictures are read back row by row.

const icons = await loadIcons();
const PX = 2400 / HOUSE.page.width;
const BLANK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="2256" height="1071" viewBox="0 0 2256 1071"></svg>';

/** A strip plate's marks, as its engine lists them, and a card plate's: two kinds by their icons. */
const STRIPS = [
  { shape: "band", band: 0, color: "#b7d8db", label: "HHHH" },
  { shape: "length", bytes: 20000, length: 128.6, thickness: 12, color: "#b7d8db", label: "HHHH" },
  { shape: "count", count: 3, size: 14, color: "#617465", label: "HHHH" },
  { shape: "hub", color: "#334965", weight: 3.2, arrow: 11.6, label: "HHHH" },
  { shape: "boundary", label: "HHHH" },
  { shape: "planned", label: "HHHH" },
];
const CARDS = [
  { icon: "terminal", color: "#324f3e", label: "HHHH" },
  { shape: "boundary", label: "HHHH" },
];

/**
 * A one-plate edition whose key holds the given marks, in a language, typeset at 2400 px: its record and what the
 * typesetting hands back. A model given a repository is pinned, and its edition dated by the date given; `alone`
 * asks for the plate's figure set alone too.
 */
async function editionOf(legend, locale = "en", { repository, date = null, alone = false } = {}) {
  const model = validateModel(
    minimalModel({
      locale,
      editors: [{ name: "Yang HENG" }],
      ...(repository ? { repository } : {}),
    }),
  );
  const plates = [
    {
      page: 1,
      views: ["view-1"],
      width: 2256,
      // The blank figure draws on its whole canvas.
      extent: { x: 0, y: 0, width: 2256, height: 1071 },
      share: 1,
      reading: "none",
      title: "View 1",
      question: "What does view 1 show?",
      svg: BLANK,
      runs: [],
      legend,
    },
  ];
  const record = editionRecord({
    model,
    plates,
    icons,
    facts: recordFacts({ date }),
    publisher: "0.13.1",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    time: null,
  });
  const typeset = await typesetEdition({
    record,
    plates,
    modelBytes: Buffer.from(JSON.stringify(model)),
    composition: null,
    revision: model.repository?.revision ?? null,
    date: date ?? "2026-11-06",
    time: 1793918078,
    widths: [2400],
    alone,
  });
  return { record, typeset };
}

/** The first page picture of a one-plate edition whose key holds the given marks, in a language. */
const pageOf = async (legend, locale = "en") =>
  readPng((await editionOf(legend, locale)).typeset.png[0].bytes);

/**
 * The runs of inked columns of a picture between two rows, each with the rows its ink covers. A mark and its label
 * stand 5 points apart and two entries 20; the letters of a label and the dashes of a mark stand 3 points apart at
 * most, so columns within 4 points of each other are one run.
 * @param {{ width: number }} image
 * @param {[number, number]} rows the first row read and the row after the last
 * @param {(x: number, y: number) => boolean} inked whether a pixel holds ink
 */
function runsOf({ width }, [top, bottom], inked) {
  const runs = [];
  for (let x = 0; x < width; x += 1) {
    let rows = null;
    for (let y = top; y < bottom; y += 1) if (inked(x, y)) rows = rows ? [rows[0], y] : [y, y];
    if (!rows) continue;
    const last = runs.at(-1);
    if (last && x - last.right <= 4 * PX)
      Object.assign(last, {
        right: x,
        top: Math.min(last.top, rows[0]),
        bottom: Math.max(last.bottom, rows[1]),
      });
    else runs.push({ left: x, right: x, top: rows[0], bottom: rows[1] });
  }
  return runs.map((run) => ({ ...run, centre: (run.top + run.bottom) / 2 }));
}

/** The key's line of a page picture: its runs of ink between the body's foot and the foot's rule. */
function keyOf(image) {
  const { width, channels, pixels } = image;
  const [top, bottom] = [
    Math.round(HOUSE.edition.bodyBottom * PX) + 2,
    Math.round(HOUSE.edition.rule * PX) - 4,
  ];
  const paper = pixels[(top * width + 8) * channels];
  return runsOf(
    image,
    [top, bottom],
    (x, y) => Math.abs(pixels[(y * width + x) * channels] - paper) > 24,
  );
}

/**
 * The foot's words on a page picture: the columns their ink covers under the foot's rule, in the page's left half.
 * The folio stands at the right margin.
 */
function footOf(image) {
  const { width, height, channels, pixels } = image;
  const top = Math.round(HOUSE.edition.rule * PX) + 4;
  const paper = pixels[(top * width + 8) * channels];
  const words = runsOf(
    image,
    [top, height],
    (x, y) => Math.abs(pixels[(y * width + x) * channels] - paper) > 24,
  ).filter(({ left }) => left < width / 2);
  return { left: words[0].left, right: words.at(-1).right };
}

/**
 * The key of a figure set alone, on its picture: the runs of ink under the figure's box, which is as tall as what
 * the figure draws on with the pad above it and below. A picture on no ground has ink where it is opaque.
 */
function loneKeyOf(image, extent) {
  const { width, height, pixels } = image;
  const top = Math.round(
    (extent.height / HOUSE.plate.pixelsPerPoint + 2 * HOUSE.plate.alonePad) * PX,
  );
  return runsOf(image, [top, height], (x, y) => pixels[(y * width + x) * 4 + 3] > 96);
}

test("every mark of a key is centred on the capitals beside it, whatever its height", async () => {
  // Each entry is a mark and the label HHHH, whose ink runs from the baseline to the cap height.
  const runs = keyOf(await pageOf(STRIPS));
  assert.equal(runs.length, 2 * STRIPS.length, `the key set ${runs.length} runs of ink`);
  const labels = runs.filter((_, index) => index % 2 === 1);
  const marks = runs.filter((_, index) => index % 2 === 0);
  const [{ centre: axis, bottom: baseline }] = labels;
  for (const label of labels) assert.equal(label.bottom, baseline);
  for (const [index, mark] of marks.entries())
    assert.ok(
      Math.abs(mark.centre - axis) <= 1,
      `the ${STRIPS[index].shape} mark is centred on row ${mark.centre}, its label on ${axis}`,
    );
  // The hub's mark is a line that ends in an arrowhead as tall as the plate draws one: a plate's pixel is the
  // picture's at 2400 px.
  const hub = marks[3];
  const tall = hub.bottom - hub.top + 1;
  assert.ok(Math.abs(tall - STRIPS[3].arrow) <= 2, `the hub's mark is ${tall} px tall`);
});

test("a plate's page states its commit's date once, in its foot, and a figure set alone states it in its key", async () => {
  // The commit's entry in two forms that their width tells apart: eight capitals with the date, four without.
  const legend = [
    { shape: "reference", date: "2026-11-06", label: "HHHHHHHH", undated: "HHHH" },
    { shape: "band", band: 0, color: "#b7d8db", label: "HHHH" },
  ];
  const repository = {
    name: "minimal",
    url: "https://example.invalid/minimal.git",
    revision: "a".repeat(40),
  };
  const wide = ({ left, right }) => right - left + 1;
  const dated = await editionOf(legend, "en", { repository, date: "2026-11-06", alone: true });
  assert.equal(dated.record.words.foot, "Minimal at aaaaaaa · 2026-11-06");
  // On the page the entry stands in words alone, before the band's mark and label, and is as wide as the band's
  // four capitals: the form without the date.
  const page = readPng(dated.typeset.png[0].bytes);
  const [entry, , label, ...more] = keyOf(page);
  assert.equal(more.length, 0, "the key sets three runs of ink");
  assert.ok(Math.abs(wide(entry) - wide(label)) <= 1, `${wide(entry)} px beside ${wide(label)}`);
  // The foot of that page is longer by its date than the foot of the same edition undated, whose key is the same.
  const undated = await editionOf(legend, "en", { repository });
  assert.equal(undated.record.words.foot, "Minimal at aaaaaaa");
  const plain = readPng(undated.typeset.png[0].bytes);
  assert.ok(
    wide(footOf(page)) - wide(footOf(plain)) > 40 * PX,
    `${wide(footOf(page))} px beside ${wide(footOf(plain))}`,
  );
  assert.deepEqual(keyOf(plain).map(wide), keyOf(page).map(wide));
  // No foot stands under the figure set alone: its key sets the form with the date, eight capitals wide.
  const [figure] = dated.typeset.figures;
  assert.equal(figure.file, "figures/01-view-1.png");
  const [alone, , beside] = loneKeyOf(readPng(figure.bytes), { height: 1071 });
  const ratio = wide(alone) / wide(beside);
  assert.ok(ratio > 1.9 && ratio < 2.2, `${wide(alone)} px beside ${wide(beside)}`);
});

/** The red of a colour, the channel the pictures are read in. */
const red = (color) => Number.parseInt(color.slice(1, 3), 16);

/**
 * The darkness of each pixel from one point of a page picture over a number of steps, across or down: its distance
 * from the paper as a share of a colour's distance from the paper.
 */
function darknessFrom(image, [x, y], [dx, dy], steps, color) {
  const { width, channels, pixels } = image;
  const paper = pixels[(Math.round(HOUSE.edition.bodyBottom * PX) + 2) * width * channels];
  return Array.from({ length: steps }, (_, step) => {
    const pixel = pixels[((y + step * dy) * width + x + step * dx) * channels];
    return Math.min(1, Math.max(0, (paper - pixel) / (paper - red(color))));
  });
}

test("the key sets a count as a figure at the plate's size, a hub line at the plate's weight and the boundary in the plate's dashes", async () => {
  const image = await pageOf(STRIPS);
  const marks = keyOf(image).filter((_, index) => index % 2 === 0);
  const [count, hub, boundary] = [marks[2], marks[3], marks[4]];
  // A figure of the plate's 14 px type stands as tall as its capitals, some 9 px, and half as wide; a line would not.
  const [tall, wide] = [count.bottom - count.top + 1, count.right - count.left + 1];
  assert.ok(tall >= 8 && tall <= 11, `the count's figure is ${tall} px tall`);
  assert.ok(wide >= 5 && wide <= 9, `the count's figure is ${wide} px wide`);
  // The hub's line, read across at a column before its arrowhead, is as heavy as the plate's line into a hub.
  const sum = (values) => values.reduce((total, value) => total + value, 0);
  const heavy = sum(
    darknessFrom(image, [hub.left + 6, hub.top], [0, 1], hub.bottom - hub.top + 1, STRIPS[3].color),
  );
  assert.ok(Math.abs(heavy - STRIPS[3].weight) <= 0.4, `the hub's line is ${heavy} px heavy`);
  // The boundary's sample has the weight of the boundary's row in the table, read across its left edge between
  // its round corners where a dash covers it, and its dash and gap, read along its lower edge, which holds one
  // whole dash between two gaps.
  const { stroke, dash } = HOUSE.lines.rows.boundary;
  const straight = Array.from(
    { length: boundary.bottom - boundary.top - 11 },
    (_, row) => boundary.top + 6 + row,
  );
  const edge = Math.max(
    ...straight.map((row) =>
      sum(darknessFrom(image, [boundary.left - 2, row], [1, 0], 8, HOUSE.figure.boundary)),
    ),
  );
  assert.ok(Math.abs(edge - stroke) <= 0.25, `the boundary's edge is ${edge} px heavy`);
  const lower = darknessFrom(
    image,
    [boundary.left, boundary.bottom - 1],
    [1, 0],
    boundary.right - boundary.left + 1,
    HOUSE.figure.boundary,
  );
  const stretches = lower
    .map((value) => (value >= 0.5 ? "#" : " "))
    .join("")
    .match(/#+| +/gu);
  const whole = stretches.slice(1, -1);
  assert.ok(
    whole.some(
      (stretch, index) =>
        stretch.startsWith("#") &&
        Math.abs(stretch.length - dash[0]) <= 1 &&
        [whole[index - 1], whole[index + 1]].every(
          (gap) => gap !== undefined && Math.abs(gap.length - dash[1]) <= 1,
        ),
    ),
    `the boundary's lower edge reads ${JSON.stringify(stretches)}`,
  );
});

test("a key's text stands on the baseline at 850 points, whether its marks are icons or strips", async () => {
  const strips = keyOf(await pageOf(STRIPS));
  const cards = keyOf(await pageOf(CARDS));
  const baseline = Math.round(HOUSE.edition.key * PX);
  assert.equal(HOUSE.edition.key, 850);
  // The ink of HHHH ends on the row above the baseline.
  assert.ok(
    Math.abs(strips[1].bottom - (baseline - 1)) <= 1,
    `strips: ${strips[1].bottom} of ${baseline}`,
  );
  assert.equal(cards[1].bottom, strips[1].bottom);
  // A card's icon, the tallest mark, is centred on the same row.
  assert.ok(Math.abs(cards[0].centre - strips[1].centre) <= 1);
});

/**
 * The lines of ink between the body's foot and the foot's rule: each run of inked rows, with the columns its ink
 * covers and how tall the ink is in its first 12 points, where an entry's mark stands.
 */
function linesOf(image) {
  const { width, channels, pixels } = image;
  const [top, bottom] = [
    Math.round(HOUSE.edition.bodyBottom * PX) + 2,
    Math.round(HOUSE.edition.rule * PX) - 4,
  ];
  const paper = pixels[(top * width + 8) * channels];
  const inked = (x, y) => Math.abs(pixels[(y * width + x) * channels] - paper) > 24;
  const lines = [];
  for (let y = top; y < bottom; y += 1) {
    let columns = null;
    for (let x = 0; x < width; x += 1)
      if (inked(x, y)) columns = columns ? [columns[0], x] : [x, x];
    if (!columns) continue;
    const last = lines.at(-1);
    if (last && y - last.bottom <= 1)
      Object.assign(last, {
        bottom: y,
        left: Math.min(last.left, columns[0]),
        right: Math.max(last.right, columns[1]),
      });
    else lines.push({ top: y, bottom: y, left: columns[0], right: columns[1] });
  }
  return lines.map((line) => {
    let rows = 0;
    for (let y = line.top; y <= line.bottom; y += 1) {
      let any = false;
      for (let x = line.left; x < line.left + 12 * PX && !any; x += 1) any = inked(x, y);
      rows += any ? 1 : 0;
    }
    return { ...line, opening: rows };
  });
}

/**
 * A key of so many entries, each a dashed line and a label of six words: some 95 points with the space after it.
 * A line could break at any of the label's spaces, were an entry not kept whole.
 */
const entries = (count) =>
  Array.from({ length: count }, () => ({ shape: "planned", label: "H H H H H H" }));

test("a key longer than the body is wide breaks between entries onto a second line, the two about the key's line", async () => {
  // Twenty-six entries are some 2400 points long, and the body 1504 points wide.
  const lines = linesOf(await pageOf(entries(26)));
  assert.equal(lines.length, 2, `the key's ink stands on ${lines.length} lines`);
  // The lines stand 16 points apart, 8 above the key's line and 8 below it; the ink of H ends on the row above its
  // baseline.
  const baselines = [HOUSE.edition.key - 8, HOUSE.edition.key + 8].map((y) => Math.round(y * PX));
  for (const [index, line] of lines.entries())
    assert.ok(
      Math.abs(line.bottom - (baselines[index] - 1)) <= 1,
      `line ${index + 1} ends on row ${line.bottom} of ${baselines[index]}`,
    );
  const [left, right] = [HOUSE.page.margin, HOUSE.page.width - HOUSE.page.margin].map(
    (x) => x * PX,
  );
  for (const [index, line] of lines.entries()) {
    // Each line starts at the margin and ends within the body.
    assert.ok(Math.abs(line.left - left) <= 2, `a line starts at column ${line.left} of ${left}`);
    assert.ok(line.right <= right, `a line ends at column ${line.right} of ${right}`);
    // It starts with an entry's mark, a dashed line a point thick, and not with the rest of a label broken in two.
    assert.ok(line.opening <= 3, `line ${index + 1} opens with ink ${line.opening} rows tall`);
  }
  // The first line holds what the body takes: no further entry of 95 points would fit it.
  assert.ok(
    right - lines[0].right < 95 * PX,
    `the first line ends at ${lines[0].right} of ${right}`,
  );
});

test("a key that needs a third line is refused, since its text is never shrunk", async () => {
  await assert.rejects(pageOf(entries(60)), (error) => error.code === "edition_key_too_long");
});

test("a key whose one entry is wider than the body is refused, since an entry is never broken", async () => {
  // Four hundred capitals at the key's size are some 2500 points long, and the body 1504 points wide.
  const long = [{ shape: "planned", label: "H".repeat(400) }];
  await assert.rejects(pageOf(long), (error) => error.code === "edition_key_too_long");
});
