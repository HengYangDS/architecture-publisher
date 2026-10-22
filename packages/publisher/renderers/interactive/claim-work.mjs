import { fail } from "../../src/protocol/values.mjs";
import { factorCommonClaimContext } from "../../src/scene/claim-card.mjs";

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const visibleFields = [
  "Condition",
  "Scope",
  "Claimed maturity",
  "Claimant-declared validity",
  "Selected claimant",
  "Projection claimant",
];

/** Compose selected claim meaning and applicability beside its graph subject. */
export function claimWorkHtml(page) {
  const nodes = new Map(page.nodes.map(({ id, label }) => [id, label]));
  const { common, commonLabels } = factorCommonClaimContext(page.claims ?? []);
  const visibleCommon = common.filter(
    ({ label }) => label === "Claim plane" || visibleFields.includes(label),
  );
  const context = visibleCommon.length
    ? `<div class="claim-work-context"><h4>Shared by every selected Claim</h4><dl>${visibleCommon.map(({ label, value }) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl></div>`
    : "";
  const items = (page.claims ?? [])
    .map((claim) => {
      const facts = new Map(claim.facts.map(({ label, value }) => [label, value]));
      const relation =
        claim.relationOrdinal === undefined ? null : page.relations[claim.relationOrdinal - 1];
      if (claim.relationOrdinal !== undefined && !relation)
        fail("render_interactive_claim_anchor_invalid");
      const subject = facts.get("Subject") ?? (relation ? nodes.get(relation.source) : null);
      const object = facts.get("Object") ?? (relation ? nodes.get(relation.target) : null);
      const title = subject ? `${subject}${object ? ` → ${object}` : ""}` : "Selected source Claim";
      const value = facts.get("Value");
      const plane = commonLabels.has("Claim plane")
        ? ""
        : `<span class="claim-plane">Claim plane · ${escape(facts.get("Claim plane") ?? "not reported")}</span>`;
      return `<article class="claim-work-item" data-graphic-id="${escape(claim.graphicId)}"><header>${plane}<h4>${escape(title)}</h4></header>${facts.has("Predicate") ? `<p class="claim-predicate">${escape(facts.get("Predicate"))}${value === undefined ? "" : ` · ${escape(value)}`}</p>` : value === undefined ? "" : `<p class="claim-predicate">${escape(value)}</p>`}<dl>${visibleFields
        .filter((label) => facts.has(label) && !commonLabels.has(label))
        .map((label) => `<div><dt>${escape(label)}</dt><dd>${escape(facts.get(label))}</dd></div>`)
        .join("")}</dl></article>`;
    })
    .join("");
  return context + items;
}
