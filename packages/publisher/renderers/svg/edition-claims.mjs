import { maximumExtent } from "./edition-geometry.mjs";
import { number, textLines } from "./edition-text.mjs";
import { selectMeasuredComposition } from "./composition.mjs";
import { measureStaticText } from "./text.mjs";

const claimColumnGap = 24;

/** Shared headers are valid only for the same complete, ordered record shape. */
function tableColumns(cards, commonLabels, options) {
  if (cards.length < 2) return null;
  const rows = cards.map((card) => card.facts.filter(({ label }) => !commonLabels.has(label)));
  const labels = rows[0].map(({ label }) => label);
  if (
    !labels.length ||
    rows.some((row) => JSON.stringify(row.map(({ label }) => label)) !== JSON.stringify(labels))
  )
    return null;
  const fields = labels.map((label, index) => ({
    label,
    size: 14,
    values: rows.map((row) => row[index].value),
  }));
  if (options.headingFor)
    fields.unshift({ label: "Applies to", size: 11, values: cards.map(options.headingFor) });
  const columns = fields.map((field) => {
    const minimum =
      Math.max(
        measureStaticText(field.label, 11),
        ...field.values.flatMap((value) =>
          value.split(/\s+/u).map((word) => measureStaticText(word, field.size)),
        ),
      ) + 2;
    return {
      ...field,
      width: minimum,
      growth: Math.max(
        0,
        ...field.values.map((value) => measureStaticText(value, field.size) + 2 - minimum),
      ),
    };
  });
  const available = options.width - claimColumnGap * (columns.length - 1);
  const minimum = columns.reduce((sum, column) => sum + column.width, 0);
  if (minimum > available) return null;
  const growth = columns.reduce((sum, column) => sum + column.growth, 0);
  const extra = Math.min(available - minimum, growth);
  for (const column of columns) column.width += growth ? (extra * column.growth) / growth : 0;
  return columns;
}

function paintTable(cards, columns, { idPrefix, x, y, width }) {
  const top = y;
  const plate = [];
  const carriers = [];
  let readingSpan = 0;
  let columnX = x;
  for (const column of columns) {
    column.x = columnX;
    const bottom = textLines(plate, column.label, columnX, y, column.width, 11, "#66736b", 600, 1);
    readingSpan += bottom - y;
    columnX += column.width + claimColumnGap;
  }
  y += 11 * 1.4 + 16;
  for (const [index, claim] of cards.entries()) {
    const graphicId = `${idPrefix}c-${index}`;
    plate.push(`<g data-graphic-id="${graphicId}">`);
    let bottom = y;
    for (const column of columns) {
      const next = textLines(
        plate,
        column.values[index],
        column.x,
        y,
        column.width,
        column.size,
        "#27352e",
        400,
        Math.floor((maximumExtent - y - 48) / (column.size * 1.4)),
      );
      readingSpan += next - y;
      bottom = Math.max(bottom, next);
    }
    plate.push(
      `<line x1="${number(x)}" y1="${number(bottom + 5)}" x2="${number(x + width)}" y2="${number(bottom + 5)}" stroke="#d3dbd1" stroke-width="1"/>`,
      "</g>",
    );
    carriers.push({
      graphicId,
      source: { namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 },
    });
    y = bottom + 27;
  }
  return { plate, carriers, y, width, height: y - top, readingSpan };
}

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
  const table = tableColumns(cards, commonLabels, options);
  return selectMeasuredComposition(
    [...Array.from({ length: capacity }, (_, index) => index + 1), ...(table ? [table] : [])],
    (columns) =>
      Array.isArray(columns)
        ? paintTable(cards, columns, options)
        : paintStatements(cards, commonLabels, { ...options, columns }),
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
