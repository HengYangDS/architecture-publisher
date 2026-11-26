import { chooseAmong } from "./choice.mjs";
import { GRID_KINDS, gridLayout } from "./guide-grid.mjs";
import { dataflowLayout, sequenceLayout } from "./guide-rows.mjs";
import { workflowLayout } from "./guide-workflow.mjs";
import { refuse } from "../refusal.mjs";

/**
 * The repository a guide's diagrams name: the model's address and revision, and the Forge and link mode the draft
 * names.
 * @typedef {{ url?: string | null, revision?: string | null, provider?: string | null, link_mode?: string | null }} Repository
 */

/** The fields that run a line: its sides, its route and the place of its label. */
const ROUTE = Object.freeze([
  "fromSide",
  "toSide",
  "route",
  "via",
  "labelAt",
  "labelDx",
  "labelDy",
  "labelSegment",
]);

/**
 * The fields a guide's file leaves to the publisher, by kind (the queue item `page-figures`): the coordinates and
 * sizes of the document and of each item of each list it holds, and the course of each line, as the bundled
 * Archify's schemas name them, with the repository the publisher fills from the model. A tree's direction, a line's
 * weight and every word stay the author's. A workflow's phases and groups span columns the publisher sets, and a sequence's
 * segments and activations span heights it sets, so a guide's file states none of them.
 */
const PUBLISHERS = Object.freeze({
  architecture: {
    document: ["layout", "meta.viewBox"],
    components: ["pos", "size", "row", "col"],
    boundaries: ["pad"],
    connections: ROUTE,
  },
  erd: {
    document: ["layout", "meta.viewBox"],
    entities: ["pos", "row", "col", "width"],
    relationships: ROUTE,
  },
  class: {
    document: ["layout", "meta.viewBox"],
    types: ["pos", "row", "col", "width"],
    relationships: ROUTE,
  },
  workflow: {
    document: ["phases", "groups", "meta.viewBox"],
    nodes: ["col", "width", "height", "yOffset"],
    edges: [...ROUTE, "channelX", "channelY", "bias"],
  },
  timeline: { document: ["layout.width"] },
  waterfall: { document: ["layout.width"] },
  tree: {
    document: ["layout.gapX", "layout.gapY", "layout.nodeW", "layout.nodeMaxW", "meta.viewBox"],
  },
  dataflow: {
    document: ["meta.viewBox"],
    nodes: ["row", "width", "height", "yOffset"],
    flows: [...ROUTE, "channelX", "channelY"],
  },
  sequence: {
    document: ["meta.viewBox", "meta.column_fit", "segments", "activations"],
    messages: ["y"],
  },
  lifecycle: {},
});

/**
 * The JSON paths of the fields a document of its kind states that the publisher sets.
 * @param {keyof typeof PUBLISHERS} kind
 * @param {any} document
 */
export function publishersPaths(kind, document) {
  const { document: own = [], ...lists } = /** @type {Record<string, readonly string[]>} */ (
    PUBLISHERS[kind]
  );
  const stated = (/** @type {any} */ value, /** @type {string[]} */ keys) =>
    keys.every((key) => {
      const held = value?.constructor === Object && key in value;
      value = held ? value[key] : undefined;
      return held;
    });
  return [
    ...[...own, "meta.repository"]
      .filter((dotted) => stated(document, dotted.split(".")))
      .map((dotted) => `/${dotted.replaceAll(".", "/")}`),
    ...Object.entries(lists).flatMap(([list, keys]) =>
      (Array.isArray(document[list]) ? document[list] : []).flatMap(
        (/** @type {any} */ item, index) =>
          item?.constructor === Object
            ? keys.filter((key) => key in item).map((key) => `/${list}/${index}/${key}`)
            : [],
      ),
    ),
  ];
}

/**
 * A document as a guide's author may state it: without the fields the publisher sets, as a scaffold writes the page
 * the publisher generates.
 * @param {keyof typeof PUBLISHERS} kind
 * @param {any} document
 */
export function asAuthored(kind, document) {
  const { document: own = [], ...lists } = /** @type {Record<string, readonly string[]>} */ (
    PUBLISHERS[kind]
  );
  const copy = structuredClone(document);
  for (const dotted of [...own, "meta.repository"]) {
    const keys = dotted.split(".");
    const last = /** @type {string} */ (keys.pop());
    const holder = keys.reduce((value, key) => value?.[key], copy);
    if (holder?.constructor === Object) delete holder[last];
  }
  for (const [list, keys] of Object.entries(lists))
    for (const item of Array.isArray(copy[list]) ? copy[list] : [])
      if (item?.constructor === Object) for (const key of keys) delete item[key];
  return copy;
}

