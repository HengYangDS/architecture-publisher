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
