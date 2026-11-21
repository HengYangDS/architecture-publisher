import { MODEL } from "../names.mjs";
import { refuse } from "../refusal.mjs";

/**
 * The pinned edition as data: what a build holds of one work, written once, in the order the build holds it. The
 * work's fields and the statements stand in the model's order, the views in the plan's, the catalogue and the
 * facts in the layer's, the evidence by path and the plates by number, every key in one fixed place, so two builds
 * of one state write the same bytes. A value the build does not hold is absent, and never a zero, a null or a
 * default in its place. Everything is handed over as values: this unit reads no file and measures no fact.
 *
 * @typedef {import("./evidence.mjs").EvidenceRow} EvidenceRow
 * @typedef {{ kind: string, id?: string, part?: string }} Subject
 * @typedef {{ property: string, of: Subject, value: any, unit: string, origin: string, from?: string | null }} Fact
 * @typedef {{ id: string, box: object }} FaceElement
 * @typedef {{ id: string, from: string, to: string, text?: string, relations?: string[], segments: unknown,
 *   label: object | null }} FaceRelation
 * @typedef {{ components: FaceElement[], groups: FaceElement[], relations: FaceRelation[] }} Face
 * @typedef {{ number: number, views: string[], page?: number, images: Array<{ width: number, file: string }>,
 *   figures?: Array<{ format: string, file: string }>, frame?: object,
 *   scales?: Array<{ property: string, unit: string, value: number, length: number }>, face: Face }} Plate
 *   One plate as the drawing reports it: its face is what was drawn, with the numbers of its drawing space.
 */

/**
 * An entry with the keys the build holds a value for: a key whose value is null or undefined is absent.
 * @template {Record<string, unknown>} T
 * @param {T} entry
 * @returns {Partial<T>}
 */
const held = (entry) =>
  /** @type {Partial<T>} */ (
    Object.fromEntries(
      Object.entries(entry).filter(([, value]) => value !== null && value !== undefined),
    )
  );

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

/** The work as its model states it. */
function workOf(model) {
  return held({
    id: model.id,
    locale: model.locale,
    title: model.title,
    question: model.question,
    summary: model.summary,
    scope: model.scope,
    limits: [...model.limits],
    editors: model.editors.map(held),
    license: model.license,
    coverage:
      model.coverage &&
      held({
        include: model.coverage.include,
        exclude: model.coverage.exclude.map(({ path, reason }) => ({ path, reason })),
      }),
  });
}

/** The pin: the repository the model declares, the binding's state and, when measured, the date and the release. */
function pinOf(model, state, facts) {
  const ofEdition = (name) =>
    facts.find(({ property, of }) => property === name && of.kind === "edition")?.value;
  return held({
    repository: model.repository && held({ ...model.repository }),
    state,
    date: ofEdition("pin-date"),
    release: ofEdition("pin-release"),
  });
}

/** One planned view: what the plan put in it, by id, and the number of the plate that draws it. */
function viewOf(view, plates) {
  return held({
    id: view.id,
    title: view.title,
    question: view.question,
    summary: view.summary,
    origin: view.origin,
    tiers: view.tiers?.map(({ id, label, members }) => ({ id, label, members: [...members] })),
    components: view.components.filter(({ group }) => !group).map(({ id }) => id),
    groups: view.components.filter(({ group }) => group).map(({ id }) => id),
    relations: [...new Set(drawnRelations(view))],
    plate: plates.find(({ views }) => views.includes(view.id))?.number,
  });
}

