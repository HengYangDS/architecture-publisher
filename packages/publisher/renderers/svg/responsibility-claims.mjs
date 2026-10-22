import { fail } from "../../src/protocol/values.mjs";
import { colors, textLines } from "./responsibility-text.mjs";
import { nodeKey, sourceKey } from "./responsibility-contract.mjs";

/** Keep complete source facts and their bindings in aligned, equal-width reading columns. */
export function paintResponsibilityClaims(scene, nodes, { x, y, width, columns }) {
  const body = [];
  const carriers = [];
  const cardWidth = (width - (columns - 1) * 24) / columns;
  let rowBottom = y;
  for (const [position, card] of scene.claimCards.entries()) {
    if (!Array.isArray(card.facts) || !card.facts.length)
      fail("static_responsibility_claim_invalid");
    const graphicId = `c-${carriers.length}`;
    const column = position % columns;
    const cardX = x + column * (cardWidth + 24);
    let cardY = y;
    body.push(`<g data-graphic-id="${graphicId}">`);
    const claimAssertion = scene.sourceAssertionCarriers.find(
      ({ kind, claimRefs }) =>
        kind === "claim" &&
        claimRefs?.some(
          (ref) =>
            sourceKey(ref) ===
            sourceKey({ namespace: card.namespace, reference: card.id, sha256: card.sha256 }),
        ),
    );
    const linked = scene.claimRelationLinks?.find(
      ({ claimAssertionId }) => claimAssertionId === claimAssertion?.assertionId,
    );
    const relationRef = scene.sourceAssertionCarriers.find(
      ({ assertionId }) => assertionId === linked?.relationAssertionId,
    )?.relationRefs?.[0];
    const relation = relationRef
      ? scene.relations.find(
          (item) =>
            sourceKey({
              namespace: item.origin.namespace,
              reference: item.id,
              sha256: item.origin.sha256,
            }) === sourceKey(relationRef),
        )
      : null;
    if (linked && !relation) fail("static_responsibility_claim_relation_invalid");
    const subjectLink = scene.claimSubjectLinks?.find(
      ({ claimAssertionId }) => claimAssertionId === claimAssertion?.assertionId,
    );
    const subject = subjectLink ? nodes.get(nodeKey(subjectLink.subject)) : null;
    if (subjectLink && (!subject || subject.sha256 !== subjectLink.subject.sha256))
      fail("static_responsibility_claim_relation_invalid");
    if (relation && subjectLink) fail("static_responsibility_claim_relation_invalid");
    const heading = relation
      ? `CLAIM ON ${nodes.get(nodeKey(relation.from)).label} → ${nodes.get(nodeKey(relation.to)).label}`
      : subject
        ? `CLAIM ON ${subject.label}`
        : null;
    if (heading)
      cardY = textLines(body, heading, cardX, cardY, cardWidth, 12, colors.ink, 600, 2) + 9;
    const cellWidth = (cardWidth - 36) / 3;
    for (let start = 0; start < card.facts.length; start += 3) {
      const cells = card.facts.slice(start, start + 3).map((fact, index) => {
        const out = [];
        const x = cardX + index * (cellWidth + 18);
        const labelBottom = textLines(
          out,
          fact.label,
          x,
          cardY,
          cellWidth,
          10,
          colors.muted,
          600,
          2,
        );
        return { out, x, fact, labelBottom };
      });
      const valueY = Math.max(...cells.map(({ labelBottom }) => labelBottom)) + 2;
      let bottom = valueY;
      for (const cell of cells) {
        bottom = Math.max(
          bottom,
          textLines(cell.out, cell.fact.value, cell.x, valueY, cellWidth, 11, colors.ink, 400, 5) +
            9,
        );
        body.push(...cell.out);
      }
      cardY = bottom + 6;
    }
    body.push("</g>");
    carriers.push({
      graphicId,
      source: { namespace: card.namespace, reference: card.id, sha256: card.sha256 },
    });
    rowBottom = Math.max(rowBottom, cardY);
    if (column === columns - 1 || position === scene.claimCards.length - 1) {
      y = rowBottom + 18;
      rowBottom = y;
    }
  }
  return { markup: body.join("\n"), carriers, bottom: y };
}
