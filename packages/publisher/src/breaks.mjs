/**
 * Where a line of a model's text may break, by the writing systems it is
 * written in. Words written with spaces, as Latin, Greek, Cyrillic and Hangul
 * text is, break at those spaces. Han and Kana text is written without them and
 * may break before and after each character, as Chinese and Japanese are set,
 * except that a closing mark stays with the character before it and an opening
 * mark with the one after it. The rules read the characters alone, so a text
 * breaks the same way on every host and in every runtime.
 */

/**
 * Characters set without spaces between words: Han, Kana, the CJK symbols and
 * punctuation block and the fullwidth forms.
 */
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}、-〿！-￯]/u;
/** Marks that never begin a line: closing brackets and quotes, stops, commas and iteration marks. */
const CLOSING = /^[、。，．：；！？）」』】〕〉》〗〙〛”’…‥ー々ゝゞヽヾ〜・,.;:!?)\]}%]/u;
/** Marks that never end a line: opening brackets and quotes. */
const OPENING = /[（「『【〔〈《〖〘〚“‘([{]$/u;

/**
 * One unit a line may break before, and what separates it from the unit before
 * it on a line: a space between words, nothing inside an unspaced run.
 * @typedef {{ text: string, gap: string }} Atom
 */

/**
 * The units of a word written without spaces: each unspaced character on its
 * own and each run of other characters whole, with closing marks joined to the
 * unit before them and opening marks to the unit after.
 * @param {string} word
 * @returns {string[]}
 */
function unspacedUnits(word) {
  const pieces = word.match(new RegExp(`${UNSPACED.source}|(?:(?!${UNSPACED.source}).)+`, "gu"));
  /** @type {string[]} */
  const units = [];
  for (const piece of pieces ?? [word]) {
    const previous = units.at(-1);
    if (previous !== undefined && (CLOSING.test(piece) || OPENING.test(previous)))
      units[units.length - 1] = previous + piece;
    else units.push(piece);
  }
  return units;
}

/**
 * The atoms of a text: the units a line may break between, in order. Joining
 * them with their gaps gives the text with its spaces folded.
 * @param {string} text
 * @returns {Atom[]}
 */
export function atoms(text) {
  return String(text)
    .split(/\s+/u)
    .filter(Boolean)
    .flatMap((word, index) =>
      (UNSPACED.test(word) ? unspacedUnits(word) : [word]).map((unit, position) => ({
        text: unit,
        gap: position ? "" : index ? " " : "",
      })),
    );
}

/**
 * Atoms set on one line.
 * @param {Atom[]} line
 */
export const joined = (line) =>
  line.map((atom, index) => (index ? atom.gap + atom.text : atom.text)).join("");
