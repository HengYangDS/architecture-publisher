/**
 * Age bands: an edition sorts its cited files into new, middling and old by two spans from one
 * ladder, so every plate of the edition reads its dyes against the same key.
 */

const DAY = 24 * 60 * 60;

/** The span ladder in seconds: 1 day, 3 days, 1 week, 1 month (30 d), 3 months (90 d), 1 year (365 d), 3 years (1095 d). */
export const SPANS = Object.freeze([1, 3, 7, 30, 90, 365, 1095].map((days) => days * DAY));

/**
 * Two boundaries from the ladder that split the ages into three bands whose counts are closest
 * to thirds: the least sum of each count's distance from a third, ties to the shorter spans. An
 * empty list ties everywhere, so it gets the two shortest.
 * @param {number[]} ages seconds from each file's last change to the pin, none negative
 * @returns {{ spans: [number, number] }}
 */
export function ageBands(ages) {
  const count = ages.length;
  // How many ages each span holds at or under it.
  const within = SPANS.map((span) => ages.filter((age) => age <= span).length);
  /** @type {[number, number]} */
  let spans = [SPANS[0], SPANS[1]];
  let least = Infinity;
  // Shorter pairs come first and only a strictly nearer split replaces one, so ties go to them.
  for (let a = 0; a < SPANS.length; a += 1)
    for (let b = a + 1; b < SPANS.length; b += 1) {
      const bands = [within[a], within[b] - within[a], count - within[b]];
      // Thrice each count against the total keeps the measure in exact integers.
      const distance = bands.reduce((sum, held) => sum + Math.abs(3 * held - count), 0);
      if (distance < least) [spans, least] = [[SPANS[a], SPANS[b]], distance];
    }
  return { spans };
}

/**
 * The band of one age: 0 at or under the first boundary, 1 at or under the second, else 2.
 * @param {number} age
 * @param {{ spans: [number, number] }} bands
 * @returns {0 | 1 | 2}
 */
export function bandOf(age, { spans: [newest, middle] }) {
  return age <= newest ? 0 : age <= middle ? 1 : 2;
}
