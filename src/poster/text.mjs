import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SPACE, atoms, joined, orphan } from "../breaks.mjs";
import { detailPieces, detailText } from "../locale.mjs";
import { kerningOf } from "./kerning.mjs";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";

/**
 * A text style: its size, weight and line pitch, and its face, the house's sans for figure text unless it names the
 * serif the edition sets a view's summary in.
 * @typedef {{ size: number, weight: number, line: number, face?: "serif" }} TextStyle
 */

let loaded;

/**
 * Load the faces text is measured in, once: the house's Source Sans 3, which the edition sets figure text in, and
 * Source Serif 4, which it sets a view's summary in, each followed by Noto Sans CJK SC for Han. Heavy text takes
 * Source Sans 3's semibold and the CJK face's bold. The house faces are measured with their own pair kerning, as
 * Typst sets them.
 */
export async function loadTypefaces() {
  if (loaded) return loaded;
  const [house, fonts, reader] = await Promise.all([
    verifySupply("house"),
    verifySupply("fonts"),
    verifySupply("opentype"),
  ]);
  const opentype = await import(pathToFileURL(path.join(reader.root, "opentype.mjs")).href);
  /** @type {Map<any, (left: number, right: number) => number>} */
  const kerning = new Map();
  /** @param {any} supply @param {string} family @param {number} weight */
  const face = async (supply, family, weight) => {
    const file = supply.manifest.files.find(
      (entry) => entry.family === family && entry.weight === weight && entry.style !== "italic",
    );
    const bytes = await fs.readFile(path.join(supply.root, file.path));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const parsed = opentype.parse(buffer);
    if (supply === house) kerning.set(parsed, kerningOf(buffer));
    return parsed;
  };
  const han = await face(fonts, "Noto Sans CJK SC", 400);
  /** @type {Array<[number | "serif", any[]]>} */
  const entries = [
    [400, [await face(house, "Source Sans 3", 400), han]],
    [
      700,
      await Promise.all([face(house, "Source Sans 3", 600), face(fonts, "Noto Sans CJK SC", 700)]),
    ],
    ["serif", [await face(house, "Source Serif 4", 400), han]],
  ];
  const chains = new Map(entries);
  loaded = createTypefaces(chains, kerning);
  return loaded;
}

/**
 * Scripts written right to left or shaped into joined or reordered glyphs.
 * Measured glyph by glyph, they would be laid out wrong, so their text is
 * refused rather than drawn.
 */
const SHAPED =
  /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Thai}\p{Script=Lao}\p{Script=Tibetan}\p{Script=Myanmar}\p{Script=Khmer}\p{Script=Mongolian}]/u;

/**
 * A word cut after each slash, hyphen, underscore, dot or colon, the places a
 * long path or identifier may break. Each delimiter stays with the piece before it.
 * @param {string} word
 */
function softSegments(word) {
  return word.match(/[^/\-_.:]+[/\-_.:]*|[/\-_.:]+/gu) ?? [word];
}

/**
 * Han beside a letter or digit, where Typst sets a quarter em between the two: a Han character, Hiragana or
 * Katakana on one side, and on the other a Latin, Greek or Cyrillic letter, a digit, a Roman numeral, or #, $, % or &.
 */
