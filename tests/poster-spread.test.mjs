import assert from "node:assert/strict";
import test from "node:test";
import { openings } from "../src/breaks.mjs";
import { validateModel } from "../src/model/load.mjs";
import { wordsOf } from "../src/locale.mjs";
import { SPREAD_OPENING, setWidth, spreadOf } from "../src/poster/spread.mjs";
import { loadTypefaces } from "../src/poster/text.mjs";
import { HOUSE_STYLE } from "../src/poster/tokens.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { INDIGO, part, platesIn } from "./fixtures/strips.mjs";

// In a language written without spaces between words, a part's details are set as a justified paragraph is: lines
// filled by the width Typst sets them in, no last line of one character alone, and every line but a detail's last
// spread to one measure unless its slack is more than a tenth of an em for each place it opens. Other languages keep
// their details flush left.

const typefaces = await loadTypefaces();

const LONG =
  "每个视图排成图册正文区的一幅图版，三种宽度里取连线不变差的最窄一档，或保持全宽并把概述排在图的上方，再把每幅图版和总览排成一册";

/** Two parts and one relation in a language; the first part carries the given details. */
const modelIn = (locale, details) =>
  validateModel(
    minimalModel({
      locale,
      components: [
        { id: "a", label: locale === "en" ? "Plate composer" : "图版编排", details },
        { id: "b", label: locale === "en" ? "Words" : "用语" },
      ],
      relations: [{ id: "a-b", from: "a", to: "b", label: locale === "en" ? "reads" : "读取" }],
    }),
  );

/** A strip style in which part `a` owns one file. */
const strips = () => {
  const parts = new Map([["a", part([["src/a.mjs", 3000, 0]])]]);
  return { name: "strip", tokens: INDIGO, parts, most: 3000, bands: { spans: [604800, 7776000] } };
};

/** The runs of a plate that set part of the given text, top to bottom. */
const linesOf = (plate, text) =>
  plate.runs
    .filter(
      (run) => run.text.length > 1 && text.includes(run.text.replace(/^[^：:]+[：:]\s?/u, "")),
    )
    .sort((a, b) => a.baseline - b.baseline);

test("a justified line opens after each unspaced character and at each space, but not after its last character", () => {
  // Typst 0.15.1 opens this line in eight places: after 存, 放, the colon, the first list mark, 解, 析 and 器, and at
  // the space; not inside a word of letters, and not after the mark that ends it.
  assert.equal(openings("存放：Archify、LikeC4 解析器、"), 8);
  assert.equal(openings("check, build and import"), 3);
  assert.equal(openings("compare-and-swap"), 0);
  assert.equal(openings("版"), 0);
});

test("every line but a detail's last is spread, unless its slack is more than a tenth of an em for each place it opens", () => {
  const style = { size: 10 };
  const widthOf = (line) => Array.from(line).length * style.size;
  assert.equal(SPREAD_OPENING, 0.1);
  // At a measure of 104, one detail of three lines: ten characters, which open under a twentieth of an em in each
  // of nine places; nine, which would open over a sixth; and its last. Then a detail of one line.
  const details = [
    ["一二三四五六七八九十", "一二三四五六七八九", "一二三"],
    ["一二三四五六七八九十"],
  ];
  assert.deepEqual(spreadOf(details, 104, style, widthOf, true), [
    { set: 100, measure: 104 },
    { set: 90 },
    { set: 30 },
    { set: 100 },
  ]);
  // A line with no place to open, and one already wider than its measure, are set as they are.
  assert.deepEqual(
    spreadOf([["abcdefghij", "一二三四五六七八九十一", "一"]], 104, style, widthOf, true),
    [{ set: 100 }, { set: 110 }, { set: 10 }],
  );
  // A language that separates its words by spaces spreads nothing, and keeps the engine's own measure.
  assert.deepEqual(spreadOf(details, 104, style, widthOf, false), [null, null, null, null]);
});

test("a run is drawn as wide as its measure when it is spread, else as the width it names, else as its text", () => {
  const faces = { measure: (text) => text.length * 10 };
  assert.equal(setWidth({ value: "abc", style: {}, set: 28, measure: 64 }, faces), 64);
  assert.equal(setWidth({ value: "abc", style: {}, set: 28 }, faces), 28);
  assert.equal(setWidth({ value: "abc", style: {} }, faces), 30);
});

