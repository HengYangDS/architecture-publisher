import fs from "node:fs";

/**
 * The edition's house style and palette: how a model names them, the rules a palette it gives
 * itself must meet, and the tokens every palette resolves to. Colours are measured in OKLab and
 * OKLCH, whose lightness tells the dye steps apart even on a photocopy, and in WCAG 2 contrast
 * against the ground, the measure readers' tools report.
 */

/** The house palettes and the 0.12 tokens, read once; the poster tokens read the same file. */
const HOUSE = JSON.parse(fs.readFileSync(new URL("../house.json", import.meta.url), "utf8"));

/** The house styles: parts woven from their files as strips, or the icon cards of 0.12. */
export const STYLES = Object.freeze(["bolts", "cards"]);
/** The built-in palettes, in the house's order. */
export const PALETTES = Object.freeze(Object.keys(HOUSE.palettes));
const DEFAULT_PALETTE = "indigo";
const NO_EDITION = Object.freeze({ style: null, palette: null });
const COLOR = /^#[0-9a-f]{6}$/iu;
/** The seal's cinnabar: no colour of a palette may be mistaken for it. */
const CINNABAR = "#a93d31";

/**
 * The shares by which a derived token mixes a palette's ink toward its ground in OKLab, 0 being
 * the ink and 1 the ground, calibrated on the 0.12 house so a derived palette keeps its weights.
 */
const TOWARD_GROUND = Object.freeze({
  mid: 0.34,
  soft: 0.23,
  rule: 0.79,
  cardStroke: 0.84,
  outside: 0.95,
  outsideStroke: 0.745,
  outsideMark: 0.44,
  boundary: 0.47,
  retired: 0.53,
});
/** A card is its ground lifted toward white by this share, so it reads as paper on paper. */
const CARD_TOWARD_WHITE = 0.6;

/** @typedef {{ ground: string, ink: string, dye: readonly string[], accent?: string }} Roles */

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isColor = (value) => typeof value === "string" && COLOR.test(value);
/** Colours are kept in lower case, as the house file writes them. */
const lower = (color) => color.toLowerCase();

/** One sRGB channel, encoded in 0..1, as linear light. */
const decode = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
/**
 * The linear light halfway between each pair of neighbouring 8-bit sRGB levels. A linear value's
 * level is the number of these it reaches: its encoding rounded to the nearest level, and clamped
 * to the gamut, since a value below black reaches none and one above white reaches them all.
 */
const MIDPOINTS = Array.from({ length: 255 }, (_, level) => decode((level + 0.5) / 255));
const level = (value) => MIDPOINTS.filter((midpoint) => midpoint <= value).length;

/** A `#rrggbb` colour as linear sRGB. */
const linear = (hex) =>
  [1, 3, 5].map((at) => decode(Number.parseInt(hex.slice(at, at + 2), 16) / 255));

/** Linear sRGB to OKLab, after Björn Ottosson. */
function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * OKLab to a `#rrggbb` colour, each channel rounded to its nearest level within the gamut.
 * @param {number[]} lab
 */