/** Every component, relation and group of the model, each as its author stated it. */
function statementsOf(model) {
  const evidence = ({ status, details, files }) => ({
    status,
    details: Object.fromEntries(details.map(([name, values]) => [name, [...values]])),
    files: [...files],
    origin: "stated",
  });
  return {
    components: model.components.map((component) =>
      held({
        id: component.id,
        label: component.label,
        kind: component.kind,
        ...evidence(component),
      }),
    ),
    relations: model.relations.map((relation) =>
      held({
        id: relation.id,
        from: relation.from,
        to: relation.to,
        label: relation.label,
        text: relationText(relation),
        ...evidence(relation),
      }),
    ),
    groups: model.groups.map(({ id, label, members }) => ({
      id,
      label,
      members: [...members],
      origin: "stated",
    })),
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
  for (const { property, of, value, unit, origin, from } of facts) {
    if (!listed.has(property))
      refuse(
        "projection_fact_unknown",
        `The data was handed a fact of the property ${property}, which the catalogue of measured facts does not list.`,
      );
    const subject = held({ kind: of.kind, id: of.id, part: of.part });
    const fact = { property, of: subject, value, unit, origin, ...(from ? { from } : {}) };
    written.set(JSON.stringify(fact), fact);
  }
  return [...written.values()];
}

/**
 * One plate's record with its keys in one order; its page, the files of its figure set alone, its frame and its
 * scales stand when an edition was typeset.
 */
function plateOf(plate) {
  const element = ({ id, box }) => ({ id, box });
  return held({
    number: plate.number,
    views: [...plate.views],
    page: plate.page,
    images: plate.images.map(({ width, file }) => ({ width, file })),
    figures: plate.figures?.map(({ format, file }) => ({ format, file })),
    frame: plate.frame,
    scales: plate.scales,
    face: {
      components: plate.face.components.map(element),
      groups: plate.face.groups.map(element),
      relations: plate.face.relations.map(({ id, from, to, text, relations, segments, label }) => ({
        id,
        from,
        to,
        ...(relations ? { relations: [...relations] } : { text }),
        segments,
        label,
      })),
    },
  });
}

/**
 * The data of one delivery, its members in their order.
 * @param {{
 *   delivery: { format: string, version: number }, publisher: { name: string, version: string },
 *   model: any, file: { sha256: string, bytes: number, format: string, version: number },
 *   state: "verified" | "unverified" | "none", views: readonly any[], plates?: readonly Plate[],
 *   facts: readonly Fact[], catalogue: ReadonlyArray<{ property: string, of: readonly string[], unit: string,
 *     origin: string, from: string, spans?: readonly number[] }>,
 *   evidence: readonly EvidenceRow[],
 *   guide?: { path: string, sha256: string, files: ReadonlyArray<{ name: string, sha256: string }>,
 *     sources: string, figures?: object } | null,
 *   overview?: { statement: string, images: ReadonlyArray<{ width: number, file: string }> } | null,
 *   media: readonly string[],
 * }} build the validated model; its file's digest, size, format and version; the binding's state; the planned
 *   views; the plates as the drawing reports them; the layer's facts and catalogue; the evidence table; the guide's
 *   record with its matched figures; the overview's statement's digest and images; and the media delivered
 */
export function editionData(build) {
  const { model, facts, catalogue, guide = null, overview = null } = build;
  const plates = [...(build.plates ?? [])].sort((a, b) => a.number - b.number);
  return held({
    delivery: { format: build.delivery.format, version: build.delivery.version },
    publisher: { name: build.publisher.name, version: build.publisher.version },
    work: workOf(model),
    model: {
      file: MODEL,
      sha256: build.file.sha256,
      bytes: build.file.bytes,
      format: build.file.format,
      version: build.file.version,
    },
    pin: pinOf(model, build.state, facts),
    views: build.views.map((view) => viewOf(view, plates)),
    statements: statementsOf(model),
    catalogue: catalogue.map(({ property, of, unit, origin, from, spans }) =>
      held({ property, of: [...of], unit, origin, from, spans: spans && [...spans] }),
    ),
    facts: factsOf(facts, catalogue),
    evidence: [...build.evidence],
    guide:
      guide &&
      held({
        path: guide.path,
        sha256: guide.sha256,
        files: guide.files.map(({ name, sha256 }) => ({ name, sha256 })),
        sources: guide.sources,
        figures: guide.figures,
      }),
    // The overview's page is drawn from the model's statement in Typst, not by the engine, so it has images and no face.
    overview: overview && {
      statement: overview.statement,
      images: overview.images.map(({ width, file }) => ({ width, file })),
      face: false,
    },
    plates: plates.map(plateOf),
    media: [...build.media],
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
