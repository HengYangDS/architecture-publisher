import { canonical } from "../../src/protocol/json.mjs";
import { fail, hasExactFields } from "../../src/protocol/values.mjs";
import { nativeRelationTraversals } from "../archify/index.mjs";
import { escapeHtml as esc, pageStartTags } from "../../src/rendering/document-input.mjs";

const same = (left, right) => canonical(left) === canonical(right);
const set = (values) => [...new Set(values)].sort();

function validateSourcePage(page, scope, records) {
  const reject = () => fail("interactive_html_source_reader_invalid");
  const text = (value) => typeof value === "string" && value.trim().length > 0;
  const identifier = (value) => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);
  const attributes = new Map();
  const attribute = (tag, name, value) => attributes.get(tag)?.get(name) === esc(value);
  const current = [...scope.elements, ...scope.relations, ...scope.claims];
  const nativeRelations = scope.relations.map((reference) => {
    const item = records.get(reference)?.item;
    const binding = page.bindings[reference];
    const from = page.bindings[item?.from],
      to = page.bindings[item?.to];
    if (!item || binding?.kind !== "relation" || from?.kind !== "entity" || to?.kind !== "entity")
      reject();
    return {
      id: binding.id,
      reference,
      from: from.id,
      to: to.id,
      label: item.label ?? item.kind ?? "",
      direction: item.direction ?? "forward",
    };
  });
  const traversals = nativeRelationTraversals(
    nativeRelations,
    scope.elements.map((reference) => ({
      id: page.bindings[reference]?.id,
      label: records.get(reference)?.item.label,
    })),
  );
  let content;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(page.content);
  } catch {
    reject();
  }
  if (!content.includes('<meta name="publication-reader" content="archify/v1">')) reject();
  const markup = content.replace(
    /<!--[^]*?-->|<(script|style|template)\b[^>]*>[^]*?<\/\1\s*>/giu,
    "",
  );
  const carriersByTag = pageStartTags(markup, reject);
  const tags = carriersByTag.map(({ tag }) => tag);
  for (const carrier of carriersByTag) attributes.set(carrier.tag, carrier.attributes);
  const carriers = {
    entity: tags.filter((tag) => attributes.get(tag).has("data-node-id")),
    relation: tags.filter(
      (tag) => attributes.get(tag).has("data-edge-from") && attributes.get(tag).has("data-edge-to"),
    ),
    claim: tags.filter((tag) => attributes.get(tag).has("data-note-id")),
  };
  for (const [field, kind] of [
    ["elements", "entity"],
    ["claims", "claim"],
  ])
    if (carriers[kind].length !== scope[field].length) reject();
  if (carriers.relation.length !== traversals.length) reject();
  const anchors = new Set();
  for (const reference of current) {
    const { kind, item } = records.get(reference),
      binding = page.bindings[reference];
    if (
      !hasExactFields(binding, ["kind", "id"]) ||
      binding.kind !== kind ||
      !identifier(binding.id) ||
      anchors.has(`${kind}:${binding.id}`)
    )
      reject();
    anchors.add(`${kind}:${binding.id}`);
    const field =
      kind === "entity" ? "data-node-id" : kind === "relation" ? "data-edge-id" : "data-note-id";
    if (kind === "relation") {
      if (!["forward", "bidirectional"].includes(item.direction ?? "forward")) reject();
      for (const traversal of traversals.filter((item) => item.reference === reference)) {
        const matches = carriers.relation.filter(
          (tag) =>
            attribute(tag, "data-edge-id", traversal.id) &&
            attribute(tag, "data-edge-key", traversal.key) &&
            attribute(tag, "data-publication-source-reference", reference),
        );
        const labelMatches = traversal.label
          ? attribute(matches[0] ?? "", "data-edge-label", traversal.label)
          : !attributes.get(matches[0])?.has("data-edge-label") ||
            attribute(matches[0], "data-edge-label", "");
        if (
          matches.length !== 1 ||
          !attribute(matches[0], "data-edge-from", traversal.from) ||
          !attribute(matches[0], "data-edge-to", traversal.to) ||
          !labelMatches
        )
          reject();
      }
      continue;
    }
    const candidates = carriers[kind].filter(
      (tag) =>
        attribute(tag, field, binding.id) &&
        attribute(tag, "data-publication-source-reference", reference),
    );
    if (candidates.length !== 1) reject();
    const tag = candidates[0];
    if (
      kind === "claim" &&
      (!attribute(tag, "id", binding.id) ||
        tags.filter((candidate) => attribute(candidate, "id", binding.id)).length !== 1)
    )
      reject();
    if (kind === "entity" && (!text(item.label) || !attribute(tag, "data-node-label", item.label)))
      reject();
    if (
      kind === "claim" &&
      (page.bindings[item.subject]?.kind !== "entity" ||
        (item.object !== null && page.bindings[item.object]?.kind !== "entity"))
    )
      reject();
  }
}

