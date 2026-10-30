import { permutations } from "./permutations.mjs";

/**
 * Exact routing of one channel: each wire's options name where its verticals
 * turn, and the search picks the clean assignment with the fewest label rows,
 * tracks and crossings.
 * @typedef {import("./channels.mjs").Channel} Channel
 * @typedef {import("./channels.mjs").LabelBox} LabelBox
 */

const SEARCH_BUDGET = 60_000;
export const MAXIMUM_LABEL_ROWS = 3;

/**
 * Label centers along a horizontal: its middle and the middles of gaps between
 * verticals wide enough to keep the label clear of them.
 */
function slides(channel, made, low, high, own, spacing) {
  const label = /** @type {LabelBox} */ (made.label);
  const xs = [
    ...new Set([
      low,
      high,
      ...own,
      ...channel.wires.flatMap((other) => [...other.top, ...other.bottom].map((point) => point.x)),
    ]),
  ]
    .filter((x) => x >= low - 0.5 && x <= high + 0.5)
    .sort((a, b) => a - b);
  const out = [];
  if (high - low >= label.width + 2 * spacing.labelClear) out.push((low + high) / 2);
  for (let index = 1; index < xs.length; index += 1)
    if (xs[index] - xs[index - 1] >= label.width + 2 * spacing.labelClear)
      out.push((xs[index] + xs[index - 1]) / 2);
  return [...new Set(out.map((x) => Math.round(x * 2) / 2))];
}

/**
 * What an option costs for each of its verticals that turns in a band beside
 * another card than its own: one rising from the lower row into the upper band
 * under a card of the upper row, or one falling from the upper row into the
 * lower band over a card of the lower row. A reader takes such a vertical for a
 * wire of that card, so a turn on a label row, clear of both rows, wins over
 * it, and so does a band with up to two more tracks, which costs only height.
 */
const BORROWED_END = 8;

function options(channel, made, spacing) {
  const width = made.label?.width ?? 0;
  const clearOfEdges = (option) =>
    option.label === undefined ||
    (channel.edges ?? []).every(
      (edge) => Math.abs(edge - option.label) > width / 2 + spacing.labelClear,
    );
  const own = (ends) => new Set(ends.map(({ id }) => id).filter(Boolean));
  const [tops, bottoms] = [own(made.top), own(made.bottom)];
  const under = (cards, x, mine) =>
    cards.some(
      (card) =>
        !mine.has(card.id) && x > card.x - spacing.clear && x < card.x + card.width + spacing.clear,
    );
  const borrowed = (vertical) =>
    (vertical.from === "bottom" &&
      vertical.turn === "upper" &&
      under(channel.beside?.upper ?? [], vertical.x, tops)) ||
    (vertical.from === "top" &&
      vertical.turn === "lower" &&
      under(channel.beside?.lower ?? [], vertical.x, bottoms));
  return candidates(channel, made, spacing)
    .filter(clearOfEdges)
    .map((option) => {
      const ends = option.verticals.filter(borrowed).length;
      return { ...option, borrowed: ends, preference: option.preference + BORROWED_END * ends };
    });
}

