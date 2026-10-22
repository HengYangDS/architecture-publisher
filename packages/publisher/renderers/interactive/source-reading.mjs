import { fail, isDigest } from "../../src/protocol/values.mjs";

const reference = (namespace, kind, id) => JSON.stringify([namespace, kind, id]);
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

/** One backend projection of existing imports, not another semantic inventory owner. */
export function projectSourceReading(imported, pages) {
  if (
    !isDigest(imported?.subjectLockSha256) ||
    !Array.isArray(imported.claimModels) ||
    !Array.isArray(pages)
  )
    fail("source_reading_input_invalid");
  let elements = [];
  let relations = [];
  let claims = [];
  for (const document of imported.claimModels) {
    const { source, sourceClass, model } = document;
    const bound = { source, sourceClass, owner: model.owner };
    for (const [id, record] of Object.entries(model.entities))
      elements.push({
        ...bound,
        reference: reference(source.namespace, "entity", id),
        kind: record.type,
        label: record.label,
        identityScope: "claim-model-id",
        parent: null,
        record,
      });
    for (const [id, record] of Object.entries(model.relations))
      relations.push({
        ...bound,
        reference: reference(source.namespace, "relation", id),
        from: reference(source.namespace, "entity", record.subject),
        to: reference(source.namespace, "entity", record.object),
        kind: record.type,
        label: record.type,
        direction: "forward",
        identityScope: "claim-model-id",
        record,
      });
    for (const [id, record] of Object.entries(model.claims))
      claims.push({
        ...bound,
        reference: reference(source.namespace, "claim", id),
        subject: reference(source.namespace, "entity", record.subject),
        object:
          record.object === null ? null : reference(source.namespace, "entity", record.object),
        predicate: model.vocabulary.predicates[record.predicate],
        record,
      });
  }
  if (imported.likec4) {
    const document = imported.likec4;
    const bound = (namespace) => {
      const source = document.sources.find((item) => item.namespace === namespace);
      if (!source) fail("source_reading_reference_missing");
      return { source, sourceClass: "native", owner: source.claimant };
    };
    for (const record of document.elements)
      elements.push({
        ...bound(record.namespace),
        reference: reference(record.namespace, "entity", record.id),
        kind: record.kind,
        label: record.label,
        identityScope: "parsed-document-set",
        parent:
          record.parent === null
            ? null
            : reference(record.parent.namespace, "entity", record.parent.id),
        record,
      });
    for (const record of document.relations)
      relations.push({
        ...bound(record.origin.namespace),
        reference: reference(
          record.origin.namespace,
          "relation",
          `relation:${record.origin.range.start.line + 1}:${record.origin.range.start.character + 1}`,
        ),
        from: reference(record.from.namespace, "entity", record.from.id),
        to: reference(record.to.namespace, "entity", record.to.id),
        kind: record.kind,
        label: record.label,
        direction: record.direction,
        identityScope: record.identityScope,
        record,
      });
  }
  const byReference = new Map();
  for (const [records, prefix] of [
    [elements, "n"],
    [relations, "r"],
    [claims, "c"],
  ]) {
    records.sort((left, right) => compare(left.reference, right.reference));
    for (const [index, record] of records.entries()) {
      if (byReference.has(record.reference)) fail("source_reading_identity_ambiguous");
      record.backendId = `${prefix}${index}`;
      byReference.set(record.reference, record);
    }
  }
  const elementReferences = new Set(elements.map((item) => item.reference));
  const elementByReference = new Map(elements.map((item) => [item.reference, item]));
  const assigned = new Set();
  const assignHierarchy = (item, ancestors = new Set()) => {
    if (assigned.has(item.reference)) return item.backendId;
    if (ancestors.has(item.reference)) fail("source_reading_hierarchy_invalid");
    if (item.parent !== null) {
      const parent = elementByReference.get(item.parent);
      if (!parent) fail("source_reading_parent_missing");
      item.backendId = `${assignHierarchy(parent, new Set([...ancestors, item.reference]))}.${item.backendId}`;
    }
    assigned.add(item.reference);
    return item.backendId;
  };
  for (const item of elements) assignHierarchy(item);
  for (const relation of relations)
    if (!elementReferences.has(relation.from) || !elementReferences.has(relation.to))
      fail("source_reading_endpoint_missing");
  const disclosed = new Set();
  for (const page of pages) {
    const scope = page.sourceReading;
    if (!scope || !Array.isArray(scope.references) || !Array.isArray(scope.occurrences))
      fail("source_reading_input_invalid");
    for (const selected of scope.references) {
      if (!byReference.has(selected)) fail("source_reading_reference_missing");
      disclosed.add(selected);
    }
  }
  const hierarchy = new Set(disclosed);
  for (const selected of disclosed) {
    let item = elementByReference.get(selected);
    while (item?.parent !== null && item?.parent !== undefined) {
      hierarchy.add(item.parent);
      item = elementByReference.get(item.parent);
    }
  }
  elements = elements
    .filter((item) => hierarchy.has(item.reference))
    .map((item) => (disclosed.has(item.reference) ? item : { ...item, label: null, record: null }));
  relations = relations.filter((item) => disclosed.has(item.reference));
  claims = claims.filter((item) => disclosed.has(item.reference));
  for (const entity of elements)
    entity.claims = Object.freeze(
      claims
        .filter((claim) => claim.subject === entity.reference || claim.object === entity.reference)
        .map((claim) => claim.reference),
    );
  for (const relation of relations)
    relation.claims = Object.freeze(
      claims
        .filter(
          (claim) =>
            claim.source.namespace === relation.source.namespace &&
            claim.record.dependsOn.some(
              (item) =>
                item.section === "relations" &&
                reference(claim.source.namespace, "relation", item.id) === relation.reference,
            ),
        )
        .map((claim) => claim.reference),
    );
  const projectedPages = pages.map((page) => {
    const scope = page.sourceReading;
    if (!scope || !Array.isArray(scope.references) || !Array.isArray(scope.occurrences))
      fail("source_reading_input_invalid");
    for (const selected of scope.references)
      if (!byReference.has(selected)) fail("source_reading_reference_missing");
    const current = new Set(scope.references);
    for (const occurrence of scope.occurrences)
      if (!current.has(occurrence.reference)) fail("source_reading_occurrence_invalid");
    return Object.freeze({
      id: page.id,
      label: page.label ?? page.questions.map(({ text }) => text).join(" · "),
      elements: Object.freeze(
        elements.filter((item) => current.has(item.reference)).map((item) => item.reference),
      ),
      relations: Object.freeze(
        relations.filter((item) => current.has(item.reference)).map((item) => item.reference),
      ),
      claims: Object.freeze(
        claims.filter((item) => current.has(item.reference)).map((item) => item.reference),
      ),
      occurrences: scope.occurrences,
    });
  });
  return Object.freeze({
    elements: Object.freeze(elements.map(Object.freeze)),
    relations: Object.freeze(relations.map(Object.freeze)),
    claims: Object.freeze(claims.map(Object.freeze)),
    pages: Object.freeze(projectedPages),
  });
}
