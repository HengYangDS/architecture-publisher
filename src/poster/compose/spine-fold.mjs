import { CELL } from "../balance.mjs";
import { middleOf, near, pairOf, pairsOf } from "./free.mjs";
import { GATES } from "./gates.mjs";

/**
 * The spine's fold: its cards placed in rows across the field and what each of its relations is drawn as, before any
 * wire is routed (`spine-wires.mjs`). The path's stations stand in two or three rows, each row spread from edge to
 * edge, the line leaving a row's end at the frame's side and entering the next row from that side, so that the rows
 * read left to right and back (the serpentine). Every other part is a branch, in a band above or below its station's
 * row, near its station or spread across the band toward the corners the line leaves blank. Parts outside the
 * repository stand beside a station at a row's end, beyond the boundary at the frame's side, or in a row of their own
 * above or below the boundary; an end of the path outside may stand either way. A part related to no station, which
 * only a spine its author names leaves, stands above the first row of stations or below the last, or in a row of parts
 * outside where it lies outside. No card comes nearer the frame than the grid's row padding.
 */

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} Box
 * @typedef {{ boxes: Map<string, Box>,
 *   rows: Array<{ kind: string, key: string | number, members: string[], height: number, top: number }>,
 *   rowAt: (id: string) => number, stationRow: (id: string) => number, at: Map<string, number>,
 *   pairs: Map<string, any[]>,
 *   turns: Array<{ r: number, side: "left" | "right", half: number, room: number, x: number }>,
 *   lanes: Array<{ wire: any, gap: number, side: "up" | "down", row: number, y: number }>,
 *   wires: Array<{ relation: any, kind: string, line: boolean, points: number[][] }>,
 *   wrapped: Map<any, any>, boundary: (Box & { name: string }) | null, tab: Box | null }} Fold
 *   A spine's cards placed, its rows down the figure, where each station and part stands, its relations by pair,
 *   its turns and lanes, each relation's kind of line, the line's labels as wrapped to fit, its boundary and the
 *   boundary's name.
 */

/** The least distance from a wire's port to the corner of its card's edge, in px. */
export const CORNER = 16;

/**
 * The px the fold adds to a label's clearance (`labelClear`) where it keeps room for the label beside a line: once
 * beside a turn's upright, twice beside a rung, so that the room it keeps is never exactly the clearance the label's
 * test (`labelClearance`) asks.
 */
const SLACK = 4;

/**
 * The widest a label on the line wraps to falls by this many px at a time, down to `narrowest`, until each row of
 * stations fits across the field.
 */
const WRAP = Object.freeze({ step: 8, narrowest: 32 });

/** The x on a card's top or foot nearest another card, `CORNER` from its corners at least. */
export const nearestX = (box, other) =>
  Math.min(box.x + box.width - CORNER, Math.max(box.x + CORNER, middleOf(other)[0]));

/** A sum of numbers. */
const sum = (/** @type {number[]} */ values) => values.reduce((total, value) => total + value, 0);

/**
 * Starts for boxes of given sizes in order, each as near its wanted centre as the others leave it, `gap` apart and
 * within [low, high]; null where they do not fit.
 * @param {Array<{ want: number, size: number }>} items
 * @param {number} gap
 * @param {number} low
 * @param {number} high
 */
function pack(items, gap, low, high) {
  const starts = [];
  let end = low - gap;
  for (const { want, size } of items) {
    const start = Math.max(want - size / 2, end + gap, low);
    starts.push(start);
    end = start + size;
  }
  let limit = high;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const start = Math.min(starts[index], limit - items[index].size);
    starts[index] = start;
    limit = start - gap;
  }
  return starts.length && starts[0] < low - 0.5 ? null : starts;
}

/**
 * Starts for boxes of given sizes in order, as `pack` places them, keeping clear of intervals across: each box goes to
 * the stretch between them nearest its want that still has room, in order; null where they do not fit.
 * @param {Array<{ want: number, size: number }>} items
 * @param {number} gap
 * @param {number} low
 * @param {number} high
 * @param {Array<{ from: number, to: number }>} obstacles
 */
