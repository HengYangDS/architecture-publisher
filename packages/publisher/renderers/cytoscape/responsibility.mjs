import { fail } from '../../src/protocol/values.mjs';

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function fact(claim, label) {
  return claim.facts.find((item) => item.label === label)?.value ?? null;
}

function basisHtml(basis) {
  if (basis.kind === 'editorial')
    return `<p class="form-basis">${escape(basis.statement)}</p><small>Editorial judgment · ${escape(basis.proponent)} · unverified</small>`;
  return `<p class="form-basis">Selected source Claim · editorial interpretation</p>${basis.conditions.map(({ label, value }) => `<small>${escape(label)} · ${escape(value)}</small>`).join('')}`;
}

function lineBetween(from, to, count, kind, direction = 'forward') {
  const first = Math.min(from, to);
  const span = Math.abs(from - to);
  if (!span) fail('render_responsibility_lane_invalid');
  const left = ((first + 0.5) / count) * 100;
  const width = (span / count) * 100;
  return `<span class="form-route form-route--${kind}${from > to ? ' form-route--reverse' : ''}${direction === 'bidirectional' ? ' form-route--bidirectional' : ''}" style="left:${left}%;width:${width}%" aria-hidden="true"></span>`;
}

function claimSummary(claim) {
  const shown = [
    'Claim plane',
    'Condition',
    'Scope',
    'Claimed maturity',
    'Claimant-declared validity',
  ];
  return `<aside class="form-claim" data-graphic-id="${claim.graphicId}" aria-label="Selected source Claim">${shown.map((label) => `<span><small>${escape(label)}</small>${escape(fact(claim, label) ?? 'not reported')}</span>`).join('')}</aside>`;
}

