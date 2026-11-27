// The blocks references.mjs writes from measures the code states as constants of its own modules, which no table
// holds: the lengths an edition may draw its largest part at (src/poster/strip.mjs), the spans of the age bands every
// edition sorts its files into (src/facts/ages.mjs) and the image widths the trials of the line values measured at
// (tests/fixtures/line-tables.mjs). The writer reads declared files; it imports these three modules of the tree as
// they stand, each for the reason given where it is read, and writes the sentence of the reference that names each.
import { counted, either, exported, listed, numbers } from "./text.mjs";

const STRIP = "src/poster/strip.mjs";
const AGES = "src/facts/ages.mjs";
const TRIALS = "tests/fixtures/line-tables.mjs";
const DAY = 24 * 60 * 60;

/**
 * The spans of the age bands every edition sorts its files into, in whole days, newest first. They are the definition
 * of the property `file-age-band`, stated once by the module that sorts a file by them and read from it by the facts'
 * catalogue and the edition's record; a table would serve the writer alone, so the writer imports the module too.
 * @param {string} root
 */
export const ageSpans = async (root) =>
  numbers(AGES, (await exported(root, AGES, "BANDS")).spans, "spans of BANDS").map((span) =>
    Math.round(span / DAY),
  );

/** A span of whole days as a sentence says it: in weeks where it is whole weeks, otherwise in days. */
const spoken = (/** @type {number} */ days) => {
  if (days % 7) return days === 1 ? "a day" : `${days} days`;
  return days === 7 ? "a week" : `${counted(days / 7)} weeks`;
};

/**
 * The blocks of the measures the code states as constants, read from the tree at `root`.
 * @param {string} root
 */
export async function measuresBlocks(root) {
  // The lengths, longest first, stand beside the code that tries them in turn; the drawing's modules change only under
  // an item of the evolution queue (tests/fixtures/evolution-queue.mjs), so the writer imports the drawing's constant
  // rather than move it into a table. The sentence names the lengths an edition falls back to, so it needs one.
  const [longest, ...shorter] = numbers(
    STRIP,
    await exported(root, STRIP, "STRIP_LENGTHS"),
    "lengths in STRIP_LENGTHS",
  );
  if (!shorter.length)
    throw new Error(`references_set_missing: ${STRIP} states no shorter length in STRIP_LENGTHS`);
  const fallback = `${shorter.length > 1 ? "the longest its views hold of " : ""}${either(shorter.map(String))} px`;

  // The sentence names a middle band, as a plate's key does, so it is written for three bands, of two spans. Each
  // bound is said in the words its whole days give; a month has no fixed number of days.
  const spans = await ageSpans(root);
  if (spans.length !== 2)
    throw new Error(
      `references_bands_unnamed: ${AGES} gives ${spans.length + 1} age bands; the sentence names three`,
    );
  const [newest, middle] = spans.map(spoken);

  // The widths are the trials': the tests that measure the line values at them are their only other reader and no
  // plate is drawn at them, so the writer imports the fixture that states them rather than a table beside it. The
  // first is the drawing space's own, in which one pixel is one pixel of the image.
  const widths = numbers(TRIALS, await exported(root, TRIALS, "WIDTHS"), "widths in WIDTHS");
  /** A pixel of the drawing space in pixels of an image `width` wide, to the thousandth. */
  const pixel = (/** @type {number} */ width) => Math.round((width / widths[0]) * 1000) / 1000;
  const pixels = widths.map((width, index) =>
    index ? `${pixel(width)} px of one ${width} px wide` : `one pixel of an image ${width} px wide`,
  );

  return [
    {
      file: "docs/reference/model.md",
      name: "strip-lengths",
      source: STRIP,
      text: () =>
        `The largest part is ${longest} px long; a strip is never shortened to fit its column, so an edition one of whose views cannot hold its strips draws them all at ${fallback}.`,
    },
    {
      file: "docs/reference/model.md",
      name: "age-bands",
      source: AGES,
      text: () =>
        `Every edition sorts its files into the same three age bands, counted back from the pin's commit: changed within ${newest}, over ${newest} and within ${middle}, and earlier; the key names the middle band by both bounds.`,
    },
    {
      file: "docs/reference/lines.md",
      name: "widths",
      source: TRIALS,
      text: () =>
        `Values are in the plate's drawing space, in which one pixel is ${listed(pixels)}: the ${counted(widths.length)} widths the trials measured at.`,
    },
  ];
}
