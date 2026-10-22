import { projectSourceReading } from "./source-reading.mjs";
import { assembleArchitectureScene, nativeRelationTraversals } from "../archify/index.mjs";
import { escapeHtml as esc, pageStartTags } from "../../src/rendering/document-input.mjs";
import { fail } from "../../src/protocol/values.mjs";
import { resolveFigureTypes } from "../../src/scene/figure-types.mjs";

/** Selected source declarations use the same original reader, not occurrence geometry. */
export async function prepareSourceReader(imported, pages, figureTypes) {
  const projection = projectSourceReading(imported, pages);
  const entities = new Map(projection.elements.map((item) => [item.reference, item]));
  const figures = resolveFigureTypes(
    projection.pages.map((page) => ({
      nodes: page.elements.map((reference, index) => ({
        id: `n-${index}`,
        label: entities.get(reference).label,
        visualRole: "backend",
        figureKind: entities.get(reference).kind ?? "source element",
      })),
    })),
    figureTypes,
  );
  const relations = new Map(projection.relations.map((item) => [item.reference, item]));
  const claims = new Map(projection.claims.map((item) => [item.reference, item]));
  const renderedPages = [],
    supplies = new Map();
  for (const [index, page] of projection.pages.entries()) {
    if (!page.elements.length) continue;
    const nodeIds = new Map(page.elements.map((reference, at) => [reference, `n-${at}`]));
    const bindings = {};
    const nodes = figures[index].nodes;
    for (const reference of page.elements)
      bindings[reference] = { kind: "entity", id: nodeIds.get(reference) };
    const edges = page.relations.map((reference, at) => {
      const relation = relations.get(reference);
      const from = nodeIds.get(relation.from),
        to = nodeIds.get(relation.to);
      if (!from || !to) fail("source_reading_endpoint_missing");
      const id = `r-${at}`;
      bindings[reference] = { kind: "relation", id };
      return {
        id,
        from,
        to,
        label: relation.label ?? relation.kind ?? "",
        visualRole: "default",
        semanticIds: [reference],
      };
    });
    const notes = [];
    for (const [at, reference] of page.claims.entries()) {
      const claim = claims.get(reference),
        subject = nodeIds.get(claim.subject);
      if (!subject) fail("source_reading_endpoint_missing");
      bindings[reference] = { kind: "claim", id: `claim-record-${at}` };
      notes.push({
        id: `claim-${at}`,
        title: `Selected source Claim: ${JSON.parse(reference)[2]}`,
        items: [
          {
            id: `claim-record-${at}`,
            text: JSON.stringify(claim.record),
            semanticIds: [reference],
          },
          {
            id: `claim-owner-${at}`,
            text: `Selected claimant: ${claim.source.claimant}`,
            semanticIds: [],
          },
        ],
      });
    }
    const scene = {
      schema: "architecture.interactive-scene/v1",
      id: `source-${index}`,
      title: "Selected source relationships",
      subtitle: page.label,
      nodes,
      groups: [],
      edges,
      notes,
    };
    const exploration = {
      nodes: nodes.map(({ id, label, figureKind: kind }) => ({ id, label, kind })),
      relations: edges.map(({ id, from, to, label, semanticIds }, at) => ({
        id,
        from,
        to,
        label,
        reference: semanticIds[0],
        edgeId: id,
        direction: relations.get(page.relations[at]).direction,
      })),
      limits: [],
    };
    if (exploration.relations.some(({ direction }) => direction === "bidirectional"))
      notes.push({
        id: "directed-reading",
        title: "Source relationship reading",
        items: [
          {
            id: "directed-traversals",
            text: "Paths, Reach and relation counts describe directed traversals, not additional source assertions. Reverse traversal preserves the canonical source predicate.",
            semanticIds: [],
          },
        ],
      });
    const traversals = nativeRelationTraversals(exploration.relations, exploration.nodes);
    const result = await assembleArchitectureScene(scene, {
      exploration,
      readingContext: "source",
    });
    for (const supply of result.supplies) {
      const previous = supplies.get(supply.id);
      if (previous && previous.sha256 !== supply.sha256) fail("source_reading_supply_conflict");
      supplies.set(supply.id, supply);
    }
    let content = result.bytes.toString("utf8");
    const referencesByCarrier = new Map();
    for (const [reference, binding] of Object.entries(bindings)) {
      const field =
        binding.kind === "entity"
          ? "data-node-id"
          : binding.kind === "relation"
            ? "data-edge-id"
            : "data-note-id";
      const carrierIds = new Set(
        binding.kind === "relation"
          ? traversals.filter((item) => item.reference === reference).map(({ id }) => id)
          : [binding.id],
      );
      for (const id of carrierIds) referencesByCarrier.set(`${field}:${esc(id)}`, reference);
    }
    for (const { tag, attributes } of pageStartTags(content, () =>
      fail("source_reading_carrier_invalid"),
    )) {
      const field = attributes.has("data-node-id")
        ? "data-node-id"
        : attributes.has("data-edge-from")
          ? "data-edge-id"
          : "data-note-id";
      const reference = referencesByCarrier.get(`${field}:${attributes.get(field)}`);
      if (!reference) continue;
      content = content.replace(tag, () =>
        tag.replace(
          /\/?\s*>$/u,
          (closing) => ` data-publication-source-reference="${esc(reference)}"${closing}`,
        ),
      );
    }
    renderedPages.push({ id: page.id, content: Buffer.from(content), bindings });
  }
  return { projection, pages: renderedPages, supplies: [...supplies.values()] };
}
