import { createHash } from "node:crypto";
import { parse } from "./supply/opentype/opentype.mjs";
import { fail } from "../../src/protocol/values.mjs";
import { RASTER_LIMITS } from "./limits.mjs";
import { verifyRasterSupply } from "./supply.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Parse once at the font owner; aliases never establish a second actual face. */
export function readFontFace(bytes, invalidCode) {
  // Refuse compressed/container formats before the parser can allocate tables.
  if (
    !Buffer.isBuffer(bytes) ||
    bytes.length < 12 ||
    bytes.length > RASTER_LIMITS.fontBytes ||
    bytes.readUInt32BE(0) !== 0x00010000
  )
    fail(invalidCode);
  const count = bytes.readUInt16BE(4);
  const directoryEnd = 12 + count * 16;
  if (!count || directoryEnd > bytes.length) fail(invalidCode);
  const tables = new Set();
  for (let index = 0; index < count; index++) {
    const entry = 12 + index * 16;
    const tag = bytes.toString("ascii", entry, entry + 4);
    const offset = bytes.readUInt32BE(entry + 8);
    const length = bytes.readUInt32BE(entry + 12);
    if (
      tables.has(tag) ||
      offset < directoryEnd ||
      offset > bytes.length ||
      length > bytes.length - offset
    )
      fail(invalidCode);
    tables.add(tag);
  }
  let font;
  try {
    font = parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  } catch {
    fail(invalidCode);
  }
  const aliases = new Set();
  for (const platform of Object.values(font.names))
    for (const key of ["typographicFamily", "preferredFamily", "fontFamily"])
      for (const name of Object.values(platform[key] ?? {})) aliases.add(name);
  let family;
  for (const key of ["typographicFamily", "preferredFamily", "fontFamily"]) {
    family = font.names.windows?.[key]?.en ?? font.names.macintosh?.[key]?.en;
    if (family) break;
  }
  if (!family || !Number.isInteger(font.tables.os2?.usWeightClass)) fail(invalidCode);
  if (
    family.length > 128 ||
    family !== family.trim() ||
    [...family].some(
      (character) => character.codePointAt(0) < 32 || character.codePointAt(0) === 127,
    ) ||
    /[,;{}()<>"'\\]/u.test(family)
  )
    fail("authored_canvas_font_family_unsupported");
  return {
    font,
    family,
    aliases,
    weight: font.tables.os2.usWeightClass,
    normal: font.tables.post?.italicAngle === 0 && !(font.tables.os2.fsSelection & 1),
    staticTtf: font.outlinesFormat === "truetype" && !font.tables.fvar,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

/** Resolve only consumed authored faces; invalid explicit choices never fall back. */
export async function resolveAuthoredFontSupply({
  catalogue = [],
  defaultFont,
  texts,
  readResource,
  bundled,
  backendDefaults = false,
  includeFraming = true,
  nativeTextWeights = [],
}) {
  await verifyRasterSupply();
  if (!Array.isArray(texts) || !Array.isArray(catalogue) || !Array.isArray(bundled?.fonts))
    fail("authored_canvas_font_measurement_invalid");
  const choices = new Map(catalogue.map((choice) => [choice.id, choice]));
  if (choices.size !== catalogue.length) fail("authored_canvas_font_identity_ambiguous");
  if (defaultFont !== undefined && !choices.has(defaultFont))
    fail("authored_canvas_font_unselected");
  if (
    !Array.isArray(nativeTextWeights) ||
    nativeTextWeights.some(
      (weight) => !bundled.fonts.some((face) => String(face.weight) === weight),
    )
  )
    fail("authored_canvas_font_measurement_invalid");
  if (
    !includeFraming &&
    !nativeTextWeights.length &&
    !texts.some(({ visible }) => visible) &&
    defaultFont !== undefined
  )
    fail("authored_canvas_font_selection_unused");
  const defaults = new Map(bundled.fonts.map((face) => [String(face.weight), face]));
  const faces = new Map();
  const resolved = new Map();
  const selectedFaces = new Map();
  const distributions = new Map();
  const consumed = new Map();
  const admit = (selected) => {
    const actual = readFontFace(selected.bytes, "authored_canvas_font_measurement_invalid");
    if (
      !actual.aliases.has(selected.family) ||
      actual.weight !== Number(selected.weight) ||
      !actual.normal ||
      !actual.staticTtf
    )
      fail("authored_canvas_font_identity_mismatch");
    const key = JSON.stringify([actual.family, actual.weight]);
    const previous = faces.get(key);
    if (previous && previous.sha256 !== actual.sha256)
      fail("authored_canvas_font_identity_ambiguous");
    const face = {
      family: actual.family,
      weight: actual.weight,
      sha256: actual.sha256,
      bytes: selected.bytes,
    };
    faces.set(key, face);
    return face;
  };
  const select = (fontId, weight) => {
    const selectionKey = JSON.stringify([fontId ?? null, weight]);
    if (resolved.has(selectionKey)) return resolved.get(selectionKey);
    if (fontId === undefined) {
      const selected = defaults.get(weight);
      if (!selected) fail("authored_canvas_font_unselected");
      const face = admit({ ...selected, family: bundled.manifest.family });
      resolved.set(selectionKey, face);
      return face;
    }
    const choice = choices.get(fontId);
    const selected = choice?.faces.find((face) => face.weight === weight);
    if (!selected || typeof readResource !== "function") fail("authored_canvas_font_unselected");
    const bytes = readResource(selected.ref);
    if (!Buffer.isBuffer(bytes) || sha(bytes) !== selected.sha256)
      fail("materialized_edition_resource_digest_mismatch");
    const face = admit({ family: choice.family, weight: Number(weight), bytes });
    selectedFaces.set(JSON.stringify([fontId, weight]), {
      id: fontId,
      family: face.family,
      weight: face.weight,
      ref: selected.ref,
      sha256: face.sha256,
    });
    consumed.set(selected.ref, selected.sha256);
    for (const evidence of choice.distribution) {
      if (distributions.has(evidence.ref)) {
        if (distributions.get(evidence.ref).sha256 !== evidence.sha256)
          fail("authored_canvas_font_identity_ambiguous");
        continue;
      }
      const content = readResource(evidence.ref);
      if (!Buffer.isBuffer(content) || !content.length || sha(content) !== evidence.sha256)
        fail("materialized_edition_resource_digest_mismatch");
      distributions.set(evidence.ref, { ...evidence, bytes: content });
      consumed.set(evidence.ref, evidence.sha256);
    }
    resolved.set(selectionKey, face);
    return face;
  };
  if (backendDefaults)
    for (const face of bundled.fonts) admit({ ...face, family: bundled.manifest.family });
  for (const weight of new Set(nativeTextWeights)) select(defaultFont, weight);
  const defaultFamily =
    includeFraming || nativeTextWeights.length
      ? select(defaultFont, "400").family
      : bundled.manifest.family;
  const labels = texts.map((label) => {
    const chosen = label.font ?? defaultFont;
    if (chosen !== undefined && !choices.has(chosen)) fail("authored_canvas_font_unselected");
    if (!label.visible) return { ...label };
    const face = select(chosen, label.weight);
    return { ...label, family: face.family };
  });
  const fontValues = [...faces.values()].sort(
    (left, right) => left.family.localeCompare(right.family) || left.weight - right.weight,
  );
  if (
    fontValues.length > RASTER_LIMITS.fonts ||
    fontValues.some(({ bytes }) => bytes.length > RASTER_LIMITS.fontBytes) ||
    fontValues.reduce((total, { bytes }) => total + bytes.length, 0) > RASTER_LIMITS.fontTotalBytes
  )
    fail("raster_fonts_invalid");
  const identity = {
    defaults: defaultFont === undefined || backendDefaults ? bundled.sha256 : null,
    faces: fontValues.map(({ family, weight, sha256 }) => ({ family, weight, sha256 })),
    selected: [...selectedFaces.values()].sort(
      (left, right) => left.id.localeCompare(right.id) || left.weight - right.weight,
    ),
    resources: [...consumed]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([ref, sha256]) => ({ ref, sha256 })),
  };
  return {
    fonts: fontValues,
    texts: labels,
    defaultFamily,
    selectedFaces: identity.selected,
    distributions: [...distributions.values()],
    license: bundled.license,
    identity,
    sha256: sha(Buffer.from(JSON.stringify(identity))),
  };
}
