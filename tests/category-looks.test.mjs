import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORY_LOOKS, KINDLESS_CATEGORY } from "../src/kinds.mjs";
import { CATEGORIES, DEFAULT_CATEGORY } from "../src/model/vocabulary.mjs";

// The queue item `derived-references`: the model's schema states its categories and the default one. The units that
// draw do not read the model (tests/module-boundaries.test.mjs), so they state how each category looks in one table;
// this holds that table to the schema.

test("the categories' looks name every category of the model, in its order, and draw its default", () => {
  assert.deepEqual(Object.keys(CATEGORY_LOOKS), [...CATEGORIES]);
  assert.equal(KINDLESS_CATEGORY, DEFAULT_CATEGORY);
});