function packAround(items, gap, low, high, obstacles) {
  if (!obstacles.length) return pack(items, gap, low, high);
  /** @type {number[][]} */
  const stretches = [];
  let x = low;
  for (const { from, to } of [...obstacles].sort((a, b) => a.from - b.from)) {
    if (from > x) stretches.push([x, Math.min(from, high)]);
    x = Math.max(x, to);
  }
  if (x < high) stretches.push([x, high]);
  /** @type {Array<Array<{ want: number, size: number }>>} */
  const taken = stretches.map(() => []);
  let from = 0;
  for (const item of items) {
    let best = -1;
    let distance = Infinity;
    for (let k = from; k < stretches.length; k += 1) {
      const used = sum(taken[k].map((one) => one.size + gap));
      if (used + item.size > stretches[k][1] - stretches[k][0] + 0.5) continue;
      const off = Math.max(0, stretches[k][0] - item.want, item.want - stretches[k][1]);
      if (off < distance) [best, distance] = [k, off];
    }
    if (best < 0) return null;
    taken[best].push(item);
    from = best;
  }
  const starts = [];
  for (let k = 0; k < stretches.length; k += 1) {
    if (!taken[k].length) continue;
    const placed = pack(taken[k], gap, stretches[k][0], stretches[k][1]);
    if (!placed) return null;
    starts.push(...placed);
  }
  return starts;
}

/**
 * The boundary round a fold's cards inside, its turns' labels and its lanes, clear of every card outside by its
 * padding; and its name's tab on its top edge, as the figure drawing sets it (`figure.mjs`), from the edge's left end
 * past the name and as far under the edge as above it, which labels keep off and the balance read before drawing
 * counts. Or the fault where a card outside stands within that padding.
 * @param {NonNullable<ReturnType<typeof import("./free.mjs").cardsAt>>} cards
 * @param {Map<string, { x: number, y: number, width: number, height: number }>} boxes
 * @param {{ turns: Array<{ side: string, x: number, half: number }>, lanes: Array<{ y: number }>,
 *   laneRoom: number }} lines the turns and the lanes of arches, and the room a lane keeps for its label
 * @param {{ name: string, typefaces: any }} named the boundary's name and the faces it is set in
 * @returns {{ fault: string } | { boundary: Box & { name: string }, tab: Box }}
 */
function frameOf(cards, boxes, { turns, lanes, laneRoom }, { name, typefaces }) {
  const { spacing, card } = cards.metrics;
  const ins = [...boxes].filter(([id]) => !cards.outside(id)).map(([, box]) => box);
  const reach = turns.map((t) =>
    t.side === "right"
      ? t.x + t.half + spacing.labelClear + SLACK
      : t.x - t.half - spacing.labelClear - SLACK,
  );
  const laneEdges = lanes.flatMap((lane) => [lane.y - laneRoom / 2, lane.y + laneRoom / 2]);
  const left = Math.min(...ins.map((box) => box.x - spacing.boundaryPad), ...reach);
  const right = Math.max(...ins.map((box) => box.x + box.width + spacing.boundaryPad), ...reach);
  const upper =
    Math.min(...ins.map((box) => box.y), ...laneEdges) - spacing.boundaryPad - spacing.boundaryHead;
  const lower =
    Math.max(...ins.map((box) => box.y + box.height), ...laneEdges) + spacing.boundaryBottom;
  const boundary = {
    x: left,
    y: upper,
    width: right - left,
    height: lower - upper,
    name,
  };
  for (const [id, box] of boxes)
    if (cards.outside(id) && near(box, boundary, spacing.boundaryPad - 1))
      return { fault: "boundary" };
  const tab = {
    x: left,
    y: upper - spacing.boundaryHead,
    width:
      spacing.boundaryPad +
      card.pad +
      typefaces.measure(name, cards.styles.boundary) +
      spacing.boundaryHead,
    height: 2 * spacing.boundaryHead,
  };
  return { boundary, tab };
}

