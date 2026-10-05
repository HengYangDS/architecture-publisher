import { fail } from '../../src/protocol/values.mjs';
import { renderFigureIcon } from '../icons/index.mjs';
import { renderFigureTypeLegend } from './graph-svg.mjs';

const width = 1480;
const margin = 0;
const nodeHeight = 52;
const graphTop = 42;
const rankGap = 94;
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const measuredWidth = (value, size) => [...value].length * size * 0.61;

function lines(value, available, size, limit) {
  if (typeof value !== 'string' || !value.trim()) fail('render_responsibility_text_invalid');
  const result = [];
  let line = '';
  for (const word of value.trim().split(/\s+/u)) {
    if (measuredWidth(word, size) > available) fail('render_responsibility_text_unrepresentable');
    const next = line ? `${line} ${word}` : word;
    if (measuredWidth(next, size) <= available) line = next;
    else {
      result.push(line);
      line = word;
    }
  }
  if (line) result.push(line);
  if (result.length > limit) fail('render_responsibility_text_unrepresentable');
  return result;
}

function textRows(value, x, y, available, size, limit, attributes = '') {
  return lines(value, available, size, limit)
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * size * 1.4}" font-size="${size}" ${attributes}>${escape(line)}</text>`,
    )
    .join('');
}

function roleLayout(page, groups, roleByNode) {
  const count = page.form.roles.length;
  const roleWidth = (width - 2 * margin) / count;
  const nodeWidth = count > 4 ? 118 : 152;
  const centers = page.form.roles.map((_, index) => margin + roleWidth * (index + 0.5));
  const internal = page.form.roles.map(() => []);
  const cross = [];
  for (const relation of page.relations) {
    const from = roleByNode.get(relation.source);
    const to = roleByNode.get(relation.target);
    if (from === undefined || to === undefined) fail('render_responsibility_page_invalid');
    if (from === to) internal[from].push(relation);
    else cross.push(relation);
  }
  const positions = new Map();
  let highest = 0;
  for (const [index, role] of page.form.roles.entries()) {
    const members = groups.get(role.groupId).nodeIds;
    if (members.length === 1) continue;
    const rank = new Map(members.map((id) => [id, 0]));
    const remaining = new Set(members);
    while (remaining.size) {
      const next = members.find(
        (id) =>
          remaining.has(id) &&
          internal[index]
            .filter((relation) => relation.target === id)
            .every((relation) => !remaining.has(relation.source)),
      );
      if (!next) fail('render_responsibility_page_infeasible');
      remaining.delete(next);
      for (const relation of internal[index].filter((item) => item.source === next))
        rank.set(relation.target, Math.max(rank.get(relation.target), rank.get(next) + 1));
    }
    const levels = new Map();
    for (const id of members) levels.set(rank.get(id), [...(levels.get(rank.get(id)) ?? []), id]);
    if (levels.size > 3 || [...levels.values()].some((items) => items.length > 2))
      fail('render_responsibility_page_infeasible');
    for (const [level, items] of levels) {
      highest = Math.max(highest, level);
      if (items.length === 2 && nodeWidth * 2 + 12 > roleWidth)
        fail('render_responsibility_page_infeasible');
      for (const [at, id] of items.entries())
        positions.set(id, {
          x: centers[index] + (at - (items.length - 1) / 2) * (nodeWidth + 14),
          y: graphTop + level * rankGap,
        });
    }
  }
  if (!positions.size) {
    const first = groups.get(page.form.roles[0].groupId).nodeIds[0];
    positions.set(first, { x: centers[0], y: graphTop });
  }
  for (let pass = 0; pass < count; pass += 1)
    for (const relation of cross) {
      const from = positions.get(relation.source);
      const to = positions.get(relation.target);
      if (from && !to)
        positions.set(relation.target, {
          x: centers[roleByNode.get(relation.target)],
          y: from.y,
        });
      if (to && !from)
        positions.set(relation.source, {
          x: centers[roleByNode.get(relation.source)],
          y: to.y,
        });
    }
  for (const [id, index] of roleByNode)
    if (!positions.has(id))
      positions.set(id, { x: centers[index], y: graphTop + (highest * rankGap) / 2 });
  return {
    centers,
    roleWidth,
    nodeWidth,
    positions,
    graphHeight: Math.max(...[...positions.values()].map(({ y }) => y)) + nodeHeight + 34,
  };
}

