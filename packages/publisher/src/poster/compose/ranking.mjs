/**
 * How the composer orders pages: by their wiring faults, then by how simply
 * they are wired and how fully and evenly they fill the page.
 */

export const compareRanks = (a, b) => {
  for (let index = 0; index < a.length; index += 1)
    if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
};

/** Wires that cross on one page, over all its plates. */
export function crossingsOf(page) {
  return page.made.reduce((sum, one) => sum + one.layout.measures.crossings, 0);
}

/**
 * Wiring faults on one page, over all its plates, worst first: its crossings,
 * then the route defects a reader misreads although no wire crosses.
 * @returns {[number, number]}
 */
export function faultsOf(page) {
  return [crossingsOf(page), page.made.reduce((sum, one) => sum + one.layout.measures.routes, 0)];
}

/** Every turn the wires of a page's plates take: each is one more a reader follows. */
const bendsOf = (page) => page.made.reduce((sum, one) => sum + one.layout.measures.bends, 0);

/**
 * The best of a set: fewest wiring faults, then the fewest turns in its wires,
 * least area in holes and in the largest blank, then nearest the center, then
 * fewest plates. Every page in the set passes its gates, so a page that wires
 * its figure more simply is preferred to one that only fills it more.
 */
export function best(list) {
  return [...list].sort(
    (a, b) =>
      compareRanks(faultsOf(a), faultsOf(b)) ||
      bendsOf(a) - bendsOf(b) ||
      a.balance.holes + a.balance.emptyShare - (b.balance.holes + b.balance.emptyShare) ||
      Math.hypot(...a.balance.centroid) - Math.hypot(...b.balance.centroid) ||
      a.views.length - b.views.length,
  )[0];
}

/** The page of a set that comes closest to passing: fewest gates missed, then the best. */
export function nearest(list) {
  const fewest = Math.min(...list.map(({ fails }) => fails.length));
  return best(list.filter(({ fails }) => fails.length === fewest));
}
