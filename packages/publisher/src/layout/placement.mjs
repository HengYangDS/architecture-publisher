import { refuse } from "../refusal.mjs";
import { permutations } from "./permutations.mjs";

/**
 * Exact placement of rows on one column lattice. Positions are half columns:
 * position p puts a card's left edge at p / 2 pitches, so odd positions center
 * a card between two columns.
 */

const MAXIMUM_SPARE_COLUMNS = 2;
const PAIR_BUDGET = 3_000_000;
const WEIGHT = Object.freeze({
  crossing: 25,
  bus: 1.2,
  halfColumn: 0.6,
  order: 0.05,
  sameRowFits: 0.002,
  sameRowBlocked: 14,
  spareColumn: 1.5,
  boundarySpan: 0.05,
  corridor: 0.6,
});
const bend = (distance) => (distance === 0 ? 0 : distance === 1 ? 2.5 : 5 + 0.6 * distance);

/**
 * Sort a view's relations by how they cross rows.
 * @param {string[][]} rows component ids per row
 * @param {Array<{ id: string, from: string, to: string, label: string,
 *   details: Array<[string, string[]]>, status: string | null }>} relations
 */
export function classifyRelations(rows, relations) {
  const rowOf = new Map();
  rows.forEach((members, index) => members.forEach((id) => rowOf.set(id, index)));
  const span = (relation) => rowOf.get(relation.to) - rowOf.get(relation.from);
  const adjacent = relations.filter((relation) => Math.abs(span(relation)) === 1);
  const sameRow = relations.filter((relation) => span(relation) === 0);
  const long = relations.filter((relation) => Math.abs(span(relation)) > 1);
  const buses = [];
  const inBus = new Set();
  for (const [hubEnd, leafEnd, type] of [
    ["from", "to", "out"],
    ["to", "from", "in"],
  ]) {
    const groups = new Map();
    for (const relation of adjacent) {
      if (inBus.has(relation)) continue;
      const key = JSON.stringify([
        relation[hubEnd],
        rowOf.get(relation[leafEnd]),
        ...labelKey(relation),
      ]);
      groups.set(key, [...(groups.get(key) ?? []), relation]);
    }
    for (const group of groups.values()) {
      const leaves = group.map((relation) => relation[leafEnd]);
      if (group.length < 2 || new Set(leaves).size !== leaves.length) continue;
      buses.push({ type, hub: group[0][hubEnd], leaves, relations: group });
      group.forEach((relation) => inBus.add(relation));
    }
  }
  const singles = adjacent.filter((relation) => !inBus.has(relation));
  return { rowOf, adjacent, sameRow, long, buses, singles };
}

/**
 * Split each bus whose span would pass another wire leaving its hub on the same
 * side; its relations become single wires. `center` gives a card's center x.
 * @param {ReturnType<typeof classifyRelations>} classes
 * @param {(id: string) => number} center
 * @param {number} rowCount
 */
export function splitCrossedBuses(classes, center, rowCount) {
  const { rowOf } = classes;
  const all = [
    ...classes.singles,
    ...classes.sameRow,
    ...classes.long,
    ...classes.buses.flatMap((bus) => bus.relations),
  ];
  const kept = [];
  const singles = [...classes.singles];
  for (const bus of classes.buses) {
    const hubRow = rowOf.get(bus.hub);
    const direction = Math.sign(rowOf.get(bus.leaves[0]) - hubRow);
    const xs = bus.leaves.map(center);
    const [low, high] = [Math.min(...xs), Math.max(...xs)];
    const crossed = all.some((relation) => {
      if (
        bus.relations.includes(relation) ||
        (relation.from !== bus.hub && relation.to !== bus.hub)
      )
        return false;
      const other = relation.from === bus.hub ? relation.to : relation.from;
      const offset = rowOf.get(other) - hubRow;
      // A same-row relation turns through the channel below, or above in the last row.
      const sameSide =
        offset * direction > 0 || (offset === 0 && direction > 0 === hubRow < rowCount - 1);
      return sameSide && center(other) > low + 1 && center(other) < high - 1;
    });
    if (crossed) singles.push(...bus.relations);
    else kept.push(bus);
  }
  return { ...classes, buses: kept, singles };
}

/** Relations with one label, details and status share a bus and one label. */
export function labelKey(relation) {
  return [relation.label, JSON.stringify(relation.details), relation.status ?? ""];
}

/** Increasing positions in [0, slots) at least two apart; contiguous when `compact`. */
function placements(count, slots, compact) {
  if (compact) {
    const out = [];
    for (let start = 0; start + 2 * (count - 1) < slots; start += 1)
      out.push(Array.from({ length: count }, (_, index) => start + 2 * index));
    return count ? out : [[]];
  }
  const out = [];
  const walk = (index, start, positions) => {
    if (index === count) return void out.push(positions.slice());
    for (let position = start; position <= slots - 1 - 2 * (count - index - 1); position += 1) {
      positions.push(position);
      walk(index + 1, position + 2, positions);
      positions.pop();
    }
  };
  walk(0, 0, []);
  return out;
}

