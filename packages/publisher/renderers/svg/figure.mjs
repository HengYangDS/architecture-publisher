import { fail } from '../../src/protocol/values.mjs';
import { editorialFraming } from '../../src/scene/framing.mjs';
import {
  SOURCE_REPORTED_TOPOLOGY_NOTE,
  UNLINKED_RELATION_NOTE,
} from '../../src/scene/claim-relations.mjs';
import { escapeStaticText as escape, wrapStaticText as wrap } from './text.mjs';

const margin = 54;
const gutter = 42;
const maximum = 12_000;
const sourceWidthLimit = 2_600;
const bodyLeading = 26;
const number = (value) => Number(value.toFixed(2));

function validGroups(groups) {
  if (!Array.isArray(groups)) return false;
  const ids = new Set();
  const labels = new Set();
  const members = new Set();
  for (const group of groups) {
    if (
      typeof group?.id !== 'string' ||
      !group.id ||
      ids.has(group.id) ||
      typeof group.label !== 'string' ||
      !group.label.trim() ||
      labels.has(group.label) ||
      !Array.isArray(group.members) ||
      !group.members.length
    )
      return false;
    ids.add(group.id);
    labels.add(group.label);
    for (const member of group.members) {
      if (typeof member !== 'string' || !member.trim() || members.has(member)) return false;
      members.add(member);
    }
  }
  return true;
}

function checkedViews(views) {
  if (!Array.isArray(views) || views.length < 1 || views.length > 256)
    fail('static_figure_views_invalid');
  const ids = new Set();
  return views.map(({ id, scene, rendered }) => {
    const parts = rendered?.parts;
    if (
      typeof id !== 'string' ||
      !/^[a-z][a-z0-9-]*$/u.test(id) ||
      ids.has(id) ||
      scene?.editorialViewId !== id ||
      !Array.isArray(scene.questions) ||
      !scene.questions.length ||
      scene.questions.some(({ text }) => typeof text !== 'string' || !text.trim()) ||
      typeof parts?.graph !== 'string' ||
      (scene.nodes?.length &&
        (!parts.figureTypes ||
          typeof parts.figureTypes.markup !== 'string' ||
          ![parts.figureTypes.width, parts.figureTypes.height].every(Number.isFinite))) ||
      !validGroups(parts.groups) ||
      !Array.isArray(parts.relations) ||
      (parts.claim !== null &&
        (typeof parts.claim?.markup !== 'string' ||
          ![parts.claim.x, parts.claim.y, parts.claim.width, parts.claim.height].every(
            Number.isFinite,
          ))) ||
      !Number.isSafeInteger(rendered.rasterWidth)
    )
      fail('static_figure_views_invalid');
    ids.add(id);
    return { id, scene, rendered, parts };
  });
}

function wrapped(output, value, x, y, width, size, color, weight = 400, limit = 12) {
  const lines = wrap(value, width, size, limit);
  const leading = Math.ceil(size * 1.7);
  for (const [index, line] of lines.entries())
    output.push(
      `<text x="${number(x)}" y="${number(y + index * leading)}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(line)}</text>`,
    );
  return y + lines.length * leading;
}

function section(output, heading, items, width, y) {
  if (!items.length) return y;
  output.push(
    `<text x="0" y="${number(y + 11)}" fill="#66736b" font-size="11" font-weight="600">${escape(heading)}</text>`,
  );
  y += 38;
  for (const item of items) {
    const lines = wrap(item.text, width, 14, 5);
    output.push('<g>');
    for (const line of lines) {
      output.push(
        `<text x="0" y="${number(y)}" fill="#27352e" font-size="14">${escape(line)}</text>`,
      );
      y += bodyLeading;
    }
    output.push('</g>');
    y += 9;
  }
  return y + 10;
}

function readingGroupKey(output, groups, width, y) {
  if (!groups.length) return y;
  output.push(
    `<text x="0" y="${number(y + 11)}" fill="#66736b" font-size="11" font-weight="600">READING GROUPS</text>`,
  );
  y += 38;
  const columns = Math.min(groups.length, width >= 1500 ? 3 : width >= 950 ? 2 : 1);
  const columnGap = 42;
  const columnWidth = (width - (columns - 1) * columnGap) / columns;
  for (let start = 0; start < groups.length; start += columns) {
    const row = groups
      .slice(start, start + columns)
      .map(({ label, members }) => wrap(`${label}: ${members.join(' · ')}`, columnWidth, 14, 4));
    for (const [column, lines] of row.entries()) {
      const x = column * (columnWidth + columnGap);
      for (const [index, line] of lines.entries())
        output.push(
          `<text x="${number(x)}" y="${number(y + index * bodyLeading)}" fill="#27352e" font-size="14">${escape(line)}</text>`,
        );
    }
    y += Math.max(...row.map((lines) => lines.length * bodyLeading)) + 9;
  }
  return y + 10;
}

