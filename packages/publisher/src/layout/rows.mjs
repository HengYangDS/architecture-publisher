/**
 * Rows of a view. Tiers keep their declared order; otherwise rows follow the
 * relations, which are drawn downward or within one row after the relations
 * that close cycles are reversed.
 * @typedef {{ id: string, label: string | null, members: string[] }} Row
 */

/** The most cards one row may hold; rows beside row labels hold one fewer. */
export const ROW_LIMIT = 6;

/**
 * What derived rows cost, in order of weight: a row over its limit, or an
 * outside component with no free column beside the boundary; each row a
 * relation passes; a card with more than two neighbours in its row, or
 * relations closing a ring within one row, which no row order keeps adjacent;
 * a relation within one row, cheaper between peers that share a caller; and
 * each further row.
 */
const COST = Object.freeze({
  overflow: 1000,
  skip: 10,
  crowded: 10,
  flat: 6,
  peers: 4,
  row: 1,
});

/**
 * @param {{ tiers: Array<{ id: string, label: string, members: string[] }> | null,
 *   components: Array<{ id: string }>, relations: Array<{ from: string, to: string }> }} view
 * @param {number} [limit] the most components one derived row holds
 * @param {(id: string) => boolean} [outside] components drawn outside the system boundary
 * @returns {Row[]}
 */
export function viewRows(view, limit = ROW_LIMIT, outside = () => false) {
  const shown = new Set(view.components.map(({ id }) => id));
  if (view.tiers)
    return view.tiers.map(({ id, label, members }) => ({
      id,
      label,
      members: members.filter((m) => shown.has(m)),
    }));
  const members = view.components.map(({ id }) => id);
  const level = layers(members, view.relations, limit, outside);
  const depth = Math.max(...level.values()) + 1;
  return Array.from({ length: depth }, (_, index) => ({
    id: `row-${index + 1}`,
    label: null,
    members: members.filter((id) => level.get(id) === index),
  }));
}

/**
 * Split every row wider than `limit` into consecutive rows of near-equal size,
 * for a medium that must show a whole model at a fixed width.
 * @param {Row[]} rows
 * @param {number} limit
 * @returns {Row[]}
 */
export function wrapRows(rows, limit) {
  return rows.flatMap((row) => {
    const parts = Math.ceil(row.members.length / limit);
    if (parts <= 1) return [row];
    const size = Math.ceil(row.members.length / parts);
    return Array.from({ length: parts }, (_, index) => ({
      id: `${row.id}-${index + 1}`,
      label: index ? null : row.label,
      members: row.members.slice(index * size, (index + 1) * size),
    }));
  });
}

/** Relations that close a cycle, found by depth-first search in member order. */
function backRelations(members, relations) {
  const out = new Map(members.map((id) => [id, []]));
  for (const relation of relations) out.get(relation.from).push(relation);
  const state = new Map();
  const back = new Set();
  const visit = (id) => {
    state.set(id, "open");
    for (const relation of out.get(id)) {
      const next = state.get(relation.to);
      if (next === "open") back.add(relation);
      else if (!next) visit(relation.to);
    }
    state.set(id, "done");
  };
  for (const id of members) if (!state.has(id)) visit(id);
  return back;
}

/**
 * Levels with the least cost found by steepest descent from longest-path
 * levels, over the moves `moves` lists. Ties keep the first move in member
 * order, so the result is deterministic.
 * @returns {Map<string, number>}
 */
