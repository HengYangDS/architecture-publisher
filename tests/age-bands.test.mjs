import assert from "node:assert/strict";
import test from "node:test";
import { BANDS, bandOf } from "../src/sources/ages.mjs";

const DAY = 24 * 60 * 60;

test("every edition dates its files by the same two spans, a week and three months", () => {
  assert.deepEqual(BANDS, { spans: [7 * DAY, 90 * DAY] });
});

test("a file's band counts from the pin: within a week, within three months, or earlier", () => {
  assert.deepEqual(
    [0, 7 * DAY, 7 * DAY + 1, 90 * DAY, 90 * DAY + 1, 4000 * DAY].map((age) => bandOf(age)),
    [0, 0, 1, 1, 2, 2],
  );
});

test("a file changed after its commit's clock, so with a negative age, is in the newest band", () => {
  assert.equal(bandOf(-60), 0);
});
