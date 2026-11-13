import assert from "node:assert/strict";
import test from "node:test";
import { refuse } from "../src/refusal.mjs";
import { STRIP_LENGTHS, longestOf, withStripLength } from "../src/poster/strip.mjs";

// An edition keeps one scale for its strips. When a view cannot hold them at the longest length, every strip of the
// edition is drawn shorter and the views are planned again, until one length lays out every view.

const strips = { name: "strip", tokens: {} };
const unfittable = () => refuse("plate_unfittable", "The view cannot be laid out.");

test("the edition's strips are as long as the first length that lays out every view", async () => {
  const tried = [];
  const drawn = await withStripLength(strips, async (style) => {
    tried.push(longestOf(style));
    if (longestOf(style) > 240) unfittable();
    return longestOf(style);
  });
  assert.deepEqual(tried, STRIP_LENGTHS);
  assert.deepEqual(STRIP_LENGTHS, [360, 240]);
  assert.equal(drawn, 240);
});

test("a view that no length lays out, or any other refusal, refuses the build", async () => {
  await assert.rejects(
    withStripLength(strips, async () => unfittable()),
    { code: "plate_unfittable" },
  );
  await assert.rejects(
    withStripLength(strips, async () => refuse("plate_too_dense", "Too dense.")),
    { code: "plate_too_dense" },
  );
});

test("cards have no strips to shorten and are planned once", async () => {
  let calls = 0;
  const cards = { name: "card", tokens: {} };
  assert.equal(await withStripLength(cards, async (style) => (calls++, style)), cards);
  assert.equal(calls, 1);
});
