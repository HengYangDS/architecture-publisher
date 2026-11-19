import assert from "node:assert/strict";
import test from "node:test";
import { solveChannel } from "../src/layout/channel-solver/search.mjs";
import { POSTER } from "../src/poster/tokens.mjs";

// The exact search of a channel solves a band's tracks once for one content of the band, and asks for them at
// every assignment it completes: thousands of times a channel. What an option puts into a band does not depend on
// the label row it takes, so each content is named once an option, before the search, and an assignment makes no
// key of its spans. A build spent a fifteenth of its time making that key.

/** A channel of labelled wires that cross one another, each from a card above to a card below. */
function channelOf(count) {
  const channel = { index: 0, wires: [], edges: [48, 2352] };
  for (let order = 0; order < count; order += 1) {
    const wire = { order, type: "single", top: [], bottom: [], label: { width: 60, height: 14 } };
    wire.top.push({ id: `upper-${order}`, x: 200 + order * 240, wire });
    wire.bottom.push({ id: `lower-${order}`, x: 290 + ((order + 2) % count) * 240, wire });
    channel.wires.push(wire);
  }
  return channel;
}

/** One solve of a channel on exactly `rows` label rows, with the count of what it serialized. */
function solved(count, rows) {
  const stringify = JSON.stringify;
  let serialized = 0;
  JSON.stringify = function counted(...given) {
    serialized += 1;
    return stringify.apply(this, given);
  };
  try {
    return { solution: solveChannel(channelOf(count), POSTER.spacing, rows, rows), serialized };
  } finally {
    JSON.stringify = stringify;
  }
}

test("a channel solved on three label rows serializes no more than on one", () => {
  const one = solved(5, 1);
  const three = solved(5, 3);
  // Both are solved, and on three rows the search has more assignments to complete.
  assert.ok(one.solution && three.solution);
  assert.equal(three.serialized, one.serialized);
});

test("a channel of more wires is solved to the same answer twice, by the search and from memory", () => {
  const first = solved(6, 2);
  const again = solved(6, 2);
  assert.ok(first.solution);
  assert.equal(again.solution, first.solution);
});
