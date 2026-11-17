import assert from "node:assert/strict";
import test from "node:test";
import { remembered } from "../src/layout/channel-solver/remember.mjs";

// A channel is solved once for one input. A plate's candidates differ in what stands inside its cards, which the
// channel's solver does not read, so it is asked again and again for the same channel; what it answered is
// remembered under a key of everything it was given.

/** A channel as the solver is given one: wires whose points name their wire again. */
function channelOf(x = 100) {
  const channel = { index: 0, wires: [], edges: [48, 1552] };
  const wire = { order: 0, top: [], bottom: [], label: { width: 60, height: 14 } };
  wire.top.push({ id: "a", x, wire });
  wire.bottom.push({ id: "b", x: 300, wire });
  channel.wires.push(wire);
  return channel;
}

/** A function that counts its runs, remembered. */
function counted(bound) {
  const runs = [];
  const solve = remembered((...given) => {
    runs.push(given);
    return { height: 40, tracks: [{ wire: 0, at: 12 }] };
  }, bound);
  return { solve, runs };
}

test("an input equal in every property is solved once, a reference back to its wire included", () => {
  const { solve, runs } = counted();
  const first = solve(channelOf(), { separation: 12 }, 3, 1, true);
  const again = solve(channelOf(), { separation: 12 }, 3, 1, true);
  assert.equal(runs.length, 1);
  assert.equal(again, first);
});

test("an input that differs in one nested value, or in an argument left out, is solved again", () => {
  const { solve, runs } = counted();
  solve(channelOf(100), { separation: 12 }, 3, 1, true);
  solve(channelOf(101), { separation: 12 }, 3, 1, true);
  solve(channelOf(100), { separation: 13 }, 3, 1, true);
  solve(channelOf(100), { separation: 12 }, undefined, 1, true);
  solve(channelOf(100), { separation: 12 }, 3, 1, false);
  assert.equal(runs.length, 5);
});

test("which enclosing object a reference returns to is part of the input", () => {
  const { solve, runs } = counted();
  const toWire = channelOf();
  const toChannel = channelOf();
  toChannel.wires[0].top[0].wire = toChannel;
  solve(toWire, {});
  solve(toChannel, {});
  assert.equal(runs.length, 2);
});

test("a remembered result cannot be changed by the caller it is given to", () => {
  const { solve } = counted();
  const result = solve(channelOf(), {});
  assert.throws(() => {
    result.height = 0;
  }, TypeError);
  assert.throws(() => {
    result.tracks[0].at = 0;
  }, TypeError);
});

test("no result is remembered for an input that holds a function", () => {
  const { solve } = counted();
  assert.throws(() => solve({ measure: () => 1 }, {}), /function/u);
});

test("the store drops its oldest result at its bound", () => {
  const { solve, runs } = counted(2);
  solve(channelOf(1), {});
  solve(channelOf(2), {});
  solve(channelOf(3), {});
  solve(channelOf(2), {});
  assert.equal(runs.length, 3, "the second and third are still remembered");
  solve(channelOf(1), {});
  assert.equal(runs.length, 4, "the first was dropped when the third came");
});