/**
 * Choose row orders and positions with the minimum cost.
 * @param {{ rows: string[][], relations: any[], order: Map<string, number>,
 *   external: (id: string) => boolean, rowLimit: number, contentWidth: number,
 *   card: { minWidth: number, maxWidth: number }, columnGap: number, inset: number,
 *   clearance: number, labelWidth: (relation: any, maxWidth: number) => number }} input
 */
export function placeRows(input) {
  const { rows } = input;
  const wide = rows.findIndex((members) => members.length > input.rowLimit);
  if (wide >= 0)
    refuse(
      "layout_row_too_wide",
      `Row ${wide + 1} holds ${rows[wide].length} components; a row holds at most ${input.rowLimit}. ` +
        "Declare more tiers or split the view.",
      [{ code: "layout_row_too_wide", path: `/rows/${wide}`, message: rows[wide].join(", ") }],
    );
  const relations = classifyRelations(rows, input.relations);
  const minimum = Math.max(1, ...rows.map((members) => members.length));
  let best = null;
  for (let columns = minimum; columns <= minimum + MAXIMUM_SPARE_COLUMNS; columns += 1) {
    const result = placeOnLattice(input, relations, columns, columns > minimum);
    if (!result) continue;
    const cost = result.cost + WEIGHT.spareColumn * (columns - minimum);
    if (!best || cost < best.total) best = { ...result, total: cost };
  }
  if (!best)
    refuse(
      "layout_row_too_wide",
      `A row of ${minimum} cards does not fit ${input.contentWidth} px at the minimum card width. ` +
        "Declare more tiers or split the view.",
    );
  return { ...best, relations };
}

function cardWidth(input, columns) {
  const free = input.contentWidth - 2 * input.inset - (columns - 1) * input.columnGap;
  return Math.min(input.card.maxWidth, Math.floor(free / columns));
}

function placeOnLattice(input, relations, columns, optional) {
  const width = cardWidth(input, columns);
  if (width < input.card.minWidth) return null;
  const pitch = width + input.columnGap;
  const slots = 2 * columns - 1;
  let states = statesFor(input.rows, slots, false);
  if (!withinBudget(states)) {
    if (optional) return null;
    states = statesFor(input.rows, slots, true);
  }
  const cost = costModel(input, relations, width, pitch);
  const unary = states.map((list, row) => list.map((state) => cost.unary(row, state)));
  const pairs = [];
  for (let row = 0; row + 1 < states.length; row += 1) {
    const upper = states[row];
    const lower = states[row + 1];
    const matrix = new Float64Array(upper.length * lower.length);
    upper.forEach((a, i) =>
      lower.forEach((b, j) => (matrix[i * lower.length + j] = cost.pair(row, a, b))),
    );
    pairs.push(matrix);
  }
  const internalRows = input.rows
    .map((members, row) => (members.some((id) => !input.external(id)) ? row : -1))
    .filter((row) => row >= 0);
  const bounded =
    internalRows.length > 0 && input.rows.some((members) => members.some(input.external));
  const intervals = bounded ? boundaryIntervals(input, internalRows, slots) : [null];
  let best = null;
  for (const interval of intervals) {
    const allowed = states.map((list, row) =>
      list.map(
        (state) =>
          !interval ||
          row < internalRows[0] ||
          row > internalRows.at(-1) ||
          inside(input, state, interval),
      ),
    );
    let result = viterbi(states, unary, pairs, allowed, () => 0);
    if (!result) continue;
    if (relations.long.length) {
      const first = positionsOf(result.chosen);
      result = /** @type {any} */ (
        viterbi(states, unary, pairs, allowed, (row, state) =>
          corridorPull(relations, row, state, first),
        )
      );
    }
    const total = result.cost + (interval ? WEIGHT.boundarySpan * (interval[1] - interval[0]) : 0);
    if (!best || total < best.cost) best = { chosen: result.chosen, cost: total, interval };
  }
  if (!best) return null;
  return {
    columns,
    width,
    pitch,
    slots,
    order: best.chosen.map((state) => state.order),
    position: positionsOf(best.chosen),
    interval: best.interval,
    cost: best.cost,
  };
}

function statesFor(rows, slots, compact) {
  return rows.map((members) => {
    const orders = members.length <= 6 ? permutations(members) : [members];
    const spots = placements(members.length, slots, compact);
    return orders.flatMap((order) =>
      spots.map((spot) => ({
        order,
        position: new Map(order.map((id, index) => [id, spot[index]])),
      })),
    );
  });
}

function withinBudget(states) {
  for (let row = 0; row + 1 < states.length; row += 1)
    if (states[row].length * states[row + 1].length > PAIR_BUDGET) return false;
  return true;
}

const positionsOf = (chosen) => new Map(chosen.flatMap((state) => [...state.position]));

/** Column intervals wide enough for the widest internal row. */
function boundaryIntervals(input, internalRows, slots) {
  const widest = Math.max(
    ...internalRows.map((row) => input.rows[row].filter((id) => !input.external(id)).length),
  );
  const out = [];
  for (let start = 0; start < slots; start += 1)
    for (let end = start + 2 * (widest - 1); end < slots; end += 1) out.push([start, end]);
  return out;
}

