import { FORMAT, nodeAt } from "../../src/pinned/format.mjs";

/**
 * The data held to its format, as the data's schema states it: each object's keys those its `properties` list, in
 * their order, its required keys present, and every value of its type, of its fixed values and of its length. The
 * schema is read as the model's checks read the model's: the rules are the schema's, and the check is this code, with
 * no validator beside it. It reads the rule keywords below; the schema may state those and the describing ones, and
 * any other is named, so the schema can state no rule the check passes over.
 */

/** The keywords the check reads, each a rule the data is held to; each has its own refusal among the tests. */
export const RULE_KEYWORDS = Object.freeze([
  ...["$ref", "anyOf", "type", "enum", "const", "items", "minItems", "maxItems"],
  ...["properties", "required", "additionalProperties"],
]);

/** The keywords that only describe, or hold the definitions the rules refer to: the check reads no rule in them. */
const DESCRIBING_KEYWORDS = Object.freeze(["$schema", "$comment", "$defs", "title", "description"]);

/** A value's test for each type the schema names. */
const TYPES = Object.freeze({
  object: (/** @type {unknown} */ value) =>
    value !== null && typeof value === "object" && !Array.isArray(value),
  array: Array.isArray,
  string: (/** @type {unknown} */ value) => typeof value === "string",
  integer: Number.isInteger,
  number: Number.isFinite,
  boolean: (/** @type {unknown} */ value) => typeof value === "boolean",
  null: (/** @type {unknown} */ value) => value === null,
});

/** A problem as the check reports it: the path of the value in the data, `/` for the whole, and what is wrong. */
const problem = (/** @type {string} */ at, /** @type {string} */ what) => `${at || "/"}: ${what}`;

/**
 * What in a value breaks the rules of one node of the schema.
 * @param {unknown} value
 * @param {any} node
 * @param {string} at the value's path in the data
 * @returns {string[]}
 */
function broken(value, node, at) {
  if (node.$ref) return broken(value, nodeAt(node.$ref), at);
  if (node.anyOf)
    return node.anyOf.some((/** @type {any} */ form) => !broken(value, form, at).length)
      ? []
      : [problem(at, "is of none of its forms")];
  const types = [node.type ?? []].flat();
  if (types.length && !types.some((/** @type {keyof typeof TYPES} */ type) => TYPES[type](value)))
    return [problem(at, `is not ${types.join(" or ")}`)];
  if (node.enum && !node.enum.includes(value)) return [problem(at, "is none of its values")];
  if ("const" in node && value !== node.const)
    return [problem(at, `is not ${JSON.stringify(node.const)}`)];
  if (Array.isArray(value)) return listBroken(value, node, at);
  return TYPES.object(value) ? objectBroken(/** @type {any} */ (value), node, at) : [];
}

/** What in a list breaks its node: its length, and each item. */
function listBroken(
  /** @type {unknown[]} */ list,
  /** @type {any} */ node,
  /** @type {string} */ at,
) {
  const problems = [];
  if (list.length < (node.minItems ?? 0) || list.length > (node.maxItems ?? Infinity))
    problems.push(problem(at, `holds ${list.length} items`));
  if (node.items)
    list.forEach((item, index) => problems.push(...broken(item, node.items, `${at}/${index}`)));
  return problems;
}

/** What in an object breaks its node: a key it does not state, a required key absent, the keys' order, each value. */
function objectBroken(
  /** @type {Record<string, unknown>} */ object,
  /** @type {any} */ node,
  /** @type {string} */ at,
) {
  const stated = Object.keys(node.properties ?? {});
  const keys = Object.keys(object);
  const held = keys.filter((key) => stated.includes(key));
  const problems = [
    ...keys
      .filter((key) => !stated.includes(key) && node.additionalProperties === false)
      .map((key) => problem(at, `holds ${key}, which the schema does not state`)),
    ...(node.required ?? [])
      .filter((/** @type {string} */ key) => !keys.includes(key))
      .map((/** @type {string} */ key) => problem(at, `lacks ${key}`)),
    ...(held.join() === stated.filter((key) => held.includes(key)).join()
      ? []
      : [problem(at, `holds ${held.join(", ")}, out of the schema's order`)]),
  ];
  for (const key of keys)
    if (stated.includes(key))
      problems.push(...broken(object[key], node.properties[key], `${at}/${key}`));
    else if (typeof node.additionalProperties === "object")
      problems.push(...broken(object[key], node.additionalProperties, `${at}/${key}`));
  return problems;
}

/**
 * What in a value breaks the data's format, each problem as its path in the value and what is wrong; none when the
 * value holds to it. The whole data by default, or a part of it where a pointer of the schema says it stands.
 * @param {unknown} value
 * @param {string} [pointer] the value's node in the schema, `/properties/evidence` for the evidence table
 */
export const formatProblems = (value, pointer = "") => broken(value, nodeAt(pointer), "");

/**
 * The keywords the schema states that are neither a rule the check reads nor one that only describes, each by its
 * pointer: none, so that every rule of the schema is one the data is held to. A map of names, `properties` or
 * `$defs`, holds names, not keywords.
 * @param {unknown} node
 * @returns {string[]}
 */
export function unreadKeywords(node = FORMAT, at = "") {
  if (node === null || typeof node !== "object") return [];
  if (Array.isArray(node))
    return node.flatMap((each, index) => unreadKeywords(each, `${at}/${index}`));
  return Object.entries(node).flatMap(([key, value]) => {
    if (!RULE_KEYWORDS.includes(key) && !DESCRIBING_KEYWORDS.includes(key)) return [`${at}/${key}`];
    if (key === "properties" || key === "$defs")
      return Object.entries(value).flatMap(([name, each]) =>
        unreadKeywords(each, `${at}/${key}/${name}`),
      );
    return unreadKeywords(value, `${at}/${key}`);
  });
}
