import path from "node:path";
import { refuse } from "../refusal.mjs";
import { commitOf, readGit } from "./git.mjs";
import { directoriesOf, isGlob, scopeAt } from "./scope.mjs";
import { fatesBetween, repinWorklist } from "./worklist.mjs";

/** The most uncovered directories one report lists. */
const LISTED_DIRECTORIES = 8;

/** The directory an included path names, or that a glob's characters begin within. */
const fixedDirectory = (declared) =>
  isGlob(declared)
    ? declared.slice(0, declared.search(/[*?[]/u)).replace(/[^/]*$/u, "")
    : declared.endsWith("/")
      ? declared
      : null;

/**
 * The largest directories in scope that hold uncovered files and no owned one, each
 * neither inside nor around one listed before it.
 */
function largestUncovered(uncovered, owned, include) {
  const occupied = new Set([...owned].flatMap(directoriesOf));
  const inScope = (directory) =>
    !include ||
    include.some((declared) => {
      const fixed = fixedDirectory(declared);
      return fixed !== null && directory.startsWith(fixed);
    });
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

/** What the model's components own of the files at its revision, within its declared scope. */
function coverageAt(model, binding, root, commit) {
  const { include, scope, excluded, unmatched } = scopeAt(model, root, commit);
  const owned = new Set(binding.records.filter(({ owner }) => owner).map(({ path: file }) => file));
  const tally = { files: { scope: 0, owned: 0, uncovered: 0, excluded: 0 } };
  tally.bytes = { ...tally.files };
  const uncovered = [];
  for (const [file, bytes] of scope) {
    const kind = owned.has(file) ? "owned" : "uncovered";
    for (const counted of ["scope", kind]) {
      tally.files[counted] += 1;
      tally.bytes[counted] += bytes;
    }
    if (kind === "uncovered") uncovered.push([file, bytes]);
  }
  for (const exclusion of excluded) {
    tally.files.excluded += exclusion.files;
    tally.bytes.excluded += exclusion.bytes;
  }
  const inScope = new Set(scope.map(([file]) => file));
  return {
    revision: commit,
    include,
    files: tally.files,
    bytes: tally.bytes,
    excluded,
    unmatched,
    // Owned files lie in the scope by construction, so only a relation's files can lie outside it.
    citedOutsideScope: binding.records
      .map(({ path: file }) => file)
      .filter((file) => !inScope.has(file)),
    largestUncovered: largestUncovered(uncovered, owned, include),
  };
}

/**
 * How far the repository has moved from the model's revision to a named one, and the re-pin
 * worklist between them.
 */
function currencyAgainst(model, binding, root, pinned, revision, citations) {
  const commit = commitOf(root, revision, "currency_revision_unknown");
  const count = readGit(root, ["rev-list", "--count", "--first-parent", `${pinned}..${commit}`]);
  if (count.status !== 0)
    refuse("source_read_failed", `Git could not compare ${pinned} with ${commit}.`);
  const ancestor = readGit(root, ["merge-base", "--is-ancestor", pinned, commit]).status === 0;
  const fates = fatesBetween(root, pinned, commit);
  return {
    against: { revision, commit },
    ancestor,
    commits: Number(count.stdout.toString("utf8").trim()),
    files: binding.records.map(({ path: file }) => ({
      path: file,
      ...(fates.get(file) ?? { state: "unchanged" }),
    })),
    worklist: repinWorklist(model, root, pinned, commit, fates, citations),
  };
}

/**
 * Measure a model against its repository: coverage at the model's revision and, with
 * `against`, currency up to that revision with the re-pin worklist, which classifies the
 * `citations` a guide makes. Git is only read, and a model is never refused for what it covers.
 * `binding` is the model's files bound to the same checkout. Returns `null` for a model
 * without a revision.
 * @param {any} model
 * @param {any} binding
 * @param {string} repo
 * @param {{ against?: string | null, citations?: Array<{ where: string, path: string, lines: [number, number] | null }> }} [options]
 */
export function measureCoverage(model, binding, repo, { against = null, citations = [] } = {}) {
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
    ...coverageAt(model, binding, root, pinned),
    currency:
      against === null ? null : currencyAgainst(model, binding, root, pinned, against, citations),
  };
}

/**
 * The components that claim no file and the relations that cite none.
 * @param {any} model
 */
export function uncitedStatements(model) {
  const uncited = (items) => items.filter(({ files }) => !files.length).map(({ id }) => id);
  return { components: uncited(model.components), relations: uncited(model.relations) };
}
