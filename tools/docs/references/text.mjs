// The forms the blocks of references.mjs are written in, and the reading of a table of the source, which its families
// of sources share.
import fs from "node:fs/promises";
import path from "node:path";

/** A value set as code: `value`. */
export const code = (/** @type {string} */ value) => `\`${value}\``;

/** Items as a sentence lists them: `a`, `a and b`, `a, b and c`. @param {string[]} items */
export const listed = (items) => new Intl.ListFormat("en-GB").format(items);

/** Items as a sentence offers them: `a`, `a or b`, `a, b or c`. @param {string[]} items */
export const either = (items) =>
  new Intl.ListFormat("en-GB", { type: "disjunction" }).format(items);

/** A Markdown table, a cell's pipe escaped. @param {readonly string[]} head @param {ReadonlyArray<readonly string[]>} rows */
export const table = (head, rows) =>
  [head, head.map(() => "---"), ...rows]
    .map((row) => `| ${row.map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`)
    .join("\n");

/** A text a table of the source states, refused by name when the table lacks it. */
export const stated = (
  /** @type {string} */ file,
  /** @type {unknown} */ value,
  /** @type {string} */ what,
) => {
  if (typeof value !== "string" || !value)
    throw new Error(`references_text_missing: ${file} states no ${what}`);
  return value;
};

/** A JSON file of the tree, parsed. */
export const readJson = async (/** @type {string} */ root, /** @type {string} */ file) =>
  JSON.parse(await fs.readFile(path.join(root, file), "utf8"));
