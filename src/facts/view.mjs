import { factOf, factSet } from "./catalogue.mjs";

/**
 * A view's facts: what the publisher measures of one planned view. Its hub and the number of files each of its
 * relations cites are measured from the model alone, so every build holds them; the age bands its parts' files
 * fall in are measured from the pin. An overview's parts and relations exist only once it is planned, so these
 * are measured for each view and not beforehand.
 *
 * @typedef {{ bytes: number,
 *   files: ReadonlyArray<{ path: string, bytes: number, band: 0 | 1 | 2, share: number }> }} Part
 *   A part as a strip draws it: its bytes and its files in path order, each with its bytes, its age band and its
 *   share of the part.
 */

/**
 * How many files a relation cites: its own, or for an overview's relation,
 * every file the model's relations it stands for cite.
 * @param {{ relations: Array<{ id: string, files: string[] }> }} model
 * @param {{ files: string[], relations?: string[] }} relation
 */
export function citedFiles(model, relation) {
  if (!relation.relations) return relation.files.length;
  const ids = new Set(relation.relations);
  return new Set(model.relations.filter(({ id }) => ids.has(id)).flatMap(({ files }) => files))
    .size;
}

/**
 * The part of a view that most of its relations end at, when at least three
 * do and more than at any other part: the view's hub, whose relations a reader
 * follows by their weight. A tie has no hub.
 * @param {{ relations: Array<{ to: string }> }} view
 * @returns {string | null}
 */
export function hubOf(view) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const { to } of view.relations) counts.set(to, (counts.get(to) ?? 0) + 1);
  const [first = ["", 0], second = ["", 0]] = [...counts].sort((a, b) => b[1] - a[1]);
  return first[1] >= 3 && first[1] > second[1] ? first[0] : null;
}

/**
 * The age bands the files of the given parts fall in, newest first.
 * @param {readonly Part[]} parts
 */
function bandsShown(parts) {
  const shown = new Set(parts.flatMap(({ files }) => files.map(({ band }) => band)));
  return /** @type {const} */ ([0, 1, 2]).filter((band) => shown.has(band));
}

/**
 * Measure a view's facts.
 * @param {{ relations: Array<{ id: string, files: string[] }> }} model
 * @param {{ id: string, components: Array<{ id: string, group?: boolean }>,
 *   relations: Array<{ id: string, to: string, files: string[], relations?: string[] }> }} view
 * @param {((component: { id: string, group?: boolean }) => Part) | null} part each part as a strip draws it, or
 *   none without a checkout read at the pin
 */
export function viewFacts(model, view, part) {
  const of = /** @type {const} */ ({ kind: "view", id: view.id });
  const hub = hubOf(view);
  const counts = new Map(
    view.relations.map((relation) => [relation.id, citedFiles(model, relation)]),
  );
  const shown = part ? bandsShown(view.components.map(part)) : [];
  const set = factSet([
    factOf("hub", of, hub),
    ...[...counts].map(([id, count]) => factOf("cited-files", { kind: "relation", id }, count)),
    ...(part ? [factOf("bands-shown", of, shown)] : []),
  ]);
  return {
    ...set,
    /** The part most of the view's relations end at, or none. */
    hub,
    /**
     * The number of files a relation of the view cites.
     * @param {{ id: string }} relation
     * @returns {number | undefined}
     */
    cited: (relation) => counts.get(relation.id),
    /** @type {ReadonlySet<number>} the age bands the view's parts hold */
    bands: new Set(shown),
  };
}