function basisHtml(basis) {
  if (basis.kind === 'editorial')
    return `<p>${escape(basis.statement)}</p><small>Editorial judgment · ${escape(basis.proponent)} · unverified</small>`;
  return `<p>Selected source Claim · editorial interpretation</p>${basis.conditions.map(({ label, value }) => `<small>${escape(label)} · ${escape(value)}</small>`).join('')}`;
}

function handoffHtml(page, centers, pageIndex) {
  if (!page.form.handoffs.length) return '';
  const roles = page.form.roles;
  const seen = new Set();
  const rows = page.form.handoffs.map(({ fromGroup, toGroup, basis }) => {
    const from = roles.findIndex((role) => role.groupId === fromGroup);
    const to = roles.findIndex((role) => role.groupId === toGroup);
    if (from < 0 || to < 0) fail('render_responsibility_page_invalid');
    if (from === to) fail('render_responsibility_lane_invalid');
    const pair = `${from}:${to}`;
    if (seen.has(pair)) fail('render_responsibility_page_invalid');
    seen.add(pair);
    const start = centers[from];
    const end = centers[to];
    const direction = end > start ? 1 : -1;
    const markerId = `handoff-arrow-${pageIndex}-${from}-${to}`;
    return `<div class="form-map-handoff" data-form-handoff="${escape(fromGroup)}:${escape(toGroup)}"><svg viewBox="0 0 ${width} 44" aria-hidden="true"><defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="var(--reader-warm)" stroke-width="1.4"/></marker></defs><path data-handoff-source-stem d="M${start} 0 V22" fill="none" stroke="var(--reader-warm)" stroke-width="1.5"/><path data-handoff-target-stem d="M${end} 0 V22" fill="none" stroke="var(--reader-warm)" stroke-width="1.5"/><path data-handoff-route d="M${start} 22 L${end - direction * 8} 22" fill="none" stroke="var(--reader-warm)" stroke-width="2.2" marker-end="url(#${markerId})"/></svg><p><strong>Editorial handoff</strong> · ${escape(basis.statement)}</p></div>`;
  });
  return `<div class="form-map-handoffs">${rows.join('')}</div>`;
}