const HAN_NEIGHBOUR =
  /(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])(?=[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Nd}\u2160-\u217F#$%&])|(?<=[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Nd}\u2160-\u217F#$%&])(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu;

/** Full-width marks that close a phrase, and those that open one. */
const CLOSING_MARK = /[，。．、：；！？）】》」』〕〗〙〛〉］｝]/u;
const OPENING_MARK = /[（【《「『〔〖〘〚〈［｛]/u;
const MARK = new RegExp(`${CLOSING_MARK.source}|${OPENING_MARK.source}`, "u");

/**
 * How many full-width marks of a line Typst sets in half their width: a closing mark that ends the line, an opening
 * mark that starts it, and one of each two marks side by side.
 * @param {string} text
 */
function halvedMarks(text) {
  const characters = Array.from(text);
  let count = 0;
  if (CLOSING_MARK.test(characters.at(-1) ?? "")) count += 1;
  if (OPENING_MARK.test(characters[0] ?? "")) count += 1;
  for (let index = 1; index < characters.length; index += 1)
    if (MARK.test(characters[index - 1]) && MARK.test(characters[index])) count += 1;
  return count;
}

/**
 * @param {Map<number | "serif", any[]>} chains each weight's faces, and the summary's, in fallback order
 * @param {Map<any, (left: number, right: number) => number>} kerning the pair kerning of each house face
 */
function createTypefaces(chains, kerning) {
  const weightOf = (style) => (style.face === "serif" ? "serif" : style.weight >= 600 ? 700 : 400);
  // A space between words draws nothing in any face; a no-break space is
  // drawn only by a face with a glyph of its own for it.
  const draws = (face, character) =>
    SPACE.test(character) || face.charToGlyphIndex(character) !== 0;
  const drawsAll = (face, text) => Array.from(text).every((character) => draws(face, character));

  /**
   * The runs a text is set in at one weight, each with its face. A text one
   * face draws whole is set in the first such face; otherwise each word is, and
   * a word no face draws whole is set character by character in the first face
   * that draws each one. The summary's face, and any line asked for as it is
   * typeset, falls back character by character, as Typst does. Adjacent runs
   * in one face are joined.
   */
  const runsKnown = new Map();
  /** @returns {Array<{ text: string, face: any }>} */
  const runsOf = (text, style, typeset = style.face === "serif") => {
    const key = `${typeset}\u0000${weightOf(style)}\u0000${text}`;
    let runs = runsKnown.get(key);
    if (runs) return runs;
    const chain = /** @type {any[]} */ (chains.get(weightOf(style)));
    const whole = chain.find((face) => drawsAll(face, text));
    runs = [];
    const pieces = typeset
      ? Array.from(text, (character) => ({
          text: character,
          face: chain.find((each) => draws(each, character)) ?? chain[0],
        }))
      : whole
        ? [{ text, face: whole }]
        : (text.match(/\S+\s*|\s+/gu) ?? []).flatMap((word) => {
            const face = chain.find((each) => drawsAll(each, word));
            return face
              ? [{ text: word, face }]
              : Array.from(word, (character) => ({
                  text: character,
                  face: chain.find((each) => draws(each, character)) ?? chain[0],
                }));
          });
    for (const piece of pieces) {
      const last = runs.at(-1);
      if (last && last.face === piece.face) last.text += piece.text;
      else runs.push({ ...piece });
    }
    runsKnown.set(key, runs);
    return runs;
  };

  // Shaping a string is the costliest step of a layout, and a composition
  // measures the same words and lines thousands of times while it tries its
  // candidates, so each advance is shaped once per face and size.
  const advances = new Map();
  /**
   * The width of a run in its face: its glyphs' advances and, in a house face, what the face's kerning adds between
   * each two of them, which the font reader does not read.
   * @param {{ text: string, face: any }} run @param {number} size
   */
  const runWidth = ({ text, face }, size) => {
    const pairs = kerning.get(face);
    if (!pairs) return face.getAdvanceWidth(text, size, { kerning: true });
    const glyphs = face.stringToGlyphs(text);
    let units = 0;
    for (let index = 1; index < glyphs.length; index += 1)
      units += pairs(glyphs[index - 1].index, glyphs[index].index);
    return face.getAdvanceWidth(text, size, { kerning: false }) + (units * size) / face.unitsPerEm;
  };
  /** @param {string} text @param {TextStyle} style @param {boolean} typeset as Typst sets the line */
  const advance = (text, style, typeset) => {
    const key = `${typeset}\u0000${weightOf(style)}\u0000${style.size}\u0000${text}`;
    let width = advances.get(key);
    if (width === undefined) {
      width = runsOf(text, style, typeset).reduce((sum, run) => sum + runWidth(run, style.size), 0);
      // Typst spaces Han from the letters and digits beside it and sets some full-width marks in half their width.
      if (typeset)
        width +=
          ((String(text).match(HAN_NEIGHBOUR) ?? []).length * style.size) / 4 -
          (halvedMarks(String(text)) * style.size) / 2;
      advances.set(key, width);
    }
    return width;
  };
  /**
   * The width a box allows a text: in the summary's face the width Typst sets it in, and in the figure's faces a
   * width no narrower than that, since a line with Han in it is measured in the CJK face alone.
   * @param {string} text @param {TextStyle} style
   */
  const measure = (text, style) => advance(text, style, style.face === "serif");
  /**
   * The width Typst sets a line in: each character in the first face that draws it, a quarter em between Han and the
   * letter or digit beside it, and a full-width mark in half its width where it ends or starts the line or stands
   * beside another.
   * @param {string} text @param {TextStyle} style
   */
  const typesetWidth = (text, style) => advance(text, style, true);

  /**
   * Characters the bundled faces cannot draw, and those of scripts the
   * publisher does not set.
   * @param {string} text
   */
  function missing(text) {
    const chain = /** @type {any[]} */ (chains.get(400));
    const absent = new Set();
    for (const character of text)
      if (SHAPED.test(character) || !chain.some((face) => draws(face, character)))
        absent.add(character);
    return [...absent];
  }

  /**
   * Set pieces on lines greedily: each piece follows the line's last after its
   * gap while the line fits, and starts the next line otherwise.
   * @param {Array<{ text: string, gap: string }>} pieces
   * @param {(text: string, style: TextStyle) => number} widthOf how wide a line is taken to be
   * @returns {Array<Array<{ text: string, gap: string }>>} the pieces of each line
   */
  function lay(pieces, width, style, widthOf) {
    const lines = [];
    let line = [];
    let text = "";
    for (const piece of pieces) {
      const candidate = line.length ? `${text}${piece.gap}${piece.text}` : piece.text;
      if (line.length && widthOf(candidate, style) > width) {
        lines.push(line);
        line = [];
      }
      text = line.length ? candidate : piece.text;
      line.push(piece);
    }
    if (line.length) lines.push(line);
    return lines;
  }

  /** The lines pieces are set on, as text. */
  const fill = (pieces, width, style, widthOf = measure) =>
    lay(pieces, width, style, widthOf).map(joined);

  /**
   * Break text into lines between its atoms, where its writing system allows
   * a break, and inside an atom only when it is wider than the line.
   */
  const wrap = (text, width, style, widthOf = measure) =>
    fill(breakable(String(text), width, style, widthOf), width, style, widthOf);

  /**
   * Atoms, with any atom wider than the line split into pieces that fit. A
   * long word breaks first after a slash, hyphen, underscore, dot or colon, so
   * a path or an identifier breaks where a reader expects it to; only a piece
   * still wider than the line is split between characters.
   */
  function breakable(text, width, style, widthOf = measure) {
    return atoms(text).flatMap((atom) => {
      if (widthOf(atom.text, style) <= width) return [atom];
      const pieces = [];
      let piece = "";
      for (const segment of softSegments(atom.text)) {
        if (piece && widthOf(piece + segment, style) <= width) {
          piece += segment;
          continue;
        }
        if (piece) pieces.push(piece);
        piece = "";
        if (widthOf(segment, style) <= width) {
          piece = segment;
          continue;
        }
        for (const character of segment) {
          if (piece && widthOf(piece + character, style) > width) {
            pieces.push(piece);
            piece = "";
          }
          piece += character;
        }
      }
      if (piece) pieces.push(piece);
      return pieces.map((text, index) => ({ text, gap: index ? "" : atom.gap }));
    });
  }

  /**
   * Wrap one named detail in the model's language, keeping list items whole
   * and separated by the language's list mark.
   * @param {import("../locale.mjs").Words} words
   */
  function detailLines(words, name, values, width, style) {
    const { pieces, gap } = detailPieces(words, name, values);
    return fill(
      pieces.map((text) => ({ text, gap })),
      width,
      style,
    ).flatMap((text) => (measure(text, style) > width ? wrap(text, width, style) : [text]));
  }

  /**
   * Wrap one named detail of a language written without spaces between words as a paragraph: wherever its script
   * allows a break, inside a list item as between two, each line filled by the width Typst sets it in. An orphan
   * does not make a line: a last line of one character takes the unit before it from the line above where the two
   * fit the measure, which two that were the whole of the line above never do.
   * @param {import("../locale.mjs").Words} words
   */
  function detailParagraph(words, name, values, width, style) {
    const text = detailText(words, name, values);
    const lines = lay(breakable(text, width, style, typesetWidth), width, style, typesetWidth);
    const last = lines.at(-1);
    const above = lines.at(-2);
    if (last && above && orphan(joined(last))) {
      const kept = [above[above.length - 1], ...last];
      if (typesetWidth(joined(kept), style) <= width) lines.splice(-2, 2, above.slice(0, -1), kept);
    }
    return lines.map(joined);
  }

  /** Top of a line box to its alphabetic baseline. */
  const baseline = (top, style) => top + (style.line - style.size) / 2 + style.size * 0.88;

  return Object.freeze({
    measure,
    typesetWidth,
    missing,
    wrap,
    detailLines,
    detailParagraph,
    baseline,
  });
}

/**
 * Refuse text the bundled faces cannot draw, or in a script the publisher does
 * not set, instead of painting replacement glyphs or unjoined letters.
 * @param {{ missing: (text: string) => string[] }} typefaces
 * @param {Array<{ path: string, text: string }>} texts
 */
export function requireGlyphs(typefaces, texts) {
  const problems = texts.flatMap(({ path: where, text }) => {
    const absent = typefaces.missing(text);
    const shaped = absent.filter((character) => SHAPED.test(character));
    const undrawn = absent.filter((character) => !SHAPED.test(character));
    return [
      ...(shaped.length
        ? [
            {
              code: "script_unsupported",
              path: where,
              message: `is written in a right-to-left or shaped script the posters cannot set: ${shaped.join(" ")}`,
            },
          ]
        : []),
      ...(undrawn.length
        ? [
            {
              code: "glyph_missing",
              path: where,
              message: `has characters the bundled fonts cannot draw: ${undrawn.join(" ")}`,
            },
          ]
        : []),
    ];
  });
  if (problems.length)
    refuse("glyphs_missing", "Some text cannot be drawn with the bundled fonts.", problems);
}
