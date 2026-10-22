const reference = (namespace, kind, id) => JSON.stringify([namespace, kind, id]);

/** Source scope comes from assertions; graphic occurrences never define source endpoints. */
export function deriveSourceReadingScope({ view, assertions, selections, facts }) {
  const selectionIds = new Set();
  const references = new Set();
  for (const assertionId of view.assertionIds) {
    const assertion = assertions.get(assertionId);
    if (assertion.kind !== "source") continue;
    const selected = selections.get(assertion.selection);
    selectionIds.add(selected.selectionId);
    for (const element of selected.members.elements)
      references.add(reference(element.namespace, "entity", element.id));
    for (const relation of selected.members.relations)
      references.add(reference(relation.origin.namespace, "relation", relation.id));
    for (const claim of selected.members.claims ?? [])
      references.add(reference(claim.origin.namespace, "claim", claim.id));
  }
  const occurrences = new Map();
  for (const fact of facts) {
    if (!references.has(fact.reference)) continue;
    const graphicIds = occurrences.get(fact.reference) ?? new Set();
    graphicIds.add(fact.graphicId);
    occurrences.set(fact.reference, graphicIds);
  }
  return {
    selectionIds: [...selectionIds].sort(),
    references: [...references].sort(),
    occurrences: [...occurrences]
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([reference, graphicIds]) => ({ reference, graphicIds: [...graphicIds].sort() })),
  };
}
