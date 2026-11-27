import assert from "node:assert/strict";
import test from "node:test";
import FORMAT from "../src/pinned/data.schema.json" with { type: "json" };
import { editionData } from "../src/pinned/data.mjs";
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { RULE_KEYWORDS, formatProblems, unreadKeywords } from "./fixtures/data-format.mjs";
import { CITATIONS, GUIDE, READ, shopBuild } from "./fixtures/pinned.mjs";

// The data's schema is the delivery format's one statement of the data: its members and the keys of each entry, in
// their order, with their types and descriptions. The data a build writes holds to it, and the check that holds it
// reads every rule the schema states.

const FIGURES = Object.freeze({
  state: "verified",
  nodes: [{ file: "parts.architecture.json", id: "parts-sync", components: ["sync"] }],
  connections: [
    {
      file: "parts.architecture.json",
      id: "persists",
      from: "parts-sync",
      to: "parts-store",
      relations: ["sync-store"],
    },
  ],
  unmatched: {
    nodes: [{ file: "parts.architecture.json", id: "parts-cloud" }],
    connections: [{ file: "parts.architecture.json", from: "parts-cloud", to: "parts-sync" }],
  },
});
const OVERVIEW = Object.freeze({
  statement: "5".repeat(64),
  images: [{ width: 3840, file: "images/00-overview.png" }],
});

/** The data of the shop as a build writes it, with a guide and an overview unless it is told otherwise. */
async function shopData(
  locale,
  { verified = true, typeset = true, guide = true, page = false } = {},
) {
  const built = await shopBuild(locale, { verified, typeset });
  const evidence = evidenceTable({
    records: built.binding.records,
    citations: guide ? CITATIONS : [],
    read: verified ? READ : new Map(),
  });
  return editionData({
    ...built.input,
    evidence,
    guide: guide
      ? { ...GUIDE, sources: verified ? "verified" : "declared", figures: FIGURES }
      : null,
    overview: page ? null : OVERVIEW,
    ...(page ? { plates: [], media: ["page"] } : {}),
  });
}

test("the data a build writes holds to the schema, in each language, with and without a checkout, a typeset edition and a guide", async () => {
  for (const locale of ["en", "zh-CN"])
    for (const verified of [true, false])
      for (const typeset of [true, false])
        for (const guide of [true, false]) {
          const data = await shopData(locale, { verified, typeset, guide });
          assert.deepEqual(formatProblems(data), [], `${locale} ${verified} ${typeset} ${guide}`);
        }
  const paged = await shopData("en", { page: true });
  assert.deepEqual(formatProblems(paged), []);
  // A page alone holds every member but the overview, and an edition with an overview holds them all.
  assert.deepEqual(
    Object.keys(paged),
    Object.keys(FORMAT.properties).filter((member) => member !== "overview"),
  );
  assert.deepEqual(Object.keys(await shopData("en")), Object.keys(FORMAT.properties));
});

test("a member or key the schema lacks is refused, as are keys out of its order, a key it requires absent and a value of another type", async () => {
  const data = await shopData("en");
  const changed = structuredClone(data);
  changed.written = "2026-11-28";
  changed.plates[0].face.components[0].box.depth = 1;
  const { title, ...rest } = changed.work;
  changed.work = { title, ...rest };
  delete changed.pin.state;
  changed.evidence[0].state = "read";
  changed.plates[0].face.relations[0].label = "none";
  changed.facts[0].of = "edition";
  changed.evidence[1].ranges[0].lines = [10];
  assert.deepEqual(formatProblems(changed), [
    "/: holds written, which the schema does not state",
    "/work: holds title, id, locale, question, summary, scope, limits, editors, license, coverage, out of the schema's order",
    "/pin: lacks state",
    "/facts/0/of: is not object",
    "/evidence/0/state: is none of its values",
    "/evidence/1/ranges/0/lines: holds 1 items",
    "/plates/0/face/components/0/box: holds depth, which the schema does not state",
    "/plates/0/face/relations/0/label: is of none of its forms",
  ]);
  // A part of the data is held where the schema says it stands.
  assert.deepEqual(formatProblems(data.evidence, "/properties/evidence"), []);
  assert.deepEqual(formatProblems([{ path: "a" }], "/properties/evidence"), [
    "/0: lacks state",
    "/0: lacks relations",
    "/0: lacks ranges",
  ]);
});

