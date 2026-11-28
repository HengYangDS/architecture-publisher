// The blocks references.mjs writes from measures the code states as constants of its own modules, which no table
// holds: the lengths an edition may draw its largest part at (src/poster/strip.mjs), the spans of the age bands every
// edition sorts its files into (src/facts/ages.mjs), the image widths the trials of the line values measured at
// (tests/fixtures/line-tables.mjs), the balance gates a plate is measured against (src/poster/compose/gates.mjs) with
// the side of the square a hole is counted in (src/poster/balance.mjs), and the most cards a row holds
// (src/layout/rows.mjs). The writer reads declared files; it imports these modules of the tree as they stand, each for
// the reason given where it is read, and writes the sentence of the reference that names each.
import { code, counted, either, exported, listed, numbers } from "./text.mjs";

const STRIP = "src/poster/strip.mjs";
const AGES = "src/facts/ages.mjs";
const TRIALS = "tests/fixtures/line-tables.mjs";
const GATES = "src/poster/compose/gates.mjs";
const BALANCE = "src/poster/balance.mjs";
const ROWS = "src/layout/rows.mjs";
const DAY = 24 * 60 * 60;

/** One number a source states, refused by name when it states none. */
const number = (
  /** @type {string} */ file,
  /** @type {unknown} */ value,
  /** @type {string} */ what,
) => numbers(file, [value], what)[0];

/** A share as a sentence says it, in percent to a tenth. */
const percent = (/** @type {number} */ share) => `${Math.round(share * 1000) / 10} percent`;

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

  // The gates stand beside the code that measures a plate against them, with the pages they were calibrated on, and the
  // hole's side beside the measure that counts holes; both are the drawing's, so the writer imports them as it does the
  // strip's lengths. In the house's tokens they would serve the writer alone, and an edition's manifest records the
  // tokens' digest, so every edition's bytes would change. The sentence says each gate, in the order the gates state
  // them, by a clause of its own; a gate it has no clause for stops it.
  const gates = await exported(root, GATES, "GATES");
  const hole = number(BALANCE, await exported(root, BALANCE, "HOLE"), "HOLE");
  const limit = (/** @type {string} */ name) => number(GATES, gates[name], `${name} in GATES`);
  /** @type {Record<string, () => string>} */
  const clauses = {
    emptyShare: () =>
      `its largest blank rectangle covers at most ${percent(limit("emptyShare"))} of it`,
    band: () => `no blank band ${limit("band")} px or taller runs across it`,
    holes: () =>
      `at most ${percent(limit("holes"))} of it lies in empty squares of ${hole} px or more`,
    centroid: () => {
      const bounds = numbers(GATES, gates.centroid, "centroid in GATES");
      if (bounds.length !== 2)
        throw new Error(
          `references_set_missing: ${GATES} states no bound across and down in centroid of GATES`,
        );
      const [across, down] = bounds.map(percent);
      const way = across === down ? "across and down" : `across and ${down} down`;
      return `its centre of mass lies within ${across} of the centre ${way}`;
    },
  };
  const said = Object.keys(gates).map((name) => {
    if (!Object.hasOwn(clauses, name))
      throw new Error(
        `references_gate_unnamed: ${GATES} states the gate ${name}, which the sentence does not say`,
      );
    return clauses[name]();
  });
  // Each clause has a verb of its own, so the last takes a comma before its "and" and is not read as the one before's.
  const gatesSentence = () =>
    `Each plate is measured against ${counted(said.length)} balance gates over the body: ${new Intl.ListFormat("en-US").format(said)}.`;

  // The most cards a row holds stand beside the row engine that wraps rows at them, a drawing module too. A view's
  // tiers are drawn as labelled rows, and a view of members as rows without labels. The model reference and the agent
  // Skill, which an agent reads with nothing else, say it alike.
  const tierRow = number(
    ROWS,
    await exported(root, ROWS, "LABELLED_ROW_LIMIT"),
    "LABELLED_ROW_LIMIT",
  );
  const memberRow = number(ROWS, await exported(root, ROWS, "ROW_LIMIT"), "ROW_LIMIT");
  const rowLimits = () =>
    `Where a plate is drawn in rows of cards, a tier's row holds at most ${counted(tierRow)} cards and a row of a view of ${code("members")} at most ${counted(memberRow)}.`;

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
    {
      file: "docs/reference/operations.md",
      name: "balance-gates",
      source: `${GATES} and ${BALANCE}`,
      text: gatesSentence,
    },
    ...["docs/reference/model.md", "skills/architecture-publisher/SKILL.md"].map((file) => ({
      file,
      name: "row-limits",
      source: ROWS,
      text: rowLimits,
    })),
  ];
}