function inside(input, state, [start, end]) {
  return state.order.every((id) => {
    const position = state.position.get(id);
    return input.external(id)
      ? position <= start - 2 || position >= end + 2
      : position >= start && position <= end;
  });
}

function corridorPull(relations, row, state, first) {
  let cost = 0;
  for (const relation of relations.long)
    for (const id of [relation.from, relation.to])
      if (relations.rowOf.get(id) === row) {
        const other = id === relation.from ? relation.to : relation.from;
        cost += WEIGHT.corridor * Math.abs(state.position.get(id) - first.get(other));
      }
  return cost;
}

function viterbi(states, unary, pairs, allowed, extra) {
  const rows = states.length;
  let cost = states[0].map((state, i) =>
    allowed[0][i] ? unary[0][i] + extra(0, state) : Infinity,
  );
  const back = [];
  for (let row = 1; row < rows; row += 1) {
    const matrix = pairs[row - 1];
    const width = states[row].length;
    const next = new Float64Array(width).fill(Infinity);
    const from = new Int32Array(width).fill(-1);
    for (let j = 0; j < width; j += 1) {
      if (!allowed[row][j]) continue;
      let low = Infinity;
      let arg = -1;
      for (let i = 0; i < cost.length; i += 1) {
        const value = cost[i] + matrix[i * width + j];
        if (value < low) {
          low = value;
          arg = i;
        }
      }
      next[j] = low + unary[row][j] + extra(row, states[row][j]);
      from[j] = arg;
    }
    back.push(from);
    cost = Array.from(next);
  }
  let index = -1;
  for (let i = 0; i < cost.length; i += 1)
    if (cost[i] < (index < 0 ? Infinity : cost[index])) index = i;
  if (index < 0 || !Number.isFinite(cost[index])) return null;
  const total = cost[index];
  const chosen = [];
  for (let row = rows - 1; row >= 0; row -= 1) {
    chosen[row] = states[row][index];
    if (row > 0) index = back[row - 1][index];
  }
  return { chosen, cost: total };
}

function costModel(input, relations, width, pitch) {
  const sameByRow = new Map();
  for (const relation of relations.sameRow) {
    const row = relations.rowOf.get(relation.from);
    sameByRow.set(row, [...(sameByRow.get(row) ?? []), relation]);
  }
  const unary = (row, state) => {
    let cost = 0;
    const { order, position } = state;
    for (let i = 0; i < order.length; i += 1)
      for (let j = i + 1; j < order.length; j += 1)
        if (input.order.get(order[i]) > input.order.get(order[j])) cost += WEIGHT.order;
    for (const value of position.values()) if (value % 2) cost += WEIGHT.halfColumn;
    for (const relation of sameByRow.get(row) ?? []) {
      const neighbors = Math.abs(order.indexOf(relation.from) - order.indexOf(relation.to)) === 1;
      const gap =
        (Math.abs(position.get(relation.from) - position.get(relation.to)) / 2) * pitch - width;
      const need =
        input.labelWidth(relation, Math.max(80, gap - 2 * input.clearance)) + 2 * input.clearance;
      cost += neighbors && gap >= need ? WEIGHT.sameRowFits * gap : WEIGHT.sameRowBlocked;
    }
    return cost;
  };
  const pair = (row, upper, lower) => {
    const at = (id) =>
      relations.rowOf.get(id) === row ? upper.position.get(id) : lower.position.get(id);
    let cost = 0;
    const wires = [];
    for (const relation of relations.singles) {
      const top = relations.rowOf.get(relation.from) === row ? relation.from : relation.to;
      const bottom = top === relation.from ? relation.to : relation.from;
      if (relations.rowOf.get(top) !== row || relations.rowOf.get(bottom) !== row + 1) continue;
      cost += bend(Math.abs(at(top) - at(bottom)));
      wires.push({
        group: relation,
        top: at(top),
        bottom: at(bottom),
        topId: top,
        bottomId: bottom,
      });
    }
    for (const bus of relations.buses) {
      const hubRow = relations.rowOf.get(bus.hub);
      const leafRow = relations.rowOf.get(bus.leaves[0]);
      if (Math.min(hubRow, leafRow) !== row) continue;
      const leaves = bus.leaves.map(at);
      cost += WEIGHT.bus * Math.abs(at(bus.hub) - (Math.min(...leaves) + Math.max(...leaves)) / 2);
      for (const leaf of bus.leaves) {
        const [top, bottom] = hubRow === row ? [bus.hub, leaf] : [leaf, bus.hub];
        wires.push({ group: bus, top: at(top), bottom: at(bottom), topId: top, bottomId: bottom });
      }
    }
    for (let i = 0; i < wires.length; i += 1)
      for (let j = i + 1; j < wires.length; j += 1) {
        const [a, b] = [wires[i], wires[j]];
        if (a.group === b.group || a.topId === b.topId || a.bottomId === b.bottomId) continue;
        if ((a.top - b.top) * (a.bottom - b.bottom) < 0) cost += WEIGHT.crossing;
      }
    return cost;
  };
  return { unary, pair };
}
