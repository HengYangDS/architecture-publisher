import { permutations } from "../../src/layout/permutations.mjs";

/**
 * The tracks of one band as they are defined. Every order of its spans is tried, where they are six or fewer; in
 * an order each span takes the first track that comes after the track of every placed span one of whose tops
 * stands where one of its own bottoms does, and that holds no span too near it; an order is dropped when a span
 * comes to lie at or after a placed span that has to come after it; and of the rest the one with the fewest
 * tracks and crossings is kept, the first such in the enumeration. Every fact about two spans is worked out anew
 * where an order needs it. The solver's own `assignTracks` works each fact out once a pair, and
 * `tests/channel-tracks.test.mjs` holds it to these answers.
 */
export function assignTracksByOrders(spans, crossers, apart) {
  if (!spans.length) return { tracks: 0, track: [], crossings: 0 };
  const count = spans.length;
  const orders =
    count <= 6
      ? permutations([...spans.keys()])
      : [[...spans.keys()].sort((a, b) => spans[a].low - spans[b].low || a - b)];
  const conflict = (a, b) =>
    spans[a].tops.some((x) => spans[b].bottoms.some((y) => Math.abs(x - y) < 1));
  /** @type {any} */
  let best = null;
  for (const sequence of orders) {
    const track = new Array(count).fill(-1);
    let valid = true;
    for (const i of sequence) {
      let floor = 0;
      for (let j = 0; j < count; j += 1)
        if (j !== i && track[j] >= 0 && conflict(j, i)) floor = Math.max(floor, track[j] + 1);
      let level = floor;
      while (
        spans.some(
          (span, j) =>
            track[j] === level &&
            !(span.high + apart <= spans[i].low || spans[i].high + apart <= span.low),
        )
      )
        level += 1;
      for (let j = 0; j < count; j += 1)
        if (j !== i && track[j] >= 0 && conflict(i, j) && track[j] <= level) valid = false;
      track[i] = level;
    }
    if (!valid) continue;
    let crossings = 0;
    for (let i = 0; i < count; i += 1) {
      const within = (x) => x > spans[i].low + 0.5 && x < spans[i].high - 0.5;
      for (let j = 0; j < count; j += 1) {
        if (i === j || spans[i].wire === spans[j].wire) continue;
        for (const x of spans[j].tops) if (within(x) && track[i] < track[j]) crossings += 1;
        for (const x of spans[j].bottoms) if (within(x) && track[i] > track[j]) crossings += 1;
      }
      for (const crosser of crossers)
        if (crosser.wire !== spans[i].wire && within(crosser.x)) crossings += 1;
    }
    const tracks = Math.max(...track) + 1;
    const score = tracks * 3 + crossings * 10;
    if (!best || score < best.score) best = { score, tracks, track, crossings };
  }
  return best;
}
