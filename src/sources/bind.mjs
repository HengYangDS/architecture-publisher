import { createHash } from "node:crypto";
import path from "node:path";
import { refuse } from "../refusal.mjs";
import { commitOf, readGit } from "./git.mjs";
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
        owner: component.id,
        relations: cited.get(claim) ?? [],
        state: "unverified",
      });
  for (const [file, relations] of cited)
    if (!records.has(file))
      records.set(file, { path: file, sha256: null, owner: null, relations, state: "unverified" });
  const owned = new Map(
    model.components.map(({ id, files }) => [id, files.filter((claim) => !claim.endsWith("/"))]),
  );
  return { records: [...records.values()].sort(byRecordPath), owned };
}

/**
 * Give each file in the scope to its most specific claim, refuse a claim that holds none and a
 * relation file absent at the commit, and read the digest of every cited file.
 * @param {any} model
 * @param {string} root
 * @param {string} commit
 */
function resolved(model, root, commit) {
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
  const problems = [];
  for (const [claim, { where }] of owners)
    if (!holding.has(claim))
      problems.push({
        code: "claim_unmatched",
        path: where,
        message: `${claim} owns no file in the scope at ${commit}`,
      });
  model.relations.forEach((relation, index) =>
    relation.files.forEach((file, position) => {
      if (!present.has(file))
        problems.push({
          code: "relation_file_missing",
          path: `/relations/${index}/files/${position}`,
          message: `${file} is not a file at ${commit}`,
        });
    }),
  );
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
  const records = files.map((file, index) => {
    const object = /** @type {Buffer} */ (objects[index]);
    const claim = winning.get(file);
    return {
      path: file,
      sha256: createHash("sha256").update(object).digest("hex"),
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
  return { records, owned };
}

/**
 * Bind the files a model claims and cites to its revision without changing the repository. With
 * a checkout, every file in the scope is given to the component whose claim is most specific and
 * every cited file is recorded with its digest, owner and citing relations; without one, the
 * declared paths are recorded unverified.
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
    return { state: "none", repository, records: [], owned };
  }
  if (!repo) return { state: "unverified", repository, ...declared(model) };
  if (!repository)
    refuse(
      "source_revision_missing",
      "Verifying the model's files requires repository.revision in the model.",
    );
  const root = path.resolve(repo);
  const commit = commitOf(root, repository.revision, "source_revision_unknown");
  return { state: "verified", repository, ...resolved(model, root, commit) };
}
