import path from "node:path";
import { refuse } from "../refusal.mjs";
import { commitOf, readGit } from "./git.mjs";

/** The most uncovered directories one report lists. */
const LISTED_DIRECTORIES = 8;

const byPath = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);

/** Whether a declared path holds a file: a directory ends in a slash, any other path is one file. */
const holds = (declared, file) =>
  declared.endsWith("/") ? file.startsWith(declared) : file === declared;

/** Every directory above a file, outermost first, each ending in a slash. */
function directoriesOf(file) {
  const parts = file.split("/").slice(0, -1);
  return parts.map((_, index) => `${parts.slice(0, index + 1).join("/")}/`);
}

/** Every tracked file at a commit with its size in bytes, in path order. */
function trackedFiles(root, commit) {
  const listing = readGit(root, ["ls-tree", "-r", "-z", "-l", "--full-tree", commit]);
  if (listing.status !== 0)
    refuse("source_read_failed", `Git could not list the files at ${commit}.`);
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
 * The largest directories in scope that hold uncovered files and no cited one, each
 * neither inside nor around one listed before it.
 */
function largestUncovered(uncovered, cited, include) {
  const occupied = new Set([...cited].flatMap(directoriesOf));
  const inScope = (directory) =>
    !include ||
    include.some((declared) => declared.endsWith("/") && directory.startsWith(declared));
  const sizes = new Map();
  for (const [file, bytes] of uncovered)
    for (const directory of directoriesOf(file)) {
      if (occupied.has(directory) || !inScope(directory)) continue;
      const size = sizes.get(directory) ?? { path: directory, files: 0, bytes: 0 };
      size.files += 1;
      size.bytes += bytes;
      sizes.set(directory, size);
    }
  const listed = [];
  const order = (a, b) => b.bytes - a.bytes || (a.path < b.path ? -1 : 1);
  for (const size of [...sizes.values()].sort(order)) {
    if (
      listed.some(({ path: other }) => size.path.startsWith(other) || other.startsWith(size.path))
    )
      continue;
    listed.push(size);
    if (listed.length === LISTED_DIRECTORIES) break;
  }
  return listed;
}

/** What the model cites of the files at its revision, within its declared scope. */
function coverageAt(model, root, commit) {
  const files = trackedFiles(root, commit);
  const include = model.coverage?.include ?? null;
  const excluded = (model.coverage?.exclude ?? []).map(({ path: declared, reason }) => ({
    path: declared,
    reason,
    files: 0,
    bytes: 0,
  }));
  const cited = new Set(model.sources.map(({ path: file }) => file));
  const tally = { files: { scope: 0, cited: 0, uncovered: 0, excluded: 0 } };
  tally.bytes = { ...tally.files };
  const add = (kind, bytes) => {
    tally.files[kind] += 1;
    tally.bytes[kind] += bytes;
  };
  const matched = new Set();
  const uncovered = [];
  const citedInScope = new Set();
  for (const [file, bytes] of files) {
    const including = include?.find((declared) => holds(declared, file));
    if (including) matched.add(including);
    if (include && !including) continue;
    const exclusion = excluded.find(({ path: declared }) => holds(declared, file));
    if (exclusion) {
      matched.add(exclusion.path);
      exclusion.files += 1;
      exclusion.bytes += bytes;
      add("excluded", bytes);
      continue;
    }
    add("scope", bytes);
    if (cited.has(file)) {
      add("cited", bytes);
      citedInScope.add(file);
    } else {
      add("uncovered", bytes);
      uncovered.push([file, bytes]);
    }
  }
  const declared = [...(include ?? []), ...excluded.map(({ path: excludedPath }) => excludedPath)];
  return {
    revision: commit,
    include,
    files: tally.files,
    bytes: tally.bytes,
    excluded,
    unmatched: declared.filter((entry) => !matched.has(entry)),
    citedOutsideScope: [...cited].filter((file) => !citedInScope.has(file)).sort(),
    largestUncovered: largestUncovered(uncovered, citedInScope, include),
  };
}

/** How far the repository has moved from the model's revision to a named one. */
function currencyAgainst(model, root, pinned, revision) {
  const commit = commitOf(root, revision, "currency_revision_unknown");
  const count = readGit(root, ["rev-list", "--count", "--first-parent", `${pinned}..${commit}`]);
  const diff = readGit(root, [
    "diff-tree",
    "-r",
    "-z",
    "-M",
    "--no-commit-id",
    "--name-status",
    pinned,
    commit,
  ]);
  if (count.status !== 0 || diff.status !== 0)
    refuse("source_read_failed", `Git could not compare ${pinned} with ${commit}.`);
  const ancestor = readGit(root, ["merge-base", "--is-ancestor", pinned, commit]).status === 0;
  const fates = new Map();
  const fields = diff.stdout.toString("utf8").split("\0").filter(Boolean);
  for (let index = 0; index < fields.length;) {
    const status = fields[index];
    if (status.startsWith("R"))
      fates.set(fields[index + 1], { state: "moved", to: fields[index + 2] });
    else if (!status.startsWith("C"))
      fates.set(fields[index + 1], { state: status === "D" ? "deleted" : "modified" });
    index += status.startsWith("R") || status.startsWith("C") ? 3 : 2;
  }
  return {
    against: { revision, commit },
    ancestor,
    commits: Number(count.stdout.toString("utf8").trim()),
    sources: model.sources.map(({ id, path: file }) => ({
      id,
      path: file,
      ...(fates.get(file) ?? { state: "unchanged" }),
    })),
  };
}

/**
 * Measure a model against its repository: coverage at the model's revision and, with
 * `against`, currency up to that revision. Git is only read, and a model is never refused
 * for what it cites. Returns `null` for a model without a revision.
 * @param {any} model
 * @param {string} repo
 * @param {{ against?: string | null }} [options]
 */
export function measureCoverage(model, repo, { against = null } = {}) {
  if (!model.repository) {
    if (against !== null)
      refuse(
        "coverage_revision_missing",
        "Measuring currency requires repository.revision in the model.",
      );
    return null;
  }
  const root = path.resolve(repo);
  const pinned = commitOf(root, model.repository.revision, "source_revision_unknown");
  return {
    ...coverageAt(model, root, pinned),
    currency: against === null ? null : currencyAgainst(model, root, pinned, against),
  };
}

/**
 * The components and relations that cite no source.
 * @param {any} model
 */
export function uncitedStatements(model) {
  const uncited = (items) => items.filter(({ sources }) => !sources.length).map(({ id }) => id);
  return { components: uncited(model.components), relations: uncited(model.relations) };
}