test("each keyword the check reads refuses a value that breaks it", () => {
  /** For each rule keyword: a place in the schema where it stands, a value that breaks it there, and the problem. */
  const cases = {
    $ref: ["/properties/guide", 5, "/: is not object"],
    anyOf: ["/$defs/faceRelation/properties/label", "none", "/: is of none of its forms"],
    type: ["/properties/delivery/properties/version", "1", "/: is not integer"],
    enum: ["/properties/pin/properties/state", "read", "/: is none of its values"],
    const: ["/properties/overview/properties/face", true, "/: is not false"],
    items: ["/properties/media", [5], "/0: is not string"],
    minItems: [
      "/$defs/evidenceRow/properties/ranges/items/properties/lines",
      [10],
      "/: holds 1 items",
    ],
    maxItems: [
      "/$defs/evidenceRow/properties/ranges/items/properties/lines",
      [1, 2, 3],
      "/: holds 3 items",
    ],
    properties: ["/properties/delivery", { format: 5, version: 1 }, "/format: is not string"],
    required: ["/properties/delivery", { format: "archpub" }, "/: lacks version"],
    additionalProperties: [
      "/properties/delivery",
      { format: "archpub", version: 1, channel: "x" },
      "/: holds channel, which the schema does not state",
    ],
  };
  assert.deepEqual(Object.keys(cases), RULE_KEYWORDS);
  for (const [keyword, [pointer, value, problem]] of Object.entries(cases))
    assert.deepEqual(formatProblems(value, pointer), [problem], keyword);
});

test("every object the data writes is closed: a form that lists keys refuses any other", () => {
  /** Every object form of the schema, by its pointer: a node of type object, or one that lists keys. */
  const objects = (/** @type {any} */ node, at = "") =>
    node === null || typeof node !== "object"
      ? []
      : [
          ...(node.type === "object" || node.properties ? [[at, node]] : []),
          ...Object.entries(node).flatMap(([key, each]) => objects(each, `${at}/${key}`)),
        ];
  // A form that lists no keys is a map of names, each value of its own definition, as a statement's details.
  const open = objects(FORMAT)
    .filter(([, node]) =>
      node.properties
        ? node.additionalProperties !== false
        : typeof node.additionalProperties !== "object",
    )
    .map(([at]) => at);
  assert.deepEqual(open, []);
});

test("the check reads every keyword the schema states, and the schema describes every member and key", () => {
  assert.deepEqual(unreadKeywords(), []);
  // A keyword the check does not read is named by its place, so a rule the schema gains cannot pass unread.
  assert.deepEqual(unreadKeywords({ properties: { id: { type: "string", pattern: "^a" } } }), [
    "/properties/id/pattern",
  ]);
  /** The pointers of the properties that say nothing of themselves, here or where they refer. */
  const undescribed = (/** @type {any} */ node, at = "") =>
    node === null || typeof node !== "object"
      ? []
      : Object.entries(node).flatMap(([key, value]) => [
          ...(key === "properties"
            ? Object.entries(value)
                .filter(([, each]) => !each.description && !each.$ref)
                .map(([name]) => `${at}/properties/${name}`)
            : []),
          ...undescribed(value, `${at}/${key}`),
        ]);
  assert.deepEqual(undescribed(FORMAT), []);
  for (const [name, node] of Object.entries(FORMAT.$defs))
    assert.ok(node.description, `$defs/${name}`);
});
