import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { childEnvironment } from "../environment.mjs";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";
import { checkBoxes } from "./checks.mjs";
import { requireOverviewGlyphs } from "./glyphs.mjs";
import { lintComposition } from "./lint.mjs";

/**
 * The overview: one 16:9 page a work's author writes with the house class and Typst typesets.
 * The composition's Typst files, the class and the model are staged in one root that Typst
 * cannot leave; only the bundled fonts are available, and no package is fetched.
 */

const run = promisify(execFile);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The Typst release the overview's bytes depend on. */
export const TYPST_VERSION = "0.15.1";
/** The house class, staged beside the model under this directory of the root. */
export const STAGED = "archpub";
const CLASS = fileURLToPath(new URL("./house.typ", import.meta.url));
/** The house tokens, staged beside the class, which reads them. */
const TOKENS = fileURLToPath(new URL("../house.json", import.meta.url));
/** The bundled face that sets Han characters on the overview as on the posters. */
export const CJK = "noto-sans-cjk-sc";

/**
 * Typst's version, or a refusal naming the version the overview needs.
 * @param {string} typst the executable, `typst` from the path unless a caller names another
 */
export async function typstVersion(typst = "typst", medium = "overview") {
  const needed = `Building the ${medium} needs Typst ${TYPST_VERSION}`;
  let stdout = "";
  try {
    ({ stdout } = await run(typst, ["--version"], { env: childEnvironment({}), timeout: 30_000 }));
  } catch {
    refuse(`${medium}_typst_missing`, `${needed} on the path; install it with mise or Homebrew.`);
  }
  const version = /^typst (\S+)/u.exec(stdout)?.[1] ?? "an unknown version";
  if (version !== TYPST_VERSION)
    refuse(`${medium}_typst_version`, `${needed}; the path has ${version}.`);
  return version;
}

/** The composition's Typst files, relative to its directory; links and other entries are refused. */
async function typstFiles(directory) {
  const out = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true, recursive: true })) {
    const full = path.join(entry.parentPath, entry.name);
    const relative = path.relative(directory, full).split(path.sep).join("/");
    if (relative === STAGED || relative.startsWith(`${STAGED}/`))
      refuse(
        "overview_composition_invalid",
        `The composition's directory holds ${relative}, where the publisher stages the house class.`,
      );
    if (entry.isSymbolicLink())
      refuse(
        "overview_composition_invalid",
        `${relative} is a link; the overview reads files only.`,
      );
    if (entry.isFile() && entry.name.endsWith(".typ")) out.push(relative);
  }
  return out.sort();
}

/**
 * Stage the composition's Typst files, when there is a composition, the class and the model in a new root.
 * @param {string | null} composition the composition's absolute path, or null when the model names none
 * @param {Buffer} modelBytes the model file as read
 */
export async function stage(composition, modelBytes) {
  const directory = composition ? path.dirname(composition) : null;
  const files = directory ? await typstFiles(directory) : [];
  const sources = await Promise.all(
    files.map(async (file) => ({
      file,
      text: await fs.readFile(path.join(/** @type {string} */ (directory), file), "utf8"),
    })),
  );
  lintComposition(sources);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-overview-"));
  for (const { file, text } of sources) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), text);
  }
  await fs.mkdir(path.join(root, STAGED));
  const classBytes = await fs.readFile(CLASS);
  await fs.writeFile(path.join(root, STAGED, "house.typ"), classBytes);
  const tokenBytes = await fs.readFile(TOKENS);
  await fs.writeFile(path.join(root, STAGED, "house.json"), tokenBytes);
  await fs.writeFile(path.join(root, STAGED, "model.json"), modelBytes);
  const own = composition
    ? sources.find(({ file }) => file === path.basename(composition))
    : undefined;
  return {
    root,
    entry: composition ? path.basename(composition) : null,
    composition: own ? sha256(Buffer.from(own.text)) : null,
    // The class reads its tokens, so its digest covers both.
    house: sha256(Buffer.concat([classBytes, tokenBytes])),
  };
}

/**
 * A path Typst reports, relative to the staged root with forward slashes. Typst reports a
 * staged file relative to its working directory on Linux and macOS, but on Windows by its
 * absolute verbatim path, `\\?\C:\…`.
 * @param {string} reported
 * @param {readonly string[]} roots the staged root as created and as resolved
 */
