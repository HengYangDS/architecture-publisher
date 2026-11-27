/**
 * The order of a view's parts along its relations' flow: a part that a relation leaves stands before the part it
 * reaches, so the sources come first. The parts of a cycle reach each other both ways, so no order puts each before
 * the others; they stand together, at the place the cycle takes as one part, in the model's order among themselves.
 * Where the flow leaves a choice, the part the model gives first comes first. In a view with no cycle, every
 * relation then runs from an earlier part to a later one.
 */

/**
 * The cycles of a graph and its parts outside any: each part's component, numbered in the order Tarjan's search
 * closes them.
 * @param {number[][]} next the parts each part's relations reach, by index
 * @returns {number[]} each part's component
 */
function componentsOf(next) {
  const count = next.length;
  const component = new Array(count).fill(-1);
  const seen = new Array(count).fill(-1);
  const low = new Array(count).fill(0);
  /** @type {number[]} */
  const stack = [];
  const open = new Set();
  let time = 0;
  let closed = 0;
  const visit = (/** @type {number} */ part) => {
    seen[part] = time;
    low[part] = time;
    time += 1;
    stack.push(part);
    open.add(part);
    for (const reached of next[part]) {
      if (seen[reached] < 0) {
        visit(reached);
        low[part] = Math.min(low[part], low[reached]);
      } else if (open.has(reached)) low[part] = Math.min(low[part], seen[reached]);
    }
    if (low[part] !== seen[part]) return;
    let member;
    do {
      member = /** @type {number} */ (stack.pop());
      open.delete(member);
      component[member] = closed;
    } while (member !== part);
    closed += 1;
  };
  for (let part = 0; part < count; part += 1) if (seen[part] < 0) visit(part);
  return component;
}

/**
 * A view's parts in the order of its relations' flow.
 * @template {{ id: string }} Part
 * @param {{ components: Part[], relations: ReadonlyArray<{ from: string, to: string }> }} view
 * @returns {Part[]}
 */
export function flowOrder(view) {
  const parts = view.components;
  const index = new Map(parts.map(({ id }, at) => [id, at]));
  /** @type {number[][]} */
  const next = parts.map(() => []);
  for (const { from, to } of view.relations) {
    const [source, target] = [index.get(from), index.get(to)];
    if (source !== undefined && target !== undefined && source !== target)
      next[source].push(target);
  }
  const component = componentsOf(next);
  const count = Math.max(-1, ...component) + 1;
  // Each component is one node of the flow, keyed by the first of its parts in the model's order.
  /** @type {number[][]} */
  const members = Array.from({ length: count }, () => []);
  component.forEach((at, part) => members[at].push(part));
  const into = new Array(count).fill(0);
  /** @type {Set<number>[]} */
  const out = Array.from({ length: count }, () => new Set());
  next.forEach((reached, part) => {
    for (const target of reached) {
      const [a, b] = [component[part], component[target]];
      if (a !== b && !out[a].has(b)) {
        out[a].add(b);
        into[b] += 1;
      }
    }
  });
  const first = (/** @type {number} */ at) => members[at][0];
  const ready = members.flatMap((_, at) => (into[at] ? [] : [at]));
  /** @type {Part[]} */
  const ordered = [];
  while (ready.length) {
    ready.sort((a, b) => first(a) - first(b));
    const at = /** @type {number} */ (ready.shift());
    for (const part of members[at]) ordered.push(parts[part]);
    for (const target of out[at]) {
      into[target] -= 1;
      if (!into[target]) ready.push(target);
    }
  }
  return ordered;
}
