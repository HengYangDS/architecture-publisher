import { fail } from '../../src/protocol/values.mjs';

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const visibleFields = [
  'Condition',
  'Scope',
  'Claimed maturity',
  'Claimant-declared validity',
  'Selected claimant',
  'Projection claimant',
];

/** Compose selected claim meaning and applicability beside its graph subject. */
export function claimWorkHtml(page) {
  const nodes = new Map(page.nodes.map(({ id, label }) => [id, label]));
  return (page.claims ?? [])
    .map((claim) => {
      const facts = new Map(claim.facts.map(({ label, value }) => [label, value]));
      const relation =
        claim.relationOrdinal === undefined ? null : page.relations[claim.relationOrdinal - 1];
      if (claim.relationOrdinal !== undefined && !relation)
        fail('render_interactive_claim_anchor_invalid');
      const subject = facts.get('Subject') ?? (relation ? nodes.get(relation.source) : null);
      const object = facts.get('Object') ?? (relation ? nodes.get(relation.target) : null);
      const title = subject ? `${subject}${object ? ` → ${object}` : ''}` : 'Selected source Claim';
      const value = facts.get('Value');
      return `<article class="claim-work-item" data-graphic-id="${escape(claim.graphicId)}"><header><span class="claim-plane">Claim plane · ${escape(facts.get('Claim plane') ?? 'not reported')}</span><h4>${escape(title)}</h4></header>${facts.has('Predicate') ? `<p class="claim-predicate">${escape(facts.get('Predicate'))}${value === undefined ? '' : ` · ${escape(value)}`}</p>` : value === undefined ? '' : `<p class="claim-predicate">${escape(value)}</p>`}<dl>${visibleFields
        .filter((label) => facts.has(label))
        .map((label) => `<div><dt>${escape(label)}</dt><dd>${escape(facts.get(label))}</dd></div>`)
        .join('')}</dl></article>`;
    })
    .join('');
}

export const claimWorkCss = `
.claim-work{display:grid;grid-template-columns:repeat(var(--claim-columns),minmax(0,1fr));gap:0 26px;border-top:1px solid #c4ccc2;margin-top:22px}
.claim-work>h3{grid-column:1/-1;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#4c5a50;margin:14px 0 4px}
.claim-work-item{min-width:0;border-bottom:1px solid #d3dbd1;padding:15px 0 17px}.claim-work-item header{display:flex;flex-direction:column;gap:5px}.claim-work-item h4{font-size:14px;line-height:1.45;margin:0;overflow-wrap:anywhere}.claim-plane{font-size:10px;color:#8d5c3b;text-transform:uppercase;letter-spacing:.04em}
.claim-predicate{font-size:12px;line-height:1.45;margin:8px 0 12px;overflow-wrap:anywhere}.claim-work-item dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 20px;margin:0}.claim-work-item dt{font-size:10px;color:#526158}.claim-work-item dd{font-size:12px;line-height:1.45;margin:3px 0 0;overflow-wrap:anywhere}
`;
