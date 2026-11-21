import assert from "node:assert/strict";
import test from "node:test";
import { editionWordsOf } from "../src/edition/words.mjs";
import { LOCALES } from "../src/locale.mjs";
import { validateModel } from "../src/model/load.mjs";
import { HOUSE } from "../src/house.mjs";
import { SET, evalEdition, plateOf, recordOf } from "./fixtures/edition-typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";

const { bodyTop, bodyBottom, contentsRows } = HOUSE.edition;
const BODY = bodyBottom - bodyTop;
const MARGIN = HOUSE.page.margin;
/** A page of rows has two halves, a gap of 56 points between them. */
const HALF = (HOUSE.page.width - 2 * MARGIN - 56) / 2;
const RIGHT = MARGIN + HALF + 56;
const near = (a, b) => Math.abs(a - b) < 0.6;
const two = (number) => String(number).padStart(2, "0");
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => two(from + index));
/** The numbers of the rows that stand in each half of a page: the left, then the right. */
const halves = (rows) => [
  rows.filter(({ left }) => near(left, MARGIN)).map(({ texts }) => texts[0]),
  rows.filter(({ left }) => near(left, RIGHT)).map(({ texts }) => texts[0]),
];
/**
 * The rules that close the contents' rows, one under the last row of each half: its page, its half and how far
 * below the body's top. The contents stand on the pages before the fourth; the index closes its own halves.
 */
const closing = (set) =>
  set.ends
    .filter(({ page }) => page < 4)
    .map(({ page, left, top, length }) => ({
      page,
      half: near(left, MARGIN) ? "left" : near(left, RIGHT) ? "right" : left,
      lines: Math.round(((top - bodyTop) / (BODY / contentsRows)) * 100) / 100,
      length,
    }));

/** The test model: with an overview, a scope and a limit unless `extra` takes them away. */
const modelOf = (extra = {}) =>
  validateModel(
    minimalModel({
      overview: everyBlock(),
      scope: "The two parts and the one call between them.",
      limits: ["Nothing outside the two parts."],
      repository: {
        name: "minimal",
        url: "https://github.com/o/minimal.git",
        revision: "a".repeat(40),
      },
      ...extra,
    }),
  );
const plates = (count) => Array.from({ length: count }, (_, index) => plateOf(index + 1));

/**
 * The rows of one contents page: each with the half it stands in, its top and the texts it sets, in the order the
 * page sets them. A row's number is its first text; the overview's entry prints no number and is no row.
 */
function rowsOn(set, page) {
  const rows = [];
  for (const box of set.boxes.filter((one) => one.page === page)) {
    const row = rows.find((one) => near(one.left, box.left) && near(one.top, box.top));
    if (row) row.texts.push(box.text);
    else rows.push({ left: box.left, top: box.top, texts: [box.text] });
  }
  return rows.filter(({ texts }) => /^\d\d$/u.test(texts[0]));
}

/** The left half's blocks of the contents' first page: each block's first text, with where its first line stands. */
const blocksOn = (set, page) =>
  set.boxes.filter((box) => box.page === page && near(box.left, MARGIN) && box.top > bodyTop);

