import fs from "node:fs";

/**
 * The data's format, as its schema states it: the one statement of the data's members and of every object in it,
 * each object's keys in their order and those it requires. The data is written in the shape it states, and the
 * tests hold every data file they build to all its rules.
 */
export const FORMAT = JSON.parse(
  fs.readFileSync(new URL("./data.schema.json", import.meta.url), "utf8"),
);

/**
 * The schema's node at a JSON pointer, `#/$defs/fact` or `/properties/evidence`; the whole schema at `""`.
 * @param {string} pointer
 * @returns {any}
 */
export const nodeAt = (pointer) =>
  pointer
    .replace(/^#/u, "")
    .split("/")
    .slice(1)
    .reduce((node, key) => node[key], FORMAT);

/** The node a definition stands for: the one it refers to, or itself. */
const resolved = (/** @type {any} */ definition) =>
  definition.$ref ? resolved(nodeAt(definition.$ref)) : definition;

/** Whether a definition lets a value be null: one of its forms does, or it states no type at all. */
const admitsNull = (/** @type {any} */ definition) => {
  const node = resolved(definition);
  return node.anyOf
    ? node.anyOf.some(admitsNull)
    : node.type === undefined || [node.type].flat().includes("null");
};

/**
 * The fields of a record that a definition lists, by the same names: what the data takes of a record that holds
 * more than it does, as the model, a view of the plan, an entry of the catalogue or the guide's summary.
 * @param {any} definition a node of the data's schema that lists keys
 * @param {Record<string, unknown>} record
 */
export const fieldsOf = (definition, record) =>
  Object.fromEntries(Object.keys(resolved(definition).properties).map((key) => [key, record[key]]));

/**
 * A value in the shape its definition states, at every depth: an object with the keys its definition lists, in
 * their order, each value shaped by its own definition, and then any other key, shaped by the definition of the
 * others' values, as a map's entries are; a list with each item shaped by the definition of its items. A key whose
 * value is undefined is absent, and so is a listed key whose value is null where its definition does not let it be
 * null. Of a choice of forms, an object takes the form that is an object. A value of another kind stands as it is.
 *
 * An object that holds a key its definition does not list where the definition is closed
 * (`additionalProperties: false`), or lacks a key it requires, is a fault of the publisher, not of its input:
 * nothing is written, and the error names the key and where in the data it stands.
 * @param {any} definition a node of the data's schema
 * @param {unknown} value
 * @param {string} [at] where in the data the value stands, `""` for the whole
 * @returns {any}
 */
export function shaped(definition, value, at = "") {
  const node = resolved(definition);
  if (Array.isArray(value))
    return value.map((item, index) => shaped(node.items ?? {}, item, `${at}/${index}`));
  if (value === null || typeof value !== "object") return value;
  const form = node.anyOf?.map(resolved).find(({ type }) => type === "object") ?? node;
  const { properties = {}, required = [], additionalProperties: others = {} } = form;
  const record = /** @type {Record<string, unknown>} */ (value);
  const held = (/** @type {string} */ key) =>
    record[key] !== undefined && (record[key] !== null || admitsNull(properties[key]));
  const unlisted = Object.keys(record).filter(
    (key) => record[key] !== undefined && !Object.hasOwn(properties, key),
  );
  if (others === false && unlisted.length)
    throw new Error(`The data's format lists no key ${unlisted[0]} at ${at || "/"}.`);
  const lacking = required.find((/** @type {string} */ key) => !held(key));
  if (lacking)
    throw new Error(
      `The data's format requires the key ${lacking} at ${at || "/"}, and it has no value.`,
    );
  const entry = (/** @type {string} */ key, /** @type {any} */ of) => [
    key,
    shaped(of, record[key], `${at}/${key}`),
  ];
  return Object.fromEntries([
    ...Object.keys(properties)
      .filter(held)
      .map((key) => entry(key, properties[key])),
    ...unlisted.map((key) => entry(key, others)),
  ]);
}