/**
 * A document as the chooser measures it: at the build's quality, and without its sources and its repository, which
 * Archify verifies only against the checkout when the page is delivered.
 * @param {any} document
 * @param {string} quality
 */
function measurable(document, quality) {
  const meta = { ...document.meta, quality_profile: quality };
  delete meta.repository;
  return JSON.parse(JSON.stringify({ ...document, meta }), (key, value) =>
    key === "sources" ? undefined : value,
  );
}

/**
 * The kind of a guide's diagram file and its document: the kind its name ends in and its `diagram_type` states, or
 * null for a file that is no JSON object, whose name and `diagram_type` differ, or of a kind the table lacks.
 * Archify judges such a file as written.
 * @param {{ name: string, bytes: Buffer }} entry
 * @returns {{ kind: keyof typeof PUBLISHERS, document: any } | null}
 */
function diagramOf({ name, bytes }) {
  const named = /\.([a-z]+)\.json$/u.exec(name)?.[1];
  if (!named || !Object.hasOwn(PUBLISHERS, named)) return null;
  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch {
    return null;
  }
  if (document?.constructor !== Object || document.diagram_type !== named) return null;
  if (document.meta !== undefined && document.meta?.constructor !== Object) return null;
  return { kind: /** @type {keyof typeof PUBLISHERS} */ (named), document };
}

/**
 * Refuse a guide whose diagram files state a field the publisher sets (`page_diagram_publisher_field`), each field
 * of every file a problem, before Archify is asked and whichever media are built.
 * @param {ReadonlyArray<{ name: string, bytes: Buffer }>} entries the draft, then the files it names
 */
export function refuseStatedPlaces(entries) {
  /** @type {Array<import("../refusal.mjs").Problem>} */
  const stated = entries.flatMap((entry) => {
    const diagram = diagramOf(entry);
    return diagram
      ? publishersPaths(diagram.kind, diagram.document).map((at) => ({
          code: "page_diagram_publisher_field",
          path: `${entry.name}${at}`,
          message: `${at.split("/").pop()} is the publisher's to set`,
        }))
      : [];
  });
  if (stated.length)
    refuse(
      "page_diagram_publisher_field",
      `The guide's diagrams state ${stated.length} field${stated.length === 1 ? "" : "s"} the publisher sets: ` +
        "where their items sit, their sizes, the course of their lines, or their repository. Remove them.",
      stated,
    );
}

/**
 * A guide's entries as Archify draws them. A guide whose diagram files state a field the publisher sets is refused
 * (`refuseStatedPlaces`). With a repository, every diagram file names it; then each is laid out by its kind: an
 * architecture diagram by the chooser, among Archify's own layouts ranked by what a reader misreads
 * (`chooseAmong`); an entity-relationship or class diagram on the publisher's grid (`gridLayout`); a workflow by the
 * publisher's columns (`workflowLayout`); a dataflow on the publisher's rows (`dataflowLayout`); a sequence at the
 * publisher's heights (`sequenceLayout`); the other kinds as written. A file that is no JSON object of its named
 * kind, or whose lists are not what its kind holds, reaches Archify as written: Archify judges it. The draft and
 * every other file are as the author wrote them.
 * @param {ReadonlyArray<{ name: string, bytes: Buffer }>} entries the draft, then the files it names
 * @param {"showcase" | "standard"} quality
 * @param {Repository} [repository] the repository the diagrams name, where the build has a checkout to verify it
 * @returns {Promise<Array<{ name: string, bytes: Buffer }>>}
 */
export async function drawnEntries(entries, quality, repository) {
  refuseStatedPlaces(entries);
  const drawn = [];
  for (const entry of entries) {
    const diagram = diagramOf(entry);
    if (!diagram) {
      drawn.push(entry);
      continue;
    }
    const { kind, document } = diagram;
    const filled = withRepository(kind, document, repository);
    const laidOut =
      kind === "architecture"
        ? await architecture(filled, entry.name, quality)
        : kind === "workflow"
          ? workflow(filled, entry.name)
          : kind === "erd" || kind === "class"
            ? await grid(kind, filled, entry.name, quality)
            : kind === "dataflow"
              ? await dataflow(filled, entry.name, quality)
              : kind === "sequence"
                ? sequence(filled)
                : null;
    drawn.push({
      name: entry.name,
      bytes:
        laidOut === null && filled === document
          ? entry.bytes
          : Buffer.from(`${JSON.stringify(laidOut ?? filled, null, 2)}\n`),
    });
  }
  return drawn;
}