test("the overview is no row: its entry opens the left half, and the rows are the plates alone", async (t) => {
  const model = modelOf();
  const record = recordOf({ model, plates: plates(contentsRows) });
  // The record: the overview's entry, where it leads, its name and one line, here the claim the model states,
  // and no number; the lead stands on the overview's own page. The rows are the plates themselves.
  assert.deepEqual(record.front, {
    key: "plate-00",
    title: "Overview",
    claim: model.overview.claim,
  });
  assert.deepEqual(
    record.plates.map(({ key }) => key),
    plates(contentsRows).map(({ page }) => `plate-${two(page)}`),
  );
  assert.equal("facts" in record, false, "the contents set no facts beside the rows");
  assert.equal("rows" in record, false, "the rows are stated twice");

  const set = await evalEdition(t, { model, plates: plates(contentsRows) }, SET);
  // Title page, one page of contents, the overview, the plates, the index.
  assert.equal(set.pages, 1 + 1 + 1 + contentsRows + 1);
  const pageOf = new Map(set.outlined);
  const rows = rowsOn(set, 2);
  // A row is a plate's number, title and question, and nothing else: no page number.
  assert.deepEqual(
    rows.map(({ texts }) => texts),
    plates(contentsRows).map(({ page }) => [
      two(page),
      `View ${page}`,
      `What does view ${page} show?`,
    ]),
  );
  // The first page's rows stand in its right half, each a tenth of the body high; ten fill the half, and one rule
  // closes them at its foot.
  const pitch = BODY / contentsRows;
  for (const [index, row] of rows.entries()) {
    assert.ok(near(row.left, RIGHT), `row ${index + 1} stands at ${row.left}`);
    assert.ok(near(row.top - rows[0].top, index * pitch), `row ${index + 1} at ${row.top}`);
  }
  // The left half: the overview's entry first, then the scope, the limits and the reading note.
  const blocks = blocksOn(set, 2);
  assert.deepEqual(
    blocks.map(({ text }) => text),
    ["OVERVIEW", "SCOPE", "WHAT IT LEAVES OUT", "READING THIS EDITION"],
  );
  // The entry is headed as the notes are, and no number on the page stands outside a row: a number in a plate's
  // form beside the rows reads as a plate.
  assert.equal(new Set(blocks.map(({ size }) => size)).size, 1);
  const numbers = set.boxes.filter(({ page, text }) => page === 2 && /^\d\d$/u.test(text));
  assert.deepEqual(
    numbers.map(({ text }) => text),
    rows.map(({ texts }) => texts[0]),
  );
  // Each block's first words stand on the baseline of a row's title, and its rule on that row's rule.
  const baseline = pitch / 2 - 2;
  const lines = blocks.map(({ top }) => (top - bodyTop - baseline) / pitch);
  for (const line of lines) assert.ok(near(line * pitch, Math.round(line) * pitch), `line ${line}`);
  assert.ok(near(lines[0], 0), `the first block begins on line ${lines[0]}`);
  assert.deepEqual(
    [...lines].sort((a, b) => a - b),
    lines,
  );
  assert.equal(new Set(lines.map(Math.round)).size, 4, "two blocks begin on one line");
  const rules = set.rules.filter(({ page }) => page === 2);
  assert.equal(rules.length, 4);
  for (const [index, rule] of rules.entries()) {
    // Typst writes a rule's length as a share of its container plus a length: "0% + 724pt".
    assert.equal(rule.length, `0% + ${HALF}pt`);
    assert.ok(near(rule.left, MARGIN), `rule from ${rule.left}`);
    assert.ok(near(rule.top, bodyTop + Math.round(lines[index]) * pitch), `rule at ${rule.top}`);
  }
  // The entry leads to the overview's page and every row to its plate's.
  const led = set.links.filter(({ page }) => page === 2).map(({ to }) => to);
  assert.deepEqual(
    led.filter((to) => /^plate-\d\d$/u.test(String(to)) && to !== "plate-00"),
    plates(contentsRows).map(({ page }) => `plate-${two(page)}`),
  );
  assert.equal(led.filter((to) => to === "plate-00").length, 1);
  assert.deepEqual([pageOf.get("plate-00"), pageOf.get("plate-01")], [3, 4]);
  // One page of contents does not say how many plates there are: its rows show it.
  assert.ok(!set.boxes.some(({ text }) => /^\d+ plates$/u.test(text)));
  assert.deepEqual(closing(set), [
    { page: 2, half: "right", lines: contentsRows, length: `0% + ${HALF}pt` },
  ]);
});

test("a half takes ten rows at one pitch; the eleventh stands alone on a second page, which is not filled", async (t) => {
  assert.equal(contentsRows, 10);
  const pitch = BODY / contentsRows;
  // Without an overview the left half begins with the scope, on the first row's line.
  const model = modelOf({ overview: undefined });
  const set = await evalEdition(t, { model, plates: plates(contentsRows + 1) }, SET);
  assert.equal(set.pages, 1 + 2 + (contentsRows + 1) + 1);
  const [first, second] = [rowsOn(set, 2), rowsOn(set, 3)];
  assert.deepEqual(halves(first), [[], range(1, contentsRows)]);
  assert.deepEqual(halves(second), [[two(contentsRows + 1)], []]);
  // The rows keep their order and one pitch; the row of the second page stands where a half begins, as high as any
  // other, and nothing is opened up to fill the page.
  for (const [index, row] of first.entries())
    assert.ok(near(row.top, bodyTop + index * pitch), `row ${index + 1} at ${row.top}`);
  assert.ok(near(second[0].top, bodyTop), `the second page's row at ${second[0].top}`);
  assert.deepEqual(closing(set), [
    { page: 2, half: "right", lines: contentsRows, length: `0% + ${HALF}pt` },
    { page: 3, half: "left", lines: 1, length: `0% + ${HALF}pt` },
  ]);
  // Each page says how many plates the edition has: which of them it lists, its rows show.
  const texts = (page) => set.boxes.filter((box) => box.page === page).map(({ text }) => text);
  for (const page of [2, 3]) assert.ok(texts(page).includes("11 plates"), texts(page).join(" | "));
  assert.deepEqual(
    blocksOn(set, 2).map(({ text }) => text),
    ["SCOPE", "WHAT IT LEAVES OUT", "READING THIS EDITION"],
  );
  assert.ok(near(blocksOn(set, 2)[0].top, bodyTop + pitch / 2 - 2));
});

