import { spawnSync } from "node:child_process";
import { childEnvironment } from "../environment.mjs";
import { refuse } from "../refusal.mjs";

/** The most output one read may return: two of the largest sources binding reads. */
const MAXIMUM_OUTPUT_BYTES = 128 * 1024 * 1024;

// Reads must never fetch, prompt, follow replacement refs or refresh the index.
const GIT_ENVIRONMENT = Object.freeze({
  GIT_NO_LAZY_FETCH: "1",
  GIT_ALLOW_PROTOCOL: "",
  GIT_TERMINAL_PROMPT: "0",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_CONFIG_NOSYSTEM: "1",
});

/**
 * Run one read-only Git command in a repository.
 * @param {string} repo
 * @param {string[]} args
 * @param {string} [input]
 */
export function readGit(repo, args, input) {
  const result = spawnSync("git", ["--no-replace-objects", "-C", repo, ...args], {
    input,
    maxBuffer: MAXIMUM_OUTPUT_BYTES,
    env: childEnvironment(GIT_ENVIRONMENT),
  });
  if (result.error) refuse("source_git_unavailable", `Cannot run Git: ${result.error.message}`);
  return result;
}

/**
 * The commit a revision names in a repository, or a refusal with the given code.
 * @param {string} repo
 * @param {string} revision
 * @param {string} code
 */
export function commitOf(repo, revision, code) {
  const result = readGit(repo, ["rev-parse", "--verify", "--quiet", `${revision}^{commit}`]);
  if (result.status !== 0) refuse(code, `The repository at ${repo} has no commit ${revision}.`);
  return result.stdout.toString("utf8").trim();
}
