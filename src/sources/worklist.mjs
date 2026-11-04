import { refuse } from "../refusal.mjs";
import { ownershipAt } from "./bind.mjs";
import { readGit } from "./git.mjs";

/**
 * What became of each file that changed between two commits, as Git's rename detection reads
 * it: `modified`, `deleted`, `added`, or `moved` with the path it moved `to`.
 * @param {string} root
 * @param {string} pinned
 * @param {string} commit
 * @returns {Map<string, { state: string, to?: string }>}
 */
export function fatesBetween(root, pinned, commit) {
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
  if (diff.status !== 0)
    refuse("source_read_failed", `Git could not compare ${pinned} with ${commit}.`);
  const fates = new Map();
  const fields = diff.stdout.toString("utf8").split("\0").filter(Boolean);
  for (let index = 0; index < fields.length;) {
    const status = fields[index];
    if (status.startsWith("R"))
      fates.set(fields[index + 1], { state: "moved", to: fields[index + 2] });
    else if (!status.startsWith("C"))
      fates.set(fields[index + 1], {
        state: status === "D" ? "deleted" : status === "A" ? "added" : "modified",
      });
    index += status.startsWith("R") || status.startsWith("C") ? 3 : 2;
  }
  return fates;
}

/** The old and new line ranges of Git's zero-context hunks between two blobs. */
function hunksBetween(root, before, after) {
  const diff = readGit(root, [
    "diff",
    "-U0",
    "--no-color",
    "--no-ext-diff",
    "--no-textconv",
    before,
    after,
  ]);
  if (diff.status !== 0)
    refuse("source_read_failed", `Git could not compare ${before} with ${after}.`);
  return [
    ...diff.stdout.toString("utf8").matchAll(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,(\d+))? @@/gmu),
  ].map(([, start, count, added]) => ({
    start: Number(start),
    count: count === undefined ? 1 : Number(count),
    added: added === undefined ? 1 : Number(added),
  }));
}

/**
 * How a cited range fares at a later commit: the same, shifted by the lines changes above it add
 * or remove, moved with its file, touched when a change falls within it, or gone with its file.
 * A citation of a whole file is touched by any change to it.
 */
function citationFate(root, pinned, commit, fates, citation) {
  const fate = fates.get(citation.path);
  if (!fate) return { ...citation, fate: "same" };
  if (fate.state === "deleted") return { ...citation, fate: "gone" };
  const to = fate.state === "moved" ? fate.to : null;
  const moved = to ? { to } : {};
  const hunks = hunksBetween(
    root,
    `${pinned}:${citation.path}`,
    `${commit}:${to ?? citation.path}`,
  );
  if (!citation.lines)
    return { ...citation, fate: hunks.length ? "touched" : to ? "moved" : "same", ...moved };
  const [start, end] = citation.lines;
  let shift = 0;
  for (const hunk of hunks) {
    // A change covers its old lines; an insertion falls after its line `start`.
    const touches = hunk.count
      ? hunk.start <= end && hunk.start + hunk.count - 1 >= start
      : hunk.start >= start && hunk.start < end;
    if (touches) return { ...citation, fate: "touched", ...moved };
    if ((hunk.count ? hunk.start + hunk.count - 1 : hunk.start) < start)
      shift += hunk.added - hunk.count;
  }
  const at = [start + shift, end + shift];
  if (to) return { ...citation, fate: "moved", to, at };
  return shift ? { ...citation, fate: "shifted", at } : { ...citation, fate: "same" };
}

/**
 * What re-pinning a model from its revision to a later commit changes: per component, the files
 * it owns that are modified, moved with the component their new path falls to, or deleted, and
 * the files its claims take in; per relation, the cited files that changed; what a build at the
 * later commit refuses; the files that newly fall under no claim; and how each citation fares.
 * Git is only read.
 * @param {any} model
 * @param {string} root
 * @param {string} pinned
 * @param {string} commit
 * @param {Map<string, { state: string, to?: string }>} fates
 * @param {Array<{ where: string, path: string, lines: [number, number] | null }>} citations
 */
export function repinWorklist(model, root, pinned, commit, fates, citations) {
  const before = ownershipAt(model, root, pinned);
  const after = ownershipAt(model, root, commit);
  const ownerAt = (state, file) => {
    const claim = state.winning.get(file);
    return claim ? state.owners.get(claim).component : null;
  };
  const work = new Map(
    model.components.map(({ id, label }) => [
      id,
      { id, label, modified: [], moved: [], deleted: [], taken: [] },
    ]),
  );
  // The component each moved file's new path came from, to tell a move from a file taken in.
  const movedFrom = new Map();
  for (const [file] of before.winning) {
    const fate = fates.get(file);
    if (!fate) continue;
    const entry = work.get(ownerAt(before, file));
    if (fate.state === "moved") {
      entry.moved.push({ path: file, to: fate.to, owner: ownerAt(after, fate.to) });
      movedFrom.set(fate.to, entry.id);
    } else if (fate.state === "deleted") entry.deleted.push(file);
    else entry.modified.push(file);
  }
  for (const [file] of after.winning) {
    const owner = ownerAt(after, file);
    const previous = before.winning.has(file) ? ownerAt(before, file) : movedFrom.get(file);
    if (previous !== owner) work.get(owner).taken.push(file);
  }
  const uncoveredBefore = new Set(
    before.scope.map(([file]) => file).filter((file) => !before.winning.has(file)),
  );
  return {
    components: [...work.values()].filter(
      ({ modified, moved, deleted, taken }) =>
        modified.length + moved.length + deleted.length + taken.length,
    ),
    relations: model.relations.flatMap(({ id, files }) => {
      const changed = files
        .filter((file) => fates.has(file))
        .map((file) => ({ path: file, ...fates.get(file) }));
      return changed.length ? [{ id, files: changed }] : [];
    }),
    refused: [
      ...after.empty.map(({ claim, component, path: where }) => ({
        code: "claim_unmatched",
        path: where,
        component,
        claim,
      })),
      ...after.missing.map(({ file, relation, path: where }) => ({
        code: "relation_file_missing",
        path: where,
        relation,
        file,
        ...(fates.get(file)?.to ? { to: fates.get(file)?.to } : {}),
      })),
    ],
    uncovered: after.scope
      .map(([file]) => file)
      .filter((file) => !after.winning.has(file) && !uncoveredBefore.has(file)),
    citations: citations.map((citation) => citationFate(root, pinned, commit, fates, citation)),
  };
}
