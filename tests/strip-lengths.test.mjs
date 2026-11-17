import assert from "node:assert/strict";
import test from "node:test";
import { refuse } from "../src/refusal.mjs";
import { STRIP_LENGTHS, longestOf, withStripLength } from "../src/poster/strip.mjs";
import { HOUSE, POSTER, figureMetrics, figureStyles } from "../src/poster/tokens.mjs";

// An edition keeps one scale for its strips. When a view cannot hold them at the longest length, every strip of the
// edition is drawn shorter and the views are planned again, until one length lays out every view.

/** A style whose facts hold a largest part, so its edition draws strips. */
const strips = { tokens: {}, facts: { scale: 56000 } };
const unfittable = () => refuse("plate_unfittable", "The view cannot be laid out.");

test("the edition's strips are as long as the first length that lays out every view", async () => {
  const tried = [];
  const drawn = await withStripLength(strips, async (style) => {
    tried.push(longestOf(style));
    if (longestOf(style) > 208) unfittable();
    return longestOf(style);
  });
  assert.deepEqual(tried, STRIP_LENGTHS);
  assert.equal(drawn, 208);
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

test("an edition that draws no strip has none to shorten and is planned once", async () => {
  // Without measured facts, and with facts that hold no largest part, as a build without a checkout has them.
  for (const bare of [{ tokens: {} }, { tokens: {}, facts: { scale: null } }]) {
    let calls = 0;
    assert.equal(await withStripLength(bare, async (style) => (calls++, style)), bare);
    assert.equal(calls, 1);
  }
});

test("a strip that a row of six held bare, it holds within a card at the two densest type steps", () => {
  // A strip stands within its card's padding. Bare strips ran 360 px for the edition's largest part, and a row of
  // six columns held any strip as long as a column; the scale is shortened so that the same strip, on the new
  // scale and inside its card, still stands in that column.
  const BARE = 360;
  const body = Math.round(HOUSE.plate.width * HOUSE.plate.pixelsPerPoint);
  for (const step of POSTER.steps.slice(0, 2)) {
    const { card, spacing } = figureMetrics(figureStyles(step));
    const column = Math.floor((body - 2 * spacing.inset - 5 * spacing.column) / 6);
    const carded = (column * STRIP_LENGTHS[0]) / BARE + 2 * card.pad;
    assert.ok(carded <= column, `a column of ${column} px holds a card of ${carded} px`);
  }
  // The shorter length keeps the same ratio, on the 8 px grid.
  assert.deepEqual(STRIP_LENGTHS, [320, 208]);
});
