import assert from "node:assert/strict";
import test from "node:test";
import { editionRecord } from "../src/edition/record.mjs";
import { typesetEdition } from "../src/edition/typeset.mjs";
import { loadIcons } from "../src/icons.mjs";
import { validateModel } from "../src/model/load.mjs";
import { HOUSE } from "../src/poster/tokens.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { readPng } from "./fixtures/png.mjs";

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
  { shape: "ticks", count: 3, length: 10, gap: 5, weight: 1.6, color: "#617465", label: "HHHH" },
  { shape: "hub", color: "#334965", weight: 1.6, arrow: 8, label: "HHHH" },
  { shape: "boundary", label: "HHHH" },
  { shape: "planned", label: "HHHH" },
];
const CARDS = [
  { icon: "terminal", color: "#324f3e", label: "HHHH" },
  { shape: "boundary", label: "HHHH" },
];

/** The first page picture of a one-plate edition whose key holds the given marks, in a language. */
async function pageOf(legend, locale = "en") {
  const model = validateModel(minimalModel({ locale, editors: [{ name: "Yang HENG" }] }));
  const plates = [
    {
      page: 1,
      views: ["view-1"],
      width: 2256,
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
    owned: new Map(),
    files: 0,
    modelSha256: "0".repeat(64),
    publisher: "0.13.1",
    typst: "0.15.1",
    overview: false,
    page: "minimal.html",
    commit: null,
    release: null,
  });
  const typeset = await typesetEdition({
    record,
    plates,
    modelBytes: Buffer.from(JSON.stringify(model)),
    composition: null,
    revision: null,
    date: "2026-11-06",
    time: 1793918078,
    widths: [2400],
  });
  return readPng(typeset.png[0].bytes);
}

/**
 * The key's line of a page picture: each run of inked columns between the body's foot and the foot's rule, with the
 * rows its ink covers. A mark and its label stand 5 points apart and two entries 20; the letters of a label and the
 * dashes of a mark stand 3 points apart at most, so columns within 4 points of each other are one run.
 */
function keyOf(image) {
  const { width, channels, pixels } = image;
  const [top, bottom] = [
    Math.round(HOUSE.edition.bodyBottom * PX) + 2,
    Math.round(HOUSE.edition.rule * PX) - 4,
  ];
  const paper = pixels[(top * width + 8) * channels];
  const inked = (x, y) => Math.abs(pixels[(y * width + x) * channels] - paper) > 24;
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
