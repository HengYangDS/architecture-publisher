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

/**
 * The body's box of a page set by the tokens given, in points from the page's top left corner: from the page's
 * margin to the margin across, from the body's top to its bottom down. The house class sets a plate's figure in it.
 * It follows from the page and the edition, so no token states it.
 * @param {{ page: { width: number, margin: number }, edition: { bodyTop: number, bodyBottom: number } }} house
 */
export const bodyOf = ({ page, edition }) =>
  Object.freeze({
    x: page.margin,
    y: edition.bodyTop,
    width: page.width - 2 * page.margin,
    height: edition.bodyBottom - edition.bodyTop,
  });

/** The body's box of the house's page. */
export const HOUSE_BODY = bodyOf(HOUSE);
