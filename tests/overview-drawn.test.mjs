import assert from "node:assert/strict";
import test from "node:test";
import { checkOverview } from "../src/overview/typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";

// The publisher draws the overview from what the model states, and from nothing an author places. Every text of the
// statement is set, inside the live area and over no other text; a mark carries one meaning; a statement too tall
// for its page is refused, naming the first block that does not fit.

/** The overview drawn alone from a minimal model that states `statement`. */
function drawn(statement, writtenFrom = null) {
  const model = minimalModel({ overview: statement });
  return checkOverview({
    modelBytes: Buffer.from(JSON.stringify(model)),
    writtenFrom,
    revision: "a".repeat(40),
    date: "2026-11-17",
  });
}

test("every text a statement holds is set, with the model's labels for the parts it names", async () => {
  const statement = everyBlock();
  const written = "Written from 2 files, each cited by its SHA-256.";
  const { texts } = await drawn(statement, written);
  const said = [
    statement.claim,
    statement.lead,
    written,
    ...statement.course.steps.flatMap((step) => [step.label, step.note, step.text].filter(Boolean)),
    statement.course.text,
    // A step's tracks are named where they begin, and a fork's branches each by its own label.
    "first",
    "second",
    "Log",
    "for people",
    "Data",
    "for agents",
    "Done",
    "Check",
    "the request is admitted",
    // The two stations that name parts are shown by the model's labels.
    "Alpha",
    "Beta",
    statement.course.lines[0].label,
    statement.blocks[0].title,
    ...statement.blocks[0].stations.map(({ label }) => label),
    statement.blocks[0].pass.label,
    statement.blocks[0].aside.label,
    statement.blocks[0].text,
    ...statement.blocks
      .slice(1)
      .flatMap((fact) => [
        fact.title,
        ...(fact.text ? [fact.text] : []),
        ...(fact.items ?? []).flat(),
        ...(fact.columns ?? []),
        ...(fact.rows ?? []).flat(),
        ...(fact.lists ?? []).flatMap((list) => [list.title, ...list.items.flat()]),
      ]),
  ];
  for (const text of said) assert.ok(texts.includes(text), `not set: ${text}`);
});

test("a course draws a ring at each station, on each of its tracks, the ends of a course larger, and no other mark", async () => {
  const { marks } = await drawn(everyBlock());
  assert.deepEqual([...new Set(marks.map(({ kind }) => kind))], ["ring"]);
  // The course: Ask, three stations on two tracks, two branches of a fork and Done; the further course: three
  // stations; its outcome: one.
  assert.equal(marks.length, 1 + 3 * 2 + 2 + 1 + 3 + 1);
  // Each course's two ends are larger than its other stations; a branch's ring and the outcome's are the smallest.
  const radii = marks.map(({ r }) => r);
  assert.equal(radii.filter((r) => r === 7).length, 4);
  assert.equal(radii.filter((r) => r === 5).length, 6 + 1);
  assert.equal(radii.filter((r) => r === 4).length, 2 + 1);
});

test("a statement too tall for its page is refused with the first block that does not fit", async () => {
  const statement = everyBlock();
  statement.blocks = Array.from({ length: 24 }, (_, index) => ({
    title: `List ${index + 1}`,
    items: Array.from({ length: 6 }, (__, row) => [
      `term ${row + 1}`,
      "a text long enough to take a line",
    ]),
  }));
  await assert.rejects(drawn(statement), (error) => {
    assert.equal(/** @type {any} */ (error).code, "overview_too_tall");
    assert.match(/** @type {any} */ (error).problems[0].message, /^List \d+ reaches \d+ pt/u);
    return true;
  });
});

test("a fork's branches stand side by side under the course, each as wide as a station", async () => {
  const { marks } = await drawn(everyBlock());
  // The course's first ring is Ask's; the two smallest rings nearest the top are the fork's branches, Log and Data.
  const course = marks[0];
  const [log, data] = marks
    .filter(({ r }) => r === 4)
    .sort((a, b) => a.y - b.y)
    .slice(0, 2)
    .sort((a, b) => a.x - b.x);
  assert.equal(log.y, data.y);
  assert.ok(log.y > course.y, "the branches hang under the course");
  // Within its step a fork takes a cell for each branch, as wide as the cell of the station after it, Done.
  const done = marks.filter(({ r, y }) => r === 7 && y === course.y).sort((a, b) => b.x - a.x)[0];
  const cell = done.x - data.x;
  assert.ok(
    Math.abs(data.x - log.x - cell) < 0.5,
    `branches ${data.x - log.x} pt apart, Done ${cell} pt on`,
  );
});

test("headed texts stated one after another stand one under another, in one cell", async () => {
  const statement = everyBlock();
  const at = statement.blocks.findIndex(({ title }) => title === "Not covered");
  statement.blocks.splice(at + 1, 0, {
    title: "Not drawn",
    text: "Nothing outside the two parts is drawn.",
  });
  const { boxes } = await drawn(statement);
  const [covered, notDrawn] = ["Not covered", "Not drawn"].map((text) =>
    boxes.find((box) => box.text === text),
  );
  assert.equal(notDrawn.x, covered.x);
  assert.ok(notDrawn.y > covered.y, "the second stands under the first");
});

test("a run of lists is set in the rows of halves and thirds that take the least height", async () => {
  const statement = everyBlock();
  const short = (title) => ({
    title,
    items: [
      ["one", "a short text"],
      ["two", "another"],
    ],
  });
  const long = {
    title: "Many refusals",
    items: Array.from({ length: 10 }, (_, k) => [
      `refusal ${k + 1}`,
      "a text long enough to need three lines in a third and one or two in a half of the page",
    ]),
  };
  // In thirds the long list sets three lines an item; in halves, beside the first, it sets far fewer, and the two
  // short lists after it fill a second row of halves.
  statement.blocks = [short("First"), long, short("Third"), short("Fourth")];
  const { boxes } = await drawn(statement);
  const at = (text) => boxes.find((box) => box.text === text);
  // A heading's box is its glyphs' ink, so two headings of one row differ by a fraction of a point.
  const level = (a, b) => Math.abs(at(a).y - at(b).y) < 2;
  assert.ok(level("Many refusals", "First"), "the long list stands in the first row");
  assert.ok(
    at("Many refusals").x > 700,
    `the long list stands in a half, at ${at("Many refusals").x} pt`,
  );
  assert.ok(level("Fourth", "Third"), "the short lists after it share a row");
  assert.ok(at("Third").y > at("First").y + 100, "below the first row");
});

test("a list of six items or more, each a line in half its width, is set in two columns", async () => {
  const statement = everyBlock();
  const codes = {
    title: "Refusals",
    items: Array.from({ length: 10 }, (_, k) => [`step ${k + 1}`, `code_${k + 1}_refused`]),
  };
  statement.blocks = [codes, statement.blocks.find(({ title }) => title === "Who decides")];
  const { boxes } = await drawn(statement);
  const at = (text) => boxes.find((box) => box.text === text);
  // Down the first column and then the second: the sixth item stands beside the first.
  assert.ok(
    Math.abs(at("step 6").y - at("step 1").y) < 2,
    "the sixth item heads the second column",
  );
  assert.ok(at("step 6").x > at("step 1").x + 200, `the second column at ${at("step 6").x} pt`);
  assert.ok(at("step 5").y > at("step 4").y, "the first column holds the first five, in order");
});
