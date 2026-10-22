import { OWNER, PRODUCT_CONTRACT } from "./facts.mjs";
import { SELF_ENTITY_IDS, entityDefinitions } from "./entities.mjs";
import { SELF_RELATION_IDS, SELF_RELATIONS } from "./relations.mjs";

const predicateDefinitions = Object.freeze({
  responsibility: ["scalar", "single"],
  selects: ["entity", "multiple"],
  maps: ["entity", "multiple"],
  binds: ["entity", "multiple"],
  informs: ["entity", "multiple"],
  broadens: ["entity", "multiple"],
  authors: ["entity", "multiple"],
  invokes: ["entity", "multiple"],
  compiles: ["entity", "multiple"],
  feeds: ["entity", "multiple"],
  renders: ["entity", "multiple"],
  bundles: ["entity", "multiple"],
  qualifies: ["entity", "multiple"],
  gates: ["entity", "multiple"],
  authorizes: ["entity", "multiple"],
  recovers: ["entity", "multiple"],
  serves: ["entity", "multiple"],
  returns: ["entity", "multiple"],
  excludes: ["entity", "multiple"],
  compares: ["entity", "multiple"],
  derives: ["entity", "multiple"],
  propagates: ["entity", "multiple"],
  requires: ["entity", "multiple"],
  renews: ["entity", "multiple"],
});

function unique(...values) {
  return [...new Set(values.flat())];
}

function sourceIdentity(sources, id) {
  const source = sources[id];
  if (!source)
    throw Object.assign(new Error("self_source_missing: " + id), {
      code: "self_source_missing",
    });
  return source;
}

function claimFields(definition, dependency, sources) {
  sourceIdentity(sources, definition.sourceId);
  return {
    plane: definition.claim.plane,
    condition: structuredClone(definition.claim.condition),
    scope: structuredClone(definition.claim.scope),
    maturity: definition.claim.maturity,
    validity: definition.claim.validity,
    dependsOn: [dependency],
    coverage: definition.claim.coverage,
    provenance: unique(PRODUCT_CONTRACT, definition.sourceId),
  };
}

export function architecturePublisherClaimModel(sources) {
  const modelSources = Object.fromEntries(
      Object.entries(sources).map(([id, source]) => [
        id,
        {
          sha256: source.sha256,
          locator: source.locator,
          authority: source.authority,
        },
      ]),
    ),
    predicates = Object.fromEntries(
      Object.entries(predicateDefinitions).map(([id, [valueKind, cardinality]]) => [
        id,
        {
          valueKind,
          cardinality,
          values: [],
          provenance: [PRODUCT_CONTRACT],
        },
      ]),
    ),
    entities = {},
    relations = {},
    claims = {};

  for (const id of SELF_ENTITY_IDS) {
    const definition = entityDefinitions[id];
    sourceIdentity(modelSources, definition.sourceId);
    entities[id] = {
      type: definition.type,
      label: definition.label,
      qualifiers: {},
      provenance: [definition.sourceId],
    };
    claims["role-" + id] = {
      subject: id,
      predicate: "responsibility",
      object: null,
      value: definition.responsibility,
      ...claimFields(definition, { section: "entities", id }, modelSources),
    };
  }

  for (const id of SELF_RELATION_IDS) {
    const definition = SELF_RELATIONS[id];
    sourceIdentity(modelSources, definition.sourceId);
    relations[id] = {
      type: definition.type,
      subject: definition.subject,
      object: definition.object,
      qualifiers: {},
      provenance: unique(PRODUCT_CONTRACT, definition.sourceId),
    };
    claims["flow-" + id] = {
      subject: definition.subject,
      predicate: definition.type,
      object: definition.object,
      value: null,
      ...claimFields(definition, { section: "relations", id }, modelSources),
    };
  }

  return {
    schema: "architecture.claim-model/v2",
    owner: OWNER,
    vocabulary: {
      entities: [...new Set(Object.values(entityDefinitions).map(({ type }) => type))],
      relations: Object.keys(predicateDefinitions).filter((id) => id !== "responsibility"),
      maturities: ["implemented", "ratified", "target"],
      predicates,
    },
    entities,
    relations,
    claims,
    sources: modelSources,
    context: {
      selfUse: true,
      independentAdopterEvidence: false,
      inference: "not-performed",
      authority:
        "Source owners retain truth and lifecycle authority; this Edition selects and communicates exact claims.",
      excluded:
        "Repository mutation, source acceptance, implicit intent inference, current artifact acceptance, hosted observation, and unproved off-host recovery.",
    },
  };
}
