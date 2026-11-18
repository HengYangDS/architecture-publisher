import assert from "node:assert/strict";
import test from "node:test";
import { checkOverview } from "../src/overview/typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { groupedWork, typesetWork } from "./fixtures/pinned-face.mjs";
import { inkLines, readPng } from "./fixtures/png.mjs";

// A text of the overview that takes more than one line is justified, as the edition's prose is: its lines end at one
// edge and its last line is set short. The owner asked for justified paragraphs on 2026-11-07, 2026-11-12 and
// 2026-11-13, and again on 2026-11-18 on seeing an overview whose notes were set ragged. A name, a heading and a
// term are labels and stay as they are set.

/** A page image's pixels per point. */
const WIDTH = 2400;
const PX = WIDTH / 1600;

/** A statement of six steps whose first says `text` under the course, and a headed list whose item says `item`. */
const statement = (text, item) => ({
  claim: "A claim",
  lead: "A lead.",
  course: {
    steps: [
      { id: "one", label: "One", text },
      ...["two", "three", "four", "five", "six"].map((id) => ({ id, label: id })),
    ],
  },
  blocks: [{ title: "Terms", items: [["term", item]] }],
});

/** The lines of ink of the overview's text `said`, in the page image of a small edition that states `stated`. */
async function linesOf(stated, said, locale = "en") {
  return (await inked(stated, said, locale)).lines;
}

/** The same lines with the page's image and the text's region in it, for a closer look at one line. */
async function inked(stated, said, locale = "en") {
  const work = await groupedWork();
  const model = { ...work.model, locale };
  const { boxes } = await checkOverview({
    modelBytes: Buffer.from(JSON.stringify(minimalModel({ overview: stated, locale }))),
    revision: null,
    date: "2026-11-10",
  });
  const box = boxes.find(({ text }) => text === said);
  assert.ok(box, `the overview sets no text "${said.slice(0, 30)}…"`);
  const typeset = await typesetWork({ ...work, model }, stated, [WIDTH]);
  const page = typeset.png.find(({ file }) => file.startsWith("images/00-overview"));
  const image = readPng(page.bytes);
  const region = {
    left: Math.floor(box.x * PX) - 2,
    right: Math.ceil((box.x + box.w) * PX) + 6,
    top: Math.floor(box.y * PX) - 2,
    bottom: Math.ceil((box.y + box.h) * PX) + 2,
  };
  return { image, region, lines: inkLines(image, region), size: box.size };
}

/** How many gaps of a line's ink are wider than three tenths of an em: a line pulled apart has one after each character. */
const open = (image, region, line, size) =>
  gapsOf(image, region, line).filter((gap) => gap > 0.3 * size * PX).length;

/** The widths in pixels of the gaps of paper between a line's ink, left to right. */
function gapsOf({ width, channels, pixels }, { left, right }, line) {
  const inked = (x) => {
    for (let y = line.top; y <= line.bottom; y += 1)
      if (pixels[(y * width + x) * channels] < 192) return true;
    return false;
  };
  const gaps = [];
  let last = -1;
  for (let x = left; x < right; x += 1) {
    if (!inked(x)) continue;
    if (last >= 0 && x - last > 1) gaps.push(x - last - 1);
    last = x;
  }
  return gaps;
}

/** How far apart the right ends of every line but the last lie, and how short the last falls. */
function edges(lines) {
  const rights = lines.slice(0, -1).map(({ right }) => right);
  return {
    spread: Math.max(...rights) - Math.min(...rights),
    short: Math.max(...rights) - lines.at(-1).right,
  };
}

const ENGLISH =
  "Alpha calls Beta, and Beta answers it with the result it has stored. The reviewer reads the answer under the course, compares it with what the repository holds at its pinned revision and accepts the delivery by name.";
const CHINESE =
  "租约把持有者、代次和到期时间都记在仓库的状态库里，每条通道只有一个持有者；通道可以续约、恢复或接管，也可以结束旧租约后再重新开始。";

test("a step's text that takes several lines is justified, its last line short", async () => {
  const lines = await linesOf(statement(ENGLISH, "short"), ENGLISH);
  assert.ok(lines.length >= 4, `the text set ${lines.length} lines`);
  const { spread, short } = edges(lines);
  assert.ok(spread <= 6, `the lines end ${spread} px apart`);
  assert.ok(short > 30, "the last line is set short, not stretched");
});

test("a step's text in Chinese is spread between its characters to one edge", async () => {
  const { image, region, lines, size } = await inked(statement(CHINESE, "短"), CHINESE, "zh-CN");
  assert.ok(lines.length >= 4, `the text set ${lines.length} lines`);
  const { spread, short } = edges(lines);
  // A line that ends in a full-width mark inks less than its measure by part of that mark's width.
  assert.ok(spread <= 12, `the lines end ${spread} px apart`);
  assert.ok(short > 30, "the last line is set short, not stretched");
  for (const [index, line] of lines.entries())
    assert.ok(open(image, region, line, size) <= 4, `line ${index + 1} is pulled apart`);
});

test("a line of Han before a word that does not fit beside it is left short, not pulled apart", async () => {
  // In a ninth of the page ten characters stand before a word that does not fit on their line. Spread to the measure
  // they would stand a quarter of an em apart, more than the tenth of an em a part's details open: the line stays
  // as it is set, as such a line of a part's details does.
  const text = "受版本管理的意图只有 OpenSpec 一处；一项正式变更编译成一个 Commitment。";
  const stated = statement(text, "短");
  stated.course.steps.push(...["seven", "eight", "nine"].map((id) => ({ id, label: id })));
  const { image, region, lines, size } = await inked(stated, text, "zh-CN");
  assert.ok(lines.length >= 3, `the text set ${lines.length} lines`);
  for (const [index, line] of lines.entries())
    assert.ok(open(image, region, line, size) <= 4, `line ${index + 1} is pulled apart`);
  const widest = Math.max(...lines.map(({ right }) => right));
  assert.ok(widest - lines[0].right > 30, "the first line is left short of the measure");
});

test("a word wider than its column takes rows of its own, and a mark alone is no orphan", async () => {
  // `compare-and-swap` is wider than a ninth of the page: Typst breaks it after a hyphen, and the rows follow at
  // the text's pitch. The last line, a Latin word with its full stop, is no single character left alone: the
  // character before it stays on its own line.
  const text =
    "每次改动都是一次精确的 compare-and-swap-with-an-expected-head，之后再编译成一个 Commitment。";
  const stated = statement(text, "短");
  stated.course.steps.push(...["seven", "eight", "nine"].map((id) => ({ id, label: id })));
  const { lines, size } = await inked(stated, text, "zh-CN");
  assert.ok(lines.length >= 4, `the text set ${lines.length} lines`);
  // Rows at one pitch: no two lines of ink closer than three quarters of the text's size.
  for (let index = 1; index < lines.length; index += 1)
    assert.ok(
      lines[index].top - lines[index - 1].top >= 0.75 * size * PX,
      `lines ${index} and ${index + 1} stand ${lines[index].top - lines[index - 1].top} px apart`,
    );
});

test("a text on one line, a heading and a term are set as they are, not spread", async () => {
  const lines = await linesOf(statement("One short line.", "short"), "One short line.");
  assert.equal(lines.length, 1);
  // The line ends where its words end: far short of its step's span, a sixth of the page.
  assert.ok(lines[0].right < (48 + 150) * PX, `the line reaches ${lines[0].right} px`);
});
