// The forms the blocks of references.mjs are written in, and the reading of a table of the source, which its families
// of sources share.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** A value set as code: `value`. */
export const code = (/** @type {string} */ value) => `\`${value}\``;

/** Items as a sentence lists them: `a`, `a and b`, `a, b and c`. @param {string[]} items */
export const listed = (items) => new Intl.ListFormat("en-GB").format(items);

/** Items as a sentence offers them: `a`, `a or b`, `a, b or c`. @param {string[]} items */
export const either = (items) =>
  new Intl.ListFormat("en-GB", { type: "disjunction" }).format(items);

/** A count as a sentence writes it: in words up to ten, in figures above. */
export const counted = (/** @type {number} */ count) =>
  ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][count] ??
  String(count);

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

/**
 * A value a module of the tree exports, the tree's own module imported as it stands, so that a copy is read from the
 * copy; refused by name when the module exports none. The writer reads declared files; it imports a module only for a
 * fact that module states and no table holds, and the caller says why.
 */
export const exported = async (
  /** @type {string} */ root,
  /** @type {string} */ file,
  /** @type {string} */ name,
) => {
  const value = (await import(pathToFileURL(path.join(root, file)).href))[name];
  if (value === undefined) throw new Error(`references_set_missing: ${file} exports no ${name}`);
  return value;
};

/** A list of numbers a source states, refused by name when it states none. */
export const numbers = (
  /** @type {string} */ file,
  /** @type {unknown} */ value,
  /** @type {string} */ what,
) => {
  if (!Array.isArray(value) || !value.length || !value.every(Number.isFinite))
    throw new Error(`references_set_missing: ${file} states no ${what}`);
  return /** @type {number[]} */ (value);
};
