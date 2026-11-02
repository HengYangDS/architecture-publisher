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
import { checkBoxes, LIVE_AREA } from "./checks.mjs";
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
const STAGED = "archpub";
const CLASS = fileURLToPath(new URL("./house.typ", import.meta.url));
/** The page's width in points; a PNG of w pixels is rendered at w * 72 / PAGE_WIDTH pixels per inch. */
const PAGE_WIDTH = LIVE_AREA.width;
/** The overview's PNG at this width is `overview.png`; any other width is suffixed. */
const OWN_WIDTH = 2400;
/** The bundled face that sets Han characters on the overview as on the posters. */
const CJK = "noto-sans-cjk-sc";

/** The files of the overview: its SVG and one PNG per width. */
const overviewFiles = (widths) => ({
  svg: "overview.svg",
  png: widths.map((width) => ({
    width,
    file: width === OWN_WIDTH ? "overview.png" : `overview-${width}.png`,
  })),
});

/**
 * Typst's version, or a refusal naming the version the overview needs.
 * @param {string} typst the executable, `typst` from the path unless a caller names another
 */
export async function typstVersion(typst = "typst") {
  const needed = `Building the overview needs Typst ${TYPST_VERSION}`;
  let stdout = "";
  try {
    ({ stdout } = await run(typst, ["--version"], { env: childEnvironment({}), timeout: 30_000 }));
  } catch {
    refuse("overview_typst_missing", `${needed} on the path; install it with mise or Homebrew.`);
  }
  const version = /^typst (\S+)/u.exec(stdout)?.[1] ?? "an unknown version";
  if (version !== TYPST_VERSION)
    refuse("overview_typst_version", `${needed}; the path has ${version}.`);
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
 * Stage the composition's Typst files, the class and the model in a new root.
 * @param {string} composition the composition's absolute path
 * @param {Buffer} modelBytes the model file as read
 */
async function stage(composition, modelBytes) {
  const directory = path.dirname(composition);
  const files = await typstFiles(directory);
  const sources = await Promise.all(
    files.map(async (file) => ({
      file,
      text: await fs.readFile(path.join(directory, file), "utf8"),
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
  await fs.writeFile(path.join(root, STAGED, "model.json"), modelBytes);
  const own = sources.find(({ file }) => file === path.basename(composition));
  return {
    root,
    entry: path.basename(composition),
    composition: own ? sha256(Buffer.from(own.text)) : null,
    house: sha256(classBytes),
  };
}

/**
 * Typst's diagnostics as problems. Each names the composition's line: the last place in the
 * trace outside the staged class, or the first place when the class alone is named.
 * @param {string} stderr Typst's human-readable diagnostics, with paths relative to the root
 */
export function typstProblems(stderr) {
  const blocks = stderr
    .split(/\r?\n(?=(?:error|warning): )/u)
    .filter((block) => /^(error|warning): /u.test(block));
  return blocks.map((block) => {
    const [, level, message] = /^(error|warning): (.*)/u.exec(block) ?? [];
    const places = [...block.matchAll(/(?:┌─|\bat) (\S+?):(\d+):(\d+)/gu)].map((match) => ({
      file: match[1].split("\\").join("/"),
      line: Number(match[2]),
    }));
    const own = places.filter(({ file }) => !file.startsWith(`${STAGED}/`)).at(-1) ?? places[0];
    const code = /(overview_[a-z_]+): /u.exec(message)?.[1];
    return {
      code: code ?? (level === "warning" ? "overview_typst_warning" : "overview_typst_error"),
      path: own ? `${own.file}:${own.line}` : undefined,
      message: code ? message.replace(/^.*?overview_[a-z_]+: /u, "") : message,
    };
  });
}

/** Refuse when Typst reported anything: an error, a warning or one of the class's own refusals. */
function refuseDiagnostics(stderr) {
  const problems = typstProblems(stderr);
  if (problems.length)
    refuse(problems[0].code, "Typst did not typeset the overview cleanly.", problems);
}

/**
 * Typeset a model's overview: the SVG, one PNG per width and the checks on its text.
 * @param {{ composition: string, modelBytes: Buffer, revision: string | null, date: string | null,
 *   widths: readonly number[], typst?: string }} input
 */
export async function typesetOverview(input) {
  const typst = input.typst ?? "typst";
  const version = await typstVersion(typst);
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  const staged = await stage(input.composition, input.modelBytes);
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-overview-out-"));
  try {
    const common = [
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
    ];
    const env = childEnvironment({ TYPST_PACKAGE_PATH: out, TYPST_PACKAGE_CACHE_PATH: out });
    // Run Typst once; its warnings and errors become refusals, and stdout is returned.
    const typeset = async (args) => {
      let result;
      try {
        result = await run(typst, args, {
          cwd: staged.root,
          env,
          maxBuffer: 64 * 1024 * 1024,
          timeout: 300_000,
        });
      } catch (error) {
        const failure = /** @type {any} */ (error);
        if (typeof failure.stderr !== "string") throw error;
        refuseDiagnostics(failure.stderr);
        throw error;
      }
      refuseDiagnostics(result.stderr);
      return result.stdout;
    };
    const entry = path.join(staged.root, staged.entry);
    const boxes = JSON.parse(
      await typeset([
        "eval",
        "query(<archpub-box>).map(it => it.value)",
        "--in",
        entry,
        ...common,
        "--format",
        "json",
      ]),
    );
    checkBoxes(boxes);
    await requireOverviewGlyphs(boxes);
    const files = overviewFiles(input.widths);
    const svgFile = path.join(out, files.svg);
    await typeset(["compile", ...common, "--format", "svg", entry, svgFile]);
    const png = [];
    for (const { width, file } of files.png) {
      const target = path.join(out, file);
      await typeset([
        "compile",
        ...common,
        "--format",
        "png",
        "--ppi",
        String((width * 72) / PAGE_WIDTH),
        entry,
        target,
      ]);
      png.push({ width, file, bytes: await fs.readFile(target) });
    }
    return {
      typst: version,
      supply: house.sha256,
      composition: staged.composition,
      house: staged.house,
      date: input.date,
      texts: boxes.map(({ text }) => text),
      svg: await fs.readFile(svgFile),
      png,
      files,
    };
  } finally {
    await fs.rm(staged.root, { recursive: true, force: true });
    await fs.rm(out, { recursive: true, force: true });
  }
}
