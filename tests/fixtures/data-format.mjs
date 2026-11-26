import fs from "node:fs/promises";

/** The two tables the data reference states the format's keys in: the section each stands under, and its head. */
const TABLES = Object.freeze({
  Member: "## The data",
  Key: "## The evidence table",
});

/**
 * The keys the data reference states for one of its tables, in its order: the first column of the table headed
 * `head` under its section. The reference is the delivery format's statement of the data's members and of an
 * evidence row's keys; the data the publisher writes holds them in this order.
 * @param {keyof typeof TABLES} head
 * @returns {Promise<string[]>}
 */
export async function statedKeys(head) {
  const page = await fs.readFile(new URL("../../docs/reference/data.md", import.meta.url), "utf8");
  const lines = page.split("\n");
  const section = lines.indexOf(TABLES[head]);
  const next = lines.findIndex((line, index) => index > section && line.startsWith("## "));
  const within = lines.slice(section, next < 0 ? undefined : next);
  const start = within.findIndex((line) => new RegExp(`^\\| ${head} +\\|`, "u").test(line));
  if (section < 0 || start < 0)
    throw new Error(`docs/reference/data.md has no table headed ${head} under ${TABLES[head]}`);
  const rows = [];
  for (const line of within.slice(start + 2)) {
    const key = /^\| `([^`]+)` +\|/u.exec(line);
    if (!key) break;
    rows.push(key[1]);
  }
  return rows;
}
