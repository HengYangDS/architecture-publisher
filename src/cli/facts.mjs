import path from "node:path";

/**
 * The facts a report is made of and the words they share, for the module that draws a report and for a module
 * that composes one command's groups beside it.
 */

/**
 * A fact's state, one of the four a report marks, with its label and its value.
 * @typedef {"passed" | "attention" | "refused" | "noted"} State
 * @typedef {{ state: State, label: string, value: string }} Fact
 * @typedef {{ heading: string, facts: Fact[] }} Group
 */

/**
 * A path a command wrote or read, as a reader in the working directory would type it: relative when it lies inside
 * that directory, and as it is otherwise. A result keeps the whole path; a report prints the one that fits a line.
 * @param {string} file
 */
export function near(file) {
  const relative = path.relative(process.cwd(), file);
  return relative && !relative.startsWith("..") ? relative : file;
}

/** @param {State} state */
const fact =
  (state) =>
  /** @returns {Fact} */
  (/** @type {string} */ label, /** @type {string | number} */ value) => ({
    state,
    label,
    value: String(value),
  });
export const passed = fact("passed");
export const attention = fact("attention");
export const refused = fact("refused");
export const noted = fact("noted");

/** "1 view", "2 views". */
export const count = (number, noun) => `${number} ${noun}${number === 1 ? "" : "s"}`;

/** "a", "a and b", "a, b and c". */
export const series = (items) =>
  items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