/** The width Typst sets a run's line in, as the engine reads it from the faces. */
const typeset = (run) => typefaces.typesetWidth(run.text, run);

/** How much a run's line opens in each place when it is spread to its measure, in ems of its size. */
const openingOf = (run) => (run.measure - typeset(run)) / openings(run.text) / run.size;

test("a Chinese strip plate spreads a part's detail lines to one measure and leaves the last flush left", async () => {
  const {
    plates: [plate],
  } = await platesIn(modelIn("zh-CN", { 编排: [LONG] }), strips());
  const lines = linesOf(plate, `编排：${LONG}`);
  assert.ok(lines.length >= 3, `the detail set ${lines.length} lines`);
  const spread = lines.slice(0, -1);
  for (const run of spread) {
    assert.ok(run.measure > 0, `"${run.text}" names no measure`);
    const opening = openingOf(run);
    assert.ok(opening >= 0 && opening <= SPREAD_OPENING, `"${run.text}" opens ${opening} em`);
  }
  assert.equal(new Set(spread.map(({ measure }) => measure)).size, 1);
  assert.equal(new Set(spread.map(({ x }) => x)).size, 1);
  assert.equal(lines.at(-1).measure, undefined);
  // The part's counts are placed by the width Typst sets them in, so they end at the box's edge, where a measure as
  // wide as the box ends too; the CJK face alone measures them wider, and would leave them short of it.
  const counts = plate.runs.find(({ text }) => text === "1 个文件，3 KB");
  assert.ok(Math.abs(counts.x + typeset(counts) - (spread[0].x + spread[0].measure)) < 0.01);
  // The counts report the width they are set in, which the edition holds Typst to; the CJK face alone measures
  // their digits and letters wider.
  assert.ok(Math.abs(counts.width - typeset(counts)) < 0.01, `the counts report ${counts.width}`);
  assert.ok(typefaces.measure(counts.text, counts) > counts.width + 1);
  // Names, captions and relation labels are never spread.
  for (const run of plate.runs.filter((run) => !lines.includes(run)))
    assert.equal(run.measure, undefined);
});

test("a Chinese card plate spreads each detail's lines but its last", async () => {
  const {
    plates: [plate],
  } = await platesIn(
    modelIn("zh-CN", { 编排: [LONG], 记录: ["每幅图版没有通过的平衡门禁"] }),
    HOUSE_STYLE,
  );
  const lines = linesOf(plate, `编排：${LONG}`);
  assert.ok(lines.length >= 3);
  assert.ok(lines.slice(0, -1).every(({ measure }) => measure > 0));
  assert.equal(lines.at(-1).measure, undefined);
  // The second detail takes one line, which is its last.
  const [record] = plate.runs.filter(({ text }) => text.startsWith("记录："));
  assert.equal(record.measure, undefined);
});

test("a mixed line takes all its measure holds as Typst sets it, more than the CJK face alone would allow", async () => {
  // Letters are set in Source Sans 3, narrower than the CJK face's own: a line with both is filled by its typeset
  // width, so it ends within a character of its measure and opens little when it is spread.
  const mixed = {
    存放: ["Archify、LikeC4 解析器、字体与版式字体，以及每一种随附物料各自的许可文本和来源说明"],
  };
  const {
    plates: [plate],
  } = await platesIn(modelIn("zh-CN", mixed), strips());
  const [first] = plate.runs.filter(({ text }) => text.startsWith("存放："));
  assert.ok(first.measure > 0, `"${first.text}" names no measure`);
  const slack = first.measure - typeset(first);
  assert.ok(slack >= 0 && slack < first.size + 0.01, `the line is ${slack} short of its measure`);
  assert.ok(
    typefaces.measure(first.text, first) > first.measure,
    "the CJK face alone measures it wider than its measure",
  );
  // Every line of the detail, spread or not, reports the width it is set in, which the edition holds Typst to.
  const lines = linesOf(plate, `存放：${mixed.存放[0]}`);
  assert.ok(lines.length >= 2 && lines.at(-1).measure === undefined);
  for (const run of lines)
    assert.ok(Math.abs(run.width - typeset(run)) < 0.01, `"${run.text}" reports ${run.width}`);
});