function hexOf(lab) {
  const [lightness, a, b] = lab;
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${channels.map((value) => level(value).toString(16).padStart(2, "0")).join("")}`;
}

/** A colour's OKLab coordinates, OKLCH lightness and chroma, and WCAG relative luminance. */
function measure(hex) {
  const [r, g, b] = linear(hex);
  const lab = oklab([r, g, b]);
  return {
    lab,
    lightness: lab[0],
    chroma: Math.hypot(lab[1], lab[2]),
    luminance: 0.2126 * r + 0.7152 * g + 0.0722 * b,
  };
}

/** The colour `share` of the way from `from` to `to` in OKLab. */
function mix(from, to, share) {
  const [start, end] = [measure(from).lab, measure(to).lab];
  return hexOf(start.map((value, index) => value + (end[index] - value) * share));
}

const contrast = (one, other) =>
  (Math.max(one.luminance, other.luminance) + 0.05) /
  (Math.min(one.luminance, other.luminance) + 0.05);
const distance = (one, other) =>
  Math.hypot(...one.lab.map((value, index) => value - other.lab[index]));

/**
 * A bound a measure must reach (`least`) or stay within (`most`), shown to `digits` places. A
 * refused measure is shown rounded, except that one rounding onto the passing side of its bound
 * is shown one place past it, so a refusal never names a value the rule would accept.
 */
const least = (measured, bound, digits = 3) =>
  Object.freeze({ measured, bound, digits, holds: (value) => value >= bound, step: -1 });
const most = (measured, bound, digits = 3) =>
  Object.freeze({ measured, bound, digits, holds: (value) => value <= bound, step: 1 });

/** The rules a custom palette must meet; contrast is against the ground. */
const RULES = Object.freeze({
  groundLightness: least("lightness", 0.92),
  groundChroma: most("chroma", 0.02),
  inkContrast: least("contrast", 7, 2),
  inkChroma: most("chroma", 0.05),
  dyeStep: least("lightness", 0.12),
  newBelowGround: least("lightness", 0.07),
  oldContrast: least("contrast", 4.5, 2),
  dyeChroma: most("chroma", 0.08),
  accentContrast: least("contrast", 4.5, 2),
  accentChroma: most("chroma", 0.12),
  seal: least("OKLab distance", 0.06),
});

/**
 * Add a refusal at `path` unless `value` meets `rule`.
 * @param {{ add: Function }} problems
 * @param {string} path
 * @param {number} value
 * @param {ReturnType<typeof least>} rule
 * @param {string} relation what the measure is taken against, after its value
 */
function judge(problems, path, value, rule, relation) {
  if (rule.holds(value)) return;
  const scale = 10 ** rule.digits;
  const rounded = Math.round(value * scale) / scale;
  const shown = rule.holds(rounded) ? rounded + rule.step / scale : rounded;
  problems.add(
    "model_palette_rejected",
    path,
    `has ${rule.measured} ${shown.toFixed(rule.digits)}${relation}; the bound is ${rule.bound}`,
  );
}

/**
 * Hold a well-formed custom palette to the rules: a light, near-neutral ground; an ink and an
 * oldest dye that read against it; dye steps that differ by lightness alone; and no colour near
 * the seal's cinnabar.
 */
function judgePalette(palette, problems) {
  const at = (role) => `/edition/palette/${role}`;
  const ground = measure(palette.ground);
  const ink = measure(palette.ink);
  const dye = palette.dye.map(measure);
  const against = " against the ground";
  judge(problems, at("ground"), ground.lightness, RULES.groundLightness, "");
  judge(problems, at("ground"), ground.chroma, RULES.groundChroma, "");
  judge(problems, at("ink"), contrast(ink, ground), RULES.inkContrast, against);
  judge(problems, at("ink"), ink.chroma, RULES.inkChroma, "");
  dye.forEach((step, index) => {
    const before = index ? dye[index - 1] : ground;
    const name = index ? `dye ${index - 1}` : "the ground";
    const rule = index ? RULES.dyeStep : RULES.newBelowGround;
    judge(problems, at(`dye/${index}`), before.lightness - step.lightness, rule, ` below ${name}`);
    judge(problems, at(`dye/${index}`), step.chroma, RULES.dyeChroma, "");
  });
  judge(problems, at("dye/2"), contrast(dye[2], ground), RULES.oldContrast, against);
  const colors = [
    ["ground", ground],
    ["ink", ink],
    ...dye.map((step, index) => [`dye/${index}`, step]),
  ];
  if (palette.accent !== undefined) {
    const accent = measure(palette.accent);
    judge(problems, at("accent"), contrast(accent, ground), RULES.accentContrast, against);
    judge(problems, at("accent"), accent.chroma, RULES.accentChroma, "");
    colors.push(["accent", accent]);
  }
  const [seal, apart] = [measure(CINNABAR), ` from the seal's cinnabar ${CINNABAR}`];
  for (const [role, color] of colors)
    judge(problems, at(role), distance(color, seal), RULES.seal, apart);
}

/**
 * A custom palette's roles, in lower case, or null when one is missing or malformed; a
 * well-formed palette is held to the rules.
 */
function readCustom(value, problems) {
  const where = "/edition/palette";
  problems.fields(value, where, ["ground", "ink", "dye"], ["accent"]);
  const dye = Array.isArray(value.dye) && value.dye.length === 3 ? value.dye : null;
  if (value.dye !== undefined && !dye)
    problems.add(
      "model_palette_rejected",
      `${where}/dye`,
      "must list three colours, from new to old",
    );
  const roles = [
    ["ground", value.ground],
    ["ink", value.ink],
    ...(dye ?? []).map((color, index) => [`dye/${index}`, color]),
  ];
  if (value.accent !== undefined) roles.push(["accent", value.accent]);
  let whole = Boolean(dye);
  for (const [role, color] of roles)
    if (!isColor(color)) {
      whole = false;
      // A missing role is already refused as a required field.
      if (color !== undefined)
        problems.add("model_color_invalid", `${where}/${role}`, "must be a #rrggbb colour");
    }
  if (!whole) return null;
  const palette = { ground: lower(value.ground), ink: lower(value.ink), dye: dye.map(lower) };
  if (value.accent !== undefined) palette.accent = lower(value.accent);
  judgePalette(palette, problems);
  return Object.freeze({ ...palette, dye: Object.freeze(palette.dye) });
}

