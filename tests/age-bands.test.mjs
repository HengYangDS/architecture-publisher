import assert from "node:assert/strict";
import test from "node:test";
import { SPANS, ageBands, bandOf } from "../src/sources/ages.mjs";

const DAY = 24 * 60 * 60;
const days = (...counts) => counts.map((count) => count * DAY);

test("the span ladder runs from a day to three years", () => {
  assert.deepEqual(SPANS, days(1, 3, 7, 30, 90, 365, 1095));
});

test("two boundaries split a spread of ages into thirds", () => {
  // A file changed exactly a day before the pin is still in the newest band.
  const ages = [0, 3600, DAY, ...days(10, 15, 20, 200, 300, 400)];
  const bands = ageBands(ages);
  assert.deepEqual(bands, { spans: days(1, 30) });
  assert.deepEqual(
    ages.map((age) => bandOf(age, bands)),
    [0, 0, 0, 1, 1, 1, 2, 2, 2],
  );
});

test("files changed one, ten and four hundred days before the pin fall in three bands", () => {
  const ages = days(1, 10, 400);
  const bands = ageBands(ages);
  assert.deepEqual(
    ages.map((age) => bandOf(age, bands)),
    [0, 1, 2],
  );
});

test("splits that are equally close to thirds go to the shorter spans", () => {
  // Either a week or a month after three days holds the five-day file alone.
  assert.deepEqual(ageBands(days(2, 5, 50)), { spans: days(3, 7) });
  // Any first boundary from three days to a month holds the two-day file alone.
  assert.deepEqual(ageBands(days(2, 50, 500)), { spans: days(3, 90) });
  // Two files cannot fill three bands; every split that parts them is as near, and the shortest wins.
  assert.deepEqual(ageBands(days(2, 500)), { spans: days(1, 3) });
});

test("files that all changed on one day, or none at all, still get two boundaries", () => {
  for (const ages of [days(5, 5, 5, 5), [0, 0, 0], []])
    assert.deepEqual(ageBands(ages), { spans: days(1, 3) });
  const bands = ageBands(days(5, 5, 5, 5));
  assert.deepEqual(
    days(5, 5).map((age) => bandOf(age, bands)),
    [2, 2],
  );
});

test("an age at a boundary belongs to the newer band", () => {
  const bands = { spans: days(7, 90) };
  assert.deepEqual(
    [0, 7 * DAY, 7 * DAY + 1, 90 * DAY, 90 * DAY + 1].map((age) => bandOf(age, bands)),
    [0, 0, 1, 1, 2],
  );
});
