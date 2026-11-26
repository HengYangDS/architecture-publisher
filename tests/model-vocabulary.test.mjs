import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import SCHEMA from "../src/model/schema.json" with { type: "json" };
import * as VOCABULARY from "../src/model/vocabulary.mjs";

// The queue item `derived-references`: the patterns and limits a model's value is held to are stated once, in its
// schema, and the loader reads them from there. This walks the schema for what it states and refuses a pattern or
// a longest length of it written again in the model's modules; and it holds the schema to the rules of one value
// the loader keeps.

const MODEL = fileURLToPath(new URL("../src/model/", import.meta.url));

/** Every value the schema states under one of the keys, wherever it stands. */
function stated(/** @type {string[]} */ keys, /** @type {unknown} */ node = SCHEMA) {
  if (node === null || typeof node !== "object") return [];
  return Object.entries(node).flatMap(([key, value]) =>
    keys.includes(key) && typeof value !== "object" ? [value] : stated(keys, value),
  );
}
/** Each pattern as the schema writes it and as a regular expression's source writes it (a slash escaped). */
const PATTERNS = new Set(
  stated(["pattern"]).flatMap((source) => [source, new RegExp(source, "u").source]),
);
const LIMITS = new Set(stated(["minLength", "maxLength", "minimum", "maximum", "const"]));

/** Every pattern and number the vocabulary exports, in its objects too. */
const exported = (/** @type {unknown} */ value) =>
  value instanceof RegExp || typeof value === "number"
    ? [value]
    : value !== null && typeof value === "object" && !Array.isArray(value)
      ? Object.values(value).flatMap(exported)
      : [];

test("each pattern and limit of the vocabulary is one the schema states", () => {
  for (const value of exported(VOCABULARY))
    if (value instanceof RegExp) assert.ok(PATTERNS.has(value.source), value.source);
    else assert.ok(LIMITS.has(value), String(value));
  assert.deepEqual(VOCABULARY.STATUSES, SCHEMA.$defs.status.enum);
  assert.deepEqual(
    VOCABULARY.CATEGORIES,
    SCHEMA.properties.kinds.additionalProperties.properties.category.enum,
  );
});

test("a stretch's tracks have the same limits counted and named", () => {
  const [counted, named] =
    SCHEMA.$defs.overviewCourse.properties.parallel.items.properties.tracks.oneOf;
  assert.deepEqual([named.minItems, named.maxItems], [counted.minimum, counted.maximum]);
});

test("the schema refuses the values the loader refuses by a rule of one value", () => {
  const holds = (/** @type {string} */ pattern, /** @type {string} */ value) =>
    new RegExp(pattern, "u").test(value);
  const { text, path: path_ } = SCHEMA.$defs;
  const UNPORTABLE = SCHEMA.properties.id.allOf[1].not.pattern;
  assert.ok(holds(text.pattern, "a b") && !holds(text.not.pattern, "a b"));
  assert.ok(holds(text.not.pattern, "a\u0000b"));
  for (const refused of ["src//a.mjs", "src\u2028//a.mjs", "src\u2029/../a.mjs", "/a", "a\\b"])
    assert.ok(!holds(path_.pattern, refused), JSON.stringify(refused));
  for (const accepted of ["src/a.mjs", "src/"]) assert.ok(holds(path_.pattern, accepted), accepted);
  for (const refused of ["con", "lpt1.txt", "shop."])
    assert.ok(holds(UNPORTABLE, refused), refused);
  assert.ok(!holds(UNPORTABLE, "console"));
});

test("no model module but the vocabulary writes a pattern or a longest length of the schema", async () => {
  const lengths = stated(["maxLength"]).map(String);
  const repeats = [];
  for (const name of (await readdir(MODEL)).filter((each) => each.endsWith(".mjs"))) {
    if (name === "vocabulary.mjs") continue;
    const text = (await readFile(path.join(MODEL, name), "utf8"))
      .replace(/\/\*[\s\S]*?\*\//gu, "")
      .replace(/^\s*\/\/.*$/gmu, "");
    for (const pattern of PATTERNS)
      if (text.includes(pattern)) repeats.push(`${name} repeats ${pattern}`);
    // A length is a number standing alone: `4 * 1024 * 1024` is a size in bytes, not the path's limit.
    for (const length of lengths)
      if (new RegExp(`(?<![\\d*] ?)\\b${length}\\b(?! ?\\*)`, "u").test(text))
        repeats.push(`${name} repeats ${length}`);
  }
  assert.deepEqual(repeats, []);
});

test("the model's checks read every object's fields and every list's fewest items the schema states", async () => {
  // A positive contract: each object of the schema with fields, and each list with a fewest number of items, is read
  // by `fieldsOf`, `leastOf` or `sizeOf` when the loader is imported. A list written by hand leaves its object unread
  // here; fields written by hand are refused by the type check, since they lack the mark `fieldsOf` gives.
  await import("../src/model/load.mjs");
  const { fields, lengths } = VOCABULARY.readPointers();
  /** The pointers of the schema's nodes that hold a key, wherever they stand. */
  const holding = (/** @type {string} */ key, /** @type {unknown} */ node = SCHEMA, at = "") =>
    node === null || typeof node !== "object"
      ? []
      : [
          ...(key in node && !Array.isArray(node) ? [at] : []),
          ...Object.entries(node).flatMap(([name, value]) => holding(key, value, `${at}/${name}`)),
        ];
  const objects = holding("properties").filter((at) => !at.endsWith("/properties"));
  assert.deepEqual([...new Set(fields)].sort(), objects.sort());
  // The named tracks' fewest is held equal to the counted tracks' by the test of a stretch's tracks.
  const named = "/$defs/overviewCourse/properties/parallel/items/properties/tracks/oneOf/1";
  assert.deepEqual([...new Set([...lengths, named])].sort(), holding("minItems").sort());
});

test("each definition of the schema is one the model refers to", () => {
  // A pointer names a definition directly; a definition no `$ref` reaches would be read while the model is checked
  // against another.
  const refs = JSON.stringify(SCHEMA).match(/"\$ref":"#\/\$defs\/[^"]+"/gu) ?? [];
  const reached = new Set(refs.map((ref) => ref.slice('"$ref":"#/$defs/'.length, -1)));
  assert.deepEqual(
    Object.keys(SCHEMA.$defs).filter((name) => !reached.has(name)),
    [],
  );
});
