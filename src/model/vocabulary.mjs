import fs from "node:fs";

/**
 * The model's vocabulary, as its schema states it: the format and version, the enumerations, and the patterns and
 * limits that the loader holds a single value to. The schema `schema.json` is the one statement; the loader reads
 * them from it, so the published schema refuses every value the loader refuses by a rule of that value alone (the
 * queue item `derived-references`). The loader keeps its own checks and problem codes; this module gives them their
 * values. A length is counted by the loader in UTF-16 units and by a JSON Schema validator in code points, so the
 * loader is the stricter for a character outside the Basic Multilingual Plane.
 */
const SCHEMA = JSON.parse(fs.readFileSync(new URL("./schema.json", import.meta.url), "utf8"));

/** The schema's value at a JSON pointer, refused at import unless it is of the kind the loader needs. */
function at(/** @type {string} */ pointer, /** @type {(value: unknown) => boolean} */ kind) {
  const value = pointer
    .split("/")
    .slice(1)
    .reduce((/** @type {any} */ node, key) => node?.[key], SCHEMA);
  if (!kind(value)) throw new Error(`the model's schema states no such value at ${pointer}`);
  return value;
}
/** A pattern of the schema as the loader tests it: the same expression, in Unicode mode. */
const pattern = (/** @type {string} */ pointer) =>
  new RegExp(
    at(pointer, (value) => typeof value === "string"),
    "u",
  );
const limit = (/** @type {string} */ pointer) =>
  /** @type {number} */ (at(pointer, Number.isInteger));
const names = (/** @type {string} */ pointer) =>
  Object.freeze(
    /** @type {string[]} */ (
      at(
        pointer,
        (value) => Array.isArray(value) && value.every((each) => typeof each === "string"),
      )
    ),
  );

/** The model's format and version, the two constants of its top level. */
export const MODEL_FORMAT = /** @type {string} */ (
  at("/properties/format/const", (value) => typeof value === "string")
);
export const MODEL_VERSION = limit("/properties/version/const");

/** The categories a kind takes, in the schema's order. */
export const CATEGORIES = names("/properties/kinds/additionalProperties/properties/category/enum");
/** The category of a kind that names none. */
export const DEFAULT_CATEGORY = /** @type {string} */ (
  at("/properties/kinds/additionalProperties/properties/category/default", (value) =>
    CATEGORIES.includes(/** @type {string} */ (value)),
  )
);
/** The palette of an edition that names none: one of the house's palettes, which the schema's are written from. */
export const DEFAULT_PALETTE = /** @type {string} */ (
  at("/properties/edition/properties/palette/default", (value) =>
    names("/properties/edition/properties/palette/oneOf/0/enum").includes(
      /** @type {string} */ (value),
    ),
  )
);
/** The statuses a component or a relation takes. */
export const STATUSES = names("/$defs/status/enum");
/** The compositions a view may name for its plate. */
export const COMPOSITIONS = names("/properties/views/items/properties/composition/enum");

export const ID = pattern("/$defs/id/pattern");
/** A model's id that a file system cannot hold as a directory: a device's name, or a final dot. */
export const UNPORTABLE_ID = pattern("/properties/id/allOf/1/not/pattern");
export const ICON = pattern("/properties/kinds/additionalProperties/properties/icon/pattern");
export const REVISION = pattern("/properties/repository/properties/revision/pattern");
/** A browse address: one that holds both placeholders, `{revision}` and `{path}`. */
export const BROWSE = pattern("/properties/repository/properties/browse/pattern");
export const LICENSE = pattern("/properties/license/pattern");
export const DETAIL_NAME = pattern("/$defs/details/propertyNames/pattern");
/** A colour of a palette the model gives itself, `#rrggbb`. */
export const COLOR = pattern("/$defs/color/pattern");
/** A guide's name: an Archify explainer draft. */
export const GUIDE = pattern("/properties/guide/allOf/1/pattern");

