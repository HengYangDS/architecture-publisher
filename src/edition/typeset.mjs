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
 * PDF that conforms to PDF/A-3a and PDF/UA-1, and renders the overview's and plates' pages as PNG images. It hands
 * back, with them, the page of the PDF each plate stands on.
 */

const run = promisify(execFile);
/** The edition's page width in points; a PNG of w pixels is rendered at w * 72 / PAGE_WIDTH pixels per inch. */
const PAGE_WIDTH = 1600;
/**
 * The width in pixels a page's image is rendered at unless the caller names its widths. The image at this width is
 * named without its width.
 */
export const DEFAULT_WIDTH = 3840;
/** The name of the overview's page among an edition's images. */
export const OVERVIEW_PAGE = "00-overview";

/**
 * The name of a plate's page among an edition's images and figures: `NN-<view>`.
 * @param {{ page: number, views: readonly string[] }} plate
 */
export const pageName = (plate) =>
  `${String(plate.page).padStart(2, "0")}-${plate.views.join("+")}`;

/**
 * The image file of one page of an edition at one width.
 * @param {number} width
 * @param {string} name a page's name, `00-overview` or `NN-<view>`
 */
export const imageFile = (width, name) =>
  width === DEFAULT_WIDTH ? `images/${name}.png` : `images/${name}-${width}.png`;

/**
 * The two files of a plate's figure set alone, by format, in the order a delivery records them.
 * @param {string} name the plate's page name, `NN-<view>`
 * @returns {Array<{ format: "png" | "svg", file: string }>}
 */
export const figureFiles = (name) => [
  { format: "png", file: `figures/${name}.png` },
  { format: "svg", file: `figures/${name}.svg` },
];

/**
 * A figure's SVG as one file of shapes: Typst nests the figure's own SVG as an image with a data URI, which opens
 * anywhere and cannot be edited as shapes. The image is replaced by the document it holds, as a nested `svg` of the
 * image's own size, under the image's transform.
 * @param {string} svg
 */
export function inlined(svg) {
  return svg.replace(/<image\b([^>]*?)\/>/gu, (whole, attributes) => {
    const data = /xlink:href="data:image\/svg\+xml;base64,([^"]+)"/u.exec(attributes);
    if (!data) return whole;
    const read = (name) => new RegExp(`\\b${name}="([^"]*)"`, "u").exec(attributes)?.[1];
    const inner = Buffer.from(data[1], "base64").toString("utf8");
    const open = /<svg\b[^>]*>/u.exec(inner);
    if (!open) return whole;
    const viewBox = /viewBox=['"]([^'"]*)['"]/u.exec(open[0])?.[1];
    const nested =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${read("width")}" height="${read("height")}"` +
      `${viewBox ? ` viewBox="${viewBox}"` : ""} preserveAspectRatio="none">` +
      inner.slice(open.index + open[0].length);
    const transform = read("transform");
    return transform ? `<g transform="${transform}">${nested}</g>` : nested;
  });
}

/**
 * Typeset a delivery's print edition.
 * @param {{ record: any, plates: Array<{ page: number, views: string[], svg: string }>, modelBytes: Buffer,
 *   revision: string | null, date: string | null, time: number | null,
 *   widths: readonly number[], alone?: boolean, typst?: string,
 *   tokens?: { palette: object, figure: object, dye: object } }} input
 *   `alone` asks for each plate's figure and key alone as well, which needs each plate's `extent` and one width.
 */
export async function typesetEdition(input) {
  const typst = input.typst ?? "typst";
  const version = await typstVersion(typst, "edition");
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  const staged = await stage(input.modelBytes, input.tokens ?? null);
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
    // The overview is drawn from the model's statement, with the masthead's note of the files read.
    const entry = path.join(own, "edition.typ");
    await fs.writeFile(
      entry,
      [
        '#import "house.typ": edition',
        '#import "drawn.typ": drawn',
        '#let r = json("edition.json")',
        '#let stated = json("model.json").at("overview", default: none)',
        "#let numbers = r.plates.map(p => p.views.map(v => (v, p.number))).sum(default: ()).to-dict()",
        "#edition(r, overview: if stated == none { none } else { drawn(stated, written-from: r.words.writtenFrom, plates: numbers) })",
        "",
      ].join("\n"),
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
        pageName(plate),
      ]),
    );
    names.set("plate-00", OVERVIEW_PAGE);
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
    // The figures alone, where the caller asks for them: one page a plate, as PNG on no ground at the density of the
    // widest page image, and as SVG. Two more runs of Typst, of one more document.
    const figures = [];
    if (input.alone) {
      const alone = path.join(own, "figures.typ");
      await fs.writeFile(
        alone,
        [
          '#import "house.typ": figures-alone',
          '#let r = json("edition.json")',
          '#figures-alone(r, float(sys.inputs.at("density")))',
          "",
        ].join("\n"),
      );
      const density = Math.max(...input.widths) / PAGE_WIDTH;
      const sized = [...common, "--input", `density=${density}`];
      await Promise.all([
        typeset([
          "compile",
          ...sized,
          "--format",
          "png",
          "--ppi",
          String(density * 72),
          alone,
          path.join(out, "figure-{p}.png"),
        ]),
        typeset(["compile", ...sized, "--format", "svg", alone, path.join(out, "figure-{p}.svg")]),
      ]);
      for (const [index, plate] of input.plates.entries())
        for (const { format, file } of figureFiles(pageName(plate))) {
          const written = path.join(out, `figure-${index + 1}.${format}`);
          figures.push({
            file,
            bytes:
              format === "svg"
                ? Buffer.from(inlined(await fs.readFile(written, "utf8")))
                : await fs.readFile(written),
          });
        }
    }
    return {
      typst: version,
      house: staged.house,
      figures,
      pdf: await fs.readFile(pdfFile),
      pages: pages.length ? Math.max(...pages.map(([, page]) => page)) : 2,
      // Each plate's page in the PDF, counted from 1, in the edition's order; the overview's page is no plate.
      platePages: shown
        .filter(([label]) => label !== "plate-00")
        .map(([label, page]) => ({ number: Number(label.slice("plate-".length)), page })),
      png,
    };
  } finally {
    await fs.rm(staged.root, { recursive: true, force: true });
    await fs.rm(out, { recursive: true, force: true });
  }
}
