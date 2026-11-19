import assert from "node:assert/strict";
import test from "node:test";
import { editionWordsOf } from "../src/edition/words.mjs";
import { LOCALES } from "../src/locale.mjs";
import { validateModel } from "../src/model/load.mjs";
import { HOUSE } from "../src/poster/tokens.mjs";
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
 * page sets them. A row's number is its first text; the overview's entry, numbered 00, is no row.
 */
function rowsOn(set, page) {
  const rows = [];
  for (const box of set.boxes.filter((one) => one.page === page)) {
    const row = rows.find((one) => near(one.left, box.left) && near(one.top, box.top));
    if (row) row.texts.push(box.text);
    else rows.push({ left: box.left, top: box.top, texts: [box.text] });
  }
  return rows.filter(({ texts }) => /^\d\d$/u.test(texts[0]) && texts[0] !== "00");
}

/** The left half's blocks of the contents' first page: each block's first text, with where its first line stands. */
const blocksOn = (set, page) =>
  set.boxes.filter((box) => box.page === page && near(box.left, MARGIN) && box.top > bodyTop);

test("the overview is no row: its entry opens the left half, and the rows are the plates alone", async (t) => {
  const model = modelOf();
  const record = recordOf({ model, plates: plates(contentsRows) });
  // The record: the overview's entry as a row has it, a number, a name and one line, here the claim the model
  // states; the lead stands on the overview's own page. And a row a plate.
  assert.deepEqual(record.front, {
    number: "00",
    title: "Overview",
    claim: model.overview.claim,
  });
  assert.deepEqual(
    Object.keys(record.rows),
    plates(contentsRows).map(({ page }) => `plate-${two(page)}`),
  );
  assert.equal("facts" in record, false, "the contents set no facts beside the rows");

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
  // The first page's rows stand in its right half, one height each, and share the body.
  const pitch = BODY / contentsRows;
  for (const [index, row] of rows.entries()) {
    assert.ok(near(row.left, RIGHT), `row ${index + 1} stands at ${row.left}`);
    assert.ok(near(row.top - rows[0].top, index * pitch), `row ${index + 1} at ${row.top}`);
  }
  // The left half: the overview's entry first, then the scope, the limits and the reading note.
  const blocks = blocksOn(set, 2);
  assert.deepEqual(
    blocks.map(({ text }) => text),
    ["00", "Overview", "SCOPE", "WHAT IT LEAVES OUT", "READING THIS EDITION"],
  );
  // Each block's first words stand on the baseline of a row's title, and its rule on that row's rule.
  const baseline = pitch / 2 - 2;
  const lines = blocks.slice(1).map(({ top }) => (top - bodyTop - baseline) / pitch);
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
    led.filter((to) => typeof to === "number"),
    plates(contentsRows).map(({ page }) => pageOf.get(`plate-${two(page)}`)),
  );
  assert.equal(led.filter((to) => to === "plate-00").length, 1);
  assert.deepEqual([pageOf.get("plate-00"), pageOf.get("plate-01")], [3, 4]);
  // One page of contents says no range of plates.
  assert.ok(!set.boxes.some(({ text }) => /^Plates /u.test(text)));
});

test("a half takes eleven rows; one plate more takes a second page, and every row keeps one height", async (t) => {
  assert.equal(contentsRows, 11);
  // Without an overview the left half begins with the scope, on the first row's line.
  const model = modelOf({ overview: undefined });
  const set = await evalEdition(t, { model, plates: plates(contentsRows + 1) }, SET);
  assert.equal(set.pages, 1 + 2 + (contentsRows + 1) + 1);
  const [first, second] = [rowsOn(set, 2), rowsOn(set, 3)];
  const halves = (rows) => [
    rows.filter(({ left }) => near(left, MARGIN)).map(({ texts }) => texts[0]),
    rows.filter(({ left }) => near(left, RIGHT)).map(({ texts }) => texts[0]),
  ];
  assert.deepEqual(halves(first), [[], ["01", "02", "03", "04"]]);
  assert.deepEqual(halves(second), [
    ["05", "06", "07", "08"],
    ["09", "10", "11", "12"],
  ]);
  for (const rows of [first, second.slice(0, 4), second.slice(4)])
    for (const [index, row] of rows.entries())
      assert.ok(near(row.top - rows[0].top, (index * BODY) / 4), `a row at ${row.top}`);
  assert.deepEqual(
    blocksOn(set, 2).map(({ text }) => text),
    ["SCOPE", "WHAT IT LEAVES OUT", "READING THIS EDITION"],
  );
  assert.ok(near(blocksOn(set, 2)[0].top, bodyTop + BODY / 8 - 2));
});

