/** The source directories that only a queued product Change may change. */
const DRAWING = ["src/layout/", "src/poster/", "src/map/", "src/overview/", "src/edition/"];

/**
 * The roadmap queue of the product contract: the items of its `### Queue` list, in order.
 * @param {string} contract The contract's Markdown.
 * @returns {Array<{ id: string, done: boolean }>}
 */
export function readQueue(contract) {
  const section = contract.split(/^### Queue$/mu)[1]?.split(/^#{1,3} /mu)[0] ?? "";
  return [...section.matchAll(/^- \[([ x])\] `([a-z][a-z0-9-]*)`/gmu)].map(([, mark, id]) => ({
    id,
    done: mark === "x",
  }));
}

/**
 * The queue item a proposal names in its `Queue:` line, or null.
 * @param {string} proposal The proposal's Markdown.
 */
export function queueItem(proposal) {
  return /^Queue: `([a-z][a-z0-9-]*)`\.$/mu.exec(proposal)?.[1] ?? null;
}

/**
 * What is wrong with the active Changes against the queue, one line each.
 * @param {Array<{ id: string, done: boolean }>} queue
 * @param {Array<{ name: string, item: string | null, changed?: string[] }>} changes
 * @returns {string[]}
 */
export function queueProblems(queue, changes) {
  const problems = [];
  for (const { name, item, changed = [] } of changes) {
    if (item === null) problems.push(`${name} names no queue item`);
    else if (item === "maintenance") {
      for (const file of changed.filter((path) => DRAWING.some((root) => path.startsWith(root))))
        problems.push(`${name} is maintenance and changes ${file}`);
    } else {
      const at = queue.findIndex(({ id }) => id === item);
      if (at < 0) problems.push(`${name} names ${item}, which the queue does not hold`);
      else
        for (const earlier of queue.slice(0, at).filter(({ done }) => !done))
          problems.push(`${name} names ${item} while ${earlier.id} is unfinished`);
    }
  }
  return problems;
}
