import { refuse } from "../refusal.mjs";
import { drawnRelations } from "./data.mjs";
import { readerIds } from "./reader.mjs";

/**
 * The invariants of projection: what a delivery is about to hold is the model's and the data's, and nothing else.
 * Each is decided before anything is written, in a check and in a build alike, and refuses with every difference
 * it found. The reader file is held to the model by the text it will be delivered as, a plate's face to what the
 * plan put in its view, and the plates and the page to the data's statements; the reader file's facts are written
 * from the data, so nothing reads them back. A guide's figures carry ids of
 * their author's, so they are matched to statements where they cite owned files, counted and listed, and never
 * refused.
 */

/** The lists of statements with the type word of each. */
const TYPES = Object.freeze([
  ["components", "component"],
  ["relations", "relation"],
  ["groups", "group"],
]);

const named = (type, id) => `${type} \`${id}\``;

/**
 * Refuse when an invariant found a difference, naming each.
 * @param {string} code
 * @param {string} summary
 * @param {Array<{ code: string, path: string, message: string }>} problems
 */
function refuseAny(code, summary, problems) {
  if (problems.length)
    refuse(code, `${summary}: ${problems.map(({ message }) => message).join("; ")}.`, problems);
}

/**
 * Hold the reader file's text, as it will be delivered, to the model: the ids of its component, relation and group
 * items are exactly the model's, each type by itself and each id once, and a later view names no id the model
 * lacks.
 * @param {{ locale: string, components: ReadonlyArray<{ id: string }>, relations: ReadonlyArray<{ id: string }>,
 *   groups: ReadonlyArray<{ id: string }>, guide?: string | null }} model
 * @param {string} text
 */
export function requireReaderIds(model, text) {
  const read = readerIds(text, model.locale, Boolean(model.guide));
  const problems = [];
  for (const [list, type] of TYPES) {
    const stated = read.stated[list];
    const held = new Set(model[list].map(({ id }) => id));
    const differ = (code, id, message) => problems.push({ code, path: `/${list}/${id}`, message });
    for (const id of held)
      if (!stated.includes(id))
        differ("reader_lacks", id, `the reader file holds no item of the ${named(type, id)}`);
    for (const id of new Set([...stated, ...read.named[list]]))
      if (!held.has(id))
        differ(
          "model_lacks",
          id,
          `the reader file names the ${named(type, id)}, which the model lacks`,
        );
    for (const id of new Set(stated.filter((one, index) => stated.indexOf(one) !== index)))
      differ(
        "reader_repeats",
        id,
        `the reader file holds the item of the ${named(type, id)} twice`,
      );
  }
  refuseAny("reader_ids_differ", "The reader file's statements are not the model's", problems);
}

/**
 * Hold each plate's face, which the drawing reported, to the statement set of its view, which the plan chose: the
 * ids of its components, groups and relations are the same on both sides, an overview's line counting as the
 * relations it stands for, and a relation's text is the model's.
 * @param {any} data the data of the delivery
 */
export function requireFaces(data) {
  const views = new Map(data.views.map((view) => [view.id, view]));
  const texts = new Map(data.statements.relations.map(({ id, text }) => [id, text]));
  const problems = [];
  for (const { number, views: drawn, face } of data.plates) {
    const selected = drawn.map((id) => views.get(id)).filter(Boolean);
    const differ = (code, message) =>
      problems.push({ code, path: `/plates/${number}`, message: `plate ${number} ${message}` });
    const sides = /** @type {Array<[string, string[], string[]]>} */ ([
      [
        "component",
        face.components.map(({ id }) => id),
        selected.flatMap((view) => view.components),
      ],
      ["group", face.groups.map(({ id }) => id), selected.flatMap((view) => view.groups)],
      ["relation", drawnRelations(face), selected.flatMap((view) => view.relations)],
    ]);
    for (const [type, faced, chosen] of sides) {
      for (const id of new Set(faced))
        if (!chosen.includes(id))
          differ("face_only", `draws the ${named(type, id)}, which its view does not select`);
      for (const id of new Set(chosen))
        if (!faced.includes(id))
          differ("view_only", `does not draw the ${named(type, id)}, which its view selects`);
    }
    for (const { id, text, relations: stood } of face.relations)
      if (!stood && texts.has(id) && text !== texts.get(id))
        differ(
          "relation_text",
          `draws the ${named("relation", id)} as "${text}", and the model states "${texts.get(id)}"`,
        );
  }
  refuseAny("data_face_differs", "A plate's face is not its view's statement set", problems);
}

/**
 * Hold the drawn projections to the data: a plate's face and the page the publisher generates name no component,
 * relation or group the data's statements lack, and a plate draws no scale of a property the catalogue lacks.
 * @param {any} data the data of the delivery
 * @param {ReadonlyArray<{ projection: string, components: readonly string[], groups: readonly string[],
 *   relations: readonly string[] }>} [pages] the ids each other projection draws, by the model's ids
 */
