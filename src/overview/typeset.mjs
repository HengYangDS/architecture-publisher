import { OVERVIEW_OPENING, SPREAD_OPENING, spreadAtoms, unspaced } from "../breaks.mjs";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { childEnvironment } from "../environment.mjs";
import { HOUSE_FILE } from "../house.mjs";
import { STAGED_MODEL, TYPST_VERSION } from "../names.mjs";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";
import { checkBoxes, checkLines } from "./checks.mjs";
import { requireOverviewGlyphs } from "./glyphs.mjs";

/**
 * The overview: one 16:9 page the publisher draws from the statement a model makes, with the house class, and Typst
 * typesets. The class, the drawing and the model are staged in one root that Typst cannot leave; only the bundled
 * fonts are available, and no package is fetched.
 */

const run = promisify(execFile);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The house class, staged beside the model under this directory of the root. */
export const STAGED = "archpub";
const CLASS = fileURLToPath(new URL("./house.typ", import.meta.url));
/** The drawing of the overview from a model's statement, staged beside the class it imports. */
const DRAWING = fileURLToPath(new URL("./drawn.typ", import.meta.url));
/** The house tokens, staged beside the class, which reads them. */
const TOKENS = fileURLToPath(HOUSE_FILE);
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

/**
 * The house tokens as staged for one edition: the supply's file, with its palette, figure colours and dye replaced
 * by the edition's resolved palette when it names one, so the class sets every page in the palette the model chose.
 * @param {Buffer} supplied the house tokens as supplied
 * @param {{ palette: object, figure: object, dye: object } | null | undefined} tokens
 */
function stagedTokens(supplied, tokens) {
  if (!tokens) return supplied;
  const house = JSON.parse(supplied.toString("utf8"));
  const { palette, figure, dye } = tokens;
  return Buffer.from(`${JSON.stringify({ ...house, palette, figure, dye }, null, 2)}\n`);
}

/**
 * Where the lines of a statement's texts may break and how far they may be spread: for each text that holds a
 * character written without spaces between words, its atoms with the places each opens, and the most a spread
 * line opens at each place: to its column's edge in a wide measure (`opening`), and to its own longest line in a
 * narrow column (`own`). The class chooses the breaks by the widths Typst sets the atoms in and spreads every
 * line but a text's last within the bound of its measure.
 * @param {Buffer} modelBytes the model file as read
 */
function breaksOf(modelBytes) {
  /** @type {Record<string, { unspaced: boolean, atoms: ReturnType<typeof spreadAtoms> }>} */
  const texts = {};
  const walk = (/** @type {unknown} */ value) => {
    if (typeof value === "string")
      texts[value] = { unspaced: unspaced(value), atoms: spreadAtoms(value) };
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  try {
    walk(JSON.parse(modelBytes.toString("utf8")).overview);
  } catch {
    // A model that does not parse states no overview; the build refuses it where it is read.
  }
  return { opening: OVERVIEW_OPENING, own: SPREAD_OPENING, texts };
}

/**
 * Stage the class, the drawing of the overview, the model and its statement's breaks in a new root. The class reads its tokens and the
 * model there.
 * @param {Buffer} modelBytes the model file as read
 * @param {{ palette: object, figure: object, dye: object } | null} [tokens] the edition's resolved palette
 */
export async function stage(modelBytes, tokens = null) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-overview-"));
  await fs.mkdir(path.join(root, STAGED));
  const classBytes = await fs.readFile(CLASS);
  const drawingBytes = await fs.readFile(DRAWING);
  await fs.writeFile(path.join(root, STAGED, "house.typ"), classBytes);
  await fs.writeFile(path.join(root, STAGED, "drawn.typ"), drawingBytes);
  const tokenBytes = stagedTokens(await fs.readFile(TOKENS), tokens);
  await fs.writeFile(path.join(root, STAGED, "house.json"), tokenBytes);
  await fs.writeFile(path.join(root, STAGED, STAGED_MODEL), modelBytes);
  await fs.writeFile(path.join(root, STAGED, "breaks.json"), JSON.stringify(breaksOf(modelBytes)));
  return {
    root,
    // The class reads its tokens, and the drawing the class, so the digest covers all three.
    house: sha256(Buffer.concat([classBytes, drawingBytes, tokenBytes])),
  };
}

/**
 * The SHA-256 of the overview a model states, as its JSON reads.
 * @param {unknown} statement
 */
const statementDigest = (statement) => sha256(Buffer.from(JSON.stringify(statement)));

/**
 * The Typst source that draws a staged model's overview, with the masthead's note of the files read beside it in
 * `overview-inputs.json`.
 * @param {string} root the staged root
 * @param {string | null} writtenFrom
 * @param {Record<string, string>} [plates] each view's plate number, by the view's id
 */
async function overviewEntry(root, writtenFrom, plates = {}) {
  await fs.writeFile(
    path.join(root, STAGED, "overview-inputs.json"),
    JSON.stringify({ writtenFrom, plates }),
  );
  const entry = path.join(root, "overview.typ");
  await fs.writeFile(
    entry,
    [
      `#import "/${STAGED}/drawn.typ": *`,
      "#show: overview",
      `#drawn(json("/${STAGED}/${STAGED_MODEL}").overview, written-from: json("/${STAGED}/overview-inputs.json").writtenFrom, plates: json("/${STAGED}/overview-inputs.json").plates)`,
      "",
    ].join("\n"),
  );
  return entry;
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
 * Typst's diagnostics as problems. Each names the entry's line: the last place in the
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
 * Check a model's overview before the edition sets it in place: Typst's drawing of it alone from the statement,
 * every text box inside the live area and clear of the others and of every line and ring, and every character drawn
 * by a bundled face. Hands back the texts, the boxes read back, the marks and lines it drew, and each line of a text
 * that is not spread to its measure though it is not the text's last: the text, the line, and how far it would
 * open at each place, in ems, or null where it has no place to open.
 * @param {{ modelBytes: Buffer, writtenFrom?: string | null, plates?: Record<string, string>,
 *   revision: string | null, date: string | null, typst?: string, tokens?: { palette: object, figure: object, dye: object } }} input
 */
export async function checkOverview(input) {
  const typst = input.typst ?? "typst";
  const version = await typstVersion(typst);
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  const staged = await stage(input.modelBytes, input.tokens ?? null);
  const entry = await overviewEntry(staged.root, input.writtenFrom ?? null, input.plates ?? {});
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-overview-out-"));
  try {
    const roots = [staged.root, await fs.realpath(staged.root)];
    let result;
    try {
      result = await run(
        typst,
        [
          "eval",
          "(boxes: query(<archpub-box>).map(it => it.value), marks: query(<archpub-mark>).map(it => it.value), lines: query(<archpub-line>).map(it => it.value), loose: query(<archpub-loose>).map(it => it.value))",
          "--in",
          entry,
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
    const { boxes, marks, lines, loose } = JSON.parse(result.stdout);
    checkBoxes(boxes);
    checkLines(boxes, lines, marks);
    await requireOverviewGlyphs(boxes);
    const model = JSON.parse(input.modelBytes.toString("utf8"));
    return {
      typst: version,
      statement: statementDigest(model.overview),
      house: staged.house,
      date: input.date,
      texts: boxes.map(({ text }) => text),
      boxes,
      marks,
      lines,
      loose,
    };
  } finally {
    await fs.rm(staged.root, { recursive: true, force: true });
    await fs.rm(out, { recursive: true, force: true });
  }
}
