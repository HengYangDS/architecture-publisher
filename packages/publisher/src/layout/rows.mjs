/**
 * Rows of a view. Tiers keep their declared order; otherwise rows follow the
 * relations: longest-path layers after reversing the relations that close
 * cycles, with siblings that call each other pulled into one row.
 * @typedef {{ id: string, label: string | null, members: string[] }} Row
 */

/** The most cards one row may hold; rows beside row labels hold one fewer. */
export const ROW_LIMIT = 6;

/**
 * @param {{ tiers: Array<{ id: string, label: string, members: string[] }> | null,
 *   components: Array<{ id: string }>, relations: Array<{ from: string, to: string }> }} view
 * @returns {Row[]}
 */
export function viewRows(view) {
  const shown = new Set(view.components.map(({ id }) => id));
  if (view.tiers)
    return view.tiers.map(({ id, label, members }) => ({
      id,
      label,
      members: members.filter((m) => shown.has(m)),
    }));
  const members = view.components.map(({ id }) => id);
  const level = layers(members, view.relations);
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
 * Longest-path levels in which members of one sibling group share a level.
 * Returns null when the group constraints cannot be met.
 */
function levels(members, forward, groupOf) {
  const level = new Map(members.map((id) => [id, 0]));
  for (let pass = 0; pass <= members.length; pass += 1) {
    let changed = false;
    for (const { from, to } of forward) {
      const same = groupOf(from) === groupOf(to);
      const need = level.get(from) + (same ? 0 : 1);
      if (level.get(to) < need) {
        level.set(to, need);
        changed = true;
      }
      if (same && level.get(from) < level.get(to)) {
        level.set(from, level.get(to));
        changed = true;
      }
    }
    if (!changed) return level;
  }
  return null;
}

function widest(level) {
  const counts = new Map();
  for (const value of level.values()) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Math.max(...counts.values());
}

function layers(members, relations) {
  const local = relations.filter(({ from, to }) => from !== to);
  const back = backRelations(members, local);
  const forward = local.filter((relation) => !back.has(relation));
  const callers = new Map(members.map((id) => [id, new Set()]));
  for (const { from, to } of forward) callers.get(to).add(from);
  const parent = new Map(members.map((id) => [id, id]));
  const find = (id) => (parent.get(id) === id ? id : find(parent.get(id)));
  let level = /** @type {Map<string, number>} */ (levels(members, forward, find));
  for (const { from, to } of forward) {
    const siblings = [...callers.get(from)].some((caller) => callers.get(to).has(caller));
    if (!siblings || find(from) === find(to)) continue;
    const saved = new Map(parent);
    parent.set(find(to), find(from));
    const next = levels(members, forward, find);
    if (
      next &&
      widest(next) <= ROW_LIMIT &&
      Math.max(...next.values()) < Math.max(...level.values())
    )
      level = next;
    else for (const [id, value] of saved) parent.set(id, value);
  }
  return pullDown(members, forward, level, find);
}

/**
 * Move each component that is not in a sibling group down to just above its
 * nearest consumer, so sources sit beside the components they feed instead of
 * at the top with long relations.
 */
function pullDown(members, forward, level, find) {
  const grouped = new Set(
    members.filter((id) => members.some((other) => other !== id && find(other) === find(id))),
  );
  const consumers = new Map(members.map((id) => [id, []]));
  for (const { from, to } of forward) consumers.get(from).push(to);
  const count = (value) => [...level.values()].filter((item) => item === value).length;
  const order = [...members].sort(
    (a, b) => level.get(b) - level.get(a) || members.indexOf(a) - members.indexOf(b),
  );
  for (const id of order) {
    if (grouped.has(id) || !consumers.get(id).length) continue;
    const target = Math.min(...consumers.get(id).map((next) => level.get(next))) - 1;
    if (target > level.get(id) && count(target) < ROW_LIMIT) level.set(id, target);
  }
  return level;
}