function stagedPath(reported, roots) {
  const slashed = (value) =>
    value
      .split("\\")
      .join("/")
      .replace(/^\/\/\?\//u, "");
  const file = slashed(reported);
  for (const root of roots.map(slashed))
    if (file.startsWith(`${root}/`)) return file.slice(root.length + 1);
  return file;
}

/**
 * Typst's diagnostics as problems. Each names the composition's line: the last place in the
 * trace outside the staged class, or the first place when the class alone is named.
 * @param {string} stderr Typst's human-readable diagnostics
 * @param {readonly string[]} [roots] the staged root, to which every reported path is made relative
 */
export function typstProblems(stderr, roots = [], medium = "overview") {
  const blocks = stderr
    .split(/\r?\n(?=(?:error|warning): )/u)
    .filter((block) => /^(error|warning): /u.test(block));
  return blocks.map((block) => {
    const [, level, message] = /^(error|warning): (.*)/u.exec(block) ?? [];
    const places = [...block.matchAll(/(?:┌─|\bat) (\S+?):(\d+):(\d+)/gu)].map((match) => ({
      file: stagedPath(match[1], roots),
      line: Number(match[2]),
    }));
    const own = places.filter(({ file }) => !file.startsWith(`${STAGED}/`)).at(-1) ?? places[0];
    const code = /((?:overview|edition)_[a-z_]+): /u.exec(message)?.[1];
    return {
      code: code ?? `${medium}_typst_${level === "warning" ? "warning" : "error"}`,
      path: own ? `${own.file}:${own.line}` : undefined,
      message: code ? message.replace(/^.*?(?:overview|edition)_[a-z_]+: /u, "") : message,
    };
  });
}

/** Refuse when Typst reported anything: an error, a warning or one of the class's own refusals. */
function refuseDiagnostics(stderr, roots) {
  const problems = typstProblems(stderr, roots);
  if (problems.length)
    refuse(problems[0].code, "Typst did not typeset the overview cleanly.", problems);
}

/**
 * Check a model's overview before the edition sets it in place: the composition's lint, then Typst's reading of it
 * alone, every text box inside the live area and clear of the others, and every character drawn by a bundled face.
 * @param {{ composition: string, modelBytes: Buffer, revision: string | null, date: string | null,
 *   typst?: string }} input
 */
export async function checkOverview(input) {
  const typst = input.typst ?? "typst";
  const version = await typstVersion(typst);
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  const staged = await stage(input.composition, input.modelBytes);
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-overview-out-"));
  try {
    const roots = [staged.root, await fs.realpath(staged.root)];
    let result;
    try {
      result = await run(
        typst,
        [
          "eval",
          "query(<archpub-box>).map(it => it.value)",
          "--in",
          path.join(staged.root, /** @type {string} */ (staged.entry)),
          "--root",
          staged.root,
          "--ignore-system-fonts",
          "--ignore-embedded-fonts",
          "--font-path",
          house.root,
          "--font-path",
          path.join(fonts.root, CJK),
          "--input",
          `revision=${input.revision ?? ""}`,
          "--input",
          `date=${input.date ?? ""}`,
          "--format",
          "json",
        ],
        {
          cwd: staged.root,
          env: childEnvironment({ TYPST_PACKAGE_PATH: out, TYPST_PACKAGE_CACHE_PATH: out }),
          maxBuffer: 64 * 1024 * 1024,
          timeout: 300_000,
        },
      );
    } catch (error) {
      const failure = /** @type {any} */ (error);
      if (typeof failure.stderr !== "string") throw error;
      refuseDiagnostics(failure.stderr, roots);
      throw error;
    }
    refuseDiagnostics(result.stderr, roots);
    const boxes = JSON.parse(result.stdout);
    checkBoxes(boxes);
    await requireOverviewGlyphs(boxes);
    return {
      typst: version,
      composition: staged.composition,
      house: staged.house,
      date: input.date,
      texts: boxes.map(({ text }) => text),
    };
  } finally {
    await fs.rm(staged.root, { recursive: true, force: true });
    await fs.rm(out, { recursive: true, force: true });
  }
}
