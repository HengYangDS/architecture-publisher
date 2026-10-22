import { canonical } from "../semantics/document.mjs";
import { fail } from "../protocol/values.mjs";
import { claimCard } from "./claim-card.mjs";
import { linkClaimModelSources } from "./claim-relations.mjs";

/** Parse one exact reference; callers restrict which roles their carrier admits. */
export function authoredReference(value, kinds, errorCode) {
  let parts;
  try {
    parts = JSON.parse(value);
  } catch {
    fail(errorCode);
  }
  if (
    typeof value !== "string" ||
    !Array.isArray(parts) ||
    parts.length !== 3 ||
    parts.some((part) => typeof part !== "string" || !part) ||
    !kinds.includes(parts[1]) ||
    JSON.stringify(parts) !== value
  )
    fail(errorCode);
  return parts;
}

/** Derive statement obligations from upstream assertions, never from their drawing. */
export function deriveAuthoredStatements(
  { views, assertions, selections, edition, structuralReferences, declaredReferences },
  errorCode,
  anchorErrorCode = errorCode,
) {
  const requiredIds = new Set(views.flatMap(({ assertionIds }) => assertionIds));
  const claims = new Map();
  const editorial = new Map();
  const claimFacts = new Map();
  for (const id of requiredIds) {
    const assertion = assertions.get(id);
    if (assertion?.kind === "editorial") {
      if (
        typeof edition?.id !== "string" ||
        !edition.id ||
        typeof edition.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/u.test(edition.sha256) ||
        typeof assertion.statement !== "string" ||
        !assertion.statement.trim() ||
        typeof assertion.proponent !== "string" ||
        !assertion.proponent.trim() ||
        !Array.isArray(assertion.basis) ||
        !assertion.basis.length ||
        assertion.basis.some((id) => !selections.has(id)) ||
        !Array.isArray(assertion.questions) ||
        !assertion.questions.length
      )
        fail(errorCode);
      editorial.set(id, {
        assertion,
        reference: JSON.stringify([edition.id, "editorial", id]),
        edition: { ...edition },
      });
      continue;
    }
    if (assertion?.kind !== "source") fail(errorCode);
    const selected = selections.get(assertion.selection);
    if (selected?.target?.kind !== "claim") continue;
    const card = claimCard(selected);
    const reference = JSON.stringify([card.namespace, "claim", card.id]);
    const previous = claimFacts.get(reference);
    if (previous && previous !== canonical(card)) fail(errorCode);
    claimFacts.set(reference, canonical(card));
    claims.set(id, { selected, card, reference, direct: false, anchor: null });
  }
  const declared = declaredReferences ?? [...structuralReferences];
  if (!Array.isArray(declared) || new Set(declared).size !== declared.length) fail(errorCode);
  const directReferences = new Set();
  const editorialReferences = new Set([...editorial.values()].map(({ reference }) => reference));
  for (const reference of declared) {
    const [, kind] = authoredReference(
      reference,
      ["entity", "relation", "claim", "editorial"],
      errorCode,
    );
    if (kind === "claim") {
      if (!claimFacts.has(reference)) fail(errorCode);
      directReferences.add(reference);
    } else if (kind === "editorial") {
      if (!editorialReferences.has(reference)) fail(errorCode);
    } else if (!structuralReferences.has(reference)) fail(errorCode);
  }
  const requiredReferences = new Set([
    ...structuralReferences,
    ...directReferences,
    ...editorialReferences,
  ]);
  if (
    declared.length !== requiredReferences.size ||
    [...requiredReferences].some((id) => !declared.includes(id))
  )
    fail(errorCode);
  const directSelections = new Set();
  for (const item of claims.values()) {
    item.direct = directReferences.has(item.reference);
    if (item.direct) directSelections.add(item.selected.selectionId);
  }
  for (const view of views) {
    const linked = linkClaimModelSources(
      view,
      assertions,
      selections,
      anchorErrorCode,
      directSelections,
    );
    for (const { claimAssertionId, relationAssertionId } of linked.links) {
      const selected = selections.get(assertions.get(relationAssertionId).selection);
      claims.get(claimAssertionId).anchor = JSON.stringify([
        selected.source.namespace,
        "relation",
        selected.target.id,
      ]);
    }
    for (const { claimAssertionId, subject } of linked.subjectLinks)
      claims.get(claimAssertionId).anchor = JSON.stringify([
        subject.namespace,
        "entity",
        subject.id,
      ]);
  }
  return { claims, editorial, requiredReferences, directReferences, editorialReferences };
}

/** A missing direct witness never downgrades to subject-label coverage. */
export function requireAuthoredStatementText(statements, textGraphics) {
  const references = [...statements.directReferences, ...statements.editorialReferences];
  const owners = new Map();
  for (const id of references)
    for (const graphicId of textGraphics.get(id) ?? []) {
      const ids = owners.get(graphicId) ?? new Set();
      ids.add(id);
      owners.set(graphicId, ids);
    }
  for (const id of references)
    if (!(textGraphics.get(id) ?? []).some((graphicId) => owners.get(graphicId).size === 1))
      fail("authored_statement_unbound");
}
