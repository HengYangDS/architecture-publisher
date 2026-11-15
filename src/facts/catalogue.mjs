import { BANDS } from "./ages.mjs";

/**
 * The catalogue of measured facts: every property the publisher measures for a plate that its author did not
 * state, listed once with what it is a property of, its unit, what it is measured from and the function of this
 * unit that measures it. A fact is one value of one property: it names its subject, its unit and its origin, so a
 * reader of the layer can tell what the tool measured from what the author stated.
 *
 * @typedef {"part" | "group" | "file" | "relation" | "view" | "edition"} SubjectKind
 * @typedef {{ kind: SubjectKind, id?: string, part?: string }} Subject
 *   What a fact is a fact of: the edition; a part or a group the overview draws as one, by id; a file by its path
 *   with the part or group it is drawn in; a relation or a view by id.
 * @typedef {{ property: string, of: readonly SubjectKind[], unit: string, origin: "measured",
 *   from: "pin" | "model", unpinned: "stated" | "absent" | "measured", measure: string,
 *   spans?: readonly number[] }} Property
 *   `from` says what the value is measured from: the checkout read at the pinned revision, or the model alone, as a
 *   count or a choice over what the author stated. `unpinned` says what a build without a checkout holds of the
 *   property: the author's statement, nothing, or the same measure.
 * @typedef {{ property: string, of: Subject, value: any, unit: string, origin: "measured" | "stated",
 *   from: "pin" | "model" | null }} Fact
 */

/**
 * @param {string} property
 * @param {SubjectKind[]} of
 * @param {string} unit
 * @param {"pin" | "model"} from
 * @param {"stated" | "absent" | "measured"} unpinned
 * @param {string} measure
 * @param {{ spans?: readonly number[] }} [definition]
 * @returns {Readonly<Property>}
 */
const row = (property, of, unit, from, unpinned, measure, definition = {}) =>
  Object.freeze({
    property,
    of: Object.freeze(of),
    unit,
    origin: "measured",
    from,
    unpinned,
    measure,
    ...definition,
  });

/**
 * The properties, in the order the layer measures them. A band is 0, 1 or 2, newest first, and its two spans, in
 * seconds, define it; a hub is a part's id, or none.
 * @type {ReadonlyArray<Readonly<Property>>}
 */
export const CATALOGUE = Object.freeze([
  row("owned-files", ["part", "group"], "paths", "pin", "stated", "ownedFiles"),
  row("owned-bytes", ["part", "group"], "bytes", "pin", "absent", "ownedBytes"),
  row("file-share", ["file"], "ratio", "pin", "absent", "fileShare"),
  row("file-age-band", ["file"], "band", "pin", "absent", "bandOf", { spans: BANDS.spans }),
  row("largest-part", ["edition"], "bytes", "pin", "absent", "largestPart"),
  row("pin-date", ["edition"], "date", "pin", "absent", "pinDate"),
  row("pin-release", ["edition"], "release", "pin", "absent", "pinRelease"),
  row("files-read", ["edition"], "files", "pin", "stated", "filesRead"),
  row("cited-files", ["relation"], "files", "model", "measured", "citedFiles"),
  row("hub", ["view"], "part", "model", "measured", "hubOf"),
  row("bands-shown", ["view"], "bands", "pin", "absent", "bandsShown"),
]);

/**
 * The catalogue's row for a property. A name the catalogue lacks is refused: the layer holds no fact of it.
 * @param {string} name
 * @returns {Readonly<Property>}
 */
export function propertyOf(name) {
  const found = CATALOGUE.find(({ property }) => property === name);
  if (!found) throw new RangeError(`The catalogue of measured facts lists no property ${name}.`);
  return found;
}

/**
 * One fact: a value of a property of the catalogue, with the property's unit. It is measured from what the
 * catalogue names, or stated by the author, and then measured from nothing.
 * @param {string} property
 * @param {Subject} of
 * @param {any} value
 * @param {boolean} [stated]
 * @returns {Fact}
 */
export function factOf(property, of, value, stated = false) {
  const { unit, from } = propertyOf(property);
  return stated
    ? { property, of, value, unit, origin: "stated", from: null }
    : { property, of, value, unit, origin: "measured", from };
}

/** @param {Subject} of */
const subjectKey = ({ kind, id, part }) => [kind, id, part].join("\u0000");

/**
 * A set of facts, read by property and subject. A fact that was not measured is absent from it; a property the
 * catalogue lacks is refused.
 * @param {readonly Fact[]} facts
 */
export function factSet(facts) {
  const held = new Map(facts.map((fact) => [`${fact.property}\u0000${subjectKey(fact.of)}`, fact]));
  return {
    /**
     * @param {string} property
     * @param {Subject} of
     * @returns {Fact | undefined}
     */
    fact: (property, of) => held.get(`${propertyOf(property).property}\u0000${subjectKey(of)}`),
    /** Every fact held, in the order it was measured. */
    all: () => [...facts],
  };
}
