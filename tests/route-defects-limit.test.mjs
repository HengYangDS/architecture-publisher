import assert from "node:assert/strict";
import test from "node:test";
import { ROUTE_DEFECT, losing } from "../src/layout/channel-solver/search.mjs";
import { measureRoutes } from "../src/layout/measure.mjs";

// A channel's search measures the route defects of every assignment it completes that could still win, and an
// assignment loses once its defects bring its score to the best one's. The search asks the measure for no more
// defects than decide that; a large build spent a sixth of its time measuring assignments, each counted whole.

/** Five wires of five relations side by side, most too close to tell apart, and a label; how often the labels are read. */
function geometryOf(reads) {
  const paths = [];
  for (let k = 0; k < 5; k += 1)
    paths.push({
      relations: [{ id: `r${k}` }],
      points: [
        [100 + k * 10, 0],
        [100 + k * 10, 400],
      ],
    });
  const labels = [{ relations: [{ id: "r0" }], x: 0, y: 200, width: 60, height: 14 }];
  return {
    cards: new Map(),
    paths,
    get labels() {
      reads.labels += 1;
      return labels;
    },
  };
}

test("a measure asked for a few route defects returns the first it finds and reads no further", () => {
  const reads = { labels: 0 };
  const all = measureRoutes(geometryOf(reads));
  assert.equal(all.length, 9, "the pairs of wires less than 40 apart read as one");
  assert.ok(reads.labels > 0, "the whole measure reads the labels");
  reads.labels = 0;
  const first = measureRoutes(geometryOf(reads), 3);
  assert.deepEqual(first, all.slice(0, 3));
  assert.equal(
    reads.labels,
    0,
    "the measure read the labels after it had found what it was asked for",
  );
});

test("a measure asked for more route defects than there are finds them all", () => {
  const reads = { labels: 0 };
  assert.deepEqual(measureRoutes(geometryOf(reads), 11), measureRoutes(geometryOf(reads)));
});

/** A generator of numbers in [0, 1), the same for a seed on every machine (mulberry32). */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("a search stops counting an assignment's route defects at the fewest with which it loses", () => {
  // An assignment is kept when its score, before its routes are measured and its weight for each route defect, is
  // below the best one's. The search asks the measure for the fewest defects with which it is not: counted one by
  // one here, on scores of the search's own terms, so a limit that would let a cut count win is caught (the review
  // of 2026-11-24 broke the limit to one less and no test failed).
  const fewest = (unmeasured, best) => {
    let count = 0;
    while (unmeasured + count * ROUTE_DEFECT < best) count += 1;
    return count;
  };
  const random = seeded(20261124);
  const pick = (values) => values[Math.floor(random() * values.length)];
  for (let n = 0; n < 4000; n += 1) {
    // Preferences of a wire's options, offsets of an x over 400, three a track and ten a crossing.
    const unmeasured =
      pick([0, 0.6, 0.8, 1.4]) * (1 + Math.floor(random() * 6)) +
      Math.floor(random() * 800) / 400 +
      3 * Math.floor(random() * 6) +
      10 * Math.floor(random() * 4);
    // The best: as far above as some defects and a fraction, or exactly a number of defects, a tie.
    const gap = ROUTE_DEFECT * (Math.floor(random() * 12) + (random() < 0.3 ? 0 : random()));
    const best = unmeasured + gap;
    assert.equal(losing(unmeasured, best), fewest(unmeasured, best), `${unmeasured} under ${best}`);
  }
  assert.equal(losing(5, 5 + 2 * ROUTE_DEFECT), 2, "a tie loses");
  assert.equal(losing(3, undefined), Infinity, "with no best, the count is whole");
  // Past 2^53 a count no longer grows by one: such a pair once held the search for ever; it is now counted whole.
  assert.equal(losing(13.8, 73057594037927940), Infinity);
});