function candidates(channel, made, spacing) {
  const label = made.label;
  const vertical = (x, from, turn, own = false) => ({ x, from, turn, own });
  const offset = (x, middle) => Math.abs(x - middle) / 400;
  if (made.type === "single") {
    const [x1, x2] = [made.top[0].x, made.bottom[0].x];
    if (Math.abs(x1 - x2) < 0.5)
      return [
        {
          name: "straight",
          label: label ? x1 : undefined,
          verticals: [vertical(x1, "top", "through", Boolean(label))],
          upper: [],
          lower: [],
          preference: 0,
        },
      ];
    const span = { low: Math.min(x1, x2), high: Math.max(x1, x2), tops: [x1], bottoms: [x2] };
    if (!label)
      return [
        {
          name: "upper",
          verticals: [vertical(x1, "top", "upper"), vertical(x2, "bottom", "upper")],
          upper: [span],
          lower: [],
          preference: 0,
        },
        {
          name: "lower",
          verticals: [vertical(x1, "top", "lower"), vertical(x2, "bottom", "lower")],
          upper: [],
          lower: [span],
          preference: 0,
        },
      ];
    return [
      ...slides(channel, made, span.low, span.high, [x1, x2], spacing).map((at) => ({
        name: "jog",
        label: at,
        jog: [span.low, span.high],
        verticals: [vertical(x1, "top", "row"), vertical(x2, "bottom", "row")],
        upper: [],
        lower: [],
        preference: offset(at, (x1 + x2) / 2),
      })),
      {
        name: "source",
        label: x1,
        verticals: [vertical(x1, "top", "lower", true), vertical(x2, "bottom", "lower")],
        upper: [],
        lower: [span],
        preference: 1,
      },
      {
        name: "target",
        label: x2,
        verticals: [vertical(x1, "top", "upper"), vertical(x2, "bottom", "upper", true)],
        upper: [span],
        lower: [],
        preference: 1.4,
      },
    ];
  }
  if (made.type === "fan-down" || made.type === "fan-up") {
    const down = made.type === "fan-down";
    const hub = (down ? made.top : made.bottom)[0].x;
    const leaves = (down ? made.bottom : made.top).map((point) => point.x);
    const span = {
      low: Math.min(hub, ...leaves),
      high: Math.max(hub, ...leaves),
      tops: down ? [hub] : leaves,
      bottoms: down ? leaves : [hub],
    };
    const own = [hub, ...leaves];
    const box = /** @type {LabelBox} */ (label);
    const clear = (at) =>
      own.every((x) =>
        Math.abs(x - at) < 0.5 ? at === hub : Math.abs(x - at) > box.width / 2 + 6,
      );
    const hubFrom = down ? "top" : "bottom";
    const leafFrom = down ? "bottom" : "top";
    return [
      ...[hub, ...slides(channel, made, span.low, span.high, own, spacing)]
        .filter(clear)
        .map((at) => ({
          name: "bar",
          label: at,
          jog: [span.low, span.high],
          verticals: [
            vertical(hub, hubFrom, "row"),
            ...leaves.map((x) => vertical(x, leafFrom, "row")),
          ],
          upper: [],
          lower: [],
          preference: offset(at, hub),
        })),
      down
        ? {
            name: "source",
            label: hub,
            verticals: [
              vertical(hub, "top", "lower", true),
              ...leaves.map((x) => vertical(x, "bottom", "lower")),
            ],
            upper: [],
            lower: [span],
            preference: 0.6,
          }
        : {
            name: "target",
            label: hub,
            verticals: [
              ...leaves.map((x) => vertical(x, "top", "upper")),
              vertical(hub, "bottom", "upper", true),
            ],
            upper: [span],
            lower: [],
            preference: 0.6,
          },
    ];
  }
  const fromTop = made.type === "u-down";
  const [xa, xb] = (fromTop ? made.top : made.bottom).map((point) => point.x);
  const from = fromTop ? "top" : "bottom";
  const span = {
    low: Math.min(xa, xb),
    high: Math.max(xa, xb),
    tops: fromTop ? [xa, xb] : [],
    bottoms: fromTop ? [] : [xa, xb],
  };
  const band = fromTop ? "lower" : "upper";
  return [
    ...slides(channel, made, span.low, span.high, [xa, xb], spacing).map((at) => ({
      name: "jog",
      label: at,
      jog: [span.low, span.high],
      verticals: [vertical(xa, from, "row"), vertical(xb, from, "row")],
      upper: [],
      lower: [],
      preference: offset(at, (xa + xb) / 2),
    })),
    ...[
      [xa, xb],
      [xb, xa],
    ].map(([x, other]) => ({
      name: "side",
      label: x,
      verticals: [vertical(x, from, band, true), vertical(other, from, band)],
      upper: fromTop ? [] : [span],
      lower: fromTop ? [span] : [],
      preference: 0.8,
    })),
  ];
}

/** Label rows a vertical passes, given the row its own wire's label or jog occupies. */
function rowsPassed(vertical, row, rows) {
  const all = [...Array(rows).keys()];
  if (vertical.from === "top")
    return vertical.turn === "upper"
      ? []
      : vertical.turn === "row"
        ? all.filter((k) => k < row)
        : all;
  return vertical.turn === "lower"
    ? []
    : vertical.turn === "row"
      ? all.filter((k) => k > row)
      : all;
}

function crossesBand(vertical, band) {
  if (band === "upper") return vertical.from === "top" && vertical.turn !== "upper";
  return (
    (vertical.from === "bottom" && (vertical.turn === "row" || vertical.turn === "upper")) ||
    (vertical.from === "top" && vertical.turn === "through")
  );
}

/**
 * Tracks for one band: fewest tracks, no shared vertical, fewest crossings.
 * Spans on one track keep `apart` between them, so neither seems to continue
 * the other.
 */