function graphHtml(page, layout, nodes, roleByNode, pageIndex, icons) {
  const { positions, nodeWidth, graphHeight } = layout;
  const output = [];
  const titleId = `form-map-title-${pageIndex}`;
  const descriptionId = `form-map-description-${pageIndex}`;
  const sourceMarkerId = `form-source-arrow-${pageIndex}`;
  output.push(
    `<svg class="form-map-graph" viewBox="0 0 ${width} ${graphHeight}" role="img" aria-labelledby="${titleId}" aria-describedby="${descriptionId}"><title id="${titleId}">Selected source relationships</title><desc id="${descriptionId}">${escape(page.questions[0].text)}; relation direction and editorial handoff are separate.</desc><defs><marker id="${sourceMarkerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="none" stroke="var(--reader-accent)" stroke-width="1.4"/></marker></defs>`,
  );
  for (const relation of page.relations) {
    const first = positions.get(relation.source);
    const last = positions.get(relation.target);
    const internal = roleByNode.get(relation.source) === roleByNode.get(relation.target);
    const forward = last.x > first.x;
    const start = internal
      ? [first.x, first.y + nodeHeight]
      : [first.x + ((forward ? 1 : -1) * nodeWidth) / 2, first.y + nodeHeight / 2];
    const end = internal
      ? [last.x, last.y - 6]
      : [last.x - (forward ? 1 : -1) * (nodeWidth / 2 + 6), last.y + nodeHeight / 2];
    if (
      (internal && end[1] <= start[1]) ||
      (!internal && (Math.abs(end[0] - start[0]) <= 2 || Math.abs(end[1] - start[1]) > 2))
    )
      fail('render_responsibility_page_infeasible');
    const middleX = (start[0] + end[0]) / 2;
    const middleY = (start[1] + end[1]) / 2;
    const label = relation.label?.trim() ? relation.label : null;
    const available = internal ? 110 : Math.abs(end[0] - start[0]) + 18;
    if (label && measuredWidth(label, 12) > available)
      fail('render_responsibility_text_unrepresentable');
    const labelX = internal ? middleX + (last.x < first.x ? -50 : 50) : middleX;
    const anchor = internal ? (last.x < first.x ? 'end' : 'start') : 'middle';
    const labelY = internal ? middleY + 4 : middleY - 12;
    output.push(
      `<g data-graphic-id="${escape(relation.id)}" data-source="${escape(relation.source)}" data-target="${escape(relation.target)}"><path d="M${start[0]} ${start[1]} L${end[0]} ${end[1]}" fill="none" stroke="var(--reader-accent)" stroke-width="2" marker-end="url(#${sourceMarkerId})"${relation.direction === 'bidirectional' ? ` marker-start="url(#${sourceMarkerId})"` : ''}/>${label ? textRows(label, labelX, labelY, available, 12, 1, `text-anchor="${anchor}" fill="var(--reader-ink)" font-weight="600"`) : ''}</g>`,
    );
  }
  for (const node of page.nodes) {
    const position = positions.get(node.id);
    const labelWidth = nodeWidth - 42;
    const labelX = position.x + 12;
    const labels = lines(node.label, labelWidth, 12, 2);
    output.push(
      `<g data-graphic-id="${escape(node.id)}" color="var(--reader-ink)"><rect x="${position.x - nodeWidth / 2}" y="${position.y}" width="${nodeWidth}" height="${nodeHeight}" rx="7" fill="var(--reader-panel)" stroke="var(--reader-line)" stroke-width="1.5"/>${renderFigureIcon(node.icon, icons, { x: position.x - nodeWidth / 2 + 9, y: position.y + (nodeHeight - 11) / 2 })}`,
    );
    labels.forEach((label, index) => {
      const y = position.y + (labels.length === 1 ? 32 : 23 + index * 17);
      output.push(
        `<text x="${labelX}" y="${y}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--reader-ink)">${escape(label)}</text>`,
      );
    });
    output.push('</g>');
  }
  output.push('</svg>');
  return output.join('');
}

function claimHtml(claim, page, nodes) {
  const shown = [
    'Claim plane',
    'Condition',
    'Scope',
    'Claimed maturity',
    'Claimant-declared validity',
  ];
  const facts = new Map(claim.facts.map(({ label, value }) => [label, value]));
  let heading = 'Selected source Claim';
  if (claim.relationOrdinal !== undefined) {
    const relation = page.relations[claim.relationOrdinal - 1];
    if (!relation || !nodes.has(relation.source) || !nodes.has(relation.target))
      fail('render_responsibility_page_invalid');
    const arrow = relation.direction === 'bidirectional' ? '↔' : '→';
    heading = `Claim on ${nodes.get(relation.source).label} ${arrow} ${nodes.get(relation.target).label}`;
  }
  return `<aside class="form-map-claim" data-graphic-id="${escape(claim.graphicId)}"><strong>${escape(heading)}</strong><dl>${shown.map((label) => `<div><dt>${escape(label)}</dt><dd>${escape(facts.get(label) ?? 'not reported')}</dd></div>`).join('')}</dl></aside>`;
}