function relationColumns(items, width) {
  const candidates = [1, 2]
    .filter((columns) => columns === 1 || (width >= 760 && items.length > 1))
    .map((columns) => {
      const columnWidth = (width - (columns - 1) * 28) / columns;
      const measured = items.map((item) => {
        const lines = wrap(item.text, columnWidth, 14, 5);
        return { ...item, lines, height: lines.length * bodyLeading + 13 };
      });
      const prefix = [0];
      for (const item of measured) prefix.push(prefix.at(-1) + item.height);
      let split = items.length;
      if (columns === 2) {
        let best = Infinity;
        for (let index = 1; index < items.length; index += 1) {
          const height = Math.max(prefix[index], prefix.at(-1) - prefix[index]);
          if (height < best) {
            best = height;
            split = index;
          }
        }
      }
      const entries = measured.map((item, index) => ({
        ...item,
        column: index < split ? 0 : 1,
        y: index < split ? prefix[index] : prefix[index] - prefix[split],
      }));
      return {
        entries,
        columns,
        columnWidth,
        height:
          columns === 1 ? prefix.at(-1) : Math.max(prefix[split], prefix.at(-1) - prefix[split]),
      };
    });
  return candidates.sort((a, b) => a.height - b.height || a.columns - b.columns)[0];
}

function sourceStatus(scene) {
  if (scene.claimCards === undefined || !scene.edges.length) return null;
  const linked = new Set(
    (scene.claimRelationLinks ?? []).map(({ relationAssertionId }) => relationAssertionId),
  );
  const unlinked = scene.sourceAssertionCarriers.some(
    ({ assertionId, kind }) => kind === 'relation' && !linked.has(assertionId),
  );
  if (!unlinked) return null;
  return scene.claimCards.length ? UNLINKED_RELATION_NOTE : SOURCE_REPORTED_TOPOLOGY_NOTE;
}

function sharedNotes(views, width) {
  const status = new Map();
  const add = (map, text, id) => map.set(text, new Set([...(map.get(text) ?? []), id]));
  for (const { id, scene } of views) {
    const note = sourceStatus(scene);
    if (note) add(status, note, id);
  }
  const attributed = (entries) =>
    [...entries].map(([text, ids]) => ({
      text: ids.size === views.length ? text : `${[...ids].join(', ')}: ${text}`,
    }));
  const output = [];
  let y = 0;
  y = section(output, 'SOURCE STATUS', attributed(status), width, y);
  return { markup: output.join('\n'), height: y };
}

function panel(view, width, options = {}) {
  const { scene, parts } = view;
  const notesWidth = options.notesWidth ?? width;
  if (notesWidth < 320 || notesWidth > width) fail('static_figure_width_unrepresentable');
  const output = [];
  let y = 0;
  for (const question of scene.questions)
    y = wrapped(output, question.text, 0, y + 19, width, 18, '#21332a', 600, 4) + 8;
  y += 22;
  const graphStart = y;
  if (parts.bounds) {
    const { bounds } = parts;
    const graphAreaWidth = options.graphAlign === 'local-center' ? notesWidth : width;
    const graphX = (graphAreaWidth - bounds.width) / 2;
    if (graphX < 0) fail('static_figure_width_unrepresentable');
    output.push(
      `<g transform="translate(${number(graphX - bounds.x)} ${number(y - bounds.y)})">`,
      parts.graph,
      '</g>',
    );
    y += bounds.height + 28;
  }
  if (parts.figureTypes) {
    if (parts.figureTypes.width > width) fail('static_figure_width_unrepresentable');
    output.push(`<g transform="translate(0 ${number(y)})">${parts.figureTypes.markup}</g>`);
    y += parts.figureTypes.height + 14;
  }
  y = readingGroupKey(output, parts.groups, notesWidth, y);
  const notesStart = y;
  if (parts.relations.length) {
    const context = parts.relations[0].context;
    const sharedContext =
      typeof context === 'string' &&
      context.trim() &&
      parts.relations.every((item) => item.context === context);
    output.push(
      `<text x="0" y="${number(y + 11)}" fill="#66736b" font-size="11" font-weight="600">SOURCE RELATIONS</text>`,
    );
    y += 38;
    if (sharedContext) y = wrapped(output, context, 0, y, notesWidth, 12, '#66736b') + 8;
    const items = sharedContext
      ? parts.relations.map((item) => {
          const marker = ` · ${context}: `;
          const index = item.text.lastIndexOf(marker);
          if (index < 0) fail('static_figure_relation_context_invalid');
          return {
            ...item,
            text: `${item.text.slice(0, index)} · ${item.text.slice(index + marker.length)}`,
          };
        })
      : parts.relations;
    const columns = relationColumns(items, notesWidth);
    for (const item of columns.entries) {
      const x = item.column * (columns.columnWidth + 28);
      output.push(`<g data-graphic-id="${escape(item.graphicId)}">`);
      for (const [index, line] of item.lines.entries())
        output.push(
          `<text x="${number(x)}" y="${number(y + item.y + index * bodyLeading)}" fill="#27352e" font-size="14">${escape(line)}</text>`,
        );
      output.push('</g>');
    }
    y += columns.height + 10;
  }
  if (parts.claim) {
    const claim = parts.claim;
    if (claim.width > width || claim.height <= 0) fail('static_figure_claim_unrepresentable');
    output.push(
      `<text x="0" y="${number(y + 11)}" fill="#66736b" font-size="11" font-weight="600">SOURCE CLAIMS</text>`,
    );
    y += 30;
    output.push(
      `<g transform="translate(${number((width - claim.width) / 2 - claim.x)} ${number(y - claim.y)})">`,
      claim.markup,
      '</g>',
    );
    y += claim.height + 20;
  }
  y = section(
    output,
    'DECLARED LIMITS',
    Object.values(scene.limitsByQuestion)
      .flat()
      .map(({ reason }) => ({ text: reason })),
    notesWidth,
    y,
  );
  y = section(
    output,
    'EDITORIAL ASSERTIONS',
    scene.editorialAssertions.map(({ statement, proponent }) => ({
      text: `${statement} · Editorial judgment · ${proponent} · unverified`,
    })),
    notesWidth,
    y,
  );
  return { markup: output.join('\n'), height: Math.ceil(y), graphStart, notesStart };
}

