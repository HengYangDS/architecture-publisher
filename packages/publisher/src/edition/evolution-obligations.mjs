import { canonical } from "../semantics/document.mjs";
import { sorted } from "../semantics/comparison.mjs";

export const obligationKeys = Object.freeze([
  "rebuild",
  "semanticVerification",
  "mediumVerification",
  "humanReview",
  "acceptance",
  "publication",
]);

function addUnique(target, value) {
  const identity = canonical(value);
  if (!target.some((item) => canonical(item) === identity)) target.push(value);
}

function predicates(edition, ...kinds) {
  return sorted(kinds.flatMap((kind) => edition.qualification[kind] ?? []));
}

export function addVerificationObligations(
  obligations,
  edition,
  editionObligations,
  impact,
  qualificationChanged,
  reasons,
  humanReviewRequired = impact.static ||
    impact.atlas ||
    impact.interactive.size > 0 ||
    qualificationChanged.has("human"),
) {
  addUnique(obligations.semanticVerification, {
    edition: edition.id,
    predicates: predicates(edition, "semantic", "coverage"),
    reasons,
  });
  if (
    impact.static ||
    qualificationChanged.has("static") ||
    qualificationChanged.has("accessibility")
  )
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: "static",
      scene: "static",
      predicates: predicates(edition, "static", "accessibility"),
      reasons,
    });
  if (impact.atlas)
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: "interactive",
      scene: null,
      predicates: predicates(edition, "interactive", "accessibility"),
      reasons,
    });
  const interactive = new Set(impact.interactive);
  if (qualificationChanged.has("interactive") || qualificationChanged.has("accessibility"))
    for (const id of Object.keys(edition.scenes.interactive)) interactive.add(id);
  for (const id of [...interactive].sort())
    if (Object.hasOwn(edition.scenes.interactive, id))
      addUnique(obligations.mediumVerification, {
        edition: edition.id,
        medium: "interactive",
        scene: id,
        predicates: predicates(edition, "interactive", "accessibility"),
        reasons,
      });
  if (edition.qualification.installed.length)
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: "installed-use",
      scene: null,
      predicates: predicates(edition, "installed"),
      reasons,
    });
  if (edition.qualification.recovery.length)
    addUnique(obligations.mediumVerification, {
      edition: edition.id,
      medium: "recovery",
      scene: null,
      predicates: predicates(edition, "recovery"),
      reasons,
    });
  if (humanReviewRequired)
    for (const { predicate, scope } of editionObligations.filter(
      (item) =>
        item.kind === "human" &&
        (qualificationChanged.has("human") ||
          (item.scope.medium === "static" && impact.static) ||
          (item.scope.medium === "interactive" && (impact.atlas || impact.interactive.size > 0))),
    ))
      addUnique(obligations.humanReview, {
        edition: edition.id,
        predicate,
        scope: structuredClone(scope),
        reasons,
      });
}

export function addRebuildObligations(obligations, edition, impact, reasons) {
  addUnique(obligations.rebuild, {
    edition: edition.id,
    target: "publication-bundle",
    scene: null,
    reasons,
  });
  if (impact.static)
    addUnique(obligations.rebuild, {
      edition: edition.id,
      target: "static",
      scene: "static",
      reasons,
    });
  if (impact.atlas)
    addUnique(obligations.rebuild, {
      edition: edition.id,
      target: "interactive-atlas",
      scene: null,
      reasons,
    });
  for (const id of [...impact.interactive].sort())
    if (Object.hasOwn(edition.scenes.interactive, id))
      addUnique(obligations.rebuild, {
        edition: edition.id,
        target: "interactive",
        scene: id,
        reasons,
      });
}
