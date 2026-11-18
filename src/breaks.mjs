/**
 * Where a line of a model's text may break, by the writing systems it is
 * written in. Words written with spaces, as Latin, Greek, Cyrillic and Hangul
 * text is, break at those spaces; a no-break space joins the words beside it.
 * Han and Kana text is written without them and may break before and after
 * each character, as Chinese and Japanese are set, except that a closing mark
 * stays with the character before it and an opening mark with the one after
 * it. The rules read the characters alone, so a text breaks the same way on
 * every host and in every runtime.
 */

/**
 * White space between words, where a line may break: any but the no-break
 * space, figure space, narrow no-break space and zero-width no-break space,
 * which keep "60 s" written with one on one line.
 */
export const SPACE = /[^\S\u00A0\u2007\u202F\uFEFF]/u;
const SPACES = new RegExp(`${SPACE.source}+`, "u");

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
    .split(SPACES)
    .filter(Boolean)
    .flatMap((word, index) =>
      (UNSPACED.test(word) ? unspacedUnits(word) : [word]).map((unit, position) => ({
        text: unit,
        gap: position ? "" : index ? " " : "",
      })),
    );
}

/**
 * How many places a justified line opens: after each character written without spaces between words and at each
 * space between words, but not after the line's last character, which ends at the measure.
 * @param {string} line
 */
export function openings(line) {
  return Array.from(line)
    .slice(0, -1)
    .filter((character) => UNSPACED.test(character) || SPACE.test(character)).length;
}

/**
 * The most slack a spread line closes for each place it opens, in ems of its size. Typst gives each space up to
 * half its width first and shares the rest evenly among all the places, so within this limit a line opens a tenth
 * of an em at most between two characters and up to as much again at a space. JIS X 4051, and the W3C's
 * requirements for Japanese and Chinese text layout after it, let a line add a quarter em between characters at
 * most. A part's details are a few short lines over a last line set tight, and there a line that opens more than
 * a tenth of an em reads as loose. A line with more slack, as one broken early before a long word in another
 * script, stays flush left.
 */
export const SPREAD_OPENING = 0.1;

/**
 * The most a line of an overview's text opens between two characters when it is spread, in ems of its size, in a
 * script written without spaces between words. An overview's notes stand in columns a few characters wide beside
 * words of another script that do not break, so the class breaks such a text where its loosest line opens least
 * and spreads every line but the last to the measure: a text keeps one right edge. A line that opens more than
 * three tenths of an em reads as characters standing apart. One that would open more, or that has no place to
 * open, stays as it is set, and the build names it for its author to reword.
 */
export const OVERVIEW_OPENING = 0.3;

/**
 * Whether a text holds a character written without spaces between words.
 * @param {string} text
 */
export const unspaced = (text) => UNSPACED.test(text);

/**
 * A text's atoms for a setter that fills and spreads its lines itself: each atom's text and gap, the places its
 * own characters open in a justified line, whether its last character is one of them, which opens none when it
 * ends a line, whether the atom alone on a line would be an orphan, and whether it ends a phrase, where a caption
 * breaks by preference. A word written with spaces may end a line after a slash inside it.
 * @param {string} text
 * @returns {Array<{ text: string, gap: string, places: number, last: boolean, orphan: boolean, pause: boolean }>}
 */
export const spreadAtoms = (text) =>
  atoms(text)
    .flatMap((atom) =>
      compoundPieces(atom.text).map((piece, index) => ({
        text: piece,
        gap: index ? "" : atom.gap,
      })),
    )
    .map((atom) => {
      const characters = Array.from(atom.text);
      return {
        ...atom,
        places: characters.filter((character) => UNSPACED.test(character)).length,
        last: UNSPACED.test(characters.at(-1) ?? ""),
        orphan: orphan(atom.text),
        pause: PAUSE.test(atom.text),
      };
    });

/** A word that ends a phrase: a comma, a semicolon, a colon or a full stop closes it, before a closing mark or none. */
const PAUSE = /[,;:.!?]["'”’)\]]?$/u;

/**
 * The pieces of a word written with spaces that a line may end between: after a slash inside it, between letters
 * or digits, as in `docs/README.md` or `provider/model`. A hyphen opens no break: at a line's end a reader cannot
 * tell the hyphen of `refresh-base` or `--expect-head` from one the setter added.
 * @param {string} word
 * @returns {string[]}
 */
function compoundPieces(word) {
  const pieces = [];
  let start = 0;
  for (const match of word.matchAll(/(?<=[\p{L}\p{N}])\/+(?=[\p{L}\p{N}])/gu)) {
    const end = match.index + match[0].length;
    pieces.push(word.slice(start, end));
    start = end;
  }
  pieces.push(word.slice(start));
  return pieces;
}

/**
 * Whether a line holds one character written without spaces between words, with or without the marks that open and
 * close it: an orphan, which Chinese setting does not leave a line to.
 * @param {string} line
 */
export function orphan(line) {
  const characters = Array.from(line).filter(
    (character) => !CLOSING.test(character) && !OPENING.test(character),
  );
  return characters.length === 1 && UNSPACED.test(characters[0]);
}

/**
 * Atoms set on one line.
 * @param {Atom[]} line
 */
export const joined = (line) =>
  line.map((atom, index) => (index ? atom.gap + atom.text : atom.text)).join("");
