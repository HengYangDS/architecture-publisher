import assert from "node:assert/strict";
import test from "node:test";
import { compatible, rowCrossings } from "../src/layout/channel-solver/conflicts.mjs";
import { compatibleByRows, rowCrossingsByRows } from "./fixtures/conflicts-by-rows.mjs";

// The channel's exact search asks, for every choice it tries, whether the choice fits the wires already chosen.
// It asks millions of times in one build, so the check decides from the two rows the choices stand on and lists
// no row; what it decides is defined row by row in `fixtures/conflicts-by-rows.mjs`.

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

/** One channel's question as the search asks it: wires, the choices made for the first of them, and the next one. */
function question(random) {
  const pick = (list) => list[Math.floor(random() * list.length)];
  const rows = pick([1, 2, 3]);
  const wires = Array.from({ length: pick([2, 3, 4, 5, 6]) }, () => ({
    label: { width: pick([24, 60, 96, 140]), height: 14 },
  }));
  // Few places, close together, so that verticals meet, labels crowd and jogs are crossed.
  const places = [96, 96.5, 120, 160, 200, 240, 300, 360];
  const option = () => {
    const verticals = Array.from({ length: pick([1, 1, 2]) }, () => ({
      x: pick(places),
      from: pick(["top", "bottom"]),
      turn: pick(["upper", "row", "lower", "through"]),
      own: random() < 0.3,
    }));
    const mark = pick(["label", "jog", "none"]);
    const low = pick(places);
    return {
      verticals,
      ...(mark === "label" ? { label: pick(places) } : {}),
      ...(mark === "jog" ? { jog: [low, low + pick([24, 80, 160])] } : {}),
      // A choice without a label or a jog stands on the first row, as the search sets it.
      row: mark === "none" ? 0 : Math.floor(random() * rows),
    };
  };
  const index = wires.length - 1;
  const chosen = Array.from({ length: index }, (_, wire) => [wire, option()]);
  const spacing = {
    labelGap: pick([8, 16]),
    labelClear: pick([6, 12]),
    separation: 12,
    ...(random() < 0.5 ? { join: 24 } : {}),
  };
  return { channel: { wires }, chosen, index, choice: option(), rows, spacing };
}

test("a choice fits the wires chosen exactly where the check stated row by row finds it to fit", () => {
  const random = numbers(20261118);
  const answers = { true: 0, false: 0 };
  for (let n = 0; n < 40_000; n += 1) {
    const { channel, chosen, index, choice, rows, spacing } = question(random);
    // One wire chosen at a time, as the search asks: the more wires are chosen, the fewer choices fit.
    for (let made = 1; made <= chosen.length; made += 1) {
      const some = chosen.slice(0, made);
      const expected = compatibleByRows(channel, some, index, choice, rows, spacing);
      assert.equal(
        compatible(channel, some, index, choice, rows, spacing),
        expected,
        `question ${n} with ${made} wires chosen`,
      );
      answers[expected] += 1;
    }
  }
  // The questions are worth asking: thousands of each answer.
  assert.ok(answers.true > 5_000 && answers.false > 5_000, JSON.stringify(answers));
});

test("the jogs that verticals cross are counted as the count stated row by row counts them", () => {
  const random = numbers(18112026);
  let crossed = 0;
  for (let n = 0; n < 40_000; n += 1) {
    const { chosen, rows } = question(random);
    const expected = rowCrossingsByRows(chosen, rows);
    assert.equal(rowCrossings(chosen, rows), expected, `question ${n}`);
    crossed += expected > 0 ? 1 : 0;
  }
  assert.ok(crossed > 2_000, `${crossed} questions with a crossing`);
});

test("checking a choice costs the same whether the channel has one label row or three", () => {
  /** How often the check reads a choice's verticals, for a channel of `rows` label rows. */
  const reads = (rows) => {
    let count = 0;
    const counted = (option) =>
      new Proxy(option, {
        get(target, key) {
          if (key === "verticals") count += 1;
          return target[key];
        },
      });
    // Four wires far apart, each with its label on the first row: every choice fits.
    const wires = [0, 1, 2, 3].map(() => ({ label: { width: 40, height: 14 } }));
    const option = (wire) =>
      counted({
        verticals: [{ x: 100 + wire * 400, from: "top", turn: "row", own: true }],
        label: 100 + wire * 400,
        row: 0,
      });
    const chosen = [0, 1, 2].map((wire) => [wire, option(wire)]);
    const spacing = { labelGap: 8, labelClear: 6, separation: 12 };
    assert.equal(compatible({ wires }, chosen, 3, option(3), rows, spacing), true);
    return count;
  };
  assert.equal(reads(3), reads(1));
});
