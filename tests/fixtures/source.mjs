/** The shipped source as the searches of the queue item `one-source` read it: its files, without their comments. */
import fs from "node:fs/promises";
import path from "node:path";

/** The repository's root. */
export const root = path.resolve(import.meta.dirname, "..", "..");
const source = path.join(root, "src");

/**
 * A file's source without its comments, where a fact may be named freely; Typst writes its comments as JavaScript
 * does. A comment leaves its lines behind, empty, so that a search can name the line of the file it finds. A line
 * that is a comment goes first, so that a `/*` it quotes opens no comment over the code after it.
 */
export const code = (text) =>
  text
    .replace(/^[^\S\n]*\/\/.*$/gmu, "")
    .replace(/\/\*[\s\S]*?\*\//gu, (comment) => comment.replace(/[^\n]/gu, ""));

/** A text made a literal of a regular expression. */
export const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/**
 * The shipped source in the languages named by their extensions, the JavaScript unless others are named: each file
 * by its path from the repository's root, and its code.
 */
export async function modules(extensions = [".mjs"]) {
  const found = [];
  for (const entry of await fs.readdir(source, { withFileTypes: true, recursive: true }))
    if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      const file = path.join(entry.parentPath, entry.name);
      const text = await fs.readFile(file, "utf8");
      found.push({ file: path.relative(root, file).split(path.sep).join("/"), code: code(text) });
    }
  return found.sort((one, other) => (one.file < other.file ? -1 : 1));
}
