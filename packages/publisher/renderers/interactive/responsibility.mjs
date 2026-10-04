import { fail } from '../../src/protocol/values.mjs';
import { responsibilityMapCss, responsibilityMapHtml } from './responsibility-map.mjs';

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function inspect(page, methodLimits) {
  const sourceRelations = page.relations
    .map(
      (relation) =>
        `<article><h3>${escape(relation.label?.trim() ? relation.label : 'Unlabeled source relation')}</h3><p>${escape(relation.direction === 'bidirectional' ? 'Both directions' : 'Directed')} · ${escape(relation.source)} → ${escape(relation.target)}</p>${relation.sourceQualifiers?.length ? `<dl>${relation.sourceQualifiers.map(({ name, value }) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>` : ''}</article>`,
    )
    .join('');
  const claims = (page.claims ?? [])
    .map(
      (claim) =>
        `<article><h3>Source Claim</h3><dl>${claim.facts.map(({ label, value }) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></article>`,
    )
    .join('');
  const selectedBasis = new Set(
    [...page.form.roles, ...page.form.handoffs]
      .filter(({ basis }) => basis.kind === 'editorial')
      .map(({ basis }) => JSON.stringify([basis.statement, basis.proponent])),
  );
  const additionalEditorial = page.editorialAssertions
    .filter(
      ({ statement, proponent }) => !selectedBasis.has(JSON.stringify([statement, proponent])),
    )
    .map(
      ({ statement, proponent }) =>
        `<li>${escape(statement)}<small>Editorial judgment · ${escape(proponent)} · unverified</small></li>`,
    )
    .join('');
  if (!sourceRelations && !claims && !additionalEditorial && !methodLimits.length) return '';
  return `<details class="form-inspect"><summary>Inspect source and method</summary>${sourceRelations}${claims}${additionalEditorial ? `<h3>Additional editorial assertions</h3><ul>${additionalEditorial}</ul>` : ''}${methodLimits.length ? `<h3>Method limits</h3><ul>${methodLimits.map((limit) => `<li><code>${escape(limit)}</code></li>`).join('')}</ul>` : ''}</details>`;
}

/** Paint one selected responsibility argument without importing static media geometry. */
export function responsibilityPageHtml(page, index, methodLimits) {
  if (
    !page?.form ||
    !Array.isArray(page.form.roles) ||
    !page.form.roles.length ||
    !Array.isArray(page.form.handoffs) ||
    !Array.isArray(page.groups) ||
    !page.groups.length ||
    !Array.isArray(page.nodes) ||
    !page.nodes.length ||
    !Array.isArray(page.relations) ||
    !Array.isArray(page.questions) ||
    page.questions.length !== 1 ||
    !Array.isArray(page.questions[0].limits) ||
    !Array.isArray(page.editorialAssertions) ||
    !Array.isArray(methodLimits)
  )
    fail('render_responsibility_page_invalid');
  if (page.form.roles.length > 6) fail('render_responsibility_page_infeasible');
  const groups = new Map(page.groups.map((group) => [group.id, group]));
  const nodes = new Map(page.nodes.map((node) => [node.id, node]));
  const roleGroups = page.form.roles.map(({ groupId }) => groupId);
  if (
    groups.size !== page.groups.length ||
    nodes.size !== page.nodes.length ||
    new Set(roleGroups).size !== roleGroups.length ||
    roleGroups.some((id) => !groups.has(id)) ||
    roleGroups.length !== groups.size ||
    page.relations.some(({ source, target }) => !nodes.has(source) || !nodes.has(target))
  )
    fail('render_responsibility_page_invalid');
  const map = responsibilityMapHtml(page, index);
  const limits = page.questions.flatMap(({ limits: items }) => items);
  return `<section class="edition-page edition-page--responsibility" id="page-${index}" data-page="${index}" aria-labelledby="page-title-${index}"><header class="form-page-heading"><p class="eyebrow">Reading page ${index + 1}</p><h2 id="page-title-${index}">${escape(page.navigationLabel)}</h2><p>${escape(page.questions[0].text)}</p></header><div class="responsibility-work">${map}${limits.length ? `<aside class="form-scope" aria-label="Reading limits">${limits.map((limit) => `<p>${escape(limit)}</p>`).join('')}</aside>` : ''}${inspect(page, methodLimits)}</div></section>`;
}

export const responsibilityCss = `
.form-page-heading{display:flex;align-items:baseline;gap:18px;margin:15px 0 20px}.form-page-heading h2{font-size:29px;line-height:1.2;margin:0}.form-page-heading>p:last-child{font-size:15px;line-height:1.5;color:var(--reader-muted);margin:0;max-width:78ch}
.responsibility-work{border-top:1px solid var(--reader-line)}
${responsibilityMapCss}
.form-scope{padding:12px 0;border-bottom:1px solid var(--reader-rule)}.form-scope p{font-size:11px;line-height:1.5;color:var(--reader-muted);margin:0}
.form-inspect{padding:13px 0}.form-inspect summary{font-size:11px;color:var(--reader-muted);cursor:pointer}
.form-inspect article{padding:13px 0;border-bottom:1px solid var(--reader-rule)}.form-inspect article>p{font-size:11px;line-height:1.5;color:var(--reader-muted)}
.form-inspect h3{font-size:11px;color:var(--reader-muted);margin:0 0 8px}.form-inspect dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px 17px;margin:0}
.form-inspect dt{font-size:10px;color:var(--reader-muted)}.form-inspect dd{font-size:12px;line-height:1.4;margin:2px 0 0;overflow-wrap:anywhere}
.form-inspect ul{padding-left:18px;font-size:11px;line-height:1.6}.form-inspect small{display:block;color:var(--reader-muted)}
.form-inspect code{font:inherit;overflow-wrap:anywhere}
`;