/** Selected source pages are a closed projection, not a second semantic or query graph. */
export function validateSourceReading(reading, pages, sources) {
  const reject = () => fail("interactive_html_source_reader_invalid");
  const text = (value) => typeof value === "string" && value.trim().length > 0;
  const identifier = (value) => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);
  const projection = reading?.projection;
  if (
    !hasExactFields(reading, ["projection", "pages"]) ||
    !Array.isArray(reading.pages) ||
    !hasExactFields(projection, ["elements", "relations", "claims", "pages"]) ||
    !["elements", "relations", "claims", "pages"].every((field) =>
      Array.isArray(projection[field]),
    ) ||
    projection.pages.length !== pages.length
  )
    reject();
  const records = new Map(),
    selected = new Set();
  for (const [field, kind] of [
    ["elements", "entity"],
    ["relations", "relation"],
    ["claims", "claim"],
  ]) {
    for (const item of projection[field]) {
      let reference;
      try {
        reference = JSON.parse(item?.reference);
      } catch {
        reject();
      }
      const source = Object.values(sources).find((value) => value.namespace === reference?.[0]);
      if (
        !Array.isArray(reference) ||
        reference.length !== 3 ||
        reference[1] !== kind ||
        !reference.every(text) ||
        JSON.stringify(reference) !== item.reference ||
        records.has(item.reference) ||
        !source ||
        item.source?.namespace !== source.namespace ||
        item.source?.sha256 !== source.sha256 ||
        item.source?.claimant !== source.claimant ||
        item.sourceClass !== source.kind
      )
        reject();
      records.set(item.reference, { kind, item });
    }
  }
  const sourcePages = new Map();
  for (const page of reading.pages) {
    if (
      !hasExactFields(page, ["id", "content", "bindings"]) ||
      !identifier(page.id) ||
      sourcePages.has(page.id) ||
      !Buffer.isBuffer(page.content) ||
      !page.bindings ||
      typeof page.bindings !== "object" ||
      Array.isArray(page.bindings)
    )
      reject();
    sourcePages.set(page.id, page);
  }
  for (const [index, scope] of projection.pages.entries()) {
    const main = pages[index];
    if (
      !hasExactFields(scope, ["id", "label", "elements", "relations", "claims", "occurrences"]) ||
      scope.id !== main.id ||
      !text(scope.label) ||
      !Array.isArray(scope.occurrences)
    )
      reject();
    const references = [];
    for (const [field, kind] of [
      ["elements", "entity"],
      ["relations", "relation"],
      ["claims", "claim"],
    ]) {
      if (
        !Array.isArray(scope[field]) ||
        new Set(scope[field]).size !== scope[field].length ||
        scope[field].some((reference) => records.get(reference)?.kind !== kind)
      )
        reject();
      references.push(...scope[field]);
    }
    const current = new Set(references),
      occurrences = new Set(),
      occurrenceReferences = new Set();
    for (const reference of current) selected.add(reference);
    for (const occurrence of scope.occurrences) {
      if (
        !hasExactFields(occurrence, ["reference", "graphicIds"]) ||
        !current.has(occurrence.reference) ||
        occurrenceReferences.has(occurrence.reference) ||
        !Array.isArray(occurrence.graphicIds) ||
        !occurrence.graphicIds.length ||
        new Set(occurrence.graphicIds).size !== occurrence.graphicIds.length ||
        !occurrence.graphicIds.every(identifier)
      )
        reject();
      occurrenceReferences.add(occurrence.reference);
      for (const id of occurrence.graphicIds)
        occurrences.add(JSON.stringify([occurrence.reference, id]));
    }
    const expected = main.facts
      .filter((fact) => JSON.parse(fact.reference)[1] !== "editorial")
      .map((fact) => JSON.stringify([fact.reference, fact.graphicId]));
    if (!same(set(occurrences), set(expected))) reject();
    const page = sourcePages.get(scope.id);
    if (!current.size) {
      if (page) reject();
      continue;
    }
    if (
      !page ||
      Object.keys(page.bindings).length !== current.size ||
      Object.keys(page.bindings).some((reference) => !current.has(reference))
    )
      reject();
    sourcePages.delete(scope.id);
    validateSourcePage(page, scope, records);
  }
  if (sourcePages.size) reject();
  const hierarchy = new Set(selected);
  for (const reference of selected) {
    let current = records.get(reference);
    const visited = new Set([reference]);
    while (current?.kind === "entity" && current.item.parent !== null) {
      const parent = current.item.parent;
      if (records.get(parent)?.kind !== "entity" || visited.has(parent)) reject();
      visited.add(parent);
      hierarchy.add(parent);
      current = records.get(parent);
    }
  }
  for (const [reference, { kind, item }] of records) {
    if (
      !hierarchy.has(reference) ||
      (!selected.has(reference) &&
        (kind !== "entity" || item.label !== null || item.record !== null))
    )
      reject();
  }
}
