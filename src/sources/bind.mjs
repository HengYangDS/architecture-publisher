import { createHash } from "node:crypto";
import path from "node:path";
import { refuse } from "../refusal.mjs";
import { commitDate, commitOf, commitTime, readGit } from "./git.mjs";
import { directoriesOf, scopeAt } from "./scope.mjs";

/** Parse `git cat-file --batch` output into one record per requested object. */
function parseBatch(output, count) {
  const records = [];
  let offset = 0;
  for (let index = 0; index < count; index += 1) {
    const end = output.indexOf(10, offset);
    const header = output.subarray(offset, end).toString("utf8");
    offset = end + 1;
    const parts = header.split(" ");
    if (parts.length !== 3) {
      records.push("missing");
      continue;
    }
    const bytes = Number(parts[2]);
    records.push(parts[1] === "blob" ? output.subarray(offset, offset + bytes) : parts[1]);
    offset += bytes + 1;
  }
  return records;
}

const byRecordPath = (a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

/** A time in seconds since the epoch as its UTC date, `YYYY-MM-DD`. */
const utcDate = (time) => new Date(time * 1000).toISOString().slice(0, 10);

/**
 * When each file last changed at or before a commit, in seconds since the epoch, from one read of
 * the history of the paths the model claims and cites. Git walks from the commit back, so the
 * first commit that names a file is its last change. A shallow clone's oldest commit seems to add
 * every file, so its history is refused rather than read as recent.
 * @param {string} root
 * @param {string} commit
 * @param {string[]} pathspecs
 * @param {string[]} files
 */
function changeTimes(root, commit, pathspecs, files) {
  const shallow = readGit(root, ["rev-parse", "--is-shallow-repository"]);
  if (shallow.stdout.toString("utf8").trim() === "true")
    refuse(
      "source_history_unavailable",
      `The repository at ${root} is a shallow clone, so when its files last changed is unknown; fetch its full history.`,
    );
  const log = readGit(root, [
    "log",
    // The caller's configuration could hide the root commit's files, print signatures, follow a
    // lone path's renames or name paths from a subdirectory.
    "--root",
    "--no-show-signature",
    "--no-follow",
    "--no-relative",
    // A merge names the files it changed from every parent: those it wrote itself, such as a
    // resolved conflict, which no commit on either side holds.
    "--diff-merges=combined",
    "--no-renames",
    "--name-only",
    "-z",
    "--format=%x01%ct",
    commit,
    "--",
    ...pathspecs.map((pathspec) => `:(top,literal)${pathspec}`),
  ]);
  if (log.status !== 0)
    refuse("source_read_failed", `Git could not read the history of the cited files at ${commit}.`);
  const seen = new Map();
  // Each commit is `\x01<time>\0`, a newline (a second NUL for a merge), then the paths it
  // changed, each ending in a NUL.
  for (const chunk of log.stdout.toString("utf8").split("\x01").slice(1)) {
    const end = chunk.indexOf("\0");
    for (const name of chunk.slice(end + 2).split("\0"))
      if (name && !seen.has(name)) seen.set(name, Number(chunk.slice(0, end)));
  }
  /** @type {Map<string, number>} */
  const times = new Map();
  for (const file of files) {
    const time = seen.get(file);
    if (time === undefined)
      refuse(
        "source_history_unavailable",
        `No commit at or before ${commit} changes ${file}, so when it last changed is unknown.`,
      );
    times.set(file, time);
  }
  return times;
}

/** The relations that cite each file, by path, in model order. */
function citations(model) {
  const cited = new Map();
  for (const relation of model.relations)
    for (const file of relation.files) cited.set(file, [...(cited.get(file) ?? []), relation.id]);
  return cited;
}

/**
 * Every path the model declares, unread: each component's claims and each relation's files, as
 * unverified records, and the files each component names itself, in claim order.
 * @param {any} model
 */
function declared(model) {
  const cited = citations(model);
  const records = new Map();
  for (const component of model.components)
    for (const claim of component.files)
      records.set(claim, {
        path: claim,
        sha256: null,
        bytes: null,
        changed: null,
        owner: component.id,
        relations: cited.get(claim) ?? [],
        state: "unverified",
      });
  for (const [file, relations] of cited)
    if (!records.has(file))
      records.set(file, {
        path: file,
        sha256: null,
        bytes: null,
        changed: null,
        owner: null,
        relations,
        state: "unverified",
      });
  const owned = new Map(
    model.components.map(({ id, files }) => [id, files.filter((claim) => !claim.endsWith("/"))]),
  );
  return { records: [...records.values()].sort(byRecordPath), owned };
}

/**
 * Each file in the scope at a commit with its most specific claim, and what a build at that
 * commit refuses: the claims that own no file in the scope and the relation files absent there.
 * Git is only read, and nothing is refused.
 * @param {any} model
 * @param {string} root
 * @param {string} commit
 */
export function ownershipAt(model, root, commit) {
  const { tracked, scope } = scopeAt(model, root, commit);
  const owners = new Map();
  model.components.forEach((component, index) =>
    component.files.forEach((claim, position) =>
      owners.set(claim, {
        component: component.id,
        where: `/components/${index}/files/${position}`,
      }),
    ),
  );
  // A file's most specific claim names the file itself, otherwise its deepest claimed directory.
  const winning = new Map();
  for (const [file] of scope) {
    const claim = [file, ...directoriesOf(file).reverse()].find((entry) => owners.has(entry));
    if (claim) winning.set(file, claim);
  }
  const holding = new Set(winning.values());
  const present = new Set(tracked.map(([file]) => file));
  const empty = [...owners]
    .filter(([claim]) => !holding.has(claim))
    .map(([claim, { component, where }]) => ({ claim, component, path: where }));
  const missing = model.relations.flatMap((relation, index) =>
    relation.files.flatMap((file, position) =>
      present.has(file)
        ? []
        : [{ file, relation: relation.id, path: `/relations/${index}/files/${position}` }],
    ),
  );
  return { scope, owners, winning, empty, missing };
}

/**
 * Give each file in the scope to its most specific claim, refuse a claim that holds none and a
 * relation file absent at the commit, and read the digest, size and last change of every cited
 * file.
 * @param {any} model
 * @param {string} root
 * @param {string} commit
 */
function resolved(model, root, commit) {
  const { owners, winning, empty, missing } = ownershipAt(model, root, commit);
  const problems = [
    ...empty.map(({ claim, path: where }) => ({
      code: "claim_unmatched",
      path: where,
      message: `${claim} owns no file in the scope at ${commit}`,
    })),
    ...missing.map(({ file, path: where }) => ({
      code: "relation_file_missing",
      path: where,
      message: `${file} is not a file at ${commit}`,
    })),
  ];
  if (problems.length)
    refuse(
      "files_unresolved",
      "The files the model claims and cites do not hold at its revision.",
      problems,
    );
  const cited = citations(model);
  const files = [...new Set([...winning.keys(), ...cited.keys()])].sort();
  const batch = readGit(
    root,
    ["cat-file", "--batch"],
    `${files.map((file) => `${commit}:${file}`).join("\n")}\n`,
  );
  if (batch.status !== 0) refuse("source_read_failed", "Git could not read the cited files.");
  const objects = parseBatch(batch.stdout, files.length);
  const claims = model.components.flatMap(({ files: claimed }) => claimed);
  const times = changeTimes(root, commit, [...new Set([...claims, ...cited.keys()])], files);
  const records = files.map((file, index) => {
    const object = /** @type {Buffer} */ (objects[index]);
    const claim = winning.get(file);
    return {
      path: file,
      sha256: createHash("sha256").update(object).digest("hex"),
      bytes: object.length,
      changed: utcDate(/** @type {number} */ (times.get(file))),
      owner: claim ? owners.get(claim).component : null,
      relations: cited.get(file) ?? [],
      state: "verified",
    };
  });
  // Each component's files in claim order; within a directory, in path order.
  const owned = new Map(
    model.components.map(({ id, files: claims }) => [
      id,
      claims.flatMap((claim) =>
        [...winning].filter(([, winner]) => winner === claim).map(([file]) => file),
      ),
    ]),
  );
  return {
    records,
    owned,
    times,
    pinTime: commitTime(root, commit),
    pinDate: commitDate(root, commit),
  };
}

/**
 * Bind the files a model claims and cites to its revision without changing the repository. With
 * a checkout, every file in the scope is given to the component whose claim is most specific and
 * every cited file is recorded with its digest, size, last change, owner and citing relations,
 * beside each file's change time and the revision's time and date; without one, the declared paths are recorded
 * unverified and no time is known.
 * @param {any} model
 * @param {string | null} repo
 */
export function bindSources(model, repo) {
  const repository = model.repository;
  const empty =
    model.components.every(({ files }) => !files.length) &&
    model.relations.every(({ files }) => !files.length);
  if (empty) {
    const owned = new Map(model.components.map(({ id }) => [id, []]));
    return {
      state: "none",
      repository,
      records: [],
      owned,
      times: new Map(),
      pinTime: null,
      pinDate: null,
    };
  }
  if (!repo)
    return {
      state: "unverified",
      repository,
      ...declared(model),
      times: new Map(),
      pinTime: null,
      pinDate: null,
    };
  if (!repository)
    refuse(
      "source_revision_missing",
      "Verifying the model's files requires repository.revision in the model.",
    );
  const root = path.resolve(repo);
  const commit = commitOf(root, repository.revision, "source_revision_unknown");
  return { state: "verified", repository, ...resolved(model, root, commit) };
}
