import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SPACE, atoms } from "../breaks.mjs";
import { detailPieces } from "../locale.mjs";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";

/** @typedef {{ size: number, weight: number, line: number }} TextStyle */

let loaded;

/**
 * Load the bundled typefaces once; text is measured and outlined with the same
 * faces. Each weight is a chain of faces in the order the supply lists its
 * families: CJK first, whose Latin the posters have always been set in, then a
 * Latin, Greek and Cyrillic face for the letters it lacks.
 */
export async function loadTypefaces() {
  if (loaded) return loaded;
  const fonts = await verifySupply("fonts");
  const resvg = await verifySupply("resvg");
  const opentype = await import(
    pathToFileURL(path.join(resvg.root, "opentype", "opentype.mjs")).href
  );
  /** @type {Map<number, any[]>} */
  const chains = new Map();
  for (const { family } of fonts.manifest.families)
    for (const file of fonts.manifest.files.filter((entry) => entry.family === family)) {
      const bytes = await fs.readFile(path.join(fonts.root, file.path));
      const face = opentype.parse(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      );
      chains.set(file.weight, [...(chains.get(file.weight) ?? []), face]);
    }
  loaded = createTypefaces(chains, fonts.sha256);
  return loaded;
}

/**
 * Scripts written right to left or shaped into joined or reordered glyphs.
 * Outlined glyph by glyph, they would read wrong, so their text is refused
 * rather than drawn.
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

/** @param {Map<number, any[]>} chains each weight's faces, in fallback order */
function createTypefaces(chains, supplySha256) {
  const weightOf = (style) => (style.weight >= 600 ? 700 : 400);
  // A space between words draws nothing in any face; a no-break space is
  // drawn only by a face with a glyph of its own for it.
  const draws = (face, character) =>
    SPACE.test(character) || face.charToGlyphIndex(character) !== 0;
  const drawsAll = (face, text) => Array.from(text).every((character) => draws(face, character));

  /**
   * The runs a text is set in at one weight, each with its face. A text one
   * face draws whole is set in the first such face; otherwise each word is, and
   * a word no face draws whole is set character by character in the first face
   * that draws each one. Adjacent runs in one face are joined.
   */
  const runsKnown = new Map();
  /** @returns {Array<{ text: string, face: any }>} */
  const runsOf = (text, style) => {
    const key = `${weightOf(style)}\u0000${text}`;
    let runs = runsKnown.get(key);
    if (runs) return runs;
    const chain = /** @type {any[]} */ (chains.get(weightOf(style)));
    const whole = chain.find((face) => drawsAll(face, text));
    runs = [];
    const pieces = whole
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
  /** @param {string} text @param {TextStyle} style */
  const measure = (text, style) => {
    const key = `${weightOf(style)}\u0000${style.size}\u0000${text}`;
    let width = advances.get(key);
    if (width === undefined) {
      width = runsOf(text, style).reduce(
        (sum, run) => sum + run.face.getAdvanceWidth(run.text, style.size, { kerning: true }),
        0,
      );
      advances.set(key, width);
    }
    return width;
  };

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
   */
  function fill(pieces, width, style) {
    const lines = [];
    let line = "";
    for (const { text: piece, gap } of pieces) {
      const candidate = line ? `${line}${gap}${piece}` : piece;
      if (!line || measure(candidate, style) <= width) line = candidate;
      else {
        lines.push(line);
        line = piece;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /**
   * Break text into lines between its atoms, where its writing system allows
   * a break, and inside an atom only when it is wider than the line.
   */
  const wrap = (text, width, style) => fill(breakable(String(text), width, style), width, style);

  /**
   * Atoms, with any atom wider than the line split into pieces that fit. A
   * long word breaks first after a slash, hyphen, underscore, dot or colon, so
   * a path or an identifier breaks where a reader expects it to; only a piece
   * still wider than the line is split between characters.
   */
  function breakable(text, width, style) {
    return atoms(text).flatMap((atom) => {
      if (measure(atom.text, style) <= width) return [atom];
      const pieces = [];
      let piece = "";
      for (const segment of softSegments(atom.text)) {
        if (piece && measure(piece + segment, style) <= width) {
          piece += segment;
          continue;
        }
        if (piece) pieces.push(piece);
        piece = "";
        if (measure(segment, style) <= width) {
          piece = segment;
          continue;
        }
        for (const character of segment) {
          if (piece && measure(piece + character, style) > width) {
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
   * SVG path data for one text run whose alphabetic baseline is at `y`. The
   * commands are serialized here: opentype.js 2.0.0 `toPathData` rounds through
   * string exponents and emits NaN for fractions such as 1.4e-14.
   */
  const outline = (text, x, y, style) => {
    let d = "";
    let at = x;
    for (const run of runsOf(text, style)) {
      d += pathData(run.face.getPath(run.text, at, y, style.size, { kerning: true }).commands);
      at += run.face.getAdvanceWidth(run.text, style.size, { kerning: true });
    }
    return d;
  };

  /** Top of a line box to its alphabetic baseline. */
  const baseline = (top, style) => top + (style.line - style.size) / 2 + style.size * 0.88;

  return Object.freeze({ measure, missing, wrap, detailLines, outline, baseline, supplySha256 });
}

const coordinate = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

/** @param {Array<Record<string, any>>} commands */
function pathData(commands) {
  let d = "";
  for (const command of commands) {
    const points =
      command.type === "C"
        ? [command.x1, command.y1, command.x2, command.y2, command.x, command.y]
        : command.type === "Q"
          ? [command.x1, command.y1, command.x, command.y]
          : command.type === "Z"
            ? []
            : [command.x, command.y];
    d += command.type + points.map(coordinate).join(" ");
  }
  return d;
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
