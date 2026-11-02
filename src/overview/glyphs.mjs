import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";

/**
 * Typst draws a character no available face holds as an empty box and does not warn, so the
 * overview's text is checked against the faces Typst may use: the house faces and the bundled
 * CJK face.
 */

/** @type {Promise<(character: string) => boolean> | null} */
let coverage = null;

async function loadCoverage() {
  const [house, fonts, resvg] = await Promise.all([
    verifySupply("house"),
    verifySupply("fonts"),
    verifySupply("resvg"),
  ]);
  const opentype = await import(
    pathToFileURL(path.join(resvg.root, "opentype", "opentype.mjs")).href
  );
  const files = [
    ...house.manifest.files
      .filter((file) => file.family)
      .map((file) => path.join(house.root, file.path)),
    ...fonts.manifest.files
      .filter((file) => file.family === "Noto Sans CJK SC")
      .map((file) => path.join(fonts.root, file.path)),
  ];
  const faces = [];
  for (const file of files) {
    const bytes = await fs.readFile(file);
    faces.push(
      opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)),
    );
  }
  return (character) =>
    /\s/u.test(character) || faces.some((face) => face.charToGlyphIndex(character) !== 0);
}

/**
 * Refuse overview text with a character no face draws.
 * @param {Array<{ text: string, x: number, y: number }>} boxes
 */
export async function requireOverviewGlyphs(boxes) {
  coverage ??= loadCoverage();
  const draws = await coverage;
  const problems = boxes.flatMap((box) => {
    const missing = [...new Set(Array.from(box.text))].filter((character) => !draws(character));
    return missing.length
      ? [
          {
            code: "overview_glyph_missing",
            message: `${JSON.stringify(box.text.slice(0, 48))} at ${Math.round(box.x)},${Math.round(box.y)} pt has characters no bundled face draws: ${missing.join(" ")}`,
          },
        ]
      : [];
  });
  if (problems.length)
    refuse(
      "overview_glyph_missing",
      "Some overview text cannot be drawn with the bundled faces.",
      problems,
    );
}
