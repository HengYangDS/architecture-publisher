// The blocks references.mjs writes from the data's format: the data reference's tables of the data's members and of
// the keys of each entry it sets out, as the data's schema states them with their descriptions
// (src/pinned/data.schema.json), and the ids a model may not take, as a delivery's files decide them
// (src/delivery.json).
import { deliveryFiles } from "./delivery.mjs";
import { code, either, listed, readJson, table } from "./text.mjs";

const SCHEMA = "src/pinned/data.schema.json";

// The tables of the data reference, each by the node of the schema whose keys it sets out, after the node's
// description: the data's members, then each entry the reference sets out by itself. An object no table sets out is
// written into the row of the key that holds it, as its keys.
const TABLES = Object.freeze([
  { name: "members", head: "Member", at: "" },
  { name: "component", head: "Key", at: "#/$defs/component" },
  { name: "relation", head: "Key", at: "#/$defs/relation" },
  { name: "group", head: "Key", at: "#/$defs/group" },
  { name: "fact", head: "Key", at: "#/$defs/fact" },
  { name: "evidence", head: "Key", at: "#/$defs/evidenceRow" },
  { name: "guide", head: "Key", at: "#/$defs/guide" },
  { name: "plate", head: "Key", at: "#/$defs/plate" },
  { name: "face", head: "Key", at: "#/$defs/face" },
  { name: "face-relation", head: "Key", at: "#/$defs/faceRelation" },
]);

/**
 * The data reference's blocks, read from the tree at `root`.
 * @param {string} root
 */
export async function dataBlocks(root) {
  const schema = await readJson(root, SCHEMA);
  /** The schema's node at a pointer, `#/$defs/fact`; the whole schema at `""`. */
  const nodeAt = (/** @type {string} */ pointer) =>
    pointer
      .replace(/^#/u, "")
      .split("/")
      .slice(1)
      .reduce((/** @type {any} */ node, key) => node?.[key], schema);
  const tabled = new Set(TABLES.map(({ at }) => at));
  /** @type {(node: any) => any} A node with the node its reference names in place of the reference. */
  const resolved = (node) => (node.$ref ? resolved(nodeAt(node.$ref)) : node);
  /** @type {(node: any) => any} The object a value holds that no table sets out: itself, an item's, a nullable's. */
  const untabled = (node) => {
    if (tabled.has(node.$ref)) return null;
    const own = resolved(node);
    if (own.items) return untabled(own.items);
    if (own.anyOf) return own.anyOf.map(untabled).find(Boolean) ?? null;
    return own.properties ? own : null;
  };
  /** The values a node fixes, as code: those it enumerates, or its constant. */
  const fixed = (/** @type {any} */ node) => {
    const own = resolved(node);
    const values = own.enum ?? ("const" in own ? [own.const] : null);
    return values?.map((/** @type {unknown} */ value) =>
      code(typeof value === "string" ? value : JSON.stringify(value)),
    );
  };
  /** @type {(object: any) => string} An object's keys as a sentence lists them, each with what it fixes or holds. */
  const keysOf = (object) =>
    listed(
      Object.entries(object.properties).map(([key, node]) => {
        const values = fixed(node);
        const inner = untabled(node);
        if (values) return `${code(key)} (${either(values)})`;
        return inner ? `${code(key)} (${keysOf(inner)})` : code(key);
      }),
    );
  /** A node's description, or its reference's; the writer stops on a node the schema says nothing of, naming it. */
  const described = (/** @type {any} */ node, /** @type {string} */ where) => {
    const said = node.description ?? resolved(node).description;
    if (!said)
      throw new Error(`references_description_missing: ${SCHEMA} says nothing of ${where}`);
    return said;
  };
  /** What a key holds: its description, ending in the values it fixes or the keys of the object it holds. */
  const holds = (/** @type {any} */ node, /** @type {string} */ where) => {
    const values = fixed(node);
    const inner = untabled(node);
    const tail = values ? either(values) : inner && keysOf(inner);
    const said = described(node, where);
    return tail ? `${said.replace(/\.$/u, "")}: ${tail}.` : said;
  };
  /** A table of the reference: the description of the node it sets out, then each of its keys with what it holds. */
  const keysTable = (/** @type {string} */ head, /** @type {string} */ at) => () => {
    const node = resolved(nodeAt(at));
    const rows = Object.entries(node.properties).map(([key, each]) => [
      code(key),
      holds(each, `${at || "#"}/properties/${key}`),
    ]);
    return `${described(node, at || "#")}\n\n${table([head, "Holds"], rows)}`;
  };

  // The ids a model may not take, and each name two files of its delivery would then share (src/delivery.json).
  const { taken } = await deliveryFiles(root);
  const takenSentence = () =>
    `A model whose id is ${either(taken.ids.map(code))} would give two files of its delivery one name: ${listed(taken.clashes.map((/** @type {any} */ { file, one, other }) => `${code(file)} would be both ${one} and ${other}`))}.`;

  return [
    {
      file: "docs/reference/data.md",
      name: "taken",
      source: "src/delivery.json",
      text: takenSentence,
    },
    ...TABLES.map(({ name, head, at }) => ({
      file: "docs/reference/data.md",
      name,
      source: SCHEMA,
      text: keysTable(head, at),
    })),
  ];
}
