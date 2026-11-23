import assert from "node:assert/strict";
import test from "node:test";
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
