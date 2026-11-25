import { chooseAmong } from "./choice.mjs";

/** The fields of a part that place it. */
const PLACING = new Set(["pos", "size", "row", "col"]);

/** The fields of a connection that route it or place its label. */
const ROUTING = new Set([
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
 * Whether an architecture document places anything: a layout of its own, a part with a position, a size, a row or
 * a column, or a connection with a side, a route or a label's place. Such a file is drawn as its author placed it.
 * @param {any} document
 */
const places = (document) =>
  document.layout !== undefined ||
  document.components.some((part) => Object.keys(part).some((key) => PLACING.has(key))) ||
  document.connections.some((link) => Object.keys(link).some((key) => ROUTING.has(key)));

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
 * A guide's entries as Archify draws them. Each architecture file the draft names that places nothing is laid out
 * by the publisher as the generated page's diagrams are: Archify's own layout, with its connections' sides and with
 * Archify's, the repair of the sides of the routes that misread and the pins of the labels, ranked by what a reader
 * misreads (`chooseAmong`). The file keeps its sources and repository; it takes the chosen layout and connections.
 * A file without connections takes Archify's layout with nothing to choose. Every other entry, and a file that is
 * no JSON object with lists of parts and connections, is as the author wrote it: Archify judges it.
 * @param {ReadonlyArray<{ name: string, bytes: Buffer }>} entries the draft, then the files it names
 * @param {"showcase" | "standard"} quality
 * @returns {Promise<Array<{ name: string, bytes: Buffer }>>}
 */
export async function drawnEntries(entries, quality) {
  const drawn = [];
  for (const { name, bytes } of entries) {
    /** @type {any} */
    let document = null;
    if (name.endsWith(".architecture.json"))
      try {
        document = JSON.parse(bytes.toString("utf8"));
      } catch {
        document = null;
      }
    const lists =
      document?.constructor === Object &&
      Array.isArray(document.components) &&
      Array.isArray(document.connections ?? []);
    if (!lists || places({ ...document, connections: document.connections ?? [] })) {
      drawn.push({ name, bytes });
      continue;
    }
    if (!document.connections?.length) {
      const laidOut = { ...document, layout: { mode: "auto" } };
      drawn.push({ name, bytes: Buffer.from(`${JSON.stringify(laidOut, null, 2)}\n`) });
      continue;
    }
    const chosen = await chooseAmong(
      [{ document: { ...measurable(document, quality), layout: { mode: "auto" } } }],
      { path: name, name: `The guide's diagram ${name}`, quality },
    );
    const routes = new Map(chosen.document.connections.map((route) => [route.id, route]));
    const laidOut = {
      ...document,
      layout: chosen.document.layout,
      connections: (document.connections ?? []).map((connection) => ({
        ...routes.get(connection.id),
        ...(connection.sources ? { sources: connection.sources } : {}),
      })),
    };
    drawn.push({ name, bytes: Buffer.from(`${JSON.stringify(laidOut, null, 2)}\n`) });
  }
  return drawn;
}