/** A text: its length, the pattern it matches (not blank) and the pattern it may not match (a NUL). */
export const TEXT = Object.freeze({
  least: limit("/$defs/text/minLength"),
  most: limit("/$defs/text/maxLength"),
  visible: pattern("/$defs/text/pattern"),
  refused: pattern("/$defs/text/not/pattern"),
});
/** Whether a value is a text: every text of the model, a track's name among them, keeps to this one rule. */
export const isText = (/** @type {unknown} */ value) =>
  typeof value === "string" &&
  value.length >= TEXT.least &&
  value.length <= TEXT.most &&
  TEXT.visible.test(value) &&
  !TEXT.refused.test(value);

/** A relative path in the repository: its longest length and its pattern, which a directory's final slash meets. */
export const PATH = Object.freeze({
  most: limit("/$defs/path/maxLength"),
  form: pattern("/$defs/path/pattern"),
});
/** A path that is no glob: it holds none of `*`, `?` or `[`. */
export const NOT_GLOB = pattern("/$defs/claim/allOf/1/pattern");

/** The pointers of the objects and the lists whose fields and fewest items the model's checks have read. */
const read = Object.freeze({ fields: new Set(), lengths: new Set() });
/** What the model's checks have read so far, for the test that holds it to every object and list of the schema. */
export const readPointers = () =>
  Object.freeze({ fields: [...read.fields], lengths: [...read.lengths] });

/** The mark of an object's fields read from the schema: fields written by hand lack it, and the type check refuses them. */
const READ = Symbol("read from the model's schema");
/**
 * @typedef {{ readonly required: readonly string[], readonly optional: readonly string[], readonly read: typeof READ }} Fields
 */

/**
 * The fields an object of the model takes, as the schema's object at a pointer states them: its required fields in
 * the order the schema requires them, then the others in the order of its properties. The loader reports a missing
 * field in the first order, and offers the nearest name in the second when a field is misspelt.
 * @param {string} pointer
 * @returns {Fields}
 */
export function fieldsOf(pointer) {
  const object = at(
    pointer,
    (value) => value !== null && typeof value === "object" && "properties" in value,
  );
  /** @type {readonly string[]} */
  const required = "required" in object ? names(`${pointer}/required`) : Object.freeze([]);
  read.fields.add(pointer);
  return Object.freeze({
    required,
    optional: Object.freeze(
      Object.keys(object.properties).filter((key) => !required.includes(key)),
    ),
    read: READ,
  });
}

/**
 * The pointer of the one member of a schema's `oneOf` that requires a field: a block of the overview, a tier and a
 * palette are told apart by the fields they hold, so a member is named by one of them, not by its place.
 * @param {string} pointer
 * @param {string} field
 */
export function variantOf(pointer, field) {
  const members = at(`${pointer}/oneOf`, Array.isArray);
  const found = members.flatMap((member, index) =>
    member?.required?.includes(field) ? [`${pointer}/oneOf/${index}`] : [],
  );
  if (found.length !== 1)
    throw new Error(`the model's schema states no one member requiring ${field} at ${pointer}`);
  return found[0];
}

/** The fewest items of a list of the model, as the schema states them at the list's pointer. */
export function leastOf(/** @type {string} */ pointer) {
  const least = limit(`${pointer}/minItems`);
  read.lengths.add(pointer);
  return least;
}

/** The items of a list of one length, as the schema states it twice (its fewest and its most), refused unless equal. */
export function sizeOf(/** @type {string} */ pointer) {
  const size = leastOf(pointer);
  if (limit(`${pointer}/maxItems`) !== size)
    throw new Error(`the model's schema states no one length at ${pointer}`);
  return size;
}

/** The tracks of a stretch of the overview's course: two to four, counted or named; the test holds the two equal. */
const tracks = "/$defs/overviewCourse/properties/parallel/items/properties/tracks/oneOf/0";
export const TRACKS = Object.freeze({
  least: limit(`${tracks}/minimum`),
  most: limit(`${tracks}/maximum`),
});
