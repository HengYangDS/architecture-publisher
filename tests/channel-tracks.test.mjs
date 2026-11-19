import assert from "node:assert/strict";
import test from "node:test";
import { assignTracks } from "../src/layout/channel-solver/tracks.mjs";
import { assignTracksByOrders } from "./fixtures/tracks-by-orders.mjs";

// A band's spans are laid on tracks by trying every order of them, up to 720 orders for six spans. What two spans
// are to one another is the same in every order, so it is worked out once a pair; what the assignment answers is
// defined order by order in `fixtures/tracks-by-orders.mjs`. A large build spent a sixth of its time working the
// same facts out again for every order.

/** A repeatable source of numbers in [0, 1). */
function numbers(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** One band as the search hands it over: spans with their ends above and below, and the verticals that cross. */
function band(random) {
  const pick = (list) => list[Math.floor(random() * list.length)];
  // Few places, close together, so that ends meet, spans overlap and tracks are contested.
  const places = [96, 96.5, 120, 160, 200, 240, 300, 360, 420];
  const count = pick([1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8]);
  const wires = pick([count, Math.max(1, count - 1), Math.max(1, count - 2)]);
  const spans = Array.from({ length: count }, (_, index) => {
    const ends = Array.from({ length: pick([2, 2, 3]) }, () => pick(places));
    const fromTop = random() < 0.5;
    const shape = pick(["across", "fan", "jog"]);
    return {
      low: Math.min(...ends),
      high: Math.max(...ends),
      tops: shape === "across" ? [ends[0]] : fromTop ? ends : shape === "fan" ? [ends[0]] : [],
      bottoms: shape === "across" ? [ends[1]] : fromTop ? (shape === "fan" ? [ends[0]] : []) : ends,
      wire: index % wires,
    };
  });
  const crossers = Array.from({ length: pick([0, 0, 1, 2, 4]) }, () => ({
    x: pick(places) + pick([0, 12]),
    wire: Math.floor(random() * (wires + 1)),
  }));
  return { spans, crossers, apart: pick([12, 24, 48]) };
}

test("a band's tracks are those the assignment stated order by order finds", () => {
  const random = numbers(20261119);
  const seen = { none: 0, one: 0, several: 0, crossed: 0 };
  for (let round = 0; round < 6000; round += 1) {
    const { spans, crossers, apart } = band(random);
    const expected = assignTracksByOrders(spans, crossers, apart);
    assert.deepEqual(assignTracks(spans, crossers, apart), expected, `band ${round}`);
    if (!expected) seen.none += 1;
    else if (expected.tracks === 1) seen.one += 1;
    else seen.several += 1;
    if (expected?.crossings) seen.crossed += 1;
  }
  // The bands cover every kind of answer: no assignment, one track, several, and crossings that the order decides.
  for (const [kind, count] of Object.entries(seen)) assert.ok(count > 100, `${kind}: ${count}`);
  assert.deepEqual(assignTracks([], [], 24), assignTracksByOrders([], [], 24));
});

test("laying six spans on tracks reads each span's ends once, however many orders are tried", () => {
  const reads = { ends: 0 };
  const counted = (list) => ({
    enumerable: true,
    get() {
      reads.ends += 1;
      return list;
    },
  });
  // Six spans of six wires that overlap in a staircase: 720 orders are tried.
  const spans = Array.from({ length: 6 }, (_, index) => {
    const span = { low: 100 + index * 60, high: 340 + index * 60, wire: index };
    Object.defineProperty(span, "tops", counted([100 + index * 60]));
    Object.defineProperty(span, "bottoms", counted([340 + index * 60]));
    return span;
  });
  const crossers = [{ x: 250, wire: 6 }];
  const answer = assignTracks(spans, crossers, 24);
  assert.ok(answer && answer.tracks > 1);
  // Two lists of ends a span, each read once to work out what the span is to every other.
  assert.ok(
    reads.ends <= 2 * spans.length,
    `${reads.ends} reads of a span's ends for ${spans.length} spans`,
  );
});