/** Paint a responsibility argument without reinterpreting its selected source assertions. */
export function responsibilityPageHtml(page, index, methodLimits) {
  if (!page.form || !Array.isArray(page.groups) || !page.groups.length)
    fail('render_responsibility_page_invalid');
  const count = page.form.roles.length;
  if (count > 6) fail('render_responsibility_page_infeasible');
  const groups = new Map(page.groups.map((group) => [group.id, group]));
  const nodes = new Map(page.nodes.map((node) => [node.id, node]));
  const roleIndex = new Map(page.form.roles.map(({ groupId }, at) => [groupId, at]));
  const groupByNode = new Map(
    page.groups.flatMap((group) => group.nodeIds.map((id) => [id, group.id])),
  );
  if (roleIndex.size !== count || groupByNode.size !== nodes.size)
    fail('render_responsibility_page_invalid');
  const roleFor = (id) => {
    const index = roleIndex.get(groupByNode.get(id));
    if (index === undefined) fail('render_responsibility_page_invalid');
    return index;
  };
  const handoffs = page.form.handoffs
    .map(({ fromGroup, toGroup, basis }) => {
      const from = roleIndex.get(fromGroup);
      const to = roleIndex.get(toGroup);
      if (from === undefined || to === undefined) fail('render_responsibility_page_invalid');
      return `<article class="form-handoff"><div class="form-handoff-track" style="--form-count:${count}">${lineBetween(from, to, count, 'handoff')}<span class="form-anchor" style="grid-column:${from + 1}"></span><span class="form-anchor" style="grid-column:${to + 1}"></span></div>${basisHtml(basis)}</article>`;
    })
    .join('');
  const linkedClaims = new Map();
  for (const claim of page.claims ?? [])
    if (claim.relationOrdinal !== undefined) {
      const relationId = `r-${claim.relationOrdinal - 1}`;
      const list = linkedClaims.get(relationId) ?? [];
      list.push(claim);
      linkedClaims.set(relationId, list);
    }
  const internalRelations = new Map();
  const crossRelations = [];
  for (const relation of [...page.relations].sort(
    (left, right) =>
      roleFor(left.source) - roleFor(right.source) ||
      roleFor(left.target) - roleFor(right.target) ||
      left.id.localeCompare(right.id),
  )) {
    const from = roleFor(relation.source);
    const to = roleFor(relation.target);
    const source = nodes.get(relation.source);
    const target = nodes.get(relation.target);
    const predicate = relation.label || 'Selected source relation';
    const qualifiers = relation.sourceQualifiers?.length
      ? `<dl class="form-qualifiers">${relation.sourceQualifiers.map(({ name, value }) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`
      : '';
    const claims = (linkedClaims.get(relation.id) ?? []).map(claimSummary).join('');
    if (from === to) {
      const groupId = groupByNode.get(relation.source);
      const current = internalRelations.get(groupId) ?? [];
      current.push(
        `<li class="form-internal-relation" data-graphic-id="${relation.id}"><div class="form-internal-route"><span>${escape(source.label)}</span><strong>${escape(predicate)} <i aria-hidden="true">${relation.direction === 'bidirectional' ? '↔' : '→'}</i></strong><span>${escape(target.label)}</span></div>${qualifiers}${claims}</li>`,
      );
      internalRelations.set(groupId, current);
      continue;
    }
    const connection = `${lineBetween(from, to, count, 'source', relation.direction)}<span class="form-endpoint" style="grid-column:${from + 1}">${escape(source.label)}</span><span class="form-endpoint" style="grid-column:${to + 1}">${escape(target.label)}</span>`;
    crossRelations.push(
      `<li class="form-relation" data-graphic-id="${relation.id}"><div class="form-relation-head"><strong>${escape(predicate)}</strong><span>Source relation · ${relation.direction === 'bidirectional' ? 'both directions' : 'directed'}</span></div><div class="form-relation-track" style="--form-count:${count}">${connection}</div>${qualifiers}${claims}</li>`,
    );
  }
  const roles = page.form.roles
    .map(({ groupId, basis }) => {
      const group = groups.get(groupId);
      if (!group) fail('render_responsibility_page_invalid');
      return `<section class="form-role" data-graphic-id="${group.id}"><h3>${escape(group.label)}</h3><ul>${group.nodeIds.map((id) => `<li data-graphic-id="${id}">${escape(nodes.get(id).label)}</li>`).join('')}</ul>${basisHtml(basis)}</section>`;
    })
    .join('');
  const domainDetails = page.form.roles
    .map(({ groupId }) => {
      const ownRelations = internalRelations.get(groupId) ?? [];
      if (!ownRelations.length) return '';
      const label = groups.get(groupId).label;
      return `<section class="form-domain-detail" aria-label="Relations within ${escape(label)}"><h3>Within ${escape(label)}</h3><ol class="form-domain-routes">${ownRelations.join('')}</ol></section>`;
    })
    .join('');
  const unlinkedClaims = (page.claims ?? [])
    .filter((claim) => claim.relationOrdinal === undefined)
    .map(claimSummary)
    .join('');
  const limits = page.questions.flatMap(({ limits: items }) => items);
  const usedEditorial = new Set(
    [...page.form.roles, ...page.form.handoffs]
      .filter(({ basis }) => basis.kind === 'editorial')
      .map(({ basis }) => JSON.stringify([basis.statement, basis.proponent])),
  );
  const additionalEditorial = page.editorialAssertions
    .filter(
      ({ statement, proponent }) => !usedEditorial.has(JSON.stringify([statement, proponent])),
    )
    .map(
      ({ statement, proponent }) =>
        `<li>${escape(statement)}<small>Editorial judgment · ${escape(proponent)} · unverified</small></li>`,
    )
    .join('');
  const completeClaims = (page.claims ?? [])
    .map(
      (claim) =>
        `<article><h4>Source Claim</h4><dl>${claim.facts.map(({ label, value }) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></article>`,
    )
    .join('');
  const inspection =
    methodLimits.length || additionalEditorial || completeClaims
      ? `<details class="form-inspect"><summary>Inspect source and method</summary>${completeClaims}${additionalEditorial ? `<h3>Additional editorial assertions</h3><ul>${additionalEditorial}</ul>` : ''}${methodLimits.length ? `<h3>Method limits</h3><ul>${methodLimits.map((limit) => `<li><code>${escape(limit)}</code></li>`).join('')}</ul>` : ''}</details>`
      : '';
  return `<section class="edition-page edition-page--responsibility" id="page-${index}" data-page="${index}" aria-labelledby="page-title-${index}"><header class="form-page-heading"><p class="eyebrow">Reading page ${index + 1}</p><h2 id="page-title-${index}">${escape(page.navigationLabel)}</h2><p>${escape(page.questions[0].text)}</p></header><div class="responsibility-work"><section class="form-roles" aria-label="Responsibility domains"><div class="form-section-label">Responsibility domains</div><div class="form-role-grid" style="--form-count:${count}">${roles}</div></section>${domainDetails}${handoffs ? `<section class="form-handoffs" aria-label="Declared handoffs"><h3>Editorial handoff</h3>${handoffs}</section>` : ''}${crossRelations.length ? `<section class="form-relations" aria-label="Cross-domain source relations"><h3>Across domains</h3><ol>${crossRelations.join('')}</ol></section>` : ''}${unlinkedClaims ? `<section class="form-unlinked-claims" aria-label="Other selected source claims">${unlinkedClaims}</section>` : ''}${limits.length ? `<aside class="form-scope" aria-label="Reading limits">${limits.map((limit) => `<p>${escape(limit)}</p>`).join('')}</aside>` : ''}${inspection}</div></section>`;
}

