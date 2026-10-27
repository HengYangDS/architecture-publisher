import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { refuse } from "../refusal.mjs";

const MAXIMUM_SOURCE_BYTES = 64 * 1024 * 1024;

// Reads must never fetch, prompt, follow replacement refs or refresh the index.
const GIT_ENVIRONMENT = Object.freeze({
  GIT_NO_LAZY_FETCH: "1",
  GIT_ALLOW_PROTOCOL: "",
  GIT_TERMINAL_PROMPT: "0",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_CONFIG_NOSYSTEM: "1",
});

function git(repo, args, input) {
  const result = spawnSync("git", ["--no-replace-objects", "-C", repo, ...args], {
    input,
    maxBuffer: MAXIMUM_SOURCE_BYTES * 2,
    env: { ...process.env, ...GIT_ENVIRONMENT },
  });
  if (result.error) refuse("source_git_unavailable", `Cannot run Git: ${result.error.message}`);
  return result;
}

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

/**
 * Verify every declared source at the model's revision without changing the repository.
 * @param {any} model
 * @param {string | null} repo
 */
export function bindSources(model, repo) {
  if (!model.sources.length) return { state: "none", repository: model.repository, records: [] };
  if (!repo)
    return {
      state: "unverified",
      repository: model.repository,
      records: model.sources.map((source) => ({
        id: source.id,
        path: source.path,
        declaredSha256: source.sha256,
        sha256: null,
        state: "unverified",
      })),
    };
  if (!model.repository)
    refuse(
      "source_revision_missing",
      "Verifying sources requires repository.revision in the model.",
    );
  const root = path.resolve(repo);
  const revision = model.repository.revision;
  const commit = git(root, ["rev-parse", "--verify", "--quiet", `${revision}^{commit}`]);
  if (commit.status !== 0)
    refuse("source_revision_unknown", `The repository at ${root} has no commit ${revision}.`);
  const requests = model.sources.map(({ path: file }) => `${revision}:${file}`);
  const batch = git(root, ["cat-file", "--batch"], `${requests.join("\n")}\n`);
  if (batch.status !== 0) refuse("source_read_failed", "Git could not read the declared sources.");
  const objects = parseBatch(batch.stdout, requests.length);
  const problems = [];
  const records = model.sources.map((source, index) => {
    const object = objects[index];
    if (!Buffer.isBuffer(object)) {
      problems.push({
        code: "source_missing",
        path: `/sources/${source.id}/path`,
        message: `${source.path} is not a file at ${revision}`,
      });
      return null;
    }
    const sha256 = createHash("sha256").update(object).digest("hex");
    if (source.sha256 && source.sha256 !== sha256)
      problems.push({
        code: "source_digest_mismatch",
        path: `/sources/${source.id}/sha256`,
        message: `${source.path} declares ${source.sha256} but is ${sha256} at ${revision}`,
      });
    return {
      id: source.id,
      path: source.path,
      declaredSha256: source.sha256,
      sha256,
      state: "verified",
    };
  });
  if (problems.length)
    refuse("sources_unverified", "Declared sources do not match the repository.", problems);
  return { state: "verified", repository: model.repository, records };
}

/**
 * Return the repository's origin URL when it matches the model's declared URL.
 * @param {any} model
 * @param {string | null} repo
 */
export function matchingOrigin(model, repo) {
  if (!repo || !model.repository?.url) return null;
  const origin = git(path.resolve(repo), ["remote", "get-url", "origin"]);
  if (origin.status !== 0) return null;
  return origin.stdout.toString("utf8").trim() === model.repository.url
    ? model.repository.url
    : null;
}