/**
 * The list of each kind whose items Archify reads sources from, as its repository evidence counts them
 * (`EVIDENCE_NODE_COLLECTIONS` in Archify's `renderers/shared/repository-evidence.mjs`).
 */
const EVIDENCE = Object.freeze({
  architecture: "components",
  workflow: "nodes",
  sequence: "participants",
  dataflow: "nodes",
  lifecycle: "states",
  erd: "entities",
  tree: "nodes",
  class: "types",
  timeline: "events",
  waterfall: "spans",
});

/**
 * A document that names the repository, or the document as it is without one. A document whose items cite no source
 * is left as it is: Archify refuses a repository that no item cites (`repository-evidence/source-required`). Archify
 * takes a public Forge from the address.
 * @param {keyof typeof PUBLISHERS} kind
 * @param {any} document
 * @param {Repository | undefined} repository
 */
function withRepository(kind, document, repository) {
  if (!repository?.url || !repository.revision) return document;
  const items = document[EVIDENCE[/** @type {keyof typeof EVIDENCE} */ (kind)]];
  const cites =
    Array.isArray(items) &&
    items.some(
      (/** @type {any} */ item) => Array.isArray(item?.sources) && item.sources.length > 0,
    );
  if (!cites) return document;
  const { url, revision, provider, link_mode } = repository;
  return {
    ...document,
    meta: {
      ...document.meta,
      repository: {
        url,
        revision,
        ...(provider ? { provider } : {}),
        ...(link_mode ? { link_mode } : {}),
      },
    },
  };
}

/**
 * Whether a value is a list of objects.
 * @param {unknown} list
 */
const objects = (list) => Array.isArray(list) && list.every((item) => item?.constructor === Object);

/**
 * An architecture document laid out by the chooser, or null where its parts or connections are not lists of objects.
 * @param {any} document
 * @param {string} name
 * @param {string} quality
 */
async function architecture(document, name, quality) {
  if (!objects(document.components) || !objects(document.connections ?? [])) return null;
  if (!document.connections?.length) return { ...document, layout: { mode: "auto" } };
  const chosen = await chooseAmong(
    [{ document: { ...measurable(document, quality), layout: { mode: "auto" } } }],
    { path: name, name: `The guide's diagram ${name}`, quality },
  );
  const routes = new Map(chosen.document.connections.map((route) => [route.id, route]));
  return {
    ...document,
    layout: chosen.document.layout,
    connections: (document.connections ?? []).map((connection) => ({
      ...routes.get(connection.id),
      ...(connection.sources ? { sources: connection.sources } : {}),
    })),
  };
}

/**
 * An entity-relationship or class document laid out by the publisher's grid, or null where its items or
 * relationships are not lists of objects.
 * @param {"erd" | "class"} kind
 * @param {any} document
 * @param {string} name
 * @param {string} quality
 */
async function grid(kind, document, name, quality) {
  const items = document[GRID_KINDS[kind]];
  if (!objects(items) || !items.length || !objects(document.relationships ?? [])) return null;
  return gridLayout(kind, document, measurable(document, quality), name, quality);
}

/**
 * A workflow laid out by the publisher's columns, or null where its nodes or edges are not lists of objects, its
 * nodes' ids not distinct strings or their lanes not strings.
 * @param {any} document
 * @param {string} name
 */
function workflow(document, name) {
  if (!objects(document.nodes) || !document.nodes.length || !objects(document.edges ?? []))
    return null;
  const ids = document.nodes.map((/** @type {any} */ node) => node.id);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) return null;
  if (document.nodes.some((/** @type {any} */ node) => typeof node.lane !== "string")) return null;
  return workflowLayout(document, name);
}

/**
 * A dataflow laid out on the publisher's rows, or null where its nodes or flows are not lists of objects, its nodes'
 * ids not distinct strings or their stages not whole numbers.
 * @param {any} document
 * @param {string} name
 * @param {string} quality
 */
async function dataflow(document, name, quality) {
  if (!objects(document.nodes) || !document.nodes.length || !objects(document.flows ?? []))
    return null;
  const ids = document.nodes.map((/** @type {any} */ node) => node.id);
  if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) return null;
  if (document.nodes.some((/** @type {any} */ node) => !Number.isInteger(node.stage))) return null;
  return dataflowLayout(document, measurable(document, quality), name, quality);
}

/**
 * A sequence with the publisher's heights, or null where its messages are not a list of objects.
 * @param {any} document
 */
function sequence(document) {
  return objects(document.messages) && document.messages.length ? sequenceLayout(document) : null;
}