test("fewer rows than a half takes keep its pitch: the rest of the half stays empty", async (t) => {
  const pitch = BODY / contentsRows;
  const set = await evalEdition(t, { model: modelOf(), plates: plates(6) }, SET);
  assert.equal(set.pages, 1 + 1 + 1 + 6 + 1);
  const rows = rowsOn(set, 2);
  assert.deepEqual(halves(rows), [[], range(1, 6)]);
  for (const [index, row] of rows.entries())
    assert.ok(near(row.top, bodyTop + index * pitch), `row ${index + 1} at ${row.top}`);
  assert.deepEqual(closing(set), [{ page: 2, half: "right", lines: 6, length: `0% + ${HALF}pt` }]);
  // The left half's blocks begin on the ten lines a half has, whatever the rows beside them.
  const lines = blocksOn(set, 2).map(({ top }) => (top - bodyTop - (pitch / 2 - 2)) / pitch);
  for (const line of lines) assert.ok(near(line * pitch, Math.round(line) * pitch), `line ${line}`);
});

test("28 plates take two pages of contents, each with its foot and the plates it lists", async (t) => {
  const model = modelOf();
  const set = await evalEdition(t, { model, plates: plates(28) }, SET);
  assert.equal(set.pages, 1 + 2 + 1 + 28 + 1);
  const pitch = BODY / 10;
  const numbers = (rows, left) =>
    rows.filter((row) => near(row.left, left)).map(({ texts }) => texts[0]);
  const [first, second] = [rowsOn(set, 2), rowsOn(set, 3)];
  // The rows stand in order over three halves; the second page sets rows in both of its halves, the last not full.
  assert.deepEqual(numbers(first, MARGIN), []);
  assert.deepEqual(numbers(first, RIGHT), range(1, 10));
  assert.deepEqual(numbers(second, MARGIN), range(11, 20));
  assert.deepEqual(numbers(second, RIGHT), range(21, 28));
  // Every row of both pages has one height, a tenth of the body, and each half begins at the body's top.
  for (const rows of [first, second.slice(0, 10), second.slice(10)]) {
    assert.ok(near(rows[0].top, first[0].top), `a half begins at ${rows[0].top}`);
    for (const [index, row] of rows.entries())
      assert.ok(near(row.top - rows[0].top, index * pitch), `a row at ${row.top}`);
  }
  // Each page has its title and its foot, and says how many plates there are.
  const foot = recordOf({ model, plates: plates(28) }).words.foot;
  const texts = (page) => set.boxes.filter((box) => box.page === page).map(({ text }) => text);
  for (const page of [2, 3]) {
    assert.ok(texts(page).includes("Contents"), `page ${page} has no title`);
    assert.equal(texts(page).filter((text) => text === foot).length, 1, `page ${page}'s foot`);
  }
  for (const page of [2, 3]) assert.ok(texts(page).includes("28 plates"), texts(page).join(" | "));
  assert.deepEqual(closing(set), [
    { page: 2, half: "right", lines: 10, length: `0% + ${HALF}pt` },
    { page: 3, half: "left", lines: 10, length: `0% + ${HALF}pt` },
    { page: 3, half: "right", lines: 8, length: `0% + ${HALF}pt` },
  ]);
  // Every row is a link to its plate, on both pages.
  const led = set.links.filter(
    ({ page, to }) =>
      [2, 3].includes(page) && /^plate-\d\d$/u.test(String(to)) && to !== "plate-00",
  );
  assert.deepEqual(
    led.map(({ to }) => to),
    plates(28).map(({ page }) => `plate-${two(page)}`),
  );
});