/**
 * Each card's top, once its rows are set down the figure: a station in the middle of its row; any other card against
 * the rows of stations, a branch against its station's.
 * @param {Array<{ kind: string, key: string | number, members: string[], height: number, top: number }>} rows
 * @param {(id: string) => Box} boxOf
 * @param {Map<string, { anchor: string }>} branches
 * @param {(id: string) => number} rowAt
 */
function setTops(rows, boxOf, branches, rowAt) {
  rows.forEach((one, index) => {
    for (const id of one.members) {
      const box = boxOf(id);
      const entry = branches.get(id);
      const below = entry ? rowAt(entry.anchor) > index : [0, "top"].includes(one.key);
      if (one.kind === "station") box.y = one.top + (one.height - box.height) / 2;
      else box.y = below ? one.top + one.height - box.height : one.top;
    }
  });
}

/**
 * The spine's cards placed at one type step in one arrangement, in a field at the origin, and what its wires are drawn
 * from; or the fault that stops it (`FAULTS`). Each relation is drawn as one kind of line: `path`, a straight wire
 * along a row or to a card beside a row's end; `turn`, between a row's end and the next row's first station; `rung`,
 * between stations of rows next to each other that are not neighbours on the path; `arch`, between such stations in
 * one row, of which a figure draws one at most; `edge`, a branch's wire to a station in the row next to its band;
 * `free`, any other. A relation from a station to the next, or on from the start or to the end set in a row of its
 * own, is the line's own (`line`): a reply between neighbours and a branch beside a row's end run where the line runs
 * but are not the line.
 * @param {NonNullable<ReturnType<typeof import("./free.mjs").cardsAt>>} cards
 * @param {{ plan: { stations: string[], branches: Map<string, { anchor: string, stations: string[] }>,
 *   orphans: string[] },
 *   split: number[], siding: Map<string, string>, arch: "up" | "down", spread: boolean,
 *   fill: "even" | "labelled", line: Set<string> }} arrangement
 * @param {{ relations: any[], ids: string[], field: { width: number, height: number }, name: string,
 *   typefaces: any }} figure the view's relations and parts, the field, the boundary's name and the faces
 * @returns {{ fault: string } | Fold}
 */
