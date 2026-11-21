import fs from "node:fs";

/**
 * The names of a delivery: the files a build and an acceptance write, the names the publisher forms for a page, a
 * plate and a revision, and the Typst release its pages are set with; and the names the publisher shares with the
 * house class, which a table beside this module states for both. Each is stated here or in the table once; a module
 * that writes, lists, reads or reports one takes it from here rather than forming it again. The unit imports no
 * other unit.
 */

/** The Typst release the edition, the overview and the colophon page are set with; any other is refused. */
export const TYPST_VERSION = "0.15.1";

/**
 * The table of the names the publisher shares with the house class: the directory the class is staged in and the
 * files staged beside it, the delivered file the class names too, the directory of the plates' figures, the labels
 * the class sets for the publisher to query, and what a plate's key begins with. The class reads the table where it
 * is staged beside it, by this file's own name, the one name that both the JavaScript and the Typst state.
 */
export const SHARED_FILE = new URL("./shared.json", import.meta.url);

/** The names of the table, read once and read-only. */
export const SHARED = JSON.parse(fs.readFileSync(SHARED_FILE, "utf8"), (_key, value) =>
  value && typeof value === "object" ? Object.freeze(value) : value,
);

/** The manifest, which names every other file a build delivers, with its digest. */
export const MANIFEST = "manifest.json";

/**
 * The model as the build read it, which a delivery carries beside its data and the edition attaches by the same
 * name: the table states it, since the class names it too. The model staged for the class is spelt alike and is not
 * the same fact.
 */
export const MODEL = SHARED.delivered.model;

/** The acceptance record, which an acceptance writes beside a build. */
export const ACCEPTANCE = "acceptance.json";

/** The record's detached signature, beside it when the reviewer signs. */
export const SIGNATURE = "acceptance.sig";

/** The colophon page, which an acceptance sets beside a build. */
export const COLOPHON = "colophon.pdf";

/** The directory of the edition's page images. */
export const IMAGES = "images";

/** The directory of each plate's figure set alone. */
export const FIGURES = "figures";

/**
 * The files a delivery names by its model's id: the print edition, the page, the data and the reader file.
 * @param {string} id the model's id
 */
export const filesOf = (id) =>
  Object.freeze({
    edition: `${id}.pdf`,
    page: `${id}.html`,
    data: `${id}.json`,
    reader: `${id}.md`,
  });

/**
 * A number as the edition sets it, in two digits at least.
 * @param {number} number
 */
export const two = (number) => String(number).padStart(2, "0");

/** The number the overview's page takes, which no plate has: plates are numbered from 1. */
const OVERVIEW = 0;

/** The name of the overview's page among an edition's images. */
export const OVERVIEW_PAGE = `${two(OVERVIEW)}-overview`;

/**
 * The name of a plate's page among an edition's images and figures: `NN-<view>`.
 * @param {{ page: number, views: readonly string[] }} plate
 */
export const pageName = (plate) => `${two(plate.page)}-${plate.views.join("+")}`;

/**
 * The width in pixels a page's image is rendered at unless the caller names its widths. The image at this width is
 * named without its width.
 */
export const DEFAULT_WIDTH = 3840;

/**
 * The image file of one page of an edition at one width.
 * @param {number} width
 * @param {string} name a page's name, `00-overview` or `NN-<view>`
 */
export const imageFile = (width, name) =>
  width === DEFAULT_WIDTH ? `${IMAGES}/${name}.png` : `${IMAGES}/${name}-${width}.png`;

/**
 * The two files of a plate's figure set alone, by format, in the order a delivery records them.
 * @param {string} name the plate's page name, `NN-<view>`
 * @returns {Array<{ format: "png" | "svg", file: string }>}
 */
export const figureFiles = (name) => [
  { format: "png", file: `${FIGURES}/${name}.png` },
  { format: "svg", file: `${FIGURES}/${name}.svg` },
];

/**
 * The label the edition finds a plate's page by, of its number: the table's beginning of a key, then the number.
 * @param {number} page the plate's number
 */
export const plateKey = (page) => `${SHARED.key}${two(page)}`;

/** The label of the overview's page, which takes the number no plate has. */
export const OVERVIEW_KEY = plateKey(OVERVIEW);

/**
 * The number of the plate whose page a label finds.
 * @param {string} key a plate's key
 */
export const plateNumber = (key) => Number(key.slice(SHARED.key.length));

/**
 * The file a plate's figure is staged in beside the class, by which the edition's record names it to the class.
 * @param {number} page the plate's number
 */
export const stagedPlate = (page) => `${SHARED.plates}/${two(page)}.svg`;

/**
 * A revision as a reader is shown it: its first seven characters.
 * @param {string} revision
 */
export const shortRevision = (revision) => revision.slice(0, 7);