/** Compose scene parts on one canvas; a completed page is not a panel primitive. */
export function composeStaticFigureSvg({ title, summary, rasterWidth, views }) {
  const selected = checkedViews(views);
  const editor = selected[0].scene.edition?.editor;
  if (
    typeof editor !== 'string' ||
    !editor.trim() ||
    selected.some(({ scene }) => scene.edition?.editor !== editor)
  )
    fail('static_figure_editor_ambiguous');
  const framing = editorialFraming(editor);
  if (!Number.isSafeInteger(rasterWidth) || rasterWidth < 320 || rasterWidth > maximum)
    fail('static_figure_width_invalid');
  const available = Math.min(sourceWidthLimit, rasterWidth) - 2 * margin;
  const minimumWidths = selected.map(({ parts }) =>
    Math.max(620, Math.ceil(parts.bounds?.width ?? 0), Math.ceil(parts.claim?.width ?? 0)),
  );
  const even = Math.max(...minimumWidths.filter((_, index) => index % 2 === 0));
  const odd = Math.max(...minimumWidths.filter((_, index) => index % 2 === 1));
  let columns = selected.length > 1 && even + odd + gutter <= available ? 2 : 1;
  let widths = columns === 2 ? [even, odd] : [Math.max(...minimumWidths)];
  let painted = selected.map((view, index) => panel(view, widths[index % columns]));
  if (columns === 2 && selected.length === 2) {
    const shorter = painted[0].height <= painted[1].height ? 0 : 1;
    const unused = Math.max(
      0,
      Math.abs(painted[0].height - painted[1].height) -
        sharedNotes(selected, widths[shorter]).height -
        32,
    );
    if (unused / Math.max(...painted.map(({ height }) => height)) > 0.35) {
      columns = 1;
      widths = [Math.max(...minimumWidths)];
      painted = selected.map((view) => panel(view, widths[0]));
    }
  }
  const width = Math.ceil(
    widths.reduce((sum, value) => sum + value, 0) + (columns - 1) * gutter + 2 * margin,
  );
  if (width > sourceWidthLimit || width > rasterWidth) fail('static_figure_width_unrepresentable');
  let sharedSidecar = null;
  if (columns === 1 && !selected.at(-1).parts.claim) {
    const index = selected.length - 1;
    const common = sharedNotes(selected, widths[0]);
    const stackedHeight = painted[index].height + (common.height ? 25 + common.height : 0);
    for (const asideWidth of [360, 420, 480, 540]) {
      const localWidth = widths[0] - asideWidth - gutter;
      if (localWidth < 620) continue;
      let aside;
      let item;
      try {
        aside = sharedNotes(selected, asideWidth);
        const graphFits = (selected[index].parts.bounds?.width ?? Infinity) <= localWidth;
        item = panel(selected[index], widths[0], {
          notesWidth: localWidth,
          graphAlign: graphFits ? 'local-center' : 'center',
        });
        const asideY = graphFits ? item.graphStart : item.notesStart;
        item.height = Math.max(item.height, Math.ceil(asideY + aside.height + 20));
        if (
          aside.height &&
          item.height < stackedHeight &&
          (!sharedSidecar || item.height < sharedSidecar.item.height)
        )
          sharedSidecar = { index, localWidth, asideWidth, asideY, aside, item };
      } catch (cause) {
        if (cause?.code !== 'static_edition_text_unrepresentable') throw cause;
      }
    }
    if (sharedSidecar) painted[index] = sharedSidecar.item;
  }

  const content = [];
  let headerY = margin + 31;
  headerY = wrapped(content, title, margin, headerY, width - 2 * margin, 32, '#21332a', 600, 2) + 4;
  headerY =
    wrapped(content, summary, margin, headerY, width - 2 * margin, 15, '#53645a', 400, 5) + 4;
  headerY =
    wrapped(content, framing, margin, headerY, width - 2 * margin, 12, '#66736b', 400, 5) + 16;
  content.push(
    `<line x1="${margin}" y1="${number(headerY)}" x2="${number(width - margin)}" y2="${number(headerY)}" stroke="#c4ccc2" stroke-width="1"/>`,
  );
  const top = headerY + 24;
  const placements = [];
  let bottom = top;
  for (let start = 0, rowY = top; start < selected.length; start += columns) {
    const row = painted.slice(start, start + columns);
    const rowHeight = Math.max(...row.map(({ height }) => height));
    for (const [column, item] of row.entries()) {
      const index = start + column;
      const x = margin + (column ? widths[0] + gutter : 0);
      content.push(
        `<g data-static-view="${escape(selected[index].id)}" transform="translate(${number(x)} ${number(rowY)})">`,
        item.markup,
        '</g>',
      );
      placements.push({
        id: selected[index].id,
        x,
        y: rowY,
        width: widths[column],
        height: item.height,
      });
    }
    bottom = rowY + rowHeight;
    rowY = bottom + 35;
  }

  const shorter = selected.length === 1 || painted[0].height <= painted[1].height ? 0 : 1;
  const sharedWidth = columns === 2 && selected.length === 2 ? widths[shorter] : width - 2 * margin;
  const common = sharedNotes(selected, sharedWidth);
  if (common.height) {
    if (sharedSidecar) {
      const x = margin + sharedSidecar.localWidth + gutter;
      const y = placements[sharedSidecar.index].y + sharedSidecar.asideY;
      content.push(
        `<g data-common-sidecar="true" transform="translate(${number(x)} ${number(y)})">`,
        `<line x1="${-gutter / 2}" y1="0" x2="${-gutter / 2}" y2="${number(sharedSidecar.aside.height)}" stroke="#c4ccc2" stroke-width="1"/>`,
        sharedSidecar.aside.markup,
        '</g>',
      );
    } else if (columns === 2 && selected.length === 2) {
      const x = margin + (shorter ? widths[0] + gutter : 0);
      const y = top + painted[shorter].height + 12;
      content.push(
        `<g transform="translate(${number(x)} ${number(y)})">`,
        `<line x1="0" y1="0" x2="${number(sharedWidth)}" y2="0" stroke="#c4ccc2" stroke-width="1"/>`,
        `<g transform="translate(0 20)">${common.markup}</g>`,
        '</g>',
      );
      bottom = Math.max(bottom, y + 20 + common.height);
    } else {
      content.push(
        `<line x1="${margin}" y1="${number(bottom + 4)}" x2="${number(width - margin)}" y2="${number(bottom + 4)}" stroke="#c4ccc2" stroke-width="1"/>`,
        `<g transform="translate(${margin} ${number(bottom + 25)})">${common.markup}</g>`,
      );
      bottom += 25 + common.height;
    }
  }
  const height = Math.ceil(bottom + margin);
  if (height > maximum) fail('static_figure_geometry_unrepresentable');
  const defs = selected.map(
    (_, index) =>
      `<marker id="static-view-${index}-source-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 10 4 L 0 8 Z" fill="#60786a"/></marker>`,
  );
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="static-figure-title static-figure-description" font-family="JetBrains Mono" font-weight="400" font-style="normal" xml:space="preserve">`,
    `<title id="static-figure-title">${escape(title)}</title>`,
    `<desc id="static-figure-description">${escape(summary)} ${escape(framing)}</desc>`,
    `<rect width="${width}" height="${height}" fill="#f5f3ed"/>`,
    `<defs>${defs.join('')}</defs>`,
    ...content,
    ...new Set(selected.map(({ parts }) => parts.iconLicense).filter(Boolean)),
    '</svg>',
    '',
  ];
  return { bytes: Buffer.from(svg.join('\n')), width, height, rasterWidth, placements };
}