test("28 plates take two full pages of contents, each with its foot and the plates it lists", async (t) => {
  const model = modelOf();
  const set = await evalEdition(t, { model, plates: plates(28) }, SET);
  assert.equal(set.pages, 1 + 2 + 1 + 28 + 1);
  const pitch = BODY / 10;
  const numbers = (rows, left) =>
    rows.filter((row) => near(row.left, left)).map(({ texts }) => texts[0]);
  const range = (from, to) =>
    Array.from({ length: to - from + 1 }, (_, index) => two(from + index));
  const [first, second] = [rowsOn(set, 2), rowsOn(set, 3)];
  // The rows are shared out over three halves; the second page sets rows in both of its halves.
  assert.deepEqual(numbers(first, MARGIN), []);
  assert.deepEqual(numbers(first, RIGHT), range(1, 10));
  assert.deepEqual(numbers(second, MARGIN), range(11, 20));
  assert.deepEqual(numbers(second, RIGHT), range(21, 28));
  // Every row of both pages has one height, and each half begins at the body's top.
  for (const rows of [first, second.slice(0, 10), second.slice(10)]) {
    assert.ok(near(rows[0].top, first[0].top), `a half begins at ${rows[0].top}`);
    for (const [index, row] of rows.entries())
      assert.ok(near(row.top - rows[0].top, index * pitch), `a row at ${row.top}`);
  }
  // Each page has its title and its foot, and says which plates it lists; the first, how many there are.
  const foot = recordOf({ model, plates: plates(28) }).words.foot;
  const texts = (page) => set.boxes.filter((box) => box.page === page).map(({ text }) => text);
  for (const page of [2, 3]) {
    assert.ok(texts(page).includes("Contents"), `page ${page} has no title`);
    assert.equal(texts(page).filter((text) => text === foot).length, 1, `page ${page}'s foot`);
  }
  assert.ok(texts(2).includes("Plates 01–10 of 28"), texts(2).join(" | "));
  assert.ok(texts(3).includes("Plates 11–28"), texts(3).join(" | "));
  // Every row is a link to its plate, on both pages.
  const led = set.links.filter(({ page, to }) => [2, 3].includes(page) && typeof to === "number");
  assert.deepEqual(
    led.map(({ to }) => to),
    plates(28).map(({ page }) => page + 4),
  );
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

test("the reading note names the last page, and the page in a browser by the word the last page uses", () => {
  assert.equal(
    editionWordsOf("en").readingNote(true, "minimal.html"),
    "Each plate answers the question under its title. A card's title links to the file it was read from. The last page lists every part by name with its plates. The page minimal.html cites every claim.",
  );
  assert.equal(
    editionWordsOf("zh-CN").readingNote(true, "minimal.html"),
    "每幅图版回答标题下的问题，卡片标题链接到所依据的文件。末页按名称列出组件及其所在图版。网页 minimal.html 为每项陈述注明出处。",
  );
  for (const locale of LOCALES) {
    const words = editionWordsOf(locale);
    const note = words.readingNote(false, "minimal.html").toLowerCase();
    // The word that labels the page under the index stands directly before the page's name.
    assert.ok(note.includes(`${words.page.toLowerCase()} minimal.html`), `${locale}: ${note}`);
    assert.equal(recordOf({ model: modelOf({ locale }) }).words.readingNote.toLowerCase(), note);
  }
});
