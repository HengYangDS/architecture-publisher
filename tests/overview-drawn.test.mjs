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
    ...statement.course.steps.flatMap((step) => [step.label, step.note, step.text]),
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
  // The course: Ask, three stations on two tracks, Keep; the further course: three stations; its outcome: one.
  assert.equal(marks.length, 1 + 3 * 2 + 1 + 3 + 1);
  // Each course's two ends are larger than its other stations; the outcome's ring is the smallest.
  const radii = marks.map(({ r }) => r);
  assert.equal(radii.filter((r) => r === 7).length, 4);
  assert.equal(radii.filter((r) => r === 5).length, 6 + 1);
  assert.equal(radii.filter((r) => r === 4).length, 1);
});

test("a statement too tall for its page is refused with the first block that does not fit", async () => {
  const statement = everyBlock();
  statement.blocks = Array.from({ length: 12 }, (_, index) => ({
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
