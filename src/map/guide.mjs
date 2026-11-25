import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { childEnvironment } from "../environment.mjs";
import { refuse } from "../refusal.mjs";
import { runArchify } from "./archify.mjs";
import { holdDelivery, refusePage, writePage } from "./explainer.mjs";
import { drawnEntries, refuseStatedPlaces } from "./guide-figures.mjs";

/**
 * The guide: an Archify explainer draft a work's author writes beside the model, which the
 * publisher delivers as the page. The draft and the local files it names are staged; with a
 * checkout, Archify verifies every repository source the guide cites against a temporary clone
 * of it at the model's revision.
 */

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The draft arguments that name a local file, by directive. */
const LOCAL = Object.freeze({ "@diagram": "source", "@chart": "data", "@image": "path" });

/**
 * A directive line's `key=value` arguments, read as Archify's parser reads them: a value in single or double quotes
 * holds spaces, and a backslash escapes only the quote that opened the value and itself.
 * @param {string} line
 */
function argumentsOf(line) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [, key, double, single, bare] of line.matchAll(
    /([^\s=]+)=(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(\S*))/gu,
  ))
    out[key] =
      bare ??
      (double !== undefined
        ? double.replace(/\\(["\\])/gu, "$1")
        : single.replace(/\\(['\\])/gu, "$1"));
  return out;
}

/**
 * The draft's directive lines, trimmed, leaving out fenced blocks, as Archify's parser reads them: a line counts
 * with its leading spaces, and a fence closes on a line that is its opening marker alone.
 */
function directives(draft) {
  const lines = [];
  let fence = "";
  for (const line of draft.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (fence) {
      if (trimmed === fence) fence = "";
      continue;
    }
    const marker = /^(`{3,}|~{3,})/u.exec(trimmed)?.[1];
    if (marker) fence = marker;
    else if (trimmed.startsWith("@")) lines.push(trimmed);
  }
  return lines;
}

/** A directive's name: its first word. */
const directiveOf = (line) => line.split(/\s/u, 1)[0];

/**
 * The title each block of a draft names by id, `@diagram`, `@sequence` and the like with an `id` and a `title`.
 * @param {string} draft
 * @returns {Map<string, string>}
 */
export function blockTitles(draft) {
  const titles = new Map();
  for (const line of directives(draft)) {
    const { id, title } = argumentsOf(line);
    if (id && title) titles.set(id, title);
  }
  return titles;
}

/**
 * The diagram documents a guide names, by file name, as their author wrote them: each file after the draft whose
 * name ends in a diagram's kind and `.json` and that reads as an object. A file that does not read is left out
 * here: Archify judges it when the page is built.
 * @param {ReadonlyArray<{ name: string, bytes: Buffer }>} entries the draft, then the files it names
 * @returns {Map<string, any>}
 */
export function guideDiagrams(entries) {
  const figures = new Map();
  for (const { name, bytes } of entries.slice(1)) {
    if (!/\.[a-z]+\.json$/u.test(name)) continue;
    try {
      const document = JSON.parse(bytes.toString("utf8"));
      if (document && typeof document === "object" && !Array.isArray(document))
        figures.set(name, document);
    } catch {
      // Archify refuses it when the page is built; the reader file names the figure alone.
    }
  }
  return figures;
}

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
 * The repository a draft's `@meta` names: its URL, revision, Forge and link mode, each `null` when
 * the draft names none.
 * @param {string} draft
 */
export function draftRepository(draft) {
  const meta = directives(draft)
    .filter((line) => directiveOf(line) === "@meta")
    .map(argumentsOf);
  const named = (key) => meta.map((entry) => entry[key]).find((value) => value !== undefined);
  return {
    url: named("repo_url") ?? null,
    revision: named("repo_revision") ?? null,
    provider: named("repo_provider") ?? null,
    link_mode: named("repo_link_mode") ?? null,
  };
}

/** A file name without a directory part. */
const isFileName = (name) => name !== "." && name !== ".." && !/[\\/\0]/u.test(name);

/**
 * A `lines` argument, `3:7` or `5`, as its first and last line, or `null` without one.
 * @param {string | undefined} lines
 * @returns {[number, number] | null}
 */
function rangeOf(lines) {
  const match = /^(\d+)(?::(\d+))?$/u.exec(lines ?? "");
  return match ? [Number(match[1]), Number(match[2] ?? match[1])] : null;
}

/**
 * The repository ranges a guide cites: each `@source` of its draft that names a path, and each
 * node source of a diagram it names, by where it stands, with its first and last line, or `null`
 * for a whole file.
 * @param {Array<{ name: string, bytes: Buffer }>} entries the draft, then the files it names
 */
export function guideCitations(entries) {
  const [draft, ...files] = entries;
  /** @type {Array<{ where: string, path: string, lines: [number, number] | null }>} */
  const cited = [];
  for (const line of directives(draft.bytes.toString("utf8"))) {
    const { path: file, lines } = argumentsOf(line);
    if (directiveOf(line) === "@source" && file)
      cited.push({ where: `@source ${line.split(/\s+/u)[1]}`, path: file, lines: rangeOf(lines) });
  }
  for (const { name, bytes } of files.filter(({ name: file }) => file.endsWith(".json"))) {
    const walk = (value, pointer) => {
      if (!value || typeof value !== "object") return;
      for (const [key, item] of Object.entries(value))
        if (key === "sources" && Array.isArray(item))
          item.forEach((source, index) => {
            if (typeof source?.path !== "string") return;
            /** @type {[number, number] | null} */
            const lines = Number.isInteger(source.line)
              ? [source.line, source.end_line ?? source.line]
              : null;
            cited.push({ where: `${name}${pointer}/sources/${index}`, path: source.path, lines });
          });
        else walk(item, `${pointer}/${key}`);
    };
    let parsed;
    try {
      parsed = JSON.parse(bytes.toString("utf8"));
    } catch {
      refuse("guide_file_invalid", `${name} in the guide's directory is not JSON.`);
    }
    walk(parsed, "");
  }
  return cited;
}

/**
 * Read a guide: its draft and every local file the draft names, each a regular file in the
 * draft's own directory, refused where a diagram file states a field the publisher sets.
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
  refuseStatedPlaces(entries);
  return { text, entries };
}

/**
 * The guide as the page: as the build read it, held to the model's repository and validated by
 * Archify at the build's quality, with strict writing checks at showcase and warnings at standard.
 * With a checkout and a model that names its repository URL and revision, every repository source
 * the guide cites is verified at that revision. With `deliver`, the page's file name in a
 * delivery, as a build prepares its page, Archify is asked once, for a delivery the page then
 * holds; only a guide it refuses is validated on its own, which names every finding.
 * @param {any} model
 * @param {Awaited<ReturnType<typeof readGuide>>} guide the guide as read
 * @param {{ quality: "showcase" | "standard", repo: string | null, deliver?: string }} options
 */
export async function guidePage(model, guide, options) {
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
  // A checkout verifies the sources the guide cites at the model's revision; without one, Archify refuses a diagram
  // that names a repository, so the publisher names it only where it can be verified.
  const repo =
    options.repo && repository?.url && repository?.revision ? path.resolve(options.repo) : null;
  const page = {
    kind: /** @type {const} */ ("guide"),
    path: model.guide,
    // The author's files, which the manifest and the citations record; Archify draws `drawn`, in which the publisher
    // has laid out each diagram and, with a checkout, named the repository, with the Forge and link mode the draft
    // names.
    entries: guide.entries,
    drawn: await drawnEntries(
      guide.entries,
      options.quality,
      repo ? { ...declared, url: repository?.url, revision: repository?.revision } : undefined,
    ),
    quality: options.quality,
    writing: options.quality === "showcase" ? "strict" : "warn",
    repo,
    repository,
    delivered: /** @type {import("./explainer.mjs").HeldDelivery | null} */ (null),
  };
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-guide-"));
  try {
    return await withClone(page, async (repoRoot) => {
      const held = options.deliver ? await holdDelivery(page, options.deliver, { repoRoot }) : null;
      if (held?.delivered) return { ...page, delivered: held.delivered };
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
      // The guide validates and its delivery was refused: the refusal is the delivery's.
      if (held) throw held.refusal;
      return page;
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
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
