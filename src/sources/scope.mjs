import { refuse } from "../refusal.mjs";
import { readGit } from "./git.mjs";

/**
 * Order two `[path, …]` entries by path, as Git lists them.
 * @type {(a: [string, ...unknown[]], b: [string, ...unknown[]]) => number}
 */
const byPath = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);

/** Whether a declared path is a glob: it holds `*`, `?` or `[`, as the model validated it. */
export const isGlob = (declared) => /[*?[]/u.test(declared);

/** Every directory above a file, outermost first, each ending in a slash. */
export function directoriesOf(file) {
  const parts = file.split("/").slice(0, -1);
  return parts.map((_, index) => `${parts.slice(0, index + 1).join("/")}/`);
}

/**
 * The tree with no entries in the repository's object format, from which a diff names every file
 * of a revision. Hashing it writes nothing.
 */
function emptyTree(root) {
  const hashed = readGit(root, ["hash-object", "-t", "tree", "--stdin"], "");
  if (hashed.status !== 0) refuse("source_read_failed", "Git could not hash the empty tree.");
  return hashed.stdout.toString("utf8").trim();
}

/**
 * The files of a revision that a glob matches, through Git's own top-anchored glob pathspec:
 * `*` within one segment, `**` across segments, `?` and `[…]` one character, case-sensitive
 * on every host, read from the object store alone.
 */
function globbed(root, commit, empty, glob) {
  const listing = readGit(root, [
    "diff-tree",
    "-r",
    "-z",
    "--name-only",
    "--no-commit-id",
    "--no-renames",
    empty,
    commit,
    "--",
    // A glob ending in a slash names directories, as a plain path does; Git matches their files with `/**`.
    `:(top,glob)${glob.endsWith("/") ? `${glob}**` : glob}`,
  ]);
  if (listing.status !== 0)
    refuse("source_read_failed", `Git could not match ${glob} at ${commit}.`);
  return new Set(listing.stdout.toString("utf8").split("\0").filter(Boolean));
}

/**
 * A test of whether a declared path holds a file: a glob matches as Git matches it, a directory
 * ends in a slash, and any other path is one file.
 */
function holder(root, commit) {
  const matches = new Map();
  /** @type {string | null} */
  let empty = null;
  return (declared, file) => {
    if (!isGlob(declared))
      return declared.endsWith("/") ? file.startsWith(declared) : file === declared;
    empty ??= emptyTree(root);
    if (!matches.has(declared)) matches.set(declared, globbed(root, commit, empty, declared));
    return matches.get(declared).has(file);
  };
}

/** Every tracked file at a commit with its size in bytes, in path order. */
function trackedFiles(root, commit) {
  const listing = readGit(root, ["ls-tree", "-r", "-z", "-l", "--full-tree", commit]);
  if (listing.status !== 0)
    refuse("source_read_failed", `Git could not list the files at ${commit}.`);
  /** @type {Array<[string, number]>} */
  const files = [];
  for (const entry of listing.stdout.toString("utf8").split("\0")) {
    if (!entry) continue;
    const tab = entry.indexOf("\t");
    const [, type, , size] = entry.slice(0, tab).split(/ +/u);
    if (type === "blob") files.push([entry.slice(tab + 1), Number(size)]);
  }
  return files.sort(byPath);
}

/**
 * The files at a commit, split by the model's coverage scope: every tracked file, those in the
 * scope, the files each exclusion leaves out, and the declared paths that match no file. Git is
 * only read.
 * @param {any} model
 * @param {string} root
 * @param {string} commit
 */
export function scopeAt(model, root, commit) {
  const tracked = trackedFiles(root, commit);
  const include = model.coverage?.include ?? null;
  const excluded = (model.coverage?.exclude ?? []).map(({ path: declared, reason }) => ({
    path: declared,
    reason,
    files: 0,
    bytes: 0,
  }));
  const holds = holder(root, commit);
  const matched = new Set();
  /** @type {Array<[string, number]>} */
  const scope = [];
  for (const [file, bytes] of tracked) {
    const including = include?.find((declared) => holds(declared, file));
    if (including) matched.add(including);
    if (include && !including) continue;
    const exclusion = excluded.find(({ path: declared }) => holds(declared, file));
    if (exclusion) {
      matched.add(exclusion.path);
      exclusion.files += 1;
      exclusion.bytes += bytes;
      continue;
    }
    scope.push([file, bytes]);
  }
  const declared = [...(include ?? []), ...excluded.map(({ path: excludedPath }) => excludedPath)];
  return {
    tracked,
    include,
    scope,
    excluded,
    unmatched: declared.filter((entry) => !matched.has(entry)),
  };
}
