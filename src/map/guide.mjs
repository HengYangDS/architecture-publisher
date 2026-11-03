import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { childEnvironment } from "../environment.mjs";
import { refuse } from "../refusal.mjs";
import { runArchify } from "./archify.mjs";
import { deliverExplainer, refusePage, writePage } from "./explainer.mjs";

/**
 * The guide: an Archify explainer draft a work's author writes beside the model, which the
 * publisher delivers as the page. The draft and the local files it names are staged; with a
 * checkout, Archify verifies every repository source the guide cites against a temporary clone
 * of it at the model's revision.
 */

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The draft arguments that name a local file, by directive. */
const LOCAL = Object.freeze({ "@diagram": "source", "@chart": "data", "@image": "path" });

/** A directive line's `key=value` arguments; a quoted value is a JSON string. */
function argumentsOf(line) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [, key, raw] of line.matchAll(/(\w+)=("(?:[^"\\]|\\.)*"|\S+)/gu))
    out[key] = raw.startsWith('"') ? JSON.parse(raw) : raw;
  return out;
}

/** The draft's directive lines, leaving out fenced blocks. */
function directives(draft) {
  const lines = [];
  let fence = "";
  for (const line of draft.split(/\r?\n/u)) {
    const marker = /^(`{3,}|~{3,})/u.exec(line)?.[1];
    if (marker && !fence) fence = marker;
    else if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = "";
    else if (!fence && line.startsWith("@")) lines.push(line);
  }
  return lines;
}

/** A directive's name: its first word. */
const directiveOf = (line) => line.split(/\s/u, 1)[0];

/**
 * The local files a draft names in its `@diagram source=`, `@chart data=` and `@image path=`
 * arguments, in the order they first appear.
 * @param {string} draft
 */
export function referencedFiles(draft) {
  /** @type {string[]} */
  const names = [];
  for (const line of directives(draft)) {
    const key = LOCAL[/** @type {keyof typeof LOCAL} */ (directiveOf(line))];
    const value = key ? argumentsOf(line)[key] : undefined;
    if (value !== undefined && !names.includes(value)) names.push(value);
  }
  return names;
}

/**
 * The repository a draft's `@meta` names: its URL and revision, each `null` when the draft names
 * none.
 * @param {string} draft
 */
export function draftRepository(draft) {
  const meta = directives(draft)
    .filter((line) => directiveOf(line) === "@meta")
    .map(argumentsOf);
  const named = (key) => meta.map((entry) => entry[key]).find((value) => value !== undefined);
  return { url: named("repo_url") ?? null, revision: named("repo_revision") ?? null };
}

/** A file name without a directory part. */
const isFileName = (name) => name !== "." && name !== ".." && !/[\\/\0]/u.test(name);

/**
 * Read a guide: its draft and every local file the draft names, each a regular file in the
 * draft's own directory.
 * @param {string} draftPath the draft's path
 */
export async function readGuide(draftPath) {
  const directory = path.dirname(draftPath);
  const read = async (name, missing) => {
    const file = path.join(directory, name);
    const info = await fs.lstat(file).catch(missing);
    if (!info.isFile())
      refuse("guide_file_invalid", `${name} is not a regular file in the guide's directory.`);
    const bytes = await fs.readFile(file);
    return { name, bytes, sha256: sha256(bytes) };
  };
  const draft = await read(path.basename(draftPath), () =>
    refuse("guide_missing", `The guide ${draftPath} does not exist.`),
  );
  const text = draft.bytes.toString("utf8");
  const entries = [draft];
  for (const name of referencedFiles(text)) {
    if (!isFileName(name))
      refuse("guide_file_invalid", `${name} is not a file name in the guide's directory.`);
    entries.push(
      await read(name, () =>
        refuse("guide_file_invalid", `${name} is missing from the guide's directory.`),
      ),
    );
  }
  return { text, entries };
}

/**
 * The guide as the page: read, held to the model's repository and validated by Archify at the
 * build's quality, with strict writing checks at showcase and warnings at standard. With a
 * checkout and a model that names its repository URL and revision, every repository source the
 * guide cites is verified at that revision.
 * @param {any} model
 * @param {string} modelPath
 * @param {{ quality: "showcase" | "standard", repo: string | null }} options
 */
export async function guidePage(model, modelPath, options) {
  const guide = await readGuide(path.resolve(path.dirname(modelPath), model.guide));
  const declared = draftRepository(guide.text);
  const repository = model.repository;
  if (
    (declared.url !== null && declared.url !== repository?.url) ||
    (declared.revision !== null && declared.revision !== repository?.revision)
  )
    refuse(
      "guide_repository_mismatch",
      `The guide names ${declared.url ?? "the model's repository"} at ${declared.revision ?? "the model's revision"}; ` +
        `the model is pinned to ${repository?.url ?? "no repository"} at ${repository?.revision ?? "no revision"}.`,
    );
  const page = {
    kind: /** @type {const} */ ("guide"),
    path: model.guide,
    entries: guide.entries,
    quality: options.quality,
    writing: options.quality === "showcase" ? "strict" : "warn",
    repo:
      options.repo && repository?.url && repository?.revision ? path.resolve(options.repo) : null,
    repository,
  };
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-guide-"));
  try {
    await withClone(page, async (repoRoot) => {
      const { answer } = await runArchify([
        "validate",
        "explainer",
        await writePage(page, directory),
        "--json",
        "--quality",
        page.quality,
        "--writing",
        page.writing,
        ...(repoRoot ? ["--repo-root", repoRoot] : []),
      ]);
      if (answer.ok !== true) refusePage(answer);
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
  return page;
}

/**
 * The guide's record in the manifest and the check: the draft's path and digest, each file it
 * names, the writing level and whether its sources were verified at the revision.
 * @param {Awaited<ReturnType<typeof guidePage>>} page
 */
export function guideSummary(page) {
  const [draft, ...files] = page.entries;
  return {
    path: page.path,
    sha256: draft.sha256,
    files: files
      .map(({ name, sha256: digest }) => ({ name, sha256: digest }))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)),
    writing: page.writing,
    sources: page.repo ? "verified" : "declared",
  };
}

/**
 * Deliver a guide as `index.html` into a staging directory.
 * @param {Awaited<ReturnType<typeof guidePage>>} page
 * @param {string} directory
 */
export const deliverGuide = (page, directory) =>
  withClone(page, (repoRoot) => deliverExplainer(page, directory, { repoRoot }));

/**
 * Run `use` with a temporary clone that shares the checkout's objects, its `origin` at the
 * model's repository URL and its `HEAD` at the model's revision, then remove it; the checkout is
 * only read. A page that verifies no sources runs without one.
 * @template T
 * @param {{ repo: string | null, repository: any }} page
 * @param {(repoRoot: string | null) => Promise<T>} use
 */
async function withClone(page, use) {
  if (!page.repo) return use(null);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-guide-repository-"));
  const clone = path.join(root, "repository");
  try {
    git(["clone", "--quiet", "--shared", "--no-checkout", "--", page.repo, clone]);
    git(["-C", clone, "remote", "set-url", "origin", page.repository.url]);
    git(["-C", clone, "update-ref", "--no-deref", "HEAD", page.repository.revision]);
    return await use(clone);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

/** Run one Git command that prepares the clone, or refuse. */
function git(args) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    env: childEnvironment({ GIT_TERMINAL_PROMPT: "0", GIT_CONFIG_NOSYSTEM: "1" }),
  });
  if (result.status !== 0)
    refuse(
      "guide_repository_unavailable",
      `Git could not prepare the guide's repository: ${String(result.stderr ?? result.error).trim()}`,
    );
}
