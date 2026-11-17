import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

/** The names a property would have if it said where something stands on a page, or how large. */
const POSITION = new Set([
  "x",
  "y",
  "dx",
  "dy",
  "left",
  "right",
  "top",
  "bottom",
  "row",
  "column",
  "position",
  "coordinate",
  "coordinates",
  "offset",
  "width",
  "height",
]);

/**
 * The properties of a JSON Schema that are named for a position, each by its place in the schema.
 * @param {unknown} schema
 * @param {string} [at]
 * @returns {string[]}
 */
function positionProperties(schema, at = "") {
  if (Array.isArray(schema))
    return schema.flatMap((each, index) => positionProperties(each, `${at}/${index}`));
  if (schema === null || typeof schema !== "object") return [];
  const found = [];
  for (const [key, value] of Object.entries(schema)) {
    if (key === "properties" && value !== null && typeof value === "object")
      for (const name of Object.keys(value))
        if (POSITION.has(name)) found.push(`${at}/properties/${name}`);
    found.push(...positionProperties(value, `${at}/${key}`));
  }
  return found;
}

test("a property named for a coordinate is found with its place in the schema", () => {
  const placed = {
    properties: { views: { items: { properties: { id: {}, x: { type: "number" } } } } },
  };
  assert.deepEqual(positionProperties(placed), ["/properties/views/items/properties/x"]);
  const plain = {
    properties: { label: {} },
    $defs: { part: { properties: { kind: {} } } },
    required: ["label"],
  };
  assert.deepEqual(positionProperties(plain), []);
});

test("the model's schema holds no property of position", async () => {
  const schema = JSON.parse(await fs.readFile(path.join(root, "src/model/schema.json"), "utf8"));
  assert.deepEqual(positionProperties(schema), []);
});