export const responsibilityCss = `
.form-page-heading{display:flex;align-items:baseline;gap:18px;margin:15px 0 20px}.form-page-heading h2{font-size:29px;line-height:1.2;margin:0}.form-page-heading>p:last-child{font-size:15px;line-height:1.5;color:#526158;margin:0;max-width:78ch}.responsibility-work{border-top:1px solid #8e9f91}.form-section-label,.form-work h3{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#526158}.form-section-label{padding:15px 0 12px}.form-role-grid{display:grid;grid-template-columns:repeat(var(--form-count),minmax(0,1fr));border-top:2px solid #314638;border-bottom:1px solid #9cab9e}.form-role{min-width:0;padding:17px 22px 18px;border-right:1px solid #ced7cc}.form-role:last-child{border-right:0}.form-role h3{font-size:18px;line-height:1.3;margin:0 0 15px;overflow-wrap:anywhere}.form-role ul{list-style:none;display:flex;flex-wrap:wrap;gap:7px;margin:0 0 17px;padding:0}.form-role li{font-size:12px;line-height:1.35;background:#e8ede5;padding:6px 9px;border-radius:4px;overflow-wrap:anywhere}.form-basis{font-size:12px;line-height:1.5;margin:0 0 5px;overflow-wrap:anywhere}.form-role small,.form-handoff small{display:block;font-size:10px;line-height:1.4;color:#526158;overflow-wrap:anywhere}
.form-domain-detail{padding:18px 0 21px;border-bottom:1px solid #c9d2c7}.form-domain-detail h3{font-size:11px;line-height:1.4;letter-spacing:.09em;text-transform:uppercase;color:#526158;margin:0 0 13px}.form-domain-routes{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;list-style:none;margin:0;padding:0}.form-internal-relation{min-width:0;padding:14px 16px;background:#edf1e9;border-top:2px solid #90a595}.form-internal-route{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:baseline;gap:8px;font-size:12px;line-height:1.5}.form-internal-route span{min-width:0;overflow-wrap:anywhere}.form-internal-route span:last-child{text-align:right}.form-internal-route strong{font-size:11px;font-weight:600;white-space:nowrap;color:#3d654b}.form-internal-route i{font-style:normal}.form-domain-detail .form-qualifiers,.form-domain-detail .form-claim{margin-left:0}
.form-handoffs,.form-relations{padding:19px 0 16px;border-bottom:1px solid #c9d2c7}.form-handoffs h3,.form-relations h3{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#526158;margin:0 0 14px}.form-handoff{padding:4px 0 9px}.form-handoff-track,.form-relation-track{position:relative;display:grid;grid-template-columns:repeat(var(--form-count),minmax(0,1fr));align-items:center;min-height:45px}.form-route{position:absolute;top:50%;border-top:1px solid #869989}.form-route--handoff{border-width:2px;border-color:#456e55}.form-route:after,.form-route--bidirectional:before{content:'';position:absolute;top:-6px;width:9px;height:9px;border-top:2px solid #607b65;border-right:2px solid #607b65}.form-route:after{left:50%;transform:translateX(-50%) rotate(45deg)}.form-route--reverse:after{transform:translateX(-50%) rotate(225deg)}.form-route--bidirectional:before{left:35%;transform:translateX(-50%) rotate(225deg)}.form-route--bidirectional:after{left:65%;transform:translateX(-50%) rotate(45deg)}.form-anchor{position:relative;z-index:1;justify-self:center;width:12px;height:12px;background:#456e55;border:2px solid #f5f3ed;border-radius:50%}.form-handoff>.form-basis{max-width:90ch;margin:4px auto 0;text-align:center;font-size:13px}.form-handoff>small{text-align:center}
.form-relations ol{list-style:none;margin:0;padding:0}.form-relation{padding:7px 0 10px;border-top:1px solid #e0e5dc}.form-relation-head{display:flex;align-items:baseline;justify-content:space-between;gap:15px}.form-relation-head strong{font-size:13px;line-height:1.4;font-weight:600}.form-relation-head span{font-size:10px;color:#6b786d}.form-relation-track{min-height:48px}.form-endpoint,.form-internal{position:relative;z-index:1;justify-self:center;max-width:90%;padding:5px 8px;background:#f5f3ed;border:1px solid #c9d2c7;border-radius:4px;font-size:12px;line-height:1.4;text-align:center;overflow-wrap:anywhere}.form-internal i{font-style:normal;color:#607b65;padding:0 4px}.form-qualifiers{display:flex;flex-wrap:wrap;gap:8px 18px;margin:2px 0 4px 14px}.form-qualifiers div{display:flex;gap:6px}.form-qualifiers dt,.form-qualifiers dd{font-size:10px;line-height:1.4;margin:0;overflow-wrap:anywhere}.form-qualifiers dt{font-weight:600;color:#526158}.form-claim{display:flex;flex-wrap:wrap;gap:8px 18px;margin:7px 0 0 14px;padding:8px 12px;border-left:2px solid #9cad9d;background:#edf1e9}.form-claim span{display:flex;flex-direction:column;font-size:11px;line-height:1.4}.form-claim small{font-size:9px;color:#526158}.form-unlinked-claims{padding:14px 0;border-bottom:1px solid #c9d2c7}.form-scope{padding:13px 0;border-bottom:1px solid #c9d2c7}.form-scope p{font-size:11px;line-height:1.5;color:#526158;margin:0}.form-inspect{padding:14px 0}.form-inspect summary{font-size:11px;color:#314638;cursor:pointer}.form-inspect article{padding:15px 0;border-bottom:1px solid #e0e5dc}.form-inspect h3,.form-inspect h4{font-size:11px;color:#526158;margin:0 0 9px}.form-inspect dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px 17px;margin:0}.form-inspect dt{font-size:10px;color:#526158}.form-inspect dd{font-size:12px;line-height:1.4;margin:2px 0 0;overflow-wrap:anywhere}.form-inspect ul{padding-left:18px;font-size:11px;line-height:1.6}.form-inspect small{display:block;color:#526158}.form-inspect code{font:inherit;overflow-wrap:anywhere}
`;
