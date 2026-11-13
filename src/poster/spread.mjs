import { openings } from "../breaks.mjs";

/**
 * Spread lines: in a language written without spaces between words, a part's details are set as a justified
 * paragraph is. Their lines break wherever the script allows and are filled by the width Typst sets them in, and
 * every line but a detail's last is spread to the measure the details were wrapped to, so a part's details share
 * one right edge. Such a language spreads evenly between its characters; one that separates its words by spaces
 * would open wide gaps in so narrow a column, and keeps its details flush left.
 */

/**
 * The most slack a spread line closes for each place it opens, in ems of its size. Typst gives each space up to
 * half its width first and shares the rest evenly among all the places, so within this limit a line opens a tenth
 * of an em at most between two characters and up to as much again at a space. JIS X 4051, and the W3C's
 * requirements for Japanese and Chinese text layout after it, let a line add a quarter em between characters at
 * most. A part's details are a few short lines over a last line set tight, and there a line that opens more than a
 * tenth of an em reads as loose. A line with more slack, as one broken early before a long word in another script,
 * stays flush left.
 */
export const SPREAD_OPENING = 0.1;

/**
 * How each line of a part's details is set. In a language written without spaces between words: `set`, the width
 * Typst sets the line in, and `measure`, the width it is spread to, on every line but a detail's last whose slack is
 * within the limit for each place it opens. Null in a language that separates its words by spaces, whose lines stay
 * flush left at the width the engine measures.
 * @param {readonly string[][]} details the lines of each detail
 * @param {number} measure the width the details were wrapped to
 * @param {{ size: number }} style the details' text style
 * @param {(line: string, style: any) => number} widthOf the width Typst sets a line in
 * @param {boolean} unspaced whether the edition's language is written without spaces between words
 * @returns {Array<{ set: number, measure?: number } | null>}
 */
export function spreadOf(details, measure, style, widthOf, unspaced) {
  return details.flatMap((lines) =>
    lines.map((line, index) => {
      if (!unspaced) return null;
      const width = widthOf(line, style);
      const slack = measure - width;
      const places = openings(line);
      return index < lines.length - 1 &&
        places > 0 &&
        slack >= 0 &&
        slack <= SPREAD_OPENING * style.size * places
        ? { set: width, measure }
        : { set: width };
    }),
  );
}

/**
 * How wide a run's line is drawn: its measure when it is spread, the width it names when Typst's width of it is
 * known, else the width the engine measures its text in.
 * @param {{ value: string, style: any, measure?: number, set?: number }} run
 * @param {{ measure: (text: string, style: any) => number }} typefaces
 */
export const setWidth = (run, typefaces) =>
  run.measure ?? run.set ?? typefaces.measure(run.value, run.style);
