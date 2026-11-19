import { permutations } from "../permutations.mjs";

/** Every order of a band's spans by their number, made once for each count of spans and only read after. */
const ORDERS = [];
const everyOrder = (count) =>
  (ORDERS[count] ??= permutations(Array.from({ length: count }, (_, index) => index)));

/**
 * Tracks for one band: fewest tracks, no shared vertical, fewest crossings.
 * Spans on one track keep `apart` between them, so neither seems to continue
 * the other.
 */
export function assignTracks(spans, crossers, apart) {
  if (!spans.length) return { tracks: 0, track: [], crossings: 0 };
  const count = spans.length;
  const orders =
    count <= 6
      ? everyOrder(count)
      : [[...spans.keys()].sort((a, b) => spans[a].low - spans[b].low || a - b)];
  // What two spans are to one another does not depend on the order they are placed in, and up to 720 orders are
  // tried, so each fact is worked out once a pair, here: whether the first's top stands on the second's bottom
  // (`stands`), whether the two are too near to share a track (`near`), and how many of the second's tops and
  // bottoms lie within the first, which cross it when the second lies on the other side (`above`, `below`).
  const tops = spans.map((span) => span.tops);
  const bottoms = spans.map((span) => span.bottoms);
  const stands = new Uint8Array(count * count);
  const near = new Uint8Array(count * count);
  const above = new Int32Array(count * count);
  const below = new Int32Array(count * count);
  // The verticals of other wires that cross a span cross it wherever it lies.
  let always = 0;
  for (let i = 0; i < count; i += 1) {
    const { low, high, wire } = spans[i];
    const within = (x) => x > low + 0.5 && x < high - 0.5;
    for (let j = 0; j < count; j += 1) {
      const pair = i * count + j;
      if (tops[i].some((x) => bottoms[j].some((y) => Math.abs(x - y) < 1))) stands[pair] = 1;
      if (!(high + apart <= spans[j].low || spans[j].high + apart <= low)) near[pair] = 1;
      if (i === j || wire === spans[j].wire) continue;
      for (const x of tops[j]) if (within(x)) above[pair] += 1;
      for (const x of bottoms[j]) if (within(x)) below[pair] += 1;
    }
    for (const crosser of crossers) if (crosser.wire !== wire && within(crosser.x)) always += 1;
  }
  /** @type {any} */
  let best = null;
  placing: for (const sequence of orders) {
    const track = new Array(count).fill(-1);
    for (const i of sequence) {
      let floor = 0;
      for (let j = 0; j < count; j += 1)
        if (j !== i && track[j] >= 0 && stands[j * count + i])
          floor = Math.max(floor, track[j] + 1);
      let level = floor;
      for (let j = 0; j < count; j += 1)
        if (track[j] === level && near[j * count + i]) {
          level += 1;
          j = -1;
        }
      for (let j = 0; j < count; j += 1)
        if (j !== i && track[j] >= 0 && stands[i * count + j] && track[j] <= level)
          continue placing;
      track[i] = level;
    }
    let crossings = always;
    for (let i = 0; i < count; i += 1)
      for (let j = 0; j < count; j += 1)
        if (track[i] < track[j]) crossings += above[i * count + j];
        else if (track[i] > track[j]) crossings += below[i * count + j];
    const tracks = Math.max(...track) + 1;
    const score = tracks * 3 + crossings * 10;
    if (!best || score < best.score) best = { score, tracks, track, crossings };
  }
  return best;
}
