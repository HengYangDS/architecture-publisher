import {
  CLAIM_MODEL_SECTIONS,
  canonical,
  exact,
  strings,
  text,
  semanticError,
  normalizedClaimModel,
  claimModelDigest,
  referenceKey,
  jsonValue,
} from "./document.mjs";
import { changedFieldNames, lexical, sorted } from "./comparison.mjs";

const key = (section, id) => referenceKey({ section, id });

function correspondence(rows, before, after, added, removed) {
  if (!Array.isArray(rows)) semanticError("semantic_correspondence_invalid");
  const seenFrom = new Set(),
    seenTo = new Set();
  return rows
    .map((row) => {
      if (
        !exact(row, ["kind", "section", "from", "to", "evidence"]) ||
        !["rename", "split", "merge"].includes(row.kind) ||
        !["entities", "relations", "claims"].includes(row.section) ||
        !strings(row.from, true) ||
        !strings(row.to, true) ||
        !{
          rename: row.from.length === 1 && row.to.length === 1,
          split: row.from.length === 1 && row.to.length > 1,
          merge: row.from.length > 1 && row.to.length === 1,
        }[row.kind] ||
        !Array.isArray(row.evidence) ||
        !row.evidence.length
      )
        semanticError("semantic_correspondence_invalid");
      for (const [ids, allowed, seen] of [
        [row.from, removed, seenFrom],
        [row.to, added, seenTo],
      ])
        for (const id of ids) {
          const identity = key(row.section, id);
          if (!allowed[row.section].includes(id) || seen.has(identity))
            semanticError("semantic_correspondence_overlap");
          seen.add(identity);
        }
      const evidence = row.evidence.map((item) => {
        if (
          !exact(item, ["version", "source", "sha256", "locator"]) ||
          !["before", "after"].includes(item.version) ||
          !text(item.source) ||
          !text(item.locator) ||
          !Object.hasOwn((item.version === "before" ? before : after).sources, item.source) ||
          (item.version === "before" ? before : after).sources[item.source].sha256 !== item.sha256
        )
          semanticError("semantic_correspondence_evidence");
        return {
          version: item.version,
          source: item.source,
          sha256: item.sha256,
          locator: item.locator,
        };
      });
      if (new Set(evidence.map(canonical)).size !== evidence.length)
        semanticError("semantic_correspondence_evidence");
      evidence.sort((left, right) => lexical(canonical(left), canonical(right)));
      return {
        kind: row.kind,
        section: row.section,
        from: [...row.from].sort(),
        to: [...row.to].sort(),
        evidence,
      };
    })
    .sort((left, right) => lexical(canonical(left), canonical(right)));
}

function dependencyGraph(model, reverse) {
  const edge = (dependency, dependent) => {
    if (!reverse.has(dependency)) reverse.set(dependency, new Set());
    reverse.get(dependency).add(dependent);
  };
  for (const section of ["entities", "relations", "claims"])
    for (const [id, value] of Object.entries(model[section])) {
      const dependent = key(section, id);
      for (const source of value.provenance) edge(key("sources", source), dependent);
      if (section === "relations") {
        edge(key("entities", value.subject), dependent);
        edge(key("entities", value.object), dependent);
      }
      if (section === "claims") {
        edge(key("entities", value.subject), dependent);
        if (value.object !== null) edge(key("entities", value.object), dependent);
        for (const reference of value.dependsOn) edge(referenceKey(reference), dependent);
      }
    }
}

function closure(seeds, reverse) {
  const queue = [...seeds],
    reached = new Set(queue);
  for (let index = 0; index < queue.length; index++)
    for (const dependent of reverse.get(queue[index]) ?? [])
      if (!reached.has(dependent)) {
        reached.add(dependent);
        queue.push(dependent);
      }
  return reached;
}

/** Compare two valid Claim Models; this owner has no Edition or effect policy. */
export function compileClaimModelDelta(before, after, correspondences = []) {
  jsonValue(correspondences);
  const a = normalizedClaimModel(before),
    b = normalizedClaimModel(after);
  if (a.owner !== b.owner) semanticError("semantic_owner_changed");
  const added = {},
    removed = {},
    changed = {},
    changedFields = {};
  for (const section of CLAIM_MODEL_SECTIONS) {
    added[section] = Object.keys(b[section])
      .filter((id) => !Object.hasOwn(a[section], id))
      .sort();
    removed[section] = Object.keys(a[section])
      .filter((id) => !Object.hasOwn(b[section], id))
      .sort();
    changed[section] = Object.keys(a[section])
      .filter(
        (id) =>
          Object.hasOwn(b[section], id) && canonical(a[section][id]) !== canonical(b[section][id]),
      )
      .sort();
    changedFields[section] = Object.fromEntries(
      changed[section].map((id) => [id, changedFieldNames(a[section][id], b[section][id])]),
    );
  }
  const mappings = correspondence(correspondences, a, b, added, removed),
    changes = CLAIM_MODEL_SECTIONS.flatMap((section) =>
      [...added[section], ...removed[section], ...changed[section]].map((id) => ({ section, id })),
    ),
    reverse = new Map();
  dependencyGraph(a, reverse);
  dependencyGraph(b, reverse);
  const reached = closure(changes.map(referenceKey), reverse),
    renderChanges = changes.filter(({ section }) => !["sources"].includes(section)),
    renderReached = closure(renderChanges.map(referenceKey), reverse),
    affectedClaims = sorted([...Object.keys(a.claims), ...Object.keys(b.claims)]).filter((id) =>
      reached.has(key("claims", id)),
    ),
    renderAffectedClaims = sorted([...Object.keys(a.claims), ...Object.keys(b.claims)]).filter(
      (id) => renderReached.has(key("claims", id)),
    ),
    unknownClaims = sorted([...Object.keys(a.claims), ...Object.keys(b.claims)]).filter(
      (id) => a.claims[id]?.coverage === "unknown" || b.claims[id]?.coverage === "unknown",
    ),
    globalReasons = [];
  if (added.context.length || removed.context.length || changed.context.length)
    globalReasons.push("opaque-context-change");
  if (added.vocabulary.length || removed.vocabulary.length || changed.vocabulary.length)
    globalReasons.push("vocabulary-change");
  if (renderChanges.length && unknownClaims.length)
    globalReasons.push("unknown-claim-dependencies");
  return {
    schema: "architecture.claim-model-change/v1",
    before: claimModelDigest(a),
    after: claimModelDigest(b),
    added,
    removed,
    changed,
    changedFields,
    correspondences: mappings,
    affectedClaims,
    renderAffectedClaims,
    affectedReferences: [...reached].sort(),
    unknownClaims,
    globalReasons: sorted(globalReasons),
    hasChanges: changes.length > 0,
    scope:
      "Claim Model identity and dependency change only; no Edition, artifact, verification, acceptance or publication effect",
  };
}
