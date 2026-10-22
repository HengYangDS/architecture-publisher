import { fail } from "../../src/protocol/values.mjs";

export function projectInteractiveInspection(page, edition) {
  const facts = [],
    sources = new Map(),
    subjectNamespaces = Object.create(null);
  const add = (namespace, kind, id, digest, graphicId, title, fields) => {
    const editorial = kind === "editorial";
    if (!editorial) {
      if (!/^[a-f0-9]{64}$/u.test(digest ?? "")) fail("render_interactive_source_identity_unbound");
      const previous = sources.get(namespace);
      if (previous && previous.sha256 !== digest)
        fail("render_interactive_source_identity_ambiguous");
      sources.set(namespace, { namespace, sha256: digest, kind: "selected-scene", claimant: null });
    }
    facts.push({
      reference: JSON.stringify([namespace, kind, id]),
      ...(editorial ? { editionSha256: edition.sha256 } : { sourceSha256: digest }),
      graphicId,
      title,
      facts: fields,
    });
    subjectNamespaces[graphicId] = [
      ...new Set([...(subjectNamespaces[graphicId] ?? []), ...(editorial ? [] : [namespace])]),
    ];
  };
  for (const [index, node] of page.nodes.entries())
    add(
      node.namespace,
      "entity",
      node.id,
      node.sha256 ?? node.origin?.sha256,
      `n-${index}`,
      node.label,
      [
        { label: "Entity kind", value: node.kind ?? "Not declared" },
        { label: "Label", value: node.label },
        { label: "Selected source fields", value: JSON.stringify(node) },
      ],
    );
  for (const [index, relation] of page.relations.entries()) {
    const from = page.nodes.find(
      (node) => node.namespace === relation.from.namespace && node.id === relation.from.id,
    );
    const to = page.nodes.find(
      (node) => node.namespace === relation.to.namespace && node.id === relation.to.id,
    );
    add(
      relation.origin.namespace,
      "relation",
      relation.id,
      relation.origin.sha256,
      `r-${index}`,
      `${from.label} ${relation.direction === "bidirectional" ? "↔" : "→"} ${to.label}${relation.label ? ` · ${relation.label}` : ""}`,
      [
        { label: "From", value: JSON.stringify(relation.from) },
        { label: "To", value: JSON.stringify(relation.to) },
        { label: "Direction", value: relation.direction },
        { label: "Relation kind", value: relation.kind ?? "Not declared" },
        { label: "Label", value: relation.label ?? "Not declared" },
        ...(relation.sourceQualifiers ?? []).map(({ name, value }) => ({
          label: name || '""',
          value,
        })),
      ],
    );
  }
  for (const [index, claim] of (page.claimCards ?? []).entries())
    add(
      claim.namespace,
      "claim",
      claim.id,
      claim.sha256,
      `c-${index}`,
      `Claim: ${claim.id}`,
      claim.facts,
    );
  const duplicate = (source, graphicId) => {
    if (!source) fail("render_interactive_source_identity_unbound");
    if (!facts.some((item) => item.reference === source.reference && item.graphicId === graphicId))
      facts.push({ ...source, graphicId });
    subjectNamespaces[graphicId] = [
      ...new Set([
        ...(subjectNamespaces[graphicId] ?? []),
        ...(subjectNamespaces[source.graphicId] ?? []),
      ]),
    ];
  };
  for (const [index, group] of (page.groups ?? []).entries())
    for (const node of group.elements)
      duplicate(
        facts.find(
          (item) => item.reference === JSON.stringify([node.namespace, "entity", node.id]),
        ),
        `g-${index}`,
      );
  const targets = new Map();
  const target = (basis, graphicId) =>
    targets.set(basis, [...(targets.get(basis) ?? []), graphicId]);
  for (const role of page.visualForm?.roles ?? [])
    target(role.basis, `g-${page.groups.findIndex((group) => group.id === role.group)}`);
  for (const [index, handoff] of (page.visualForm?.handoffs ?? []).entries())
    target(handoff.basis, `h-${index}`);
  for (const [index, assertion] of page.editorialAssertions.entries()) {
    const fields = [
      { label: "Statement", value: assertion.statement },
      { label: "Proponent", value: assertion.proponent },
      { label: "Status", value: assertion.semanticStatus },
    ];
    for (const graphicId of targets.get(assertion.id) ?? [`editorial-${index}`])
      add(
        edition.id,
        "editorial",
        assertion.id,
        edition.sha256,
        graphicId,
        assertion.statement,
        fields,
      );
  }
  for (const assertion of page.sourceAssertionCarriers)
    for (const graphicId of targets.get(assertion.assertionId) ?? [])
      for (const claim of assertion.claimRefs ?? [])
        duplicate(
          facts.find(
            (item) =>
              item.reference === JSON.stringify([claim.namespace, "claim", claim.reference]),
          ),
          graphicId,
        );
  return { facts, subjectNamespaces, sources: [...sources.values()] };
}