/** A model's palette: a built-in name, custom roles, or null when it names none. */
function readPalette(value, problems) {
  if (value === undefined) return null;
  if (isRecord(value)) return readCustom(value, problems);
  if (PALETTES.includes(value)) return value;
  problems.add(
    "model_palette_unknown",
    "/edition/palette",
    `must be one of ${PALETTES.join(", ")}, or an object of ground, ink, dye and accent`,
  );
  return null;
}

/**
 * Validate a model's optional `edition` into its style and palette, each null when the model
 * leaves it to the build. Problems are added to the model's one collection, at JSON pointers
 * under `/edition`.
 * @param {unknown} value
 * @param {{ add: Function, fields: Function }} problems
 * @returns {Readonly<{ style: string | null, palette: string | Readonly<Roles> | null }>}
 */
export function readEdition(value, problems) {
  if (value === undefined || !problems.fields(value, "/edition", [], ["style", "palette"]))
    return NO_EDITION;
  const edition = /** @type {{ style?: string, palette?: unknown }} */ (value);
  const style =
    edition.style !== undefined && STYLES.includes(edition.style) ? edition.style : null;
  if (style === null && edition.style !== undefined)
    problems.add("model_style_unknown", "/edition/style", `must be one of ${STYLES.join(", ")}`);
  return Object.freeze({ style, palette: readPalette(edition.palette, problems) });
}

/** The house palette's tokens: the 0.12 house's own, which it derives nothing from. */
const HOUSE_TOKENS = Object.freeze({
  palette: Object.freeze({ ...HOUSE.palette }),
  figure: Object.freeze({ ...HOUSE.figure }),
  dye: Object.freeze({ ...HOUSE.dye }),
});

/** A palette's tokens mixed from its roles, named as the 0.12 house names them. */
function derive(roles) {
  const toward = (share) => mix(roles.ink, roles.ground, share);
  return Object.freeze({
    palette: Object.freeze({
      paper: roles.ground,
      ink: roles.ink,
      green: roles.dye[2],
      mid: toward(TOWARD_GROUND.mid),
      soft: toward(TOWARD_GROUND.soft),
      rule: toward(TOWARD_GROUND.rule),
      ochre: roles.accent,
    }),
    figure: Object.freeze({
      card: mix(roles.ground, "#ffffff", CARD_TOWARD_WHITE),
      cardStroke: toward(TOWARD_GROUND.cardStroke),
      outside: toward(TOWARD_GROUND.outside),
      outsideStroke: toward(TOWARD_GROUND.outsideStroke),
      outsideMark: toward(TOWARD_GROUND.outsideMark),
      boundary: toward(TOWARD_GROUND.boundary),
      retired: toward(TOWARD_GROUND.retired),
      shadow: roles.ink,
    }),
    dye: Object.freeze({ new: roles.dye[0], mid: roles.dye[1], old: roles.dye[2] }),
  });
}

/**
 * Resolve a valid palette to its roles and tokens: null is the default, indigo; a name is a
 * built-in palette; roles are a custom palette. The house palette keeps the 0.12 tokens exactly,
 * so a 0.12 plate set in it is unchanged; every other palette derives its tokens from its roles.
 * @param {string | Roles | null} spec
 */
export function resolvePalette(spec) {
  const chosen = spec ?? DEFAULT_PALETTE;
  const name = typeof chosen === "string" ? chosen : "custom";
  const given = typeof chosen === "string" ? HOUSE.palettes[chosen] : chosen;
  const roles = Object.freeze({
    ground: lower(given.ground),
    ink: lower(given.ink),
    dye: Object.freeze(given.dye.map(lower)),
    accent: lower(given.accent ?? given.dye[2]),
  });
  const tokens = name === HOUSE.housePalette ? HOUSE_TOKENS : derive(roles);
  return Object.freeze({ name, roles, tokens });
}
