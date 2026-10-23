import { maximumExtent } from "./edition-geometry.mjs";
import { number, textLines } from "./edition-text.mjs";

const claimColumnGap = 24;

export function paintClaimStatements(cards, commonLabels, { idPrefix, x, y, width, columns }) {
  const plate = [];
  const carriers = [];
  columns = Math.max(1, columns);
  const columnWidth = (width - (columns - 1) * claimColumnGap) / columns;
  let rowBottom = y;
  for (const [position, claim] of cards.entries()) {
    const column = position % columns;
    const columnX = x + column * (columnWidth + claimColumnGap);
    let cardY = y;
    const graphicId = `${idPrefix}c-${position}`;
    carriers.push({
      graphicId,
      source: { namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 },
    });
    plate.push(`<g data-graphic-id="${graphicId}">`);
    for (const fact of claim.facts) {
      if (commonLabels.has(fact.label)) continue;
      cardY =
        textLines(
          plate,
          `${fact.label}: ${fact.value}`,
          columnX,
          cardY,
          columnWidth,
          14,
          "#27352e",
          400,
          Math.floor((maximumExtent - cardY - 48) / (14 * 1.4)),
        ) + 5;
    }
    plate.push(
      `<line x1="${number(columnX)}" y1="${number(cardY + 5)}" x2="${number(columnX + columnWidth)}" y2="${number(cardY + 5)}" stroke="#d3dbd1" stroke-width="1"/>`,
      "</g>",
    );
    rowBottom = Math.max(rowBottom, cardY);
    if (column === columns - 1 || position === cards.length - 1) {
      y = rowBottom + 27;
      rowBottom = y;
    }
  }
  return { plate, carriers, y };
}

/** Exact common context occupies aligned rows at the receiving width. */
export function paintClaimContext(output, facts, { x, y, width, columns = 1 }) {
  columns = Math.min(columns, facts.length);
  const columnWidth = (width - (columns - 1) * claimColumnGap) / columns;
  for (let start = 0; start < facts.length; start += columns) {
    let bottom = y;
    for (const [column, { label, value }] of facts.slice(start, start + columns).entries())
      bottom = Math.max(
        bottom,
        textLines(
          output,
          `${label}: ${value}`,
          x + column * (columnWidth + claimColumnGap),
          y,
          columnWidth,
          14,
          "#27352e",
          400,
          Math.floor((maximumExtent - y - 48) / (14 * 1.4)),
        ) + 5,
      );
    y = bottom;
  }
  return y;
}

export function staticBodyGeometry(bounds, cards) {
  const columns = bounds === null ? Math.min(2, cards.length) : 1;
  return {
    columns,
    width: Math.max(
      640,
      Math.ceil((bounds?.width ?? 0) + 120),
      columns * 640 + Math.max(0, columns - 1) * claimColumnGap,
    ),
  };
}
