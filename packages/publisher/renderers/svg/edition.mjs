import { fail } from "../../src/protocol/values.mjs";
import { editorialFraming } from "../../src/scene/framing.mjs";
import { composeFigureTypeLegend, figureIconLicenseMetadata } from "./figure-types.mjs";
import { escapeStaticText as escape } from "./text.mjs";
import {
  SOURCE_RELATION_QUALIFIER_CONTEXT,
  SOURCE_REPORTED_TOPOLOGY_NOTE,
  UNLINKED_RELATION_NOTE,
} from "../../src/scene/claim-relations.mjs";
import {
  key,
  sourceReferenceKey,
  factorClaimFacts,
  linkedClaims,
  validateStaticScene,
  readingGroups,
} from "./edition-contract.mjs";
import { maximumExtent, boundsOf } from "./edition-geometry.mjs";
import { number, textLines, namedSection } from "./edition-text.mjs";
import { paintClaimContext, paintClaimStatements, staticBodyGeometry } from "./edition-claims.mjs";
import { composeStaticEditionStructure } from "./edition-structure.mjs";
import { selectMeasuredComposition } from "./composition.mjs";

function paintStaticEditionSvg(scene, options, notesWidth) {
  const idPrefix = options.idPrefix ?? "";
  const fragment = options.fragment === true;
  if (
    Object.keys(options).some(
      (key) => !["idPrefix", "fragment", "icons", "textMeasurer", "raster"].includes(key),
    ) ||
    typeof idPrefix !== "string" ||
    !/^[a-z0-9-]*$/u.test(idPrefix) ||
    (options.fragment !== undefined && typeof options.fragment !== "boolean") ||
    (options.raster !== undefined && typeof options.raster !== "boolean")
  )
    fail("static_edition_render_options_invalid");
  const mixed = validateStaticScene(scene);
  const claimLinks = mixed ? linkedClaims(scene) : null;
  const groups = readingGroups(scene);
  const rasterWidth = scene.requestedWidth ?? 1800;
  if (!Number.isSafeInteger(rasterWidth) || rasterWidth < 320 || rasterWidth > 12000)
    fail("static_edition_width_invalid");
  const sourceBounds = boundsOf(scene);
  if (JSON.stringify(sourceBounds) !== JSON.stringify(scene.bounds))
    fail("static_edition_bounds_mismatch");
  const bounds =
    scene.groupPresentation === "key" ? boundsOf({ ...scene, groups: [] }) : sourceBounds;
  const claimCards = scene.claimCards ?? [];
  const { common, commonLabels } = factorClaimFacts(claimCards);
  const { width: graphWidth } = staticBodyGeometry(bounds, claimCards);
  const figureTypes = composeFigureTypeLegend(scene.nodes, options.icons, notesWidth);
  const iconLicense = figureIconLicenseMetadata(figureTypes && options.icons);
  const gap = 54;
  const margin = 32;
  const hasSourceBody = bounds !== null || claimCards.length > 0;
  const notesX = hasSourceBody ? margin + graphWidth + gap : margin;
  const width = notesX + notesWidth + margin;
  if (width > maximumExtent) fail("static_edition_geometry_invalid");
  const header = [];
  const framing = editorialFraming(scene.edition.editor);
  let y = margin + 34;
  y = textLines(header, scene.title, margin, y, width - 2 * margin, 34, "#21332a", 600, 3);
  if (scene.summary !== undefined)
    y = textLines(header, scene.summary, margin, y, width - 2 * margin, 15, "#53645a", 400, 6) + 9;
  const primaryReadingSpan = y;
  y = textLines(header, framing, margin, y, width - 2 * margin, 12, "#66736b", 400, 6) + 25;
  const graphTop = y;
  const { graph, labels, nodeCarriers, relationCarriers } = composeStaticEditionStructure(
    scene,
    idPrefix,
    options,
  );
  y = graphTop + 28;
  const notes = [];
  if (!fragment) {
    if (figureTypes) {
      notes.push(
        `<g transform="translate(${notesX} ${number(graphTop + 6)})">${figureTypes.markup}</g>`,
      );
      y = graphTop + 6 + figureTypes.height + 22;
    }
    y = namedSection(
      notes,
      "READER QUESTIONS",
      scene.questions.map(({ text }) => ({ text })),
      notesX,
      y,
      notesWidth,
    );
    y = namedSection(
      notes,
      "READING GROUPS",
      groups.map(({ label, members }) => ({ text: `${label}: ${members.join(" · ")}` })),
      notesX,
      y,
      notesWidth,
    );
  }
  let relationIndex = 0;
  const relationItems = scene.edges.flatMap((edge) =>
    edge.relations.flatMap((relation) => {
      const graphicId = relationCarriers[relationIndex++].graphicId;
      if (relation.label !== null && typeof relation.label !== "string")
        fail("static_edition_relation_label_invalid");
      if (edge.caption && relation.label === null) return [];
      const identity = `${mixed ? `${String(relationIndex).padStart(2, "0")} · ` : ""}${labels.get(key(edge.from))} ${relation.direction === "bidirectional" ? "↔" : "→"} ${labels.get(key(edge.to))}`;
      const details = [relation.label, ...(edge.caption ? [] : [relation.kind])]
        .filter((value, index, all) => value && all.indexOf(value) === index)
        .join(" · ");
      const context =
        scene.claimCards !== undefined &&
        relation.label?.startsWith(`${SOURCE_RELATION_QUALIFIER_CONTEXT}: `)
          ? SOURCE_RELATION_QUALIFIER_CONTEXT
          : null;
      return [
        {
          text: `${identity}${details ? ` · ${details}` : ""}`,
          graphicId,
          ...(context ? { context } : {}),
        },
      ];
    }),
  );
  const relationOnly =
    scene.claimCards !== undefined && scene.claimCards.length === 0 && scene.edges.length > 0;
  const linkedRelationIds = new Set(
    (scene.claimRelationLinks ?? []).map(({ relationAssertionId }) => relationAssertionId),
  );
  const unlinkedRelation =
    scene.claimCards !== undefined &&
    scene.sourceAssertionCarriers.some(
      ({ assertionId, kind }) => kind === "relation" && !linkedRelationIds.has(assertionId),
    );
  if (!fragment) {
    y = namedSection(
      notes,
      "SOURCE STATUS",
      unlinkedRelation
        ? [{ text: relationOnly ? SOURCE_REPORTED_TOPOLOGY_NOTE : UNLINKED_RELATION_NOTE }]
        : [],
      notesX,
      y,
      notesWidth,
    );
    y = namedSection(notes, "SOURCE RELATIONS", relationItems, notesX, y, notesWidth);
    y = namedSection(
      notes,
      "EDITORIAL ASSERTIONS",
      scene.editorialAssertions.map(({ statement, proponent }) => ({
        text: `${statement} · Editorial judgment · ${proponent} · unverified`,
      })),
      notesX,
      y,
      notesWidth,
    );
    const scopeLimits = Object.values(scene.limitsByQuestion)
      .flat()
      .map(({ reason }) => ({ text: reason }));
    y = namedSection(notes, "DECLARED LIMITS", scopeLimits, notesX, y, notesWidth);
  }
  const structureHeight = (bounds?.height ?? 0) + 74;
  const notesHeight = y - graphTop + 32;
  const paintClaims = (placement, receivingWidth) => {
    const claimSectionY =
      receivingWidth === undefined
        ? graphTop +
          (placement === "side" ? structureHeight : Math.max(structureHeight, notesHeight)) +
          34
        : 0;
    const claimPlate = [];
    const claimCarriers = [];
    const claimX = receivingWidth === undefined ? margin + (mixed ? 0 : 14) : 0;
    const claimWidth =
      receivingWidth ?? (mixed && placement === "footer" ? width - 2 * margin : graphWidth - 32);
    let claimY = receivingWidth !== undefined || mixed ? claimSectionY : graphTop + 66;
    let readingSpan = 0;
    if (mixed && !fragment) {
      const start = claimY;
      claimY =
        textLines(claimPlate, "SOURCE CLAIMS", claimX, claimY, claimWidth, 11, "#66736b", 600, 1) +
        18;
      readingSpan += claimY - start - 18;
    }
    if (common.length) {
      const start = claimY;
      claimY =
        textLines(
          claimPlate,
          "COMMON TO ALL SELECTED CLAIMS",
          claimX,
          claimY,
          claimWidth,
          11,
          "#66736b",
          600,
          2,
        ) + 8;
      readingSpan += claimY - start - 8;
      const context = paintClaimContext(claimPlate, common, {
        x: claimX,
        y: claimY,
        width: claimWidth,
        columns:
          receivingWidth === undefined ? 1 : Math.max(1, Math.floor((claimWidth + 24) / 504)),
      });
      claimY = context.y;
      readingSpan += context.readingSpan;
      claimPlate.push(
        `<line x1="${claimX}" y1="${number(claimY + 5)}" x2="${number(claimX + claimWidth)}" y2="${number(claimY + 5)}" stroke="#aebbb0" stroke-width="1"/>`,
      );
      claimY += 27;
    }
    let orderedClaims = claimCards;
    let headingFor;
    if (mixed) {
      const relationPositions = new Map(
        scene.edges
          .flatMap((edge) => edge.relations)
          .map((relation, index) => [sourceReferenceKey(relation), index]),
      );
      const positionFor = (claim) => {
        const identity = sourceReferenceKey({
          namespace: claim.namespace,
          reference: claim.id,
          sha256: claim.sha256,
        });
        const relationIdentity = claimLinks.relations.get(identity);
        if (relationIdentity === undefined && claimLinks.subjects.has(identity))
          return relationPositions.size;
        const position = relationPositions.get(relationIdentity);
        if (position === undefined) fail("static_edition_claim_relation_invalid");
        return position;
      };
      orderedClaims = [...claimCards].sort((left, right) => positionFor(left) - positionFor(right));
      headingFor = (claim) =>
        claimLinks.subjects.has(
          sourceReferenceKey({
            namespace: claim.namespace,
            reference: claim.id,
            sha256: claim.sha256,
          }),
        )
          ? "ON SOURCE ENTITY"
          : `ON SOURCE RELATION ${String(positionFor(claim) + 1).padStart(2, "0")}`;
    }
    const statements = paintClaimStatements(orderedClaims, commonLabels, {
      idPrefix,
      x: claimX,
      y: claimY,
      width: claimWidth,
      headingFor,
    });
    claimPlate.push(...statements.plate);
    claimCarriers.push(...statements.carriers);
    claimY = statements.y;
    readingSpan += statements.readingSpan;
    return {
      claimSectionY,
      claimPlate,
      claimCarriers,
      claimY,
      claimX,
      claimWidth,
      readingSpan,
      placement,
    };
  };
  const heightFor = ({ claimCarriers, claimY }) =>
    Math.max(structureHeight, notesHeight, claimCarriers.length ? claimY - graphTop + 32 : 0);
  const attemptClaims = (placement) => {
    try {
      return paintClaims(placement);
    } catch (error) {
      if (error?.code === "static_edition_text_unrepresentable") return null;
      throw error;
    }
  };
  const footer = attemptClaims("footer");
  const side = mixed && !fragment ? attemptClaims("side") : null;
  if (!footer && !side) fail("static_edition_text_unrepresentable");
  const chosen = selectMeasuredComposition(
    [footer, side].filter(Boolean),
    (candidate) => ({ ...candidate, width, height: heightFor(candidate) }),
    ["static_edition_text_unrepresentable"],
    { raster: false, extent: ({ height }) => height },
  );
  const useSide = chosen.placement === "side";
  const { claimSectionY, claimPlate, claimCarriers } = chosen;
  const contentHeight = heightFor(chosen);
  const translateX = bounds ? margin + (graphWidth - bounds.width) / 2 - bounds.x : 0;
  const translateY = bounds
    ? mixed
      ? graphTop + 42 - bounds.y
      : graphTop + 42 + (contentHeight - 42 - bounds.height) / 2 - bounds.y
    : 0;
  const height = Math.ceil(graphTop + contentHeight + margin);
  if (height > maximumExtent) fail("static_edition_geometry_invalid");
  const nodeGraphicIds = new Map(
    nodeCarriers.map(({ source, graphicId }) => [key(source), graphicId]),
  );
  const relationGraphicIds = new Map(
    relationCarriers.map(({ source, graphicId }) => [sourceReferenceKey(source), graphicId]),
  );
  const claimGraphicIds = new Map(
    claimCarriers.map(({ source, graphicId }) => [sourceReferenceKey(source), graphicId]),
  );
  const bodyPrelude = [
    `<defs><marker id="${idPrefix}source-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 10 4 L 0 8 Z" fill="#60786a"/></marker></defs>`,
    `<line x1="${margin}" y1="${number(graphTop - 18)}" x2="${width - margin}" y2="${number(graphTop - 18)}" stroke="#c4ccc2" stroke-width="1"/>`,
    ...(hasSourceBody
      ? [
          `<line x1="${number(notesX - gap / 2)}" y1="${number(graphTop)}" x2="${number(notesX - gap / 2)}" y2="${number(mixed && !useSide ? graphTop + Math.max(structureHeight, notesHeight) - 18 : height - margin)}" stroke="#d3dbd1" stroke-width="1"/>`,
        ]
      : []),
    ...(mixed
      ? [
          `<line x1="${margin}" y1="${number(claimSectionY - 24)}" x2="${number(useSide ? margin + graphWidth - 32 : width - margin)}" y2="${number(claimSectionY - 24)}" stroke="#c4ccc2" stroke-width="1"/>`,
        ]
      : []),
  ];
  const bodyContent = [
    ...(hasSourceBody
      ? [
          `<text x="${margin}" y="${number(graphTop + 28)}" fill="#66736b" font-size="11" font-weight="600">${claimCarriers.length && !mixed ? "SOURCE CLAIMS" : "SOURCE STRUCTURE"}</text>`,
        ]
      : []),
    `<g transform="translate(${number(translateX)} ${number(translateY)})">`,
    ...graph,
    "</g>",
    ...claimPlate,
    ...notes,
  ];
  const carriers = {
    nodes: nodeCarriers,
    relations: relationCarriers,
    ...(scene.claimCards === undefined ? {} : { claims: claimCarriers }),
    assertions: scene.sourceAssertionCarriers.map(
      ({ assertionId, nodeRefs, relationRefs, claimRefs }) => ({
        assertionId,
        nodeGraphicIds: nodeRefs.map((ref) => nodeGraphicIds.get(key(ref))),
        relationGraphicIds: relationRefs.map((ref) =>
          relationGraphicIds.get(sourceReferenceKey(ref)),
        ),
        ...(scene.claimCards === undefined
          ? {}
          : {
              claimGraphicIds: (claimRefs ?? []).map((ref) =>
                claimGraphicIds.get(sourceReferenceKey(ref)),
              ),
            }),
      }),
    ),
  };
  if (fragment) {
    return {
      parts: {
        graph: graph.join("\n"),
        bounds,
        groups,
        figureTypes,
        iconLicense,
        relations: relationItems,
        claim:
          claimCarriers.length > 0
            ? {
                markup: claimPlate.join("\n"),
                x: chosen.claimX,
                y: mixed ? chosen.claimSectionY : graphTop + 66,
                width: chosen.claimWidth,
                height: chosen.claimY - (mixed ? chosen.claimSectionY : graphTop + 66),
                readingSpan: chosen.readingSpan,
                reflow: (receivingWidth) => {
                  if (!Number.isFinite(receivingWidth) || receivingWidth < 320)
                    fail("static_figure_claim_unrepresentable");
                  const result = paintClaims("footer", receivingWidth);
                  return {
                    markup: result.claimPlate.join("\n"),
                    x: result.claimX,
                    y: result.claimSectionY,
                    width: result.claimWidth,
                    height: result.claimY - result.claimSectionY,
                    readingSpan: result.readingSpan,
                  };
                },
              }
            : null,
      },
      rasterWidth,
      carriers,
    };
  }
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="edition-title edition-description" font-family="JetBrains Mono" font-weight="400" font-style="normal" xml:space="preserve">`,
    `<title id="edition-title">${escape(scene.title)}</title>`,
    `<desc id="edition-description">${scene.summary === undefined ? "" : escape(scene.summary) + " "}${escape(framing)}</desc>`,
    `<rect width="${width}" height="${height}" fill="#f5f3ed"/>`,
    ...bodyPrelude,
    ...header,
    ...bodyContent,
    iconLicense,
    "</svg>",
    "",
  ];
  return {
    bytes: Buffer.from(lines.join("\n")),
    width,
    height,
    rasterWidth,
    carriers,
    readingSpan: primaryReadingSpan + chosen.readingSpan,
    reflowHeights: [notesHeight, chosen.claimY - chosen.claimSectionY],
  };
}

/** Allocate the complete reading at its receiving width without altering source geometry. */
export function composeStaticEditionSvg(scene, options = {}) {
  if (options.fragment === true) return paintStaticEditionSvg(scene, options, 400);
  const refusalCodes = ["static_edition_text_unrepresentable", "static_edition_geometry_invalid"];
  const candidates = [];
  let refusal;
  for (let width = 192; width <= 576; width += 16) {
    try {
      candidates.push(paintStaticEditionSvg(scene, options, width));
    } catch (cause) {
      if (!refusalCodes.includes(cause?.code)) throw cause;
      refusal ??= cause;
    }
  }
  if (!candidates.length) throw refusal;
  const result = selectMeasuredComposition(candidates, (candidate) => candidate, refusalCodes, {
    raster: options.raster === true,
    // A source-owned direction has no imposed desktop aspect to fill with padding.
    extent: ({ width, height }) => width * height,
  });
  return {
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    rasterWidth: result.rasterWidth,
    carriers: result.carriers,
  };
}
