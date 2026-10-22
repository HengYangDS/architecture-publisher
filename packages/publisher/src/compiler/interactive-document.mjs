import { composeInteractiveHtml } from "../rendering/interactive-html.mjs";
import { editorialFraming } from "../scene/framing.mjs";
import { canonical } from "../protocol/json.mjs";
import { fail } from "../protocol/values.mjs";

/** Both composition paths share one attributed publication and one source-reading authority. */
export function composeInteractiveDocument(selected, meaning, pages, reading) {
  const records = new Map();
  for (const { source, sourceClass } of [
    ...meaning.native.selections,
    ...reading.projection.elements,
    ...reading.projection.relations,
    ...reading.projection.claims,
  ]) {
    const record = {
      kind: sourceClass ?? "native",
      namespace: source.namespace,
      sha256: source.sha256,
      claimant: source.claimant,
    };
    const previous = records.get(record.namespace);
    if (previous && canonical(previous) !== canonical(record))
      fail("interactive_source_identity_ambiguous");
    records.set(record.namespace, record);
  }
  const sources = [...records.values()].map((record, index) => ({
    id: `selected-${index + 1}`,
    ...record,
  }));
  const sourceIds = new Map(sources.map(({ namespace, id }) => [namespace, id]));
  const attributed = pages.map(({ subjectNamespaces, ...page }) => {
    const subjectSources = Object.fromEntries(
      Object.entries(subjectNamespaces).map(([graphicId, namespaces]) => {
        const ids = namespaces.map((namespace) => sourceIds.get(namespace));
        if (ids.some((id) => !id)) fail("interactive_source_identity_unbound");
        return [graphicId, [...new Set(ids)].sort()];
      }),
    );
    return {
      ...page,
      sourceIds: [...new Set(Object.values(subjectSources).flat())].sort(),
      subjectSources,
    };
  });
  return composeInteractiveHtml({
    schema: "architecture.interactive-html-composition/v2",
    title: meaning.editorial.title,
    editionId: meaning.edition.id,
    appearance: meaning.editorial.presentation.interactive.appearance,
    framing: editorialFraming(meaning.edition.editor),
    build: {
      lockSha256: selected.lockSha256,
      editionSha256: selected.lock.edition.sha256,
      semanticDigest: meaning.native.semanticDigest,
    },
    overview: pages[0].id,
    pages: attributed,
    sources,
    sourceReading: {
      projection: reading.projection,
      pages: reading.pages,
    },
    state: {
      qualification: "not-performed",
      humanAcceptance: "not-performed",
      publication: "not-performed",
    },
  });
}

/** Project existing exact records into Inspect; never infer semantics from generated figures. */
export function neutralInteractiveFacts(page, projection, edition) {
  const records = new Map(
    [...projection.elements, ...projection.relations, ...projection.claims].map((item) => [
      item.reference,
      item,
    ]),
  );
  const facts = [],
    subjectNamespaces = Object.create(null);
  for (const occurrence of page.sourceReading.occurrences) {
    const item = records.get(occurrence.reference);
    if (!item) fail("interactive_source_identity_unbound");
    const [, kind, id] = JSON.parse(item.reference);
    const fields =
      kind === "claim"
        ? page.claimCards.find(
            (claim) => claim.namespace === item.source.namespace && claim.id === id,
          )?.facts
        : [
            {
              label: kind === "entity" ? "Entity kind" : "Relation kind",
              value: item.kind ?? "Not declared",
            },
            ...(kind === "relation"
              ? [
                  {
                    label: "From",
                    value: JSON.parse(item.from)
                      .filter((_, index) => index !== 1)
                      .join(":"),
                  },
                  {
                    label: "To",
                    value: JSON.parse(item.to)
                      .filter((_, index) => index !== 1)
                      .join(":"),
                  },
                ]
              : []),
            { label: "Source record", value: canonical(item.record) },
            { label: "Selected claimant", value: item.source.claimant },
            { label: "Declared source owner", value: item.owner },
          ];
    if (!fields) fail("interactive_source_identity_unbound");
    const title = kind === "claim" ? `Claim: ${id}` : (item.label ?? id);
    for (const graphicId of occurrence.graphicIds) {
      facts.push({
        reference: item.reference,
        sourceSha256: item.source.sha256,
        graphicId,
        title,
        facts: fields,
      });
      const namespaces = subjectNamespaces[graphicId] ?? [];
      if (!namespaces.includes(item.source.namespace)) namespaces.push(item.source.namespace);
      subjectNamespaces[graphicId] = namespaces;
    }
  }
  const basisGraphics = new Map();
  const bindBasis = (basis, graphicId) => {
    const targets = basisGraphics.get(basis) ?? [];
    targets.push(graphicId);
    basisGraphics.set(basis, targets);
  };
  for (const role of page.visualForm?.roles ?? [])
    bindBasis(role.basis, `g-${page.groups.findIndex((group) => group.id === role.group)}`);
  for (const [index, handoff] of (page.visualForm?.handoffs ?? []).entries())
    bindBasis(handoff.basis, `h-${index}`);
  for (const [index, assertion] of page.editorialAssertions.entries()) {
    for (const graphicId of basisGraphics.get(assertion.id) ?? [`editorial-${index}`]) {
      subjectNamespaces[graphicId] ??= [];
      facts.push({
        reference: JSON.stringify([edition.id, "editorial", assertion.id]),
        editionSha256: edition.sha256,
        graphicId,
        title: assertion.statement,
        facts: [
          { label: "Statement", value: assertion.statement },
          { label: "Proponent", value: assertion.proponent },
          { label: "Status", value: assertion.semanticStatus },
        ],
      });
    }
  }
  return { facts, subjectNamespaces };
}
