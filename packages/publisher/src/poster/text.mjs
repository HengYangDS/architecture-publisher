import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";

/** @typedef {{ size: number, weight: number, line: number }} TextStyle */

let loaded;

/** Load the bundled typefaces once; text is measured and outlined with the same faces. */
export async function loadTypefaces() {
  if (loaded) return loaded;
  const fonts = await verifySupply("fonts");
  const resvg = await verifySupply("resvg");
  const opentype = await import(
    pathToFileURL(path.join(resvg.root, "opentype", "opentype.mjs")).href
  );
  const faces = new Map();
  for (const file of fonts.manifest.files.filter(({ weight }) => weight)) {
    const bytes = await fs.readFile(path.join(fonts.root, file.path));
    faces.set(
      file.weight,
      opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)),
    );
  }
  loaded = createTypefaces(faces, fonts.sha256);
  return loaded;
}

/**
 * A word cut after each slash, hyphen, underscore, dot or colon, the places a
 * long path or identifier may break. Each delimiter stays with the piece before it.
 * @param {string} word
 */
export function softSegments(word) {
  return word.match(/[^/\-_.:]+[/\-_.:]*|[/\-_.:]+/gu) ?? [word];
}

/** @param {Map<number, any>} faces */
function createTypefaces(faces, supplySha256) {
  const face = (style) => faces.get(style.weight >= 600 ? 700 : 400);

  // Shaping a string is the costliest step of a layout, and a composition
  // measures the same words and lines thousands of times while it tries its
  // candidates, so each advance is shaped once per face and size.
  const advances = new Map();
  /** @param {string} text @param {TextStyle} style */
  const measure = (text, style) => {
    const key = `${style.weight >= 600 ? 700 : 400}\u0000${style.size}\u0000${text}`;
    let width = advances.get(key);
    if (width === undefined) {
      width = face(style).getAdvanceWidth(text, style.size, { kerning: true });
      advances.set(key, width);
    }
    return width;
  };

  /** Characters the bundled faces cannot draw. @param {string} text */
  function missing(text) {
    const absent = new Set();
    for (const character of text)
      if (!/\s/u.test(character) && face({ weight: 400 }).charToGlyphIndex(character) === 0)
        absent.add(character);
    return [...absent];
  }

  /** Break text into lines at spaces, and inside words only when one word is wider than the line. */
  function wrap(text, width, style) {
    const lines = [];
    let line = "";
    for (const word of breakable(String(text), width, style)) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || measure(candidate, style) <= width) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /**
   * Words, with any word wider than the line split into pieces that fit. A
   * long word breaks first after a slash, hyphen, underscore, dot or colon, so
   * a path or an identifier breaks where a reader expects it to; only a piece
   * still wider than the line is split between characters.
   */
  function breakable(text, width, style) {
    return text
      .split(/\s+/u)
      .filter(Boolean)
      .flatMap((word) => {
        if (measure(word, style) <= width) return [word];
        const pieces = [];
        let piece = "";
        for (const segment of softSegments(word)) {
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
        return piece ? [...pieces, piece] : pieces;
      });
  }

  /** Wrap one named detail, keeping list items whole and separated by commas. */
  function detailLines(name, values, width, style) {
    const tokens = values.map(
      (value, index) =>
        `${index ? "" : `${name}: `}${value}${index < values.length - 1 ? "," : ""}`,
    );
    const lines = [];
    let line = "";
    for (const token of tokens) {
      const candidate = line ? `${line} ${token}` : token;
      if (!line || measure(candidate, style) <= width) line = candidate;
      else {
        lines.push(line);
        line = token;
      }
    }
    if (line) lines.push(line);
    return lines.flatMap((text) =>
      measure(text, style) > width ? wrap(text, width, style) : [text],
    );
  }

  /**
   * SVG path data for one text run whose alphabetic baseline is at `y`. The
   * commands are serialized here: opentype.js 2.0.0 `toPathData` rounds through
   * string exponents and emits NaN for fractions such as 1.4e-14.
   */
  const outline = (text, x, y, style) =>
    pathData(face(style).getPath(text, x, y, style.size, { kerning: true }).commands);

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
 * Refuse text the bundled faces cannot draw instead of painting replacement glyphs.
 * @param {{ missing: (text: string) => string[] }} typefaces
 * @param {Array<{ path: string, text: string }>} texts
 */
export function requireGlyphs(typefaces, texts) {
  const problems = texts.flatMap(({ path: where, text }) => {
    const absent = typefaces.missing(text);
    return absent.length
      ? [
          {
            code: "glyph_missing",
            path: where,
            message: `has characters the bundled fonts cannot draw: ${absent.join(" ")}`,
          },
        ]
      : [];
  });
  if (problems.length)
    refuse("glyphs_missing", "Some text cannot be drawn with the bundled fonts.", problems);
}
