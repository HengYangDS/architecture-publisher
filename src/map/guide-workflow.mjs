import { refuse } from "../refusal.mjs";

/**
 * The publisher's columns for a guide's workflow, which Archify draws only where every node names its column. Each
 * node's column is the longest path to it along the edges, where an edge within one lane takes one step and an edge
 * across lanes none, as the works' authors draw a hand-off between lanes. An edge that would close a cycle is left out
 * of the count, in document order. Two nodes of one lane in one column move the later right, and its successors after
 * it. Archify draws at most six columns; a workflow that needs more is refused.
 */

/** The most columns Archify draws in a workflow. */
const MOST = 6;

/**
 * The column of each node, by id.
 * @param {ReadonlyArray<{ id: string, lane: string }>} nodes
 * @param {ReadonlyArray<{ from: string, to: string }>} edges
 * @returns {Map<string, number>}
 */
export function workflowColumns(nodes, edges) {
  const ids = nodes.map(({ id }) => id);
  const order = new Map(ids.map((id, index) => [id, index]));
  const laneOf = new Map(nodes.map(({ id, lane }) => [id, lane]));
  /** @type {Map<string, string[]>} */
  const next = new Map(ids.map((id) => [id, []]));
  const reaches = (/** @type {string} */ from, /** @type {string} */ to) => {
    const seen = new Set([from]);
    const stack = [from];
    while (stack.length) {
      const id = /** @type {string} */ (stack.pop());
      if (id === to) return true;
      for (const after of next.get(id) ?? [])
        if (!seen.has(after)) {
          seen.add(after);
          stack.push(after);
        }
    }
    return false;
  };
  for (const { from, to } of edges)
    if (next.has(from) && next.has(to) && from !== to && !reaches(to, from))
      next.get(from)?.push(to);
  const step = (/** @type {string} */ from, /** @type {string} */ to) =>
    laneOf.get(from) === laneOf.get(to) ? 1 : 0;
  const column = new Map(ids.map((id) => [id, 0]));
  const incoming = new Map(ids.map((id) => [id, 0]));
  for (const after of [...next.values()].flat())
    incoming.set(after, /** @type {number} */ (incoming.get(after)) + 1);
  const queue = ids.filter((id) => incoming.get(id) === 0);
  const sorted = [];
  while (queue.length) {
    const id = /** @type {string} */ (queue.shift());
    sorted.push(id);
    for (const after of /** @type {string[]} */ (next.get(id))) {
      column.set(
        after,
        Math.max(
          /** @type {number} */ (column.get(after)),
          /** @type {number} */ (column.get(id)) + step(id, after),
        ),
      );
      incoming.set(after, /** @type {number} */ (incoming.get(after)) - 1);
      if (incoming.get(after) === 0) queue.push(after);
    }
  }
  const at = (/** @type {string} */ id) => /** @type {number} */ (column.get(id));
  // A move takes one node one column right; the moves are bounded, and a workflow they leave unsettled is refused
  // as too wide by `workflowLayout`.
  let moves = ids.length * ids.length;
  for (let moved = true; moved && moves > 0; moves -= 1) {
    moved = false;
    const taken = new Set();
    for (const id of [...ids].sort(
      (a, b) =>
        at(a) - at(b) ||
        /** @type {number} */ (order.get(a)) - /** @type {number} */ (order.get(b)),
    )) {
      const cell = `${laneOf.get(id)}\u0000${at(id)}`;
      if (!taken.has(cell)) {
        taken.add(cell);
        continue;
      }
      column.set(id, at(id) + 1);
      moved = true;
      break;
    }
    if (moved)
      for (const id of sorted)
        for (const after of /** @type {string[]} */ (next.get(id)))
          if (at(after) < at(id) + step(id, after)) column.set(after, at(id) + step(id, after));
  }
  return column;
}

/**
 * The workflow laid out by the publisher's columns, or a refusal naming the file where it needs more than six.
 * @param {any} document the author's document
 * @param {string} name the guide's file name
 */
export function workflowLayout(document, name) {
  const column = workflowColumns(document.nodes, document.edges ?? []);
  const widest = Math.max(...column.values());
  const cells = new Set(
    document.nodes.map((/** @type {any} */ node) => `${node.lane}\u0000${column.get(node.id)}`),
  );
  if (widest >= MOST || cells.size !== document.nodes.length)
    refuse(
      "page_workflow_too_wide",
      `The guide's workflow ${name} needs ${widest + 1} columns along its edges; Archify draws at most ${MOST}. ` +
        "Split it, or move a step to another lane.",
    );
  return {
    ...document,
    nodes: document.nodes.map((/** @type {any} */ node) => ({ ...node, col: column.get(node.id) })),
  };
}