export function foldSpine(cards, arrangement, { relations, ids, field, name, typefaces }) {
  const { sizes, metrics, label, outside } = cards;
  const { spacing, wire } = metrics;
  const { width: W, height: H } = field;
  const { plan, split, siding, spread, line: lineEdges } = arrangement;
  const size = (/** @type {string} */ id) =>
    /** @type {{ width: number, height: number }} */ (sizes.get(id));
  const stations = plan.stations;
  const at = new Map(stations.map((id, index) => [id, index]));
  /** @type {string[][]} */
  const stationRows = [];
  for (let start = 0, r = 0; r < split.length; start += split[r], r += 1)
    stationRows.push(stations.slice(start, start + split[r]));
  const R = stationRows.length;
  /** @type {Map<string, number>} */
  const rowOf = new Map();
  stationRows.forEach((row, r) => row.forEach((id) => rowOf.set(id, r)));
  const row = (/** @type {string} */ id) => /** @type {number} */ (rowOf.get(id));
  const leftward = (/** @type {number} */ r) => r % 2 === 1;
  const bounded = ids.some(outside) && ids.some((id) => !outside(id));
  const frameMargin = spacing.rowPad;
  const pairs = pairsOf(relations);

  // The turns: each runs out of its row's end at the frame's side, down beside the two rows, and into the next row's
  // first station from that side, with an arrowhead where it turns down; the two rows end short of that side by what
  // the turn needs: its arrowhead's stub and half its label, which is set on the turn's upright.
  /** @type {Array<{ r: number, side: "left" | "right", half: number, room: number, x: number }>} */
  const turns = [];
  for (let r = 0; r < R - 1; r += 1) {
    const between =
      pairs.get(
        pairOf({
          from: stationRows[r][stationRows[r].length - 1],
          to: stationRows[r + 1][0],
        }),
      ) ?? [];
    const half = Math.max(
      0,
      ...between.map(
        (relation) => (relation.label ? label(relation, wire.maximumLabel / 2).width : 0) / 2,
      ),
    );
    const clear = half + spacing.labelClear + SLACK - (bounded ? spacing.boundaryPad : 0);
    const room = wire.arrow + spacing.arrowStub + Math.max(spacing.arrowStub, clear);
    turns.push({ r, side: leftward(r) ? "left" : "right", half, room, x: 0 });
  }
  const turnRoom = (/** @type {number} */ r, /** @type {string} */ side) =>
    Math.max(
      0,
      ...turns.filter((t) => (t.r === r || t.r === r - 1) && t.side === side).map((t) => t.room),
    );
  const lowOf = (/** @type {number} */ r) => turnRoom(r, "left");
  const highOf = (/** @type {number} */ r) => turnRoom(r, "right");
  const lineEnds = new Set(
    relations
      .filter(({ id }) => lineEdges.has(id))
      .flatMap(({ from, to }) => [from, to])
      .filter((id) => !at.has(id)),
  );

  // The cards outside that stand beyond the boundary at a row's end, level with the station they join: an end of the
  // path that lies outside, or a branch outside set beside its station, which must stand at its row's end. A row holds
  // one at each end at most, and none at an end where a turn runs.
  const inner = (/** @type {string[]} */ ids) => ids.filter((id) => !(bounded && outside(id)));
  const xOrder = (/** @type {number} */ r) =>
    leftward(r) ? [...inner(stationRows[r])].reverse() : inner(stationRows[r]);
  /** @type {Array<{ id: string, neighbour: string, row: number, side: "left" | "right" }>} */
  const flanks = [];
  const flank = (
    /** @type {string} */ id,
    /** @type {string} */ neighbour,
    /** @type {"left" | "right"} */ natural,
  ) => {
    const r = row(neighbour);
    const order = xOrder(r);
    const side =
      order.length === 1
        ? natural
        : order[0] === neighbour
          ? "left"
          : order.at(-1) === neighbour
            ? "right"
            : null;
    if (!side || flanks.some((one) => one.row === r && one.side === side)) return false;
    if ((side === "left" && lowOf(r) > 0) || (side === "right" && highOf(r) > 0)) return false;
    flanks.push({ id, neighbour, row: r, side });
    return true;
  };
  const [first, last] = [stations[0], stations[stations.length - 1]];
  if (bounded && outside(first) && !flank(first, stations[1], "left")) return { fault: "boundary" };
  const lastSide = leftward(R - 1) ? "left" : "right";
  if (bounded && outside(last) && !flank(last, stations[stations.length - 2], lastSide))
    return { fault: "boundary" };
  for (const [id, { anchor }] of plan.branches)
    if (siding.get(id) === "beside" && !flank(id, anchor, "right")) return { fault: "boundary" };
  const flanked = new Map(flanks.map((one) => [one.id, one]));

  const kindOf = (/** @type {{ from: string, to: string }} */ relation) => {
    const [a, b] = [flanked.get(relation.from), flanked.get(relation.to)];
    if ((a && a.neighbour === relation.to) || (b && b.neighbour === relation.from)) return "path";
    if (a || b) return "free";
    const [i, j] = [at.get(relation.from), at.get(relation.to)];
    if (i === undefined || j === undefined) return "branch";
    const [ri, rj] = [row(relation.from), row(relation.to)];
    if (Math.abs(i - j) === 1) return ri === rj ? "path" : "turn";
    return Math.abs(ri - rj) === 1 ? "rung" : "arch";
  };
  // An arch bends over or under its row: a figure draws one at most, between two stations of one row.
  const arches = relations.filter((relation) => kindOf(relation) === "arch");
  if (arches.length > 1 || (arches.length && row(arches[0].from) !== row(arches[0].to)))
    return { fault: "lines" };

  // The rows down the figure: a row of parts outside above the boundary, the bands of branches and the rows of
  // stations in turn, and a row of parts outside below it.
  /** @type {Map<string, string | number>} */
  const bandAt = new Map();
  for (const [id, { anchor }] of plan.branches) {
    if (flanked.has(id)) continue;
    const up = siding.get(id) === "up";
    bandAt.set(id, bounded && outside(id) ? (up ? "top" : "bottom") : row(anchor) + (up ? 0 : 1));
  }
  for (const id of plan.orphans) {
    const up = siding.get(id) === "up";
    bandAt.set(id, bounded && outside(id) ? (up ? "top" : "bottom") : up ? 0 : R);
  }
  const membersOf = (/** @type {string | number} */ band) =>
    [...bandAt].filter(([, b]) => b === band).map(([id]) => id);
  /** @type {Array<{ kind: "outside" | "band" | "station", key: string | number, members: string[],
   *   height: number, top: number }>} */
  const rows = [];
  const push = (
    /** @type {"outside" | "band" | "station"} */ kind,
    /** @type {string | number} */ key,
    /** @type {string[]} */ members,
  ) => {
    if (members.length)
      rows.push({
        kind,
        key,
        members,
        height: Math.max(...members.map((id) => size(id).height)),
        top: 0,
      });
  };
  push("outside", "top", membersOf("top"));
  for (let r = 0; r < R; r += 1) {
    push("band", r, membersOf(r));
    const beside = flanks.filter((one) => one.row === r && !at.has(one.id)).map(({ id }) => id);
    push("station", r, [...stationRows[r], ...beside]);
  }
  push("band", R, membersOf(R));
  push("outside", "bottom", membersOf("bottom"));
  /** @type {Map<string, number>} */
  const rowIndex = new Map();
  rows.forEach((one, index) => one.members.forEach((id) => rowIndex.set(id, index)));
  const rowAt = (/** @type {string} */ id) => /** @type {number} */ (rowIndex.get(id));

  // Across: each row of stations from edge to edge, each gap as wide as its wire's label needs; a card beside a row's
  // end stands beyond the boundary, its wire's gap wide enough for its label on one side of the boundary's edge.
  const pad = frameMargin + (bounded ? spacing.boundaryPad : 0);
  const stub = 2 * (wire.arrow + spacing.arrowStub);
  /** The line's labels as wrapped to fit their gaps across. */
  const wrapped = new Map();
  const longestWord = (relation) =>
    Math.max(
      ...relation.label
        .split(/\s+/u)
        .map((word) => label({ ...relation, label: word, details: [] }).width),
    ) -
    2 * wire.labelPadX;
  const gapFor = (/** @type {string} */ a, /** @type {string} */ b, /** @type {number} */ most) => {
    let gap = spacing.column;
    for (const relation of pairs.get(pairOf({ from: a, to: b })) ?? [])
      if (relation.label) {
        const box = label(relation, Math.max(most, longestWord(relation)));
        wrapped.set(relation, box);
        gap = Math.max(gap, box.width + stub);
      }
    return gap;
  };
  const flankGap = (/** @type {number} */ most, one) =>
    gapFor(one.id, one.neighbour, most) + 2 * spacing.boundaryPad + spacing.labelClear;
  /** @type {Map<string, { x: number, y: number, width: number, height: number }>} */
  const boxes = new Map();
  const boxOf = (/** @type {string} */ id) =>
    /** @type {{ x: number, y: number, width: number, height: number }} */ (boxes.get(id));
  let low = pad;
  let high = W - pad;
  let placed = false;
  for (let most = wire.maximumLabel; most >= WRAP.narrowest && !placed; most -= WRAP.step) {
    low = pad;
    high = W - pad;
    for (const one of flanks) {
      const reach = frameMargin + size(one.id).width + flankGap(most, one);
      if (one.side === "left") low = Math.max(low, reach);
      else high = Math.min(high, W - reach);
    }
    const widthOf = (/** @type {string[]} */ ordered) =>
      sum(ordered.map((id) => size(id).width)) +
      sum(ordered.slice(1).map((id, index) => gapFor(ordered[index], id, most)));
    if (!stationRows.every((_, r) => widthOf(xOrder(r)) <= high - highOf(r) - (low + lowOf(r))))
      continue;
    placed = true;
    stationRows.forEach((_, r) => {
      const ordered = xOrder(r);
      const [from, to] = [low + lowOf(r), high - highOf(r)];
      const gaps = ordered.slice(1).map((id, index) => gapFor(ordered[index], id, most));
      const spreadBy =
        ordered.length > 1 ? (to - from - widthOf(ordered)) / (ordered.length - 1) : 0;
      // A row of one station stands at the edge where the line turns out of it, or, in the last row, where it turns
      // in.
      const atHigh = r < R - 1 ? !leftward(r) : leftward(r);
      let x = ordered.length > 1 || !atHigh ? from : to - size(ordered[0]).width;
      ordered.forEach((id, index) => {
        boxes.set(id, { x, y: 0, ...size(id) });
        x += size(id).width + (gaps[index] ?? 0) + spreadBy;
      });
    });
    // A card beside a row's end stands beyond the boundary at the frame's side, its wire running straight to its
    // station wherever that stands in the row.
    for (const one of flanks) {
      const gap = flankGap(most, one);
      const x = one.side === "left" ? low - gap - size(one.id).width : high + gap;
      boxes.set(one.id, { x, y: 0, ...size(one.id) });
    }
  }
  if (!placed) return { fault: "cards" };
  // A turn's upright stands its arrowhead's stub beyond the two rows' ends.
  for (const t of turns)
    t.x =
      t.side === "right"
        ? high - highOf(t.r) + wire.arrow + spacing.arrowStub
        : low + lowOf(t.r) - wire.arrow - spacing.arrowStub;

  // The bands: each card as near its stations as the others leave it, a part inside within the boundary's room.
  for (const band of rows) {
    if (band.kind === "station") continue;
    const want = (/** @type {string} */ id) => {
      const entry = plan.branches.get(id);
      if (!entry) return null;
      const { anchor, stations: related } = entry;
      const beside = related
        .filter((station) => row(station) === row(anchor))
        .map((station) => middleOf(boxOf(station))[0]);
      return beside.length ? sum(beside) / beside.length : middleOf(boxOf(anchor))[0];
    };
    const inside = band.kind !== "outside";
    // A band's room across: the rows' span inside the boundary; the field within its margin for a row outside.
    let [bandLow, bandHigh] = inside ? [low, high] : [frameMargin, W - frameMargin];
    // A band between two rows keeps clear of their turn's upright and its label.
    const turn =
      inside && typeof band.key === "number"
        ? turns.find((t) => t.r === Number(band.key) - 1)
        : null;
    if (turn?.side === "right")
      bandHigh = Math.min(bandHigh, turn.x - turn.half - spacing.labelClear);
    else if (turn) bandLow = Math.max(bandLow, turn.x + turn.half + spacing.labelClear);
    // A band between two rows of stations keeps clear of the rungs that cross it, and of their labels and those of
    // its own branches.
    const index = rows.indexOf(band);
    const above = rows.slice(0, index).findLast((one) => one.kind === "station");
    const below = rows.slice(index + 1).find((one) => one.kind === "station");
    /** @type {Array<{ from: number, to: number }>} */
    const obstacles = [];
    if (above && below)
      for (const relation of relations) {
        const [a, b] = [relation.from, relation.to];
        if (!at.has(a) || !at.has(b) || flanked.has(a) || flanked.has(b)) continue;
        if (Math.abs(Number(at.get(a)) - Number(at.get(b))) === 1) continue;
        const spans = [row(a), row(b)];
        if (
          !spans.includes(Number(above.key)) ||
          !spans.includes(Number(below.key)) ||
          spans[0] === spans[1]
        )
          continue;
        const [upper, lower] = row(a) === above.key ? [boxOf(a), boxOf(b)] : [boxOf(b), boxOf(a)];
        const overlap = [
          Math.max(upper.x, lower.x) + CORNER,
          Math.min(upper.x + upper.width, lower.x + lower.width) - CORNER,
        ];
        // A rung runs straight down where its stations overlap; else each of its uprights stands where it leaves its
        // station, at the corner nearest the other.
        const xs =
          overlap[1] >= overlap[0]
            ? [(overlap[0] + overlap[1]) / 2]
            : [nearestX(upper, lower), nearestX(lower, upper)];
        const own = relation.label ? label(relation).width : 0;
        const widest = Math.max(
          0,
          ...band.members
            .flatMap((id) => relations.filter((one) => one.from === id || one.to === id))
            .map((one) => (one.label ? label(one).width : 0)),
        );
        const half = Math.max(
          spacing.column / 2,
          Math.max(own, widest) / 2 + spacing.labelClear + 2 * SLACK,
        );
        for (const x of xs) obstacles.push({ from: x - half, to: x + half });
      }
    // Near: each card as near its stations as the others leave it. Spread: the band's cards, in that order, spread
    // across its room, so they reach the corners the line leaves blank; an end of the path keeps to its station, so
    // the line stays straight.
    // A part related to no station wants the middle of its band.
    const order = band.members
      .map((id) => ({ id, near: want(id) ?? (bandLow + bandHigh) / 2 }))
      .sort((p, q) => p.near - q.near)
      .map(({ id, near: wanted }, k, all) => ({
        id,
        want:
          spread && !lineEnds.has(id)
            ? bandLow + ((k + 0.5) * (bandHigh - bandLow)) / all.length
            : wanted,
      }))
      .sort((p, q) => p.want - q.want);
    const starts = packAround(
      order.map(({ id, want: wanted }) => ({
        want: wanted,
        size: size(id).width,
      })),
      spacing.column,
      bandLow,
      bandHigh,
      obstacles,
    );
    if (!starts) return { fault: "cards" };
    band.members = order.map(({ id }) => id);
    band.members.forEach((id, k) => boxes.set(id, { x: starts[k], y: 0, ...size(id) }));
  }

  // The wires, each with the kind of line it is drawn as. A branch's wire to a station in the row next to its band,
  // or across a row of parts outside with no stations between, leaves the station's edge; any other is free.
  const wires = relations.map((relation) => {
    let kind = kindOf(relation);
    if (kind === "branch") {
      const station = [relation.from, relation.to].find((id) => at.has(id));
      const other = station === relation.from ? relation.to : relation.from;
      const [i, j] = station ? [rowAt(station), rowAt(other)] : [0, 0];
      const between = rows
        .slice(Math.min(i, j) + 1, Math.max(i, j))
        .some((one) => one.kind === "station");
      kind = station && !between ? "edge" : "free";
    }
    const [source, target] = [at.get(relation.from), at.get(relation.to)];
    const line = (source !== undefined && target === source + 1) || lineEdges.has(relation.id);
    return { relation, kind, line, points: /** @type {number[][]} */ ([]) };
  });
  // The line's own wires run along a row, turn between rows or reach an end in a row of its own, never free.
  if (wires.some((w) => w.line && w.kind === "free")) return { fault: "lines" };

  // Down: the rows from the field's top to its foot, each gap as tall as the wires crossing it and their labels need,
  // with the boundary's edge and name where it runs between a row inside and a row outside, and a lane for an arch;
  // what is left is shared by the gaps, so the figure fills its frame.
  const holdsInside = (one) => one.members.some((id) => !(bounded && outside(id)));
  const labelHeight = (relation) =>
    relation.label ? (wrapped.get(relation) ?? label(relation)).height : 0;
  const arched = wires.filter((w) => w.kind === "arch");
  const laneRoom =
    Math.max(0, ...arched.map((w) => labelHeight(w.relation))) + 2 * spacing.labelClear;
  const head = spacing.rowPad + spacing.boundaryPad + spacing.boundaryHead;
  const foot = spacing.rowPad + spacing.boundaryBottom;
  // Below the boundary's top edge: its name's tab, which reaches as far under the edge as above it, its padding and
  // a label's clearance.
  const edgeRoom = 2 * spacing.boundaryHead + spacing.boundaryPad + spacing.labelClear;
  /**
   * The lane of an arch, over or under its row, in the gap that holds it (gap g lies between rows g and g + 1; -1
   * above the first, the last below the last).
   * @type {Array<{ wire: any, gap: number, side: "up" | "down", row: number, y: number }>}
   */
  const lanes = arched.map((w) => {
    const r = rowAt(w.relation.from);
    const side = arrangement.arch;
    return { wire: w, gap: side === "up" ? r - 1 : r, side, row: r, y: 0 };
  });
  const lanesIn = (/** @type {number} */ gap) =>
    lanes.filter((lane) => lane.gap === gap).length * (laneRoom + spacing.arrowStub);
  const joins = (w, /** @type {number} */ gap) => {
    const [i, j] = [rowAt(w.relation.from), rowAt(w.relation.to)];
    return Math.min(i, j) === gap && Math.max(i, j) === gap + 1;
  };
  const gapsLeast = rows.slice(1).map((lower, index) => {
    const upper = rows[index];
    // A wire that joins the two rows sets its label in this gap, clear of both rows' cards and its arrowheads'
    // stubs; a longer wire finds its label a place along its length.
    const labels = Math.max(
      0,
      ...wires.filter((w) => joins(w, index)).map((w) => labelHeight(w.relation)),
    );
    const edge =
      bounded && holdsInside(upper) !== holdsInside(lower)
        ? holdsInside(lower)
          ? edgeRoom
          : spacing.boundaryBottom + spacing.boundaryPad + spacing.labelClear
        : 0;
    return 2 * Math.max(spacing.arrowStub, spacing.labelGap) + labels + lanesIn(index) + edge;
  });
  const top = (bounded && holdsInside(rows[0]) ? head : frameMargin) + lanesIn(-1);
  const bottom =
    (bounded && holdsInside(rows.at(-1)) ? foot : frameMargin) + lanesIn(rows.length - 1);
  const room = H - sum(rows.map((one) => one.height)) - top - bottom - sum(gapsLeast);
  if (room < 0) return { fault: "cards" };
  // The room left over is shared by the gaps: evenly; or, to keep a gap that holds no label from opening into a blank
  // band across the figure, first by the gaps that set a label, each other gap growing only short of the blank-band
  // gate, less a measuring cell on either side.
  const labelled = gapsLeast.map(
    (_, index) =>
      lanes.some(({ gap, wire: w }) => gap === index && w.relation.label) ||
      wires.some((w) => w.relation.label && joins(w, index)),
  );
  const shares = gapsLeast.map(() => room / Math.max(1, gapsLeast.length));
  if (arrangement.fill === "labelled" && labelled.some(Boolean) && labelled.some((one) => !one)) {
    let left = room;
    gapsLeast.forEach((least, index) => {
      shares[index] = labelled[index]
        ? 0
        : Math.max(0, Math.min(left, GATES.band - 2 * CELL - least));
      left -= shares[index];
    });
    const count = labelled.filter(Boolean).length;
    gapsLeast.forEach((_, index) => {
      if (labelled[index]) shares[index] = left / count;
    });
  }
  let y = top;
  rows.forEach((one, index) => {
    one.top = y;
    y += one.height + (gapsLeast[index] ?? 0) + (shares[index] ?? 0);
  });
  setTops(rows, boxOf, plan.branches, rowAt);
  // A lane runs beside its row, an arrowhead's stub and half its label's room off the row's cards.
  for (const lane of lanes) {
    const { top: rowTop, height } = rows[lane.row];
    lane.y =
      lane.side === "up"
        ? rowTop - spacing.arrowStub - laneRoom / 2
        : rowTop + height + spacing.arrowStub + laneRoom / 2;
  }

  const framed = bounded
    ? frameOf(cards, boxes, { turns, lanes, laneRoom }, { name, typefaces })
    : { boundary: null, tab: null };
  if ("fault" in framed) return framed;
  const { boundary, tab } = framed;
  return {
    boxes,
    rows,
    rowAt,
    stationRow: row,
    at,
    pairs,
    turns,
    lanes,
    wires,
    wrapped,
    boundary,
    tab,
  };
}
