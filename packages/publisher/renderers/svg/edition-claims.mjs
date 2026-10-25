import { maximumExtent } from "./edition-geometry.mjs";
import { number, textLines } from "./edition-text.mjs";
import { selectMeasuredComposition } from "./composition.mjs";

const claimColumnGap = 24;

function paintStatements(cards, commonLabels, { idPrefix, x, y, width, columns, headingFor }) {
  const plate = [];
  const carriers = [];
  const top = y;
  let readingSpan = 0;
  const columnWidth = (width - (columns - 1) * claimColumnGap) / columns;
  for (let start = 0; start < cards.length; start += columns) {
    const row = cards.slice(start, start + columns).map((claim, column) => ({
      claim,
      graphicId: `${idPrefix}c-${start + column}`,
      columnX: x + column * (columnWidth + claimColumnGap),
      content: [],
      facts: claim.facts.filter(({ label }) => !commonLabels.has(label)),
    }));
    let cardY = y;
    if (headingFor) {
      let headingBottom = cardY;
      for (const { claim, columnX, content } of row) {
        const bottom = textLines(
          content,
          headingFor(claim),
          columnX,
          cardY,
          columnWidth,
          11,
          "#66736b",
          600,
          2,
        );
        readingSpan += bottom - cardY;
        headingBottom = Math.max(headingBottom, bottom);
      }
      cardY = headingBottom + 13;
    }
    // Each field track receives the complete ink of every peer before advancing.
    for (let index = 0; index < Math.max(...row.map(({ facts }) => facts.length)); index++) {
      let fieldBottom = cardY;
      for (const { columnX, content, facts } of row) {
        const fact = facts[index];
        if (!fact) continue;
        const bottom = textLines(
          content,
          `${fact.label}: ${fact.value}`,
          columnX,
          cardY,
          columnWidth,
          14,
          "#27352e",
          400,
          Math.floor((maximumExtent - cardY - 48) / (14 * 1.4)),
        );
        readingSpan += bottom - cardY;
        fieldBottom = Math.max(fieldBottom, bottom);
      }
      cardY = fieldBottom + 5;
    }
    for (const { graphicId, claim } of row)
      carriers.push({
        graphicId,
        source: { namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 },
      });
    for (const { graphicId, columnX, content } of row)
      plate.push(
        `<g data-graphic-id="${graphicId}">`,
        ...content,
        `<line x1="${number(columnX)}" y1="${number(cardY + 5)}" x2="${number(columnX + columnWidth)}" y2="${number(cardY + 5)}" stroke="#d3dbd1" stroke-width="1"/>`,
        "</g>",
      );
    y = cardY + 27;
  }
  return { plate, carriers, y, width, height: y - top, readingSpan };
}

/** Reflow complete records before choosing their aligned reading columns. */
export function paintClaimStatements(cards, commonLabels, options) {
  if (!cards.length) return { plate: [], carriers: [], y: options.y, readingSpan: 0 };
  const capacity = Math.min(
    cards.length,
    Math.max(1, Math.floor((options.width + claimColumnGap) / (480 + claimColumnGap))),
  );
  return selectMeasuredComposition(
    Array.from({ length: capacity }, (_, index) => index + 1),
    (columns) => paintStatements(cards, commonLabels, { ...options, columns }),
    ["static_edition_text_unrepresentable", "static_edition_geometry_invalid"],
    { raster: false, extent: ({ height }) => height },
  );
}

/** Exact common context occupies aligned rows at the receiving width. */
export function paintClaimContext(output, facts, { x, y, width, columns = 1 }) {
  let readingSpan = 0;
  columns = Math.min(columns, facts.length);
  const columnWidth = (width - (columns - 1) * claimColumnGap) / columns;
  for (let start = 0; start < facts.length; start += columns) {
    let bottom = y;
    for (const [column, { label, value }] of facts.slice(start, start + columns).entries()) {
      const next = textLines(
        output,
        `${label}: ${value}`,
        x + column * (columnWidth + claimColumnGap),
        y,
        columnWidth,
        14,
        "#27352e",
        400,
        Math.floor((maximumExtent - y - 48) / (14 * 1.4)),
      );
      readingSpan += next - y;
      bottom = Math.max(bottom, next + 5);
    }
    y = bottom;
  }
  return { y, readingSpan };
}

export function staticBodyGeometry(bounds, cards) {
  const columns = bounds === null ? Math.min(2, cards.length) : 1;
  return {
    columns,
    width: cards.length
      ? Math.max(
          640,
          Math.ceil((bounds?.width ?? 0) + 32),
          columns * 640 + Math.max(0, columns - 1) * claimColumnGap,
        )
      : Math.ceil((bounds?.width ?? 0) + 32),
  };
}
