import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { childEnvironment } from "../environment.mjs";
import { CJK, STAGED, stage, typstProblems, typstVersion } from "../overview/typeset.mjs";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";

/**
 * The print edition: the house class typesets a delivery's record, its plates and its overview in one pass into a
 * PDF that conforms to PDF/A-3a and PDF/UA-1, and renders the overview's and plates' pages as PNG images.
 */

const run = promisify(execFile);
/** The edition's page width in points; a PNG of w pixels is rendered at w * 72 / PAGE_WIDTH pixels per inch. */
const PAGE_WIDTH = 1600;
/** A PNG at this width is named without its width. */
const OWN_WIDTH = 2400;

/**
 * The image files of an edition at one width: the overview's page and each plate's page.
 * @param {number} width
 * @param {string} name a page's name, `00-overview` or `NN-<view>`
 */
const imageFile = (width, name) =>
  width === OWN_WIDTH ? `images/${name}.png` : `images/${name}-${width}.png`;

/**
 * Typeset a delivery's print edition.
 * @param {{ record: any, plates: Array<{ page: number, views: string[], svg: string }>, modelBytes: Buffer,
 *   composition: string | null, revision: string | null, date: string | null, time: number | null,
 *   widths: readonly number[], typst?: string }} input
 */
export async function typesetEdition(input) {
  const typst = input.typst ?? "typst";
  const version = await typstVersion(typst, "edition");
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  const staged = await stage(input.composition, input.modelBytes);
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-edition-out-"));
  try {
    const own = path.join(staged.root, STAGED);
    await fs.writeFile(path.join(own, "edition.json"), JSON.stringify(input.record));
    await fs.mkdir(path.join(own, "plates"));
    for (const plate of input.plates)
      await fs.writeFile(
        path.join(own, "plates", `${String(plate.page).padStart(2, "0")}.svg`),
        plate.svg,
      );
    const overview = staged.entry ? `include "/${staged.entry}"` : "none";
    const entry = path.join(own, "edition.typ");
    await fs.writeFile(
      entry,
      `#import "house.typ": edition\n#edition(json("edition.json"), overview: ${overview})\n`,
    );
    const roots = [staged.root, await fs.realpath(staged.root)];
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
      "edition=true",
      "--input",
      `revision=${input.revision ?? ""}`,
      "--input",
      `date=${input.date ?? ""}`,
      ...(input.time === null ? [] : ["--creation-timestamp", String(input.time)]),
    ];
    const env = childEnvironment({ TYPST_PACKAGE_PATH: out, TYPST_PACKAGE_CACHE_PATH: out });
    const typeset = async (args) => {
      let result;
      try {
        result = await run(typst, args, {
          cwd: staged.root,
          env,
          maxBuffer: 64 * 1024 * 1024,
          timeout: 600_000,
        });
      } catch (error) {
        const failure = /** @type {any} */ (error);
        if (typeof failure.stderr !== "string") throw error;
        const problems = typstProblems(failure.stderr, roots, "edition");
        if (problems.length)
          refuse(problems[0].code, "Typst did not typeset the edition cleanly.", problems);
        throw error;
      }
      const problems = typstProblems(result.stderr, roots, "edition");
      if (problems.length)
        refuse(problems[0].code, "Typst did not typeset the edition cleanly.", problems);
      return result.stdout;
    };
    const pdfFile = path.join(out, "edition.pdf");
    await typeset(["compile", ...common, "--pdf-standard", "a-3a,ua-1", entry, pdfFile]);
    /** @type {Array<[string, number]>} */
    const pages = JSON.parse(
      await typeset([
        "eval",
        "query(heading.where(outlined: true)).map(h => (str(h.label), h.location().page()))",
        "--in",
        entry,
        ...common,
        "--format",
        "json",
      ]),
    );
    const names = new Map(
      input.plates.map((plate) => [
        `plate-${String(plate.page).padStart(2, "0")}`,
        `${String(plate.page).padStart(2, "0")}-${plate.views.join("+")}`,
      ]),
    );
    names.set("plate-00", "00-overview");
    const shown = pages.filter(([label]) => names.has(label));
    const png = [];
    for (const width of input.widths) {
      const template = path.join(out, `${width}-{p}.png`);
      await typeset([
        "compile",
        ...common,
        "--format",
        "png",
        "--ppi",
        String((width * 72) / PAGE_WIDTH),
        "--pages",
        shown.map(([, page]) => page).join(","),
        entry,
        template,
      ]);
      for (const [label, page] of shown)
        png.push({
          width,
          file: imageFile(width, /** @type {string} */ (names.get(label))),
          bytes: await fs.readFile(path.join(out, `${width}-${page}.png`)),
        });
    }
    return {
      typst: version,
      house: staged.house,
      pdf: await fs.readFile(pdfFile),
      pages: pages.length ? Math.max(...pages.map(([, page]) => page)) : 2,
      png,
    };
  } finally {
    await fs.rm(staged.root, { recursive: true, force: true });
    await fs.rm(out, { recursive: true, force: true });
  }
}
