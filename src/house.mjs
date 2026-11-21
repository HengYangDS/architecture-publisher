import fs from "node:fs";

/**
 * The house tokens: the page, the faces, the palettes and the table of lines that the house class sets every page
 * in. `src/house.json` states them; this module is the one place the JavaScript reads that file, and a module that
 * needs a token imports it from here rather than restating its value.
 */

/** The file that states the house tokens, which the overview stages beside the class. */
export const HOUSE_FILE = new URL("./house.json", import.meta.url);

/**
 * A parsed value made read-only throughout, so that no reader can change what another reads.
 * @param {any} value
 */
const frozen = (value) => {
  if (value && typeof value === "object") Object.values(value).forEach(frozen);
  return Object.freeze(value);
};

/** The house tokens, read once. */
export const HOUSE = frozen(JSON.parse(fs.readFileSync(HOUSE_FILE, "utf8")));
