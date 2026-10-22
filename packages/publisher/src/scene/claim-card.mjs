import { canonical, deepFreeze, record, text } from "../semantics/document.mjs";
import { fail, isDigest } from "../protocol/values.mjs";

const token = (value) =>
  typeof value === "string" &&
  /^[a-zA-Z_][a-zA-Z0-9_.-]*$/u.test(value) &&
  !["true", "false", "null"].includes(value)
    ? value
    : canonical(value);
const dimensions = (value) =>
  Object.keys(value)
    .sort()
    .map((name) => `${token(name)}: ${token(value[name])}`)
    .join(" · ") || "none declared";
const entity = (value) =>
  [
    value.label,
    value.kind,
    Object.keys(value.qualifiers).length ? dimensions(value.qualifiers) : null,
  ]
    .filter(Boolean)
    .join(" · ");

const shareableContext = new Set([
  "Claim plane",
  "Condition",
  "Claimed maturity",
  "Claimant-declared validity",
  "Declared dependency coverage",
  "Selected claimant",
  "Projection claimant",
  "Declared model owner",
]);

/** Factor only exact shared context; retain per-claim semantic anchors. */
export function factorCommonClaimContext(cards) {
  const candidates =
    cards.length > 1
      ? cards[0].facts.filter(
          ({ label, value }) =>
            shareableContext.has(label) &&
            cards.every((claim) =>
              claim.facts.some((fact) => fact.label === label && fact.value === value),
            ),
        )
      : [];
  const candidateLabels = new Set(candidates.map(({ label }) => label));
  const common = cards.some((claim) => claim.facts.every(({ label }) => candidateLabels.has(label)))
    ? []
    : candidates;
  return { common, commonLabels: new Set(common.map(({ label }) => label)) };
}

/** Project one selected typed claim into public-safe reading facts, not graph geometry. */
export function claimCard(selection) {
  const claim = selection?.members?.claims?.[0];
  if (
    selection?.format !== "architecture.claim-model/v2" ||
    selection.target?.kind !== "claim" ||
    !Array.isArray(selection.members?.claims) ||
    selection.members.claims.length !== 1 ||
    !Array.isArray(selection.members.elements) ||
    selection.members.elements.some((item) => !record(item) || !text(item.id)) ||
    !record(claim) ||
    claim.id !== selection.target.id ||
    !text(claim.plane) ||
    !text(claim.predicate) ||
    !record(claim.condition) ||
    !record(claim.scope) ||
    !text(claim.maturity) ||
    !text(claim.validity) ||
    !text(claim.coverage) ||
    !text(selection.source?.namespace) ||
    !isDigest(selection.source?.sha256) ||
    !text(selection.source.claimant) ||
    !text(selection.sourceOwner) ||
    !["native", "derived"].includes(selection.sourceClass) ||
    (selection.sourceClass === "derived" &&
      (!text(selection.source.adapter?.id) || !text(selection.source.adapter?.version))) ||
    !text(selection.predicate?.valueKind) ||
    !text(selection.predicate?.cardinality) ||
    !record(selection.provenanceSources) ||
    !Array.isArray(claim.provenance) ||
    !claim.provenance.length
  )
    fail("edition_claim_card_invalid");
  const entities = new Map(selection.members.elements.map((item) => [item.id, item]));
  const subject = entities.get(claim.subject);
  const object = claim.object === null ? null : entities.get(claim.object);
  if (
    !text(subject?.label) ||
    !text(subject.kind) ||
    !record(subject.qualifiers) ||
    (claim.object !== null &&
      (!text(object?.label) || !text(object.kind) || !record(object.qualifiers)))
  )
    fail("edition_claim_card_invalid");
  const authorities = claim.provenance.map((id) => selection.provenanceSources[id]?.authority);
  if (!authorities.length || authorities.some((authority) => !text(authority)))
    fail("edition_claim_card_invalid");
  return deepFreeze({
    namespace: selection.source.namespace,
    id: claim.id,
    sha256: selection.source.sha256,
    facts: [
      { label: "Claim plane", value: claim.plane },
      { label: "Subject", value: entity(subject) },
      {
        label: "Predicate",
        value: `${claim.predicate} · ${selection.predicate.valueKind} · ${selection.predicate.cardinality}`,
      },
      {
        label: object === null ? "Value" : "Object",
        value: object ? entity(object) : token(claim.value),
      },
      { label: "Condition", value: dimensions(claim.condition) },
      { label: "Scope", value: dimensions(claim.scope) },
      { label: "Claimed maturity", value: claim.maturity },
      { label: "Claimant-declared validity", value: claim.validity },
      { label: "Declared dependency coverage", value: claim.coverage },
      {
        label: selection.sourceClass === "derived" ? "Projection claimant" : "Selected claimant",
        value:
          selection.sourceClass === "derived"
            ? `${selection.source.claimant} · ${selection.source.adapter.id}@${selection.source.adapter.version}`
            : selection.source.claimant,
      },
      { label: "Declared model owner", value: selection.sourceOwner },
      { label: "Declared evidence authority", value: authorities.join(" · ") },
    ],
  });
}
