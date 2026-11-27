import { MODEL } from "../names.mjs";
import { refuse } from "../refusal.mjs";
import { FORMAT, fieldsOf, nodeAt, shaped } from "./format.mjs";

/**
 * The pinned edition as data: what a build holds of one work, written once. The data's format (`data.schema.json`)
 * states its members, every object's keys and their order, and the data is written in that shape (`shaped`); this
 * unit states what each key holds. The work's fields and the statements stand in the model's order, the views in
 * the plan's, the catalogue and the facts in the layer's, the evidence by path and the plates by number, so two
 * builds of one state write the same bytes. A value the build does not hold is absent, and never a zero, a null or a
 * default in its place. Everything is handed over as values, and this unit measures no fact; the one file it depends
 * on, the format's schema, `format.mjs` reads once when it is loaded.
 *
 * @typedef {import("../facts/catalogue.mjs").Fact} Fact
 * @typedef {{ number: number, views: readonly string[] }} Plate
 *   A plate's entry as `plateEntry` writes it, of which this unit reads its number and its views.
 */

/** A relation as a reader reads it: its two ends by id around the model's label. */
const relationText = ({ from, to, label }) => `${from} —${label}→ ${to}`;

/**
 * The ids of the model's relations a face draws: each relation's own, an overview's line counting as the relations
 * it stands for.
 * @param {{ relations: ReadonlyArray<{ id: string, relations?: readonly string[] }> }} face
 * @returns {string[]}
 */
export const drawnRelations = (face) =>
  face.relations.flatMap((relation) => relation.relations ?? [relation.id]);

/** The pin: the repository the model declares, the binding's state and, when measured, the date and the release. */
function pinOf(model, state, facts) {
  const ofEdition = (name) =>
    facts.find(({ property, of }) => property === name && of.kind === "edition")?.value;
  return {
    repository: model.repository,
    state,
    date: ofEdition("pin-date"),
    release: ofEdition("pin-release"),
  };
}

/** One planned view: its fields as the plan holds them, what it puts in it by id, and the plate that draws it. */
function viewOf(view, plates) {
  return {
    ...fieldsOf(nodeAt("/properties/views/items"), view),
    components: view.components.filter(({ group }) => !group).map(({ id }) => id),
    groups: view.components.filter(({ group }) => group).map(({ id }) => id),
    relations: [...new Set(drawnRelations(view))],
    plate: plates.find(({ views }) => views.includes(view.id))?.number,
  };
}

/** Every component, relation and group of the model, each as its author stated it. */
function statementsOf(model) {
  const stated = (statement) => ({
    ...statement,
    details: Object.fromEntries(statement.details),
    origin: "stated",
  });
  return {
    components: model.components.map(stated),
    relations: model.relations.map((relation) => ({
      ...stated(relation),
      text: relationText(relation),
    })),
    groups: model.groups.map((group) => ({ ...group, origin: "stated" })),
  };
}

/**
 * The layer's facts as it hands them over, each once: a relation two views draw is measured for each. A stated
 * fact names nothing it was measured from. A fact of a property the catalogue does not list is refused.
 * @param {readonly Fact[]} facts
 * @param {ReadonlyArray<{ property: string }>} catalogue
 */
function factsOf(facts, catalogue) {
  const listed = new Set(catalogue.map(({ property }) => property));
  /** @type {Map<string, object>} */
  const written = new Map();
  for (const fact of facts) {
    if (!listed.has(fact.property))
      refuse(
        "projection_fact_unknown",
        `The data was handed a fact of the property ${fact.property}, which the catalogue of measured facts does not list.`,
      );
    const held = shaped(nodeAt("#/$defs/fact"), fact);
    written.set(JSON.stringify(held), held);
  }
  return [...written.values()];
}

/**
 * The data of one delivery, in the shape its format states.
 * @param {{
 *   delivery: object, publisher: object, model: any, file: object, state: "verified" | "unverified" | "none",
 *   views: readonly any[], plates?: readonly Plate[], facts: readonly Fact[],
 *   catalogue: ReadonlyArray<{ property: string }>, evidence: readonly object[],
 *   guide?: Record<string, unknown> | null, overview?: object | null, media: readonly string[],
 * }} build the delivery's format and version; the publisher's name and version; the validated model; its file's
 *   digest, size, format and version; the binding's state; the planned views; the plates as `plateEntry` writes
 *   them; the layer's facts and catalogue; the evidence table; the guide's summary with its matched figures; the
 *   overview's statement's digest and images; and the media delivered
 */
export function editionData(build) {
  const { model, facts, catalogue } = build;
  const plates = [...(build.plates ?? [])].sort((a, b) => a.number - b.number);
  return shaped(FORMAT, {
    delivery: build.delivery,
    publisher: build.publisher,
    work: fieldsOf(nodeAt("/properties/work"), model),
    model: { file: MODEL, ...build.file },
    pin: pinOf(model, build.state, facts),
    views: build.views.map((view) => viewOf(view, plates)),
    statements: statementsOf(model),
    catalogue: catalogue.map((entry) => fieldsOf(nodeAt("/properties/catalogue/items"), entry)),
    facts: factsOf(facts, catalogue),
    evidence: build.evidence,
    guide: build.guide && fieldsOf(nodeAt("#/$defs/guide"), build.guide),
    // The overview's page is drawn from the model's statement in Typst, not by the engine, so it has images and no face.
    overview: build.overview && { ...build.overview, face: false },
    plates,
    media: build.media,
  });
}

/**
 * The data as the delivery's file: JSON with a two-space indent and one final newline.
 * @param {object} data
 */
export const serializeData = (data) => `${JSON.stringify(data, null, 2)}\n`;

/**
 * What a check reports of the data it would write, in counts: the statements by type and by whether the files they
 * name were read at the pin (`cited`), named in a build without a checkout (`unchecked`) or absent (`uncited`,
 * of components and relations, which alone can name files); the facts; the evidence; each plate's face; and the
 * guide's figures, when a guide's were matched.
 * @param {any} data
 */
export function dataCounts(data) {
  const { components, relations, groups } = data.statements;
  const naming = [...components, ...relations].filter(({ files }) => files.length).length;
  const read = data.pin.state === "verified";
  const figures = data.guide?.figures;
  return {
    statements: {
      components: components.length,
      relations: relations.length,
      groups: groups.length,
      cited: read ? naming : 0,
      unchecked: read ? 0 : naming,
      uncited: components.length + relations.length - naming,
    },
    facts: data.facts.length,
    evidence: {
      paths: data.evidence.length,
      ranges: data.evidence.reduce((sum, { ranges }) => sum + ranges.length, 0),
    },
    faces: data.plates.map(({ number, face }) => ({
      plate: number,
      components: face.components.length,
      groups: face.groups.length,
      relations: new Set(drawnRelations(face)).size,
    })),
    ...(figures
      ? {
          figures: {
            state: figures.state,
            matched: { nodes: figures.nodes.length, connections: figures.connections.length },
            unmatched: figures.unmatched,
          },
        }
      : {}),
  };
}