test("blocks that need more lines than a half has begin on half lines, the entry level with the first row", async (t) => {
  const pitch = BODY / contentsRows;
  // Four limits of two sentences need more than the ten lines of a half, and fit on its twenty half lines.
  const model = modelOf({
    limits: Array.from({ length: 4 }, (_, index) =>
      `Limit ${index + 1}: a sentence of the limits, at its length, set across the half. `
        .repeat(2)
        .trim(),
    ),
  });
  const set = await evalEdition(t, { model, plates: plates(3) }, SET);
  const lines = blocksOn(set, 2).map(({ top }) => (top - bodyTop - (pitch / 2 - 2)) / pitch);
  // The entry's name stands on the baseline of the first row's title, and every block on a line or a half line.
  assert.ok(near(lines[0] * pitch, 0), `the entry begins on line ${lines[0]}`);
  for (const line of lines)
    assert.ok(near(line * pitch, (Math.round(line * 2) / 2) * pitch), `line ${line}`);
  assert.ok(
    lines.some((line) => !near(line * pitch, Math.round(line) * pitch)),
    `every block stands on a whole line: ${lines.join(" ")}`,
  );
  // Each rule stands where a row's rule or the middle of a row is.
  for (const rule of set.rules.filter(({ page }) => page === 2)) {
    const at = (rule.top - bodyTop) / pitch;
    assert.ok(near(at * pitch, (Math.round(at * 2) / 2) * pitch), `a rule at line ${at}`);
  }
});

test("blocks that need nearly the whole height share what is left, the entry still level with the first row", async (t) => {
  const pitch = BODY / contentsRows;
  // Five limits of two sentences fit neither on the lines nor on the half lines of a half.
  const model = modelOf({
    limits: Array.from({ length: 5 }, (_, index) =>
      `Limit ${index + 1}: a sentence of the limits, at its length, set across the half. `
        .repeat(2)
        .trim(),
    ),
  });
  const set = await evalEdition(t, { model, plates: plates(3) }, SET);
  const lines = blocksOn(set, 2).map(({ top }) => (top - bodyTop - (pitch / 2 - 2)) / pitch);
  assert.ok(near(lines[0] * pitch, 0), `the entry begins on line ${lines[0]}`);
  assert.ok(
    lines.some((line) => !near(line * pitch, (Math.round(line * 2) / 2) * pitch)),
    `every block stands on a half line: ${lines.join(" ")}`,
  );
  // The blocks keep their order and stay inside the body.
  assert.deepEqual(
    [...lines].sort((a, b) => a - b),
    lines,
  );
  assert.ok(lines.at(-1) < contentsRows);
});

test("the page's name in the reading note is one word, which no line breaks", async (t) => {
  const whole = await evalEdition(
    t,
    { model: modelOf(), plates: plates(3) },
    "query(<archpub-page-name>).map(it => it.location().page())",
  );
  assert.deepEqual(whole, [2]);
});

test("a left half set too tall for the page is refused", async (t) => {
  const model = modelOf({
    limits: Array.from({ length: 14 }, (_, index) =>
      `Limit ${index + 1}: a sentence of the limits, at its length, set across the half. `
        .repeat(3)
        .trim(),
    ),
  });
  await assert.rejects(evalEdition(t, { model, plates: plates(3) }, SET), (error) =>
    /edition_front_too_long/u.test(error.stderr),
  );
});

test("the reading note names the index, and the page in a browser by the word the index's facts use", () => {
  assert.equal(
    editionWordsOf("en").readingNote(true, "minimal.html"),
    "Each plate answers the question under its title. A card's title links to the first of its files. The index at the end lists every part by name with the plates that draw it. The page minimal.html gives sources for the claims.",
  );
  assert.equal(
    editionWordsOf("zh-CN").readingNote(true, "minimal.html"),
    "每幅图版回答其标题下方的问题。卡片标题链接到卡片所依据的第一个文件。册末索引按名称列出全部组件及其所在图版。陈述的出处见网页 minimal.html。",
  );
  for (const locale of LOCALES) {
    const words = editionWordsOf(locale);
    const note = words.readingNote(false, "minimal.html").toLowerCase();
    // The word that labels the page under the index stands directly before the page's name.
    assert.ok(note.includes(`${words.page.toLowerCase()} minimal.html`), `${locale}: ${note}`);
    // The record states the note about the page's name, which is one word of it.
    const { before, name, after } = recordOf({ model: modelOf({ locale }) }).words.readingNote;
    assert.equal(name, "minimal.html");
    assert.equal(`${before}${name}${after}`.toLowerCase(), note);
  }
});
