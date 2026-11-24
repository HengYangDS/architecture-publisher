import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { SET, evalEdition, plateOf } from "./fixtures/edition-typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";

// The queue item `edition-map`: a fact is stated once a page. The census of 2026-11-23 found two repeats in every
// edition: the cover's date, and the overview's commit and date in its head as in its foot.
const model = validateModel(
  minimalModel({
    overview: everyBlock(),
    repository: {
      name: "minimal",
      url: "https://example.invalid/minimal.git",
      revision: "a".repeat(40),
    },
  }),
);

test("the cover and the overview state the commit and its date once", async (t) => {
  const set = await evalEdition(t, { model, plates: [plateOf(1)] }, SET);
  const stating = (page, fact) =>
    set.boxes
      .filter((box) => box.page === page && String(box.text).includes(fact))
      .map(({ text }) => text);
  const overview = set.boxes.find((box) => box.text === model.overview.claim).page;
  assert.equal(
    stating(1, "2026-11-06").length,
    1,
    `the cover: ${stating(1, "2026-11-06").join(" | ")}`,
  );
  assert.equal(
    stating(overview, "aaaaaaa").length,
    1,
    `the overview: ${stating(overview, "aaaaaaa").join(" | ")}`,
  );
});
