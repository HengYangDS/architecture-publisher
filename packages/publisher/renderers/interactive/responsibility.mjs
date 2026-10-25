import { fail } from "../../src/protocol/values.mjs";
import { responsibilityMapHtml } from "./responsibility-map.mjs";

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function inspect(page, methodLimits) {
  const sourceRelations = page.relations
    .map(
      (relation) =>
        `<article><h3>${escape(relation.label?.trim() ? relation.label : "Unlabeled source relation")}</h3><p>${escape(relation.direction === "bidirectional" ? "Both directions" : "Directed")} · ${escape(relation.source)} → ${escape(relation.target)}</p>${relation.sourceQualifiers?.length ? `<dl>${relation.sourceQualifiers.map(({ name, value }) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl>` : ""}</article>`,
    )
    .join("");
  const claims = (page.claims ?? [])
    .map(
      (claim) =>
        `<article><h3>Source Claim</h3><dl>${claim.facts.map(({ label, value }) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl></article>`,
    )
    .join("");
  const selectedBasis = new Set(
    [...page.form.roles, ...page.form.handoffs]
      .filter(({ basis }) => basis.kind === "editorial")
      .map(({ basis }) => basis.graphicId),
  );
  const additionalEditorial = page.editorialAssertions
    .filter(({ graphicId }) => !selectedBasis.has(graphicId))
    .map(
      ({ statement, proponent }) =>
        `<li>${escape(statement)}<small>Editorial judgment · ${escape(proponent)} · unverified</small></li>`,
    )
    .join("");
  if (!sourceRelations && !claims && !additionalEditorial && !methodLimits.length) return "";
  return `<details class="form-inspect"><summary>Inspect source and method</summary>${sourceRelations}${claims}${additionalEditorial ? `<h3>Additional editorial assertions</h3><ul>${additionalEditorial}</ul>` : ""}${methodLimits.length ? `<h3>Method limits</h3><ul>${methodLimits.map((limit) => `<li><code>${escape(limit)}</code></li>`).join("")}</ul>` : ""}</details>`;
}

/** Paint one selected responsibility argument without importing static media geometry. */
export function responsibilityPageHtml(page, index, methodLimits, icons, composed = false) {
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
    fail("render_responsibility_page_invalid");
  if (page.form.roles.length > 6) fail("render_responsibility_page_infeasible");
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
    fail("render_responsibility_page_invalid");
  const map = responsibilityMapHtml(page, index, icons, composed);
  const limits = page.questions.flatMap(({ limits: items }) => items);
  return `<section class="edition-page edition-page--responsibility" id="page-${index}" data-page="${index}" aria-labelledby="page-title-${index}"><header class="form-page-heading"><p class="eyebrow">Reading page ${index + 1}</p><h2 id="page-title-${index}">${escape(page.navigationLabel)}</h2><p>${escape(page.questions[0].text)}</p></header><div class="responsibility-work">${map}${limits.length ? `<aside class="form-scope" aria-label="Reading limits">${limits.map((limit) => `<p>${escape(limit)}</p>`).join("")}</aside>` : ""}${composed ? "" : inspect(page, methodLimits)}</div></section>`;
}