export function requireProjections(data, pages = []) {
  const known = Object.fromEntries(
    TYPES.map(([list, type]) => [type, new Set(data.statements[list].map(({ id }) => id))]),
  );
  const problems = [];
  const differ = (code, projection, message) =>
    problems.push({ code, path: projection.path, message: `${projection.name} ${message}` });
  const unknown = (projection, type, ids) => {
    for (const id of new Set(ids))
      if (!known[type].has(id))
        differ(
          "statement_unknown",
          projection,
          `names the ${named(type, id)}, which the data's statements lack`,
        );
  };
  const units = new Map(data.catalogue.map(({ property, unit }) => [property, unit]));
  for (const { number, face, scales = [] } of data.plates) {
    const plate = { name: `plate ${number}`, path: `/plates/${number}` };
    unknown(
      plate,
      "component",
      face.components.map(({ id }) => id),
    );
    unknown(
      plate,
      "group",
      face.groups.map(({ id }) => id),
    );
    unknown(plate, "relation", drawnRelations(face));
    for (const end of new Set(face.relations.flatMap(({ from, to }) => [from, to])))
      if (!known.component.has(end) && !known.group.has(end))
        differ(
          "statement_unknown",
          plate,
          `draws a relation that ends at \`${end}\`, which is no component or group of the data`,
        );
    for (const { property, unit } of scales)
      if (units.get(property) !== unit)
        differ(
          "property_unknown",
          plate,
          `draws a scale of the property ${property} in ${unit}, which the data's catalogue does not list`,
        );
  }
  for (const { projection, components, groups, relations } of pages) {
    const page = { name: `the ${projection}`, path: `/${projection}` };
    unknown(page, "component", components);
    unknown(page, "group", groups);
    unknown(page, "relation", relations);
  }
  refuseAny("projection_fact_unknown", "A projection holds what the data lacks", problems);
}

/** The entries of a list that are objects. */
const objects = (list) => list.filter((entry) => entry !== null && typeof entry === "object");

/** An entry of a diagram document that joins two others. */
const isConnection = ({ from, to }) => typeof from === "string" && typeof to === "string";

/**
 * Match a guide's figures to the model's statements. In each diagram document a connection is an entry of a
 * top-level list with two ends, and a node an entry with an id in a list where some entry cites sources or ends a
 * connection. A node is matched to the components that own the files it cites, by the rows of the evidence table
 * read at the pin; a connection whose two ends are matched, to the relations of the model between their
 * components, whichever way they run. Every node and connection without a match is listed. Nothing is refused;
 * without a checkout no file has an owner, nothing is matched, and the state says so.
 * @param {{ documents: ReadonlyArray<{ name: string, document: Record<string, unknown> }>,
 *   evidence: ReadonlyArray<{ path: string, state: string, owner?: string }>,
 *   relations: ReadonlyArray<{ id: string, from: string, to: string }>, pinned: boolean }} guide the guide's
 *   diagram documents, parsed, by file name; the evidence table; the model's relations; and whether the build read
 *   the files at the pin
 */
export function guideFigures({ documents, evidence, relations, pinned }) {
  const owners = new Map(
    evidence.filter(({ state }) => state === "verified").map(({ path, owner }) => [path, owner]),
  );
  /** @type {{ state: string, nodes: object[], connections: object[],
   *   unmatched: { nodes: object[], connections: object[] } }} */
  const figures = {
    state: pinned ? "verified" : "unverified",
    nodes: [],
    connections: [],
    unmatched: { nodes: [], connections: [] },
  };
  for (const { name: file, document } of documents) {
    const lists = Object.values(document).filter(Array.isArray).map(objects);
    const connections = lists.flat().filter(isConnection);
    const ends = new Set(connections.flatMap(({ from, to }) => [from, to]));
    const isNode = (entry) => typeof entry.id === "string" && !isConnection(entry);
    const nodes = lists
      .map((list) => list.filter(isNode))
      .filter((list) => list.some(({ id, sources }) => Array.isArray(sources) || ends.has(id)))
      .flat();
    /** @type {Map<string, string[]>} */
    const matched = new Map();
    for (const { id, sources } of nodes) {
      const cited = objects(Array.isArray(sources) ? sources : []);
      const components = [...new Set(cited.map(({ path }) => owners.get(path)).filter(Boolean))];
      if (components.length) {
        matched.set(id, components);
        figures.nodes.push({ file, id, components });
      } else figures.unmatched.nodes.push({ file, id });
    }
    const componentsOf = (id) => matched.get(id) ?? [];
    for (const { id, from, to } of connections) {
      const [one, other] = [componentsOf(from), componentsOf(to)];
      const between = relations
        .filter(
          (relation) =>
            (one.includes(relation.from) && other.includes(relation.to)) ||
            (other.includes(relation.from) && one.includes(relation.to)),
        )
        .map((relation) => relation.id);
      const entry = { file, ...(typeof id === "string" ? { id } : {}), from, to };
      if (between.length) figures.connections.push({ ...entry, relations: between });
      else figures.unmatched.connections.push(entry);
    }
  }
  return figures;
}