test("a list's items break as a paragraph's words do, so a line holds what its measure takes", async () => {
  const items = [
    "发现并登记客户端",
    "收敛它们的配置",
    "规划每一步改动",
    "应用并保留快照",
    "检视差异",
    "验证结果",
  ];
  const {
    plates: [plate],
  } = await platesIn(modelIn("zh-CN", { 操作: items }), strips());
  const [first] = plate.runs.filter(({ text }) => text.startsWith("操作："));
  assert.ok(
    first.measure - typeset(first) < first.size + 0.01,
    "the first line ends within a character",
  );
  // Kept whole, the items would leave the first line more than a character short of the same measure.
  const [whole] = typefaces.detailLines(wordsOf("zh-CN"), "操作", items, first.measure, first);
  assert.ok(first.measure - typefaces.typesetWidth(whole, first) > first.size);
  assert.ok(first.text.length > whole.length);
});

/** A detail named 编排 wrapped as a paragraph at 20 px, where a Han character is 20 px wide. */
const paragraph = (values, width = 201, name = "编排") =>
  typefaces.detailParagraph(wordsOf("zh-CN"), name, values, width, {
    size: 20,
    weight: 400,
    line: 28,
  });

test("an orphan does not make a line: a detail's last line of one character takes the unit before it", () => {
  // Ten characters fill the measure, so an eleventh would stand alone on the last line. With or without the marks
  // around it, it takes the tenth, and the line above is left a character short.
  assert.deepEqual(paragraph(["一二三四五六七八"]), ["编排：一二三四五六", "七八"]);
  assert.deepEqual(paragraph(["一二三四五六七八。"]), ["编排：一二三四五六", "七八。"]);
  assert.deepEqual(paragraph(["一二三四五六七（八）"]), ["编排：一二三四五六", "七（八）"]);
  // The unit before it may be a word of letters, which joins it whole.
  assert.deepEqual(paragraph(["一二三四 npm 包"]), ["编排：一二三四", "npm 包"]);
});

test("two characters make a last line, and so does a word of letters", () => {
  assert.deepEqual(paragraph(["一二三四五六七八九"]), ["编排：一二三四五六七", "八九"]);
  assert.deepEqual(paragraph(["一二三四五六七 npm"]), ["编排：一二三四五六七", "npm"]);
});

test("an orphan keeps its line where it and the unit before it would overrun the measure", () => {
  // The word before the orphan is 82 px wide and the orphan with its space 34 px, more than 110 px together.
  assert.deepEqual(paragraph(["abcdefghi 包。"], 110, "i"), ["i：abcdefghi", "包。"]);
  // A line above of one unit keeps it: the orphan would have followed it there had the two fitted.
  assert.deepEqual(paragraph(["包"], 55, "npm"), ["npm：", "包"]);
});

test("a line broken early before a long word stays flush left", async () => {
  // A list item is kept whole: the long second item does not fit beside the first, so the first line ends early,
  // well short of its measure, though it is not its detail's last line.
  const early = { 命令: ["排成每幅图版", "compare-and-swap-then-record-the-proof-set", "归档"] };
  const {
    plates: [plate],
  } = await platesIn(modelIn("zh-CN", early), strips());
  const first = plate.runs.find(({ text }) => text.startsWith("命令："));
  const later = plate.runs.filter(({ baseline }) => baseline > first.baseline);
  assert.equal(first.text, "命令：排成每幅图版、");
  assert.ok(later.some(({ text }) => text.includes("compare-and-swap")));
  assert.equal(first.measure, undefined);
});

test("an English plate spreads nothing", async () => {
  const english = {
    composes: [
      "each view as one plate for the edition's body, at the narrowest of three widths that wires no worse",
    ],
  };
  for (const style of [strips(), HOUSE_STYLE]) {
    const {
      plates: [plate],
    } = await platesIn(modelIn("en", english), style);
    assert.ok(plate.runs.filter(({ text }) => /narrowest|composes/u.test(text)).length >= 1);
    assert.ok(plate.runs.every(({ measure }) => measure === undefined));
  }
});