function layers(members, relations, limit, outside) {
  const local = relations.filter(({ from, to }) => from !== to);
  const back = backRelations(members, local);
  // Each relation as an edge from the component drawn above to the one below or beside it.
  const edges = local.map((relation) =>
    back.has(relation)
      ? { from: relation.to, to: relation.from }
      : { from: relation.from, to: relation.to },
  );
  const above = new Map(members.map((id) => [id, /** @type {string[]} */ ([])]));
  const below = new Map(members.map((id) => [id, /** @type {string[]} */ ([])]));
  const up = (id) => /** @type {string[]} */ (above.get(id));
  const down = (id) => /** @type {string[]} */ (below.get(id));
  for (const { from, to } of edges) {
    down(from).push(to);
    up(to).push(from);
  }
  const at = (level, id) => /** @type {number} */ (level.get(id));
  const peers = (a, b) => up(a).some((id) => up(b).includes(id));
  /** A component and every component below it through its relations. */
  const reach = (id, seen = new Set()) => {
    if (seen.has(id)) return seen;
    seen.add(id);
    for (const next of down(id)) reach(next, seen);
    return seen;
  };
  const longest = new Map();
  const depthOf = (id) => {
    if (!longest.has(id)) longest.set(id, Math.max(-1, ...up(id).map(depthOf)) + 1);
    return longest.get(id);
  };
  let level = new Map(members.map((id) => [id, depthOf(id)]));
  let score = cost(level);
  for (;;) {
    /** @type {{ level: Map<string, number>, value: number } | null} */
    let best = null;
    for (const candidate of moves(level)) {
      const value = cost(candidate);
      if (value < (best?.value ?? score)) best = { level: candidate, value };
    }
    if (!best) return level;
    ({ level, value: score } = best);
  }

  /**
   * Every level change that keeps each relation downward or within one row,
   * with empty levels removed: one component to another allowed level, one
   * component pushed down with the components it would otherwise rise above,
   * and one component moved a level up or down with everything below it.
   */
  function* moves(level) {
    const depth = Math.max(...level.values()) + 1;
    for (const id of members) {
      const from = Math.max(0, ...up(id).map((other) => at(level, other)));
      const to = Math.min(depth, ...down(id).map((other) => at(level, other)));
      for (let target = from; target <= to; target += 1)
        if (target !== at(level, id)) yield compact(new Map(level).set(id, target));
      const pushed = new Map(level);
      const push = (current) => {
        pushed.set(current, at(level, current) + 1);
        for (const next of down(current)) if (at(pushed, next) < at(pushed, current)) push(next);
      };
      push(id);
      yield compact(pushed);
      const group = reach(id);
      for (const step of [-1, 1]) {
        const shifted = new Map(level);
        for (const member of group) shifted.set(member, at(level, member) + step);
        const valid = [...group].every(
          (member) =>
            at(shifted, member) >= 0 &&
            up(member).every((other) => at(shifted, other) <= at(shifted, member)),
        );
        if (valid) yield compact(shifted);
      }
    }
  }

  function cost(level) {
    const depth = Math.max(...level.values()) + 1;
    const rows = Array.from({ length: depth }, () => ({ inside: 0, outside: 0 }));
    for (const id of members) rows[at(level, id)][outside(id) ? "outside" : "inside"] += 1;
    const widest = Math.max(...rows.map(({ inside }) => inside));
    let total = (depth - 1) * COST.row;
    for (const row of rows) {
      total += Math.max(0, row.inside + row.outside - limit) * COST.overflow;
      if (row.inside && row.outside)
        total += Math.max(0, row.outside - (limit - widest)) * COST.overflow;
    }
    const neighbours = new Map();
    const ring = new Map(members.map((id) => [id, id]));
    const find = (id) => (ring.get(id) === id ? id : find(ring.get(id)));
    for (const { from, to } of edges) {
      const span = at(level, to) - at(level, from);
      if (span > 1) total += (span - 1) * COST.skip;
      if (span !== 0) continue;
      total += peers(from, to) ? COST.peers : COST.flat;
      for (const id of [from, to]) neighbours.set(id, (neighbours.get(id) ?? 0) + 1);
      if (find(from) === find(to)) total += COST.crowded;
      else ring.set(find(from), find(to));
    }
    for (const count of neighbours.values()) total += Math.max(0, count - 2) * COST.crowded;
    return total;
  }
}

/** Renumber levels so that none is empty, keeping their order. */
function compact(level) {
  const used = [...new Set(level.values())].sort((a, b) => a - b);
  if (used.length === used.at(-1) + 1) return level;
  const index = new Map(used.map((value, position) => [value, position]));
  return new Map([...level].map(([id, value]) => [id, /** @type {number} */ (index.get(value))]));
}
