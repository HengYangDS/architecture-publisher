import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { SET, evalEdition, plateOf } from "./fixtures/edition-typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";

// The queue item `edition-map`: every plate prints the answer to its question in one place.
const SUMMARY = "Alpha calls Beta, which answers.";
const model = validateModel(
  minimalModel({
    views: [
      { id: "view-1", title: "View 1", question: "What does view 1 show?", members: ["a", "b"] },
    ],
  }),
);
/** A plate whose figure keeps the full body and sets no summary above it, its view's summary given. */
const silent = (summary) => ({ ...plateOf(1), reading: "omitted", summary });

test("a plate whose figure keeps the full body sets its answer in its head, right of the question", async (t) => {
  const set = await evalEdition(t, { model, plates: [silent(SUMMARY)] }, SET);
  const page = Math.max(
    ...set.boxes.filter((box) => box.text === "View 1").map(({ page }) => page),
  );
  const on = (said) => set.boxes.find((box) => box.page === page && box.text === said);
  const [question, answer] = [on("What does view 1 show?"), on(SUMMARY)];
  assert.ok(answer, "the plate sets no answer");
  assert.equal(answer.b, 52, "the answer begins on the title's baseline");
  assert.ok(answer.x >= question.x + question.w + 48, "the answer stands clear of the question");
  assert.ok(answer.y + answer.h <= 112, "the answer runs into the body");
});

test("an answer longer than three lines of the head is refused", async (t) => {
  const long = `${SUMMARY} `.repeat(40).trim();
  await assert.rejects(evalEdition(t, { model, plates: [silent(long)] }, SET), (error) =>
    /edition_reading_too_long/u.test(String(/** @type {any} */ (error).stderr ?? error)),
  );
});
