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
 * The pages of the research home a design names, as file names.
 * @param {string} design The design's Markdown.
 */
export function researchPages(design) {
  const named = design.matchAll(/docs\/research\/([a-z0-9][a-z0-9-]*\.md)/gu);
  return [...new Set([...named].map(([, page]) => page))];
}

/**
 * What is wrong with the active Changes against the queue, one line each.
 * @param {Array<{ id: string, done: boolean }>} queue
 * @param {Array<{ name: string, item: string | null, changed?: string[], rests?: string[] }>} changes
 * @param {string[]} held The research pages the repository holds, as file names.
 * @returns {string[]}
 */
export function queueProblems(queue, changes, held) {
  const problems = [];
  for (const { name, item, changed = [], rests = [] } of changes) {
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
      if (rests.length === 0)
        problems.push(`${name} names ${item} and its design names no research page`);
      for (const page of rests.filter((each) => !held.includes(each)))
        problems.push(`${name} rests on docs/research/${page}, which the repository does not hold`);
    }
  }
  return problems;
}
