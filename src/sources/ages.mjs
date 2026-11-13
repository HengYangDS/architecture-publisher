/**
 * Age bands: every edition sorts its cited files into new, middling and old by the same two spans counted back from
 * its pin, so the dyes of one edition read like those of any other and two editions can be compared.
 */

const DAY = 24 * 60 * 60;

/** Within a week of the pin, within three months, and earlier. */
export const BANDS = Object.freeze({ spans: Object.freeze([7 * DAY, 90 * DAY]) });

/**
 * The band of one age: 0 at or under the first span, 1 at or under the second, else 2. An age below zero, a file
 * whose committer's clock ran ahead of the pin's, counts as new.
 * @param {number} age seconds from the file's last change to the pin
 * @param {{ spans: readonly number[] }} [bands]
 * @returns {0 | 1 | 2}
 */
export function bandOf(age, { spans: [newest, middle] } = BANDS) {
  return age <= newest ? 0 : age <= middle ? 1 : 2;
}
