import assert from "node:assert/strict";
import test from "node:test";
import { OVERVIEW_KEY } from "../src/names.mjs";
import { validateModel } from "../src/model/load.mjs";
import { SET, evalEdition, plateOf } from "./fixtures/edition-typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";

// The queue item `edition-map`: a plate's head names the part of the overview it enlarges, as a link back.
const VIEWS = [1, 2, 3].map((n) => ({
  id: `view-${n}`,
  title: `View ${n}`,
  question: `What does view ${n} show?`,
  members: ["a", "b"],
}));

/** View 1 is named by a step and again by a block, view 2 by a block bearing its plate's title, view 3 by none. */
const model = validateModel(
  minimalModel({
    views: VIEWS,
    overview: {
      claim: "A claim",
      lead: "A lead.",
      course: {
        steps: [
          { id: "one", label: "Calls", view: "view-1" },
          { id: "two", label: "Two" },
        ],
      },
      blocks: [
        { title: "Terms", view: "view-1", items: [["term", "its text"]] },
        { title: "View 2", view: "view-2", items: [["term", "its text"]] },
      ],
    },
  }),
);

test("a plate's head links back to the overview: the first element that names its view, or the overview by name", async (t) => {
  const set = await evalEdition(t, { model, plates: [1, 2, 3].map((page) => plateOf(page)) }, SET);
  // A plate's title stands in the contents too: its page is the last that sets it.
  const pageOf = (title) =>
    Math.max(...set.boxes.filter((box) => box.text === title).map(({ page }) => page));
  const backs = (page) =>
    set.boxes
      .filter((box) => box.page === page && String(box.text).startsWith("↖"))
      .map(({ text }) => text);
  const linked = (page) => set.links.some((link) => link.page === page && link.to === OVERVIEW_KEY);
  assert.deepEqual(
    backs(pageOf("View 1")),
    ["↖ Calls"],
    "the first element in the statement's order",
  );
  assert.ok(linked(pageOf("View 1")), "the line back links to the overview's page");
  assert.deepEqual(backs(pageOf("View 2")), ["↖ Overview"], "an element bearing the plate's title");
  assert.deepEqual(backs(pageOf("View 3")), []);
  assert.ok(!linked(pageOf("View 3")));
  // The line back stands on the question's line, after it.
  const on = (page, said) => set.boxes.find((box) => box.page === page && box.text === said);
  const question = on(pageOf("View 1"), "What does view 1 show?");
  const back = on(pageOf("View 1"), "↖ Calls");
  assert.equal(back.b, question.b);
  assert.ok(back.x > question.x + question.w);
});

test("a line back that would pass the margin gives way to the overview's word, then to none", async (t) => {
  // An element's words too long for the room after the question, and a question too long for any line back: an
  // earlier release built both plates as long as their line back fitted, and they are still built. A plate's
  // answer stands 48 points clear of the line back as shown, not of the words that gave way.
  const label = "a very long label of the element that names this plate's view ".repeat(3).trim();
  const views = [1, 2, 3].map((n) => ({ ...VIEWS[n - 1], question: "q" }));
  const wide = validateModel(
    minimalModel({
      views,
      overview: {
        claim: "A claim",
        lead: "A lead.",
        course: {
          steps: [
            { id: "one", label, view: "view-1" },
            { id: "two", label, view: "view-2" },
            { id: "three", label, view: "view-3" },
          ],
        },
        blocks: [{ title: "Terms", items: [["term", "its text"]] }],
      },
    }),
  );
  const sentence = "What does this view show of the system? ";
  const plates = [
    { ...plateOf(1), question: sentence.repeat(3).trim() },
    { ...plateOf(2), question: sentence.repeat(7).trim() },
    {
      ...plateOf(3),
      question: sentence.repeat(3).trim(),
      reading: "omitted",
      summary: "The view answers in one sentence.",
    },
  ];
  const set = await evalEdition(t, { model: wide, plates }, SET);
  const pageOf = (title) =>
    Math.max(...set.boxes.filter((box) => box.text === title).map(({ page }) => page));
  const backs = (page) =>
    set.boxes.filter((box) => box.page === page && String(box.text).startsWith("↖"));
  assert.deepEqual(
    backs(pageOf("View 1")).map(({ text }) => text),
    ["↖ Overview"],
    "the element's words do not fit; the overview's do",
  );
  assert.deepEqual(backs(pageOf("View 2")), [], "neither fits");
  const [back] = backs(pageOf("View 3"));
  assert.equal(back.text, "↖ Overview");
  const answer = set.boxes.find((box) => box.text === "The view answers in one sentence.");
  assert.ok(Math.abs(answer.x - (back.x + back.w + 48)) < 0.5, `the answer at ${answer.x}`);
});
