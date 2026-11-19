import assert from "node:assert/strict";
import test from "node:test";
import { options } from "../src/layout/channel-solver/options.mjs";
import { solveChannel } from "../src/layout/channel-solver/search.mjs";
import { POSTER } from "../src/poster/tokens.mjs";

// Whether two choices of a channel's search fit one another depends on the two alone. The search asks it of the
// same two at every assignment that holds both, tens of thousands of times a channel, so it keeps each pair's
// answer for as long as it searches. A build spent a sixth of its time asking again.

/** A channel of labelled wires that cross one another, and how often the fit of two choices read a wire's label. */
function channelOf(count) {
  const channel = { index: 0, wires: [], edges: [48, 2352] };
  const reads = { labels: 0 };
  for (let order = 0; order < count; order += 1) {
    const label = { width: 60, height: 14 };
    const wire = { order, type: "single", top: [], bottom: [] };
    Object.defineProperty(wire, "label", {
      enumerable: true,
      get() {
        reads.labels += 1;
        return label;
      },
    });
    wire.top.push({ id: `upper-${order}`, x: 200 + order * 240, wire });
    wire.bottom.push({ id: `lower-${order}`, x: 290 + ((order + 2) % count) * 240, wire });
    channel.wires.push(wire);
  }
  return { channel, reads };
}

test("a search reads a wire's label no more often than there are pairs of choices", () => {
  const rows = 3;
  const { channel, reads } = channelOf(5);
  // Every choice the search can make: each wire's options, each on each label row.
  const choices = channel.wires.reduce(
    (sum, wire) => sum + options(channel, wire, POSTER.spacing).length * rows,
    0,
  );
  reads.labels = 0;
  const solution = solveChannel(channel, POSTER.spacing, rows, rows);
  assert.ok(solution);
  // Each pair of choices is asked once, and asking reads the label of each of its two wires at most once; the
  // rest is read once a wire, to make the options and to remember the answer.
  assert.ok(
    reads.labels <= choices * choices,
    `${reads.labels} reads of a label for ${choices} choices`,
  );
});