function assignTracks(spans, crossers, apart) {
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

/** Where a vertical turns, from the channel top down: upper band, label rows, lower band, through. */
const ZONE = Object.freeze({ upper: 0, row: 1, lower: 2, through: 3 });

/**
 * Whether two wires' verticals at one x would share a segment. A vertical from
 * the top must turn above one from the bottom; within one band the track
 * assignment orders them, so only turns in different zones or rows are decided here.
 */
function coincident(choice, other) {
  for (const a of choice.verticals)
    for (const b of other.verticals) {
      if (Math.abs(a.x - b.x) >= 1) continue;
      if (a.turn === "through" || b.turn === "through" || a.from === b.from) return true;
      const [top, topOption, bottom, bottomOption] =
        a.from === "top" ? [a, choice, b, other] : [b, other, a, choice];
      const [above, below] = [ZONE[top.turn], ZONE[bottom.turn]];
      if (above > below) return true;
      if (above === ZONE.row && below === ZONE.row && topOption.row >= bottomOption.row)
        return true;
    }
  return false;
}

/**
 * Whether `choice` for wire `index` fits the choices already made on its label
 * rows: labels keep `labelGap` from each other and `labelClear` from another
 * wire's jog or vertical, and jogs on one row keep `separation` apart. Where the
 * medium sets `join`, two wires' marks on one row, a jog or a label, keep it
 * apart: they share one line, and closer a reader continues one into the other.
 */
function compatible(channel, chosen, index, choice, rows, spacing) {
  const wires = channel.wires;
  const near = (a, b, gap) => a.low - gap < b.high && b.low - gap < a.high;
  const boxOf = (i, option) => {
    const width = /** @type {LabelBox} */ (wires[i].label).width;
    return { low: option.label - width / 2, high: option.label + width / 2 };
  };
  const mark = (i, option, row) =>
    option.row !== row
      ? null
      : option.jog
        ? { low: option.jog[0], high: option.jog[1] }
        : option.label !== undefined
          ? boxOf(i, option)
          : null;
  for (const [j, other] of chosen) {
    if (coincident(choice, other)) return false;
    for (let row = 0; row < rows; row += 1) {
      const mineBox =
        choice.label !== undefined && choice.row === row ? boxOf(index, choice) : null;
      const otherBox = other.label !== undefined && other.row === row ? boxOf(j, other) : null;
      const mineJog =
        choice.jog && choice.row === row ? { low: choice.jog[0], high: choice.jog[1] } : null;
      const otherJog =
        other.jog && other.row === row ? { low: other.jog[0], high: other.jog[1] } : null;
      if (mineBox && otherBox && near(mineBox, otherBox, spacing.labelGap)) return false;
      if (mineJog && otherBox && near(mineJog, otherBox, spacing.labelClear)) return false;
      if (otherJog && mineBox && near(otherJog, mineBox, spacing.labelClear)) return false;
      if (mineJog && otherJog && near(mineJog, otherJog, spacing.separation)) return false;
      if (spacing.join) {
        const [mine, theirs] = [mark(index, choice, row), mark(j, other, row)];
        if (mine && theirs && near(mine, theirs, spacing.join)) return false;
      }
      const passes = (option, at) =>
        option.verticals.filter(
          (vertical) =>
            rowsPassed(vertical, option.row, rows).includes(at) &&
            !(vertical.own && option.row === at),
        );
      const beside = (vertical, box) =>
        vertical.x > box.low - spacing.labelClear && vertical.x < box.high + spacing.labelClear;
      for (const vertical of passes(choice, row))
        if (otherBox && beside(vertical, otherBox)) return false;
      for (const vertical of passes(other, row))
        if (mineBox && beside(vertical, mineBox)) return false;
    }
  }
  return true;
}

function rowCrossings(chosen, rows) {
  let crossings = 0;
  for (const [i, option] of chosen)
    for (const [j, other] of chosen) {
      if (i === j || !other.jog) continue;
      for (const vertical of option.verticals)
        if (
          rowsPassed(vertical, option.row, rows).includes(other.row) &&
          !(vertical.own && option.row === other.row)
        )
          if (vertical.x > other.jog[0] && vertical.x < other.jog[1]) crossings += 1;
    }
  return crossings;
}

/**
 * Solve one channel exactly within a search budget: the clean assignment with
 * the fewest label rows from `minimumRows`, then the fewest tracks and
 * crossings. Returns null when none exists.
 */
export function solveChannel(channel, spacing, maximumRows = MAXIMUM_LABEL_ROWS, minimumRows = 1) {
  const wires = channel.wires;
  const choices = wires.map((made) => options(channel, made, spacing));
  // Many assignments differ only in label positions, so band tracks are solved once per band content.
  const solved = new Map();
  const tracksFor = (spans, crossers) => {
    const key = JSON.stringify([spans, crossers]);
    if (!solved.has(key))
      solved.set(key, assignTracks(spans, crossers, spacing.join ?? spacing.separation));
    return solved.get(key);
  };
  for (let rows = minimumRows; rows <= maximumRows; rows += 1) {
    /** @type {any} */
    let best = null;
    let visited = 0;
    const chosen = [];
    const walk = (index, preference) => {
      if (visited++ > SEARCH_BUDGET) return;
      if (best && preference >= best.score) return;
      if (index === wires.length) {
        const upper = [];
        const lower = [];
        for (const [i, option] of chosen) {
          option.upper.forEach((span) => upper.push({ ...span, wire: i }));
          option.lower.forEach((span) => lower.push({ ...span, wire: i }));
        }
        const crossers = (band) =>
          chosen.flatMap(([i, option]) =>
            option.verticals
              .filter((vertical) => crossesBand(vertical, band))
              .map((vertical) => ({ x: vertical.x, wire: i })),
          );
        const up = tracksFor(upper, crossers("upper"));
        const low = tracksFor(lower, crossers("lower"));
        if (!up || !low) return;
        const crossings = up.crossings + low.crossings + rowCrossings(chosen, rows);
        const score = preference + (up.tracks + low.tracks) * 3 + crossings * 10;
        if (!best || score < best.score)
          best = {
            score,
            crossings,
            borrowed: chosen.reduce((sum, [, option]) => sum + option.borrowed, 0),
            chosen: chosen.map(([i, option]) => [i, option]),
            upper,
            lower,
            up,
            low,
          };
        return;
      }
      for (const option of choices[index]) {
        const variants = option.label === undefined && !option.jog ? 1 : rows;
        for (let row = 0; row < variants; row += 1) {
          const choice = { ...option, row };
          if (!compatible(channel, chosen, index, choice, rows, spacing)) continue;
          chosen.push([index, choice]);
          walk(index + 1, preference + choice.preference);
          chosen.pop();
        }
      }
    };
    walk(0, 0);
    if (best) return finish(channel, best, rows, spacing);
  }
  return null;
}

function finish(channel, best, rows, spacing) {
  const combo = new Array(channel.wires.length);
  for (const [i, option] of best.chosen) combo[i] = option;
  const labelHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(
      0,
      ...combo.map((option, i) =>
        option.row === row && (option.label !== undefined || option.jog)
          ? (channel.wires[i].label?.height ?? 0)
          : 0,
      ),
    ),
  );
  const used = labelHeights.filter(Boolean).length;
  const rowsHeight =
    labelHeights.reduce((sum, height) => sum + height, 0) +
    spacing.labelRowGap * Math.max(0, used - 1);
  // From the channel top: a stub, the upper band, the label rows, the lower
  // band and an arrow stub. Label rows keep `labelClear` from a track on
  // either side, and the bands keep a track apart where no row parts them.
  const band = (tracks) => (tracks ? (tracks - 1) * spacing.track : 0);
  const [upper, lower] = [best.up.tracks, best.low.tracks];
  const upperTop = spacing.stub;
  const upperEnd = upperTop + band(upper);
  const rowsTop = !rowsHeight
    ? upperEnd
    : upper
      ? upperEnd + spacing.labelClear
      : upperTop + spacing.bandGap;
  const rowsEnd = rowsTop + rowsHeight;
  const lowerTop = rowsHeight
    ? rowsEnd + spacing.labelClear
    : upper
      ? upperEnd + spacing.track
      : upperTop;
  const end = lower ? lowerTop + band(lower) : rowsHeight ? rowsEnd : upperEnd;
  const height = Math.max(spacing.minChannel, end + spacing.bandGap + spacing.arrowStub);
  return {
    combo,
    score: best.score,
    crossings: best.crossings,
    borrowed: best.borrowed,
    labelHeights,
    rowsHeight,
    upperTop,
    rowsTop,
    lowerTop,
    height,
    upperTrack: new Map(best.upper.map((span, n) => [span.wire, best.up.track[n]])),
    lowerTrack: new Map(best.lower.map((span, n) => [span.wire, best.low.track[n]])),
  };
}