/** Compose an interactive-medium responsibility map from selected Page meaning. */
export function responsibilityMapHtml(page, pageIndex, icons) {
  if (!Number.isSafeInteger(pageIndex) || pageIndex < 0) fail('render_responsibility_page_invalid');
  const count = page.form.roles.length;
  const groups = new Map(page.groups.map((group) => [group.id, group]));
  const nodes = new Map(page.nodes.map((node) => [node.id, node]));
  const roleByNode = new Map();
  for (const [index, role] of page.form.roles.entries()) {
    const group = groups.get(role.groupId);
    if (!group || !Array.isArray(group.nodeIds) || !group.nodeIds.length)
      fail('render_responsibility_page_invalid');
    for (const id of group.nodeIds) {
      if (!nodes.has(id) || roleByNode.has(id)) fail('render_responsibility_page_invalid');
      roleByNode.set(id, index);
    }
  }
  if (roleByNode.size !== nodes.size) fail('render_responsibility_page_invalid');
  const layout = roleLayout(page, groups, roleByNode);
  const roles = page.form.roles
    .map(({ groupId, basis }) => {
      const group = groups.get(groupId);
      return `<section class="form-map-role" data-graphic-id="${escape(group.id)}"><h3>${escape(group.label)}</h3>${basisHtml(basis)}</section>`;
    })
    .join('');
  const qualifierRows = page.relations.flatMap((relation) =>
    (relation.sourceQualifiers ?? []).map(
      ({ name, value }) =>
        `<span><strong>${escape(relation.label)}</strong> · ${escape(name)}: ${escape(value)}</span>`,
    ),
  );
  const claims = (page.claims ?? []).map((claim) => claimHtml(claim, page, nodes)).join('');
  const notes =
    qualifierRows.length || claims
      ? `<figcaption class="form-map-evidence">${qualifierRows.length ? `<p>${qualifierRows.join(' · ')}</p>` : ''}${claims}</figcaption>`
      : '';
  return `<figure class="form-map" style="--form-count:${count}"><div class="form-map-roles">${roles}</div>${handoffHtml(page, layout.centers, pageIndex)}${graphHtml(page, layout, nodes, roleByNode, pageIndex, icons)}${renderFigureTypeLegend(page.nodes, icons)}${notes}</figure>`;
}

export const responsibilityMapCss = `
.form-map{margin:0;border-top:2px solid var(--reader-ink);border-bottom:1px solid var(--reader-line);background:var(--reader-panel)}
.form-map-roles{display:grid;grid-template-columns:repeat(var(--form-count),minmax(0,1fr))}
.form-map-role{min-width:0;min-height:126px;padding:13px 14px 12px;border-right:1px solid var(--reader-rule)}
.form-map-role:last-child{border-right:0}.form-map-role h3{font-size:17px;line-height:1.3;margin:0 0 11px}
.form-map-role p{font-size:12px;line-height:1.5;margin:0 0 5px;overflow-wrap:anywhere}
.form-map-role small{display:block;font-size:10px;line-height:1.4;color:var(--reader-muted);overflow-wrap:anywhere}
.form-map-handoffs{padding:0 0 2px;border-bottom:1px solid var(--reader-rule)}
.form-map-handoff svg{display:block;width:100%;height:auto}
.form-map-handoff p{font-size:12px;line-height:1.45;text-align:center;margin:0 24px 8px;overflow-wrap:anywhere}
.form-map-handoff strong{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--reader-warm)}
.form-map-graph{display:block;width:100%;height:auto;min-width:0}
.form-map-evidence{border-top:1px solid var(--reader-rule);padding:10px 14px 12px}
.form-map-evidence>p{font-size:11px;line-height:1.45;color:var(--reader-muted);margin:0 0 8px;overflow-wrap:anywhere}
.form-map-claim{display:grid;grid-template-columns:170px minmax(0,1fr);gap:12px;align-items:start;padding-top:6px}
.form-map-claim>strong{font-size:11px;color:var(--reader-warm)}.form-map-claim dl{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:0}
.form-map-claim dt{font-size:10px;color:var(--reader-muted)}.form-map-claim dd{font-size:11px;line-height:1.4;margin:3px 0 0;overflow-wrap:anywhere}
`;
